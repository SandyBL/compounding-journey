#!/usr/bin/env node
/**
 * Writes one web app manifest per language and links it from every page.
 *
 * The site is three sites sharing a domain: Spanish at `/`, English at `/en/`,
 * Portuguese at `/pt/`. A single manifest at the root would name one of them
 * and mislabel the other two - a reader who installs from the Portuguese
 * journal would get a shortcut named in Spanish, opening the Spanish home. So
 * there is one manifest per language, and each page links its own.
 *
 * The icons are generated on demand by the Netlify Image CDN from the same
 * 2048px source PNG the favicon and the Open Graph image already come from.
 * That is deliberate: a manifest is exactly the kind of file that acquires a
 * set of hand-exported PNGs which then drift from the logo they were cut from.
 * Asking the CDN for 192 and 512 means one source file stays the only source
 * file, and replacing the logo replaces the app icon with it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Where published pages live. Matches version-assets.mjs and verify-output.mjs. */
const PAGE_ROOTS = ['index.html', '404.html', 'en', 'es', 'pt'];

const DEFAULT_LANGUAGE = 'es';
const LANGUAGES = ['en', 'es', 'pt'];

/**
 * forestgreen from tailwind.config.js, which is the header, the buttons and the
 * footer. theme_color is what a browser paints the title bar and the task
 * switcher entry with, so it should be the colour somebody would describe the
 * site as; background_color is what fills the window for the moment before the
 * first paint, so it is the page background instead - anything else shows as a
 * flash of the wrong colour on every launch.
 */
const THEME_COLOR = '#1E4620';
const BACKGROUND_COLOR = '#FAF6ED';

const ICON_SOURCE = '/logo-compounding-journey.png';

const MANIFESTS = {
  en: {
    name: 'Compounding Journey',
    short_name: 'Compounding',
    description: 'Your map to financial freedom: essays, calculators and simulators on compounding, saving and investing for the long term.',
    start_url: '/en/',
    // The manifest's scope decides which URLs stay inside the installed window
    // rather than bouncing out to the browser. English lives entirely under
    // /en/, so that directory is the whole of it.
    scope: '/en/'
  },
  es: {
    name: 'El viaje del Crecimiento Compuesto',
    short_name: 'Crecimiento',
    description: 'Tu mapa hacia la libertad financiera: ensayos, calculadoras y simuladores sobre interés compuesto, ahorro e inversión a largo plazo.',
    start_url: '/',
    // Spanish is the one language whose pages are not all under one prefix: the
    // home page is the apex and the journal is under /es/. "/" is the only scope
    // that contains both. It also contains /en/ and /pt/, which is a real
    // consequence of publishing Spanish at the apex rather than an oversight -
    // and it costs nothing, because a reader installs one language, not three.
    scope: '/'
  },
  pt: {
    name: 'A Jornada de Crescimento Composto',
    short_name: 'Crescimento',
    description: 'O teu mapa para a liberdade financeira: ensaios, calculadoras e simuladores sobre juros compostos, poupança e investimento a longo prazo.',
    start_url: '/pt/',
    scope: '/pt/'
  }
};

/**
 * The block this script owns in each page's <head>. Written between markers so
 * a rebuild replaces it rather than appending a second copy - the same way the
 * journal indexes are patched.
 */
const BLOCK = /[^\S\n]*<!--manifest:start-->[\s\S]*?<!--manifest:end-->\n?/;

function icon(size) {
  return {
    src: `/.netlify/images?url=${ICON_SOURCE}&w=${size}&h=${size}&fit=cover&fm=png`,
    sizes: `${size}x${size}`,
    type: 'image/png',
    // "any" and "maskable" are declared on the same file. The logo is a centred
    // mark on a full-bleed field, so the safe zone a maskable icon has to keep
    // clear is already clear, and a platform that crops it to a circle crops
    // background rather than artwork.
    purpose: 'any maskable'
  };
}

function manifestFor(language) {
  const entry = MANIFESTS[language];
  return `${JSON.stringify(
    {
      name: entry.name,
      short_name: entry.short_name,
      description: entry.description,
      lang: language,
      dir: 'ltr',
      start_url: entry.start_url,
      scope: entry.scope,
      // Standalone rather than fullscreen: the simulators are long documents
      // with their own navigation, and taking the status bar away from a page
      // somebody reads for ten minutes gains nothing.
      display: 'standalone',
      theme_color: THEME_COLOR,
      background_color: BACKGROUND_COLOR,
      icons: [icon(192), icon(512)]
    },
    null,
    2
  )}\n`;
}

/** The language a page's URL says it is in. Same rule as verify-output.mjs. */
function languageOfPage(page) {
  const first = page.split('/')[0];
  return LANGUAGES.includes(first) && first !== page ? first : DEFAULT_LANGUAGE;
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

function blockFor(language) {
  return (
    '    <!--manifest:start-->\n' +
    `    <link rel="manifest" href="/manifest.${language}.webmanifest">\n` +
    `    <meta name="theme-color" content="${THEME_COLOR}">\n` +
    '    <!--manifest:end-->\n'
  );
}

async function main() {
  for (const language of LANGUAGES) {
    await fs.writeFile(path.join(root, `manifest.${language}.webmanifest`), manifestFor(language));
  }

  let linked = 0;
  let unchanged = 0;

  for await (const page of htmlPages()) {
    const file = path.join(root, page);
    const markup = await fs.readFile(file, 'utf8');
    const block = blockFor(languageOfPage(page));

    let patched;
    if (BLOCK.test(markup)) {
      patched = markup.replace(BLOCK, block);
    } else if (markup.includes('</head>')) {
      // Some pages close <head> on the same line as the tag before it, so the
      // block gets its own line rather than being appended to whatever is there.
      patched = markup.replace(/([^\S\n]*)<\/head>/, (match, indent, offset) => {
        const lead = /\n[^\S\n]*$/.test(markup.slice(0, offset + indent.length)) ? '' : '\n';
        return `${lead}${block}${indent}</head>`;
      });
    } else {
      // Every published page is a document. One without a <head> is a generator
      // that changed shape, and silently skipping it would mean a page quietly
      // losing its manifest for as long as nobody looked.
      throw new Error(`${page} has no </head> to link the manifest from.`);
    }

    if (patched === markup) { unchanged += 1; continue; }
    await fs.writeFile(file, patched);
    linked += 1;
  }

  console.log(
    `Wrote ${LANGUAGES.length} web app manifests and linked them from ${linked + unchanged} pages ` +
      `(${linked} updated, ${unchanged} already current).`
  );
}

main().catch((error) => {
  console.error(`generate-manifests: ${error.message}`);
  process.exitCode = 1;
});
