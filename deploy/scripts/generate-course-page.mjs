#!/usr/bin/env node
/**
 * Publishes the course landing page: one per language, at /es/curso/,
 * /en/course/ and /pt/curso/.
 *
 * The page is where paid search traffic lands, so it is built for a reader who
 * has never seen the site before and has one question at a time:
 *
 *   1. What is it, and what language is it in? The heading, the image of the
 *      learning path and - next to the price, not in a footnote - the line
 *      saying the videos are in Spanish with subtitles in three languages.
 *   2. What does it cost? The price and the launch coupon, with a button that
 *      applies the coupon at the Hotmart checkout, above the fold on a phone.
 *   3. What exactly will I learn? The full curriculum, every lesson with its
 *      running time, generated from content/site/course.mjs.
 *   4. Can I trust it? Who teaches it, what it is not (not advice, not a
 *      get-rich-quick scheme), the refund guarantee and the free tools it is
 *      built on - which a reader can try before paying.
 *   5. One last button, for the reader who scrolled to the end to decide.
 *
 * Every buy button goes to Hotmart's checkout and carries data-course-checkout,
 * which assets/js/course.js reads to forward the ad click's utm_* and gclid
 * parameters onto the checkout URL, so a sale can be traced back to the
 * campaign in Hotmart's own reports. With script off they are plain links.
 *
 * The page is also a schema.org Course with an Offer, so a search engine can
 * read the price and the provider rather than guess them, and a FAQPage built
 * from the same questions printed on screen.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  COURSE_COPY, COURSE_COUPON, COURSE_IMAGE, COURSE_LINKS, COURSE_MODULES, COURSE_PRICE, checkoutUrl
} from '../content/site/course.mjs';
import { escapeHtml } from './markdown.mjs';
import {
  LANGUAGES, ORIGIN, aboutPath, coursePath, sectionPath, simulatorsPath, absolute
} from './site-routes.mjs';
import { renderShell, disclaimer, stringsFor } from './page-shell.mjs';
import { courseImageAt } from './course-promo.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** ------------------------------------------------------------- figures */

// Only what the course price buys is counted. The additional module is sold
// separately at a price the page does not print, so counting its lessons or
// its minutes here would be selling it as included - see content/site/course.mjs.
const coreModules = COURSE_MODULES.filter((module) => !module.additional);
const additionalModules = COURSE_MODULES.filter((module) => module.additional);
const lessons = coreModules.flatMap((module) => module.lessons);
const minutes = {
  min: lessons.reduce((sum, lesson) => sum + lesson.min, 0),
  max: lessons.reduce((sum, lesson) => sum + lesson.max, 0)
};
const practicalCount = lessons.filter((lesson) => lesson.practical).length;

/**
 * The total running time, to the nearest half hour: "≈ 3 h", "≈ 2,5 h". The
 * lessons are given as ranges, so a total to the minute would claim a
 * precision the inputs do not have.
 */
function duration(language, low, high) {
  const hours = Math.round(((low + high) / 2 / 60) * 2) / 2;
  return `≈ ${hours.toLocaleString(language, { maximumFractionDigits: 1 })} h`;
}

/** The ISO 8601 duration schema.org's courseWorkload expects. */
function isoDuration(total) {
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return `PT${hours ? `${hours}H` : ''}${rest ? `${rest}M` : ''}`;
}

/** ------------------------------------------------------------- markup */

function buyButtons(language, copy, placement) {
  const primary = COURSE_COUPON
    ? `<a class="button course-buy" href="${escapeHtml(checkoutUrl({ coupon: true }))}" data-course-checkout data-course-placement="${placement}-coupon" rel="noopener">${escapeHtml(copy.buyWithCoupon)}</a>`
    : '';
  const plain = `<a class="${COURSE_COUPON ? 'course-buy-plain' : 'button course-buy'}" href="${escapeHtml(checkoutUrl())}" data-course-checkout data-course-placement="${placement}" rel="noopener">${escapeHtml(copy.buy)}</a>`;
  return `<div class="course-buy-row">${primary}${plain}</div>`;
}

