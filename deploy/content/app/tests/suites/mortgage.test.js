// Mortgage schedule + prepay-vs-invest: engine vs textbook formulas and exact identities, then data, UI, translations.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const near=(a,b,tol=1e-6)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b));
const am=(B,r,P,o)=>J(`buildAmortization(${B},${r},${P},${JSON.stringify(o||{})})`);
const cmp=(o)=>J(`(()=>{const c=comparePrepayInvest(${JSON.stringify(o)});delete c.prepay.series;delete c.prepay.owedSeries;delete c.invest.series;delete c.invest.owedSeries;return c})()`);
const mrate=(pct)=>Math.pow(1+pct/100,1/12)-1;

// ================= 1. schedule == textbook annuity formulas =================
for(const [B,rate,P] of [[240000,9.5,3900],[300000,7,2100],[150000,12,1800],[400000,4.5,2000]]){
  const i=mrate(rate),n=Math.ceil(-Math.log(1-B*i/P)/Math.log(1+i)-1e-12);
  const balBeforeLast=B*Math.pow(1+i,n-1)-P*(Math.pow(1+i,n-1)-1)/i, last=balBeforeLast*(1+i);
  const interest=(n-1)*P+last-B, a=am(B,rate,P);
  ok(`${B} @ ${rate}% paying ${P}: ${n} months, ${interest.toFixed(2)} interest (closed form)`,a.months===n&&near(a.totalInterest,interest,1e-7)&&near(a.totalPaid,B+interest,1e-7));
  ok('  ...first payment splits into interest = balance x monthly rate and the rest principal; balance ends at exactly 0',near(a.rows[0].interest,B*i,1e-9)&&near(a.rows[0].principal,P-B*i,1e-9)&&a.rows[a.rows.length-1].balance===0);
  ok('  ...the principal repaid adds up to the loan; interest = total paid - loan',near(a.rows.reduce((s,r)=>s+r.principal,0),B,1e-9)&&near(a.totalInterest,a.rows.reduce((s,r)=>s+r.interest,0),1e-9));
}
ok('0% mortgage: 120,000 at 1,000/month = 120 months, no interest',(()=>{const a=am(120000,0,1000);return a.months===120&&a.totalInterest===0})());
ok('a payment below the month\'s interest never finishes: months/totals are null, capped at 600 rows',(()=>{const a=am(500000,9,3000);return a.months===null&&a.totalInterest===null&&a.rows.length===600&&a.rows[599].balance>500000})());
ok('zero balance -> nothing to schedule',(()=>{const a=am(0,9,1000);return a.months===0&&a.rows.length===0&&a.totalInterest===0})());
// annuity payment for a given remaining term amortizes in exactly that many months
for(const [B,r,yrs] of [[250000,0,20],[250000,5,25],[180000,9.5,15],[90000,12,10]]){
  const P=J(`annuityPayment(${B},${r},${yrs*12})`),a=am(B,r,P);
  ok(`payment for ${yrs} years @ ${r}% (${P.toFixed(2)}) clears the loan in exactly ${yrs*12} months`,a.months===yrs*12&&near(a.rows[a.rows.length-2].payment,a.rows[a.rows.length-1].payment,1e-6));
}
ok('annuityPayment edge cases: zero term / zero balance -> 0',J('annuityPayment(1000,5,0)')===0&&J('annuityPayment(0,5,120)')===0);
// extra payments / lump sums
const b0=am(240000,9.5,3900),bx=am(240000,9.5,3900,{extraMonthly:1000}),bl=am(240000,9.5,3900,{lumpSum:50000});
ok('an extra 1,000/month shortens the loan and cuts the interest',bx.months<b0.months&&bx.totalInterest<b0.totalInterest,`${b0.months} -> ${bx.months} months`);
ok('a lump sum of 50,000 reduces the balance at once (month-1 interest is on 190,000) and saves interest',near(bl.rows[0].interest,190000*mrate(9.5),1e-9)&&bl.months<b0.months&&bl.totalInterest<b0.totalInterest);
ok('a lump sum >= the balance clears the mortgage immediately (0 months); only the balance is applied',(()=>{const a=am(240000,9.5,3900,{lumpSum:999999});return a.months===0&&a.lumpApplied===240000})());
ok('money paid = loan + interest for every variant',[b0,bx,bl].every(a=>near(a.totalPaid,240000+a.totalInterest,1e-9)));
// yearly summary
const yrs=J(`summarizeAmortizationByYear(buildAmortization(240000,9.5,2300).rows)`),b0y=am(240000,9.5,2300);
ok('yearly summary: ceil(months/12) years; sums match; year-end balances fall',yrs.length===Math.ceil(b0y.months/12)&&near(yrs.reduce((s,y)=>s+y.interest,0),b0y.totalInterest,1e-9)&&near(yrs.reduce((s,y)=>s+y.principal,0),240000,1e-9)&&yrs.every((y,k)=>k===0||y.balance<yrs[k-1].balance)&&yrs[yrs.length-1].balance===0);
ok('...in the early years interest dominates, in the late years principal does (the shape of every mortgage)',yrs[0].interest>yrs[0].principal&&yrs[yrs.length-1].principal>yrs[yrs.length-1].interest);

