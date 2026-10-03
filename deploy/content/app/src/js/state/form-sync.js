    window.handleDataUpdate = function() {
      readInputsIntoState();
      updateUI();
      saveState();
    };

    function readInputsIntoState() {
      state.inflationRate = getVal('input-inflation-rate') !== 0 ? getVal('input-inflation-rate') : state.inflationRate;

      const elCareerGrowth = document.getElementById('input-career-growth-rate');
      if (elCareerGrowth) {
        state.careerGrowthRate = Math.max(0, parseFloat(elCareerGrowth.value) || 0);
      }
      const elCareerProportional = document.getElementById('input-career-growth-proportional');
      if (elCareerProportional) {
        state.careerGrowthProportional = Boolean(elCareerProportional.checked);
      }

      state.debts.parcelas = getVal('input-debt-parcelas');
      state.debts.revolving = getVal('input-debt-revolving');
      state.debts.autoLoans = getVal('input-debt-auto');

      // BUGFIX: this used to run unconditionally, reading every category input's
      // CURRENT VALUE on every edit anywhere on the page — harmless in shared mode
      // (that value is always the live number), but in split mode these fields are
      // hidden and frozen at whatever they showed the moment the household mode was
      // switched, so this was silently overwriting the derived totals (the sum of
      // the recurring-expenses list) back to that stale snapshot on every keystroke.
      // In split mode, state.outflows is kept correct by
      // recomputeOutflowsFromRecurring() (ui/recurring-expenses.js) instead.
      if ((state.householdMode || 'shared') !== 'split') {
        state.outflows.housing = getVal('input-outflow-housing');
        state.outflows.utilities = getVal('input-outflow-utilities');
        state.outflows.telecom = getVal('input-outflow-telecom');
        state.outflows.groceries = getVal('input-outflow-groceries');
        state.outflows.dining = getVal('input-outflow-dining');
        state.outflows.transport = getVal('input-outflow-transport');
        state.outflows.cleaning = getVal('input-outflow-cleaning');
        state.outflows.subs = getVal('input-outflow-subs');
        state.outflows.elderCare = getVal('input-outflow-eldercare');
        state.outflows.charitableGiving = getVal('input-outflow-charitable');
      }

      state.insurance.lifeInsuranceMonthlyPremium = getVal('input-ins-life-premium');
      state.insurance.lifeInsuranceEmployerCoveragePct = getVal('input-ins-life-employer-pct');
      state.insurance.disabilityMonthlyPremium = getVal('input-ins-disability-premium');
      state.insurance.healthInsuranceMonthlyPremium = getVal('input-ins-health-premium');
      state.insurance.propertyInsuranceMonthlyPremium = getVal('input-ins-property-premium');

      const elHealthcareInflation = document.getElementById('input-healthcare-inflation');
      if (elHealthcareInflation && elHealthcareInflation.value !== '') {
        state.healthcareInflationRate = Math.max(0, parseFloat(elHealthcareInflation.value) || 0);
      }
      state.insurance.lifeInsuranceCoverage = getVal('input-ins-life-coverage');

      const elGovPension = document.getElementById('input-gov-pension');
      if (elGovPension) {
        state.expectedMonthlyGovPension = Math.max(0, parseFloat(elGovPension.value) || 0);
      }

      const elRevolvingRate = document.getElementById('input-debt-revolving-rate');
      if (elRevolvingRate) {
        state.debts.revolvingRatePct = Math.max(0, parseFloat(elRevolvingRate.value) || 0);
      }
      const elAutoRate = document.getElementById('input-debt-auto-rate');
      if (elAutoRate) {
        state.debts.autoLoansRatePct = Math.max(0, parseFloat(elAutoRate.value) || 0);
      }

      const elEstateRegion = document.getElementById('select-estate-region');
      const oldEstateRegion = state.estateSettings.region;   // the default that was ACTUALLY on screen before this pass
      if (elEstateRegion) state.estateSettings.region = elEstateRegion.value || null;
      const elEstateRate = document.getElementById('input-estate-tax-rate');
      if (elEstateRate) {
        // BUGFIX: this used to store the field's CURRENTLY DISPLAYED value as a permanent
        // override on every call, regardless of which field actually changed (this function
        // re-reads every input on the page on any edit anywhere). That was harmless before
        // regions existed (the displayed value was always just the flat country default), but
        // once a region can change the default, it meant picking a new region immediately
        // froze the OLD default as an "override" before the new one was ever shown — the
        // region picker looked broken.
        // The fix compares the typed number against the OLD region's default (what was
        // actually rendered on screen a moment ago), NOT the new region's default: at the
        // moment this function runs, the rate field still shows the stale number from before
        // the region changed, so comparing it against the brand-new default would make every
        // region change look like "the person typed a custom rate" again.
        const typedRate = Math.max(0, parseFloat(elEstateRate.value) || 0);
        const oldDefault = getDefaultSuccessionTaxRate(state.country || 'BR', oldEstateRegion);
        state.estateSettings.successionTaxRatePctOverride = Math.abs(typedRate - oldDefault) > 1e-9 ? typedRate : null;
      }
      const elHasWill = document.getElementById('input-has-will');
      if (elHasWill) state.estateSettings.hasWill = Boolean(elHasWill.checked);
      const elGuardianDesignated = document.getElementById('input-guardian-designated');
      if (elGuardianDesignated) state.estateSettings.guardianDesignated = Boolean(elGuardianDesignated.checked);
      const elGuardianName = document.getElementById('input-guardian-name');
      if (elGuardianName) state.estateSettings.guardianName = elGuardianName.value;

      const elCreditScore = document.getElementById('input-credit-score');
      if (elCreditScore) {
        state.creditScore = elCreditScore.value === '' ? null : Math.max(0, Math.min(1000, parseFloat(elCreditScore.value) || 0));
      }

      const elRetirementAge = document.getElementById('input-retirement-age');
      if (elRetirementAge) {
        state.traditionalRetirementAge = Math.max(1, parseFloat(elRetirementAge.value) || 65);
      }
      const elExtraDeps = document.getElementById('input-br-extra-dependents');
      if (elExtraDeps) {
        state.brExtraDependents = Math.max(0, Math.floor(parseFloat(elExtraDeps.value) || 0));
      }
      const elEsRed = document.getElementById('input-es-rental-reduction');
      if (elEsRed && [50, 60, 70, 90].includes(parseFloat(elEsRed.value))) state.esRentalReductionPct = parseFloat(elEsRed.value);
      const elGlRate = document.getElementById('input-gl-rental-rate');
      if (elGlRate && elGlRate.value !== '') state.glRentalTaxRatePct = Math.max(0, Math.min(60, parseFloat(elGlRate.value) || 0));
      const elGlLimit = document.getElementById('input-gl-retirement-limit');
      if (elGlLimit) state.glRetirementAnnualLimit = Math.max(0, parseFloat(elGlLimit.value) || 0);
      const elGlMarg = document.getElementById('input-gl-marginal-rate');
      if (elGlMarg && elGlMarg.value !== '') state.glMarginalTaxRatePct = Math.max(0, Math.min(80, parseFloat(elGlMarg.value) || 0));
      const elGlChar = document.getElementById('input-gl-charitable-rate');
      if (elGlChar && elGlChar.value !== '') state.glCharitableDeductionPct = Math.max(0, Math.min(100, parseFloat(elGlChar.value) || 0));
      const elIncHedge = document.getElementById('input-score-include-hedge');
      if (elIncHedge) state.scoreIncludeHedge = Boolean(elIncHedge.checked);

      const elBufferPct = document.getElementById('input-outflow-buffer-pct');
      if (elBufferPct) {
        state.safetyBufferPct = Math.max(0, parseFloat(elBufferPct.value) || 0);
      }

      state.monthlyInvestment = getVal('input-monthly-investment');
    }

    // BUGFIX: these editable fields were never written FROM state back INTO the
    // DOM anywhere (only the reverse, via readInputsIntoState). That meant that
    // after a page reload, a country switch, or loading example data, every one
    // of these inputs kept showing its static HTML default (e.g. 0, or 4.5 for
    // inflation) instead of the real saved value — even though the KPI cards
    // right next to them (which read straight from `state`) showed the correct,
    // different figures. Worse, editing *any* one of these fields calls
    // handleDataUpdate(), which re-reads *all* of them from the DOM — silently
    // resetting every other field back to its stale default and overwriting the
    // real saved data. This function is the missing half: it syncs the inputs to
    // match state. It's called on load, on country switch, and after loading
    // example data — deliberately NOT from inside updateUI()/handleDataUpdate(),
    // so it never fights with the field the user is actively typing into
    // (re-writing element.value on every keystroke would strip things like a
    // trailing decimal point mid-type).
    function syncFormInputsFromState() {
      setVal('input-inflation-rate', state.inflationRate);

      const elCareerGrowth = document.getElementById('input-career-growth-rate');
      if (elCareerGrowth) {
        elCareerGrowth.value = typeof state.careerGrowthRate === 'number' ? state.careerGrowthRate : 2.0;
      }
      const elCareerProportional = document.getElementById('input-career-growth-proportional');
      if (elCareerProportional) {
        elCareerProportional.checked = state.careerGrowthProportional !== false;
      }

      setVal('input-debt-parcelas', state.debts.parcelas);
      setVal('input-debt-revolving', state.debts.revolving);
      setVal('input-debt-auto', state.debts.autoLoans);

      const elCreditScore = document.getElementById('input-credit-score');
      if (elCreditScore) {
        elCreditScore.value = (typeof state.creditScore === 'number') ? state.creditScore : '';
      }

      const elRetirementAge = document.getElementById('input-retirement-age');
      if (elRetirementAge) {
        elRetirementAge.value = (typeof state.traditionalRetirementAge === 'number') ? state.traditionalRetirementAge : 65;
      }
      const elExtraDeps = document.getElementById('input-br-extra-dependents');
      if (elExtraDeps) elExtraDeps.value = state.brExtraDependents || 0;
      const elEsRed = document.getElementById('input-es-rental-reduction');
      if (elEsRed) elEsRed.value = String([50, 60, 70, 90].includes(Number(state.esRentalReductionPct)) ? state.esRentalReductionPct : 50);
      const elGlRate = document.getElementById('input-gl-rental-rate');
      if (elGlRate) elGlRate.value = (typeof state.glRentalTaxRatePct === 'number') ? state.glRentalTaxRatePct : 20;
      const elGlLimit = document.getElementById('input-gl-retirement-limit');
      if (elGlLimit) elGlLimit.value = state.glRetirementAnnualLimit || 0;
      const elGlMarg = document.getElementById('input-gl-marginal-rate');
      if (elGlMarg) elGlMarg.value = (typeof state.glMarginalTaxRatePct === 'number') ? state.glMarginalTaxRatePct : 25;
      const elGlChar = document.getElementById('input-gl-charitable-rate');
      if (elGlChar) elGlChar.value = (typeof state.glCharitableDeductionPct === 'number') ? state.glCharitableDeductionPct : 0;
      const elIncHedge = document.getElementById('input-score-include-hedge');
      if (elIncHedge) elIncHedge.checked = Boolean(state.scoreIncludeHedge);

      setVal('input-outflow-housing', state.outflows.housing);
      setVal('input-outflow-utilities', state.outflows.utilities);
      setVal('input-outflow-telecom', state.outflows.telecom);
      setVal('input-outflow-groceries', state.outflows.groceries);
      setVal('input-outflow-dining', state.outflows.dining);
      setVal('input-outflow-transport', state.outflows.transport);
      setVal('input-outflow-cleaning', state.outflows.cleaning);
      setVal('input-outflow-subs', state.outflows.subs);
      setVal('input-outflow-eldercare', state.outflows.elderCare);
      setVal('input-outflow-charitable', state.outflows.charitableGiving);

      setVal('input-ins-life-premium', state.insurance.lifeInsuranceMonthlyPremium);
      setVal('input-ins-life-employer-pct', state.insurance.lifeInsuranceEmployerCoveragePct);
      setVal('input-ins-disability-premium', state.insurance.disabilityMonthlyPremium);
      setVal('input-ins-health-premium', state.insurance.healthInsuranceMonthlyPremium);
      setVal('input-ins-property-premium', state.insurance.propertyInsuranceMonthlyPremium);

      const elHealthcareInflation = document.getElementById('input-healthcare-inflation');
      if (elHealthcareInflation) {
        elHealthcareInflation.value = (typeof state.healthcareInflationRate === 'number')
          ? state.healthcareInflationRate
          : getDefaultHealthcareInflation(state.inflationRate);
      }
      setVal('input-ins-life-coverage', state.insurance.lifeInsuranceCoverage);

      const elGovPension = document.getElementById('input-gov-pension');
      if (elGovPension) elGovPension.value = state.expectedMonthlyGovPension || 0;

      const elRevolvingRate = document.getElementById('input-debt-revolving-rate');
      if (elRevolvingRate) elRevolvingRate.value = typeof state.debts.revolvingRatePct === 'number' ? state.debts.revolvingRatePct : 12.0;
      const elAutoRate = document.getElementById('input-debt-auto-rate');
      if (elAutoRate) elAutoRate.value = typeof state.debts.autoLoansRatePct === 'number' ? state.debts.autoLoansRatePct : 18.0;

      const elBufferPct = document.getElementById('input-outflow-buffer-pct');
      if (elBufferPct) {
        elBufferPct.value = typeof state.safetyBufferPct === 'number' ? state.safetyBufferPct : 15.0;
      }

      setVal('input-monthly-investment', state.monthlyInvestment);
      syncWhatIfInputs();
      syncDebtPlanInputs();
      syncMortgageInputs();
      syncWithdrawalInputs();
    }

