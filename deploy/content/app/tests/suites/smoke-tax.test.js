const {run,els,sb}=require('../harness.js');
const module_={};

{
  const out=(c)=>{ const el=els['container-tax-study-content']; return (el.innerHTML||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); };
  // ---- Brazil: CLT 15k + PJ 12k, 1 child, PGBL with contribution ----
  run(`state.country='BR';state.language='pt';state.baseCurrency='BRL';state.displayCurrency='BRL';
   state.earners=[{id:1,name:'A',age:38,regime:'CLT',grossMonthly:15000,pjTaxRate:6},{id:2,name:'B',age:36,regime:'PJ',grossMonthly:12000,pjTaxRate:6,pjCompanyType:'simples3',proLaborePct:28}];
   state.children=[{id:5,name:'K',age:7,schoolMonthly:2000,collegeMonthly:3500,independenceAge:23}];
   state.brExtraDependents=1;
   state.liquidInvestments=[{id:9,name:'PGBL X',currency:'BRL',balanceOriginal:200000,annualYieldPct:9,accountType:'pgbl',contributedThisYear:6000,contributionYear:new Date().getFullYear()},
                            {id:10,name:'VGBL Y',currency:'BRL',balanceOriginal:50000,annualYieldPct:9,accountType:'vgbl',contributedThisYear:99999,contributionYear:new Date().getFullYear()}];
   updateUI();`);
  console.log('--- BR ---\n'+out());
  console.log('row deps hidden flag (expect false):',els['row-br-extra-dependents'].classList&&els['row-br-extra-dependents']._hidden);
  // stale-year contributions must count as zero
  run(`state.liquidInvestments[0].contributionYear=2020; updateUI();`);
  console.log('--- BR with stale-year contribution (expect contributed R$ 0) ---\n'+out().match(/Aportado em PGBL em \d+ R\$ [\d.,]+/));
  // exempt earner
  run(`state.earners=[{id:1,name:'A',age:30,regime:'CLT',grossMonthly:4000}];state.liquidInvestments=[];updateUI();`);
  console.log('--- BR exempt earner ---\n'+out().match(/Economia Fiscal Potencial R\$ [\d.,]+ [^R]{0,90}/));
  // ---- Spain ----
  run(`state.country='ES';state.language='es';state.baseCurrency='EUR';state.displayCurrency='EUR';
   state.earners=[{id:1,name:'A',age:40,regime:'Cuenta Ajena',grossMonthly:4200},{id:2,name:'B',age:38,regime:'Cuenta Ajena',grossMonthly:2200}];
   state.liquidInvestments=[{id:9,name:'PP',currency:'EUR',balanceOriginal:80000,annualYieldPct:5,accountType:'pension_plan',contributedThisYear:1000,contributionYear:new Date().getFullYear()}];
   updateUI();`);
  console.log('--- ES ---\n'+out());
  // ---- Portugal ----
  run(`state.country='PT';state.language='pt';
   state.earners=[{id:1,name:'A',age:32,regime:'Trabalhador por Conta de Outrem',grossMonthly:3000},{id:2,name:'B',age:52,regime:'Trabalhador por Conta de Outrem',grossMonthly:2500}];
   state.liquidInvestments=[{id:9,name:'PPR',currency:'EUR',balanceOriginal:30000,annualYieldPct:4,accountType:'ppr',contributedThisYear:1000,contributionYear:new Date().getFullYear()}];
   updateUI();`);
  console.log('--- PT ---\n'+out());
}
