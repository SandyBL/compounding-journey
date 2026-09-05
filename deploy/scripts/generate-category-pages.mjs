#!/usr/bin/env node
/**
 * Publishes the journal's category archives: one index and one page per
 * category, per language.
 *
 * Every article has declared a `category` in its frontmatter since the journal
 * existed, and the value was decoration - printed above the title, printed in
 * the RSS feed, and linked to nothing. A reader who finished a piece on habits
 * and wanted the other four had to go back to the index and read seven
 * summaries; a crawler had no path from one article to its siblings except
 * through the index; and "hábitos financieros" as a search had no page on this
 * site whose subject was that phrase.
 *
 * The archives cost nothing to keep current, which is the point: an article's
 * frontmatter puts it on the right page at the next build. What they do need is
 * for the three languages to agree on which categories exist, and that lives in
 * content/site/categories.mjs - without it, "Money habits" and "Hábitos
 * financieros" would be two categories that happen to hold translations of the
 * same articles, and neither would be able to declare the other as its
 * hreflang alternate.
 *
 * The build fails on a category no table entry claims. That is the failure this
 * generator is most likely to hit, and it is otherwise silent: one wrong accent
 * in one frontmatter line and the article quietly appears in no archive at all.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CATEGORIES } from '../content/site/categories.mjs';
import { readSharedCatalog } from './shared-catalog.mjs';
import { escapeHtml, slugify } from './markdown.mjs';
import {
  LANGUAGES, ORIGIN, categoryPath, journalPath, articlePath, sectionPath, absolute
} from './site-routes.mjs';
import { renderShell, disclaimer, stringsFor } from './page-shell.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function formatDate(language, date) {
  if (!date) return '';
  return new Intl.DateTimeFormat(language, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`));
}

/**
 * The article cards, in the markup the journal index uses.
 *
 * Deliberately the same `.post-card` structure rather than the `.card` one the
 * other generated pages use: this is a list of journal articles and it is
 * reached from the journal, so it should look like the journal rather than like
 * a landing page that happens to link articles.
 */
function cards(articles, language, strings) {
  return articles
    .map(
      (article) => `        <article class="post-card">
          <div class="post-meta"><span>${language.toUpperCase()}</span><span>${escapeHtml(article.category)}</span><span>${escapeHtml(formatDate(language, article.date))}</span></div>
          <h3><a href="${articlePath(language, article.slug)}">${escapeHtml(article.title)}</a></h3>
          <p>${escapeHtml(article.summary)}</p>
          <a class="card-link" href="${articlePath(language, article.slug)}">${escapeHtml(strings.categoryReadArticle)} →</a>
        </article>`
    )
    .join('\n');
}

function otherCategories(current, language, strings, counts) {
  const items = CATEGORIES.filter((category) => category.id !== current)
    .map((category) => {
      const copy = category[language];
      const count = counts.get(`${language}:${category.id}`) ?? 0;
      const noun = count === 1 ? strings.categoryCountOne : strings.categoryCountMany;
      return `<li><a href="${categoryPath(language, copy.slug)}">${escapeHtml(copy.name)}</a> <span class="card-meta">${count} ${escapeHtml(noun)}</span></li>`;
    })
    .join('');
  return items;
}

/** ------------------------------------------------------------------ index */

function renderIndex(language, strings, counts) {
  const list = CATEGORIES.map((category) => {
    const copy = category[language];
    const count = counts.get(`${language}:${category.id}`) ?? 0;
    const noun = count === 1 ? strings.categoryCountOne : strings.categoryCountMany;
    return `        <article class="card">
          <p class="card-eyebrow">${count} ${escapeHtml(noun)}</p>
          <h2 class="card-title"><a href="${categoryPath(language, copy.slug)}">${escapeHtml(copy.name)}</a></h2>
          <p class="card-body">${escapeHtml(copy.description)}</p>
        </article>`;
  }).join('\n');

  const body = `    <div class="container">
      <div class="card-grid">
${list}
      </div>
      <p><a class="text-link" href="${journalPath(language)}">${escapeHtml(strings.journal)}</a></p>
      ${disclaimer(strings, language, { compact: true })}
    </div>`;

  const graph = [{
    '@type': 'CollectionPage',
    '@id': `${absolute(categoryPath(language))}#categories`,
    name: strings.categoryAll,
    description: strings.categoryIntro,
    inLanguage: language,
    isPartOf: { '@id': `${ORIGIN}/#website` },
    hasPart: CATEGORIES.map((category) => ({
      '@type': 'CollectionPage',
      name: category[language].name,
      url: absolute(categoryPath(language, category[language].slug))
    }))
  }];

  return renderShell({
    language,
    strings,
    section: 'journal',
    pathFor: (code) => categoryPath(code),
    title: strings.categoryAll,
    description: strings.categoryIntro,
    heading: strings.categoryAll,
    eyebrow: strings.journal,
    intro: strings.categoryIntro,
    trail: [
      { name: strings.journal, href: journalPath(language) },
      { name: strings.categoryAll, href: categoryPath(language) }
    ],
    graph,
    body
  });
}

/** --------------------------------------------------------------- category */

