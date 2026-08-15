// Ranks the journal's articles by how often they have been read, for the
// featured card generate-blog-pages.mjs writes at the top of each index.
//
// The card used to be part of the hand-authored index markup: one article,
// named once, updated by remembering to. It named a July essay while five newer
// articles sat in the grid below it. Choosing it here means it is decided again
// on every deploy - which is every time an article is published or republished
// from the content studio, because that commit is what triggers the build.
//
// Popularity is totalled per translation group rather than per page. The three
// indexes then feature the same article, which is what the rest of the site
// does with translations, and a language whose readers are fewer still gets a
// ranking rather than a near-empty one of its own.
//
// The database is optional on purpose. Reading it fails, harmlessly, in three
// ordinary situations: a local run with no database configured; the first
// deploy after this was added, because Netlify applies migrations after the
// build command and the table does not exist yet; and any outage. Each falls
// back to the newest article, which is what the card would have shown anyway.
// A journal index is not worth failing a deploy over.

export async function readViewCounts() {
  let rows;
  try {
    const { getDatabase } = await import('@netlify/database');
    const database = getDatabase();
    rows = await database.sql`SELECT language, slug, views FROM article_views`;
  } catch (error) {
    console.log(`Featured article: no view counts available (${error.message}). Falling back to the newest article.`);
    return null;
  }

  const counts = new Map();
  for (const row of rows) {
    // BIGINT arrives as a string from Postgres once it exceeds 2^31, and as a
    // number below that. Normalise before anything sorts on it.
    const views = Number(row.views);
    if (Number.isFinite(views) && views > 0) counts.set(`${row.language}/${row.slug}`, views);
  }
  return counts;
}

// The same shape, over the trailing two month buckets rather than all time.
//
// Two rather than one because a build on the second of the month would
// otherwise see a nearly empty table and render a "read this month" list with
// one entry in it. Two buckets always contain between four and eight weeks of
// reading, which is what the list actually claims.
//
// Returns null under exactly the conditions readViewCounts does, and is
// tolerated the same way: the rail is omitted rather than the build failed.
export async function readRecentViewCounts() {
  let rows;
  try {
    const { getDatabase } = await import('@netlify/database');
    const database = getDatabase();
    rows = await database.sql`
      SELECT language, slug, SUM(views) AS views
      FROM article_views_monthly
      WHERE month >= date_trunc('month', now() AT TIME ZONE 'UTC')::date - INTERVAL '1 month'
      GROUP BY language, slug
    `;
  } catch (error) {
    console.log(`Recently read: no monthly counts available (${error.message}). The rail will be omitted.`);
    return null;
  }

  const counts = new Map();
  for (const row of rows) {
    const views = Number(row.views);
    if (Number.isFinite(views) && views > 0) counts.set(`${row.language}/${row.slug}`, views);
  }
  return counts;
}

// Views for every translation of an article, summed onto its translation key.
// Articles the catalog no longer lists simply never appear here, so a renamed
// or deleted slug cannot keep a stale row in the ranking.
export function totalsByTranslation(articles, counts) {
  const totals = new Map();
  if (!counts) return totals;

  for (const article of articles) {
    const views = counts.get(`${article.language}/${article.slug}`) || 0;
    totals.set(article.translationKey, (totals.get(article.translationKey) || 0) + views);
  }
  return totals;
}

// The article a given language's index should feature: most read first, newest
// as the tie-break, slug last so the choice cannot depend on catalog order.
// `ranked` says whether the pick came from real reading or from the fallback -
// the card labels itself differently in each case, because calling an article
// the most read one when nothing has been counted yet would be a claim the site
// cannot support.
export function chooseFeatured(articles, totals) {
  const ordered = [...articles].sort((first, second) => {
    const byViews = (totals.get(second.translationKey) || 0) - (totals.get(first.translationKey) || 0);
    if (byViews !== 0) return byViews;
    const byDate = second.date.localeCompare(first.date);
    if (byDate !== 0) return byDate;
    return first.slug.localeCompare(second.slug);
  });

  const article = ordered[0];
  return { article, ranked: Boolean(article) && (totals.get(article.translationKey) || 0) > 0 };
}

// The short list under the featured card: the most read articles of the last
// two month buckets, in this language, excluding whatever the featured card
// already shows. Returns an empty array when nothing has been counted, which is
// what makes the rail disappear rather than render a heading over nothing.
//
// Ranked on this language's own reads rather than the translation total, unlike
// the featured card. The card answers "what is this journal known for", which is
// the same answer in every language; the rail answers "what are people here
// reading now", and a Portuguese reader is better served by what Portuguese
// readers opened than by a total three languages contributed to.
export function recentlyRead(articles, counts, exclude, limit = 3) {
  if (!counts || counts.size === 0) return [];

  return articles
    .map((article) => ({ article, views: counts.get(`${article.language}/${article.slug}`) || 0 }))
    .filter(({ article, views }) => views > 0 && article.slug !== exclude)
    .sort((first, second) => (
      second.views - first.views
      || second.article.date.localeCompare(first.article.date)
      || first.article.slug.localeCompare(second.article.slug)
    ))
    .slice(0, limit)
    .map(({ article }) => article);
}

// A build-log report, not site output: which translations are carrying an
// article and which are not.
//
// Every article is published in all three languages, so the question is never
// "is this translated" but "is the translation being read". An article whose
// English page is read ten times as often as its Spanish one is either reaching
// a different audience or has a weaker translation, and either way it is where
// the next hour of editing pays best. The report is printed rather than stored
// because it is a prompt for a person, and a stale copy of it on disk would be
// worse than none.
export function translationPriorities(articles, counts, { minimum = 20, ratio = 4 } = {}) {
  if (!counts || counts.size === 0) return [];

  const groups = new Map();
  for (const article of articles) {
    const views = counts.get(`${article.language}/${article.slug}`) || 0;
    const group = groups.get(article.translationKey) || { total: 0, byLanguage: [] };
    group.total += views;
    group.byLanguage.push({ language: article.language, slug: article.slug, views });
    groups.set(article.translationKey, group);
  }

  const priorities = [];
  for (const [translationKey, group] of groups) {
    // Below the minimum the ratio is noise: two reads against zero is a 2x gap
    // and means nothing. The threshold is what keeps this from reporting every
    // article in the first week after a deploy.
    if (group.total < minimum) continue;

    const ordered = [...group.byLanguage].sort((first, second) => second.views - first.views);
    const strongest = ordered[0];
    const weakest = ordered[ordered.length - 1];
    // +1 on the denominator so a translation with no reads at all is included
    // rather than dividing by zero out of the report - that is the widest gap
    // there is, and the one most worth seeing.
    if (strongest.views / (weakest.views + 1) < ratio) continue;

    priorities.push({ translationKey, strongest, weakest, total: group.total });
  }

  return priorities.sort((first, second) => second.total - first.total);
}
