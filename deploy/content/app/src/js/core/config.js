    /* Exchange Rate Presets (1 Foreign Unit = X Base Units) */
    // Illustrative starting FX rates — verified against live mid-market data
    // as of October 2, 2026 (USD/BRL ~5.22, EUR/BRL ~5.87, GBP/BRL ~6.87;
    // the previous set, from early September, had USD/BRL at 5.15 and
    // EUR/BRL at 5.90 — USD had drifted up about 1.4%, EUR down about 0.5%
    // since then). This app has no backend and no live internet access once
    // it's running (a self-contained static page), so these numbers can only
    // ever be a periodically-refreshed starting point, not a live feed —
    // state.fxRates is what's actually used for accounting once the user has
    // reviewed/edited them (see refreshFxTimestamp), and rates will keep
    // drifting from whatever is hardcoded here. There's no substitute for the
    // user periodically checking real quotes themselves.
    const DEFAULT_FX_PRESETS = {
      BRL: { USD: 5.22, EUR: 5.87, GBP: 6.87 },
      EUR: { USD: 0.89, BRL: 0.17, GBP: 1.17 },
      USD: { EUR: 1.12, BRL: 0.19, GBP: 1.32 }
    };

    // Detects a first-time visitor's language from the browser, since this app
    // previously always defaulted brand-new profiles to Portuguese regardless of
    // the visitor's actual language. Only ever used as a FIRST-VISIT default
    // (see DEFAULT_BLANK_STATE and initApp's fallback below) — it never
    // overrides a language the person has explicitly chosen (via the header
    // buttons or the wizard), since state.language is saved and always wins
    // once it's set to something.
    function detectBrowserLanguage() {
      try {
        const raw = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
        if (raw.startsWith('es')) return 'es';
        if (raw.startsWith('pt')) return 'pt';
        // Any other browser language (de, fr, it, ja, etc.) falls back to
        // English rather than Portuguese — English is the more neutral,
        // widely-understood default for visitors outside the pt/es-speaking
        // markets this app's tax/payroll logic is actually built for.
        return 'en';
      } catch (e) {
        return 'pt'; // navigator unavailable for some reason — keep the old safe default
      }
    }

