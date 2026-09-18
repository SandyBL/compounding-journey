#!/usr/bin/env node
/**
 * Publishes the financial glossary: one page per language, every term on it as
 * a disclosure that opens.
 *
 * It used to be a page per term - 33 terms x 3 languages, 99 pages plus the 3
 * indexes above them - on the reasoning that a definitional search ("qué es el TER",
 * "what is sequence of returns risk") is a whole search intent, and that the
 * result which wins it is a page whose title, URL and structured data are all
 * about that one term. That reasoning is still correct in the abstract. It was
 * the wrong bet for this site, and Search Console said so: 26 URLs indexed
 * against 227 not, of which 212 sat in "discovered - currently not indexed" -
 * found, never crawled. Ninety-nine of those URLs were glossary terms of
 * 250-320 words each. A definition cannot win an intent from a page Google has
 * not fetched, and asking a domain a few weeks old to spend its crawl budget on
 * ninety-nine near-identical short pages is what kept it from fetching them.
 *
 * So the trade is deliberate and worth stating plainly: the site gives up 99
 * thin URLs and the chance that any one of them ranks on its own, and gets one
 * substantial page per language that concentrates the crawl budget, the
 * internal links and the reading. What is lost is a per-term title tag and a
 * per-term hreflang cluster. What is kept is everything a reader came for, and
 * the 99 old addresses 301 to the term they asked for - see the glossary block
 * in _redirects.
 *
 * Three things link the glossary into the rest of the site, and none of them
 * changed:
 *
 *   - Every article body gets its terms linked automatically, by
 *     scripts/inline-links.mjs. Those links now land on a disclosure rather
 *     than a page, which is a change to scripts/site-routes.mjs and to nothing
 *     else.
 *   - Each term lists the articles that mention it, found by searching the
 *     catalog's `searchText`. So the link graph runs both ways, and publishing
 *     an article adds it to the relevant terms without touching them.
 *   - Each definition runs through the same auto-linker, so the terms
 *     cross-reference each other - now as same-page anchors, which open the
 *     target disclosure rather than costing a navigation.
 *
 * The disclosure is the same `<details name>` accordion the home page's FAQ
 * uses, for the same reason: it is the whole behaviour with no JavaScript in
 * it. assets/js/glossary.js adds one thing on top, which is opening the term a
 * fragment asks for.
 *
 * The glossary content lives in content/site/glossary.mjs and this file only
 * renders it. That separation is what lets the same data drive both the page
 * and the auto-linker without either one owning it.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GLOSSARY } from '../content/site/glossary.mjs';
import { TOOLS } from '../content/site/tools.mjs';
import { readSharedCatalog } from './shared-catalog.mjs';
import { renderMarkdown, escapeHtml, slugify } from './markdown.mjs';
import { addInlineLinks, glossaryTargets, articleTargets } from './inline-links.mjs';
import {
  LANGUAGES, ORIGIN, glossaryPath, sectionPath, articlePath, absolute
} from './site-routes.mjs';
import { renderShell, disclaimer, stringsFor } from './page-shell.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Order the pillars appear in, on the page and in the jump nav. */
const GROUPS = ['investing', 'money', 'mind'];

/**
 * A pillar suggests which calculator is worth offering beside it. This is a
 * coarse mapping on purpose: a specific term-to-tool table would be
 * thirty-three entries to maintain for a link in a sidebar.
 *
 * It is offered once per pillar rather than once per term. On a page per term
 * that distinction did not exist; on one page it is the difference between
 * three calculator links and thirty-three copies of the same three.
 */
const GROUP_TOOL = { investing: 'compound-interest', money: 'financial-freedom', mind: 'life-cost' };

/**
 * How many articles a term admits to appearing in.
 *
 * Six, when each term had a page to itself. Three here: thirty-three terms at
 * six links each is two hundred article links on one page, which is a page
 * whose own link graph is mostly footnotes.
 */
