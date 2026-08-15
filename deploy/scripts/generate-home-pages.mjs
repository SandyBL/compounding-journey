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
    tag: (url) => `<script type="module" src="${url}"></script>`
  },
  {
    label: 'behaviour',
    // Deliberately not deferred. The block sits at the end of <body> and runs
    // during parsing today, which puts it ahead of the module above it - modules
    // are deferred whether or not anyone asks. Adding defer here would silently
    // swap the two, so the plain form is the faithful translation.
    pattern: /<script>([\s\S]*?)<\/script>/,
    file: path.join('assets', 'js', 'home.js'),
    url: '/assets/js/home.js',
    tag: (url) => `<script src="${url}"></script>`
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
    output = output.replace(asset.block, asset.tag(asset.href));
  }

  return output;
}

// --- run -------------------------------------------------------------------

const template = await fs.readFile(templateFile, 'utf8');
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

  page = replaceInlineAssets(page, extractedAssets, language);

  assertAbsoluteAssetUrls(page, language);

  const file = outputFile(language);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, page);

  console.log(
    `Wrote ${languagePath(language)} — kept ${split.kept} blocks, dropped ${split.removed}, `
    + `localized ${links.rewritten} links, ${Math.round(page.length / 1024)} KB.`
  );
}

console.log(`Generated ${languages.length} homepage documents from content/home/index.html.`);
