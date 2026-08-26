// Reads and writes the one leaderboard the three scoring simulators share.
//
// GET  /api/simulator-leaderboard?simulator=<key>&board=<key>
//      -> { simulator, board, entries: [...] }, best first, capped per board.
// POST /api/simulator-leaderboard  { simulator, board, name, score, ... }
//      -> { simulator, board, submittedId, entries: [...] }
//
// The POST answers with the board it just changed rather than an empty 201, so
// a page can submit and re-render from one round trip instead of two, and so
// the row it just added is in the list it draws (a second GET could race
// another visitor's submission and come back without it).
//
// The endpoint is public and unauthenticated because the boards are: they ask
// for a display name, not an account, which is what they did before this
// existed. That has consequences worth stating plainly rather than pretending
// otherwise - a name is unverified, a score is asserted by the client, and
// neither can be checked from here. What this file does instead is bound the
// damage: every field is validated against a per-simulator schema, so a forged
// request can claim a good run but cannot store a value the tool could not have
// produced, cannot invent a board, and cannot put markup in a name. The rate
// limit at the bottom is what stops one source filling a board.
import { getDatabase } from '@netlify/database';

const LANGUAGES = new Set(['en', 'es', 'pt']);

/**
 * What each simulator is allowed to write and how its board is ranked.
 *
 * `order` is the direction of `score`: 'desc' where a bigger number is a better
 * run, 'asc' in the Passive Income Engine, where the score is how many months
 * the run took and the best result is the smallest. It is declared here rather
 * than encoded into the stored value so the column keeps meaning what the tool
 * means by it.
 *
 * `boards` is the exact set of sub-rankings the simulator has. They are
 * canonical keys, never the translated labels the pages show: Monte Carlo
 * FIRE's presets are called "Tight Lean FIRE" in English and "Lean FIRE
 * Ajustado" in Portuguese, and keying on those would have given each language
 * its own board while the page claimed the board was shared.
 *
 * `score`, `tiebreak` and each entry in `details` carry the range a real run
 * can produce. They are what turns "the client asserts its own score" into a
 * bounded claim: a request can lie about how well it did and cannot store a net
 * worth of 10^18 or a negative number of crash years.
 */
const SIMULATORS = {
  'simulator-hub': {
    order: 'desc',
    boards: new Set(['ALL']),
    limit: 10,
    // The financial-literacy score the scenario run ends on, 0-100.
    score: { min: 0, max: 100 },
    // Net worth breaks ties, and can legitimately end up negative.
    tiebreak: { min: -10_000_000, max: 1_000_000_000 },
    details: {}
  },
  'passive-income-engine': {
    order: 'asc',
    boards: new Set(['ALL']),
    limit: 10,
    // Months from the start of the run to the crossover point. A run that
    // crosses over in its first year is one month; 1,200 is a century.
    score: { min: 1, max: 1200 },
    // Net worth at crossover. Bigger is better, so the tiebreak is compared
    // descending regardless of the ascending score above.
    tiebreak: { min: 0, max: 1_000_000_000 },
    details: {}
  },
  'monte-carlo-fire': {
    order: 'desc',
    boards: new Set(['highrisk', 'trinity', 'leanfire', 'fatfire', 'custom']),
    // The tool's board has a filter row with an "all categories" tab, so 'ALL'
    // is a board it can read - every preset ranked together - and not one it
    // can write to. A score always belongs to the scenario it was flown under;
    // 'ALL' is a view of the others, so accepting a write to it would create
    // rows that no filter tab could ever show.
    aggregate: true,
    limit: 25,
    // The flight score the tool computes. Its own formula floors it at 100.
    score: { min: 100, max: 100_000 },
    // Ending nest egg, which the score already includes a bonus for; it is
    // repeated here because the board sorts on it when scores are level.
    tiebreak: { min: 0, max: 1_000_000_000 },
    // The four columns the board shows and does not rank on.
    details: {
      reached100: { type: 'boolean' },
      crashYears: { type: 'number', min: 0, max: 120 },
      tacticYears: { type: 'number', min: 0, max: 600 },
      finalBalance: { type: 'number', min: 0, max: 1_000_000_000 }
    }
  }
};

