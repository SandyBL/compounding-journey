const {run,els}=require('../harness.js');
const rd=(c)=>{els[c].children.length=0};
// ---- rental tax ----
run(`state.country='ES';state.esRentalReductionPct=50;`);
const es=(r)=>{run(`state.esRentalReductionPct=${r}`);return run(`calcRentalIncomeTax(2000,'ES')`)};
console.log('ES rent 2000: red 50/60/70/90 ->',[50,60,70,90].map(es).map(v=>v.toFixed(2)).join(' / '),'(expect 190.00 / 152.00 / 114.00 / 38.00)');
run(`state.esRentalReductionPct=undefined`);console.log('ES default when unset (expect 190):',run(`calcRentalIncomeTax(2000,'ES')`).toFixed(2));
console.log('GL rent 2000 default (expect 400):',(run(`state.glRentalTaxRatePct=undefined;calcRentalIncomeTax(2000,'GL')`)).toFixed(2));
console.log('GL rate 15 (expect 300):',run(`state.glRentalTaxRatePct=15;calcRentalIncomeTax(2000,'GL')`).toFixed(2),' rate 28 (expect 560):',run(`state.glRentalTaxRatePct=28;calcRentalIncomeTax(2000,'GL')`).toFixed(2));
console.log('migration defaults (expect 50, 20, false):',run(`(()=>{const r=migrateAndSanitizeState({country:'ES'});return [r.esRentalReductionPct,r.glRentalTaxRatePct,r.scoreIncludeHedge].join(', ')})()`));
console.log('migration keeps saved values (expect 90, 10, true):',run(`(()=>{const r=migrateAndSanitizeState({country:'GL',esRentalReductionPct:90,glRentalTaxRatePct:10,scoreIncludeHedge:true});return [r.esRentalReductionPct,r.glRentalTaxRatePct,r.scoreIncludeHedge].join(', ')})()`));
// rows by country
for(const c of ['ES','GL','BR']){run(`state.country='${c}';updateUI();`);console.log(c,'-> ES row hidden:',els['row-rental-tax-es'].classList._hidden,' PT row hidden:',els['row-rental-tax-gl'].classList._hidden);}
// ---- score ----
const setup=`state.country='BR';state.language='pt';state.baseCurrency='BRL';state.displayCurrency='BRL';
 state.earners=[{id:1,name:'A',age:35,regime:'CLT',grossMonthly:15000}];state.children=[];state.realEstate=[];state.goals=[];
 state.debts={parcelas:0,revolving:0,autoLoans:0,revolvingRatePct:12,autoLoansRatePct:18};
 state.outflows={housing:3000,utilities:300,telecom:150,groceries:1500,dining:500,transport:600,cleaning:0,subs:100,elderCare:0,charitableGiving:0};
 state.insurance={lifeInsuranceCoverage:0,lifeInsuranceMonthlyPremium:0,disabilityMonthlyBenefit:0,disabilityMonthlyPremium:0,healthInsuranceMonthlyPremium:0,propertyInsuranceMonthlyPremium:0};
 state.monthlyInvestment=4000;
 state.liquidInvestments=[{id:1,name:'CDB',currency:'BRL',balanceOriginal:200000,annualYieldPct:11,liquidityTier:'same_day',volatilityTier:'low',accountType:'none',isEmergencyReserve:true}];`;
run(setup);
run(`state.scoreIncludeHedge=false`);const off=run(`(()=>{const m=calculateMetrics();return {t:m.totalScore,r:m.ptsRunway,d:m.ptsDebt,s:m.ptsSavings,h:m.ptsHedge,inc:m.scoreIncludesHedge}})()`);
run(`state.scoreIncludeHedge=true`);const on=run(`(()=>{const m=calculateMetrics();return {t:m.totalScore,inc:m.scoreIncludesHedge}})()`);
console.log('hedge OFF:',JSON.stringify(off),'expected total',Math.round(100*(off.r+off.d+off.s)/75));
console.log('hedge ON :',JSON.stringify(on),'expected total',Math.round(100*(3*(off.r+off.d+off.s)/25+off.h/25)/10));
console.log('with 0% foreign the score is lower when included (expect true):',on.t<off.t);
// 100% foreign holding -> included score should be >= excluded
run(`state.liquidInvestments[0].currency='USD';state.scoreIncludeHedge=false;`);const off2=run(`calculateMetrics().totalScore`);run(`state.scoreIncludeHedge=true;`);const on2=run(`(()=>{const m=calculateMetrics();return [m.totalScore,m.ptsHedge]})()`);
console.log('100% foreign: off',off2,' on',on2[0],'hedge pts',on2[1]);
// UI: pill + radar
run(setup);run(`state.scoreIncludeHedge=false;`);rd('container-radar-observations');run('updateUI();');
console.log('pill when excluded (expect —):',els['lbl-score-pill-diversif'].innerText,' | intl observation cards (expect 0):',els['container-radar-observations'].children.filter(c=>/Diversificação Internacional/.test(c.innerHTML)).length);
run(`state.scoreIncludeHedge=true;`);rd('container-radar-observations');run('updateUI();');
console.log('pill when included (expect 0/25):',els['lbl-score-pill-diversif'].innerText,' | intl observation cards (expect 1):',els['container-radar-observations'].children.filter(c=>/Diversificação Internacional/.test(c.innerHTML)).length);
console.log('score card tooltip set:',!!els['lbl-dash-score'].title);
// ---- life insurance styling ----
run(`state.insurance.lifeInsuranceCoverage=100000;updateUI();`);
console.log('insurance box below reference (expect amber, no rose):',/amber/.test(els['box-ins-gap'].className),!/rose/.test(els['box-ins-gap'].className));
console.log('gap label text:',els['lbl-ins-gap-label'].innerText);
run(`state.insurance.lifeInsuranceCoverage=999999999;updateUI();`);
console.log('insurance box above reference:',els['lbl-ins-gap-value'].innerText);
