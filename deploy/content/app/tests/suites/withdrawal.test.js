// Withdrawal phase: tax classes, taxes per country, drawdown simulation, tax-adjusted target, allocation.
const fs=require('fs'),path=require('path');
const {run,els}=require('../harness.js');
let bad=0;const ok=(l,c,x)=>{console.log((c?'PASS ':'FAIL ')+l+(x!==undefined?'  -> '+x:''));if(!c)bad++};
const J=s=>JSON.parse(run(`JSON.stringify(${s})`));
const near=(a,b,tol=1e-6)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b));
const item=(id,bal,x)=>Object.assign({id,name:'h'+id,currency:'BRL',balanceOriginal:bal,annualYieldPct:0,liquidityTier:'short',volatilityTier:'medium'},x||{});
const mk=(items,o={})=>run(`state=migrateAndSanitizeState(Object.assign({country:'${o.country||'BR'}',baseCurrency:'${o.base||'BRL'}',language:'en',liquidInvestments:${JSON.stringify(items)}},${JSON.stringify(o.extra||{})}));state.language='en';`);
const CFG=(o)=>Object.assign({country:'BR',brGainsPct:15,brPensionPct:10,glGainsPct:15,glOrdinaryPct:25},o||{});
const tax=(cfg,f)=>J(`calcWithdrawalTax(${JSON.stringify(cfg)},${JSON.stringify(f)})`);

// ================= 1. Spain's savings scale (2026: 19/21/23/27/30) =================
ok('scale constants: 19/21/23/27/30% up to 6k/50k/200k/300k, year 2026',J('ES_SAVINGS_SCALE_YEAR')===2026&&JSON.stringify(J('ES_SAVINGS_SCALE.map(x=>[x[0]===Infinity?"inf":x[0],x[1]])'))===JSON.stringify([[6000,0.19],[50000,0.21],[200000,0.23],[300000,0.27],['inf',0.30]]));
for(const [g,want] of [[0,0],[6000,1140],[10000,1980],[50000,1140+44000*0.21],[60000,1140+9240+2300],[250000,1140+9240+34500+13500],[400000,71880+30000],[-5,0]])
  ok(`esSavingsTax(${g}) = ${want}`,near(J(`esSavingsTax(${g})`),want,1e-12));
ok('esSavingsTax is continuous and increasing (5,000 sample points)',(()=>{let prev=0;for(let g=0;g<=500000;g+=100){const t=J(`esSavingsTax(${g})`);if(t<prev-1e-9)return false;prev=t}return true})());

// ================= 2. tax on a year's withdrawals, per country =================
mk([]);
ok('Brazil: gains at 15%, private pensions at 10% (gains-only and whole), exempt at 0',near(tax(CFG(),{gainsTaxable:10000,gainsDef:5000,deferredWhole:20000}),10000*0.15+5000*0.10+20000*0.10));
ok('Brazil: the rates are the editable ones',near(tax(CFG({brGainsPct:17.5,brPensionPct:20}),{gainsTaxable:1000,gainsDef:0,deferredWhole:1000}),175+200));
ok('Spain: gains on the savings scale; pension-plan withdrawals as work income (calcSpainIRPF on the monthly base)',near(tax(CFG({country:'ES'}),{gainsTaxable:40000,gainsDef:0,deferredWhole:24000}),J('esSavingsTax(40000)')+J('calcSpainIRPF(2000)')*12,1e-12));
ok('Spain: gains that cross a bracket cost more than proportionally (progressive)',tax(CFG({country:'ES'}),{gainsTaxable:60000})/60000>tax(CFG({country:'ES'}),{gainsTaxable:5000})/5000);
ok('Global: gains at one rate, deferred withdrawals at the ordinary (marginal) rate',near(tax(CFG({country:'GL',glGainsPct:20,glOrdinaryPct:30}),{gainsTaxable:1000,gainsDef:500,deferredWhole:2000}),1500*0.2+2000*0.3));
ok('no flows -> no tax, and negative junk is ignored',tax(CFG(),{gainsTaxable:0,gainsDef:0,deferredWhole:0})===0&&tax(CFG(),{gainsTaxable:-5,gainsDef:-5,deferredWhole:-5})===0);
ok('the config takes Global\'s ordinary rate from the Taxes tab\'s marginal rate',(()=>{mk([],{country:'GL',extra:{glMarginalTaxRatePct:33}});return J('wdTaxConfig(state).glOrdinaryPct')===33})());

// ================= 3. classes and buckets =================
const cls=(o)=>J(`resolveWithdrawalTaxClass(${JSON.stringify(o)})`);
ok('class: ordinary account -> taxable; PGBL / pension plan / generic deferred -> deferred; VGBL -> deferred-gains',cls({})==='taxable'&&cls({accountType:'pgbl'})==='deferred'&&cls({accountType:'pension_plan'})==='deferred'&&cls({accountType:'tax_deferred'})==='deferred'&&cls({accountType:'vgbl'})==='defGains');
ok('class: an explicit choice beats the account type; "auto" defers to it',cls({accountType:'pgbl',wdTax:'exempt'})==='exempt'&&cls({accountType:'pgbl',wdTax:'auto'})==='deferred'&&cls({wdTax:'defGains'})==='defGains'&&cls({wdTax:'nonsense'})==='taxable');
mk([item(1,100000,{gainPct:40,annualYieldPct:10}),item(2,300000,{gainPct:0,annualYieldPct:6}),item(3,50000,{accountType:'pgbl',annualYieldPct:8}),item(4,20000,{wdTax:'exempt',annualYieldPct:9}),item(5,30000,{accountType:'vgbl',gainPct:50,annualYieldPct:7}),item(6,0,{}),item(7,10000,{})]);
let B=J('buildWithdrawalBuckets(state)');
ok('buckets: balances by class (taxable = 100k + 300k + 10k)',B.taxable.bal===410000&&B.deferred.bal===50000&&B.exempt.bal===20000&&B.defGains.bal===30000);
ok('...cost basis: taxable = 60k + 300k + 7k (30% default gain); gains-only pension = 15k; deferred/exempt have none',near(B.taxable.basis,60000+300000+7000)&&B.defGains.basis===15000&&B.deferred.basis===0&&B.exempt.basis===0);
ok('...balance-weighted yields',near(B.taxable.yield,(100000*10+300000*6+10000*0)/410000,1e-12)&&B.deferred.yield===8);
ok('a holding with 0% gain has full basis, 100% gain has none; empty holdings are skipped',(()=>{mk([item(1,1000,{gainPct:0}),item(2,1000,{gainPct:100}),item(3,0)]);const b=J('buildWithdrawalBuckets(state)');return b.taxable.bal===2000&&b.taxable.basis===1000})());
mk([item(1,1000,{currency:'USD',gainPct:20})]);const fx=J(`convertToBase(1,'USD')`);B=J('buildWithdrawalBuckets(state)');
ok('a holding in another currency is converted to the base currency (balance and basis)',near(B.taxable.bal,1000*fx,1e-12)&&near(B.taxable.basis,800*fx,1e-12));

