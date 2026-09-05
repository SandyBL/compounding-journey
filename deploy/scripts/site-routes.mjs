// The single place that knows what every generated page's URL is, in every
// language.
//
// Four generators build pages that link each other's output: a calculator page
// links the glossary terms it uses, a glossary term links the articles that
// mention it, every page's footer links the three legal pages, and every page
// needs the full hreflang cluster of its own translations. If each generator
// built those URLs itself, "the Portuguese glossary lives at /pt/glossario/"
// would be a fact stated in four files - and the first one to be edited alone
// would ship a page whose hreflang cluster points at a 404, which is invisible
// in a diff and invisible on screen.
//
// The slugs are localized on purpose. A Spanish reader searching for a budget
// template searches "plantilla", not "template", and the URL is one of the few
// places left where that word still carries weight. The directory names are
// therefore per-language, which is why nothing here can be derived from a
// pattern and all of it has to be written down.
export const LANGUAGES = ['es', 'en', 'pt'];
export const DEFAULT_LANGUAGE = 'es';
export const ORIGIN = 'https://compoundingjourney.com';

// The home page is the one document whose Spanish edition is not under /es/:
// it is the apex. Everything else this project generates - the journal, the
// simulators, and every page added here - keeps its language prefix, because a
// second URL shape is a second set of redirect rules, canonical rules and
// hreflang rules to get wrong for the sake of three characters.
export function homePath(language) {
  return language === DEFAULT_LANGUAGE ? '/' : `/${language}/`;
}

/** Directory names, per language, for each family of generated page. */
export const SECTIONS = {
  tools: { es: 'calculadoras', en: 'calculators', pt: 'calculadoras' },
  templates: { es: 'plantillas', en: 'templates', pt: 'modelos' },
  glossary: { es: 'glosario', en: 'glossary', pt: 'glossario' },
  sessions: { es: 'sesiones', en: 'sessions', pt: 'sessoes' },
  // The aggregate of what the simulators have been told, published as one page
  // per language. A section rather than an article because it is regenerated
  // from the database on every build and has no publication date to sit under.
  data: { es: 'datos', en: 'data', pt: 'dados' },
  // The five simulators. This directory is the one that is not translated:
  // the four standalone tools were published under /<lang>/simulators/ long
  // before the section had an index, their URLs are indexed and have been
  // shared, and moving them would buy one Spanish word in exchange for a set
  // of permanent redirects. The index this now names is the page a reader
  // gets when they ask for the simulators, which is the part that was wrong.
  simulators: { es: 'simulators', en: 'simulators', pt: 'simulators' },
  // Categories are a sub-index of the journal rather than a section of their
  // own, so they nest under the journal's own URL.
  category: { es: 'categoria', en: 'category', pt: 'categoria' }
};

export function sectionPath(section, language) {
  const directory = SECTIONS[section]?.[language];
  if (!directory) throw new Error(`site-routes: no "${section}" directory for language "${language}".`);
  return `/${language}/${directory}/`;
}

export function toolPath(language, slug) {
  return `${sectionPath('tools', language)}${slug}/`;
}

export function templatePath(language, slug) {
  return `${sectionPath('templates', language)}${slug}/`;
}

export function glossaryPath(language, slug) {
  return slug ? `${sectionPath('glossary', language)}${slug}/` : sectionPath('glossary', language);
}

export function sessionsPath(language) {
  return sectionPath('sessions', language);
}

export function dataPath(language) {
  return sectionPath('data', language);
}

/**
 * The five simulator documents, in the order the index lists them.
 *
 * `name` is the template in content/simulators/ and the stem of the stylesheet
 * and behaviour bundle built from it, which is why the first one is still
 * called `simulator-hub`: it was the site's entry point to the simulators
 * before there was an index, and renaming it would rename three published
 * assets to fix a word only the build reads. It is the personal finance
 * simulator, and it is a simulator like the other four.
 *
 * `file` is where the document is published, under the language prefix. Four of
 * them sit inside the section directory and the fifth does not, for the same
 * reason as above.
 *
 * The table is here rather than in the generator that expands the templates,
 * because three other things now need it: the index that lists them, the
 * sitemap that dates them, and llms.txt. A second copy is a copy that
 * eventually lists a simulator the build does not publish.
 */
export const SIMULATORS = [
  { name: 'simulator-hub', file: 'simulator.html' },
  { name: 'freedom-calendar', file: 'simulators/freedom-calendar.html' },
  { name: 'market-time-machine', file: 'simulators/market-time-machine.html' },
  { name: 'monte-carlo-fire', file: 'simulators/monte-carlo-fire.html' },
  { name: 'passive-income-engine', file: 'simulators/passive-income-engine.html' }
];

/** Where one simulator is published, given the name it is known by above. */
export function simulatorPath(name, language) {
  const simulator = SIMULATORS.find((item) => item.name === name);
  if (!simulator) {
    throw new Error(
      `site-routes: "${name}" is not a simulator. Known: ${SIMULATORS.map((item) => item.name).join(', ')}.`
    );
  }
  return `/${language}/${simulator.file}`;
}

/**
 * The index of all five - the page the Simuladores nav item points at.
 *
 * It used to point at `simulator.html`, so a reader asking for "the
 * simulators" was dropped straight into the personal finance one with the
 * other four reachable only from a link row inside it.
 */
export function simulatorsPath(language) {
  return sectionPath('simulators', language);
}

export function journalPath(language) {
  return `/${language}/blog/`;
}

export function articlePath(language, slug) {
  return `/${language}/blog/${slug}/`;
}

/**
 * A category archive, or the index of all of them when no slug is given - the
 * same shape as `glossaryPath`, so a caller that renders an index and its
 * children uses one function for both.
 */
export function categoryPath(language, slug) {
  const base = `/${language}/blog/${SECTIONS.category[language]}/`;
  return slug ? `${base}${slug}/` : base;
}

/**
 * The three legal pages, keyed by the identifier the generators and the footer
 * use. `slug` is the directory each one is published under; `updated` is the
 * date the text was last revised and is printed on the page, so a reader can
 * tell whether they are looking at the version they agreed to.
 */
export const LEGAL_PAGES = {
  privacy: {
    slug: { es: 'privacidad', en: 'privacy', pt: 'privacidade' },
    updated: '2026-09-05'
  },
  terms: {
    slug: { es: 'terminos', en: 'terms', pt: 'termos' },
    updated: '2026-09-05'
  },
  notice: {
    slug: { es: 'aviso-legal', en: 'legal-notice', pt: 'aviso-legal' },
    updated: '2026-09-05'
  }
};

export function legalPath(page, language) {
  const slug = LEGAL_PAGES[page]?.slug?.[language];
  if (!slug) throw new Error(`site-routes: no "${page}" legal page for language "${language}".`);
  return `/${language}/${slug}/`;
}

/** Absolute form of any of the above, for canonicals, hreflang and JSON-LD. */
export function absolute(pathname) {
  return `${ORIGIN}${pathname}`;
}

/**
 * The hreflang cluster for a page that exists in all three languages, given a
 * function that returns its path in one.
 *
 * x-default points at Spanish because Spanish is the site's primary language
 * and the apex language. A cluster without a self-reference is invalid, so the
 * page's own language is always included; scripts/verify-output.mjs fails the
 * build if it ever is not.
 */
export function alternates(pathFor) {
  return LANGUAGES.map((code) => ({ code, href: absolute(pathFor(code)) }));
}
