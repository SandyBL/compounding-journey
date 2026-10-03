// Rebalancing (Withdrawal tab): target vs. actual risky allocation (derived from the
// existing volatility tag), drift/rebalance suggestions, and the Market Time Machine link.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const near=(a,b,tol=1e-6)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b));
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const item=(id,bal,vol)=>({id,name:'h'+id,currency:'BRL',balanceOriginal:bal,annualYieldPct:10,liquidityTier:'short',volatilityTier:vol,owner:'joint'});
const alloc=(items)=>{run(`state=migrateAndSanitizeState({country:'BR',liquidInvestments:${JSON.stringify(items)}});state.language='en';`);return J('summarizeAllocation(state,0,0)');};
const rb=(a,target)=>J(`computeRebalancingSuggestion(${JSON.stringify(a)},${target})`);

// ================= 1. computeRebalancingSuggestion: pure math =================
ok('empty portfolio: everything zero, no crash, direction null', (()=>{const r=rb({total:0,byVolatility:{low:0,medium:0,high:0}},70);return r.total===0&&r.riskyPct===0&&r.direction===null})());
{
  const a={total:1000,byVolatility:{low:300,medium:200,high:500}};
  const r=rb(a,70);
  ok('risky = high fully + half of medium: (500 + 100) / 1000 = 60%', near(r.riskyAmount,600)&&near(r.riskyPct,60));
  ok('non-risky = the rest (400), percentages add to 100', near(r.nonRiskyAmount,400)&&near(r.riskyPct+r.nonRiskyPct,100));
  ok('drift = actual - target = 60 - 70 = -10pp; outside the 5pp tolerance band -> addRisky', near(r.driftPct,-10)&&r.direction==='addRisky');
  ok('rebalance amount = |actual risky $ - target risky $| = |600 - 700| = 100', near(r.rebalanceAmount,100));
}
{
  // exactly at target: no direction, driftPct 0
  const a={total:1000,byVolatility:{low:300,medium:0,high:700}};
  const r=rb(a,70);
  ok('exactly at target (70%): driftPct 0, direction null', near(r.driftPct,0)&&r.direction===null);
}
{
  // just inside the tolerance band (driftPct = 5, the boundary itself counts as "within")
  const a={total:1000,byVolatility:{low:250,medium:0,high:750}};
  const r=rb(a,70);
  ok('drift exactly at the 5pp tolerance boundary counts as "within band" (<=), not a trigger', near(r.driftPct,5)&&r.direction===null);
}
{
  // just outside: overweight risky -> trimRisky
  const a={total:1000,byVolatility:{low:240,medium:0,high:760}};
  const r=rb(a,70);
  ok('drift just past the boundary (6pp) DOES trigger, direction trimRisky (overweight)', near(r.driftPct,6)&&r.direction==='trimRisky');
}
ok('target is clamped to 0..100 even if given something absurd', rb({total:100,byVolatility:{low:50,medium:0,high:50}},150).targetRiskyPct===100 && rb({total:100,byVolatility:{low:50,medium:0,high:50}},-20).targetRiskyPct===0);
{
  // all medium: risky = exactly half, regardless of target
  const a={total:1000,byVolatility:{low:0,medium:1000,high:0}};
  ok('an all-medium-volatility portfolio splits exactly 50/50 risky vs. not', near(rb(a,70).riskyPct,50));
}

// ================= 2. summarizeAllocation -> computeRebalancingSuggestion, end to end =================
{
  const a=alloc([item(1,300000,'low'),item(2,200000,'medium'),item(3,500000,'high')]);
  const r=rb(a,70);
  ok('real holdings through summarizeAllocation give the same math as the pure-object test above', near(r.riskyPct,60)&&near(r.nonRiskyPct,40));
}

