    window.finishSetupWizard = function() {
      // BUGFIX: re-opening the wizard (header button, always available) and
      // finishing it silently wiped out an existing profile with zero warning.
      // Only warn when there's actually an existing completed profile to lose —
      // first-time onboarding (state.wizardCompleted still false) shouldn't nag
      // about "losing" data that doesn't exist yet.
      if (state.wizardCompleted) {
        showConfirmModal({
          title: t('confirmWizardRerunTitle'),
          body: t('confirmWizardRerunBody'),
          onCancel: function() { closeWizardModal(); },
          onConfirm: function() { proceedFinishSetupWizard(); }
        });
        return;
      }
      proceedFinishSetupWizard();
    };

    function proceedFinishSetupWizard() {
      const earnerName = document.getElementById('wiz-earner-name').value.trim() || t('earnerNewName');
      const earnerAge = parseFloat(document.getElementById('wiz-earner-age').value) || 35;
      const earnerRegime = document.getElementById('wiz-earner-regime').value || getJurisdictionRegimes(wizardSelectedCountry).options[0];
      const earnerGross = parseFloat(document.getElementById('wiz-earner-gross').value) || 12000;
      // Gross is often harder to know off the top of your head than net (what actually
      // lands in the account each month) — same manualNetOverride/realNetSalary
      // mechanism already used on the Cash Flow tab's Earners card, so a wizard-created
      // earner behaves identically to one set up that way later.
      const earnerKnowsNet = !!(document.getElementById('wiz-earner-know-net') && document.getElementById('wiz-earner-know-net').checked);
      const earnerNet = parseFloat(document.getElementById('wiz-earner-net').value) || 0;

      // Optional second earner: most households this app models are couples, but the
      // wizard previously only ever asked about one income.
      const hasPartner = !!(document.getElementById('wiz-has-partner') && document.getElementById('wiz-has-partner').checked);
      const partnerName = hasPartner ? (document.getElementById('wiz-partner-name').value.trim() || t('earnerNewName')) : '';
      const partnerAge = hasPartner ? (parseFloat(document.getElementById('wiz-partner-age').value) || 35) : 0;
      const partnerRegime = hasPartner ? (document.getElementById('wiz-partner-regime').value || getJurisdictionRegimes(wizardSelectedCountry).options[0]) : '';
      const partnerGross = hasPartner ? (parseFloat(document.getElementById('wiz-partner-gross').value) || 0) : 0;
      const partnerKnowsNet = hasPartner && !!(document.getElementById('wiz-partner-know-net') && document.getElementById('wiz-partner-know-net').checked);
      const partnerNet = hasPartner ? (parseFloat(document.getElementById('wiz-partner-net').value) || 0) : 0;

      // Two buckets instead of one lump sum: enough for a genuinely useful starting
      // allocation (the Score's hedge component, the Withdrawal tab's rebalancing card,
      // and the freedom-date projection all already distinguish risky from safe money)
      // without asking a first-time user to classify each individual holding — that
      // level of detail is for later, on the Balance Sheet.
      const safeCapital = parseFloat(document.getElementById('wiz-safe-capital').value) || 0;
      const riskyCapital = parseFloat(document.getElementById('wiz-risky-capital').value) || 0;
      const monthlyInvest = parseFloat(document.getElementById('wiz-monthly-invest').value) || 0;

      // Debt was previously never asked at all, silently defaulting to zero — meaning
      // the Score's debt component and the high-cost-debt banner would show a falsely
      // perfect "no debt" result for anyone who actually has some.
      const debtRevolving = parseFloat(document.getElementById('wiz-debt-revolving').value) || 0;
      const debtInstallments = parseFloat(document.getElementById('wiz-debt-installments').value) || 0;

      const housingOutflow = parseFloat(document.getElementById('wiz-outflow-housing').value) || 0;
      const groceriesOutflow = parseFloat(document.getElementById('wiz-outflow-groceries').value) || 0;
      const transportOutflow = parseFloat(document.getElementById('wiz-outflow-transport').value) || 0;
      const utilitiesOutflow = parseFloat(document.getElementById('wiz-outflow-utilities').value) || 0;

      const prevLanguage = state.language;
      const prevLanguageChosen = Boolean(state.languageUserChosen);
      state = JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE));
      state.country = wizardSelectedCountry;
      // BUGFIX: this used to just set state.baseCurrency directly and leave
      // state.fxRates as whatever DEFAULT_BLANK_STATE happened to ship with
      // (BRL-oriented: USD 5.65, EUR 6.15) — so a Spain/Portugal profile ended
      // up with EUR as the base currency but reais-based conversion rates,
      // meaning a $10,000 ETF was counted as roughly €10,000 instead of ~€9,200.
      // applyBaseCurrencyChange always re-derives fxRates from the presets for
      // whichever currency is actually being set.
      const wizGlCurrencyEl = document.getElementById('wiz-gl-currency');
      const wizGlCurrency = wizGlCurrencyEl && SAN_BASE_CURRENCIES.includes(wizGlCurrencyEl.value) ? wizGlCurrencyEl.value : 'USD';
      applyBaseCurrencyChange(wizardSelectedCountry === 'BR' ? 'BRL' : (wizardSelectedCountry === 'GL' ? wizGlCurrency : 'EUR'));
      if (prevLanguageChosen) {
        state.language = prevLanguage;
        state.languageUserChosen = true;
      } else {
        state.language = getCountryDefaultLanguage(wizardSelectedCountry);
      }
      state.inflationRate = getDefaultInflation(wizardSelectedCountry);
      state.wizardCompleted = true;

      // BUGFIX (found by the master audit): this object was missing pjCompanyType and
      // proLaborePct, two fields addEarner() (ui/earners.js, the Balance Sheet's own
      // "add earner" path) always sets. Both degrade gracefully where they're read
      // (proLaborePct has its own fallback to the same default, 28, in
      // tax/brazil.js \u2014 confirmed no calculation difference either way; pjCompanyType
      // falls back to showing "custom" in the dropdown) so this was never a wrong-number
      // bug, just a less informative starting preset than a Balance-Sheet-created PJ
      // earner gets. Matched for consistency between the two earner-creation paths.
      const pjDefaults = { pjCompanyType: wizardSelectedCountry === 'BR' ? 'simples3' : 'custom', proLaborePct: 28, has13thSalary: false, annualBonus: 0 };
      state.earners.push({
        id: Date.now(),
        name: earnerName,
        role: '',   // empty on purpose: shown as a translated "Member" (see displayRole)
        age: earnerAge,
        regime: earnerRegime,
        grossMonthly: earnerKnowsNet ? 0 : earnerGross,
        hasHealth: true,
        foodVoucher: 0,
        pjTaxRate: getJurisdictionRegimes(wizardSelectedCountry).contractorTaxDefault,
        ...pjDefaults,
        manualNetOverride: earnerKnowsNet,
        realNetSalary: earnerKnowsNet ? earnerNet : 0
      });
      if (hasPartner) {
        state.earners.push({
          id: Date.now() + 10,
          name: partnerName,
          role: '',
          age: partnerAge,
          regime: partnerRegime,
          grossMonthly: partnerKnowsNet ? 0 : partnerGross,
          hasHealth: true,
          foodVoucher: 0,
          pjTaxRate: getJurisdictionRegimes(wizardSelectedCountry).contractorTaxDefault,
          ...pjDefaults,
          manualNetOverride: partnerKnowsNet,
          realNetSalary: partnerKnowsNet ? partnerNet : 0
        });
      }

      if (safeCapital > 0) {
        state.liquidInvestments.push({
          id: Date.now() + 1,
          name: t('wizSafeInvestmentName'),
          currency: state.baseCurrency,
          balanceOriginal: safeCapital,
          annualYieldPct: getDefaultYield(wizardSelectedCountry),
          liquidityTier: 'same_day',
          volatilityTier: 'low',
          isEmergencyReserve: true
        });
      }
      if (riskyCapital > 0) {
        state.liquidInvestments.push({
          id: Date.now() + 2,
          name: t('wizRiskyInvestmentName'),
          currency: state.baseCurrency,
          balanceOriginal: riskyCapital,
          annualYieldPct: getDefaultRiskyYield(wizardSelectedCountry),
          liquidityTier: 'short',
          volatilityTier: 'high',
          isEmergencyReserve: false
        });
      }

      state.debts.revolving = debtRevolving;
      state.debts.parcelas = debtInstallments;

      state.monthlyInvestment = monthlyInvest;
      state.outflows.housing = housingOutflow;
      state.outflows.groceries = groceriesOutflow;
      state.outflows.transport = transportOutflow;
      state.outflows.utilities = utilitiesOutflow;

      // BUGFIX: these three setVal calls (plus the syncFormInputsFromState right
      // after) push the new state into the visible input fields. The old code
      // then called handleDataUpdate(), which reads those SAME fields straight
      // back into state (readInputsIntoState) before rendering — harmless only
      // as long as every synced field is read back unchanged, which made the
      // whole thing depend on the two functions staying in exact lockstep.
      // Calling updateUI() + saveState() directly removes that dependency
      // entirely: state is simply never re-derived from the DOM here.
      setVal('input-outflow-housing', housingOutflow);
      setVal('input-outflow-groceries', groceriesOutflow);
      setVal('input-outflow-transport', transportOutflow);
      setVal('input-outflow-utilities', utilitiesOutflow);
      setVal('input-monthly-investment', monthlyInvest);
      syncFormInputsFromState();

      closeWizardModal();
      syncHeaderCountry();
      syncBaseCurrencyButtons();
      applyTranslations();
      updateUI();
      saveState();

      const m = calculateMetrics();
      const now = new Date();
      state.monthlySnapshots.push({
        id: Date.now() + 2,
        date: now.toISOString().slice(0, 10),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        label: t('snapshotInitialLabel'),
        netWorth: Math.round(m.netWorth),
        liquidInvestments: Math.round(m.totalLiquidBase),
        totalDebts: Math.round(m.totalDebts),
        totalAssets: Math.round(m.totalAssets),
        savingsRate: parseFloat(m.savingsRate.toFixed(1))
      });
      updateUI();
      saveState();
    }

