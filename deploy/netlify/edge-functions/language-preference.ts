/**
 * Sends a first-time visitor at the apex to the site in their own language.
 *
 * The site is published three times over: Spanish at `/`, English at `/en/`,
 * Portuguese at `/pt/`. A link shared anywhere lands on the apex, so a reader
 * whose browser is set to English arrives at a Spanish page and has to find the
 * language switcher before the site is readable at all. Every page carries the
 * hreflang cluster that tells a search engine which version to show, but
 * hreflang is a hint to crawlers, not something a browser acts on.
 *
 * The rules this follows, in order, are all about not being clever:
 *
 * 1. A visitor who has been here before is never redirected. The redirect sets
 *    a cookie; the presence of that cookie ends the negotiation for a year. One
 *    guess per browser, and a wrong guess can be walked away from by using the
 *    language switcher, which is exactly where it was before.
 *
 * 2. A request with no Accept-Language header is never redirected. That is what
 *    makes this transparent to crawlers without sniffing a single user agent:
 *    Googlebot, Bingbot and the AI crawlers this site publishes llms.txt for do
 *    not send the header, so they see the apex exactly as it is published, and
 *    the hreflang cluster keeps doing the work for them. Sniffing user agents to
 *    achieve the same thing would be cloaking - serving one thing to a crawler
 *    and another to a person - and the header does it honestly instead.
 *
 * 3. Spanish speakers are not redirected, because they are already there. The
 *    apex is the Spanish site, so the only redirects this ever issues are to
 *    /en/ and /pt/.
 *
 * The status is 302 rather than 301. The response depends on who is asking, so
 * it must never be cached as a property of the URL - a permanent redirect here
 * would be the kind of mistake that outlives the deploy that caused it.
 *
 * Scoped to `/` alone. Nothing else on the site runs at the edge, which matters
 * because a path served by an edge function does not get the headers from
 * _headers - see SECURITY_HEADERS below.
 */
import type { Config, Context } from '@netlify/edge-functions';

/** The three published languages. The apex is Spanish, so only two are targets. */
const REDIRECTS: Record<string, string> = { en: '/en/', pt: '/pt/' };
const SUPPORTED = new Set(['en', 'es', 'pt']);

/** Set once and read for a year. Its presence, not its value, ends the negotiation. */
const COOKIE = 'lang';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Restated here because _headers does not apply to a response an edge function
 * returns. It only covers the redirect - a pass-through returns nothing, so the
 * static response keeps the full policy from _headers - and a 302 with an empty
 * body needs far less than a document does. Transport security is the one that
 * genuinely matters on a redirect: it is a response a browser will act on, and
 * a downgrade attack on it would send the visitor to the plaintext version of
 * wherever it points.
 */
const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

/**
 * Reads Accept-Language and returns the best-matching published language, or
 * null when the header expresses no opinion about any of them.
 *
 * `en-GB` matches `en`: the site has one English, and a reader who asked for a
 * regional variant of it wants it. `*` is skipped rather than treated as a
 * match, because a client that will accept anything has not said what it wants,
 * and the apex is already the answer to that.
 */
function negotiate(header: string | null): string | null {
  if (!header) return null;

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...parameters] = part.trim().split(';');
      const quality = parameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith('q='));
      const q = quality ? Number.parseFloat(quality.slice(2)) : 1;
      return { language: tag.trim().toLowerCase().split('-')[0], q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => entry.q > 0 && SUPPORTED.has(entry.language))
    // Descending by q, and stable, so equal weights keep the order the browser
    // listed them in - which is the order the reader put them in.
    .sort((a, b) => b.q - a.q);

  return ranked.length > 0 ? ranked[0].language : null;
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);

  // `/?lang=en` and `/?lang=pt` are already redirected by _redirects, and the
  // parameter is an explicit request for a language - it beats anything guessed
  // from a header. This has to be checked here rather than left to the redirect
  // rules, because a response returned from an edge function skips them: without
  // this branch, `/?lang=en` from a Portuguese browser would land on /pt/.
  if (url.searchParams.has('lang')) return;

  // Been here before. Nothing to decide.
  if (context.cookies.get(COOKIE)) return;

  const language = negotiate(request.headers.get('accept-language'));
  const destination = language ? REDIRECTS[language] : undefined;

  // No header, no opinion, or Spanish: serve the apex as published. An empty
  // return is also the cheapest way out of an edge function, and it is the
  // branch nearly every request takes.
  if (!destination) return;

  // Anything else on the URL is carried across - a campaign parameter or a
  // fragment belongs to the visit, not to the language it is read in.
  const target = new URL(url);
  target.pathname = destination;

  const response = new Response(null, { status: 302 });
  response.headers.set('Location', target.toString());
  // Whatever a browser or a proxy does with this, it must not reuse it for the
  // next visitor: the decision belongs to the request, not to the URL.
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Vary', 'Accept-Language, Cookie');
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }

  // Not HttpOnly on purpose: this is a display preference, and the language
  // switcher in the page should be able to overwrite it when a reader picks a
  // language for themselves. There is nothing here worth protecting from
  // script that script could not work out from the URL it is running on.
  context.cookies.set({
    name: COOKIE,
    value: language as string,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'Lax',
    secure: true
  });

  return response;
};

export const config: Config = {
  path: '/',
  // GET only. Netlify's manifest schema accepts GET, POST, PUT, PATCH, DELETE
  // and OPTIONS, and rejects HEAD outright - declaring it fails the deploy at
  // manifest validation rather than at runtime. Nothing is lost by leaving it
  // out: a HEAD request is never a person navigating to the homepage, so it
  // skips the function and gets the apex exactly as published, which is what a
  // link checker or a preflight asking for headers should see anyway.
  method: 'GET',
  // A failure here must never cost anybody the homepage. Bypassing serves the
  // apex exactly as it is published, which is the behaviour this replaced.
  onError: 'bypass'
};
