// Debt payments in the Cash Flow + the payoff plan as automatic Life events.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const near=(a,b,tol=1e-6)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b));
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const clear=(...ids)=>ids.forEach(id=>{if(els[id]&&els[id].children)els[id].children.length=0});
const CY=new Date().getFullYear();
// a small controlled household: net pay ~ known, one outflow line, nothing else
const base=(extra={})=>run(`state=migrateAndSanitizeState(Object.assign({country:'BR',language:'en',baseCurrency:'BRL',displayCurrency:'BRL',
  earners:[{id:1,name:'A',age:35,regime:'CLT',grossMonthly:12000}],outflows:{housing:2000,groceries:1000},monthlyInvestment:1000,
  liquidInvestments:[{id:5,name:'P',currency:'BRL',balanceOriginal:100000,annualYieldPct:8,liquidityTier:'short',volatilityTier:'low'}],
  debts:{parcelas:0,revolving:0,autoLoans:0}},${JSON.stringify(extra)}));state.language='en';syncFormInputsFromState();`);
const M=()=>J(`(()=>{const m=calculateMetrics();return {cash:m.cashDelta,deployed:m.totalDeployedOutflows,fixed:m.totalFixedOutflows,life:m.totalLifestyleOutflows,invest:m.monthlyInvest,net:m.totalNetInflow,pay:m.debtPaymentsMonthly,estPay:m.debtPaymentsEstimated,estN:m.debtPaymentsEstimatedCount,living:m.totalMonthlyLivingCost,target:m.targetFreedomCapital,surplus:m.monthlySurplus,years:m.yearsToCrossover,goals:m.goalsMonthlyTotal}})()`);

