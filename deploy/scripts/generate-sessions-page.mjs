#!/usr/bin/env node
/**
 * Publishes the sessions page: one per language, at /es/sesiones/,
 * /en/sessions/ and /pt/sessoes/.
 *
 * The footer of every generated page has linked to this URL since the shell
 * existed, and until now the URL 404'd - the site said, in its own navigation,
 * that hours were for sale, and then had nothing to say about them. A reader
 * who wanted to book had to find the contact form and guess what they were
 * asking for.
 *
 * Three things this page has to get right, in this order:
 *
 *   1. The boundary. What is sold is education and coaching. It is not
 *      regulated investment advice, and the page has to say so somewhere a
 *      reader will actually look rather than in small print - hence the
 *      two-column block giving what a session is next to what it is not, above
 *      the fold on a phone. The terms page states the same boundary in legal
 *      register; this states it in the register somebody deciding whether to
 *      pay will read.
 *   2. The price. A floor is published and the three rates are not, which is
 *      not indecision: a reader needs to know the order of magnitude before
 *      they will spend effort on an enquiry, and does not need a rate card to
 *      decide whether to ask. So the enquiry box leads with "from 17 EUR" in
 *      the reader's currency, prints the other two as approximate equivalents,
 *      and says plainly that the per-session rates come by return. That floor
 *      also goes into the structured data as an AggregateOffer/lowPrice, which
 *      is the only price field a search engine can read without being lied to.
 *      content/site/sessions.mjs holds both switches: SESSION_PRICE_FROM for
 *      the floor, SESSION_PRICES for the full card. The second is
 *      all-or-nothing - fill it and every card prints its own rate; miss a
 *      session and the build fails rather than shipping a page where two of
 *      three sessions have a price.
 *   3. The free path. Almost everything a session does can be done alone with
 *      the templates, the calculators and the glossary, and the page says so
 *      before it asks for money. A page that hides the free option to sell the
 *      paid one would undercut the only asset this site actually has.
 *
 * The enquiry call to action points at the home page's existing contact form
 * rather than introducing a second one: one Netlify form, one inbox, one
 * privacy policy paragraph describing it. `#contacto` is the anchor id on all
 * three home pages, so it needs no translation.
 *
 * The form is also the only way to reach the author from this site. There is no
 * address printed here and no mailto anywhere, by decision: a plain address on
 * a public page is harvested within days and then every enquiry competes with
 * the spam it attracted, whereas the form arrives labelled, in one inbox, under
 * the one privacy paragraph that describes what happens to it.
 * scripts/verify-output.mjs enforces that - it fails the build if a personal
 * address turns up anywhere in the generated site.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SESSIONS, SESSIONS_PAGE, SESSION_PRICES, SESSION_PRICE_FROM } from '../content/site/sessions.mjs';
import { escapeHtml } from './markdown.mjs';
import {
  LANGUAGES, ORIGIN, sessionsPath, homePath, sectionPath, glossaryPath, journalPath, legalPath, absolute
} from './site-routes.mjs';
import { renderShell, disclaimer, stringsFor } from './page-shell.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The rate line for one session, or null while prices are unpublished.
 *
 * Returning null rather than an empty string keeps the caller's markup honest:
 * a `.session-meta` entry reading "Tarifa:" with nothing after it is worse than
 * no entry at all.
 */
function priceOf(session) {
  if (!SESSION_PRICES) return null;
  return SESSION_PRICES[session.id];
}

function sessionCard(session, language, copy) {
  const text = session[language];
  const price = priceOf(session);
  const meta = [text.length, text.format, price ? `${copy.priceLabel}: ${price}` : copy.priceOnRequest];
  return `          <li class="session-card">
            <h3>${escapeHtml(text.name)}</h3>
            <p class="session-meta">${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</p>
            <p>${escapeHtml(text.body)}</p>
            <p><strong>${escapeHtml(copy.forWhomLabel)}:</strong> ${escapeHtml(text.forWhom)}</p>
          </li>`;
}

function scopeBlock(copy) {
  const column = (kind, title, items) => `        <li class="scope-col scope-${kind}">
          <h3>${escapeHtml(title)}</h3>
          <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </li>`;
  return `      <ul class="scope-grid">
${column('yes', copy.scopeYes, copy.yes)}
${column('no', copy.scopeNo, copy.no)}
      </ul>`;
}

/**
 * The price headline: the floor in the reader's currency, then the other two.
 *
 * The equivalents are listed rather than omitted because language does not tell
 * you a currency. A Portuguese-speaking reader in Lisbon gets reais as their
 * headline and needs to see the euro figure to know what they are being asked
 * for; the same goes in reverse for a Spanish-speaking reader in Buenos Aires.
 * They are labelled approximate, which they are - see the note on rounding in
 * content/site/sessions.mjs.
 *
 * Returns an empty string when SESSION_PRICE_FROM is null, so switching the
 * headline off leaves clean markup rather than an empty heading.
 */
