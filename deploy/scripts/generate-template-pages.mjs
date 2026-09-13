#!/usr/bin/env node
/**
 * Publishes the Excel templates: one index and one page per template, per
 * language. 3 templates x 3 languages = 9 pages plus 3 indexes.
 *
 * The workbooks were already downloadable, from three cards on the home page.
 * What they lacked was somewhere to land: "plantilla presupuesto personal
 * excel gratis" is a search with an obvious intent, and the only answer the
 * site had for it was a 142 KB home page about something else with the
 * download three screens down. A page per template gives that search a title,
 * a URL and a first paragraph that are all about the file it wants, and gives
 * the file itself somewhere to be explained - what is in it, how to fill it in,
 * and what it will not tell you.
 *
 * Three things about how it is built are worth stating:
 *
 *   - The download button links the workbook directly, above the fold, with no
 *     email gate. That is a deliberate trade: an address collected in exchange
 *     for a spreadsheet is worth very little and costs the thing the site is
 *     for. The newsletter is offered next to the download as a choice, using
 *     the provider's own hosted form, so nothing new processes personal data.
 *   - What the page asks for instead is attention, and only once the file is
 *     already on its way: every page carries a panel naming the next workbook
 *     in the sequence and one tool that reads the same figures, hidden until
 *     the download link is used and revealed by assets/js/template-next.js.
 *     It is rendered here, in full, rather than written in by that script -
 *     so its two links carry real anchor text and are followed by a crawler,
 *     which is the other thing these pages were missing: nothing on them
 *     pointed at the simulators or the assessment.
 *   - The file's existence and size are read from disk at build time. A renamed
 *     or removed workbook fails the build rather than publishing a page whose
 *     only reason to exist is a download button that 404s.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TEMPLATES } from '../content/site/templates.mjs';
import { GLOSSARY } from '../content/site/glossary.mjs';
import { readSharedCatalog } from './shared-catalog.mjs';
import { renderMarkdown, escapeHtml, slugify } from './markdown.mjs';
import { addInlineLinks, glossaryTargets } from './inline-links.mjs';
import { newsletterLinks } from './newsletter-links.mjs';
import {
  LANGUAGES, ORIGIN, SIMULATORS, sectionPath, templatePath, glossaryPath, articlePath,
  simulatorPath, homePath, absolute
} from './site-routes.mjs';
import { renderShell, disclaimer, stringsFor } from './page-shell.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const insightLabel = { es: 'Idea clave', en: 'Key insight', pt: 'Ideia-chave' };

/** Where the workbook itself lives. The page slug is also the file name. */
function fileHref(template, language) {
  return `/assets/templates/${language}/${template[language].slug}.xlsx`;
}

function hrefForEntry(entry, language) {
  return glossaryPath(language, entry[language].slug);
}

/**
 * The other two templates, as link targets for the prose.
 *
 * "sácalos de la plantilla de gestión de gastos" should be a link, and asking
 * the author to write one by hand in nine copies of the same sentence is how
 * that link ends up missing from three of them. The names are given as aliases
 * with and without the word "plantilla"/"template"/"modelo" so the sentence can
 * read naturally either way.
 */
function templateTargets(language, excludeId) {
  const lead = { es: 'plantilla de', en: 'template', pt: 'modelo de' };
  return TEMPLATES.filter((template) => template.id !== excludeId).map((template) => {
    const copy = template[language];
    const lower = copy.name.toLowerCase();
    return {
      href: templatePath(language, copy.slug),
      name: copy.name,
      aliases:
        language === 'en'
          ? [`${lower} ${lead.en}`, lower]
          : [`${lead[language]} ${lower}`, lower],
      title: copy.description,
      dataAttribute: 'data-link-kind="template"'
    };
  });
}

