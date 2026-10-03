// Minimal fake browser (DOM, storage, Chart) that runs the app's real script for tests.
const fs=require('fs'),vm=require('vm');
const path=require('path');
// The app under test is the BUILT single file (run `node build.mjs` first). Override with APP_HTML=...
const APP_HTML=process.env.APP_HTML||path.join(__dirname,'..','dist','index.html');
const html=fs.readFileSync(APP_HTML,'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/)[1];
const els={};
function makeEl(id){ if(els[id]) return els[id];
  const store={id,innerHTML:'',innerText:'',value:'',className:'',style:{},dataset:{},children:[],checked:false,disabled:false,placeholder:''};
  const clSet=new Set();
  const cl={
    add(c){ clSet.add(c); if(c==='hidden') store._hidden=true; },
    remove(c){ clSet.delete(c); if(c==='hidden') store._hidden=false; },
    toggle(c,f){ const on = f===undefined ? !clSet.has(c) : !!f; if(on) clSet.add(c); else clSet.delete(c); if(c==='hidden') store._hidden=on; },
    contains(c){ return clSet.has(c); }
  };
  els[id]=new Proxy(store,{set(t,k,v){ t[k]=v; if(k==='innerHTML') t.children.length=0; return true; },get(t,k){ if(k in t) return t[k]; if(k==='classList') return cl; if(k==='appendChild') return c=>{t.children.push(c);return c}; if(k==='getContext') return ()=>({}); if(k==='parentElement') return makeEl('_parent_'+id); if(typeof k==='symbol') return undefined; return ()=>undefined;}});
  return els[id]; }
const store={};
const sessionStore={};
const { webcrypto } = require('node:crypto');
const sb={console,navigator:{language:'pt-BR'},crypto:webcrypto,TextEncoder,TextDecoder,
 btoa:(s)=>Buffer.from(s,'binary').toString('base64'),atob:(s)=>Buffer.from(s,'base64').toString('binary'),
 localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v},removeItem:(k)=>{delete store[k]}},
 sessionStorage:{getItem:k=>sessionStore[k]||null,setItem:(k,v)=>{sessionStore[k]=v},removeItem:(k)=>{delete sessionStore[k]}},
 Chart:function(){this.destroy=()=>{};this.update=()=>{}},setTimeout:(f)=>0,setInterval:(f)=>0,clearInterval:()=>{},clearTimeout:()=>{},URL:{createObjectURL(){return ''},revokeObjectURL(){}},Blob:function(){},FileReader:function(){},
 document:{getElementById:id=>makeEl(id),createElement:()=>makeEl('_'+Math.random()),querySelectorAll:()=>[],querySelector:()=>null,activeElement:null,body:makeEl('body'),addEventListener(){}}};
sb.window=sb; vm.createContext(sb); vm.runInContext(script,sb);
sb.window.onload();
function run(code){return vm.runInContext(code,sb)}
module.exports={run,els,sb};