// ================= 4. how a withdrawal is taken =================
mk([item(1,600000,{gainPct:50}),item(2,300000,{accountType:'pgbl'}),item(3,100000,{wdTax:'exempt'})]);B=J('buildWithdrawalBuckets(state)');
const plan=(W,o)=>J(`planWithdrawal(${W},buildWithdrawalBuckets(state),'${o}')`);
let pl=plan(100000,'proportional');
ok('proportional: each class gives its share of the balance (60% / 30% / 10%)',near(pl.take.taxable,60000)&&near(pl.take.deferred,30000)&&near(pl.take.exempt,10000));
ok('...realized gains = taxable part x its gain share; deferred counts whole',near(pl.flows.gainsTaxable,30000)&&near(pl.flows.deferredWhole,30000));
pl=plan(700000,'taxable_first');ok('taxable-first: empties taxable, then deferred, exempt last',near(pl.take.taxable,600000)&&near(pl.take.deferred,100000)&&pl.take.exempt===0);
pl=plan(700000,'deferred_first');ok('deferred-first: empties deferred, then taxable',near(pl.take.deferred,300000)&&near(pl.take.taxable,400000)&&pl.take.exempt===0);
pl=plan(5e6,'taxable_first');ok('asking for more than everything takes everything, no more',near(pl.take.taxable+pl.take.deferred+pl.take.exempt,1e6));
ok('a zero or negative withdrawal takes nothing',plan(0,'proportional').take.taxable===0&&plan(-50,'taxable_first').take.deferred===0);

// ================= 5. gross-up: how much to withdraw to keep `need` after tax =================
const gu=(need,o)=>J(`grossUpWithdrawal(${need},buildWithdrawalBuckets(state),'${o||'taxable_first'}',wdTaxConfig(state))`);
mk([item(1,1e6,{gainPct:40})]);
ok('one taxable holding, 40% gain, 15% tax: gross = need / (1 - 0.4 x 0.15) (closed form)',near(gu(60000).gross,60000/(1-0.4*0.15),1e-9),String(gu(60000).gross));
mk([item(1,1e6,{wdTax:'exempt'})]);ok('tax-exempt holdings: gross = need',near(gu(60000).gross,60000,1e-9));
mk([item(1,1e6,{accountType:'pgbl'})]);ok('deferred (PGBL) at 10%: gross = need / 0.9',near(gu(90000).gross,100000,1e-9));
mk([item(1,1e6,{gainPct:40})],{country:'ES',base:'EUR'});
{const g=gu(60000).gross;ok('Spain (progressive): the gross withdrawal really leaves the need after tax',near(J(`wdNet(${g},buildWithdrawalBuckets(state),'taxable_first',wdTaxConfig(state))`),60000,1e-8)&&g>60000);}
mk([item(1,50000,{gainPct:40})]);
ok('not enough in the portfolio: everything is withdrawn and it is flagged as depleted',(()=>{const r=gu(999999);return r.depleted===true&&near(r.gross,50000)})());
ok('a need of 0 needs no withdrawal',gu(0).gross===0&&gu(0).depleted===false);
ok('gross-up is monotone: more need -> more gross',(()=>{mk([item(1,5e6,{gainPct:60}),item(2,1e6,{accountType:'pgbl'})],{country:'ES',base:'EUR'});let p=0;for(let n=1000;n<=300000;n+=7000){const g=gu(n,'proportional').gross;if(g<p)return false;p=g}return true})());

// ================= 6. the year-by-year drawdown =================
const sim=(o)=>J(`(()=>{const r=simulateWithdrawalPhase(Object.assign({buckets:buildWithdrawalBuckets(state),order:'taxable_first',cfg:wdTaxConfig(state),years:40,startAge:60,spending:60000,pension:0,pensionStartAge:65,realReturnPct:0,inflationPct:0},${JSON.stringify(o||{})}));return {rows:r.rows,totalTax:r.totalTax,totalGross:r.totalGross,depletedAge:r.depletedAge,lastsUntilAge:r.lastsUntilAge,endBalance:r.endBalance}})()`);
mk([item(1,600000,{wdTax:'exempt'})]);
let r=sim({years:30});
ok('0% return, no tax, 600k, 60k a year: lasts exactly 10 years and is depleted at age 70',r.depletedAge===70&&r.rows.length===11&&near(r.totalGross,600000)&&r.totalTax===0,JSON.stringify({d:r.depletedAge,n:r.rows.length}));
r=sim({years:5});ok('a shorter horizon: not depleted, the end balance is what is left (600k - 5 x 60k)',r.depletedAge===null&&near(r.endBalance,300000)&&r.lastsUntilAge===65);
// an independent loop for a real return
{const S=60000,rr=0.04;let bal=1e6,age=60,dep=null;mk([item(1,1e6,{wdTax:'exempt'})]);
 for(let y=0;y<60;y++){if(bal<S-1e-9){dep=60+y;break}bal=(bal-S)*(1+rr)}
 r=sim({years:60,realReturnPct:4});ok('4% real return, 1,000,000, 60k a year: the depletion age equals an independent loop',r.depletedAge===dep,`${r.depletedAge} vs ${dep}`);}
