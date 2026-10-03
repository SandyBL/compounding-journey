// Asked for directly: many employers cover some or all of a life insurance premium,
// so treating the FULL premium as a family cost overstates what the household
// actually pays out of pocket. Only life insurance is reduced this way (disability/
// health/property premiums weren't part of the request, and employer-paid health or
// disability coverage typically works differently — often a straight benefit rather
// than a percentage of a premium the family would otherwise pay).
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const load=()=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.language='en';syncFormInputsFromState();updateUI();`);

load();
run(`state.insurance.lifeInsuranceMonthlyPremium=200;state.insurance.lifeInsuranceEmployerCoveragePct=0;updateUI();`);
ok('0% employer coverage (the default): family pays the full premium, unchanged from the old behavior', J('calculateMetrics().lifeInsuranceFamilyShare')===200);

run(`state.insurance.lifeInsuranceEmployerCoveragePct=50;updateUI();`);
ok('50% employer coverage: family pays exactly half', J('calculateMetrics().lifeInsuranceFamilyShare')===100);
ok('...and the live label shows the real cost and the coverage percentage', /100/.test(els['lbl-ins-life-family-share'].innerText) && /50/.test(els['lbl-ins-life-family-share'].innerText));

run(`state.insurance.lifeInsuranceEmployerCoveragePct=100;updateUI();`);
ok('100% employer coverage: the family pays nothing out of pocket for it', J('calculateMetrics().lifeInsuranceFamilyShare')===0);

run(`state.insurance.lifeInsuranceEmployerCoveragePct=0;updateUI();`);
ok('with 0% coverage, the live label is empty (no need to clutter the UI stating "0% covered")', els['lbl-ins-life-family-share'].innerText==='');

// the reduction only applies to LIFE insurance, never the other three premiums
load();
run(`state.insurance.lifeInsuranceMonthlyPremium=200;state.insurance.disabilityMonthlyPremium=100;state.insurance.healthInsuranceMonthlyPremium=300;state.insurance.propertyInsuranceMonthlyPremium=50;state.insurance.lifeInsuranceEmployerCoveragePct=100;updateUI();`);
const m=J('calculateMetrics()');
ok('a 100% life-insurance employer coverage still correctly counts disability/health/property premiums in full (not accidentally zeroed out too)', m.lifeInsuranceFamilyShare===0 && m.totalMonthlyLivingCost>0);

// exercising the real DOM input -> state read path (not just setting state directly),
// to catch a regression in form-sync.js's own read of this field
load();
// NOTE: handleDataUpdate() reads EVERY insurance input from the DOM, not just the one
// under test here — setting state directly for the premium without also updating its
// own input field leaves a stale DOM value that handleDataUpdate() immediately reads
// back, overwriting the direct assignment. Both inputs are set here to reflect that.
run(`document.getElementById('input-ins-life-premium').value='200';document.getElementById('input-ins-life-employer-pct').value='75';handleDataUpdate();`);
ok('BUGFIX-class guard: typing into the real employer-coverage input field is correctly read into state (not just setting state directly in a test)', J('state.insurance.lifeInsuranceEmployerCoveragePct')===75 && J('calculateMetrics().lifeInsuranceFamilyShare')===50);

// out-of-range input is safely clamped, never NaN or a negative cost
load();
run(`state.insurance.lifeInsuranceMonthlyPremium=200;state.insurance.lifeInsuranceEmployerCoveragePct=150;updateUI();`);
ok('an out-of-range coverage percentage (150%) is safely clamped to 100%, never a negative family cost', J('calculateMetrics().lifeInsuranceFamilyShare')===0);

// markup + sanitizer
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('markup: the employer-coverage input field exists in the Cash Flow view', /id="input-ins-life-employer-pct"/.test(html));
ok('sanitizer: an invalid/out-of-range stored value is clamped to 0-100, defaulting to 0', (()=>{
  const r1=run("migrateAndSanitizeState({insurance:{lifeInsuranceEmployerCoveragePct: 500}}).insurance.lifeInsuranceEmployerCoveragePct");
  const r2=run("migrateAndSanitizeState({insurance:{}}).insurance.lifeInsuranceEmployerCoveragePct");
  return r1===100 && r2===0;
})());

process.exitCode=bad?1:0;
