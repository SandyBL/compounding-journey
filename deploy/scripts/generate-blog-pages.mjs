// Pre-renders every Markdown article into a crawlable HTML page at
// /{lang}/blog/{slug}/ and rebuilds sitemap.xml from the same source of truth.
//
// The journal previously rendered articles in the browser from
// /{lang}/blog/article.html?post=<slug>, which meant every article shared one
// URL, one canonical and an empty HTML shell. Search engines had nothing to
// index. Running this after generate-blog-catalog.mjs gives each translation a
// real URL with its own content, metadata and structured data.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderMarkdown, collectHeadings, escapeHtml, normalizeMarkdown, jsonLdScript } from './markdown.mjs';
import { readViewCounts, readRecentViewCounts, totalsByTranslation, chooseFeatured, recentlyRead, translationPriorities } from './article-popularity.mjs';
import { readSharedCatalog } from './shared-catalog.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const contentRoot = path.join(root, 'content', 'blog');
const origin = 'https://compoundingjourney.com';
const languages = ['en', 'es', 'pt'];
const defaultLanguage = 'es';
const logo = `${origin}/logo-compounding-journey.png`;
// The 2048px master above is what social scrapers and structured data consume.
// Browsers only ever paint the mark at 64px in the header and 96px in the
// author card, so the pages themselves request that size from the Netlify
// Image CDN instead of downloading three quarters of a megabyte to scale it
// down. Ampersands are escaped because these land in HTML attributes.
function logoAt(size, format) {
  const extra = format ? `&amp;fm=${format}` : '';
  return `/.netlify/images?url=/logo-compounding-journey.png&amp;w=${size}&amp;h=${size}&amp;fit=cover${extra}`;
}
// Articles are text only by design: nothing between the headline and the prose,
// and no artwork inside the body. The one image an article still needs is the
// social card, because a link with no og:image is rendered by Facebook, X,
// LinkedIn and Slack as a bare grey rectangle. That card is the site logo for
// every article, so it is a constant rather than a per-article lookup.
//
// It used to be the 2048x2048 master in full: three quarters of a megabyte of
// mostly empty cream margin, sent to every scraper that touched a link and then
// cropped by each of them to its own shape. The Image CDN does the crop once, at
// the 1.91:1 the platforms actually lay out, and the margin is what it removes —
// the tree and the wordmark both sit well inside the kept band. The transfer
// drops to a few tens of kilobytes, which is the difference between a card that
// renders in a chat client and one that times out.
const socialCard = `${origin}/.netlify/images?url=/logo-compounding-journey.png&amp;w=1200&amp;h=630&amp;fit=cover&amp;fm=png`;
const socialImageAlt = 'Compounding Journey logo';

const simulatorSlugs = [
  'freedom-calendar',
  'market-time-machine',
  'passive-income-engine',
  'monte-carlo-fire'
];