// money conservation with taxes (0% return): start = everything ever withdrawn + what is left
mk([item(1,800000,{gainPct:50}),item(2,300000,{accountType:'pgbl'}),item(3,100000,{wdTax:'exempt'})]);
for(const o of ['taxable_first','deferred_first','proportional']){r=sim({order:o,years:20,spending:50000});
  ok(`[${o}] money is conserved: start = gross withdrawn + end balance; net + tax = gross every year`,near(1.2e6,r.totalGross+r.endBalance,1e-9)&&r.rows.every(x=>near(x.net+x.tax,x.gross,1e-9)&&(x.depleted||near(x.net,x.need,1e-7))));}
// realized gains are conserved: emptying a taxable holding realizes exactly its initial gain (0% return)
mk([item(1,500000,{gainPct:40})]);r=sim({years:60,spending:80000});
ok('emptying a taxable holding (0% return) realizes exactly its initial gain: total tax = 200,000 x 15%',r.depletedAge!==null&&near(r.totalTax,200000*0.15,1e-9),String(r.totalTax));
// gains grow with the portfolio: the gain share of what you sell rises over time
mk([item(1,500000,{gainPct:0})]);r=sim({years:10,spending:20000,realReturnPct:6});
ok('a holding that starts with NO gain accrues gains as it grows: early years pay no tax, later years do',r.rows[0].tax===0&&r.rows[9].tax>r.rows[1].tax&&r.rows.every((x,k)=>k===0||x.tax>=r.rows[k-1].tax-1e-9));
// invariants across orders
mk([item(1,800000,{gainPct:100}),item(2,300000,{accountType:'pgbl'})]);
{const a=sim({order:'taxable_first',years:25,spending:60000,realReturnPct:3}),b=sim({order:'deferred_first',years:25,spending:60000,realReturnPct:3}),c=sim({order:'proportional',years:25,spending:60000,realReturnPct:3});
 run(`state.withdrawalPlan.brGainsPct=10`);const a2=sim({order:'taxable_first',years:25,spending:60000,realReturnPct:3}),b2=sim({order:'deferred_first',years:25,spending:60000,realReturnPct:3}),c2=sim({order:'proportional',years:25,spending:60000,realReturnPct:3});
 ok('IDENTITY: if every class is taxed at the same rate (gains 100%, 10% = 10%), the withdrawal order cannot matter',near(a2.totalTax,b2.totalTax,1e-8)&&near(a2.totalTax,c2.totalTax,1e-8)&&a2.lastsUntilAge===b2.lastsUntilAge&&near(a2.endBalance,c2.endBalance,1e-6),`${a2.totalTax.toFixed(2)} | ${b2.totalTax.toFixed(2)} | ${c2.totalTax.toFixed(2)}`);
 ok('...and when rates DIFFER (15% vs 10%) the orders give different taxes',Math.abs(a.totalTax-b.totalTax)>1);}
mk([item(1,800000,{gainPct:60}),item(2,300000,{accountType:'pgbl'}),item(3,100000,{wdTax:'exempt'})],{extra:{withdrawalPlan:{brGainsPct:0,brPensionPct:0}}});
{const a=sim({order:'taxable_first',years:30,spending:70000,realReturnPct:2}),b=sim({order:'deferred_first',years:30,spending:70000,realReturnPct:2});
 ok('IDENTITY: with no taxes at all, every order gives the same result and net = gross',a.totalTax===0&&near(a.endBalance,b.endBalance,1e-6)&&a.rows.every(x=>near(x.gross,x.net,1e-9)));}
// pension
mk([item(1,2e6,{wdTax:'exempt'})]);r=sim({years:10,spending:60000,pension:24000,pensionStartAge:65});
ok('a public pension reduces the withdrawal from its start age (60k before 65, 36k from 65)',r.rows.slice(0,5).every(x=>near(x.need,60000))&&r.rows.slice(5).every(x=>near(x.need,36000))&&near(r.rows[5].gross,36000));
ok('a pension larger than the spending needs no withdrawals',(()=>{const q=sim({years:5,startAge:70,spending:20000,pension:30000});return q.rows.every(x=>x.gross===0)})());
ok('start age is carried into the rows',sim({years:3,startAge:52}).rows.map(x=>x.age).join()==='52,53,54');
// own yields per class vs an override (no tax here, so the numbers are exact)
mk([item(1,500000,{wdTax:'exempt',annualYieldPct:10}),item(2,500000,{accountType:'pgbl',annualYieldPct:0})],{extra:{withdrawalPlan:{brPensionPct:0}}});
{const own=sim({years:1,spending:1000,realReturnPct:null,inflationPct:0}),ov=sim({years:1,spending:1000,realReturnPct:5}),inf=sim({years:1,spending:1000,realReturnPct:null,inflationPct:10});
 // taxable-first takes the 1,000 from the pension holding (yield 0%); the exempt holding (10%) is untouched
 ok('no override: each class grows at its OWN yield (exempt 10%, pension 0%): 550,000 + 499,000',near(own.rows[0].balanceEnd,550000+499000,1e-12),String(own.rows[0].balanceEnd));
 ok('an override applies ONE real return to every class: (1,000,000 - 1,000) x 1.05',near(ov.rows[0].balanceEnd,999000*1.05,1e-12));
 ok('inflation deflates each class\'s own yield: 500,000 x 1.10/1.10 + 499,000 x 1/1.10',near(inf.rows[0].balanceEnd,500000*1.10/1.10+499000/1.10,1e-12));}