function priceFrom(language, copy) {
  if (!SESSION_PRICE_FROM) return '';
  const mine = SESSION_PRICE_FROM[language];
  const others = LANGUAGES.filter((code) => code !== language).map((code) => SESSION_PRICE_FROM[code].display);
  return `        <p class="session-price-from"><span>${escapeHtml(copy.priceFromLabel)}</span> <strong>${escapeHtml(mine.display)}</strong></p>
        <p class="session-price-equivalent">${escapeHtml(copy.priceFromEquivalent)} ${others.map((display) => escapeHtml(display)).join(' · ')}.</p>`;
}

/**
 * The enquiry panel.
 *
 * One way out, not two. This used to print a mailto next to the form link, on
 * the reasoning that some readers would rather not fill in a form and that a
 * silently broken form is fatal to an enquiry. Both are true and it still went:
 * a personal address on a page this crawlable is harvested, and an inbox full
 * of spam loses real enquiries at a far higher rate than a form outage nobody
 * has ever reported. The form posts to Netlify Forms, which is checked, and it
 * is the only channel the privacy policy has to describe.
 *
 * Order in the panel is deliberate: what it costs, what that is in other
 * currencies, what to say, what is not yet public, then the link. The reader's
 * first question is answered before they are asked to do anything.
 *
 * The link lands on the form itself, #contact-form-panel, and not on the top of
 * #contacto: a reader who has just read the prices and decided to write should
 * not have to scroll past the newsletter block and the biography to find the
 * fields. ?from=sessions is read by the home page, which fills the message with
 * a request for the three rates and the availability - the two things the copy
 * above promises to send - so the form can be sent without typing a word, and
 * then removes the marker from the address bar. Nothing here depends on that:
 * with script off the link is still a plain jump to the form.
 */
function enquiry(language, copy) {
  const rates = SESSION_PRICES
    ? `<p class="session-price">${escapeHtml(copy.priceLabel)}: ${SESSIONS.map((session) => `${escapeHtml(session[language].name)} — ${escapeHtml(priceOf(session))}`).join(' · ')}</p>`
    : `<p class="session-price">${escapeHtml(copy.priceNote)}</p>`;
  return `      <aside class="session-enquiry" aria-labelledby="enquiry-title">
        <h2 id="enquiry-title">${escapeHtml(copy.enquiryTitle)}</h2>
${priceFrom(language, copy)}
        <p>${escapeHtml(copy.enquiryBody)}</p>
${rates}
        <a class="text-link" href="${homePath(language)}?from=sessions#contact-form-panel">${escapeHtml(copy.enquiryAction)}</a>
      </aside>`;
}

/** ----------------------------------------------------------------- render */

function render(language, strings) {
  const copy = SESSIONS_PAGE[language];
  const url = absolute(sessionsPath(language));

  const body = `    <div class="container">
      <div class="sessions-layout">
        <div>
          <ul class="sessions-list">
${SESSIONS.map((session) => sessionCard(session, language, copy)).join('\n')}
          </ul>
          <div class="article-body">
            <p>${escapeHtml(copy.freeFirst)}</p>
            <p>
              <a href="${sectionPath('templates', language)}">${escapeHtml(strings.templatesAll)}</a> ·
              <a href="${sectionPath('tools', language)}">${escapeHtml(strings.toolsAll)}</a> ·
              <a href="${glossaryPath(language)}">${escapeHtml(strings.glossaryAll)}</a> ·
              <a href="${journalPath(language)}">${escapeHtml(strings.journal)}</a>
            </p>
          </div>
        </div>
${enquiry(language, copy)}
      </div>
      <section class="page-section">
        <h2 class="section-title">${escapeHtml(copy.scopeTitle)}</h2>
        <div class="article-body"><p>${escapeHtml(copy.scopeIntro)}</p></div>
${scopeBlock(copy)}
        <div class="article-body"><p><a class="text-link" href="${legalPath('terms', language)}">${escapeHtml(strings.legalNav_terms)}</a></p></div>
      </section>
      <section class="page-section">
        <h2 class="section-title">${escapeHtml(copy.howTitle)}</h2>
        <div class="article-body">
          <ol>${copy.how.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
        </div>
      </section>
      ${disclaimer(strings, language)}
    </div>`;

  // A Service rather than a Product: nothing is bought on this site, and the
  // catalogue exists so a search engine can see three named offerings instead
  // of one page about "sessions". Offers carry priceSpecification only when
  // there is a price - an Offer asserting price 0 would be a lie, and one
  // asserting a made-up number would be worse.
  const graph = [{
    '@type': 'Service',
    '@id': `${url}#service`,
    name: copy.heading,
    description: copy.description,
    serviceType: language === 'es' ? 'Educación financiera' : language === 'pt' ? 'Educação financeira' : 'Financial education',
    inLanguage: language,
    url,
    provider: { '@id': `${ORIGIN}/#sandy-bradbury` },
    areaServed: { '@type': 'Country', name: 'Spain' },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: url,
      availableLanguage: LANGUAGES
    },
    // The floor, and only the floor. An AggregateOffer with lowPrice and no
    // highPrice is the honest shape for "from X, the rest on request": it tells
    // a search engine the entry price without asserting a ceiling that has not
    // been decided. offerCount is the catalogue below, so the two agree.
    ...(SESSION_PRICE_FROM
      ? {
          offers: {
            '@type': 'AggregateOffer',
            '@id': `${url}#offers`,
            lowPrice: SESSION_PRICE_FROM[language].amount,
            priceCurrency: SESSION_PRICE_FROM[language].currency,
            offerCount: SESSIONS.length,
            availability: 'https://schema.org/InStock',
            url
          }
        }
      : {}),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: copy.heading,
      itemListElement: SESSIONS.map((session) => {
        const text = session[language];
        const price = priceOf(session);
        return {
          '@type': 'Offer',
          name: text.name,
          description: text.body,
          availability: 'https://schema.org/InStock',
          ...(price ? { priceSpecification: { '@type': 'PriceSpecification', price, priceCurrency: 'EUR' } } : {}),
          itemOffered: {
            '@type': 'Service',
            name: text.name,
            description: text.body,
            serviceType: language === 'es' ? 'Educación financiera' : language === 'pt' ? 'Educação financeira' : 'Financial education',
            provider: { '@id': `${ORIGIN}/#sandy-bradbury` }
          }
        };
      })
    }
  }];

  return renderShell({
    language,
    strings,
    section: 'sessions',
    pathFor: (code) => sessionsPath(code),
    title: copy.title,
    description: copy.description,
    heading: copy.heading,
    eyebrow: copy.eyebrow,
    intro: copy.intro,
    trail: [{ name: strings.sessionsNavLabel, href: sessionsPath(language) }],
    graph,
    body
  });
}

