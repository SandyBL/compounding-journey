#!/usr/bin/env node
/**
 * Builds sitemap.xml for the whole site.
 *
 * It used to be built by scripts/generate-blog-pages.mjs, which was the right
 * place when the journal, the home pages and the five simulators were all there
 * was: 21 fixed URLs plus one per article, and that file already knew every
 * article's date. It is the wrong place now. The site has since grown nine
 * calculator pages and their three indexes, nine template landing pages and
 * theirs, a hundred-odd glossary terms, twelve category archives, nine legal
 * documents and three sessions pages - about 150 URLs that the blog generator
 * has no reason to know about, and that were consequently in no sitemap at all.
 *
 * A page missing from the sitemap is not invisible, but on a site with no
 * inbound links it is close: nothing outside points at it, and the only paths
 * in are the site's own navigation and this file. So this file is generated
 * from the same tables the pages are generated from, which is the only
 * arrangement where publishing a page and listing it are the same act.
 *
 * It runs last of the page generators, and reads no HTML: every URL here comes
 * from scripts/site-routes.mjs and the content tables, so a sitemap entry
 * cannot point at a path no generator writes. The reverse - a page written but
 * not listed - is what the count printed at the end is for.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TOOLS } from '../content/site/tools.mjs';
import { TEMPLATES } from '../content/site/templates.mjs';
import { GLOSSARY } from '../content/site/glossary.mjs';
import { CATEGORIES } from '../content/site/categories.mjs';
import { readSharedCatalog } from './shared-catalog.mjs';
import { sitemapEntry, lastCommitted, newestDate } from './page-dates.mjs';
import {
  LANGUAGES, DEFAULT_LANGUAGE, ORIGIN, LEGAL_PAGES, SIMULATORS,
  homePath, journalPath, articlePath, sectionPath, toolPath, templatePath,
  glossaryPath, categoryPath, sessionsPath, dataPath, legalPath, absolute,
  simulatorPath, simulatorsPath
} from './site-routes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The hreflang cluster for a page that exists in all three languages.
 *
 * x-default is the Spanish edition, matching what every generated page's <head>
 * declares. A sitemap cluster that disagreed with the page's own link tags is
 * worse than no cluster: Google reconciles the two by trusting neither.
 */
function cluster(pathFor) {
  return LANGUAGES.map((code) => ({ hreflang: code, href: absolute(pathFor(code)) }))
    .concat([{ hreflang: 'x-default', href: absolute(pathFor(DEFAULT_LANGUAGE)) }]);
}

/** One entry per language for a page family with a shared modification date. */
function family(pathFor, lastmod) {
  const alternates = cluster(pathFor);
  return LANGUAGES.map((code) => sitemapEntry(absolute(pathFor(code)), lastmod, alternates));
}

/**
 * The same, for a family whose members are rows in a table with per-language
 * slugs - calculators, templates, glossary terms, category archives. `slugOf`
 * reads the slug for one row in one language; `pathOf` turns it into a URL.
 */
function tableFamily(rows, slugOf, pathOf, lastmodOf) {
  return rows.flatMap((row) => {
    const pathFor = (code) => pathOf(code, slugOf(row, code));
    const alternates = cluster(pathFor);
    const lastmod = lastmodOf(row);
    return LANGUAGES.map((code) => sitemapEntry(absolute(pathFor(code)), lastmod, alternates));
  });
}

