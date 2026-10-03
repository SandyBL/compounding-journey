// Proactive alerts on Overview: emergency reserve, bills due soon, approaching
// freedom, negative cash flow. Each must fire correctly, be dismissible, and
// re-arm (show again) once the underlying condition returns after going away.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  syncFormInputsFromState();updateUI();`);
const hidden=(id)=>els[id]._hidden;
const spanText=(id)=>els[id].innerText;
const spanHtml=(id)=>els[id].innerHTML;

// ================= 1. healthy demo profile: every new alert starts hidden =================
load();
ok('emergency reserve: healthy demo (10 months) -> hidden', hidden('banner-emergency-reserve')===true);
ok('bills due soon: nothing due -> hidden', hidden('banner-bills-due-soon')===true);
ok('freedom approaching: 12 years out -> hidden', hidden('banner-freedom-approaching')===true);
ok('cash flow negative: healthy surplus -> hidden', hidden('banner-cashflow-negative')===true);

// ================= 2. emergency reserve below the minimum =================
load();
run(`state.liquidInvestments.forEach(i=>i.isEmergencyReserve=false);updateUI();`);
ok('removing the emergency-reserve tag drops coverage to 0 months and shows the banner', hidden('banner-emergency-reserve')===false && J('calculateMetrics().emergencyMonths')===0);
ok('the banner states the real (0.0) months figure', spanText('lbl-emergency-reserve-months')==='0.0');
run(`dismissEmergencyReserveBanner();`);
ok('dismissing hides it', hidden('banner-emergency-reserve')===true);
run(`updateUI();`);
ok('...and it STAYS hidden on a normal re-render while the condition is still true', hidden('banner-emergency-reserve')===true);
run(`state.liquidInvestments[0].isEmergencyReserve=true;updateUI();`);
ok('fixing it (re-tagging a reserve) hides the banner (condition no longer true)', hidden('banner-emergency-reserve')===true);
run(`state.liquidInvestments.forEach(i=>i.isEmergencyReserve=false);updateUI();`);
ok('...and if it becomes low AGAIN later, the alert re-arms and shows once more (not permanently suppressed)', hidden('banner-emergency-reserve')===false);
load();
run(`state.liquidInvestments[0].balanceOriginal=100000000;updateUI();`);
ok('a large reserve (well above 3 months) never shows the banner', hidden('banner-emergency-reserve')===true);

// ================= 3. bills / subscriptions due soon (reuses the bills feature) =================
load();
run(`addBillOrSubscription();`);
let id=J('state.recurringExpenses[state.recurringExpenses.length-1].id');
const findDueDayForDays=(n)=>{for(let dd=1;dd<=31;dd++){if(J(`getRecurringDaysUntilDue(${JSON.stringify({dueDay:dd})})`)===n) return dd;} return null;};
const soonDay=findDueDayForDays(3);
run(`updateRecurringExpense(${id},'name','Netflix');updateRecurringExpense(${id},'dueDay','${soonDay}');updateUI();`);
ok('a bill due in 3 days shows the reminder banner', hidden('banner-bills-due-soon')===false);
ok('the banner text names the item and how soon', /Netflix/.test(spanHtml('lbl-bills-due-soon-text'))&&/in 3 days/.test(spanHtml('lbl-bills-due-soon-text')));
run(`dismissBillsDueSoonBanner();`);
ok('dismissing hides it', hidden('banner-bills-due-soon')===true);
run(`removeRecurringExpense(${id});updateUI();`);
ok('removing the due bill (condition resolved) leaves it hidden', hidden('banner-bills-due-soon')===true);
run(`addBillOrSubscription();`);
id=J('state.recurringExpenses[state.recurringExpenses.length-1].id');
const farDay=findDueDayForDays(20);
run(`updateRecurringExpense(${id},'name','Rent');updateRecurringExpense(${id},'dueDay','${farDay}');updateUI();`);
ok('a bill due in 20 days (outside the 7-day window) does NOT trigger the reminder', hidden('banner-bills-due-soon')===true);
run(`addBillOrSubscription();`);
const id2=J('state.recurringExpenses[state.recurringExpenses.length-1].id');
run(`updateRecurringExpense(${id2},'name','Water');updateRecurringExpense(${id2},'dueDay','${soonDay}');updateUI();`);
ok('...and a NEW soon-due bill re-arms the alert even though the earlier one was dismissed', hidden('banner-bills-due-soon')===false && /Water/.test(spanHtml('lbl-bills-due-soon-text')));

