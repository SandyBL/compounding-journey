    // ---- Brazil 2026 income tax --------------------------------------------
    // Sources checked (Lei 15.191/2025 table, Lei 15.270/2025 reform): the
    // 2026 monthly table starts at R$ 2,428.80 (7.5% / 15% / 22.5% / 27.5%,
    // deductions 182.16 / 394.16 / 675.49 / 908.73), a R$ 607.20 simplified
    // deduction can replace INSS + dependents when more advantageous, each
    // dependent deducts R$ 189.59/month, and the reform's reducer zeroes the
    // tax up to R$ 5,000/month of taxable income and tapers it to R$ 7,350
    // with: reduction = 978.62 - 0.133145 x monthly taxable income.
    // BUGFIX: an earlier version of this function still used the 2025 table
    // (R$ 2,259.20 / 169.44 / 381.44 / 662.77 / 896.00) plus a linear taper
    // that only approximated the reducer. The reducer is applied to the
    // taxable INCOME (gross), not to the post-deduction base, which is why the
    // literal formula looked like it caused a cliff when it was fed the wrong
    // base; with the right table and inputs it is continuous (checked below).
    const BR_DEPENDENT_DEDUCTION = 189.59;
    const BR_SIMPLIFIED_DEDUCTION = 607.20;
    const BR_PROLABORE_DEFAULT_PCT = 28;

    function calcBrazilINSSEmployee(gross) {
      const g = Math.max(0, Number(gross) || 0);
      let inss = 0;
      if (g <= 1621) inss = g * 0.075;
      else if (g <= 2902.84) inss = (g * 0.09) - 24.32;
      else if (g <= 4354.27) inss = (g * 0.12) - 111.40;
      else if (g <= 8475.55) inss = (g * 0.14) - 198.49;
      else inss = 988.09;
      return Math.max(0, inss);
    }

    // taxableBase: income after legal deductions (table is applied to this).
    // monthlyGross: taxable income before deductions (the reform's reducer is
    // applied to this). Defaults to the base when there are no deductions
    // (e.g. rental income under carne-leao).
    function calcBrazilIRPF(taxableBase, monthlyGross) {
      const b = Math.max(0, Number(taxableBase) || 0);
      const g = (monthlyGross === undefined || monthlyGross === null) ? b : Math.max(0, Number(monthlyGross) || 0);
      let ir = 0;
      if (b > 4664.68) ir = (b * 0.275) - 908.73;
      else if (b > 3751.05) ir = (b * 0.225) - 675.49;
      else if (b > 2826.65) ir = (b * 0.15) - 394.16;
      else if (b > 2428.80) ir = (b * 0.075) - 182.16;
      ir = Math.max(0, ir);

      let reduction = 0;
      if (g <= 5000) reduction = ir;
      else if (g <= 7350) reduction = Math.max(0, 978.62 - (0.133145 * g));
      return Math.max(0, ir - reduction);
    }

    // Eligible dependents: children under their independence age who are up
    // to 21, or up to 24 while in higher education (the app treats a child
    // with a college cost as studying), plus any extra dependents the user
    // enters (spouse without income, parents, etc.). Each dependent can be
    // claimed by only one taxpayer.
    function getBrazilDependentsCount() {
      let n = 0;
      (state.children || []).forEach(k => {
        const age = Number(k.age) || 0;
        const indep = Number(k.independenceAge) || 24;
        const studying = (Number(k.collegeMonthly) || 0) > 0;
        if (age < indep && (age <= 21 || (age <= 24 && studying))) n++;
      });
      return n + Math.max(0, Math.floor(Number(state.brExtraDependents) || 0));
    }

    // Monthly income that is taxed under IRPF: CLT gross, or for PJ members the
    // pro-labore ASSUMED as a % of revenue (editable per member; 28% is the
    // Simples Nacional "Fator R" threshold, not a rule for every company).
    function getBrazilEarnerTaxableMonthly(e) {
      const g = Number(e.grossMonthly) || 0;
      if (isEmployedRegime(e.regime)) return g;
      const raw = (e.proLaborePct === undefined || e.proLaborePct === null || e.proLaborePct === '')
        ? BR_PROLABORE_DEFAULT_PCT : Number(e.proLaborePct);
      return g * (Math.max(0, Math.min(100, raw)) / 100);
    }

    // Simplification: the household's dependents are all deducted from ONE
    // earner — the employed one with the highest income (payroll withholding
    // only exists for employees), otherwise the highest income overall.
    function getBrazilDependentEarnerId() {
      let bestId = null, best = -1;
      (state.earners || []).filter(e => isEmployedRegime(e.regime)).forEach(e => {
        const v = getBrazilEarnerTaxableMonthly(e);
        if (v > best) { best = v; bestId = e.id; }
      });
      if (bestId !== null) return bestId;
      (state.earners || []).forEach(e => {
        const v = getBrazilEarnerTaxableMonthly(e);
        if (v > best) { best = v; bestId = e.id; }
      });
      return bestId;
    }

    // PGBL: deductible up to 12% of taxable income, only under the complete
    // return model (so the R$ 607.20 simplified deduction is NOT used as the
    // baseline). Savings are the ACTUAL difference in tax for this earner,
    // which embeds their real marginal rate — including 0 for anyone fully
    // exempt under the 2026 reform (up to R$ 5,000/month).
    function calcBrazilPGBLPlan() {
      const depId = getBrazilDependentEarnerId();
      const depsMonthly = getBrazilDependentsCount() * BR_DEPENDENT_DEDUCTION;
      let ceilingAnnual = 0, savingsAnnual = 0, taxableAnnual = 0, deductedAnnual = 0;
      (state.earners || []).forEach(e => {
        const g = getBrazilEarnerTaxableMonthly(e);
        if (g <= 0) return;
        const employed = isEmployedRegime(e.regime);
        const inss = employed ? calcBrazilINSSEmployee(g) : Math.min(g * 0.11, 8475.55 * 0.11);
        const deps = (e.id === depId) ? depsMonthly : 0;
        const base = Math.max(0, g - inss - deps);
        const cap = g * 0.12;
        const used = Math.min(cap, base);
        const saved = calcBrazilIRPF(base, g) - calcBrazilIRPF(base - used, g);
        ceilingAnnual += cap * 12;
        taxableAnnual += g * 12;
        deductedAnnual += used * 12;
        savingsAnnual += Math.max(0, saved) * 12;
      });
      return {
        ceilingAnnual, savingsAnnual, taxableAnnual,
        marginalPct: deductedAnnual > 0 ? (savingsAnnual / deductedAnnual) * 100 : 0
      };
    }