function couponBlock(language, copy) {
  if (!COURSE_COUPON) return '';
  return `
          <div class="course-coupon">
            <p class="course-coupon-lead">${escapeHtml(copy.couponLead)}</p>
            <p class="course-coupon-body">${escapeHtml(copy.couponBody(COURSE_COUPON.seats, COURSE_COUPON.percent))}</p>
            <p class="course-coupon-code-row">
              <code class="course-coupon-code" data-course-coupon>${escapeHtml(COURSE_COUPON.code)}</code>
              <button type="button" class="course-coupon-copy" data-course-coupon-copy data-label-copied="${escapeHtml(copy.couponCopied)}" hidden>${escapeHtml(copy.couponCopy)}</button>
            </p>
          </div>`;
}

function offerPanel(language, copy) {
  const coupon = COURSE_COUPON
    ? `<p class="course-price-now"><span class="course-price-label">${escapeHtml(copy.couponPriceLabel)}</span> <strong>${escapeHtml(COURSE_COUPON.display[language])}</strong> <s>${escapeHtml(COURSE_PRICE.display[language])}</s></p>`
    : `<p class="course-price-now"><span class="course-price-label">${escapeHtml(copy.priceLabel)}</span> <strong>${escapeHtml(COURSE_PRICE.display[language])}</strong></p>`;
  return `
        <div class="course-offer" id="inscripcion">
          <p class="course-language"><strong>${escapeHtml(copy.languageTitle)}:</strong> ${escapeHtml(copy.languageBody)}</p>
          ${coupon}
${couponBlock(language, copy)}
          ${buyButtons(language, copy, 'hero')}
          <p class="course-buy-note">${escapeHtml(copy.buyNote)}</p>
          <ul class="course-facts" aria-label="${escapeHtml(copy.factsTitle)}">
            <li><strong>${coreModules.length}</strong> ${escapeHtml(copy.factModules)}${additionalModules.length ? ` + ${additionalModules.length} ${escapeHtml(copy.factAdditional)}` : ''}</li>
            <li><strong>${lessons.length}</strong> ${escapeHtml(copy.factLessons)}</li>
            <li><strong>${duration(language, minutes.min, minutes.max)}</strong> ${escapeHtml(copy.factMinutes)}</li>
            <li><strong>${practicalCount}</strong> ${escapeHtml(copy.factPractical)}</li>
          </ul>
        </div>`;
}

function moduleBlock(module, language, copy, index) {
  const text = module[language];
  const total = module.lessons.reduce((sum, lesson) => sum + lesson.max, 0);
  const items = module.lessons
    .map((lesson, position) => {
      const [title, summary] = lesson[language];
      const tag = lesson.practical ? `<span class="course-lesson-tag">${escapeHtml(copy.practicalLabel)}</span>` : '';
      return `<li class="course-lesson">
                <p class="course-lesson-head"><span class="course-lesson-number">${module.number}.${position + 1}</span> <span class="course-lesson-title">${escapeHtml(title)}</span> ${tag}<span class="course-lesson-time">${lesson.min}-${lesson.max} min</span></p>
                <p class="course-lesson-summary">${escapeHtml(summary)}</p>
              </li>`;
    })
    .join('\n              ');
  const badge = module.additional ? `<span class="course-module-badge">${escapeHtml(copy.additionalLabel)}</span>` : '';
  return `
          <li class="course-module${module.additional ? ' course-module-additional' : ''}">
            <details${index === 0 ? ' open' : ''}>
              <summary>
                <span class="course-module-number">${module.additional ? '★' : `${escapeHtml(copy.moduleLabel)} ${module.number}`}</span>
                <span class="course-module-title">${escapeHtml(text.title)}${badge ? ` ${badge}` : ''}</span>
                <span class="course-module-meta">${module.lessons.length} ${escapeHtml(copy.lessonsLabel)} · ~${total} min</span>
              </summary>
              <p class="course-module-goal">${escapeHtml(text.goal)}</p>
              <ol class="course-lessons">
              ${items}
              </ol>
            </details>
          </li>`;
}

