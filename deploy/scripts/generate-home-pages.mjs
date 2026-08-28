// Pre-renders the multi-language homepage into one single-language document per
// URL: / for Spanish, /en/ and /pt/ for the others.
//
// content/home/index.html is the authored source. It carries all three
// translations at once, tagged with lang-content="es|en|pt", and reveals one of
// them with a CSS class that JavaScript sets on load. That works for a browser
// and fails for everything else: /, /?lang=en and /?lang=pt were byte-identical
// responses, so the two secondary languages had no document of their own, every
// address advertised the same canonical, and a crawler that does not run
// JavaScript read all three translations interleaved in one <html lang="es">
// page. The assistants that answer questions from the open web — ChatGPT,
// Claude, Perplexity — are exactly that kind of reader.
//
// This script does what generate-blog-pages.mjs already does for articles:
// it gives each translation a real URL with only its own text, its own
// canonical, its own metadata and its own structured data.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { jsonLdScript } from './markdown.mjs';
import { readSharedCatalog } from './shared-catalog.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const templateFile = path.join(root, 'content', 'home', 'index.html');
const origin = 'https://compoundingjourney.com';
const languages = ['es', 'en', 'pt'];
const defaultLanguage = 'es';

// Elements whose contents are not markup. The scanner has to jump over them, or
// a "<" inside a script string would be read as the start of a tag.
const rawTextElements = new Set(['script', 'style', 'textarea', 'title']);
const voidElements = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

function languagePath(language) {
  return language === defaultLanguage ? '/' : `/${language}/`;
}

function languageUrl(language) {
  return `${origin}${languagePath(language)}`;
}

function outputFile(language) {
  return language === defaultLanguage
    ? path.join(root, 'index.html')
    : path.join(root, language, 'index.html');
}

function escapeAttribute(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

// Article titles and summaries are author-written Markdown front matter, so an
// ampersand or an angle bracket in one of them is ordinary text rather than
// markup. Everything rendered from the catalog goes through here.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- template HTML scanner -------------------------------------------------

// Reads the tag starting at `start`, tracking quotes so that a ">" inside an
// attribute value does not end the tag early.
function readTag(html, start) {
  const closing = html[start + 1] === '/';
  let cursor = start + (closing ? 2 : 1);
  const nameStart = cursor;
  while (cursor < html.length && /[a-zA-Z0-9:-]/.test(html[cursor])) cursor += 1;
  const name = html.slice(nameStart, cursor).toLowerCase();
  if (!name) return null;

  let quote = null;
  while (cursor < html.length) {
    const character = html[cursor];
    if (quote) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      const raw = html.slice(start, cursor + 1);
      return {
        name,
        closing,
        raw,
        start,
        end: cursor + 1,
        attributes: raw.slice(name.length + (closing ? 2 : 1), -1),
        selfClosing: html[cursor - 1] === '/'
      };
    }
    cursor += 1;
  }
  return null;
}

function skipRawText(lower, name, from) {
  const close = lower.indexOf(`</${name}`, from);
  return close < 0 ? lower.length : close;
}

// Walks forward from just after an opening tag to the index past its matching
// close tag, counting nested openings of the same name.
function findElementEnd(html, lower, name, from) {
  let depth = 1;
  let cursor = from;

  while (cursor < html.length) {
    const next = html.indexOf('<', cursor);
    if (next < 0) return -1;

    const tag = readTag(html, next);
    if (!tag) {
      cursor = next + 1;
      continue;
    }

    if (rawTextElements.has(tag.name) && !tag.closing) {
      cursor = skipRawText(lower, tag.name, tag.end);
      continue;
    }

    if (tag.name === name) {
      if (tag.closing) {
        depth -= 1;
        if (depth === 0) return tag.end;
      } else if (!tag.selfClosing && !voidElements.has(tag.name)) {
        depth += 1;
      }
    }

    cursor = tag.end;
  }

  return -1;
}