// ============ 1. the Cash Flow line ============
base();const m0=M();
ok('no debts -> a zero debt line, and the surplus is untouched',m0.pay===0&&m0.estN===0&&near(m0.cash,m0.net-m0.deployed));
base({debts:{parcelas:6000,parcelasMinPayment:600,revolving:4000,revolvingRatePct:100,revolvingMinPayment:500,autoLoans:20000,autoLoansRatePct:20,autoLoansMinPayment:1000},autoEventsOff:1});
run(`state.debtPlan.autoEvents=false`);const m1=M();
ok('debt payments 600 + 500 + 1,000 = 2,100 a month appear in the cash flow',m1.pay===2100&&m1.estN===0&&m1.estPay===0);
ok('...and the surplus falls by EXACTLY that amount',near(m1.cash,m0.cash-2100,1e-9),`${m0.cash.toFixed(2)} -> ${m1.cash.toFixed(2)}`);
ok('...the month\'s deployed outflows include the debt line: fixed + lifestyle + investing + goals + debt',near(m1.deployed,m1.fixed+m1.life+m1.invest+m1.goals+m1.pay,1e-9));
ok('...but the freedom target and living cost do NOT change (debts end, so they are not part of it)',m1.living===m0.living&&m1.target===m0.target);
ok('the "surplus" the projection uses follows the lower cash flow',near(m1.surplus,Math.max(0,m1.cash),1e-9));
// estimated payments
base({debts:{revolving:4000,revolvingRatePct:100}});run(`state.debtPlan.autoEvents=false`);const m2=M();
const est=J('estimateDebtPayment(4000,100)');
ok('a payment left blank is ESTIMATED (one month of interest + 1% of balance), counted, and reported as estimated',near(m2.pay,est,1e-9)&&m2.estN===1&&near(m2.estPay,est,1e-9),`${m2.pay.toFixed(2)} (est. ${m2.estN})`);
// mortgages
base({realEstate:[{id:9,name:'Flat',currency:'BRL',marketValue:900000,mortgageDebt:300000,mortgageRatePct:9,mortgagePayment:2500}],debts:{parcelas:0,revolving:0,autoLoans:0}});
run(`state.debtPlan.autoEvents=false;state.debtPlan.includeMortgages=false`);
ok('a mortgage payment is real cash out of the month: counted even when the payoff plan leaves mortgages out',M().pay===2500);
run(`state.realEstate[0].currency='USD'`);const fx=J(`convertToBase(1,'USD')`);
ok('a property in another currency: its payment is converted to the base currency',near(M().pay,2500*fx,1e-9),`x${fx}`);
// the reconcile UI
base({debts:{parcelas:6000,parcelasMinPayment:600,revolving:4000,revolvingRatePct:100,revolvingMinPayment:500,autoLoans:20000,autoLoansRatePct:20}});
run(`state.debtPlan.autoEvents=false;updateUI()`);
const mm=M();
const expectPay=1100+J('estimateDebtPayment(20000,20)');   // 600 + 500 entered, the vehicle loan's payment left blank -> estimated
ok('Cash Flow tab: the debt card shows the monthly total (entered + estimated) and its share of net income',near(mm.pay,expectPay,1e-9)&&els['lbl-cf-bucket-debt-sum'].innerText===J(`fmt(${expectPay})`)+' / mo'&&els['lbl-cf-bucket-debt-pct'].innerText===(expectPay/mm.net*100).toFixed(1)+'%',els['lbl-cf-bucket-debt-sum'].innerText+' '+els['lbl-cf-bucket-debt-pct'].innerText);
ok('...an estimated payment is flagged on the card ("1 payment(s) estimated")',/1 payment\(s\) estimated/.test(els['lbl-cf-bucket-debt-est'].innerText),els['lbl-cf-bucket-debt-est'].innerText);
run(`state.debts.autoLoansMinPayment=1000;updateUI()`);
ok('...and the flag disappears once every payment is entered',els['lbl-cf-bucket-debt-est'].innerText==='');
ok('the reconciliation total (money allocated) includes the debt payments',near(J('calculateMetrics().totalDeployedOutflows'),mm.deployed-mm.pay+J('calculateMetrics().debtPaymentsMonthly')));
const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('markup: the debt card sits in the Cash Flow tab, before the lifestyle card',page.indexOf('id="lbl-cf-bucket-debt-sum"')>page.indexOf('id="lbl-cf-bucket-fixed-sum"')&&page.indexOf('id="lbl-cf-bucket-debt-sum"')<page.indexOf('id="lbl-cf-bucket-lifestyle-sum"'));
ok('print summary: a "Debt payments" line in the cash flow block',/id="print-cf-debt-payments"/.test(page));

// ============ 2. every surplus consumer sees the new surplus ============
base({debts:{revolving:0,autoLoans:20000,autoLoansRatePct:20,autoLoansMinPayment:1000}});run(`state.debtPlan.autoEvents=false;`);
const surplus=Math.floor(Math.max(0,J('calculateMetrics().cashDelta')));
run('useSurplusForDebts()');
ok('the planner\'s surplus button now offers the surplus AFTER debt payments',J('state.debtPlan.extraMonthly')===surplus);
base();const s0=M().cash;base({debts:{autoLoans:20000,autoLoansRatePct:20,autoLoansMinPayment:1000}});run(`state.debtPlan.autoEvents=false;`);
ok('...which is exactly 1,000 lower than the same household without that loan',near(M().cash,s0-1000,1e-9));
// What-if feasibility
base({debts:{autoLoans:20000,autoLoansRatePct:20,autoLoansMinPayment:1000}});run(`state.debtPlan.autoEvents=false;state.whatIf=Object.assign({},WHATIF_NEUTRAL,{extraSavingsPct:0})`);
const cashNow=J('calculateMetrics().cashDelta'),net=J('calculateMetrics().totalNetInflow');
const pctOver=Math.ceil((cashNow+50)/net*100);            // saves just a little more than the free cash allows
run(`state.whatIf.extraSavingsPct=${pctOver}`);
ok('What-if: saving more than the (debt-adjusted) free cash allows raises the cash warning',J('computeWhatIf().cashShort')>0,`+${pctOver}% of ${net.toFixed(0)} vs free ${cashNow.toFixed(0)}`);
base({debts:{autoLoans:0}});run(`state.whatIf=Object.assign({},WHATIF_NEUTRAL,{extraSavingsPct:${pctOver}})`);
ok('...the same lever on the household WITHOUT the loan fits in its cash flow (no warning)',J('computeWhatIf().cashShort')===0);
// Life events absorb costs from the lower surplus
base();const surpNo=J('calculateMetrics().monthlySurplus');base({debts:{autoLoans:20000,autoLoansRatePct:20,autoLoansMinPayment:1000}});run(`state.debtPlan.autoEvents=false`);
ok('Life events use the lower surplus to absorb monthly costs (surplus down by the payments, floored at 0)',near(J('calculateMetrics().monthlySurplus'),Math.max(0,surpNo-1000),1e-9));

