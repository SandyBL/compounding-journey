const {run,els}=require('../harness.js');
const P='"><img src=x onerror=alert(1)>';
const inject=`
 const P=${JSON.stringify(P)};
 state.country='BR';state.language='pt';state.baseCurrency='BRL';state.displayCurrency='BRL';
 state.earners=[{id:1,name:P,role:P,age:35,regime:'CLT',grossMonthly:9000,pjTaxRate:6},{id:2,name:P,role:P,age:33,regime:P,grossMonthly:5000,pjTaxRate:6,pjCompanyType:P,proLaborePct:28}];
 state.children=[{id:3,name:P,age:7,schoolMonthly:2000,collegeMonthly:3000,independenceAge:23}];
 state.goals=[{id:4,name:P,targetAmount:1000,currentSaved:10,timeValue:5,timeUnit:P}];
 state.realEstate=[{id:5,name:P,currency:P,marketValue:100,mortgageDebt:10,monthlyRentInflow:5}];
 state.liquidInvestments=[{id:6,name:P,currency:P,balanceOriginal:100,annualYieldPct:5,liquidityTier:P,volatilityTier:P,accountType:P,isEmergencyReserve:false}];
 state.equityGrants=[{id:7,name:P,currency:P,vestedValue:1,unvestedValue:1}];
 state.monthlySnapshots=[{id:8,date:P,time:P,label:P,netWorth:1,liquidInvestments:1,totalDebts:1,totalAssets:1,savingsRate:1,isManual:true}];
 state.estateSettings.guardianName=P;state.children[0].age=7;
 updateUI();`;
for(const k of Object.keys(els)){ if(els[k].children) els[k].children.length=0; }
run(inject);
// also the print summary
run('window.renderPrintSummary(calculateMetrics())');
const hits=[];
function scan(id,el){ const parts=[el.innerHTML||'',...(el.children||[]).map(c=>c.innerHTML||'')]; parts.forEach(p=>{ if(p.includes('<img src=x')) hits.push(id); }); }
for(const [id,el] of Object.entries(els)) scan(id,el);
console.log('elements containing an UNESCAPED payload:',[...new Set(hits)]);
// find which render output(s) contain the raw payload
for(const id of [...new Set(hits)]){const el=els[id];const all=[el.innerHTML||'',...(el.children||[]).map(c=>c.innerHTML||'')].join('\n');const at=all.indexOf('<img src=x');console.log('\n['+id+'] ...'+all.slice(Math.max(0,at-120),at+60).replace(/\s+/g,' '));}
// prove the payload reached the renderers (should appear ESCAPED)
const escapedSeen=Object.entries(els).filter(([id,el])=>[el.innerHTML||'',...(el.children||[]).map(c=>c.innerHTML||'')].some(p=>p.includes('&lt;img src=x'))).map(([id])=>id);
console.log('\nelements where the payload appears ESCAPED (proves it was rendered):',escapedSeen.length,escapedSeen.slice(0,12));