async function main() {
  const catalog = await readSharedCatalog();

  // One git call per source file rather than one per URL: three home pages come
  // from one template, and a hundred glossary pages come from one table.
  const homeDate = lastCommitted(path.join('content', 'home', 'index.html'));
  // Each simulator is dated by its own template and sidecar, which is where
  // everything a reader sees on it comes from. The index above them is dated by
  // the copy describing the five and by the generator that lays them out.
  const simulatorDates = Object.fromEntries(SIMULATORS.map(({ name }) => [
    name,
    lastCommitted(
      path.join('content', 'simulators', `${name}.html`),
      path.join('content', 'simulators', `${name}.i18n.json`)
    )
  ]));
  const simulatorsIndexDate = lastCommitted(
    path.join('content', 'site', 'simulators.mjs'),
    path.join('scripts', 'generate-simulators-index.mjs')
  );
  const toolsDate = lastCommitted(path.join('content', 'site', 'tools.mjs'));
  const templatesDate = lastCommitted(path.join('content', 'site', 'templates.mjs'));
  const glossaryDate = lastCommitted(path.join('content', 'site', 'glossary.mjs'));
  const categoriesDate = lastCommitted(path.join('content', 'site', 'categories.mjs'));
  const sessionsDate = lastCommitted(
    path.join('content', 'site', 'sessions.mjs'),
    path.join('scripts', 'generate-sessions-page.mjs')
  );
  // The results page is recomputed from the database on every build, so its
  // figures can change without a commit. The date published here is still the
  // one its sources were last edited on: that is when the page's claims - the
  // measures it reports, the method behind them - actually changed, and
  // stamping today's date on every deploy would tell a crawler the text was
  // rewritten daily when it was not.
  const dataDate = lastCommitted(
    path.join('content', 'site', 'insights.mjs'),
    path.join('scripts', 'generate-data-pages.mjs'),
    path.join('scripts', 'simulator-insights.mjs')
  );

  const articleDate = (article) => article.updated || article.date;
  const newestArticle = newestDate(catalog.map(articleDate));

  // A category archive changes when an article joins it, not when the table it
  // is named in is edited - so the archive's date is its newest article's, and
  // the table's commit only answers for a category with nothing in it yet.
  const categoryDate = (category) => {
    const dates = catalog
      .filter((article) => article.category === category[article.language]?.name)
      .map(articleDate);
    return newestDate(dates) || categoriesDate;
  };

  const entries = [
    // Hand-authored and template-built pages.
    ...family(homePath, homeDate),
    ...family(simulatorsPath, simulatorsIndexDate),
    ...SIMULATORS.flatMap(({ name }) =>
      family((code) => simulatorPath(name, code), simulatorDates[name])),

    // The journal.
    ...family(journalPath, newestArticle),
    ...catalog.map((article) => {
      // Articles are the one family whose members do not exist in every
      // language: a piece may be published in Spanish months before it is
      // translated. The cluster is built from the translations that exist, so a
      // sitemap entry never points at an article that has not been written.
      const translated = LANGUAGES.filter((code) => article.translations[code]);
      const alternates = translated
        .map((code) => ({ hreflang: code, href: absolute(articlePath(code, article.translations[code])) }))
        .concat([{
          hreflang: 'x-default',
          href: absolute(articlePath(
            article.translations[DEFAULT_LANGUAGE] ? DEFAULT_LANGUAGE : article.language,
            article.translations[DEFAULT_LANGUAGE] || article.slug
          ))
        }]);
      return sitemapEntry(absolute(articlePath(article.language, article.slug)), articleDate(article), alternates);
    }),
    ...family(categoryPath, categoriesDate),
    ...tableFamily(CATEGORIES, (row, code) => row[code].slug, categoryPath, categoryDate),

    // The generated sections.
    ...family((code) => sectionPath('tools', code), toolsDate),
    ...tableFamily(TOOLS, (row, code) => row[code].slug, toolPath, () => toolsDate),
    ...family((code) => sectionPath('templates', code), templatesDate),
    ...tableFamily(TEMPLATES, (row, code) => row[code].slug, templatePath, () => templatesDate),
    ...family(glossaryPath, glossaryDate),
    ...tableFamily(GLOSSARY, (row, code) => row[code].slug, glossaryPath, () => glossaryDate),
    ...family(sessionsPath, sessionsDate),
    ...family(dataPath, dataDate),

    // The legal documents. Their date is the one printed on the page itself,
    // which is the date the text was revised - not the date the file that
    // renders it was touched.
    ...Object.entries(LEGAL_PAGES).flatMap(([page, { updated }]) =>
      family((code) => legalPath(page, code), updated))
  ];

  // Duplicate <loc> values are the failure this cannot ship with: two entries
  // for one URL make the whole file suspect, and the way it would happen is a
  // slug colliding between two tables, which no other check would catch.
  const seen = new Map();
  for (const entry of entries) {
    const loc = /<loc>([^<]+)<\/loc>/.exec(entry)[1];
    seen.set(loc, (seen.get(loc) ?? 0) + 1);
  }
  const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([loc]) => loc);
  if (duplicates.length > 0) {
    throw new Error(`sitemap.xml would list ${duplicates.length} URL(s) twice: ${duplicates.slice(0, 5).join(', ')}.`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${entries.join('\n')}
</urlset>
`;

  await fs.writeFile(path.join(root, 'sitemap.xml'), xml);

  const withoutDates = entries.filter((entry) => !entry.includes('<lastmod>')).length;
  console.log(
    `Sitemap: ${entries.length} URL(s) — ${catalog.length} article(s), ${TOOLS.length} calculator(s), ` +
      `${TEMPLATES.length} template(s), ${GLOSSARY.length} glossary term(s), ${CATEGORIES.length} category archive(s) ` +
      `per language, plus the home, journal, simulator, sessions, results and legal pages.`
  );
  if (withoutDates > 0) {
    console.log(`${withoutDates} URL(s) carry no <lastmod>: git could not date their sources in this checkout.`);
  }
  return entries.length;
}

export { main as generateSitemap };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`generate-sitemap: ${error.message}`);
    process.exitCode = 1;
  });
}
