// The chrome every page outside the journal and the simulators is wrapped in.
//
// Six page families are added by four generators - calculators, template
// landings, glossary index, glossary terms, category archives, legal pages and
// the sessions page - and all of them need the same twenty lines of head, the
// same header, the same breadcrumb, the same footer and, on the tools, the same
// compliance disclaimer. Written per generator that is four copies of a
// canonical tag and four copies of an hreflang cluster, which is four places
// for the next change to be made in three of them.
//
// The shell deliberately reuses the journal's stylesheets rather than
// introducing a design system of its own: blog.css already carries the type
// scale, the colour variables, `.site-shell`, `.container` and `.article-body`,
// and a page built out of those looks like the rest of the site for free.
// pages.css adds only what is genuinely new here.
import { escapeHtml, jsonLdScript } from './markdown.mjs';
// The section nav is shared with the journal and the simulators, which this
// shell does not render, so it lives in its own module. See the comment at the
// top of it for why one table rather than one per generator.
import { NAV_SCRIPT, assertSectionKey, sectionNav, sectionNavRow } from './section-nav.mjs';
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LEGAL_PAGES,
  ORIGIN,
  absolute,
  homePath,
  legalPath
} from './site-routes.mjs';

export { escapeHtml };

/**
 * The logo, at the sizes a browser actually paints it, through the Netlify
 * Image CDN. Same reasoning as generate-blog-pages.mjs: the master is a 2048px
 * square and the header paints it at 64.
 */
export function logoAt(size, format) {
  const extra = format ? `&amp;fm=${format}` : '';
  return `/.netlify/images?url=/logo-compounding-journey.png&amp;w=${size}&amp;h=${size}&amp;fit=cover${extra}`;
}

/**
 * The social card for every page on the site.
 *
 * Articles and pages alike share one image: the site logo, cropped once by the
 * Image CDN to the 1.91:1 the platforms lay out. This is a deliberate editorial
 * decision rather than a gap waiting to be filled - the pages carry no artwork,
 * so a per-page card would be an image that exists only to be shared, and the
 * alternative to a card is not "no image" but the grey rectangle Facebook,
 * LinkedIn and Slack render for a link that has none.
 */
export const socialCard = `${ORIGIN}/.netlify/images?url=/logo-compounding-journey.png&amp;w=1200&amp;h=630&amp;fit=cover&amp;fm=png`;
export const socialImageAlt = 'Compounding Journey logo';

export const localeOf = { es: 'es_ES', en: 'en_US', pt: 'pt_PT' };
export const languageNames = { en: 'English', es: 'Español', pt: 'Português' };

/**
 * The three flags in the language switcher, as inline SVG.
 *
 * They are inline rather than an <img> or an icon font because they are painted
 * in the header of every generated page: a request per flag per page, for
 * artwork that is four shapes, costs more than the bytes it saves. Exported so
 * that generate-blog-pages.mjs draws the same switcher from the same source -
 * two hand-kept copies of a header is how the simulators drifted.
 */
export const flags = {
  en: '<svg aria-hidden="true" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg"><rect width="28" height="20" fill="#fff"/><path fill="#B22234" d="M0 0h28v2H0zm0 4h28v2H0zm0 4h28v2H0zm0 4h28v2H0zm0 4h28v2H0zM0 19h28v1H0z"/><rect width="12" height="11" fill="#3C3B6E"/></svg>',
  es: '<svg aria-hidden="true" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg"><rect width="28" height="20" fill="#AA151B"/><rect y="5" width="28" height="10" fill="#F1BF00"/><rect x="7" y="8" width="2" height="5" rx=".5" fill="#AA151B" opacity=".85"/></svg>',
  pt: '<svg aria-hidden="true" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg"><rect width="28" height="20" fill="#009B3A"/><path fill="#FFDF00" d="m14 3 10 7-10 7-10-7z"/><circle cx="14" cy="10" r="4" fill="#002776"/></svg>'
};

/**
 * Reads a `{ key: { es, en, pt } }` sidecar into a `{ key: value }` table for
 * one language, throwing on any key that does not cover it.
 *
 * Strict on purpose, and for the same reason generate-simulator-pages.mjs is: a
 * missing translation that falls back to Spanish ships a page that is
 * three-quarters Portuguese, looks deliberate, and nobody reports it.
 */