// Drops every lang-content element that is not the requested language. A kept
// element is scanned into, so a wrapper in one language holding spans in
// another is still resolved correctly.
function keepOnlyLanguage(html, keep) {
  const lower = html.toLowerCase();
  let cursor = 0;
  let copiedUpTo = 0;
  let output = '';
  let kept = 0;
  let removed = 0;

  while (cursor < html.length) {
    const next = html.indexOf('<', cursor);
    if (next < 0) break;

    const tag = readTag(html, next);
    if (!tag) {
      cursor = next + 1;
      continue;
    }

    if (rawTextElements.has(tag.name) && !tag.closing) {
      cursor = skipRawText(lower, tag.name, tag.end);
      continue;
    }

    const match = tag.closing ? null : tag.attributes.match(/\slang-content="([a-z]{2})"/);
    if (!match) {
      cursor = tag.end;
      continue;
    }

    if (match[1] === keep) {
      kept += 1;
      cursor = tag.end;
      continue;
    }

    const end = tag.selfClosing || voidElements.has(tag.name)
      ? tag.end
      : findElementEnd(html, lower, tag.name, tag.end);

    if (end < 0) {
      throw new Error(`Unclosed <${tag.name} lang-content="${match[1]}"> in the homepage template.`);
    }

    output += html.slice(copiedUpTo, next);
    copiedUpTo = end;
    cursor = end;
    removed += 1;
  }

  output += html.slice(copiedUpTo);
  return { html: output, kept, removed };
}

// A mis-parse here would silently ship a homepage with another language still
// embedded in it, which is the exact problem this script exists to remove.
function assertSingleLanguage(html, keep) {
  const lower = html.toLowerCase();
  let cursor = 0;

  while (cursor < html.length) {
    const next = html.indexOf('<', cursor);
    if (next < 0) break;

    const tag = readTag(html, next);
    if (!tag) {
      cursor = next + 1;
      continue;
    }

    if (rawTextElements.has(tag.name) && !tag.closing) {
      cursor = skipRawText(lower, tag.name, tag.end);
      continue;
    }

    const match = tag.closing ? null : tag.attributes.match(/\slang-content="([a-z]{2})"/);
    if (match && match[1] !== keep) {
      throw new Error(`A <${tag.name} lang-content="${match[1]}"> survived the split for "${keep}".`);
    }

    cursor = tag.end;
  }
}

// --- template configuration ------------------------------------------------

// The titles, descriptions and per-language link targets already live in the
// template's own script. Reading them back out keeps one source of truth
// instead of a second copy here that can drift.
function extractObjectLiteral(source, name) {
  const declaration = `const ${name} = `;
  const start = source.indexOf(declaration);
  if (start < 0) throw new Error(`Could not find "${name}" in the homepage template.`);

  let cursor = start + declaration.length;
  let depth = 0;
  let quote = null;

  for (; cursor < source.length; cursor += 1) {
    const character = source[cursor];

    if (quote) {
      if (character === '\\') cursor += 1;
      else if (character === quote) quote = null;
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character;
    } else if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        return vm.runInNewContext(`(${source.slice(start + declaration.length, cursor + 1)})`);
      }
    }
  }

  throw new Error(`Could not read the "${name}" object from the homepage template.`);
}

// --- head, structured data and link rewriting ------------------------------

function replaceTagAttribute(html, selector, attribute, value) {
  const pattern = new RegExp(`(<[^<>]*${selector}[^<>]*?\\s${attribute}=")[^"]*(")`);
  if (!pattern.test(html)) {
    throw new Error(`Could not rewrite ${attribute} on ${selector} in the homepage template.`);
  }
  return html.replace(pattern, (whole, before, after) => `${before}${escapeAttribute(value)}${after}`);
}

