#!/usr/bin/env node
/**
 * Publishes the financial glossary: one index and one page per term, per
 * language. 33 terms x 3 languages = 99 term pages plus 3 indexes.
 *
 * Why a page per term rather than one long page with anchors:
 *
 * A definitional search - "qué es el TER", "what is sequence of returns risk" -
 * is a whole search intent, and the result that wins it is a page whose title,
 * URL, first paragraph and structured data are all about that one term. An
 * anchor into a 30,000-word page can rank, but it competes with itself for
 * every one of the thirty-three intents and gives the reader a wall of text to
 * land in. A page per term also means each definition gets its own hreflang
 * cluster, so a Portuguese search for "juros compostos" reaches the Portuguese
 * page rather than the Spanish one with a language switcher.
 *
 * Three things link the glossary into the rest of the site, and they are the
 * reason it is worth more than the sum of its definitions:
 *
 *   - Every article body gets its terms linked automatically, by
 *     scripts/inline-links.mjs. That is 33 new internal link targets reachable
 *     from every article, computed at build time, with no author effort.
 *   - Each term page lists the articles that mention it, found by searching the
 *     catalog's `searchText`. So the link graph runs both ways, and publishing
 *     an article adds it to the relevant term pages without touching them.
 *   - Each term page carries its own body through the same auto-linker, so the
 *     definitions cross-reference each other too.
 *
 * The glossary content lives in content/site/glossary.mjs and this file only
 * renders it. That separation is what lets the same data drive both the pages
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
  LANGUAGES, ORIGIN, glossaryPath, sectionPath, articlePath, journalPath, toolPath, absolute
} from './site-routes.mjs';
import { renderShell, disclaimer, stringsFor } from './page-shell.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Order the pillars appear in, on the index and in the jump nav. */
const GROUPS = ['investing', 'money', 'mind'];

/**
 * A term's pillar suggests which calculator is worth offering next to it. This
 * is a coarse mapping on purpose: a specific term-to-tool table would be
 * thirty-three entries to maintain for a link in a sidebar.
 */
const GROUP_TOOL = { investing: 'compound-interest', money: 'financial-freedom', mind: 'life-cost' };

/**
 * The calculator's own name and localised URL for a term's pillar.
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
  return { href: toolPath(language, tool[language].slug), name: tool[language].name };
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
    .slice(0, 6);
}

/** ------------------------------------------------------------------ index */

function renderIndex(language, strings, catalog) {
  const jump = GROUPS.map(
    (group) => `<li><a href="#${group}">${escapeHtml(strings[`glossaryGroup_${group}`])}</a></li>`
  ).join('');

  const groups = GROUPS.map((group) => {
    const entries = GLOSSARY.filter((entry) => entry.group === group)
      .sort((left, right) => left[language].name.localeCompare(right[language].name, language));
    const terms = entries
      .map((entry) => {
        const term = entry[language];
        return `<li class="glossary-term">
            <h3><a href="${hrefForEntry(entry, language)}">${escapeHtml(term.name)}</a></h3>
            <p>${escapeHtml(term.short)}</p>
          </li>`;
      })
      .join('');
    const count = entries.length === 1 ? strings.glossaryTermCountOne : strings.glossaryTermCountMany;
    return `<section class="glossary-group">
        <h2 id="${group}">${escapeHtml(strings[`glossaryGroup_${group}`])} <span class="card-meta">${entries.length} ${escapeHtml(count)}</span></h2>
        <ul class="glossary-terms">${terms}</ul>
      </section>`;
  }).join('');

  const body = `    <div class="container">
      <nav class="glossary-jump" aria-label="${escapeHtml(strings.glossaryJumpTo)}">
        <h2>${escapeHtml(strings.glossaryJumpTo)}</h2>
        <ul>${jump}</ul>
      </nav>
      ${groups}
      ${disclaimer(strings, language, { compact: true })}
    </div>`;

  // DefinedTermSet with the full member list. This is the one place where
  // listing all 33 terms in structured data is right: it tells a crawler that
  // the 33 pages are one work rather than 33 unrelated stubs.
  const graph = [{
    '@type': 'DefinedTermSet',
    '@id': `${absolute(glossaryPath(language))}#termset`,
    name: strings.glossaryTitle,
    description: strings.glossaryIntro,
    inLanguage: language,
    url: absolute(glossaryPath(language)),
    hasDefinedTerm: GLOSSARY.map((entry) => ({
      '@type': 'DefinedTerm',
      name: entry[language].name,
      description: entry[language].short,
      url: absolute(hrefForEntry(entry, language))
    }))
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
    body
  });
}

/** ------------------------------------------------------------------- term */

