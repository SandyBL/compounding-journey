const {run,els,sb}=require('../harness.js');
const hidden=()=>els['banner-install-hint']._hidden;
const scenario=(label,ua,standalone,dismissed,exp)=>{sb.navigator.userAgent=ua;sb.navigator.standalone=standalone;sb.navigator.maxTouchPoints=0;run(`state.installHintDismissed=${dismissed};updateUI();`);console.log((hidden()===exp?'PASS':'FAIL'),label,'-> hidden =',hidden());};
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
scenario('iPhone Safari tab, not dismissed  (banner shown)',IPHONE,false,false,false);
scenario('iPhone installed Home Screen app  (banner hidden)',IPHONE,true,false,true);
scenario('iPhone, banner dismissed          (banner hidden)',IPHONE,false,true,true);
scenario('Desktop Chrome                    (banner hidden)','Mozilla/5.0 (Windows NT 10.0) Chrome/120',false,false,true);
sb.navigator.platform='MacIntel';sb.navigator.maxTouchPoints=5;sb.navigator.userAgent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605';sb.navigator.standalone=false;run(`state.installHintDismissed=false;updateUI();`);
console.log((hidden()===false?'PASS':'FAIL'),'iPadOS (desktop-class UA, touch)   (banner shown)');
run(`dismissInstallHint()`);console.log((hidden()===true&&run('state.installHintDismissed')===true?'PASS':'FAIL'),'dismiss button hides it and remembers it');
// registerPWA
let reg=[],persisted=0;
sb.navigator.serviceWorker={register:(u)=>{reg.push(u);return Promise.resolve()}};sb.navigator.storage={persist:()=>{persisted++;return Promise.resolve(true)}};
sb.location={protocol:'https:',hostname:'family.example.com'};run('registerPWA()');
console.log((reg[0]==='sw.js'&&persisted===1?'PASS':'FAIL'),'https: registers sw.js and requests persistent storage ->',reg,persisted);
reg=[];sb.location={protocol:'file:',hostname:''};run('registerPWA()');
console.log((reg.length===0?'PASS':'FAIL'),'file:// (single-file use): does not try to register');
sb.navigator.serviceWorker={register:()=>{throw new Error('blocked')}};sb.location={protocol:'https:',hostname:'x'};
try{run('registerPWA()');console.log('PASS registration errors are swallowed (blocked/unsupported environments)')}catch(e){console.log('FAIL threw',e.message)}
// index.html references
const html=require('fs').readFileSync(require('path').join(__dirname,'..','..','dist','index.html'),'utf8');
for(const t of ['rel="manifest" href="manifest.webmanifest"','rel="apple-touch-icon" href="icons/apple-touch-icon.png"','apple-mobile-web-app-capable','name="theme-color"'])console.log((html.includes(t)?'PASS':'FAIL'),'head contains',t);