// ================= 2. resolving the mortgage terms =================
run(`state=migrateAndSanitizeState({country:'BR',baseCurrency:'BRL',realEstate:[{id:1,name:'A',currency:'BRL',marketValue:9e5,mortgageDebt:200000,mortgageRatePct:8,mortgagePayment:1800,mortgageTermYears:30},{id:2,name:'B',currency:'BRL',marketValue:9e5,mortgageDebt:200000,mortgageRatePct:8,mortgageTermYears:20},{id:3,name:'C',currency:'BRL',marketValue:9e5,mortgageDebt:200000,mortgageRatePct:8},{id:4,name:'D',currency:'BRL',marketValue:9e5,mortgageDebt:0,mortgageRatePct:8}]})`);
const R=(k)=>J(`resolveMortgageTerms(state.realEstate[${k}],state)`);
ok('payment entered wins (even when a term is also given)',R(0).source==='entered'&&R(0).payment===1800&&R(0).givenPayment===1800);
ok('no payment but a remaining term: the payment is the annuity for that term (marked "term", not "estimated")',R(1).source==='term'&&near(R(1).payment,J('annuityPayment(200000,8,240)'),1e-9)&&R(1).givenPayment===0);
ok('neither: an estimate (one month of interest + 1% of balance), marked "estimated"',R(2).source==='estimated'&&near(R(2).payment,J('estimateDebtPayment(200000,8)'),1e-9));
ok('the debt planner uses the same resolution (term-derived payment is not flagged as estimated)',(()=>{const d=J('buildPlanDebts(state,true)');const b=d.find(x=>x.id==='mortgage-2');return b.derivedFromTerm===true&&b.estimated===false&&near(b.payment,R(1).payment,1e-9)&&!d.some(x=>x.id==='mortgage-4')})());
ok('...and so does the cash flow: the term-derived payment is what the month pays',(()=>{run(`state.debts={parcelas:0,revolving:0,autoLoans:0};state.realEstate=state.realEstate.slice(1,2);state.debtPlan.autoEvents=false;`);return near(J('calculateMetrics().debtPaymentsMonthly'),R(0).payment,1e-9)&&J('calculateMetrics().debtPaymentsEstimatedCount')===0})());
run(`state=migrateAndSanitizeState({country:'BR',baseCurrency:'BRL',realEstate:[{id:1,name:'US flat',currency:'USD',marketValue:9e5,mortgageDebt:100000,mortgageRatePct:6,mortgagePayment:800}]})`);
const fx=J(`convertToBase(1,'USD')`);
ok('a property in another currency: balance and payment are converted to the base currency',near(R(0).balance,100000*fx,1e-9)&&near(R(0).payment,800*fx,1e-9),`x${fx}`);

