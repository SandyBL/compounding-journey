// Brand identity: names, colors, icons, accessibility contrast, and data-compatibility guards.
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..','..'),dist=path.join(root,'dist');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x?'  -> '+x:''));if(!c)bad++};
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const man=JSON.parse(fs.readFileSync(path.join(dist,'manifest.webmanifest'),'utf8'));
// ---- names ----
ok('page title is "Family Wealth Compass" by Compounding Journey',/<title>Family Wealth Compass — by Compounding Journey<\/title>/.test(html));
ok('manifest name / short name',man.name==='Family Wealth Compass'&&man.short_name==='Wealth Compass',man.name+' / '+man.short_name);
ok('iOS home-screen title',/apple-mobile-web-app-title" content="Wealth Compass"/.test(html));
ok('header links back to compoundingjourney.com',/href="https:\/\/compoundingjourney\.com"/.test(html));
ok('old brand names are gone from the page',!/Family Balance Sheet|Autonomous Family Wealth|Autonomous Wealth Architecture/.test(html.slice(0,html.indexOf('<script>'))));
// ---- colors ----
ok('theme-color meta and manifest use the forest green #1E4620',/name="theme-color" content="#1E4620"/.test(html)&&man.theme_color==='#1E4620'&&man.background_color==='#1E4620');
const cfg={};new Function('window',fs.readFileSync(path.join(root,'src/styles/tailwind.config.js'),'utf8'))(cfg);
const C=cfg.tailwind.config.theme.extend.colors;
ok('gold 500 is #C59B27 and green 600 is #1E4620',C.gold['500']==='#C59B27'&&C.teal['600']==='#1E4620');
ok('warnings (amber->orange) differ from the gold brand color',C.amber['500']!==C.gold['500']&&C.amber['400']!==C.gold['400']);
ok('no leftover pre-brand chart colors in the source',!/#14b8a6|#06b6d4|#10b981|#f59e0b/i.test(fs.readdirSync(path.join(root,'src/js'),{recursive:true}).filter(f=>/\.js$/.test(f)&&!/i18n/.test(f)).map(f=>fs.readFileSync(path.join(root,'src/js',f),'utf8')).join('\n')));
// ---- accessibility: WCAG contrast of the real palette ----
const lum=h=>{const [r,g,b]=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(c=>c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b};
const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05)};
const S950='#020617',DARK='#030712',CARD='#111827';
for(const [name,fg,bg,need] of [
 ['gold-500 button with dark text',C.gold['500'],S950,4.5],['gold-300 text on dark page',C.gold['300'],DARK,4.5],['gold-400 text on card',C.gold['400'],CARD,4.5],
 ['green-400 text on dark page',C.teal['400'],DARK,4.5],['green-300 text on card',C.teal['300'],CARD,4.5],['green-500 toggle with dark text',C.teal['500'],S950,4.5],
 ['emerald-400 (positive values) on card',C.emerald['400'],CARD,4.5],['orange-400 (warnings) on card',C.amber['400'],CARD,4.5],
 ['white on forest green',"#FFFFFF",C.teal['600'],4.5],['print: green-700 on white',C.teal['700'],'#FFFFFF',4.5],['print: green-800 on green-100',C.teal['800'],C.teal['100'],4.5],
 // Added by the UI/UX audit: these are among the most heavily-used text colors in the
 // app (rose-400: delete/danger buttons and negative numbers, 18+ uses; slate-400: the
 // dominant secondary-text/label color, 250+ uses) and were never checked here, even
 // though a palette tweak to either could silently break legibility app-wide. Tailwind's
 // stock palette (not in tailwind.config.js's own extend.colors, since these were never
 // customized) is used directly, matching what the classes actually resolve to.
 ['rose-400 (delete/danger, 18+ uses) on dark page','#fb7185',DARK,4.5],['rose-400 on card','#fb7185',CARD,4.5],
 ['slate-400 (dominant label color, 250+ uses) on dark page','#94a3b8',DARK,4.5],['slate-400 on card','#94a3b8',CARD,4.5]])
  {const r=cr(fg,bg);ok(`contrast ${name}`,r>=need,r.toFixed(2)+':1')}
// A real bug found and fixed by this same audit: text-slate-500 (48 of its 70 uses were
// on 10-11px text, well below the "large text" WCAG exemption) measures only 3.73:1 on
// the card background — below the 4.5:1 AA threshold for normal-sized text. Replaced
// throughout with slate-400 (6.92:1, comfortably passing); this guards against it
// quietly creeping back in anywhere.
// text-slate-500 is still used 14 times inside the print-only summary
// (html/print-summary.html) — ink-on-paper contrast is a different physical medium,
// already covered by its own dedicated checks above (print: green-700/white,
// green-800/green-100), so those are a known, counted exception rather than a bug.
// Everywhere else in the app (found across THREE separate directories the first pass
// of this fix missed — js/ui/*.js only, not state/ or tax/ — tax/effective-dates.js's
// "Rules as of" badge, state/household.js's owner-filter label, and three spots in
// state/import-diff.js's review modal) must now be zero.
const slateCount = (html.match(/\btext-slate-500\b/g) || []).length;
ok('contrast regression guard: text-slate-500 (confirmed WCAG AA failure at 3.73:1 for small text) appears ONLY the 14 known times inside the print-only summary, zero anywhere in the live on-screen app', slateCount===14, `found ${slateCount}`);
// A legibility outlier found by the same audit: the Overview dashboard's 4 score
// component pills (Runway/Debt/Savings/Hedge, e.g. "0/25") were rendered at 8px — below
// the 10-11px floor used everywhere else in the app for small labels (176 + 59 uses).
// Bumped to 10px; this guards against the one-off shrinking back. All 25 REMAINING
// sub-9px instances in the built page were individually inspected and confirmed to be
// the print/PDF executive summary (html/print-summary.html's own markup, PLUS
// ui/print.js's dynamic className-setting JS for the same print boxes — the two are not
// adjacent in the compiled output, since JS lives in the script tag and HTML elsewhere,
// which is why an earlier attempt at geometrically slicing "everything after the print
// div" to exclude them was wrong and had to be replaced with this simpler, exact count).
// A different count here means either a NEW sub-9px instance appeared somewhere (likely
// a live-UI regression) or a known print one went away (worth knowing either way).
const smallTextCount = (html.match(/text-\[[0-8]px\]/g) || []).length;
ok('legibility regression guard: exactly 25 known print-only instances of sub-9px text, no new ones elsewhere in the live app', smallTextCount===25, `found ${smallTextCount}`);
// ---- icons ----
const dim=f=>{const b=fs.readFileSync(f);return [b.readUInt32BE(16),b.readUInt32BE(20)]};
for(const [f,w] of [['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512],['apple-touch-icon.png',180]]){
  const [a,b]=dim(path.join(dist,'icons',f));ok(`icon ${f} is ${w}x${w}`,a===w&&b===w,a+'x'+b)}
ok('logo is embedded in the page (works as a single file)',/src="data:image\/png;base64,/.test(html));
// ---- user-data compatibility: these must NEVER change or saved profiles/backups stop working ----
ok('local-storage key unchanged (saved profiles keep loading)',html.includes("'family_balance_sheet_state'")||html.includes('"family_balance_sheet_state"'));
ok('backup file marker unchanged (old backups keep importing)',html.includes("'compounding-journey-family'"));
process.exitCode=bad?1:0;