function rewriteHead(html, language, config) {
  let output = html;

  // Comments marked "build:" explain the build to whoever edits the template
  // and mean nothing to a browser. Some of them are worse than nothing in the
  // output: the one above the Tailwind <link> describes the ?v=source
  // placeholder and how version-assets.mjs replaces it, which is a description
  // of a token that is no longer in the file by the time anyone can read the
  // comment. They are stripped here rather than deleted from the template,
  // because the template is where they are true and where they are needed.
  //
  // Matched from the start of their line so the surrounding indentation and the
  // newline go with them, and anchored on the marker so an ordinary comment -
  // the section headings through the body, which do belong in the output - is
  // never touched.
  output = output.replace(/^[ \t]*<!--\s*build:[\s\S]*?-->\r?\n/gm, '');

  // This file is rewritten on every deploy. Without the notice the obvious
  // place to edit the home page is the home page, and the change is gone at
  // the next build.
  output = output.replace(
    /<!doctype html>/i,
    `<!doctype html>\n<!-- Generated by scripts/generate-home-pages.mjs from content/home/index.html. Do not edit: edit the template. -->`
  );

  output = output.replace(
    /<html[^>]*>/,
    `<html lang="${language}" data-page-language="${language}">`
  );
  output = output.replace(
    /(<body[^>]*class=")([^"]*)(")/,
    (whole, before, classes, after) => `${before}${classes.replace(/\blang-[a-z]{2}\b/, `lang-${language}`)}${after}`
  );
  output = output.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${config.pageTitles[language]}</title>`
  );

  output = replaceTagAttribute(output, 'id="meta-description"', 'content', config.pageDescriptions[language]);
  output = replaceTagAttribute(output, 'id="canonical-link"', 'href', languageUrl(language));
  output = replaceTagAttribute(output, 'id="og-title"', 'content', config.pageTitles[language]);
  output = replaceTagAttribute(output, 'id="og-description"', 'content', config.pageDescriptions[language]);
  output = replaceTagAttribute(output, 'id="og-url"', 'content', languageUrl(language));
  output = replaceTagAttribute(output, 'id="og-locale"', 'content', config.openGraphLocales[language]);
  output = replaceTagAttribute(output, 'id="twitter-title"', 'content', config.pageTitles[language]);
  output = replaceTagAttribute(output, 'id="twitter-description"', 'content', config.pageDescriptions[language]);

  for (const code of languages) {
    output = replaceTagAttribute(output, `id="alternate-${code}"`, 'href', languageUrl(code));
  }
  output = replaceTagAttribute(output, 'id="alternate-default"', 'href', languageUrl(defaultLanguage));

  return output;
}

// One page carried three FAQPage entries, one per translation. Only the one
// that matches the document survives, and a WebPage node is added so the page
// itself is described rather than only the site around it.
function rewriteStructuredData(html, language, config) {
  const pattern = /(<script type="application\/ld\+json">\s*)([\s\S]*?)(\s*<\/script>)/;
  const match = html.match(pattern);
  if (!match) throw new Error('Could not find the homepage JSON-LD block.');

  const data = JSON.parse(match[2]);
  const url = languageUrl(language);

  const graph = data['@graph'].filter((node) => node['@type'] !== 'FAQPage');
  const faq = data['@graph'].find((node) => node['@type'] === 'FAQPage' && node.inLanguage === language);

  const webPage = {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: config.pageTitles[language],
    description: config.pageDescriptions[language],
    inLanguage: language,
    isPartOf: { '@id': `${origin}/#website` },
    about: { '@id': `${origin}/#organization` },
    primaryImageOfPage: { '@type': 'ImageObject', url: `${origin}/logo-compounding-journey.png` },
    ...(faq ? { mainEntity: { '@id': `${url}#faq` } } : {})
  };

  if (faq) {
    faq['@id'] = `${url}#faq`;
    faq.url = `${url}#preguntas-frecuentes`;
    faq.isPartOf = { '@id': `${url}#webpage` };
  }

  data['@graph'] = [...graph, webPage, ...(faq ? [faq] : [])];

  // hasPart and other cross-references still point at the retired query-string
  // addresses; move every one of them to the directory URLs in a single pass.
  const serialized = jsonLdScript(data)
    .replace(new RegExp(`${origin}/\\?lang=en`, 'g'), `${origin}/en/`)
    .replace(new RegExp(`${origin}/\\?lang=pt`, 'g'), `${origin}/pt/`);

  return html.replace(pattern, `$1${serialized}$3`);
}

function setAttribute(rawTag, attribute, value) {
  const pattern = new RegExp(`\\s${attribute}="[^"]*"`);
  const replacement = ` ${attribute}="${escapeAttribute(value)}"`;
  if (pattern.test(rawTag)) return rawTag.replace(pattern, replacement);
  return rawTag.replace(/^<([a-zA-Z0-9:-]+)/, `<$1${replacement}`);
}

function removeAttribute(rawTag, attribute) {
  return rawTag.replace(new RegExp(`\\s${attribute}(="[^"]*")?`), '');
}

