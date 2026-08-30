#!/usr/bin/env node
/**
 * Checks the invariants the generators are supposed to maintain, against the
 * files they actually wrote.
 *
 * Each of these has already been broken once. The journal indexes carried
 * hand-bumped `?v=20260815-1` tokens for months, because they are patched in
 * place rather than rendered from a template and so were never rewritten.
 * `simulator-cta.css` had no caching rule because `/assets/css/sim-*.css` looks
 * like it covers it and does not. Two of the five simulators disagreed with
 * their own translation file about what `<html lang>` should say.
 *
 * None of those is visible in a diff and none of them fails a build. They were
 * found by reading the output. This script reads the output on every build
 * instead, and fails when it finds them - which is the only difference between
 * a convention and a rule.
 *
 * It runs last, after version-assets.mjs, because two of the checks are about
 * what that step produced.
 *
 * The duplicate-URL check was added after Search Console reported 39 URLs it
 * had declined to index. Half of them were the same pages twice: Netlify serves
 * a directory and the index.html inside it as two separate 200s, and a .html
 * file with and without its extension as two more, so all 36 published pages
 * had a second address that nothing linked and nothing forbade.
 *
 * The result-panel check was added after the panel the five simulators end on
 * shipped and never appeared, on any page, in any language. That particular
 * cause was a script-ordering bug in sim-cta.js and is fixed in sim-cta.js;
 * what this checks is the structural half of it, which nothing else would
 * notice. The panel is markup containing no sentences - every word a visitor
 * reads is written into it at runtime from a per-language copy bundle - so a
 * page that ships the panel without linking the bundle is a page with a working,
 * permanently empty call to action, and it looks completely fine in a diff.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Where published pages live. Everything else in the repo is build input. */
const PAGE_ROOTS = ['index.html', '404.html', 'en', 'es', 'pt'];

/** Spanish is the apex language, so a page outside /en/ or /pt/ is Spanish. */
const DEFAULT_LANGUAGE = 'es';
const LANGUAGES = new Set(['en', 'es', 'pt']);

/** Any `/assets/...` URL a page references, with whatever version it carries. */
const ASSET_REFERENCE = /["'(]((?:\/assets\/)[^"'()\s]+)["')\s]/g;

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

/**
 * The path patterns in _headers, in file order. Netlify treats `*` as a
 * wildcard that spans path separators and `:name` as a single segment; both are
 * translated here rather than matched literally, because a rule that looks like
 * it covers a file and does not is exactly the bug this check exists to catch.
 */
async function headerPatterns() {
  const source = await fs.readFile(path.join(root, '_headers'), 'utf8');
  return source
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.startsWith('/'))
    .map((pattern) => ({
      pattern,
      matcher: new RegExp(`^${pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/:[A-Za-z_][A-Za-z0-9_]*/g, '[^/]+')}$`)
    }));
}

/**
 * The source paths of every forced permanent redirect in _redirects.
 *
 * Only forced 301s count. An unforced rule loses to a file that exists at the
 * same path, and every path this check cares about is one where a file does
 * exist - so an unforced rule there is a rule that never fires, which is
 * exactly the kind of silently-inert config this script exists to catch.
 *
 * A rule line is `from [conditions] to [status]`. Conditions are `key=value`
 * pairs and the destination is the first token after them, so the source is
 * simply the first token and the status is the last.
 */
async function forcedRedirectSources() {
  const source = await fs.readFile(path.join(root, '_redirects'), 'utf8');
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('/'))
    .map((line) => line.split(/\s+/))
    .filter((tokens) => tokens.length >= 2 && tokens[tokens.length - 1] === '301!')
    .map(([from]) => ({
      rule: from,
      matcher: new RegExp(`^${from
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/:[A-Za-z_][A-Za-z0-9_]*/g, '[^/]+')}$`)
    }));
}

/**
 * The second URL Netlify will serve a published file at, or null when it has
 * none. `<dir>/index.html` is also reachable as `/<dir>/index.html`, and
 * `<name>.html` is also reachable as `/<name>` - in both cases the first form
 * is the one the sitemap and the canonical tags declare.
 */
function duplicateUrlOf(page) {
  if (page === 'index.html') return '/index.html';
  if (page.endsWith('/index.html')) return `/${page}`;
  if (page.endsWith('.html')) return `/${page.slice(0, -'.html'.length)}`;
  return null;
}

/** The language a page's URL says it is in. */
function languageOfPage(page) {
  const first = page.split('/')[0];
  return LANGUAGES.has(first) && first !== page ? first : DEFAULT_LANGUAGE;
}

