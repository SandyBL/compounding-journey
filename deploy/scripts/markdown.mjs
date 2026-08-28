// Minimal CommonMark/GFM subset renderer used to pre-render journal articles at
// build time. It mirrors the client-side pipeline that previously ran in
// assets/js/blog.js (marked + DOMPurify) closely enough that existing article
// styles keep working, without pulling a dependency into the build.

const BLOCK_HTML = /^<\/?(?:p|div|section|figure|img|br|hr|table|ul|ol|blockquote|h[1-6])\b/i;

// Article Markdown arrives from the content studio, so it is trusted content
// from a source that should not be able to run script on this origin: an editor
// account is a licence to publish words, not to add an event handler to a page
// that is served with script-src 'unsafe-inline'. Raw block HTML therefore keeps
// only tags that cannot execute and only attributes that cannot carry code, and
// every URL is checked for its scheme. Anything unrecognised is escaped rather
// than dropped, so a mistake in a draft shows up as visible markup in the
// article instead of shipping silently.
const SAFE_TAGS = new Set([
  'p', 'div', 'section', 'figure', 'figcaption', 'img', 'br', 'hr',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'blockquote', 'pre', 'code',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'strong', 'em', 'b', 'i', 'u', 'del', 'ins', 'mark', 'small',
  'sup', 'sub', 'span', 'abbr', 'cite', 'q', 'time'
]);

const SAFE_ATTRIBUTES = new Set([
  'class', 'id', 'src', 'alt', 'href', 'title', 'width', 'height',
  'colspan', 'rowspan', 'scope', 'loading', 'decoding', 'lang', 'dir',
  'datetime', 'cite', 'target', 'rel'
]);

const SAFE_URL = /^(?:https?:|mailto:|tel:|\/|#|\.\/|\.\.\/)/i;

// A scheme can be hidden behind whitespace or control characters that browsers
// strip before they resolve the URL ("java\tscript:alert(1)"), so the test runs
// against a collapsed copy while the original is what gets emitted.
export function safeUrl(value) {
  const raw = String(value).trim();
  const collapsed = raw.replace(/[\s\u0000-\u001f\u007f]+/g, '');
  return SAFE_URL.test(collapsed) ? raw : '#';
}

function sanitizeAttributes(attributes) {
  const kept = [];
  const pattern = /([a-zA-Z][a-zA-Z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match;
  while ((match = pattern.exec(attributes))) {
    const name = match[1].toLowerCase();
    // Drops every on* handler, style, srcset, formaction and anything else not
    // named, without having to enumerate the dangerous ones.
    if (!SAFE_ATTRIBUTES.has(name)) continue;
    let value = match[2] ?? match[3] ?? match[4] ?? '';
    if (name === 'src' || name === 'href' || name === 'cite') value = safeUrl(value);
    kept.push(`${name}="${escapeHtml(value)}"`);
  }
  return kept;
}

function sanitizeRawBlock(line) {
  return line.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*)?)(\/?)>/g,
    (whole, closing, name, attributes, selfClosing) => {
      const tag = name.toLowerCase();
      if (!SAFE_TAGS.has(tag)) return escapeHtml(whole);
      if (closing) return `</${tag}>`;
      const kept = sanitizeAttributes(attributes);
      return `<${tag}${kept.length ? ` ${kept.join(' ')}` : ''}${selfClosing}>`;
    });
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

// JSON.stringify leaves "<" alone, so an article titled with a literal
// "</script>" would close the ld+json element early: the structured data is lost
// and the rest of the graph is parsed as markup, with CMS input deciding what
// that markup is. The < escape is valid JSON, parses back to "<", and is
// inert to the HTML tokenizer.
export function jsonLdScript(data) {
  return JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
}

// Removes citation markers left over from imported drafts and undoes the
// aggressive backslash escaping some editors add.
export function normalizeMarkdown(markdown) {
  const cleaned = markdown
    .replace(/\\?\[cite:\s*[^\]\n]+\\?\]/gi, '')
    .replace(/\\([\\`*_[\]{}()#+\-.!>|])/g, '$1')
    .replace(/[ \t]+$/gm, '');

  const lines = cleaned.split('\n');
  const normalized = [];

  lines.forEach((line, index) => {
    const previous = normalized[normalized.length - 1];
    const next = lines[index + 1];
    const betweenTableRows = line.trim() === '' && /^\s*\|/.test(previous || '') && /^\s*\|/.test(next || '');
    if (!betweenTableRows) normalized.push(line);
  });

  return normalized.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Minutes of reading, from the article's own Markdown. 210 words a minute is the
// figure the journal has always used; it is stated once here because the number
// appears in three places - the article header, the read-next cards, and the
// "From the blog" cards on the home page - and three copies of the arithmetic
// would be three chances for them to disagree about the same article.
//
// Normalizing first is what makes the count the words a reader actually reads:
// the citation markers and escape backslashes some drafts arrive with are not
// words, and they are gone by the time the page is rendered.
export function readingMinutes(markdown) {
  return Math.max(1, Math.ceil(normalizeMarkdown(String(markdown ?? '')).split(/\s+/).filter(Boolean).length / 210));
}

function renderInline(text, options) {
  // Code spans are lifted out before escaping and emphasis run, then put
  // back at the end, so that neither pass can reach inside them. The marker
  // has to be something no author would type; it is written as an escape
  // sequence rather than as the byte itself, because a literal NUL in the
  // source made this file classify as binary - grep skipped it without
  // saying so, and git reported edits to it as changed bytes rather than
  // changed lines.
  const codeSpans = [];
  let output = text.replace(/`([^`]+)`/g, (_match, code) => {
    codeSpans.push(code);
    return `\u0000CODE${codeSpans.length - 1}\u0000`;
  });

  output = escapeHtml(output);

  // width/height reserve the box before the bytes arrive, so an image partway
  // down an article cannot push the text under it around as it decodes.
  output = output.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_match, alt, src) =>
    `<img src="${safeUrl(src)}" alt="${alt}" width="1200" height="675" loading="lazy" decoding="async" />`);

  output = output.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_match, label, href) => {
    const url = safeUrl(href);
    const external = /^https?:\/\//i.test(url) && !url.startsWith(options.origin);
    const attributes = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${url}"${attributes}>${label}</a>`;
  });

  output = output
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/gm, '$1<em>$2</em>')
    .replace(/(^|[\s(])_([^_\n]+)_/gm, '$1<em>$2</em>');

  return output.replace(/\u0000CODE(\d+)\u0000/g, (_match, index) => `<code>${escapeHtml(codeSpans[Number(index)])}</code>`);
}

