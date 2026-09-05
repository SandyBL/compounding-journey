#!/usr/bin/env node
/**
 * Publishes the calculators: one index and one page per calculator, per
 * language. 3 calculators x 3 languages = 9 pages plus 3 indexes.
 *
 * All three already ran on the home page, as tabs of a single widget. They
 * still do - this does not remove them. What it adds is a page per calculation
 * whose URL, title, H1, description and structured data are about that one
 * calculation, because that is what a tool-shaped search matches. A home page
 * cannot rank for "calculadora de interés compuesto" and "life cost
 * calculator" at the same time, and a reader who lands on it has to work out
 * which tab to press.
 *
 * Three things are worth knowing about how the pages are put together:
 *
 *   - The markup is generated from content/site/tools.mjs, and the arithmetic
 *     lives in assets/js/calculators.js keyed by the same tool `id`. Adding a
 *     fourth calculator is a data entry plus an engine function; no wiring
 *     here changes.
 *   - The visible FAQ and the FAQPage schema are rendered from the same array,
 *     so they cannot disagree. Structured data that promises an answer the
 *     page does not contain is a manual action, not a missed opportunity.
 *   - Every page carries the compliance disclaimer immediately under the
 *     result, not in a footnote. The author is a financial educator without an
 *     advisory licence, and a page that outputs a number about somebody's
 *     retirement has to say what that number is and is not, where they read it.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TOOLS } from '../content/site/tools.mjs';
import { GLOSSARY } from '../content/site/glossary.mjs';
import { readSharedCatalog } from './shared-catalog.mjs';
import { renderMarkdown, escapeHtml, slugify } from './markdown.mjs';
import { addInlineLinks, glossaryTargets } from './inline-links.mjs';
import {
  LANGUAGES, ORIGIN, sectionPath, toolPath, glossaryPath, articlePath, absolute
} from './site-routes.mjs';
import { renderShell, disclaimer, stringsFor } from './page-shell.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The currency selector's options, matching assets/js/calculators.js. */
const CURRENCIES = ['EUR', 'USD', 'BRL'];

const insightLabel = { es: 'Idea clave', en: 'Key insight', pt: 'Ideia-chave' };

/** `glossaryPath` takes a slug; the auto-linker hands over whole entries. */
function hrefForEntry(entry, language) {
  return glossaryPath(language, entry[language].slug);
}

/**
 * Articles worth reading next to this calculator.
 *
 * Found by searching the catalog for the calculator's own name and for the
 * glossary terms it declares, rather than by a hand-kept list per tool. A new
 * article that talks about compound interest therefore appears on the compound
 * interest page at the next build, with nothing to update here - the same
 * property that makes the glossary's "mentioned in" list maintain itself.
 */
function relatedArticles(tool, language, catalog) {
  const needles = [tool[language].name.toLowerCase()];
  for (const id of tool.glossary) {
    const entry = GLOSSARY.find((candidate) => candidate.id === id);
    if (!entry) continue;
    needles.push(entry[language].name.toLowerCase(), ...entry[language].aliases.map((a) => a.toLowerCase()));
  }
  return catalog
    .filter((article) => article.language === language)
    .filter((article) => {
      const haystack = `${article.title} ${article.searchText}`.toLowerCase();
      return needles.some((needle) => haystack.includes(needle));
    })
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 4);
}

/** ------------------------------------------------------------------ parts */

function fieldMarkup(tool, language) {
  const copy = tool[language];
  return tool.fields
    .map((field) => {
      const id = `field-${tool.id}-${field.id}`;
      const hint = copy.hints[field.id];
      const attributes = [
        `type="${field.type}"`,
        `id="${id}"`,
        `name="${field.id}"`,
        `data-field="${field.id}"`,
        `value="${field.value}"`,
        field.min !== undefined ? `min="${field.min}"` : '',
        field.max !== undefined ? `max="${field.max}"` : '',
        field.step !== undefined ? `step="${field.step}"` : '',
        'inputmode="decimal"',
        hint ? `aria-describedby="${id}-hint"` : ''
      ].filter(Boolean).join(' ');

      return `          <div class="calc-field">
            <label for="${id}">${escapeHtml(copy.labels[field.id])}</label>
            <input ${attributes} />
            ${hint ? `<p class="calc-field-hint" id="${id}-hint">${escapeHtml(hint)}</p>` : ''}
          </div>`;
    })
    .join('\n');
}

function currencyMarkup(tool, strings) {
  if (!tool.currency) return '';
  const id = `currency-${tool.id}`;
  const options = CURRENCIES.map((code) => `<option value="${code}">${code}</option>`).join('');
  return `          <div class="calc-field">
            <label for="${id}">${escapeHtml(strings.currencyLabel)}</label>
            <select id="${id}" data-currency>${options}</select>
          </div>`;
}

/**
 * The result block.
 *
 * `aria-live="polite"` is the whole reason this is not a plain div: the numbers
 * change without a page load, which a screen reader has no other way of
 * noticing. `data-result` keys match what the engine returns. The error line is
 * only rendered for a calculator whose data declares one, because only the
 * life-cost tool has an input combination with no answer - zero hours worked.
 */