const MENTION_LIMIT = 3;

/**
 * The calculator's own name and localised URL for a pillar.
 *
 * The ids above are language-independent; the slugs are not - the compound
 * interest calculator lives at /es/calculadoras/interes-compuesto/ and
 * /en/calculators/compound-interest/. Resolving through TOOLS also means the
 * link is labelled with the calculator's name rather than with the section
 * heading, so the reader knows which of the three they are being sent to.
 */
function toolLink(group, language) {
  const tool = TOOLS.find((candidate) => candidate.id === GROUP_TOOL[group]);
  if (!tool) throw new Error(`Glossary group "${group}" points at unknown tool "${GROUP_TOOL[group]}".`);
  return { href: `${sectionPath('tools', language)}${tool[language].slug}/`, name: tool[language].name };
}

const insightLabel = { es: 'Idea clave', en: 'Key insight', pt: 'Ideia-chave' };

/** `glossaryPath` takes a slug; the linker hands over whole entries. */
function hrefForEntry(entry, language) {
  return glossaryPath(language, entry[language].slug);
}

/**
 * Articles that mention this term, newest first.
 *
 * Matched against the catalog's `searchText`, which is the article body with
 * Markdown stripped, so a term mentioned in prose counts and one that only
 * appears in a URL does not. Accent-insensitive comparison is deliberately not
 * attempted: these are three languages where the accents are part of the
 * spelling, and "inflacion" is a typo rather than a variant.
 */
function mentionedIn(entry, language, catalog) {
  const term = entry[language];
  const needles = [term.name, ...term.aliases].map((phrase) => phrase.toLowerCase());
  return catalog
    .filter((article) => article.language === language)
    .filter((article) => {
      const haystack = `${article.title} ${article.searchText}`.toLowerCase();
      return needles.some((needle) => haystack.includes(needle));
    })
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, MENTION_LIMIT);
}

/** ------------------------------------------------------------------- term */

/**
 * One term, as a disclosure.
 *
 * The summary carries the name and the one-line definition, which is what the
 * old index card carried: closed, the page reads as the index it replaces, and
 * a reader scanning for a word never has to open anything to find it. Opening
 * is what adds the full definition, the aliases and the links.
 *
 * `id` is the term's localized slug - the last segment of the URL it used to
 * have - so the redirect from that URL is a path becoming a fragment and
 * nothing else, and every link the auto-linker has ever placed still points at
 * the right words.
 */
function renderTerm(entry, language, strings, catalog, links) {
  const term = entry[language];

  // The definition body, auto-linked to the other terms and to the articles.
  // The exclusion stops a term linking itself, which on one page would be an
  // anchor to the disclosure the reader has just opened.
  const { html } = addInlineLinks(
    renderMarkdown(term.body, { origin: ORIGIN }, { insight: insightLabel[language] }),
    links(entry.id),
    { maxLinks: 6 }
  );

  const related = entry.related
    .map((id) => GLOSSARY.find((candidate) => candidate.id === id))
    .filter(Boolean)
    .map((other) => `<a href="${hrefForEntry(other, language)}">${escapeHtml(other[language].name)}</a>`)
    .join(' · ');

  const articles = mentionedIn(entry, language, catalog)
    .map((article) => `<a href="${articlePath(language, article.slug)}">${escapeHtml(article.title)}</a>`)
    .join(' · ');

  const aliases = term.aliases.length > 0
    ? `<p class="term-aliases"><strong>${escapeHtml(strings.glossaryAlsoCalled)}:</strong> ${term.aliases.map((alias) => escapeHtml(alias)).join(' · ')}</p>`
    : '';

  const footer = [
    related ? `<p><strong>${escapeHtml(strings.glossaryRelatedTerms)}:</strong> ${related}</p>` : '',
    articles ? `<p><strong>${escapeHtml(strings.glossaryMentionedIn)}:</strong> ${articles}</p>` : ''
  ].filter(Boolean).join('\n            ');

  return `<details class="glossary-item" id="${term.slug}" name="glossary">
          <summary>
            <h3 class="glossary-item-name">${escapeHtml(term.name)}</h3>
            <span class="glossary-item-short">${escapeHtml(term.short)}</span>
          </summary>
          <div class="glossary-item-detail">
            ${aliases}
            <div class="article-body">${html}</div>
            ${footer ? `<div class="glossary-item-links">\n            ${footer}\n          </div>` : ''}
          </div>
        </details>`;
}