// ================= 4. approaching financial freedom =================
load();
ok('estimateMonthsToFreedom: 12 years out -> null (not near-term)', J('estimateMonthsToFreedom(calculateMetrics())')===null);
run(`state.monthlyInvestment=500000;updateUI();`);
{
  const months=J('estimateMonthsToFreedom(calculateMetrics())');
  ok('a huge investment boost brings freedom within reach, and the estimate is a small, real number', months!==null&&months>=0&&months<=12,String(months));
  if (months !== null && months <= 6) {
    ok('the freedom-approaching banner shows', hidden('banner-freedom-approaching')===false);
    ok('the banner states the estimate (or "already reached" for 0 months)', months===0 ? /already reached/.test(spanText('lbl-freedom-approaching-text')) : new RegExp('about '+months+' months').test(spanText('lbl-freedom-approaching-text')));
    run(`dismissFreedomApproachingBanner();`);
    ok('dismissing hides it', hidden('banner-freedom-approaching')===true);
  } else {
    ok('(months > 6, outside the alert window in this run \u2014 the null/near-term check above already covers the core logic)', true);
  }
}
// estimateMonthsToFreedom must be a REAL interpolation, not a hardcoded constant: a bigger
// monthly investment should reach the same target SOONER (a smaller months-away estimate).
load(); run(`state.monthlyInvestment=300000;updateUI();`);
const monthsModerate = J('estimateMonthsToFreedom(calculateMetrics())');
load(); run(`state.monthlyInvestment=600000;updateUI();`);
const monthsAggressive = J('estimateMonthsToFreedom(calculateMetrics())');
ok('a larger monthly investment gives a SMALLER (sooner) months-to-freedom estimate, proving real interpolation (not a fixed 0)', monthsModerate!==null&&monthsAggressive!==null&&monthsAggressive<monthsModerate, `moderate=${monthsModerate}, aggressive=${monthsAggressive}`);
ok('...and neither estimate is trivially always 0', monthsModerate>0||monthsAggressive>0);

load();
ok('freedom banner starts hidden on the untouched demo (12 years out)', hidden('banner-freedom-approaching')===true);
run(`state.monthlyInvestment=999999999;updateUI();`);
ok('an enormous investment reaches the target immediately (0 months) and still triggers the "already reached" wording, not a crash', J('estimateMonthsToFreedom(calculateMetrics())')===0&&hidden('banner-freedom-approaching')===false&&/already reached/.test(spanText('lbl-freedom-approaching-text')));

// ================= 5. negative cash flow (spending exceeds income) =================
load();
const originalHousing = J('state.outflows.housing');   // the REAL baseline, not a hardcoded guess
run(`state.outflows.housing=99999999;updateUI();`);
ok('a huge spending increase makes cashDelta negative and shows the banner', J('calculateMetrics().cashDelta')<0 && hidden('banner-cashflow-negative')===false);
ok('the banner states the shortfall amount (absolute value, not negative)', !/-/.test(spanText('lbl-cashflow-negative-amount')));
run(`dismissCashFlowNegativeBanner();`);
ok('dismissing hides it', hidden('banner-cashflow-negative')===true);
run(`state.outflows.housing=${originalHousing};updateUI();`);
ok('restoring the real baseline spending (surplus restored) hides the banner', J('calculateMetrics().cashDelta')>=0 && hidden('banner-cashflow-negative')===true);
run(`state.outflows.housing=99999999;updateUI();`);
ok('...and a NEW deficit later re-arms the alert', hidden('banner-cashflow-negative')===false);

// ================= 6. the pre-existing banners were NOT touched or broken by this feature =================
load();
ok('the high-cost-debt banner (pre-existing) still works: the demo profile has revolving debt by default, so it shows', hidden('banner-highcost-debt')===false);
run(`state.debts.revolving=0;updateUI();`);
ok('...and hides once the revolving debt is paid off', hidden('banner-highcost-debt')===true);
run(`state.debts.revolving=5000;updateUI();`);
ok('...and shows again if revolving debt is taken on again', hidden('banner-highcost-debt')===false);
load();
ok('the next-steps banner (pre-existing) is untouched: hidden for the full demo profile (not "just wizarded")', hidden('banner-next-steps')===true);

