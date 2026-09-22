// Renders the small LaTeX subset the journal's articles actually use, at build
// time, to HTML and CSS. No client-side library and no web font: the articles
// contain twelve display formulas and about a hundred inline spans between
// them, built from eleven commands in total, and shipping a general-purpose
// math engine to every reader to typeset "NAV = assets / shares" would cost
// more than the whole page it appears on.
//
// Three things follow from rendering at build time rather than in the browser:
// the formulas are in the HTML, so they are searchable, indexable and readable
// with JavaScript off; they cannot re-flow the article half a second after it
// paints; and an unsupported command fails the build instead of printing raw
// backslashes to a reader.
//
// The subset is deliberately closed. Anything outside it throws, the caller
// turns that into a build failure naming the article, and the command gets
// added here on purpose rather than discovered in production.

/** Commands that stand for a single character. */
const SYMBOLS = {
  // Greek, as the return-decomposition formulas use it.
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', theta: 'θ',
  lambda: 'λ', mu: 'μ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', omega: 'ω',
  Delta: 'Δ', Sigma: 'Σ', Omega: 'Ω',
  // Operators and relations.
  times: '×', cdot: '⋅', div: '÷', pm: '±', mp: '∓',
  le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠',
  approx: '≈', equiv: '≡', propto: '∝', sim: '∼',
  sum: '∑', prod: '∏', int: '∫', sqrt: '√', infty: '∞', partial: '∂',
  to: '→', rightarrow: '→', Rightarrow: '⇒', leftarrow: '←', leftrightarrow: '↔',
  ldots: '…', dots: '…', cdots: '⋯', angle: '∠', degree: '°',
  // Escapes for characters that are syntax in LaTeX, in Markdown, or both. The
  // dollar is the one that matters here: the Portuguese articles write the real
  // as \text{R}\$, which is the only way to put a currency symbol inside a
  // formula whose own delimiter is that symbol.
  '%': '%', $: '$', '&': '&', '#': '#', _: '_', '{': '{', '}': '}',
  ' ': ' ', ',': ' ', ';': ' ', ':': ' ', '!': ''
};

/** How each symbol is read aloud, for the label a screen reader gets. */
const SPOKEN = {
  '=': 'equals', '+': 'plus', '−': 'minus', '-': 'minus',
  '×': 'times', '⋅': 'times', '÷': 'divided by', '±': 'plus or minus',
  '≤': 'is at most', '≥': 'is at least', '≠': 'is not', '≈': 'is about',
  '>': 'is greater than', '<': 'is less than', '/': 'per',
  '∑': 'the sum of', '∏': 'the product of', '√': 'the square root of',
  '∞': 'infinity', '→': 'gives', '⇒': 'implies', '…': 'and so on',
  'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'σ': 'sigma', 'μ': 'mu', 'Δ': 'delta'
};

/**
 * True when a run of text between two dollar signs is a formula rather than two
 * prices in one sentence.
 *
 * This is the whole reason the renderer can be switched on over a journal about
 * money. Most dollars in these articles open a number and close nothing: "from
 * $2,500 to $3,000" has two of them and no mathematics, and a renderer that
 * paired them would eat the words in between and publish them as a formula.
 *
 * So a span has to earn it, by carrying a LaTeX command (a backslash followed
 * by letters, or an escaped %/$), or by being a bare symbol - $VL$, $NAV$, $m$
 * - which is letters and digits and nothing else. A price always has a digit, a
 * separator or a space where a symbol cannot, and prose between two prices
 * always has spaces, so neither can pass.
 */
const MATH_COMMAND = /\\(?:[a-zA-Z]+|[%$&#])/;
const MATH_SYMBOL = /^[A-Za-z][A-Za-z0-9]{0,7}$/;

export function isMathSpan(body) {
  if (!body || /^\s|\s$/.test(body)) return false;
  return MATH_COMMAND.test(body) || MATH_SYMBOL.test(body);
}

/**
 * Finds the end of a `{...}` group, honouring nesting and backslash escapes, and
 * returns its contents. Used for both arguments of \frac and the argument of
 * \text.
 */
function readGroup(source, state, command) {
  while (source[state.at] === ' ') state.at += 1;
  if (source[state.at] !== '{') {
    // A single token is a valid argument in LaTeX: x^2 and \frac12 both parse.
    if (state.at >= source.length) throw new Error(`\\${command} has no argument in "${source}"`);
    const single = source[state.at] === '\\'
      ? source.slice(state.at, state.at + 1 + (source.slice(state.at + 1).match(/^(?:[a-zA-Z]+|.)/) || [''])[0].length)
      : source[state.at];
    state.at += single.length;
    return single;
  }
  let depth = 0;
  const start = state.at + 1;
  while (state.at < source.length) {
    const character = source[state.at];
    if (character === '\\') { state.at += 2; continue; }
    if (character === '{') depth += 1;
    if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        const inner = source.slice(start, state.at);
        state.at += 1;
        return inner;
      }
    }
    state.at += 1;
  }
  throw new Error(`\\${command} has an unclosed { in "${source}"`);
}

