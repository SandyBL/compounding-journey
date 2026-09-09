// The site's navigation - the pill in the header, the menu behind the hamburger
// and the row at the foot of the page - and the one table their destinations
// come from.
//
// Four page families render this nav and they share no markup: the pages
// scripts/page-shell.mjs wraps (calculators, template landings, the glossary,
// category archives, the sessions page, the data page), the three journal
// indexes, every journal article, and the fifteen simulator documents. Written
// per generator that is four copies of eight URLs and their labels in three
// languages - four places for the next section to be added to three of them.
// The footer row was already that mistake once: it named five destinations
// because the simulators and the templates were added to the site after it was
// written, and nothing pointed the omission out.
//
// What the header renders is the home page's own nav, item for item. It used to
// be a flat strip of eight tabs under the header, which was a second design of
// the same idea: a reader who learned the grouped pill on the way in met a
// different shape of the same links on every page after. The strip is gone and
// headerNav() below draws the pill instead - same classes, same stylesheet
// (assets/css/header.css, which the home page loads too), same Recursos
// dropdown, same order. The two differences are deliberate and both are about
// what a page is: the home page ends its pill with the Freedom Compass button,
// which is that page's own call to action rather than a section of the site, and
// the pages here open with a link back to the home page, which the home page has
// no use for.
//
// The phone menu is untouched by that change. Below the pill's breakpoint the
// hamburger in the header opens the same flat panel of page links it always
// has - headerMenu() - because the panel is a list of destinations rather than a
// row that has to fit, so grouping four of them behind a disclosure would add a
// tap to reach a calculator and hide the highlight that says where the reader is.
//
// Two things are exported alongside the markup for the same reason. NAV_SCRIPT
// is the tag for assets/js/section-nav.js, the client half of this component -
// it reveals the menu button, opens the panel behind it and adds the click and
// Escape handling the pill's dropdown needs on top of the CSS that already
// opens it on hover and on focus. And assertSectionKey is what turns a mistyped
// section into a failed build rather than a page whose nav quietly highlights
// nothing.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { escapeHtml } from './markdown.mjs';
import { LANGUAGES, glossaryPath, homePath, journalPath, sectionPath } from './site-routes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The eight pages the nav points at, with every URL resolved through
 * site-routes.mjs so the labels are the only thing this file owns.
 *
 * `simulators` pointed at `/<lang>/simulator.html` until the section had an
 * index, which meant the tab labelled "Simuladores" opened one particular
 * simulator - the personal finance one - rather than the list of five. It now
 * points at the index, like every other tab here points at a list.
 *
 * The labels are keys into content/site/site.i18n.json rather than strings.
 * Several of the pages have a title too long to set as a tab - the calculator
 * index is headed "Calculadoras financieras" - so the nav has its own short
 * labels there, and they live in the same sidecar as every other translated
 * string on the site.
 *
 * This is also the order the phone panel and the footer row list them in.
 * About before Sessions, and that order is the argument. A reader who has just
 * finished an article and is wondering whether to pay for an hour wants to know
 * who is on the other end of it first; a menu that offers the invoice before
 * the introduction asks for the decision in the wrong order.
 */
const SECTION_NAV = [
  { key: 'journal', href: (code) => journalPath(code), label: 'journal' },
  { key: 'simulators', href: (code) => sectionPath('simulators', code), label: 'simulatorsNavLabel' },
  { key: 'tools', href: (code) => sectionPath('tools', code), label: 'toolsNavLabel' },
  { key: 'templates', href: (code) => sectionPath('templates', code), label: 'templatesNavLabel' },
  { key: 'glossary', href: (code) => glossaryPath(code), label: 'glossaryNavLabel' },
  { key: 'data', href: (code) => sectionPath('data', code), label: 'dataNavLabel' },
  { key: 'about', href: (code) => sectionPath('about', code), label: 'aboutNavLabel' },
  { key: 'sessions', href: (code) => sectionPath('sessions', code), label: 'sessionsNavLabel' }
];

