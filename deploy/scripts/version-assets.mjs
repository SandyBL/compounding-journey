#!/usr/bin/env node
/**
 * Stamps each static asset's content hash into the pages that link it.
 *
 * `assets/styles.css` could never carry a hand-written version, because it does
 * not exist when the markup is authored: Tailwind compiles it at the end of the
 * build, after the generators have written the HTML it scans. Without a version
 * it had to be served with a short max-age, which meant a rebuilt bundle could
 * reach a returning visitor days after the markup that depended on it.
 *
 * The other stylesheets could carry one, and did - by hand, as dates like
 * `?v=20260815-1`. That only works while somebody remembers to bump them, and a
 * forgotten bump is invisible: the file is served from `_headers` as immutable
 * for a year, so the stale copy simply stays. The date tokens are gone; every
 * asset now uses the same placeholder.
 *
 * So the generated pages ship `?v=source` on any `/assets/...` URL, and this
 * script, which runs last, swaps it for the first twelve hex characters of that
 * file's SHA-256. Identical output produces an identical URL, so a build that
 * does not change a file does not invalidate anyone's cache; any change
 * produces a URL nobody has, which is what makes the immutable caching safe.
 *
 * Nothing has to be registered here: the placeholder names its own asset, so
 * linking a new file from a template is enough. The script is deliberately
 * strict - a missing or empty asset, or a build in which no placeholder was
 * found at all, fails rather than publishing URLs cached for a year.
 *
 * The match accepts an already-stamped hash as well as the placeholder, which
 * makes this step idempotent: running it twice recomputes the same hash rather
 * than finding nothing to do. That is what lets pages which are edited in place
 * rather than rendered from a template - the three journal indexes, and 404.html
 * - take part. Those files live in the repository carrying `?v=source`, the
 * build stamps them, and the next build starts from the committed placeholder
 * again; a local build that stamps a working copy is now equally harmless,
 * because a stamped file is still a file this script can read.
 *
 * Stylesheets are stamped too, and first. A page cannot version a font on its
 * own: the `<link rel="preload">` in the head and the `src: url(...)` in the
 * @font-face have to be the same string or the browser downloads the file
 * twice, and only one of those two lives in HTML. Doing the stylesheets in a
 * pass of their own, before any page hash is taken, means both sides get the
 * same hash of the same font file, and the stylesheet's own hash is taken from
 * the copy that will actually be served.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Pages that may carry placeholders. 404.html is hand-authored; the rest are generated. */
const PAGE_ROOTS = ['index.html', '404.html', 'en', 'es', 'pt'];

/**
 * `/assets/<anything>?v=source`, or the same URL already carrying a hash. Both
 * are rewritten from the file on disk, so this step is idempotent and safe to
 * run over a page that a previous local build already stamped.
 */
const PLACEHOLDER = /(\/assets\/[^"'?\s]+)\?v=(?:source|[0-9a-f]{12})/g;

/** The same URL carrying anything else - a hand-written version this script rejects. */
const HAND_VERSIONED = /\/assets\/[^"'?\s]+\?v=(?!source\b|[0-9a-f]{12}\b)[^"'\s>]*/g;

async function hashOf(relativePath) {
  const absolute = path.join(root, relativePath);
  let contents;
  try {
    contents = await fs.readFile(absolute);
  } catch (error) {
    throw new Error(
      `Cannot version ${relativePath}: the file is missing. This step runs after ` +
        `the CSS build, so a missing bundle means an earlier build step failed ` +
        `silently. (${error.code ?? error.message})`,
    );
  }
  if (contents.length === 0) {
    throw new Error(`Cannot version ${relativePath}: the file is empty.`);
  }
  return createHash('sha256').update(contents).digest('hex').slice(0, 12);
}

async function* htmlPages() {
  for (const entry of PAGE_ROOTS) {
    const absolute = path.join(root, entry);
    const stats = await fs.stat(absolute).catch(() => null);
    if (!stats) continue;
    if (stats.isFile()) { yield entry; continue; }
    for (const found of await fs.readdir(absolute, { recursive: true, withFileTypes: true })) {
      if (found.isFile() && found.name.endsWith('.html')) {
        yield path.relative(root, path.join(found.parentPath ?? found.path, found.name));
      }
    }
  }
}

async function* styleSheets() {
  const directory = path.join(root, 'assets', 'css');
  for (const found of await fs.readdir(directory, { withFileTypes: true })) {
    if (found.isFile() && found.name.endsWith('.css')) yield path.join('assets', 'css', found.name);
  }
}

/**
 * Rewrites every placeholder in one file and returns how many it found. Shared
 * by both passes, so a font linked from a stylesheet and a font preloaded from
 * a page are hashed by the same code from the same bytes.
 */
async function stamp(file, hashes, stale) {
  const absolute = path.join(root, file);
  const source = await fs.readFile(absolute, 'utf8');
  const wanted = [...source.matchAll(PLACEHOLDER)].map((match) => match[1]);

  // A token this script did not write is a hand-maintained version - the
  // failure mode that motivated the placeholder. Collect them all before
  // failing, so one build reports every file that needs converting.
  for (const [token] of source.matchAll(HAND_VERSIONED)) stale.push(`${file}: ${token}`);

  if (wanted.length === 0) return { assets: 0, links: 0 };

  for (const asset of new Set(wanted)) {
    if (!hashes.has(asset)) hashes.set(asset, await hashOf(asset.replace(/^\//, '')));
  }

  const stamped = source.replace(PLACEHOLDER, (_match, asset) => `${asset}?v=${hashes.get(asset)}`);
  if (stamped !== source) await fs.writeFile(absolute, stamped);
  return { assets: new Set(wanted).size, links: wanted.length };
}

async function main() {
  const hashes = new Map();
  const stale = [];
  let total = 0;

  // Stylesheets first. Only the font links in blog.css carry a placeholder
  // today; the Tailwind bundles have none and pass through untouched. This has
  // to run before any page is read, because a page's hash of a stylesheet must
  // be taken from the stamped copy rather than the one on the way in.
  for await (const sheet of styleSheets()) {
    const { assets, links } = await stamp(sheet, hashes, stale);
    if (links > 0) console.log(`Versioned ${sheet}: ${assets} asset(s), ${links} link(s).`);
  }

  for await (const page of htmlPages()) {
    const { assets, links } = await stamp(page, hashes, stale);
    if (links === 0) continue;
    total += links;
    console.log(`Versioned ${page}: ${assets} asset(s), ${links} link(s).`);
  }

  if (stale.length > 0) {
    throw new Error(
      `${stale.length} asset link(s) carry a hand-written version instead of ` +
        `"?v=source". Those are served immutable for a year and go stale the ` +
        `moment somebody forgets to bump them:\n  ${stale.join('\n  ')}`,
    );
  }

  // Nothing to stamp means the generators stopped emitting placeholders, which
  // would publish unversioned URLs under a year-long immutable cache.
  if (total === 0) {
    throw new Error(
      'No "?v=source" placeholders were found in any generated page. Either the ' +
        'generators no longer emit them, or this step ran before them.',
    );
  }
  console.log(`Stamped ${total} asset links across ${hashes.size} distinct files.`);
}

main().catch((error) => {
  console.error(`version-assets: ${error.message}`);
  process.exitCode = 1;
});