/** Articles that mention this template's terms, newest first. */
function relatedArticles(template, language, catalog) {
  const needles = [];
  for (const id of template.glossary) {
    const entry = GLOSSARY.find((candidate) => candidate.id === id);
    if (!entry) continue;
    needles.push(entry[language].name.toLowerCase(), ...entry[language].aliases.map((a) => a.toLowerCase()));
  }
  return catalog
    .filter((article) => article.language === language)
    .filter((article) => {
      const haystack = `${article.title} ${article.searchText}`.toLowerCase();
      return needles.some((needle) => haystack.includes(needle));
    })
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 4);
}

/**
 * The newsletter card.
 *
 * It is a link to the hosted form rather than a form of its own, and that is
 * the whole point: an email field posting to this domain would make the site a
 * data controller for a mailing list it does not hold, with a consent record it
 * would have to keep. The list already exists at the provider; this sends the
 * reader to it.
 */
function optin(strings, url) {
  return `        <aside class="template-optin">
          <h2>${escapeHtml(strings.templateOptinTitle)}</h2>
          <p>${escapeHtml(strings.templateOptinBody)}</p>
          <a class="button" href="${url}" rel="noopener nofollow" target="_blank">${escapeHtml(strings.templateOptinAction)}</a>
          <p class="optin-consent">${escapeHtml(strings.templateOptinNote)}</p>
        </aside>`;
}

/**
 * Where one of a template's two `nextRoutes` keys points, in one language.
 *
 * The keys are written once in content/site/templates.mjs and read here in
 * nine renders, so they are deliberately loose about what kind of thing they
 * name - another template, one of the five simulators, or the assessment on
 * the home page. What they are not allowed to be is wrong: a key that matches
 * none of the three fails the build rather than rendering a panel whose
 * headline offers step 2 and whose button goes nowhere.
 */
function nextHref(key, language) {
  const template = TEMPLATES.find((candidate) => candidate.id === key);
  if (template) return templatePath(language, template[language].slug);
  if (SIMULATORS.some((simulator) => simulator.name === key)) return simulatorPath(key, language);
  if (key === 'assessment') return `${homePath(language)}#assessment`;
  throw new Error(
    `Template nextRoutes key "${key}" is not a template id, a simulator name or "assessment".`
  );
}

/**
 * The panel the download reveals.
 *
 * Hidden in the markup, unhidden by assets/js/template-next.js when the
 * download link is clicked - which is the whole of that script's power over
 * the download. The file is a plain link to a plain .xlsx and is already on
 * its way before any of this runs; a reader with JavaScript off gets the
 * workbook exactly as before and simply never sees the panel.
 *
 * The live region is outside the section on purpose. A role="status" node
 * inside a `hidden` element announces nothing when the element is unhidden,
 * so the announcement has to live somewhere that was never hidden, and the
 * script fills it from the eyebrow's own text - which keeps all nine panels'
 * prose in the content file and none of it in JavaScript.
 */
function nextPanel(template, language, strings) {
  const copy = template[language].next;
  const primary = nextHref(template.nextRoutes.primary, language);
  const secondary = nextHref(template.nextRoutes.secondary, language);

  return `          <p class="sr-only" id="template-next-status" role="status" aria-live="polite"></p>
          <section class="template-next" id="template-next" data-template="${template.id}" aria-labelledby="template-next-title" hidden>
            <p class="template-next-eyebrow">${escapeHtml(strings.templateNextStarted)}</p>
            <h2 class="template-next-title" id="template-next-title">${escapeHtml(copy.title)}</h2>
            <p class="template-next-body">${escapeHtml(copy.body)}</p>
            <div class="template-next-actions">
              <a class="button" href="${primary}">${escapeHtml(copy.primaryLabel)}</a>
              <a class="text-link" href="${secondary}">${escapeHtml(copy.secondaryLabel)}</a>
            </div>
            <p class="template-next-note">${escapeHtml(strings.templateNextNote)}</p>
          </section>`;
}

/** ------------------------------------------------------------------ index */

