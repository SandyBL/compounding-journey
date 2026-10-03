const {run,els}=require('../harness.js');
const J=(o)=>JSON.stringify(o);
const cls=(o)=>run(`(()=>{const v=classifyBackupFile(${J(o)});return v.ok?('OK'+(v.legacy?' (legacy)':'')):('REJECT '+v.reason)})()`);
console.log('--- which files are accepted ---');
console.log('{}                          ->',cls({}));
console.log('[]                          ->',cls([]));
console.log('{schemaVersion:3} only      ->',cls({schemaVersion:3}));
console.log('{app:"other-app",...}       ->',cls({app:'other-app',schemaVersion:3,data:{}}));
console.log('marker, no data             ->',cls({app:'compounding-journey-family',schemaVersion:3}));
console.log('marker, newer schema        ->',cls({app:'compounding-journey-family',schemaVersion:99,data:{}}));
console.log('marker + data               ->',cls({app:'compounding-journey-family',schemaVersion:3,data:{country:'BR'}}));
const demo=run('JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE))');
console.log('legacy: full pre-marker export ->',cls(demo));
console.log('random JSON {a:1,b:[1,2]}   ->',cls({a:1,b:[1,2]}));
// ---- round trip: export payload -> classify -> migrate must keep every key/value ----
function deepDiff(a,b,path,out){ if(a&&typeof a==='object'&&!Array.isArray(a)){ for(const k of Object.keys(a)){ if(!b||!(k in b)){out.push('DROPPED '+path+k);continue} deepDiff(a[k],b[k],path+k+'.',out)} } else if(Array.isArray(a)){ if(!Array.isArray(b)||a.length!==b.length) out.push('LEN '+path); else a.forEach((x,i)=>deepDiff(x,b[i],path+i+'.',out)) } else if(a!==b) out.push('CHANGED '+path+' '+JSON.stringify(a)+' -> '+JSON.stringify(b)); }
function roundTrip(label,stateJson){
  run(`state=migrateAndSanitizeState(${stateJson});`);
  const payload=JSON.parse(run(`JSON.stringify(buildExportPayload())`));
  const back=JSON.parse(run(`JSON.stringify(migrateAndSanitizeState(classifyBackupFile(${J(payload)}).raw))`));
  const before=JSON.parse(run('JSON.stringify(state)'));
  const d=[];deepDiff(before,back,'',d);
  console.log(label,'-> envelope app:',payload.app,'| exportFormat:',payload.exportFormat,'| round-trip differences:',d.length,d.slice(0,5));
}
roundTrip('demo profile      ',J(demo));
roundTrip('blank profile     ',run('JSON.stringify(DEFAULT_BLANK_STATE)'));
// sanitizing the built-in profiles must not lose ANY field they define
for(const [label,src] of [['EXAMPLE_DEMO_STATE','EXAMPLE_DEMO_STATE'],['DEFAULT_BLANK_STATE','DEFAULT_BLANK_STATE']]){
  const orig=JSON.parse(run(`JSON.stringify(${src})`));const san=JSON.parse(run(`JSON.stringify(migrateAndSanitizeState(${src}))`));
  const d=[];deepDiff(orig,san,'',d);console.log(label,'through sanitizer: dropped/changed fields:',d.length,d.slice(0,8));
}
// ---- hostile file ----
const hostile={app:'compounding-journey-family',schemaVersion:3,data:JSON.parse('{"__proto__":{"polluted":1},"country":"XX","language":"<script>","baseCurrency":"DOGE","inflationRate":"abc","targetSavingsRate":"25","unknownField":{"a":1},'+
 '"earners":[{"id":"1);alert(1);//","name":"<img src=x onerror=alert(1)>","age":"forty","regime":"HACK","grossMonthly":"12000","pjTaxRate":{"x":1},"__proto__":{"admin":true}},{"id":"1);alert(1);//","name":"dup id","grossMonthly":-5000}],'+
 '"liquidInvestments":[{"id":7,"name":"x","currency":"\\"><b>","balanceOriginal":"250000","annualYieldPct":"9,5","accountType":"evil","liquidityTier":"x","isEmergencyReserve":"yes"}],'+
 '"debts":{"revolving":"1e3","autoLoans":{"a":1},"extra":5},"outflows":{"housing":"3000","injected":1},'+
 '"goals":"notanarray","monthlySnapshots":[{"date":"not-a-date"},{"date":"2026-03-01","netWorth":"5000","label":"ok"}]}')};
const v=JSON.parse(run(`JSON.stringify(migrateAndSanitizeState(classifyBackupFile(${J(hostile)}).raw))`));
console.log('\n--- hostile file after sanitizing ---');
console.log('country/language/baseCurrency:',v.country,v.language,v.baseCurrency,'| inflation (bad string -> default):',v.inflationRate,'| savings target ("25" -> number):',v.targetSavingsRate,typeof v.targetSavingsRate);
console.log('unknown fields dropped:',!('unknownField' in v),!('polluted' in v),'| prototype left untouched (true = safe):',({}).polluted===undefined && ({}).admin===undefined);
console.log('earner ids are numbers & unique:',v.earners.map(e=>typeof e.id+':'+e.id).join(' , ').slice(0,80),'| distinct:',new Set(v.earners.map(e=>e.id)).size===v.earners.length);
console.log('earner 0:',JSON.stringify({age:v.earners[0].age,regime:v.earners[0].regime,gross:v.earners[0].grossMonthly,pj:v.earners[0].pjTaxRate}),'| name kept as plain text (escaped at render):',v.earners[0].name.slice(0,20));
console.log('negative gross clamped to 0:',v.earners[1].grossMonthly);
console.log('liquid inv:',JSON.stringify({cur:v.liquidInvestments[0].currency,bal:v.liquidInvestments[0].balanceOriginal,yield:v.liquidInvestments[0].annualYieldPct,acct:v.liquidInvestments[0].accountType,tier:v.liquidInvestments[0].liquidityTier,reserve:v.liquidInvestments[0].isEmergencyReserve}));
console.log('debts:',JSON.stringify(v.debts),'| outflows.housing:',v.outflows.housing,'injected key gone:',!('injected' in v.outflows));
console.log('goals (string -> []):',JSON.stringify(v.goals),'| snapshots (bad date dropped):',v.monthlySnapshots.length,v.monthlySnapshots[0]&&v.monthlySnapshots[0].netWorth);
// size limits
const big={app:'compounding-journey-family',schemaVersion:3,data:{earners:Array.from({length:500},(_,i)=>({id:i+1,name:'e'+i}))}};
console.log('500 earners in file -> kept:',JSON.parse(run(`JSON.stringify(migrateAndSanitizeState(classifyBackupFile(${J(big)}).raw).earners.length)`)),'(cap 50)');
// loading the app after sanitizer changes
run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));syncFormInputsFromState();updateUI();`);
console.log('\nrender after import of demo profile OK; net worth label:',els['lbl-dash-networth']&&els['lbl-dash-networth'].innerText);