// ============ 3. month-precise events ============
const sch=(events,years=10)=>J(`buildLifeEventSchedule(${JSON.stringify(events)},${years},${CY})`);
const E=(o)=>Object.assign({kind:'monthly',direction:'in',amount:2520,enabled:true,year:CY},o);
let s=sch([E({fromMonth:15,toMonth:null})]);
ok('freed payments from month 15: year 0 nothing, year 1 = months 15..24 = 10/12 of the amount, then the full amount',s.monthly[0]===0&&near(s.monthly[1],2520*10/12)&&s.monthly[2]===2520&&s.monthly[10]===2520);
s=sch([E({fromMonth:13,toMonth:null})]);ok('starting exactly on a year boundary (month 13) gives year 1 the full amount',s.monthly[0]===0&&s.monthly[1]===2520);
s=sch([E({fromMonth:6,toMonth:null})]);ok('starting in month 6: year 0 has 7 free months (6..12) = 7/12',near(s.monthly[0],2520*7/12)&&s.monthly[1]===2520);
s=sch([E({direction:'out',amount:1000,fromMonth:1,toMonth:14})]);
ok('extra payments for months 1..14: 12/12 in year 0, 2/12 in year 1, nothing after',s.monthly[0]===-1000&&near(s.monthly[1],-1000*2/12)&&s.monthly[2]===0);
s=sch([E({direction:'out',amount:600,fromMonth:1,toMonth:12})]);ok('...exactly 12 months = year 0 only',s.monthly[0]===-600&&s.monthly[1]===0);
s=sch([E({direction:'out',amount:600,fromMonth:1,toMonth:1})]);ok('...a single month = 1/12 of the amount',near(s.monthly[0],-50)&&s.monthly[1]===0);
ok('disabled month-precise events are ignored',sch([E({fromMonth:1,toMonth:null,enabled:false})]).monthly.every(x=>x===0));
ok('the old year-based form still works next to it',(()=>{const r=sch([{kind:'monthly',direction:'out',amount:100,year:CY+2,years:2,enabled:true}]);return r.monthly[2]===-100&&r.monthly[3]===-100&&r.monthly[4]===0})());