export function stringsFor(sidecar, language, context = 'sidecar') {
  const out = {};
  for (const [key, value] of Object.entries(sidecar)) {
    if (key === 'comment') continue;
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`${context}: "${key}" must map to an object of language codes.`);
    }
    if (typeof value[language] !== 'string') {
      throw new Error(
        `${context}: "${key}" has no "${language}" value. Every key must cover all ` +
          `${LANGUAGES.length} languages (${LANGUAGES.join(', ')}).`
      );
    }
    out[key] = value[language];
  }
  return out;
}

function languageSwitcher(language, pathFor) {
  const links = LANGUAGES.map((code) => {
    const current = code === language ? ' aria-current="page"' : '';
    return `<a class="lang-btn" href="${pathFor(code)}"${current} aria-label="${languageNames[code]}" hreflang="${code}">${flags[code]}</a>`;
  }).join('');
  return `<nav class="header-language-switcher" aria-label="Language">${links}</nav>`;
}

/**
 * The breadcrumb, as markup and as the BreadcrumbList the markup is described
 * by. Both are built from one array so they cannot disagree about the trail -
 * a mismatch there is the kind of structured-data error Search Console reports
 * weeks later against a page that looks perfect.
 */
function breadcrumbMarkup(trail, label) {
  const items = trail
    .map((step, index) => {
      const last = index === trail.length - 1;
      const inner = last
        ? `<span aria-current="page">${escapeHtml(step.name)}</span>`
        : `<a href="${step.href}">${escapeHtml(step.name)}</a>`;
      return `<li>${inner}</li>`;
    })
    .join('');
  return `<nav class="crumbs" aria-label="${escapeHtml(label)}"><ol>${items}</ol></nav>`;
}

function breadcrumbData(trail, url) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: trail.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: absolute(step.href)
    }))
  };
}

/**
 * The compliance disclaimer.
 *
 * It is a `<section>` with a heading rather than a footnote in small print,
 * because its job is to be read: the site's author is a financial educator
 * without an advisory licence, and every page carrying a calculator, a
 * simulator or a projection has to say so where the numbers are, not only in a
 * FAQ answer three sections down the home page. `role="note"` is what gives
 * assistive technology the same signal the border and the icon give a sighted
 * reader.
 */
export function disclaimer(strings, language, { compact = false } = {}) {
  return `
      <aside class="compliance${compact ? ' compliance-compact' : ''}" role="note" aria-labelledby="compliance-title">
        <h2 id="compliance-title" class="compliance-title">${escapeHtml(strings.disclaimerTitle)}</h2>
        <p>${escapeHtml(strings.disclaimerBody)}</p>
        <a class="text-link" href="${legalPath('notice', language)}">${escapeHtml(strings.disclaimerLink)}</a>
      </aside>`;
}

function footer(strings, language, section, pathname) {
  const legal = Object.keys(LEGAL_PAGES)
    .map((page) => `<a href="${legalPath(page, language)}">${escapeHtml(strings[`legalNav_${page}`])}</a>`)
    .join('');
  return `
  <footer class="site-footer"><div class="container">
    <nav class="footer-legal" aria-label="${escapeHtml(strings.legalOtherPages)}">${legal}</nav>
    <div class="footer-row">
      ${sectionNavRow(section, language, pathname)}
      <span>© 2026 Compounding Journey — ${escapeHtml(strings.footerNote)}</span>
    </div>
  </div></footer>`;
}

/**
 * Renders one complete document.
 *
 * `pathFor(language)` is how the shell builds both the language switcher and
 * the hreflang cluster: the caller knows where its own page lives in each
 * language and nothing else here has to. `graph` is whatever page-specific
 * structured data the caller wants alongside the breadcrumb - a
 * SoftwareApplication for a calculator, a DefinedTerm for a glossary entry.
 *
 * `section` is which of the seven nav items this page belongs to, and the only
 * thing a caller has to say to get its nav item highlighted. A calculator and
 * the calculator index both pass 'tools'; a category archive passes 'journal',
 * because an archive is a slice of the journal rather than a section of its
 * own. The legal pages pass nothing, which is honest - they are in no section,
 * so the strip renders with nothing current. An unrecognised value throws
 * rather than quietly rendering no highlight at all.
 *
 * The nav also needs this page's own path, which is `pathFor(language)` and so
 * is not something a caller has to supply twice: it is how the nav decides
 * whether the highlighted tab links to this page or to the landing page above
 * it, which are two different `aria-current` values.
 */
