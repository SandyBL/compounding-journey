    /* Explicitly set and persist display/base currency across reloads */
    // BUGFIX (architecture change): this used to also set state.baseCurrency and
    // reset state.fxRates, which meant the header's currency buttons — one tap
    // away, no confirmation — silently changed the household's real accounting
    // currency. Two concrete failures came from that: (1) a Spanish user's
    // wizard-created profile kept the blank profile's BRL-oriented fxRates
    // because nothing re-derived them for the new base at the moment it was set,
    // so a $10,000 ETF was counted as €10,000 (rate ~1) instead of ~€9,200; (2)
    // clicking a header currency button just relabeled every total with the new
    // symbol at whatever stale rate happened to be sitting in state.fxRates —
    // e.g. R$1,200,000 became "€1,200,000" if the EUR rate was stuck near 1,
    // about 6x too high. The real accounting currency now only ever changes via
    // the Profile modal / wizard (setProfileCountry / finishSetupWizard, via
    // applyBaseCurrencyChange), with a confirmation before it touches an
    // existing profile. This function is now purely a VIEW toggle: it changes
    // what currency figures are displayed in (via convertBaseToDisplay/fmt), and
    // never touches state.baseCurrency, state.fxRates, or any per-item currency
    // tag — so it can never corrupt the actual numbers, only how they're shown.
    window.setDisplayCurrency = function(curr) {
      state.displayCurrency = curr;
      syncBaseCurrencyButtons();
      updateUI();
      saveState();
    };

    function syncBaseCurrencyButtons() {
      const curr = state.displayCurrency || state.baseCurrency || 'BRL';
      ['BRL', 'EUR', 'USD'].forEach(c => {
        const btn = document.getElementById(`btn-curr-${c}`);
        if (btn) {
          if (c === curr) {
            btn.className = "px-2 py-1 rounded-lg text-[11px] font-bold transition bg-sky-500 text-slate-950";
          } else {
            btn.className = "px-2 py-1 rounded-lg text-[11px] font-bold transition text-slate-400 hover:text-sky-200";
          }
        }
      });
    }

    window.openProfileModal = function() {
      document.getElementById('modal-profile').classList.remove('hidden');
      syncHouseholdModeButtons();
      renderSecuritySettings();
    };

    window.closeProfileModal = function() {
      document.getElementById('modal-profile').classList.add('hidden');
    };

    window.syncHeaderCountry = function() {
      const c = state.country || 'BR';
      const flags = {
        BR: '🇧🇷',
        ES: '🇪🇸',
        GL: '🌐'
      };

      setText('header-jurisdiction', getCountryDisplayName(c));
      setText('header-flag', flags[c] || '🌐');

      const glBaseRow = document.getElementById('row-gl-base-currency');
      if (glBaseRow) glBaseRow.classList.toggle('hidden', c !== 'GL');
      const glBaseSel = document.getElementById('input-gl-base-currency');
      if (glBaseSel) glBaseSel.value = state.baseCurrency || 'USD';

      ['br', 'es', 'gl'].forEach(key => {
        const btn = document.getElementById(`btn-country-${key}`);
        if (btn) {
          if (key === c.toLowerCase()) {
            btn.className = "p-3 rounded-xl border border-teal-500 bg-teal-500/10 font-bold text-white text-left flex flex-col items-center justify-center gap-1.5";
          } else {
            btn.className = "p-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 font-semibold text-slate-300 text-left flex flex-col items-center justify-center gap-1.5";
          }
        }
      });
    };

    window.setGlobalBaseCurrency = function(cur) {
      if (!SAN_BASE_CURRENCIES.includes(cur) || cur === state.baseCurrency) return;
      const apply = function() {
        applyBaseCurrencyChange(cur);
        syncHeaderCountry();
        syncBaseCurrencyButtons();
        syncFormInputsFromState();
        updateUI();
        saveState();
      };
      if (state.wizardCompleted) {
        showConfirmModal({
          title: t('confirmBaseCurrencyChangeTitle'),
          body: t('confirmBaseCurrencyChangeBody'),
          onCancel: function() { syncHeaderCountry(); },
          onConfirm: apply
        });
        return;
      }
      apply();
    };

    window.setProfileCountry = function(c) {
      if (c === state.country) {
        closeProfileModal();
        return; // no actual change — nothing to warn about or reset
      }

      // BUGFIX: changing fiscal residence resets the base currency, FX rates,
      // and payroll/tax-regime assumptions everywhere in the app, but this used
      // to happen with zero warning — one tap in the Profile modal. Only warn
      // when there's an existing completed profile actually at risk (mirrors
      // the same wizard-rerun guard elsewhere); a brand-new user picking their
      // country for the first time shouldn't be nagged about losing data that
      // doesn't exist yet.
      if (state.wizardCompleted) {
        showConfirmModal({
          title: t('confirmCountryChangeTitle'),
          body: t('confirmCountryChangeBody'),
          onConfirm: function() { proceedSetProfileCountry(c); }
        });
        return;
      }
      proceedSetProfileCountry(c);
    };

    function proceedSetProfileCountry(c) {
      // Only auto-adjust inflation if the current value still matches the OLD
      // country's default — i.e. the user hasn't deliberately customized it.
      // This keeps the feature helpful (fixes the stale-default problem) without
      // silently overwriting a rate someone intentionally set.
      const inflationWasDefault = Number(state.inflationRate) === getDefaultInflation(state.country);

      state.country = c;
      if (c === 'ES') {
        applyBaseCurrencyChange('EUR');
      } else if (c === 'BR') {
        applyBaseCurrencyChange('BRL');
      } else if (c === 'GL') {
        applyBaseCurrencyChange('USD');
      }
      // Only derive a language from the country when the person never picked one.
      if (!state.languageUserChosen) {
        state.language = getCountryDefaultLanguage(c);
      }

      if (inflationWasDefault) {
        state.inflationRate = getDefaultInflation(c);
      }

      syncHeaderCountry();
      syncBaseCurrencyButtons();
      applyTranslations();
      syncFormInputsFromState();
      // BUGFIX: this used to call handleDataUpdate(), which re-reads the
      // on-screen input fields (readInputsIntoState) before rendering — the
      // same stale-DOM risk fixed elsewhere. syncFormInputsFromState (above)
      // already pushed the new state into those fields, so state should never
      // be re-derived from the DOM here; updateUI() + saveState() is enough.
      updateUI();
      saveState();
      closeProfileModal();
    }

