const {run,els}=require('../harness.js');
for(const c of ['ES','GL','BR']){run(`state.country='${c}';updateUI();`);console.log(c,'-> ES row hidden:',els['row-rental-tax-es']._hidden,'| PT row hidden:',els['row-rental-tax-gl']._hidden);}