export function renderShell({
  language,
  strings,
  pathFor,
  title,
  description,
  heading,
  eyebrow,
  intro,
  trail = [],
  graph = [],
  section = null,
  body,
  ogType = 'website',
  extraHead = '',
  extraScripts = '',
  bodyClass = ''
}) {
  assertSectionKey(section);

  const pathname = pathFor(language);
  const url = absolute(pathname);
  const alternateTags = LANGUAGES.map(
    (code) => `\n  <link rel="alternate" hreflang="${code}" href="${absolute(pathFor(code))}" />`
  ).join('');

  const fullTrail = [{ name: strings.home, href: homePath(language) }, ...trail];
  const jsonLd = jsonLdScript({
    '@context': 'https://schema.org',
    '@graph': [
      ...graph,
      breadcrumbData(fullTrail, url),
      { '@type': 'WebPage', '@id': url, url, name: title, inLanguage: language, description, isPartOf: { '@id': `${ORIGIN}/#website` }, publisher: { '@id': `${ORIGIN}/#organization` } }
    ]
  });

  return `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | Compounding Journey</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <meta name="author" content="Sandy Bradbury" />
  <link rel="canonical" href="${url}" />${alternateTags}
  <link rel="alternate" hreflang="x-default" href="${absolute(pathFor(DEFAULT_LANGUAGE))}" />
  <link rel="icon" type="image/png" sizes="64x64" href="${logoAt(64, 'png')}" />
  <link rel="apple-touch-icon" sizes="180x180" href="${logoAt(180, 'png')}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:site_name" content="Compounding Journey" />
  <meta property="og:locale" content="${localeOf[language]}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${socialCard}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:alt" content="${socialImageAlt}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${socialCard}" />
  <meta name="twitter:image:alt" content="${socialImageAlt}" />
  <link rel="preload" href="/assets/fonts/newsreader-latin.woff2?v=source" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/assets/fonts/dm-sans-latin.woff2?v=source" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/assets/css/blog.css?v=source" />
  <link rel="stylesheet" href="/assets/css/header.css?v=source" />
  <link rel="stylesheet" href="/assets/css/pages.css?v=source" />
  <link rel="stylesheet" href="/assets/css/a11y.css?v=source" />${extraHead}
  <script type="application/ld+json">
${jsonLd}
  </script>
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}><div class="site-shell">
  <a class="skip-link" href="#page-main">${escapeHtml(strings.skipToContent)}</a>
  <header class="site-header">
    <div class="header-shell">
      <a class="header-brand" href="${homePath(language)}"><span class="header-brand-logo"><img src="${logoAt(128)}" alt="Compounding Journey" width="128" height="128" fetchpriority="high" /></span><span class="header-brand-copy"><span class="header-brand-name">Compounding Journey</span><span class="header-brand-tagline">${escapeHtml(strings.tagline)}</span></span></a>
      <div class="header-actions">
        <a class="header-return-link" href="${homePath(language)}"><span class="return-long">${escapeHtml(strings.backToHome)}</span><span class="return-short">${escapeHtml(strings.home)}</span></a>
        ${languageSwitcher(language, pathFor)}
      </div>
    </div>
  </header>${sectionNav(section, language, pathname)}
  <main id="page-main" class="page-main">
    <div class="container">
      ${breadcrumbMarkup(fullTrail, strings.breadcrumbLabel)}
      <header class="page-head">
        ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
        <h1>${escapeHtml(heading)}</h1>
        ${intro ? `<p class="page-dek">${escapeHtml(intro)}</p>` : ''}
      </header>
    </div>
${body}
  </main>${footer(strings, language, section, pathname)}
</div>${NAV_SCRIPT}${extraScripts}</body>
</html>
`;
}
