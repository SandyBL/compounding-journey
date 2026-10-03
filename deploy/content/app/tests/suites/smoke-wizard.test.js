const {run,els,sb}=require('../harness.js');
// ---- PJ card in earner list (BR) ----
run(`state.country='BR';state.language='pt';state.earners=[{id:1,name:'A',age:38,regime:'CLT',grossMonthly:9000,pjTaxRate:6},{id:2,name:'B',age:36,regime:'PJ',grossMonthly:12000,pjTaxRate:6,pjCompanyType:'simples3',proLaborePct:28}];updateUI();`);
const cards=els['container-earners-list'].children.map(c=>c.innerHTML);
console.log('CLT card has PJ type select (expect false):',/setEarnerCompanyType/.test(cards[0]));
console.log('PJ card has type select + pro-labore + assumption note (expect true):',/setEarnerCompanyType/.test(cards[1]),/proLaborePct/.test(cards[1]),/Estimativa: alíquota única/.test(cards[1]));
// changing company type applies preset and editing rate flips to custom
run(`setEarnerCompanyType(2,'simples5')`);console.log('rate after Simples Anexo V:',run(`state.earners[1].pjTaxRate`),'type',run(`state.earners[1].pjCompanyType`));
run(`updateEarner(2,'pjTaxRate','9')`);console.log('after manual edit -> type:',run(`state.earners[1].pjCompanyType`),'rate',run(`state.earners[1].pjTaxRate`));
run(`state.country='ES';updateUI();`);
console.log('ES: PJ row hidden for Autonomo (expect no select):',!/setEarnerCompanyType/.test(els['container-earners-list'].children.map(c=>c.innerHTML).join('')));
// ---- Language behaviour ----
run(`state.country='BR';state.language='en';state.languageUserChosen=true;`);
run(`proceedSetProfileCountry('ES')`);console.log('user picked EN, country -> ES, language (expect en):',run('state.language'));
run(`state.languageUserChosen=false;state.language='pt';`);sb.navigator.language='pt-BR';
run(`proceedSetProfileCountry('ES')`);console.log('never picked, pt browser, country ES (expect es):',run('state.language'));
sb.navigator.language='en-US';run(`state.languageUserChosen=false;`);
run(`proceedSetProfileCountry('ES')`);console.log('never picked, EN browser, country ES (expect en):',run('state.language'));
run(`setLanguage('pt')`);console.log('after clicking PT: chosen flag (expect true):',run('state.languageUserChosen'));
run(`proceedSetProfileCountry('BR')`);console.log('clicked PT, country -> BR (expect pt):',run('state.language'));
// wizard keeps a chosen language
run(`state.language='en';state.languageUserChosen=true;wizardSelectedCountry='ES';proceedFinishSetupWizard();`);
console.log('wizard ES with user-chosen EN -> language,chosen (expect en,true):',run('state.language'),run('state.languageUserChosen'));
sb.navigator.language='pt-BR';
run(`state.language='pt';state.languageUserChosen=false;wizardSelectedCountry='ES';proceedFinishSetupWizard();`);
console.log('wizard ES never picked, pt browser -> (expect es):',run('state.language'));
// migration of a legacy save
console.log('legacy save keeps language flag true:',run(`migrateAndSanitizeState({language:'en',country:'ES'}).languageUserChosen`));
