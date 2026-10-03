// Life events: schedule, simulation math, integration with every projection, sanitizing, UI, translations.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const CY=new Date().getFullYear();
const ev=(o)=>Object.assign({id:1,kind:'oneoff',direction:'out',name:'e',year:CY+1,amount:1000,years:1,enabled:true},o);
const sim=(o)=>J(`(()=>{const r=simulateRealPortfolio(Object.assign({start:0,monthlyInvest:0,years:5,realReturn:0,careerGrowthRate:0,careerGrowthProportional:false,events:[],surplus:0},${JSON.stringify(o)}));return {v:r.values,dep:r.depletedAtYear,unf:r.unfunded}})()`);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  if('${country}'==='ES'){state.baseCurrency='EUR';state.displayCurrency='EUR';state.earners.forEach(e=>e.regime='Cuenta Ajena')}
  if('${country}'==='GL'){state.baseCurrency='USD';state.displayCurrency='USD';state.earners.forEach(e=>e.regime='Employee')}
  state.debtPlan.autoEvents=false;   // these tests are about the person's own events
  syncFormInputsFromState();`);
const setEv=(list)=>run(`state.lifeEvents=${JSON.stringify(list)};`);
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ');

// ============ 1. the schedule ============
const sch=(events,years=10)=>J(`buildLifeEventSchedule(${JSON.stringify(events)},${years},${CY})`);
let s=sch([ev({year:CY,amount:500})]);
ok('one-off in the current year lands at index 0 (start of this year)',s.oneOff[0]===-500);
s=sch([ev({year:CY-2}),ev({year:CY+11}),ev({year:CY+10,amount:7})]);
ok('one-offs in the past or beyond the horizon are ignored; the last horizon year is kept',s.oneOff.slice(0,10).every(x=>x===0)&&s.oneOff[10]===-7);
s=sch([ev({kind:'monthly',year:CY+2,years:3,amount:100,direction:'in'})]);
ok('monthly event: active exactly for its years (2,3,4), with the right sign',eq(s.monthly.map((x,i)=>x?i:null).filter(x=>x!==null),[2,3,4])&&s.monthly[2]===100);
s=sch([ev({kind:'monthly',year:CY-2,years:5,amount:50})]);
ok('monthly event that started in the past still counts for its REMAINING years (idx 0,1,2)',eq(s.monthly.slice(0,4),[-50,-50,-50,0]));
s=sch([ev({kind:'monthly',year:CY-9,years:5})]);
ok('monthly event that already ended is ignored',s.monthly.every(x=>x===0));
s=sch([ev({enabled:false,amount:999}),ev({amount:0}),ev({direction:'in',amount:300}),ev({amount:100})]);
ok('disabled and zero-amount events are ignored; events in the same year add up (+300 -100)',s.oneOff[1]===200);
s=sch([ev({kind:'monthly',year:CY+8,years:30,amount:10})]);
ok('a long monthly event is cut at the horizon (no out-of-range writes)',s.monthly.length===11&&s.monthly[10]===-10&&s.oneOff.length===11);

// ============ 2. the simulation, checked by hand (return 0% so the arithmetic is exact) ============
let r=sim({monthlyInvest:1000,years:3});
ok('no events, 0% return: 0 -> 12k -> 24k -> 36k',eq(r.v.slice(0,4),[0,12000,24000,36000])&&r.dep===null&&r.unf===0);
r=sim({monthlyInvest:1000,years:3,events:[ev({year:CY+2,direction:'in',amount:5000})]});
ok('+5,000 at the start of year 2 (before that year\'s investing): 0,12k,29k,41k',eq(r.v.slice(0,4),[0,12000,29000,41000]),r.v.slice(0,4).join(','));
r=sim({start:50000,years:2,events:[ev({year:CY,amount:20000})]});
ok('one-off in the current year applies immediately: 50k - 20k = 30k at index 0',r.v[0]===30000);
r=sim({monthlyInvest:1000,years:3,events:[ev({kind:'monthly',year:CY+1,years:1,amount:500})]});
ok('monthly cost of 500 with no surplus: investing falls 1000->500 in that year only (0,12k,18k,30k)',eq(r.v.slice(0,4),[0,12000,18000,30000]),r.v.slice(0,4).join(','));
r=sim({monthlyInvest:1000,years:3,surplus:300,events:[ev({kind:'monthly',year:CY+1,years:1,amount:500})]});
ok('...with a 300 monthly surplus, the surplus pays 300 first: investing falls only 200 (0,12k,21.6k,33.6k)',eq(r.v.slice(0,4),[0,12000,21600,33600]),r.v.slice(0,4).join(','));
r=sim({monthlyInvest:1000,years:3,surplus:600,events:[ev({kind:'monthly',year:CY+1,years:1,amount:500})]});
ok('...a surplus that covers the whole cost leaves the plan untouched',eq(r.v.slice(0,4),[0,12000,24000,36000]));
r=sim({monthlyInvest:1000,years:3,events:[ev({kind:'monthly',year:CY,years:2,amount:200,direction:'in'})]});
ok('monthly income of +200 for 2 years is invested (14.4k a year, then back to 12k)',eq(r.v.slice(0,4),[0,14400,28800,40800]),r.v.slice(0,4).join(','));
r=sim({monthlyInvest:1000,years:1,events:[ev({kind:'monthly',year:CY,years:1,amount:1500})]});
ok('a cost bigger than the monthly investing draws the difference from the portfolio (negative contribution)',r.v[1]===-6000||r.v[1]===0);
r=sim({start:10000,years:3,events:[ev({year:CY+1,amount:25000})]});
ok('one-off larger than the portfolio: portfolio floors at 0, 15,000 reported unfunded, depleted in year 1',r.v[1]===0&&r.unf===15000&&r.dep===1&&r.v[2]===0,JSON.stringify({unf:r.unf,dep:r.dep}));
r=sim({start:20000,years:5,events:[ev({kind:'monthly',year:CY,years:5,amount:1000})]});
ok('monthly cost of 1,000 with no income: 20k -> 8k -> runs out in year 2; unfunded 4k + 3 x 12k = 40k',eq(r.v.slice(0,6),[20000,8000,0,0,0,0])&&r.dep===2&&r.unf===40000,JSON.stringify({dep:r.dep,unf:r.unf}));
const cmpA=sim({start:5000,monthlyInvest:800,years:6,realReturn:0.04,careerGrowthRate:2,careerGrowthProportional:true}),cmpB=sim({start:5000,monthlyInvest:800,years:6,realReturn:0.04,careerGrowthRate:2,careerGrowthProportional:true,events:[ev({enabled:false}),ev({amount:0})]});
ok('disabled / zero events leave the projection bit-for-bit identical',eq(cmpA,cmpB));

// ============ 3. independent reference simulator vs the engine on 400 random event sets ============
run(`globalThis.refSim=function(o){
  const cy=o.cy;let bal=o.start,unf=0,dep=null;const vals=[];
  const oneOffAt=(k)=>{let s=0;for(const e of o.events){if(e.enabled===false||e.kind==='monthly')continue;if(Math.round(e.year-cy)===k)s+=(e.direction==='in'?1:-1)*e.amount}return s};
  const monthlyAt=(k)=>{let s=0;for(const e of o.events){if(e.enabled===false||e.kind!=='monthly')continue;const st=Math.round(e.year-cy),du=Math.max(1,Math.round(e.years));if(k>=st&&k<st+du)s+=(e.direction==='in'?1:-1)*e.amount}return s};
  const floor=(k)=>{if(bal<0){unf-=bal;if(dep===null)dep=k;bal=0}};
  bal+=oneOffAt(0);floor(0);vals.push(bal);
  for(let y=0;y<o.years;y++){
    let c=getProjectedMonthlyContribution(o.inv,y,o.g,o.p);const d=monthlyAt(y);
    if(d>0)c+=d;else if(d<0)c-=Math.max(0,-d-o.surplus);
    bal=compoundOneYear(bal,c,o.r);floor(y+1);
    bal+=oneOffAt(y+1);floor(y+1);
    vals.push(bal)}
  return {vals,unf,dep}}`);
let seed=12345;const rnd=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296};
let mism=0,first=null;
for(let i=0;i<400;i++){
  const n=Math.floor(rnd()*6);const events=[];
  for(let j=0;j<n;j++)events.push({id:j+1,kind:rnd()<.5?'oneoff':'monthly',direction:rnd()<.45?'in':'out',name:'x',year:CY+Math.floor(rnd()*50)-8,amount:Math.round(rnd()*rnd()*90000),years:1+Math.floor(rnd()*20),enabled:rnd()<.9});
  const o={start:Math.round(rnd()*400000),inv:Math.round(rnd()*6000),years:35,r:[0,0.02,0.045,0.08][Math.floor(rnd()*4)],g:[0,2,4][Math.floor(rnd()*3)],p:rnd()<.6,events,surplus:Math.round(rnd()*2000),cy:CY};
  const a=J(`(()=>{const x=simulateRealPortfolio({start:${o.start},monthlyInvest:${o.inv},years:35,realReturn:${o.r},careerGrowthRate:${o.g},careerGrowthProportional:${o.p},events:${JSON.stringify(events)},surplus:${o.surplus},currentYear:${CY}});return {vals:x.values,unf:x.unfunded,dep:x.depletedAtYear}})()`);
  const b=J(`refSim(${JSON.stringify(o)})`);
  if(!eq(a.vals,b.vals)||Math.abs(a.unf-b.unf)>1e-6||a.dep!==b.dep){mism++;if(!first)first=JSON.stringify(o).slice(0,160)}
}
ok('engine == independent reference simulator on 400 random event sets (values, unfunded, depletion year)',mism===0,mism?first:'0 mismatches');

// ============ 4. the events change EVERY projection ============
load();setEv([]);
const base=J(`(()=>{const m=calculateMetrics();return {y:m.yearsToCrossover,port:m.totalLiquidBase}})()`);
const bigOut=Math.round(base.port*3);
setEv([ev({year:CY+1,amount:bigOut})]);
let m1=J(`(()=>{const m=calculateMetrics();return {y:m.yearsToCrossover,n:m.lifeEvents.filter(e=>!e.auto).length}})()`);
ok('a big outflow delays the freedom year (or makes it unreachable) — the Overview metric',m1.n===1&&(m1.y===null||m1.y>base.y),`${base.y} -> ${m1.y}`);
setEv([ev({year:CY+1,amount:bigOut,direction:'in'})]);
m1=J(`calculateMetrics().yearsToCrossover`);
ok('a big inflow brings the freedom year forward (or already reached)',m1!==null&&(base.y===null||m1<base.y||m1===0),`${base.y} -> ${m1}`);
setEv([ev({year:CY+1,amount:bigOut,enabled:false})]);
ok('a disabled event changes nothing',J(`calculateMetrics().yearsToCrossover`)===base.y);
// Retirement chart uses the same events
const chartReal=()=>{run(`globalThis.__c=null;Chart=function(c,cfg){globalThis.__c=cfg;this.destroy=()=>{}};renderRetirementChart(calculateMetrics());`);return J(`__c.data.datasets[0].data`)};
setEv([]);const c0=chartReal();setEv([ev({year:CY+3,amount:200000,direction:'in'})]);const c1=chartReal();
ok('the Retirement chart shows the event (identical before it, higher from its year on)',c0.slice(0,3).every((v,i)=>v===c1[i])&&c1[3]>c0[3]&&c1[10]>c0[10]);
// What-if: current plan and scenario both include the events
setEv([ev({year:CY+1,amount:bigOut})]);run(`state.whatIf=Object.assign({},WHATIF_NEUTRAL)`);
ok('What-if "current plan" includes the events (equals calculateMetrics)',J(`computeWhatIf().base.freedomYears`)===J(`calculateMetrics().yearsToCrossover`)&&J(`computeWhatIf().scen.freedomYears`)===J(`calculateMetrics().yearsToCrossover`));
load();setEv([ev({year:CY+2,amount:bigOut,direction:'in'})]);
ok('What-if projection at the retirement age includes the events (differs from the no-event projection)',(()=>{const r=J(`(()=>{const m=calculateMetrics(),y=computeWhatIf().base.yearsToRetire;const a=wiProjectedAt(m,y);const b=simulateRealPortfolio({start:m.totalLiquidBase,monthlyInvest:m.monthlyInvest,years:y,realReturn:m.realAnnualReturn,careerGrowthRate:m.careerGrowthRate,careerGrowthProportional:m.careerGrowthProportional,events:[],surplus:m.monthlySurplus}).values[y];return {a,b,y}})()`);return r.y>=2&&r.a>r.b})());
// metrics for another data object never touch the real one
const before=run('JSON.stringify(state)');run(`calculateMetricsFor(Object.assign(JSON.parse(JSON.stringify(state)),{lifeEvents:[]}))`);
ok('calculateMetricsFor() leaves the real data alone',run('JSON.stringify(state)')===before);
for(const c of ['BR','ES','GL']){load(c);setEv([ev({year:CY+2,amount:50000}),ev({kind:'monthly',year:CY+3,years:4,amount:1500})]);
  ok(`[${c}] events flow through calculateMetrics without NaN`,J(`(()=>{const m=calculateMetrics();return Number.isFinite(m.totalLiquidBase)&&Number.isFinite(m.targetFreedomCapital)&&(m.yearsToCrossover===null||Number.isFinite(m.yearsToCrossover))})()`));}

// ============ 5. sanitizing / persistence ============
const san=(x)=>J(`migrateAndSanitizeState({country:'BR',lifeEvents:${JSON.stringify(x)}}).lifeEvents`);
let e=san([{id:'x',kind:'zzz',direction:'sideways',name:'<img src=x onerror=alert(1)>',year:'2030',amount:'-5',years:999,enabled:'no'}])[0];
ok('sanitizer: junk enums fall back, negative amount->0, years capped at 60, junk bool->true, year parsed',e.kind==='oneoff'&&e.direction==='out'&&e.amount===0&&e.years===60&&e.enabled===true&&e.year===2030,JSON.stringify(e).slice(0,140));
ok('sanitizer: ids are unique positive integers even when duplicated or missing',(()=>{const a=san([{id:7},{id:7},{}]);return new Set(a.map(x=>x.id)).size===3&&a.every(x=>Number.isSafeInteger(x.id)&&x.id>0)})());
ok('sanitizer: year clamped to 1990..2200, huge amount capped, more than 40 events trimmed',san([{year:5}])[0].year===1990&&san([{year:99999}])[0].year===2200&&san([{amount:1e30}])[0].amount<=1e13&&san(Array.from({length:60},(_,i)=>({id:i+1}))).length===40);
ok('sanitizer: non-array / hostile input -> empty list',eq(san('nope'),[])&&eq(san(null),[])&&eq(san({a:1}),[]));
ok('old profiles (no lifeEvents field) load with no events',eq(J(`migrateAndSanitizeState({country:'BR',earners:[]}).lifeEvents`),[]));
ok('prototype pollution through an event is ignored',(()=>{run(`migrateAndSanitizeState(JSON.parse('{"country":"BR","lifeEvents":[{"__proto__":{"polluted":1},"amount":5}]}'))`);return run('({}).polluted')===undefined})());
load();setEv([ev({id:11,name:'Casa',year:CY+4,amount:80000,kind:'monthly',years:12,direction:'in',enabled:false})]);
const exp=run('JSON.stringify(buildExportPayload())');
const back=J(`(()=>{const p=JSON.parse(${JSON.stringify(exp)});return migrateAndSanitizeState(p.data||p).lifeEvents})()`);
ok('export -> import keeps every field of every event',back.length===1&&back[0].name==='Casa'&&back[0].year===CY+4&&back[0].amount===80000&&back[0].kind==='monthly'&&back[0].years===12&&back[0].direction==='in'&&back[0].enabled===false,JSON.stringify(back[0]));

// ============ 6. the tab: templates, editing, list, chart, verdict ============
const box=(id)=>{const b=els[id];if(b&&b.children)b.children.length=0;return b};
load('BR','en');setEv([]);
run(`addLifeEvent('home')`);let L=J('state.lifeEvents');
ok('template "Buy a home": a down payment (one-off, out) + a monthly cost for 25 years, both in year+2, names in English',L.length===2&&L[0].kind==='oneoff'&&L[0].direction==='out'&&L[1].kind==='monthly'&&L[1].years===25&&L.every(x=>x.year===CY+2)&&L[0].name==='Home down payment',L.map(x=>x.name).join(' | '));
setEv([]);run(`addLifeEvent('career')`);L=J('state.lifeEvents');
const net1=J(`(()=>{const s=JSON.parse(JSON.stringify(state));s.earners=s.earners.slice(0,1);s.lifeEvents=[];return Math.round(calculateMetricsFor(s).totalEarnersNet)})()`);
ok('template "Career break": monthly cost pre-filled with the FIRST earner\'s net pay, 1 year',L.length===1&&L[0].kind==='monthly'&&L[0].direction==='out'&&L[0].amount===net1&&net1>0&&L[0].years===1,`${L[0].amount} vs ${net1}`);
setEv([]);run(`addLifeEvent('windfall')`);ok('template "Bonus / inheritance": one-off, money IN',J('state.lifeEvents[0].direction')==='in'&&J('state.lifeEvents[0].kind')==='oneoff');
setEv([]);run(`addLifeEvent('tuition')`);ok('template "Tuition": monthly, out, 4 years',J('state.lifeEvents[0].kind')==='monthly'&&J('state.lifeEvents[0].years')===4&&J('state.lifeEvents[0].direction')==='out');
setEv([]);run(`addLifeEvent('purchase')`);run(`addLifeEvent('custom')`);ok('templates "Big purchase" and "Other event" add one event each',J('state.lifeEvents.length')===2);
setEv([ev({id:5,amount:100})]);
run(`updateLifeEvent(5,'amount','-50')`);ok('editing: negative amount -> 0',J('state.lifeEvents[0].amount')===0);
run(`updateLifeEvent(5,'amount','2500.5')`);ok('editing: amount stored',J('state.lifeEvents[0].amount')===2500.5);
run(`updateLifeEvent(5,'year','5')`);ok('editing: year clamped to 1990',J('state.lifeEvents[0].year')===1990);
run(`updateLifeEvent(5,'years','0')`);run(`updateLifeEvent(5,'years','999')`);ok('editing: duration clamped to 1..60',J('state.lifeEvents[0].years')===60);
run(`updateLifeEvent(5,'kind','monthly')`);run(`updateLifeEvent(5,'direction','in')`);run(`updateLifeEvent(5,'enabled',false)`);
ok('editing: type, direction and on/off',J('state.lifeEvents[0].kind')==='monthly'&&J('state.lifeEvents[0].direction')==='in'&&J('state.lifeEvents[0].enabled')===false);
run(`updateLifeEvent(5,'name','${'x'.repeat(200)}')`);ok('editing: name limited to 80 characters',J('state.lifeEvents[0].name.length')===80);
run(`removeLifeEvent(5)`);ok('deleting removes the event',J('state.lifeEvents.length')===0);
run(`updateLifeEvent(999,'amount','5')`);ok('editing an unknown id is a no-op',true);
// editing goes through the whole app (handleDataUpdate) -> the freedom year moves
load();setEv([ev({id:6,year:CY+1,amount:0})]);const y0=J('calculateMetrics().yearsToCrossover');
run(`updateLifeEvent(6,'amount','${bigOut}')`);
ok('typing an amount changes the freedom year everywhere (updateUI runs)',J('calculateMetrics().yearsToCrossover')!==y0||J('calculateMetrics().yearsToCrossover')===null);
// list rendering
load('BR','en');setEv([ev({id:1,name:'Later',year:CY+9,amount:500}),ev({id:2,name:'Sooner',year:CY+2,amount:0}),ev({id:3,name:'Old',year:CY-3,amount:10}),ev({id:4,name:'Far',year:CY+60,amount:10}),ev({id:8,name:'<img src=x onerror=alert(1)>',year:CY+1,amount:5})]);
box('container-life-events');run('renderLifeEvents(calculateMetrics())');
const html=els['container-life-events'].children.map(c=>c.innerHTML).join('\n');
const order=[...html.matchAll(/data-focus-key="event-(\d+)-name"/g)].map(x=>+x[1]);
ok('list is sorted by year (soonest first)',eq(order,[3,8,2,1,4]),order.join(','));
ok('hints: amount 0 warns, past event is flagged, event beyond 35 years is flagged',/enter an amount: with 0/.test(html)&&/in the past and is ignored/.test(html)&&/beyond the 35-year horizon/.test(html));
ok('event names are HTML-escaped in the list (no injected markup)',!/<img src=x/.test(html)&&/&lt;img/.test(html));
ok('each card shows the age at the event',new RegExp(`age ${J('state.earners[0].age')+2}`).test(html));
load('BR','en');setEv([]);box('container-life-events');run('renderLifeEvents(calculateMetrics())');
ok('empty state explains what to do',/No events yet/.test(text(els['container-life-events'])));
// chart + verdict
const chartCfg=()=>{run(`globalThis.__lc=null;Chart=function(c,cfg){globalThis.__lc=cfg;this.destroy=()=>{}};renderLifeEvents(calculateMetrics());`);return J(`(()=>{const c=__lc;return {n:c.data.datasets.length,names:c.data.datasets.map(d=>d.label),radius:c.data.datasets[1].pointRadius,without:c.data.datasets[0].data,withEv:c.data.datasets[1].data,labels:c.data.labels,tip:c.options.plugins.tooltip.callbacks.afterBody([{dataIndex:${CY+2-CY}}]),title:c.options.plugins.tooltip.callbacks.title([{dataIndex:2}])}})()`)};
load('BR','en');setEv([ev({name:'Renovation',year:CY+2,amount:90000})]);let cc=chartCfg();
ok('chart: 3 series (without / with / target) over 36 years starting this year',cc.n===3&&cc.labels.length===36&&cc.labels[0]===CY&&/Without events/.test(cc.names[0])&&/With events/.test(cc.names[1]));
ok('chart: the event year is marked with a point and named in the tooltip; other years have no marker',cc.radius[2]>0&&cc.radius[3]===0&&/Renovation/.test((cc.tip||[]).join(' ')),(cc.tip||[]).join('|'));
ok('chart: the tooltip title shows the year and the age',new RegExp(`${CY+2} · age`).test(cc.title));
ok('chart: identical before the event, lower after an outflow',cc.withEv[1]===cc.without[1]&&cc.withEv[5]<cc.without[5]);
setEv([]);cc=chartCfg();ok('chart: with no events the two lines coincide',eq(cc.withEv,cc.without));
const verdict=(list)=>{load('BR','en');setEv(list);box('le-verdict');run('renderLifeEvents(calculateMetrics())');return text(els['le-verdict']).replace(/\s+/g,' ')};
const pot=J('calculateMetrics().totalLiquidBase');
ok('verdict: no events -> invitation to add one',/no active events with an amount/i.test(verdict([])));
ok('verdict: an outflow -> "later" (or no longer reached) with ages and years',/(later|no longer reached)/.test(verdict([ev({year:CY+1,amount:Math.round(pot*3)})])),verdict([ev({year:CY+1,amount:Math.round(pot*3)})]).slice(0,120));
ok('verdict: an inflow -> "earlier" (or reached)',/(earlier|you reach financial freedom)/.test(verdict([ev({year:CY+1,amount:Math.round(pot*3),direction:'in'})])));
ok('verdict: an event too small to matter -> "do not move"',/do not move/.test(verdict([ev({year:CY+30,amount:1})])),verdict([ev({year:CY+30,amount:1})]).slice(0,100));
ok('verdict: a cost the portfolio cannot cover -> depletion warning with year and amount',/runs out in \d{4}.*left unfunded|cannot cover the events/.test(verdict([ev({kind:'monthly',year:CY,years:40,amount:Math.round(pot)})])));
ok('no NaN / undefined / raw {placeholders} on screen',!/NaN|undefined|Infinity|\{[a-z0-9]+\}/.test(verdict([ev({year:CY+1,amount:5e5}),ev({kind:'monthly',year:CY+2,years:3,amount:2000})])));
// ============ 7. demo, navigation, translations ============
run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.language='en';localizeDemoState(state);`);
ok('example profile ships two events, named in the display language',J('state.lifeEvents.length')===2&&J('state.lifeEvents[0].name')==='Apartment renovation'&&J('state.lifeEvents[1].name')==='Expected inheritance');
run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.language='es';localizeDemoState(state);`);
ok('...in Spanish too',J('state.lifeEvents[1].name')==='Herencia esperada');
const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('tab button, mobile option, view and chart canvas exist; 11-column tab bar',/id="btn-tab-events"/.test(page)&&/id="mopt-events"/.test(page)&&/id="view-events"/.test(page)&&/id="chart-life-events"/.test(page)&&/md:grid-cols-11/.test(page));
run(`state.language='en';applyTranslations()`);ok('mobile dropdown option is translated',/🗓️/.test(els['mopt-events'].innerText)&&els['mopt-events'].innerText.includes(run('I18N.en.navEvents')));
load();setEv([]);box('container-life-events');run(`switchTab('view-events')`);
ok('opening the tab renders the list and chart',(els['container-life-events'].children.length+ (els['container-life-events'].innerHTML||'').length)>0&&(els['le-verdict'].innerHTML||'').length>20);
for(const lang of ['pt','es','en']){
  load('BR',lang);setEv([ev({name:'X',year:CY+2,amount:50000}),ev({name:'Y',kind:'monthly',year:CY+3,years:2,amount:900})]);box('container-life-events');box('le-verdict');run('renderLifeEvents(calculateMetrics())');
  const t=text(els['container-life-events'])+' '+text(els['le-verdict']);
  const w=lang==='en'?/One-off/:lang==='es'?/Puntual/:/Pontual/;
  ok(`[${lang}] cards and verdict render in the language, no leftover placeholders`,w.test(t)&&!/\{[a-z0-9]+\}|undefined|NaN/.test(t));
}
load('BR','en');setEv([ev({name:'X',year:CY+2,amount:50000})]);box('container-life-events');box('le-verdict');run('renderLifeEvents(calculateMetrics())');
ok('[en] no Portuguese on the Life events tab',!/ção|ões|Pontual|Sai\b|Entra\b|Duração|Ativo\b|Valor\b/.test(text(els['container-life-events'])+text(els['le-verdict'])));
// ================= mobile input UX: freely clearing the duration (years) field =================
// Same fix as the sabbatical duration field (ui/tab-scenarios.js): clearing this field
// used to snap back to a nonzero default (1) immediately on every keystroke, since the
// old update handler clamped unconditionally. Now stays null (shown as empty) while
// being edited, exactly like the sabbatical fix.
run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.language='en';syncFormInputsFromState();updateUI();`);
run(`addLifeEvent();const ev=state.lifeEvents[state.lifeEvents.length-1];updateLifeEvent(ev.id,'kind','monthly');`);
const evId=J('state.lifeEvents[state.lifeEvents.length-1].id');
run(`updateLifeEvent(${evId},'years','');`);
ok('BUGFIX: clearing the life event duration (years) field gives null (shown as empty), not forced back to 1 mid-edit', J(`state.lifeEvents.find(e=>e.id===${evId}).years`)===null);
run(`updateLifeEvent(${evId},'years','15');`);
ok('typing a real value afterward still works correctly', J(`state.lifeEvents.find(e=>e.id===${evId}).years`)===15);
run(`renderLifeEvents(calculateMetrics());`);
ok('rendering with years=null does not crash (confirmed by reaching this line)', true);

process.exitCode=bad?1:0;
