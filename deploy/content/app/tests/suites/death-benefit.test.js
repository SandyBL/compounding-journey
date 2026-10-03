// Life insurance death-benefit analysis — asked for directly: the app already tracked
// a coverage amount for the Score's hedge component, but never showed what it actually
// MEANS for the family: how many years would it (plus existing assets) cover living
// costs if a parent died, specially with kids in the picture, and whether the amount
// is too little, enough, or more than necessary. Computed per earner
// (calc/death-benefit.js) and shown on Overview, one card per earner.
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const load=()=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.language='en';syncFormInputsFromState();updateUI();`);
// NOTE: setting the DOM input, not just state directly, before any handleDataUpdate()
// call — the same lesson learned for the insurance-employer-coverage and
// parent-death-scenario tests: handleDataUpdate() reads every form input back into
// state, silently overwriting a direct state assignment with a stale DOM value.
const setCoverage=(amount)=>run(`document.getElementById('input-ins-life-coverage').value='${amount}';handleDataUpdate();`);

// ================= 1. the core calculation =================
load();
setCoverage(500000);
let m=J('calculateMetrics()');
let analyses=J('calcDeathBenefitAnalysisAll(calculateMetrics())');
ok('one analysis per earner', analyses.length===J('state.earners.length'));
const a0=analyses[0];
ok('monthlyGap = living cost minus the OTHER earners\' remaining income (the lost earner\'s own share is correctly excluded)', Math.abs(a0.monthlyGap-Math.max(0,m.totalMonthlyLivingCost-(m.totalEarnersNet-m.earnerNetById[a0.earnerId])))<0.01);
ok('availableFunds = existing liquid assets + the insurance payout, not just one or the other', a0.availableFunds===m.totalLiquidBase+500000);
ok('yearsOfCoverage is null specifically when there is no real gap (remaining income alone already covers costs), not when funds happen to be zero', (()=>{
  // isolate: an earner whose own income isn't needed to cover costs at all
  const noGapEarner=analyses.find(a=>a.monthlyGap<=0);
  return !noGapEarner || noGapEarner.yearsOfCoverage===null;
})());

// ================= 2. a genuine gap with insufficient funds: the critical case =================
load();
setCoverage(0);
run(`state.liquidInvestments=[];updateUI();`);
let a=J('calcDeathBenefitAnalysisAll(calculateMetrics())').find(x=>x.monthlyGap>0);
ok('a real gap with ZERO funds: yearsOfCoverage is a finite (near) zero, not null — this was the original bug (a dedicated "no coverage at all" branch that was actually unreachable, falling through to a confusing "covers 0.0 years" message)', a && a.yearsOfCoverage!==null && a.yearsOfCoverage<0.1);
run(`switchTab('view-overview');renderDeathBenefitAnalysis(calculateMetrics());`);
ok('BUGFIX: the rendered card shows the critical "no coverage at all" message for this case, not "covers the family\'s expenses for 0.0 years"', /No insurance and not enough assets/.test(text(els['container-death-benefit'])));

// ================= 3. recommendations =================
// NOTE: the demo family's own liquid assets are substantial enough that zero coverage
// ALONE doesn't create a genuine shortfall (their savings alone cover ~30 years,
// already beyond the youngest child's 16-year independence horizon) — liquid assets
// are also zeroed here to construct a deliberately real gap, matching the same setup
// already used and confirmed in section 2 above.
load();
setCoverage(0);
run(`state.liquidInvestments=[];updateUI();`);
run(`switchTab('view-overview');renderDeathBenefitAnalysis(calculateMetrics());`);
ok('with zero coverage, zero other liquid assets, and a real gap, a recommendation to INCREASE coverage appears', /Consider increasing coverage/.test(text(els['container-death-benefit'])));
load();
setCoverage(500000);
run(`switchTab('view-overview');renderDeathBenefitAnalysis(calculateMetrics());`);
ok('with coverage well beyond the real horizon, a recommendation to DECREASE coverage (and pay a lower premium) appears instead', /reduce it/.test(text(els['container-death-benefit'])));

// ================= 4. no children: informational, no false "enough" claim =================
load();
setCoverage(100000);
run(`state.children=[];updateUI();`);
const noKidsAnalyses=J('calcDeathBenefitAnalysisAll(calculateMetrics())');
const noKidsGapEarner=noKidsAnalyses.find(x=>x.monthlyGap>0);
ok('with no children, isEnough is null (no verdict) for an earner with a real gap — not silently true, since there is no real horizon to measure "enough" against', !noKidsGapEarner || noKidsGapEarner.isEnough===null);
run(`switchTab('view-overview');renderDeathBenefitAnalysis(calculateMetrics());`);
ok('rendering with no children does not crash and does not show a kids-independence line', !/independent in/.test(text(els['container-death-benefit'])));

// ================= 5. nothing to show: card stays empty, not cluttered =================
// Construct a case where an earner genuinely has no gap (their own income isn't
// needed) AND there is no coverage at all to discuss either — nothing meaningful to
// say, so no card should render for that earner.
load();
setCoverage(0);
const highEarnerId=J('state.earners.reduce((best,e)=>e.grossMonthly>best.grossMonthly?e:best,state.earners[0]).id');
const otherEarnerId=J(`state.earners.find(e=>e.id!==${highEarnerId}).id`);
run(`updateEarner(${otherEarnerId},'grossMonthly','0');`);
const noGapEarner=J('calcDeathBenefitAnalysisAll(calculateMetrics())').find(a=>a.earnerId===otherEarnerId);
ok('an earner whose own income was already 0 (removing them changes nothing) has no real gap and, with zero coverage, nothing to show', noGapEarner.monthlyGap<=0 && noGapEarner.payout<=0);
run(`switchTab('view-overview');renderDeathBenefitAnalysis(calculateMetrics());`);
const cardCount=els['container-death-benefit'].children.length;
ok('that earner correctly gets no card at all (not an empty, confusing one)', cardCount < J('state.earners.length'));

// ================= 6. markup / wiring =================
const fs=require('fs'),path=require('path');
const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('markup: the death-benefit card container exists on the Overview tab', /id="container-death-benefit"/.test(page));
// Matches the CALL (ends in a semicolon) specifically, not the function's own
// declaration line (function renderDeathBenefitAnalysis(m) { ...) — the same literal
// substring appears in both, so a looser regex here would vacuously pass even if the
// function were never actually invoked anywhere.
ok('wiring: renderDeathBenefitAnalysis is called from the main render pipeline (not just available but never invoked)', /renderDeathBenefitAnalysis\(m\);/.test(page));

process.exitCode=bad?1:0;
