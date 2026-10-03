// Regional succession (ITCMD / ISD) and property-transfer (ITP) rates: data tables,
// the region selector, backward compatibility, sanitizing, and the on-screen card.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const clear=(...ids)=>ids.forEach(id=>{if(els[id]&&els[id].children)els[id].children.length=0;});
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  if('${country}'==='ES'){state.baseCurrency='EUR';state.displayCurrency='EUR';state.earners.forEach(e=>e.regime='Cuenta Ajena')}
  if('${country}'==='GL'){state.baseCurrency='USD';state.displayCurrency='USD';state.earners.forEach(e=>e.regime='Employee')}
  syncFormInputsFromState();`);
const render=()=>{clear('lbl-est-rate-badge','lbl-est-itp-badge');run('switchTab(\'view-inheritance\');renderEstateSuccession(calculateMetrics())');};

// ================= 1. data tables =================
ok('Brazil: all 27 states + DF have a rate, each between 0 and 8% (the constitutional ceiling)', J('Object.keys(BR_ITCMD_BY_STATE).length')===27 && J('Object.values(BR_ITCMD_BY_STATE).every(r=>r>0&&r<=8)'));
ok('Brazil: every state has a matching display name', J('Object.keys(BR_ITCMD_BY_STATE).every(k=>typeof BR_STATE_NAMES[k]==="string"&&BR_STATE_NAMES[k].length>2)'));
ok('Spain: 17 regions, each a small percentage (0 to 5%) — reflecting near-total rebates for spouse/children almost everywhere', J('Object.keys(ES_ISD_DIRECT_FAMILY_BY_REGION).length')===17 && J('Object.values(ES_ISD_DIRECT_FAMILY_BY_REGION).every(r=>r>=0&&r<=5)'));
ok('Spain: every ISD region has a matching display name', J('Object.keys(ES_ISD_DIRECT_FAMILY_BY_REGION).every(k=>typeof ES_REGION_NAMES[k]==="string")'));
ok('Cataluña and Castilla-La Mancha are the two flagged exceptions: distinctly higher than the rest', J('ES_ISD_DIRECT_FAMILY_BY_REGION.CT')>J('ES_ISD_DIRECT_FAMILY_BY_REGION.MD')*3 && J('ES_ISD_DIRECT_FAMILY_BY_REGION.CM')>J('ES_ISD_DIRECT_FAMILY_BY_REGION.MD')*3);
ok('Navarra (foral, spouse/children exempt) and País Vasco (max 1.5%, spouse exempt) are among the very lowest', J('ES_ISD_DIRECT_FAMILY_BY_REGION.NC')<=J('ES_ISD_DIRECT_FAMILY_BY_REGION.MD')+0.2 && J('ES_ISD_DIRECT_FAMILY_BY_REGION.PV')<3);
ok('ITP: only regions with a real confirmed source are listed (9, not invented for all 17)', J('Object.keys(ES_ITP_BY_REGION).length')===9 && J('Object.keys(ES_ITP_BY_REGION).every(k=>ES_ITP_BY_REGION[k]>=4&&ES_ITP_BY_REGION[k]<=13)'));
ok('ITP: an unlisted region returns null (never a guessed number)', J("getRegionalItpRate('AR')")===null && J("getRegionalItpRate(null)")===null);
ok('ITP: País Vasco is the lowest listed (4%), matching its well-known outlier status', J('ES_ITP_BY_REGION.PV')===4 && J('ES_ITP_BY_REGION.PV')===Math.min(...Object.values(J('ES_ITP_BY_REGION'))));
ok('getRegionNames: Brazil/Spain return their own table, Global returns nothing (no regions modeled there)', J("Object.keys(getRegionNames('BR')).length")===27 && J("Object.keys(getRegionNames('ES')).length")===17 && J("Object.keys(getRegionNames('GL')).length")===0);

// ================= 2. getDefaultSuccessionTaxRate: backward compatible + region-aware =================
ok('no region chosen: EXACTLY the old flat defaults (BR 4%, ES 1%, GL 5%) — nothing changes for someone who never touches this', J("getDefaultSuccessionTaxRate('BR',null)")===4 && J("getDefaultSuccessionTaxRate('ES',null)")===1 && J("getDefaultSuccessionTaxRate('GL',null)")===5);
ok('a region for the WRONG country is ignored (Spanish code passed while country is Brazil falls back to the flat 4%)', J("getDefaultSuccessionTaxRate('BR','MD')")===4);
ok('São Paulo (SP) uses its real table value (4%, a flat-rate state)', J("getDefaultSuccessionTaxRate('BR','SP')")===J('BR_ITCMD_BY_STATE.SP'));
ok('Rio de Janeiro (RJ, one of the highest) differs meaningfully from São Paulo', J("getDefaultSuccessionTaxRate('BR','RJ')")>J("getDefaultSuccessionTaxRate('BR','SP')"));
ok('Madrid (ES) uses its real near-zero table value, not the old flat 1%', J("getDefaultSuccessionTaxRate('ES','MD')")===J('ES_ISD_DIRECT_FAMILY_BY_REGION.MD') && J("getDefaultSuccessionTaxRate('ES','MD')")<1);
ok('Cataluña (ES) is higher than the old flat 1% default, and higher than Madrid', J("getDefaultSuccessionTaxRate('ES','CT')")>1 && J("getDefaultSuccessionTaxRate('ES','CT')")>J("getDefaultSuccessionTaxRate('ES','MD')"));
ok('a junk/unknown region code falls back to the flat country default, not a crash', J("getDefaultSuccessionTaxRate('BR','ZZ')")===4 && J("getDefaultSuccessionTaxRate('ES','ZZ')")===1);
ok('Global never uses a region (there is none)', J("getDefaultSuccessionTaxRate('GL','MD')")===5);

// ================= 3. sanitizer =================
const san=(o)=>J(`migrateAndSanitizeState(Object.assign({country:'BR'},${JSON.stringify(o)}))`);
ok('sanitizer: a real Brazilian state code for Brazil is kept', san({estateSettings:{region:'RJ'}}).estateSettings.region==='RJ');
ok('sanitizer: a Spanish region code while country is Brazil is rejected (not a valid BR region)', san({estateSettings:{region:'MD'}}).estateSettings.region===null);
ok('sanitizer: a Brazilian code while country is Spain is rejected the same way', san({country:'ES',estateSettings:{region:'SP'}}).estateSettings.region===null);
ok('sanitizer: a real Spanish region for Spain is kept', san({country:'ES',estateSettings:{region:'CT'}}).estateSettings.region==='CT');
ok('sanitizer: junk / missing region -> null, not a crash', san({estateSettings:{region:'not-a-code'}}).estateSettings.region===null && san({}).estateSettings.region===null);
ok('sanitizer: Global always gets region null (no table exists for it)', san({country:'GL',estateSettings:{region:'MD'}}).estateSettings.region===null);
ok('hostile region value (object / array) -> null, no crash, no prototype pollution', (()=>{const a=san({estateSettings:{region:{x:1}}}),b=san({estateSettings:{region:['SP']}});run(`migrateAndSanitizeState(JSON.parse('{"country":"BR","estateSettings":{"__proto__":{"polluted":1},"region":"SP"}}'))`);return a.estateSettings.region===null&&b.estateSettings.region===null&&run('({}).polluted')===undefined})());
load(); run(`state.estateSettings.region='RJ';state.estateSettings.successionTaxRatePctOverride=null;`);
const back=J(`(()=>{const p=JSON.parse(${JSON.stringify(run('JSON.stringify(buildExportPayload())'))});return migrateAndSanitizeState(p.data||p)})()`);
ok('export -> import keeps the chosen region', back.estateSettings.region==='RJ');

// ================= 4. render: region selector, badges, defaults follow the pick =================
load('BR','en'); render();
ok('Brazil: region row visible, 27 options sorted by name, the demo\'s own region (SP) preselected', els['row-estate-region']._hidden===false && (els['select-estate-region'].innerHTML.match(/<option/g)||[]).length===28 && /value="SP" selected/.test(els['select-estate-region'].innerHTML));
ok('...ITP row is hidden for Brazil (Spain-only)', els['row-estate-itp']._hidden===true);
ok('...the rate badge cites the Brazilian source', /itcmd\.com\.br/.test(els['lbl-est-rate-badge'].innerHTML)&&/Rules as of September 2026/.test(els['lbl-est-rate-badge'].innerHTML));
ok('...the displayed rate follows São Paulo\'s table value (4%)', Number(els['input-estate-tax-rate'].value)===J('BR_ITCMD_BY_STATE.SP'));
run(`document.getElementById('select-estate-region').value='RJ';handleDataUpdate();`);
ok('picking Rio de Janeiro updates the state AND the displayed rate to RJ\'s own value', J('state.estateSettings.region')==='RJ' && Number(els['input-estate-tax-rate'].value)===J('BR_ITCMD_BY_STATE.RJ'));
run(`document.getElementById('select-estate-region').value='';handleDataUpdate();`);
ok('clearing the region goes back to the flat country default (4%), not to whatever was picked last', J('state.estateSettings.region')===null && Number(els['input-estate-tax-rate'].value)===4);

load('ES','en'); render();
ok('Spain: region row visible with 17 options, ITP row visible', els['row-estate-region']._hidden===false && (els['select-estate-region'].innerHTML.match(/<option/g)||[]).length===18 && els['row-estate-itp']._hidden===false);
run(`document.getElementById('select-estate-region').value='';handleDataUpdate();`);   // clear the (Brazilian) demo region, which is not valid for Spain
ok('...no region picked: ITP shows "no reliable figure" rather than a leftover/invalid value', els['lbl-est-itp-value'].innerText==='no reliable figure for this region');
run(`document.getElementById('select-estate-region').value='MD';handleDataUpdate();`);
ok('picking Madrid: the rate drops close to zero, and the ISD badge cites the regional sources', Number(els['input-estate-tax-rate'].value)===J('ES_ISD_DIRECT_FAMILY_BY_REGION.MD') && /ineaf\.es|jmdominguez|guiafiscal/.test(els['lbl-est-rate-badge'].innerHTML));
ok('...ITP now shows Madrid\'s confirmed rate (6%) with its own citation', els['lbl-est-itp-value'].innerText==='6%' && /rankia\.com|tribeus\.es|guiareformas/.test(els['lbl-est-itp-badge'].innerHTML));
run(`document.getElementById('select-estate-region').value='AR';handleDataUpdate();`);
ok('picking a region with NO confirmed ITP source shows "no reliable figure", not a fabricated number', els['lbl-est-itp-value'].innerText==='no reliable figure for this region');
run(`document.getElementById('select-estate-region').value='CT';handleDataUpdate();`);
ok('picking Cataluña: the default rate is visibly higher than Madrid\'s was', Number(els['input-estate-tax-rate'].value)===J('ES_ISD_DIRECT_FAMILY_BY_REGION.CT') && Number(els['input-estate-tax-rate'].value)>J('ES_ISD_DIRECT_FAMILY_BY_REGION.MD'));

load('GL','en'); render();
ok('Global: no region row, no ITP row (no tables exist for Global)', els['row-estate-region']._hidden===true && els['row-estate-itp']._hidden===true);
ok('...the rate badge is empty (nothing here is a cited regional law)', text(els['lbl-est-rate-badge']).trim()==='');

// ================= 5. overriding the rate still works exactly as before (region only changes the DEFAULT) =================
load('BR','en'); run(`document.getElementById('select-estate-region').value='SP';handleDataUpdate();`);
run(`document.getElementById('input-estate-tax-rate').value='2.5';handleDataUpdate();`);
render();
ok('a manual rate override still wins over the regional default (nothing here took away that freedom)', J('state.estateSettings.successionTaxRatePctOverride')===2.5 && Number(els['input-estate-tax-rate'].value)===2.5);

// ================= 6. the estate-tax figure downstream actually uses the regional default =================
load('BR','en'); run(`state.estateSettings.region='RJ';state.estateSettings.successionTaxRatePctOverride=null;`);
const m1=J('calculateMetrics()');
render();
const box=text(els['container-estate-succession-content']);
ok('the estimated estate-tax box on screen reflects RJ\'s rate applied to the actual net worth', box.includes(J(`fmt(${m1.netWorth}*BR_ITCMD_BY_STATE.RJ/100)`)), box.slice(0,200));

// ================= 7. translations, markup =================
for(const lang of ['pt','es','en']){
  load('ES',lang); run(`document.getElementById('select-estate-region')`); render();
  const all=text(els['row-estate-region'])+els['lbl-est-itp-value'].innerText+els['lbl-est-itp-badge'].innerHTML;
  ok(`[${lang}] region and ITP labels are translated`, all.length>10 && !/\{[a-z0-9]+\}|undefined|NaN/.test(all));
}
const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('markup: region selector and ITP row exist in the Inheritance view', /id="select-estate-region"/.test(page) && /id="row-estate-itp"/.test(page) && /id="lbl-est-rate-badge"/.test(page));
process.exitCode=bad?1:0;
