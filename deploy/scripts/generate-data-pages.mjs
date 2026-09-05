#!/usr/bin/env node
/**
 * Publishes the results page: one per language, at /es/datos/, /en/data/ and
 * /pt/dados/.
 *
 * The site has been collecting simulator runs for months and reading them back
 * only as leaderboards - a visitor's own row and the nine above it. This page
 * is the other half: the aggregate. It is the one page here whose content
 * cannot be written by anybody else, because it is computed from a table only
 * this site has, and it is meant to be read two ways.
 *
 *   As a lesson. Each simulator gets a paragraph saying what question its
 *   numbers answer, printed whether or not the sample is big enough yet, so
 *   the page teaches on the day it ships and gets more concrete over time.
 *
 *   As a source. The figures are the kind of thing another writer links to,
 *   which is what the site does not yet have any of.
 *
 * The whole design problem here is honesty under a thin sample. Three
 * mechanisms handle it, and none of them is cosmetic:
 *
 *   1. Every metric declares a minimum sample and is omitted below it - see
 *      content/site/insights.mjs. A section with nothing publishable prints why
 *      instead of printing a number.
 *   2. The database is optional exactly as it is for the journal's featured
 *      card. No database, no table, an outage: the page renders its empty
 *      state and the build carries on. A page of averages is not worth failing
 *      a deploy over.
 *   3. Money is never pooled across languages, because the three versions of
 *      the site show three different currency symbols for the same input
 *      field. That rule lives in scripts/simulator-insights.mjs so it cannot
 *      be forgotten by a metric.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { INSIGHTS_PAGE, INSIGHT_SIMULATORS, INSIGHT_METRICS, VALUE_LABELS } from '../content/site/insights.mjs';
import { escapeHtml } from './markdown.mjs';
import {
  LANGUAGES, ORIGIN, dataPath, journalPath, glossaryPath, sectionPath, legalPath, absolute
} from './site-routes.mjs';
import { renderShell, disclaimer, stringsFor } from './page-shell.mjs';
import { readSimulatorRuns, summarize, publishable, isLanguageScoped } from './simulator-insights.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The symbol each language's simulators print. Same table as the `currency`
 * field in generate-simulator-pages.mjs: the figure on this page has to carry
 * the same unit the visitor typed into.
 */
const CURRENCY = { es: '€', en: '$', pt: 'R$' };

/** Intl tags. localeOf in page-shell.mjs is the Open Graph spelling. */
const NUMBER_LOCALE = { es: 'es-ES', en: 'en-US', pt: 'pt-PT' };

/** ------------------------------------------------------------ formatting */

