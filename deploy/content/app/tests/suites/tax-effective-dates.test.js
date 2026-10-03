// "Rules as of..." badges: correct placement per country, correct wording, translations.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const clear=(...ids)=>ids.forEach(id=>{if(els[id]&&els[id].children)els[id].children.length=0;});
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  if('${country}'==='ES'){state.baseCurrency='EUR';state.displayCurrency='EUR';state.earners.forEach(e=>e.regime='Cuenta Ajena')}
  if('${country}'==='GL'){state.baseCurrency='USD';state.displayCurrency='USD';state.earners.forEach(e=>e.regime='Employee')}
  syncFormInputsFromState();updateUI();`);

// ================= 1. badge helper itself =================
run(`state.language='en';`);
ok('a confirmed rule shows "📅 Rules as of <Month Year>" with the citation as a tooltip', /📅 Rules as of January 2026/.test(run("taxRulesBadge('BR_IRPF')"))&&/Lei 15\.191\/2025/.test(run("taxRulesBadge('BR_IRPF')")));
ok('an unconfirmed rule shows a distinct warning instead of a fake date', /⚠️ Unverified/.test(run("taxRulesBadge('BR_INSS')"))&&!/Rules as of/.test(run("taxRulesBadge('BR_INSS')")));
ok('an unknown key renders nothing (no crash, no "undefined")', run("taxRulesBadge('NOT_A_KEY')")==='');
ok('the citation in the tooltip is HTML-escaped', !/<script/.test(run("taxRulesBadge('BR_IRPF')")));
// getTaxRulesRegistry() returns a fresh object every call by design (see the comment in the
// source), so a hostile SOURCE STRING is tested by substituting the lookup function itself.
run(`globalThis.__origSourceText = taxRulesSourceText; taxRulesSourceText = () => '<img src=x onerror=alert(1)>';`);
const badgeOut = run("taxRulesBadge('BR_IRPF')");
run(`taxRulesSourceText = __origSourceText;`);
ok('a hostile citation string is HTML-escaped in the badge tooltip, not injected raw', /&lt;img src=x/.test(badgeOut) && !/<img src=x/.test(badgeOut), badgeOut);


// ================= 2. Tax Planning tab: Brazil =================
load('BR','en'); clear('container-tax-study-content'); run(`switchTab('view-taxes')`);
let taxes=text(els['container-tax-study-content']);
const taxesHtml=els['container-tax-study-content'].innerHTML;
// two confirmed Brazil badges share the SAME date text ("Rules as of January 2026"), so a
// whole-tab regex can't tell them apart — check each badge in PROXIMITY to its own label
const near=(html,label,pattern,win=250)=>{const i=html.indexOf(label);return i>=0&&pattern.test(html.slice(i,i+win));};
ok('Brazil: the effective-rate card carries the BR_IRPF badge (near its own label, not just anywhere on the tab)', near(taxesHtml,'Family Effective Rate',/Rules as of January 2026/)&&near(taxesHtml,'Family Effective Rate',/Lei 15\.191\/2025/));
ok('Brazil: the PGBL/VGBL contribution card carries the (unverified) BR_PRIVATE_PENSION badge', /Unverified: confirm before relying on this/.test(taxes));
ok('Brazil: the dividends guide bullet carries the BR_DIVIDENDS badge (near its own label)', near(taxesHtml,'Profits and dividends',/Rules as of January 2026/,900)&&near(taxesHtml,'Profits and dividends',/Law 15,270\/2025/,400));
ok('...and Global/Spain badges do NOT leak into the Brazil view', !/base del ahorro|savings scale/.test(taxes));

// ================= 3. Tax Planning tab: Spain =================
load('ES','en'); clear('container-tax-study-content'); run(`switchTab('view-taxes')`);
taxes=text(els['container-tax-study-content']);
ok('Spain: the income card carries the ES_IRPF badge', /Annual Gross Employment Income/.test(taxes)&&(taxes.match(/Rules as of/g)||[]).length>=1);
ok('Spain: the pension-plan limit card carries the (unverified) ES_PENSION_PLAN badge', /Individual Plan Contribution Limit/.test(taxes)&&/Unverified/.test(taxes));
ok('...and Brazil-only badges (IRPF table law) do NOT leak into the Spain view', !/Lei 15\.191/.test(taxes));

// ================= 4. Global: no country-specific badges at all =================
load('GL','en'); clear('container-tax-study-content'); run(`switchTab('view-taxes')`);
taxes=text(els['container-tax-study-content']);
ok('Global: no jurisdiction-specific "Rules as of" badge appears (nothing here is a cited law)', !/Rules as of|Unverified: confirm/.test(taxes));

// ================= 5. earner card: Spain Social Security =================
load('ES','en'); clear('container-earners-list'); run(`renderEarnersList()`);
const card=els['container-earners-list'].children.map(c=>c.innerHTML).join(' ');
ok('Spain employee earner card: the fixed-term checkbox carries the ES_SS badge', /Fixed-term contract/.test(card)&&/Rules as of January 2026/.test(card)&&/Orden PJC\/297\/2026/.test(card));
load('BR','en'); clear('container-earners-list'); run(`renderEarnersList()`);
const cardBr=els['container-earners-list'].children.map(c=>c.innerHTML).join(' ');
ok('Brazil earner card: no ES_SS badge (Spain-only control is hidden entirely)', !/Fixed-term contract/.test(cardBr)&&!/Orden PJC/.test(cardBr));

// ================= 6. Withdrawal card: Spain savings scale =================
load('ES','en'); run(`switchTab('view-retirement');renderWithdrawalPhase(calculateMetrics());`);   // withdrawal card is tab-gated
const wd=els['row-wd-es'].innerHTML;
ok('Spain: the withdrawal-phase note carries the ES_SAVINGS badge, and still has its own explanatory text', /savings base|savings scale/i.test(text(els['row-wd-es']))&&/Rules as of January 2026/.test(wd)&&/CNMV guide/.test(wd));
load('BR','en'); run(`switchTab('view-retirement');renderWithdrawalPhase(calculateMetrics());`);
ok('Brazil: the row-wd-es note is hidden entirely', els['row-wd-es']._hidden===true);

// ================= 7. translations =================
for(const lang of ['pt','es','en']){
  load('BR',lang); clear('container-tax-study-content'); run(`switchTab('view-taxes')`);
  const t2=text(els['container-tax-study-content']);
  const want=lang==='en'?'Rules as of':lang==='es'?'Reglas vigentes desde':'Regras vigentes desde';
  ok(`[${lang}] the badge text is translated`,t2.includes(want));
}
load('BR','en'); clear('container-tax-study-content'); run(`switchTab('view-taxes')`);
ok('[en] no Portuguese in the tax-rules badges', !/vigentes desde|Não verificado/.test(text(els['container-tax-study-content'])));

process.exitCode=bad?1:0;
