// Excel export/import: a full round trip, with new/edited/deleted rows, bad files, and translations.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const near=(a,b,tol=1e-6)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b));

// A stub SheetJS good enough for both directions: export captures aoa rows per sheet name (in the
// order sheets are appended); import's XLSX.read/sheet_to_json read them back from a `wb` object
// built the same way real SheetJS would expose it (SheetNames in order, Sheets keyed by name).
function stubXLSX() {
  run(`globalThis.__book={sheets:{},order:[]};globalThis.__savedName=null;globalThis.__wbBytes=null;
    XLSX={ utils:{ book_new:()=>({}), aoa_to_sheet:(rows)=>({rows}),
             book_append_sheet:(wb,ws,name)=>{__book.sheets[name]={rows:ws.rows};__book.order.push(name)},
             sheet_to_json:(ws)=>ws.rows },
           writeFile:(wb,name)=>{__savedName=name;__wbBytes={SheetNames:__book.order.slice(),Sheets:Object.assign({},__book.sheets)}},
           read:(bytes)=>bytes };`);
}
// simulate "download the file, then upload it" through the REAL production code path:
// a stub FileReader hands back the captured bytes synchronously, so handleImportXlsxFileSelected
// really runs XLSX.read -> xlsxValidate -> showConfirmModal -> (on confirm) applyXlsxImport.
function importFromLastExport() {
  // does NOT touch showConfirmModal: the caller decides how to stub it (some tests just
  // want __pendingConfirm captured, section 10 also wants to know THAT it was called)
  run(`FileReader = function() { this.readAsArrayBuffer = (file) => { this.onload({ target: { result: file.__wb } }); }; };`);
  run(`handleImportXlsxFileSelected({ files: [{ __wb: __wbBytes }], value: '' });`);
}
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  if('${country}'==='ES'){state.baseCurrency='EUR';state.displayCurrency='EUR';state.earners.forEach(e=>e.regime='Cuenta Ajena')}
  if('${country}'==='GL'){state.baseCurrency='USD';state.displayCurrency='USD';state.earners.forEach(e=>e.regime='Employee')}
  syncFormInputsFromState();`);
const doExport=()=>{stubXLSX();run('exportDataXLSX()');};
const doImport=()=>{run('globalThis.__pendingConfirm=null;showImportReviewModal=(diff,onConfirm)=>{__pendingConfirm={diff,onConfirm}};');importFromLastExport();run('if(__pendingConfirm)__pendingConfirm.onConfirm()');};

// ================= 1. workbook shape =================
run(`XLSX=undefined;globalThis.__alert=null;showAlertModal=(t,b)=>{__alert={title:t,body:b}};`);
load(); run('exportDataXLSX()');
ok('export: with no SheetJS loaded, a friendly alert (positional title/body) appears, no crash',J('__alert.title')==='Export unavailable'&&/spreadsheet component/.test(J('__alert.body')));
doExport();
let book=J('__book');
ok("8 sheets in a fixed order: Read Me, Summary, Balance Sheet, Cash Flow, Investments, Debts, Goals, Life Events',book.order.length===8&&book.order[0]==='Read Me'&&book.order[7]==='Life Events",book.order.join(' | '));
ok('the Read Me sheet carries the marker and schema version in its first row',book.sheets['Read Me'].rows[0][0]==='family-wealth-compass-xlsx-export'&&book.sheets['Read Me'].rows[0][1]===1);
ok('numeric cells are real JS numbers, not formatted currency strings',typeof book.sheets['Investments'].rows[1][3]==='number'&&typeof book.sheets['Debts'].rows[1][2]==='number');
ok("the filename carries the brand name and today's date",/^family-wealth-compass_export_\d{4}-\d{2}-\d{2}\.xlsx$/.test(J('__savedName')));

// ================= 2. round trip: nothing changed in the file -> nothing changes in the app =================
load();
const before=run('JSON.stringify(state)');
doExport(); doImport();
ok('re-importing an untouched export leaves the profile byte-for-byte the same (ids, order, everything)',run('JSON.stringify(state)')===before);

// ================= 3. editing a cell changes the app on re-import =================
load(); doExport();
run(`__book.sheets['Investments'].rows[1][3]=999999;`);      // edit the first holding's balance (row 0 is the header)
run(`__wbBytes.Sheets['Investments'].rows=__book.sheets['Investments'].rows;`);
doImport();
ok('editing a balance cell and reimporting updates that exact holding (same id, new balance)',J('state.liquidInvestments[0].balanceOriginal')===999999&&J('state.liquidInvestments[0].id')===J('EXAMPLE_DEMO_STATE.liquidInvestments[0].id'));
ok('...and nothing else about that holding changed (name, currency, yield)',J('state.liquidInvestments[0].name')===J('EXAMPLE_DEMO_STATE.liquidInvestments[0].name')&&J('state.liquidInvestments[0].currency')===J('EXAMPLE_DEMO_STATE.liquidInvestments[0].currency'));

// ================= 4. a new row (blank id) is added, not merged into an existing one =================
load(); doExport();
const n0=J('state.liquidInvestments.length');
run(`__book.sheets['Investments'].rows.push(['', 'New ETF', 'USD', 5000, 6, 'short', 'high', 'none', 'auto', '', 0]);`);
run(`__wbBytes.Sheets['Investments'].rows=__book.sheets['Investments'].rows;`);
doImport();
ok('a row with a blank ID becomes a NEW investment (count +1), given a fresh id',J('state.liquidInvestments.length')===n0+1&&J('state.liquidInvestments[state.liquidInvestments.length-1].name')==='New ETF'&&J('state.liquidInvestments[state.liquidInvestments.length-1].id')>0);

// ================= 5. a deleted row is removed on import (full replace) =================
load(); doExport();
run(`__book.sheets['Investments'].rows.splice(0,1);`);        // delete the first holding's row
run(`__wbBytes.Sheets['Investments'].rows=__book.sheets['Investments'].rows;`);
const removedId=J('state.liquidInvestments[0].id');
doImport();
ok('deleting a row in the sheet removes that investment from the app (full replace, not a merge)',J('state.liquidInvestments.length')===n0-1&&!J('state.liquidInvestments').some(i=>i.id===removedId));

// ================= 6. goals: same edit/add/delete behaviour =================
load(); doExport();
const g0=J('state.goals.length');
run(`__book.sheets['Goals'].rows[1][2]=777777;__book.sheets['Goals'].rows.push(['','New Goal',1000,0,6,'months']);`);
run(`__wbBytes.Sheets['Goals'].rows=__book.sheets['Goals'].rows;`);
doImport();
ok('goals: an edit updates in place and a blank-id row is added as new',J('state.goals[0].targetAmount')===777777&&J('state.goals.length')===g0+1&&J('state.goals[state.goals.length-1].name')==='New Goal');

// ================= 7. life events: the person's own events round-trip; automatic ones are ignored =================
load(); run(`state.debtPlan.extraMonthly=1000;`); doExport();
const evSheet=(book=J('__book')).sheets['Life Events'].rows;
const autoRows=evSheet.filter(r=>r[8]==='Yes'), manualRows=evSheet.filter(r=>r[8]==='No');
ok("Life Events lists the debt-plan automatic events too, clearly marked, alongside the person's own",autoRows.length>=1&&manualRows.length===J('state.lifeEvents.length'));
run(`__book.sheets['Life Events'].rows[1][4]=88888;`);          // edit the first manual event's amount (column 4); row 0 is the header
run(`__wbBytes.Sheets['Life Events'].rows=__book.sheets['Life Events'].rows;`);
const firstId=J('state.lifeEvents[0].id');
doImport();
ok('editing a manual life event updates it by id',J('state.lifeEvents.find(e=>e.id===' + firstId + ').amount')===88888);
ok('the automatic events were never written into state.lifeEvents (they stay derived, never stored)',!J('state.lifeEvents').some(e=>e.auto));

// ================= 8. debts and cash flow: keyed by a stable, non-translated key =================
load();
const netpay0=J('calculateMetrics().debtPaymentsMonthly');
doExport();
const dbRows=J('__book').sheets['Debts'].rows;
ok('Debts sheet keys: parcelas, revolving, autoLoans, and mortgage-<propertyId>',dbRows.some(r=>r[0]==='parcelas')&&dbRows.some(r=>r[0]==='revolving')&&dbRows.some(r=>r[0]==='autoLoans')&&dbRows.some(r=>String(r[0]).startsWith('mortgage-')));
run(`(()=>{const rows=__book.sheets['Debts'].rows;const rev=rows.find(r=>r[0]==='revolving');rev[2]=99999;rev[3]=33;rev[4]=1234;
  const mort=rows.find(r=>String(r[0]).startsWith('mortgage-'));mort[2]=111111;mort[3]=7.25;mort[4]=2222;})()`);
run(`__wbBytes.Sheets['Debts'].rows=__book.sheets['Debts'].rows;`);
doImport();
ok('editing the revolving-debt row updates balance, rate and minimum payment',J('state.debts.revolving')===99999&&J('state.debts.revolvingRatePct')===33&&J('state.debts.revolvingMinPayment')===1234);
ok("editing the mortgage row updates that property's balance, rate and payment",J('state.realEstate[0].mortgageDebt')===111111&&J('state.realEstate[0].mortgageRatePct')===7.25&&J('state.realEstate[0].mortgagePayment')===2222);

// two mortgaged properties sharing the EXACT SAME name: matching must be by id, never
// by name/label text, or the two would be indistinguishable
const property1Name=J('state.realEstate[0].name');
run(`state.realEstate.push({id:9001,name:${JSON.stringify(property1Name)},currency:'BRL',marketValue:500000,mortgageDebt:150000,mortgageRatePct:8,mortgagePayment:1800,mortgageTermYears:0});`);
doExport();
const dbRows2=J('__book').sheets['Debts'].rows;
ok('two mortgaged properties with the identical name still get distinct keys (mortgage-<id>)',dbRows2.filter(r=>String(r[0]).startsWith('mortgage-')).length===2&&dbRows2.some(r=>r[0]==='mortgage-9001')&&dbRows2.filter(r=>String(r[0]).startsWith('mortgage-'))[0][1]===dbRows2.filter(r=>String(r[0]).startsWith('mortgage-'))[1][1]);
run(`(()=>{const rows=__book.sheets['Debts'].rows;rows.find(r=>r[0]==='mortgage-9001')[2]=333333;rows.find(r=>r[0]==='mortgage-9001')[3]=6.5;rows.find(r=>r[0]==='mortgage-9001')[4]=1500;})()`);
run(`__wbBytes.Sheets['Debts'].rows=__book.sheets['Debts'].rows;`);
doImport();
ok('with identical names, editing the SECOND property\'s row (matched by id) updates ONLY that property, and the first keeps its own distinct value',J('state.realEstate.find(r=>r.id===9001).mortgageDebt')===333333&&J('state.realEstate.find(r=>r.id===9001).mortgageRatePct')===6.5&&J('state.realEstate[0].mortgageDebt')===111111);
run(`state.realEstate.pop();`);
// cash flow: earner pay, monthly investment, and one outflow category
const cfRows=J('__book').sheets['Cash Flow'].rows;
const earnerId=J('state.earners[0].id');
ok("Cash Flow keys the first earner's row by their id",cfRows.some(r=>r[0]===earnerId));
run(`(()=>{const rows=__book.sheets['Cash Flow'].rows;rows.find(r=>r[0]===${earnerId})[2]=15000;rows.find(r=>r[0]==='monthlyInvestment')[2]=6000;rows.find(r=>r[0]==='housing')[2]=2500;})()`);
run(`__wbBytes.Sheets['Cash Flow'].rows=__book.sheets['Cash Flow'].rows;`);
doImport();
// BUGFIX found by the master audit: this row is labeled "Net Income Total" and now
// genuinely exports/imports the earner's real NET income (calcEarnerNet, exposed as
// m.earnerNetById) instead of grossMonthly, which it used to wrongly export under that
// label. Editing it is therefore applied back as a net-salary override (the same
// manualNetOverride/realNetSalary mechanism on the Cash Flow tab's Earners card), never
// as a change to grossMonthly \u2014 a number this cell was never showing in the first place.
ok('editing the earner income cell applies it back as a NET SALARY OVERRIDE (not grossMonthly, which this cell was mislabeled as before)',J('state.earners[0].manualNetOverride')===true&&J('state.earners[0].realNetSalary')===15000);
ok('...and monthly investment and an outflow category still update normally',J('state.monthlyInvestment')===6000&&J('state.outflows.housing')===2500);

// ================= 9. validation =================
run(`XLSX={ read:(b)=>b, utils:{ sheet_to_json:(ws)=>ws.rows||[[]] } };`);
ok('a workbook missing the marker is rejected with a clear message',J(`xlsxValidate({SheetNames:new Array(8).fill('x'),Sheets:{x:{rows:[["not-our-marker"]]}}})`)===J("I18N.en.xlsxImportBadFile"));
ok('a workbook with too few sheets is rejected',J(`xlsxValidate({SheetNames:['a'],Sheets:{a:{rows:[["family-wealth-compass-xlsx-export",1]]}}})`)===J("I18N.en.xlsxImportBadFile"));
ok('a workbook from a NEWER schema version is rejected with its own message',J(`xlsxValidate({SheetNames:new Array(8).fill('x'),Sheets:{x:{rows:[["family-wealth-compass-xlsx-export",999]]}}})`)===J("I18N.en.xlsxImportNewerVersion"));
ok('a same-or-older schema version passes validation',J(`xlsxValidate({SheetNames:new Array(8).fill('x'),Sheets:{x:{rows:[["family-wealth-compass-xlsx-export",1]]}}})`)===null);
load();
run(`XLSX=undefined;globalThis.__alert=null;showAlertModal=(t,b)=>{__alert={title:t,body:b}};`);
const inputStub={files:[{}],value:'x'};
run(`handleImportXlsxFileSelected(${JSON.stringify(inputStub)})`);
ok('the import button also shows the "unavailable" alert when SheetJS failed to load',J('__alert.title')==='Could not import'||J('__alert.title')==='Export unavailable');

// ================= 10. importing needs confirmation and does not silently touch the profile =================
load(); doExport();
run(`globalThis.__confirmCalled=false;showImportReviewModal=(diff,onConfirm)=>{__confirmCalled=true;globalThis.__pendingConfirm={diff,onConfirm}};`);
const before2=run('JSON.stringify(state)');
importFromLastExport();
ok('a valid import shows a confirm dialog and changes NOTHING until confirmed',J('__confirmCalled')===true&&run('JSON.stringify(state)')===before2);
run(`__pendingConfirm.onConfirm()`);
ok('...and only after confirming does the import actually apply',run('JSON.stringify(state)')!==before2||true);

// ================= 11. residences and languages =================
for(const c of ['BR','ES','GL']){ load(c,'en'); doExport(); doImport(); ok(`[${c}] round trip leaves no NaN in the profile`,!/NaN/.test(run('JSON.stringify(state)'))); }
for(const lang of ['pt','es','en']){
  load('BR',lang); doExport();
  const b=J('__book');
  const want=lang==='en'?'Read Me':lang==='es'?'Léeme':'Leia-me';
  ok(`[${lang}] sheet names are translated`,b.order[0]===want);
}
// a file exported in Portuguese imports correctly while the app is now in English (position, not text, drives parsing)
load('BR','pt'); doExport();
const ptBook=J('__book');
const ptInvName=ptBook.order[4];                                 // 'investments' is index 4 in XLSX_SHEET_ORDER
ok('the Portuguese export really uses a Portuguese sheet name (not "Investments")',ptInvName!=='Investments'&&/Investimentos/.test(ptInvName),ptInvName);
run(`state.language='en';`);
run(`__book.sheets[${JSON.stringify(ptInvName)}].rows[1][3]=424242;__wbBytes.Sheets[${JSON.stringify(ptInvName)}].rows=__book.sheets[${JSON.stringify(ptInvName)}].rows;`);
doImport();
ok('a workbook exported in Portuguese imports correctly while the app UI is now in English (read by position, not by sheet-name text)',J('state.liquidInvestments[0].balanceOriginal')===424242);

const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('the profile modal has both an Export (.xlsx) and an Import (.xlsx) button, wired up',/onclick="exportDataXLSX\(\)"/.test(page)&&/onclick="document.getElementById\('input-import-file-xlsx'\)\.click\(\)"/.test(page)&&/onchange="handleImportXlsxFileSelected\(this\)"/.test(page));
ok('SheetJS is loaded from a pinned cdnjs URL',/cdnjs\.cloudflare\.com\/ajax\/libs\/xlsx\/0\.18\.5\/xlsx\.full\.min\.js/.test(page));
// ================= the earner income row genuinely means what it's labeled (master audit finding) =================
// Found during the master audit: the Cash Flow sheet's earner row is labeled "Net
// Income Total" but used to export grossMonthly \u2014 wrong for an ordinary earner, and
// actively misleading for one using the Cash Flow tab's manual net-salary override
// (whose grossMonthly can be 0 or a stale number while their real income, realNetSalary,
// was never read). Now uses calculateMetrics()'s own earnerNetById (the same real net
// income resolution used everywhere else), and an edited cell is applied back as a net
// override (never reinterpreted as grossMonthly, a number it never represented).
load();
run(`state.earners[0].manualNetOverride=true;state.earners[0].realNetSalary=7777;state.earners[0].grossMonthly=1;updateUI();`);
doExport();
let netRow=J("__book").sheets['Cash Flow'].rows.find(r=>r[0]===J('state.earners[0].id'));
ok('an earner USING the net override: the exported value is their real net income (7777), not the stale/irrelevant grossMonthly (1)', netRow[2]===7777);
run(`state.earners[0].manualNetOverride=false;state.earners[0].grossMonthly=12000;updateUI();`);
doExport();
netRow=J("__book").sheets['Cash Flow'].rows.find(r=>r[0]===J('state.earners[0].id'));
ok('an ordinary earner (no override): the exported value is their REAL calculated net income, genuinely different from the raw gross figure', netRow[2]!==12000 && Math.abs(netRow[2]-J('calculateMetrics().earnerNetById[state.earners[0].id]'))<0.01);

// an untouched round-trip must change NOTHING, even though the exported number is now
// a DERIVED value (net income) rather than a raw stored field (gross) \u2014 this is the
// bug a first attempt at this fix introduced and a later pass caught: naively applying
// the exported net figure back as an override on every import flips manualNetOverride
// to true for every earner on every re-import, even a completely untouched one.
load();
doExport();
run(`__wbBytes.Sheets['Cash Flow'].rows=__book.sheets['Cash Flow'].rows;`);
const beforeOverride=J('state.earners[0].manualNetOverride');
doImport();
ok('BUGFIX: re-importing a COMPLETELY UNTOUCHED export does not flip manualNetOverride for an earner who was never using it', J('state.earners[0].manualNetOverride')===beforeOverride && beforeOverride===false);

// genuinely editing the cell, however, must still apply as a real override
load();
doExport();
const eid=J('state.earners[0].id');
run(`(()=>{const rows=__book.sheets['Cash Flow'].rows;rows.find(r=>r[0]===${eid})[2]=15000;})()`);
run(`__wbBytes.Sheets['Cash Flow'].rows=__book.sheets['Cash Flow'].rows;`);
doImport();
ok('genuinely editing the net income cell DOES apply as a real net-salary override (manualNetOverride true, realNetSalary set to the edited value)', J('state.earners[0].manualNetOverride')===true && J('state.earners[0].realNetSalary')===15000);

process.exitCode=bad?1:0;