const copy = {
  en: {
    locale: 'en_US',
    reading: 'min read',
    toc: 'In this article',
    insight: 'Key insight',
    authorPrefix: 'Written by',
    authorBio: 'Sandy writes about practical money systems, intentional work, and the patient path toward financial freedom.',
    back: '← Back to journal',
    backShort: '← Journal',
    backFooter: '← Back to the journal',
    home: 'Home',
    journal: 'Journal',
    skip: 'Skip to article',
    ctaEyebrow: 'Continue the Journey',
    ctaTitle: 'Turn insight into your next clear step.',
    ctaBody: 'Use the practical tools or complete the financial assessment to understand where your journey can go next.',
    ctaTools: 'Explore the tools',
    ctaAssessment: 'Take the assessment',
    readNextEyebrow: 'Keep reading',
    readNextTitle: 'Three more from the journal',
    readNextNote: 'Ideas that sit alongside this one. Pick the next step in your reading.',
    readNextLink: 'Read article',
    readNextAll: 'See every article',
    tagline: 'Your map to freedom',
    footerNote: 'Small choices. Long horizons.',
    // The journal index states how many articles it is showing. The number is
    // written into the markup here and recomputed by assets/js/blog-index.js
    // when a filter changes, so both have to agree on the wording.
    countOne: 'article',
    countMany: 'articles',
    // The featured card at the top of the index. Its badge says which rule
    // picked the article: the reading counts, or the fallback to the newest one
    // when nothing has been counted yet.
    featuredLink: 'Read the essay',
    featuredMostRead: 'Most read',
    featuredLatest: 'Latest',
    feedTitle: 'The Compounding Journal',
    feedDescription: 'Practical money systems, intentional work, and the patient path toward financial freedom.',
    feedLink: 'RSS feed',
    recentTitle: 'Read this month',
    recentNote: 'Ranked by how often each page was opened.',
    privacyNote: 'This journal counts how many times each article page is opened, and nothing else. No cookie, no identifier, no record of who read what \u2014 just a number per article, used to decide what to feature here.'
  },
  es: {
    locale: 'es_ES',
    reading: 'min de lectura',
    toc: 'En este artículo',
    insight: 'Idea clave',
    authorPrefix: 'Escrito por',
    authorBio: 'Sandy escribe sobre sistemas financieros prácticos, trabajo con intención y el camino paciente hacia la libertad financiera.',
    back: '← Volver al diario',
    backShort: '← Diario',
    backFooter: '← Volver al diario',
    home: 'Inicio',
    journal: 'Diario',
    skip: 'Ir al artículo',
    ctaEyebrow: 'Continúa el viaje',
    ctaTitle: 'Convierte la idea en tu siguiente paso claro.',
    ctaBody: 'Usa las herramientas prácticas o completa el diagnóstico financiero para saber hacia dónde puede seguir tu viaje.',
    ctaTools: 'Explorar las herramientas',
    ctaAssessment: 'Hacer el diagnóstico',
    readNextEyebrow: 'Sigue leyendo',
    readNextTitle: 'Tres lecturas más del diario',
    readNextNote: 'Ideas que acompañan a esta. Elige tu siguiente lectura.',
    readNextLink: 'Leer el artículo',
    readNextAll: 'Ver todos los artículos',
    tagline: 'Tu mapa hacia la libertad',
    footerNote: 'Decisiones pequeñas. Horizontes largos.',
    countOne: 'artículo',
    countMany: 'artículos',
    featuredLink: 'Leer el artículo',
    featuredMostRead: 'Lo más leído',
    featuredLatest: 'Lo más reciente',
    feedTitle: 'El Diario del Interés Compuesto',
    feedDescription: 'Sistemas prácticos de dinero, trabajo intencional y el camino paciente hacia la libertad financiera.',
    feedLink: 'Fuente RSS',
    recentTitle: 'Lo m\u00e1s le\u00eddo este mes',
    recentNote: 'Ordenado por cu\u00e1ntas veces se abri\u00f3 cada p\u00e1gina.',
    privacyNote: 'Este diario cuenta cu\u00e1ntas veces se abre cada art\u00edculo, y nada m\u00e1s. Sin cookies, sin identificadores, sin registro de qui\u00e9n ley\u00f3 qu\u00e9: solo un n\u00famero por art\u00edculo, que sirve para decidir qu\u00e9 destacar aqu\u00ed.'
  },
  pt: {
    locale: 'pt_PT',
    reading: 'min de leitura',
    toc: 'Neste artigo',
    insight: 'Ideia-chave',
    authorPrefix: 'Escrito por',
    authorBio: 'Sandy escreve sobre sistemas financeiros práticos, trabalho intencional e o caminho paciente para a liberdade financeira.',
    back: '← Voltar ao diário',
    backShort: '← Diário',
    backFooter: '← Voltar ao diário',
    home: 'Início',
    journal: 'Diário',
    skip: 'Ir para o artigo',
    ctaEyebrow: 'Continua a jornada',
    ctaTitle: 'Transforma a ideia no teu próximo passo claro.',
    ctaBody: 'Usa as ferramentas práticas ou completa o diagnóstico financeiro para perceber para onde pode seguir a tua jornada.',
    ctaTools: 'Explorar as ferramentas',
    ctaAssessment: 'Fazer o diagnóstico',
    readNextEyebrow: 'Continua a ler',
    readNextTitle: 'Mais três leituras do diário',
    readNextNote: 'Ideias que acompanham esta. Escolhe a tua próxima leitura.',
    readNextLink: 'Ler o artigo',
    readNextAll: 'Ver todos os artigos',
    tagline: 'O teu mapa para a liberdade',
    footerNote: 'Escolhas pequenas. Horizontes longos.',
    countOne: 'artigo',
    countMany: 'artigos',
    featuredLink: 'Ler o artigo',
    featuredMostRead: 'O mais lido',
    featuredLatest: 'O mais recente',
    feedTitle: 'O Diário dos Juros Compostos',
    feedDescription: 'Sistemas práticos de dinheiro, trabalho intencional e o caminho paciente para a liberdade financeira.',
    feedLink: 'Fonte RSS',
    recentTitle: 'O mais lido este m\u00eas',
    recentNote: 'Ordenado por quantas vezes cada p\u00e1gina foi aberta.',
    privacyNote: 'Este di\u00e1rio conta quantas vezes cada artigo \u00e9 aberto, e mais nada. Sem cookies, sem identificadores, sem registo de quem leu o qu\u00ea: apenas um n\u00famero por artigo, usado para decidir o que destacar aqui.'
  }
};

const flags = {
  en: '<svg aria-hidden="true" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg"><rect width="28" height="20" fill="#fff"/><path fill="#B22234" d="M0 0h28v2H0zm0 4h28v2H0zm0 4h28v2H0zm0 4h28v2H0zm0 4h28v2H0zM0 19h28v1H0z"/><rect width="12" height="11" fill="#3C3B6E"/></svg>',
  es: '<svg aria-hidden="true" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg"><rect width="28" height="20" fill="#AA151B"/><rect y="5" width="28" height="10" fill="#F1BF00"/><rect x="7" y="8" width="2" height="5" rx=".5" fill="#AA151B" opacity=".85"/></svg>',
  pt: '<svg aria-hidden="true" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg"><rect width="28" height="20" fill="#009B3A"/><path fill="#FFDF00" d="m14 3 10 7-10 7-10-7z"/><circle cx="14" cy="10" r="4" fill="#002776"/></svg>'
};

const languageNames = { en: 'English', es: 'Español', pt: 'Português' };

