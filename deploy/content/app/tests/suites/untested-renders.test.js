// Test coverage for six render functions flagged by the code-quality audit as having
// zero dedicated correctness tests (only incidental crash-detection via a smoke test
// calling updateUI() broadly): renderBudgetMatrix, renderChildrenList,
// renderCrossoverMilestones, renderDynamicFxInputs, autoSyncCurrentMonthSnapshot,
// renderEquityGrantsList. Two real bugs were found while writing this and are fixed
// (see the FIRST assertion in sections 1 and 3).
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const clear=(...ids)=>ids.forEach(id=>{if(els[id]&&els[id].children)els[id].children.length=0;});
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  syncFormInputsFromState();updateUI();`);

// ================= 1. renderBudgetMatrix =================
load();
clear('table-budget-matrix-body'); run('renderBudgetMatrix(calculateMetrics())');
ok('BUGFIX: all 10 canonical outflow categories are shown, not just the original 8 (elderCare and charitableGiving used to be silently missing)', els['table-budget-matrix-body'].children.length===10);
ok('row order matches the canonical XLSX_OUTFLOW_KEYS list', els['table-budget-matrix-body'].children.map(c=>c.innerHTML.match(/font-semibold text-slate-200">([^<]+)</)[1]).join('|')===J('XLSX_OUTFLOW_KEYS.map(([k,l])=>t(l))').join('|'));
run(`state.outflows.housing=5000;state.budgetTargets.housing=4000;`);
clear('table-budget-matrix-body'); run('renderBudgetMatrix(calculateMetrics())');
let housingRow=els['table-budget-matrix-body'].children[0].innerHTML;
ok('over-budget category (actual > target) shows a negative diff and the "exceeded" badge, in rose', /-/.test(housingRow)&&/text-rose-400/.test(housingRow));
run(`state.outflows.housing=2000;state.budgetTargets.housing=4000;`);
clear('table-budget-matrix-body'); run('renderBudgetMatrix(calculateMetrics())');
housingRow=els['table-budget-matrix-body'].children[0].innerHTML;
ok('under-budget category shows a "+" diff and the "within" badge, in emerald', /\+/.test(housingRow)&&/text-emerald-400/.test(housingRow));
ok('editing a row calls updateBudgetTarget and persists the new target', (()=>{ run(`updateBudgetTarget('housing','7777')`); return J('state.budgetTargets.housing')===7777; })());
ok('copyActualsToBudget copies every CURRENT outflow into budgetTargets exactly', (()=>{ run('copyActualsToBudget()'); return JSON.stringify(J('state.budgetTargets'))===JSON.stringify(J('state.outflows')); })());
run(`state.budgetTargets={};`);
clear('table-budget-matrix-body'); run('renderBudgetMatrix(calculateMetrics())');
ok('a missing/empty budgetTargets object defaults every target to 0, no crash, no NaN', !/NaN|undefined/.test(text(els['table-budget-matrix-body'])));

// ================= 2. renderChildrenList =================
load();
clear('container-children-list'); run('renderChildrenList()');
ok('renders one card per child', els['container-children-list'].children.length===J('state.children.length'));
run('addChild();');
clear('container-children-list'); run('renderChildrenList()');
ok('addChild() adds exactly one child with sane defaults', J('state.children.length')===2 && J('state.children[1].age')===5 && J('state.children[1].independenceAge')===23);
const kidId=J('state.children[1].id');
run(`updateChild(${kidId},'name','Mia');updateChild(${kidId},'age','9');updateChild(${kidId},'schoolMonthly','1500');updateChild(${kidId},'collegeMonthly','2500');updateChild(${kidId},'independenceAge','24')`);
ok('updateChild writes each field with the correct type (numeric fields become numbers, name stays a string)', J(`state.children.find(k=>k.id===${kidId})`).name==='Mia' && J(`state.children.find(k=>k.id===${kidId})`).age===9 && typeof J(`state.children.find(k=>k.id===${kidId})`).age==='number');
run(`updateChild(${kidId},'age','abc')`);
ok('a non-numeric value for a numeric field falls back to 0, not NaN or a crash', J(`state.children.find(k=>k.id===${kidId})`).age===0);
run(`removeChild(${kidId})`);
ok('removeChild removes exactly that child, no others', J('state.children.length')===1 && !J('state.children').some(k=>k.id===kidId));
run(`addChild();updateChild(state.children[state.children.length-1].id,'name','<img src=x onerror=alert(1)>')`);
clear('container-children-list'); run('renderChildrenList()');
const hostileCard=els['container-children-list'].children[els['container-children-list'].children.length-1].innerHTML;
ok('a hostile child name is HTML-escaped, not injected raw', /&lt;img src=x/.test(hostileCard)&&!/<img src=x/.test(hostileCard));
run(`state.children=[];`);
clear('container-children-list'); run('renderChildrenList()');
ok('zero children: empty list, no crash', els['container-children-list'].children.length===0);

// ================= 3. renderCrossoverMilestones =================
load();
clear('container-crossover-milestones'); run('renderCrossoverMilestones(calculateMetrics())');
ok('one card per earner', els['container-crossover-milestones'].children.length===J('state.earners.length'));
let card0=els['container-crossover-milestones'].children[0].innerHTML;
ok('shows the earner\'s real current age', new RegExp(J('state.earners[0].age')+' ').test(card0));
for(const lang of ['pt','es','en']){
  load('BR',lang);
  clear('container-crossover-milestones'); run('renderCrossoverMilestones(calculateMetrics())');
  const all=text(els['container-crossover-milestones']);
  ok(`BUGFIX: [${lang}] age-at-freedom labels now go through the real t()/i18n system (used to be hand-rolled ternaries invisible to translation checks), no leftover placeholders`, all.length>20 && !/\{[a-z0-9]+\}|undefined|NaN/.test(all));
}
load('BR','en');
run(`state.monthlyInvestment=0;state.liquidInvestments=[];state.realEstate=[];state.debts={parcelas:0,revolving:0,autoLoans:0,revolvingRatePct:0,autoLoansRatePct:0,parcelasMinPayment:0,revolvingMinPayment:0,autoLoansMinPayment:0};`);
clear('container-crossover-milestones'); run('renderCrossoverMilestones(calculateMetrics())');
ok('when freedom is never reached (null), shows the "not reached" wording, not a crash or NaN', /years \(Not reached\)/.test(text(els['container-crossover-milestones'])));

// A DIFFERENT scenario from the one above: reported directly — a completely BLANK
// profile (not "has real costs but never gets there in 35 years", but "nothing entered
// at all") has a freedom target of exactly $0, and used to show "Already reached" on
// every earner's milestone card, since 0 >= 0 is trivially true at year zero. Fixed at
// the root (calc/metrics.js): a $0 target is treated as "not reached", same as a real
// target that's never met.
run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE)));state.language='en';state.earners=[{id:1,name:'A',role:'',age:35,regime:'CLT',grossMonthly:0,hasHealth:true,foodVoucher:0,pjTaxRate:6,manualNetOverride:false,realNetSalary:0}];syncFormInputsFromState();updateUI();`);
clear('container-crossover-milestones'); run('renderCrossoverMilestones(calculateMetrics())');
ok('BUGFIX: a completely blank profile (target = $0) shows "not reached", never "already reached"', /Not reached/.test(text(els['container-crossover-milestones'])) && !/Already reached/.test(text(els['container-crossover-milestones'])));
load('BR','en'); run('state.earners=[];');
clear('container-crossover-milestones'); run('renderCrossoverMilestones(calculateMetrics())');
ok('zero earners: empty list, no crash', els['container-crossover-milestones'].children.length===0);

