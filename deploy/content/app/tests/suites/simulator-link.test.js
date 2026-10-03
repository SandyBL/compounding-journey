// Retirement tab -> Compounding Journey Monte Carlo simulator hand-off.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x?'  -> '+x:''));if(!c)bad++};
const html=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));syncFormInputsFromState();updateUI();`);
const want={es:'https://compoundingjourney.com/es/simulators/monte-carlo-fire',pt:'https://compoundingjourney.com/pt/simulators/monte-carlo-fire',en:'https://compoundingjourney.com/en/simulators/monte-carlo-fire'};
for(const l of ['es','pt','en']){
  run(`state.language='${l}';updateUI();`);
  ok(`link follows the app language (${l})`,els['link-mc-simulator'].href===want[l],els['link-mc-simulator'].href);
}
ok('link carries no user data (no query string or fragment)',Object.values(want).every(u=>!/[?#]/.test(u))&&!/[?#]/.test(els['link-mc-simulator'].href));
// numbers shown must equal the app's own calculations, in the display currency
run(`state.language='en';updateUI();`);
const m=JSON.parse(run(`(()=>{const m=calculateMetrics();return JSON.stringify({p:fmt(m.totalLiquidBase),s:fmt(m.totalMonthlyLivingCost*12),c:fmt(m.monthlyInvest),y:m.weightedPortfolioYield.toFixed(1),i:Number(state.inflationRate).toFixed(1)})})()`));
ok('portfolio matches the app total',els['lbl-mc-portfolio'].innerText===m.p,m.p);
ok('annual spending = monthly living cost x 12',els['lbl-mc-spending'].innerText===m.s,m.s);
ok('monthly contribution matches',els['lbl-mc-contrib'].innerText===m.c,m.c);
ok('expected return / inflation matches',els['lbl-mc-return'].innerText===`${m.y}% / ${m.i}%`,els['lbl-mc-return'].innerText);
// the card opens in a new tab safely, and its text is translated in all three languages
ok('link opens in a new tab with rel="noopener"',/id="link-mc-simulator"[^>]*target="_blank"[^>]*rel="noopener"/.test(html));
for(const k of ['mcTitle','mcBody','mcNumsIntro','mcCta','mcPrivacy'])
  ok(`translated in pt/es/en: ${k}`,['pt','es','en'].every(l=>run(`I18N.${l}.${k}`)&&run(`I18N.${l}.${k}`).length>5));
process.exitCode=bad?1:0;