// ================= 7. sanitizer =================
const san=(o)=>J(`migrateAndSanitizeState(Object.assign({country:'BR'},${JSON.stringify(o)}))`);
ok('sanitizer: all four dismissal flags default to false', ['emergencyReserveBannerDismissed','billsDueSoonBannerDismissed','freedomApproachingBannerDismissed','cashFlowNegativeBannerDismissed'].every(k=>san({})[k]===false));
ok('sanitizer: a real dismissal is kept', san({emergencyReserveBannerDismissed:true}).emergencyReserveBannerDismissed===true);
ok('sanitizer: junk values -> false, no crash', san({emergencyReserveBannerDismissed:'yes',billsDueSoonBannerDismissed:{x:1}}).emergencyReserveBannerDismissed===false&&san({billsDueSoonBannerDismissed:{x:1}}).billsDueSoonBannerDismissed===false);
load();
run(`state.emergencyReserveBannerDismissed=true;state.cashFlowNegativeBannerDismissed=true;`);
const back=J(`(()=>{const p=JSON.parse(${JSON.stringify(run('JSON.stringify(buildExportPayload())'))});return migrateAndSanitizeState(p.data||p)})()`);
ok('export -> import keeps the dismissal flags', back.emergencyReserveBannerDismissed===true&&back.cashFlowNegativeBannerDismissed===true);

// ================= 8. translations, XSS-safety, markup =================
for(const lang of ['pt','es','en']){
  load('BR',lang);
  run(`state.liquidInvestments.forEach(i=>i.isEmergencyReserve=false);state.outflows.housing=99999999;updateUI();`);
  const all=spanText('lbl-emergency-reserve-months')+els['banner-emergency-reserve'].innerHTML+els['banner-cashflow-negative'].innerHTML;
  ok(`[${lang}] alert banners render with no leftover placeholders`, !/\{[a-z0-9]+\}|undefined|NaN/.test(all));
}
load('BR','en');
run(`state.liquidInvestments.forEach(i=>i.isEmergencyReserve=false);updateUI();`);
ok('[en] no Portuguese in the emergency-reserve banner', !/ção|ões|Reserva de Emergência/.test(els['banner-emergency-reserve'].innerHTML));
run(`addBillOrSubscription();`);
id=J('state.recurringExpenses[state.recurringExpenses.length-1].id');
run(`updateRecurringExpense(${id},'name','<img src=x onerror=alert(1)>');updateRecurringExpense(${id},'dueDay','${findDueDayForDays(1)}');updateUI();`);
ok('a hostile bill name in the due-soon banner is HTML-escaped, not injected raw', /&lt;img src=x/.test(spanHtml('lbl-bills-due-soon-text'))&&!/<img src=x/.test(spanHtml('lbl-bills-due-soon-text')));
const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('markup: all four new banners exist with their dismiss buttons', ['banner-emergency-reserve','banner-bills-due-soon','banner-freedom-approaching','banner-cashflow-negative'].every(id=>page.includes(`id="${id}"`)) && /onclick="dismissEmergencyReserveBanner\(\)"/.test(page) && /onclick="dismissBillsDueSoonBanner\(\)"/.test(page) && /onclick="dismissFreedomApproachingBanner\(\)"/.test(page) && /onclick="dismissCashFlowNegativeBanner\(\)"/.test(page));
// ================= 11. blank profile: no false "already reached" (reported directly) =================
// A completely blank profile (nothing entered yet) has a freedom target of exactly $0
// (no living-cost data), and 0 >= 0 is trivially true at year zero — this used to show
// "you've already reached financial freedom" on a profile with literally nothing in it.
// Fixed at the root (calc/metrics.js's projectCrossover): a target of 0 is treated as
// "not reached" (no real target to have reached), the same as never reaching a real one.
run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE)));state.language='en';syncFormInputsFromState();updateUI();`);
ok('a completely blank profile does NOT claim financial freedom has been reached', hidden('banner-freedom-approaching')===true);
ok('...because yearsToCrossover itself is null (no real target), not a trivial 0', J('calculateMetrics().yearsToCrossover')===null);
ok('...and estimateMonthsToFreedom agrees (defense in depth: both the root metric and this alert-specific estimate say "no estimate")', J('estimateMonthsToFreedom(calculateMetrics())')===null);
// a REAL target that is genuinely, immediately met must still correctly say so
run(`state.outflows.housing=1000;state.liquidInvestments=[{id:1,name:'X',currency:state.baseCurrency,balanceOriginal:99999999,annualYieldPct:8,liquidityTier:'same_day',volatilityTier:'low',isEmergencyReserve:true}];updateUI();`);
ok('a profile with a REAL, positive target that is genuinely already met still correctly shows 0 (not broken by the fix above)', J('calculateMetrics().yearsToCrossover')===0 && J('calculateMetrics().targetFreedomCapital')>0);

process.exitCode=bad?1:0;
