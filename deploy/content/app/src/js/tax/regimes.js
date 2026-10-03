    // 0-1000 scale, matching Brazilian credit bureaus (Serasa/Boa Vista/SPC) —
    // the most standardized public consumer-facing score among the 3
    // countries this app models. Bands follow the widely-published Serasa
    // ranges. Returns null (no band) when no score has been entered yet.
    // Default healthcare-specific inflation assumption: general inflation +2
    // percentage points, reflecting that healthcare/insurance costs have
    // historically outpaced general inflation in every market this app
    // models. Only a starting point — directly editable in the Retirement tab.
    function getDefaultHealthcareInflation(generalInflationRate) {
      return (Number(generalInflationRate) || 0) + 2;
    }

    function getCreditScoreBand(score) {
      if (typeof score !== 'number' || isNaN(score)) return null;
      if (score <= 300) return { labelKey: 'creditBandVeryLow', colorClass: 'text-rose-400' };
      if (score <= 500) return { labelKey: 'creditBandLow', colorClass: 'text-amber-500' };
      if (score <= 700) return { labelKey: 'creditBandFair', colorClass: 'text-amber-400' };
      if (score <= 850) return { labelKey: 'creditBandGood', colorClass: 'text-teal-400' };
      return { labelKey: 'creditBandExcellent', colorClass: 'text-emerald-400' };
    }

    // Stored regime values are country-specific names (CLT, Cuenta Ajena...);
    // the generic ones are English keys shown translated.
    function regimeDisplay(o) {
      if (o === 'Employee') return t('regimeGlEmployee');
      if (o === 'Self-employed') return t('regimeGlSelfEmployed');
      return o;
    }

    function getJurisdictionRegimes(country) {
      switch (country) {
        case 'ES':
          return {
            options: ['Cuenta Ajena', 'Autónomo'],
            contractorLabel: t('regimeEsContractorLabel'),
            benefitLabel: t('regimeEsBenefitLabel'),
            healthLabel: t('regimeEsHealthLabel'),
            contractorTaxDefault: 15.0
          };
        case 'GL':
          // "Global": any other country. Income tax and social contributions are
          // ONE editable effective rate per member instead of a country model.
          return {
            options: ['Employee', 'Self-employed'],
            contractorLabel: t('regimeGlContractorLabel'),
            benefitLabel: t('regimeGlBenefitLabel'),
            healthLabel: t('regimeGlHealthLabel'),
            contractorTaxDefault: 25.0
          };
        case 'BR':
        default:
          return {
            options: ['CLT', 'PJ'],
            contractorLabel: t('regimeBrContractorLabel'),
            benefitLabel: t('regimeBrBenefitLabel'),
            healthLabel: t('regimeBrHealthLabel'),
            contractorTaxDefault: 6.0
          };
      }
    }

