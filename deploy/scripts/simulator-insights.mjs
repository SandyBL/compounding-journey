// Aggregates the simulator_scores table into the numbers /es/datos/, /en/data/
// and /pt/dados/ publish.
//
// The table has been filling up since the simulators shipped, and until now
// nothing read it except the leaderboards - which show one visitor their own
// row and the rows above it. The aggregate is the part with editorial value:
// what withdrawal rate people actually choose, which habit they refuse to give
// up, whether the portfolio they build beats the 60/40 they were shown. Nobody
// else in this niche can publish that, because nobody else has the table.
//
// Three rules this module exists to enforce, because each of them is a way the
// page could lie:
//
//   1. A number needs a sample. Every metric declares a minimum, and a metric
//      below its minimum is not rendered at all - not rendered as "1 run says
//      4.2%". Below the minimum the number is one person, and publishing it
//      would both mislead the reader and expose that person's run.
//   2. Money does not pool. The three languages show three currency symbols
//      ($ / EUR / R$) for the same input field, so an average across languages
//      would be an average of three currencies. Money metrics are therefore
//      computed within one language and printed with that language's symbol;
//      everything unit-free (percentages, ages, years, shares, choices) pools
//      across all three, which is what makes those samples large enough to
//      publish first.
//   3. The database is optional. It follows the same shape as
//      article-popularity.mjs: the import happens inside a try, any failure
//      returns null, and the page renders its "no data yet" state. A local run
//      with no database, the first deploy after a migration, or an outage must
//      not fail a build.

/** Every simulator whose rows this module will read. */
export const TRACKED_SIMULATORS = [
  'simulator-hub',
  'freedom-calendar',
  'market-time-machine',
  'monte-carlo-fire',
  'passive-income-engine'
];

/** Formats whose values are amounts of money, and so cannot pool languages. */
const MONEY_FORMATS = new Set(['money', 'money-month']);

/**
 * Whether a metric is computed inside one language or across all three.
 *
 * Derived from the format rather than declared per metric so the rule lives in
 * one place: if a metric prints a currency symbol, it is scoped, and there is
 * no way to add a money metric that forgets to be.
 */
export function isLanguageScoped(metric) {
  return MONEY_FORMATS.has(metric.format);
}

/** Rows to read at most. Far above the table's size; a guard, not a limit. */
const ROW_LIMIT = 200000;

/**
 * Every recorded run, or null when the database cannot be read.
 *
 * player_name is deliberately not selected. The page publishes aggregates and
 * has no use for the column, and a column that is never read cannot end up in
 * the output by accident.
 */
export async function readSimulatorRuns() {
  let rows;
  try {
    const { getDatabase } = await import('@netlify/database');
    const database = getDatabase();
    rows = await database.sql`
      SELECT simulator, board, language, score, tiebreak, details, created_at
      FROM simulator_scores
      ORDER BY created_at DESC
      LIMIT ${ROW_LIMIT}
    `;
  } catch (error) {
    console.log(`Results page: no simulator runs available (${error.message}). The page will render its empty state.`);
    return null;
  }

  const tracked = new Set(TRACKED_SIMULATORS);
  return rows
    .filter((row) => tracked.has(row.simulator))
    .map((row) => ({
      simulator: row.simulator,
      board: typeof row.board === 'string' ? row.board : '',
      language: typeof row.language === 'string' ? row.language : '',
      // BIGINT arrives as a string above 2^31 and as a number below it.
      score: Number(row.score),
      tiebreak: Number(row.tiebreak),
      details: row.details && typeof row.details === 'object' ? row.details : {},
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)
    }));
}

/** ------------------------------------------------------------ primitives */

/**
 * One field of one row, with the two real columns addressable the same way as
 * a details key. `score` and `tiebreak` carry the headline result of a run, so
 * a metric has to be able to name them without a second code path.
 */
function fieldValue(row, field) {
  if (field === '@score') return row.score;
  if (field === '@tiebreak') return row.tiebreak;
  return row.details?.[field];
}

/**
 * The numeric values of one field, converted back to the unit a reader thinks
 * in.
 *
 * `offset` then `scale` undo the encoding the write endpoint required: the
 * score column is a non-negative integer, so a CAGR that can be negative is
 * stored as 10,000 + rate x 10,000 and a return of -2% arrives as 9,800. The
 * conversion belongs here rather than in the metric's label, where it would be
 * a number nobody could check.
 */
function numbersOf(rows, field, scale, offset) {
  const values = [];
  for (const row of rows) {
    const raw = fieldValue(row, field);
    if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
    const shifted = offset ? raw - offset : raw;
    values.push(scale ? shifted / scale : shifted);
  }
  return values;
}

function average(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((first, second) => first - second);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  const middle = Math.floor(sorted.length / 2);
  return {
    sample: sorted.length,
    mean: total / sorted.length,
    median: sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle],
    min: sorted[0],
    max: sorted[sorted.length - 1]
  };
}

/**
 * The share of runs where a boolean field is true.
 *
 * Rows that never sent the field are not counted in the denominator: a tool
 * that started recording a flag last month would otherwise report that nobody
 * used the feature for every month before that.
 */
function shareTrue(rows, field) {
  let sample = 0;
  let count = 0;
  for (const row of rows) {
    const raw = fieldValue(row, field);
    if (typeof raw !== 'boolean') continue;
    sample += 1;
    if (raw) count += 1;
  }
  if (sample === 0) return null;
  return { sample, count, share: (count / sample) * 100 };
}