function resultMarkup(tool, language) {
  const copy = tool[language];
  const rows = tool.result.rows
    .map((key) => `            <div><dt>${escapeHtml(copy.results[key])}</dt><dd data-result="${key}">—</dd></div>`)
    .join('\n');

  return `        <div class="calc-result" aria-live="polite">
          <p class="calc-result-label">${escapeHtml(copy.results[tool.result.primary])}</p>
          <p class="calc-result-value" data-result="${tool.result.primary}">—</p>
          <dl class="calc-breakdown">
${rows}
          </dl>
          <p class="calc-result-note">${escapeHtml(copy.resultNote)}</p>
        </div>
        ${copy.error ? `<p class="calc-error" hidden>${escapeHtml(copy.error)}</p>` : ''}`;
}

function faqMarkup(tool, language, strings) {
  const items = tool[language].faq
    .map(
      (item) => `        <details class="faq-item">
          <summary>${escapeHtml(item.q)}</summary>
          <div><p>${escapeHtml(item.a)}</p></div>
        </details>`
    )
    .join('\n');

  return `      <section class="page-section">
        <h2 class="section-title">${escapeHtml(strings.faqTitle)}</h2>
        <div class="faq-list">
${items}
        </div>
      </section>`;
}

/** ------------------------------------------------------------------ index */

function renderIndex(language, strings, catalog) {
  const cards = TOOLS.map((tool) => {
    const copy = tool[language];
    const articles = relatedArticles(tool, language, catalog).length;
    return `        <article class="card">
          <p class="card-eyebrow">${escapeHtml(strings.toolsEyebrow)}</p>
          <h2 class="card-title"><a href="${toolPath(language, copy.slug)}">${escapeHtml(copy.name)}</a></h2>
          <p class="card-body">${escapeHtml(copy.description)}</p>
          ${articles > 0 ? `<p class="card-meta">${articles} ${escapeHtml(articles === 1 ? strings.categoryCountOne : strings.categoryCountMany)}</p>` : ''}
        </article>`;
  }).join('\n');

  const body = `    <div class="container">
      <div class="card-grid">
${cards}
      </div>
      ${disclaimer(strings, language, { compact: true })}
    </div>`;

  // An ItemList rather than three SoftwareApplications: the applications are
  // described on their own pages, and repeating them here would make two URLs
  // claim the same entity.
  const graph = [{
    '@type': 'ItemList',
    '@id': `${absolute(sectionPath('tools', language))}#tools`,
    name: strings.toolsSectionTitle,
    inLanguage: language,
    itemListElement: TOOLS.map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: tool[language].name,
      url: absolute(toolPath(language, tool[language].slug))
    }))
  }];

  return renderShell({
    language,
    strings,
    section: 'tools',
    pathFor: (code) => sectionPath('tools', code),
    title: strings.toolsSectionTitle,
    description: strings.toolsIntro,
    heading: strings.toolsSectionTitle,
    eyebrow: strings.toolsEyebrow,
    intro: strings.toolsIntro,
    trail: [{ name: strings.toolsSectionTitle, href: sectionPath('tools', language) }],
    graph,
    body
  });
}

/** ------------------------------------------------------------------- tool */