function renderTable(rows, options) {
  const cells = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
  const header = cells(rows[0]);
  const alignments = cells(rows[1]).map((rule) => {
    const left = rule.startsWith(':');
    const right = rule.endsWith(':');
    if (left && right) return ' style="text-align:center"';
    if (right) return ' style="text-align:right"';
    return '';
  });

  const head = header.map((cell, index) => `<th${alignments[index] || ''}>${renderInline(cell, options)}</th>`).join('');
  const body = rows.slice(2).map((row) => {
    const columns = cells(row).map((cell, index) => `<td${alignments[index] || ''}>${renderInline(cell, options)}</td>`).join('');
    return `<tr>${columns}</tr>`;
  }).join('');

  return `<div class="article-table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderList(items, ordered, options) {
  const tag = ordered ? 'ol' : 'ul';
  const rendered = items.map((item) => `<li>${renderInline(item.join('\n').trim(), options)}</li>`).join('');
  return `<${tag}>${rendered}</${tag}>`;
}

function renderBlockquote(lines, options, labels) {
  const inner = renderBlocks(lines.join('\n'), options, labels);
  const callout = /^\s*(?:<p>\s*)?💡/.test(inner);
  if (!callout) return `<blockquote>${inner}</blockquote>`;
  const cleaned = inner.replace(/(<p>\s*)💡\s*/, '$1');
  return `<blockquote class="article-callout" data-label="${escapeHtml(labels.insight)}">${cleaned}</blockquote>`;
}

export function renderBlocks(markdown, options, labels) {
  const lines = markdown.split('\n');
  const html = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) { index += 1; continue; }

    if (/^```/.test(line)) {
      const code = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index])) { code.push(lines[index]); index += 1; }
      index += 1;
      html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].replace(/\s+#+\s*$/, '');
      const id = slugify(text) || `section-${html.length + 1}`;
      html.push(`<h${level} id="${id}">${renderInline(text, options)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s*(?:---|\*\*\*|___)\s*$/.test(line)) {
      html.push('<hr />');
      index += 1;
      continue;
    }

    if (/^\s*\|/.test(line) && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[index + 1] || '')) {
      const rows = [];
      while (index < lines.length && /^\s*\|/.test(lines[index])) { rows.push(lines[index]); index += 1; }
      html.push(renderTable(rows, options));
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quoted = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quoted.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      html.push(renderBlockquote(quoted, options, labels));
      continue;
    }

    const bullet = /^\s*([-*+])\s+(.*)$/;
    const numbered = /^\s*(\d+)[.)]\s+(.*)$/;
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line);
      const pattern = ordered ? numbered : bullet;
      const items = [];
      while (index < lines.length) {
        const match = lines[index].match(pattern);
        if (match) {
          items.push([match[2]]);
          index += 1;
        } else if (lines[index].trim() && items.length && !bullet.test(lines[index]) && !numbered.test(lines[index])) {
          items[items.length - 1].push(lines[index].trim());
          index += 1;
        } else {
          break;
        }
      }
      html.push(renderList(items, ordered, options));
      continue;
    }

    if (BLOCK_HTML.test(line.trim())) {
      html.push(sanitizeRawBlock(line.trim()));
      index += 1;
      continue;
    }

    const paragraph = [];
    while (index < lines.length && lines[index].trim() && !/^(?:#{1,6}\s|```|\s*>|\s*\|)/.test(lines[index])
      && !bullet.test(lines[index]) && !numbered.test(lines[index])
      && !/^\s*(?:---|\*\*\*|___)\s*$/.test(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    if (paragraph.length) html.push(`<p>${renderInline(paragraph.join('\n'), options)}</p>`);
  }

  return html.join('\n');
}

export function renderMarkdown(markdown, options, labels) {
  return renderBlocks(normalizeMarkdown(markdown), options, labels);
}

// Collects the h2 headings the renderer emitted so the article page can build a
// table of contents without re-parsing the source. Text comes back decoded so
// callers can escape it once for their own markup.
export function collectHeadings(html) {
  const headings = [];
  const pattern = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g;
  let match;
  while ((match = pattern.exec(html))) {
    const text = match[2]
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
    headings.push({ id: match[1], text });
  }
  return headings;
}