// ================= 7. the tax-adjusted freedom target =================
const factor=(base,order)=>J(`withdrawalTaxFactor(state,${base},'${order||'taxable_first'}')`);
mk([item(1,1e6,{wdTax:'exempt'})]);ok('an all-exempt portfolio: the target needs no tax adjustment (factor 1)',near(factor(3e6),1,1e-12));
mk([item(1,1e6,{gainPct:40})]);ok('all taxable, 40% gain at 15%: factor = 1/(1 - 0.4 x 0.15) exactly',near(factor(3e6),1/(1-0.06),1e-9),String(factor(3e6)));
mk([item(1,1e6,{accountType:'pgbl'})]);ok('all PGBL at 10% on the whole withdrawal: factor = 1/0.9',near(factor(3e6),1/0.9,1e-9));
mk([]);ok('no holdings at all: assumes a taxable portfolio with the default 30% gain (1/(1 - 0.045))',near(factor(3e6),1/(1-0.3*0.15),1e-9));
mk([item(1,1e6,{gainPct:40})]);ok('a zero/negative base target has no adjustment',factor(0)===1&&factor(-5)===1);
mk([item(1,1e6,{gainPct:60}),item(2,1e6,{accountType:'pension_plan'})],{country:'ES',base:'EUR'});
for(const T0 of [1.5e6,4e6,9e6]){
  const f=factor(T0),T=T0*f;
  const net=J(`wdNet(${0.04*T},scaleBuckets(buildWithdrawalBuckets(state),${T}),'taxable_first',wdTaxConfig(state))`);
  ok(`Spain (progressive), base target ${T0/1e6}M: withdrawing 4% of the adjusted target (${(T/1e6).toFixed(3)}M) leaves exactly 4% of the base target after tax`,near(net,0.04*T0,1e-8),`${net.toFixed(4)} vs ${(0.04*T0).toFixed(4)}`);
}
mk([item(1,1e6,{gainPct:100})],{country:'ES',base:'EUR'});
ok('Spain: a bigger portfolio sits in higher brackets, so it needs a bigger relative adjustment (progressive tax)',factor(1e6)<factor(4e6)&&factor(4e6)<factor(2e7));
mk([item(1,1e6,{gainPct:40})],{country:'GL',extra:{withdrawalPlan:{glGainsPct:20}}});ok('Global uses its own editable gains rate (20%): factor = 1/(1 - 0.4 x 0.2)',near(factor(3e6),1/(1-0.08),1e-9));

// ================= 8. optional: use the adjusted target in the projections =================
const load=(country='BR',lang='en')=>run(`state=migrateAndSanitizeState(JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE)));state.country='${country}';state.language='${lang}';state.languageUserChosen=true;
  if('${country}'==='ES'){state.baseCurrency='EUR';state.displayCurrency='EUR';state.earners.forEach(e=>e.regime='Cuenta Ajena')}
  if('${country}'==='GL'){state.baseCurrency='USD';state.displayCurrency='USD';state.earners.forEach(e=>e.regime='Employee')}
  state.debtPlan.autoEvents=false;syncFormInputsFromState();`);
load();const off=J(`(()=>{const m=calculateMetrics();return {t:m.targetFreedomCapital,b:m.baseTargetFreedomCapital,f:m.withdrawalTaxFactorApplied,lean:m.leanFITarget,fat:m.fatFITarget,coast:m.coastFINumber,y:m.yearsToCrossover}})()`);
ok('default (switch off): the freedom target is untouched, factor 1',off.t===off.b&&off.f===1&&near(off.lean,off.t*0.6,1e-12)&&near(off.fat,off.t*1.5,1e-12));
run(`state.withdrawalPlan.applyToTarget=true`);
const on=J(`(()=>{const m=calculateMetrics();return {t:m.targetFreedomCapital,b:m.baseTargetFreedomCapital,f:m.withdrawalTaxFactorApplied,lean:m.leanFITarget,fat:m.fatFITarget,coast:m.coastFINumber,y:m.yearsToCrossover,expected:withdrawalTaxFactor(state,m.baseTargetFreedomCapital,'taxable_first')}})()`);
ok('switch on: the target = base target x the tax factor (and the base target is unchanged)',on.b===off.b&&near(on.f,on.expected,1e-12)&&near(on.t,on.b*on.f,1e-9)&&on.f>1);
ok('...Lean / Fat / Coast FI follow the adjusted target',near(on.lean,on.t*0.6,1e-9)&&near(on.fat,on.t*1.5,1e-9)&&on.coast>off.coast);
ok('...a bigger target can only delay (never bring forward) the freedom year',on.y===null?true:(off.y!==null&&on.y>=off.y),`${off.y} -> ${on.y}`);
ok('...the What-if tab and the projections use it too',(()=>{run(`state.whatIf=Object.assign({},WHATIF_NEUTRAL)`);return near(J('computeWhatIf().base.m.targetFreedomCapital'),on.t,1e-9)})());
run(`state.withdrawalPlan.order='deferred_first'`);ok('the factor uses the chosen withdrawal order',near(J('calculateMetrics().withdrawalTaxFactorApplied'),J(`withdrawalTaxFactor(state,calculateMetrics().baseTargetFreedomCapital,'deferred_first')`),1e-12));

// ================= 9. allocation =================
mk([item(1,100000,{volatilityTier:'low',liquidityTier:'same_day'}),item(2,200000,{volatilityTier:'low',liquidityTier:'short'}),item(3,50000,{volatilityTier:'low',liquidityTier:'long'}),item(4,300000,{volatilityTier:'high',liquidityTier:'short',currency:'USD'}),item(5,60000,{volatilityTier:'medium',liquidityTier:'long',accountType:'pgbl'})]);
const fx2=J(`convertToBase(1,'USD')`);let A=J('summarizeAllocation(state,120000,3)');
const tot=100000+200000+50000+300000*fx2+60000;
ok('allocation: total, by risk, by liquidity',near(A.total,tot,1e-12)&&A.byVolatility.low===350000&&near(A.byVolatility.high,300000*fx2,1e-12)&&A.byVolatility.medium===60000&&A.byLiquidity.same_day===100000&&A.byLiquidity.long===110000);
ok('...by tax class and by currency (USD converted)',A.byTaxClass.deferred===60000&&near(A.byTaxClass.taxable,tot-60000,1e-12)&&A.byCurrency.BRL===410000&&near(A.byCurrency.USD,300000*fx2,1e-12));
ok('safe bucket = LOW volatility AND not locked up (100k + 200k; the 50k long lock-up is excluded)',A.safe===300000);
ok('...years of spending covered = safe / annual spending; target 3 years = 360k; shortfall 60k',near(A.safeYears,2.5,1e-12)&&A.safeTarget===360000&&A.safeShortfall===60000);
A=J('summarizeAllocation(state,60000,3)');ok('...enough safe assets: no shortfall',A.safeYears===5&&A.safeShortfall===0);
A=J('summarizeAllocation(state,0,3)');ok('zero spending: years covered is undefined (null), nothing to cover',A.safeYears===null&&A.safeTarget===0&&A.safeShortfall===0);
mk([]);A=J('summarizeAllocation(state,50000,3)');ok('empty portfolio: everything zero, no crash',A.total===0&&A.safe===0&&A.safeShortfall===150000);

