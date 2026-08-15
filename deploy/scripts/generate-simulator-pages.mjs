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
 */
const languageMeta = {
  en: { code: 'en', locale: 'en_US', home: '/en/', dir: '/en/' },
  es: { code: 'es', locale: 'es_ES', home: '/', dir: '/es/' },
  pt: { code: 'pt', locale: 'pt_PT', home: '/pt/', dir: '/pt/' }
};

/** Template name -> output path, with `{lang}` standing in for the language. */
const simulators = [
  { name: 'simulator-hub', output: '{lang}/simulator.html' },
  { name: 'freedom-calendar', output: '{lang}/simulators/freedom-calendar.html' },
  { name: 'market-time-machine', output: '{lang}/simulators/market-time-machine.html' },
  { name: 'monte-carlo-fire', output: '{lang}/simulators/monte-carlo-fire.html' },
  { name: 'passive-income-engine', output: '{lang}/simulators/passive-income-engine.html' }
];

const placeholderPattern = /\{\{([^{}]+)\}\}/g;

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

async function main() {
  let written = 0;

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

      const file = path.join(root, simulator.output.replace('{lang}', language));
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, page);
      written += 1;
    }

    console.log(
      `Generated ${simulator.name} in ${languages.length} languages — ` +
        `${usedKeys.size} translated strings, ${Math.round(template.length / 1024)} KB template.`
    );
  }

  console.log(`Generated ${written} simulator documents from ${simulators.length} templates.`);
}

main().catch((error) => {
  console.error(`generate-simulator-pages: ${error.message}`);
  process.exitCode = 1;
});
