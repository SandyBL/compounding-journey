// Records that an article page was read.
//
// The journal index features one article at the top, and which one is decided
// at build time by how often each has been read (see
// scripts/article-popularity.mjs). This endpoint is where that number comes
// from: assets/js/article-view.js beacons here once per article per browsing
// session, and this adds one to a total.
//
// It stores no address, no identifier and no per-visit row - just a counter per
// translation, so the site can rank its own articles without keeping anything
// about the people reading them.
//
// The endpoint is public and unauthenticated, which it has to be. It is not a
// security boundary: the worst a flood of forged requests can do is put the
// wrong article in the featured card until the next deploy. Slugs that match no
// published article are still accepted and simply never read back, because the
// build ranks the catalog rather than this table.
import { getDatabase } from '@netlify/database';

const LANGUAGES = new Set(['en', 'es', 'pt']);
// The shape generate-blog-catalog.mjs produces from a filename, and the only
// shape that can appear in a /{lang}/blog/{slug}/ URL.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const language = typeof payload?.language === 'string' ? payload.language : '';
  const slug = typeof payload?.slug === 'string' ? payload.slug : '';

  if (!LANGUAGES.has(language) || slug.length > 200 || !SLUG.test(slug)) {
    return new Response(null, { status: 400 });
  }

  try {
    const db = getDatabase();
    await db.sql`
      INSERT INTO article_views (language, slug, views)
      VALUES (${language}, ${slug}, 1)
      ON CONFLICT (language, slug)
      DO UPDATE SET views = article_views.views + 1, last_viewed_at = now()
    `;
  } catch (error) {
    // A counter that cannot be written is not worth failing a page view over:
    // the beacon is fire-and-forget and the reader is already reading. Log it
    // for the function stream and answer as though it landed, so a database
    // outage cannot turn into a visible error on every article.
    console.error('article-view: could not record the view.', error);
  }

  return new Response(null, { status: 204 });
};

export const config = {
  path: '/api/article-view'
};
