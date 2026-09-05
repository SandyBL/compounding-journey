/**
 * Adds editorial links to rendered article HTML, after the fact.
 *
 * Two problems this solves, which are really the same problem:
 *
 *   1. An article that mentions "interés compuesto" should link to the glossary
 *      entry for it, and an article that mentions "la regla del 4 %" should link
 *      to the article that explains the rule. Doing that by hand means every
 *      author remembering every existing page, which nobody does past about
 *      twenty pages.
 *   2. Publishing page twenty-two should make pages one through twenty-one link
 *      to it, where they already mention it. Hand-written links only ever point
 *      backwards in time, so the older half of a site slowly stops
 *      participating in it.
 *
 * Both go away if the links are not stored in the Markdown at all. The Markdown
 * keeps the prose; this module is handed the *rendered* HTML plus a table of
 * targets, and inserts the links on the way out. Every build starts from the
 * same clean prose, so the link graph is recomputed from scratch each time and
 * a new page is retrofitted into the old ones automatically - not because
 * anything rewrote them, but because they were never written down as linked in
 * the first place.
 *
 * Working on rendered HTML rather than Markdown is deliberate. In Markdown,
 * `[interés compuesto](...)` inside an existing link, a code span or a heading
 * all have to be detected with separate rules; in HTML they are all just "we
 * are inside a tag that forbids links", which one depth counter handles.
 *
 * The editorial rules, which matter more than the mechanism:
 *
 *   - One link per target per article. The second mention of a term is noise;
 *     the reader either followed the first one or chose not to.
 *   - Longest phrase wins at a given position, so "tasa segura de retirada"
 *     never gets shredded into a link on "tasa" plus loose words.
 *   - A cap on the total. An article with sixty links is not well connected,
 *     it is unreadable, and Google has said as much about pages that read as
 *     link farms. The cap is a limit on this module's enthusiasm, not a target.
 *   - Never inside headings, existing links, code, or the compliance notice.
 *     A heading that is half hyperlink looks broken, and a link nested in a
 *     link is invalid HTML that browsers resolve by guessing.
 *   - Never in the first paragraph. The opening is where the reader decides
 *     whether to stay, and an exit ramp in sentence one is the wrong offer.
 */

/** Tags whose contents must never gain a link. */
const FORBIDDEN_TAGS = new Set(['a', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'aside', 'figcaption']);

/** Default ceiling on links added to a single body. Generous but finite. */
const DEFAULT_MAX = 14;

/**
 * Word boundaries that understand accents. JavaScript's `\b` is defined on
 * ASCII word characters, so `\bter\b` matches the "ter" inside "interés" -
 * the boundary between "n" and "t" is not a word boundary, but the one before
 * "és" is not either, and the failure is silent and wrong. Unicode property
 * lookarounds give the boundary we actually mean: not preceded or followed by
 * a letter or a digit.
 */
function phraseMatcher(phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Collapse whitespace in the phrase to \s+ so a line break in the rendered
  // HTML between two words of a term still matches.
  const flexible = escaped.replace(/\s+/g, '\\s+');
  return new RegExp(`(?<![\\p{L}\\p{N}])${flexible}(?![\\p{L}\\p{N}])`, 'iu');
}

/**
 * Turns a target into its list of matchers, longest phrase first.
 *
 * `phrases` are compared by length rather than by the order the caller supplied
 * them, because the caller is a glossary entry listing a name and its aliases
 * and has no reason to know that ordering matters here.
 */
function compileTarget(target) {
  const phrases = [...new Set([target.name, ...(target.aliases ?? [])].filter(Boolean))]
    .sort((left, right) => right.length - left.length);
  return { ...target, matchers: phrases.map((phrase) => ({ phrase, pattern: phraseMatcher(phrase) })) };
}

/**
 * Splits HTML into tags and text runs, tracking whether each text run sits
 * inside a tag that forbids links.
 *
 * This is not a general HTML parser and does not need to be: the input is the
 * output of scripts/markdown.mjs, which emits well-formed tags and escapes
 * every `<` in the prose, so "a `<` starts a tag" holds for this input in a way
 * it would not hold for HTML in general.
 */
function segments(html) {
  const parts = [];
  const openForbidden = [];
  let index = 0;

  while (index < html.length) {
    const next = html.indexOf('<', index);
    if (next === -1) {
      parts.push({ kind: 'text', value: html.slice(index), forbidden: openForbidden.length > 0 });
      break;
    }
    if (next > index) {
      parts.push({ kind: 'text', value: html.slice(index, next), forbidden: openForbidden.length > 0 });
    }
    const close = html.indexOf('>', next);
    if (close === -1) {
      // Unterminated tag: treat the remainder as opaque rather than guessing.
      parts.push({ kind: 'tag', value: html.slice(next) });
      break;
    }
    const tag = html.slice(next, close + 1);
    const match = /^<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)/.exec(tag);
    if (match) {
      const [, slash, rawName] = match;
      const name = rawName.toLowerCase();
      const selfClosing = /\/\s*>$/.test(tag);
      if (FORBIDDEN_TAGS.has(name) && !selfClosing) {
        if (slash) {
          const at = openForbidden.lastIndexOf(name);
          if (at !== -1) openForbidden.splice(at, 1);
        } else {
          openForbidden.push(name);
        }
      }
    }
    parts.push({ kind: 'tag', value: tag });
    index = close + 1;
  }
  return parts;
}