function amount(value, language, digits = 0) {
  return new Intl.NumberFormat(NUMBER_LOCALE[language], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

/**
 * An amount with its currency symbol.
 *
 * The sign goes outside the symbol. The simulators print the symbol first, and
 * a negative cash flow written as $-455 reads as a typo rather than a number.
 */
function money(value, language) {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}${CURRENCY[language]}${amount(Math.abs(rounded), language)}`;
}

/**
 * One number, in the unit its metric measures.
 *
 * Percentages and years keep one decimal because the interesting differences
 * are fractional - 3.8% against 4%, half a year pulled forward. Money and ages
 * are rounded, because a decimal on either would suggest a precision the input
 * never had: nobody typed 47.3 years old.
 */
function figure(metric, value, language, copy) {
  switch (metric.format) {
    case 'percent':
      return `${amount(value, language, 1)}%`;
    case 'years': {
      const unit = Math.abs(value - 1) < 0.05 ? copy.units.year : copy.units.years;
      return `${amount(value, language, 1)} ${unit}`;
    }
    case 'age':
      return `${amount(Math.round(value), language)} ${copy.units.years}`;
    case 'money':
      return money(value, language);
    case 'money-month':
      return `${money(value, language)}${copy.units.perMonth}`;
    default:
      return amount(Math.round(value), language);
  }
}

/** The words behind a stored id, or the id itself if a label is ever missing. */
function labelFor(metric, key, language) {
  const namespace = VALUE_LABELS[metric.labels];
  return namespace?.[key]?.[language] || key;
}

/**
 * The entries of a distribution or a per-field set, dropped to those that
 * cleared the metric's minimum on their own.
 *
 * A distribution is different from an average here: its entries share one
 * sample, so the minimum has already been applied to all of them at once. A
 * set is thirteen separate averages, and one habit answered twice cannot ride
 * into the table on the back of the twelve that were answered two hundred
 * times.
 */
function entriesOf(metric, stats) {
  if (metric.kind === 'set' || metric.kind === 'shareSet') {
    return stats.entries.filter((entry) => entry.sample >= metric.minimum);
  }
  return stats.entries;
}

/** The value of an entry: an average for a set, a share for everything else. */
function entryFigure(metric, entry, language, copy) {
  if (metric.kind === 'set') return figure(metric, entry.mean, language, copy);
  return `${amount(entry.share, language, 1)}%`;
}

/** The entry a takeaway sentence talks about: the largest one. */
function leadEntry(metric, stats) {
  return entriesOf(metric, stats)[0] || null;
}

/**
 * What {value} becomes in a takeaway sentence.
 *
 * Entry-based metrics name the winner and print its size, because "the habit
 * least likely to be cut is coffee" without the number invites the reader to
 * imagine one.
 */
function takeawayValue(metric, stats, language, copy) {
  if (metric.kind === 'average') return figure(metric, stats.mean, language, copy);
  if (metric.kind === 'share' || metric.kind === 'reached') return `${amount(stats.share, language, 1)}%`;

  const entry = leadEntry(metric, stats);
  if (!entry) return null;
  const key = metric.kind === 'set' || metric.kind === 'shareSet' ? entry.field : entry.value;
  // Not "label (43%)": every takeaway sentence already ends with "(n runs)",
  // and two bracketed numbers in one sentence stop being read.
  return `${labelFor(metric, key, language)} — ${entryFigure(metric, entry, language, copy)}`;
}

/** ---------------------------------------------------------------- markup */

/** The value cell of one metric's row. */
function valueCell(metric, stats, language, copy) {
  if (metric.kind === 'average') {
    const spread = [
      `${copy.medianLabel} ${figure(metric, stats.median, language, copy)}`,
      `${copy.rangeLabel} ${figure(metric, stats.min, language, copy)} – ${figure(metric, stats.max, language, copy)}`
    ].join(' · ');
    return `<strong>${escapeHtml(figure(metric, stats.mean, language, copy))}</strong><br /><span class="data-spread">${escapeHtml(spread)}</span>`;
  }

  if (metric.kind === 'share' || metric.kind === 'reached') {
    return `<strong>${escapeHtml(`${amount(stats.share, language, 1)}%`)}</strong>`;
  }

  const entries = entriesOf(metric, stats);
  const items = entries.map((entry) => {
    const key = metric.kind === 'set' || metric.kind === 'shareSet' ? entry.field : entry.value;
    return `<li><span>${escapeHtml(labelFor(metric, key, language))}</span> <strong>${escapeHtml(entryFigure(metric, entry, language, copy))}</strong></li>`;
  });
  return `<ul class="data-breakdown">${items.join('')}</ul>`;
}

/** The table of everything publishable for one simulator, or null. */
function metricTable(simulator, summary, language, copy) {
  const rows = [];
  for (const metric of INSIGHT_METRICS.filter((entry) => entry.simulator === simulator.id)) {
    const stats = publishable(metric, summary, language);
    if (!stats) continue;
    if ((metric.kind === 'top' || metric.kind === 'breakdown' || metric.kind === 'set' || metric.kind === 'shareSet')
      && entriesOf(metric, stats).length === 0) continue;

    // Money rows are marked with the symbol they are counted in, so a reader
    // can see at a glance which figures pool the three languages and which
    // cannot. The language code would say the same thing to nobody.
    const scope = isLanguageScoped(metric) ? ` <span class="data-scope">(${escapeHtml(CURRENCY[language])})</span>` : '';
    rows.push(`            <tr>
              <th scope="row">${escapeHtml(metric[language].label)}${scope}</th>
              <td>${valueCell(metric, stats, language, copy)}</td>
              <td>${escapeHtml(`${amount(stats.sample, language)} ${copy.sampleUnit}`)}</td>
            </tr>`);
  }
  if (rows.length === 0) return null;

  return `      <div class="article-body">
        <div class="article-table-wrap"><table>
          <thead><tr>
            <th scope="col">${escapeHtml(copy.metricHeading)}</th>
            <th scope="col">${escapeHtml(copy.valueHeading)}</th>
            <th scope="col">${escapeHtml(copy.sampleHeading)}</th>
          </tr></thead>
          <tbody>
${rows.join('\n')}
          </tbody>
        </table></div>
      </div>`;
}

/**
 * The summary list at the top: one sentence per publishable metric that has a
 * takeaway written for it, in the order the metric table declares them.
 *
 * Declaration order rather than sample size, so the page leads with the
 * question that matters most rather than with whichever measure happens to
 * have the most rows this week.
 */
function takeaways(overall, language, copy) {
  const sentences = [];
  for (const simulator of INSIGHT_SIMULATORS) {
    const summary = overall.simulators.get(simulator.id);
    for (const metric of INSIGHT_METRICS.filter((entry) => entry.simulator === simulator.id)) {
      const template = metric[language].takeaway;
      if (!template) continue;
      const stats = publishable(metric, summary, language);
      if (!stats) continue;
      const value = takeawayValue(metric, stats, language, copy);
      if (value === null) continue;
      sentences.push(template
        .replace('{value}', value)
        .replace('{n}', amount(stats.sample, language)));
    }
  }
  return sentences;
}

function simulatorSection(simulator, overall, language, copy) {
  const summary = overall.simulators.get(simulator.id);
  const text = simulator[language];
  const table = metricTable(simulator, summary, language, copy);
  const runs = summary?.runs || 0;

  return `      <section class="page-section" id="${simulator.id}">
        <h3 class="section-title">${escapeHtml(text.name)}</h3>
        <div class="article-body">
          <p>${escapeHtml(text.lesson)}</p>
        </div>
${table || `      <div class="article-body"><p>${escapeHtml(copy.notEnough)}</p></div>`}
        <div class="article-body">
          <p>
            <a class="text-link" href="${simulator.page(language)}">${escapeHtml(copy.tryLabel)}</a>
            ${runs > 0 ? `<span class="data-runs">${escapeHtml(`${amount(runs, language)} ${copy.runsLabel}`)}</span>` : ''}
          </p>
        </div>
      </section>`;
}

function listBlock(title, paragraphs) {
  return `      <section class="page-section">
        <h2 class="section-title">${escapeHtml(title)}</h2>
        <div class="article-body">
${paragraphs.map((line) => `          <p>${escapeHtml(line)}</p>`).join('\n')}
        </div>
      </section>`;
}

/** ---------------------------------------------------------------- render */

function render(language, strings, overall) {
  const copy = INSIGHTS_PAGE[language];
  const url = absolute(dataPath(language));
  const sentences = takeaways(overall, language, copy);

  const headline = overall.available
    ? `      <div class="article-body">
        <p class="data-headline">
          <strong>${escapeHtml(`${amount(overall.runs, language)} ${copy.runsLabel}`)}</strong>${
  overall.last ? ` · ${escapeHtml(`${copy.updatedLabel}: ${overall.last.slice(0, 10)}`)}` : ''}
        </p>
      </div>`
    : `      <div class="article-body">
        <h2 class="section-title">${escapeHtml(copy.noDataTitle)}</h2>
        <p>${escapeHtml(copy.noDataBody)}</p>
      </div>`;

  const summaryBlock = overall.available
    ? `      <section class="page-section">
        <h2 class="section-title">${escapeHtml(copy.insightsTitle)}</h2>
        <div class="article-body">
${sentences.length > 0
    ? `          <ul>${sentences.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`
    : `          <p>${escapeHtml(copy.insightsEmpty)}</p>`}
        </div>
      </section>`
    : '';

  const body = `    <div class="container">
${headline}
${summaryBlock}
      <section class="page-section">
        <h2 class="section-title">${escapeHtml(copy.detailTitle)}</h2>
${INSIGHT_SIMULATORS.map((simulator) => simulatorSection(simulator, overall, language, copy)).join('\n')}
      </section>
${listBlock(copy.methodTitle, copy.method)}
${listBlock(copy.caveatTitle, copy.caveat)}
      <section class="page-section">
        <h2 class="section-title">${escapeHtml(copy.contributeTitle)}</h2>
        <div class="article-body">
          <p>${escapeHtml(copy.contributeBody)}</p>
          <p>${INSIGHT_SIMULATORS.map((simulator) =>
    `<a href="${simulator.page(language)}">${escapeHtml(simulator[language].name)}</a>`).join(' · ')}</p>
          <p><a class="text-link" href="${legalPath('privacy', language)}">${escapeHtml(strings.legalNav_privacy)}</a></p>
        </div>
      </section>
      <section class="page-section">
        <h2 class="section-title">${escapeHtml(copy.readMore)}</h2>
        <div class="article-body">
          <p>
            <a href="${journalPath(language)}">${escapeHtml(strings.journal)}</a> ·
            <a href="${sectionPath('tools', language)}">${escapeHtml(strings.toolsSectionTitle)}</a> ·
            <a href="${glossaryPath(language)}">${escapeHtml(strings.glossaryTitle)}</a>
          </p>
        </div>
      </section>
      ${disclaimer(strings, language)}
    </div>`;

  // A Dataset rather than a plain page: what is published here is aggregate
  // data with a described method, and describing it as a dataset is what lets
  // it be found by somebody looking for one. variableMeasured lists only the
  // measures this language can actually publish today - claiming a variable the
  // page does not show would be a structured-data lie, and the list changing
  // between builds is the honest behaviour.
  const measured = [];
  for (const simulator of INSIGHT_SIMULATORS) {
    const summary = overall.simulators.get(simulator.id);
    for (const metric of INSIGHT_METRICS.filter((entry) => entry.simulator === simulator.id)) {
      if (!publishable(metric, summary, language)) continue;
      measured.push({ '@type': 'PropertyValue', name: metric[language].label, measurementTechnique: simulator[language].name });
    }
  }

  const graph = [{
    '@type': 'Dataset',
    '@id': `${url}#dataset`,
    name: copy.heading,
    description: copy.description,
    url,
    inLanguage: language,
    isAccessibleForFree: true,
    creator: { '@id': `${ORIGIN}/#sandy-bradbury` },
    publisher: { '@id': `${ORIGIN}/#organization` },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    measurementTechnique: copy.methodTitle,
    ...(overall.first && overall.last
      ? { temporalCoverage: `${overall.first.slice(0, 10)}/${overall.last.slice(0, 10)}` }
      : {}),
    ...(measured.length > 0 ? { variableMeasured: measured } : {})
  }];

  return renderShell({
    language,
    strings,
    section: 'data',
    pathFor: (code) => dataPath(code),
    title: copy.title,
    description: copy.description,
    heading: copy.heading,
    eyebrow: copy.eyebrow,
    intro: copy.intro,
    trail: [{ name: strings.dataNavLabel, href: dataPath(language) }],
    graph,
    body
  });
}