// ============ 4. the automatic events ============
const DEBTS={parcelas:6000,parcelasMinPayment:600,revolving:4000,revolvingRatePct:100,revolvingMinPayment:500,autoLoans:20000,autoLoansRatePct:20,autoLoansMinPayment:1000};
base({debts:DEBTS,debtPlan:{extraMonthly:0,method:'avalanche',includeMortgages:false,autoEvents:true}});
let ev=J('buildDebtPlanEvents(state)');
const T0=J(`simulateDebtPayoff(buildPlanDebts(state,false),0,'avalanche').months`);
ok('extra = 0: one automatic event, "freed payments", starting the month AFTER the last debt is cleared',ev.length===1&&ev[0].nameKey==='dpEventFreed'&&ev[0].direction==='in'&&ev[0].fromMonth===T0+1&&ev[0].toMonth===null&&ev[0].auto===true,JSON.stringify(ev[0]));
ok('...for the sum of the debts\' payments (2,100)',ev[0].amount===2100);
run(`state.debtPlan.extraMonthly=800`);ev=J('buildDebtPlanEvents(state)');
const T1=J(`simulateDebtPayoff(buildPlanDebts(state,false),800,'avalanche').months`);
ok('with an extra 800: also an "extra payments" event, out, months 1..T, and the freed one starts later than T',ev.length===2&&ev[0].nameKey==='dpEventExtra'&&ev[0].direction==='out'&&ev[0].amount===800&&ev[0].fromMonth===1&&ev[0].toMonth===T1&&ev[1].fromMonth===T1+1,JSON.stringify(ev.map(e=>[e.nameKey,e.fromMonth,e.toMonth])));
ok('...more extra money clears the debts sooner, so the payments are freed sooner',T1<T0,`${T0} -> ${T1} months`);
run(`state.debtPlan.method='snowball'`);
ok('the chosen method decides the timing',J('buildDebtPlanEvents(state)').find(e=>e.id===-2).fromMonth===J(`simulateDebtPayoff(buildPlanDebts(state,false),800,'snowball').months`)+1);
run(`state.debtPlan.method='avalanche';state.debtPlan.autoEvents=false`);ok('switch off -> no automatic events',J('buildDebtPlanEvents(state)').length===0);
run(`state.debtPlan.autoEvents=true;state.debts.autoLoans=0;state.debts.revolving=0;state.debts.parcelas=0`);ok('no debts -> no automatic events',J('buildDebtPlanEvents(state)').length===0);
run(`state.debts.autoLoans=1000000;state.debts.autoLoansRatePct=50;state.debts.autoLoansMinPayment=1000;`);ok('a plan that never finishes (payment below the interest) -> no automatic events',J('buildDebtPlanEvents(state)').length===0);
base({debts:{parcelas:6000,parcelasMinPayment:600},realEstate:[{id:9,name:'Flat',currency:'BRL',marketValue:900000,mortgageDebt:300000,mortgageRatePct:9,mortgagePayment:2500}],debtPlan:{autoEvents:true,includeMortgages:false}});
let f=J('buildDebtPlanEvents(state).find(e=>e.id===-2)');
ok('mortgages are left out of the freed payments unless the plan includes them (600 vs 3,100)',f.amount===600);
run(`state.debtPlan.includeMortgages=true`);f=J('buildDebtPlanEvents(state).find(e=>e.id===-2)');ok('...included: the mortgage payment is freed too',f.amount===3100);
// they feed the metrics
base({debts:DEBTS,debtPlan:{extraMonthly:800,method:'avalanche',autoEvents:true}});
ok('calculateMetrics().lifeEvents = the person\'s own events + the automatic ones',J('calculateMetrics().lifeEvents.filter(e=>e.auto).length')===2);
ok('the automatic events are derived, never stored in the profile or the export',J('state.lifeEvents.length')===0&&!/dpEventFreed|"auto":true/.test(run('JSON.stringify(buildExportPayload())')));
// projection: engine == independent hand-rolled projection
{
  const p=J(`(()=>{const m=calculateMetrics();return {start:m.totalLiquidBase,inv:m.monthlyInvest,r:m.realAnnualReturn,g:m.careerGrowthRate,prop:m.careerGrowthProportional,surplus:m.monthlySurplus,vals:simulateRealPortfolio({start:m.totalLiquidBase,monthlyInvest:m.monthlyInvest,years:35,realReturn:m.realAnnualReturn,careerGrowthRate:m.careerGrowthRate,careerGrowthProportional:m.careerGrowthProportional,events:m.lifeEvents,surplus:m.monthlySurplus}).values}})()`);
  const T=T1,S=2100,X=800;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  run(`globalThis.ref2=function(o){let bal=o.start;const v=[bal];for(let y=0;y<35;y++){let c=getProjectedMonthlyContribution(o.inv,y,o.g,o.prop);
      const d=o.delta[y];if(d>0)c+=d;else if(d<0)c-=Math.max(0,-d-o.surplus);bal=compoundOneYear(bal,c,o.r);if(bal<0)bal=0;v.push(bal)}return v}`);
  const delta=Array.from({length:35},(_,y)=>S*clamp(12*(y+1)-T,0,12)/12 - X*clamp(T-12*y,0,12)/12);
  const ref=J(`ref2(${JSON.stringify({start:p.start,inv:p.inv,r:p.r,g:p.g,prop:p.prop,surplus:p.surplus,delta})})`);
  ok('projection with the automatic events == an independent hand-rolled projection (35 years, every value)',ref.length===p.vals.length&&ref.every((v,i)=>near(v,p.vals[i],1e-9)),'T='+T);
}
// direction of the effect
base({debts:DEBTS,debtPlan:{extraMonthly:0,method:'avalanche',autoEvents:true}});const yOn=J('calculateMetrics().yearsToCrossover');
run(`state.debtPlan.autoEvents=false`);const yOff=J('calculateMetrics().yearsToCrossover');
ok('investing the freed payments never delays freedom (extra = 0)',yOn===null?yOff===null:(yOff===null||yOn<=yOff),`${yOff} -> ${yOn} years`);
ok('freed payments raise the projected portfolio in the long run',(()=>{run(`state.debtPlan.autoEvents=true`);const a=J(`wiSeries(calculateMetrics(),30)[30]`);run(`state.debtPlan.autoEvents=false`);const b=J(`wiSeries(calculateMetrics(),30)[30]`);return a>b})());
// What-if includes them
run(`state.debtPlan.autoEvents=true;state.whatIf=Object.assign({},WHATIF_NEUTRAL)`);
ok('What-if "current plan" includes the automatic events (equals calculateMetrics)',J('computeWhatIf().base.freedomYears')===J('calculateMetrics().yearsToCrossover')&&J('computeWhatIf().base.m.lifeEvents.filter(e=>e.auto).length')>=1);
// sanitizer
const san=(dp)=>J(`migrateAndSanitizeState({country:'BR',debtPlan:${JSON.stringify(dp)}}).debtPlan`);
ok('sanitizer: autoEvents defaults to true; "false" / false switch it off; junk falls back to true',san({}).autoEvents===true&&san({autoEvents:'false'}).autoEvents===false&&san({autoEvents:false}).autoEvents===false&&san({autoEvents:'zzz'}).autoEvents===true);

