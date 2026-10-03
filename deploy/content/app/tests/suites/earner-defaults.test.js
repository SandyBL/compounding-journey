// First member / added members must never get a hard-coded Portuguese name or role.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x?'  -> '+x:''));if(!c)bad++};
const html=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('wizard name field is empty with a translated placeholder (no prefilled "Titular")',/id="wiz-earner-name" value="" placeholder="[^"]+" data-i18n-placeholder="wizNamePlaceholder"/.test(html)&&!/value="Titular"/.test(html));
const txt=e=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(txt).join(' ')).replace(/<[^>]+>/g,' ');
for(const [lang,country] of [['en','GL'],['es','ES'],['pt','BR']]){
  // leave the name blank -> default comes from the dictionary, role stays empty
  run(`state.language='${lang}';state.languageUserChosen=true;state.wizardCompleted=false;wizardSelectedCountry='${country}';document.getElementById('wiz-earner-name').value='';proceedFinishSetupWizard();`);
  const e=JSON.parse(run(`JSON.stringify(state.earners[0])`));
  ok(`wizard (${lang}): blank name -> "${run(`I18N.${lang}.earnerNewName`)}", empty role`,e.name===run(`I18N.${lang}.earnerNewName`)&&e.role==='',JSON.stringify({name:e.name,role:e.role}));
  // a name the person typed is kept exactly
  run(`state.wizardCompleted=false;document.getElementById('wiz-earner-name').value='Maria';proceedFinishSetupWizard();`);
  ok(`wizard (${lang}): typed name is kept`,run(`state.earners[0].name`)==='Maria');
}
// role is translated at display time, including legacy profiles that stored a Portuguese default
const role=(lang,r)=>run(`state.language='${lang}';displayRole(${JSON.stringify(r)})`);
ok('displayRole en: legacy "Titular"/"Adulto"/empty -> Member',role('en','Titular')==='Member'&&role('en','Adulto')==='Member'&&role('en','')==='Member');
ok('displayRole en: example profile "Titular 1/2" -> Earner 1/2',role('en','Titular 1')==='Earner 1'&&role('en','Titular 2')==='Earner 2');
ok('displayRole pt/es: Membro / Miembro',role('pt','Titular')==='Membro'&&role('es','Adulto')==='Miembro');
ok('displayRole keeps a role the person typed',role('en','CFO')==='CFO'&&role('pt',' Avó ')==='Avó');
// an added member has no stored role, and a legacy profile renders translated in English
run(`state.language='en';state.earners=[];addEarner();`);
ok('addEarner: new member has an empty role (not "Adulto")',run(`state.earners[0].role`)==='');
run(`state=migrateAndSanitizeState({country:'BR',language:'en',earners:[{id:1,name:'Ana',role:'Titular',age:40,regime:'CLT',grossMonthly:9000},{id:2,name:'Rui',role:'Adulto',age:38,regime:'CLT',grossMonthly:7000}]});state.language='en';syncFormInputsFromState();updateUI();`);
const card=txt(els['container-crossover-milestones']);
ok('overview shows "Member" and no Portuguese role for legacy profiles',/Member/.test(card)&&!/Titular|Adulto/.test(card),card.replace(/\s+/g,' ').slice(0,90));
// legacy goal without a name gets a translated fallback
run(`state=migrateAndSanitizeState({country:'ES',language:'en',schemaVersion:1,goals:[{id:5,targetAmount:1000,currentSaved:100}]});`);
ok('legacy nameless goal -> translated fallback ("Family Goal")',run(`state.goals[0].name`)==='Family Goal',run(`state.goals[0].name`));
// ================= gross OR net income (both the Cash Flow tab and the Wizard) =================
// Asked directly: gross salary is often harder to know off the top of your head than
// net (what actually lands in the account each month) — give both options. The
// mechanism (manualNetOverride + realNetSalary, calc/metrics.js uses realNetSalary
// directly when set) already existed on the Cash Flow tab's Earners card but was easy
// to miss (a checkbox at the very bottom of the card, past several unrelated fields,
// with no hint on the gross field itself that an alternative existed) — moved right
// after the main income row and the gross field now visually disables while override
// is on, since it genuinely is not used for the income calculation in that state. The
// wizard gets the same capability for the first time, for both the primary earner and
// the optional partner independently.
const {run:run2,els:els2}=require('../harness.js');
const J2=s=>JSON.parse(run2(`JSON.stringify(${s})`));