/**
 * The header pill's own shape: the same destinations, grouped and ordered the
 * way the home page groups and orders them.
 *
 * Nothing here restates a URL. A `section` entry names one of the eight above
 * and is rendered from it, so the pill cannot come to point somewhere the phone
 * panel does not - which is the whole reason this module exists.
 *
 * The two entries that are not sections are the two items the home page nav has
 * that are not pages: FAQ and Contacto are bands of the home document, so from
 * anywhere else on the site they are a link to the home page and a fragment.
 * The fragment in the href is what does the work: the browser scrolls to the
 * band on arrival, and the home page's own script reads the hash on load for
 * the cases where it has to move focus as well.
 *
 * `route` is the apex shortcut that lands on the same band - /faq is a 301 in
 * _redirects and siteRoutes in the home page's script maps it back to this
 * fragment - and it is carried through as data-site-route only so that the two
 * copies of this pill are the same markup. Nothing on the pages rendered here
 * reads it; the handler that does is in assets/js/home.js, where the click
 * happens inside the document being scrolled. There is no /contact shortcut, so
 * that item claims none: naming one would name a URL that does not resolve.
 */
const HEADER_NAV = [
  { section: 'journal' },
  { section: 'simulators' },
  {
    group: 'resourcesNavLabel',
    id: 'desktop-resources-menu',
    sections: ['tools', 'templates', 'glossary', 'data']
  },
  { section: 'about' },
  { section: 'sessions' },
  { fragment: 'preguntas-frecuentes', label: 'faqNavLabel', route: '/faq' },
  { fragment: 'contacto', label: 'contactNavLabel' }
];

/** The chevron on the Recursos disclosure, byte for byte the home page's. */
const CHEVRON = '<svg aria-hidden="true" viewBox="0 0 16 16" fill="none">'
  + '<path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/**
 * The nav reads its own labels rather than being handed them, because the four
 * generators that render it do not all load this sidecar for anything else -
 * generate-simulator-pages.mjs translates from five sidecars of its own - and a
 * nav that only works when the caller remembers to pass eight particular
 * strings is a nav with a second way to go wrong.
 */
const sidecar = JSON.parse(
  await fs.readFile(path.join(root, 'content', 'site', 'site.i18n.json'), 'utf8')
);

function labelFor(key, language) {
  const entry = sidecar[key];
  if (!entry || typeof entry[language] !== 'string') {
    throw new Error(
      `section-nav: content/site/site.i18n.json has no "${language}" value for `
      + `"${key}", which the section nav needs. Every key it uses must cover all `
      + `${LANGUAGES.length} languages (${LANGUAGES.join(', ')}).`
    );
  }
  return entry[language];
}

function itemFor(key) {
  const item = SECTION_NAV.find((entry) => entry.key === key);
  if (!item) {
    throw new Error(
      `section-nav: the header nav names the section "${key}", which is not one of `
      + `${SECTION_NAV.map((entry) => entry.key).join(', ')}.`
    );
  }
  return item;
}

export function assertSectionKey(section) {
  if (section === null || SECTION_NAV.some((item) => item.key === section)) return;
  throw new Error(
    `section-nav: "${section}" is not a section nav key. Use one of `
    + `${SECTION_NAV.map((item) => item.key).join(', ')}, or null for a page that is in no section.`
  );
}

/**
 * Which of the two `aria-current` values this item gets, or none at all.
 *
 * Most pages on the site are not the page their own tab links to: a glossary
 * term, a calculator, an article and a standalone simulator all sit under a
 * landing page, and the tab points at the landing page. `aria-current="page"`
 * means "this link is the document you are reading", so claiming it on a
 * glossary term would have a screen reader announce the Glosario link as the
 * current page while activating it navigates somewhere else. `true` is the
 * value for the weaker, and here far more common, claim: this is the one of the
 * eight you are inside. It reads as "current" rather than "current page".
 *
 * Both are matched by `[aria-current]` in header.css, so the two announce
 * differently and paint the same - which is right, because the reader looking
 * at the nav is asking which section they are in, not whether this exact URL
 * is the one in the address bar.
 *
 * The current item stays a real link rather than becoming a span: it is still
 * the way to reload the page or to get back up to the landing page from a term,
 * and a nav whose items change element type between pages is a nav that has to
 * be relearned on each one.
 */