function renderCategory(category, language, strings, articles, counts) {
  const copy = category[language];
  const url = absolute(categoryPath(language, copy.slug));
  const noun = articles.length === 1 ? strings.categoryCountOne : strings.categoryCountMany;

  const body = `    <div class="container">
      <p class="card-meta">${articles.length} ${escapeHtml(noun)}</p>
      <div class="post-grid">
${cards(articles, language, strings)}
      </div>
      <section class="page-section">
        <h2 class="section-title">${escapeHtml(strings.categoryBrowseOthers)}</h2>
        <ul class="glossary-terms">${otherCategories(category.id, language, strings, counts)}</ul>
        <p><a class="text-link" href="${journalPath(language)}">${escapeHtml(strings.journal)}</a></p>
      </section>
      ${disclaimer(strings, language, { compact: true })}
    </div>`;

  // An ItemList inside the CollectionPage rather than a Blog: this is a subset
  // of one blog, and declaring a second Blog entity would tell a crawler the
  // site has four of them.
  const graph = [{
    '@type': 'CollectionPage',
    '@id': `${url}#archive`,
    name: `${strings.categoryTitlePrefix}: ${copy.name}`,
    description: copy.description,
    inLanguage: language,
    isPartOf: { '@id': `${ORIGIN}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: articles.length,
      itemListElement: articles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: article.title,
        url: absolute(articlePath(language, article.slug))
      }))
    }
  }];

  return renderShell({
    language,
    strings,
    section: 'journal',
    pathFor: (code) => categoryPath(code, category[code].slug),
    title: `${copy.name} — ${strings.categoryTitlePrefix}`,
    description: copy.description,
    heading: copy.name,
    eyebrow: `${strings.journal} · ${strings.categoryTitlePrefix}`,
    intro: copy.intro,
    trail: [
      { name: strings.journal, href: journalPath(language) },
      { name: strings.categoryAll, href: categoryPath(language) },
      { name: copy.name, href: categoryPath(language, copy.slug) }
    ],
    graph,
    body
  });
}

/** ------------------------------------------------------------------ build */

async function write(relativePath, contents) {
  const absolutePath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, contents);
}

async function pruneRemoved() {
  for (const language of LANGUAGES) {
    const directory = path.join(root, categoryPath(language));
    const expected = new Set(CATEGORIES.map((category) => category[language].slug));
    let found;
    try {
      found = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const item of found) {
      if (!item.isDirectory() || expected.has(item.name)) continue;
      await fs.rm(path.join(directory, item.name), { recursive: true, force: true });
      console.log(`Categories: removed stale directory ${language}/${item.name}`);
    }
  }
}

async function main() {
  const sidecar = JSON.parse(await fs.readFile(path.join(root, 'content', 'site', 'site.i18n.json'), 'utf8'));
  const catalog = await readSharedCatalog();

  for (const language of LANGUAGES) {
    const slugs = CATEGORIES.map((category) => category[language].slug);
    const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate ${language} category slug(s): ${[...new Set(duplicates)].join(', ')}`);
    }
    for (const [index, slug] of slugs.entries()) {
      if (slug !== slugify(slug)) {
        throw new Error(`Category slug "${slug}" (${CATEGORIES[index].id}, ${language}) is not URL-safe.`);
      }
    }
  }

  // Every category an article declares has to be one this table knows about.
  // The reverse is allowed: a category with no articles yet publishes an empty
  // archive, which is a page waiting for content rather than a broken one.
  const unknown = new Map();
  for (const article of catalog) {
    const match = CATEGORIES.find((category) => category[article.language]?.name === article.category);
    if (!match) {
      unknown.set(`${article.language}: "${article.category}"`, article.slug);
    }
  }
  if (unknown.size > 0) {
    const shown = [...unknown.entries()].map(([category, slug]) => `${category} (${slug})`).join('; ');
    throw new Error(
      `${unknown.size} article category value(s) match no entry in content/site/categories.mjs: ${shown}. ` +
        `An article whose category is not in the table appears in no archive at all, so this fails the ` +
        `build rather than dropping it silently.`
    );
  }

  const counts = new Map();
  const grouped = new Map();
  for (const language of LANGUAGES) {
    for (const category of CATEGORIES) {
      const articles = catalog
        .filter((article) => article.language === language && article.category === category[language].name)
        .sort((left, right) => right.date.localeCompare(left.date));
      grouped.set(`${language}:${category.id}`, articles);
      counts.set(`${language}:${category.id}`, articles.length);
    }
  }

  let pages = 0;
  const written = [];

  for (const language of LANGUAGES) {
    const strings = stringsFor(sidecar, language, 'site.i18n.json');

    await write(`${categoryPath(language).replace(/^\//, '')}index.html`, renderIndex(language, strings, counts));
    written.push(categoryPath(language));
    pages += 1;

    for (const category of CATEGORIES) {
      const slug = category[language].slug;
      const articles = grouped.get(`${language}:${category.id}`);
      await write(
        `${categoryPath(language, slug).replace(/^\//, '')}index.html`,
        renderCategory(category, language, strings, articles, counts)
      );
      written.push(categoryPath(language, slug));
      pages += 1;
    }
  }

  await pruneRemoved();

  console.log(
    `Categories: ${pages} page(s) across ${LANGUAGES.length} language(s), ${CATEGORIES.length} category(ies) each.`
  );
  return written;
}

export { main as generateCategoryPages };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`generate-category-pages: ${error.message}`);
    process.exitCode = 1;
  });
}