function parseScalar(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontMatter(source) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { attributes: {}, body: source };
  const attributes = {};
  let currentKey = '';
  match[1].split('\n').forEach((line) => {
    if (/^\s+/.test(line) && currentKey) {
      attributes[currentKey] += ` ${line.trim()}`;
      return;
    }
    const separator = line.indexOf(':');
    if (separator < 0) return;
    const key = line.slice(0, separator).trim();
    currentKey = key;
    attributes[key] = line.slice(separator + 1).trim();
  });
  Object.keys(attributes).forEach((key) => { attributes[key] = parseScalar(attributes[key]); });
  return { attributes, body: source.slice(match[0].length) };
}

function articlePath(language, slug) {
  return `/${language}/blog/${slug}/`;
}

function formatDate(language, date) {
  if (!date) return '';
  return new Intl.DateTimeFormat(language, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`));
}

function readingTime(markdown) {
  return Math.max(1, Math.ceil(markdown.trim().split(/\s+/).length / 210));
}

function languageSwitcher(article, current) {
  const links = languages.map((code) => {
    const slug = article.translations[code];
    const href = slug ? articlePath(code, slug) : `/${code}/blog/`;
    const currentAttribute = code === current ? ' aria-current="page"' : '';
    return `<a class="lang-btn" href="${href}"${currentAttribute} aria-label="${languageNames[code]}" hreflang="${code}">${flags[code]}</a>`;
  }).join('');
  return `<nav class="header-language-switcher" aria-label="Language">${links}</nav>`;
}

// Spanish keeps the apex URL; the other languages have their own pre-rendered
// home page written by generate-home-pages.mjs.
function homeHref(language) {
  return language === defaultLanguage ? '/' : `/${language}/`;
}

// An article that ends in a dead end sends the reader back to the browser tab
// bar. Three suggestions keep the journal reachable from every article and give
// crawlers internal links between translations of the same language.
// Same-category pieces come first because they are the closest continuation of
// what was just read; the newest of the rest fill any remaining slot.
function relatedArticles(article, all) {
  const pool = all
    .filter((candidate) => candidate.language === article.language && candidate.slug !== article.slug)
    .sort((first, second) => second.date.localeCompare(first.date));
  const sameCategory = pool.filter((candidate) => candidate.category === article.category);
  const others = pool.filter((candidate) => candidate.category !== article.category);
  return [...sameCategory, ...others].slice(0, 3);
}

function readNextSection(article, labels, related) {
  if (!related.length) return '';

  const cards = related.map((item, index) => `
        <a class="read-next-card" href="${articlePath(item.language, item.slug)}">
          <span class="read-next-index">${String(index + 1).padStart(2, '0')}</span>
          <span class="post-meta"><span>${escapeHtml(item.category)}</span><span>${item.readingTime} ${escapeHtml(labels.reading)}</span></span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary)}</p>
          <span class="read-next-link">${escapeHtml(labels.readNextLink)}</span>
        </a>`).join('');

  return `
    <section class="read-next" aria-labelledby="read-next-title"><div class="container">
      <div class="read-next-head">
        <div><p class="eyebrow">${escapeHtml(labels.readNextEyebrow)}</p><h2 id="read-next-title">${escapeHtml(labels.readNextTitle)}</h2></div>
        <p class="read-next-note">${escapeHtml(labels.readNextNote)}</p>
      </div>
      <div class="read-next-grid">${cards}
      </div>
      <a class="read-next-all text-link" href="/${article.language}/blog/">${escapeHtml(labels.readNextAll)}</a>
    </div></section>`;
}

function structuredData(article, labels, body) {
  const url = `${origin}${articlePath(article.language, article.slug)}`;
  const graph = [
    {
      '@type': 'BlogPosting',
      '@id': `${url}#article`,
      headline: article.title,
      description: article.summary,
      inLanguage: article.language,
      datePublished: article.date,
      dateModified: article.updated || article.date,
      url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      image: [logo],
      wordCount: body.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length,
      articleSection: article.category || undefined,
      author: { '@type': 'Person', '@id': `${origin}/#sandy-bradbury`, name: 'Sandy Bradbury', url: `${origin}/#biografia` },
      publisher: { '@id': `${origin}/#organization` },
      isPartOf: { '@type': 'Blog', '@id': `${origin}/${article.language}/blog/#blog` }
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: labels.home, item: `${origin}${homeHref(article.language)}` },
        { '@type': 'ListItem', position: 2, name: labels.journal, item: `${origin}/${article.language}/blog/` },
        { '@type': 'ListItem', position: 3, name: article.title, item: url }
      ]
    }
  ];
  return jsonLdScript({ '@context': 'https://schema.org', '@graph': graph });
}

