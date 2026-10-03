    window.openWizardModal = function() {
      const modal = document.getElementById('modal-wizard');
      if (modal) modal.classList.remove('hidden');
      goToWizardStep(1);
      // BUGFIX: found while testing the gross/net income toggle — none of the wizard's
      // own show/hide checkboxes (has-partner, know-net x2) were ever reset when the
      // wizard is reopened (e.g. re-running it from the header button, or opening it,
      // cancelling, and starting again). For a plain number field this is a minor,
      // already-accepted staleness (you just see last time's number and can overwrite
      // it) — but for a checkbox that HIDES a whole field, it's worse: a fresh session
      // could silently hide the field the person is trying to fill in and quietly reuse
      // a stale value from a previous run instead. Always start a freshly opened wizard
      // in the default, everything-visible state.
      ['wiz-has-partner', 'wiz-earner-know-net', 'wiz-partner-know-net'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = false;
      });
      const partnerFields = document.getElementById('wizard-partner-fields');
      if (partnerFields) partnerFields.classList.add('hidden');
      ['earner', 'partner'].forEach(who => {
        const grossRow = document.getElementById(`wiz-${who}-gross-row`);
        const netRow = document.getElementById(`wiz-${who}-net-row`);
        if (grossRow) grossRow.classList.remove('hidden');
        if (netRow) netRow.classList.add('hidden');
      });
    };

    window.closeWizardModal = function() {
      const modal = document.getElementById('modal-wizard');
      if (modal) modal.classList.add('hidden');
    };

    window.goToWizardStep = function(stepNum) {
      ['wizard-step-1', 'wizard-step-2', 'wizard-step-3', 'wizard-step-4'].forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) {
          if (idx + 1 === stepNum) el.classList.remove('hidden');
          else el.classList.add('hidden');
        }
      });
    };

    window.setWizardCountry = function(c) {
      wizardSelectedCountry = c;
      const wizGlRow = document.getElementById('wiz-gl-currency-row');
      if (wizGlRow) wizGlRow.classList.toggle('hidden', c !== 'GL');
      ['br', 'es', 'gl'].forEach(k => {
        const btn = document.getElementById(`wiz-btn-${k}`);
        if (btn) {
          if (k === c.toLowerCase()) {
            btn.className = "p-2.5 rounded-xl border border-teal-500 bg-teal-500/10 text-white font-bold text-center";
          } else {
            btn.className = "p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 font-semibold text-center";
          }
        }
      });

      refreshWizardRegimeOptions();
    };

    // Shows/hides the optional second earner's fields. Off by default (a single earner
    // is just as common a household shape); toggling on asks for the same 4 fields again.
    window.toggleWizardPartner = function() {
      const checked = document.getElementById('wiz-has-partner').checked;
      const row = document.getElementById('wizard-partner-fields');
      if (row) row.classList.toggle('hidden', !checked);
    };

    // Switches between asking for gross or net monthly income — gross is often harder
    // to know off the top of your head than net (what actually lands in the account
    // each month). `who` is 'earner' or 'partner'.
    window.toggleWizardIncomeMode = function(who) {
      const knowsNet = document.getElementById(`wiz-${who}-know-net`).checked;
      const grossRow = document.getElementById(`wiz-${who}-gross-row`);
      const netRow = document.getElementById(`wiz-${who}-net-row`);
      if (grossRow) grossRow.classList.toggle('hidden', knowsNet);
      if (netRow) netRow.classList.toggle('hidden', !knowsNet);
    };

    // The work-type dropdown depends on the chosen country AND the display
    // language, so it is rebuilt whenever either changes. Covers BOTH the primary
    // earner's dropdown and the optional second earner's, so a country picked in
    // Step 1 is reflected correctly for whichever earner fields are actually shown.
    function refreshWizardRegimeOptions() {
      const c = wizardSelectedCountry;
      const opt = (v, k) => `<option value="${v}">${escapeHtml(t(k))}</option>`;
      let optionsHtml;
      if (c === 'ES') optionsHtml = opt('Cuenta Ajena', 'wizRegimeEsEmp') + opt('Autónomo', 'wizRegimeEsSelf');
      else if (c === 'GL') optionsHtml = opt('Employee', 'regimeGlEmployee') + opt('Self-employed', 'regimeGlSelfEmployed');
      else optionsHtml = opt('CLT', 'wizRegimeClt') + opt('PJ', 'wizRegimePj');
      ['wiz-earner-regime', 'wiz-partner-regime'].forEach(id => {
        const regimeSelect = document.getElementById(id);
        if (!regimeSelect) return;
        const keep = regimeSelect.value;
        regimeSelect.innerHTML = optionsHtml;
        const opts = regimeSelect.options ? Array.from(regimeSelect.options) : [];
        if (opts.some(o => o.value === keep)) regimeSelect.value = keep;
      });
    }

    window.loadExampleFromWizard = function() {
      closeWizardModal();
      confirmLoadExampleData();
    };

    // The example profile is stored in Portuguese; show its names in the display language.
    function localizeDemoState(st) {
      const setName = (arr, id, key) => { const it = (arr || []).find(x => x.id === id); if (it) it.name = t(key); };
      setName(st.realEstate, 1, 'demoHome');
      setName(st.liquidInvestments, 101, 'demoLiq101');
      setName(st.liquidInvestments, 102, 'demoLiq102');
      setName(st.liquidInvestments, 104, 'demoLiq104');
      setName(st.liquidInvestments, 105, 'demoLiq105');
      setName(st.liquidInvestments, 106, 'demoLiq106');
      setName(st.goals, 301, 'demoGoal301');
      setName(st.goals, 302, 'demoGoal302');
      setName(st.lifeEvents, 401, 'demoEvent401');
      setName(st.lifeEvents, 402, 'demoEvent402');
      (st.earners || []).forEach((e, i) => { if (i < 2) e.role = t(i === 0 ? 'demoRole1' : 'demoRole2'); });
      const snapKey = { 'Marco Inicial': 'snapshotInitialLabel', 'Aporte de Meio de Ano': 'demoSnap2', 'Rebalanceamento Global': 'demoSnap3' };
      (st.monthlySnapshots || []).forEach(sn => { if (snapKey[sn.label]) sn.label = t(snapKey[sn.label]); });
    }

    window.confirmLoadExampleData = function() {
      // BUGFIX: this was one tap away from the header and replaced all data with
      // zero confirmation. It also used to call handleDataUpdate(), which reads
      // the on-screen input fields (readInputsIntoState) BEFORE re-rendering —
      // those fields still held whatever the previous profile's values were, so
      // the example loaded with the old debts/outflows/monthly investment
      // silently mixed in instead of the example's own numbers. Calling
      // updateUI() + saveState() directly (after syncFormInputsFromState, which
      // pushes the new state's own values into those same fields) avoids ever
      // reading the stale DOM back into the new state.
      showConfirmModal({
        title: t('confirmLoadExampleTitle'),
        body: t('confirmLoadExampleBody'),
        onConfirm: function() {
          const preservedLanguage = state.language;
          const preservedLanguageChosen = Boolean(state.languageUserChosen);
          state = JSON.parse(JSON.stringify(EXAMPLE_DEMO_STATE));
          // Loading the demo data shouldn't silently switch the UI language back to
          // the example's own hardcoded Portuguese if the person had already chosen
          // something else — the numbers are demo data, but the language is a
          // standing preference.
          if (preservedLanguage) { state.language = preservedLanguage; state.languageUserChosen = preservedLanguageChosen; }
          localizeDemoState(state);
          syncHeaderCountry();
          syncBaseCurrencyButtons();
          applyTranslations();
          syncFormInputsFromState();
          updateUI();
          saveState();
        }
      });
    };

    // ---- Backup: Export / Import (JSON) ----
    // Data lives only in this browser's localStorage (see saveState/loadState),
    // with no server-side account behind it. Without an export/import path, a
    // cleared browser, a new device, or a different browser is unrecoverable
    // data loss for a family's entire financial picture. These two functions,
    // plus the reminder banner below, are the fix.