/** ------------------------------------------------------------------- page */

function renderPage(language, strings, catalog) {
  const url = absolute(glossaryPath(language));

  // Built once per language rather than once per term: the target list is the
  // same terms and articles every time, and compiling forty regular
  // expressions thirty-three times over is work for nothing.
  const allTargets = [
    ...glossaryTargets(GLOSSARY, language, hrefForEntry),
    ...articleTargets(catalog.filter((a) => a.language === language), language, (a) => articlePath(language, a.slug))
  ];
  const linksExcluding = (excludeId) => {
    const self = hrefForEntry(GLOSSARY.find((entry) => entry.id === excludeId), language);
    return allTargets.filter((target) => target.href !== self);
  };

  const jump = GROUPS.map(
    (group) => `<li><a href="#${group}">${escapeHtml(strings[`glossaryGroup_${group}`])}</a></li>`
  ).join('');

  const groups = GROUPS.map((group) => {
    const entries = GLOSSARY.filter((entry) => entry.group === group)
      .sort((left, right) => left[language].name.localeCompare(right[language].name, language));
    const terms = entries
      .map((entry) => renderTerm(entry, language, strings, catalog, linksExcluding))
      .join('\n        ');
    const count = entries.length === 1 ? strings.glossaryTermCountOne : strings.glossaryTermCountMany;
    const tool = toolLink(group, language);
    return `<section class="glossary-group">
        <h2 id="${group}">${escapeHtml(strings[`glossaryGroup_${group}`])} <span class="card-meta">${entries.length} ${escapeHtml(count)}</span></h2>
        <p class="glossary-group-tool">${escapeHtml(strings.glossaryUseTools)}: <a href="${tool.href}">${escapeHtml(tool.name)}</a></p>
        <div class="glossary-terms">
        ${terms}
        </div>
      </section>`;
  }).join('\n      ');

  const body = `    <div class="container">
      <nav class="glossary-jump" aria-label="${escapeHtml(strings.glossaryJumpTo)}">
        <h2>${escapeHtml(strings.glossaryJumpTo)}</h2>
        <ul>${jump}</ul>
      </nav>
      ${groups}
      ${disclaimer(strings, language, { compact: true })}
    </div>`;

  // One DefinedTermSet holding every DefinedTerm, which is now a description of
  // the page rather than a claim about 33 others: each term's `url` is
  // the fragment that opens it, so a crawler is pointed at the disclosure whose
  // text it has already been given. The aliases move in here too - they used to
  // be a term page's `alternateName` and this is the only place left for them.
  const graph = [{
    '@type': 'DefinedTermSet',
    '@id': `${url}#termset`,
    name: strings.glossaryTitle,
    description: strings.glossaryIntro,
    inLanguage: language,
    url,
    hasDefinedTerm: GLOSSARY.map((entry) => {
      const term = entry[language];
      return {
        '@type': 'DefinedTerm',
        '@id': `${url}#${term.slug}`,
        name: term.name,
        ...(term.aliases.length > 0 ? { alternateName: term.aliases } : {}),
        description: term.short,
        inLanguage: language,
        url: `${url}#${term.slug}`,
        // Typed as well as referenced, for the same reason the Dataset nodes
        // in scripts/generate-data-pages.mjs are: a bare `@id` is only
        // resolvable to a parser that reads the whole graph, and Search
        // Console read the site's typeless references as objects with no type
        // and reported them. This one does point at a node in this page's own
        // graph, which is the case Google does resolve - naming the type is
        // insurance, and it costs one line.
        inDefinedTermSet: { '@type': 'DefinedTermSet', '@id': `${url}#termset` }
      };
    })
  }];

  return renderShell({
    language,
    strings,
    section: 'glossary',
    pathFor: (code) => glossaryPath(code),
    title: strings.glossaryTitle,
    description: strings.glossaryIntro,
    heading: strings.glossaryTitle,
    eyebrow: strings.glossaryEyebrow,
    intro: strings.glossaryIntro,
    trail: [{ name: strings.glossaryTitle, href: glossaryPath(language) }],
    graph,
    extraScripts: '\n<script src="/assets/js/glossary.js?v=source" defer></script>',
    body
  });
}