function renderPage(article, labels, body, headings, related) {
  const url = `${origin}${articlePath(article.language, article.slug)}`;
  const alternates = languages
    .filter((code) => article.translations[code])
    .map((code) => `\n  <link rel="alternate" hreflang="${code}" href="${origin}${articlePath(code, article.translations[code])}" />`)
    .join('');
  const defaultSlug = article.translations[defaultLanguage] || article.translations.en || article.slug;
  const defaultCode = article.translations[defaultLanguage] ? defaultLanguage : (article.translations.en ? 'en' : article.language);
  const toc = headings.length
    ? `<aside class="toc" aria-label="${escapeHtml(labels.toc)}"><h2>${escapeHtml(labels.toc)}</h2><ol>${headings
        .map((heading) => `<li><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`).join('')}</ol></aside>`
    : '';

  return `<!doctype html>
<html lang="${article.language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(article.title)} | Compounding Journey</title>
  <meta name="description" content="${escapeHtml(article.summary)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <meta name="author" content="${escapeHtml(article.author)}" />
  <link rel="canonical" href="${url}" />${alternates}
  <link rel="alternate" hreflang="x-default" href="${origin}${articlePath(defaultCode, defaultSlug)}" />
  ${feedLinkTag(article.language, labels)}
  <link rel="icon" type="image/png" sizes="64x64" href="${logoAt(64, 'png')}" />
  <link rel="apple-touch-icon" sizes="180x180" href="${logoAt(180, 'png')}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Compounding Journey" />
  <meta property="og:locale" content="${labels.locale}" />
  <meta property="og:title" content="${escapeHtml(article.title)}" />
  <meta property="og:description" content="${escapeHtml(article.summary)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${socialCard}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:alt" content="${socialImageAlt}" />
  <meta property="article:published_time" content="${article.date}" />
  <meta property="article:modified_time" content="${article.updated || article.date}" />
  <meta property="article:author" content="${escapeHtml(article.author)}" />
  <meta property="article:section" content="${escapeHtml(article.category)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(article.title)}" />
  <meta name="twitter:description" content="${escapeHtml(article.summary)}" />
  <meta name="twitter:image" content="${socialCard}" />
  <meta name="twitter:image:alt" content="${socialImageAlt}" />
  <link rel="preload" href="/assets/css/blog.css?v=source" as="style" />
  <!-- Both faces paint above the fold - the serif sets the headline and the
       article body, the sans the header and the byline around it - and both are
       discovered three levels down a waterfall the browser cannot see past:
       HTML, then blog.css, then the @font-face inside it. Fonts are always
       fetched in CORS mode, hence crossorigin even though these are
       same-origin: without it the preload is discarded and the font downloads
       twice. The version has to match the one blog.css asks for, or it downloads
       twice for that reason instead. -->
  <link rel="preload" href="/assets/fonts/newsreader-latin.woff2?v=source" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/assets/fonts/dm-sans-latin.woff2?v=source" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/assets/css/blog.css?v=source" />
  <link rel="stylesheet" href="/assets/css/header.css?v=source" />
  <link rel="stylesheet" href="/assets/css/a11y.css?v=source" />
  <script type="application/ld+json">
${structuredData(article, labels, body)}
  </script>
</head>
<body><div class="site-shell">
  <a class="skip-link" href="#article-body">${escapeHtml(labels.skip)}</a>
  <header class="site-header">
    <div class="header-shell">
      <a class="header-brand" href="${homeHref(article.language)}"><span class="header-brand-logo"><img src="${logoAt(128)}" alt="Compounding Journey" width="128" height="128" fetchpriority="high" /></span><span class="header-brand-copy"><span class="header-brand-name">Compounding Journey</span><span class="header-brand-tagline">${escapeHtml(labels.tagline)}</span></span></a>
      <div class="header-actions">
        <a class="header-return-link" href="/${article.language}/blog/"><span class="return-long">${escapeHtml(labels.back)}</span><span class="return-short">${escapeHtml(labels.backShort)}</span></a>
        ${languageSwitcher(article, article.language)}
      </div>
    </div>
  </header>
  <main class="article-page-main"><article data-article-slug="${article.slug}">
    <header class="article-header"><div class="container article-header-inner"><div class="post-meta"><span>${escapeHtml(article.category)}</span><span>${escapeHtml(formatDate(article.language, article.date))}</span><span>${article.readingTime} ${escapeHtml(labels.reading)}</span></div><h1>${escapeHtml(article.title)}</h1><p class="article-dek">${escapeHtml(article.summary)}</p></div></header>
    <div class="container article-layout">${toc}<div><div id="article-body" class="article-body">
${body}
    </div><footer class="author-card"><img src="${logoAt(192)}" alt="Compounding Journey logo" width="192" height="192" loading="lazy" decoding="async" /><div><h2>${escapeHtml(labels.authorPrefix)} ${escapeHtml(article.author)}</h2><p>${escapeHtml(labels.authorBio)}</p></div></footer></div></div>
  </article>${readNextSection(article, labels, related)}
    <section class="tools-cta"><div class="container"><div class="cta-panel"><div><p class="eyebrow">${escapeHtml(labels.ctaEyebrow)}</p><h2>${escapeHtml(labels.ctaTitle)}</h2><p>${escapeHtml(labels.ctaBody)}</p></div><div class="journey-actions"><a class="button" href="${homeHref(article.language)}#herramientas">${escapeHtml(labels.ctaTools)}</a><a class="button button-secondary" href="${homeHref(article.language)}#assessment">${escapeHtml(labels.ctaAssessment)}</a></div></div></div></section>
  </main>
  <footer class="site-footer"><div class="container footer-row"><a href="/${article.language}/blog/">${escapeHtml(labels.backFooter)}</a><span>© 2026 Compounding Journey</span></div></footer>
</div><script src="/assets/js/article-view.js?v=source" defer></script></body>
</html>
`;
}

// The journal index renders its grid from its per-language catalog in the
// browser. That
// leaves crawlers with a page containing no links to any article, so the same
// list is also written into the markup between markers and simply replaced by
// the client script once it loads.
function replaceBetween(source, name, replacement) {
  const start = `<!--${name}:start-->`;
  const end = `<!--${name}:end-->`;
  const block = `${start}${replacement}${end}`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  return pattern.test(source) ? source.replace(pattern, block) : { block };
}

