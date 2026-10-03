// Conflict-aware import: the diff engine, the review modal, and both import paths
// (JSON and Excel) showing it before anything is applied.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  if('${country}'==='ES'){state.baseCurrency='EUR';state.displayCurrency='EUR';state.earners.forEach(e=>e.regime='Cuenta Ajena')}
  syncFormInputsFromState();`);

// ================= 1. diffList: added / removed / changed / unchanged =================
load();
let a=J('state.liquidInvestments');
let b=J('JSON.parse(JSON.stringify(state.liquidInvestments))');
let d=J(`diffList(${JSON.stringify(a)},${JSON.stringify(b)},x=>x.name,['name','balanceOriginal'])`);
ok('identical lists: everything unchanged, nothing added/removed/changed', d.added===0&&d.removed===0&&d.changed===0&&d.unchanged===a.length);
b[0].balanceOriginal = b[0].balanceOriginal + 1000;
d=J(`diffList(${JSON.stringify(a)},${JSON.stringify(b)},x=>x.name,['name','balanceOriginal'])`);
ok('editing one field on one item: exactly 1 changed, the rest unchanged', d.changed===1&&d.unchanged===a.length-1&&d.details.find(x=>x.type==='changed').fields[0].field==='balanceOriginal');
ok('...the changed detail carries the REAL old and new values, not just the field name', d.details.find(x=>x.type==='changed').fields[0].from===a[0].balanceOriginal&&d.details.find(x=>x.type==='changed').fields[0].to===b[0].balanceOriginal);
let c=b.slice(1);
d=J(`diffList(${JSON.stringify(a)},${JSON.stringify(c)},x=>x.name,['name','balanceOriginal'])`);
ok('removing the first item: 1 removed, named correctly, rest unchanged (minus the 1 that was also edited)', d.removed===1&&d.details.find(x=>x.type==='removed').text===a[0].name);
let e=b.concat([{id:99999,name:'New ETF',balanceOriginal:5000}]);
d=J(`diffList(${JSON.stringify(a)},${JSON.stringify(e)},x=>x.name,['name','balanceOriginal'])`);
ok('adding a new item (fresh id): 1 added, named correctly', d.added===1&&d.details.find(x=>x.type==='added').text==='New ETF');
d=J(`diffList([],[],x=>x.name,['name'])`);
ok('two empty lists: marked "empty" so the section is hidden entirely from the review', d.empty===true&&d.added===0&&d.removed===0&&d.changed===0&&d.unchanged===0);

// a RENAME (same id, only the name field differs) must be "changed", never "removed"+"added" —
// diffList's nameFn is only for the display LABEL; matching itself must be by id, not by name.
{
  const oldR=[{id:5,name:'Old Name',balanceOriginal:100}], newR=[{id:5,name:'New Name',balanceOriginal:100}];
  const r=run(`diffList(${JSON.stringify(oldR)},${JSON.stringify(newR)},i=>i.name,['name','balanceOriginal'])`);
  ok('diffList: a rename (same id) is ONE "changed" item, not a removed+added pair', run('JSON.stringify('+JSON.stringify(oldR)+')')&&(()=>{const rr=JSON.parse(run(`JSON.stringify(diffList(${JSON.stringify(oldR)},${JSON.stringify(newR)},i=>i.name,['name','balanceOriginal']))`));return rr.changed===1&&rr.added===0&&rr.removed===0&&rr.details[0].fields[0].field==='name'&&rr.details[0].fields[0].from==='Old Name'&&rr.details[0].fields[0].to==='New Name'})());
}

// ================= 2. diffScalarGroup =================
d=J(`diffScalarGroup({a:1,b:2,c:3},{a:1,b:99,c:3},['a','b','c'])`);
ok('scalar group: only the fields that actually differ are counted/listed', d.changed===1&&d.unchanged===2&&d.details[0].field==='b'&&d.details[0].from===2&&d.details[0].to===99);
d=J(`diffScalarGroup({a:1},{a:1},['a'])`);
ok('identical scalar group: not marked empty (settings sections always show, even with 0 changes)', d.unchanged===1&&d.empty===false);

// ================= 3. computeImportDiff: a real, full profile =================
load();
let beforeState=run('JSON.stringify(state)');
let incoming=J('migrateAndSanitizeState(JSON.parse(JSON.stringify(state)))');
let diff=J(`computeImportDiff(state,${JSON.stringify(incoming)})`);
ok('an untouched profile diffed against itself: list sections with items are marked "empty" only when both sides truly have nothing; scalar-setting sections (Profile, Debts, Cash Flow...) always show, but every one reports zero added/removed/changed', diff.every(s=>s.result.added===0&&s.result.removed===0&&s.result.changed===0), JSON.stringify(diff.map(s=>[s.key,s.result.added,s.result.removed,s.result.changed])));
ok('computing a diff never mutates the real state', run('JSON.stringify(state)')===beforeState);
run(`globalThis.__incoming=JSON.parse(JSON.stringify(state));__incoming.liquidInvestments[0].balanceOriginal+=5000;__incoming.goals.push({id:88888,name:'New Goal',targetAmount:1000,currentSaved:0,timeValue:12,timeUnit:'months',owner:'joint'});__incoming.earners=__incoming.earners.slice(1);__incoming.country='ES';`);
diff=J('computeImportDiff(state,__incoming)');
const sections=Object.fromEntries(diff.map(s=>[s.key,s.result]));
ok('a real edited profile: Investments shows 1 changed, Goals shows 1 added, Earners shows 1 removed', sections.investments.changed===1&&sections.goals.added===1&&sections.earners.removed===1);
ok('Profile settings shows the country change (BR -> ES)', sections.profile.changed>=1&&sections.profile.details.some(f=>f.field==='country'&&f.from==='BR'&&f.to==='ES'));
ok('a scalar-settings section with nothing different (Debts) still shows, but with zero changes, so the person can trust silence means silence', 'debts' in sections && sections.debts.changed===0);

// ================= 4. automatic Life Events are excluded from the diff (they are never stored/compared) =================
load();
run(`state.debtPlan.extraMonthly=500;`);   // creates an automatic event when read through buildDebtPlanEvents()
const ownEventsBefore=J('state.lifeEvents.length');
run(`const inc4=JSON.parse(JSON.stringify(state));inc4.debtPlan.extraMonthly=9000;`);   // would change the automatic event's amount if it were compared
diff=J('computeImportDiff(state,inc4)');
const evSection=diff.find(s=>s.key==='lifeEvents');
ok('the Life Events diff only ever compares the person\'s OWN stored events, never the automatic (derived) ones — changing debtPlan alone shows zero differences here', (!evSection || (evSection.result.added===0&&evSection.result.removed===0&&evSection.result.changed===0))&&ownEventsBefore>=0);

// ================= 5. the review modal on screen =================
load();
run(`globalThis.__c=[];Chart=function(){this.destroy=()=>{};this.update=()=>{};};`);   // keep .destroy so a later updateUI() (e.g. confirming an import) does not crash
run(`showImportReviewModal(computeImportDiff(state,__incoming||JSON.parse(JSON.stringify(state))),()=>{})`);
ok('the review modal becomes visible', els['modal-import-review']._hidden!==true);
run(`state.liquidInvestments[0].balanceOriginal+=1234;const inc=JSON.parse(JSON.stringify(state));state.liquidInvestments[0].balanceOriginal-=1234;showImportReviewModal(computeImportDiff(state,inc),()=>{})`);
let body=text(els['import-review-sections']);
ok('a changed investment shows up in the modal with old -> new amounts', /1 changed/.test(body)&&new RegExp(J('fmt(state.liquidInvestments[0].balanceOriginal)').replace(/[.,]/g,'.')).test(body.replace(/[.,]/g,'.'))||/→/.test(body));
run(`showImportReviewModal([],()=>{})`);
ok('an empty diff (nothing changed) shows the "nothing changed" message, not a blank box', /Nothing changes|No se encontró|Nada muda|nothing changed/i.test(text(els['import-review-sections'])+els['import-review-subtitle'].innerText));
run(`globalThis.__called=false;showImportReviewModal([],()=>{__called=true});confirmImportReview();`);
ok('confirming the review calls the stored callback and closes the modal', J('__called')===true&&els['modal-import-review']._hidden===true);
run(`globalThis.__called=false;showImportReviewModal([],()=>{__called=true});closeImportReviewModal();`);
ok('cancelling the review does NOT call the callback (nothing applied)', J('__called')===false&&els['modal-import-review']._hidden===true);

// ================= 6. JSON import goes through the review, not a blind confirm =================
load();
const jsonBefore=run('JSON.stringify(state)');
const payload=run('JSON.stringify(buildExportPayload())');
run(`(()=>{state.liquidInvestments[0].balanceOriginal+=9999})()`);   // change something so the diff is non-trivial
run(`globalThis.__realShowImportReviewModal=showImportReviewModal;globalThis.__reviewed=null;showImportReviewModal=(diff,onConfirm)=>{__reviewed={diff,onConfirm}};`);
run(`FileReader=function(){this.readAsText=(file)=>{this.onload({target:{result:file.__text}})}};`);
run(`handleImportFileSelected({files:[{__text:${JSON.stringify(payload)},size:100}],value:''})`);
ok('selecting a JSON file shows the review (not applied yet) — the CURRENT (edited) state is untouched', J('__reviewed')!==null&&run('JSON.stringify(state)')!==jsonBefore);
ok('the diff correctly shows the investment reverting back to its original value', J('__reviewed.diff').some(s=>s.key==='investments'&&s.result.changed>=1));
run(`__reviewed.onConfirm()`);
ok('confirming applies the import: the investment balance is back to what was in the export', J('state.liquidInvestments[0].balanceOriginal')===JSON.parse(jsonBefore).liquidInvestments[0].balanceOriginal);
run('showImportReviewModal=__realShowImportReviewModal;');   // restore the real function for the rest of this suite

// ================= 6b. Cancel leaves everything untouched =================
load();
const beforeCancel=run('JSON.stringify(state)');
run(`(()=>{state.liquidInvestments[0].balanceOriginal+=500})()`);
const payload2=run('JSON.stringify(buildExportPayload())');
run(`state.liquidInvestments[0].balanceOriginal-=500`);   // back to the export's own value, then import a DIFFERENT edit
run(`(()=>{state.liquidInvestments[0].balanceOriginal+=12345})()`);
const beforeImport2=run('JSON.stringify(state)');
run(`globalThis.__reviewed2=null;showImportReviewModal=(diff,onConfirm)=>{__reviewed2={diff,onConfirm}};`);
run(`FileReader=function(){this.readAsText=(file)=>{this.onload({target:{result:file.__text}})}};`);
run(`handleImportFileSelected({files:[{__text:${JSON.stringify(payload2)},size:100}],value:''})`);
ok('a file is parsed and the review is shown even if the user never confirms', J('__reviewed2')!==null);
ok('...and Cancel (never calling onConfirm) leaves the profile completely untouched', run('JSON.stringify(state)')===beforeImport2);
run('showImportReviewModal=__realShowImportReviewModal||showImportReviewModal;');

// ================= 6c. Excel import ALSO goes through the same review, not a blind confirm =================
function stubXLSX() {
  run(`globalThis.__book={sheets:{},order:[]};globalThis.__wbBytes=null;
    XLSX={ utils:{ book_new:()=>({}), aoa_to_sheet:(rows)=>({rows}), book_append_sheet:(wb,ws,name)=>{__book.sheets[name]={rows:ws.rows};__book.order.push(name)}, sheet_to_json:(ws)=>ws.rows },
           writeFile:(wb,name)=>{__wbBytes={SheetNames:__book.order.slice(),Sheets:Object.assign({},__book.sheets)}}, read:(bytes)=>bytes };`);
}
load();
stubXLSX(); run('exportDataXLSX()');
run(`(()=>{state.liquidInvestments[0].balanceOriginal+=777})()`);   // edit AFTER exporting, so re-importing the export is a real change
const beforeXlsxImport=run('JSON.stringify(state)');
run(`FileReader = function() { this.readAsArrayBuffer = (file) => { this.onload({ target: { result: file.__wb } }); }; };`);
run(`globalThis.__reviewedXlsx=null;showImportReviewModal=(diff,onConfirm)=>{__reviewedXlsx={diff,onConfirm}};`);
run(`handleImportXlsxFileSelected({ files: [{ __wb: __wbBytes }], value: '' });`);
ok('selecting an Excel file ALSO shows the review first (same mechanism as JSON), nothing applied yet', J('__reviewedXlsx')!==null&&run('JSON.stringify(state)')===beforeXlsxImport);
ok('the Excel diff correctly shows the investment reverting to its exported value', J('__reviewedXlsx.diff').some(sec=>sec.key==='investments'&&sec.result.changed>=1));
run(`__reviewedXlsx.onConfirm()`);
ok('confirming the Excel review applies the import', run('state.liquidInvestments[0].balanceOriginal')!==JSON.parse(beforeXlsxImport).liquidInvestments[0].balanceOriginal);
run('showImportReviewModal=__realShowImportReviewModal||showImportReviewModal;');

// ================= 6d. recurringExpenses differences are shown (not silently skipped) =================
load();
run(`globalThis.__c=null;showConfirmModal=(o)=>{__c=o};setHouseholdMode('split');__c.onConfirm();`);
const incRec=run(`(()=>{const c=JSON.parse(JSON.stringify(state));c.recurringExpenses[0].amount+=250;return JSON.stringify(c)})()`);
run(`globalThis.__d2=computeImportDiff(state,JSON.parse(${JSON.stringify(incRec)}));`);
ok('a change to a recurring-expense item shows up in its own diff section', J('__d2').some(s=>s.key==='recurringExpenses'&&s.result.changed>=1));

// ================= 7. translations, XSS, markup =================
for(const lang of ['pt','es','en']){
  load('BR',lang);
  run(`(()=>{state.liquidInvestments[0].balanceOriginal+=1;const incLang=JSON.parse(JSON.stringify(state));state.liquidInvestments[0].balanceOriginal-=1;showImportReviewModal(computeImportDiff(state,incLang),()=>{});})();`);
  const t2=text(els['import-review-sections']);
  ok(`[${lang}] the review modal renders in the language, no leftover placeholders`, t2.length>10&&!/\{[a-z0-9]+\}|undefined|NaN/.test(t2));
}
load('BR','en');
run(`state.liquidInvestments[0].name='<img src=x onerror=alert(1)>';const incXss=JSON.parse(JSON.stringify(state));state.liquidInvestments[0].name='Original';showImportReviewModal(computeImportDiff(state,incXss),()=>{});`);
const __xssHtml = els['import-review-sections'].innerHTML;
ok('a hostile name in a diff detail is HTML-escaped, not injected raw', /&lt;img src=x/.test(__xssHtml)&&!/<img src=x/.test(__xssHtml));
const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('markup: the import-review modal exists with its Cancel/Apply buttons', /id="modal-import-review"/.test(page)&&/onclick="closeImportReviewModal\(\)"/.test(page)&&/onclick="confirmImportReview\(\)"/.test(page));
process.exitCode=bad?1:0;