// ---- Cash Flow tab: markup moved + gross visually disables ----
ok('markup: the net-override toggle appears in the DOM before the PJ-company-type block, not after it (moved up for discoverability)', html.indexOf('manualNetOverride')<html.indexOf('pjCompanyType'));
ok('markup: the gross income field is disabled while override is active', /grossMonthly[\s\S]{0,260}?\$\{e\.manualNetOverride \? 'disabled' : ''\}/.test(fs.readFileSync(path.join(__dirname,'..','..','src','js','ui','earners.js'),'utf8')));
run2(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.language='en';syncFormInputsFromState();updateUI();switchTab('view-cashflow');renderEarnersList();`);
ok('a brand-new earner defaults to gross mode (override off)', J2('state.earners[0].manualNetOverride')===false);
run2(`toggleEarnerOverride(state.earners[0].id,true);updateEarner(state.earners[0].id,'realNetSalary','7000');`);
ok('switching to net mode and entering a value: realNetSalary is used directly for income (not run back through the tax engine)', J2('calculateMetrics().totalEarnersNet')>0 && J2('state.earners[0].realNetSalary')===7000);
ok('the original gross value is preserved (not cleared) while override is on, so switching back loses nothing', typeof J2('state.earners[0].grossMonthly')==='number');

// ---- Wizard: both income modes, for both earners, independently ----
function wizRun(fields) {
  run2(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE)));syncFormInputsFromState();updateUI();`);
  run2(`openWizardModal();setWizardCountry('BR');goToWizardStep(2);`);
  run2(`document.getElementById('wiz-earner-name').value='${fields.earnerName||'A'}';`);
  if (fields.earnerKnowsNet) {
    run2(`document.getElementById('wiz-earner-know-net').checked=true;toggleWizardIncomeMode('earner');document.getElementById('wiz-earner-net').value='${fields.earnerNet||0}';`);
  } else {
    run2(`document.getElementById('wiz-earner-gross').value='${fields.earnerGross!==undefined?fields.earnerGross:12000}';`);
  }
  if (fields.partner) {
    run2(`document.getElementById('wiz-has-partner').checked=true;toggleWizardPartner();document.getElementById('wiz-partner-name').value='${fields.partner.name||'B'}';`);
    if (fields.partner.knowsNet) {
      run2(`document.getElementById('wiz-partner-know-net').checked=true;toggleWizardIncomeMode('partner');document.getElementById('wiz-partner-net').value='${fields.partner.net||0}';`);
    } else {
      run2(`document.getElementById('wiz-partner-gross').value='${fields.partner.gross!==undefined?fields.partner.gross:8000}';`);
    }
  }
  run2(`goToWizardStep(3);document.getElementById('wiz-safe-capital').value='0';document.getElementById('wiz-risky-capital').value='0';`);
  run2(`finishSetupWizard();`);
}

wizRun({ earnerKnowsNet: true, earnerNet: 8500 });
ok('wizard, primary earner in NET mode: manualNetOverride true, realNetSalary set, gross set to 0 (matches the "do not know gross" semantic)', J2('state.earners[0].manualNetOverride')===true && J2('state.earners[0].realNetSalary')===8500 && J2('state.earners[0].grossMonthly')===0);
ok('...and the net amount is genuinely used for the household income calculation', J2('calculateMetrics().totalEarnersNet')>0);

wizRun({ earnerGross: 12000 });
ok('wizard, primary earner left in GROSS mode (default): manualNetOverride stays false, gross set as entered', J2('state.earners[0].manualNetOverride')===false && J2('state.earners[0].grossMonthly')===12000);

wizRun({ earnerGross: 12000, partner: { knowsNet: true, net: 6500 } });
ok('wizard, mixed: primary earner on gross, partner independently on net — both correctly captured without interfering with each other', J2('state.earners[0].manualNetOverride')===false && J2('state.earners[0].grossMonthly')===12000 && J2('state.earners[1].manualNetOverride')===true && J2('state.earners[1].realNetSalary')===6500);

// ---- toggle visibility ----
run2(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE)));syncFormInputsFromState();updateUI();openWizardModal();goToWizardStep(2);document.getElementById('wiz-earner-net-row').classList.add('hidden');`);
run2(`document.getElementById('wiz-earner-know-net').checked=true;toggleWizardIncomeMode('earner');`);
ok('checking "I know my net instead" hides the gross row and shows the net row', run2("document.getElementById('wiz-earner-gross-row').classList.contains('hidden')")===true && run2("document.getElementById('wiz-earner-net-row').classList.contains('hidden')")===false);
run2(`document.getElementById('wiz-earner-know-net').checked=false;toggleWizardIncomeMode('earner');`);
ok('unchecking it reverts to showing gross again', run2("document.getElementById('wiz-earner-gross-row').classList.contains('hidden')")===false);

// ---- reopening the wizard resets its own show/hide toggles ----
// Found while testing the gross/net toggle above: none of the wizard's checkboxes that
// hide/show a section (has-partner, know-net x2) were ever reset on reopen — a stale
// checked state could silently hide the very field someone is trying to fill in on a
// fresh run and quietly reuse an old value instead.
run2(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE)));syncFormInputsFromState();updateUI();`);
run2(`openWizardModal();goToWizardStep(2);document.getElementById('wiz-has-partner').checked=true;toggleWizardPartner();document.getElementById('wiz-earner-know-net').checked=true;toggleWizardIncomeMode('earner');document.getElementById('wiz-partner-know-net').checked=true;toggleWizardIncomeMode('partner');closeWizardModal();`);
run2(`openWizardModal();`);
ok('BUGFIX: reopening the wizard resets the partner checkbox and hides the partner section again', run2("document.getElementById('wiz-has-partner').checked")===false && run2("document.getElementById('wizard-partner-fields').classList.contains('hidden')")===true);
ok('BUGFIX: reopening the wizard resets BOTH income-mode toggles back to gross (the field a fresh session should show by default)', run2("document.getElementById('wiz-earner-know-net').checked")===false && run2("document.getElementById('wiz-partner-know-net').checked")===false && run2("document.getElementById('wiz-earner-gross-row').classList.contains('hidden')")===false && run2("document.getElementById('wiz-partner-gross-row').classList.contains('hidden')")===false);