/** Longest display name a board will store. Long enough for "Sarah & Alex". */
const NAME_LIMIT = 24;

export default async (request) => {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    return handleRead(url);
  }
  if (request.method === 'POST') {
    return handleWrite(request);
  }
  return new Response(null, { status: 405, headers: { Allow: 'GET, POST' } });
};

async function handleRead(url) {
  const simulator = url.searchParams.get('simulator') ?? '';
  const board = url.searchParams.get('board') ?? 'ALL';

  const definition = SIMULATORS[simulator];
  if (!definition || !readable(definition, board)) {
    return problem('Unknown simulator or board.');
  }

  try {
    const entries = await topOf(simulator, board, definition);
    return json({ simulator, board, entries });
  } catch (error) {
    console.error(`simulator-leaderboard: could not read ${simulator}/${board}.`, error);
    return problem('The leaderboard is unavailable.', 503);
  }
}

async function handleWrite(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return problem('Expected a JSON body.');
  }

  const simulator = typeof payload?.simulator === 'string' ? payload.simulator : '';
  const board = typeof payload?.board === 'string' ? payload.board : '';
  const definition = SIMULATORS[simulator];
  if (!definition || !definition.boards.has(board)) {
    return problem('Unknown simulator or board.');
  }

  const name = cleanName(payload?.name);
  if (!name) {
    return problem('A display name is required.');
  }

  const score = boundedNumber(payload?.score, definition.score);
  if (score === null) {
    return problem('The score is missing or out of range.');
  }

  // Absent is fine: a board with nothing to break ties on sends no tiebreak and
  // stores the column default. A present-but-impossible value is not, because
  // that is the case where the client and this schema disagree about the tool.
  let tiebreak = 0;
  if (payload?.tiebreak !== undefined && payload?.tiebreak !== null) {
    tiebreak = boundedNumber(payload.tiebreak, definition.tiebreak);
    if (tiebreak === null) {
      return problem('The tiebreak value is out of range.');
    }
  }

  const details = {};
  for (const [key, spec] of Object.entries(definition.details)) {
    const value = payload?.details?.[key];
    if (value === undefined || value === null) continue;
    if (spec.type === 'boolean') {
      if (typeof value !== 'boolean') return problem(`"${key}" must be true or false.`);
      details[key] = value;
      continue;
    }
    const number = boundedNumber(value, spec);
    if (number === null) return problem(`"${key}" is out of range.`);
    details[key] = number;
  }

  const language = LANGUAGES.has(payload?.language) ? payload.language : 'en';

  try {
    const db = getDatabase();
    const inserted = await db.sql`
      INSERT INTO simulator_scores (simulator, board, player_name, score, tiebreak, details, language)
      VALUES (
        ${simulator}, ${board}, ${name}, ${score}, ${tiebreak},
        ${JSON.stringify(details)}::jsonb, ${language}
      )
      RETURNING id
    `;
    const submittedId = rowsOf(inserted)[0]?.id ?? null;

    const entries = await topOf(simulator, board, definition);
    return json({
      simulator,
      board,
      submittedId: submittedId === null ? null : String(submittedId),
      entries
    });
  } catch (error) {
    console.error(`simulator-leaderboard: could not record a score for ${simulator}/${board}.`, error);
    return problem('The score could not be saved.', 503);
  }
}

/** A board a GET may ask for: any board the tool writes, plus its aggregate. */
function readable(definition, board) {
  return definition.boards.has(board) || (definition.aggregate === true && board === 'ALL');
}

/**
 * The board, best first.
 *
 * Written as four statements rather than one with an interpolated direction and
 * an interpolated WHERE, because neither of those is a value a parameter can
 * carry, and assembling SQL by concatenation is how a tagged-template query
 * stops being one. Every branch is chosen by a property of SIMULATORS, so the
 * only route from the request into the statement is a placeholder.
 */
