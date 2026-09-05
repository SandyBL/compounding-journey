import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeSharedCatalog } from './shared-catalog.mjs';
import { readingMinutes } from './markdown.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const contentRoot = path.join(root, 'content', 'blog');
const languages = ['en', 'es', 'pt'];
const defaultAuthor = 'Sandy Bradbury / Compounding Journey';

function parseScalar(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontMatter(source) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { attributes: {}, body: source };
  const attributes = {};
  let currentKey = '';
  match[1].split('\n').forEach((line) => {
    if (/^\s+/.test(line) && currentKey) {
      attributes[currentKey] += ` ${line.trim()}`;
      return;
    }
    const separator = line.indexOf(':');
    if (separator < 0) return;
    const key = line.slice(0, separator).trim();
    currentKey = key;
    attributes[key] = line.slice(separator + 1).trim();
  });
  Object.keys(attributes).forEach((key) => {
    attributes[key] = parseScalar(attributes[key]);
  });
  return { attributes, body: source.slice(match[0].length) };
}

function searchableText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const articles = [];

for (const language of languages) {
  const directory = path.join(contentRoot, language);
  const files = (await fs.readdir(directory)).filter((file) => file.endsWith('.md'));
  for (const file of files) {
    const source = await fs.readFile(path.join(directory, file), 'utf8');
    const { attributes, body } = parseFrontMatter(source);
    articles.push({
      language,
      slug: path.basename(file, '.md'),
      title: attributes.title || path.basename(file, '.md').replace(/-/g, ' '),
      date: attributes.date || '',
      // Optional. Set "updated" in the front matter when an article is revised:
      // it becomes dateModified and the sitemap lastmod, which is what tells a
      // crawler the page is worth re-reading. Left empty it falls back to date,
      // so nothing claims to have changed when it has not.
      updated: attributes.updated || '',
      category: attributes.category || '',
      summary: attributes.summary || '',
      author: attributes.author || defaultAuthor,
      translationKey: attributes.translation_key || path.basename(file, '.md'),
      // Optional, comma-separated. The phrases that, when they appear in
      // *another* article's prose, should become a link to this one - so
      // "regla del 4 %" anywhere on the site reaches the piece that explains
      // the rule. scripts/inline-links.mjs does the placing; this is only the
      // list of handles, and it lives in the front matter because the author is
      // the only one who knows what their article is the best answer to.
      //
      // Titles are not usable as handles on their own: nobody writes a
      // colon-and-subtitle headline verbatim in the middle of a paragraph. That
      // is why an article with no phrases simply never becomes a link target
      // rather than falling back to matching its title.
      linkPhrases: (attributes.link_phrases || '')
        .split(',')
        .map((phrase) => phrase.trim())
        .filter(Boolean),
      // Computed here rather than by each generator that shows it, so the number
      // on a home page card is the same number the article's own header states.
      readingTime: readingMinutes(body),
      searchText: searchableText(body)
    });
  }
}

const translationsByKey = new Map();
articles.forEach((article) => {
  if (!translationsByKey.has(article.translationKey)) translationsByKey.set(article.translationKey, {});
  translationsByKey.get(article.translationKey)[article.language] = article.slug;
});

const catalog = articles
  .map((article) => ({ ...article, translations: translationsByKey.get(article.translationKey) }))
  .sort((first, second) => second.date.localeCompare(first.date));

await writeSharedCatalog(catalog);

// The catalog written above is build input: it carries every language at once,
// plus the full searchable body of every article, and it is what the generators
// read. It goes to a temporary directory rather than into content/blog, because
// content/blog is inside the publish root and a build artifact that only three
// scripts read has no business being uploaded. See scripts/shared-catalog.mjs.
//
// It used to be what the journal index fetched in the browser too, which meant a
// Spanish reader downloaded the English and Portuguese articles as well, and
// every reader downloaded the complete text of all of them, to render a grid
// that shows a title, a category, a date and a summary. The files below are that
// grid's actual input: one per language, six fields per article, nothing else.
//
// The trade-off is deliberate and worth stating: the search box now matches on
// title, category and summary rather than on article bodies. Restoring body
// search means shipping the bodies again, which is the cost this removes; a
// search index or an endpoint would be the way to get both back.
const CLIENT_FIELDS = ['language', 'slug', 'title', 'date', 'category', 'summary'];

for (const language of languages) {
  const forLanguage = catalog
    .filter((article) => article.language === language)
    .map((article) => Object.fromEntries(CLIENT_FIELDS.map((field) => [field, article[field]])));

  await fs.writeFile(
    path.join(contentRoot, `catalog.${language}.json`),
    `${JSON.stringify(forLanguage)}\n`
  );
}