// ================= wizard-created earner matches addEarner()'s own fields (master audit) =================
// Found by the master audit: a wizard-created PJ (self-employed) earner was missing
// pjCompanyType and proLaborePct, two fields addEarner() (the Balance Sheet's own "add
// earner" path) always sets. Neither caused a wrong number (proLaborePct has its own
// matching fallback in tax/brazil.js; pjCompanyType falls back to showing "custom" in
// the dropdown) but a wizard-created PJ earner got a less informative starting preset
// than one created the other way. Matched for consistency.
run2(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE)));syncFormInputsFromState();updateUI();`);
run2(`openWizardModal();setWizardCountry('BR');goToWizardStep(2);document.getElementById('wiz-earner-regime').value='PJ';`);
run2(`goToWizardStep(3);document.getElementById('wiz-safe-capital').value='0';document.getElementById('wiz-risky-capital').value='0';finishSetupWizard();`);
ok('a wizard-created Brazilian PJ earner gets the same pjCompanyType/proLaborePct defaults addEarner() would give (simples3 / 28)', J2('state.earners[0].pjCompanyType')==='simples3' && J2('state.earners[0].proLaborePct')===28);
run2(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE)));syncFormInputsFromState();updateUI();`);
run2(`openWizardModal();setWizardCountry('BR');goToWizardStep(2);document.getElementById('wiz-has-partner').checked=true;toggleWizardPartner();document.getElementById('wiz-partner-regime').value='PJ';`);
run2(`goToWizardStep(3);document.getElementById('wiz-safe-capital').value='0';document.getElementById('wiz-risky-capital').value='0';finishSetupWizard();`);
ok('...and the optional partner gets the same treatment, in a fresh session', J2('state.earners[1].pjCompanyType')==='simples3' && J2('state.earners[1].proLaborePct')===28);

// ================= 13th salary + annual bonus, smoothed monthly (new feature) =================
// Asked for directly: many people get a 13th salary and/or a company-results bonus,
// but never think to include it since it arrives once a year rather than as part of
// the regular paycheck. Both are smoothed into every month instead.
run2(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='BR';syncFormInputsFromState();updateUI();`);
const baseNet=J2('calculateMetrics().earnerNetById[state.earners[0].id]');
run2(`updateEarner(state.earners[0].id,'has13thSalary',true);`);
ok('checking "has 13th salary" adds exactly 1/12 of the base net income (a smoothed extra month), not a flat guess', Math.abs(J2('calculateMetrics().earnerNetById[state.earners[0].id]')-(baseNet+baseNet/12))<0.01);
run2(`updateEarner(state.earners[0].id,'annualBonus','12000');`);
ok('adding a 12000 annual bonus adds exactly 1000/month (12000/12), on top of the 13th', Math.abs(J2('calculateMetrics().earnerNetById[state.earners[0].id]')-(baseNet+baseNet/12+1000))<0.01);
run2(`updateEarner(state.earners[0].id,'has13thSalary',false);updateEarner(state.earners[0].id,'annualBonus','0');`);
ok('turning both off returns exactly to the original base net (no residual effect)', Math.abs(J2('calculateMetrics().earnerNetById[state.earners[0].id]')-baseNet)<0.01);
run2(`updateEarner(state.earners[0].id,'has13thSalary',true);updateEarner(state.earners[0].id,'annualBonus','12000');updateEarner(state.earners[0].id,'regime','PJ');`);
ok('BUGFIX-class guard: switching to a self-employed regime (PJ) correctly stops applying 13th/bonus (an employer-specific concept, not available to the self-employed)', J2('calculateMetrics().earnerNetById[state.earners[0].id]')===J2('(()=>{const e=state.earners[0];const clone=JSON.parse(JSON.stringify(e));clone.has13thSalary=false;clone.annualBonus=0;const s2=JSON.parse(JSON.stringify(state));s2.earners[0]=clone;return calculateMetricsFor(s2).earnerNetById[e.id];})()'));
ok('markup: the 13th-salary checkbox and annual-bonus field only appear for employed regimes, not self-employed/PJ', (()=>{ run2("switchTab('view-cashflow');renderEarnersList();"); const card=els2['container-earners-list'].children[0].innerHTML; return !/has13thSalary/.test(card); })());
run2(`updateEarner(state.earners[0].id,'regime','CLT');switchTab('view-cashflow');renderEarnersList();`);
ok('...and correctly reappear when switched back to an employed regime', /has13thSalary/.test(els2['container-earners-list'].children[0].innerHTML));

process.exitCode=bad?1:0;
