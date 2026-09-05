#!/usr/bin/env node
/**
 * Publishes the three legal documents in three languages: nine pages.
 *
 * The site had none. It runs calculators about people's retirements, stores a
 * display name in a public leaderboard, takes messages through a form and is
 * about to offer paid sessions, and every page's footer linked to a privacy
 * policy that did not exist. Netlify served those URLs as 404s.
 *
 * Two things make these pages worth generating rather than hand-writing nine
 * files. The first is the same reason the rest of this build exists: nine
 * copies of a document drift, and the copy that drifts is the one nobody reads
 * until it matters. The second is the cross-references - the privacy policy
 * points at the legal notice, the terms point at the sessions page, and the
 * notice points at both - and those URLs are localized. Written by hand they
 * would be twenty-seven hard-coded paths; here they are `{{placeholders}}`
 * resolved through scripts/site-routes.mjs, so a section that moves does not
 * leave a legal page linking into a 404.
 *
 * The revision date printed on each page comes from LEGAL_PAGES in site-routes,
 * not from the file's mtime or the build date. A reader has to be able to tell
 * whether they are looking at the version they agreed to, and "updated today"
 * on every deploy tells them nothing.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LEGAL } from '../content/site/legal.mjs';
import { renderMarkdown, collectHeadings, escapeHtml } from './markdown.mjs';
import {
  LANGUAGES, ORIGIN, LEGAL_PAGES, legalPath, sectionPath, glossaryPath,
  sessionsPath, dataPath, journalPath, absolute
} from './site-routes.mjs';
import { renderShell, stringsFor } from './page-shell.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * What a `{{placeholder}}` in a legal body may resolve to. Kept small on
 * purpose: a legal document that can link anywhere is a legal document whose
 * links nobody checks.
 */
const RESOLVERS = {
  privacy: (language) => legalPath('privacy', language),
  terms: (language) => legalPath('terms', language),
  notice: (language) => legalPath('notice', language),
  sessions: (language) => sessionsPath(language),
  tools: (language) => sectionPath('tools', language),
  templates: (language) => sectionPath('templates', language),
  glossary: (language) => glossaryPath(language),
  data: (language) => dataPath(language),
  journal: (language) => journalPath(language)
};

const insightLabel = { es: 'Idea clave', en: 'Key insight', pt: 'Ideia-chave' };

function resolveLinks(markdown, language, context) {
  return markdown.replace(/\{\{([a-z]+)\}\}/g, (_match, key) => {
    const resolver = RESOLVERS[key];
    if (!resolver) {
      throw new Error(
        `${context} uses {{${key}}}, which is not a known route. ` +
          `Known: ${Object.keys(RESOLVERS).join(', ')}.`
      );
    }
    return resolver(language);
  });
}

/**
 * The date the text was last revised, in the reader's own language.
 *
 * Read as UTC noon so the date printed is the date written in the table
 * regardless of where the build machine thinks it is.
 */
function formatDate(language, date) {
  return new Intl.DateTimeFormat(language, {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
  }).format(new Date(`${date}T12:00:00Z`));
}

/**
 * A contents list built from the document's own h2s.
 *
 * These pages are long by nature and are almost always read for one section -
 * how to delete a leaderboard entry, who the controller is, whether this is
 * advice. The list turns nine screens of scrolling into one click, and it is
 * generated from the rendered body so it can never list a section the document
 * no longer has.
 */
function contents(headings, strings) {
  if (headings.length < 3) return '';
  const items = headings
    .map((heading) => `<li><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`)
    .join('');
  return `
      <nav class="legal-toc" aria-labelledby="legal-toc-title">
        <h2 id="legal-toc-title">${escapeHtml(strings.legalContents)}</h2>
        <ol>${items}</ol>
      </nav>`;
}

function render(page, language, strings) {
  const document = LEGAL[page][language];
  const context = `content/site/legal.mjs (${page}, ${language})`;
  const markdown = resolveLinks(document.body, language, context);
  const html = renderMarkdown(markdown, { origin: ORIGIN }, { insight: insightLabel[language] });
  const headings = collectHeadings(html);
  const updated = LEGAL_PAGES[page].updated;
  const pathFor = (code) => legalPath(page, code);

  // The contents list is the first column of the two-column grid, and the only
  // reason this page needs a grid at all - so a document short enough not to
  // have one is rendered as a single column instead of an empty 280px gutter.
  //
  // There is no "other legal pages" nav here: the shell's footer already links
  // all three on every page of the site, and a second copy of the same three
  // links a screen further down is furniture, not navigation.
  const toc = contents(headings, strings);
  const layout = toc ? 'container legal-layout' : 'container';

  const body = `
    <div class="${layout}">${toc}
      <div>
        <p class="legal-updated"><time datetime="${updated}">${escapeHtml(strings.legalUpdated)} ${escapeHtml(formatDate(language, updated))}</time></p>
        <div class="article-body legal-body">
${html}
        </div>
      </div>
    </div>`;

  // `WebPage` rather than `Article`: these are terms of service and a privacy
  // notice, not editorial, and marking them up as articles would put them in
  // the same class as the journal for anything reading the graph.
  const graph = [{
    '@type': 'WebPage',
    '@id': `${absolute(pathFor(language))}#legal`,
    name: document.title,
    description: document.description,
    inLanguage: language,
    dateModified: updated,
    url: absolute(pathFor(language)),
    about: { '@id': `${ORIGIN}/#organization` },
    publisher: { '@id': `${ORIGIN}/#organization` }
  }];

  return renderShell({
    language,
    strings,
    // No `section`: a legal page is not one of the seven nav destinations, so
    // the strip renders with nothing marked as current rather than pretending
    // one of them is where the reader is.
    pathFor,
    title: document.title,
    description: document.description,
    heading: document.heading,
    intro: document.intro,
    trail: [{ name: document.title, href: pathFor(language) }],
    graph,
    body,
    bodyClass: 'legal-page'
  });
}

async function write(relativePath, contents) {
  const absolutePath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, contents);
}

async function main() {
  const sidecar = JSON.parse(await fs.readFile(path.join(root, 'content', 'site', 'site.i18n.json'), 'utf8'));
  const pages = Object.keys(LEGAL_PAGES);

  // Every page in the route table needs a document in every language, and
  // nothing may claim a slug twice. Both failures would publish a footer link
  // to a 404 - the thing these pages exist to stop.
  for (const page of pages) {
    if (!LEGAL[page]) throw new Error(`content/site/legal.mjs has no "${page}" document, but site-routes publishes one.`);
    for (const language of LANGUAGES) {
      const document = LEGAL[page][language];
      if (!document?.body?.trim()) {
        throw new Error(`content/site/legal.mjs: "${page}" has no ${language} body.`);
      }
    }
  }
  for (const language of LANGUAGES) {
    const slugs = pages.map((page) => LEGAL_PAGES[page].slug[language]);
    const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate ${language} legal slug(s): ${[...new Set(duplicates)].join(', ')}`);
    }
  }

  const written = [];
  for (const language of LANGUAGES) {
    const strings = stringsFor(sidecar, language, 'site.i18n.json');
    for (const page of pages) {
      const target = legalPath(page, language);
      await write(`${target.replace(/^\//, '')}index.html`, render(page, language, strings));
      written.push(target);
    }
  }

  console.log(`Legal: ${written.length} page(s) — ${written.join(', ')}`);
}

export async function generateLegalPages() {
  await main();
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(`generate-legal-pages: ${error.message}`);
    process.exitCode = 1;
  });
}