/** The share of runs where one number reached another - a crossover test. */
function shareReached(rows, field, against) {
  let sample = 0;
  let count = 0;
  for (const row of rows) {
    const left = fieldValue(row, field);
    const right = fieldValue(row, against);
    if (typeof left !== 'number' || typeof right !== 'number') continue;
    if (!Number.isFinite(left) || !Number.isFinite(right)) continue;
    sample += 1;
    if (left >= right) count += 1;
  }
  if (sample === 0) return null;
  return { sample, count, share: (count / sample) * 100 };
}

/** How often each value of an enum field was chosen, commonest first. */
function distribution(rows, field) {
  const counts = new Map();
  let sample = 0;
  for (const row of rows) {
    const raw = fieldValue(row, field);
    if (typeof raw !== 'string' || raw === '') continue;
    sample += 1;
    counts.set(raw, (counts.get(raw) || 0) + 1);
  }
  if (sample === 0) return null;
  const entries = [...counts.entries()]
    .map(([value, count]) => ({ value, count, share: (count / sample) * 100 }))
    .sort((first, second) => second.count - first.count || first.value.localeCompare(second.value));
  return { sample, entries };
}

/**
 * The share of runs where each of a set of boolean fields was true, commonest
 * first - the six tactics of the Monte Carlo tool, where the interesting
 * question is not how many were used but which ones.
 */
function shareSet(rows, fields) {
  const entries = [];
  for (const field of fields) {
    const stats = shareTrue(rows, field);
    if (stats) entries.push({ field, ...stats });
  }
  if (entries.length === 0) return null;
  entries.sort((first, second) => second.share - first.share || first.field.localeCompare(second.field));
  const sample = entries.reduce((most, entry) => Math.max(most, entry.sample), 0);
  return { sample, entries };
}

/**
 * An average per field across a set of related fields - the thirteen habits of
 * the Freedom Calendar, the five sleeves of a portfolio - ranked by that
 * average. Each field keeps its own sample so the renderer can drop a field
 * that has not been answered often enough while keeping the rest of the table.
 */
function averageSet(rows, fields, scale, offset) {
  const entries = [];
  for (const field of fields) {
    const stats = average(numbersOf(rows, field, scale, offset));
    if (stats) entries.push({ field, ...stats });
  }
  if (entries.length === 0) return null;
  entries.sort((first, second) => second.mean - first.mean || first.field.localeCompare(second.field));
  const sample = entries.reduce((most, entry) => Math.max(most, entry.sample), 0);
  return { sample, entries };
}

/** One metric over one set of rows, or null when the field is never present. */
function compute(metric, rows) {
  switch (metric.kind) {
    case 'average':
      return average(numbersOf(rows, metric.field, metric.scale, metric.offset));
    case 'share':
      return shareTrue(rows, metric.field);
    case 'reached':
      return shareReached(rows, metric.field, metric.against);
    case 'top':
    case 'breakdown':
      return distribution(rows, metric.field);
    case 'set':
      return averageSet(rows, metric.fields, metric.scale, metric.offset);
    case 'shareSet':
      return shareSet(rows, metric.fields);
    default:
      throw new Error(`simulator-insights: metric "${metric.id}" has unknown kind "${metric.kind}".`);
  }
}

/** ------------------------------------------------------------- summarise */

/**
 * Everything the page needs, per simulator.
 *
 * Metrics are computed twice - pooled across languages and inside each one -
 * because which of the two is publishable depends on the metric, and deciding
 * that here would mean the renderer could not ask the other question later.
 *
 * `rows` may be null (no database). The shape is the same either way, with
 * `available: false` and zero runs everywhere, so the renderer has one path.
 */
export function summarize(rows, metrics) {
  const available = Array.isArray(rows);
  const all = available ? rows : [];

  const simulators = new Map();
  for (const simulator of TRACKED_SIMULATORS) {
    const own = all.filter((row) => row.simulator === simulator);
    const byLanguageRows = new Map();
    for (const row of own) {
      if (!byLanguageRows.has(row.language)) byLanguageRows.set(row.language, []);
      byLanguageRows.get(row.language).push(row);
    }

    const computed = new Map();
    for (const metric of metrics.filter((entry) => entry.simulator === simulator)) {
      const byLanguage = {};
      for (const [language, languageRows] of byLanguageRows) {
        const stats = compute(metric, languageRows);
        if (stats) byLanguage[language] = stats;
      }
      computed.set(metric.id, { pooled: compute(metric, own), byLanguage });
    }

    const dates = own.map((row) => row.createdAt).filter(Boolean).sort();
    simulators.set(simulator, {
      runs: own.length,
      runsByLanguage: Object.fromEntries([...byLanguageRows].map(([code, list]) => [code, list.length])),
      first: dates[0] || null,
      last: dates[dates.length - 1] || null,
      metrics: computed
    });
  }

  const dates = all.map((row) => row.createdAt).filter(Boolean).sort();
  return {
    available,
    runs: all.length,
    first: dates[0] || null,
    last: dates[dates.length - 1] || null,
    simulators
  };
}

/**
 * The statistics a metric may be published from in a given language, or null.
 *
 * This is the single gate the renderer asks: it applies the pooled/scoped rule
 * and the minimum sample in one place, so no caller can render a metric that
 * one of the two would have rejected.
 */
export function publishable(metric, summary, language) {
  const stats = isLanguageScoped(metric)
    ? summary?.metrics?.get(metric.id)?.byLanguage?.[language]
    : summary?.metrics?.get(metric.id)?.pooled;
  if (!stats) return null;
  if (stats.sample < metric.minimum) return null;
  return stats;
}
