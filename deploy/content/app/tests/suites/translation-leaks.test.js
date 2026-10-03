const {run,els,sb}=require('../harness.js');
const PT_EN=/Titular|Adulto|ção|ções|\bão\b|ões\b|\bmês\b|\bmeses\b|Patrimônio|Dívida|Aposentadoria|\bRenda\b|Reserva de|Aporte|Poupança|Saldo|Família|Fechamento|Sucessão|Alíquota|Previdência|Meta\b|Rotativo|\bdia\(s\)|Membro|Titular|Apartamento|Férias|Liquid[oa]s?\b.*Ações|traduzir|conversão|aplicações|\bmeses\)|Cotação|Taxa de/;
const PT_ES=/ção|ções|\bão\b|ões\b|Patrimônio|Dívida|Família|Fechamento|Sucessão|Alíquota|Previdência|Rotativo\b|\bRenda\b|Poupança|Aposentadoria|Apartamento|Férias|Reserva de Emergência|conversão|traduzir|aplicações|Cotação|Taxa de/;
const results=[];
function textOf(e){let t=(e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.textContent||'')+' '+(e.placeholder||'')+' '+(e.title||'');(e.children||[]).forEach(c=>{t+=' '+textOf(c)});return t}
for(const country of ['BR','ES','GL']){
 for(const lang of ['en','es']){
  for(const k of Object.keys(els)){ if(els[k].children) els[k].children.length=0; }
  run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));
       state.country='${country}'; state.language='${lang}'; state.languageUserChosen=true;
       if('${country}'==='GL'){state.baseCurrency='USD';state.displayCurrency='USD';}
       if('${country}'==='ES'){state.baseCurrency='EUR';state.displayCurrency='EUR';}
       state.earners.forEach(e=>{e.regime=getJurisdictionRegimes('${country}').options[0]});
       state.debts.revolving=5000; state.outflows.charitableGiving=100; state.estateSettings=state.estateSettings||{};
       localizeDemoState(state); syncFormInputsFromState(); applyTranslations(); syncHeaderCountry(); updateUI();
       window.renderPrintSummary(calculateMetrics());`);
  for(const [id,e] of Object.entries(els)){ if(id.startsWith('_0.')) continue;
    // Brazilian state / Spanish region names are proper nouns, legitimately shown
    // in their own language regardless of the app's display language (like writing
    // "São Paulo" in an English sentence) — not a translation bug.
    if(id==='select-estate-region') continue;
    const txt=textOf(e).replace(/<[^>]+>/g,' ').replace(/\(\)=>undefined/g,'');
    const m=txt.match(lang==='en'?PT_EN:PT_ES); if(m) results.push(`${country}/${lang} #${id}: ...${txt.slice(Math.max(0,m.index-30),m.index+50).replace(/\s+/g,' ')}...`);
  }
 }
}
console.log(results.length?results.slice(0,40).join('\n'):'PASS no Portuguese in any rendered element (BR/ES/GL x en/es)');
if(results.length){console.log('FAIL Portuguese text found while rendering en/es');process.exitCode=1}
console.log('elements scanned:',Object.keys(els).length);
