/**
 * Retires the last client-side article URL: `/{lang}/blog/article.html?post=`.
 *
 * The journal used to render every article from one shell page that read the
 * slug out of the query string, so all fifteen articles shared a URL, a title
 * and an empty document. The articles are pre-rendered now, and _redirects has
 * been pointing the old address at the new one since - but it pointed at it
 * badly. The redirect engine forwards the parameters a rule matched on to the
 * destination, so
 *
 *     /en/blog/article.html?post=slow-money-system
 *
 * arrived at
 *
 *     /en/blog/slow-money-system/?post=slow-money-system
 *
 * which is a second, parameterised 200 for an article that already had a URL.
 * Fifteen articles, fifteen extra addresses, each one crawled and then filed by
 * Google as a duplicate of a page it already had. The redirect syntax has no
 * way to drop a parameter, so this does it here instead.
 *
 * The bare `/{lang}/blog/article.html` with no parameter is deliberately left
 * to _redirects, which sends it to the journal index. There is nothing to strip
 * in that case, and leaving it there means those URLs still resolve if this
 * function ever bypasses on error.
 */
import type { Config, Context } from '@netlify/edge-functions';

/**
 * The shape of a slug this site generates: lowercase, digits and hyphens. The
 * value arrives from the query string, which makes it attacker-controlled, and
 * it is about to be interpolated into a Location header - so it is matched
 * against this rather than sanitised, and anything that does not match is not
 * treated as a slug at all. A path separator or a newline in here would be a
 * redirect to somebody else's site or a split response.
 */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Restated because _headers does not apply to a response constructed here. */
const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

export default async (request: Request, _context: Context) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('post');

  // No slug, or nothing that could be one. Fall through to the _redirects rule
  // that sends the bare address to the journal index.
  if (!slug || !SLUG.test(slug)) return;

  // The language is the first segment of the path this function is scoped to,
  // so it is already known to be one of the three; reading it back off the URL
  // avoids restating that list in a second place.
  const language = url.pathname.split('/')[1];

  // Only the slug is dropped. A campaign parameter that happened to ride along
  // belongs to the visit and survives the hop.
  const target = new URL(url);
  target.pathname = `/${language}/blog/${slug}/`;
  target.searchParams.delete('post');

  const response = new Response(null, { status: 301 });
  response.headers.set('Location', target.toString());
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
};

export const config: Config = {
  // Written out rather than matched with a placeholder: these three are the
  // whole of the legacy surface, and a pattern would put this function in front
  // of paths that do not exist yet.
  path: ['/en/blog/article.html', '/es/blog/article.html', '/pt/blog/article.html'],
  method: 'GET',
  // A failure here must not cost anybody an article. Bypassing hands the
  // request to _redirects, which still answers with the journal index.
  onError: 'bypass'
};
