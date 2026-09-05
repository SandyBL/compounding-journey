#!/usr/bin/env node
/**
 * Publishes the simulators index: one page per language, at /es/simulators/,
 * /en/simulators/ and /pt/simulators/.
 *
 * The site has had five simulators and no page listing them. Everything that
 * offered to show a reader "the simulators" - the section nav, the "all
 * simulators" link inside each tool, the breadcrumb above it, the home page's
 * navigation - pointed at /<lang>/simulator.html, which is the personal
 * finance simulator. So a visitor who asked for the list was dropped into one
 * particular simulator, already running, with the other four reachable only
 * from a row of small links inside its intro. It looked like a broken link
 * that happened to return 200.
 *
 * This is the page all of those now point at, and it is a chooser rather than a
 * hub in name only: five cards, each saying what its tool answers and who it is
 * for, a paragraph telling a reader with no particular question where to start,
 * and the two things somebody about to type numbers into a simulator is
 * entitled to know first - that the arithmetic stays in their browser, and that
 * this is education rather than advice.
 *
 * It is a shell page rather than a sixth simulator template. The shell already
 * renders the header, the section nav, the breadcrumb, the language switcher,
 * the hreflang cluster, the footer and the compliance note, and an index needs
 * exactly those and none of the simulator machinery - no Chart.js, no
 * leaderboard client, no behaviour bundle. The five documents it links keep
 * their own chrome, as they must: they are applications, not articles.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SIMULATORS_PAGE, SIMULATOR_CARDS } from '../content/site/simulators.mjs';
import { escapeHtml } from './markdown.mjs';
import {
  LANGUAGES, SIMULATORS, absolute, dataPath, glossaryPath, sectionPath, simulatorPath, simulatorsPath
} from './site-routes.mjs';
import { renderShell, disclaimer, stringsFor } from './page-shell.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The card copy for one published simulator, or null when it has none. */
function cardFor(name) {
  return SIMULATOR_CARDS.find((card) => card.name === name) ?? null;
}

/**
 * One card.
 *
 * The whole card is not a link, and the name is. A card-sized hit area reads
 * better on a phone and would swallow the two sentences underneath it into the
 * link text, which is what a screen reader announces and what a search engine
 * treats as the anchor - "Freedom Calendar, it turns your income, your
 * spending..." as one link name is worse than a short one that says where it
 * goes.
 */
function card(simulator, language, copy) {
  const text = cardFor(simulator.name)[language];
  return `        <article class="card">
          <p class="card-eyebrow">${escapeHtml(text.eyebrow)}</p>
          <h2 class="card-title"><a href="${simulatorPath(simulator.name, language)}">${escapeHtml(text.name)}</a></h2>
          <p class="card-body">${escapeHtml(text.body)}</p>
          <p class="card-meta">${escapeHtml(copy.forWhomLabel)}: ${escapeHtml(text.forWhom)}</p>
        </article>`;
}

function render(language, strings) {
  const copy = SIMULATORS_PAGE[language];
  const url = absolute(simulatorsPath(language));

  const body = `    <div class="container">
      <div class="card-grid">
${SIMULATORS.map((simulator) => card(simulator, language, copy)).join('\n')}
      </div>
      <section class="page-section">
        <h2 class="section-title">${escapeHtml(copy.startTitle)}</h2>
        <div class="article-body"><p>${escapeHtml(copy.startBody)}</p></div>
      </section>
      <section class="page-section">
        <h2 class="section-title">${escapeHtml(copy.privacyTitle)}</h2>
        <div class="article-body">
          <p>${escapeHtml(copy.privacyBody)}</p>
          <p><a class="text-link" href="${dataPath(language)}">${escapeHtml(strings.dataNavLabel)}</a></p>
        </div>
      </section>
      <section class="page-section">
        <h2 class="section-title">${escapeHtml(copy.nextTitle)}</h2>
        <div class="article-body">
          <p>${escapeHtml(copy.nextBody)}</p>
          <p>
            <a href="${sectionPath('tools', language)}">${escapeHtml(strings.toolsAll)}</a> ·
            <a href="${glossaryPath(language)}">${escapeHtml(strings.glossaryAll)}</a>
          </p>
        </div>
      </section>
      ${disclaimer(strings, language, { compact: true })}
    </div>`;

  // An ItemList rather than five SoftwareApplications: each simulator already
  // describes itself as one on its own page, and a second URL claiming the same
  // entity is how two pages end up competing to be the result for it.
  const graph = [{
    '@type': 'ItemList',
    '@id': `${url}#simulators`,
    name: copy.heading,
    description: copy.description,
    inLanguage: language,
    itemListElement: SIMULATORS.map((simulator, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: cardFor(simulator.name)[language].name,
      url: absolute(simulatorPath(simulator.name, language))
    }))
  }];

  return renderShell({
    language,
    strings,
    section: 'simulators',
    pathFor: (code) => simulatorsPath(code),
    title: copy.title,
    description: copy.description,
    heading: copy.heading,
    eyebrow: copy.eyebrow,
    intro: copy.intro,
    trail: [{ name: strings.simulatorsNavLabel, href: simulatorsPath(language) }],
    graph,
    body
  });
}

/** ------------------------------------------------------------------ build */

async function main() {
  const sidecar = JSON.parse(await fs.readFile(path.join(root, 'content', 'site', 'site.i18n.json'), 'utf8'));

  // The published set and the described set have to be the same set. A
  // simulator with no card would be missing from the only page that lists
  // them, and a card with no simulator would be a link to a 404 - both of them
  // invisible in the diff that caused them, because they live in two files.
  for (const simulator of SIMULATORS) {
    const text = cardFor(simulator.name);
    if (!text) {
      throw new Error(
        `Simulator "${simulator.name}" is published by generate-simulator-pages.mjs but has no card in ` +
          'content/site/simulators.mjs, so the index would not list it.'
      );
    }
    for (const language of LANGUAGES) {
      for (const field of ['eyebrow', 'name', 'body', 'forWhom']) {
        if (!text[language]?.[field]) {
          throw new Error(`Simulator "${simulator.name}" is missing ${language}.${field} in content/site/simulators.mjs.`);
        }
      }
    }
  }

  const unpublished = SIMULATOR_CARDS
    .filter((entry) => !SIMULATORS.some((simulator) => simulator.name === entry.name))
    .map((entry) => entry.name);
  if (unpublished.length > 0) {
    throw new Error(
      `content/site/simulators.mjs describes simulator(s) that are not published: ${unpublished.join(', ')}. ` +
        'Add them to SIMULATORS in scripts/site-routes.mjs, or remove the card.'
    );
  }

  const written = [];
  for (const language of LANGUAGES) {
    const strings = stringsFor(sidecar, language, 'site.i18n.json');
    const target = path.join(root, simulatorsPath(language).replace(/^\//, ''), 'index.html');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, render(language, strings));
    written.push(simulatorsPath(language));
  }

  console.log(`Simulators index: ${written.length} page(s) — ${written.join(', ')} (${SIMULATORS.length} simulators listed).`);
  return written;
}

export { main as generateSimulatorsIndex };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`generate-simulators-index: ${error.message}`);
    process.exitCode = 1;
  });
}