// ============ 5. the screens ============
base({debts:DEBTS,debtPlan:{extraMonthly:800,method:'avalanche',autoEvents:true}});
clear('container-life-events-auto');run('renderLifeEventsAuto()');
let au=text(els['container-life-events-auto']);
ok('Life events tab: two read-only automatic cards, named in the language, with amounts and dates',/Extra debt payments \(payoff plan\)/.test(au)&&/Freed-up payments go to investments/.test(au)&&/Extra payment of .*800.* a month for/.test(au)&&/invested from \w{3}\.? \d{4}/.test(au),au.slice(0,160));
ok('...no edit fields or delete buttons on them, only "Edit the plan"',!/updateLifeEvent|removeLifeEvent/.test(els['container-life-events-auto'].innerHTML)&&/Edit the plan/.test(au)&&/switchTab\('view-balancesheet'\)/.test(els['container-life-events-auto'].innerHTML));
run(`state.debtPlan.autoEvents=false`);clear('container-life-events-auto');run('renderLifeEventsAuto()');
ok('...and the section is empty when the switch is off',text(els['container-life-events-auto']).trim()==='');
run(`state.debtPlan.autoEvents=true;state.language='es'`);clear('container-life-events-auto');run('renderLifeEventsAuto()');
ok('translated: Spanish',/Pagos extra de deudas/.test(text(els['container-life-events-auto'])));
run(`state.language='pt'`);clear('container-life-events-auto');run('renderLifeEventsAuto()');
ok('translated: Portuguese',/Pagamentos extras de dívidas/.test(text(els['container-life-events-auto'])));
run(`state.language='en'`);
// chart marks + tooltip
run(`globalThis.__lc=null;Chart=function(c,cfg){globalThis.__lc=cfg;this.destroy=()=>{}};state.debtPlan.autoEvents=true;state.whatIf=Object.assign({},WHATIF_NEUTRAL);
  document.getElementById('view-events');renderLifeEvents(calculateMetrics());`);
