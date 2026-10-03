const {run,els}=require('../harness.js');
const P='"><img src=x onerror=alert(1)>';
const file={app:'compounding-journey-family',schemaVersion:3,data:{country:'BR',language:'pt',baseCurrency:'BRL',wizardCompleted:true,
 earners:[{id:'1);alert(1);//',name:P,role:P,age:35,regime:'CLT',grossMonthly:9000},{id:"2'+alert(1)+'",name:P,age:30,regime:P,grossMonthly:5000}],
 children:[{id:'3);alert(1)',name:P,age:7,schoolMonthly:1000}],goals:[{id:'4);alert(1)',name:P,targetAmount:1000,timeValue:5,timeUnit:P}],
 realEstate:[{id:'5);alert(1)',name:P,currency:P,marketValue:1e5}],liquidInvestments:[{id:'6);alert(1)',name:P,currency:P,balanceOriginal:'100',accountType:P}],
 equityGrants:[{id:'7);alert(1)',name:P,currency:P}],monthlySnapshots:[{id:'8);alert(1)',date:'2026-01-05',time:P,label:P,netWorth:1}],
 estateSettings:{guardianName:P}}};
run(`(()=>{const v=classifyBackupFile(${JSON.stringify(file)});state=migrateAndSanitizeState(v.raw);syncFormInputsFromState();updateUI();window.renderPrintSummary(calculateMetrics());})()`);
const all=Object.values(els).flatMap(el=>[el.innerHTML||'',...(el.children||[]).map(c=>c.innerHTML||'')]).join('\n');
console.log('unescaped <img payload in any rendered HTML:',all.includes('<img src=x'));
console.log('injected id text ("alert(1)") reaches any onclick/handler:',/on\w+="[^"]*alert\(1\)/.test(all)||/\);alert\(1\)/.test(all));
console.log('payload rendered escaped (proves it was displayed):',all.includes('&lt;img src=x'));
console.log('ids after import:',run('[state.earners,state.children,state.goals,state.realEstate,state.liquidInvestments,state.equityGrants,state.monthlySnapshots].every(a=>a.every(x=>Number.isSafeInteger(x.id)&&x.id>0))'));
