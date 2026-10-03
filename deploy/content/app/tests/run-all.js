// Runs every suite in tests/suites against dist/index.html.   Usage: node tests/run-all.js
const {spawnSync}=require('child_process'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'suites');
// Suites that only print values also get "must contain" checks so they can genuinely fail.
const expect={
 'xss-import-pipeline.test.js':['unescaped <img payload in any rendered HTML: false','reaches any onclick/handler: false','payload rendered escaped (proves it was displayed): true','ids after import: true'],
 'import-sanitizing.test.js':['unknown fields dropped: true true','prototype left untouched (true = safe): true','distinct: true','injected key gone: true','kept: 50 (cap 50)','render after import of demo profile OK'],
 'smoke-country-rows.test.js':['ES -> ES row hidden: false | PT row hidden: true','GL -> ES row hidden: true | PT row hidden: false','BR -> ES row hidden: true | PT row hidden: true'],
};
let failed=0;const rows=[];
for(const f of fs.readdirSync(dir).filter(x=>x.endsWith('.test.js')).sort()){
  const r=spawnSync(process.execPath,[path.join(dir,f)],{encoding:'utf8'});
  const out=(r.stdout||'')+(r.stderr||'');
  const pass=(out.match(/^PASS/gm)||[]).length,fail=(out.match(/^FAIL/gm)||[]).length;
  const missing=(expect[f]||[]).filter(s=>!out.includes(s));
  const crashed=r.status!==0||/(TypeError|ReferenceError|SyntaxError|AssertionError)/.test(out);
  const okk=!crashed&&!fail&&!missing.length;
  if(!okk)failed++;
  rows.push(`${okk?'ok  ':'FAIL'}  ${f.padEnd(34)} ${pass?pass+' asserts':'smoke'}${missing.length?'  missing: '+missing.join(' | '):''}${crashed?'  (crashed)':''}`);
  if(!okk)rows.push(out.split('\n').filter(l=>/FAIL|Error/.test(l)).slice(0,6).map(l=>'      '+l).join('\n'));
}
console.log(rows.join('\n'));console.log(failed?`\n${failed} suite(s) FAILED`:'\nAll suites passed');process.exit(failed?1:0);
