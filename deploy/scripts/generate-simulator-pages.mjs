#!/usr/bin/env node
/**
 * Builds the fifteen simulator documents from five templates.
 *
 * The simulators used to live as fifteen hand-authored pages: five tools, each
 * copied once per language and then edited in place. Every accessibility fix,
 * every asset version bump and every copy change had to be made three times,
 * and one of them had already drifted. The pages are now generated instead.
 *
 * Each simulator is one `content/simulators/<name>.html` template plus a
 * `<name>.i18n.json` sidecar. The template is ordinary, editable HTML in which
 * every string that differs between languages has been replaced by a
 * `{{key}}` placeholder; the sidecar holds `{ key: { en, es, pt } }`. Values
 * that differ only *because* of the language - the `lang` attribute, the
 * Open Graph locale, the path prefix in a canonical or a nav link - are not
 * translatable text, so they are written as `{{lang.field}}` and resolved from
 * the table below rather than carried three times in the sidecar.
 *
 * Substitution is a plain string replace, which is what makes the merge
 * trustworthy: the templates were derived from the original pages by aligning
 * the three language variants token by token, and expanding them reproduces
 * those pages byte for byte.
 *
 * The script is deliberately strict. An unknown placeholder, a key the sidecar
 * does not define, a language a key does not cover, or a `{{` left anywhere in
 * the output fails the build - a page published with a visible `{{title}}` is
 * worse than a build that stopped.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content/simulators');

const languages = ['en', 'es', 'pt'];

/**
 * Per-language values that are derived from the language itself. `home` is the
 * site root for that language - Spanish is served from `/`, so it is the one
 * that is not simply `/<code>/` - while `dir` is the directory the simulator
 * pages themselves live in, which is `/es/` for Spanish.
 *
 * `currency` is the symbol every money figure in that language's simulators
 * carries. The tools used to label all three languages in dollars, which read
 * as a conversion the reader then had to do in their head before the number
 * meant anything. It is a symbol, not a rate: the amounts are illustrative and
 * are deliberately the same in all three languages, so a Spanish reader sees
 * €5,000 where an English reader sees $5,000. It belongs here rather than in a
 * sidecar because it follows from the language and nobody translates it.
 *
 * `priceCurrency` is the ISO code for the same thing, for the SoftwareApplication
 * offer in each page's structured data. The tools are free, so the code only has
 * to agree with the symbol the page prints.
 */
const languageMeta = {
  en: { code: 'en', locale: 'en_US', home: '/en/', dir: '/en/', currency: '$', priceCurrency: 'USD' },
  es: { code: 'es', locale: 'es_ES', home: '/', dir: '/es/', currency: '€', priceCurrency: 'EUR' },
  pt: { code: 'pt', locale: 'pt_PT', home: '/pt/', dir: '/pt/', currency: 'R$', priceCurrency: 'BRL' }
};

/**
 * Template name -> output path, with `{lang}` standing in for the language.
 *
 * `leaderboard` marks the three tools that rank a score, and so the three that
 * link assets/js/sim-leaderboard.js - the shared client for the board every
 * visitor sees. The Freedom Calendar and the Market Time Machine produce no
 * score to rank, so they do not carry the request.
 *
 * There is deliberately no flag for charting. Four of the five draw with
 * Chart.js and want assets/js/sim-chart-theme.js for the defaults it sets; the
 * fifth, the Monte Carlo cockpit, draws on a raw canvas and loads no Chart.js
 * at all, but reads the same series palette from the object that file
 * publishes. So all five link it, and a flag distinguishing them would have to
 * be true in every row.
 */
const simulators = [
  { name: 'simulator-hub', output: '{lang}/simulator.html', leaderboard: true },
  { name: 'freedom-calendar', output: '{lang}/simulators/freedom-calendar.html' },
  { name: 'market-time-machine', output: '{lang}/simulators/market-time-machine.html' },
  { name: 'monte-carlo-fire', output: '{lang}/simulators/monte-carlo-fire.html', leaderboard: true },
  { name: 'passive-income-engine', output: '{lang}/simulators/passive-income-engine.html', leaderboard: true }
];

const placeholderPattern = /\{\{([^{}]+)\}\}/g;

