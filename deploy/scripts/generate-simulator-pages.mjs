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

// The nav the rest of the site carries. The simulators are the fourth family to
// render it and the only one whose markup is hand-authored HTML rather than a
// template literal, so it arrives here as a {{lang.sectionNav}} substitution
// like every other value that follows from the language.
import { NAV_SCRIPT, sectionNav } from './section-nav.mjs';
import { SIMULATORS, dataPath, legalPath, simulatorPath, simulatorsPath } from './site-routes.mjs';

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
  en: { code: 'en', locale: 'en_US', home: '/en/', dir: '/en/', currency: '$', priceCurrency: 'USD', notice: legalPath('notice', 'en'), data: dataPath('en'), privacy: legalPath('privacy', 'en'), simulators: simulatorsPath('en') },
  es: { code: 'es', locale: 'es_ES', home: '/', dir: '/es/', currency: '€', priceCurrency: 'EUR', notice: legalPath('notice', 'es'), data: dataPath('es'), privacy: legalPath('privacy', 'es'), simulators: simulatorsPath('es') },
  pt: { code: 'pt', locale: 'pt_PT', home: '/pt/', dir: '/pt/', currency: 'R$', priceCurrency: 'BRL', notice: legalPath('notice', 'pt'), data: dataPath('pt'), privacy: legalPath('privacy', 'pt'), simulators: simulatorsPath('pt') }
};

/**
 * Strings that must read identically on all five simulators, written as
 * `{{shared.key}}` and resolved from here rather than from a sidecar.
 *
 * The compliance notice is the case this exists for. It is the same sentence on
 * every tool, and the five sidecars would have carried five copies of it - which
 * is the arrangement that produced three different footers saying the same thing
 * (see the footer comment in any of the templates). A legal statement that
 * drifts between pages is worse than a long one: whichever copy somebody quotes
 * back, one of the others contradicts it.
 *
 * The wording is the same claim content/site/site.i18n.json makes on the
 * calculator, template and glossary pages, shortened to what a reader will
 * actually read above a tool. The full text lives at {{lang.notice}}, which is
 * the link the notice carries.
 *
 * Only put a string here if all five tools must agree on it. Anything that
 * describes one simulator belongs in that simulator's sidecar.
 */
const SHARED_STRINGS = {
  disclaimerTitle: {
    es: 'Contenido educativo, no asesoramiento financiero',
    en: 'Educational content, not financial advice',
    pt: 'Conteúdo educativo, não é consultoria financeira'
  },
  disclaimerBody: {
    es: 'Sandy Bradbury es educador financiero, no asesor financiero acreditado. Este simulador es una herramienta educativa: sus resultados son estimaciones ilustrativas calculadas a partir de los supuestos que introduces, no predicen rentabilidades reales y no constituyen asesoramiento ni una recomendación para comprar o vender ningún producto.',
    en: 'Sandy Bradbury is a financial educator, not an accredited financial adviser. This simulator is an educational tool: its results are illustrative estimates calculated from the assumptions you enter, they do not predict real returns, and they are not advice or a recommendation to buy or sell any product.',
    pt: 'Sandy Bradbury é educador financeiro, não é consultor financeiro acreditado. Este simulador é uma ferramenta educativa: os resultados são estimativas ilustrativas calculadas a partir dos pressupostos que introduzes, não preveem rentabilidades reais e não constituem consultoria nem uma recomendação de compra ou venda de qualquer produto.'
  },
  disclaimerLink: {
    es: 'Leer el aviso legal completo',
    en: 'Read the full legal notice',
    pt: 'Ler o aviso legal completo'
  },

  /*
   * The opt-in that turns a private run into one row of a public data set.
   *
   * It appears on the Freedom Calendar and the Market Time Machine, the two
   * tools that rank nothing and so had no reason to send anything anywhere. The
   * copy is here rather than in the two sidecars because it is the same offer in
   * both places and it has to keep being the same offer: the moment one of them
   * describes what is stored slightly differently from the other, one of them is
   * wrong about it.
   *
   * Every sentence of it is doing a specific job. The first says what is kept
   * (the settings, not the person). The second says what it is for, because "we
   * collect anonymous usage data" is what a tracker says and this is not that -
   * it feeds a page of results anybody can read. The button says what pressing
   * it does in the present tense. And the note underneath says the thing that
   * makes the offer fair rather than merely legal: nothing has been sent up to
   * this point, and nothing will be if the button is left alone.
   */
  contributeTitle: {
    es: 'Añade este escenario a los datos públicos',
    en: 'Add this scenario to the public data',
    pt: 'Adiciona este cenário aos dados públicos'
  },
  contributeBody: {
    es: 'Se guardan los ajustes de esta simulación y su resultado: los números que has puesto en el modelo, no datos sobre ti. Sin nombre, sin correo, sin identificador.',
    en: 'What gets stored is this simulation\u2019s settings and its result: the numbers you put into the model, not data about you. No name, no email, no identifier.',
    pt: 'Guardam-se os ajustes desta simulação e o seu resultado: os números que colocaste no modelo, não dados sobre ti. Sem nome, sem email, sem identificador.'
  },
  contributeWhy: {
    es: 'Con ellos se calculan las medias que publico, y cualquiera puede leerlas:',
    en: 'They are what the published averages are computed from, and anybody can read them:',
    pt: 'Com eles calculam-se as médias que publico, e qualquer pessoa pode lê-las:'
  },
  contributeWhyLink: {
    es: 'ver la página de resultados',
    en: 'see the results page',
    pt: 'ver a página de resultados'
  },
  contributeButton: {
    es: 'Añadir mi escenario',
    en: 'Add my scenario',
    pt: 'Adicionar o meu cenário'
  },
  contributeSending: {
    es: 'Enviando…',
    en: 'Sending…',
    pt: 'A enviar…'
  },
  contributeThanks: {
    es: 'Añadido. Gracias: las medias de la página de resultados incluyen ahora este escenario.',
    en: 'Added. Thank you \u2014 the averages on the results page now include this scenario.',
    pt: 'Adicionado. Obrigado: as médias da página de resultados incluem agora este cenário.'
  },
  contributeFailed: {
    es: 'No se ha podido enviar. Tu simulación no se ha perdido; puedes volver a intentarlo.',
    en: 'It could not be sent. Your simulation is not lost \u2014 you can try again.',
    pt: 'Não foi possível enviar. A tua simulação não se perdeu; podes tentar de novo.'
  },
  contributeNote: {
    es: 'Nada sale de tu navegador hasta que pulses el botón, y la herramienta funciona igual si no lo pulsas nunca.',
    en: 'Nothing leaves your browser until you press the button, and the tool works exactly the same if you never press it.',
    pt: 'Nada sai do teu navegador até premires o botão, e a ferramenta funciona da mesma forma se nunca o premires.'
  },
  contributePrivacyLink: {
    es: 'Cómo se tratan estos datos',
    en: 'How this data is handled',
    pt: 'Como estes dados são tratados'
  }
};

