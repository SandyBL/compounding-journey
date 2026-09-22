// Minimal CommonMark/GFM subset renderer used to pre-render journal articles at
// build time. It mirrors the client-side pipeline that previously ran in
// assets/js/blog.js (marked + DOMPurify) closely enough that existing article
// styles keep working, without pulling a dependency into the build.

import { isMathSpan, renderMath } from './math.mjs';

const BLOCK_HTML = /^<\/?(?:p|div|section|figure|img|br|hr|table|ul|ol|blockquote|h[1-6])\b/i;

// A line opening a display formula. The articles write one per paragraph -
// "$$VL = \frac{...}{...}$$" - which is how every Markdown dialect that
// supports math spells it.
const DISPLAY_MATH = /^\s*\$\$/;

// A thematic break, as CommonMark defines it: three or more matching -, * or _
// characters, each allowed to be followed by spaces or tabs. The spaced forms
// matter because the content studio writes them: its rich-text editor
// serialises a divider as "- - -", not "---". This used to match only the
// unspaced runs, so "- - -" fell through to the bullet-list rule instead and
// shipped as a list item reading "- -" - correct in the studio preview, which
// renders with a full CommonMark parser, and visibly wrong on the page.
const THEMATIC_BREAK = /^\s*([-*_])(?:[ \t]*\1){2,}[ \t]*$/;

// Box drawing, block elements, geometric shapes and the heavy dingbat arrows:
// characters that draw something rather than say it, and that no sentence in an
// article contains. A line holding one of them is a row of a diagram. The light
// arrows at U+2190-U+21FF are deliberately not in the set - "→" is ordinary
// punctuation in this journal, and every article ends with a link that reads
// "Take the assessment →", which is a sentence and must stay one.
const DIAGRAM_MARK = /[\u2500-\u25ff\u2794-\u27bf]/;

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

/**
 * Lifts the `$...$` formulas out of a run of text, leaving a placeholder.
 *
 * The scan is left to right and deliberately unwilling. A dollar opens a
 * candidate; the next dollar that is not backslash-escaped, and is on the same
 * line, closes it; and the span becomes a formula only if isMathSpan agrees it
 * is one. When it does not - which is most of the time, because this journal
 * quotes prices in dollars - the opening dollar is emitted as the character it
 * is and the scan resumes one position later, so the second dollar of "$2,500
 * to $3,000" gets its own chance to open a real formula rather than being
 * consumed as the close of a fake one.
 *
 * Escaped dollars are skipped on both sides, because a formula may contain one:
 * the Brazilian real is written \text{R}\$ inside math mode.
 */
function extractMath(text, store) {
  let output = '';
  let index = 0;

  while (index < text.length) {
    const open = text.indexOf('$', index);
    if (open === -1) { output += text.slice(index); break; }
    if (open > 0 && text[open - 1] === '\\') {
      output += text.slice(index, open + 1);
      index = open + 1;
      continue;
    }

    let close = -1;
    for (let scan = open + 1; scan < text.length; scan += 1) {
      if (text[scan] === '\n') break;
      if (text[scan] === '$' && text[scan - 1] !== '\\') { close = scan; break; }
    }

    const body = close === -1 ? null : text.slice(open + 1, close);
    if (body !== null && isMathSpan(body)) {
      output += text.slice(index, open);
      store.push(body);
      output += `\u0000MATH${store.length - 1}\u0000`;
      index = close + 1;
    } else {
      output += text.slice(index, open + 1);
      index = open + 1;
    }
  }

  return output;
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

  // Formulas come out next, for the same reason and in the same way: their
  // contents are LaTeX, where _ and * and \ mean something other than what
  // they mean in Markdown, and "R_m" would otherwise lose its subscript to the
  // emphasis rule. They go back in already rendered, after the escaping pass.
  const mathSpans = [];
  output = extractMath(output, mathSpans);

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

  output = output.replace(/\u0000MATH(\d+)\u0000/g, (_match, index) => renderMath(mathSpans[Number(index)]));

  return output.replace(/\u0000CODE(\d+)\u0000/g, (_match, index) => `<code>${escapeHtml(codeSpans[Number(index)])}</code>`);
}

// Drops the indentation shared by every non-blank line of a code block. Tabs
// are left alone rather than guessed at a width: a block that mixes them with
// spaces has no shared prefix to remove, and keeping it as written is better
// than re-aligning it wrongly.
function dedent(code) {
  const indents = code.filter((codeLine) => codeLine.trim()).map((codeLine) => codeLine.match(/^[ ]*/)[0].length);
  const shared = indents.length ? Math.min(...indents) : 0;
  return shared ? code.map((codeLine) => codeLine.slice(shared)) : code;
}

