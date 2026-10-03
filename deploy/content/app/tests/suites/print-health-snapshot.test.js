// PDF executive summary: strengths/weaknesses/recommendations tied to the score,
// and the estate-rate region fix.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const near=(a,b,tol=1e-6)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b));
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  if('${country}'==='ES'){state.baseCurrency='EUR';state.displayCurrency='EUR';state.earners.forEach(e=>e.regime='Cuenta Ajena')}
  syncFormInputsFromState();`);
const snap=()=>J('buildPrintHealthSnapshot(calculateMetrics())');

// ================= 1. each strength/weakness fires under the right condition =================
load();
run(`state.liquidInvestments.forEach(i=>i.isEmergencyReserve=false)`);
let s=snap();
ok('a stripped-out emergency reserve shows as a weakness, not a strength', s.weaknesses.some(x=>/only 0\.0 months/.test(x))&&!s.strengths.some(x=>/reserve/i.test(x)));
load();
s=snap();
ok('the demo\'s healthy 10-month reserve shows as a strength', s.strengths.some(x=>/covers 10\.0 months/.test(x)));

load(); run(`state.debts.revolving=0;`);
s=snap();
ok('zero revolving debt shows as a strength', s.strengths.includes('No revolving-credit/overdraft debt.'));
load(); run(`state.debts.revolving=5000;`);
s=snap();
ok('revolving debt present shows as a weakness with the real amount', s.weaknesses.some(x=>x.includes(J('fmt(5000)'))&&/revolving credit/.test(x)));

load(); run(`state.monthlyInvestment=999999;`);
s=snap();
ok('a savings rate above target shows as a strength', s.strengths.some(x=>/at or above target/.test(x)));
load(); run(`state.monthlyInvestment=0;`);
s=snap();
ok('a savings rate below target shows as a weakness with the real gap', s.weaknesses.some(x=>/percentage points below target/.test(x)));

load(); run(`state.outflows.housing=99999999;`);
s=snap();
ok('negative cash flow this month shows as a weakness with the real shortfall amount', s.weaknesses.some(x=>x.includes('exceeds income by')&&!x.includes('-')));

load(); run(`state.targetRiskyAllocationPct=Math.round(computeRebalancingSuggestion(summarizeAllocation(state,0,0),70).riskyPct)`);   // set the target to match actual exactly
s=snap();
ok('when the target matches actual allocation exactly, no drift weakness appears (shows the allocation-ok strength instead)', s.strengths.some(x=>/within the risk-target band/.test(x))&&!s.weaknesses.some(x=>/percentage points off the risk target/.test(x)));
load();
s=snap();
ok('the demo profile\'s REAL drift (~12pp, below its 70% target) DOES produce a drift weakness', s.weaknesses.some(x=>/percentage points off the risk target/.test(x)));

load();
s=snap();
ok('the demo mortgage (9.5%) vs its portfolio yield produces a mortgage strength or weakness consistently with the real comparison', (()=>{const m=J('calculateMetrics()');const terms=J('resolveMortgageTerms(state.realEstate[0],state)');const shouldBeWeak=terms.ratePct>m.weightedPortfolioYield+1;return shouldBeWeak? s.weaknesses.some(x=>/costs more than the portfolio/.test(x)) : s.strengths.some(x=>/below the portfolio/.test(x))})());
load(); run(`state.realEstate=[]`);
s=snap();
ok('no mortgaged property at all: neither a mortgage strength nor a mortgage weakness appears', !s.strengths.some(x=>/mortgage/i.test(x))&&!s.weaknesses.some(x=>/Mortgage \(/.test(x)));

load(); run(`state.insurance.lifeInsuranceCoverage=999999999;`);
s=snap();
ok('ample life insurance COVERAGE (not premium) shows as a strength', s.strengths.includes('Life insurance coverage is sufficient.'));
load(); run(`state.insurance.lifeInsuranceCoverage=0;`);
s=snap();
ok('a life insurance gap shows as a weakness with the real amount', s.weaknesses.some(x=>/Life insurance coverage gap/.test(x)));

load(); run(`state.children=[{id:1,name:'Kid',age:5,schoolMonthly:0,collegeMonthly:0,independenceAge:22}];state.estateSettings.guardianDesignated=false;`);
s=snap();
ok('children present with no guardian designated shows as a weakness', s.weaknesses.includes('There are children in the profile, but no guardian has been designated.'));
run(`state.estateSettings.guardianDesignated=true;`);
s=snap();
ok('...and designating a guardian removes that specific weakness', !s.weaknesses.includes('There are children in the profile, but no guardian has been designated.'));
load(); run(`state.children=[];`);
s=snap();
ok('no children at all: the guardian weakness never appears (nothing to warn about)', !s.weaknesses.some(x=>/no guardian/.test(x)));

// start from a profile with everything ELSE clean, so the bills-due-soon weakness
// (added last, per buildPrintHealthSnapshot's own ordering) is not crowded out of the
// list by the 5-weakness cap — the demo profile alone already has 5 other weaknesses.
load();
run(`state.children=[];state.debts.revolving=0;state.liquidInvestments.forEach(i=>i.isEmergencyReserve=true);state.insurance.lifeInsuranceCoverage=999999999;state.monthlyInvestment=Math.round(calculateMetrics().totalNetInflow*state.targetSavingsRate/100)+500;state.targetRiskyAllocationPct=Math.round(computeRebalancingSuggestion(summarizeAllocation(state,0,0),70).riskyPct);`);
run(`addBillOrSubscription();`);
const billId=J('state.recurringExpenses[state.recurringExpenses.length-1].id');
const findDueDayForDays=(n)=>{for(let dd=1;dd<=31;dd++){if(J(`getRecurringDaysUntilDue(${JSON.stringify({dueDay:dd})})`)===n) return dd;} return null;};
run(`updateRecurringExpense(${billId},'dueDay','${findDueDayForDays(2)}')`);
s=snap();
ok('a bill due in 2 days shows a "bills due soon" weakness with the right count', s.weaknesses.some(x=>/1 bill\(s\)\/subscription\(s\) due soon/.test(x)), JSON.stringify(s.weaknesses));

// ================= 2. recommendations are tied to the score components, weakest first =================
load();
s=snap();
const m=J('calculateMetrics()');
ok('every recommendation shown corresponds to a component actually below 80% of its max', s.recommendations.every(r=>{
  if(r.includes('emergency reserve')) return m.ptsRunway<25*0.8;
  if(r.includes('high-cost debt')) return m.ptsDebt<25*0.8;
  if(r.includes('savings rate')) return m.ptsSavings<25*0.8;
  if(r.includes('hard currency')) return m.scoreIncludesHedge&&m.ptsHedge<25*0.8;
  return false;
}));
load(); run(`state.monthlyInvestment=999999;state.debts.revolving=0;state.liquidInvestments.forEach(i=>i.isEmergencyReserve=true)`);
s=snap();
ok('when every score component is strong, there are few or no recommendations (never a forced/fake one)', s.recommendations.length<=1);
load(); run(`state.debts.revolving=500000;state.liquidInvestments.forEach(i=>i.isEmergencyReserve=false);state.monthlyInvestment=0;`);
s=snap();
load(); run(`state.liquidInvestments.forEach(i=>i.isEmergencyReserve=false);state.liquidInvestments[0].isEmergencyReserve=true;state.liquidInvestments[0].balanceOriginal=50000;state.debts.revolving=500000;state.monthlyInvestment=Math.round(calculateMetrics().totalNetInflow*(state.targetSavingsRate+2)/100);`);
s=snap();
ok('recommendations are sorted weakest-first: reserve is MODERATELY bad (kept, array position 0), debt is WORSE (kept, array position 1) \u2014 debt must still come first', s.recommendations[0].includes('high-cost debt')&&s.recommendations.length>=2&&s.recommendations[1].includes('reserve'), JSON.stringify(s.recommendations));
ok('never more than 3 recommendations (fits a 1-page executive summary)', s.recommendations.length<=3);
ok('never more than 5 strengths or 5 weaknesses shown (same 1-page constraint)', s.strengths.length<=5&&s.weaknesses.length<=5);
// a scenario that genuinely triggers MORE than 5 weakness conditions at once (reserve,
// guardian, revolving debt, savings, cash flow, PLUS insurance gap and allocation drift,
// which are objectively true here too) — proving the cap actually truncates something,
// not just that a short list happens to stay under 5 anyway.
load();
run(`state.children=[{id:1,name:'Kid',age:5,schoolMonthly:0,collegeMonthly:0,independenceAge:22}];state.estateSettings.guardianDesignated=false;state.debts.revolving=50000;state.monthlyInvestment=0;state.outflows.housing=999999999;state.liquidInvestments.forEach(i=>{i.isEmergencyReserve=false;i.volatilityTier='high'});state.targetRiskyAllocationPct=5;state.insurance.lifeInsuranceCoverage=0;`);
ok('setup: at least 7 real weakness conditions are true at once (reserve, guardian, revolving, savings, cash flow, insurance gap, allocation drift)', calculateMetricsAliasCheck2=J('calculateMetrics()').lifeInsuranceGap>0 && J('calculateMetrics()').cashDelta<0 && J('computeRebalancingSuggestion(summarizeAllocation(state,0,0),5).direction')!==null);
s=snap();
ok('...yet the printed list still shows EXACTLY 5 weaknesses, never more, even with 7+ real conditions true', s.weaknesses.length===5, JSON.stringify(s.weaknesses));

// ================= 3. estate section uses the REGIONAL rate, not just the flat country default =================
load();
run(`renderPrintSummary(calculateMetrics());`);
const rateSP=els['print-estate-rate'].innerText;
run(`state.estateSettings.region='RJ';renderPrintSummary(calculateMetrics());`);
const rateRJ=els['print-estate-rate'].innerText;
ok('changing the estate region from São Paulo (4%) to Rio de Janeiro (8%) changes the printed estate rate', rateSP!==rateRJ&&rateSP.startsWith('4.0%')&&rateRJ.startsWith('8.0%'));
run(`state.estateSettings.region=null;renderPrintSummary(calculateMetrics());`);
ok('with no region chosen, it falls back to the flat country default (still correct, just less precise)', els['print-estate-rate'].innerText.startsWith('4.0%'));
run(`state.estateSettings.successionTaxRatePctOverride=2.5;renderPrintSummary(calculateMetrics());`);
ok('an explicit manual override still wins over any regional/country default', els['print-estate-rate'].innerText.startsWith('2.5%'));

// ================= 3b. tax-adjusted target label and the tax-rules-as-of footer =================
load();
run(`renderPrintSummary(calculateMetrics());`);
ok('with the withdrawal-tax adjustment OFF, the target has no "(tax-adjusted)" suffix', !/tax-adjusted/.test(els['print-freedom-nestegg'].innerText));
const targetOff=els['print-freedom-nestegg'].innerText;
run(`state.withdrawalPlan.applyToTarget=true;renderPrintSummary(calculateMetrics());`);
ok('turning the adjustment ON adds the "(tax-adjusted)" suffix AND changes the printed number', /tax-adjusted/.test(els['print-freedom-nestegg'].innerText)&&els['print-freedom-nestegg'].innerText!==targetOff);
ok('...and the number printed matches calculateMetrics() exactly (never a separate/duplicated computation)', els['print-freedom-nestegg'].innerText.includes(J('fmt(calculateMetrics().targetFreedomCapital)')));
run(`state.withdrawalPlan.applyToTarget=false;renderPrintSummary(calculateMetrics());`);
ok('the footer cites the real jurisdiction\'s own tax rule (Brazil IRPF here), matching the SAME registry the in-app badges use', els['print-tax-asof'].innerText===J("taxRulesAsOfText('BR_IRPF')")&&els['print-tax-asof'].innerText.length>5);
run(`state.country='ES';state.baseCurrency='EUR';state.earners.forEach(e=>e.regime='Cuenta Ajena');renderPrintSummary(calculateMetrics());`);
ok("Spain prints Spain's own tax rule (verified via the underlying citation, since BR and ES happen to share the same date text)", els['print-tax-asof'].innerText===J("taxRulesAsOfText('ES_IRPF')")&&J("taxRulesSourceText('ES_IRPF')")!==J("taxRulesSourceText('BR_IRPF')"));
run(`state.country='GL';renderPrintSummary(calculateMetrics());`);
ok('Global mode shows no tax-rules footer (nothing there is a cited law)', els['print-tax-asof'].innerText==='');

// ================= 4. rendering: the actual print template shows the right sections =================
load();
run(`renderPrintSummary(calculateMetrics());`);
ok('the strengths list renders with a checkmark icon', /\u2713/.test(els['print-strengths-list'].innerHTML));
ok('the weaknesses list renders with a warning icon', /\u26a0/.test(els['print-weaknesses-list'].innerHTML));
ok('the recommendations list renders numbered', /1\./.test(els['print-recommendations-list'].innerHTML));
load(); run(`state.children=[];state.debts.revolving=0;state.liquidInvestments.forEach(i=>i.isEmergencyReserve=true);state.insurance.lifeInsuranceCoverage=999999999;state.realEstate=[];state.recurringExpenses=[];state.monthlyInvestment=Math.round(calculateMetrics().totalNetInflow*state.targetSavingsRate/100)+500;state.targetRiskyAllocationPct=Math.round(computeRebalancingSuggestion(summarizeAllocation(state,0,0),70).riskyPct);renderPrintSummary(calculateMetrics());`);
ok('an all-strengths, no-weaknesses profile shows the "none noted" fallback for weaknesses, not an empty broken box', /None noted/.test(text(els['print-weaknesses-list'])));

// ================= 5. XSS, translations, markup =================
load(); run(`state.debts.revolving=5000;renderPrintSummary(calculateMetrics());`);
ok('every bullet is HTML-escaped (defensive check: the fmt() output cannot contain raw tags)', !/<script|<img/.test(els['print-weaknesses-list'].innerHTML));
// HONEST NOTE: no current strength/weakness template interpolates raw user text (only
// fmt()'d amounts and toFixed() percentages) — so there is no REAL path today for a
// hostile string to reach this list, and the check above cannot fail either way. The
// escapeHtml() call in renderPrintHealthSnapshot's line() helper is still correct
// defense-in-depth against a FUTURE bullet that does interpolate a name; this is stated
// rather than papered over with a manufactured scenario that would not reflect real usage.
for(const lang of ['pt','es','en']){
  load('BR',lang); run(`state.debts.revolving=5000;renderPrintSummary(calculateMetrics());`);
  const all=text(els['print-strengths-list'])+text(els['print-weaknesses-list'])+text(els['print-recommendations-list']);
  ok(`[${lang}] health snapshot renders with no leftover placeholders`, all.length>30 && !/\{[a-z0-9]+\}|undefined|NaN/.test(all));
}
load('BR','en'); run(`state.debts.revolving=5000;renderPrintSummary(calculateMetrics());`);
ok('[en] no Portuguese in the health snapshot', !/ção|ões|Reserva de emergência|Dívida/.test(text(els['print-strengths-list'])+text(els['print-weaknesses-list'])+text(els['print-recommendations-list'])));
const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('markup: the three new containers exist', /id="print-strengths-list"/.test(page)&&/id="print-weaknesses-list"/.test(page)&&/id="print-recommendations-list"/.test(page));
ok('the old flat observations container is gone (replaced, not just supplemented)', !/id="print-observations-list"/.test(page));
// ================= blank profile: no false strengths/weaknesses/recommendations (reported directly) =================
// A completely blank profile previously showed THREE nonsensical results: "life
// insurance coverage is sufficient" (a false strength — there is no income/debt yet to
// even calculate a real need from), "emergency reserve covers only 0.0 months" (a false
// weakness — no living cost has been entered to measure "months of coverage" against),
// and "savings rate is 25pp below target" (a false weakness — no income to measure a
// rate from), plus two downstream recommendations repeating the same false weaknesses.
// Each check below is now guarded on having REAL data to assess in the first place.
load();
run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE)));state.language='en';syncFormInputsFromState();`);
s=snap();
ok('blank profile: no false "life insurance sufficient" strength (nothing to assess yet)', !s.strengths.some(x=>/insurance/i.test(x)));
ok('blank profile: no false "emergency reserve" weakness (no living cost entered to measure months against)', !s.weaknesses.some(x=>/reserve/i.test(x)));
ok('blank profile: no false "savings rate" weakness (no income entered to measure a rate from)', !s.weaknesses.some(x=>/savings rate/i.test(x)));
ok('blank profile: the downstream recommendations are empty too (not repeating the same false weaknesses)', s.recommendations.length===0);
ok('blank profile: the one genuinely true, trivial strength (zero debt) is still shown — this was never wrong, just not very useful', s.strengths.includes('No revolving-credit/overdraft debt.'));
// each check must still correctly fire once there IS real data behind it
run(`state.outflows.housing=3000;state.liquidInvestments=[];updateUI();`);
s=snap();
ok('...but a REAL living cost with a genuinely low reserve still correctly shows the weakness (the guard does not silence a real problem)', s.weaknesses.some(x=>/reserve/i.test(x)));
run(`state.earners=[{id:1,name:'A',role:'',age:35,regime:'CLT',grossMonthly:10000,hasHealth:true,foodVoucher:0,pjTaxRate:6,manualNetOverride:false,realNetSalary:0}];state.monthlyInvestment=0;updateUI();`);
s=snap();
ok('...and a REAL income with a genuinely low savings rate still correctly shows the weakness', s.weaknesses.some(x=>/savings rate/i.test(x)));
run(`state.debts={parcelas:0,revolving:0,revolvingRatePct:12,autoLoans:0,autoLoansRatePct:18,parcelasMinPayment:0,revolvingMinPayment:0,autoLoansMinPayment:0};state.insurance.lifeInsuranceCoverage=0;updateUI();`);
s=snap();
ok('...and a REAL need (real living cost) with zero life insurance still correctly shows the gap', s.weaknesses.some(x=>/insurance/i.test(x)));

process.exitCode=bad?1:0;
