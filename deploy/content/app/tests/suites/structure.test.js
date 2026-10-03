// Structural integrity of the source tree and the built file.
const fs=require('fs'),path=require('path');
const {run}=require('../harness.js');
const root=path.join(__dirname,'..','..'), dist=path.join(root,'dist');
let bad=0; const ok=(label,cond,extra)=>{console.log((cond?'PASS ':'FAIL ')+label+(extra?'  -> '+extra:''));if(!cond)bad++};
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
ok('no unresolved include markers in dist/index.html',!/@@(INCLUDE|SCRIPTS)/.test(html));
// every JS source file is listed in order.json, and every listed file exists
const order=JSON.parse(fs.readFileSync(path.join(root,'src/js/order.json'),'utf8')).js;
const onDisk=[];(function walk(d,rel){for(const e of fs.readdirSync(d,{withFileTypes:true})){const r=rel?rel+'/'+e.name:e.name;e.isDirectory()?walk(path.join(d,e.name),r):/\.js$/.test(e.name)&&onDisk.push(r)}})(path.join(root,'src/js'),'');
ok('order.json lists every src/js file (none forgotten)',onDisk.every(f=>order.includes(f)),onDisk.filter(f=>!order.includes(f)).join(', '));
ok('order.json only lists files that exist',order.every(f=>onDisk.includes(f)));
// dictionaries
const keys=l=>JSON.parse(run(`JSON.stringify(Object.keys(I18N.${l}).sort())`));
const pt=keys('pt'),es=keys('es'),en=keys('en');
ok('pt/es/en dictionaries have identical keys',JSON.stringify(pt)===JSON.stringify(es)&&JSON.stringify(pt)===JSON.stringify(en),pt.length+' keys');
// every key used in code or markup exists
const used=new Set([...html.matchAll(/\bt\('([A-Za-z0-9_]+)'\)/g)].map(m=>m[1]));
for(const m of html.slice(0,html.indexOf('<script>')).matchAll(/data-i18n(?:-title|-placeholder)?="([^"]+)"/g))used.add(m[1]);
const missing=[...used].filter(k=>!pt.includes(k));
ok('every t(...) / data-i18n key used exists in the dictionary',missing.length===0,missing.slice(0,8).join(', '));
// duplicate DOM ids (getElementById silently returns only the first)
const ids={};for(const m of html.slice(0,html.indexOf('<script>')).matchAll(/\sid="([^"]+)"/g))ids[m[1]]=(ids[m[1]]||0)+1;
const dups=Object.keys(ids).filter(k=>ids[k]>1);
ok('no duplicate element ids',dups.length===0,dups.join(', '));
// install files
const sw=fs.readFileSync(path.join(dist,'sw.js'),'utf8');
ok('service worker cache name was stamped by the build',/CACHE_VERSION = 'cjf-[0-9a-f]{10}'/.test(sw));
let man=null;try{man=JSON.parse(fs.readFileSync(path.join(dist,'manifest.webmanifest'),'utf8'))}catch(e){}
ok('manifest is valid JSON with name, icons and start_url',!!(man&&man.name&&man.icons&&man.icons.length&&man.start_url));
// regression guards: hard-coded Portuguese default names, and the raw SS rate
const jsSrc=fs.readdirSync(path.join(root,'src/js'),{recursive:true}).filter(f=>/\.js$/.test(f)&&!/^i18n[\\/]/.test(f)&&!/core[\\/]defaults\.js$/.test(f));
const offenders=[];for(const f of jsSrc){const t=fs.readFileSync(path.join(root,'src/js',f),'utf8');
  for(const m of t.matchAll(/(['"])(Titular|Adulto|Membro|Meta Familiar)\1/g)) if(!/legacy|'Titular': 'prtMember'/.test(t.slice(Math.max(0,m.index-160),m.index+80))) offenders.push(f+': '+m[0]);}
ok('no hard-coded Portuguese default names in code (Titular / Adulto / Membro / Meta Familiar)',offenders.length===0,offenders.join('; '));
ok('Spain SS rate appears only in its named constant (no stray 0.0647)',!fs.readdirSync(path.join(root,'src/js'),{recursive:true}).filter(f=>/\.js$/.test(f)).some(f=>/0\.0647/.test(fs.readFileSync(path.join(root,'src/js',f),'utf8'))));
// ================= every full-screen modal has a mobile height constraint =================
// Reported directly by someone testing on mobile: the Profile modal (country/currency,
// household mode, App Lock with PIN/biometric/auto-lock — it grew substantially over
// the session) could be taller than a short mobile viewport with no way to scroll to
// the rest. Checked across ALL modals since it turned out to be systemic: only
// import-review.html (built with its own scrollable diff list) had the right pattern;
// profile/wizard/confirm/add-snapshot did not. Fixed on all five with max-h-[85vh] +
// either flex flex-col (header stays fixed, body scrolls) or a simple overflow-y-auto
// for the two short, single-section modals.
const distHtml=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
for(const modalId of ['modal-profile','modal-wizard']){
  const idx=distHtml.indexOf(`id="${modalId}"`);
  ok(`markup sanity: ${modalId} actually exists in the built page (catches a wrong-id typo in this very test)`, idx!==-1);
  const cardClassMatch=distHtml.slice(idx,idx+1000).match(/class="glass-card[^"]*"/);
  ok(`${modalId}: the modal card has BOTH a max-height and flex flex-col (header stays fixed, body scrolls on a short viewport)`, !!cardClassMatch&&/max-h-\[85vh\]/.test(cardClassMatch[0])&&/flex flex-col/.test(cardClassMatch[0]), cardClassMatch&&cardClassMatch[0]);
}
for(const modalId of ['modal-confirm-action','modal-add-snapshot']){
  const idx=distHtml.indexOf(`id="${modalId}"`);
  ok(`markup sanity: ${modalId} actually exists in the built page (catches a wrong-id typo in this very test)`, idx!==-1);
  const cardClassMatch=distHtml.slice(idx,idx+400).match(/class="glass-card[^"]*"/);
  ok(`${modalId}: the modal card has a max-height + overflow-y-auto fallback`, !!cardClassMatch&&/max-h-\[85vh\]/.test(cardClassMatch[0])&&/overflow-y-auto/.test(cardClassMatch[0]), cardClassMatch&&cardClassMatch[0]);
}
{
  const idx=distHtml.indexOf('id="modal-import-review"');
  const cardClassMatch=distHtml.slice(idx,idx+400).match(/class="glass-card[^"]*"/);
  ok('modal-import-review: already had the right pattern before this fix, confirmed still intact', !!cardClassMatch&&/max-h-\[85vh\]/.test(cardClassMatch[0]));
}

// ================= mobile: scroll chaining and horizontal wobble =================
// Reported directly, right after the modal-height fix above: once a modal could
// finally scroll internally, reaching its top/bottom handed the rest of the gesture
// to the page behind it, and the page itself could be nudged a couple of pixels
// left/right even though everything fit. Fixed with a centralized MutationObserver
// (ui/modals.js) that locks the body (the position:fixed trick, needed specifically
// for iOS Safari) for as long as any .app-modal is visible, overscroll-behavior:
// contain on every modal's own scrollable region, and a blanket overflow-x: hidden
// on html/body. The MutationObserver's actual runtime behavior cannot be exercised
// by this test harness (its document.querySelectorAll stub always returns an empty
// list, a known pre-existing limitation noted elsewhere in this project too) — these
// checks confirm the built artifacts are correctly wired, not the live DOM behavior.
ok('all 6 modal overlays are tagged .app-modal (the single selector the scroll-lock observer watches)', (distHtml.match(/class="[^"]*\bapp-modal\b[^"]*"/g)||[]).length===6);
ok('every modal\'s own scrollable region is tagged .modal-scroll-area (overscroll-behavior: contain, so reaching its end does not chain into the page behind it)', (distHtml.match(/\bmodal-scroll-area\b/g)||[]).length===6);
ok('the body-scroll-locked CSS class exists with position:fixed (not just overflow:hidden, which does not reliably stop iOS Safari background scrolling)', /body\.body-scroll-locked\s*\{[^}]*position:\s*fixed/.test(distHtml));
ok('a blanket overflow-x:hidden guards html/body against the 1-2px horizontal wobble, regardless of which element turns out to cause it', /html,\s*body\s*\{[^}]*overflow-x:\s*hidden/.test(distHtml));
ok('setupModalScrollLock() degrades silently (no crash) if MutationObserver is unavailable, rather than assuming every browser has it', /typeof MutationObserver === 'undefined'\) return;/.test(distHtml));

process.exitCode=bad?1:0;
