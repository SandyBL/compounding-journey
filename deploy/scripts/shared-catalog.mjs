// Where the full blog catalog lives while the build is running.
//
// The catalog is every article in every language with its complete body text -
// 74 KB - and it exists so that generate-blog-pages.mjs and
// generate-llms-txt.mjs can read one file instead of re-parsing every Markdown
// source twice. It is build input and nothing else: the journal index fetches
// the per-language catalogs, which are 1.8 KB each and carry six fields per
// article.
//
// It used to be written to content/blog/catalog.json, which is inside the
// publish directory - this project publishes the repository root - so a purely
// internal build artifact was uploaded and served with every deploy. It was
// marked no-store and noindex, so nothing indexed it, but "nobody should fetch
// this" is a weaker position than not publishing it, and it is the only copy of
// every article body that the site hands out in one request.
//
// The temporary directory is outside the publish root by definition, which is
// the property being bought here. The build chain runs its steps in one shell on
// one machine, so the writer and the two readers agree on the path; two builds
// of this repository running concurrently on the same machine would share the
// file, which is exactly what they did when it lived in content/blog.
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const sharedCatalogFile = path.join(os.tmpdir(), 'compounding-journey-build', 'blog-catalog.json');

export async function writeSharedCatalog(catalog) {
  await fs.mkdir(path.dirname(sharedCatalogFile), { recursive: true });
  await fs.writeFile(sharedCatalogFile, `${JSON.stringify(catalog, null, 2)}\n`);
}

// Fails loudly rather than falling back to an empty catalog. A build that
// silently generated a sitemap with no articles in it, or an llms.txt that
// described a site with an empty journal, would deploy and look fine.
export async function readSharedCatalog() {
  try {
    return JSON.parse(await fs.readFile(sharedCatalogFile, 'utf8'));
  } catch (error) {
    throw new Error(
      `The blog catalog is not at ${sharedCatalogFile}. `
      + 'It is written by scripts/generate-blog-catalog.mjs, which runs first in the '
      + `build chain - run that before this script. (${error.message})`
    );
  }
}
