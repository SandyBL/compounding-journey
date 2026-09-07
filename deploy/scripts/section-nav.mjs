// The section links every page on the site carries - a strip under the header
// where they fit, a hamburger menu in the header where they do not - and the one
// table their eight destinations come from.
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
// Two things are exported alongside the markup for the same reason. NAV_SCRIPT
// is the tag for assets/js/section-nav.js, the client half of this component -
// it reveals the menu button and stands the strip down below 768px, and centres
// the current tab where the strip is what is shown, so a page that renders the
// nav and forgets the script falls back to eight links a phone reader has to
// guess can be scrolled sideways. And assertSectionKey is what turns a mistyped
// section into a failed build rather than a page whose nav quietly highlights
// nothing.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { escapeHtml } from './markdown.mjs';
import { LANGUAGES, glossaryPath, journalPath, sectionPath } from './site-routes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The nav, in the order it is painted, with every URL resolved through
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
 */
const SECTION_NAV = [
  { key: 'journal', href: (code) => journalPath(code), label: 'journal' },
  { key: 'simulators', href: (code) => sectionPath('simulators', code), label: 'simulatorsNavLabel' },
  { key: 'tools', href: (code) => sectionPath('tools', code), label: 'toolsNavLabel' },
  { key: 'templates', href: (code) => sectionPath('templates', code), label: 'templatesNavLabel' },
  { key: 'glossary', href: (code) => glossaryPath(code), label: 'glossaryNavLabel' },
  { key: 'data', href: (code) => sectionPath('data', code), label: 'dataNavLabel' },
  // About before Sessions, and that order is the argument. A reader who has
  // just finished an article and is wondering whether to pay for an hour wants
  // to know who is on the other end of it first; a tab strip that offers the
  // invoice before the introduction asks for the decision in the wrong order.
  { key: 'about', href: (code) => sectionPath('about', code), label: 'aboutNavLabel' },
  { key: 'sessions', href: (code) => sectionPath('sessions', code), label: 'sessionsNavLabel' }
];

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
 * seven you are inside. It reads as "current" rather than "current page".
 *
 * Both are matched by `[aria-current]` in header.css, so the two announce
 * differently and paint the same - which is right, because the reader looking
 * at the strip is asking which section they are in, not whether this exact URL
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

function links(section, language, currentPath) {
  assertSectionKey(section);
  // A page that says which section it is in but not which page it is cannot be
  // rendered correctly - it would claim to be its own landing page - so the
  // caller has to say. Only a page in no section at all can leave it out.
  if (section !== null && typeof currentPath !== 'string') {
    throw new Error(
      `section-nav: rendering the nav with section "${section}" needs the path of `
      + `the page being rendered, so the current tab can say whether it links to `
      + `this page or to the landing page above it. Got ${currentPath === null ? 'null' : typeof currentPath}.`
    );
  }
  return SECTION_NAV
    .map((item) => {
      const current = currentAttribute(item, section, language, currentPath);
      return `<a href="${item.href(language)}"${current}>${escapeHtml(labelFor(item.label, language))}</a>`;
    })
    .join('');
}

/**
 * The hamburger button and the menu it opens, for the header of every page.
 *
 * The strip below the header solved the problem it was added for on a laptop
 * and only half solved it on a phone: eight tabs need about 620px and a phone
 * has 360, so what a reader saw was the three that fit and no indication that
 * the other five existed - a touch device draws no scrollbar, and the strip
 * happened to cut off between items rather than mid-word. A reader who arrived
 * on a glossary term from a search could reach the calculators only by going
 * back to the home page first, which is the problem the strip exists to solve.
 *
 * The home page has never had that problem, because it has a hamburger button
 * in its header and a menu behind it. This is that button, on the other two
 * hundred pages: same glyph, same place in the row, same two bars crossing into
 * an X when it opens. A reader who learns the control on the home page finds
 * the control they already know everywhere else.
 *
 * It goes in the header rather than in the nav below it, and that is the point
 * of putting it here rather than leaving the dropdown attached to the strip:
 * the header is sticky and the strip is not, so a menu hung off the header is
 * reachable from anywhere in a long article instead of only from the top of it.
 *
 * Three things about how it is rendered are deliberate.
 *
 * It ships with the `hidden` attribute, and assets/js/section-nav.js is what
 * removes it - along with marking the document so the strip stands down on
 * phone widths. A menu is not a menu without a script to open it, so the two
 * happen together: a page whose script has not run shows no button and keeps
 * the scrollable strip it has today. Nothing is taken away before its
 * replacement is known to work.
 *
 * The panel repeats the eight links rather than moving them, which is the one
 * duplication in this file. It is unavoidable now that the button is in the
 * header: the strip is a row under it, and one element cannot be both. What
 * matters is that both are rendered from SECTION_NAV in the same pass, so they
 * cannot come to name different destinations - which is the whole reason this
 * module exists. Only one of the two is ever in the accessibility tree, since
 * whichever does not apply at the current width is display: none.
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
 * The strip under the header.
 *
 * The home page's nav can never show which of these seven pages you are on,
 * because the home page is none of them - the state belongs on the destination.
 * Before this the destinations had nowhere to put it: their headers held the
 * brand, a link home and the flags, so a reader who landed on a glossary term
 * from a search had no way to reach the calculators except by going back to the
 * home page first.
 *
 * Deliberately flat, where the home page groups four of these under a Recursos
 * dropdown. A highlighted item inside a collapsed group is invisible, which
 * would defeat the point at the widths this strip is shown at - all eight fit
 * on one row there.
 *
 * Below 768px it is not shown at all: eight tabs do not fit a phone, so
 * headerMenu() above puts the same eight behind the hamburger button in the
 * header instead, and assets/js/section-nav.js stands this row down at the
 * same moment it reveals that button.
 *
 * It renders outside <header> on every family, so it scrolls away while the
 * 80px header stays. See the .site-section-nav comment in assets/css/header.css
 * for why sticking both would cost more than it gives.
 */
export function sectionNav(section, language, currentPath = null) {
  return `
  <nav class="site-section-nav" aria-label="${escapeHtml(labelFor('sectionNavLabel', language))}">
    <div class="site-section-tabs">${links(section, language, currentPath)}</div>
  </nav>`;
}

/**
 * The same links as a plain row, for the end of a page.
 *
 * A reader who has finished an article or a glossary entry is at the bottom of
 * the document, where the strip at the top is a scroll away. This is the second
 * place the same seven links appear, and rendering both from one table is what
 * keeps them the same seven.
 *
 * Labelled "site map" rather than "site sections", which is what the strip
 * above is called. Two navigation landmarks on one page with the same
 * accessible name is two indistinguishable entries in the landmark list a
 * screen reader offers, and the reader picking one has no way to know which
 * they will land in. The names are also honest about the difference: the one
 * under the header is where you are, the one at the foot of the page is
 * everywhere you could go from here.
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