function render(language, strings) {
  const copy = COURSE_COPY[language];
  const url = absolute(coursePath(language));

  const freeLinks = [
    `<a href="${sectionPath('tools', language)}">${escapeHtml(strings.toolsAll)}</a>`,
    `<a href="${sectionPath('templates', language)}">${escapeHtml(strings.templatesAll)}</a>`,
    `<a href="${simulatorsPath(language)}">${escapeHtml(strings.simulatorsNavLabel)}</a>`,
    `<a href="/${language}/blog/">${escapeHtml(strings.journal)}</a>`
  ].join(' · ');

  const body = `    <div class="container">
      <div class="course-hero">
        <figure class="course-figure">
          <img src="${courseImageAt(720)}" srcset="${courseImageAt(480)} 480w, ${courseImageAt(720)} 720w, ${courseImageAt(1080)} 1080w" sizes="(max-width: 900px) 100vw, 560px" width="720" height="720" alt="${escapeHtml(copy.imageAlt)}" fetchpriority="high" />
        </figure>
${offerPanel(language, copy)}
      </div>

      <section class="page-section" aria-labelledby="course-outcomes">
        <h2 id="course-outcomes" class="section-title">${escapeHtml(copy.outcomesTitle)}</h2>
        <ul class="course-outcomes">
          ${copy.outcomes.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n          ')}
        </ul>
      </section>

      <section class="page-section" id="programa" aria-labelledby="course-curriculum">
        <h2 id="course-curriculum" class="section-title">${escapeHtml(copy.curriculumTitle)}</h2>
        <p class="section-intro">${escapeHtml(copy.curriculumIntro)}</p>
        <ol class="course-modules">${COURSE_MODULES.map((module, index) => moduleBlock(module, language, copy, index)).join('')}
        </ol>
      </section>

      <section class="page-section" aria-labelledby="course-for">
        <h2 id="course-for" class="section-title">${escapeHtml(copy.forTitle)}</h2>
        <ul class="scope-grid">
          <li class="scope-col scope-yes"><h3>${escapeHtml(copy.forYes)}</h3><ul>${copy.yes.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></li>
          <li class="scope-col scope-no"><h3>${escapeHtml(copy.forNo)}</h3><ul>${copy.no.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></li>
        </ul>
      </section>

      <section class="page-section course-split" aria-labelledby="course-free">
        <div>
          <h2 id="course-free" class="section-title">${escapeHtml(copy.freeTitle)}</h2>
          <div class="article-body"><p>${escapeHtml(copy.freeBody)}</p><p>${freeLinks}</p></div>
        </div>
        <div>
          <h2 class="section-title">${escapeHtml(copy.authorTitle)}</h2>
          <div class="article-body"><p>${escapeHtml(copy.authorBody)}</p></div>
          <a class="text-link" href="${aboutPath(language)}">${escapeHtml(copy.authorLink)}</a>
        </div>
      </section>

      <section class="page-section" aria-labelledby="course-faq">
        <h2 id="course-faq" class="section-title">${escapeHtml(copy.faqTitle)}</h2>
        <div class="faq-list">
          ${copy.faq.map(([question, answer]) => `<details class="faq-item"><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join('\n          ')}
        </div>
      </section>

      <section class="course-final" aria-labelledby="course-final-title">
        <h2 id="course-final-title">${escapeHtml(copy.finalTitle)}</h2>
        <p>${escapeHtml(copy.finalBody)}</p>
        <p class="course-final-language">${escapeHtml(copy.languageBody)}</p>
        ${buyButtons(language, copy, 'final')}
      </section>
      ${disclaimer(strings, language)}
    </div>`;

  const graph = [
    {
      '@type': 'Course',
      '@id': `${url}#course`,
      name: COURSE_COPY.es.name,
      alternateName: language === 'es' ? undefined : copy.name,
      description: copy.description,
      url,
      image: `${ORIGIN}${COURSE_IMAGE}`,
      inLanguage: 'es',
      educationalLevel: 'Beginner',
      teaches: coreModules.map((module) => module[language].title),
      provider: { '@type': 'Organization', '@id': `${ORIGIN}/#organization`, name: 'Compounding Journey', sameAs: ORIGIN },
      creator: { '@id': `${ORIGIN}/#sandy-bradbury` },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        courseWorkload: isoDuration(minutes.max),
        inLanguage: 'es'
      },
      offers: {
        '@type': 'Offer',
        category: 'Paid',
        price: COURSE_PRICE.amount,
        priceCurrency: COURSE_PRICE.currency,
        availability: 'https://schema.org/InStock',
        url: COURSE_LINKS.checkout
      },
      syllabusSections: coreModules.map((module) => ({
        '@type': 'Syllabus',
        name: module[language].title,
        description: module[language].goal,
        timeRequired: isoDuration(module.lessons.reduce((sum, lesson) => sum + lesson.max, 0))
      }))
    },
    {
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: copy.faq.map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer }
      }))
    }
  ];

  return renderShell({
    language,
    strings,
    section: 'course',
    pathFor: (code) => coursePath(code),
    title: copy.title,
    description: copy.description,
    heading: COURSE_COPY.es.name,
    eyebrow: copy.eyebrow,
    intro: copy.intro,
    trail: [{ name: COURSE_COPY[language].navLabel, href: coursePath(language) }],
    graph,
    body,
    socialImage: `${ORIGIN}/.netlify/images?url=${COURSE_IMAGE}&amp;w=1200&amp;h=630&amp;fit=cover&amp;fm=jpg`,
    socialImageAlt: copy.imageAlt,
    extraHead: GOOGLE_ADS_TAG,
    extraScripts: '<script src="/assets/js/course.js?v=source" defer></script>'
  });
}