/** ------------------------------------------------------------------ build */

async function main() {
  const sidecar = JSON.parse(await fs.readFile(path.join(root, 'content', 'site', 'site.i18n.json'), 'utf8'));

  // Every metric needs a label in every language, or one language's table ships
  // a row headed `undefined`. Checked here rather than trusted, because a
  // metric is added by copying the one above it.
  for (const metric of INSIGHT_METRICS) {
    for (const language of LANGUAGES) {
      if (!metric[language]?.label) {
        throw new Error(`Metric "${metric.id}" is missing ${language}.label in content/site/insights.mjs.`);
      }
    }
    if (metric.labels && !VALUE_LABELS[metric.labels]) {
      throw new Error(`Metric "${metric.id}" names label set "${metric.labels}", which does not exist.`);
    }
    if (!(metric.minimum > 0)) {
      throw new Error(`Metric "${metric.id}" has no minimum sample. Every published measure needs one.`);
    }
  }
  for (const simulator of INSIGHT_SIMULATORS) {
    for (const language of LANGUAGES) {
      if (!simulator[language]?.name || !simulator[language]?.lesson) {
        throw new Error(`Simulator "${simulator.id}" is missing ${language}.name or ${language}.lesson in content/site/insights.mjs.`);
      }
    }
  }

  const rows = await readSimulatorRuns();
  const overall = summarize(rows, INSIGHT_METRICS);

  const written = [];
  for (const language of LANGUAGES) {
    const strings = stringsFor(sidecar, language, 'site.i18n.json');
    const target = path.join(root, dataPath(language).replace(/^\//, ''), 'index.html');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, render(language, strings, overall));
    written.push(dataPath(language));
  }

  const published = LANGUAGES.map((language) => takeaways(overall, language, INSIGHTS_PAGE[language]).length);
  console.log(
    `Results: ${written.length} page(s) — ${written.join(', ')} (${overall.available ? `${overall.runs} run(s) read` : 'no database'}, ` +
      `${Math.max(...published)} headline finding(s) above their minimum sample).`
  );
  return written;
}

export { main as generateDataPages };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`generate-data-pages: ${error.message}`);
    process.exitCode = 1;
  });
}
