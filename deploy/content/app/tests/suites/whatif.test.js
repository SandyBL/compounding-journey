// What-if tab: purity, consistency with the rest of the app, lever behaviour, persistence, UI, translations.
const fs=require('fs'),path=require('path');
const H=require('../harness.js');const {run,els,sb}=H;
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  if('${country}'==='ES'){state.baseCurrency='EUR';state.displayCurrency='EUR';state.earners.forEach(e=>e.regime='Cuenta Ajena')}
  if('${country}'==='GL'){state.baseCurrency='USD';state.displayCurrency='USD';state.earners.forEach(e=>e.regime='Employee')}
  state.traditionalRetirementAge=65;syncFormInputsFromState();`);
const set=(o)=>run(`state.whatIf=Object.assign({},WHATIF_NEUTRAL,${JSON.stringify(o)});`);
const compute=()=>J(`(()=>{const r=computeWhatIf();return {base:{inv:r.base.m.monthlyInvest,tgt:r.base.m.targetFreedomCapital,yrs:r.base.freedomYears,port:r.base.m.totalLiquidBase,proj:r.base.projectedAtRetire,gap:r.base.gap,req:r.base.required,ret:r.base.retireAge,rr:r.base.m.realAnnualReturn,sr:r.base.m.savingsRate,spend:r.base.m.totalMonthlyLivingCost},
  scen:{inv:r.scen.m.monthlyInvest,tgt:r.scen.m.targetFreedomCapital,yrs:r.scen.freedomYears,port:r.scen.m.totalLiquidBase,proj:r.scen.projectedAtRetire,gap:r.scen.gap,req:r.scen.required,ret:r.scen.retireAge,rr:r.scen.m.realAnnualReturn,sr:r.scen.m.savingsRate,spend:r.scen.m.totalMonthlyLivingCost,py:r.scen.yearsToRetire},
  neutral:r.neutral,cashShort:r.cashShort,netInflow:r.base.m.totalNetInflow}})()`);
const num=x=>x===null||x===undefined?Infinity:x;   // "not reached" = infinitely late

// ================= 1. purity =================
load();set({extraSavingsPct:20,spendingChangePct:-15,returnDeltaPp:1,lumpSum:50000,retireAge:55});
const before=run('JSON.stringify(state)');run('computeWhatIf()');
ok('computing a scenario never changes the real data',run('JSON.stringify(state)')===before);
run(`(()=>{const real=state;try{wiMetricsFor({})}catch(e){}; globalThis.__same=(state===real)})()`);
ok('the real data object is restored even when a scenario calculation throws',run('__same')===true);
run('updateUI()');
ok('...and after a full render the real data is still untouched',run('JSON.stringify(state)').length>0&&J('state.monthlyInvestment')===J('JSON.parse(\''+before.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\').monthlyInvestment'));

// ================= 2. current plan == what the rest of the app shows =================
for(const c of ['BR','ES','GL']){
  load(c);set({});
  const same=run(`(()=>{const m=calculateMetrics(),b=computeWhatIf().base.m;return JSON.stringify(m)===JSON.stringify(b)})()`);
  ok(`[${c}] "current plan" is exactly calculateMetrics() (same as Overview / Retirement)`,same===true);
  const r=compute();
  ok(`[${c}] no levers -> scenario identical to current plan`,r.neutral&&r.base.tgt===r.scen.tgt&&r.base.yrs===r.scen.yrs&&r.base.inv===r.scen.inv&&Math.abs(r.base.proj-r.scen.proj)<1e-6&&r.base.req===r.scen.req);
}

// ================= 3. each lever moves things the right way =================
load();set({});const b0=compute().base;
set({extraSavingsPct:5});let r=compute();
ok('save 5% more: monthly investment rises by exactly 5% of net income',Math.abs((r.scen.inv-r.base.inv)-0.05*r.netInflow)<1e-6,(r.scen.inv-r.base.inv).toFixed(2)+' vs '+(0.05*r.netInflow).toFixed(2));
ok('save 5% more: savings rate +5 points, freedom not later, projection higher',Math.abs((r.scen.sr-r.base.sr)-5)<1e-6&&num(r.scen.yrs)<=num(r.base.yrs)&&r.scen.proj>r.base.proj);
ok('save 5% more: capital needed unchanged (spending untouched)',r.scen.tgt===r.base.tgt);
set({extraSavingsPct:-5});r=compute();
ok('save 5% LESS: investment falls, freedom not earlier',r.scen.inv<r.base.inv&&num(r.scen.yrs)>=num(r.base.yrs));
set({extraSavingsPct:-50});r=compute();
ok('saving less can never make the monthly investment negative',r.scen.inv>=0);

set({spendingChangePct:-10,investFreed:true});r=compute();
const freed=J('(()=>{const m0=calculateMetrics();const b=computeWhatIf();return m0.baseOutflows-(m0.baseOutflows*0.90)})()');   // outflows scale linearly
ok('spend 10% less: capital needed falls',r.scen.tgt<r.base.tgt&&r.scen.spend<r.base.spend);
ok('spend 10% less + "invest the money": monthly investment rises by the freed amount',Math.abs((r.scen.inv-r.base.inv)-J('(()=>{const m0=calculateMetrics(),s=computeWhatIf();return m0.baseOutflows-s.scen.m.baseOutflows})()'))<1e-6&&r.scen.inv>r.base.inv,(r.scen.inv-r.base.inv).toFixed(2));
ok('spend 10% less: freedom not later',num(r.scen.yrs)<=num(r.base.yrs));
set({spendingChangePct:-10,investFreed:false});r=compute();
ok('spend 10% less WITHOUT investing the difference: investment unchanged, target still lower',r.scen.inv===r.base.inv&&r.scen.tgt<r.base.tgt);
set({spendingChangePct:10});r=compute();
ok('spend 10% MORE: capital needed rises, freedom not earlier',r.scen.tgt>r.base.tgt&&num(r.scen.yrs)>=num(r.base.yrs));

set({returnDeltaPp:-2});r=compute();
ok('returns 2 points lower: real return falls, projection lower, freedom not earlier',r.scen.rr<r.base.rr&&r.scen.proj<r.base.proj&&num(r.scen.yrs)>=num(r.base.yrs));
set({returnDeltaPp:2});r=compute();
ok('returns 2 points higher: real return rises, projection higher, freedom not later',r.scen.rr>r.base.rr&&r.scen.proj>r.base.proj&&num(r.scen.yrs)<=num(r.base.yrs));

set({lumpSum:100000});r=compute();
ok('one-time deposit of 100,000: portfolio today rises by exactly that (base currency)',Math.abs((r.scen.port-r.base.port)-100000)<1e-6,(r.scen.port-r.base.port).toFixed(2));
ok('one-time deposit: freedom not later, monthly investment unchanged',num(r.scen.yrs)<=num(r.base.yrs)&&r.scen.inv===r.base.inv);

// ================= 4. retirement-age question =================
const primaryAge=J('state.earners[0].age');
set({retireAge:55});r=compute();
ok('retire at 55: scenario uses 55, current plan keeps its own age',r.scen.ret===55&&r.base.ret===65,`${r.base.ret} -> ${r.scen.ret}`);
ok('retire at 55: years to retire = 55 - current age',r.scen.py===Math.max(0,55-primaryAge),r.scen.py);
ok('retiring earlier leaves a smaller projected portfolio than retiring later (same contributions)',r.scen.proj<r.base.proj);
set({retireAge:75});const r75=compute();
ok('projection grows with the retirement age (55 < 65 < 75)',r.scen.proj<r.base.proj&&r.base.proj<r75.scen.proj);
// the "monthly investment needed" really is the threshold
load();set({retireAge:55});
const chk=J(`(()=>{const p=computeWhatIf().scen;const m=p.m,y=p.yearsToRetire,req=p.required;
  return {req,hit:wiProjectedAt(m,y,req)>=m.targetFreedomCapital-1e-3,miss:req>0?wiProjectedAt(m,y,req*0.99)<m.targetFreedomCapital:true,short:p.gap<0}})()`);
ok('"monthly investment needed" is the exact threshold (hits the target; 1% less misses)',chk.req!==null&&chk.hit&&chk.miss,JSON.stringify(chk));
ok('when already on track, the needed investment is not above what the person invests today',(()=>{load();set({retireAge:90});const q=J('computeWhatIf().scen');return q.gap>=0?(q.required<=q.m.monthlyInvest+1e-6):true})());

// ================= 5. robustness: empty / extreme profiles never produce NaN =================
const cleanText=(el)=>{const t=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(t).join(' ')).replace(/<[^>]+>/g,' ');return t(el)};
run(`state=migrateAndSanitizeState({country:'BR',language:'en'});state.language='en';syncFormInputsFromState();`);
set({extraSavingsPct:100,spendingChangePct:-50,returnDeltaPp:5,lumpSum:1e9,retireAge:40});run('renderWhatIf()');
const emptyTxt=cleanText(els['wi-table'])+' '+cleanText(els['wi-verdict']);
ok('empty profile + extreme levers: no NaN / Infinity / undefined on screen',!/NaN|Infinity|undefined|\{[a-z0-9]+\}/.test(emptyTxt),emptyTxt.replace(/\s+/g,' ').slice(0,80));
run(`state=migrateAndSanitizeState({country:'ES',language:'en',baseCurrency:'EUR',earners:[{id:1,name:'A',age:70,regime:'Cuenta Ajena',grossMonthly:3000}],liquidInvestments:[{id:2,name:'X',currency:'EUR',balanceOriginal:1000,annualYieldPct:3}]});state.language='en';`);
set({retireAge:60});run('renderWhatIf()');
const oldTxt=cleanText(els['wi-table'])+' '+cleanText(els['wi-verdict']);
ok('retirement age already passed: handled with an explanation, no NaN',!/NaN|Infinity|undefined/.test(oldTxt)&&/already arrived or passed/.test(oldTxt));

// ================= 6. cash-flow feasibility warning =================
load();set({extraSavingsPct:100});r=compute();run('renderWhatIf()');
ok('saving 100% more than the cash flow allows raises the warning',r.cashShort>0&&/needs .* more per month than your cash flow allows/.test(cleanText(els['wi-verdict'])),r.cashShort.toFixed(0));
set({});r=compute();run('renderWhatIf()');
ok('no levers -> no cash-flow warning',r.cashShort===0&&!/needs .* more per month/.test(cleanText(els['wi-verdict'])));

// ================= 7. rendering: verdict, table, chart =================
load();set({extraSavingsPct:5,retireAge:55});run('renderWhatIf()');
const v=cleanText(els['wi-verdict']).replace(/\s+/g,' ');
ok('verdict states the freedom-date change with years, ages and calendar years',/(earlier|later|do not move)/.test(v)&&/age \d+ \(\d{4}\)/.test(v),v.slice(0,120));
ok('verdict answers the retirement-age question',/At age 55/.test(v),(v.match(/At age 55[^.]*\./)||[''])[0].slice(0,110));
const tbl=cleanText(els['wi-table']);
ok('table has all 11 rows and 4 columns',(els['wi-table'].innerHTML.match(/<tr/g)||[]).length===12&&/Current plan/.test(tbl)&&/What-if plan/.test(tbl)&&/Difference/.test(tbl));
ok('the difference column is color-coded (good = green, worse = orange)',/text-emerald-400/.test(els['wi-table'].innerHTML));
// chart: capture what is handed to Chart.js
// this tab now draws TWO charts (the Quick Levers comparison, and the newer Scenario
// Comparison one) — capture every Chart() call and target the FIRST one, which is
// still renderWhatIfChart's own (unaffected: it runs before the newer renderScenarios()).
run(`globalThis.__cfgs=[];Chart=function(ctx,cfg){globalThis.__cfgs.push(cfg);this.destroy=()=>{};this.update=()=>{}};renderWhatIf();`);
const cfg=J('({labels:__cfgs[0].data.labels,names:__cfgs[0].data.datasets.map(d=>d.label),lens:__cfgs[0].data.datasets.map(d=>d.data.length)})');
ok('chart: 4 series (both plans + both targets) over 36 ages starting at the current age',cfg.names.length===4&&cfg.lens.every(n=>n===36)&&cfg.labels[0]===primaryAge&&cfg.labels[35]===primaryAge+35,cfg.names.join(' | '));
const series=J('(()=>{const r=computeWhatIf();return {a:wiSeries(r.base.m,35).map(Math.round),b:__cfgs[0].data.datasets[0].data}})()');
ok('chart "current plan" line equals the same projection the Retirement tab uses',JSON.stringify(series.a)===JSON.stringify(series.b));

// ================= 8. persistence + sanitizing =================
const san=(o)=>J(`migrateAndSanitizeState({country:'BR',whatIf:${JSON.stringify(o)}}).whatIf`);
const s1=san({extraSavingsPct:999,spendingChangePct:-999,returnDeltaPp:'7',lumpSum:-5,retireAge:20,investFreed:'no'});
ok('sanitizer clamps: 999->100, -999->-50, "7"->5, negative deposit->0, age 20->40, junk bool->default',s1.extraSavingsPct===100&&s1.spendingChangePct===-50&&s1.returnDeltaPp===5&&s1.lumpSum===0&&s1.retireAge===40&&s1.investFreed===true,JSON.stringify(s1));
ok('sanitizer: blank / zero retirement age stays "same as current" (0)',san({retireAge:0}).retireAge===0&&san({retireAge:''}).retireAge===0&&san({}).retireAge===0);
ok('sanitizer: hostile / wrong-typed whatIf falls back to neutral defaults',JSON.stringify(san('x'))===JSON.stringify(san(null))&&san(null).extraSavingsPct===0&&san(null).investFreed===true);
ok('old profiles (no whatIf field) load with neutral levers',J(`migrateAndSanitizeState({country:'BR',earners:[]}).whatIf.extraSavingsPct`)===0);
ok('prototype pollution through whatIf is ignored',(()=>{run(`migrateAndSanitizeState(JSON.parse('{"country":"BR","whatIf":{"__proto__":{"polluted":1},"extraSavingsPct":3}}'))`);return run('({}).polluted')===undefined})());
load();set({extraSavingsPct:7,retireAge:58,lumpSum:12345,returnDeltaPp:-1.5,spendingChangePct:-8,investFreed:false});
const exported=run('JSON.stringify(buildExportPayload())');
const back=J(`(()=>{const p=JSON.parse(${JSON.stringify(exported)});return migrateAndSanitizeState(p.data||p).whatIf})()`);
ok('export -> import keeps every lever',back.extraSavingsPct===7&&back.retireAge===58&&back.lumpSum===12345&&back.returnDeltaPp===-1.5&&back.spendingChangePct===-8&&back.investFreed===false,JSON.stringify(back));

// ================= 9. inputs, presets, navigation =================
load();set({});
run(`updateWhatIf('extraSavingsPct','999')`);ok('typing 999 into "save more" is clamped to 100 and stored',J('state.whatIf.extraSavingsPct')===100);
run(`updateWhatIf('extraSavingsPct','abc')`);ok('typing text is treated as 0',J('state.whatIf.extraSavingsPct')===0);
run(`updateWhatIf('retireAge','20')`);ok('retirement age below 40 is raised to 40; empty means "same as current"',J('state.whatIf.retireAge')===40&&(run(`updateWhatIf('retireAge','')`),J('state.whatIf.retireAge')===0));
run(`applyWhatIfPreset('save5')`);run(`applyWhatIfPreset('retire55')`);
ok('presets combine: "Save 5% more" then "Retire at 55" keeps both',J('state.whatIf.extraSavingsPct')===5&&J('state.whatIf.retireAge')===55);
run(`applyWhatIfPreset('cut10')`);run(`applyWhatIfPreset('return2')`);
ok('presets: spend 10% less (and invest it), returns -2 points',J('state.whatIf.spendingChangePct')===-10&&J('state.whatIf.investFreed')===true&&J('state.whatIf.returnDeltaPp')===-2);
ok('inputs on screen follow the state (retire age 55 shown)',String(els['input-wi-retire'].value)==='55'&&String(els['input-wi-save'].value)==='5');
run(`applyWhatIfPreset('reset')`);
ok('reset returns every lever to neutral and clears the inputs',J('JSON.stringify(state.whatIf)')===JSON.stringify(J('WHATIF_NEUTRAL'))&&els['input-wi-retire'].value==='');
run(`localStorage.setItem('__probe','1');updateWhatIf('extraSavingsPct','3')`);
ok('changing a lever saves the profile (levers survive a reload)',/"extraSavingsPct":3/.test(run(`localStorage.getItem('family_balance_sheet_state')||''`)));
els['wi-table'].innerHTML='';run(`switchTab('view-whatif')`);
ok('opening the tab renders the comparison',(els['wi-table'].innerHTML||'').length>200);
const html=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('desktop tab button, mobile option and view exist',/id="btn-tab-whatif"/.test(html)&&/id="mopt-whatif"/.test(html)&&/id="view-whatif"/.test(html));
run(`applyTranslations()`);
ok('mobile dropdown option is translated with the tab label',/🧪/.test(els['mopt-whatif'].innerText)&&els['mopt-whatif'].innerText.includes(run(`I18N.en.navWhatIf`)));

// ================= 10. translations: same story in all three languages =================
for(const lang of ['pt','es','en']){
  load('BR',lang);set({extraSavingsPct:5,retireAge:55});run('renderWhatIf()');
  const t=cleanText(els['wi-verdict'])+' '+cleanText(els['wi-table']);
  const words=lang==='en'?/Current plan/:lang==='es'?/Plan actual/:/Plano atual/;
  ok(`[${lang}] verdict and table render in the language, no leftover {placeholders}`,words.test(t)&&!/\{[a-z0-9]+\}|undefined|NaN/.test(t));
}
load('BR','en');set({extraSavingsPct:5,retireAge:55});run('renderWhatIf()');
ok('[en] no Portuguese leaks into the what-if tab',!/ção|ões|Plano|Aposent|liberdade|Poupar|Cenário/.test(cleanText(els['wi-verdict'])+cleanText(els['wi-table'])));
load('BR','es');run('renderWhatIf()');
ok('simulator link follows the app language',els['link-wi-simulator'].href.includes('/es/simulators/monte-carlo-fire'));
process.exitCode=bad?1:0;
