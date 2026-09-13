// Records that a template workbook was downloaded, and whether the panel that
// the download reveals was taken up.
//
// The three template pages link their workbook directly, with no email gate,
// and that is a deliberate decision recorded at the top of
// scripts/generate-template-pages.mjs. The consequence of it was that the
// download was completely unmeasured: the pages could have been the best
// performing thing on the site or the worst, and nothing on the server knew
// either way. This endpoint is the smallest thing that answers the question -
// assets/js/template-next.js beacons here once per template per browsing
// session, and this adds one to a counter.
//
// Two events rather than one, because one is not enough to judge the panel:
//
//   download  the button was pressed, which is also the moment the panel is
//             shown. The denominator.
//   next      one of the panel's two actions was pressed. The numerator.
//
// It stores no address, no identifier and no per-visit row - just counters per
// translation, so the site can tell whether a panel is worth showing without
// keeping anything about the people it was shown to. See
// netlify/database/migrations/20260913120000_create-template-downloads.sql.
//
// The endpoint is public and unauthenticated, which it has to be on a static
// page. It is not a security boundary: the worst a flood of forged requests
// can do is make a counter that nothing on the site reads back say the wrong
// number, and mislead the one person who looks at it.
import { getDatabase } from '@netlify/database';

const LANGUAGES = new Set(['en', 'es', 'pt']);

// The stable template ids from content/site/templates.mjs.
//
// Copied rather than imported, because that module is 32 KB of prose in three
// languages and what is needed here is three strings from it - importing it
// would bundle every FAQ answer on the site into a function that counts to one.
// The copy cannot drift: generate-template-pages.mjs reads this very block on
// every build and fails when it disagrees with TEMPLATES, which is what stops a
// fourth template shipping a page whose download button silently 400s here.
const TEMPLATES = new Set(['monthly-analysis', 'expense-management', 'personal-budget']);

const EVENTS = new Set(['download', 'next']);

export default async (request, context) => {
  // config.method below already means a GET never reaches this function, so
  // this branch only runs where in-code config is not applied - `netlify dev`
  // and a direct invocation of the module in a test. It is kept because the
  // platform's own rejection has no Allow header and this one does.
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
  const template = typeof payload?.template === 'string' ? payload.template : '';
  const event = typeof payload?.event === 'string' ? payload.event : '';

  if (!LANGUAGES.has(language) || !TEMPLATES.has(template) || !EVENTS.has(event)) {
    return new Response(null, { status: 400 });
  }

  // Nobody is waiting for this. The beacon is sent with sendBeacon from a page
  // that has already rendered - and in the `next` case from a page that is
  // about to be replaced by the one being navigated to - so holding the 204
  // open for two round trips to Postgres only bills wall-clock and delays the
  // browser's request queue. waitUntil hands the writes to the platform and
  // lets the response go now.
  //
  // The fallback matters: without waitUntil the function would return and the
  // promise would be abandoned mid-write, so a context that does not provide
  // it gets the old behaviour rather than silent data loss.
  const recorded = record(language, template, event);
  if (typeof context?.waitUntil === 'function') {
    context.waitUntil(recorded);
  } else {
    await recorded;
  }

  return new Response(null, { status: 204 });
};

async function record(language, template, event) {
  try {
    const db = getDatabase();

    // The two events are written as two statements rather than one with the
    // increment parameterized. A single upsert would have to carry `+ $4` and a
    // CASE over another placeholder to decide whether the timestamp moves, and
    // every one of those is a chance for the driver to infer a type nobody
    // meant. Two statements that each add one to one column are the version
    // that can be read and be sure of.
    //
    // date_trunc runs in the database rather than here so the month bucket is
    // decided by one clock. A boundary crossed in the function's timezone but
    // not in the database's would otherwise write the same instant into two
    // different rows.
    if (event === 'download') {
      await db.sql`
        INSERT INTO template_downloads (language, template, downloads)
        VALUES (${language}, ${template}, 1)
        ON CONFLICT (language, template)
        DO UPDATE SET downloads = template_downloads.downloads + 1, last_downloaded_at = now()
      `;
    } else {
      // A `next` click always follows a download in the same page view, so this
      // upsert normally finds its row. The insert branch is still written out,
      // because a forged or replayed request is free to arrive on its own and a
      // failed write is worse than a row whose downloads column reads zero -
      // which is itself the signature of exactly that, and worth being able to
      // see.
      await db.sql`
        INSERT INTO template_downloads (language, template, next_clicks)
        VALUES (${language}, ${template}, 1)
        ON CONFLICT (language, template)
        DO UPDATE SET next_clicks = template_downloads.next_clicks + 1
      `;
    }

    try {
      if (event === 'download') {
        await db.sql`
          INSERT INTO template_downloads_monthly (language, template, month, downloads)
          VALUES (${language}, ${template}, date_trunc('month', now() AT TIME ZONE 'UTC')::date, 1)
          ON CONFLICT (language, template, month)
          DO UPDATE SET downloads = template_downloads_monthly.downloads + 1
        `;
      } else {
        await db.sql`
          INSERT INTO template_downloads_monthly (language, template, month, next_clicks)
          VALUES (${language}, ${template}, date_trunc('month', now() AT TIME ZONE 'UTC')::date, 1)
          ON CONFLICT (language, template, month)
          DO UPDATE SET next_clicks = template_downloads_monthly.next_clicks + 1
        `;
      }
    } catch (error) {
      // Reported apart from the lifetime write above, which has already
      // succeeded by this point. On the first deploy after these tables were
      // added this is the expected failure - Netlify applies migrations after
      // the build, so the function can be live for a few minutes before the
      // tables exist. It self-heals, and the lifetime counter never stops.
      console.error('template-download: recorded the total but not the month bucket.', error);
    }
  } catch (error) {
    // A counter that cannot be written is not worth failing anything over. The
    // beacon is fire-and-forget, the file is already downloading, and the panel
    // does not wait for this call before it appears. Log it for the function
    // stream and let the 204 stand. Swallowing it here also keeps waitUntil
    // from seeing a rejected promise.
    console.error('template-download: could not record the event.', error);
  }
}

export const config = {
  path: '/api/template-download',
  // Declared so the platform drops anything that is not a POST before this
  // function is invoked at all. The branch at the top of the handler stays for
  // the Allow header.
  method: 'POST',
  // One visitor downloading one workbook sends at most two of these, once per
  // template per browsing session, so three templates in one session is six
  // requests. Twenty a minute leaves room for somebody opening all nine pages
  // in tabs and is two orders of magnitude below a script hammering the
  // endpoint. Keyed by address rather than by the site as a whole, which is the
  // default: the point is to stop one source, and a site-wide ceiling would let
  // that source spend everybody else's allowance.
  rateLimit: {
    windowSize: 60,
    windowLimit: 20,
    aggregateBy: 'ip'
  }
};