// ================= 4. renderDynamicFxInputs =================
load();
run('renderDynamicFxInputs();');
ok('shows exactly the 2 FOREIGN currencies (3 supported minus the base), never the base currency itself', els['container-dynamic-fx-rates'].children.length===2 && !text(els['container-dynamic-fx-rates']).includes('1 BRL ='));
ok('the base-currency tag label shows the real base currency', els['lbl-fx-base-tag'].innerText.includes('BRL'));
run(`updateFxRate('USD','6.25')`);
ok('updateFxRate saves the new rate and stamps a fresh lastUpdated date', J('state.fxRates.USD')===6.25 && J('state.fxLastUpdated')===new Date().toISOString().slice(0,10));
run(`state.baseCurrency='USD';state.fxRates=null;`);
run('renderDynamicFxInputs();');
ok('switching base currency with fxRates cleared seeds fresh defaults for the new base, no crash', !/NaN|undefined/.test(text(els['container-dynamic-fx-rates'])) && J('state.fxRates')!==null);
ok('the foreign-currency list now correctly excludes USD (the new base) and includes BRL instead', text(els['container-dynamic-fx-rates']).includes('1 BRL =') && !text(els['container-dynamic-fx-rates']).includes('1 USD ='));

// ================= 5. autoSyncCurrentMonthSnapshot =================
load();
run('state.monthlySnapshots=[];');
run('autoSyncCurrentMonthSnapshot(calculateMetrics());');
ok('creates exactly one auto-synced snapshot for a profile with real data', J('state.monthlySnapshots.length')===1 && J('state.monthlySnapshots[0].autoSynced')===true);
const nwFirst=J('state.monthlySnapshots[0].netWorth');
run('state.liquidInvestments[0].balanceOriginal+=50000;');
run('autoSyncCurrentMonthSnapshot(calculateMetrics());');
ok('calling it again THE SAME MONTH updates the existing snapshot in place, never duplicates it', J('state.monthlySnapshots.length')===1 && J('state.monthlySnapshots[0].netWorth')>nwFirst);
run(`state.monthlySnapshots[0].label='My Own Custom Label';run_marker=1;`);
run('autoSyncCurrentMonthSnapshot(calculateMetrics());');
ok('a label the person typed over the auto one is preserved on the next auto-sync, not overwritten', J('state.monthlySnapshots[0].label')==='My Own Custom Label');
run(`addChild();updateChild(state.children[state.children.length-1].id,'name','X');confirmAddSnapshot===undefined?null:null;`);
run(`state.monthlySnapshots=[{id:1,date:'2020-01-15',time:'10:00',label:'Old manual entry',netWorth:1000,liquidInvestments:500,totalDebts:0,totalAssets:1000,savingsRate:10,isManual:true,autoSynced:false}];`);
run('autoSyncCurrentMonthSnapshot(calculateMetrics());');
ok('an old MANUAL snapshot from a different month is left alone; a NEW auto snapshot is added for the current month instead of overwriting it', J('state.monthlySnapshots.length')===2 && J('state.monthlySnapshots[0].label')==='Old manual entry');
// isolates the PRIMARY findIndex check (autoSynced + current month) from its own
// fallback (!isManual + current month) — an entry that is BOTH autoSynced AND
// isManual (an edge combination, but a real one: someone can manually re-label an
// auto-synced entry) is only found by the primary check, since the fallback
// explicitly requires !isManual.
load();
run(`state.monthlySnapshots=[{id:1,date:new Date().toISOString().slice(0,10),time:'10:00',label:'X',netWorth:1,liquidInvestments:1,totalDebts:0,totalAssets:1,savingsRate:1,isManual:true,autoSynced:true}];`);
run('autoSyncCurrentMonthSnapshot(calculateMetrics());');
ok('an entry that is BOTH autoSynced and isManual is still matched and updated in place by the primary check, not duplicated', J('state.monthlySnapshots.length')===1);
load();
run(`state.earners=[];state.liquidInvestments=[];state.realEstate=[];state.debts={parcelas:0,revolving:0,autoLoans:0,revolvingRatePct:0,autoLoansRatePct:0,parcelasMinPayment:0,revolvingMinPayment:0,autoLoansMinPayment:0};state.goals=[];state.equityGrants=[];state.monthlySnapshots=[];`);
run('autoSyncCurrentMonthSnapshot(calculateMetrics());');
ok('a completely empty, pre-setup profile (nothing entered yet) creates NO auto-snapshot (avoids a meaningless "$0 net worth" data point)', J('state.monthlySnapshots.length')===0);

