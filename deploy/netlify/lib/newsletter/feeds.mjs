// Reads the journal's RSS feeds, and ranks their articles by popularity for
// the welcome email.
//
// The feeds are the published contract for "what is new" - one per language at
// /{lang}/blog/feed.xml, written by scripts/generate-blog-pages.mjs - so the
// dispatcher reads them the way any feed reader would, rather than reaching
// into the build's catalog.
import { SITE_ORIGIN } from './config.mjs';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(value) {
  return value
    .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, entity) => {
      if (entity[0] === '#') {
        const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return ENTITIES[entity.toLowerCase()] ?? match;
    })
    .trim();
}

function field(item, name) {
  const match = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return match ? decode(match[1]) : '';
}

export function feedUrl(language) {
  return `${SITE_ORIGIN}/${language}/blog/feed.xml`;
}

export async function readFeed(language) {
  const response = await fetch(feedUrl(language), { headers: { Accept: 'application/rss+xml' } });
  if (!response.ok) throw new Error(`The ${language} feed answered ${response.status}.`);
  const xml = await response.text();

  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map(([, item]) => {
      const link = field(item, 'link');
      const date = new Date(field(item, 'pubDate'));
      return {
        guid: field(item, 'guid') || link,
        title: field(item, 'title'),
        summary: field(item, 'description'),
        link,
        publishedAt: Number.isNaN(date.getTime()) ? null : date
      };
    })
    .filter((item) => item.title && item.link.startsWith('https://'));
}

/** The slug in /{lang}/blog/{slug}/, which is what article_views is keyed by. */
export function slugOf(link) {
  return new URL(link).pathname.split('/').filter(Boolean)[2] ?? '';
}

/**
 * The three articles to recommend in a welcome email: the most read in the
 * subscriber's language, by the lifetime counter article_views keeps, topped
 * up with the newest articles when fewer than three have been read at all.
 * If the feed cannot be read the email still goes, with no article list.
 */
export async function popularArticles(database, language, count = 3) {
  let items;
  try {
    items = await readFeed(language);
  } catch (error) {
    console.error(`newsletter: could not read the ${language} feed for the welcome email.`, error);
    return [];
  }

  let views = new Map();
  try {
    const rows = await database.sql`SELECT slug, views FROM article_views WHERE language = ${language}`;
    views = new Map(rows.map((row) => [row.slug, Number(row.views)]));
  } catch (error) {
    console.error('newsletter: article views unavailable; recommending the newest articles instead.', error);
  }

  // The feed is newest-first, so a stable sort keeps newer articles ahead of
  // older ones with the same count - including all the ones with none.
  return items
    .map((item, index) => ({ item, index, views: views.get(slugOf(item.link)) ?? 0 }))
    .sort((a, b) => b.views - a.views || a.index - b.index)
    .slice(0, count)
    .map(({ item }) => item);
}