function currentAttribute(item, section, language, currentPath) {
  if (item.key !== section) return '';
  return item.href(language) === currentPath ? ' aria-current="page"' : ' aria-current="true"';
}

function assertRenderable(section, currentPath, what) {
  assertSectionKey(section);
  // A page that says which section it is in but not which page it is cannot be
  // rendered correctly - it would claim to be its own landing page - so the
  // caller has to say. Only a page in no section at all can leave it out.
  if (section !== null && typeof currentPath !== 'string') {
    throw new Error(
      `section-nav: rendering ${what} with section "${section}" needs the path of `
      + `the page being rendered, so the current item can say whether it links to `
      + `this page or to the landing page above it. Got ${currentPath === null ? 'null' : typeof currentPath}.`
    );
  }
}

function links(section, language, currentPath) {
  assertRenderable(section, currentPath, 'the nav');
  return SECTION_NAV
    .map((item) => {
      const current = currentAttribute(item, section, language, currentPath);
      return `<a href="${item.href(language)}"${current}>${escapeHtml(labelFor(item.label, language))}</a>`;
    })
    .join('');
}

/**
 * The pill in the header: the home page's nav, on every other page of the site.
 *
 * It is a direct child of `.header-shell`, between the brand and the header
 * actions, which is where the home page keeps its own - the shell is a
 * space-between flex row on both, so the pill centres itself between the two.
 * Inside `header.site-header` rather than below it, which is the other half of
 * what replacing the strip bought: the header is sticky, so the way off a page
 * is now reachable from the bottom of a long article instead of only from the
 * top of it. The strip could not be sticky itself without putting a 128px
 * double-decker on every phone viewport and breaking the two sidebars measured
 * against the header's height (.toc at 108px, .legal-toc at 96px).
 *
 * Below 1180px it is not painted at all: seven items and a brand lockup do not
 * fit, so headerMenu() below puts the eight pages behind the hamburger there
 * instead. That is the same width the home page swaps its own pill for a drawer
 * at, and the arithmetic behind it is written out in the .desktop-section-nav
 * block in assets/css/header.css.
 *
 * The simulators hold it back to 1280px, because the middle of their header is
 * not free: that row also carries up to four of the tool's own controls, and
 * they keep the hamburger over the difference. Nothing about this function
 * changes for them - the markup is identical and the two rules that make the
 * exception are in header.css, scoped to .simulator-header-shell.
 *
 * The Recursos disclosure needs no script to open: assets/css/header.css opens
 * it on hover and on `:focus-within`, so a keyboard reader can tab into the four
 * links and a reader with no JavaScript at all still reaches them.
 * assets/js/section-nav.js adds click-to-open and Escape on top of that.
 */
export function headerNav(section, language, currentPath = null) {
  assertRenderable(section, currentPath, 'the header nav');

  const body = HEADER_NAV.map((entry) => {
    if (entry.group) {
      const children = entry.sections.map((key) => {
        const item = itemFor(key);
        const current = currentAttribute(item, section, language, currentPath);
        return `<a href="${item.href(language)}"${current}>${escapeHtml(labelFor(item.label, language))}</a>`;
      }).join('');
      return `<div class="desktop-resources" data-resources-dropdown>`
        + `<button type="button" class="desktop-resources-toggle" aria-expanded="false" aria-controls="${entry.id}">`
        + `${escapeHtml(labelFor(entry.group, language))}${CHEVRON}</button>`
        + `<div id="${entry.id}" class="desktop-resources-menu">${children}</div></div>`;
    }

    if (entry.fragment) {
      const route = entry.route ? ` data-site-route="${entry.route}"` : '';
      return `<a href="${homePath(language)}#${entry.fragment}"${route}>`
        + `${escapeHtml(labelFor(entry.label, language))}</a>`;
    }

    const item = itemFor(entry.section);
    const current = currentAttribute(item, section, language, currentPath);
    return `<a href="${item.href(language)}"${current}>${escapeHtml(labelFor(item.label, language))}</a>`;
  }).join('');

  return `<nav class="desktop-section-nav" aria-label="${escapeHtml(labelFor('sectionNavLabel', language))}">${body}</nav>`;
}