// ================= 3. prepay vs invest =================
const base={balance:240000,ratePct:9.5,payment:3900,extraMonthly:1000,lumpSum:0,returnPct:0,taxPct:0,horizonMonths:0,inflationPct:0};
let c=cmp(Object.assign({},base,{returnPct:9.5}));
ok('IDENTITY: if investments earn exactly the mortgage rate, prepaying and investing end with the SAME wealth',near(c.prepay.wealth,c.invest.wealth,1e-9),`${c.prepay.wealth.toFixed(4)} vs ${c.invest.wealth.toFixed(4)}`);
c=cmp(Object.assign({},base,{returnPct:6}));ok('investing earns LESS than the mortgage costs (6% < 9.5%) -> prepaying wins',c.prepay.wealth>c.invest.wealth&&c.difference<0);
c=cmp(Object.assign({},base,{returnPct:13}));ok('investing earns MORE (13% > 9.5%) -> investing wins',c.invest.wealth>c.prepay.wealth&&c.difference>0);
ok('the gap grows steadily with the return (7 < 9.5 < 12): prepay wins, tie, invest wins',(()=>{const d=[7,9.5,12].map(r=>cmp(Object.assign({},base,{returnPct:r})).difference);return d[0]<-1&&Math.abs(d[1])<1e-6&&d[2]>1&&cmp(Object.assign({},base,{returnPct:8})).difference<d[0]*0+cmp(Object.assign({},base,{returnPct:11})).difference})());
c=cmp(Object.assign({},base,{returnPct:10,taxPct:20}));ok('tax on gains lowers the return actually earned: 10% at 20% tax = 8% net',near(c.returnNetPct,8,1e-12));
ok('...100% tax = 0% net return: investing just accumulates the money',(()=>{const d=cmp(Object.assign({},base,{returnPct:15,taxPct:100}));return d.returnNetPct===0&&near(d.invest.gains,0,1e-9)})());
ok('with no extra money and no lump sum there is nothing to compare: both end equal',(()=>{const d=cmp(Object.assign({},base,{extraMonthly:0,returnPct:15}));return near(d.prepay.wealth,d.invest.wealth,1e-9)})());
// accounting identity at 0% return: the wealth gap is exactly the interest saved
{
  let seed=99,rnd=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296},worst=0,worstEq=0,fails=[];
  for(let k=0;k<300;k++){
    const B=Math.round(50000+rnd()*450000),rate=[0,3,6,9,12,18][Math.floor(rnd()*6)],i=mrate(rate);
    const P=Math.round(B*i+B*(0.002+rnd()*0.01))+50,extra=[0,0,200,1500,6000][Math.floor(rnd()*5)],lump=[0,0,10000,B*0.4,B*1.5][Math.floor(rnd()*5)];
    const H=[0,0,60,120,600][Math.floor(rnd()*5)];
    const o={balance:B,ratePct:rate,payment:P,extraMonthly:extra,lumpSum:lump,taxPct:0,horizonMonths:H,inflationPct:0};
    const zero=cmp(Object.assign({},o,{returnPct:0}));
    const gap=(zero.invest.wealth-zero.prepay.wealth)-(zero.prepay.interest-zero.invest.interest);
    worst=Math.max(worst,Math.abs(gap));
    const eq=cmp(Object.assign({},o,{returnPct:rate}));
    worstEq=Math.max(worstEq,Math.abs(eq.prepay.wealth-eq.invest.wealth)/Math.max(1,Math.abs(eq.prepay.wealth)));
    if(Math.abs(gap)>1e-4&&fails.length<2)fails.push(JSON.stringify(o));
  }
  ok('300 random cases at 0% return: wealth(invest) - wealth(prepay) = interest saved by prepaying, to the cent',worst<1e-4,'worst '+worst.toExponential(2));
  ok('300 random cases (incl. lump sums larger than the loan, short horizons): equal return => equal wealth',worstEq<1e-9,'worst rel. '+worstEq.toExponential(2));
}
// horizon, lump sum > balance, never-ending mortgage
c=cmp(Object.assign({},base,{returnPct:9.5,horizonMonths:24}));
ok('a horizon shorter than the loan: both still owe money and net wealth = investments - debt',c.horizonMonths===24&&c.invest.owed>0&&near(c.invest.wealth,c.invest.investments-c.invest.owed,1e-9));
c=cmp(Object.assign({},base,{horizonMonths:0}));ok('horizon 0 = until the mortgage would end',c.horizonMonths===am(240000,9.5,3900).months);
c=cmp(Object.assign({},base,{lumpSum:999999,extraMonthly:0,returnPct:5}));
ok('a lump sum larger than the loan: prepay clears it now and INVESTS the excess',c.prepay.freeMonth===0&&c.prepay.contributed>=999999-240000-1e-6&&c.prepay.investments>0);
c=cmp({balance:500000,ratePct:9,payment:3000,extraMonthly:500,lumpSum:0,returnPct:5,taxPct:0,horizonMonths:0,inflationPct:0});
ok('a mortgage whose payment does not cover interest: the baseline never ends, the horizon defaults to 30 years',c.baseline.months===null&&c.horizonMonths===360);
c=cmp(Object.assign({},base,{returnPct:9.5,inflationPct:4}));
ok('"in today\'s money" = nominal wealth / (1 + inflation)^years',near(c.prepay.wealthReal,c.prepay.wealth/Math.pow(1.04,c.horizonMonths/12),1e-12));
c=cmp(Object.assign({},base,{returnPct:9.5}));
ok('prepaying: mortgage-free sooner, less interest than paying only the scheduled payment',c.prepay.freeMonth<c.baseline.months&&c.prepay.interest<c.baseline.interestToHorizon);
ok('investing: the mortgage ends when scheduled, interest is the same as paying only the schedule',c.invest.freeMonth===c.baseline.months&&near(c.invest.interest,c.baseline.interestToHorizon,1e-9));
ok('the series for the chart start at today\'s wealth and end at the reported wealth',(()=>{const r=J(`(()=>{const c=comparePrepayInvest(${JSON.stringify(Object.assign({},base,{returnPct:8,lumpSum:20000}))});return {p0:c.prepay.series[0],i0:c.invest.series[0],pe:c.prepay.series[c.prepay.series.length-1],ie:c.invest.series[c.invest.series.length-1],pw:c.prepay.wealth,iw:c.invest.wealth,n:c.prepay.series.length,H:c.horizonMonths}})()`);return near(r.pe,r.pw,1e-12)&&near(r.ie,r.iw,1e-12)&&r.n===r.H+1&&near(r.p0,-(240000-20000),1e-9)&&near(r.i0,20000-240000,1e-9)})());

