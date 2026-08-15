import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

await fs.writeFile(path.join(contentRoot, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
