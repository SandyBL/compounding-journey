    // Spain: employee Social Security contributions (Régimen General), which are
    // deducted from pay BEFORE the IRPF base is computed.
    // Update this block once a year from the annual "Orden de cotización"
    // (2026: Orden PJC/297/2026, BOE-A-2026-7296):
    //   contingencias comunes 4.70% + desempleo 1.55% + formación profesional 0.10%
    //   + MEI 0.15% (rises every year)                                     = 6.50%
    //   Fixed-term contracts pay 1.60% unemployment instead of 1.55%       = 6.55%
    //   Contributions stop at the maximum monthly base (EUR 5,101.20 in 2026): pay above
    //   it is not charged the rates above (it is not a cap on income).
    // (The 6.47% used before was the 2024 figure, when the MEI was 0.12%.)
    // Not modeled: the small extra "cuota de solidaridad" charged on pay ABOVE the
    // maximum base, and the minimum base (EUR 1,424.40 for groups 4-7), which only
    // matters around the minimum wage.
    // The earner's "gross monthly" is read as the monthly contribution base, i.e. annual
    // gross / 12 with extra payments prorated (which is how the base is defined).
    const ES_SS_EMPLOYEE_RATE_YEAR = 2026;
    const ES_SS_EMPLOYEE_RATE = 0.0650;            // indefinite contract
    const ES_SS_FIXED_TERM_EXTRA = 0.0005;         // 1.60% - 1.55% unemployment
    const ES_SS_MAX_BASE_MONTHLY = 5101.20;        // EUR per month
    function calcSpainEmployeeSS(gross, fixedTerm) {
      const base = Math.min(Math.max(0, Number(gross) || 0), ES_SS_MAX_BASE_MONTHLY);
      return base * (ES_SS_EMPLOYEE_RATE + (fixedTerm ? ES_SS_FIXED_TERM_EXTRA : 0));
    }
    // The cap is shown with cents: fmt() rounds to whole units, which would read as 5,101.
    function formatSpainMaxBase() {
      const curr = state.displayCurrency || state.baseCurrency;
      return curr === 'EUR'
        ? '€ ' + ES_SS_MAX_BASE_MONTHLY.toLocaleString('de-DE', { minimumFractionDigits: 2 })
        : fmt(ES_SS_MAX_BASE_MONTHLY);
    }

    // Spain: progressive IRPF on a taxable base (already net of Social
    // Security, since Spanish withholding excludes the worker's own SS
    // contributions from the retention base). Bracket + deduction technique
    // (derived from the 2026 combined state+regional scale: 19/24/30/37/45/47%
    // at annual €12,450/20,200/35,200/60,000/300,000, converted to monthly).
    // Verified against a published example: €30,000/yr gross → €7,165.50/yr.
    // Shared by salary (calcEarnerNet) and rental income (calcRentalIncomeTax)
    // so the two never drift apart from duplicated bracket tables.
    function calcSpainIRPF(baseIR) {
      const b = Math.max(0, Number(baseIR) || 0);
      let irpf = 0;
      if (b > 25000) irpf = (b * 0.47) - 1258.21;
      else if (b > 5000) irpf = (b * 0.45) - 758.21;
      else if (b > 2933.33) irpf = (b * 0.37) - 358.21;
      else if (b > 1683.33) irpf = (b * 0.30) - 152.88;
      else if (b > 1037.5) irpf = (b * 0.24) - 51.88;
      else irpf = b * 0.19;
      return Math.max(0, irpf);
    }