// ================= 3b. regression: the phantom extra month (float residue) also fixed in the debt planner =================
for(const [B,r,n] of [[25000,12,24],[80000,7.5,60],[9000,0,18],[15000,19.5,36]]){
  const P=J(`annuityPayment(${B},${r},${n})`);
  const one=J(`simulateDebtPayoff([{id:'a',kind:'auto',name:null,balance:${B},ratePct:${r},payment:${P},estimated:false,givenPayment:${P}}],0,'minimum')`);
  ok(`debt planner: a loan paid with its exact annuity payment (${B} @ ${r}%, ${n} months) ends in ${n} months, not ${n+1}`,one.months===n&&near(one.totalPaid,B+one.totalInterest,1e-9),String(one.months));
}

// ================= 4. data model =================
const san=(o)=>J(`migrateAndSanitizeState(Object.assign({country:'BR'},${JSON.stringify(o)}))`);
let d=san({realEstate:[{id:7,name:'X',mortgageDebt:1e5,mortgageTermYears:'25.5'},{id:8,name:'Y',mortgageDebt:1e5,mortgageTermYears:999},{id:9,name:'Z',mortgageDebt:1e5,mortgageTermYears:-4}],
  mortgagePlan:{propertyId:8,extraMonthly:'750',lumpSum:-5,returnPct:'7.5',taxPct:999,horizonYears:'99.7'}});
