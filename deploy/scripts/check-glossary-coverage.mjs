/**
 * Reports the terms the articles use that the glossary cannot explain.
 *
 * The problem it solves is silent and cumulative. An article gets written,
 * ships, and mentions "the debt avalanche" three times as if the reader knows
 * what that is. Nothing breaks: the page renders, the build passes, and the
 * only person who notices is the reader who did not know the term and had
 * nowhere on the site to find out. Multiply by two years of publishing and the
 * glossary stops describing the site's own vocabulary.
 *
 * So this script reads every published article and matches its prose against
 * two lists:
 *
 *   1. The glossary itself - every entry's name and aliases, in the article's
 *      language. A hit here is coverage, and coverage is the good case: it also
 *      means scripts/inline-links.mjs will have linked the mention.
 *   2. content/site/glossary-watchlist.mjs - terms that deserve an entry and do
 *      not have one, each carrying a written draft in all three languages.
 *
 * A term from the second list that the prose uses and the glossary does not
 * cover is a gap, and the report prints the draft as a paste-ready
 * content/site/glossary.mjs entry. That is the point of the watchlist: the gap
 * arrives with three paragraphs already written, so closing it is editing text
 * rather than facing an empty file.
 *
 * The third case is a term nobody anticipated. An article's `link_phrases`
 * frontmatter is the author saying "this page is about this"; a phrase there
 * that matches neither the glossary nor the watchlist is reported with a
 * skeleton entry seeded with the article's own sentences about it. That draft
 * needs real work - it is a starting point and two TODOs, not a finished entry
 * - but it means a genuinely new subject cannot be published unnoticed.
 *
 * That third case is behind `--unknown` because most of what it finds is not a
 * term at all. `link_phrases` also carries an article's own subject - "getting
 * out of debt", "put your money to work" - which is a page title in phrase
 * form, already has a destination, and does not want a glossary entry. Listing
 * seventy of those on every build would bury the two lines that matter, so the
 * default report counts them and the flag prints them.
 *
 * Matching runs on the catalog's `searchText`, which is the article body as
 * plain text, using the same accent-aware phrase matcher as the inline linker
 * (see scripts/inline-links.mjs) so that "ter" does not match inside "interés".
 * Glossary matches are masked out of the text before the watchlist is matched
 * against it, because a phrase sitting inside a term the glossary already
 * explains is not a gap: "el interés compuesto de la deuda" mentions compound
 * interest, not a missing entry.
 *
 * Usage:
 *   node scripts/check-glossary-coverage.mjs                 report, exit 0
 *   node scripts/check-glossary-coverage.mjs --strict        exit 1 on any gap
 *   node scripts/check-glossary-coverage.mjs --article=slug  one article only
 *   node scripts/check-glossary-coverage.mjs --min-mentions=1
 *   node scripts/check-glossary-coverage.mjs --drafts=all
 *   node scripts/check-glossary-coverage.mjs --unknown       list the third case
 *
 * It runs non-strict in the build chain on purpose. A missing glossary entry is
 * an editorial debt, not a broken page, and failing a deploy over it would mean
 * an article that is finished and correct cannot go live until three paragraphs
 * of glossary are written - which is how a check like this gets deleted. The
 * report is in the build log, and `--strict` is there for anybody who wants the
 * harder rule later.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GLOSSARY } from '../content/site/glossary.mjs';
import { GLOSSARY_WATCHLIST } from '../content/site/glossary-watchlist.mjs';
import { readSharedCatalog } from './shared-catalog.mjs';
import { slugify } from './markdown.mjs';
import { LANGUAGES } from './site-routes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * How many times a term has to appear across the site before it is reported.
 *
 * One passing mention of a word is not evidence that the site owes the reader a
 * definition; the same word in two articles is. A phrase the author listed in
 * `link_phrases` bypasses this entirely - that is an explicit declaration that
 * the page is about the term, and one is enough.
 */
const DEFAULT_MINIMUM_MENTIONS = 2;