// The newsletter, journal, assessment and template links were left on their
// Spanish targets in the markup and repointed by JavaScript on load. A reader
// that does not run scripts was therefore given Spanish downloads on the
// English page, so the correct target is baked in per language instead.
// A download link that does not say what it hands over is a leap of faith.
// The size is read from the file on disk at build time so the label cannot
// drift away from the artefact it describes. Entries that point at an external
// page rather than a file (the monthly analysis template is sold off-site) are
// labelled as such instead, so the button's "download" wording is qualified.
const externalTemplateLabel = {
  es: 'Página externa',
  en: 'External page',
  pt: 'Página externa'
};

async function rewriteTemplateMeta(html, language, config) {
  const downloads = config.templateDownloads[language] ?? {};
  let output = html;

  for (const [key, target] of Object.entries(downloads)) {
    const pattern = new RegExp(
      `(<p[^>]*\\sdata-template-meta="${key}"[^>]*>)([\\s\\S]*?)(</p>)`
    );
    if (!pattern.test(output)) continue;

    let label;

    if (/^https?:/i.test(target.href)) {
      label = externalTemplateLabel[language];
    } else {
      const extension = path.extname(target.href).replace('.', '').toUpperCase() || 'FILE';
      try {
        const stats = await fs.stat(path.join(root, target.href.replace(/^\//, '')));
        label = `${extension} · ${Math.max(1, Math.round(stats.size / 1024))} KB`;
      } catch {
        throw new Error(
          `Template download "${key}" for "${language}" points at ${target.href}, which is not on disk.`
        );
      }
    }

    output = output.replace(pattern, `$1${label}$3`);
  }

  return output;
}

// The generated documents live at /, /en/ and /pt/. A relative `src` or `href`
// therefore resolves against a different base in each one, which silently 404s
// the asset on two of the three languages instead of failing the build. Every
// asset reference must be root-relative, absolute, a fragment or a known scheme.
const allowedUrlPrefixes = /^(\/|#|https?:|mailto:|tel:|data:|javascript:|\{)/i;

function assertAbsoluteAssetUrls(html, language) {
  const offenders = [];
  const pattern = /\s(?:src|href|poster|action)="([^"]*)"/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const value = match[1].trim();
    if (value === '' || allowedUrlPrefixes.test(value)) continue;
    offenders.push(value);
  }

  if (offenders.length > 0) {
    const unique = [...new Set(offenders)];
    throw new Error(
      `Relative asset URL(s) in the "${language}" homepage: ${unique.join(', ')}. `
      + 'Use a root-relative path ("/assets/…") so the reference resolves the same '
      + 'way at /, /en/ and /pt/.'
    );
  }
}

function rewriteLocalizedLinks(html, language, config) {
  const lower = html.toLowerCase();
  let cursor = 0;
  let copiedUpTo = 0;
  let output = '';
  let rewritten = 0;

  while (cursor < html.length) {
    const next = html.indexOf('<', cursor);
    if (next < 0) break;

    const tag = readTag(html, next);
    if (!tag) {
      cursor = next + 1;
      continue;
    }

    if (rawTextElements.has(tag.name) && !tag.closing) {
      cursor = skipRawText(lower, tag.name, tag.end);
      continue;
    }

    if (tag.closing) {
      cursor = tag.end;
      continue;
    }

    let raw = tag.raw;

    if (/\sdata-newsletter-link\b/.test(tag.attributes)) {
      raw = setAttribute(raw, 'href', config.newsletterLinks[language]);
    }

    if (/\sdata-blog-link\b/.test(tag.attributes)) {
      raw = setAttribute(raw, 'href', `/${language}/blog/`);
    }

    const assessment = tag.attributes.match(/\sdata-assessment-link="([^"]+)"/);
    if (assessment) {
      const target = config.assessmentLinks[language]?.[assessment[1]];
      if (target) raw = setAttribute(raw, 'href', target);
    }

    const template = tag.attributes.match(/\sdata-template-download="([^"]+)"/);
    if (template) {
      const target = config.templateDownloads[language]?.[template[1]];
      if (target) {
        raw = setAttribute(raw, 'href', target.href);
        raw = target.filename
          ? setAttribute(raw, 'download', target.filename)
          : removeAttribute(raw, 'download');
      }
    }

    // The brand lockup was hardcoded to "/", so the logo on /en/ and /pt/ threw
    // the reader back into Spanish.
    if (/\sdata-home-link\b/.test(tag.attributes)) {
      raw = setAttribute(raw, 'href', languagePath(language));
    }

    // The language switcher is a set of real links; only the state marker
    // differs per document.
    const langSwitch = tag.attributes.match(/\sdata-lang-switch="([^"]+)"/);
    if (langSwitch) {
      const isCurrent = langSwitch[1] === language;
      raw = isCurrent
        ? setAttribute(raw, 'aria-current', 'page')
        : removeAttribute(raw, 'aria-current');

      const classes = (raw.match(/\sclass="([^"]*)"/)?.[1] ?? '')
        .split(/\s+/)
        .filter(name => name && name !== 'active');
      if (isCurrent) classes.push('active');
      raw = setAttribute(raw, 'class', classes.join(' '));
    }

    // Netlify Forms metadata that shipped Spanish on every language.
    const formCopy = tag.attributes.match(/\sdata-form-copy="([^"]+)"/);
    if (formCopy) {
      const value = config.formCopy[language]?.[formCopy[1]];
      if (value) raw = setAttribute(raw, 'value', value);
    }

    if (raw !== tag.raw) {
      output += html.slice(copiedUpTo, tag.start) + raw;
      copiedUpTo = tag.end;
      rewritten += 1;
    }

    cursor = tag.end;
  }

  output += html.slice(copiedUpTo);
  return { html: output, rewritten };
}

