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

export default async (request, context) => {
  // config.method below already means a GET never reaches this function, so this
  // branch only runs where in-code config is not applied - `netlify dev` and a
  // direct invocation of the module in a test. It is kept because the platform's
  // own rejection has no Allow header and this one does, which is the difference
  // between a 405 that says what to do instead and one that does not.
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

  // The reader is not waiting for this. The beacon is sent with sendBeacon or
  // keepalive from a page that has already rendered, and nothing on that page
  // reads the answer, so holding the 204 open for two round trips to Postgres
  // only bills wall-clock and slows the browser's request queue down. waitUntil
  // hands the writes to the platform and lets the response go now.
  //
  // The fallback matters: without waitUntil the function would return and the
  // promise would be abandoned mid-write, so a context that does not provide it
  // gets the old behaviour rather than silent data loss.
  const recorded = record(language, slug);
  if (typeof context?.waitUntil === 'function') {
    context.waitUntil(recorded);
  } else {
    await recorded;
  }

  return new Response(null, { status: 204 });
};

async function record(language, slug) {
  try {
    const db = getDatabase();
    // Two counters from one beacon: the lifetime total that decides the
    // featured card, and the month bucket that decides the "read this month"
    // list. They are written separately rather than derived from each other
    // because neither can be reconstructed from the other - a lifetime total
    // cannot be split back into months, and summing months would lose every
    // read from before this table existed.
    //
    // date_trunc runs in the database rather than here so the bucket is decided
    // by one clock. A month boundary crossed in the function's timezone but not
    // in the database's would otherwise write to two different rows for the
    // same instant.
    await db.sql`
      INSERT INTO article_views (language, slug, views)
      VALUES (${language}, ${slug}, 1)
      ON CONFLICT (language, slug)
      DO UPDATE SET views = article_views.views + 1, last_viewed_at = now()
    `;
    try {
      await db.sql`
        INSERT INTO article_views_monthly (language, slug, month, views)
        VALUES (${language}, ${slug}, date_trunc('month', now() AT TIME ZONE 'UTC')::date, 1)
        ON CONFLICT (language, slug, month)
        DO UPDATE SET views = article_views_monthly.views + 1
      `;
    } catch (error) {
      // Reported apart from the lifetime write above, which has already
      // succeeded by this point. On the first deploy after the monthly table
      // was added this is the expected failure - Netlify applies migrations
      // after the build, so the function can be live for a few minutes before
      // the table exists. It self-heals; the lifetime counter never stops.
      console.error('article-view: recorded the total but not the month bucket.', error);
    }
  } catch (error) {
    // A counter that cannot be written is not worth failing a page view over:
    // the beacon is fire-and-forget and the reader is already reading. Log it
    // for the function stream and let the 204 stand, so a database outage
    // cannot turn into a visible error on every article. Swallowing it here
    // also keeps waitUntil from seeing a rejected promise.
    console.error('article-view: could not record the view.', error);
  }
}

export const config = {
  path: '/api/article-view',
  // Declared so the platform drops anything that is not a POST before this
  // function is invoked at all. The branch at the top of the handler stays for
  // the Allow header.
  method: 'POST',
  // One reader opening one article sends one of these, once per browsing
  // session, so a real person never approaches thirty a minute - two orders of
  // magnitude below a script hammering the endpoint to force its own article
  // into the featured card. Keyed by address rather than by the site as a whole,
  // which is the default: the point is to stop one source, and a site-wide
  // ceiling would let that source spend everybody else's allowance.
  //
  // This is not a security boundary and does not need to be. The endpoint
  // stores a counter and no identity, and the worst a determined flood achieves
  // is the wrong article in the featured card until the next deploy.
  rateLimit: {
    windowSize: 60,
    windowLimit: 30,
    aggregateBy: 'ip'
  }
};