/** ------------------------------------------------------------ ad tag */

// The Google Ads tag, on this page and no other: it is where the campaigns
// send people, so it is where a visit from an ad is measured. Two tags because
// the CSP allows no inline script - the bootstrap that Google prints inline is
// /assets/js/google-ads.js. The Content-Security-Policy for the course paths in
// _headers allows Google's hosts; every other page keeps the same-origin policy.
const GOOGLE_ADS_ID = 'AW-18500563301';
const GOOGLE_ADS_TAG =
  `\n  <script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}"></script>` +
  '\n  <script src="/assets/js/google-ads.js?v=source"></script>';

/** ------------------------------------------------------------------ build */

async function main() {
  const sidecar = JSON.parse(await fs.readFile(path.join(root, 'content', 'site', 'site.i18n.json'), 'utf8'));

  // Every lesson and module needs copy in every language, or one edition ships
  // a curriculum with `undefined` in it.
  for (const module of COURSE_MODULES) {
    for (const language of LANGUAGES) {
      if (!module[language]?.title || !module[language]?.goal) {
        throw new Error(`Course module "${module.id}" is missing ${language} title or goal in content/site/course.mjs.`);
      }
      module.lessons.forEach((lesson, index) => {
        const text = lesson[language];
        if (!Array.isArray(text) || !text[0] || !text[1]) {
          throw new Error(`Course lesson ${module.number}.${index + 1} is missing its ${language} title or summary.`);
        }
      });
    }
  }
  for (const language of LANGUAGES) {
    if (!COURSE_COPY[language]) throw new Error(`content/site/course.mjs has no COURSE_COPY for "${language}".`);
    if (!COURSE_PRICE.display[language]) throw new Error(`COURSE_PRICE has no display price for "${language}".`);
    if (COURSE_COUPON && !COURSE_COUPON.display[language]) {
      throw new Error(`COURSE_COUPON has no display price for "${language}".`);
    }
  }

  const written = [];
  for (const language of LANGUAGES) {
    const strings = stringsFor(sidecar, language, 'site.i18n.json');
    const target = path.join(root, coursePath(language).replace(/^\//, ''), 'index.html');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, render(language, strings));
    written.push(coursePath(language));
  }

  console.log(
    `Course: ${written.length} page(s) — ${written.join(', ')} (${lessons.length} lessons, ` +
      `${COURSE_COUPON ? `coupon ${COURSE_COUPON.code} on` : 'no coupon'}).`
  );
  return written;
}

export { main as generateCoursePage };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`generate-course-page: ${error.message}`);
    process.exitCode = 1;
  });
}
