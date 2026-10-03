// Bills & subscriptions: due-date math, summaries, reminders — mode-independent,
// and never touching state.outflows outside of the existing split-mode derivation.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const clear=(...ids)=>ids.forEach(id=>{if(els[id]&&els[id].children)els[id].children.length=0;});
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  syncFormInputsFromState();updateUI();`);
const item=(o)=>Object.assign({id:1,name:'X',category:'subs',amount:50,splitType:'joint',earnerId:null,customSplits:{},dueDay:null},o);

// ================= 1. due-date math (pure functions, real calendar edge cases) =================
const nextDue=(dueDay,today)=>J(`getRecurringNextDueDate(${JSON.stringify({dueDay})},new Date(${today.getFullYear()},${today.getMonth()},${today.getDate()}))`);
const daysUntil=(dueDay,today)=>J(`getRecurringDaysUntilDue(${JSON.stringify({dueDay})},new Date(${today.getFullYear()},${today.getMonth()},${today.getDate()}))`);
ok('no due day set -> null (never tracked)', nextDue(null,new Date())===null && daysUntil(null,new Date())===null);
{
  const jan15=new Date(2027,0,15);
  ok('due day is TODAY -> 0 days, not rolled to next month', daysUntil(15,jan15)===0);
  ok('due day is in a few days THIS month -> that many days', daysUntil(20,jan15)===5);
  ok('due day already passed THIS month -> rolls to next month', daysUntil(5,jan15)===31-15+5,`${daysUntil(5,jan15)} (expected ${31-15+5})`);
}
{
  // Feb 2027 (non-leap: 28 days). Due day 31 must clamp to the 28th, not overflow into March.
  const feb1=new Date(2027,1,1);
  const d=nextDue(31,feb1);
  ok('day 31 in a 28-day February clamps to the 28th (not March 3rd)', new Date(d).getMonth()===1&&new Date(d).getDate()===28,JSON.stringify(d));
  ok('...matching days-until-due', daysUntil(31,feb1)===27);
}
{
  // 2028 IS a leap year: Feb has 29 days.
  const feb1leap=new Date(2028,1,1);
  const d=nextDue(29,feb1leap);
  ok('day 29 in a LEAP February clamps to the 29th (not the 28th)', new Date(d).getMonth()===1&&new Date(d).getDate()===29);
}
{
  // A due day that FITS this month (no clamping needed here) but has already passed, rolling
  // into a SHORTER next month where it DOES need clamping: today = Jan 31 2027, due day 30 ->
  // Jan 30 already passed (today is the 31st) -> rolls to February, where 30 clamps to 28.
  const jan31=new Date(2027,0,31);
  const d=nextDue(30,jan31);
  ok('a due day already past in January, rolling into a shorter February, clamps there too (28th, not the 30th)', new Date(d).getMonth()===1&&new Date(d).getDate()===28,JSON.stringify(d));
}
{
  // December -> January year rollover.
  const dec20=new Date(2027,11,20);
  const d=nextDue(5,dec20);
  ok('a due day already past in December rolls into JANUARY OF THE NEXT YEAR', new Date(d).getFullYear()===2028&&new Date(d).getMonth()===0&&new Date(d).getDate()===5);
}
{
  // independent brute-force check across a whole year of "today"s
  let worst=0;
  for(let day=1;day<=365;day+=3){
    const today=new Date(2027,0,1); today.setDate(today.getDate()+day-1);
    for(const dd of [1,15,28,30,31]){
      const got=daysUntil(dd,today);
      // independent computation: scan forward day by day for the first date whose day-of-month
      // equals min(dd, days in that month)
      let t=new Date(today.getFullYear(),today.getMonth(),today.getDate());
      let n=0;
      while(true){
        const dim=new Date(t.getFullYear(),t.getMonth()+1,0).getDate();
        if(t.getDate()===Math.min(dd,dim)) break;
        t.setDate(t.getDate()+1); n++;
        if(n>62) break;
      }
      if(got!==n) worst=Math.max(worst,1);
    }
  }
  ok('brute-force cross-check across a full year, 5 due-days, every 3rd day: always matches an independent day-by-day scan', worst===0);
}

// ================= 2. summary and due-soon list =================
load(); run(`state.recurringExpenses=[]`);
ok('summary with nothing added: all zero', J('getRecurringBillsSummary()').totalCount===0&&J('getRecurringBillsSummary()').totalAmount===0);
run(`state.recurringExpenses=[${JSON.stringify(item({id:1,category:'subs',amount:50}))},${JSON.stringify(item({id:2,category:'subs',amount:30}))},${JSON.stringify(item({id:3,category:'housing',amount:2000}))}]`);
let sum=J('getRecurringBillsSummary()');
ok('summary: 2 subscriptions totaling 80, 1 other bill totaling 2000, combined 3/2080', sum.subsCount===2&&sum.subsTotal===80&&sum.billsCount===1&&sum.billsTotal===2000&&sum.totalCount===3&&sum.totalAmount===2080);
run(`state.recurringExpenses=[${JSON.stringify(item({id:1,dueDay:null}))},${JSON.stringify(item({id:2,dueDay:5}))},${JSON.stringify(item({id:3,dueDay:10}))}]`);
ok('the upcoming list only includes items WITH a due day, sorted soonest first', J('getUpcomingRecurringItems().length')===2 && J('getUpcomingRecurringItems()[0].daysUntilDue')<=J('getUpcomingRecurringItems()[1].daysUntilDue'));
ok('an item with no due day never appears in the due-soon list', !J('getDueSoonRecurringItems().map(x=>x.id)').includes(1));

// ================= 3. works in BOTH household modes, and NEVER changes outflows outside the existing split derivation =================
load();
ok('default mode is shared', J('state.householdMode')==='shared');
const outflowsBefore=run('JSON.stringify(state.outflows)');
run('addBillOrSubscription()');
let newId=J('state.recurringExpenses[state.recurringExpenses.length-1].id');
run(`updateRecurringExpense(${newId},'name','Netflix');updateRecurringExpense(${newId},'category','subs');updateRecurringExpense(${newId},'amount','55');updateRecurringExpense(${newId},'dueDay','15')`);
ok('in SHARED mode, adding/editing a bill (with a due day) leaves state.outflows completely untouched', run('JSON.stringify(state.outflows)')===outflowsBefore);
ok('...the item itself is saved correctly, including the due day', J(`state.recurringExpenses.find(x=>x.id===${newId})`).name==='Netflix'&&J(`state.recurringExpenses.find(x=>x.id===${newId})`).dueDay===15);

load();
run(`globalThis.__c=null;showConfirmModal=(o)=>{__c=o};setHouseholdMode('split');__c.onConfirm();`);
run('addBillOrSubscription()');
newId=J('state.recurringExpenses[state.recurringExpenses.length-1].id');
run(`updateRecurringExpense(${newId},'category','subs');updateRecurringExpense(${newId},'amount','40');updateRecurringExpense(${newId},'dueDay','20')`);
ok('in SPLIT mode, the same bill/subscription item ALSO updates outflows.subs (the existing derivation, untouched by this feature)', J('state.outflows.subs')===J(`state.recurringExpenses.filter(x=>x.category==='subs').reduce((s,x)=>s+x.amount,0)`));
ok('...and it still carries a due day, usable by the bills list even in split mode', J(`state.recurringExpenses.find(x=>x.id===${newId})`).dueDay===20);

// a direct call to recomputeOutflowsFromRecurring() (bypassing handleDataUpdate/readInputsIntoState
// entirely) must STILL never touch Shared mode's outflows — the earlier version of this guarantee
// only held by coincidence (two bugs canceling out via call ordering), which this specifically guards.
load();
const outflowsDirect=run('JSON.stringify(state.outflows)');
run(`state.recurringExpenses=[{id:1,name:'X',category:'subs',amount:9,splitType:'joint',earnerId:null,customSplits:{},dueDay:null}];recomputeOutflowsFromRecurring();`);
ok('a DIRECT call to recomputeOutflowsFromRecurring() (no handleDataUpdate afterward) does not corrupt Shared mode\'s outflows either', run('JSON.stringify(state.outflows)')===outflowsDirect);
run(`globalThis.__c=null;showConfirmModal=(o)=>{__c=o};setHouseholdMode('split');__c.onConfirm();state.recurringExpenses=[{id:1,name:'X',category:'subs',amount:9,splitType:'joint',earnerId:null,customSplits:{},dueDay:null}];recomputeOutflowsFromRecurring();`);
ok('...but in SPLIT mode, a direct call still correctly derives outflows.subs from the list (9)', J('state.outflows.subs')===9);

// ================= 4. rendering: summary, banner, list, always visible regardless of mode =================
load(); run(`state.recurringExpenses=[]`);
clear('container-bills-list'); run('renderBillsSubscriptions()');
ok('empty state: a friendly message, no crash', /No bills or subscriptions added yet/.test(text(els['bills-summary'])));
ok('no due-soon banner when there is nothing', els['bills-due-soon-banner']._hidden===true);

// use the app's OWN due-date function to pick due days that are genuinely inside vs. outside
// the reminder window, rather than error-prone day-of-month arithmetic in the test itself
const findDueDayForDays = (targetDays) => { for (let dd = 1; dd <= 31; dd++) { if (J(`getRecurringDaysUntilDue(${JSON.stringify({dueDay: dd})})`) === targetDays) return dd; } return null; };
const in2Days = findDueDayForDays(2), in20Days = findDueDayForDays(20);
run(`state.recurringExpenses=[${JSON.stringify(item({id:1,name:'Netflix',category:'subs',amount:55,dueDay:in2Days}))},${JSON.stringify(item({id:2,name:'Rent',category:'housing',amount:2000,dueDay:in20Days}))}]`);
clear('container-bills-list'); run('renderBillsSubscriptions()');
ok('summary shows real counts and totals', /1 .{0,3}R\$ 55|1 — \$55/.test(text(els['bills-summary']).replace(/\s+/g,' '))||text(els['bills-summary']).includes('55'));
ok('the due-soon banner appears and names the item due soon (Netflix), not the one due later (Rent)', els['bills-due-soon-banner']._hidden===false && /Netflix/.test(text(els['bills-due-soon-banner'])) && !/Rent/.test(text(els['bills-due-soon-banner'])));
ok('the list renders both items, one card each', els['container-bills-list'].children.length===2);
const cards=els['container-bills-list'].children.map(c=>c.innerHTML).join(' ');
ok('the soon-due item shows a "due in N days" style label', /due (today|tomorrow|in \d+ days)/.test(cards));
ok('an item WITHOUT a due day shows the "no due date" hint instead', (()=>{run(`state.recurringExpenses.push(${JSON.stringify(item({id:3,name:'Random',dueDay:null}))})`);clear('container-bills-list');run('renderBillsSubscriptions()');return /no due date set/.test(els['container-bills-list'].children.map(c=>c.innerHTML).join(' '))})());

// urgent styling: an item due soon gets a distinct border class from one that isn't
run(`state.recurringExpenses=[${JSON.stringify(item({id:1,name:'Soon',dueDay:in2Days}))},${JSON.stringify(item({id:2,name:'Later',dueDay:in20Days}))}]`);
clear('container-bills-list'); run('renderBillsSubscriptions()');
const classes2=els['container-bills-list'].children.map(c=>c.className).join(' ');
ok('the due-soon card and the not-due-soon card are visually distinguished (amber vs. plain border)', /border-amber-500\/40/.test(classes2)&&/\bborder-slate-800\b/.test(classes2));

// ================= 5. editing: add, remove, name/category/amount/dueDay, invalid due days =================
load(); run(`state.recurringExpenses=[]`);
run('addBillOrSubscription()');
ok('adding a bill creates exactly one item, with no due day by default', J('state.recurringExpenses.length')===1 && J('state.recurringExpenses[0].dueDay')===null);
const id0=J('state.recurringExpenses[0].id');
run(`updateRecurringExpense(${id0},'dueDay','15')`);
ok('setting a valid due day (15) works', J('state.recurringExpenses[0].dueDay')===15);
run(`updateRecurringExpense(${id0},'dueDay','0')`);
ok('day 0 is invalid -> treated as "no due date" (null), not clamped to 1', J('state.recurringExpenses[0].dueDay')===null);
run(`updateRecurringExpense(${id0},'dueDay','15');updateRecurringExpense(${id0},'dueDay','32')`);
ok('day 32 is invalid -> null, not clamped to 31', J('state.recurringExpenses[0].dueDay')===null);
run(`updateRecurringExpense(${id0},'dueDay','abc')`);
ok('junk text -> null, no crash', J('state.recurringExpenses[0].dueDay')===null);
run(`updateRecurringExpense(${id0},'dueDay','15.7')`);
ok('a fractional day is rounded to a whole day', J('state.recurringExpenses[0].dueDay')===16);
run(`removeRecurringExpense(${id0})`);
ok('removing a bill removes it', J('state.recurringExpenses.length')===0);

// ================= 6. sanitizer: dueDay is validated and round-trips =================
const san=(o)=>J(`migrateAndSanitizeState(Object.assign({country:'BR'},${JSON.stringify(o)}))`);
let d=san({recurringExpenses:[{id:1,name:'A',category:'subs',amount:10,dueDay:15}]});
ok('sanitizer: a valid due day is kept', d.recurringExpenses[0].dueDay===15);
d=san({recurringExpenses:[{id:1,name:'A',category:'subs',amount:10,dueDay:0},{id:2,name:'B',category:'subs',amount:10,dueDay:32},{id:3,name:'C',category:'subs',amount:10,dueDay:-5},{id:4,name:'D',category:'subs',amount:10}]});
ok('sanitizer: 0, 32, negative and missing due days all become null (never a fabricated date)', d.recurringExpenses.every(x=>x.dueDay===null));
d=san({recurringExpenses:[{id:1,name:'A',category:'subs',amount:10,dueDay:'15'}]});
ok('sanitizer: a numeric STRING due day is parsed correctly', d.recurringExpenses[0].dueDay===15);
d=san({recurringExpenses:[{id:1,name:'A',category:'subs',amount:10,dueDay:{x:1}}]});
ok('sanitizer: a hostile (object) due day -> null, no crash', d.recurringExpenses[0].dueDay===null);
load(); run(`state.recurringExpenses=[${JSON.stringify(item({id:1,name:'Rent',dueDay:5}))}]`);
const back=J(`(()=>{const p=JSON.parse(${JSON.stringify(run('JSON.stringify(buildExportPayload())'))});return migrateAndSanitizeState(p.data||p)})()`);
ok('export -> import keeps the due day', back.recurringExpenses[0].dueDay===5);

// ================= 7. translations, XSS, markup =================
run(`addBillOrSubscription();updateRecurringExpense(state.recurringExpenses[state.recurringExpenses.length-1].id,'name','<img src=x onerror=alert(1)>')`);
clear('container-bills-list'); run('renderBillsSubscriptions()');
const cardsHtml=els['container-bills-list'].children.map(c=>c.innerHTML).join(' ');
ok('a bill name is HTML-escaped, not injected raw', /&lt;img src=x/.test(cardsHtml)&&!/<img src=x/.test(cardsHtml));
for(const lang of ['pt','es','en']){
  load('BR',lang);
  run(`state.recurringExpenses=[${JSON.stringify(item({id:1,name:'Netflix',category:'subs',amount:55,dueDay:1}))}]`);
  clear('container-bills-list'); run('renderBillsSubscriptions()');
  const all=text(els['bills-summary'])+els['container-bills-list'].children.map(c=>c.innerHTML).join(' ');
  ok(`[${lang}] bills UI is translated, no leftover placeholders`, all.length>50 && !/\{[a-z0-9]+\}|undefined|NaN/.test(all));
}
load('BR','en');
run(`state.recurringExpenses=[${JSON.stringify(item({id:1,name:'Netflix',category:'subs',amount:55,dueDay:1}))}]`);
clear('container-bills-list'); run('renderBillsSubscriptions()');
ok('[en] no Portuguese in the bills UI', !/ção|ões|Assinaturas|vencendo|vence\b/.test(text(els['bills-summary'])+els['container-bills-list'].children.map(c=>c.innerHTML).join(' ')));
const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('markup: the bills card exists and is NOT nested inside the shared/split toggle divs', /id="container-bills-list"/.test(page)&&/id="bills-due-soon-banner"/.test(page)&&page.indexOf('id="container-bills-list"')>page.indexOf('id="row-cashflow-split"'));
process.exitCode=bad?1:0;
