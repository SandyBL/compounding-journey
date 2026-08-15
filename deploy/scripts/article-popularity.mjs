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
