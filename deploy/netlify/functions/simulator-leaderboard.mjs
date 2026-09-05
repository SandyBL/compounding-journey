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
 * The thirteen spending habits the Freedom Calendar puts a slider against, in
 * the order the tool lists them. Named here because two of the fields below
 * are keyed on them and the list has to agree with the tool exactly - a
 * fourteenth habit added to the simulator and not added here would be stored
 * as no habit at all.
 */
const HABIT_IDS = [
  'coffee',
  'lunch',
  'subscriptions',
  'carLease',
  'impulseShopping',
  'weekendDining',
  'energySnacks',
  'techUpgrades',
  'gymMembership',
  'storageUnit',
  'foodWaste',
  'shortRideshares',
  'bottledWater'
];

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
 *
 * WHY `details` IS LONG NOW
 *
 * It used to hold four keys, all of them for Monte Carlo FIRE, and all four
 * were there because the board printed them in a column. Everything else was
 * discarded: the table recorded that somebody scored 5,800 on the "high risk
 * SWR" preset and not one of the assumptions that produced it. Which meant the
 * one genuinely original data set this site can build - what people actually
 * assume when they model their own retirement - was being thrown away one run
 * at a time, and no amount of traffic later would bring back a row that was
 * never written.
 *
 * So each simulator now records the inputs of the run alongside its result.
 * The test applied to every key below was a single question: could a sentence
 * in a published post ever turn on this number? A withdrawal rate can (it is
 * the whole "is 4% safe" argument). An equity weighting can. A rendering
 * detail cannot, and is not here.
 *
 * Three properties of what is stored are deliberate, and are what make this
 * collection defensible rather than merely useful:
 *
 *   - Every value is a setting or an outcome of a simulation. None of it is
 *     about the person: there is no age of a real reader, no real salary, no
 *     identifier, and nothing that could be joined against anything. The
 *     Freedom Calendar's `currentAge` is the age the visitor typed into a
 *     model, which they are free to make up and frequently do.
 *   - Nothing is written unless somebody presses a button that says it will
 *     be. The three scoring tools ask for a name and submit a score; the two
 *     that rank nothing now carry an explicit "add this run to the public data
 *     set" control, and store no name at all.
 *   - The ranges below are the floor and ceiling of what the tool itself can
 *     produce, so the stored data set stays inside the shape a real run has
 *     even though every request is unauthenticated.
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
    details: {
      // The five categories the fifteen scenarios are drawn from, each as a
      // percentage of the points that category had available. This is the
      // interesting half of the tool: the total score says how well somebody
      // did, and these five say what they did badly at. "Readers score worst
      // on tax and best on spending" is a finding; a mean of 61 is not.
      investingPct: { type: 'number', min: 0, max: 100 },
      debtPct: { type: 'number', min: 0, max: 100 },
      spendingPct: { type: 'number', min: 0, max: 100 },
      taxPct: { type: 'number', min: 0, max: 100 },
      riskPct: { type: 'number', min: 0, max: 100 },
      // Which option was taken in each scenario, in order, one letter per
      // scenario: "ABCBA...". Stored as a code rather than fifteen numbered
      // keys because it is read as a sequence - the question worth asking of
      // it is "on scenario 7, what did people choose", and that is a character
      // position. Capped at the number of scenarios the tool has.
      picks: { type: 'code', alphabet: 'ABC', maxLength: 20 },
      // Where the run ended besides net worth. Happiness is the tool's own
      // 0-100 wellbeing track, which exists so that the highest score and the
      // best life are not automatically the same run.
      happiness: { type: 'number', min: 0, max: 100 },
      monthlyCashFlow: { type: 'number', min: -100_000, max: 1_000_000 }
    }
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
    details: {
      // The two numbers that crossed. Their ratio is what "financially
      // independent" meant in this run, and their level is what it cost.
      monthlyExpenses: { type: 'number', min: 0, max: 1_000_000 },
      monthlyPassive: { type: 'number', min: 0, max: 1_000_000 },
      investedCapital: { type: 'number', min: 0, max: 1_000_000_000 },
      // The tool's lifestyle-joy track, 0-141 by construction. Recorded
      // because the trade-off it exists to expose - reaching freedom sooner by
      // living smaller - is only visible if both halves are stored.
      joyScore: { type: 'number', min: 0, max: 400 },
      // Which of the six income engines was producing the largest share of the
      // monthly income at crossover. The single most publishable field in this
      // file: it answers "what do people reach for when the choice is free and
      // the consequences are simulated" with a distribution instead of an
      // anecdote.
      topEngine: {
        type: 'enum',
        values: ['dividend_etf', 'bonds', 'rental_property', 'reit_index', 'digital_business', 'bitcoin']
      },
      // The six lifestyle dials, as chosen at crossover. Every one of them is a
      // choice the visitor made with a visible price and a visible joy value
      // attached, which is a cleaner record of a spending preference than any
      // survey question about spending preferences.
      housing: { type: 'enum', values: ['modest', 'standard', 'luxury'] },
      transport: { type: 'enum', values: ['public', 'used', 'lease'] },
      lifestyle: { type: 'enum', values: ['frugal', 'balanced', 'lavish'] },
      subscriptions: { type: 'enum', values: ['basic', 'standard', 'unlimited'] },
      travel: { type: 'enum', values: ['staycation', 'annual', 'luxury'] },
      shopping: { type: 'enum', values: ['minimal', 'standard', 'luxury'] },
      // The life events the run happened to include, which change the expense
      // line and so change every other number here.
      hadKid: { type: 'boolean' },
      hadPet: { type: 'boolean' },
      hadElderCare: { type: 'boolean' }
    }
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
    details: {
      // The four the board shows and does not rank on. These four predate the
      // rest of this object and are the reason it exists: they were the only
      // thing ever recorded about a retirement simulation.
      reached100: { type: 'boolean' },
      crashYears: { type: 'number', min: 0, max: 120 },
      tacticYears: { type: 'number', min: 0, max: 600 },
      finalBalance: { type: 'number', min: 0, max: 1_000_000_000 },

      // The assumption the entire safe-withdrawal-rate argument is about,
      // stored in basis points so it survives a column that rounds to whole
      // numbers: 4.00% is 400, 3.25% is 325. Derived on the client from the two
      // numbers below rather than divided out here, so a run whose starting
      // capital was edited to zero sends nothing instead of infinity.
      withdrawalBps: { type: 'number', min: 0, max: 5000 },
      startCapital: { type: 'number', min: 0, max: 1_000_000_000 },
      annualSpending: { type: 'number', min: 0, max: 100_000_000 },
      // The horizon, which is the other half of any withdrawal-rate claim: 4%
      // over thirty years and 4% over fifty years are different bets.
      startAge: { type: 'number', min: 18, max: 100 },
      horizonYears: { type: 'number', min: 1, max: 90 },
      // The allocation. Sums to 100 in the tool; not enforced as a sum here,
      // because rejecting a write is a worse outcome than storing a run whose
      // three weights are 99, and the aggregate can filter on the sum.
      pctStocks: { type: 'number', min: 0, max: 100 },
      pctBonds: { type: 'number', min: 0, max: 100 },
      pctCash: { type: 'number', min: 0, max: 100 },
      targetDateFund: { type: 'boolean' },
      // Which return series the flight was flown against: the tool's own
      // simulated draws, or one of three historical sequences. A finding about
      // withdrawal rates means nothing without it, because the 1970s sequence
      // and the bull sequence disagree about every rate.
      marketSequence: { type: 'enum', values: ['simulated', '1970s', '2000s', 'bull'] },
      // The six levers the cockpit offers when a flight is going wrong. Which
      // one people pull first, and which combination actually rescues a run,
      // is a post on its own - and it is the question the tool is built to
      // answer, which was until now not being recorded at all.
      tacticJob: { type: 'boolean' },
      tacticCutSpend: { type: 'boolean' },
      tacticCashBuffer: { type: 'boolean' },
      tacticGuardrails: { type: 'boolean' },
      tacticDownsize: { type: 'boolean' },
      tacticPension: { type: 'boolean' }
    }
  },

  /*
   * The two tools that rank nothing.
   *
   * Neither the Freedom Calendar nor the Market Time Machine has a leaderboard,
   * a display name, or a result that could be called a better one, and none of
   * that has changed. What they have now is one button offering to add the run
   * to the public data set, and these two definitions are what that button is
   * allowed to store.
   *
   * `contribution: true` is the flag for that shape, and it changes three
   * things. No display name is asked for or accepted, so the rows carry a fixed
   * label instead of anything a person typed. The board is the single key
   * 'DATA', which no ranking reads. And the endpoint refuses to serve these
   * rows over GET: the aggregate is published on the site's own results page,
   * computed at build time, and an endpoint that would hand out the whole
   * contributed data set on request is a different thing from a page of
   * averages.
   *
   * `score` still has to mean something, because it is the column the row is
   * built around, so for each of these it is the headline result the tool puts
   * on screen.
   */
  'freedom-calendar': {
    contribution: true,
    order: 'desc',
    boards: new Set(['DATA']),
    limit: 25,
    // Years the run pulled financial independence forward, times 100, so a
    // result of 3.4 years survives the rounding as 340. The tool caps its own
    // projection at 70 years.
    score: { min: 0, max: 7000 },
    // The age the optimised plan reaches independence at, times 100.
    tiebreak: { min: 0, max: 10_000 },
    details: {
      // The plan as entered. All seven are model assumptions rather than facts
      // about a person - this is a tool people try three versions of - and
      // together they are the only public record of what a working budget
      // looks like to somebody who came looking for one.
      currentAge: { type: 'number', min: 16, max: 90 },
      annualIncome: { type: 'number', min: 0, max: 100_000_000 },
      workHoursPerWeek: { type: 'number', min: 1, max: 120 },
      startingNetWorth: { type: 'number', min: -10_000_000, max: 1_000_000_000 },
      basicMonthlyExpenses: { type: 'number', min: 0, max: 1_000_000 },
      // Both in basis points: a 7% real return is 700, a 4% withdrawal rate is
      // 400. The second is the same assumption Monte Carlo FIRE records, from a
      // completely different starting point, which is what makes comparing the
      // two distributions worth doing.
      realReturnBps: { type: 'number', min: 0, max: 3000 },
      safeWithdrawalBps: { type: 'number', min: 1, max: 2000 },
      // What the run produced. Both ages times 100.
      baselineFreedomAge: { type: 'number', min: 0, max: 10_000 },
      optimizedFreedomAge: { type: 'number', min: 0, max: 10_000 },
      monthlySaved: { type: 'number', min: 0, max: 1_000_000 },
      // Which habit the visitor cut hardest, and how far each of the thirteen
      // was pulled down, as the percentage of the full cost they left in place:
      // 100 is untouched, 0 is eliminated. This is the field the tool's whole
      // argument rests on and the one nobody can get anywhere else - a list,
      // per habit, of how negotiable people find it when the price is quoted in
      // years of their life rather than in money.
      topHabit: { type: 'enum', values: HABIT_IDS },
      keptCoffee: { type: 'number', min: 0, max: 100 },
      keptLunch: { type: 'number', min: 0, max: 100 },
      keptSubscriptions: { type: 'number', min: 0, max: 100 },
      keptCarLease: { type: 'number', min: 0, max: 100 },
      keptImpulseShopping: { type: 'number', min: 0, max: 100 },
      keptWeekendDining: { type: 'number', min: 0, max: 100 },
      keptEnergySnacks: { type: 'number', min: 0, max: 100 },
      keptTechUpgrades: { type: 'number', min: 0, max: 100 },
      keptGymMembership: { type: 'number', min: 0, max: 100 },
      keptStorageUnit: { type: 'number', min: 0, max: 100 },
      keptFoodWaste: { type: 'number', min: 0, max: 100 },
      keptShortRideshares: { type: 'number', min: 0, max: 100 },
      keptBottledWater: { type: 'number', min: 0, max: 100 }
    }
  },
  'market-time-machine': {
    contribution: true,
    order: 'desc',
    boards: new Set(['DATA']),
    limit: 25,
    // The compound annual growth rate the custom portfolio achieved over the
    // stretch of history the run covered, in basis points, offset by 10,000 so
    // a losing portfolio is still a non-negative score: 0 is -100%/yr, 10,000
    // is flat, 10,700 is +7%/yr. The offset exists because the column is the
    // one every board sorts on and a negative score would sort below an
    // unplayed run.
    score: { min: 0, max: 20_000 },
    // Ending value of the custom portfolio.
    tiebreak: { min: 0, max: 1_000_000_000 },
    details: {
      // Which stretch of the twentieth and twenty-first centuries the run chose
      // to live through, and for how long. People do not pick a start year at
      // random: they pick 1929, or 2000, or the year they were born.
      startYear: { type: 'number', min: 1920, max: 2026 },
      yearsElapsed: { type: 'number', min: 0, max: 110 },
      initialCapital: { type: 'number', min: 1, max: 1_000_000_000 },
      // The allocation the sliders were left on, and whether it came from one
      // of the five named benchmark portfolios or was built by hand. "What do
      // people build when they build their own" is the question, and `preset`
      // is what separates the answers from the five defaults.
      pctStocks: { type: 'number', min: 0, max: 100 },
      pctBonds: { type: 'number', min: 0, max: 100 },
      pctReits: { type: 'number', min: 0, max: 100 },
      pctGold: { type: 'number', min: 0, max: 100 },
      pctCash: { type: 'number', min: 0, max: 100 },
      preset: {
        type: 'enum',
        values: ['custom', 'classic6040', 'allweather', 'permanent', 'aggressive', 'conservative']
      },
      // The run's own outcome, and the Classic 60/40 over exactly the same
      // years. The comparison is the point: a portfolio that returned 9%/yr is
      // a fact about the decade unless you also know what the default did.
      finalValue: { type: 'number', min: 0, max: 1_000_000_000 },
      benchmarkValue: { type: 'number', min: 0, max: 1_000_000_000 },
      // Worst peak-to-trough fall the custom portfolio took, in basis points,
      // which is the number a chart makes people feel and a table makes
      // comparable.
      maxDrawdownBps: { type: 'number', min: 0, max: 10_000 }
    }
  }
};