// ================= 10. buckets at the start age =================
const pb=(now,startTotal,contrib)=>J(`projectBucketsToStart(${JSON.stringify(now)},${startTotal},${contrib},7)`);
const Bk=(t,d,g,e)=>({taxable:{bal:t[0],basis:t[1],yield:5},defGains:{bal:g[0],basis:g[1],yield:5},deferred:{bal:d,basis:0,yield:5},exempt:{bal:e,basis:0,yield:5}});
let o1=pb(Bk([100000,100000],0,[0,0],0),200000,50000);
ok('grown 100k -> 200k with 50k of new contributions: basis = 150k (the contributions are not gains), so a 25% gain share',o1.taxable.bal===200000&&o1.taxable.basis===150000);
o1=pb(Bk([100000,60000],50000,[40000,20000],10000),400000,0);
ok('the mix is preserved when scaled (x2), and the gain share stays what it was with no contributions',near(o1.taxable.bal,200000)&&near(o1.deferred.bal,100000)&&near(o1.exempt.bal,20000)&&near(o1.taxable.basis,60000)&&near(o1.defGains.basis,20000)&&o1.deferred.basis===0);
o1=pb(Bk([100000,10000],0,[0,0],0),300000,1e9);ok('basis can never exceed the balance (no negative gains)',o1.taxable.basis<=o1.taxable.bal);
o1=pb(Bk([0,0],0,[0,0],0),90000,30000);ok('no holdings but a projected portfolio: all taxable, basis = what was contributed',o1.taxable.bal===90000&&o1.taxable.basis===30000&&o1.taxable.yield===7);
o1=pb(Bk([100000,100000],0,[0,0],0),0,0);ok('nothing to withdraw from: all zero',wdTotal=>true&&o1.taxable.bal===0&&o1.deferred.bal===0);

// ================= 11. data model =================
const san=(o)=>J(`migrateAndSanitizeState(Object.assign({country:'BR'},${JSON.stringify(o)}))`);
let d=san({liquidInvestments:[{id:1,name:'a',balanceOriginal:5,wdTax:'exempt',gainPct:'42.5'},{id:2,name:'b',balanceOriginal:5,wdTax:'zzz',gainPct:999},{id:3,name:'c',balanceOriginal:5,gainPct:''},{id:4,name:'d',balanceOriginal:5,gainPct:-7},{id:5,name:'e',balanceOriginal:5,gainPct:'abc'}]});
ok('sanitizer (holdings): valid tax class kept, junk -> "auto"; gain% parsed, clamped to 0..100, blank/junk -> null',d.liquidInvestments[0].wdTax==='exempt'&&d.liquidInvestments[0].gainPct===42.5&&d.liquidInvestments[1].wdTax==='auto'&&d.liquidInvestments[1].gainPct===100&&d.liquidInvestments[2].gainPct===null&&d.liquidInvestments[3].gainPct===0&&d.liquidInvestments[4].gainPct===null);
d=san({withdrawalPlan:{startAge:'58',untilAge:200,pensionStartAge:10,monthlySpending:'8000',order:'deferred_first',realReturnPct:'2.5',brGainsPct:99,brPensionPct:-3,glGainsPct:'12',safeBucketYears:99,applyToTarget:'true'}}).withdrawalPlan;
ok('sanitizer (plan): ages clamped (start 0..100, until 60..110, pension 50..80), rates 0..60, bucket 0..10 years, switch parsed',d.startAge===58&&d.untilAge===110&&d.pensionStartAge===50&&d.monthlySpending===8000&&d.order==='deferred_first'&&d.realReturnPct===2.5&&d.brGainsPct===60&&d.brPensionPct===0&&d.glGainsPct===12&&d.safeBucketYears===10&&d.applyToTarget===true);
d=san({withdrawalPlan:{order:'zzz',monthlySpending:'',realReturnPct:'abc',applyToTarget:'maybe'}}).withdrawalPlan;
ok('sanitizer (plan): junk order -> taxable_first; blank spending/return -> null (automatic); junk switch -> off',d.order==='taxable_first'&&d.monthlySpending===null&&d.realReturnPct===null&&d.applyToTarget===false&&d.untilAge===95&&d.brGainsPct===15&&d.brPensionPct===10);
ok('hostile plan (string / array) -> defaults; no prototype pollution',(()=>{const a=san({withdrawalPlan:'x'}),b=san({withdrawalPlan:[1]});run(`migrateAndSanitizeState(JSON.parse('{"country":"BR","withdrawalPlan":{"__proto__":{"polluted":1}}}'))`);return a.withdrawalPlan.order==='taxable_first'&&b.withdrawalPlan.untilAge===95&&run('({}).polluted')===undefined})());
load();run(`state.withdrawalPlan=Object.assign({},state.withdrawalPlan,{startAge:55,untilAge:90,order:'proportional',brGainsPct:17.5,applyToTarget:true});state.liquidInvestments[1].gainPct=61;state.liquidInvestments[1].wdTax='taxable'`);
const back=J(`(()=>{const p=JSON.parse(${JSON.stringify(run('JSON.stringify(buildExportPayload())'))});return migrateAndSanitizeState(p.data||p)})()`);
ok('export -> import keeps the plan and every holding\'s tax fields',back.withdrawalPlan.startAge===55&&back.withdrawalPlan.untilAge===90&&back.withdrawalPlan.order==='proportional'&&back.withdrawalPlan.brGainsPct===17.5&&back.withdrawalPlan.applyToTarget===true&&back.liquidInvestments[1].gainPct===61&&back.liquidInvestments[1].wdTax==='taxable');
load();ok('example profile: six holdings; an exempt LCI/LCA and a PGBL that resolves to "deferred"; gain shares on the taxable ones',J('state.liquidInvestments.length')===6&&J('resolveWithdrawalTaxClass(state.liquidInvestments[4])')==='exempt'&&J('resolveWithdrawalTaxClass(state.liquidInvestments[5])')==='deferred'&&J('state.liquidInvestments[1].gainPct')===35);