function renderIndex(language, strings, sizes) {
  const cards = TEMPLATES.map((template) => {
    const copy = template[language];
    return `        <article class="card">
          <p class="card-eyebrow">${escapeHtml(strings.templateStep)} ${template.step} · ${escapeHtml(strings.templateFree)}</p>
          <h2 class="card-title"><a href="${templatePath(language, copy.slug)}">${escapeHtml(copy.name)}</a></h2>
          <p class="card-body">${escapeHtml(copy.description)}</p>
          <p class="card-meta">XLSX · ${sizes.get(fileHref(template, language))} · ${template.sheets} ${escapeHtml(template.sheets === 1 ? strings.templateSheetsOne : strings.templateSheets).toLowerCase()}</p>
        </article>`;
  }).join('\n');

  const body = `    <div class="container">
      <section class="page-section">
        <h2 class="section-title">${escapeHtml(strings.templateSequenceTitle)}</h2>
        <p class="page-dek">${escapeHtml(strings.templateSequenceIntro)}</p>
      </section>
      <div class="card-grid">
${cards}
      </div>
      ${disclaimer(strings, language, { compact: true })}
    </div>`;

  const graph = [{
    '@type': 'ItemList',
    '@id': `${absolute(sectionPath('templates', language))}#templates`,
    name: strings.templatesSectionTitle,
    inLanguage: language,
    itemListElement: TEMPLATES.map((template) => ({
      '@type': 'ListItem',
      position: template.step,
      name: template[language].name,
      url: absolute(templatePath(language, template[language].slug))
    }))
  }];

  return renderShell({
    language,
    strings,
    section: 'templates',
    pathFor: (code) => sectionPath('templates', code),
    title: strings.templatesSectionTitle,
    description: strings.templatesIntro,
    heading: strings.templatesSectionTitle,
    eyebrow: strings.templatesEyebrow,
    intro: strings.templatesIntro,
    trail: [{ name: strings.templatesSectionTitle, href: sectionPath('templates', language) }],
    graph,
    body
  });
}

/** --------------------------------------------------------------- template */

