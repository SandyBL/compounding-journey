// Debt payoff planner: engine vs textbook formulas, invariants on random debts, data model, UI, translations.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const D=(id,balance,ratePct,payment)=>({id,kind:'auto',name:null,balance,ratePct,payment,estimated:false,givenPayment:payment});
const sim=(debts,extra,strategy)=>J(`simulateDebtPayoff(${JSON.stringify(debts)},${extra},'${strategy}')`);
const near=(a,b,tol=1e-6)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b));
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ');
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  if('${country}'==='ES'){state.baseCurrency='EUR';state.displayCurrency='EUR';state.earners.forEach(e=>e.regime='Cuenta Ajena')}
  if('${country}'==='GL'){state.baseCurrency='USD';state.displayCurrency='USD';state.earners.forEach(e=>e.regime='Employee')}
  syncFormInputsFromState();`);
const clear=(...ids)=>ids.forEach(id=>{if(els[id]&&els[id].children)els[id].children.length=0});

// ================= 1. one loan: engine == closed-form amortization =================
for(const [B,rate,P] of [[10000,12,500],[25000,19.5,900],[3000,45,150],[80000,8,1200]]){
  const i=Math.pow(1+rate/100,1/12)-1;
  const n=Math.ceil(-Math.log(1-B*i/P)/Math.log(1+i)-1e-12);
  const balBeforeLast=B*Math.pow(1+i,n-1)-P*(Math.pow(1+i,n-1)-1)/i;   // balance right after payment n-1
  const last=balBeforeLast*(1+i);
  const interest=(n-1)*P+last-B;
  const r=sim([D('a',B,rate,P)],0,'minimum');
  ok(`single loan ${B} @ ${rate}% paying ${P}: ${n} months, interest ${interest.toFixed(2)} (textbook formula)`,r.months===n&&near(r.totalInterest,interest,1e-7)&&near(r.totalPaid,B+interest,1e-7),`engine ${r.months} / ${r.totalInterest&&r.totalInterest.toFixed(2)}`);
}
ok('rate convention: 12% a year compounds monthly to exactly 1.12',near(Math.pow(1+J('debtMonthlyRate(12)'),12),1.12,1e-12));
ok('0% loan: 1,200 at 100/month = 12 months, no interest',(()=>{const r=sim([D('a',1200,0,100)],0,'minimum');return r.months===12&&r.totalInterest===0&&r.totalPaid===1200})());
ok('a payment that does not cover the interest never pays off (minimums only)',sim([D('a',10000,60,50)],0,'minimum').months===null);
ok('...and reports no totals instead of a meaningless number',(()=>{const r=sim([D('a',10000,60,50)],0,'minimum');return r.totalInterest===null&&r.totalPaid===null})());
ok('50-year cap: a loan needing 722 months (1,000,000 @ 10%, paying 8,000) counts as "never"',sim([D('a',1e6,10,8000)],0,'minimum').months===null);
ok('...while one just inside the cap still finishes (paying 9,000 -> under 600 months)',(()=>{const r=sim([D('a',1e6,10,9000)],0,'minimum');return r.months!==null&&r.months<=600})());

// ================= 2. hand-worked example with 0% (every number checkable by eye) =================
const Z=[D('A',1000,0,100),D('B',500,0,50),D('C',3000,0,200)];
let mn=sim(Z,150,'minimum'),sn=sim(Z,150,'snowball'),av=sim(Z,150,'avalanche');
ok('minimums only: A and B take 10 months, C takes 15 -> 15 months, nothing rolls over',mn.months===15&&mn.payoffs.find(p=>p.id==='A').month===10&&mn.payoffs.find(p=>p.id==='B').month===10&&mn.payoffs.find(p=>p.id==='C').month===15);
ok('snowball: 4,500 owed at a constant 500/month budget = exactly 9 months, no interest',sn.months===9&&sn.totalInterest===0&&sn.totalPaid===4500);
ok('snowball clears the SMALLEST debt (B, 500) first: 200/month -> month 3',sn.payoffs.find(p=>p.id==='B').month===3&&sn.firstDoneMonth===3,JSON.stringify(sn.payoffs.map(p=>p.id+':'+p.month)));
ok('with equal (0%) rates, avalanche has nothing to prefer and behaves like snowball',JSON.stringify(av.payoffs)===JSON.stringify(sn.payoffs));
ok('the balance never rises and ends at 0',sn.series[0]===4500&&sn.series[9]===0&&sn.series.every((v,k,a)=>k===0||v<=a[k-1]+1e-9));

// ================= 3. avalanche vs snowball where they must differ =================
const M=[D('big-rate',1000,30,50),D('small-bal',400,5,30)];
mn=sim(M,100,'minimum');sn=sim(M,100,'snowball');av=sim(M,100,'avalanche');
ok('avalanche targets the highest rate, snowball the smallest balance -> different payoff order',av.payoffs.find(p=>p.id==='big-rate').month<sn.payoffs.find(p=>p.id==='big-rate').month&&sn.payoffs.find(p=>p.id==='small-bal').month<av.payoffs.find(p=>p.id==='small-bal').month,`av ${JSON.stringify(av.payoffs.map(p=>p.id+':'+p.month))} sn ${JSON.stringify(sn.payoffs.map(p=>p.id+':'+p.month))}`);
ok('avalanche pays LESS total interest than snowball, snowball clears its first debt SOONER',av.totalInterest<sn.totalInterest&&sn.firstDoneMonth<av.firstDoneMonth,`interest ${av.totalInterest.toFixed(2)} < ${sn.totalInterest.toFixed(2)}; first ${sn.firstDoneMonth} < ${av.firstDoneMonth}`);
ok('both beat paying only the minimums (interest and time)',sn.totalInterest<mn.totalInterest&&av.totalInterest<mn.totalInterest&&sn.months<=mn.months&&av.months<=mn.months);
ok('money is conserved: total paid = total owed + interest',near(av.totalPaid,1400+av.totalInterest)&&near(sn.totalPaid,1400+sn.totalInterest)&&near(mn.totalPaid,1400+mn.totalInterest));
ok('a rolled-over minimum is not lost: when a debt ends, the next one gets its payment',(()=>{const one=sim([D('a',100,0,100),D('b',1000,0,10)],0,'snowball');return one.payoffs.find(p=>p.id==='b').month===10&&sim([D('a',100,0,100),D('b',1000,0,10)],0,'minimum').payoffs.find(p=>p.id==='b').month===100})());
ok('no debts -> 0 months, 0 interest (no crash)',(()=>{const r=sim([],100,'avalanche');return r.months===0&&r.totalInterest===0})());
ok('extra money larger than all debts clears everything in month 1',(()=>{const r=sim(M,1e6,'avalanche');return r.months===1&&r.payoffs.every(p=>p.month===1)})());

// ================= 4. invariants on 300 random debt sets =================
let seed=777;const rnd=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296};
let viol=[];
for(let k=0;k<300;k++){
  const n=1+Math.floor(rnd()*5),debts=[];
  for(let j=0;j<n;j++){const B=Math.round(500+rnd()*rnd()*60000),rate=[0,0,3,8,15,24,40,80][Math.floor(rnd()*8)];
    const i=Math.pow(1+rate/100,1/12)-1;debts.push(D('d'+j,B,rate,Math.round(B*i+B*(0.005+rnd()*0.04))+1))}   // payment always covers interest
  const extra=[0,0,50,200,1000][Math.floor(rnd()*5)];
  const a=sim(debts,extra,'avalanche'),s=sim(debts,extra,'snowball'),m=sim(debts,extra,'minimum');
  const tot=debts.reduce((x,d)=>x+d.balance,0);
  const bad1=[];
  if(a.months===null||s.months===null||m.months===null)bad1.push('not finished');
  else{
    if(!near(a.totalPaid,tot+a.totalInterest,1e-7))bad1.push('avalanche money not conserved');
    if(!near(s.totalPaid,tot+s.totalInterest,1e-7))bad1.push('snowball money not conserved');
    if(a.totalInterest>s.totalInterest+1e-6)bad1.push(`avalanche interest ${a.totalInterest} > snowball ${s.totalInterest}`);
    if(a.totalInterest>m.totalInterest+1e-6||s.totalInterest>m.totalInterest+1e-6)bad1.push('rolling worse than minimums');
    if(a.months>m.months||s.months>m.months)bad1.push('rolling slower than minimums');
    if(a.series[a.months]!==0)bad1.push('does not end at zero');
    if(a.series.some(v=>v<-1e-9))bad1.push('negative balance');
    const more=sim(debts,extra+300,'avalanche');
    if(more.months>a.months||more.totalInterest>a.totalInterest+1e-6)bad1.push('more extra money made things worse');
    if(a.payoffs.some(p=>p.month===null))bad1.push('unpaid debt');
    if(Math.max.apply(null,a.payoffs.map(p=>p.month))!==a.months)bad1.push('months != last payoff');
  }
  if(bad1.length&&viol.length<3)viol.push(bad1.join('; ')+' '+JSON.stringify({debts,extra}).slice(0,150));
}
ok('300 random debt sets: money conserved, avalanche <= snowball <= minimums in interest, never slower, more extra never hurts',viol.length===0,viol[0]);

// ================= 5. building the list of debts from the profile =================
run(`state=migrateAndSanitizeState({country:'BR',baseCurrency:'BRL',debts:{parcelas:1200,revolving:5000,revolvingRatePct:100,revolvingMinPayment:400,autoLoans:0,autoLoansRatePct:20},realEstate:[{id:9,name:'Flat',currency:'BRL',marketValue:500000,mortgageDebt:200000,mortgageRatePct:9,mortgagePayment:2000}]})`);
let L=J('buildPlanDebts(state,false)');
ok('zero balances are skipped; mortgages are left out by default',L.length===2&&L[0].id==='installments'&&L[1].id==='revolving');
ok('installments are interest-free by definition; their missing payment is ESTIMATED (1 month of interest + 1% of balance)',L[0].ratePct===0&&L[0].estimated===true&&near(L[0].payment,12,1e-9));
ok('a payment the person entered is used as is and not flagged',L[1].estimated===false&&L[1].payment===400&&L[1].ratePct===100);
L=J('buildPlanDebts(state,true)');
ok('mortgages join when asked, with their own rate and payment',L.length===3&&L[2].id==='mortgage-9'&&L[2].ratePct===9&&L[2].payment===2000&&L[2].balance===200000&&L[2].name==='Flat');
run(`state.baseCurrency='BRL';state.displayCurrency='BRL';state.realEstate[0].currency='USD';`);
const fx=J(`convertToBase(1,'USD')`);
L=J('buildPlanDebts(state,true)');
ok('a property in another currency is converted to the base currency (balance and payment)',near(L[2].balance,200000*fx,1e-9)&&near(L[2].payment,2000*fx,1e-9),`x${fx}`);
ok('estimate function: balance x (monthly interest + 1%)',near(J('estimateDebtPayment(10000,12)'),10000*(J('debtMonthlyRate(12)')+0.01),1e-12));

// ================= 6. data model =================
const san=(o)=>J(`migrateAndSanitizeState(Object.assign({country:'BR'},${JSON.stringify(o)}))`);
let sn1=san({debts:{parcelasMinPayment:'300',revolvingMinPayment:-5,autoLoansMinPayment:1e30,revolvingRatePct:9999},debtPlan:{extraMonthly:'250',includeMortgages:'true',method:'snowball'},realEstate:[{id:1,mortgageRatePct:'7.5',mortgagePayment:-1}]});
ok('sanitizer: payments numeric, negative->0, capped; rate capped at 300; extra parsed',sn1.debts.parcelasMinPayment===300&&sn1.debts.revolvingMinPayment===0&&sn1.debts.autoLoansMinPayment<=1e13&&sn1.debts.revolvingRatePct===300&&sn1.debtPlan.extraMonthly===250);
ok('sanitizer: plan flags and method validated; property rate/payment cleaned',sn1.debtPlan.includeMortgages===true&&sn1.debtPlan.method==='snowball'&&sn1.realEstate[0].mortgageRatePct===7.5&&sn1.realEstate[0].mortgagePayment===0);
sn1=san({debtPlan:{method:'zzz',includeMortgages:'maybe',extraMonthly:'abc'}});
ok('sanitizer: junk method/flag/amount fall back to defaults',sn1.debtPlan.method==='avalanche'&&sn1.debtPlan.includeMortgages===false&&sn1.debtPlan.extraMonthly===0);
ok('old profiles (no planner fields) load with zero payments and the default plan',(()=>{const o=san({debts:{parcelas:100}});return o.debts.revolvingMinPayment===0&&o.debtPlan.method==='avalanche'&&o.realEstate.length===0})());
ok('hostile debtPlan (string / array) -> defaults; no prototype pollution',(()=>{const a=san({debtPlan:'x'}),b=san({debtPlan:[1]});run(`migrateAndSanitizeState(JSON.parse('{"country":"BR","debtPlan":{"__proto__":{"polluted":1}}}'))`);return a.debtPlan.method==='avalanche'&&b.debtPlan.extraMonthly===0&&run('({}).polluted')===undefined})());
load();const exp=run('JSON.stringify(buildExportPayload())');
const back=J(`(()=>{const p=JSON.parse(${JSON.stringify(exp)});return migrateAndSanitizeState(p.data||p)})()`);
ok('export -> import keeps payments, plan and mortgage terms',back.debts.autoLoansMinPayment===1150&&back.debts.revolvingMinPayment===520&&back.realEstate[0].mortgageRatePct===9.5&&back.realEstate[0].mortgagePayment===3900&&back.debtPlan.method==='avalanche');
ok('the example profile has payments, a revolving debt (so the methods differ) and a mortgage with terms',J('state.debts.revolving')===6500&&J('state.debts.revolvingMinPayment')===520&&J('state.realEstate[0].mortgagePayment')===3900);

// (7. how the plan feeds the cash flow and the projections is tested in debt-cashflow.test.js)

// ================= 8. the card on screen =================
load('BR','en');run(`updateDebtPlan('extraMonthly','0');updateDebtPlan('includeMortgages',false)`);
clear('dp-table','dp-compare','dp-verdict','dp-order');run('renderDebtPlanner(calculateMetrics())');
let tbl=text(els['dp-table']);
ok('table lists installments, revolving credit and the vehicle loan (no mortgage by default)',/Installment purchases/.test(tbl)&&/Revolving credit/.test(tbl)&&/Vehicle \/ loans/.test(tbl)&&!/Mortgage/.test(tbl));
ok('rates and payments are editable inputs bound to the profile (demo: 19.5% and 1,150)',/value="19\.5"/.test(els['dp-table'].innerHTML)&&/value="1150"/.test(els['dp-table'].innerHTML));
ok('installments show 0% as fixed text, no rate input',!/dp-installments-rate/.test(els['dp-table'].innerHTML)&&/0%/.test(tbl));
ok('a debt costing more than the portfolio earns is flagged',/costs more than the [\d.]+% your investments earn/.test(tbl));
run(`state.debts.autoLoansMinPayment=0;renderDebtPlanner(calculateMetrics())`);
ok('a payment left blank is shown as an estimate (with the placeholder amount)',/estimated: one month of interest \+ 1% of balance/.test(text(els['dp-table']))&&/placeholder="\d+"/.test(els['dp-table'].innerHTML));
run(`state.debts.autoLoansMinPayment=10;renderDebtPlanner(calculateMetrics())`);
ok('a payment below the month\'s interest is warned about',/does not cover the month's interest/.test(text(els['dp-table'])));
run(`state.debts.autoLoansMinPayment=1150;`);
let cmp=text(els['dp-compare']);
ok('comparison: three columns and the five result rows',/Minimums only/.test(cmp)&&/Snowball/.test(cmp)&&/Avalanche/.test(cmp)&&/Debt-free in/.test(cmp)&&/Total interest paid/.test(cmp)&&/Interest saved vs\. minimums only/.test(cmp)&&/First debt cleared in/.test(cmp)&&/Total paid/.test(cmp));
ok('the strategy with the least interest is starred',/★ least interest/.test(cmp));
run(`updateDebtPlan('extraMonthly','2000');clearAll=1`);clear('dp-verdict','dp-compare');run('renderDebtPlanner(calculateMetrics())');
let vd=text(els['dp-verdict']).replace(/\s+/g,' ');
ok('verdict explains avalanche saves interest, and how much sooner you are debt-free than with minimums',/Avalanche pays .* less interest than snowball/.test(vd)&&/debt-free .* sooner and saves/.test(vd),vd.slice(0,140));
ok('with extra money set, the "enter an extra amount" tip disappears',!/enter an extra monthly amount/.test(vd));
run(`updateDebtPlan('extraMonthly','0')`);clear('dp-verdict');run('renderDebtPlanner(calculateMetrics())');
ok('with no extra amount the tip appears',/enter an extra monthly amount/.test(text(els['dp-verdict'])));
// mortgages
run(`updateDebtPlan('includeMortgages',true)`);clear('dp-table');run('renderDebtPlanner(calculateMetrics())');
tbl=text(els['dp-table']);
ok('including mortgages adds the property row with its rate and payment',/Mortgage: Apartamento/.test(tbl)&&/value="9\.5"/.test(els['dp-table'].innerHTML)&&/value="3900"/.test(els['dp-table'].innerHTML));
run(`state.realEstate[0].name='<img src=x onerror=alert(1)>';renderDebtPlanner(calculateMetrics())`);
ok('a property name is HTML-escaped in the table',!/<img src=x/.test(els['dp-table'].innerHTML)&&/&lt;img/.test(els['dp-table'].innerHTML));
clear('dp-order');run('renderDebtPlanner(calculateMetrics())');
ok('...and in the payoff-order list',/&lt;img/.test(els['dp-order'].innerHTML)&&!/<img src=x/.test(els['dp-order'].innerHTML));
// editing
load();
run(`updateDebtRow('revolving','rate','22')`);
ok('editing the revolving rate changes the profile AND the field in the debts card above',J('state.debts.revolvingRatePct')===22&&String(els['input-debt-revolving-rate'].value)==='22');
run(`updateDebtRow('auto','rate','15');updateDebtRow('auto','pay','999');updateDebtRow('revolving','pay','333');updateDebtRow('installments','pay','444')`);
ok('editing rates and payments updates each debt',J('state.debts.autoLoansRatePct')===15&&J('state.debts.autoLoansMinPayment')===999&&J('state.debts.revolvingMinPayment')===333&&J('state.debts.parcelasMinPayment')===444);
run(`updateDebtRow('mortgage-1','rate','11');updateDebtRow('mortgage-1','pay','4100')`);
ok('editing a mortgage row updates that property',J('state.realEstate[0].mortgageRatePct')===11&&J('state.realEstate[0].mortgagePayment')===4100);
run(`updateDebtRow('auto','rate','-4');updateDebtRow('auto','rate','9999')`);
ok('rates are clamped to 0..300',J('state.debts.autoLoansRatePct')===300);
run(`updateDebtRow('mortgage-999','rate','5')`);ok('an unknown row is a no-op',true);
run(`updateDebtPlan('method','snowball')`);ok('the payoff-order method can be switched and is remembered',J('state.debtPlan.method')==='snowball');
run(`updateDebtPlan('method','bogus')`);ok('...an invalid method falls back to avalanche',J('state.debtPlan.method')==='avalanche');
// surplus button
load();const surplus=Math.floor(J('calculateMetrics().cashDelta'));
clear('dp-table');run('renderDebtPlanner(calculateMetrics())');
ok('the demo has a monthly surplus (after its debt payments), so the surplus button is offered with the amount',surplus>800&&/Use my monthly surplus/.test(els['btn-dp-surplus'].innerText)&&els['btn-dp-surplus'].innerText.includes(String(surplus)),els['btn-dp-surplus'].innerText+' | surplus='+surplus);
run('useSurplusForDebts()');
ok('...and fills the extra amount with the floor of the surplus',J('state.debtPlan.extraMonthly')===surplus&&String(els['input-dp-extra'].value)===String(surplus));
// order list + chart
load('BR','en');run(`updateDebtPlan('extraMonthly','1500');updateDebtPlan('method','avalanche')`);
clear('dp-order');run('renderDebtPlanner(calculateMetrics())');
const ord=text(els['dp-order']).replace(/\s+/g,' ');
ok('payoff order lists each debt with the month it is cleared and the interest it cost',/1\..*2\..*3\./.test(ord)&&/cleared in/.test(ord)&&/interest paid/.test(ord),ord.slice(0,120));
run(`globalThis.__dc=null;Chart=function(c,cfg){globalThis.__dc=cfg;this.destroy=()=>{}};renderDebtPlanner(calculateMetrics());`);
const cc=J(`(()=>{const c=__dc;return {n:c.data.datasets.length,names:c.data.datasets.map(d=>d.label),len:c.data.labels.length,lens:c.data.datasets.map(d=>d.data.length),first:c.data.datasets.map(d=>d.data[0]),last:c.data.datasets.map(d=>d.data[d.data.length-1]),tick0:c.options.scales.x.ticks.callback(0,0),tick12:c.options.scales.x.ticks.callback(12,12),tick5:c.options.scales.x.ticks.callback(5,5)}})()`);
ok('chart: three series starting at the same total debt and ending at 0',cc.n===3&&cc.lens.every(n=>n===cc.len)&&new Set(cc.first).size===1&&cc.first[0]>0&&cc.last[1]===0&&cc.last[2]===0);
ok('chart: x axis labels only every 12 months',/^0 /.test(cc.tick0)&&/^1 /.test(cc.tick12)&&cc.tick5==='');
// empty states
run(`state=migrateAndSanitizeState({country:'BR',language:'en',debts:{}});state.language='en'`);clear('dp-empty');run('renderDebtPlanner(calculateMetrics())');
ok('no debts: a friendly message replaces the planner',/You have no debts to plan/.test(els['dp-empty'].innerText));
run(`state=migrateAndSanitizeState({country:'BR',language:'en',realEstate:[{id:1,name:'Flat',currency:'BRL',marketValue:1e6,mortgageDebt:3e5}]});state.language='en'`);run('renderDebtPlanner(calculateMetrics())');
ok('only a mortgage: the message tells you to tick "Include mortgages"',/only have a mortgage/.test(els['dp-empty'].innerText)&&/Include mortgages/.test(els['dp-empty'].innerText));
// ================= 9. translations, nothing broken =================
for(const lang of ['pt','es','en']){
  load('BR',lang);run(`updateDebtPlan('extraMonthly','1500');updateDebtPlan('includeMortgages',true)`);
  clear('dp-table','dp-compare','dp-verdict','dp-order');run('renderDebtPlanner(calculateMetrics())');
  const all=text(els['dp-table'])+text(els['dp-compare'])+text(els['dp-verdict'])+text(els['dp-order']);
  const w=lang==='en'?/Snowball/:lang==='es'?/Bola de nieve/:/Bola de neve/;
  ok(`[${lang}] planner renders in the language; no leftover placeholders / NaN`,w.test(all)&&!/\{[a-z0-9]+\}|undefined|NaN|Infinity/.test(all));
}
load('BR','en');run(`updateDebtPlan('extraMonthly','1500')`);clear('dp-table','dp-compare','dp-verdict','dp-order');run('renderDebtPlanner(calculateMetrics())');
ok('[en] no Portuguese on the planner',!/ção|ões|Dívida|Saldo|Pagamento|Juros|Avalanche pagando/.test(text(els['dp-table'])+text(els['dp-compare'])+text(els['dp-verdict'])+text(els['dp-order'])));
for(const c of ['ES','GL']){load(c,'en');run(`updateDebtPlan('extraMonthly','300')`);clear('dp-compare');run('renderDebtPlanner(calculateMetrics())');ok(`[${c}] planner works for this residence (no NaN)`,!/NaN|Infinity|undefined/.test(text(els['dp-compare'])));}
const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('the card sits in the Balance Sheet tab, after the debts card',page.indexOf('id="card-debt-planner"')>page.indexOf('id="lbl-debt-interest-cost"')&&page.indexOf('id="card-debt-planner"')<page.indexOf('id="view-cashflow"'));
process.exitCode=bad?1:0;