// ================= 12. the card on screen =================
const text=(e)=>((e.innerText||'')+' '+(e.innerHTML||'')+' '+(e.children||[]).map(text).join(' ')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const clear=(...ids)=>ids.forEach(id=>{if(els[id]&&els[id].children)els[id].children.length=0});
const render=()=>{clear('wd-summary','wd-verdict','wd-strategies','wd-alloc','wd-alloc-verdict');run('renderWithdrawalPhase(calculateMetrics())')};
const setWd=(o)=>run(`state.withdrawalPlan=Object.assign({},state.withdrawalPlan,${JSON.stringify(o)})`);
// the same numbers assembled independently, straight from the engine
const expected=(o)=>J(`(()=>{const m=calculateMetrics(),p=wdPlan();
  const pa=(state.earners&&state.earners.length>0)?(Number(state.earners[0].age)||35):35, fa=m.yearsToCrossover===null?null:pa+m.yearsToCrossover;
  const ra=Number(state.traditionalRetirementAge)>0?Number(state.traditionalRetirementAge):65;
  const start=p.startAge>0?p.startAge:(fa!==null?fa:ra), until=Math.max(start+1,p.untilAge), yrs=Math.min(60,Math.max(0,start-pa));
  const sim=simulateRealPortfolio({start:m.totalLiquidBase,monthlyInvest:m.monthlyInvest,years:yrs,realReturn:m.realAnnualReturn,careerGrowthRate:m.careerGrowthRate,careerGrowthProportional:m.careerGrowthProportional,events:m.lifeEvents,surplus:m.monthlySurplus});
  let contrib=0;for(let y=0;y<yrs;y++)contrib+=12*getProjectedMonthlyContribution(m.monthlyInvest,y,m.careerGrowthRate,m.careerGrowthProportional);
  const pStart=sim.values[yrs],b=projectBucketsToStart(buildWithdrawalBuckets(state),pStart,contrib,m.weightedPortfolioYield);
  const r=simulateWithdrawalPhase({buckets:b,order:'${o||'taxable_first'}',cfg:wdTaxConfig(state),years:until-start,startAge:start,spending:(p.monthlySpending===null?m.postKidsMonthlyLivingCost:p.monthlySpending)*12,pension:Math.max(0,m.expectedMonthlyGovPension)*12,pensionStartAge:p.pensionStartAge,realReturnPct:p.realReturnPct,inflationPct:state.inflationRate});
  return {start,until,pStart,totalTax:r.totalTax,end:r.endBalance,depleted:r.depletedAge,first:r.first,years:yrs}})()`);
load();setWd({startAge:0,order:'taxable_first',monthlySpending:null,realReturnPct:null});render();
let ex=expected();const sm=text(els['wd-summary']);
ok('year-1 boxes: portfolio at the start age, net spending, gross withdrawal, tax with its share, and the withdrawal rate',/Portfolio at age \d+/.test(sm)&&/Net spending per year/.test(sm)&&/Gross withdrawal, year 1/.test(sm)&&/Tax in year 1/.test(sm)&&/Withdrawal rate/.test(sm),sm.slice(0,120));
ok('...they are the engine\'s numbers (portfolio, gross withdrawal, tax)',sm.includes(J(`fmt(${ex.pStart})`))&&sm.includes(J(`fmt(${ex.first.gross})`))&&sm.includes(J(`fmt(${ex.first.tax})`))&&sm.includes(((ex.first.gross/ex.pStart)*100).toFixed(2)+'%'));
ok('the start age is automatic: the freedom age when it is reached',ex.start===J(`state.earners[0].age+calculateMetrics().yearsToCrossover`));
const vd=text(els['wd-verdict']);
ok('verdict: year-1 sentence (net, gross, tax, rate), how long it lasts, the order question and the tax-adjusted target',/to spend .* after tax this year you need to withdraw/.test(vd)&&/(lasts until age|runs out at age)/.test(vd)&&/(best order|barely changes)/.test(vd)&&/Counting the tax on withdrawals it rises to/.test(vd),vd.slice(0,160));
setWd({startAge:0});
const st=text(els['wd-strategies']);
ok('strategies table: three orders with the year-1 tax, total tax, how long it lasts and the end balance; the chosen one is highlighted',/Proportional/.test(st)&&/Taxable first/.test(st)&&/Pension accounts first/.test(st)&&/Tax in year 1/.test(st)&&/Total tax until the end/.test(st)&&/Portfolio at age 95/.test(st)&&/text-gold-300/.test(els['wd-strategies'].innerHTML));
ok('...the chosen order\'s total tax is the engine\'s',st.includes(J(`fmt(${ex.totalTax})`)));
// the star marks the BEST order (longest-lasting, then the largest end balance), and only that one
{const orders=['proportional','taxable_first','deferred_first'];
 const rs=orders.map(o=>{const e=expected(o);return {o,lasts:e.depleted!==null?e.depleted:e.until,end:e.end}});
 rs.sort((a,b)=>(b.lasts-a.lasts)||(b.end-a.end));
 const best=rs[0].o;
 const heads=els['wd-strategies'].innerHTML.split('<th ').slice(2);          // the three order columns (note the space: '<thead' must not split)
 const starred=heads.map((h,k)=>h.includes('★')?orders[k]:null).filter(Boolean);
 ok('the ★ in the orders table marks exactly the best order according to the engine',starred.length===1&&starred[0]===best&&rs[0].end>rs[2].end,`best=${best}, starred=${starred.join()}, ends ${rs.map(r=>Math.round(r.end)).join(' > ')}`);}
// chart
run(`globalThis.__c=null;Chart=function(c,cfg){globalThis.__c=cfg;this.destroy=()=>{}};renderWithdrawalPhase(calculateMetrics());`);
const ch=J(`(()=>{const c=__c;return {n:c.data.datasets.length,names:c.data.datasets.map(d=>d.label),first:c.data.labels[0],last:c.data.labels[c.data.labels.length-1],len:c.data.labels.length,starts:c.data.datasets.map(d=>d.data[0]),ends:c.data.datasets.map(d=>d.data[d.data.length-1])}})()`);
ok('chart: three orders over the ages from the start age to the plan-until age, all starting from the same portfolio',ch.n===3&&ch.first===ex.start&&ch.last===ex.until&&ch.len===ex.until-ex.start+1&&new Set(ch.starts).size===1&&ch.starts[0]===Math.round(ex.pStart));
ok('...the chosen order (taxable first) ends at the engine\'s end balance',Math.abs(ch.ends[1]-Math.round(ex.end))<=1);
// options
setWd({startAge:70,untilAge:90});render();ex=expected();
ok('a chosen start age (70) is used: the portfolio is projected to that age with the contributions',ex.start===70&&J(`wdPlan().startAge`)===70&&text(els['wd-summary']).includes('Portfolio at age 70')&&text(els['wd-strategies']).includes('Portfolio at age 90'));
const pen=J('calculateMetrics().expectedMonthlyGovPension');setWd({startAge:70,pensionStartAge:65,monthlySpending:9000});render();ex=expected();
ok('spending override + public pension already started: the year-1 need is spending - pension',near(ex.first.need,Math.max(0,9000*12-pen*12),1e-9),`${ex.first.need.toFixed(0)} = 108,000 - ${(pen*12).toFixed(0)}`);
setWd({startAge:0,pensionStartAge:65,monthlySpending:null});
setWd({startAge:60});run(`state.earners[0].age=80`);render();ex=expected();
ok('a start age at or before today (60, while the person is 80): the portfolio of today, no projection years',ex.years===0&&near(ex.pStart,J('calculateMetrics().totalLiquidBase'),1e-9));
load();setWd({monthlySpending:400000});render();ex=expected();
ok('spending the portfolio cannot sustain: the depletion age is reported and the verdict warns',ex.depleted!==null&&/runs out at age/.test(text(els['wd-verdict']))&&/runs out at/.test(text(els['wd-strategies'])));
load();run(`state.liquidInvestments=[];state.debtPlan.autoEvents=false;state.monthlyInvestment=0;state.lifeEvents=[]`);render();
ok('nothing to draw on: a clear message (no NaN)',/there is no portfolio to draw on/.test(text(els['wd-verdict']))&&!/NaN|Infinity/.test(text(els['wd-verdict'])));
// allocation on screen
load();render();
const al=text(els['wd-alloc']);
ok('allocation: four blocks (risk, liquidity, tax on withdrawal, currency) listing the demo holdings',/By risk/.test(al)&&/By liquidity/.test(al)&&/By tax on withdrawal/.test(al)&&/By currency/.test(al)&&/Exempt/.test(al)&&/Pension \(tax on the whole withdrawal\)/.test(al)&&/BRL/.test(al)&&/USD/.test(al));
const A2=J(`summarizeAllocation(state,${expected().first.need>=0?J('(wdPlan().monthlySpending===null?calculateMetrics().postKidsMonthlyLivingCost:wdPlan().monthlySpending)*12'):0},3)`);
const av=text(els['wd-alloc-verdict']);
ok('safe bucket sentence carries the engine\'s years of spending',new RegExp(`covers ${A2.safeYears.toFixed(1)} years of spending`).test(av),av.slice(0,120));
setWd({safeBucketYears:10});render();ok('a too-small safe bucket warns and says how much is missing',/short/.test(text(els['wd-alloc-verdict']))&&/If the market falls early in retirement/.test(text(els['wd-alloc-verdict'])));
setWd({safeBucketYears:0});render();ok('a target of 0 years is always met',/covers [\d.]+ years of spending \(target: 0\)/.test(text(els['wd-alloc-verdict'])));
run(`state.liquidInvestments.forEach(l=>{l.volatilityTier='high'})`);render();ok('more than 80% in high-volatility assets: a sequence-of-returns warning',/in high-volatility assets/.test(text(els['wd-alloc-verdict']))&&/sequence-of-returns risk/.test(text(els['wd-alloc-verdict'])));
run(`state.liquidInvestments.forEach(l=>{l.volatilityTier='low'})`);render();ok('almost nothing in high-volatility assets: an inflation note (rule of thumb, not advice)',/Only 0% of the portfolio is in high-volatility/.test(text(els['wd-alloc-verdict']))&&/not a recommendation/.test(text(els['wd-alloc-verdict'])));
// handlers
const w=(f,v)=>{run(`updateWithdrawalPlan('${f}',${JSON.stringify(v)})`);return J('state.withdrawalPlan')};
load();
ok('handler: start age clamps (0..100; text -> 0)',w('startAge','150').startAge===100&&w('startAge','abc').startAge===0&&w('startAge','-4').startAge===0);
ok('handler: plan-until age clamps 60..110 (junk -> 95); pension age 50..80 (junk -> 65)',w('untilAge','20').untilAge===60&&w('untilAge','999').untilAge===110&&w('untilAge','x').untilAge===95&&w('pensionStartAge','1').pensionStartAge===50&&w('pensionStartAge','99').pensionStartAge===80&&w('pensionStartAge','').pensionStartAge===65);
ok('handler: spending and real return: blank -> null (automatic), values clamped',w('monthlySpending','').monthlySpending===null&&w('monthlySpending','7500').monthlySpending===7500&&w('realReturnPct','').realReturnPct===null&&w('realReturnPct','99').realReturnPct===30&&w('realReturnPct','-99').realReturnPct===-10&&w('monthlySpending','-5').monthlySpending===0);
ok('handler: order accepts the three orders only; rates clamp to 0..60; bucket 0..10; switch is boolean',w('order','deferred_first').order==='deferred_first'&&w('order','bogus').order==='taxable_first'&&w('brGainsPct','99').brGainsPct===60&&w('brPensionPct','-5').brPensionPct===0&&w('glGainsPct','12.5').glGainsPct===12.5&&w('safeBucketYears','99').safeBucketYears===10&&w('applyToTarget',true).applyToTarget===true);
ok('handler: switching the target adjustment on changes the metrics everywhere',J('calculateMetrics().withdrawalTaxFactorApplied')>1&&(w('applyToTarget',false),J('calculateMetrics().withdrawalTaxFactorApplied')===1));
load();run(`state.withdrawalPlan=Object.assign({},state.withdrawalPlan,{startAge:57,untilAge:92,pensionStartAge:67,monthlySpending:8800,order:'proportional',realReturnPct:3.5,brGainsPct:17.5,brPensionPct:12,glGainsPct:18,safeBucketYears:2.5,applyToTarget:true});syncWithdrawalInputs()`);
ok('inputs on screen follow the saved plan',String(els['input-wd-start'].value)==='57'&&String(els['input-wd-until'].value)==='92'&&String(els['input-wd-pension-age'].value)==='67'&&String(els['input-wd-spending'].value)==='8800'&&els['input-wd-order'].value==='proportional'&&String(els['input-wd-return'].value)==='3.5'&&String(els['input-wd-br-gains'].value)==='17.5'&&String(els['input-wd-br-pension'].value)==='12'&&String(els['input-wd-gl-gains'].value)==='18'&&String(els['input-wd-safe'].value)==='2.5');
run(`state.withdrawalPlan.startAge=0;state.withdrawalPlan.monthlySpending=null;state.withdrawalPlan.realReturnPct=null;syncWithdrawalInputs()`);ok('...and automatic values show as empty',els['input-wd-start'].value===''&&els['input-wd-spending'].value===''&&els['input-wd-return'].value==='');
render();ok('the empty inputs show what "automatic" means right now (age and amount)',/automatic: age \d+/.test(els['input-wd-start'].placeholder)&&/automatic: /.test(els['input-wd-spending'].placeholder));
// holdings: the tax fields on each card
load();run(`state.liquidInvestments[1].wdTax='auto'`);
run('updateLiquidInvestment(102,"gainPct","62")');ok('holding field: unrealized gain % is stored as a number',J('state.liquidInvestments[1].gainPct')===62);
run('updateLiquidInvestment(102,"gainPct","")');ok('...blank -> null (the default 30% is assumed)',J('state.liquidInvestments[1].gainPct')===null);
run('updateLiquidInvestment(102,"gainPct","900")');ok('...clamped to 100',J('state.liquidInvestments[1].gainPct')===100);
run('updateLiquidInvestment(102,"gainPct","abc")');ok('...text -> null',J('state.liquidInvestments[1].gainPct')===null);
run('updateLiquidInvestment(102,"wdTax","exempt")');ok('holding field: the tax treatment can be chosen',J('state.liquidInvestments[1].wdTax')==='exempt');
clear('container-liquid-investments-list');run('renderLiquidInvestmentsList()');
const lh=els['container-liquid-investments-list'].children.map(c=>c.innerHTML).join('\n');
ok('the holding card shows the tax select (all 5 choices) for every holding',(lh.match(/data-focus-key="li-\d+-wdTax"/g)||[]).length===6&&/Automatic \(from account type\)/.test(lh)&&/Exempt \(e\.g\. LCI\/LCA\)/.test(lh)&&/Pension: tax on the gain only/.test(lh));
ok('...and the gain % field only for holdings taxed on their gains (102 was just set to exempt, 105 is exempt, 106 is the PGBL)',(lh.match(/data-focus-key="li-\d+-gainPct"/g)||[]).length===3&&!/li-102-gainPct/.test(lh)&&!/li-105-gainPct/.test(lh)&&!/li-106-gainPct/.test(lh)&&/li-101-gainPct/.test(lh)&&/li-103-gainPct/.test(lh)&&/li-104-gainPct/.test(lh));

// ================= 13. residences, translations, markup =================
for(const c of ['BR','ES','GL']){load(c,'en');render();const all=text(els['wd-summary'])+text(els['wd-verdict'])+text(els['wd-strategies'])+text(els['wd-alloc'])+text(els['wd-alloc-verdict']);ok(`[${c}] the whole card renders with no NaN / undefined / placeholders`,!/NaN|Infinity|undefined|\{[a-z0-9]+\}/.test(all)&&/Net spending per year/.test(all));}
ok('Spain and Brazil really differ (Spain\'s scales vs Brazil\'s flat rates change the tax)',(()=>{load('BR','en');const b=expected().totalTax;load('ES','en');const e=expected().totalTax;return b>0&&e>0&&Math.abs(b-e)>1})());
for(const lang of ['pt','es','en']){load('BR',lang);render();const all=text(els['wd-summary'])+text(els['wd-verdict'])+text(els['wd-strategies'])+text(els['wd-alloc'])+text(els['wd-alloc-verdict']);
  const w2=lang==='en'?/Taxable first/:lang==='es'?/Tributables primero/:/Tributáveis primeiro/;
  ok(`[${lang}] the card renders in the language, no leftover {placeholders}`,w2.test(all)&&!/\{[a-z0-9]+\}|undefined|NaN/.test(all));}
load('BR','en');render();
ok('[en] no Portuguese on the withdrawal card',!/ção|ões|Tributáv|Previdência|Isento|Carteira|Imposto|Saque/.test(text(els['wd-summary'])+text(els['wd-verdict'])+text(els['wd-strategies'])+text(els['wd-alloc'])+text(els['wd-alloc-verdict'])));
const page=fs.readFileSync(path.join(__dirname,'..','..','dist','index.html'),'utf8');
ok('a note explains what the ★ means (ends richest, which is not always the lowest total tax)',/data-i18n="wdStarNote"/.test(page)&&['pt','es','en'].every(l=>run(`I18N.${l}.wdStarNote`).length>40));
ok('the card sits in the Retirement tab, before the Taxes tab',page.indexOf('id="card-withdrawal"')>page.indexOf('id="chart-retirement-trajectory"')&&page.indexOf('id="card-withdrawal"')<page.indexOf('id="view-taxes"'));
process.exitCode=bad?1:0;