// A line inside a diagram that carries no drawing character of its own: the
// "Mutual Oversight" written under a pair of boxes, or a heading placed over a
// column. It is read as part of the diagram only when it sits directly under a
// row with no blank line between them, and is positioned with whitespace rather
// than written as a sentence - indented, or holding a gap of two or more spaces
// that puts it under something. A sentence that follows a diagram without a
// blank line between has neither, and ends the block instead of joining it.
function diagramLabel(line) {
  if (/^\s*(?:#{1,6}\s|```|>|\||[-*+]\s|\d+[.)]\s)/.test(line)) return false;
  return /^[ \t]/.test(line) || /\S[ \t]{2,}\S/.test(line);
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

    // A display formula, on its own line and delimited by $$. It is read here
    // rather than in renderInline because it is a block: it is centred, it gets
    // room above and below it, and a fraction inside it is set at full size
    // instead of being squeezed into the line height of a sentence.
    if (DISPLAY_MATH.test(line)) {
      const formula = [];
      const first = line.replace(DISPLAY_MATH, '');
      const closesOnItsOwnLine = /\$\$\s*$/.test(first) && first.trim() !== '';
      if (closesOnItsOwnLine) {
        formula.push(first.replace(/\$\$\s*$/, ''));
        index += 1;
      } else {
        if (first.trim()) formula.push(first);
        index += 1;
        while (index < lines.length && !/\$\$/.test(lines[index])) { formula.push(lines[index]); index += 1; }
        if (index < lines.length) {
          formula.push(lines[index].replace(/\$\$.*$/, ''));
          index += 1;
        }
      }
      html.push(renderMath(formula.join(' ').trim(), { display: true }));
      continue;
    }

    // A block indented by four spaces or a tab is a code block in CommonMark,
    // which is what the content studio's preview renders it as. Without this
    // branch such a block fell through to the paragraph rule instead, and that
    // rule trims every line and reflows them in a proportional font - which is
    // exactly what the articles use an indented block *for*: ASCII diagrams
    // whose alignment is the whole content. The preview showed a diagram and
    // the published page showed the same characters shuffled into a paragraph.
    //
    // Straight after a list the same indentation means something else. An
    // indented paragraph under a list item is a continuation of that item, and
    // only indentation past the item's own content column - four spaces on top
    // of the two or three the marker takes - reads as code there. The preview
    // draws that line too, so this branch stands aside for the shallow case
    // and keeps the paragraph behaviour the lists have always had.
    const indent = line.match(/^[ \t]*/)[0].replace(/\t/g, '    ').length;
    const afterList = /<\/(?:ul|ol)>$/.test(html[html.length - 1] ?? '');
    if (indent >= (afterList ? 8 : 4)) {
      // Blank lines inside the block are kept, because a diagram can have
      // them; blank lines after it are not, because they belong to the
      // document. The four-space marker comes off as CommonMark says, and then
      // whatever indentation every remaining line still shares comes off too:
      // that shifts the block as a whole, leaving the alignment that carries
      // the meaning untouched, so a diagram centred in the Markdown source
      // does not open thirteen blank columns past the left edge of a phone.
      const code = [];
      while (index < lines.length && (/^(?: {4}|\t)/.test(lines[index]) || !lines[index].trim())) {
        code.push(lines[index].replace(/^(?: {4}|\t)/, ''));
        index += 1;
      }
      while (code.length && !code[code.length - 1].trim()) code.pop();
      html.push(`<pre><code>${escapeHtml(dedent(code).join('\n'))}</code></pre>`);
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

    if (THEMATIC_BREAK.test(line)) {
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
        // A divider written as "- - -" also matches the bullet pattern, so a
        // list that runs straight into one without a blank line between them
        // would otherwise absorb it as a final item.
        if (THEMATIC_BREAK.test(lines[index])) break;
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

    // A diagram pasted into the body with no fence and no four-space indent,
    // which is the shape one arrives in from the content studio: its rich-text
    // editor keeps each line of a pasted drawing as its own paragraph, so what
    // reaches this file has the rows separated by blank lines and no
    // indentation left to mark them as code. Read as paragraphs, every row is
    // trimmed and re-flowed in a proportional font and the drawing is gone -
    // while the studio preview, a full CommonMark parser fed the same text,
    // still shows one row per line and so looks right. The blank lines between
    // rows are those paragraph breaks rather than blank rows of the drawing, so
    // they come out here; the columns are what carry the meaning, so they stay
    // exactly as written apart from an indent every row shares.
    if (DIAGRAM_MARK.test(line)) {
      const rows = [];
      let cursor = index;
      while (cursor < lines.length) {
        if (!lines[cursor].trim()) {
          let ahead = cursor;
          while (ahead < lines.length && !lines[ahead].trim()) ahead += 1;
          if (ahead >= lines.length || !DIAGRAM_MARK.test(lines[ahead])) break;
          cursor = ahead;
          continue;
        }
        if (!DIAGRAM_MARK.test(lines[cursor]) && !diagramLabel(lines[cursor])) break;
        rows.push(lines[cursor].replace(/[ \t]+$/, ''));
        cursor += 1;
      }
      index = cursor;
      // A drawing one row tall - "[ Market Exposure ] ➔ Beta" and the other
      // one-line flows the journal uses - has no second row to stay aligned
      // with, so it is the one preformatted block that may wrap instead of
      // scrolling a phone sideways. Two rows or more and the alignment between
      // them is the whole content, so it must not.
      const attribute = rows.length === 1 ? ' class="article-diagram-line"' : '';
      html.push(`<pre${attribute}><code>${escapeHtml(dedent(rows).join('\n'))}</code></pre>`);
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
      && !THEMATIC_BREAK.test(lines[index])
      && !DISPLAY_MATH.test(lines[index])
      // A drawing that a draft runs straight into, with no blank line to
      // separate it from the sentence above, still ends that paragraph.
      && !DIAGRAM_MARK.test(lines[index])) {
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
