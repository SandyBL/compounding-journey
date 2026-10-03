// Annual review: every DATED tax rule must be re-checked at least once a year.
// This test deliberately uses the REAL system clock (not a fixed test date), so it
// keeps failing on its own, in real time, once a rule turns stale — that is the point:
// a red test here is the "please look at this" signal for the yearly review.
// Do NOT "fix" a failure here by pushing the date forward without actually re-checking
// the source; that defeats the whole mechanism.
const {run} = require('../harness.js');
let bad = 0;
const ok = (l, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + l + (x !== undefined ? '  -> ' + x : '')); if (!c) bad++; };
const J = s => JSON.parse(run(`JSON.stringify(${s})`));

const REVIEW_MONTHS = 18;   // a rule dated further back than this needs a fresh look
const registry = J('getTaxRulesRegistry()');
const now = new Date();     // the real "today", on purpose

ok('the registry is non-empty and covers every known jurisdiction-specific rule', Object.keys(registry).length >= 9, Object.keys(registry).join(', '));

for (const [key, r] of Object.entries(registry)) {
  ok(`${key}: has a "source" string explaining what it is / where it came from`, typeof r.source === 'string' && r.source.length > 10);
  ok(`${key}: "confirmed" is a real boolean (not left undefined/truthy-by-accident)`, r.confirmed === true || r.confirmed === false);
  if (r.confirmed) {
    ok(`${key}: a CONFIRMED rule has a real, parseable date`, typeof r.date === 'string' && !isNaN(new Date(r.date).getTime()), r.date);
    if (r.annual === false) {
      ok(`${key}: a structural (non-yearly) rule is exempt from the staleness clock — it is cited by enactment date, not by last-verified date`, true);
    } else {
      const months = (now - new Date(r.date)) / (1000 * 60 * 60 * 24 * 30.44);
      ok(`${key}: dated ${r.date}, ${months.toFixed(1)} months ago — due for review after ${REVIEW_MONTHS} months`, months <= REVIEW_MONTHS, `${months.toFixed(1)} months old (source: ${r.source})`);
    }
  } else {
    ok(`${key}: an UNCONFIRMED rule has no date (a fake date would defeat the point)`, r.date === null || r.date === undefined);
  }
}

// the registry must not silently drift from the actual constants it reads: read the SAME
// source file's text and confirm the registry references the constant by name, not a
// copy-pasted literal year that could go stale independently of it.
const fs = require('fs'), path = require('path');
const spainSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'js', 'tax', 'effective-dates.js'), 'utf8');
ok('the registry is not this test file itself doing string comparisons (basic sanity)', typeof registry.ES_SS.date === 'string');
ok('ES_SS date equals ES_SS_EMPLOYEE_RATE_YEAR + "-01-01" (the two cannot drift apart)', registry.ES_SS.date === `${J('ES_SS_EMPLOYEE_RATE_YEAR')}-01-01`);
ok('ES_SAVINGS date equals ES_SAVINGS_SCALE_YEAR + "-01-01" (the two cannot drift apart)', registry.ES_SAVINGS.date === `${J('ES_SAVINGS_SCALE_YEAR')}-01-01`);
ok('the registry SOURCE reads the year constants by name (ES_SS_EMPLOYEE_RATE_YEAR + \'-01-01\'), not a hard-coded "2026-01-01" literal for those two entries', /ES_SS_EMPLOYEE_RATE_YEAR \+ '-01-01'/.test(spainSrc) && /ES_SAVINGS_SCALE_YEAR \+ '-01-01'/.test(spainSrc));

process.exitCode = bad ? 1 : 0;