// The card at the top of the index, in the markup the hand-authored one used.
// The badge closes the meta line, which already carries a third item on the
// grid cards below: it names the rule that chose this article, so a reader is
// never told something is the most read one on a site that has counted no reads.
function featuredCard(language, labels, article, ranked) {
  const href = articlePath(language, article.slug);
  const badge = ranked ? labels.featuredMostRead : labels.featuredLatest;
  return `<article class="featured-card"><div class="featured-copy">`
    + `<div class="post-meta"><span>${escapeHtml(article.category)}</span><span>${escapeHtml(formatDate(language, article.date))}</span><span>${escapeHtml(badge)}</span></div>`
    + `<h2>${escapeHtml(article.title)}</h2><p>${escapeHtml(article.summary)}</p>`
    + `<a class="text-link" href="${href}">${escapeHtml(labels.featuredLink)}</a>`
    + `</div></article>`;
}

// The rail under the featured card. It is rendered here, at build time, from
// counts that are already known - so it costs no request, cannot shift the
// layout after paint, and is in the markup a crawler sees. When nothing has
// been counted the function returns an empty string and the section is simply
// not there, which is the only honest way to show a "read this month" list on a
// site that has not measured a month yet.
//
// The note under the heading is where the site says what it counts. A ranking
// by popularity invites the question, and answering it in one line next to the
// ranking is better than a policy page nobody opens.
function recentlyReadRail(language, labels, articles) {
  if (articles.length === 0) return '';

  const items = articles.map((article) => `<li><a href="${articlePath(language, article.slug)}">${escapeHtml(article.title)}</a><span>${escapeHtml(article.category)}</span></li>`).join('');
  return `<section class="recently-read" aria-labelledby="recently-read-title">`
    + `<h2 id="recently-read-title">${escapeHtml(labels.recentTitle)}</h2>`
    + `<ol>${items}</ol>`
    + `<p class="recently-read-note">${escapeHtml(labels.recentNote)}</p>`
    + `</section>`;
}

