    function saveState() {
      try {
        localStorage.setItem('family_balance_sheet_state', JSON.stringify(state));
      } catch (e) {
        console.warn('Could not save state to localStorage', e);
      }
    }

    function loadState() {
      try {
        const saved = localStorage.getItem('family_balance_sheet_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          state = migrateAndSanitizeState(parsed);
        } else {
          state = JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE));
          setTimeout(() => {
            openWizardModal();
          }, 350);
        }
      } catch (e) {
        console.warn('Could not load state from localStorage', e);
        state = JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE));
      }
    }

    function initApp() {
      loadState();
      if (!state.language) {
        // Defensive fallback for a legacy/corrupted saved state missing this
        // field entirely — a real signal from the browser beats guessing from
        // country (a Brazilian's browser could easily be set to English).
        state.language = detectBrowserLanguage();
      }
      // BUGFIX: this used to force state.baseCurrency = state.displayCurrency
      // (and vice versa) on every load, treating them as always-identical.
      // That's exactly the coupling the display-currency fix above removes —
      // left in place here, it would silently re-merge the two again on the
      // very next page reload. baseCurrency (the real accounting currency) and
      // displayCurrency (a pure view preference) are now independent: each only
      // gets a default when it's actually missing, and neither overwrites the
      // other.
      if (!state.baseCurrency) {
        state.baseCurrency = state.country === 'BR' ? 'BRL' : (state.country === 'GL' ? 'USD' : 'EUR');
      }
      if (!state.displayCurrency) {
        state.displayCurrency = state.baseCurrency;
      }
      if (!state.fxRates || state.fxRatesBaseCurrency !== state.baseCurrency) {
        state.fxRates = Object.assign({}, DEFAULT_FX_PRESETS[state.baseCurrency] || DEFAULT_FX_PRESETS.BRL);
        state.fxRatesBaseCurrency = state.baseCurrency;
        // Not touching fxLastUpdated here — this is a load-time repair of a
        // missing/mismatched cache, not the user actually confirming a rate.
      }
      syncHeaderCountry();
      syncBaseCurrencyButtons();
      syncHouseholdModeButtons();
      applyTranslations();
      // PIN/biometric lock (ui/security.js): state is now fully loaded, but the final
      // render is held back until unlockApp() runs it — unlockApp() itself only calls
      // syncFormInputsFromState()/updateUI(), not this whole function, so those two calls
      // must stay out of the pinEnabled branch here or the data would render once locked
      // AND again on unlock.
      if (secState().pinEnabled) {
        showLockScreen();
        startInactivityWatch();
      } else {
        syncFormInputsFromState();
        updateUI();
      }
    }

    window.onload = function() {
      initApp();
      registerPWA();
    };