/**
 * The behaviour flags for each template, keyed by the name it is published
 * under in SIMULATORS in site-routes.mjs.
 *
 * The output paths used to be stated here as well. They moved to site-routes
 * with the rest of the site's URLs when the simulators index was added, because
 * the index, the sitemap and llms.txt all have to name the same five documents
 * this generator writes, and a table that says where a page goes is a routing
 * table wherever it happens to be declared.
 *
 * `leaderboard` marks the three tools that rank a score, and so the three that
 * link assets/js/sim-leaderboard.js - the shared client for the board every
 * visitor sees. The Freedom Calendar and the Market Time Machine produce no
 * score to rank, so they do not carry the request.
 *
 * `contribute` marks the other two - the pair that ranks nothing - and is what
 * links assets/js/sim-contribute.js, the button that offers to add a run to the
 * public data set. The two flags are mutually exclusive today and the code does
 * not require them to be: a tool could rank a score and also invite a
 * contribution, and nothing here would have to change if one did.
 *
 * There is deliberately no flag for charting. Four of the five draw with
 * Chart.js and want assets/js/sim-chart-theme.js for the defaults it sets; the
 * fifth, the Monte Carlo cockpit, draws on a raw canvas and loads no Chart.js
 * at all, but reads the same series palette from the object that file
 * publishes. So all five link it, and a flag distinguishing them would have to
 * be true in every row.
 */
const BEHAVIOUR = {
  'simulator-hub': { leaderboard: true },
  'freedom-calendar': { contribute: true },
  'market-time-machine': { contribute: true },
  'monte-carlo-fire': { leaderboard: true },
  'passive-income-engine': { leaderboard: true }
};

/**
 * One row per published simulator, in the order site-routes lists them, with
 * that simulator's flags folded in.
 *
 * Built here rather than written out, so the published set and the flagged set
 * cannot disagree: a simulator with no row in BEHAVIOUR would otherwise be
 * generated without its leaderboard or its contribute button - a page missing a
 * feature rather than a page missing - and a row naming a simulator that is not
 * published would be a flag nothing reads. Both fail the build instead, from
 * inside main() so the message arrives as a sentence rather than a stack.
 */
function publishedSimulators() {
  const unpublished = Object.keys(BEHAVIOUR).filter((name) => !SIMULATORS.some((item) => item.name === name));
  if (unpublished.length > 0) {
    throw new Error(
      `BEHAVIOUR names simulator(s) that site-routes does not publish: ${unpublished.join(', ')}. ` +
        `Add them to SIMULATORS in scripts/site-routes.mjs, or delete the row.`
    );
  }

  return SIMULATORS.map((simulator) => {
    const flags = BEHAVIOUR[simulator.name];
    if (!flags) {
      throw new Error(
        `No behaviour flags for "${simulator.name}". Add a row to BEHAVIOUR, or remove the simulator ` +
          `from SIMULATORS in scripts/site-routes.mjs.`
      );
    }
    return { ...simulator, ...flags };
  });
}