/** How many full drafts to print before switching to a one-line list. */
const DEFAULT_DRAFT_LIMIT = 4;

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/**
 * The inline linker's matcher, with the global flag so occurrences can be
 * counted and their positions masked. Kept as a copy rather than exported from
 * inline-links.mjs because that module's matchers are deliberately non-global -
 * it links the first mention and stops - and making them global there would
 * change link placement to satisfy a reporting script.
 */
function phrasePattern(phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const flexible = escaped.replace(/\s+/g, '\\s+');
  return new RegExp(`(?<![\\p{L}\\p{N}])${flexible}(?![\\p{L}\\p{N}])`, 'giu');
}

/** Every phrase a term answers to, longest first so the longest wins. */
function phrasesOf(entry) {
  return [...new Set([entry.name, ...(entry.aliases ?? [])].filter(Boolean))]
    .sort((left, right) => right.length - left.length);
}

function compile(term, language) {
  const block = term[language];
  return {
    id: term.id,
    language,
    name: block.name,
    matchers: phrasesOf(block).map((phrase) => ({ phrase, pattern: phrasePattern(phrase) }))
  };
}

/** All match spans of a compiled term in a text, longest phrase first. */
function spansOf(target, text) {
  const spans = [];
  for (const matcher of target.matchers) {
    matcher.pattern.lastIndex = 0;
    let match = matcher.pattern.exec(text);
    while (match) {
      spans.push({ start: match.index, end: match.index + match[0].length, phrase: matcher.phrase });
      match = matcher.pattern.exec(text);
    }
  }
  return spans;
}

/**
 * Blanks out spans while keeping every offset intact.
 *
 * Spaces rather than deletion, so the text either side of a masked term keeps
 * its word boundaries: cutting "el interés compuesto anual" down to
 * "el  anual" is fine, but joining it into "elanual" would invent a word.
 */
function mask(text, spans) {
  if (spans.length === 0) return text;
  const characters = [...text];
  for (const span of spans) {
    for (let index = span.start; index < span.end && index < characters.length; index += 1) {
      characters[index] = ' ';
    }
  }
  return characters.join('');
}

// ---------------------------------------------------------------------------
// Watchlist integrity
// ---------------------------------------------------------------------------

/**
 * Checks the watchlist against the glossary and against itself.
 *
 * This one does throw. A draft that is missing a language, or whose slug
 * collides with a published entry, is broken in a way that only shows up after
 * somebody pastes it: generate-glossary.mjs throws on the missing language, and
 * the duplicate slug fails generate-sitemap.mjs with two identical <loc>
 * elements. Both are much easier to understand here, next to the draft, than
 * four scripts later.
 */