/**
 * The behaviour block at the end of each template: a bare `<script>` with no
 * attributes, holding a few hundred lines of simulator logic.
 *
 * It is authored inline because a simulator is one artefact - markup, styles
 * and behaviour describing the same thing - and splitting the source would make
 * it harder to edit, not easier. It cannot ship inline: an inline block is
 * exactly what `script-src 'unsafe-inline'` exists to permit, and that keyword
 * is what stopped these pages having a Content-Security-Policy worth the name.
 * So the source stays whole and the build separates it: the block is lifted to
 * a file the policy can name, and the page links it.
 *
 * One file per language rather than one per simulator, because the block
 * contains translated strings like any other part of the template.
 */
const BEHAVIOUR_BLOCK = /\n[^\S\n]*<script>\n([\s\S]*?)\n[^\S\n]*<\/script>/g;

/**
 * `<script>document.write(new Date().getFullYear())</script>` in the footer of
 * two of the templates. It is inline script for a value that is a constant at
 * build time, it forces a synchronous parser stop to print four characters, and
 * document.write on a live document is the one API guaranteed to be worse than
 * whatever it replaced. The year is substituted here instead.
 */
const FOOTER_YEAR = /<script>document\.write\(new Date\(\)\.getFullYear\(\)\)<\/script>/g;

function resolvePlaceholder(token, language, strings, context) {
  if (token.startsWith('lang.')) {
    const field = token.slice('lang.'.length);
    const value = languageMeta[language][field];
    if (value === undefined) {
      throw new Error(
        `${context} uses {{${token}}}, but "${field}" is not a field of the ` +
          `language table. Known fields: ${Object.keys(languageMeta[language]).join(', ')}.`
      );
    }
    return value;
  }

  const entry = strings[token];
  if (entry === undefined) {
    throw new Error(
      `${context} uses {{${token}}}, but the key is not defined in its ` +
        `.i18n.json sidecar. Add it there, or remove the placeholder.`
    );
  }
  const value = entry[language];
  if (typeof value !== 'string') {
    throw new Error(
      `${context}: translation key "${token}" has no "${language}" value. ` +
        `Every key must cover all ${languages.length} languages (${languages.join(', ')}).`
    );
  }
  return value;
}

function render(template, language, strings, context) {
  const rendered = template.replace(placeholderPattern, (_match, token) =>
    resolvePlaceholder(token.trim(), language, strings, context)
  );

  // Translations are inserted verbatim, so a stray brace in one of them would
  // survive the pass above rather than being resolved. Catch it here.
  const leftover = rendered.match(placeholderPattern);
  if (leftover) {
    throw new Error(
      `${context} still contains ${leftover[0]} after substitution. A ` +
        `translation value most likely contains a literal "{{".`
    );
  }
  return rendered;
}

async function readSidecar(name) {
  const file = path.join(contentDir, `${name}.i18n.json`);
  const raw = await fs.readFile(file, 'utf8');
  let strings;
  try {
    strings = JSON.parse(raw);
  } catch (error) {
    throw new Error(`content/simulators/${name}.i18n.json is not valid JSON: ${error.message}`);
  }
  for (const [key, value] of Object.entries(strings)) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(
        `content/simulators/${name}.i18n.json: key "${key}" must map to an ` +
          `object of language codes, not ${Array.isArray(value) ? 'an array' : typeof value}.`
      );
    }
  }
  return strings;
}

function behaviourFileName(name, language) {
  return `sim-${name}.${language}.js`;
}

