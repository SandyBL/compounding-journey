#!/usr/bin/env node
/**
 * Publishes the about page: one per language, at /es/sobre-mi/, /en/about/ and
 * /pt/sobre-mim/.
 *
 * See content/site/about.mjs for why this is a page rather than the #biografia
 * anchor it replaces. The short version: the Person node's `url` pointed at an
 * anchor on a page about the site, the nav offered no route to "who wrote
 * this", and three paragraphs beside a portrait had no room for the part that
 * actually earns trust on a money site - what the author does not do, and how
 * the material is made.
 *
 * Two things this file does that the other page generators do not.
 *
 * It emits a ProfilePage whose mainEntity is the same Person @id the home page
 * declares, and it re-states that Person here with `url` pointing at itself.
 * One entity, one canonical page about it, asserted from the page that is
 * actually about it. The @id is the join, so the two nodes merge rather than
 * competing - which is why the description and jobTitle here have to say the
 * same thing the home page says, and do.
 *
 * And the boundary list is marked up as the Person's `disambiguatingDescription`
 * as well as being rendered. "Not an accredited adviser, gives no personal
 * recommendations, holds no client money" is the single most important fact
 * about this entity for anybody - reader or machine - deciding what the site
 * is, and it should not exist only as prose in a list.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ABOUT_PAGE, SAME_AS } from '../content/site/about.mjs';
import { escapeHtml } from './markdown.mjs';
import {
  LANGUAGES, DEFAULT_LANGUAGE, ORIGIN, aboutPath, homePath, sessionsPath, sectionPath,
  glossaryPath, journalPath, dataPath, simulatorsPath, legalPath, absolute
} from './site-routes.mjs';
import { renderShell, disclaimer, stringsFor } from './page-shell.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The Person node's own prose, in English on all three pages and identical to
 * the string the home page declares.
 *
 * The node merges by @id across every page that emits it, so a per-language
 * description here would mean one entity asserting three different
 * descriptions - which is a conflict a consumer resolves arbitrarily. The
 * reader-facing copy is translated; the entity's own metadata is not.
 */
const PERSON_DESCRIPTION =
  'Financial educator writing about money psychology, budgeting, compound growth and long-term investing. '
  + 'Not an accredited financial adviser: no personal investment recommendations are given and no client '
  + 'money is managed.';

/** The portrait, at the one size this page paints it, through the Image CDN. */
const PORTRAIT = '/.netlify/images?url=/sandy-bradbury-portrait.png&amp;w=440&amp;h=440&amp;fit=cover';

function paragraphs(items) {
  return items.map((item) => `<p>${escapeHtml(item)}</p>`).join('');
}

/**
 * The boundary block.
 *
 * Second on the page, before the biography's third paragraph and long before
 * the sessions link, because a reader deciding whether to trust a finance
 * writer is owed the disclosures first. Styled as a bordered panel rather than
 * a bulleted list in the flow: a disclosure that looks like body copy gets read
 * like body copy, which is to say skimmed.
 */
function boundaryBlock(copy) {
  return `      <section class="page-section about-boundary" aria-labelledby="boundary-title">
        <h2 class="section-title" id="boundary-title">${escapeHtml(copy.boundaryTitle)}</h2>
        <div class="article-body"><p>${escapeHtml(copy.boundaryIntro)}</p></div>
        <ul class="about-boundary-list">${copy.boundary.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        <div class="article-body"><p><strong>${escapeHtml(copy.boundaryNote)}</strong></p></div>
      </section>`;
}

/**
 * The six rules the site is made under, each one a checkable claim.
 *
 * This is the section that does the work the page exists for. A biography is
 * not evidence; "every article ends with its sources, and here is the article
 * index" is, because the reader can go and look. So each card links to the page
 * that proves it rather than only asserting it.
 */
function practiceBlock(copy, language, strings) {
  const proof = [
    { href: journalPath(language), label: strings.journal },
    { href: dataPath(language), label: strings.dataNavLabel },
    { href: sectionPath('tools', language), label: strings.toolsNavLabel },
    { href: journalPath(language), label: strings.journal },
    { href: legalPath('privacy', language), label: strings.legalNav_privacy },
    { href: glossaryPath(language), label: strings.glossaryNavLabel }
  ];
  const cards = copy.practice.map((rule, index) => `          <li class="about-rule">
            <h3>${escapeHtml(rule.title)}</h3>
            <p>${escapeHtml(rule.body)}</p>
            <a class="text-link" href="${proof[index].href}">${escapeHtml(proof[index].label)}</a>
          </li>`).join('\n');
  return `      <section class="page-section" aria-labelledby="practice-title">
        <h2 class="section-title" id="practice-title">${escapeHtml(copy.practiceTitle)}</h2>
        <div class="article-body"><p>${escapeHtml(copy.practiceIntro)}</p></div>
        <ul class="about-rules">
${cards}
        </ul>
      </section>`;
}

/** ----------------------------------------------------------------- render */