function renderTerm(entry, language, strings, catalog, links) {
  const term = entry[language];
  const url = absolute(hrefForEntry(entry, language));

  // The definition body, auto-linked to the other terms and to the articles.
  // `excludeId` stops a page linking its own term back to itself, which would
  // be a link to the page you are already on.
  const { html } = addInlineLinks(
    renderMarkdown(term.body, { origin: ORIGIN }, { insight: insightLabel[language] }),
    links(entry.id),
    { maxLinks: 6 }
  );

  const related = entry.related
    .map((id) => GLOSSARY.find((candidate) => candidate.id === id))
    .filter(Boolean)
    .map((other) => `<li><a href="${hrefForEntry(other, language)}">${escapeHtml(other[language].name)}</a></li>`)
    .join('');

  const articles = mentionedIn(entry, language, catalog)
    .map((article) => `<li><a href="${articlePath(language, article.slug)}">${escapeHtml(article.title)}</a></li>`)
    .join('');

  const aliases = term.aliases.length > 0
    ? `<p class="term-aliases"><strong>${escapeHtml(strings.glossaryAlsoCalled)}:</strong> ${term.aliases.map((alias) => escapeHtml(alias)).join(' · ')}</p>`
    : '';

  const body = `    <div class="container">
      <div class="term-layout">
        <div>
          ${aliases}
          <div class="article-body">${html}</div>
          ${disclaimer(strings, language, { compact: true })}
        </div>
        <aside class="term-aside">
          ${related ? `<h2>${escapeHtml(strings.glossaryRelatedTerms)}</h2><ul>${related}</ul>` : ''}
          ${articles ? `<h2>${escapeHtml(strings.glossaryMentionedIn)}</h2><ul>${articles}</ul>` : ''}
          <h2>${escapeHtml(strings.glossaryUseTools)}</h2>
          <ul><li><a href="${toolLink(entry.group, language).href}">${escapeHtml(toolLink(entry.group, language).name)}</a></li></ul>
          <a class="text-link" href="${glossaryPath(language)}">${escapeHtml(strings.glossaryAll)}</a>
        </aside>
      </div>
    </div>`;

  const graph = [{
    '@type': 'DefinedTerm',
    '@id': `${url}#term`,
    name: term.name,
    alternateName: term.aliases,
    description: term.short,
    inLanguage: language,
    url,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      '@id': `${absolute(glossaryPath(language))}#termset`,
      name: strings.glossaryTitle,
      url: absolute(glossaryPath(language))
    }
  }];

  return renderShell({
    language,
    strings,
    section: 'glossary',
    pathFor: (code) => glossaryPath(code, GLOSSARY.find((e) => e.id === entry.id)[code].slug),
    title: `${term.name} — ${strings.glossaryDefinition}`,
    description: term.short,
    heading: term.name,
    eyebrow: strings[`glossaryGroup_${entry.group}`],
    intro: term.short,
    trail: [
      { name: strings.glossaryTitle, href: glossaryPath(language) },
      { name: term.name, href: hrefForEntry(entry, language) }
    ],
    graph,
    ogType: 'article',
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

  // A term whose slug collides with the glossary index's own path, or with
  // another term's, would silently overwrite a page. Cheap to check, and the
  // kind of thing that only shows up as a missing page weeks later.
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
  }

  let pages = 0;
  const written = [];

  for (const language of LANGUAGES) {
    const strings = stringsFor(sidecar, language, 'site.i18n.json');
    const indexPath = `${sectionPath('glossary', language).replace(/^\//, '')}index.html`;

    await write(indexPath, renderIndex(language, strings, catalog));
    written.push(glossaryPath(language));
    pages += 1;

    // Built once per language rather than once per term: the target list is the
    // same 33 terms and 7 articles every time, and compiling 40 regular
    // expressions 33 times over is work for nothing.
    const allTargets = [
      ...glossaryTargets(GLOSSARY, language, hrefForEntry),
      ...articleTargets(catalog.filter((a) => a.language === language), language, (a) => articlePath(language, a.slug))
    ];
    const linksExcluding = (excludeId) => {
      const self = hrefForEntry(GLOSSARY.find((entry) => entry.id === excludeId), language);
      return allTargets.filter((target) => target.href !== self);
    };

    for (const entry of GLOSSARY) {
      const termPath = `${glossaryPath(language, entry[language].slug).replace(/^\//, '')}index.html`;
      await write(termPath, renderTerm(entry, language, strings, catalog, linksExcluding));
      written.push(glossaryPath(language, entry[language].slug));
      pages += 1;
    }
  }

  // Removed terms leave orphan directories that stay published and indexed.
  await pruneRemoved();

  console.log(`Glossary: ${pages} page(s) across ${LANGUAGES.length} language(s), ${GLOSSARY.length} term(s) each.`);
  return written;
}

/**
 * Deletes term directories that no longer correspond to an entry.
 *
 * Renaming a slug otherwise leaves the old page in place, where it keeps its
 * canonical tag pointing at itself and competes with the new one. This only
 * ever removes directories directly under a glossary root, so it cannot reach
 * anything another generator owns.
 */
async function pruneRemoved() {
  for (const language of LANGUAGES) {
    const directory = path.join(root, sectionPath('glossary', language));
    const expected = new Set(GLOSSARY.map((entry) => entry[language].slug));
    let found;
    try {
      found = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const item of found) {
      if (!item.isDirectory() || expected.has(item.name)) continue;
      await fs.rm(path.join(directory, item.name), { recursive: true, force: true });
      console.log(`Glossary: removed stale term directory ${language}/${item.name}`);
    }
  }
}

export { main as generateGlossary, hrefForEntry, GROUPS };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`generate-glossary: ${error.message}`);
    process.exitCode = 1;
  });
}