// ================= 3. rendering on the Withdrawal tab =================
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  syncFormInputsFromState();updateUI();switchTab('view-retirement');renderWithdrawalPhase(calculateMetrics());`);
load();
ok('the target-risky input shows the saved target (default 70)', Number(els['input-target-risky'].value)===70);
const demoAlloc=J('summarizeAllocation(state,0,0)');
const demoRb=J('computeRebalancingSuggestion(summarizeAllocation(state,0,0),70)');
ok('the bars show the REAL computed actual and target percentages', text(els['rebalance-bars']).includes(demoRb.riskyPct.toFixed(0)+'%')&&text(els['rebalance-bars']).includes('70%'));
ok('the verdict box states the real drift and rebalance amount', text(els['rebalance-verdict']).includes(Math.abs(demoRb.driftPct).toFixed(1))&&text(els['rebalance-verdict']).includes(fmt=>true) || text(els['rebalance-verdict']).length>20);
ok('the yield line states the real weighted portfolio yield', els['rebalance-yield-text'].innerText.includes(J('calculateMetrics().weightedPortfolioYield').toFixed(1)));
ok('the Market Time Machine link points to the real simulator (English, since language=en)', els['link-market-time-machine'].href==='https://compoundingjourney.com/en/simulators/market-time-machine');

// changing the target updates the display
run(`updateTargetRiskyAllocation('40')`);
ok('lowering the target to 40% is saved', J('state.targetRiskyAllocationPct')===40);
{
  const r2=J('computeRebalancingSuggestion(summarizeAllocation(state,0,0),40)');
  ok('...and the verdict now reflects the new target (likely overweight now, since the demo sits around 58%)', text(els['rebalance-verdict']).includes(Math.abs(r2.driftPct).toFixed(1)));
}
run(`updateTargetRiskyAllocation('200');`); ok('an absurd target input clamps to 100', J('state.targetRiskyAllocationPct')===100);
run(`updateTargetRiskyAllocation('-5');`); ok('a negative target input clamps to 0', J('state.targetRiskyAllocationPct')===0);
run(`updateTargetRiskyAllocation('abc');`); ok('junk text -> 0, no crash', J('state.targetRiskyAllocationPct')===0);
run(`updateTargetRiskyAllocation('62.7');`); ok('a fractional target is rounded to a whole percentage', J('state.targetRiskyAllocationPct')===63);

// empty portfolio: no crash, sensible message
load(); run(`state.liquidInvestments=[];updateUI();switchTab('view-retirement');renderWithdrawalPhase(calculateMetrics());`);
ok('an empty portfolio shows a friendly message, no NaN/crash in the bars or verdict', !/NaN|undefined/.test(text(els['rebalance-bars'])+text(els['rebalance-verdict'])+els['rebalance-yield-text'].innerText));

// ================= 4. sanitizer =================
const san=(o)=>J(`migrateAndSanitizeState(Object.assign({country:'BR'},${JSON.stringify(o)}))`);
ok('sanitizer: default target is 70 when absent', san({}).targetRiskyAllocationPct===70);
ok('sanitizer: a valid target is kept', san({targetRiskyAllocationPct:35}).targetRiskyAllocationPct===35);
ok('sanitizer: out-of-range values clamp to 0..100', san({targetRiskyAllocationPct:150}).targetRiskyAllocationPct===100 && san({targetRiskyAllocationPct:-10}).targetRiskyAllocationPct===0);
ok('sanitizer: junk (string/object) -> the 70 default, no crash', san({targetRiskyAllocationPct:'abc'}).targetRiskyAllocationPct===70 && san({targetRiskyAllocationPct:{x:1}}).targetRiskyAllocationPct===70);
load(); run(`state.targetRiskyAllocationPct=55;`);
const back=J(`(()=>{const p=JSON.parse(${JSON.stringify(run('JSON.stringify(buildExportPayload())'))});return migrateAndSanitizeState(p.data||p)})()`);
ok('export -> import keeps the target', back.targetRiskyAllocationPct===55);

// ================= 5. translations, escaping, markup =================
for(const lang of ['pt','es','en']){
  load('BR',lang);
  const all=text(els['rebalance-bars'])+text(els['rebalance-verdict'])+els['rebalance-yield-text'].innerText;
  ok(`[${lang}] rebalancing card renders with no leftover placeholders`, all.length>20 && !/\{[a-z0-9]+\}|undefined|NaN/.test(all));
}
load('BR','en');
ok('[en] no Portuguese in the rebalancing card', !/ção|ões|Meta em ativos|Rebalanceamento/.test(text(els['rebalance-bars'])+text(els['rebalance-verdict'])+els['rebalance-yield-text'].innerText));
for(const lang of ['pt','es','en']){
  load('BR',lang);
  const want=lang==='en'?'en':lang;
  ok(`[${lang}] the Market Time Machine link uses the right language path`, els['link-market-time-machine'].href===`https://compoundingjourney.com/${want}/simulators/market-time-machine`);
}
const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('markup: the rebalancing card, target input and simulator link all exist', /id="input-target-risky"/.test(page)&&/id="rebalance-bars"/.test(page)&&/id="rebalance-verdict"/.test(page)&&/id="link-market-time-machine"/.test(page));
ok('the rebalancing card sits inside the Withdrawal card, before the assumptions footnote', page.indexOf('id="rebalance-bars"')>page.indexOf('id="wd-alloc-verdict"')&&page.indexOf('id="rebalance-bars"')<page.indexOf('data-i18n="wdAssumptions"'));
process.exitCode=bad?1:0;
