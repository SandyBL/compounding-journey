#!/usr/bin/env node
/**
 * Stamps the compiled Tailwind bundle's content hash into the pages that link
 * it.
 *
 * `assets/styles.css` is the one stylesheet on the site that cannot carry a
 * hand-written version, because it does not exist when the markup is authored:
 * Tailwind compiles it at the end of the build, after the generators have
 * written the HTML it scans. Without a version it had to be served with a short
 * max-age, which meant a rebuilt bundle could reach a returning visitor days
 * after the markup that depended on it.
 *
 * So the generated pages ship a placeholder - `?v=source` - and this script,
 * which runs last, swaps it for the first twelve hex characters of the bundle's
 * SHA-256. Identical output produces an identical URL, so a build that does not
 * change the CSS does not invalidate anyone's cache; any change produces a URL
 * nobody has, which is what makes the immutable caching in _headers safe.
 *
 * The script is deliberately strict. A page that still holds the placeholder
 * after this ran, or a missing bundle, fails the build rather than publishing
 * markup that points at an unversioned URL cached for a year.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Files whose contents are hashed, and the token each one's hash replaces. */
const VERSIONED_ASSETS = [
  { asset: 'assets/styles.css', token: '/assets/styles.css?v=source' },
];

/** Pages the build generates, and which therefore carry the placeholders. */
const PAGES = ['index.html', 'en/index.html', 'pt/index.html'];

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

async function main() {
  const replacements = [];
  for (const { asset, token } of VERSIONED_ASSETS) {
    const hash = await hashOf(asset);
    replacements.push({ asset, token, hash, replacement: token.replace('source', hash) });
  }

  for (const page of PAGES) {
    const absolute = path.join(root, page);
    let markup = await fs.readFile(absolute, 'utf8');
    const stamped = [];

    for (const { asset, token, hash, replacement } of replacements) {
      if (!markup.includes(token)) {
        throw new Error(
          `${page} does not contain the placeholder "${token}". The page is ` +
            `generated from content/home/index.html, so the template has most ` +
            `likely been edited to link ${asset} without its version token.`,
        );
      }
      markup = markup.split(token).join(replacement);
      stamped.push(`${asset} -> ${hash}`);
    }

    await fs.writeFile(absolute, markup);
    console.log(`Versioned ${page}: ${stamped.join(', ')}`);
  }
}

main().catch((error) => {
  console.error(`version-assets: ${error.message}`);
  process.exitCode = 1;
});