const placeholderPattern = /\{\{([^{}]+)\}\}/g;

/**
 * Values that follow from which of the fifteen documents is being rendered,
 * written as `{{page.field}}`. There is one: the site's section nav.
 *
 * It cannot be a `{{lang.*}}` value even though all fifteen pages are in the
 * same section, because the nav marks its current tab differently depending on
 * whether that tab links to this page or to the landing page above it. None of
 * the five is that landing page any more - the Simuladores tab points at the
 * index in /<lang>/simulators/ - so all fifteen currently take the weaker
 * value, and the strong one is one URL change away. See currentAttribute() in
 * section-nav.mjs.
 *
 * Only the strip below the header, not the footer row an article also carries:
 * a simulator's footer is a bar that slides in over the tool with a call to
 * action in it, and seven more links in there would compete with the one thing
 * that bar exists to offer.
 */
function pageValues(simulator, language) {
  return { sectionNav: sectionNav('simulators', language, simulatorPath(simulator.name, language)) };
}

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

function resolvePlaceholder(token, language, strings, context, page) {
  if (token.startsWith('page.')) {
    const field = token.slice('page.'.length);
    const value = page[field];
    if (value === undefined) {
      throw new Error(
        `${context} uses {{${token}}}, but "${field}" is not a field of the ` +
          `per-page table. Known fields: ${Object.keys(page).join(', ')}.`
      );
    }
    return value;
  }

  if (token.startsWith('shared.')) {
    const key = token.slice('shared.'.length);
    const entry = SHARED_STRINGS[key];
    if (!entry) {
      throw new Error(
        `${context} uses {{${token}}}, but "${key}" is not in the shared string ` +
          `table. Known shared keys: ${Object.keys(SHARED_STRINGS).join(', ')}.`
      );
    }
    const value = entry[language];
    if (typeof value !== 'string') {
      throw new Error(`${context}: shared string "${key}" has no "${language}" value.`);
    }
    return value;
  }

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

function render(template, language, strings, context, page) {
  const rendered = template.replace(placeholderPattern, (_match, token) =>
    resolvePlaceholder(token.trim(), language, strings, context, page)
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
 * sim-contribute.js joins them on the two tools that rank nothing and offer a
 * contribution instead. Same reasoning again: it carries no translated string -
 * every sentence it puts on screen is read off a data attribute the page
 * rendered - so it is one file rather than six.
 *
 * sim-footer.js and sim-chart-theme.js are linked on every page and on the four
 * charting pages respectively, and here rather than in the templates because
 * that is the whole point of the list above: a shared asset that five templates
 * each have to remember to link is a shared asset that four of them will link.
 *
 * section-nav.js is here for that reason and not because it is simulator code -
 * it is the client half of the nav below the header, which centres the current
 * tab when the strip is wider than the phone showing it. Its tag comes from
 * section-nav.mjs so that the four families rendering that nav all link the
 * same file.
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
    `\n    ${NAV_SCRIPT}` +
    (simulator.leaderboard
      ? `\n    <script src="/assets/js/sim-leaderboard.js?v=source" defer></script>`
      : '') +
    (simulator.contribute
      ? `\n    <script src="/assets/js/sim-contribute.js?v=source" defer></script>`
      : '') +
    `\n    <script src="/assets/js/sim-chart-theme.js?v=source" defer></script>` +
    `\n    <script src="/assets/js/${behaviourFileName(name, language)}?v=source" defer></script>`;
  const markup = page
    .replace(BEHAVIOUR_BLOCK, tag)
    .replace(FOOTER_YEAR, String(new Date().getFullYear()));

  return { markup, behaviour: `${block[1].trim()}\n` };
}

async function main() {
  const simulators = publishedSimulators();
  let written = 0;
  let lifted = 0;

  for (const simulator of simulators) {
    const templateFile = path.join(contentDir, `${simulator.name}.html`);
    const template = await fs.readFile(templateFile, 'utf8');
    const strings = await readSidecar(simulator.name);

    const usedKeys = new Set();
    for (const [, token] of template.matchAll(placeholderPattern)) {
      const key = token.trim();
      if (!key.startsWith('lang.') && !key.startsWith('shared.') && !key.startsWith('page.')) usedKeys.add(key);
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
      const page = render(template, language, strings, context, pageValues(simulator, language));

      const { markup, behaviour } = liftBehaviour(page, simulator, language, context);

      const scriptFile = path.join(root, 'assets', 'js', behaviourFileName(simulator.name, language));
      await fs.mkdir(path.dirname(scriptFile), { recursive: true });
      await fs.writeFile(scriptFile, behaviour);
      lifted += 1;

      const file = path.join(root, simulatorPath(simulator.name, language).replace(/^\//, ''));
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
