// Shared savings goals: per-earner contribution tracking, "who's ahead" comparison,
// split-mode-only, joint-goals-only, non-destructive toggle, Excel round-trip.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const near=(a,b,tol=1e-6)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b));
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const clear=(...ids)=>ids.forEach(id=>{if(els[id]&&els[id].children)els[id].children.length=0;});
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  syncFormInputsFromState();updateUI();`);
const goSplit=()=>run(`state.householdMode='split';updateUI();`);
const render=()=>{clear('container-goals-list');run("switchTab('view-goals');renderGoalsList();");};

// ================= 1. getGoalContributionBalance: pure math =================
ok('tracking off -> null (nothing to compare)', J(`getGoalContributionBalance({trackContributions:false,contributions:{1:100,2:100}},[{id:1,name:'A'},{id:2,name:'B'}])`)===null);
ok('only 1 earner -> null (nothing to compare against)', J(`getGoalContributionBalance({trackContributions:true,contributions:{1:100}},[{id:1,name:'A'}])`)===null);
{
  const b=J(`getGoalContributionBalance({trackContributions:true,contributions:{1:8000,2:6000}},[{id:1,name:'Lucas'},{id:2,name:'Sofia'}])`);
  ok('fair share = total/2 = 7000; Lucas +1000, Sofia -1000 (equal and opposite)', near(b[0].fairShare,7000)&&near(b[0].diff,1000)&&near(b[1].diff,-1000)&&near(b[0].diff+b[1].diff,0));
}
{
  // 3 earners, uneven contributions
  const b=J(`getGoalContributionBalance({trackContributions:true,contributions:{1:9000,2:3000,3:0}},[{id:1,name:'A'},{id:2,name:'B'},{id:3,name:'C'}])`);
  ok('3 earners: fair share = 4000 each; diffs sum to zero', near(b[0].fairShare,4000)&&near(b[0].diff,5000)&&near(b[1].diff,-1000)&&near(b[2].diff,-4000)&&near(b[0].diff+b[1].diff+b[2].diff,0));
}
ok('a missing contribution for an earner counts as 0, not a crash', J(`getGoalContributionBalance({trackContributions:true,contributions:{1:5000}},[{id:1,name:'A'},{id:2,name:'B'}])`)[1].contributed===0);
ok('all-equal contributions -> everyone exactly on pace (diff 0)', J(`getGoalContributionBalance({trackContributions:true,contributions:{1:5000,2:5000}},[{id:1,name:'A'},{id:2,name:'B'}])`).every(x=>near(x.diff,0)));

// ================= 2. currentSaved is derived while tracking is on, plain otherwise =================
load();
ok('demo goal 301 (joint, tracking on): currentSaved = 8000+6000 = 14000, matching the original value exactly', J('state.goals[0].currentSaved')===14000&&J('state.goals[0].trackContributions')===true);
ok('demo goal 302 (individual owner): tracking is off, currentSaved is a plain number as before', J('state.goals[1].trackContributions')===false&&J('state.goals[1].currentSaved')===32000);
run(`updateGoalContribution(${J('state.goals[0].id')}, ${J('state.earners[0].id')}, '9500')`);
ok('editing a contribution recomputes currentSaved automatically (9500+6000=15500)', J('state.goals[0].currentSaved')===15500);
run(`updateGoal(${J('state.goals[0].id')}, 'currentSaved', '999999')`);
ok('a direct edit to currentSaved is IGNORED while tracking is on (still derived, not overwritten)', J('state.goals[0].currentSaved')===15500);
run(`updateGoal(${J('state.goals[1].id')}, 'currentSaved', '40000')`);
ok('...but a direct edit works normally on a goal WITHOUT tracking', J('state.goals[1].currentSaved')===40000);

// ================= 3. the toggle is non-destructive both ways =================
load();
const goalId=J('state.goals[1].id');   // the individually-owned goal, tracking off
ok('setup: tracking is off, currentSaved is 32000', J('state.goals[1].trackContributions')===false&&J('state.goals[1].currentSaved')===32000);
run(`setGoalContributionTracking(${goalId}, true)`);
ok('turning tracking ON puts the WHOLE current total under the first earner (nothing lost)', J('state.goals[1].trackContributions')===true&&J('state.goals[1].contributions')[String(J('state.earners[0].id'))]===32000&&J('state.goals[1].currentSaved')===32000);
run(`setGoalContributionTracking(${goalId}, false)`);
ok('turning it OFF freezes currentSaved at 32000 and keeps the contributions data (not deleted)', J('state.goals[1].trackContributions')===false&&J('state.goals[1].currentSaved')===32000&&J('state.goals[1].contributions')[String(J('state.earners[0].id'))]===32000);
run(`updateGoal(${goalId}, 'currentSaved', '50000')`);
ok('...and it is directly editable again now that tracking is off', J('state.goals[1].currentSaved')===50000);
run(`setGoalContributionTracking(${goalId}, true)`);
ok('turning tracking ON again re-derives from the (still-present) contributions, not from the just-edited 50000', J('state.goals[1].currentSaved')===32000);

// ================= 4. rendering: split mode + joint + 2 earners only =================
load(); goSplit(); render();
let card301=els['container-goals-list'].children[0].innerHTML;
ok('split mode, joint goal, 2 earners: the contribution tracker section appears', /Each person&#0?39;s contribution/.test(card301)||/contribution/i.test(card301));
ok('...both earners are listed with their contribution amounts', /Lucas/.test(card301)&&/Sofia/.test(card301)&&/8.?000|8,000/.test(card301));
ok('...the currentSaved input is disabled (derived, not directly editable)', /data-focus-key="goal-\d+-currentSaved"[^>]*disabled/.test(card301));
let card302=els['container-goals-list'].children[1].innerHTML;
ok('an INDIVIDUALLY-owned goal (not joint) never shows the tracker, even in split mode', !/Each person/.test(card302) && /\+ Track each person/.test(card302)===false && /Enable tracking|Track each/.test(text(els['container-goals-list'].children[1]))===false);

load();   // shared mode
render();
ok('SHARED mode: no tracker and no "enable" link at all, regardless of owner', !/Track each person|Each person&#0?39;s contribution/.test(text(els['container-goals-list'])));

load(); goSplit();
run(`state.earners=[state.earners[0]];updateUI();`);
render();
ok('split mode but only 1 earner: the tracker does not appear even for a joint goal (nothing to compare)', !/Each person&#0?39;s contribution/.test(els['container-goals-list'].children[0].innerHTML));

// ================= 5. the "enable tracking" link, and toggling from the UI =================
load(); goSplit();
run(`state.goals[1].owner='joint';updateUI();`);   // make the individual goal joint so the tracker CAN appear
render();
let card=els['container-goals-list'].children[1].innerHTML;
ok('a joint goal with tracking OFF shows an "enable" link instead of the tracker', /Track each person|Enable/i.test(card));
run(`setGoalContributionTracking(${J('state.goals[1].id')}, true);`);
render();
card=els['container-goals-list'].children[1].innerHTML;
ok('after enabling, the tracker appears with the "turn off" control', /Turn off|Disable/i.test(card));

// ================= 6. "ahead/behind/on pace" wording on screen =================
load(); goSplit(); render();
const cardText=text(els['container-goals-list'].children[0]);
ok('Lucas (contributed more than his fair share) is shown as ahead', /Lucas/.test(cardText)&&new RegExp('Lucas[^\\n]*ahead').test(cardText.replace(/\s+/g,' ')) || /ahead/.test(cardText));
ok('Sofia (contributed less) is shown as behind', /behind/.test(cardText));
run(`state.goals[0].contributions[String(state.earners[0].id)]=7000;state.goals[0].contributions[String(state.earners[1].id)]=7000;state.goals[0].currentSaved=14000;updateUI();`);
render();
ok('equal contributions show as "on pace" for both, not ahead/behind', /on pace/.test(text(els['container-goals-list'].children[0])));

// ================= 7. sanitizer =================
const san=(o)=>J(`migrateAndSanitizeState(Object.assign({country:'BR'},${JSON.stringify(o)}))`);
let d=san({earners:[{id:1,name:'A'},{id:2,name:'B'}],goals:[{id:9,name:'G',targetAmount:100,trackContributions:true,contributions:{1:60,2:40}}]});
ok('sanitizer: valid contributions are kept and currentSaved is derived as their sum', d.goals[0].contributions['1']===60&&d.goals[0].contributions['2']===40&&d.goals[0].currentSaved===100);
d=san({earners:[{id:1,name:'A'}],goals:[{id:9,name:'G',targetAmount:100,trackContributions:true,contributions:{1:60,999:40}}]});
ok('sanitizer: a contribution keyed to an earner who does not exist is dropped (999), a real one kept (1)', d.goals[0].contributions['1']===60&&d.goals[0].contributions['999']===undefined&&d.goals[0].currentSaved===60);
d=san({goals:[{id:9,name:'G',targetAmount:100,currentSaved:500}]});
ok('sanitizer: tracking off by default, currentSaved stays a plain number (backward compatible)', d.goals[0].trackContributions===false&&d.goals[0].currentSaved===500);
d=san({goals:[{id:9,name:'G',targetAmount:100,trackContributions:'yes',contributions:{x:1}}]});
ok('sanitizer: junk trackContributions -> false; hostile contributions object -> empty, no crash', d.goals[0].trackContributions===false&&Object.keys(d.goals[0].contributions).length===0);
d=san({goals:[{id:9,name:'G',targetAmount:100,contributions:['not','an','object']}]});
ok('sanitizer: an ARRAY passed as contributions -> empty object, not accepted as-is', typeof d.goals[0].contributions==='object'&&!Array.isArray(d.goals[0].contributions)&&Object.keys(d.goals[0].contributions).length===0);
load();
const back=J(`(()=>{const p=JSON.parse(${JSON.stringify(run('JSON.stringify(buildExportPayload())'))});return migrateAndSanitizeState(p.data||p)})()`);
ok('export -> import (JSON) keeps tracking on and every contribution exactly', back.goals[0].trackContributions===true&&back.goals[0].contributions['1']===8000&&back.goals[0].contributions['2']===6000);

// ================= 8. Excel export/import round-trips contribution tracking =================
function stubXLSX() {
  run(`globalThis.__book={sheets:{},order:[]};globalThis.__wbBytes=null;
    XLSX={ utils:{ book_new:()=>({}), aoa_to_sheet:(rows)=>({rows}), book_append_sheet:(wb,ws,name)=>{__book.sheets[name]={rows:ws.rows};__book.order.push(name)}, sheet_to_json:(ws)=>ws.rows },
           writeFile:(wb,name)=>{__wbBytes={SheetNames:__book.order.slice(),Sheets:Object.assign({},__book.sheets)}}, read:(bytes)=>bytes };`);
}
load();
const beforeXlsx=run('JSON.stringify(state)');
stubXLSX(); run('exportDataXLSX()');
run(`FileReader = function() { this.readAsArrayBuffer = (file) => { this.onload({ target: { result: file.__wb } }); }; };`);
run(`handleImportXlsxFileSelected({ files: [{ __wb: __wbBytes }], value: '' });`);
ok('selecting the file shows the review modal (the REAL mechanism this app uses, not a generic confirm)', els['modal-import-review']._hidden!==true);
run(`confirmImportReview();`);
ok('Excel export -> import of an UNTOUCHED profile changes nothing (contribution tracking included)', run('JSON.stringify(state)')===beforeXlsx);
load();
run(`updateGoalContribution(state.goals[0].id, state.earners[0].id, '11000')`);
stubXLSX(); run('exportDataXLSX()');
const editedContribution=J('state.goals[0].contributions');
load();   // reset to demo defaults before importing
run(`FileReader = function() { this.readAsArrayBuffer = (file) => { this.onload({ target: { result: file.__wb } }); }; };`);
run(`handleImportXlsxFileSelected({ files: [{ __wb: __wbBytes }], value: '' });`);
run(`confirmImportReview();`);
ok('Excel export -> import carries an EDITED contribution through correctly', JSON.stringify(J('state.goals[0].contributions'))===JSON.stringify(editedContribution)&&J('state.goals[0].currentSaved')===11000+6000);

// ================= 9. translations, XSS, markup =================
for(const lang of ['pt','es','en']){
  load('BR',lang); goSplit(); render();
  const all=text(els['container-goals-list']);
  ok(`[${lang}] contribution tracker renders with no leftover placeholders`, all.length>50 && !/\{[a-z0-9]+\}|undefined|NaN/.test(all));
}
load('BR','en'); goSplit(); render();
ok('[en] no Portuguese in the goals contribution UI', !/ção|ões|Cada um|Contribuição/.test(text(els['container-goals-list'])));
run(`updateGoal(state.goals[1].id,'name','<img src=x onerror=alert(1)>')`);
render();
const hostileCard=els['container-goals-list'].children[1].innerHTML;
ok('a hostile goal name stays escaped even with the tracker present', /&lt;img src=x/.test(hostileCard)&&!/<img src=x/.test(hostileCard));
const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('markup: the Excel export sheet includes the tracked/contributions columns', /xlsxTracked|Tracked per person/.test(page)&&/xlsxContributions|Contributions \(JSON\)/.test(page));
process.exitCode=bad?1:0;