function auditWatchlist() {
  const problems = [];
  const groups = new Set(['investing', 'money', 'mind']);
  const glossaryIds = new Set(GLOSSARY.map((entry) => entry.id));
  const slugs = new Map();
  for (const entry of GLOSSARY) {
    for (const language of LANGUAGES) slugs.set(`${language}:${entry[language].slug}`, `glossary ${entry.id}`);
  }

  const seen = new Set();
  for (const term of GLOSSARY_WATCHLIST) {
    if (!term.id) problems.push('a watchlist term has no id');
    if (glossaryIds.has(term.id)) problems.push(`${term.id}: already in the glossary - remove it from the watchlist`);
    if (seen.has(term.id)) problems.push(`${term.id}: listed twice in the watchlist`);
    seen.add(term.id);
    if (!groups.has(term.group)) problems.push(`${term.id}: group "${term.group}" is not investing, money or mind`);
    for (const related of term.related ?? []) {
      if (!glossaryIds.has(related) && !GLOSSARY_WATCHLIST.some((other) => other.id === related)) {
        problems.push(`${term.id}: related "${related}" is neither a glossary entry nor a watchlist term`);
      }
    }
    for (const language of LANGUAGES) {
      const block = term[language];
      if (!block) {
        problems.push(`${term.id}: no ${language} draft (all three languages are mandatory)`);
        continue;
      }
      for (const field of ['name', 'slug', 'short', 'body']) {
        if (!block[field]) problems.push(`${term.id} (${language}): ${field} is empty`);
      }
      if (!Array.isArray(block.aliases)) problems.push(`${term.id} (${language}): aliases must be an array`);
      else if (block.aliases.includes(block.name)) problems.push(`${term.id} (${language}): aliases repeat the name`);
      const key = `${language}:${block.slug}`;
      if (slugs.has(key)) problems.push(`${term.id} (${language}): slug "${block.slug}" collides with ${slugs.get(key)}`);
      slugs.set(key, `watchlist ${term.id}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `content/site/glossary-watchlist.mjs has ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`
    );
  }
}

// ---------------------------------------------------------------------------
// Draft printing
// ---------------------------------------------------------------------------

/** A single-quoted JS string literal. */
function quoted(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** A template literal, for the multi-paragraph bodies. */
function templated(value) {
  return `\`${String(value).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``;
}

function languageBlock(language, block, indent = '    ') {
  const aliases = (block.aliases ?? []).map(quoted).join(', ');
  return [
    `${indent}${language}: {`,
    `${indent}  name: ${quoted(block.name)},`,
    `${indent}  slug: ${quoted(block.slug)},`,
    `${indent}  aliases: [${aliases}],`,
    `${indent}  short: ${quoted(block.short)},`,
    `${indent}  body: ${templated(block.body)}`,
    `${indent}}`
  ].join('\n');
}

/** The paste-ready entry, in the exact shape content/site/glossary.mjs expects. */
function draftEntry(term) {
  const blocks = LANGUAGES.map((language) => languageBlock(language, term[language])).join(',\n');
  return [
    '  {',
    `    id: ${quoted(term.id)},`,
    `    group: ${quoted(term.group)},`,
    `    related: [${(term.related ?? []).map(quoted).join(', ')}],`,
    blocks,
    '  },'
  ].join('\n');
}

/**
 * Sentences from an article that mention the phrase, in the order they appear.
 *
 * The matcher is reset before every test rather than reused, because a global
 * regular expression carries `lastIndex` from one `test` call to the next: the
 * same pattern applied to a list of sentences matches the first, then starts
 * the second one part-way through and misses. It fails silently, by finding
 * nothing.
 */
function sentencesAbout(text, phrase, limit = 3) {
  const pattern = phrasePattern(phrase);
  const found = [];
  for (const raw of text.split(/(?<=[.!?])\s+/)) {
    const sentence = raw.replace(/\s+/g, ' ').trim();
    if (sentence.length < 40 || sentence.length > 320) continue;
    pattern.lastIndex = 0;
    if (!pattern.test(sentence)) continue;
    found.push(sentence);
    if (found.length === limit) break;
  }
  return found;
}

/**
 * A skeleton entry for a phrase nobody put on the watchlist.
 *
 * Sentences from the articles go in as the body, because they are the closest
 * thing to a draft that exists: somebody already explained the term once, in
 * the site's voice, while writing about it. The other two languages get a TODO
 * rather than a machine translation - a wrong definition in Portuguese is worse
 * than an obvious hole.
 */
function skeletonEntry(phrase, language, sources) {
  const id = slugify(phrase) || 'new-term';
  // The declaring article is the first candidate, but `link_phrases` is a
  // phrase other pages should use to link here, so the declaring article often
  // never says it. Every article in the same language is a candidate, and the
  // first one whose prose actually uses the phrase supplies the sentences.
  let seeds = [];
  for (const source of sources) {
    seeds = sentencesAbout(source.searchText ?? '', phrase);
    if (seeds.length > 0) break;
  }
  const body = seeds.length > 0
    ? seeds.join('\n\n')
    : `TODO: what it is.\n\nTODO: how it behaves, with a number attached.\n\nTODO: why it matters to the reader's own money.`;
  const blocks = LANGUAGES.map((other) => {
    if (other !== language) {
      return languageBlock(other, {
        name: `TODO (${phrase})`,
        slug: `TODO-${id}`,
        aliases: [],
        short: 'TODO',
        body: 'TODO'
      });
    }
    return languageBlock(other, {
      name: phrase.charAt(0).toUpperCase() + phrase.slice(1),
      slug: id,
      aliases: [],
      short: `TODO: one sentence defining ${phrase}.`,
      body
    });
  }).join(',\n');
  return [
    '  {',
    `    id: ${quoted(id)},`,
    "    group: 'investing', // TODO investing | money | mind",
    '    related: [], // TODO two or three existing ids',
    blocks,
    '  },'
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function parseArguments(argv) {
  const options = {
    strict: argv.includes('--strict'),
    unknown: argv.includes('--unknown'),
    article: null,
    minimum: DEFAULT_MINIMUM_MENTIONS,
    drafts: DEFAULT_DRAFT_LIMIT
  };
  for (const argument of argv) {
    const article = /^--article=(.+)$/.exec(argument);
    if (article) options.article = article[1];
    const minimum = /^--min-mentions=(\d+)$/.exec(argument);
    if (minimum) options.minimum = Number(minimum[1]);
    const drafts = /^--drafts=(\d+|all)$/.exec(argument);
    if (drafts) options.drafts = drafts[1] === 'all' ? Number.POSITIVE_INFINITY : Number(drafts[1]);
  }
  return options;
}

function plural(count, singular, many) {
  return `${count} ${count === 1 ? singular : many}`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  auditWatchlist();

  const catalog = await readSharedCatalog();
  const articles = options.article
    ? catalog.filter((article) => article.slug === options.article)
    : catalog;
  if (articles.length === 0) {
    throw new Error(
      options.article
        ? `No article with slug "${options.article}" in the catalog.`
        : 'The blog catalog is empty.'
    );
  }

  // Compile once per language, not once per article: 33 glossary entries plus
  // 17 watchlist terms is 50 regular expressions per language, and there are 36
  // articles.
  const glossaryTargets = new Map();
  const watchlistTargets = new Map();
  for (const language of LANGUAGES) {
    glossaryTargets.set(language, GLOSSARY.map((entry) => compile(entry, language)));
    watchlistTargets.set(language, GLOSSARY_WATCHLIST.map((term) => compile(term, language)));
  }

  const byId = new Map(GLOSSARY_WATCHLIST.map((term) => [term.id, term]));
  /** id -> { term, mentions, articles: Map<slug, {count, declared, title, language}> } */
  const gaps = new Map();
  /** phrase -> { language, articles: [...] } for phrases on neither list */
  const unknown = new Map();
  let coveredMentions = 0;

  for (const article of articles) {
    const text = article.searchText ?? '';
    const declared = new Set((article.linkPhrases ?? []).map((phrase) => phrase.toLowerCase()));
    const covered = glossaryTargets.get(article.language) ?? [];
    const watched = watchlistTargets.get(article.language) ?? [];

    // Mask what the glossary already explains, then look for what it does not.
    const glossarySpans = [];
    for (const target of covered) {
      const spans = spansOf(target, text);
      coveredMentions += spans.length;
      glossarySpans.push(...spans);
    }
    const remaining = mask(text, glossarySpans);

    for (const target of watched) {
      const spans = spansOf(target, remaining);
      const declaredHere = target.matchers.some((matcher) => declared.has(matcher.phrase.toLowerCase()));
      if (spans.length === 0 && !declaredHere) continue;
      if (!gaps.has(target.id)) {
        gaps.set(target.id, { term: byId.get(target.id), mentions: 0, declared: false, articles: new Map() });
      }
      const gap = gaps.get(target.id);
      gap.mentions += spans.length;
      gap.declared = gap.declared || declaredHere;
      gap.articles.set(article.slug, {
        title: article.title,
        language: article.language,
        count: spans.length,
        declared: declaredHere
      });
    }

    // Author-declared phrases that neither list knows about at all.
    for (const phrase of article.linkPhrases ?? []) {
      const known = [...covered, ...watched].some((target) =>
        target.matchers.some((matcher) => {
          matcher.pattern.lastIndex = 0;
          return matcher.pattern.test(phrase);
        })
      );
      if (known) continue;
      const key = `${article.language}:${phrase.toLowerCase()}`;
      if (!unknown.has(key)) unknown.set(key, { phrase, language: article.language, articles: [] });
      unknown.get(key).articles.push(article);
    }
  }

  // A gap the author declared is reported whatever its mention count; a gap
  // found only in the prose has to clear the minimum.
  const reportable = [...gaps.values()]
    .filter((gap) => gap.declared || gap.mentions >= options.minimum)
    .sort((left, right) => right.mentions - left.mentions);

  const lines = [];
  lines.push('');
  lines.push('Glossary coverage');
  lines.push('-----------------');
  lines.push(
    `${plural(articles.length, 'article', 'articles')} read, `
    + `${plural(GLOSSARY.length, 'glossary entry', 'glossary entries')}, `
    + `${plural(coveredMentions, 'covered mention', 'covered mentions')}.`
  );

  if (reportable.length === 0 && (unknown.size === 0 || !options.unknown)) {
    lines.push('');
    lines.push('No uncovered terms. Every watchlist term the articles use has an entry.');
    if (unknown.size > 0) {
      lines.push(
        `${plural(unknown.size, 'declared phrase is', 'declared phrases are')} on neither list `
        + '(mostly article subjects); run with --unknown to see them.'
      );
    }
    console.log(lines.join('\n'));
    return;
  }

  if (reportable.length > 0) {
    lines.push('');
    lines.push(`${plural(reportable.length, 'term', 'terms')} used but not in the glossary:`);
    for (const gap of reportable) {
      const where = [...gap.articles.entries()]
        .map(([slug, info]) => `${slug} (${info.language}, ${info.count}${info.declared ? ', declared' : ''})`)
        .join(', ');
      const scale = gap.mentions > 0
        ? plural(gap.mentions, 'mention', 'mentions')
        : 'no prose mention, declared as an article subject';
      lines.push(`  - ${gap.term.id} [${gap.term.group}] - ${scale}: ${where}`);
    }

    const printed = reportable.slice(0, options.drafts);
    if (printed.length > 0) {
      lines.push('');
      lines.push(
        printed.length < reportable.length
          ? `Drafts for the first ${printed.length} (paste into content/site/glossary.mjs; `
            + 're-run with --drafts=all for the rest):'
          : 'Drafts (paste into content/site/glossary.mjs, inside GLOSSARY, then read and edit):'
      );
      for (const gap of printed) {
        lines.push('');
        lines.push(draftEntry(gap.term));
      }
    }
  }

  if (unknown.size > 0 && !options.unknown) {
    lines.push('');
    lines.push(
      `${plural(unknown.size, 'declared phrase is', 'declared phrases are')} on neither list. `
      + 'Most are article subjects rather than terms, so they are counted and not listed here - '
      + 'run with --unknown to see them with a skeleton entry each.'
    );
  }

  if (unknown.size > 0 && options.unknown) {
    lines.push('');
    lines.push(
      `${plural(unknown.size, 'declared phrase', 'declared phrases')} on neither list. `
      + 'Each one is a phrase an article claims as its subject and nothing defines. '
      + 'Some are page titles in phrase form and want no entry at all; the rest belong in '
      + 'content/site/glossary-watchlist.mjs, or straight in the glossary:'
    );
    for (const item of unknown.values()) {
      lines.push(`  - "${item.phrase}" (${item.language}) in ${item.articles.map((a) => a.slug).join(', ')}`);
    }
    for (const item of [...unknown.values()].slice(0, options.drafts)) {
      lines.push('');
      const sources = [
        ...item.articles,
        ...articles.filter((article) => article.language === item.language && !item.articles.includes(article))
      ];
      lines.push(`  // skeleton for "${item.phrase}", declared by ${item.articles[0].slug}`);
      lines.push(skeletonEntry(item.phrase, item.language, sources));
    }
  }

  lines.push('');
  console.log(lines.join('\n'));

  // Gaps always count against --strict; the unknown phrases only do when they
  // were asked for, because the default report does not even list them.
  const failing = reportable.length + (options.unknown ? unknown.size : 0);
  if (options.strict && failing > 0) {
    throw new Error(`--strict: ${plural(failing, 'term', 'terms')} mentioned with no glossary entry.`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(root, 'scripts/check-glossary-coverage.mjs')) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

export { main as checkGlossaryCoverage };
