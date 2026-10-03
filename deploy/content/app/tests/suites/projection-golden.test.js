// Golden master: with NO life events, the shared projection engine must reproduce, digit for digit,
// what the old separate loops produced (freedom year, projected capital, Retirement chart, What-if series).
// The reference file was recorded from the old engine (see tests/golden/generate.js).
const fs=require('fs'),path=require('path');
const {run}=require('../harness.js');
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const golden=JSON.parse(fs.readFileSync(path.join(__dirname,'..','golden','projections.json'),'utf8'));
let bad=0,checked=0;const fails=[];
for(const g of golden){
  const s=g.s;
  run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.lifeEvents=[];state.debtPlan.autoEvents=false;
    // the reference was recorded from a profile whose cash flow had no debt-payment line: use a debt-free copy
    state.debts={parcelas:0,revolving:0,revolvingRatePct:12,autoLoans:0,autoLoansRatePct:18};state.realEstate.forEach(r=>{r.mortgageDebt=0;r.mortgagePayment=0});
    state.outflows.housing=5400;state.outflows.transport=1400;state.monthlyInvestment=8500;
    state.liquidInvestments=state.liquidInvestments.filter(l=>l.id<=104);   // the four holdings the reference was recorded from
    state.country='${s.c}';state.language='en';state.baseCurrency=${JSON.stringify(s.c==='BR'?'BRL':s.c==='ES'?'EUR':'USD')};state.displayCurrency=state.baseCurrency;
    state.earners.forEach(e=>{e.regime=getJurisdictionRegimes('${s.c}').options[0]});
    state.monthlyInvestment=${s.inv};state.careerGrowthRate=${s.g};state.careerGrowthProportional=${s.p};state.inflationRate=${s.inflation};
    state.liquidInvestments.forEach(l=>{l.annualYieldPct=${s.y}; if(${s.startMul}!==1) l.balanceOriginal=l.balanceOriginal*${s.startMul}});`);
  const m=J(`(()=>{const m=calculateMetrics();return {yearsToCrossover:m.yearsToCrossover,projLiquid:m.projLiquidAtCrossover,crossoverYear:m.crossoverYear,target:m.targetFreedomCapital,real:m.realAnnualReturn,liquid:m.totalLiquidBase,cash:m.cashDelta}})()`);
  run(`globalThis.__cfg=null;Chart=function(ctx,cfg){globalThis.__cfg=cfg;this.destroy=()=>{}};renderRetirementChart(calculateMetrics());`);
  const got={m,chart:J(`__cfg.data.datasets.map(d=>d.data)`),wi:J(`wiSeries(calculateMetrics(),35)`),wi2:J(`wiSeries(calculateMetrics(),35,1234.5)`)};
  for(const k of ['m','chart','wi','wi2']){checked++;if(JSON.stringify(got[k])!==JSON.stringify(g[k])){bad++;if(fails.length<3)fails.push(k+' '+JSON.stringify(s))}}
}
console.log((bad?'FAIL ':'PASS ')+`projection engine reproduces the old numbers exactly: ${golden.length} profiles x 4 outputs = ${checked} comparisons, ${bad} differences`+(fails.length?'  -> '+fails.join(' | '):''));
process.exitCode=bad?1:0;
