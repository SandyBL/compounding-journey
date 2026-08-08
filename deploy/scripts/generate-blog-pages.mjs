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
import { fileURLToPath } from 'node:url';
import { renderMarkdown, collectHeadings, escapeHtml, normalizeMarkdown } from './markdown.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const contentRoot = path.join(root, 'content', 'blog');
const origin = 'https://compoundingjourney.com';
const languages = ['en', 'es', 'pt'];
const defaultLanguage = 'es';
const logo = `${origin}/logo-compounding-journey.png`;

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
    tagline: 'Your map to freedom',
    footerNote: 'Small choices. Long horizons.'
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
    tagline: 'Tu mapa hacia la libertad',
    footerNote: 'Decisiones pequeñas. Horizontes largos.'
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
    tagline: 'O teu mapa para a liberdade',
    footerNote: 'Escolhas pequenas. Horizontes longos.'
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
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
}

function renderPage(article, labels, body, headings) {
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
  <link rel="icon" type="image/png" href="/logo-compounding-journey.png" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Compounding Journey" />
  <meta property="og:locale" content="${labels.locale}" />
  <meta property="og:title" content="${escapeHtml(article.title)}" />
  <meta property="og:description" content="${escapeHtml(article.summary)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${logo}" />
  <meta property="article:published_time" content="${article.date}" />
  <meta property="article:modified_time" content="${article.updated || article.date}" />
  <meta property="article:author" content="${escapeHtml(article.author)}" />
  <meta property="article:section" content="${escapeHtml(article.category)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(article.title)}" />
  <meta name="twitter:description" content="${escapeHtml(article.summary)}" />
  <meta name="twitter:image" content="${logo}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="/assets/css/blog.css?v=20260808-1" />
  <link rel="stylesheet" href="/assets/css/header.css?v=20260803-3" />
  <script type="application/ld+json">
${structuredData(article, labels, body)}
  </script>
</head>
<body><div class="site-shell">
  <a class="skip-link" href="#article-body">${escapeHtml(labels.skip)}</a>
  <header class="site-header">
    <div class="header-shell">
      <a class="header-brand" href="${homeHref(article.language)}"><span class="header-brand-logo"><img src="/logo-compounding-journey.png" alt="Compounding Journey" width="2048" height="2048" fetchpriority="high" /></span><span class="header-brand-copy"><span class="header-brand-name">Compounding Journey</span><span class="header-brand-tagline">${escapeHtml(labels.tagline)}</span></span></a>
      <div class="header-actions">
        <a class="header-return-link" href="/${article.language}/blog/"><span class="return-long">${escapeHtml(labels.back)}</span><span class="return-short">${escapeHtml(labels.backShort)}</span></a>
        ${languageSwitcher(article, article.language)}
      </div>
    </div>
  </header>
  <main class="article-page-main"><article>
    <header class="article-header"><div class="container article-header-inner"><div class="post-meta"><span>${escapeHtml(article.category)}</span><span>${escapeHtml(formatDate(article.language, article.date))}</span><span>${article.readingTime} ${escapeHtml(labels.reading)}</span></div><h1>${escapeHtml(article.title)}</h1><p class="article-dek">${escapeHtml(article.summary)}</p></div></header>
    <div class="container article-layout">${toc}<div><div id="article-body" class="article-body">
${body}
    </div><footer class="author-card"><img src="/logo-compounding-journey.png" alt="Compounding Journey logo" width="2048" height="2048" /><div><h2>${escapeHtml(labels.authorPrefix)} ${escapeHtml(article.author)}</h2><p>${escapeHtml(labels.authorBio)}</p></div></footer></div></div>
  </article>
    <section class="tools-cta"><div class="container"><div class="cta-panel"><div><p class="eyebrow">${escapeHtml(labels.ctaEyebrow)}</p><h2>${escapeHtml(labels.ctaTitle)}</h2><p>${escapeHtml(labels.ctaBody)}</p></div><div class="journey-actions"><a class="button" href="${homeHref(article.language)}#herramientas">${escapeHtml(labels.ctaTools)}</a><a class="button button-secondary" href="${homeHref(article.language)}#contacto">${escapeHtml(labels.ctaAssessment)}</a></div></div></div></section>
  </main>
  <footer class="site-footer"><div class="container footer-row"><a href="/${article.language}/blog/">${escapeHtml(labels.backFooter)}</a><span>© 2026 Compounding Journey</span></div></footer>
</div></body>
</html>
`;
}

// The journal index renders its grid from catalog.json in the browser. That
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

async function updateBlogIndex(language, articles) {
  const file = path.join(root, language, 'blog', 'index.html');
  const labels = copy[language] || copy.en;
  let source = await fs.readFile(file, 'utf8');

  const sorted = [...articles].sort((first, second) => second.date.localeCompare(first.date));
  const cards = sorted.map((article) => `
        <article class="post-card">
          <div class="post-meta"><span>${language.toUpperCase()}</span><span>${escapeHtml(article.category)}</span><span>${escapeHtml(formatDate(language, article.date))}</span></div>
          <h3><a href="${articlePath(language, article.slug)}">${escapeHtml(article.title)}</a></h3>
          <p>${escapeHtml(article.summary)}</p>
        </article>`).join('');

  const jsonLd = JSON.stringify({
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
  }, null, 2);

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

  const scriptResult = replaceBetween(source, 'jsonld', script);
  source = typeof scriptResult === 'string' ? scriptResult : source.replace('</head>', `${scriptResult.block}</head>`);

  await fs.writeFile(file, source);
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

  const newest = articles.reduce((latest, article) => (lastModified(article) > latest ? lastModified(article) : latest), '');

  const entries = [
    ...languages.map((code) => sitemapEntry(`${origin}${homeHref(code)}`, '', homeAlternates)),
    ...languages.map((code) => sitemapEntry(`${origin}/${code}/blog/`, newest, blogAlternates)),
    ...languages.map((code) => sitemapEntry(`${origin}/${code}/simulator.html`, '', simulatorAlternates)),
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

const catalog = JSON.parse(await fs.readFile(path.join(contentRoot, 'catalog.json'), 'utf8'));
const generated = [];

for (const entry of catalog) {
  const source = await fs.readFile(path.join(contentRoot, entry.language, `${entry.slug}.md`), 'utf8');
  const { body: rawMarkdown } = parseFrontMatter(source);
  const labels = copy[entry.language] || copy.en;
  const markdown = normalizeMarkdown(rawMarkdown);
  const html = renderMarkdown(rawMarkdown, { origin }, labels);
  const headings = collectHeadings(html);
  const article = { ...entry, readingTime: readingTime(markdown) };

  const directory = path.join(root, entry.language, 'blog', entry.slug);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'index.html'), renderPage(article, labels, html, headings));
  generated.push(article);
}

const removed = [];

for (const language of languages) {
  const articles = generated.filter((article) => article.language === language);
  await updateBlogIndex(language, articles);
  removed.push(...await pruneRemovedArticles(language, new Set(articles.map((article) => article.slug))));
}

await fs.writeFile(path.join(root, 'sitemap.xml'), buildSitemap(generated));

console.log(`Generated ${generated.length} article pages, ${languages.length} journal indexes and sitemap.xml with ${generated.length + 9} URLs.`);

if (removed.length) {
  console.log(`Removed ${removed.length} article page(s) no longer in the catalog:`);
  removed.forEach((url) => console.log(`  ${url}`));
  console.log('A deleted article should 404 from here. If one of these was renamed instead, add a 301 to _redirects so the old URL keeps its ranking.');
}