/** ------------------------------------------------------------------- main */

async function write(relativePath, contents) {
  const absolutePath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, contents);
}

async function main() {
  const sidecar = JSON.parse(await fs.readFile(path.join(root, 'content', 'site', 'site.i18n.json'), 'utf8'));
  const catalog = await readSharedCatalog();

  // A slug is a fragment now rather than a directory, so a collision no longer
  // overwrites a page - it silently points two terms at one disclosure, and the
  // second one is unreachable. Same check, same reason, one failure mode milder.
  for (const language of LANGUAGES) {
    const slugs = GLOSSARY.map((entry) => entry[language].slug);
    const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate ${language} glossary slug(s): ${[...new Set(duplicates)].join(', ')}`);
    }
    for (const [index, slug] of slugs.entries()) {
      if (slug !== slugify(slug)) {
        throw new Error(`Glossary slug "${slug}" (${GLOSSARY[index].id}, ${language}) is not URL-safe.`);
      }
    }
    // A slug that collides with a pillar's id would have the jump nav and a
    // term competing for one fragment, and the browser would open whichever is
    // first in the document.
    const clashes = slugs.filter((slug) => GROUPS.includes(slug));
    if (clashes.length > 0) {
      throw new Error(`Glossary slug(s) ${clashes.join(', ')} collide with a group anchor (${GROUPS.join(', ')}).`);
    }
  }

  const written = [];
  for (const language of LANGUAGES) {
    const strings = stringsFor(sidecar, language, 'site.i18n.json');
    const indexPath = `${sectionPath('glossary', language).replace(/^\//, '')}index.html`;
    await write(indexPath, renderPage(language, strings, catalog));
    written.push(glossaryPath(language));
  }

  await pruneTermDirectories();

  console.log(`Glossary: ${LANGUAGES.length} page(s), ${GLOSSARY.length} term(s) each.`);
  return written;
}

/**
 * Deletes the per-term directories the glossary used to publish.
 *
 * There were 99 of them committed to the repository, and every one is a page
 * that stays published and canonical to itself until the file is gone. The
 * redirects in _redirects are forced, so they answer first either way - but a
 * forced redirect is a rule somebody can relax, and a published page is a page
 * a crawler can find some other way. Deleting the files is the half of it that
 * does not depend on configuration. This runs every build rather than once,
 * because the glossary root is this generator's to own and nothing else writes
 * into it.
 */
async function pruneTermDirectories() {
  let removed = 0;
  for (const language of LANGUAGES) {
    const directory = path.join(root, sectionPath('glossary', language));
    let found;
    try {
      found = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const item of found) {
      if (!item.isDirectory()) continue;
      await fs.rm(path.join(directory, item.name), { recursive: true, force: true });
      removed += 1;
    }
  }
  if (removed > 0) console.log(`Glossary: removed ${removed} retired term director${removed === 1 ? 'y' : 'ies'}.`);
}

export { main as generateGlossary, hrefForEntry, GROUPS };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`generate-glossary: ${error.message}`);
    process.exitCode = 1;
  });
}