/**
 * Parses a run of math into nodes.
 *
 * Whitespace is kept as whitespace rather than dropped. Strict LaTeX throws
 * spaces away in math mode and re-derives them from each operator's class,
 * which is the right behaviour for a typesetter and the wrong one here: these
 * formulas were written by hand with the spacing their author wanted, and
 * "R$ 5.000" is how a Brazilian price is written while "R$5.000" is not.
 * Keeping the spaces means the published formula reads the way the Markdown
 * does, and HTML collapses any doubles that result.
 */
function parse(source) {
  const nodes = [];
  const state = { at: 0 };

  while (state.at < source.length) {
    const character = source[state.at];

    if (character === '\\') {
      const match = source.slice(state.at + 1).match(/^(?:[a-zA-Z]+|.)/);
      if (!match) throw new Error(`Trailing backslash in "${source}"`);
      const command = match[0];
      state.at += 1 + command.length;

      if (command === 'text' || command === 'mathrm' || command === 'operatorname') {
        // The argument is words, not mathematics, so it is not parsed as
        // mathematics: only the backslash escapes inside it are resolved.
        nodes.push({ kind: 'text', value: literal(readGroup(source, state, command), source) });
        continue;
      }
      if (command === 'frac' || command === 'dfrac' || command === 'tfrac') {
        const over = readGroup(source, state, command);
        const under = readGroup(source, state, command);
        nodes.push({ kind: 'fraction', over: parse(over), under: parse(under) });
        continue;
      }
      if (command === 'left' || command === 'right' || command === 'big' || command === 'bigg') {
        // The delimiter that follows is rendered as itself. Nothing in these
        // articles puts a fraction inside brackets, so there is no height to
        // grow to and a plain parenthesis is the honest rendering.
        while (source[state.at] === ' ') state.at += 1;
        const delimiter = source[state.at] === '.' ? '' : source[state.at];
        state.at += 1;
        if (delimiter) nodes.push({ kind: 'open', value: delimiter });
        continue;
      }
      if (Object.hasOwn(SYMBOLS, command)) {
        nodes.push({ kind: 'symbol', value: SYMBOLS[command] });
        continue;
      }
      throw new Error(`Unsupported LaTeX command "\\${command}" in "${source}"`);
    }

    if (character === '{') { nodes.push(...parse(readGroup(source, state, 'group'))); continue; }
    if (character === '}') { state.at += 1; continue; }

    if (character === '_' || character === '^') {
      state.at += 1;
      const script = readGroup(source, state, character);
      nodes.push({ kind: character === '_' ? 'subscript' : 'superscript', nodes: parse(script) });
      continue;
    }

    // A number, keeping the thousands and decimal separators the author used:
    // 1.800.000 and 85,4 are both correct, in different languages, and neither
    // is this renderer's business to reformat.
    const number = source.slice(state.at).match(/^\d[\d.,:]*\d|^\d/);
    if (number) {
      nodes.push({ kind: 'text', value: number[0] });
      state.at += number[0].length;
      continue;
    }

    // Two or more letters together is a name - VL, NAV - and is set upright,
    // the way \text{NAV} is set in the display formulas of the same articles.
    // A single letter is a variable and is italic, as mathematics sets them.
    const letters = source.slice(state.at).match(/^[A-Za-z]+/);
    if (letters) {
      nodes.push(letters[0].length > 1
        ? { kind: 'text', value: letters[0] }
        : { kind: 'variable', value: letters[0] });
      state.at += letters[0].length;
      continue;
    }

    const space = source.slice(state.at).match(/^\s+/);
    if (space) { nodes.push({ kind: 'space' }); state.at += space[0].length; continue; }

    if ('+-=<>/()[]|,.:;*\'"'.includes(character)) {
      nodes.push({ kind: 'symbol', value: character === '-' ? '−' : character });
      state.at += 1;
      continue;
    }

    // Anything else is a character that needs no translation: a currency sign,
    // an accented letter inside a formula, punctuation this list has not
    // thought of. Passing it through is safer than refusing to build over it.
    nodes.push({ kind: 'text', value: character });
    state.at += 1;
  }

  return tidy(nodes);
}