/** ------------------------------------------------------------------ build */

async function main() {
  const sidecar = JSON.parse(await fs.readFile(path.join(root, 'content', 'site', 'site.i18n.json'), 'utf8'));

  // Every session needs copy in every language, or one language ships a card
  // with `undefined` in it.
  for (const session of SESSIONS) {
    for (const language of LANGUAGES) {
      const text = session[language];
      for (const field of ['name', 'length', 'format', 'body', 'forWhom']) {
        if (!text?.[field]) {
          throw new Error(`Session "${session.id}" is missing ${language}.${field} in content/site/sessions.mjs.`);
        }
      }
    }
  }

  // The published floor has to exist in every language or one page prints a
  // headline reading "Desde undefined", which is worse than no headline. The
  // amount is checked for being a number rather than for being truthy, because
  // a free introductory session priced at 0 is a thing somebody might want and
  // 0 is falsy.
  if (SESSION_PRICE_FROM) {
    for (const language of LANGUAGES) {
      const entry = SESSION_PRICE_FROM[language];
      if (!entry) {
        throw new Error(`SESSION_PRICE_FROM has no entry for "${language}" in content/site/sessions.mjs.`);
      }
      if (!entry.display || !entry.currency || typeof entry.amount !== 'number') {
        throw new Error(
          `SESSION_PRICE_FROM.${language} needs a display string, a numeric amount and an ISO currency code ` +
            '(content/site/sessions.mjs).'
        );
      }
    }
  }

  // Prices are all-or-nothing. Two of three sessions priced reads as an error
  // to a visitor and is one, so it fails here instead.
  if (SESSION_PRICES) {
    const missing = SESSIONS.filter((session) => !SESSION_PRICES[session.id]).map((session) => session.id);
    if (missing.length > 0) {
      throw new Error(
        `SESSION_PRICES is set but has no price for: ${missing.join(', ')}. Either price every session or set ` +
          `SESSION_PRICES back to null so the whole page asks readers to request current rates.`
      );
    }
    const unknown = Object.keys(SESSION_PRICES).filter((id) => !SESSIONS.some((session) => session.id === id));
    if (unknown.length > 0) {
      throw new Error(`SESSION_PRICES prices session id(s) that do not exist: ${unknown.join(', ')}.`);
    }
  }

  const written = [];
  for (const language of LANGUAGES) {
    const strings = stringsFor(sidecar, language, 'site.i18n.json');
    const target = path.join(root, sessionsPath(language).replace(/^\//, ''), 'index.html');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, render(language, strings));
    written.push(sessionsPath(language));
  }

  console.log(
    `Sessions: ${written.length} page(s) — ${written.join(', ')} (${SESSIONS.length} session(s), ` +
      `${SESSION_PRICES ? 'all rates published' : SESSION_PRICE_FROM ? 'from-price published, rates on request' : 'rates on request'}).`
  );
  return written;
}

export { main as generateSessionsPage };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`generate-sessions-page: ${error.message}`);
    process.exitCode = 1;
  });
}
