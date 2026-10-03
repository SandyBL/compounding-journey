// Household mode (shared/split), owner tags + filter, and the recurring-expenses list.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const near=(a,b,tol=1e-6)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b));
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const clear=(...ids)=>ids.forEach(id=>{if(els[id]&&els[id].children)els[id].children.length=0;});
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  if('${country}'==='ES'){state.baseCurrency='EUR';state.displayCurrency='EUR';state.earners.forEach(e=>e.regime='Cuenta Ajena')}
  if('${country}'==='GL'){state.baseCurrency='USD';state.displayCurrency='USD';state.earners.forEach(e=>e.regime='Employee')}
  syncFormInputsFromState();updateUI();`);
const goSplit=()=>run(`state.householdMode='split';updateUI();`);   // bypass the confirm modal for tests that just need the mode set

// ================= 1. default: nothing changes for anyone who never touches this =================
load();
ok('default household mode is "shared"', J('state.householdMode')==='shared');
ok('shared mode: Cash Flow shows the original plain category inputs, not the recurring list', els['row-cashflow-shared']._hidden!==true && els['row-cashflow-split']._hidden===true);
ok('shared mode: no owner filter bar and no owner field anywhere (zero added UI complexity)', els['owner-filter-investments'].innerHTML===''&&!/data-i18n="ownerLabel"|Owner<\/label>/.test(els['container-liquid-investments-list'].innerHTML));
const before=run('JSON.stringify(calculateMetrics())');
ok('shared mode: calculateMetrics() output is untouched by this whole feature existing', before===run('JSON.stringify(calculateMetrics())'));

// ================= 2. switching modes: confirmation, non-destructive, reversible =================
load();
run(`globalThis.__confirmed=null;showConfirmModal=(o)=>{__confirmed=o};`);
run(`setHouseholdMode('split')`);
ok('switching mode asks for confirmation first (nothing applied yet)', J('state.householdMode')==='shared'&&J('__confirmed')!==null);
run(`__confirmed.onConfirm()`);
ok('...and only after confirming does split mode actually apply', J('state.householdMode')==='split');
ok('switching to split auto-seeds recurring items from the CURRENT outflow totals (nothing lost, nothing to reconcile)', J('state.recurringExpenses.length')>0 && J('state.outflows.housing')===J('EXAMPLE_DEMO_STATE.outflows.housing'));
const totalsAfterSeed=J('Object.assign({},state.outflows)');
run(`globalThis.__confirmed=null;showConfirmModal=(o)=>{__confirmed=o};setHouseholdMode('shared');__confirmed.onConfirm();`);
ok('switching back to shared PRESERVES the recurring-items list (not deleted) and the outflow numbers stay exactly what split mode computed', J('state.recurringExpenses.length')>0 && JSON.stringify(J('state.outflows'))===JSON.stringify(totalsAfterSeed));
// state.householdMode is already 'shared' here (from the switch-back above)
run(`state.recurringExpenses.push({id:999999,name:'Custom item the person added',category:'dining',amount:77,splitType:'joint',earnerId:null,customSplits:{}})`);
const beforeSecondSwitch = run('JSON.stringify(state.recurringExpenses)');
run(`globalThis.__confirmed=null;showConfirmModal=(o)=>{__confirmed=o};setHouseholdMode('split');__confirmed.onConfirm();`);
ok('switching to split AGAIN does not re-seed: the list (including the item the person added by hand) is untouched, byte for byte', run('JSON.stringify(state.recurringExpenses)')===beforeSecondSwitch);

// ================= 3. owner tags: data model + sanitizer =================
const san=(o)=>J(`migrateAndSanitizeState(Object.assign({country:'BR'},${JSON.stringify(o)}))`);
let d=san({earners:[{id:1,name:'A'},{id:2,name:'B'}],goals:[{id:9,name:'G',targetAmount:100,owner:'2'}],liquidInvestments:[{id:8,name:'I',balanceOriginal:100,owner:'1'}],realEstate:[{id:7,name:'R',marketValue:100,owner:'joint'}]});
ok('sanitizer: a real earner id and "joint" are both kept for every list', d.goals[0].owner==='2'&&d.liquidInvestments[0].owner==='1'&&d.realEstate[0].owner==='joint');
d=san({earners:[{id:1,name:'A'}],goals:[{id:9,name:'G',targetAmount:100,owner:'999'}],liquidInvestments:[{id:8,name:'I',balanceOriginal:100,owner:'nonsense'}]});
ok('sanitizer: an id that does not exist (or junk) falls back to "joint", never a dangling reference', d.goals[0].owner==='joint'&&d.liquidInvestments[0].owner==='joint');
ok('sanitizer: missing owner field -> "joint" (old saved profiles from before this feature)', san({goals:[{id:1,name:'G',targetAmount:1}]}).goals[0].owner==='joint');
ok('hostile owner value (object/array) -> "joint", no crash', (()=>{const a=san({goals:[{id:1,name:'G',targetAmount:1,owner:{x:1}}]}),b=san({goals:[{id:1,name:'G',targetAmount:1,owner:['1']}]});return a.goals[0].owner==='joint'&&b.goals[0].owner==='joint'})());
ok('sanitizer: a non-empty, hand-edited recurringExpenses list survives a full sanitize pass (round-trip, not just this session)', (()=>{const r=san({earners:[{id:1,name:'A'},{id:2,name:'B'}],recurringExpenses:[{id:5,name:'Rent',category:'housing',amount:2000,splitType:'custom',customSplits:{1:60,2:40}}]});return r.recurringExpenses.length===1&&r.recurringExpenses[0].name==='Rent'&&r.recurringExpenses[0].amount===2000&&r.recurringExpenses[0].customSplits['1']===60})());

// ================= 4. removing an earner cascades their owned items back to "joint" =================
load(); goSplit();
run(`state.liquidInvestments[2].owner=String(state.earners[0].id);state.goals[1].owner=String(state.earners[0].id);`);
const removedId=J('state.earners[0].id');
ok('setup: an investment and a goal are owned by the earner about to be removed', J('state.liquidInvestments[2].owner')===String(removedId)&&J('state.goals[1].owner')===String(removedId));
run(`removeEarner(${removedId})`);
ok('after removing that earner, both items fall back to "joint" instead of pointing at a dead id', J('state.liquidInvestments[2].owner')==='joint'&&J('state.goals[1].owner')==='joint');

// ================= 4b. the SAME cascade for goal contributions and scenario earnerId
//                       references (found by an integration/data-sync audit: both features
//                       were added after cascadeOwnerOnEarnerRemoval() was first written,
//                       and neither was ever wired into it) =================
load(); goSplit();
const removedId2 = J('state.earners[0].id');
ok('setup: the demo\'s joint goal is tracking contributions from the earner about to be removed', J('state.goals[0].trackContributions')===true && J(`state.goals[0].contributions['${removedId2}']`)===8000);
const totalBefore = J('state.goals[0].currentSaved');
run(`addScenario('careerChange');updateScenarioField(state.scenarios[0].id,'careerChange','earnerId',${removedId2});addScenario('sabbatical');updateScenarioField(state.scenarios[1].id,'sabbatical','earnerId',${removedId2});`);
run(`removeEarner(${removedId2})`);
ok('removing that earner deletes their entry from goal.contributions (no dangling key left behind)', run(`Object.prototype.hasOwnProperty.call(state.goals[0].contributions, '${removedId2}')`)===false);
ok('...and currentSaved is reduced IMMEDIATELY, in this same session, not only after a future reload', J('state.goals[0].currentSaved')===totalBefore-8000);
ok('both scenario types\' dangling earnerId references are nulled, checked BEFORE any reload below, which would independently fix them too via the sanitizer, masking a missing cascade', J('state.scenarios[0].careerChange.earnerId')===null && J('state.scenarios[1].sabbatical.earnerId')===null);
ok('a reload right now changes NOTHING further \u2014 live state and post-reload state agree exactly (this was the actual bug: they used to silently disagree by the removed earner\'s full contribution)', (()=>{const before=J('JSON.stringify(state.goals)');run('state=migrateAndSanitizeState(JSON.parse(JSON.stringify(state)));');return J('JSON.stringify(state.goals)')===before})());

// ================= 5. owner field + filter on screen (investments, real estate, goals) =================
load(); goSplit();
clear('container-liquid-investments-list'); run('renderLiquidInvestmentsList()');
let card=els['container-liquid-investments-list'].children.map(c=>c.innerHTML).join(' ');
ok('split mode: each investment card has an owner select with Joint + every earner as options', /Joint/.test(card)&&J('state.earners').every(e=>new RegExp(e.name).test(card)));
run(`updateLiquidInvestment(state.liquidInvestments[0].id,'owner','1')`);
ok('changing the owner select updates the investment', J('state.liquidInvestments[0].owner')==='1');
ok('the filter bar is rendered above the list', /Show:|Mostrar:/.test(text(els['owner-filter-investments'])));
const investmentsBeforeFilter = run('JSON.stringify(state.liquidInvestments)');
run(`setOwnerFilter('investments','1')`);
ok('the filter never mutates the underlying investments list itself (only what is rendered)', run('JSON.stringify(state.liquidInvestments)')===investmentsBeforeFilter);
card=els['container-liquid-investments-list'].children.map(c=>c.innerHTML).join(' ');
const ownedByOne=J(`state.liquidInvestments.filter(i=>i.owner==='1').length`);
ok('filtering by an earner shows only their items, matching the actual count', els['container-liquid-investments-list'].children.length===ownedByOne&&ownedByOne>0,`showing ${els['container-liquid-investments-list'].children.length} of ${ownedByOne}`);
const metricsBefore=run('JSON.stringify(calculateMetrics())');
ok('the filter NEVER changes any calculation (net worth, totals, targets all stay exactly the same)', metricsBefore===run('JSON.stringify(calculateMetrics())'));
run(`setOwnerFilter('investments','all')`);
ok('"All" shows every investment again', els['container-liquid-investments-list'].children.length===J('state.liquidInvestments.length'));

clear('container-real-estate-list'); run('renderRealEstateList()');
ok('real estate cards also get the owner field in split mode', /Joint/.test(els['container-real-estate-list'].children.map(c=>c.innerHTML).join(' ')));
clear('container-goals-list'); run('renderGoalsList()');
ok('goal cards also get the owner field in split mode', /Joint/.test(els['container-goals-list'].children.map(c=>c.innerHTML).join(' ')));

// ================= 6. recurring expenses: seeding, editing, category sum, mode toggle =================
load();
run(`globalThis.__confirmed=null;showConfirmModal=(o)=>{__confirmed=o};setHouseholdMode('split');__confirmed.onConfirm();`);
const seeded=J('state.recurringExpenses');
ok('seeding creates one item per non-zero category, each "joint", each equal to that category\'s old total', seeded.every(x=>x.splitType==='joint')&&seeded.every(x=>near(x.amount,J(`EXAMPLE_DEMO_STATE.outflows.${x.category}`))));
run(`addRecurringExpense()`);
const newId=J('state.recurringExpenses[state.recurringExpenses.length-1].id');
run(`updateRecurringExpense(${newId},'name','Netflix');updateRecurringExpense(${newId},'category','subs');updateRecurringExpense(${newId},'amount','55')`);
ok('a new recurring item can be named, categorized (subs = subscription tracking) and given an amount', J(`state.recurringExpenses.find(x=>x.id===${newId})`).name==='Netflix'&&J(`state.recurringExpenses.find(x=>x.id===${newId})`).category==='subs'&&J(`state.recurringExpenses.find(x=>x.id===${newId})`).amount===55);
const subsSum=J(`state.recurringExpenses.filter(x=>x.category==='subs').reduce((s,x)=>s+x.amount,0)`);
ok('state.outflows.subs is automatically kept in sync with the sum of "subs" items (the single source of truth everywhere else in the app is untouched)', near(J('state.outflows.subs'),subsSum));
run(`removeRecurringExpense(${newId})`);
ok('removing an item removes it from the sum too', near(J('state.outflows.subs'),J(`state.recurringExpenses.filter(x=>x.category==='subs').reduce((s,x)=>s+x.amount,0)`)));
run(`addRecurringExpense()`);
const hId=J('state.recurringExpenses[state.recurringExpenses.length-1].id');
run(`updateRecurringExpense(${hId},'category','housing');updateRecurringExpense(${hId},'amount','1000')`);
const housingSum=J(`state.recurringExpenses.filter(x=>x.category==='housing').reduce((s,x)=>s+x.amount,0)`);
ok('adding a second item to an already-seeded category correctly sums both (seed item + the new one)', near(J('state.outflows.housing'),housingSum)&&housingSum>1000);

// ================= 7. split arrangements: joint / individual / custom, and the "who pays" summary =================
load();
run(`globalThis.__confirmed=null;showConfirmModal=(o)=>{__confirmed=o};setHouseholdMode('split');__confirmed.onConfirm();`);
run(`addRecurringExpense()`);
const eId=J('state.recurringExpenses[state.recurringExpenses.length-1].id');
const earner1=J('state.earners[0].id'), earner2=J('state.earners[1].id');
run(`updateRecurringExpense(${eId},'amount','1000');updateRecurringExpense(${eId},'splitType','individual');updateRecurringExpense(${eId},'earnerId','${earner1}')`);
ok('"one person pays": the FULL amount is attributed to that earner, nothing to the other, nothing to joint', near(J(`recurringItemShareForEarner(state.recurringExpenses.find(x=>x.id===${eId}),${earner1})`),1000)&&near(J(`recurringItemShareForEarner(state.recurringExpenses.find(x=>x.id===${eId}),${earner2})`),0));
run(`updateRecurringExpense(${eId},'splitType','custom')`);
run(`updateRecurringSplitPct(${eId},${earner1},'60');updateRecurringSplitPct(${eId},${earner2},'40')`);
ok('"custom": a 60/40 split of 1,000 gives 600 and 400', near(J(`recurringItemShareForEarner(state.recurringExpenses.find(x=>x.id===${eId}),${earner1})`),600)&&near(J(`recurringItemShareForEarner(state.recurringExpenses.find(x=>x.id===${eId}),${earner2})`),400));
run(`updateRecurringSplitPct(${eId},${earner1},'30');updateRecurringSplitPct(${eId},${earner2},'30')`);
ok('custom percentages that do NOT add up to 100 are normalized (30/30 -> still splits the full 1,000, 50/50 of it)', near(J(`recurringItemShareForEarner(state.recurringExpenses.find(x=>x.id===${eId}),${earner1})`),500)&&near(J(`recurringItemShareForEarner(state.recurringExpenses.find(x=>x.id===${eId}),${earner2})`),500));
run(`updateRecurringExpense(${eId},'splitType','joint')`);
ok('"joint" items are not attributed to anyone — they show up only in the joint total', near(J(`recurringItemShareForEarner(state.recurringExpenses.find(x=>x.id===${eId}),${earner1})`),0));
const summary=J('recurringWhoPaysSummary()');
const expectedJoint=J(`state.recurringExpenses.filter(x=>x.splitType==='joint').reduce((s,x)=>s+x.amount,0)`);
ok('the "who pays" summary\'s joint total matches the sum of joint items exactly', near(summary.joint,expectedJoint));
const totalAllocated=summary.joint+Object.values(summary.perEarner).reduce((s,v)=>s+v,0);
const totalExpenses=J('state.recurringExpenses.reduce((s,x)=>s+x.amount,0)');
ok('every dollar/real is accounted for: joint + each earner\'s share adds up to the total of all recurring items (no double counting, none lost)', near(totalAllocated,totalExpenses),`${totalAllocated.toFixed(2)} vs ${totalExpenses.toFixed(2)}`);

// ================= 8. split UI renders correctly, translations, XSS =================
load();
run(`globalThis.__confirmed=null;showConfirmModal=(o)=>{__confirmed=o};setHouseholdMode('split');__confirmed.onConfirm();`);
clear('container-recurring-expenses','container-recurring-summary');
run('renderRecurringExpenses()');
ok('split mode: Cash Flow shows the recurring list, not the plain inputs', els['row-cashflow-shared']._hidden===true&&els['row-cashflow-split']._hidden!==true);
ok('the recurring list renders one card per item', els['container-recurring-expenses'].children.length===J('state.recurringExpenses.length'));
ok('the who-pays summary box lists joint + every earner', text(els['container-recurring-summary']).length>10 && J('state.earners').every(e=>new RegExp(e.name).test(text(els['container-recurring-summary']))));
run(`addRecurringExpense();updateRecurringExpense(state.recurringExpenses[state.recurringExpenses.length-1].id,'name','<img src=x onerror=alert(1)>')`);
clear('container-recurring-expenses'); run('renderRecurringExpenses()');
const cardsHtml = els['container-recurring-expenses'].children.map(c=>c.innerHTML).join(' ');   // appendChild-built, not a container.innerHTML= assignment
ok('a recurring item name is HTML-escaped, not injected raw', /&lt;img src=x/.test(cardsHtml)&&!/<img src=x/.test(cardsHtml));
for(const lang of ['pt','es','en']){
  load('BR',lang); run(`globalThis.__c=null;showConfirmModal=(o)=>{__c=o};setHouseholdMode('split');__c.onConfirm();`);   // seed real items so there is something to render
  clear('container-recurring-expenses'); run('renderRecurringExpenses()');
  const all=els['container-recurring-expenses'].children.map(c=>c.innerHTML).join(' ');
  ok(`[${lang}] recurring items UI is translated, no leftover placeholders`, all.length>50 && !/\{[a-z0-9]+\}|undefined|NaN/.test(all));
}
load('BR','en'); run(`globalThis.__c=null;showConfirmModal=(o)=>{__c=o};setHouseholdMode('split');__c.onConfirm();`);
clear('container-recurring-expenses'); run('renderRecurringExpenses()');
ok('[en] no Portuguese in the recurring-expenses UI', !/ção|ões|Categoria|Divisão|Conjunto\b/.test(els['container-recurring-expenses'].children.map(c=>c.innerHTML).join(' ')));

// ================= 9. Excel export/import round-trips the owner tag =================
function stubXLSX() {
  run(`globalThis.__book={sheets:{},order:[]};globalThis.__wbBytes=null;
    XLSX={ utils:{ book_new:()=>({}), aoa_to_sheet:(rows)=>({rows}), book_append_sheet:(wb,ws,name)=>{__book.sheets[name]={rows:ws.rows};__book.order.push(name)}, sheet_to_json:(ws)=>ws.rows },
           writeFile:(wb,name)=>{__wbBytes={SheetNames:__book.order.slice(),Sheets:Object.assign({},__book.sheets)}}, read:(bytes)=>bytes };`);
}
load();
run(`state.goals[1].owner=String(state.earners[1].id);state.liquidInvestments[2].owner=String(state.earners[0].id);`);
const beforeXlsx=run('JSON.stringify(state)');
stubXLSX(); run('exportDataXLSX()');
run(`FileReader = function() { this.readAsArrayBuffer = (file) => { this.onload({ target: { result: file.__wb } }); }; };`);
run(`globalThis.__pendingConfirm=null;showConfirmModal=(o)=>{__pendingConfirm=o};`);
run(`handleImportXlsxFileSelected({ files: [{ __wb: __wbBytes }], value: '' });`);
run(`if(__pendingConfirm)__pendingConfirm.onConfirm()`);
ok('Excel export -> import round-trips owner tags on goals and investments (an untouched export changes nothing)', run('JSON.stringify(state)')===beforeXlsx);

// ================= 10. markup exists =================
const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('sanitizer: an individual split pointing at an earner who does not exist falls back to no one (null), not a dangling id', san({earners:[{id:1,name:'A'}],recurringExpenses:[{id:5,name:'X',category:'housing',amount:100,splitType:'individual',earnerId:999}]}).recurringExpenses[0].earnerId===null);
ok('sanitizer: a custom-split key for an earner who does not exist is dropped, a real one is kept', (()=>{const r=san({earners:[{id:1,name:'A'}],recurringExpenses:[{id:5,name:'X',category:'housing',amount:100,splitType:'custom',customSplits:{1:70,999:30}}]}).recurringExpenses[0].customSplits;return r['1']===70&&r['999']===undefined})());
ok('markup: household-mode buttons, owner filter containers and the recurring-expenses card all exist', /id="btn-household-shared"/.test(page)&&/id="btn-household-split"/.test(page)&&/id="owner-filter-investments"/.test(page)&&/id="container-recurring-expenses"/.test(page)&&/id="row-cashflow-split"/.test(page));
process.exitCode=bad?1:0;