/**
 * Splits a rendered page into the markup that ships and the behaviour that
 * moves to its own file.
 *
 * Exactly one behaviour block is expected. Concatenating several would work,
 * but a template that grew a second one is a template somebody restructured,
 * and silently merging the two is how the order they ran in stops being
 * something anybody checked.
 *
 * The replacement carries `defer` so it still runs after the document is
 * parsed, which is what the inline block at the end of <body> did. `?v=source`
 * is the placeholder version-assets.mjs resolves to the file's content hash at
 * the end of the build, the same as every other asset.
 *
 * sim-actions.js is linked alongside it, and first: it is what gives the
 * `data-onclick` attributes in the markup their meaning, and it is the same
 * file on all fifteen pages. Both are deferred, so both run after parsing and
 * in source order - the dispatcher only ever looks a function up at the moment
 * an event fires, so the order between them does not actually matter, but
 * declaring the shared piece first is how the pages read.
 *
 * sim-leaderboard.js joins them on the three tools that rank a score. It is
 * shared for the same reason sim-actions.js is - it carries no translated
 * string, only the calls to /api/simulator-leaderboard - and it is deferred
 * ahead of the behaviour bundle because that bundle calls into it. Ordering is
 * again not load-critical: nothing runs at parse time, and the first call comes
 * from a click or from the end of a run.
 *
 * sim-footer.js and sim-chart-theme.js are linked on every page and on the four
 * charting pages respectively, and here rather than in the templates because
 * that is the whole point of the list above: a shared asset that five templates
 * each have to remember to link is a shared asset that four of them will link.
 *
 * sim-chart-theme.js is the one link whose position matters. It sets defaults
 * on `window.Chart`, so it has to run after the library, and the library is
 * loaded `defer` from <head>. Deferred scripts run in document order regardless
 * of where in the document they are, so a deferred tag at the end of <body>
 * runs after a deferred tag in <head> - which is why it goes here and not in
 * the head next to Chart.js, where it would have to be ordered by hand. It is
 * emitted before the behaviour bundle because that bundle constructs the charts
 * the defaults are meant to apply to, and Chart reads its defaults at
 * construction time, not at draw time.
 */
function liftBehaviour(page, simulator, language, context) {
  const { name } = simulator;
  const blocks = [...page.matchAll(BEHAVIOUR_BLOCK)];
  if (blocks.length !== 1) {
    throw new Error(
      `${context} has ${blocks.length} inline <script> blocks; expected exactly one. ` +
        `The behaviour has to be liftable to a file for the page to be servable ` +
        `without script-src 'unsafe-inline'.`
    );
  }

  const [block] = blocks;
  const tag =
    `\n    <script src="/assets/js/sim-actions.js?v=source" defer></script>` +
    `\n    <script src="/assets/js/sim-footer.js?v=source" defer></script>` +
    (simulator.leaderboard
      ? `\n    <script src="/assets/js/sim-leaderboard.js?v=source" defer></script>`
      : '') +
    `\n    <script src="/assets/js/sim-chart-theme.js?v=source" defer></script>` +
    `\n    <script src="/assets/js/${behaviourFileName(name, language)}?v=source" defer></script>`;
  const markup = page
    .replace(BEHAVIOUR_BLOCK, tag)
    .replace(FOOTER_YEAR, String(new Date().getFullYear()));

  return { markup, behaviour: `${block[1].trim()}\n` };
}

async function main() {
  let written = 0;
  let lifted = 0;

  for (const simulator of simulators) {
    const templateFile = path.join(contentDir, `${simulator.name}.html`);
    const template = await fs.readFile(templateFile, 'utf8');
    const strings = await readSidecar(simulator.name);

    const usedKeys = new Set();
    for (const [, token] of template.matchAll(placeholderPattern)) {
      const key = token.trim();
      if (!key.startsWith('lang.')) usedKeys.add(key);
    }
    const orphans = Object.keys(strings).filter((key) => !usedKeys.has(key));
    if (orphans.length > 0) {
      throw new Error(
        `content/simulators/${simulator.name}.i18n.json defines ` +
          `${orphans.length} key(s) the template never uses ` +
          `(${orphans.slice(0, 5).join(', ')}${orphans.length > 5 ? ', …' : ''}). ` +
          `Delete them so the sidecar stays a faithful index of the template.`
      );
    }

    for (const language of languages) {
      const context = `content/simulators/${simulator.name}.html (${language})`;
      const page = render(template, language, strings, context);

      const { markup, behaviour } = liftBehaviour(page, simulator, language, context);

      const scriptFile = path.join(root, 'assets', 'js', behaviourFileName(simulator.name, language));
      await fs.mkdir(path.dirname(scriptFile), { recursive: true });
      await fs.writeFile(scriptFile, behaviour);
      lifted += 1;

      const file = path.join(root, simulator.output.replace('{lang}', language));
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, markup);
      written += 1;
    }

    console.log(
      `Generated ${simulator.name} in ${languages.length} languages — ` +
        `${usedKeys.size} translated strings, ${Math.round(template.length / 1024)} KB template.`
    );
  }

  console.log(`Generated ${written} simulator documents from ${simulators.length} templates, and lifted ${lifted} behaviour bundles out of them.`);
}

main().catch((error) => {
  console.error(`generate-simulator-pages: ${error.message}`);
  process.exitCode = 1;
});