async function main() {
  const patterns = await headerPatterns();
  const redirects = await forcedRedirectSources();
  const problems = [];
  const declarations = new Map();
  let pages = 0;
  let references = 0;

  for await (const page of htmlPages()) {
    pages += 1;
    const markup = await fs.readFile(path.join(root, page), 'utf8');

    // 1. Every version token is a content hash.
    //
    // version-assets.mjs writes twelve hex characters and nothing else, so
    // anything of another shape was written by hand - and a hand-written
    // version on a file served immutable for a year goes stale silently the
    // first time somebody forgets to change it.
    for (const [, url] of markup.matchAll(ASSET_REFERENCE)) {
      references += 1;
      const version = url.match(/\?v=(.*)$/)?.[1];
      if (version !== undefined && !/^[0-9a-f]{12}$/.test(version)) {
        problems.push(`${page}: ${url} carries "?v=${version}", which is not a content hash.`);
      }
    }

    // 2. Every asset a page links has a caching rule.
    //
    // Without one the file falls through to the /* fallback and is revalidated
    // on every view - which costs a round trip per asset per page, and looks
    // identical to a file that is cached properly unless somebody reads the
    // response headers.
    for (const [, url] of markup.matchAll(ASSET_REFERENCE)) {
      const urlPath = url.split('?')[0];
      const rule = patterns.find(({ matcher }) => matcher.test(urlPath));
      // /assets/* exists only to set a CSP on directly-opened files; matching
      // it is not the same as having a Cache-Control rule, so it does not count.
      if (!rule || rule.pattern === '/assets/*') {
        problems.push(`${page}: ${urlPath} has no Cache-Control rule in _headers.`);
      }
    }

    // 3. The page agrees with its own URL about what language it is in.
    //
    // `<html lang>` is what a screen reader picks a voice from and what Google
    // reads before the hreflang cluster. A page under /pt/ that declares itself
    // Spanish is announced in the wrong accent and clusters with the wrong
    // siblings, and nothing on screen looks wrong.
    const declared = markup.match(/<html[^>]*\blang="([^"]+)"/)?.[1];
    const expected = languageOfPage(page);
    if (!declared) {
      problems.push(`${page}: <html> has no lang attribute.`);
    } else if (declared.split('-')[0] !== expected) {
      problems.push(`${page}: <html lang="${declared}"> but the page is served under /${expected}/.`);
    }

    // ...and with its hreflang cluster, where it has one. A self-referencing
    // hreflang is required for the cluster to be valid at all, and a page that
    // omits its own language from the set it declares is telling Google the
    // cluster does not include it.
    const hreflangs = [...markup.matchAll(/rel="alternate"\s+hreflang="([^"]+)"/g)].map(([, code]) => code);
    if (hreflangs.length > 0 && declared && !hreflangs.includes(declared.split('-')[0])) {
      problems.push(`${page}: declares hreflang ${hreflangs.join(', ')} but not its own language "${declared}".`);
    }

    // 4. The page has one URL, not two.
    //
    // Netlify serves `/en/blog/` and `/en/blog/index.html` as two separate
    // 200s, and `/en/simulator.html` and `/en/simulator` as two more. Nothing
    // links the second form of either and the canonical tags point at the
    // first, so this never looked like a bug - it looked like Search Console
    // reporting half the site as "alternate page with proper canonical tag"
    // and crawling the real pages half as often as it otherwise would.
    //
    // A page carrying `noindex` is exempt: a second address for a document no
    // index will ever hold costs nothing. That covers 404.html, which is the
    // fallback document rather than a page anybody navigates to.
    const duplicate = duplicateUrlOf(page);
    const indexable = !/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(markup);
    if (duplicate && indexable && !redirects.some(({ matcher }) => matcher.test(duplicate))) {
      problems.push(`${page}: also served at ${duplicate}, which no forced 301 in _redirects collapses.`);
    }

    // 6. A page carrying the result panel links the copy it is made of.
    //
    // Both files are needed and they are needed together: sim-cta.js is the
    // machinery and holds no prose, sim-cta.<language>.js is the prose and does
    // nothing on its own. Missing either leaves the panel hidden, which is
    // indistinguishable from a visitor who has not run the simulator yet.
    if (markup.includes('id="sim-cta-result"')) {
      for (const required of ['/assets/js/sim-cta.js', `/assets/js/sim-cta.${expected}.js`]) {
        if (!markup.includes(`"${required}?v=`) && !markup.includes(`"${required}"`)) {
          problems.push(`${page}: carries the result panel but does not link ${required}.`);
        }
      }
    }

    if (declared) {
      const seen = declarations.get(expected) || new Map();
      seen.set(declared, [...(seen.get(declared) || []), page]);
      declarations.set(expected, seen);
    }
  }

  // 5. One language, one declaration.
  //
  // "pt" and "pt-BR" are both valid, and a site is free to pick either. What it
  // cannot do is pick both: three of the five simulator pages said pt-BR and
  // the other two said pt, because the value came from a translation key that
  // only three of the five files defined. The result was one language split
  // across two hreflang clusters, which is invisible on screen and wrong to
  // every consumer that reads it.
  for (const [language, seen] of declarations) {
    if (seen.size < 2) continue;
    const shown = [...seen.entries()]
      .map(([value, files]) => `"${value}" (${files.length}: ${files.slice(0, 3).join(', ')}${files.length > 3 ? ', …' : ''})`)
      .join(' vs ');
    problems.push(`/${language}/ pages disagree about <html lang>: ${shown}.`);
  }

  if (problems.length) {
    console.error(`verify-output: ${problems.length} problem(s) in ${pages} page(s):`);
    problems.forEach((problem) => console.error(`  ${problem}`));
    throw new Error('The published output does not hold the invariants the generators are supposed to maintain.');
  }

  console.log(`verify-output: ${pages} pages, ${references} asset references, ${redirects.length} forced redirects. Versions, caching rules, canonical URLs, language declarations and result-panel copy all check out.`);
}

main().catch((error) => {
  console.error(`verify-output: ${error.message}`);
  process.exitCode = 1;
});
