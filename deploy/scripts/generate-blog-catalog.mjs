import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentRoot = path.join(root, 'content', 'blog');
const languages = ['en', 'es', 'pt'];

function parseFrontMatter(source) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { attributes: {}, body: source };
  const attributes = {};
  match[1].split('\n').forEach((line) => {
    const separator = line.indexOf(':');
    if (separator < 0) return;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    attributes[key] = value;
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
      category: attributes.category || '',
      summary: attributes.summary || '',
      author: attributes.author || 'Sandy Bradbury',
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