/** Resolves the backslash escapes inside a \text{...} argument. */
function literal(value, source) {
  return value.replace(/\\(?:([a-zA-Z]+)|(.))/g, (whole, word, symbol) => {
    const key = word ?? symbol;
    if (Object.hasOwn(SYMBOLS, key)) return SYMBOLS[key];
    throw new Error(`Unsupported LaTeX command "\\${key}" inside \\text in "${source}"`);
  });
}

function escape(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

/**
 * Drops the whitespace that sits just inside a bracket.
 *
 * Keeping the author's spacing is right everywhere except here: "\left(
 * \text{Individual Positions } > 5\% \right)" is written with those spaces to
 * keep the LaTeX readable, and rendering them gives "( Individual Positions >
 * 5% )", which no typesetter would set and which reads as a stray bracket.
 */
function tidy(nodes) {
  const opens = '([{';
  const closes = ')]}';
  const bracket = (node, set) => node && (node.kind === 'symbol' || node.kind === 'open') && set.includes(node.value);
  return nodes.filter((node, index) => !(node.kind === 'space'
    && (bracket(nodes[index - 1], opens) || bracket(nodes[index + 1], closes))));
}

function toHtml(nodes) {
  return nodes.map((node) => {
    switch (node.kind) {
      case 'text': return escape(node.value);
      case 'variable': return `<i>${escape(node.value)}</i>`;
      case 'symbol': case 'open': return escape(node.value);
      case 'space': return ' ';
      case 'subscript': return `<sub>${toHtml(node.nodes)}</sub>`;
      case 'superscript': return `<sup>${toHtml(node.nodes)}</sup>`;
      case 'fraction':
        return '<span class="article-fraction">'
          + `<span class="article-fraction-over">${toHtml(node.over)}</span>`
          + `<span class="article-fraction-under">${toHtml(node.under)}</span>`
          + '</span>';
      default: return '';
    }
  }).join('');
}

/**
 * The formula as a sentence, for the accessible name.
 *
 * A fraction built out of two stacked boxes is read by a screen reader as its
 * numerator followed by its denominator, with nothing between them: "total fund
 * assets minus total fund liabilities total shares outstanding" is not the
 * formula, it is a different and wrong claim. Saying "divided by" is the point
 * of doing this at all.
 */
function toSpeech(nodes) {
  return nodes.map((node) => {
    switch (node.kind) {
      case 'text': case 'variable': return node.value;
      case 'symbol': case 'open': return Object.hasOwn(SPOKEN, node.value) ? ` ${SPOKEN[node.value]} ` : node.value;
      case 'space': return ' ';
      case 'subscript': return ` sub ${toSpeech(node.nodes)} `;
      case 'superscript': return ` to the power ${toSpeech(node.nodes)} `;
      case 'fraction': return ` ${toSpeech(node.over)} divided by ${toSpeech(node.under)} `;
      default: return '';
    }
  }).join('');
}

/** True when a span carries enough structure that a spoken label helps. */
function isStructural(nodes) {
  return nodes.some((node) => node.kind === 'fraction'
    || node.kind === 'subscript'
    || node.kind === 'superscript'
    || (node.kind === 'symbol' && Object.hasOwn(SPOKEN, node.value)));
}

/**
 * Renders one formula.
 *
 * Inline spans get no font of their own. Most of them are a price or a
 * percentage that an author happened to write in math mode - $50\text{ €}$ -
 * and the reader should not be able to tell: the only visible difference from
 * the surrounding sentence should be in the places where mathematics genuinely
 * differs from prose, which is fractions, sub- and superscripts, real symbols
 * and italic variables.
 */
export function renderMath(latex, { display = false } = {}) {
  const nodes = parse(String(latex).trim());
  const html = toHtml(nodes);
  const tag = display ? 'div' : 'span';
  const className = display ? 'article-formula' : 'article-math';
  const label = display || isStructural(nodes)
    ? ` role="math" aria-label="${escape(toSpeech(nodes).replace(/\s+/g, ' ').trim())}"`
    : '';
  return `<${tag} class="${className}"${label}>${html}</${tag}>`;
}