ok('sanitizer: remaining term parsed and clamped to 0..60 years',d.realEstate[0].mortgageTermYears===25.5&&d.realEstate[1].mortgageTermYears===60&&d.realEstate[2].mortgageTermYears===0);
ok('sanitizer: plan amounts parsed, negatives -> 0, tax capped at 60, horizon rounded and capped at 50, property kept if it exists',d.mortgagePlan.propertyId===8&&d.mortgagePlan.extraMonthly===750&&d.mortgagePlan.lumpSum===0&&d.mortgagePlan.returnPct===7.5&&d.mortgagePlan.taxPct===60&&d.mortgagePlan.horizonYears===50);
ok('sanitizer: a plan pointing at a property that does not exist falls back to none',san({realEstate:[{id:7,name:'X',mortgageDebt:1e5}],mortgagePlan:{propertyId:12345}}).mortgagePlan.propertyId===null);
ok('sanitizer: an empty / junk return means "use the portfolio yield" (null); 0 is a real value',san({mortgagePlan:{returnPct:''}}).mortgagePlan.returnPct===null&&san({mortgagePlan:{returnPct:'abc'}}).mortgagePlan.returnPct===null&&san({mortgagePlan:{returnPct:0}}).mortgagePlan.returnPct===0);
ok('sanitizer: hostile plan (string / array) -> defaults; no prototype pollution',(()=>{const a=san({mortgagePlan:'x'}),b=san({mortgagePlan:[1]});run(`migrateAndSanitizeState(JSON.parse('{"country":"BR","mortgagePlan":{"__proto__":{"polluted":1}}}'))`);return a.mortgagePlan.extraMonthly===0&&b.mortgagePlan.propertyId===null&&run('({}).polluted')===undefined})());
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  if('${country}'==='ES'){state.baseCurrency='EUR';state.displayCurrency='EUR';state.earners.forEach(e=>e.regime='Cuenta Ajena')}
  if('${country}'==='GL'){state.baseCurrency='USD';state.displayCurrency='USD';state.earners.forEach(e=>e.regime='Employee')}
  syncFormInputsFromState();`);
load();run(`state.realEstate[0].mortgageTermYears=18;state.mortgagePlan=Object.assign({},state.mortgagePlan,{extraMonthly:500,lumpSum:20000,returnPct:6,taxPct:15,horizonYears:12,propertyId:1})`);
const back=J(`(()=>{const p=JSON.parse(${JSON.stringify(run('JSON.stringify(buildExportPayload())'))});return migrateAndSanitizeState(p.data||p)})()`);
ok('export -> import keeps the term and the whole prepay/invest setup',back.realEstate[0].mortgageTermYears===18&&back.mortgagePlan.extraMonthly===500&&back.mortgagePlan.lumpSum===20000&&back.mortgagePlan.returnPct===6&&back.mortgagePlan.taxPct===15&&back.mortgagePlan.horizonYears===12&&back.mortgagePlan.propertyId===1);
load();
ok('example profile: a 400,000 mortgage at 9.5% paying 3,900 (about 17 years, so the schedule has a realistic shape)',J('state.realEstate[0].mortgageDebt')===400000&&J('state.realEstate[0].mortgagePayment')===3900&&(m=>m>190&&m<210)(am(400000,9.5,3900).months));

// ================= 5. the card =================
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const clear=(...ids)=>ids.forEach(id=>{if(els[id]&&els[id].children)els[id].children.length=0});
const render=()=>{clear('ms-terms','ms-summary','ms-schedule','ms-compare','ms-verdict','ms-warn');run('renderMortgageCard(calculateMetrics())')};
load();run(`state.mortgagePlan=Object.assign({},state.mortgagePlan,{extraMonthly:0,lumpSum:0})`);render();
const t0=J(`resolveMortgageTerms(state.realEstate[0],state)`),sched=am(t0.balance,t0.ratePct,t0.payment);
const sum=text(els['ms-summary']);
ok('summary: balance, payment, payoff time/date, total interest and the interest share of payment #1',/Balance owed/.test(sum)&&/Payment/.test(sum)&&/Paid off in/.test(sum)&&/Interest until paid off/.test(sum)&&sum.includes(J(`fmt(${t0.balance})`))&&sum.includes(J(`dpMonthsText(${sched.months})`))&&sum.includes(J(`fmt(${sched.totalInterest})`)),sum.slice(0,150));
const share=Math.min(100,t0.balance*(Math.pow(1.095,1/12)-1)/t0.payment*100).toFixed(0);
ok(`...payment #1 is ${share}% interest`,sum.includes(share+'%'));
const rows=(els['ms-schedule'].innerHTML.match(/<tr class="border-t/g)||[]).length;
ok('year-by-year table: one row per year (ceil(months/12)), starting this calendar year',rows===Math.ceil(sched.months/12)&&els['ms-schedule'].innerHTML.includes('>'+new Date().getFullYear()+'<'),rows+' rows for '+sched.months+' months');
ok('...with the payment, interest, principal and the year-end balance columns',/Paid/.test(text(els['ms-schedule']))&&/Principal/.test(text(els['ms-schedule']))&&/Balance at year end/.test(text(els['ms-schedule'])));
const terms=els['ms-terms'].innerHTML;
ok('terms inputs are bound to the property (rate 9.5, payment 3900) and say the payment was entered',/value="9\.5"/.test(terms)&&/value="3900"/.test(terms)&&/entered by you/.test(text(els['ms-terms'])));
// the three sources of the payment
run(`state.realEstate[0].mortgagePayment=0;state.realEstate[0].mortgageTermYears=20`);render();
const annu=Math.round(J('annuityPayment(400000,9.5,240)'));
ok('no payment but a remaining term: the card shows the annuity payment (placeholder) marked "calculated from the remaining term"',new RegExp(`placeholder="${annu}"`).test(els['ms-terms'].innerHTML)&&/calculated from the remaining term/.test(text(els['ms-terms'])),String(annu));
ok('...and the schedule ends after exactly 20 years (240 months)',J(`dpMonthsText(240)`)===text(els['ms-summary']).match(/20 years/)[0]);
run(`state.realEstate[0].mortgageTermYears=0`);render();
ok('neither payment nor term: the payment is an ESTIMATE and the card says so',/estimated: enter the payment or the remaining term/.test(text(els['ms-terms'])));
run(`state.realEstate[0].mortgageRatePct=0;state.realEstate[0].mortgagePayment=3000`);render();
ok('a 0% rate is flagged (interest would not show up)',/enter your real mortgage rate/.test(text(els['ms-terms'])));
run(`state.realEstate[0].mortgageRatePct=9;state.realEstate[0].mortgagePayment=1000`);render();
ok('a payment below the month\'s interest shows the "never ends" warning and no payoff date',/does not even cover the month(&#0?39;|')s interest/.test(text(els['ms-warn']))&&/Not paid off in 50 years/.test(text(els['ms-summary'])));
// a property in another currency: the payment field is in THAT currency, so its hint must be too
run(`state=migrateAndSanitizeState({country:'BR',language:'en',baseCurrency:'BRL',realEstate:[{id:1,name:'US flat',currency:'USD',marketValue:9e5,mortgageDebt:100000,mortgageRatePct:6,mortgageTermYears:20}]});state.language='en';`);render();
const usdPay=Math.round(J('annuityPayment(100000,6,240)'));
ok('foreign-currency property: the payment hint is in the property\'s currency (USD), not the base currency',new RegExp(`placeholder="${usdPay}"`).test(els['ms-terms'].innerHTML)&&/\(USD\)/.test(text(els['ms-terms'])),String(usdPay));
// editing
load();
run(`updateMortgageTerms('rate','7.25')`);run(`updateMortgageTerms('pay','2750')`);run(`updateMortgageTerms('term','22.5')`);
ok('editing the terms updates the selected property',J('state.realEstate[0].mortgageRatePct')===7.25&&J('state.realEstate[0].mortgagePayment')===2750&&J('state.realEstate[0].mortgageTermYears')===22.5);
run(`updateMortgageTerms('rate','9999');updateMortgageTerms('term','999');updateMortgageTerms('pay','-3')`);
ok('rate clamps at 300, term at 60 years, a negative payment becomes 0',J('state.realEstate[0].mortgageRatePct')===300&&J('state.realEstate[0].mortgageTermYears')===60&&J('state.realEstate[0].mortgagePayment')===0);
run(`state.realEstate=[];updateMortgageTerms('rate','5')`);ok('editing with no mortgage is a no-op',true);
// empty state
load();run(`state.realEstate.forEach(r=>r.mortgageDebt=0)`);run('renderMortgageCard(calculateMetrics())');
ok('no mortgage: a message explains what to do',/No property has a mortgage/.test(els['ms-empty'].innerText));
// two mortgages
run(`state=migrateAndSanitizeState({country:'BR',language:'en',baseCurrency:'BRL',realEstate:[{id:1,name:'<b>Home</b>',currency:'BRL',marketValue:9e5,mortgageDebt:300000,mortgageRatePct:8,mortgagePayment:2500},{id:2,name:'Beach flat',currency:'BRL',marketValue:5e5,mortgageDebt:120000,mortgageRatePct:11,mortgagePayment:1500}]});state.language='en';`);
run(`updateMortgagePlan('propertyId','2')`);render();
ok('with two mortgages the selector lists both (names escaped) and the card follows the chosen one',/Beach flat/.test(els['select-mortgage-property'].innerHTML)&&/&lt;b&gt;Home/.test(els['select-mortgage-property'].innerHTML)&&!/<b>Home/.test(els['select-mortgage-property'].innerHTML)&&/value="11"/.test(els['ms-terms'].innerHTML)&&text(els['ms-summary']).includes(J('fmt(120000)')));
run(`updateMortgagePlan('propertyId','1')`);render();ok('...switching the property switches every number',/value="8"/.test(els['ms-terms'].innerHTML)&&text(els['ms-summary']).includes(J('fmt(300000)')));
run(`updateMortgagePlan('propertyId','999')`);render();ok('...an id that does not exist falls back to the first mortgage',text(els['ms-summary']).includes(J('fmt(300000)')));

// ================= 6. prepay vs invest on screen =================
load();
const setPlan=(o)=>run(`state.mortgagePlan=Object.assign({},state.mortgagePlan,${JSON.stringify(o)})`);
setPlan({extraMonthly:0,lumpSum:0,returnPct:null,taxPct:0,horizonYears:0});render();
ok('no extra money and no lump sum: only an invitation to enter one',/Enter an extra monthly amount or a one-time amount/.test(text(els['ms-verdict'])));
setPlan({extraMonthly:1500,returnPct:5,taxPct:0});render();
let vd=text(els['ms-verdict']);
ok('return below the mortgage rate (5% < 9.5%): "Prepaying wins by ..." with the horizon',/Prepaying wins by .* over \d+ years?/.test(vd),vd.slice(0,120));
ok('...it states the guaranteed rate vs the net return in this scenario',/guaranteed, tax-free 9\.5% a year/.test(vd)&&/scenario: 5\.0% a year/.test(vd));
ok('...and the caveats (emergency reserve, early-repayment fee, tax deduction, and the Debt planner tip)',/emergency reserve/.test(vd)&&/early-repayment fee/.test(vd)&&/Include mortgages/.test(vd));
setPlan({returnPct:14});render();vd=text(els['ms-verdict']);
ok('return above the mortgage rate (14% > 9.5%): "Investing wins by ..." and the not-guaranteed reminder',/Investing wins by/.test(vd)&&/not guaranteed/.test(vd));
setPlan({returnPct:9.5});render();ok('return equal to the mortgage rate: "practically tied" (the identity, seen on screen)',/Practically tied/.test(text(els['ms-verdict'])));
setPlan({returnPct:14,taxPct:40});render();
ok('tax turns 14% into 8.4% net, which flips the verdict back to prepaying',/scenario: 8\.4% a year/.test(text(els['ms-verdict']))&&/Prepaying wins/.test(text(els['ms-verdict'])));
setPlan({returnPct:null,taxPct:0});render();
const pY=J('calculateMetrics().weightedPortfolioYield');
ok('return left blank = the portfolio\'s own yield (shown in the input hint and used in the verdict)',els['input-ms-return'].placeholder.includes(pY.toFixed(1))&&new RegExp(`scenario: ${pY.toFixed(1)}% a year`).test(text(els['ms-verdict'])),els['input-ms-return'].placeholder);
// the table equals the engine
setPlan({returnPct:5,taxPct:0,extraMonthly:1500,lumpSum:30000,horizonYears:0});render();
const eng=cmp({balance:t0.balance,ratePct:9.5,payment:3900,extraMonthly:1500,lumpSum:30000,returnPct:5,taxPct:0,horizonMonths:0,inflationPct:J('state.inflationRate')});
const tb=text(els['ms-compare']);
ok('comparison table: three columns and every row',/Scheduled payments only/.test(tb)&&/Prepay/.test(tb)&&/Invest/.test(tb)&&/Mortgage-free in/.test(tb)&&/Mortgage interest paid/.test(tb)&&/Investments at the horizon/.test(tb)&&/Still owed at the horizon/.test(tb)&&/Net wealth at the horizon/.test(tb)&&/In today's money/.test(tb));
ok('...the net wealth shown for each strategy is the engine\'s number',tb.includes(J(`fmt(${eng.prepay.wealth})`))&&tb.includes(J(`fmt(${eng.invest.wealth})`)));
ok('...the better strategy is starred (prepay, at 5%)',/Prepay ★/.test(tb)&&!/Invest ★/.test(tb));
setPlan({horizonYears:5});render();
ok('a 5-year horizon: both strategies still owe money at the end and the table says how much',(()=>{const e=cmp({balance:t0.balance,ratePct:9.5,payment:3900,extraMonthly:1500,lumpSum:30000,returnPct:5,taxPct:0,horizonMonths:60,inflationPct:J('state.inflationRate')});return text(els['ms-compare']).includes(J(`fmt(${e.invest.owed})`))&&e.invest.owed>0})());
setPlan({horizonYears:0});
// charts
run(`globalThis.__c=[];Chart=function(c,cfg){globalThis.__c.push(cfg);this.destroy=()=>{}};renderMortgageCard(calculateMetrics());`);
const ch=J(`(()=>{const a=__c;const bal=a.find(c=>c.data.datasets.length&&/Balance/.test(c.data.datasets[0].label)),w=a.find(c=>/Net wealth/.test(c.data.datasets[0].label));return {n:a.length,balSets:bal.data.datasets.map(d=>d.label),balStart:bal.data.datasets.map(d=>d.data[0]),balEnd:bal.data.datasets.map(d=>d.data[d.data.length-1]),wSets:w.data.datasets.length,wLen:w.data.labels.length,wStart:w.data.datasets.map(d=>d.data[0]),tick12:w.options.scales.x.ticks.callback(12,12),tick5:w.options.scales.x.ticks.callback(5,5)}})()`);
ok('balance chart: scheduled balance and the balance with the extra money (which starts lower by the lump sum and ends sooner)',ch.balSets.length===2&&/Balance \(scheduled payments\)/.test(ch.balSets[0])&&/with the extra money/.test(ch.balSets[1])&&ch.balStart[0]===Math.round(t0.balance)&&ch.balStart[1]===Math.round(t0.balance-30000)&&ch.balEnd[0]===0&&ch.balEnd[1]===0);
ok('wealth chart: prepay and invest series over horizon+1 months, starting at -(balance - lump) and lump - balance, ticks every 12 months',ch.wSets===2&&ch.wLen===eng.horizonMonths+1&&ch.wStart[0]===Math.round(-(t0.balance-30000))&&ch.wStart[1]===Math.round(30000-t0.balance)&&/^1 /.test(ch.tick12)&&ch.tick5==='');
setPlan({extraMonthly:0,lumpSum:0});run(`globalThis.__c=[];renderMortgageCard(calculateMetrics());`);
ok('with nothing to compare the balance chart shows only the scheduled balance',J(`__c.filter(c=>/Balance/.test(c.data.datasets[0].label))[0].data.datasets.length`)===1);
// handlers
run(`updateMortgagePlan('extraMonthly','-50')`);ok('extra per month: negative -> 0',J('state.mortgagePlan.extraMonthly')===0);
run(`updateMortgagePlan('returnPct','')`);ok('return: empty -> null (portfolio yield)',J('state.mortgagePlan.returnPct')===null);
run(`updateMortgagePlan('returnPct','999')`);ok('return: capped at 60',J('state.mortgagePlan.returnPct')===60);
run(`updateMortgagePlan('taxPct','999');updateMortgagePlan('horizonYears','99')`);ok('tax capped at 60 and horizon at 50 years',J('state.mortgagePlan.taxPct')===60&&J('state.mortgagePlan.horizonYears')===50);
run(`updateMortgagePlan('propertyId','abc')`);ok('a junk property id -> none',J('state.mortgagePlan.propertyId')===null);
load();run(`state.mortgagePlan=Object.assign({},state.mortgagePlan,{extraMonthly:800,lumpSum:15000,returnPct:6.5,taxPct:12,horizonYears:9});syncMortgageInputs()`);
ok('the inputs on screen follow the saved plan',String(els['input-ms-extra'].value)==='800'&&String(els['input-ms-lump'].value)==='15000'&&String(els['input-ms-return'].value)==='6.5'&&String(els['input-ms-tax'].value)==='12'&&String(els['input-ms-horizon'].value)==='9');
run(`state.mortgagePlan.returnPct=null;state.mortgagePlan.horizonYears=0;syncMortgageInputs()`);ok('...and an automatic return / horizon shows as empty',els['input-ms-return'].value===''&&els['input-ms-horizon'].value==='');
// standalone: the card never changes the plan's projections or cash flow
load();const before=run('JSON.stringify(calculateMetrics())');
run(`updateMortgagePlan('extraMonthly','5000');updateMortgagePlan('lumpSum','90000');updateMortgagePlan('returnPct','20')`);
ok('the prepay/invest simulation is standalone: it does not change the cash flow, the surplus or the freedom projection',run('JSON.stringify(calculateMetrics())')===before);
// the debt planner shows where a mortgage payment came from
load();run(`state.realEstate[0].mortgagePayment=0;state.realEstate[0].mortgageTermYears=20;state.debtPlan.includeMortgages=true`);clear('dp-table');run('renderDebtPlanner(calculateMetrics())');
ok('in the Debt planner table a mortgage payment derived from the term says so (and is not called an estimate)',/calculated from the remaining term/.test(text(els['dp-table'])));

// ================= 7. translations / markup =================
for(const lang of ['pt','es','en']){
  load('BR',lang);setPlan({extraMonthly:1500,lumpSum:20000,returnPct:8,taxPct:10});render();
  const all=text(els['ms-terms'])+text(els['ms-summary'])+text(els['ms-schedule'])+text(els['ms-compare'])+text(els['ms-verdict']);
  const w=lang==='en'?/Prepay/:lang==='es'?/Amortizar/:/Antecipar/;
  ok(`[${lang}] the card renders in the language, no leftover {placeholders} / NaN`,w.test(all)&&!/\{[a-z0-9]+\}|undefined|NaN|Infinity/.test(all));
}
load('BR','en');setPlan({extraMonthly:1500,lumpSum:20000,returnPct:8});render();
ok('[en] no Portuguese on the mortgage card',!/ção|ões|Antecipar|Financiamento|Parcela|Juros|Prazo|Saldo|Quitação/.test(text(els['ms-terms'])+text(els['ms-summary'])+text(els['ms-schedule'])+text(els['ms-compare'])+text(els['ms-verdict'])));
for(const c of ['ES','GL']){load(c,'en');setPlan({extraMonthly:500});render();ok(`[${c}] works for this residence (no NaN)`,!/NaN|Infinity|undefined/.test(text(els['ms-summary'])+text(els['ms-compare'])+text(els['ms-verdict'])));}
const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('the card sits in the Balance Sheet, after the debt planner card',page.indexOf('id="card-mortgage"')>page.indexOf('id="card-debt-planner"')&&page.indexOf('id="card-mortgage"')<page.indexOf('id="view-cashflow"'));
process.exitCode=bad?1:0;
