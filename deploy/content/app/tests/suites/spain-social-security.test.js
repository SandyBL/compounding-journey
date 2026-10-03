// Spain employee Social Security: named, dated constant used everywhere.
const {run}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x?'  -> '+x:''));if(!c)bad++};
ok('constants: 2026 rate is 6.50% (4.70 + 1.55 + 0.10 + 0.15 MEI)',run('ES_SS_EMPLOYEE_RATE_YEAR')===2026&&Math.abs(run('ES_SS_EMPLOYEE_RATE')-(0.047+0.0155+0.001+0.0015))<1e-12,run('ES_SS_EMPLOYEE_RATE'));
ok('helper: 1,000 -> 65; junk input -> 0',Math.abs(run('calcSpainEmployeeSS(1000)')-65)<1e-9&&run('calcSpainEmployeeSS(-5)')===0&&run('calcSpainEmployeeSS("x")')===0);
// payroll uses it: net = gross - SS - IRPF(gross - SS)
run(`state.country='ES';state.baseCurrency='EUR';state.displayCurrency='EUR';state.language='es';state.earners=[{id:1,name:'A',age:40,regime:'Cuenta Ajena',grossMonthly:3000,pjTaxRate:15,manualNetOverride:false}];`);
const net=run('calculateMetrics().totalEarnersNet');
const want=run('3000 - 3000*ES_SS_EMPLOYEE_RATE - calcSpainIRPF(3000 - 3000*ES_SS_EMPLOYEE_RATE)');
ok('payroll net = gross - SS - IRPF on the post-SS base',Math.abs(net-want)<1e-6,net.toFixed(2)+' vs '+want.toFixed(2));
// pension-plan estimate uses the SAME helper (low earner so the 30% limit, not EUR 1,500, is what binds)
run(`state.earners=[{id:1,name:'A',age:40,regime:'Cuenta Ajena',grossMonthly:400,pjTaxRate:15}];`);
const cap=run('calcSpainPensionPlan().ceilingAnnual');
ok('pension-plan limit = 30% of (gross - SS) x 12',Math.abs(cap-0.30*(400-400*0.065)*12)<1e-6,cap.toFixed(4));
// self-employed pay no employee SS in this model
run(`state.earners=[{id:1,name:'A',age:40,regime:'Autónomo',grossMonthly:400,pjTaxRate:15}];`);
ok('self-employed: no employee SS deducted in the pension-plan base',Math.abs(run('calcSpainPensionPlan().ceilingAnnual')-Math.min(1500,0.30*400*12))<1e-6);
// ---------- maximum contribution base (EUR 5,101.20/month in 2026, BOE-A-2026-7296) ----------
const CAP=run('ES_SS_MAX_BASE_MONTHLY');
ok('cap constant is 5,101.20',CAP===5101.20);
ok('below the cap: full rate applies',Math.abs(run('calcSpainEmployeeSS(5000)')-5000*0.065)<1e-9);
ok('exactly at the cap = cap x rate',Math.abs(run('calcSpainEmployeeSS(5101.20)')-5101.20*0.065)<1e-9);
ok('above the cap: contribution stops growing (8,000 and 20,000 pay the same as 5,101.20)',Math.abs(run('calcSpainEmployeeSS(8000)')-5101.20*0.065)<1e-9&&Math.abs(run('calcSpainEmployeeSS(20000)')-run('calcSpainEmployeeSS(5101.20)'))<1e-9,run('calcSpainEmployeeSS(8000)').toFixed(3));
// ---------- fixed-term contract (unemployment 1.60% instead of 1.55% => 6.55%) ----------
ok('fixed-term: 3,000 -> 6.55% = 196.50 (permanent = 195.00)',Math.abs(run('calcSpainEmployeeSS(3000,true)')-196.5)<1e-9&&Math.abs(run('calcSpainEmployeeSS(3000,false)')-195)<1e-9);
ok('fixed-term and cap combine: 8,000 -> 5,101.20 x 6.55%',Math.abs(run('calcSpainEmployeeSS(8000,true)')-5101.20*0.0655)<1e-9);
// ---------- payroll: high earner and fixed-term earner ----------
const netOf=(gross,ft)=>{run(`state.country='ES';state.baseCurrency='EUR';state.earners=[{id:1,name:'A',age:40,regime:'Cuenta Ajena',grossMonthly:${gross},esFixedTerm:${ft},pjTaxRate:15,manualNetOverride:false}];`);return run('calculateMetrics().totalEarnersNet')};
const wantNet=(gross,ft)=>run(`(()=>{const ss=calcSpainEmployeeSS(${gross},${ft});return ${gross}-ss-calcSpainIRPF(${gross}-ss)})()`);
ok('payroll, 8,000 gross (above cap): net = gross - capped SS - IRPF',Math.abs(netOf(8000,false)-wantNet(8000,false))<1e-6,netOf(8000,false).toFixed(2));
const oldSS=8000*0.065, newSS=run('calcSpainEmployeeSS(8000)');
ok(`payroll, 8,000 gross: SS is now ${newSS.toFixed(2)} instead of the uncapped ${oldSS.toFixed(2)}`,newSS<oldSS-150,(oldSS-newSS).toFixed(2)+' less per month');
ok('payroll, fixed-term earner nets less than a permanent one on the same pay',netOf(3000,true)<netOf(3000,false)&&Math.abs(netOf(3000,true)-wantNet(3000,true))<1e-6);
// pension-plan estimate reads the same contract flag (low earner so the 30% limit is what binds)
run(`state.earners=[{id:1,name:'A',age:40,regime:'Cuenta Ajena',grossMonthly:400,esFixedTerm:true,pjTaxRate:15}];`);
ok('pension-plan limit uses the fixed-term rate too',Math.abs(run('calcSpainPensionPlan().ceilingAnnual')-0.30*(400-400*0.0655)*12)<1e-6);
// ---------- saved data: the new field is sanitized ----------
const ft=v=>run(`migrateAndSanitizeState({country:'ES',earners:[{id:1,name:'A',regime:'Cuenta Ajena',grossMonthly:3000,esFixedTerm:${JSON.stringify(v)}}]}).earners[0].esFixedTerm`);
ok('sanitizer: true / "true" kept, missing / junk -> false',ft(true)===true&&ft('true')===true&&ft(undefined)===false&&ft('yes')===false&&ft(1)===false);
ok('old profiles without the field load as permanent contracts',run(`migrateAndSanitizeState({country:'ES',earners:[{id:1,name:'A',regime:'Cuenta Ajena',grossMonthly:3000}]}).earners[0].esFixedTerm`)===false);
// ---------- the earner card ----------
const card=(country,regime,gross,lang)=>{run(`state=migrateAndSanitizeState({country:'${country}',language:'${lang}',baseCurrency:'${country==='ES'?'EUR':country==='BR'?'BRL':'USD'}',earners:[{id:1,name:'A',regime:'${regime}',grossMonthly:${gross}}]});state.language='${lang}';syncFormInputsFromState();`);const box=require('../harness.js').els['container-earners-list'];box.children.length=0;run('updateUI()');return box.children.map(c=>c.innerHTML).join(' ')};
const es3=card('ES','Cuenta Ajena',3000,'en');
ok('Spain employee: fixed-term checkbox is shown, no cap note below the cap',/esFixedTerm/.test(es3)&&/Fixed-term contract \(unemployment 1\.60%\)/.test(es3)&&!/Contributions are capped/.test(es3));
const es8=card('ES','Cuenta Ajena',8000,'en');
ok('Spain employee above the cap: note explains the cap (with the amount and year)',/capped at the maximum base of[^<]*5\.101,20[^<]*\(2026\)/.test(es8),(es8.match(/capped[^<]*/)||[''])[0]);
ok('the note is translated (es)',/limitada a la base máxima/.test(card('ES','Cuenta Ajena',8000,'es')));
ok('Spain self-employed: no employee contract checkbox',!/esFixedTerm/.test(card('ES','Autónomo',8000,'en')));
ok('Brazil and Global: no Spain-only controls',!/esFixedTerm/.test(card('BR','CLT',8000,'en'))&&!/esFixedTerm/.test(card('GL','Employee',8000,'en')));
process.exitCode=bad?1:0;