async function topOf(simulator, board, definition) {
  const db = getDatabase();
  const everyBoard = board === 'ALL' && definition.aggregate === true;
  const limit = definition.limit;

  let rows;
  if (everyBoard) {
    rows =
      definition.order === 'asc'
        ? await db.sql`
            SELECT id, board, player_name, score, tiebreak, details, created_at
            FROM simulator_scores
            WHERE simulator = ${simulator}
            ORDER BY score ASC, tiebreak DESC, created_at ASC
            LIMIT ${limit}
          `
        : await db.sql`
            SELECT id, board, player_name, score, tiebreak, details, created_at
            FROM simulator_scores
            WHERE simulator = ${simulator}
            ORDER BY score DESC, tiebreak DESC, created_at ASC
            LIMIT ${limit}
          `;
  } else {
    rows =
      definition.order === 'asc'
        ? await db.sql`
            SELECT id, board, player_name, score, tiebreak, details, created_at
            FROM simulator_scores
            WHERE simulator = ${simulator} AND board = ${board}
            ORDER BY score ASC, tiebreak DESC, created_at ASC
            LIMIT ${limit}
          `
        : await db.sql`
            SELECT id, board, player_name, score, tiebreak, details, created_at
            FROM simulator_scores
            WHERE simulator = ${simulator} AND board = ${board}
            ORDER BY score DESC, tiebreak DESC, created_at ASC
            LIMIT ${limit}
          `;
  }

  return rowsOf(rows).map((row) => ({
    // Serialised, because a bigint id is beyond what JSON numbers hold exactly
    // and the pages only ever compare it for equality.
    id: String(row.id),
    // Returned even when the read named one board: the aggregate view labels
    // each row with the scenario it was flown under, and a page that knows
    // which board a row belongs to does not have to track that itself.
    board: row.board,
    name: row.player_name,
    score: Number(row.score),
    tiebreak: Number(row.tiebreak),
    details: row.details ?? {},
    createdAt: row.created_at
  }));
}

/**
 * The display name, or null if there is nothing usable left.
 *
 * The name is the only string here that a person types and other people's
 * browsers then render, so it is narrowed rather than escaped: control
 * characters go, the characters that start markup or close an attribute go,
 * runs of whitespace collapse, and what is left is capped. The pages escape it
 * again on the way into the DOM - this is the layer that keeps the stored value
 * itself boring.
 */
function cleanName(value) {
  if (typeof value !== 'string') return null;
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[<>&"'`\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_LIMIT)
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

/** The number if it is finite and inside the declared range, else null. */
function boundedNumber(value, spec) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return null;
  if (number < spec.min || number > spec.max) return null;
  // Every value any of these boards stores is a whole number - a percentage, a
  // month count, a year count or an amount of money - so rounding here keeps a
  // float out of a column that is only ever read back as an integer.
  return Math.round(number);
}

/**
 * The rows of a result, whichever shape the driver returned.
 *
 * `db.sql` yields an array of rows on the current release and an object with a
 * `rows` property on others; both are handled so an upgrade of the pinned
 * dependency cannot quietly turn a full board into an empty one.
 */
function rowsOf(result) {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.rows)) return result.rows;
  return [];
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // The board changes whenever anybody finishes a run, and a page asks for
      // it at the moment somebody wants to see where they placed. A cached copy
      // would show them a ranking that predates their own score.
      'Cache-Control': 'no-store'
    }
  });
}

function problem(message, status = 400) {
  return json({ error: message }, status);
}

export const config = {
  path: '/api/simulator-leaderboard',
  // One person finishing a run submits one score and reads the board a handful
  // of times while looking at it, so this is roughly an order of magnitude
  // above real use. Keyed by address rather than site-wide, so one source
  // hammering the endpoint spends its own allowance and not everybody else's.
  //
  // It is the only thing standing between a public write endpoint and a board
  // full of one script's entries, which is why the ceiling is low enough to
  // make that slow and generous enough that a page never trips it.
  rateLimit: {
    windowSize: 60,
    windowLimit: 30,
    aggregateBy: 'ip'
  }
};