/** Longest display name a board will store. Long enough for "Sarah & Alex". */
const NAME_LIMIT = 24;

/**
 * The `player_name` every contributed row carries.
 *
 * The column is NOT NULL and the two contributing tools ask for no name, so
 * something has to go in it. A constant is the honest answer: it says in the
 * data itself that this row has no author, and it means a contributed row
 * cannot be told apart from any other contributed row by anything except the
 * settings of the run. Writing 'anonymous' per row and accepting a client name
 * "just in case" is how a table that holds no names ends up holding some.
 */
const CONTRIBUTED_NAME = 'contributed run';

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

  // A ranked board needs a name to print. A contributed run has nobody to
  // print, so the field is not read at all - not defaulted from the payload,
  // not accepted if sent. The one route by which a name could reach a
  // contribution row is a name this file writes, and it writes a constant.
  let name;
  if (definition.contribution === true) {
    name = CONTRIBUTED_NAME;
  } else {
    name = cleanName(payload?.name);
    if (!name) {
      return problem('A display name is required.');
    }
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
    // Absent is always fine. Every field is optional because a run can
    // legitimately not have one - a Market Time Machine portfolio that was
    // never scrubbed forward has no drawdown yet - and because a bundle
    // deployed before a key was added must keep working rather than start
    // failing its writes. The aggregate counts non-null values per field for
    // exactly this reason.
    if (value === undefined || value === null) continue;

    if (spec.type === 'boolean') {
      if (typeof value !== 'boolean') return problem(`"${key}" must be true or false.`);
      details[key] = value;
      continue;
    }

    // A closed list of canonical keys - an asset id, a lifestyle tier, a
    // preset name. Compared against the list rather than sanitised, because
    // the point of an enum is that an unrecognised value is a disagreement
    // between this file and the tool and not something to store a cleaned-up
    // version of.
    if (spec.type === 'enum') {
      if (typeof value !== 'string' || !spec.values.includes(value)) {
        return problem(`"${key}" is not one of the values this simulator can produce.`);
      }
      details[key] = value;
      continue;
    }

    // A fixed-alphabet string, used for the answer sequence of a scenario run.
    // Narrowed the same way a display name is: what is stored can only be
    // characters the tool itself emits, so it cannot carry markup however the
    // request was built.
    if (spec.type === 'code') {
      if (typeof value !== 'string' || value.length === 0 || value.length > spec.maxLength) {
        return problem(`"${key}" is missing or too long.`);
      }
      for (const character of value) {
        if (!spec.alphabet.includes(character)) {
          return problem(`"${key}" contains a character this simulator cannot produce.`);
        }
      }
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

    // A contributed run has no ranking to return, and returning one would mean
    // handing back the rows this endpoint refuses to serve over GET. The page
    // that sent it wants one thing: confirmation that it landed.
    if (definition.contribution === true) {
      return json({ simulator, board, recorded: submittedId !== null });
    }

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

/**
 * A board a GET may ask for: any board the tool writes, plus its aggregate.
 *
 * Never a contribution board. Those rows exist to be counted, and the site
 * publishes the counts on a page built from them; an endpoint that also served
 * them row by row would turn a page of averages into a downloadable data set
 * that nobody agreed to publish that way.
 */
function readable(definition, board) {
  if (definition.contribution === true) return false;
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
