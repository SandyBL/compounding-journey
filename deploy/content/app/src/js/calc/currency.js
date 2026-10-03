    // The ONE place that actually changes the base currency (the household's
    // real accounting currency — tied to fiscal residence). Always re-derives
    // fxRates from scratch for the new base rather than trusting whatever was
    // there before (see the wizard/header bugs this was written to fix), and
    // never stamps fxLastUpdated with a fake "just confirmed" date — the
    // presets are illustrative starting points until the user actually reviews
    // them (refreshFxTimestamp/updateFxRate are what legitimately set that date).
    function applyBaseCurrencyChange(newBase) {
      state.baseCurrency = newBase;
      state.displayCurrency = newBase;
      state.fxRates = Object.assign({}, DEFAULT_FX_PRESETS[newBase] || DEFAULT_FX_PRESETS.BRL);
      state.fxRatesBaseCurrency = newBase;
      state.fxLastUpdated = null;
    }

    function convertToBase(amount, fromCurr) {
      const amt = Number(amount) || 0;
      const base = state.baseCurrency || 'BRL';
      const from = fromCurr || base;
      if (from === base) return amt;

      const rate = state.fxRates && Number(state.fxRates[from]) ? Number(state.fxRates[from]) : (DEFAULT_FX_PRESETS[base]?.[from] || 1);
      return amt * rate;
    }

    // Pure "translate what's on screen" helper — separate from convertToBase
    // (which converts a per-item balance FROM its own currency INTO the true
    // accounting base, and feeds every calculation). This one takes an
    // ALREADY-computed base-currency figure and re-expresses it in whatever the
    // person has chosen to VIEW the app in (state.displayCurrency), purely for
    // rendering — it never changes state.baseCurrency, never touches per-item
    // currency tags, and never feeds back into any calculation. Reuses the same
    // rate the base-currency FX panel shows/lets the user edit (state.fxRates),
    // so the header toggle and the FX panel always agree with each other.
    function convertBaseToDisplay(amountInBase) {
      const amt = Number(amountInBase) || 0;
      const dispCurr = state.displayCurrency || state.baseCurrency || 'BRL';
      const baseCurr = state.baseCurrency || 'BRL';
      if (dispCurr === baseCurr) return amt;

      const rate = state.fxRates && Number(state.fxRates[dispCurr])
        ? Number(state.fxRates[dispCurr])
        : (DEFAULT_FX_PRESETS[baseCurr]?.[dispCurr] || 1);
      // `rate` is "how many `baseCurr` units per 1 `dispCurr` unit" (the same
      // convention convertToBase uses) — going the other way means dividing.
      return rate > 0 ? amt / rate : amt;
    }

    function fmt(val, currencyOverride) {
      const v = Number(val) || 0;
      // A currencyOverride means "format this exact number as this exact
      // currency" (e.g. showing an investment's own native balance) — that
      // value is NOT a base-currency figure, so it must never go through the
      // base→display conversion below.
      const displayVal = currencyOverride ? v : convertBaseToDisplay(v);
      const curr = currencyOverride || state.displayCurrency || state.baseCurrency || 'BRL';
      const rounded = Math.round(displayVal);

      switch (curr) {
        case 'USD':
          return '$ ' + rounded.toLocaleString('en-US');
        case 'EUR':
          return '€ ' + rounded.toLocaleString('de-DE');
        case 'GBP':
          return '£ ' + rounded.toLocaleString('en-GB');
        case 'BRL':
        default:
          return 'R$ ' + rounded.toLocaleString('pt-BR');
      }
    }

    function setText(id, text) {
      const el = document.getElementById(id);
      if (el) el.innerText = text;
    }

    function getVal(id) {
      const el = document.getElementById(id);
      return el ? (parseFloat(el.value) || 0) : 0;
    }

    function setVal(id, v) {
      const el = document.getElementById(id);
      if (el) el.value = v;
    }