function renderTemplate(template, language, strings, catalog, targets, sizes, newsletter) {
  const copy = template[language];
  const url = absolute(templatePath(language, copy.slug));
  const href = fileHref(template, language);
  const size = sizes.get(href);

  // Template targets go first: in "the expense management template", the link
  // the reader wants is the template, not a glossary term inside its name, and
  // the linker gives an earlier target the first claim on a phrase.
  const allTargets = [...templateTargets(language, template.id), ...targets];
  const prose = (markdown) =>
    addInlineLinks(renderMarkdown(markdown, { origin: ORIGIN }, { insight: insightLabel[language] }), allTargets, {
      maxLinks: 5
    }).html;

  const others = TEMPLATES.filter((other) => other.id !== template.id)
    .sort((left, right) => left.step - right.step)
    .map((other) => `<li><a href="${templatePath(language, other[language].slug)}">${escapeHtml(other[language].name)}</a></li>`)
    .join('');

  const terms = template.glossary
    .map((id) => GLOSSARY.find((entry) => entry.id === id))
    .filter(Boolean)
    .map((entry) => `<li><a href="${hrefForEntry(entry, language)}">${escapeHtml(entry[language].name)}</a></li>`)
    .join('');

  const articles = relatedArticles(template, language, catalog)
    .map((article) => `<li><a href="${articlePath(language, article.slug)}">${escapeHtml(article.title)}</a></li>`)
    .join('');

  const faq = copy.faq
    .map(
      (item) => `          <details class="faq-item">
            <summary>${escapeHtml(item.q)}</summary>
            <div><p>${escapeHtml(item.a)}</p></div>
          </details>`
    )
    .join('\n');

  const body = `    <div class="container">
      <div class="template-layout">
        <div>
          <div class="template-download">
            <a class="button" href="${href}" download="${escapeHtml(copy.download)}" data-template-download>${escapeHtml(strings.templateDownload)}</a>
            <dl class="template-facts">
              <div><dt>${escapeHtml(strings.templateFormat)}</dt><dd>XLSX</dd></div>
              <div><dt>${escapeHtml(strings.templateSize)}</dt><dd>${size}</dd></div>
              <div><dt>${escapeHtml(strings.templateSheets)}</dt><dd>${template.sheets}</dd></div>
              <div><dt>${escapeHtml(strings.templatePrice)}</dt><dd>${escapeHtml(strings.templateFree)}</dd></div>
            </dl>
          </div>
${nextPanel(template, language, strings)}
          <section class="page-section">
            <h2 class="section-title">${escapeHtml(strings.templateWhatsInside)}</h2>
            <div class="article-body">${prose(copy.whatsInside)}</div>
          </section>
          <section class="page-section">
            <h2 class="section-title">${escapeHtml(strings.templateHowToUse)}</h2>
            <div class="article-body">${prose(copy.howToUse)}</div>
          </section>
${optin(strings, newsletter)}
          <section class="page-section">
            <h2 class="section-title">${escapeHtml(strings.faqTitle)}</h2>
            <div class="faq-list">
${faq}
            </div>
          </section>
          ${disclaimer(strings, language, { compact: true })}
        </div>
        <aside class="term-aside">
          <h2>${escapeHtml(strings.templatesOther)}</h2>
          <ul>${others}</ul>
          ${terms ? `<h2>${escapeHtml(strings.glossaryRelatedTerms)}</h2><ul>${terms}</ul>` : ''}
          ${articles ? `<h2>${escapeHtml(strings.relatedReading)}</h2><ul>${articles}</ul>` : ''}
          <a class="text-link" href="${sectionPath('templates', language)}">${escapeHtml(strings.templatesAll)}</a>
        </aside>
      </div>
    </div>`;

  // A spreadsheet is not SoftwareApplication - it is a file you download, and
  // schema.org has a type for exactly that. `encoding` is what tells a crawler
  // the size and format without it having to fetch the workbook.
  const graph = [
    {
      '@type': 'DigitalDocument',
      '@id': `${url}#document`,
      name: copy.name,
      description: copy.description,
      url,
      inLanguage: language,
      isAccessibleForFree: true,
      fileFormat: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      encoding: {
        '@type': 'MediaObject',
        contentUrl: absolute(href),
        encodingFormat: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        contentSize: size
      },
      author: { '@id': `${ORIGIN}/#sandy-bradbury` },
      publisher: { '@id': `${ORIGIN}/#organization` }
    },
    {
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      inLanguage: language,
      mainEntity: copy.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
      }))
    }
  ];

  return renderShell({
    language,
    strings,
    section: 'templates',
    pathFor: (code) => templatePath(code, template[code].slug),
    title: copy.title,
    description: copy.description,
    heading: copy.name,
    eyebrow: `${strings.templatesEyebrow} · ${strings.templateStep} ${template.step}`,
    intro: copy.intro,
    trail: [
      { name: strings.templatesSectionTitle, href: sectionPath('templates', language) },
      { name: copy.name, href: templatePath(language, copy.slug) }
    ],
    graph,
    body,
    extraScripts: '\n<script src="/assets/js/template-next.js?v=source" defer></script>'
  });
}

/** ------------------------------------------------------------------ build */

async function write(relativePath, contents) {
  const absolutePath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, contents);
}

/**
 * Every workbook's size, and proof that every workbook is there.
 *
 * Done as one pass before any page is rendered so a missing file stops the
 * build rather than producing eight good pages and one with a dead button.
 */