/**
 * Finds the offset after the first paragraph, so the opening is left alone.
 *
 * Falls back to 0 when there is no `</p>` - a body made only of a list or a
 * table has no opening paragraph to protect.
 */
function afterFirstParagraph(html) {
  const end = html.indexOf('</p>');
  return end === -1 ? 0 : end + '</p>'.length;
}

/**
 * Inserts links into `html` for as many of `targets` as it can place.
 *
 * A target is `{ href, name, aliases, title }`. `title` becomes the anchor's
 * `title` attribute, which is how a glossary link can show its definition on
 * hover without interrupting the sentence.
 *
 * Returns `{ html, linked }`, where `linked` is the list of hrefs actually
 * placed. Callers use it to report and to assert - generate-blog-pages.mjs logs
 * the count, and a glossary term that never once gets linked from anywhere is a
 * signal that its aliases do not match how anyone actually writes.
 */
export function addInlineLinks(html, targets, options = {}) {
  const { maxLinks = DEFAULT_MAX, className = 'inline-link', skipFirstParagraph = true } = options;
  if (!html || targets.length === 0 || maxLinks <= 0) return { html, linked: [] };

  const compiled = targets.map(compileTarget);
  const remaining = new Set(compiled.map((target) => target.href));
  const linked = [];
  const floor = skipFirstParagraph ? afterFirstParagraph(html) : 0;

  const parts = segments(html);
  const output = [];
  let consumed = 0;

  for (const part of parts) {
    const start = consumed;
    consumed += part.value.length;

    if (part.kind === 'tag' || part.forbidden || linked.length >= maxLinks) {
      output.push(part.value);
      continue;
    }

    let text = part.value;
    // Offset within this run before which we must not link, so a run that
    // straddles the end of the first paragraph is only partly protected.
    let guard = Math.max(0, floor - start);

    for (const target of compiled) {
      if (linked.length >= maxLinks) break;
      if (!remaining.has(target.href)) continue;

      for (const { pattern } of target.matchers) {
        const searchable = text.slice(guard);
        const found = pattern.exec(searchable);
        if (!found) continue;

        const at = guard + found.index;
        const matched = found[0];
        const attributes = [
          `href="${target.href}"`,
          `class="${className}"`,
          target.title ? `title="${target.title.replace(/"/g, '&quot;')}"` : null,
          target.dataAttribute ? target.dataAttribute : null,
        ].filter(Boolean).join(' ');

        text = `${text.slice(0, at)}<a ${attributes}>${matched}</a>${text.slice(at + matched.length)}`;
        // Everything up to the end of what we just inserted is now off limits,
        // which also stops a later target from matching inside this anchor's
        // text - the one place the depth counter cannot see, because the tag
        // was added after `segments()` ran.
        guard = at + `<a ${attributes}>${matched}</a>`.length;
        remaining.delete(target.href);
        linked.push(target.href);
        break;
      }
    }

    output.push(text);
  }

  return { html: output.join(''), linked };
}

/**
 * Builds glossary link targets for one language.
 *
 * `excludeId` drops one entry, which is how a glossary page avoids linking its
 * own term back to itself, and how an article that *is* the pillar piece for a
 * concept can opt out of pointing at the shorter definition.
 */
export function glossaryTargets(glossary, language, glossaryHref, { excludeId = null } = {}) {
  return glossary
    .filter((entry) => entry.id !== excludeId)
    .map((entry) => {
      const term = entry[language];
      return {
        href: glossaryHref(entry, language),
        name: term.name,
        aliases: term.aliases,
        title: term.short,
        dataAttribute: 'data-link-kind="glossary"',
      };
    });
}

/**
 * Builds article link targets from the blog catalog for one language.
 *
 * Unlike a glossary entry, an article title is a sentence and almost never
 * appears verbatim in someone else's prose, so matching on the title alone
 * would place approximately no links. The useful handle is the article's own
 * `keywords` frontmatter - the phrases its author already decided the piece is
 * about. `excludeSlug` keeps an article from linking to itself.
 */
export function articleTargets(articles, language, articleHref, { excludeSlug = null } = {}) {
  return articles
    .filter((article) => article.slug !== excludeSlug)
    .map((article) => ({
      href: articleHref(article, language),
      name: article.title,
      aliases: article.linkPhrases ?? [],
      title: article.title,
      dataAttribute: 'data-link-kind="article"',
    }))
    // An article with no phrases would only ever match its full title, which is
    // rare enough that carrying it around costs more than it earns.
    .filter((target) => target.aliases.length > 0);
}