async function updateBlogIndex(language, articles, totals, recentCounts) {
  const file = path.join(root, language, 'blog', 'index.html');
  const labels = copy[language] || copy.en;
  let source = await fs.readFile(file, 'utf8');

  const sorted = [...articles].sort((first, second) => second.date.localeCompare(first.date));
  // Byte-for-byte the same card assets/js/blog-index.js builds, in the same
  // order the toolbar defaults to (date, descending). The trailing card-link was
  // missing here, so every card grew by one line the moment the catalog arrived
  // and the whole grid jumped - a layout shift the pre-rendered markup was
  // supposed to prevent. Keep the two templates in step.
  const cards = sorted.map((article) => `
        <article class="post-card">
          <div class="post-meta"><span>${language.toUpperCase()}</span><span>${escapeHtml(article.category)}</span><span>${escapeHtml(formatDate(language, article.date))}</span></div>
          <h3><a href="${articlePath(language, article.slug)}">${escapeHtml(article.title)}</a></h3>
          <p>${escapeHtml(article.summary)}</p>
          <a class="card-link" href="${articlePath(language, article.slug)}">${escapeHtml(labels.readNextLink)} →</a>
        </article>`).join('');

  // The count read "Loading articles…" until the fetch resolved, then became a
  // number - a second shift, and a live region that announced a loading message
  // to a screen reader on every visit. The real count is known here.
  const countNoun = sorted.length === 1 ? labels.countOne : labels.countMany;
  const resultCount = `${sorted.length} ${countNoun}`;

  // Which catalog this page's script fetches, and which exact version of it.
  // generate-blog-catalog.mjs has already written the file, so its hash is known
  // here; putting it in the URL makes a republished catalog a new URL, which is
  // what lets _headers serve it immutably instead of forbidding caching outright
  // as the shared full catalog had to be while it was still published.
  const catalogFile = path.join(contentRoot, `catalog.${language}.json`);
  const catalogHash = createHash('sha256')
    .update(await fs.readFile(catalogFile))
    .digest('hex')
    .slice(0, 12);
  const catalogUrl = `/content/blog/catalog.${language}.json?v=${catalogHash}`;

  const jsonLd = jsonLdScript({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `${origin}/${language}/blog/#blog`,
        url: `${origin}/${language}/blog/`,
        name: 'The Compounding Journal',
        inLanguage: language,
        publisher: { '@id': `${origin}/#organization` },
        blogPost: sorted.map((article) => ({
          '@type': 'BlogPosting',
          '@id': `${origin}${articlePath(language, article.slug)}#article`,
          headline: article.title,
          url: `${origin}${articlePath(language, article.slug)}`,
          datePublished: article.date,
          description: article.summary
        }))
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${origin}/${language}/blog/#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: labels.home, item: `${origin}${homeHref(language)}` },
          { '@type': 'ListItem', position: 2, name: labels.journal, item: `${origin}/${language}/blog/` }
        ]
      }
    ]
  });

  const script = `\n  <script type="application/ld+json">\n${jsonLd}\n  </script>\n  `;

  const gridResult = replaceBetween(source, 'articles', `${cards}\n      `);
  if (typeof gridResult === 'string') {
    source = gridResult;
  } else {
    source = source.replace(
      /(<div class="post-grid" data-post-grid[^>]*>)([\s\S]*?)(<\/div>\s*<div class="catalog-empty")/,
      `$1${gridResult.block}$3`
    );
  }

  source = source.replace(
    /<div class="post-grid" data-post-grid(?: data-catalog="[^"]*")?/,
    `<div class="post-grid" data-post-grid data-catalog="${escapeHtml(catalogUrl)}"`
  );

  const scriptResult = replaceBetween(source, 'jsonld', script);
  source = typeof scriptResult === 'string' ? scriptResult : source.replace('</head>', `${scriptResult.block}</head>`);

  // Feed discovery in the <head>, and a plain link in the footer for anyone who
  // wants to copy the URL rather than let their reader find it. Both go through
  // markers so this stays a patch of the committed index rather than a rewrite.
  const feedHeadResult = replaceBetween(source, 'feed', `\n  ${feedLinkTag(language, labels)}\n  `);
  source = typeof feedHeadResult === 'string'
    ? feedHeadResult
    : source.replace('</head>', `${feedHeadResult.block}</head>`);

  const footerLink = `<a href="/${language}/blog/feed.xml">${escapeHtml(labels.feedLink)}</a>`;
  const feedFooterResult = replaceBetween(source, 'feedlink', footerLink);
  source = typeof feedFooterResult === 'string'
    ? feedFooterResult
    : source.replace(
      /(<footer class="site-footer"><div class="container footer-row">[\s\S]*?)(<\/div><\/footer>)/,
      `$1${feedFooterResult.block}$2`
    );

  // What the site records, stated where a reader can find it rather than only
  // where the ranking appears. The rail above is conditional - it is absent
  // until something has been counted - and a disclosure that only shows up once
  // there is data to disclose is the wrong way round. This line is permanent.
  const privacy = `<p class="footer-privacy">${escapeHtml(labels.privacyNote)}</p>`;
  const privacyResult = replaceBetween(source, 'privacy', privacy);
  source = typeof privacyResult === 'string'
    ? privacyResult
    : source.replace(/(<\/div><\/footer>)/, `</div><div class="container">${privacyResult.block}</div></footer>`);

  const countResult = replaceBetween(source, 'count', resultCount);
  if (typeof countResult === 'string') {
    source = countResult;
  } else {
    source = source.replace(
      /(<p data-results-count[^>]*>)([\s\S]*?)(<\/p>)/,
      `$1${countResult.block}$3`
    );
  }

  // Which article is featured is decided here on every build, so publishing or
  // republishing anything from the content studio re-checks it. The markers are
  // in the index markup; the replacement of the bare card below is what puts
  // them there the first time this runs against a hand-authored index.
  const { article: featured, ranked } = chooseFeatured(sorted, totals);
  // A language with no articles has nothing to feature. It cannot happen while
  // every article is translated three ways, but leaving the previous card in
  // place is the right answer if it ever does - an empty featured section would
  // be a hole at the top of the page.
  if (featured) {
    const featuredResult = replaceBetween(source, 'featured', featuredCard(language, labels, featured, ranked));
    if (typeof featuredResult === 'string') {
      source = featuredResult;
    } else {
      source = source.replace(/<article class="featured-card">[\s\S]*?<\/article>/, featuredResult.block);
    }
  }

  // Rendered after the featured card is chosen, so the rail never repeats what
  // the card above it already shows.
  const recent = recentlyRead(articles, recentCounts, featured?.slug);
  const recentResult = replaceBetween(source, 'recent', recentlyReadRail(language, labels, recent));
  if (typeof recentResult === 'string') {
    source = recentResult;
  } else {
    source = source.replace(
      /(<article class="featured-card">[\s\S]*?<\/article>)/,
      `$1${recentResult.block}`
    );
  }

  await fs.writeFile(file, source);
  return { featured, ranked, recent };
}

// The generator only ever writes pages, so a slug renamed or deleted in the
// content studio used to leave its old directory behind: still deployed and
// still indexable, but missing from the sitemap and the journal index. That
// orphan then competes with the new URL. Deleting directories that no longer
// match a catalog slug keeps what is live equal to what is published.
async function pruneRemovedArticles(language, slugs) {
  const blogRoot = path.join(root, language, 'blog');
  const entries = await fs.readdir(blogRoot, { withFileTypes: true });
  const removed = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || slugs.has(entry.name)) continue;
    const directory = path.join(blogRoot, entry.name);
    const contents = await fs.readdir(directory);

    // Only remove what this script could have produced: a directory holding
    // index.html and nothing else. Anything hand-authored is reported instead,
    // because guessing wrong here deletes work no build step can recreate.
    if (contents.length !== 1 || contents[0] !== 'index.html') {
      console.warn(`Kept /${language}/blog/${entry.name}/ — not a generated page. Remove it by hand if it is stale.`);
      continue;
    }

    await fs.rm(directory, { recursive: true });
    removed.push(`/${language}/blog/${entry.name}/`);
  }

  return removed;
}

// lastmod is only emitted where a real modification date exists. Stamping every
// URL with the build date would tell Google the whole site changed on each
// deploy, which is the kind of unreliable signal that makes it ignore lastmod.
function sitemapEntry(loc, lastmod, alternates) {
  const links = alternates
    .map(({ hreflang, href }) => `\n    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}" />`)
    .join('');
  const modified = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `  <url>
    <loc>${loc}</loc>${modified}${links}
  </url>`;
}

