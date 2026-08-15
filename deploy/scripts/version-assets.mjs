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
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Generated pages that may carry placeholders. 404.html is deliberately absent:
 * it is hand-authored and lives in the repository, so rewriting it in place
 * would consume its own token and leave nothing to stamp on the next build.
 */
const PAGE_ROOTS = ['index.html', 'en', 'es', 'pt'];

/** `/assets/<anything>?v=source` - the placeholder this script resolves. */
const PLACEHOLDER = /(\/assets\/[^"'?\s]+)\?v=source/g;

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

async function main() {
  const hashes = new Map();
  let total = 0;

  for await (const page of htmlPages()) {
    const absolute = path.join(root, page);
    const markup = await fs.readFile(absolute, 'utf8');
    const wanted = [...markup.matchAll(PLACEHOLDER)].map((match) => match[1]);
    if (wanted.length === 0) continue;

    for (const asset of new Set(wanted)) {
      if (!hashes.has(asset)) hashes.set(asset, await hashOf(asset.replace(/^\//, '')));
    }

    const stamped = markup.replace(PLACEHOLDER, (_match, asset) => `${asset}?v=${hashes.get(asset)}`);
    await fs.writeFile(absolute, stamped);
    total += wanted.length;
    console.log(`Versioned ${page}: ${new Set(wanted).size} asset(s), ${wanted.length} link(s).`);
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