function render(language, strings) {
  const copy = ABOUT_PAGE[language];
  const url = absolute(aboutPath(language));

  const body = `    <div class="container">
      <div class="about-intro">
        <img class="about-portrait" src="${PORTRAIT}" alt="Sandy Bradbury" width="220" height="220" loading="lazy" decoding="async" />
        <div class="article-body">${paragraphs(copy.story)}</div>
      </div>
${boundaryBlock(copy)}
${practiceBlock(copy, language, strings)}
      <section class="page-section" aria-labelledby="languages-title">
        <h2 class="section-title" id="languages-title">${escapeHtml(copy.languagesTitle)}</h2>
        <div class="article-body">${paragraphs(copy.languages)}</div>
      </section>
      <section class="page-section" aria-labelledby="work-title">
        <h2 class="section-title" id="work-title">${escapeHtml(copy.workTitle)}</h2>
        <div class="article-body">${paragraphs(copy.work)}
          <p>
            <a href="${sessionsPath(language)}">${escapeHtml(strings.sessionsNavLabel)}</a> ·
            <a href="${simulatorsPath(language)}">${escapeHtml(strings.simulatorsNavLabel)}</a> ·
            <a href="${sectionPath('templates', language)}">${escapeHtml(strings.templatesAll)}</a> ·
            <a href="${homePath(language)}#contacto">${escapeHtml(strings.aboutContactAction)}</a>
          </p>
        </div>
      </section>
      ${disclaimer(strings, language)}
    </div>`;

  const graph = [
    {
      '@type': 'ProfilePage',
      '@id': `${url}#profile`,
      url,
      name: copy.title,
      inLanguage: language,
      description: copy.description,
      mainEntity: { '@id': `${ORIGIN}/#sandy-bradbury` },
      about: { '@id': `${ORIGIN}/#sandy-bradbury` }
    },
    {
      // The same @id the home page declares, so these merge into one entity.
      // What this node adds is the part only this page can assert: that the
      // canonical page about the person is this one, and the disclosures.
      '@type': 'Person',
      '@id': `${ORIGIN}/#sandy-bradbury`,
      name: 'Sandy Bradbury',
      // The default language's edition, because a merged entity gets one
      // canonical url and Spanish is what x-default points at everywhere else.
      url: absolute(aboutPath(DEFAULT_LANGUAGE)),
      mainEntityOfPage: { '@id': `${url}#profile` },
      image: `${ORIGIN}/sandy-bradbury-portrait.png`,
      jobTitle: 'Financial educator',
      description: PERSON_DESCRIPTION,
      disambiguatingDescription: copy.boundary.join(' '),
      knowsLanguage: LANGUAGES,
      worksFor: { '@id': `${ORIGIN}/#organization` },
      sameAs: SAME_AS
    }
  ];

  return renderShell({
    language,
    strings,
    section: 'about',
    pathFor: (code) => aboutPath(code),
    title: copy.title,
    description: copy.description,
    heading: copy.heading,
    eyebrow: copy.eyebrow,
    intro: copy.intro,
    trail: [{ name: strings.aboutNavLabel, href: aboutPath(language) }],
    ogType: 'profile',
    graph,
    body
  });
}

/** ------------------------------------------------------------------ build */

async function main() {
  const sidecar = JSON.parse(await fs.readFile(path.join(root, 'content', 'site', 'site.i18n.json'), 'utf8'));

  // The proof links in practiceBlock are positional - one per rule, in order -
  // so a language that gained a seventh rule without the others gaining one
  // would silently render a card with no link, or link the wrong page.
  const counts = new Set(LANGUAGES.map((language) => ABOUT_PAGE[language].practice.length));
  if (counts.size !== 1) {
    throw new Error(
      'content/site/about.mjs: the three languages list different numbers of rules in `practice` ' +
        `(${LANGUAGES.map((language) => `${language}: ${ABOUT_PAGE[language].practice.length}`).join(', ')}). ` +
        'The proof links in generate-about-page.mjs are positional, so they have to match.'
    );
  }

  const written = [];
  for (const language of LANGUAGES) {
    const copy = ABOUT_PAGE[language];
    if (!copy) throw new Error(`content/site/about.mjs has no copy for "${language}".`);
    for (const field of ['title', 'description', 'heading', 'intro', 'boundaryTitle', 'practiceTitle', 'workTitle']) {
      if (!copy[field]) throw new Error(`content/site/about.mjs: ${language}.${field} is missing.`);
    }
    const strings = stringsFor(sidecar, language, 'site.i18n.json');
    const target = path.join(root, aboutPath(language).replace(/^\//, ''), 'index.html');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, render(language, strings));
    written.push(aboutPath(language));
  }

  console.log(`About: ${written.length} page(s) — ${written.join(', ')} (${SAME_AS.length} linked profiles).`);
  return written;
}

export { main as generateAboutPage };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`generate-about-page: ${error.message}`);
    process.exitCode = 1;
  });
}