// --- latest journal articles -------------------------------------------------

// The three cards in the "From the blog" section. They are written here, at
// build time, from the same catalog the journal itself is built from, so
// publishing an article stays one Markdown file: the home page follows on the
// next deploy rather than becoming a fourth place somebody has to remember to
// edit.

const LATEST_ARTICLE_COUNT = 3;
const LATEST_ARTICLES_BLOCK = /<!--latest-articles:start-->[\s\S]*?<!--latest-articles:end-->/;

// `reading` is worded exactly as the journal words it, because a reader who
// follows a card sees the same phrase again in the article's own header.
const latestArticleLabels = {
  es: { read: 'Leer el artículo', empty: 'Pronto habrá artículos aquí.', published: 'Publicado el', reading: 'min de lectura' },
  en: { read: 'Read the article', empty: 'Articles are on their way.', published: 'Published', reading: 'min read' },
  pt: { read: 'Ler o artigo', empty: 'Em breve haverá artigos aqui.', published: 'Publicado em', reading: 'min de leitura' }
};

function articlePath(language, slug) {
  return `/${language}/blog/${slug}/`;
}

function formatDate(language, date) {
  if (!date) return '';
  return new Intl.DateTimeFormat(language, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`));
}

const TEASER_LIMIT = 140;

// The first sentence of the article's own summary, clipped on a word boundary
// if that sentence runs long, so a card never ends mid-word or on a comma.
function teaser(summary) {
  const text = String(summary ?? '').trim();
  if (!text) return '';

  const sentence = text.match(/^[\s\S]*?[.!?…](?=\s|$)/);
  const first = (sentence ? sentence[0] : text).trim();
  if (first.length <= TEASER_LIMIT) return first;

  const cut = first.slice(0, TEASER_LIMIT + 1);
  const lastSpace = cut.lastIndexOf(' ');
  const clipped = lastSpace > 0 ? cut.slice(0, lastSpace) : cut.slice(0, TEASER_LIMIT);
  return `${clipped.replace(/[\s,;:.–—-]+$/, '')}…`;
}

// The date on a card is the day the article was published, and only ever that.
// `article.date` is the `date:` field of the article's own front matter - the one
// the CMS labels "Publication date" - and the catalog carries nothing else that
// looks like a date, so there is no `updated` or `dateModified` here to reach for
// by accident. If one is ever added, it belongs in the article's structured data
// and not in this card: a reader scanning the blog section wants to know when a
// piece was written, not when a typo in it was corrected.
//
// The visible text is the date alone, because three cards in a row that each
// repeat the word "Published" read as noise. The label is there for anyone
// listening to the page instead of looking at it, where "12 August 2026" next to
// a category and a headline carries no clue about what it is a date of.
//
// The reading time next to the date is the same figure the article's own header
// states, taken from the catalog rather than counted again here: a card that
// promised four minutes and opened onto a five-minute article would be a small
// lie, and the kind that only shows up once it is live. It sits with the date
// because both answer the same question - is this worth opening now - and the
// meta row wraps rather than shrinking, so three items still fit on a narrow
// card. An article whose reading time is missing renders the row as it was.
function articleCard(language, labels, article) {
  const href = articlePath(language, article.slug);
  const title = escapeHtml(article.title);
  const summary = escapeHtml(teaser(article.summary));
  const category = escapeHtml(article.category ?? '');
  const publishedOn = escapeHtml(formatDate(language, article.date));
  const minutes = Number(article.readingTime);
  const readingTime = Number.isFinite(minutes) && minutes > 0
    ? `
                                <span class="h-1 w-1 shrink-0 rounded-full bg-darkbark/30" aria-hidden="true"></span>
                                <span>${minutes} ${escapeHtml(labels.reading)}</span>`
    : '';

  return `                    <article class="group flex flex-col bg-white border border-creamborder rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3">
                            <span class="text-[10px] font-extrabold uppercase tracking-widest text-warmgold">${category}</span>
                            <span class="h-px w-8 shrink-0 bg-warmgold/50" aria-hidden="true"></span>
                            <span class="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-darkbark/45">
                                <time datetime="${escapeAttribute(article.date ?? '')}"><span class="sr-only">${escapeHtml(labels.published)} </span>${publishedOn}</time>${readingTime}
                            </span>
                        </div>
                        <div class="flex-grow">
                            <h3 class="text-xl font-extrabold text-forestgreen mb-2 leading-snug">
                                <a href="${href}" class="rounded transition-colors hover:text-warmgold focus:ring-4 focus:ring-warmgold/30">${title}</a>
                            </h3>
                            <p class="text-sm text-darkbark/70 leading-relaxed">${summary}</p>
                        </div>
                        <div class="mt-6">
                            <a href="${href}" aria-label="${escapeAttribute(`${labels.read}: ${article.title}`)}" class="inline-flex items-center gap-2 rounded text-xs font-extrabold text-forestgreen transition-colors hover:text-warmgold focus:ring-4 focus:ring-warmgold/30">
                                ${escapeHtml(labels.read)}
                                <i class="fa-solid fa-arrow-right text-warmgold group-hover:translate-x-0.5 transition-transform"></i>
                            </a>
                        </div>
                    </article>`;
}

// Throws rather than leaving the grid empty. A missing marker would otherwise
// build clean and ship a section that is a heading and a button with a gap
// between them, which is a failure nobody sees until it is live.
function renderLatestArticles(html, language, catalog) {
  if (!LATEST_ARTICLES_BLOCK.test(html)) {
    throw new Error(
      'The latest-articles markers are missing from content/home/index.html. '
      + 'The three journal cards on the home page are written between them.'
    );
  }

  const labels = latestArticleLabels[language];
  const articles = catalog
    .filter((article) => article.language === language && article.slug && article.title)
    .sort((first, second) => String(second.date).localeCompare(String(first.date)))
    .slice(0, LATEST_ARTICLE_COUNT);

  const cards = articles.length > 0
    ? articles.map((article) => articleCard(language, labels, article)).join('\n')
    : `                    <p class="text-sm text-darkbark/70">${escapeHtml(labels.empty)}</p>`;

  return { html: html.replace(LATEST_ARTICLES_BLOCK, `\n${cards}\n                `), count: articles.length };
}

// --- inline asset extraction ------------------------------------------------

// The template keeps its CSS and JavaScript inline, which is the right place to
// author them: one file to edit, and the styles sit next to the markup they
// describe. It is the wrong thing to ship. Those three blocks are roughly 84 KB,
// they were repeated in full in all three generated documents, and none of it
// could be cached — a returning visitor re-downloaded every byte with the HTML,
// and a visitor who read the page in a second language downloaded it again.
//
// So the blocks are lifted out here into three files under /assets, named with a
// hash of their own contents. All three pages link the same URLs, so the second
// and third language cost nothing; the hash means a changed block is a changed
// URL, which is what lets _headers cache them for a year; and moving the code
// out of the document is the prerequisite for a Content-Security-Policy that
// does not have to permit inline scripts.
//
// Contents are copied verbatim, indentation and all. The behaviour block is full
// of template literals, and re-indenting would rewrite the strings inside them.
const INLINE_ASSETS = [
  {
    label: 'styles',
    // Matched in place so the <link> lands exactly where the <style> was. The
    // cascade on this page is icons.css, styles.css, these rules, header.css,
    // a11y.css - moving the block would change which declarations win.
    pattern: /<style>([\s\S]*?)<\/style>/,
    file: path.join('assets', 'css', 'home.css'),
    url: '/assets/css/home.css',
    tag: (url) => `<link rel="stylesheet" href="${url}">`
  },
  {
    label: 'identity callback',
    pattern: /<script type="module">([\s\S]*?)<\/script>/,
    file: path.join('assets', 'js', 'home-identity.js'),
    url: '/assets/js/home-identity.js',
    // Hoisted into <head>. Second, because a module is deferred whether or not
    // anyone asks and the behaviour block below has to keep running first.
    hoist: 2,
    tag: (url) => `<script type="module" src="${url}"></script>`
  },
  {
    label: 'behaviour',
    pattern: /<script>([\s\S]*?)<\/script>/,
    file: path.join('assets', 'js', 'home.js'),
    url: '/assets/js/home.js',
    // Hoisted into <head> as well, and first of the two.
    //
    // In the template this block sits at the end of <body> and runs during
    // parsing, which is the only arrangement that works for a file somebody
    // opens directly. In the generated page it is the last thing a parser
    // reaches after 140 KB of markup, so the browser cannot even begin fetching
    // it until it has read everything above - on the page that matters most.
    //
    // Moving it to <head> with defer starts that fetch with the first bytes of
    // the document and still runs it after the document is parsed, so it sees
    // exactly the DOM it sees today and still runs before DOMContentLoaded.
    //
    // Order is the part that is easy to get wrong. Today this block runs before
    // the module above it, because classic scripts run when the parser reaches
    // them and modules wait. Defer puts both in the same queue, and that queue
    // is in document order - so the two are emitted into the head in the order
    // set by `hoist`, not the order they appear in the template.
    hoist: 1,
    tag: (url) => `<script defer src="${url}"></script>`
  }
];

// Reads each block out of the template once and writes it to disk. The blocks
// are identical in all three documents - the language split, the head rewrite
// and the link localizer all step over raw-text elements - so they are hashed
// and written here rather than per page.
async function extractInlineAssets(templateHtml) {
  const extracted = [];

  for (const asset of INLINE_ASSETS) {
    const match = templateHtml.match(asset.pattern);
    if (!match) {
      throw new Error(
        `Could not find the ${asset.label} block in content/home/index.html. `
        + 'The generator lifts it out into a separate file, so the block has to '
        + 'stay recognisable to the pattern in INLINE_ASSETS.'
      );
    }

    const contents = match[1];
    const hash = createHash('sha256').update(contents).digest('hex').slice(0, 12);
    const destination = path.join(root, asset.file);

    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, contents.startsWith('\n') ? contents.slice(1) : contents);

    extracted.push({ ...asset, block: match[0], hash, href: `${asset.url}?v=${hash}` });
    console.log(`Extracted home ${asset.label} → ${asset.file}?v=${hash} (${Math.round(contents.length / 1024)} KB).`);
  }

  return extracted;
}

function replaceInlineAssets(html, extracted, language) {
  let output = html;

  for (const asset of extracted) {
    // The block has to be byte-identical to the template's, because that is what
    // was written to disk. If a rewrite step ever starts touching script or
    // style contents, this is where it has to be noticed rather than shipped.
    if (!output.includes(asset.block)) {
      throw new Error(
        `The ${asset.label} block in the "${language}" homepage no longer matches `
        + 'the template it was extracted from.'
      );
    }
    // A hoisted asset leaves nothing behind: its tag goes into the head below
    // instead. The blank line that remains is collapsed by tidyOutput().
    output = output.replace(asset.block, asset.hoist ? '' : asset.tag(asset.href));
  }

  return output;
}

// Puts the hoisted tags at the end of <head>, in the order their `hoist` value
// asks for rather than the order they were authored in. Last in the head means
// after every stylesheet link, so a deferred script cannot delay the styles; and
// before </head> means the browser has both URLs in hand before it has parsed a
// single element of the body.
function hoistToHead(html, extracted, language) {
  const tags = extracted
    .filter((asset) => asset.hoist)
    .sort((first, second) => first.hoist - second.hoist)
    .map((asset) => `    ${asset.tag(asset.href)}`);

  if (tags.length === 0) return html;

  const close = html.lastIndexOf('</head>');
  if (close < 0) {
    throw new Error(`The "${language}" homepage has no </head> to hoist its scripts into.`);
  }

  return `${html.slice(0, close)}${tags.join('\n')}\n${html.slice(close)}`;
}

// --- output tidying --------------------------------------------------------

// Two pieces of residue that only exist because this page is generated, applied
// last so nothing upstream has to know about either.
//
// The first is the attribute value. The template tags every string with the
// language it is written in, and the split keeps one language and deletes the
// other two - at which point 225 elements per page still claim, individually, to
// be Spanish on a page that is entirely Spanish. The name is kept as a bare
// data-i18n because the CSS still needs a hook for the display values these
// elements had, and because it is a true statement about them: they are strings
// that exist in three languages. The value is dropped because it is not.
//
// The second is the hole each deleted element left. Removing a <span> that sat
// on its own line leaves that line's indentation and newline behind, and three
// sibling languages per string meant 535 blank lines in every page - a third of
// index.html was whitespace. This runs after replaceInlineAssets(), so the
// stylesheet and the script have already become <link> and <script src> and the
// only blank lines left to collapse are in markup.
function tidyOutput(html) {
  return html
    .replace(/\slang-content="[a-z]{2}"/g, ' data-i18n')
    // rewriteHead() strips the build: comments in the <head>. This catches the
    // ones in the body - there is one, marking where the two script blocks are
    // authored - and runs late enough that the blank line it leaves is cleaned
    // up by the rule below.
    .replace(/^[ \t]*<!--\s*build:[\s\S]*?-->\r?\n/gm, '')
    .replace(/\n(?:[ \t]*\n)+/g, '\n');
}

// --- run -------------------------------------------------------------------

const template = await fs.readFile(templateFile, 'utf8');

// Written by generate-blog-catalog.mjs, which runs first in the build chain.
// Reading it here is what lets the home page carry the newest three articles
// without a second copy of their titles living in the template.
const blogCatalog = await readSharedCatalog();
const extractedAssets = await extractInlineAssets(template);

const config = {
  pageTitles: extractObjectLiteral(template, 'pageTitles'),
  pageDescriptions: extractObjectLiteral(template, 'pageDescriptions'),
  openGraphLocales: extractObjectLiteral(template, 'openGraphLocales'),
  newsletterLinks: extractObjectLiteral(template, 'newsletterLinks'),
  assessmentLinks: extractObjectLiteral(template, 'assessmentLinks'),
  templateDownloads: extractObjectLiteral(template, 'templateDownloads'),
  formCopy: extractObjectLiteral(template, 'formCopy')
};

for (const language of languages) {
  const split = keepOnlyLanguage(template, language);
  assertSingleLanguage(split.html, language);

  if (split.kept === 0) {
    throw new Error(`No lang-content elements were kept for "${language}".`);
  }

  let page = rewriteHead(split.html, language, config);
  page = rewriteStructuredData(page, language, config);

  const links = rewriteLocalizedLinks(page, language, config);
  page = links.html;

  page = await rewriteTemplateMeta(page, language, config);

  const latest = renderLatestArticles(page, language, blogCatalog);
  page = latest.html;

  page = replaceInlineAssets(page, extractedAssets, language);
  page = hoistToHead(page, extractedAssets, language);

  assertAbsoluteAssetUrls(page, language);

  page = tidyOutput(page);

  const file = outputFile(language);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, page);

  console.log(
    `Wrote ${languagePath(language)} — kept ${split.kept} blocks, dropped ${split.removed}, `
    + `localized ${links.rewritten} links, ${latest.count} journal cards, `
    + `${Math.round(page.length / 1024)} KB.`
  );
}

console.log(`Generated ${languages.length} homepage documents from content/home/index.html.`);
