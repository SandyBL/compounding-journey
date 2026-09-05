/**
 * Two things every generator that writes a sitemap entry needs: a `<url>`
 * element, and an honest answer to "when did this page last change".
 *
 * Both used to live inside scripts/generate-blog-pages.mjs, which built the
 * whole sitemap because the journal was the only part of the site with dates.
 * It is not any more - there are now calculators, templates, glossary terms,
 * category archives, legal documents and a sessions page, none of which that
 * file knows about - so the sitemap moved to its own generator and these two
 * helpers moved here, where both can use them.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * One sitemap `<url>` element.
 *
 * lastmod is only emitted where a real modification date exists. Stamping every
 * URL with the build date would tell Google the whole site changed on each
 * deploy, which is the kind of unreliable signal that makes it ignore lastmod
 * altogether - including on the URLs where the date is real.
 */
export function sitemapEntry(loc, lastmod, alternates = []) {
  const links = alternates
    .map(({ hreflang, href }) => `\n    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}" />`)
    .join('');
  const modified = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `  <url>
    <loc>${loc}</loc>${modified}${links}
  </url>`;
}

/**
 * The date the sources behind a generated page were last committed, as
 * YYYY-MM-DD, or '' when that cannot be established.
 *
 * Articles carry their own date in front matter, so the sitemap has always been
 * able to state one for them. A calculator page, a glossary term or a home page
 * has no such field - each is built from a template and a data table - and
 * without this most of the sitemap would go out with no <lastmod> at all.
 *
 * The commit date of the source is the honest answer, and the only one
 * available that does not drift: a file's mtime in CI is the time the checkout
 * ran, and the build date would claim every URL changed on every deploy, which
 * is exactly the unreliable signal the comment above sitemapEntry() exists to
 * avoid. Committing a change is the act that changes a page here, so the two
 * are the same event.
 *
 * Everything about this can fail - git may be absent, the clone may be shallow
 * enough not to reach the last commit that touched the path, the path may be
 * uncommitted - and every failure returns '', which omits the element. An
 * absent lastmod is a crawler's problem to solve by fetching; a wrong one is a
 * signal it learns to distrust.
 */
export function lastCommitted(...relativePaths) {
  try {
    const stdout = execFileSync(
      'git',
      ['log', '-1', '--format=%cs', '--', ...relativePaths],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(stdout) ? stdout : '';
  } catch {
    return '';
  }
}

/** The newest of a set of YYYY-MM-DD strings, ignoring empty ones. */
export function newestDate(dates) {
  return dates.filter(Boolean).reduce((latest, date) => (date > latest ? date : latest), '');
}
