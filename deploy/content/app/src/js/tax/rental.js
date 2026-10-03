    // Rental income tax. Every jurisdiction taxes it in some form, and the rules
    // depend on the CONTRACT, so the two contract-dependent parameters are
    // editable settings rather than hard-coded rates:
    // - Brazil: "carne-leao" — the same monthly IRPF table as salary, no INSS.
    // - Spain: the net rent from a home let is reduced before it joins the IRPF
    //   base. Contracts signed up to 26/05/2023 keep a 60% reduction; contracts
    //   from that date (effective 2024 income) get 50% in general, 60% if the
    //   property was renovated in the previous 2 years, 70% for a first let to a
    //   tenant aged 18-35 in a stressed-market area (or to a social/public
    //   tenant), and 90% for a new contract in a stressed area with the rent cut
    //   by more than 5% (source: Agencia Tributaria, art. 23.2 LIRPF). The
    //   default is 50% (the general rule for new contracts).
    // - Global: one editable flat rate on net rent (default 20%) — an
    //   approximation, since rules differ widely by country.
    // Tax is computed on the household's TOTAL rental income (not per property)
    // using ONE setting for all of it — mixing contract types across properties
    // is not modelled.
    function calcRentalIncomeTax(totalMonthlyRent, country) {
      const rent = Math.max(0, Number(totalMonthlyRent) || 0);
      if (rent <= 0) return 0;
      if (country === 'ES') {
        const red = [50, 60, 70, 90].includes(Number(state.esRentalReductionPct)) ? Number(state.esRentalReductionPct) : 50;
        return calcSpainIRPF(rent * (1 - red / 100));
      }
      if (country === 'GL') {
        const rate = (typeof state.glRentalTaxRatePct === 'number' && state.glRentalTaxRatePct >= 0) ? state.glRentalTaxRatePct : 20;
        return rent * (rate / 100);
      }
      return calcBrazilIRPF(rent);
    }

    function syncRentalTaxRows() {
      const c = state.country || 'BR';
      const rowEs = document.getElementById('row-rental-tax-es');
      const rowGl = document.getElementById('row-rental-tax-gl');
      if (rowEs) rowEs.classList.toggle('hidden', c !== 'ES');
      if (rowGl) rowGl.classList.toggle('hidden', c !== 'GL');
      const rowGlBase = document.getElementById('row-gl-base-currency');
      if (rowGlBase) rowGlBase.classList.toggle('hidden', c !== 'GL');
    }

