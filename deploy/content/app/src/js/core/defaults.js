    // Default long-run inflation assumption by fiscal jurisdiction. Brazil's IPCA
    // has run structurally higher than the Eurozone's HICP, whose ECB target is
    // ~2%; using one flat 4.5% default regardless of country overstated future
    // expenses (and understated real returns) for ES/PT households. There's no
    // separate "USA" jurisdiction in this app (country only drives BR/ES/PT tax
    // regimes) — USD here is just a display/base currency, not a jurisdiction, so
    // it isn't a key in this map. If a US jurisdiction is ever added, 2.0-2.5%
    // (Fed's long-run CPI target) would be the analogous default.
    const DEFAULT_INFLATION_BY_COUNTRY = { BR: 4.5, ES: 2.0, GL: 2.5 };
    function getDefaultInflation(country) {
      return DEFAULT_INFLATION_BY_COUNTRY[country] !== undefined
        ? DEFAULT_INFLATION_BY_COUNTRY[country]
        : DEFAULT_INFLATION_BY_COUNTRY.BR;
    }

    // Default yield assumption for the wizard's starting liquid-reserve entry.
    // Brazil: verified against the Selic rate, cut to 13.75% on 2026-09-16
    // (fifth straight cut) — CDI-linked fixed income tracks a bit below that
    // headline rate after typical fund fees, so 12.5% is a closer real-world
    // default than the previous 10.0%, which had gone stale as Brazilian rates
    // rose. ES/PT: euro cash/near-cash, nowhere near Brazil's level — applying
    // the same 10% (or now 12.5%) to euro cash would be wildly unrealistic.
    // This is only ever a starting default the user can edit immediately in
    // the Balance Sheet tab, not a return guarantee.
    const DEFAULT_YIELD_BY_COUNTRY = { BR: 12.5, ES: 2.5, GL: 4.0 };
    function getDefaultYield(country) {
      return DEFAULT_YIELD_BY_COUNTRY[country] !== undefined
        ? DEFAULT_YIELD_BY_COUNTRY[country]
        : DEFAULT_YIELD_BY_COUNTRY.BR;
    }
    // A second, HIGHER starting assumption for the wizard's "growth / mid-to-long-term"
    // investment bucket (diversified equities/funds), distinct from the "safe" bucket's
    // near-cash assumption above. Not a uniform premium added to the safe rate, since BR's
    // safe rate is already unusually high (SELIC-linked fixed income) and a flat addition
    // would translate poorly across very different monetary environments — these are
    // explicit, separately-reasoned starting points instead. Same philosophy as
    // getDefaultYield(): only ever a starting default the person can edit immediately in
    // the Balance Sheet tab, never a return guarantee.
    const DEFAULT_RISKY_YIELD_BY_COUNTRY = { BR: 15.0, ES: 6.5, GL: 7.5 };
    function getDefaultRiskyYield(country) {
      return DEFAULT_RISKY_YIELD_BY_COUNTRY[country] !== undefined
        ? DEFAULT_RISKY_YIELD_BY_COUNTRY[country]
        : DEFAULT_RISKY_YIELD_BY_COUNTRY.BR;
    }

    /* Clean, zeroed-out state for new users starting fresh */
    const DEFAULT_BLANK_STATE = {
      schemaVersion: 3,
      country: 'BR',
      // "shared" = the original single-pool household model (default, nothing changes for
      // anyone who never touches this). "split" additionally shows an owner tag on
      // investments/real estate/goals (with a filter), and switches Cash Flow to an itemized
      // recurring-expenses list with a per-item split between earners.
      householdMode: 'shared',
      ownerFilter: { investments: 'all', realEstate: 'all', goals: 'all' },
      recurringExpenses: [],
      // PIN / biometric SCREEN LOCK (not encryption — see ui/security.js). Off by
      // default; the sanitizer forces pinEnabled back to false if the hash/salt are ever
      // missing or malformed, so a corrupted profile can never permanently lock anyone out.
      security: { pinEnabled: false, pinHash: null, pinSalt: null, autoLockMinutes: 5, biometricEnabled: false, biometricCredentialId: null },
      // Named scenario comparison (What-if tab): saved career-change / sabbatical /
      // lever scenarios, compared side by side against the current profile and each other.
      scenarios: [],
      // Rebalancing (Withdrawal tab): the target % of the LIQUID portfolio in "risky"
      // (growth-oriented) assets, by the existing volatility tag — no new per-holding
      // field. 70 is a common default for someone still years from their freedom date;
      // editable, and not used for anything except this comparison.
      targetRiskyAllocationPct: 70,
      language: detectBrowserLanguage(),
      languageUserChosen: false,
      baseCurrency: 'BRL',
      fxRates: { USD: 5.15, EUR: 5.90 },
      fxRatesBaseCurrency: 'BRL',
      fxLastUpdated: null,
      targetSavingsRate: 25.0,
      inflationRate: 4.5,
      careerGrowthRate: 2.0,
      careerGrowthProportional: true,
      safetyBufferPct: 15.0,
      wizardCompleted: false,
      emergencyReserveBannerDismissed: false,
      billsDueSoonBannerDismissed: false,
      freedomApproachingBannerDismissed: false,
      cashFlowNegativeBannerDismissed: false,
            monthlySnapshots: [],
      earners: [],
      realEstate: [],
      liquidInvestments: [],
      debts: {
        parcelas: 0,
        revolving: 0,
        revolvingRatePct: 12.0,
        autoLoans: 0,
        autoLoansRatePct: 18.0,
        // Monthly payments for the Debt payoff planner (0 = not entered: the planner estimates one and says so)
        parcelasMinPayment: 0,
        revolvingMinPayment: 0,
        autoLoansMinPayment: 0
      },
      outflows: {
        housing: 0,
        utilities: 0,
        telecom: 0,
        groceries: 0,
        dining: 0,
        transport: 0,
        cleaning: 0,
        subs: 0,
        elderCare: 0,
        charitableGiving: 0
      },
      // Risk management / protection — previously the app modeled decades of
      // growth projections with zero coverage for "what if a primary earner
      // dies or becomes disabled tomorrow." lifeInsuranceCoverage/premium and
      // disability fields let a family see whether they're actually protected
      // against that, not just how fast their portfolio compounds.
      insurance: {
        lifeInsuranceCoverage: 0,
        lifeInsuranceMonthlyPremium: 0,
        disabilityMonthlyBenefit: 0,
        disabilityMonthlyPremium: 0,
        healthInsuranceMonthlyPremium: 0,
        propertyInsuranceMonthlyPremium: 0
      },
      // Estimated household government/state pension income (INSS/Seguridad
      // Social/Segurança Social), in TODAY's money. Previously the Freedom
      // Horizon target assumed 100% of retirement income had to come from the
      // family's own portfolio, ignoring a state pension most formally
      // employed people will actually receive — which overstated the real
      // nest egg needed. Editable estimate, defaults to 0 (conservative).
      expectedMonthlyGovPension: 0,
      estateSettings: {
        hasWill: false,
        guardianDesignated: false,
        guardianName: '',
        // region: a BR state code or ES autonomous-community code (see
        // tax/regional-rates.js); null = not chosen, use the flat country default.
        region: null,
        // null = use the region/country default computed in renderEstateSuccession;
        // set once the user overrides it.
        successionTaxRatePctOverride: null
      },
      // Credit health: 0-1000 scale (matches Brazil's Serasa/Boa Vista Score,
      // the most standardized consumer-facing score among the 3 countries).
      // null = not entered yet, distinct from a real low score of 0.
      creditScore: null,
      // null = derive from inflationRate + a default excess (see
      // getDefaultHealthcareInflation) rather than requiring a second manual
      // number for every profile.
      healthcareInflationRate: null,
      // Age assumed for the Coast FI calculation (how many years of pure
      // compounding, with zero further contributions, until this age).
      traditionalRetirementAge: 65,
      // Additional dependents for Brazilian income tax (spouse without income,
      // parents, ...). Eligible children are counted automatically.
      brExtraDependents: 0,
      // Rental income tax settings that depend on the contract (see calcRentalIncomeTax).
      esRentalReductionPct: 50,
      // Global fiscal residence: generic, editable parameters instead of a country model.
      glRentalTaxRatePct: 20,
      glRetirementAnnualLimit: 0,
      glMarginalTaxRatePct: 25,
      glCharitableDeductionPct: 0,
      // What-if tab levers (all neutral = the scenario equals the current plan)
      // Life events tab (empty = no effect on any projection)
      lifeEvents: [],
      // Withdrawal phase: when and how the portfolio is drawn down, and the tax rates (Brazil / Global are editable;
      // Spain uses its official scales). startAge 0 = automatic (the freedom age, else the retirement age);
      // monthlySpending null = the post-children cost from the Cash Flow.
      withdrawalPlan: { startAge: 0, untilAge: 95, pensionStartAge: 65, monthlySpending: null, order: 'taxable_first', realReturnPct: null,
                        brGainsPct: 15, brPensionPct: 10, glGainsPct: 15, safeBucketYears: 3, applyToTarget: false },
      // Mortgage card: which property, and the prepay-vs-invest inputs (returnPct null = use the portfolio's own yield)
      mortgagePlan: { propertyId: null, extraMonthly: 0, lumpSum: 0, returnPct: null, taxPct: 0, horizonYears: 0 },
      // Debt payoff planner: extra money per month, whether mortgages are part of the plan, which method's order is shown
      debtPlan: { extraMonthly: 0, includeMortgages: false, method: 'avalanche', autoEvents: true },
      whatIf: { extraSavingsPct: 0, spendingChangePct: 0, returnDeltaPp: 0, lumpSum: 0, retireAge: 0, investFreed: true },
      // The currency-diversification part of the security score is optional.
      scoreIncludeHedge: false,
      // Equity compensation (stock options/RSUs): vested value is real,
      // sellable net worth (folded into totalAssets); unvested value is
      // informational awareness only, never counted as an asset until it
      // actually vests.
      equityGrants: [],
      monthlyInvestment: 0,
      children: [],
      goals: [],
      budgetTargets: {
        housing: 0,
        utilities: 0,
        telecom: 0,
        groceries: 0,
        dining: 0,
        transport: 0,
        cleaning: 0,
        subs: 0,
        elderCare: 0,
        charitableGiving: 0
      }
    };

    /* Demonstration scenario for exploring features */
    const EXAMPLE_DEMO_STATE = {
      schemaVersion: 3,
      country: 'BR',
      householdMode: 'shared',
      ownerFilter: { investments: 'all', realEstate: 'all', goals: 'all' },
      recurringExpenses: [],
      // PIN / biometric SCREEN LOCK (not encryption — see ui/security.js). Off by
      // default; the sanitizer forces pinEnabled back to false if the hash/salt are ever
      // missing or malformed, so a corrupted profile can never permanently lock anyone out.
      security: { pinEnabled: false, pinHash: null, pinSalt: null, autoLockMinutes: 5, biometricEnabled: false, biometricCredentialId: null },
      scenarios: [],
      targetRiskyAllocationPct: 70,
      language: 'pt',
      baseCurrency: 'BRL',
      fxRates: { USD: 5.15, EUR: 5.90 },
      fxRatesBaseCurrency: 'BRL',
      fxLastUpdated: '2026-10-02',
      targetSavingsRate: 25.0,
      inflationRate: 4.5,
      careerGrowthRate: 2.0,
      careerGrowthProportional: true,
      safetyBufferPct: 15.0,
      wizardCompleted: true,
      emergencyReserveBannerDismissed: false,
      billsDueSoonBannerDismissed: false,
      freedomApproachingBannerDismissed: false,
      cashFlowNegativeBannerDismissed: false,
            monthlySnapshots: [
        { id: 1714521600000, date: "2026-05-01", time: "09:00", label: "Marco Inicial", netWorth: 1335500, liquidInvestments: 855500, totalDebts: 284500, totalAssets: 1620000, savingsRate: 27.5 },
        { id: 1717200000000, date: "2026-06-01", time: "18:30", label: "Aporte de Meio de Ano", netWorth: 1362000, liquidInvestments: 882000, totalDebts: 280000, totalAssets: 1642000, savingsRate: 29.0 },
        { id: 1719792000000, date: "2026-07-01", time: "14:15", label: "Rebalanceamento Global", netWorth: 1391000, liquidInvestments: 911000, totalDebts: 276000, totalAssets: 1667000, savingsRate: 30.2 }
      ],
      earners: [
        { id: 1, name: 'Lucas', role: 'Titular 1', age: 38, regime: 'CLT', grossMonthly: 28500, hasHealth: true, foodVoucher: 1200, pjTaxRate: 6.0, manualNetOverride: false, realNetSalary: 0 },
        { id: 2, name: 'Sofia', role: 'Titular 2', age: 36, regime: 'PJ', grossMonthly: 16000, hasHealth: false, foodVoucher: 0, pjTaxRate: 6.0, pjCompanyType: 'simples3', proLaborePct: 28, manualNetOverride: false, realNetSalary: 0 }
      ],
      realEstate: [
        { id: 1, name: "Apartamento Principal Família", currency: "BRL", marketValue: 1200000, mortgageDebt: 400000, monthlyRentInflow: 0, mortgageRatePct: 9.5, mortgagePayment: 3900, mortgageTermYears: 0, owner: 'joint' }
      ],
      liquidInvestments: [
        { id: 101, name: "Reserva de Emergência Líquida", currency: "BRL", balanceOriginal: 180000, annualYieldPct: 10.5, liquidityTier: "same_day", volatilityTier: "low", isEmergencyReserve: true, gainPct: 15, owner: 'joint' },
        { id: 102, name: "Renda Fixa & Ações Brasil", currency: "BRL", balanceOriginal: 340000, annualYieldPct: 11.2, liquidityTier: "short", volatilityTier: "medium", gainPct: 35, owner: 'joint' },
        { id: 103, name: "ETF Global Neutro (VT / VWRA)", currency: "USD", balanceOriginal: 55000, annualYieldPct: 8.5, liquidityTier: "short", volatilityTier: "high", gainPct: 45, owner: '1' },
        { id: 104, name: "Ações Europeias & Tech", currency: "EUR", balanceOriginal: 22000, annualYieldPct: 7.8, liquidityTier: "short", volatilityTier: "high", gainPct: 55, owner: '2' },
        { id: 105, name: "LCI / LCA (isento de IR)", currency: "BRL", balanceOriginal: 60000, annualYieldPct: 10.2, liquidityTier: "short", volatilityTier: "low", wdTax: "exempt", owner: 'joint' },
        { id: 106, name: "PGBL (previdência)", currency: "BRL", balanceOriginal: 80000, annualYieldPct: 9.5, liquidityTier: "long", volatilityTier: "medium", accountType: "pgbl", contributedThisYear: 12000, contributionYear: new Date().getFullYear(), owner: '1' }
      ],
      debts: {
        parcelas: 8500,
        revolving: 6500,
        revolvingRatePct: 14.9,
        autoLoans: 28000,
        autoLoansRatePct: 19.5,
        parcelasMinPayment: 850,
        revolvingMinPayment: 520,
        autoLoansMinPayment: 1150
      },
      outflows: {
        housing: 1500,
        utilities: 850,
        telecom: 380,
        groceries: 3200,
        dining: 1800,
        transport: 600,
        cleaning: 1200,
        subs: 550,
        elderCare: 800,
        charitableGiving: 300
      },
      insurance: {
        lifeInsuranceCoverage: 800000,
        lifeInsuranceMonthlyPremium: 280,
        disabilityMonthlyBenefit: 8000,
        disabilityMonthlyPremium: 190,
        healthInsuranceMonthlyPremium: 1450,
        propertyInsuranceMonthlyPremium: 150
      },
      expectedMonthlyGovPension: 3500,
      estateSettings: {
        hasWill: false,
        guardianDesignated: false,
        guardianName: '',
        region: 'SP',
        successionTaxRatePctOverride: null
      },
      monthlyInvestment: 7500,
      children: [
        { id: 201, name: "Theo", age: 7, schoolMonthly: 2400, collegeMonthly: 3500, independenceAge: 23 }
      ],
      goals: [
        { id: 301, name: "Férias Internacionais em Família", targetAmount: 25000, currentSaved: 14000, timeValue: 10, timeUnit: "months", owner: 'joint', trackContributions: true, contributions: { 1: 8000, 2: 6000 } },
        { id: 302, name: "Reserva para Troca de Veículo", targetAmount: 80000, currentSaved: 32000, timeValue: 2, timeUnit: "years", owner: '2' }
      ],
      lifeEvents: [
        { id: 401, kind: 'oneoff', direction: 'out', name: 'Reforma do apartamento', year: new Date().getFullYear() + 2, amount: 60000, years: 1, enabled: true },
        { id: 402, kind: 'oneoff', direction: 'in', name: 'Herança esperada', year: new Date().getFullYear() + 9, amount: 150000, years: 1, enabled: true }
      ],
      budgetTargets: {
        housing: 5500,
        utilities: 900,
        telecom: 400,
        groceries: 3000,
        dining: 1600,
        transport: 1500,
        cleaning: 1200,
        subs: 500,
        elderCare: 0,
        charitableGiving: 200
      }
    };

    let wizardSelectedCountry = 'BR';
    let state = JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE));
    let checkinChartInstance = null;
    let retirementChartInstance = null;

