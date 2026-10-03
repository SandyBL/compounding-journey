const {run,els,sb}=require('../harness.js');
const J=JSON.stringify;
const ok=(l,c,extra)=>console.log((c?'PASS ':'FAIL ')+l+(extra!==undefined?'  -> '+extra:''));
// ---- 1. converting a saved Portuguese profile ----
const legacy={schemaVersion:3,country:'PT',language:'pt',baseCurrency:'EUR',wizardCompleted:true,ptRentalTaxRatePct:25,
 earners:[{id:1,name:'Ana',age:40,regime:'Trabalhador por Conta de Outrem',grossMonthly:3000,pjTaxRate:6},{id:2,name:'Rui',age:45,regime:'Trabalhador Independente',grossMonthly:2500,pjTaxRate:20}],
 liquidInvestments:[{id:9,name:'PPR',currency:'EUR',balanceOriginal:30000,annualYieldPct:4,accountType:'ppr',contributedThisYear:1000,contributionYear:new Date().getFullYear()}],
 realEstate:[{id:5,name:'Casa',currency:'EUR',marketValue:200000,mortgageDebt:0,monthlyRentInflow:800}]};
// what the OLD Portuguese formula gave for Ana (3000 gross): SS 11% + IRS
const oldNet=run(`(()=>{const g=3000;return g-g*0.11-legacyPortugalIRS(g)})()`);
run(`state=migrateAndSanitizeState(${J(legacy)});`);
const m=JSON.parse(run(`JSON.stringify({country:state.country,base:state.baseCurrency,r0:state.earners[0].regime,rate0:state.earners[0].pjTaxRate,r1:state.earners[1].regime,rate1:state.earners[1].pjTaxRate,acct:state.liquidInvestments[0].accountType,rent:state.glRentalTaxRatePct})`));
ok('country PT -> GL, currency kept',m.country==='GL'&&m.base==='EUR',JSON.stringify(m));
ok('employee/self-employed regimes converted',m.r0==='Employee'&&m.r1==='Self-employed');
const newNet=run(`calculateMetrics().earnerNets?calculateMetrics().earnerNets[0]:null`);
const net0=run(`(()=>{const g=3000;return g*(1-state.earners[0].pjTaxRate/100)})()`);
ok('Ana\'s take-home is preserved by the conversion',Math.abs(net0-oldNet)<3,`old ${oldNet.toFixed(2)} vs new ${net0.toFixed(2)}  (effective rate ${m.rate0}%)`);
ok('self-employed keeps their own rate',m.rate1===20);
ok('PPR account -> generic tax-advantaged account, rental rate carried over',m.acct==='tax_deferred'&&m.rent===25);
// ---- 2. Global mode renders every tab ----
for(const k of Object.keys(els)) if(els[k].children) els[k].children.length=0;
run(`state.language='en';syncFormInputsFromState();applyTranslations();syncHeaderCountry();updateUI();`);
ok('header shows Global + chosen currency',els['header-jurisdiction'].innerText==='Global (EUR)'&&els['header-flag'].innerText==='🌐',els['header-jurisdiction'].innerText);
ok('base-currency row visible only for Global (profile modal)',els['row-gl-base-currency']._hidden===false);
ok('Global tax settings row shown; BR dependents row hidden',els['row-gl-tax-settings']._hidden===false&&els['row-br-extra-dependents']._hidden===true);
ok('rental-rate row: GL shown, ES hidden',els['row-rental-tax-gl']._hidden===false&&els['row-rental-tax-es']._hidden===true);
const taxTxt=(els['container-tax-study-content'].innerHTML||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
ok('Tax Planning renders the Global view',/Annual Gross Income/.test(taxTxt)&&/How to think about tax planning in any country/.test(taxTxt),taxTxt.slice(0,110));
ok('no Brazil/Spain-specific terms leak into the Global tax view',!/PGBL|IRPF|Plan de Pensiones|INSS/.test(taxTxt));
// generic retirement-account progress
run(`state.glRetirementAnnualLimit=10000;state.glMarginalTaxRatePct=30;state.liquidInvestments[0].contributedThisYear=4000;state.liquidInvestments[0].contributionYear=new Date().getFullYear();updateUI();`);
const t2=(els['container-tax-study-content'].innerHTML||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
ok('limit 10,000 @30%: potential savings 3,000; contributions 4,000 tracked',/3\.000|3,000/.test(t2)&&/4\.000|4,000/.test(t2),t2.match(/Potential Tax Savings[^A-Z]{0,30}/)+'');
// earner card in Global shows the rate for employees, not a Brazilian benefit
const card=els['container-earners-list'].children.map(c=>c.innerHTML).join('');
ok('earner card: Global employee shows effective-tax-rate field',/pjTaxRate/.test(card)&&/Effective tax rate/.test(card)&&!/foodVoucher/.test(card));
ok('regime dropdown is translated (Employee / Self-employed)',/>Employee<\/option>/.test(card)&&/Self-employed \/ contractor/.test(card));
// succession default + note
const est=(els['lbl-est-country-note'].innerText||'');
ok('succession: Global note + 5% placeholder',/Global mode/.test(est)&&run(`getDefaultSuccessionTaxRate('GL')`)===5,est.slice(0,50));
// ---- 3. rental tax in Global ----
run(`state.glRentalTaxRatePct=20`);ok('rental tax 800 @20% = 160',run(`calcRentalIncomeTax(800,'GL')`)===160);
// ---- 4. wizard ----
run(`setWizardCountry('GL')`);ok('wizard: currency picker appears for Global',els['wiz-gl-currency-row']._hidden===false);
run(`setWizardCountry('BR')`);ok('wizard: ...and hides for Brazil',els['wiz-gl-currency-row']._hidden===true);
run("document.getElementById('wiz-gl-currency').value='EUR'");
sb.navigator.language='en-US';run(`state.languageUserChosen=false;state.wizardCompleted=false;wizardSelectedCountry='GL';proceedFinishSetupWizard();`);
const w=JSON.parse(run(`JSON.stringify({c:state.country,b:state.baseCurrency,l:state.language,infl:state.inflationRate,rate:state.earners[0].pjTaxRate,reg:state.earners[0].regime,yield:state.liquidInvestments.length?state.liquidInvestments[0].annualYieldPct:null,fx:state.fxRates})`));
ok('wizard(Global, EUR, English browser): country/base/language/defaults',w.c==='GL'&&w.b==='EUR'&&w.l==='en'&&w.infl===2.5&&w.rate===25,JSON.stringify(w));
// profile modal: switching to Global from Brazil
run(`state.wizardCompleted=false;state.country='BR';state.baseCurrency='BRL';proceedSetProfileCountry('GL')`);
ok('switching BR -> Global sets USD base',run('state.country')==='GL'&&run('state.baseCurrency')==='USD');
run(`state.wizardCompleted=false;setGlobalBaseCurrency('EUR')`);ok('Global base currency can be changed (EUR)',run('state.baseCurrency')==='EUR'&&run('state.displayCurrency')==='EUR');
// ---- 5. sanitizer / import ----
ok('sanitizer accepts GL, rejects unknown countries (-> BR)',run(`migrateAndSanitizeState({country:'GL'}).country`)==='GL'&&run(`migrateAndSanitizeState({country:'FR'}).country`)==='BR');
const gl=JSON.parse(run(`JSON.stringify(migrateAndSanitizeState({country:'GL'}))`));
ok('blank Global profile defaults: USD, 5 generic fields',gl.baseCurrency==='USD'&&gl.glRentalTaxRatePct===20&&gl.glMarginalTaxRatePct===25&&gl.glRetirementAnnualLimit===0);
// ---- 6. payroll flat rate incl. 0% ----
run(`state.country='GL';state.baseCurrency='USD';state.earners=[{id:1,name:'A',age:30,regime:'Employee',grossMonthly:10000,pjTaxRate:30},{id:2,name:'B',age:30,regime:'Self-employed',grossMonthly:5000,pjTaxRate:0}];`);
const nets=JSON.parse(run(`JSON.stringify([state.earners.map(e=>{const p=e;const gross=e.grossMonthly;return gross})])`));
const tot=run(`calculateMetrics().totalEarnersNet`);ok('payroll: 10,000@30% + 5,000@0% = 12,000 net',Math.abs(tot-12000)<0.01,tot);

// ================= Profile button clarity (header) =================
// The person reported the header button looked like a plain "country/jurisdiction"
// info pill, with nothing signaling it opens a full Profile & Settings panel
// (including App Lock). Fixed with a leading person icon, a bolder border, a
// hover tooltip, and moving it to the rightmost header position.
{
  const {run,els}=require('../harness.js');
  const load=()=>run("state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.language='en';syncFormInputsFromState();updateUI();");
  load();
  const fs=require('fs'),path=require('path');
  const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
  ok('markup: the profile button has a leading person icon (👤), not just a flag', /onclick="openProfileModal\(\)"[^>]*>\s*<span[^>]*>👤<\/span>/.test(page));
  ok('markup: the profile button is visually distinguished (a 2px border), not identical to the plain info pills next to it', /onclick="openProfileModal\(\)"[^>]*border-2 border-gold/.test(page));
  ok('the profile button has a real, non-empty tooltip', els['header-jurisdiction'].parentElement.title.length>10);
  run("state.language='es';applyTranslations();");
  ok('...and the tooltip is translated, not stuck in Portuguese', els['header-jurisdiction'].parentElement.title!=='' && /Configuración/.test(els['header-jurisdiction'].parentElement.title));
  run("state.language='pt';applyTranslations();");
  ok('markup: the profile button is now the LAST (rightmost) control in the header, where people expect a profile button', page.indexOf('onclick="openProfileModal()"') > page.indexOf('onclick="prepareAndPrint()"'));
}

// ================= Tab-grouping divider survives a real tab switch (UI/UX audit) =================
// Found by the UI/UX audit: switchTab() used to reset every .tab-btn's className to one
// fixed string, silently destroying the grouping divider (border-l, marked
// data-group-start="true" in the HTML) the very first time any tab was clicked — so the
// visual grouping matching this file's own "snapshot / day-to-day money / planning"
// comments was only ever visible for the first few seconds of a session.
{
  const fs=require('fs'),path=require('path');
  const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
  ok('markup: exactly 2 tab buttons are marked as the start of a new group (Cash Flow, Taxes), matching the 3-way grouping in the code comments', (page.match(/data-group-start="true"/g)||[]).length===2);
  ok("switchTab() reads the marker and conditionally re-applies the divider class, instead of a single fixed className for every button", /el\.dataset && el\.dataset\.groupStart === 'true' \? ' border-l border-slate-700\/60' : ''/.test(page));
  ok('the divider-preserving reset happens for EVERY .tab-btn before the active one is specially highlighted (order matters: a later blanket reset would re-wipe it)', page.indexOf('el.className = "tab-btn')<page.indexOf('activeBtn.className'));
}
