// Records the projection engine's exact outputs for many profiles into projections.json.
// Run ONLY when the projection math is changed on purpose:   node tests/golden/generate.js
const fs=require('fs'),path=require('path');
const {run,sb}=require('../harness.js');
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const grid=[];
const countries=['BR','ES','GL'], invests=[0,500,8500,30000], growths=[[0,true],[2,true],[5,true],[3,false]], yields=[0,5,12], infl=[0,4.5,10], starts=[0,1,1e6];
let i=0;
for(const c of countries) for(const inv of invests) for(const [g,p] of growths) for(const y of yields) {
  // keep the grid a manageable size but varied: rotate inflation / start portfolio through it
  const inflation=infl[i%3], startMul=starts[(i>>1)%3]; i++;
  grid.push({c,inv,g,p,y,inflation,startMul});
}
const out=[];
for(const s of grid){
  run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));
    state.country='${s.c}';state.language='en';state.baseCurrency=${JSON.stringify(s.c==='BR'?'BRL':s.c==='ES'?'EUR':'USD')};state.displayCurrency=state.baseCurrency;
    state.earners.forEach(e=>{e.regime=getJurisdictionRegimes('${s.c}').options[0]});
    state.monthlyInvestment=${s.inv};state.careerGrowthRate=${s.g};state.careerGrowthProportional=${s.p};state.inflationRate=${s.inflation};
    state.liquidInvestments.forEach(l=>{l.annualYieldPct=${s.y}; if(${s.startMul}!==1) l.balanceOriginal=l.balanceOriginal*${s.startMul}});`);
  const m=J(`(()=>{const m=calculateMetrics();return {yearsToCrossover:m.yearsToCrossover,projLiquid:m.projLiquidAtCrossover,crossoverYear:m.crossoverYear,target:m.targetFreedomCapital,real:m.realAnnualReturn,liquid:m.totalLiquidBase,cash:m.cashDelta}})()`);
  run(`globalThis.__cfg=null;Chart=function(ctx,cfg){globalThis.__cfg=cfg;this.destroy=()=>{}};renderRetirementChart(calculateMetrics());`);
  const chart=J(`__cfg.data.datasets.map(d=>d.data)`);
  const wi=J(`wiSeries(calculateMetrics(),35)`);
  const wi2=J(`wiSeries(calculateMetrics(),35,1234.5)`);
  out.push({s,m,chart,wi,wi2});
}
fs.writeFileSync(path.join(__dirname,'projections.json'),JSON.stringify(out));
console.log('golden profiles:',out.length,'| freedom reached in',out.filter(o=>o.m.yearsToCrossover!==null).length,'| not reached in',out.filter(o=>o.m.yearsToCrossover===null).length,'| already reached',out.filter(o=>o.m.yearsToCrossover===0).length);