function lastModified(article) {
  return article.updated || article.date;
}

// The date the sources behind a generated page were last committed, as
// YYYY-MM-DD, or '' when that cannot be established.
//
// Articles carry their own date in front matter, so the sitemap has always been
// able to state one for them. The home pages and the five simulators have no
// such field - they are built from a template and a bundle of translation
// strings - and half the sitemap consequently went out with no <lastmod> at all.
//
// The commit date of the source is the honest answer to "when did this page last
// change", and it is the only one available that does not drift: a file's mtime
// in CI is the time the checkout ran, and the build date would claim every URL
// changed on every deploy, which is exactly the unreliable signal the comment
// above sitemapEntry() exists to avoid. Committing a change is the act that
// changes a page here, so the two are the same event.
//
// Everything about this can fail - git may be absent, the clone may be shallow
// enough not to reach the last commit that touched the path, the path may be
// uncommitted - and every failure returns '', which reinstates the previous
// behaviour of omitting the element. An absent lastmod is a crawler's problem to
// solve by fetching; a wrong one is a signal it learns to distrust.
function lastCommitted(...relativePaths) {
  try {
    const stdout = execFileSync(
      'git',
      ['log', '-1', '--format=%cs', '--', ...relativePaths],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(stdout) ? stdout : '';
  } catch {
    return '';
  }
}

// Resolved once per build rather than once per URL: the three home pages come
// from one template, and the three language builds of a simulator come from one
// pair of source files, so each of these is a single git call answering three
// sitemap entries.
const homeLastModified = lastCommitted(path.join('content', 'home', 'index.html'));
const simulatorHubLastModified = lastCommitted(
  path.join('content', 'simulators', 'simulator-hub.html'),
  path.join('content', 'simulators', 'simulator-hub.i18n.json')
);
const simulatorLastModified = Object.fromEntries(simulatorSlugs.map((slug) => [
  slug,
  lastCommitted(
    path.join('content', 'simulators', `${slug}.html`),
    path.join('content', 'simulators', `${slug}.i18n.json`)
  )
]));

// RSS 2.0, one feed per language at /{lang}/blog/feed.xml.
//
// The journal is the only part of the site that gains items over time, and
// until now the only way to learn that it had was to visit it. A feed is the
// cheap, standard answer: readers subscribe in whatever client they already
// use, and the aggregators and AI crawlers that poll feeds rather than re-crawl
// pages get told about a new article instead of having to notice one.
//
// RSS rather than Atom because every reader handles it and the CMS produces
// nothing Atom would express better. Dates are RFC 822, which is what the spec
// requires and what strict validators check; the catalog stores plain
// YYYY-MM-DD, so they are read as UTC midnight rather than in the build
// machine's zone, which would move a date across a boundary depending on where
// the deploy ran.
function rfc822(date) {
  return new Date(`${date}T00:00:00Z`).toUTCString();
}

function buildFeed(language, articles, labels) {
  const self = `${origin}/${language}/blog/feed.xml`;
  const sorted = [...articles].sort((first, second) => second.date.localeCompare(first.date));

  // lastBuildDate is the newest article, not the moment of the build. Stamping
  // it with the deploy time tells every subscribed reader the feed changed on
  // every deploy, which is how a feed trains clients to poll it less.
  const newest = sorted[0] ? lastModified(sorted[0]) : '';

  const items = sorted.map((article) => {
    const url = `${origin}${articlePath(language, article.slug)}`;
    return `    <item>
      <title>${escapeHtml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(article.date)}</pubDate>
      <category>${escapeHtml(article.category)}</category>
      <dc:creator>${escapeHtml(article.author)}</dc:creator>
      <description>${escapeHtml(article.summary)}</description>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <channel>
    <title>${escapeHtml(labels.feedTitle)}</title>
    <link>${origin}/${language}/blog/</link>
    <description>${escapeHtml(labels.feedDescription)}</description>
    <language>${language}</language>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
    <image>
      <url>${logo}</url>
      <title>${escapeHtml(labels.feedTitle)}</title>
      <link>${origin}/${language}/blog/</link>
    </image>${newest ? `\n    <lastBuildDate>${rfc822(newest)}</lastBuildDate>` : ''}
${items}
  </channel>
</rss>
`;
}

// The <head> line that makes the feed discoverable: readers and browser
// extensions look for exactly this, and it is what turns a URL somebody has to
// be told about into one their client offers them. Every page in a language
// points at that language's feed.
function feedLinkTag(language, labels) {
  return `<link rel="alternate" type="application/rss+xml" title="${escapeHtml(labels.feedTitle)}" href="${origin}/${language}/blog/feed.xml" />`;
}

function buildSitemap(articles) {
  const homeAlternates = languages
    .map((code) => ({ hreflang: code, href: `${origin}${homeHref(code)}` }))
    .concat([{ hreflang: 'x-default', href: `${origin}/` }]);
  const blogAlternates = languages
    .map((code) => ({ hreflang: code, href: `${origin}/${code}/blog/` }))
    .concat([{ hreflang: 'x-default', href: `${origin}/es/blog/` }]);
  const simulatorAlternates = languages
    .map((code) => ({ hreflang: code, href: `${origin}/${code}/simulator.html` }))
    .concat([{ hreflang: 'x-default', href: `${origin}/es/simulator.html` }]);
  const simulatorToolEntries = simulatorSlugs.flatMap((slug) => {
    const alternates = languages
      .map((code) => ({ hreflang: code, href: `${origin}/${code}/simulators/${slug}.html` }))
      .concat([{ hreflang: 'x-default', href: `${origin}/es/simulators/${slug}.html` }]);
    return languages.map((code) => sitemapEntry(
      `${origin}/${code}/simulators/${slug}.html`,
      simulatorLastModified[slug],
      alternates
    ));
  });

  const newest = articles.reduce((latest, article) => (lastModified(article) > latest ? lastModified(article) : latest), '');

  const entries = [
    ...languages.map((code) => sitemapEntry(`${origin}${homeHref(code)}`, homeLastModified, homeAlternates)),
    ...languages.map((code) => sitemapEntry(`${origin}/${code}/blog/`, newest, blogAlternates)),
    ...languages.map((code) => sitemapEntry(`${origin}/${code}/simulator.html`, simulatorHubLastModified, simulatorAlternates)),
    ...simulatorToolEntries,
    ...articles.map((article) => sitemapEntry(
      `${origin}${articlePath(article.language, article.slug)}`,
      lastModified(article),
      languages
        .filter((code) => article.translations[code])
        .map((code) => ({ hreflang: code, href: `${origin}${articlePath(code, article.translations[code])}` }))
        .concat([{
          hreflang: 'x-default',
          href: `${origin}${articlePath(
            article.translations[defaultLanguage] ? defaultLanguage : article.language,
            article.translations[defaultLanguage] || article.slug
          )}`
        }])
    ))
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${entries.join('\n')}
</urlset>
`;
}

const catalog = await readSharedCatalog();
const prepared = [];

// Rendering happens in a second pass: the read-next section on any article needs
// the title, category and reading time of the others, so every article has to be
// parsed before the first page can be written.
for (const entry of catalog) {
  const source = await fs.readFile(path.join(contentRoot, entry.language, `${entry.slug}.md`), 'utf8');
  const { body: rawMarkdown } = parseFrontMatter(source);
  const labels = copy[entry.language] || copy.en;
  const markdown = normalizeMarkdown(rawMarkdown);
  const html = renderMarkdown(rawMarkdown, { origin }, labels);
  const headings = collectHeadings(html);
  const article = { ...entry, readingTime: readingTime(markdown) };

  prepared.push({ article, labels, html, headings });
}

const generated = prepared.map((item) => item.article);

for (const { article, labels, html, headings } of prepared) {
  const related = relatedArticles(article, generated);
  const directory = path.join(root, article.language, 'blog', article.slug);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'index.html'), renderPage(article, labels, html, headings, related));
}

const removed = [];
// One read of each counter for the whole run: the lifetime totals, summed per
// translation so the three indexes agree on which article is the most read one,
// and the trailing two month buckets that feed each index's own rail.
const viewCounts = await readViewCounts();
const totals = totalsByTranslation(generated, viewCounts);
const recentCounts = await readRecentViewCounts();

for (const language of languages) {
  const articles = generated.filter((article) => article.language === language);
  const { featured, ranked, recent } = await updateBlogIndex(language, articles, totals, recentCounts);
  removed.push(...await pruneRemovedArticles(language, new Set(articles.map((article) => article.slug))));

  const labels = copy[language] || copy.en;
  await fs.writeFile(path.join(root, language, 'blog', 'feed.xml'), buildFeed(language, articles, labels));

  let featuredNote = 'unchanged (no articles)';
  if (featured && ranked) featuredNote = `${featured.title} (${totals.get(featured.translationKey)} views)`;
  else if (featured) featuredNote = `${featured.title} (newest article; nothing counted yet)`;
  console.log(`Featured on /${language}/blog/: ${featuredNote}.`);
  console.log(recent.length
    ? `Read this month on /${language}/blog/: ${recent.length} article(s) listed.`
    : `Read this month on /${language}/blog/: nothing counted yet, rail omitted.`);
}

// Where the next hour of translation work pays best. Printed, not published:
// it is a note to whoever runs the journal, and it is only meaningful once
// there is enough reading to compare.
const priorities = translationPriorities(generated, viewCounts);
if (priorities.length) {
  console.log(`Translation priorities - ${priorities.length} article(s) read far more in one language than another:`);
  for (const { translationKey, strongest, weakest, total } of priorities) {
    console.log(`  ${translationKey}: ${strongest.language} ${strongest.views} vs ${weakest.language} ${weakest.views} (${total} total)`);
  }
  console.log('A wide gap usually means the weaker translation reads awkwardly or its title does not match how that audience searches.');
}

await fs.writeFile(path.join(root, 'sitemap.xml'), buildSitemap(generated));

console.log(`Generated ${generated.length} article pages, ${languages.length} journal indexes, ${languages.length} RSS feeds and sitemap.xml with ${generated.length + 21} URLs.`);

if (removed.length) {
  console.log(`Removed ${removed.length} article page(s) no longer in the catalog:`);
  removed.forEach((url) => console.log(`  ${url}`));
  console.log('A deleted article should 404 from here. If one of these was renamed instead, add a 301 to _redirects so the old URL keeps its ranking.');
}