// ================= 6. renderEquityGrantsList =================
load();
run('state.equityGrants=[];addEquityGrant();');
clear('container-equity-grants-list'); run('renderEquityGrantsList()');
ok('addEquityGrant adds one grant with sane defaults (0 vested, 0 unvested, base currency)', J('state.equityGrants.length')===1 && J('state.equityGrants[0].vestedValue')===0 && J('state.equityGrants[0].currency')===J('state.baseCurrency'));
const grantId=J('state.equityGrants[0].id');
run(`updateEquityGrant(${grantId},'name','RSUs');updateEquityGrant(${grantId},'vestedValue','80000');updateEquityGrant(${grantId},'unvestedValue','120000');updateEquityGrant(${grantId},'currency','USD')`);
const netWorthBefore=J('calculateMetrics().netWorth');
ok('vested equity value is counted in net worth', netWorthBefore>0);
run(`updateEquityGrant(${grantId},'vestedValue','0')`);
const netWorthAfterZero=J('calculateMetrics().netWorth');
ok('zeroing the vested value reduces net worth accordingly (it really was counted, not just displayed)', netWorthAfterZero<netWorthBefore);
run(`updateEquityGrant(${grantId},'vestedValue','80000')`);
ok('unvested value is NOT counted in the liquid portfolio used for FIRE projections (informational only)', (()=>{
  const m1=J('calculateMetrics()');
  run(`updateEquityGrant(${grantId},'unvestedValue','999999999')`);
  const m2=J('calculateMetrics()');
  return m1.totalLiquidBase===m2.totalLiquidBase;
})());
run(`removeEquityGrant(${grantId})`);
ok('removeEquityGrant removes exactly that grant', J('state.equityGrants.length')===0);
run(`addEquityGrant();updateEquityGrant(state.equityGrants[0].id,'name','<img src=x onerror=alert(1)>')`);
clear('container-equity-grants-list'); run('renderEquityGrantsList()');
ok('a hostile grant name is HTML-escaped, not injected raw', /&lt;img src=x/.test(els['container-equity-grants-list'].children[0].innerHTML)&&!/<img src=x/.test(els['container-equity-grants-list'].children[0].innerHTML));

process.exitCode=bad?1:0;