/**
 * The hamburger button and the menu it opens, for the header of every page.
 *
 * The home page has had this control since it was built, and this is the same
 * one on the other two hundred pages: same glyph, same place at the end of the
 * header row, same two bars crossing into an X when it opens. A reader who
 * learns the control on the home page finds the control they already know
 * everywhere else.
 *
 * It goes in the header rather than below it, which is what makes it reachable
 * from anywhere in a long article rather than only from the top: the header is
 * sticky. On the simulators that is the whole point - their footer is a docked
 * call to action rather than a set of links, so it is the only route off the
 * tool that stays on screen.
 *
 * Three things about how it is rendered are deliberate.
 *
 * It ships with the `hidden` attribute, and assets/js/section-nav.js is what
 * removes it. A menu is not a menu without a script to open it, so a page whose
 * script has not run shows no button rather than a control that does nothing;
 * the footer row every family renders is the route off the page in that case.
 *
 * The panel repeats the eight links rather than moving them, which is the one
 * duplication in this file. It is unavoidable now that the button is in the
 * header: the pill is a row in the same header, and one element cannot be both.
 * What matters is that both are rendered from SECTION_NAV in the same pass, so
 * they cannot come to name different destinations. Only one of the two is ever
 * in the accessibility tree, since whichever does not apply at the current
 * width is display: none.
 *
 * And the button's two labels are handed to the script as data attributes
 * rather than looked up there. Both halves of this component then read their
 * strings from content/site/site.i18n.json, and a fourth language is a change
 * to the sidecar rather than to a table hidden in a script - which is the
 * mistake the home page's own menu made, where the three translations of
 * "Open navigation menu" are written into assets/js/home.js.
 */
export function headerMenu(section, language, currentPath = null) {
  const navLabel = escapeHtml(labelFor('sectionNavLabel', language));
  const open = escapeHtml(labelFor('sectionMenuOpenLabel', language));
  const close = escapeHtml(labelFor('sectionMenuCloseLabel', language));
  return `<div class="site-header-menu">`
    + `<button type="button" class="site-menu-toggle" aria-expanded="false"`
    + ` aria-controls="site-menu-panel" aria-label="${open}"`
    + ` data-label-open="${open}" data-label-close="${close}" hidden>`
    + `<span class="site-menu-toggle__icon" aria-hidden="true"></span></button>`
    + `<div id="site-menu-panel" class="site-menu-panel" hidden>`
    + `<p class="site-menu-panel__label">${navLabel}</p>`
    + `<nav class="site-menu-nav" aria-label="${navLabel}">`
    + links(section, language, currentPath)
    + `</nav></div></div>`;
}

/**
 * The same links as a plain row, for the end of a page.
 *
 * A reader who has finished an article or a glossary entry is at the bottom of
 * the document, where the header is a scroll away - and it is the one place the
 * eight pages are listed with no script involved at all, which is what a reader
 * whose JavaScript never ran has instead of the hamburger. Rendering it from the
 * same table is what keeps it the same eight.
 *
 * Labelled "site map" rather than "site sections", which is what the nav in the
 * header is called. Two navigation landmarks on one page with the same
 * accessible name is two indistinguishable entries in the landmark list a
 * screen reader offers, and the reader picking one has no way to know which
 * they will land in. The names are also honest about the difference: the one in
 * the header is where you are, the one at the foot of the page is everywhere you
 * could go from here.
 */
export function sectionNavRow(section, language, currentPath = null) {
  return `<nav aria-label="${escapeHtml(labelFor('sectionNavFooterLabel', language))}">${links(section, language, currentPath)}</nav>`;
}

/**
 * The tag for the client half. Exported so that the four generators link the
 * same file with the same version placeholder, which is the arrangement that
 * stops one of them shipping the nav without it.
 */
export const NAV_SCRIPT = '<script src="/assets/js/section-nav.js?v=source" defer></script>';