function renderTool(tool, language, strings, catalog, targets) {
  const copy = tool[language];
  const url = absolute(toolPath(language, copy.slug));
  const prose = (markdown) =>
    addInlineLinks(renderMarkdown(markdown, { origin: ORIGIN }, { insight: insightLabel[language] }), targets, {
      maxLinks: 4
    }).html;

  const others = TOOLS.filter((other) => other.id !== tool.id)
    .map((other) => `<li><a href="${toolPath(language, other[language].slug)}">${escapeHtml(other[language].name)}</a></li>`)
    .join('');

  const terms = tool.glossary
    .map((id) => GLOSSARY.find((entry) => entry.id === id))
    .filter(Boolean)
    .map((entry) => `<li><a href="${hrefForEntry(entry, language)}">${escapeHtml(entry[language].name)}</a></li>`)
    .join('');

  const articles = relatedArticles(tool, language, catalog)
    .map((article) => `<li><a href="${articlePath(language, article.slug)}">${escapeHtml(article.title)}</a></li>`)
    .join('');

  const body = `    <div class="container">
      <div class="tool-layout">
        <div>
          <div class="calc-panel">
            <form class="calc-form" data-calculator="${tool.id}" novalidate>
              <div class="calc-fields">
${fieldMarkup(tool, language)}
${currencyMarkup(tool, strings)}
              </div>
              <div class="calc-actions">
                <button type="submit" class="button">${escapeHtml(copy.action)}</button>
              </div>
            </form>
${resultMarkup(tool, language)}
            <noscript><p class="calc-error">${escapeHtml(strings.toolsNoJs)}</p></noscript>
          </div>
          ${disclaimer(strings, language)}
          <section class="page-section tool-notes">
            <h2 class="section-title">${escapeHtml(strings.howItWorks)}</h2>
            <div class="article-body">${prose(copy.howItWorks)}</div>
          </section>
          <section class="page-section tool-notes">
            <h2 class="section-title">${escapeHtml(strings.assumptions)}</h2>
            <div class="article-body">${prose(copy.assumptions)}</div>
          </section>
${faqMarkup(tool, language, strings)}
        </div>
        <aside class="term-aside">
          <h2>${escapeHtml(strings.toolsOther)}</h2>
          <ul>${others}</ul>
          ${terms ? `<h2>${escapeHtml(strings.toolsGlossaryTitle)}</h2><ul>${terms}</ul>` : ''}
          ${articles ? `<h2>${escapeHtml(strings.relatedReading)}</h2><ul>${articles}</ul>` : ''}
          <a class="text-link" href="${sectionPath('tools', language)}">${escapeHtml(strings.toolsAll)}</a>
        </aside>
      </div>
    </div>`;

  const graph = [
    {
      '@type': 'SoftwareApplication',
      '@id': `${url}#app`,
      name: copy.name,
      description: copy.description,
      url,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      inLanguage: language,
      isAccessibleForFree: true,
      // A free tool still needs an Offer, and omitting the price is what makes
      // Google treat "free" as unstated rather than as zero.
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      author: { '@id': `${ORIGIN}/#sandy-bradbury` },
      publisher: { '@id': `${ORIGIN}/#organization` }
    },
    {
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      inLanguage: language,
      mainEntity: copy.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
      }))
    }
  ];

  return renderShell({
    language,
    strings,
    section: 'tools',
    pathFor: (code) => toolPath(code, tool[code].slug),
    title: copy.title,
    description: copy.description,
    heading: copy.name,
    eyebrow: strings.toolsEyebrow,
    intro: copy.intro,
    trail: [
      { name: strings.toolsSectionTitle, href: sectionPath('tools', language) },
      { name: copy.name, href: toolPath(language, copy.slug) }
    ],
    graph,
    body,
    extraScripts: '\n<script src="/assets/js/calculators.js?v=source" defer></script>'
  });
}

/** ------------------------------------------------------------------ build */

async function write(relativePath, contents) {
  const absolutePath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, contents);
}

/**
 * Deletes calculator directories that no longer correspond to a tool, for the
 * same reason the glossary does: a renamed slug otherwise leaves the old page
 * published, canonical to itself, competing with its replacement.
 */
async function pruneRemoved() {
  for (const language of LANGUAGES) {
    const directory = path.join(root, sectionPath('tools', language));
    const expected = new Set(TOOLS.map((tool) => tool[language].slug));
    let found;
    try {
      found = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const item of found) {
      if (!item.isDirectory() || expected.has(item.name)) continue;
      await fs.rm(path.join(directory, item.name), { recursive: true, force: true });
      console.log(`Tools: removed stale calculator directory ${language}/${item.name}`);
    }
  }
}

async function main() {
  const sidecar = JSON.parse(await fs.readFile(path.join(root, 'content', 'site', 'site.i18n.json'), 'utf8'));
  const catalog = await readSharedCatalog();

  // The same three checks the glossary runs, for the same reasons: a
  // non-URL-safe slug produces a path nobody can link, and a duplicate one
  // silently overwrites a page.
  for (const language of LANGUAGES) {
    const slugs = TOOLS.map((tool) => tool[language].slug);
    const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate ${language} tool slug(s): ${[...new Set(duplicates)].join(', ')}`);
    }
    for (const [index, slug] of slugs.entries()) {
      if (slug !== slugify(slug)) {
        throw new Error(`Tool slug "${slug}" (${TOOLS[index].id}, ${language}) is not URL-safe.`);
      }
    }
    for (const tool of TOOLS) {
      // Every field and every result key has to have a label in every
      // language, or the page ships an empty <label>.
      for (const field of tool.fields) {
        if (!tool[language].labels[field.id]) {
          throw new Error(`Tool ${tool.id} (${language}) has no label for field "${field.id}".`);
        }
      }
      for (const key of [tool.result.primary, ...tool.result.rows]) {
        if (!tool[language].results[key]) {
          throw new Error(`Tool ${tool.id} (${language}) has no label for result "${key}".`);
        }
      }
    }
  }

  let pages = 0;
  const written = [];

  for (const language of LANGUAGES) {
    const strings = stringsFor(sidecar, language, 'site.i18n.json');
    const targets = glossaryTargets(GLOSSARY, language, hrefForEntry);

    await write(`${sectionPath('tools', language).replace(/^\//, '')}index.html`, renderIndex(language, strings, catalog));
    written.push(sectionPath('tools', language));
    pages += 1;

    for (const tool of TOOLS) {
      const slug = tool[language].slug;
      await write(`${toolPath(language, slug).replace(/^\//, '')}index.html`, renderTool(tool, language, strings, catalog, targets));
      written.push(toolPath(language, slug));
      pages += 1;
    }
  }

  await pruneRemoved();

  console.log(`Tools: ${pages} page(s) across ${LANGUAGES.length} language(s), ${TOOLS.length} calculator(s) each.`);
  return written;
}

export { main as generateToolPages };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`generate-tool-pages: ${error.message}`);
    process.exitCode = 1;
  });
}
