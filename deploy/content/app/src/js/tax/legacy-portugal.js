    // Portugal: progressive IRS applied to GROSS remuneration directly (not
    // gross-minus-SS), matching how Portugal's own official monthly
    // withholding tables work. Derived from the 2026 annual IRS scale
    // (12.5/15.7/21.2/24.1/31.1/34.9/43.1/44.6/48% at annual
    // €8,342/12,587/17,838/23,089/29,397/43,090/46,566/86,634), converted to
    // monthly. Single-filer approximation — the real tables vary by marital
    // status and dependents, which this simulator doesn't model.
    // Kept ONLY to convert saved Portuguese profiles into Global ones without
    // changing their take-home pay (see migrateAndSanitizeState).
    function legacyPortugalIRS(gross) {
      const g = Math.max(0, Number(gross) || 0);
      let irs = 0;
      if (g > 7219.5) irs = (g * 0.48) - 948.94;
      else if (g > 3880.5) irs = (g * 0.446) - 703.48;
      else if (g > 3590.83) irs = (g * 0.431) - 645.10;
      else if (g > 2449.75) irs = (g * 0.349) - 350.82;
      else if (g > 1924.08) irs = (g * 0.311) - 257.73;
      else if (g > 1486.5) irs = (g * 0.241) - 123.04;
      else if (g > 1048.92) irs = (g * 0.212) - 79.94;
      else if (g > 695.17) irs = (g * 0.157) - 22.25;
      else irs = g * 0.125;
      return Math.max(0, irs);
    }

