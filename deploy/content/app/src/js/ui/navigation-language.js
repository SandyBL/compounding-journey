    window.switchTab = function(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
      const activeView = document.getElementById(tabId);
      if (activeView) activeView.classList.remove('hidden');

      // BUGFIX (found by the UI/UX audit): this used to set a single fixed className
      // string on every .tab-btn, which overwrote the tab-grouping divider
      // (border-l, marked with data-group-start in the HTML) the very first time any
      // tab was clicked — meaning the visual grouping that matches this file's own
      // "snapshot / day-to-day money / planning" comments was only ever visible for
      // the first few seconds of a session, before disappearing permanently.
      document.querySelectorAll('.tab-btn').forEach(el => {
        const divider = el.dataset && el.dataset.groupStart === 'true' ? ' border-l border-slate-700/60' : '';
        el.className = "tab-btn w-full px-1 py-1.5 rounded-xl font-semibold transition flex items-center justify-center gap-1 bg-slate-900 text-slate-300 hover:text-white truncate" + divider;
      });

      const mobileSelect = document.getElementById('mobile-nav-select');
      if (mobileSelect) mobileSelect.value = tabId;

      const activeBtn = document.getElementById(`btn-tab-${tabId.replace('view-', '')}`);
      if (activeBtn) {
        activeBtn.className = "tab-btn w-full px-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1 bg-gold-500 text-slate-950 truncate";
      }

      if (tabId === 'view-evolution') renderCheckinView();
      if (tabId === 'view-retirement') { renderRetirementChart(calculateMetrics()); renderWithdrawalPhase(); }
      if (tabId === 'view-whatif') renderWhatIf();
      if (tabId === 'view-events') renderLifeEvents();
      if (tabId === 'view-balancesheet') { renderDebtPlanner(); renderMortgageCard(); }
    };

    // BUGFIX: finishing the wizard or switching fiscal country used to force
    // the language (pt for BR/PT, es for ES), so an English speaker living in
    // Spain was silently switched to Spanish. A language is now only derived
    // from the country when the person never picked one: languageUserChosen
    // is set by an explicit click on the language buttons. Even then, a
    // browser that explicitly reports English keeps English rather than being
    // pushed to the country's language.
    function getCountryDefaultLanguage(country) {
      try {
        const raw = (navigator.language || '').toLowerCase();
        if (raw.startsWith('en')) return 'en';
      } catch (e) { /* fall through to the country default */ }
      if (country === 'GL') return detectBrowserLanguage();
      return country === 'ES' ? 'es' : 'pt';
    }

    window.setLanguage = function(lang) {
      state.language = lang;
      state.languageUserChosen = true;
      applyTranslations();
      updateUI();
      saveState();
    };

    window.applyTranslations = function() {
      const lang = state.language || 'pt';

      ['pt', 'es', 'en'].forEach(l => {
        const btn = document.getElementById(`btn-lang-${l}`);
        if (btn) {
          if (l === lang) {
            btn.className = "px-2 py-1 rounded-lg text-[11px] font-bold transition bg-teal-500 text-slate-950";
          } else {
            btn.className = "px-2 py-1 rounded-lg text-[11px] font-bold transition text-slate-300 hover:text-white";
          }
        }
      });

      setText('lbl-disclaimer-text', t('disclaimer'));
      setText('lbl-header-subtitle', t('headerSubtitle'));
      const profileBtn = document.getElementById('header-jurisdiction');
      if (profileBtn && profileBtn.parentElement) profileBtn.parentElement.title = t('hdrProfileTooltip');
      const lockBtn = document.getElementById('btn-header-lock');
      if (lockBtn) lockBtn.title = t('secLockNowBtn');

      // BUGFIX: these were static Portuguese text ("Espanha (EUR)", etc.)
      // regardless of the selected language, so Spanish-language users saw the
      // Portuguese spelling of Spain's name. Re-derive them per language here,
      // same as every other translated label.
      ['br', 'es', 'gl'].forEach(code => {
        // The Global BUTTON is just "Global" (it has no fixed currency);
        // only the header and print page append the chosen base currency.
        const label = code === 'gl'
          ? (COUNTRY_NAMES_BY_LANG[lang] || COUNTRY_NAMES_BY_LANG.pt).GL
          : getCountryDisplayName(code.toUpperCase());
        setText(`lbl-country-name-${code}`, label);
        setText(`lbl-wiz-country-name-${code}`, label);
      });

      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key && t(key)) el.innerText = t(key);
      });

      const snapInput = document.getElementById('input-new-snapshot-label');
      if (snapInput) snapInput.placeholder = t('snapshotPlaceholder');

      // The mobile tab dropdown is a <select>, so its options are translated here.
      [['overview', '📊', 'navOverview'], ['evolution', '📈', 'navEvolution'], ['balancesheet', '🏛️', 'navBalance'],
       ['cashflow', '💸', 'navCashflow'], ['budget', '📋', 'navBudget'], ['retirement', '🎯', 'navRetirement'], ['whatif', '🧪', 'navWhatIf'], ['events', '🗓️', 'navEvents'],
       ['taxes', '📑', 'navTaxes'], ['inheritance', '⚖️', 'navInheritance'], ['goals', '🏁', 'navGoals']]
        .forEach(([id, emoji, key]) => setText(`mopt-${id}`, `${emoji} ${t(key)}`));
      if (typeof refreshWizardRegimeOptions === 'function') refreshWizardRegimeOptions();

      // Attributes that need translating too (tooltips and placeholders).
      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key && t(key)) el.title = t(key);
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key && t(key)) el.placeholder = t(key);
      });
    };

