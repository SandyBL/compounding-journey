// The two extras a new-article broadcast carries under the article itself: one
// more article worth reading, and one glossary term the new article uses.
//
// Both are read from the published site rather than from the build, the same
// way the dispatcher learns about new articles: the feed for the related
// article, and the article's own page for the glossary term, because the page
// already carries the build's decision about which terms it mentions - every
// glossary link the inline linker placed is an
// <a ... data-link-kind="glossary"> with the term's fragment in its href.
//
// Neither extra is allowed to hold an email back. Anything that fails - a feed
// that does not answer, a page with no glossary link - leaves that extra out
// and the broadcast goes as it always did.
import { GLOSSARY } from '../../../content/site/glossary.mjs';
import { SITE_ORIGIN } from './config.mjs';
import { readFeed } from './feeds.mjs';

const FETCH_TIMEOUT_MS = 5_000;

/**
 * The article a reader should go to next: the newest other piece in the same
 * category, or the newest other piece at all. The same rule as the "keep
 * reading" block at the end of every article page, so the email recommends
 * what the page itself would.
 */
export function relatedFrom(items, article) {
  const self = items.find((item) => item.link === article.link || item.guid === article.guid);
  const others = items.filter((item) => item !== self && item.link !== article.link);
  const category = self?.category;
  return (category && others.find((item) => item.category === category)) || others[0] || null;
}

function phrasePattern(phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'giu');
}

function mentions(text, term) {
  return [term.name, ...(term.aliases ?? [])]
    .filter(Boolean)
    .reduce((count, phrase) => count + (text.match(phrasePattern(phrase))?.length ?? 0), 0);
}

/**
 * The glossary term the article leans on most, among the ones it links.
 *
 * The first linked term is often a general one - "emergency fund" in an
 * article about mortgages - so each linked term is weighed by how often the
 * article's text uses it, and the first link only breaks a tie.
 */
export function termFrom(html, language) {
  const bySlug = new Map(GLOSSARY.map((entry) => [entry[language]?.slug, entry]));
  const linked = [];
  for (const [, href] of html.matchAll(/<a href="([^"]*)"[^>]*data-link-kind="glossary"/g)) {
    const entry = bySlug.get(href.split('#')[1]);
    if (entry && !linked.includes(entry)) linked.push(entry);
  }
  if (linked.length === 0) return null;

  const body = html.match(/<article[\s\S]*<\/article>/)?.[0] ?? html;
  const text = body.replace(/<[^>]+>/g, ' ');
  const best = linked
    .map((entry, index) => ({ entry, index, count: mentions(text, entry[language]) }))
    .sort((a, b) => b.count - a.count || a.index - b.index)[0].entry;

  const term = best[language];
  const href = (html.match(new RegExp(`<a href="([^"]*#${term.slug})"`)) ?? [])[1];
  return {
    name: term.name,
    short: term.short,
    link: href ? new URL(href, SITE_ORIGIN).toString() : `${SITE_ORIGIN}/`
  };
}

async function articleHtml(link) {
  const response = await fetch(link, {
    headers: { Accept: 'text/html' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`${link} answered ${response.status}.`);
  return response.text();
}

/** `{ related, term }`, either of which may be null. Never throws. */
export async function broadcastExtras(article) {
  const [related, term] = await Promise.all([
    readFeed(article.language)
      .then((items) => relatedFrom(items, article))
      .catch((error) => {
        console.error(`newsletter: no related article for "${article.title}".`, error);
        return null;
      }),
    articleHtml(article.link)
      .then((html) => termFrom(html, article.language))
      .catch((error) => {
        console.error(`newsletter: no glossary term for "${article.title}".`, error);
        return null;
      })
  ]);
  return { related, term };
}