async function measure() {
  const sizes = new Map();
  for (const language of LANGUAGES) {
    for (const template of TEMPLATES) {
      const href = fileHref(template, language);
      const stats = await fs.stat(path.join(root, href.replace(/^\//, ''))).catch(() => null);
      if (!stats) {
        throw new Error(
          `Template ${template.id} (${language}) points at ${href}, which is not on disk. ` +
            `The page slug is also the workbook's file name, so renaming one means renaming both.`
        );
      }
      sizes.set(href, `${Math.round(stats.size / 1024)} KB`);
    }
  }
  return sizes;
}

/**
 * That the counter endpoint accepts exactly the templates this publishes.
 *
 * netlify/functions/template-download.mjs validates the `template` field
 * against a hard-coded list rather than importing content/site/templates.mjs,
 * because importing it would pull 32 KB of nine editions' prose into a
 * function whose whole job is to add one to a number. The cost of that choice
 * is a second list, and a second list drifts: add a fourth workbook and its
 * downloads are silently rejected with a 400 nobody sees, because the beacon
 * is fire-and-forget by design.
 *
 * So the build reads the endpoint's own source and compares. The same trick as
 * newsletter-links.mjs reading the home page and verify-output.mjs reading
 * _headers: the file that states the fact stays the one source of it, and the
 * build refuses to ship a page whose counter cannot count.
 */
async function assertEndpointTemplates() {
  const endpoint = path.join(root, 'netlify', 'functions', 'template-download.mjs');
  const source = await fs.readFile(endpoint, 'utf8');
  const declaration = source.match(/const TEMPLATES = new Set\(\[([^\]]*)\]\)/);
  if (!declaration) {
    throw new Error(
      'netlify/functions/template-download.mjs no longer declares `const TEMPLATES = new Set([...])`, ' +
        'so the build cannot check that the download counter accepts every published template.'
    );
  }

  const accepted = new Set([...declaration[1].matchAll(/'([^']+)'/g)].map((match) => match[1]));
  const published = TEMPLATES.map((template) => template.id);
  const missing = published.filter((id) => !accepted.has(id));
  const extra = [...accepted].filter((id) => !published.includes(id));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      'The download counter and the published templates disagree. ' +
        (missing.length > 0 ? `Published but rejected by /api/template-download: ${missing.join(', ')}. ` : '') +
        (extra.length > 0 ? `Accepted but no longer published: ${extra.join(', ')}. ` : '') +
        'Update the TEMPLATES set in netlify/functions/template-download.mjs.'
    );
  }
}

async function pruneRemoved() {
  for (const language of LANGUAGES) {
    const directory = path.join(root, sectionPath('templates', language));
    const expected = new Set(TEMPLATES.map((template) => template[language].slug));
    let found;
    try {
      found = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const item of found) {
      if (!item.isDirectory() || expected.has(item.name)) continue;
      await fs.rm(path.join(directory, item.name), { recursive: true, force: true });
      console.log(`Templates: removed stale directory ${language}/${item.name}`);
    }
  }
}

async function main() {
  const sidecar = JSON.parse(await fs.readFile(path.join(root, 'content', 'site', 'site.i18n.json'), 'utf8'));
  const catalog = await readSharedCatalog();
  const sizes = await measure();
  await assertEndpointTemplates();
  const newsletter = await newsletterLinks();

  for (const language of LANGUAGES) {
    const slugs = TEMPLATES.map((template) => template[language].slug);
    const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate ${language} template slug(s): ${[...new Set(duplicates)].join(', ')}`);
    }
    for (const [index, slug] of slugs.entries()) {
      if (slug !== slugify(slug)) {
        throw new Error(`Template slug "${slug}" (${TEMPLATES[index].id}, ${language}) is not URL-safe.`);
      }
    }
  }

  let pages = 0;
  const written = [];

  for (const language of LANGUAGES) {
    const strings = stringsFor(sidecar, language, 'site.i18n.json');
    const targets = glossaryTargets(GLOSSARY, language, hrefForEntry);

    await write(
      `${sectionPath('templates', language).replace(/^\//, '')}index.html`,
      renderIndex(language, strings, sizes)
    );
    written.push(sectionPath('templates', language));
    pages += 1;

    for (const template of TEMPLATES) {
      const slug = template[language].slug;
      await write(
        `${templatePath(language, slug).replace(/^\//, '')}index.html`,
        renderTemplate(template, language, strings, catalog, targets, sizes, newsletter[language])
      );
      written.push(templatePath(language, slug));
      pages += 1;
    }
  }

  await pruneRemoved();

  console.log(`Templates: ${pages} page(s) across ${LANGUAGES.length} language(s), ${TEMPLATES.length} template(s) each.`);
  return written;
}

export { main as generateTemplatePages };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`generate-template-pages: ${error.message}`);
    process.exitCode = 1;
  });
}