const tip=J(`(()=>{const c=__lc;const m=calculateMetrics();const ev=m.lifeEvents.find(e=>e.id===-2);const k=ev.year-${CY};return {tip:c.options.plugins.tooltip.callbacks.afterBody([{dataIndex:k}]),k}})()`);
ok('the chart names the automatic event in the tooltip of the year it starts',/Freed-up payments go to investments/.test((tip.tip||[]).join(' ')),(tip.tip||[]).join('|'));
// planner card
clear('dp-verdict');run('renderDebtPlanner(calculateMetrics())');
let vd=text(els['dp-verdict']);
ok('planner verdict: says how much is invested from which date once everything is cleared',/Once everything is cleared, .* a month stops going to debts and is invested from/.test(vd),vd.slice(0,150));
run(`state.debtPlan.autoEvents=false`);clear('dp-verdict');run('renderDebtPlanner(calculateMetrics())');
ok('...and that line disappears when the switch is off',!/invested from/.test(text(els['dp-verdict'])));
run(`updateDebtPlan('autoEvents',true)`);ok('the planner switch updates the profile and the events',J('state.debtPlan.autoEvents')===true&&J('calculateMetrics().lifeEvents.filter(e=>e.auto).length')===2);
run(`updateDebtPlan('extraMonthly','0')`);const yr=J('buildDebtPlanEvents(state)').length;run(`updateDebtPlan('extraMonthly','5000')`);
ok('changing the extra amount immediately changes the automatic events (1 event without extra, 2 with)',yr===1&&J('buildDebtPlanEvents(state).length')===2);
ok('planner text no longer claims the plan leaves the projection untouched',!/does not change the financial freedom projection/.test(run('I18N.en.dpAssumptions')));
// example profile
run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.language='en';localizeDemoState(state);`);
const dm=M();
ok('example profile: the payments (6,420) are in its cash flow, and it still ends with a positive surplus',dm.pay===6420&&dm.cash>0,`surplus ${dm.cash.toFixed(0)}`);
ok('example profile: no double counting — housing/transport no longer contain the mortgage and car payments',J('state.outflows.housing')===1500&&J('state.outflows.transport')===600);
// translations + language leaks
for(const lang of ['pt','es','en']){
  run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.language='${lang}';localizeDemoState(state);state.debtPlan.extraMonthly=500;updateUI();`);
  clear('container-life-events-auto','dp-verdict');run('renderLifeEventsAuto();renderDebtPlanner(calculateMetrics());');
  const all=text(els['container-life-events-auto'])+' '+text(els['dp-verdict'])+' '+els['lbl-cf-bucket-debt-sum'].innerText;
  ok(`[${lang}] new texts render with no leftover {placeholders} / NaN`,!/\{[a-z0-9]+\}|undefined|NaN|Infinity/.test(all));
}
run(`state.language='en';updateUI();`);clear('container-life-events-auto','dp-verdict');run('renderLifeEventsAuto();renderDebtPlanner(calculateMetrics());');
ok('[en] no Portuguese in the automatic events / planner verdict',!/ção|ões|Pagamento|dívida|liberad|quitação/.test(text(els['container-life-events-auto'])+text(els['dp-verdict'])));
process.exitCode=bad?1:0;
