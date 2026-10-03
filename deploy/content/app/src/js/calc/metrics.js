    function calculateMetrics() {
      const base = state.baseCurrency || 'BRL';

      let totalRealEstateValue = 0;
      let totalMortgageDebt = 0;
      let totalRentalIncome = 0;

      // BUGFIX: real estate items had no currency field at all — unlike
      // liquidInvestments (which support BRL/USD/EUR per item), every
      // property was silently assumed to be in the household's base
      // currency. A Brazilian family with a property in Portugal (or a
      // Spanish family with a US vacation home) would have that value
      // mislabeled as if it were already in reais/euros. Each property now
      // carries its own `currency`, converted the same way liquid
      // investments already are.
      (state.realEstate || []).forEach(r => {
        const itemCurr = r.currency || base;
        totalRealEstateValue += convertToBase(Number(r.marketValue) || 0, itemCurr);
        totalMortgageDebt += convertToBase(Number(r.mortgageDebt) || 0, itemCurr);
        totalRentalIncome += convertToBase(Number(r.monthlyRentInflow) || 0, itemCurr);
      });

      let totalLiquidBase = 0;
      let foreignPortfolioBase = 0;
      let weightedYieldSum = 0;
      let emergencyReserveBase = 0;

      (state.liquidInvestments || []).forEach(item => {
        const balOrig = Number(item.balanceOriginal) || 0;
        const yPct = Number(item.annualYieldPct) || 0;
        const itemCurr = item.currency || base;

        const balBase = convertToBase(balOrig, itemCurr);

        if (itemCurr !== base) {
          foreignPortfolioBase += balBase;
        }

        totalLiquidBase += balBase;
        weightedYieldSum += (balBase * (yPct / 100));

        // BUGFIX: emergencyReserveBase was referenced all over the UI (the
        // dedicated-reserve badge, the low-runway alert, the monthly snapshot
        // text) but calculateMetrics never actually computed it, so every one
        // of those always showed R$ 0 regardless of what was ticked as reserve.
        // Re-validated against qualifiesForEmergencyReserve() here too, not just
        // at the UI-gating layer (disabled checkbox / toggleEmergencyReserve) —
        // this is the actual accounting, so it shouldn't blindly trust whatever
        // isEmergencyReserve happens to say (e.g. a hand-edited or imported
        // backup file could set it directly without going through the UI gate).
        if (item.isEmergencyReserve && qualifiesForEmergencyReserve(item)) {
          emergencyReserveBase += balBase;
        }
      });

      const weightedPortfolioYield = totalLiquidBase > 0 ? (weightedYieldSum / totalLiquidBase) * 100 : 8.5;
      const foreignDiversificationPct = totalLiquidBase > 0 ? (foreignPortfolioBase / totalLiquidBase) * 100 : 0;

      let totalGoalsSaved = 0;
      (state.goals || []).forEach(g => {
        totalGoalsSaved += (Number(g.currentSaved) || 0);
      });

      const inflationRate = Number(state.inflationRate) >= 0 ? Number(state.inflationRate) : 4.5;
      const realAnnualReturn = (((1 + (weightedPortfolioYield / 100)) / (1 + (inflationRate / 100))) - 1);
      const realAnnualReturnPct = realAnnualReturn * 100;

      // Real (above-inflation) career growth: raises, promotions, job changes.
      // Kept as a real rate, consistent with the rest of this engine (which
      // already projects in real terms via the Fisher equation above) — it's
      // meant to layer ON TOP of inflation, not duplicate it.
      const careerGrowthRate = Number(state.careerGrowthRate) >= 0 ? Number(state.careerGrowthRate) : 2.0;
      const careerGrowthProportional = state.careerGrowthProportional !== false;

      const monthlyPassiveIncome = totalLiquidBase * (weightedPortfolioYield / 100) / 12;

      const totalDebts = totalMortgageDebt + (Number(state.debts.parcelas) || 0) + (Number(state.debts.revolving) || 0) + (Number(state.debts.autoLoans) || 0);

      // BUGFIX: debts had no interest rate at all, so there was no way to see
      // the concrete cost of carrying them — only the balance. Simple
      // balance × rate estimate (not amortization-aware — treats the current
      // balance as constant for a year), specifically to make the cost of
      // high-interest debt visible and motivate paying it down first.
      // Installment purchases ("Parcelas Sem Juros") are interest-free by
      // definition, so they're excluded here.
      const revolvingRatePct = typeof state.debts.revolvingRatePct === 'number' ? state.debts.revolvingRatePct : 12.0;
      const autoLoansRatePct = typeof state.debts.autoLoansRatePct === 'number' ? state.debts.autoLoansRatePct : 18.0;
      const debtInterestCostAnnual = ((Number(state.debts.revolving) || 0) * (revolvingRatePct / 100))
        + ((Number(state.debts.autoLoans) || 0) * (autoLoansRatePct / 100));

      // Equity compensation (stock options/RSUs). Vested value is real net
      // worth (folded into totalAssets below) — but deliberately NOT into
      // totalLiquidBase, the same way Goals savings are excluded: a single
      // employer's stock is concentrated, illiquid-ish (often blackout
      // periods/lockups), and not the diversified portfolio the FIRE/4% SWR
      // engine assumes. Unvested value is informational only — not yet owned,
      // so never counted as an asset.
      let totalEquityVested = 0;
      let totalEquityUnvested = 0;
      (state.equityGrants || []).forEach(g => {
        const curr = g.currency || base;
        totalEquityVested += convertToBase(Number(g.vestedValue) || 0, curr);
        totalEquityUnvested += convertToBase(Number(g.unvestedValue) || 0, curr);
      });

      // NOTE: totalGoalsSaved (sinking funds already saved toward Goals) is added
      // here in totalAssets/netWorth because it's real money the family owns —
      // but deliberately NOT into totalLiquidBase above, which specifically feeds
      // the FIRE engine (weighted portfolio yield, passive income, the 4% SWR
      // crossover projections). Money earmarked for a vacation or a car isn't
      // available to generate perpetual retirement income the way an investment
      // portfolio is, so mixing it in would overstate how close the family is to
      // financial independence.
      const totalAssets = totalRealEstateValue + totalLiquidBase + totalGoalsSaved + totalEquityVested;
      const netWorth = totalAssets - totalDebts;

      function calcEarnerBaseNet(p) {
        if (p.manualNetOverride && Number(p.realNetSalary) > 0) {
          return Number(p.realNetSalary);
        }

        const gross = Number(p.grossMonthly) || 0;
        const country = state.country || 'BR';
        const isEmp = isEmployedRegime(p.regime);

        if (country === 'GL') {
          // Generic model: one editable effective rate (income tax + social
          // contributions) applied to gross, for employees and self-employed alike.
          const glDefault = getJurisdictionRegimes('GL').contractorTaxDefault;
          const glRate = (typeof p.pjTaxRate === 'number' && p.pjTaxRate >= 0) ? p.pjTaxRate : glDefault;
          return Math.max(0, gross * (1 - Math.min(100, glRate) / 100));
        }

        if (!isEmp) {
          const reg = getJurisdictionRegimes(country);
          const defaultRate = reg.contractorTaxDefault;
          const taxRate = (Number(p.pjTaxRate) || defaultRate) / 100;
          return Math.max(0, gross * (1 - taxRate));
        }

        if (country === 'ES') {
          const ss = calcSpainEmployeeSS(gross, p.esFixedTerm);
          const baseIR = Math.max(0, gross - ss);
          return Math.max(0, gross - ss - calcSpainIRPF(baseIR));
        } else {
          // Brasil CLT 2026: INSS (Portaria MPS/MF nº 13/2026), then the payroll
          // base is gross minus the greater of (INSS + dependents) or the
          // R$ 607.20 simplified deduction, and the reform reducer applies to
          // the gross taxable income.
          const inss = calcBrazilINSSEmployee(gross);
          const deps = (getBrazilDependentEarnerId() === p.id)
            ? getBrazilDependentsCount() * BR_DEPENDENT_DEDUCTION : 0;
          const baseIR = Math.max(0, gross - Math.max(inss + deps, BR_SIMPLIFIED_DEDUCTION));
          return Math.max(0, gross - inss - calcBrazilIRPF(baseIR, gross));
        }
      }

      // 13th salary (a legally mandated extra month's pay for Brazilian CLT
      // employees, and a similar "extra month" convention recognized elsewhere)
      // and a company-results bonus are real income most families DO receive but
      // rarely think to include in a monthly budget, since both arrive as
      // irregular, once-a-year lump sums rather than part of the regular
      // paycheck. Smoothed here (added to every month, not shown as a one-off)
      // so the household's real annual income is reflected consistently rather
      // than only showing up as an unplanned windfall in whichever month it's
      // actually paid. Approximated at the SAME effective tax rate as the
      // person's regular monthly net (dividing the already-net monthly figure by
      // 12) rather than running a separate, more precise 13th-salary tax
      // calculation (which has its own real-world nuances, e.g. Brazil's split
      // first/second installment withholding) \u2014 consistent with this app's
      // "approximate overview" philosophy elsewhere. The bonus is asked for
      // directly as a NET amount (what the person actually expects to receive),
      // matching the same "ask for what people actually know" philosophy as the
      // manual net-salary override, so it needs no further tax adjustment here.
      // Only applies to employed regimes \u2014 a self-employed/PJ earner doesn't
      // have an employer paying either of these.
      function calcEarnerNet(p) {
        const baseNet = calcEarnerBaseNet(p);
        if (!isEmployedRegime(p.regime)) return baseNet;
        const thirteenthMonthly = p.has13thSalary ? baseNet / 12 : 0;
        const bonusMonthly = (Number(p.annualBonus) || 0) / 12;
        return baseNet + thirteenthMonthly + bonusMonthly;
      }

      let totalEarnersNet = 0;
      let totalEarnersGross = 0;
      // Exposed per-earner (id -> net monthly) so OTHER consumers (found: the Excel
      // export's Cash Flow sheet, which mislabeled a row "Net Income Total" while
      // actually exporting grossMonthly) can read each earner's REAL net income
      // through the one real calculation (manual override honored, tax engine
      // otherwise) instead of separately re-deriving it and risking drift from this,
      // the single source of truth.
      const earnerNetById = {};
      (state.earners || []).forEach(e => {
        totalEarnersGross += (Number(e.grossMonthly) || 0);
        const net = calcEarnerNet(e);
        totalEarnersNet += net;
        earnerNetById[e.id] = net;
      });

      const rentalIncomeTax = calcRentalIncomeTax(totalRentalIncome, state.country || 'BR');
      const totalRentalIncomeNet = Math.max(0, totalRentalIncome - rentalIncomeTax);
      const totalNetInflow = totalEarnersNet + totalRentalIncomeNet;

      const out = state.outflows;
      const ins = state.insurance || {};
      // BUGFIX: life/disability/health/property insurance premiums were
      // entirely invisible to the app — no outflow category, no cash-flow
      // impact, nothing. A family paying real premiums every month had that
      // spending silently missing from their living-cost and budget totals.
      //
      // Many employers cover some or all of the life insurance premium — asked
      // for directly, since treating the FULL premium as a family cost
      // overstates what the household actually pays out of pocket. Only life
      // insurance is reduced this way (the other three premiums weren't part
      // of the request, and employer-paid health/disability coverage works
      // differently enough — often a straight benefit rather than a
      // percentage of a premium the family would otherwise pay — that folding
      // them into the same field would be guessing at something not asked).
      const lifeInsuranceFamilyShare = (Number(ins.lifeInsuranceMonthlyPremium) || 0)
        * (1 - Math.min(100, Math.max(0, Number(ins.lifeInsuranceEmployerCoveragePct) || 0)) / 100);
      const insuranceMonthlyTotal = lifeInsuranceFamilyShare
        + (Number(ins.disabilityMonthlyPremium) || 0)
        + (Number(ins.healthInsuranceMonthlyPremium) || 0)
        + (Number(ins.propertyInsuranceMonthlyPremium) || 0);

      const baseOutflows = (Number(out.housing) || 0) + (Number(out.utilities) || 0) + (Number(out.telecom) || 0) +
                           (Number(out.groceries) || 0) + (Number(out.dining) || 0) + (Number(out.transport) || 0) +
                           (Number(out.cleaning) || 0) + (Number(out.subs) || 0) + insuranceMonthlyTotal +
                           (Number(out.elderCare) || 0) + (Number(out.charitableGiving) || 0);

      // BUGFIX: collegeMonthly and independenceAge were captured from the user
      // but never read anywhere, so filling them in had zero effect on the plan.
      // We now use the child's current age to decide which cost applies: normal
      // school costs, college-level costs from age 18 onward, and $0 once the
      // child has reached the stated independence age.
      const COLLEGE_START_AGE = 18;
      let kidsMonthlyTotal = 0;
      (state.children || []).forEach(k => {
        const age = Number(k.age) || 0;
        const indepAge = Number(k.independenceAge) || 24;
        if (age >= indepAge) {
          // Financially independent: no more recurring cost assumed
          return;
        }
        if (age >= COLLEGE_START_AGE) {
          kidsMonthlyTotal += (Number(k.collegeMonthly) || Number(k.schoolMonthly) || 0);
        } else {
          kidsMonthlyTotal += (Number(k.schoolMonthly) || 0);
        }
      });

      // BUGFIX: money allocated to Goals (vacations, car funds, etc.) was invisible
      // to the cash-flow reconciliation below, which overstated how much cash was
      // actually left over after all commitments.
      // Contribution is now auto-calculated from (target - saved) / time-to-goal
      // (see getGoalMonthlyContribution) instead of being a manually-typed number,
      // so this always matches what's shown on the Goals tab and what's needed to
      // actually hit each goal on schedule.
      let goalsMonthlyTotal = 0;
      (state.goals || []).forEach(g => {
        goalsMonthlyTotal += getGoalMonthlyContribution(g);
      });

      const bufferPct = typeof state.safetyBufferPct === 'number' ? state.safetyBufferPct : 15.0;
      const misc15 = (baseOutflows + kidsMonthlyTotal) * (bufferPct / 100);
      const totalMonthlyLivingCost = baseOutflows + kidsMonthlyTotal + misc15;
      const livingCostCoveragePct = totalMonthlyLivingCost > 0 ? (monthlyPassiveIncome / totalMonthlyLivingCost) * 100 : 0;

      // Life insurance educational reference (NOT a recommendation): a simplified, transparent rule of
      // thumb (this is an educational estimate, not a substitute for a real
      // financial advisor's needs analysis) — enough to pay off all debts,
      // plus roughly 7 years of the family's full current living costs as a
      // cushion for the survivors to restructure their finances/income. Not
      // netted against the existing portfolio (totalLiquidBase) on purpose:
      // a family may not want to treat their retirement savings as the
      // designated survivor cushion, so this stays a conservative estimate.
      const LIFE_INSURANCE_COVERAGE_YEARS = 7;
      const recommendedLifeInsuranceCoverage = totalDebts + (totalMonthlyLivingCost * 12 * LIFE_INSURANCE_COVERAGE_YEARS);
      const lifeInsuranceCoverage = Number(ins.lifeInsuranceCoverage) || 0;
      const lifeInsuranceGap = Math.max(0, recommendedLifeInsuranceCoverage - lifeInsuranceCoverage);

      const monthlyInvest = Number(state.monthlyInvestment) || 0;
      const savingsRate = totalNetInflow > 0 ? (monthlyInvest / totalNetInflow) * 100 : 0;

      const fixedBase = (Number(out.housing) || 0) + (Number(out.utilities) || 0) + (Number(out.telecom) || 0) +
                        (Number(out.groceries) || 0) + (Number(out.transport) || 0) + (Number(out.cleaning) || 0) + kidsMonthlyTotal + insuranceMonthlyTotal + (Number(out.elderCare) || 0);
      const lifestyleBase = (Number(out.dining) || 0) + (Number(out.subs) || 0) + (Number(out.charitableGiving) || 0);
      const totalBaseOnly = fixedBase + lifestyleBase;

      const fixedBuffer = totalBaseOnly > 0 ? misc15 * (fixedBase / totalBaseOnly) : misc15 * 0.8;
      const lifestyleBuffer = totalBaseOnly > 0 ? misc15 * (lifestyleBase / totalBaseOnly) : misc15 * 0.2;

      const totalFixedOutflows = fixedBase + fixedBuffer;
      const totalLifestyleOutflows = lifestyleBase + lifestyleBuffer;
      // Debt payments are real cash leaving every month, so they are part of what the month "deploys"
      // (and therefore of the surplus). They are deliberately NOT part of totalMonthlyLivingCost:
      // that is the base of the freedom target, and debts end.
      const debtPayments = getMonthlyDebtPayments(state);
      const totalDeployedOutflows = totalFixedOutflows + totalLifestyleOutflows + monthlyInvest + goalsMonthlyTotal + debtPayments.total;
      const cashDelta = totalNetInflow - totalDeployedOutflows;

      const postKidsMonthlyLivingCost = Math.max(0, totalMonthlyLivingCost - kidsMonthlyTotal - (kidsMonthlyTotal * (bufferPct / 100)));

      // BUGFIX: this target used to assume 100% of retirement income had to
      // come from the family's own portfolio, with zero credit for a state
      // pension (INSS/Seguridad Social/Segurança Social) that most formally
      // employed people will actually receive — which overstated the real
      // nest egg needed, sometimes substantially. expectedMonthlyGovPension is
      // a user-entered estimate in today's money. Applied only to the Final
      // (steady-state) target, not the Transition target: stopping work TODAY
      // usually happens well before legal pension eligibility age, so that
      // target still assumes the portfolio alone must cover everything until
      // the pension actually starts.
      const expectedMonthlyGovPension = Math.max(0, Number(state.expectedMonthlyGovPension) || 0);
      const postPensionMonthlyLivingCost = Math.max(0, postKidsMonthlyLivingCost - expectedMonthlyGovPension);

      // Two distinct FIRE targets, since they answer different questions:
      // - Transition Target: the nest egg needed to stop working TODAY, while
      //   still covering current children's costs (school/college) in full.
      // - Final Retirement Target: the smaller, steady-state nest egg needed
      //   once children are financially independent and those costs drop off,
      //   net of the expected government pension.
      // Showing only the second (as before) understated what's actually needed
      // during the years children are still dependents.
      const transitionTargetBase = (totalMonthlyLivingCost * 12) / 0.04;   // scaled below if withdrawal taxes are applied to the target

      // BUGFIX: the Final Target used one flat 4% SWR for every dollar of
      // living cost, implicitly assuming healthcare costs inflate at the same
      // rate as everything else. In practice, healthcare/private insurance
      // premiums have historically outpaced general inflation in every market
      // this app models — a real, growing gap that the flat-rate treatment
      // silently understated. The health-insurance premium slice of the
      // target now uses a growing-perpetuity formula (present value of a
      // payment stream growing at a real rate forever: PV = payment / (r - g))
      // instead of a flat withdrawal rate, while everything else keeps the
      // simple 4% SWR treatment.
      const healthcareInflationRate = (typeof state.healthcareInflationRate === 'number')
        ? state.healthcareInflationRate
        : getDefaultHealthcareInflation(inflationRate);
      const healthPremiumMonthly = Number(ins.healthInsuranceMonthlyPremium) || 0;
      const nonHealthPostPensionMonthlyLivingCost = Math.max(0, postPensionMonthlyLivingCost - healthPremiumMonthly);

      // Real excess growth of healthcare costs specifically, beyond general
      // inflation (Fisher-style: dividing out the general inflation rate).
      // Capped below 4% (the withdrawal rate itself) — a cost genuinely
      // assumed to grow forever at or above the withdrawal rate would require
      // literally infinite capital, so this caps at a defensible ceiling
      // rather than letting the math blow up or go negative/infinite.
      let realHealthExcessGrowth = ((1 + healthcareInflationRate / 100) / (1 + inflationRate / 100)) - 1;
      const MAX_HEALTH_EXCESS_GROWTH = 0.035;
      realHealthExcessGrowth = Math.max(0, Math.min(MAX_HEALTH_EXCESS_GROWTH, realHealthExcessGrowth));

      const nonHealthCapitalNeeded = (nonHealthPostPensionMonthlyLivingCost * 12) / 0.04;
      const healthCapitalNeeded = healthPremiumMonthly > 0
        ? (healthPremiumMonthly * 12) / (0.04 - realHealthExcessGrowth)
        : 0;
      // The target above is "spending / 4%": it assumes everything withdrawn can be SPENT. Withdrawal taxes make the
      // real number larger. The person can choose to apply that (Retirement tab, "Withdrawal phase"); by default the
      // target stays as it was and the Withdrawal card shows the tax-adjusted figure next to it.
      const baseTargetFreedomCapital = nonHealthCapitalNeeded + healthCapitalNeeded;
      const wdPlanState = state.withdrawalPlan || {};
      const withdrawalTaxFactorApplied = wdPlanState.applyToTarget ? withdrawalTaxFactor(state, baseTargetFreedomCapital, wdPlanState.order || 'taxable_first') : 1;
      const targetFreedomCapital = baseTargetFreedomCapital * withdrawalTaxFactorApplied;
      const transitionTargetCapital = transitionTargetBase * withdrawalTaxFactorApplied;

      // FI variants (Lean/Fat/Coast) — additional lenses on the same Final
      // Target, common in the FIRE community but previously entirely absent
      // from this app (which only ever showed one single number).
      // Lean/Fat use the same illustrative multipliers the FIRE community
      // commonly references (a bare-bones vs. comfortably padded lifestyle),
      // not a precise recalculation of a different expense profile.
      const leanFITarget = targetFreedomCapital * 0.6;
      const fatFITarget = targetFreedomCapital * 1.5;

      // Coast FI: the amount that, growing at the real return with ZERO further
      // contributions, would reach the Final Target by traditionalRetirementAge
      // through compounding alone. Uses the first earner's current age as the
      // reference (a per-earner version would need a defined "household"
      // retirement age concept this app doesn't otherwise track).
      const traditionalRetirementAge = Number(state.traditionalRetirementAge) > 0 ? Number(state.traditionalRetirementAge) : 65;
      const primaryEarnerAge = (state.earners && state.earners.length > 0) ? (Number(state.earners[0].age) || 35) : 35;
      const yearsToTraditionalRetirement = Math.max(0, traditionalRetirementAge - primaryEarnerAge);
      const coastFINumber = targetFreedomCapital / Math.pow(1 + realAnnualReturn, yearsToTraditionalRetirement);
      const hasReachedCoastFI = totalLiquidBase >= coastFINumber;

      const lang = state.language || 'pt';
      const currentYear = new Date().getFullYear();
      const labelReached = lang === 'en' ? 'Reached' : (lang === 'es' ? 'Alcanzada' : 'Atingida');
      const labelYears = lang === 'en' ? 'years' : (lang === 'es' ? 'años' : 'anos');
      const labelNotReached = lang === 'en' ? 'Not reached within 35 years' : (lang === 'es' ? 'No alcanzada en 35 años' : 'Não atingida em 35 anos');

      // Projects when `startingCapital` compounding at `realAnnualReturn` with
      // `monthlyInvest` contributions reaches `targetCapital`. Shared by both
      // targets below so their years-to-reach stay consistent with each other.
      // Contribution grows year over year per careerGrowthRate/Proportional
      // (see getProjectedMonthlyContribution) — year 0 uses today's actual
      // contribution unchanged, then grows from there if proportional is on.
      // Life events (Life events tab) and the unallocated monthly surplus feed the projection.
      // the person's own events + the automatic ones from the debt payoff plan
      const lifeEventsActive = (Array.isArray(state.lifeEvents) ? state.lifeEvents : []).concat(buildDebtPlanEvents(state));
      const monthlySurplus = Math.max(0, cashDelta);
      function projectCrossover(targetCapital, startingCapital) {
        // BUGFIX: reported directly — a completely blank profile (no living-cost data
        // entered yet, so the freedom target itself computes to exactly 0) showed
        // "you've already reached financial freedom" everywhere this feeds into (the
        // Overview alert banner, the per-earner "age at freedom" milestone cards), since
        // 0 >= 0 is trivially true at year 0. A target of 0 is not a real target \u2014 it
        // means nothing has been entered yet, not that freedom has been achieved \u2014 so
        // this is treated the same as a target that is never reached within 35 years,
        // not as an instant, degenerate "success."
        if (!(targetCapital > 0)) {
          return { crossoverLabel: labelNotReached, yearsToCrossover: null, projLiquidAtTarget: startingCapital };
        }
        const vals = simulateRealPortfolio({
          start: startingCapital, monthlyInvest, years: 35, realReturn: realAnnualReturn,
          careerGrowthRate, careerGrowthProportional, events: lifeEventsActive, surplus: monthlySurplus
        }).values;
        for (let y = 0; y <= 35; y++) {
          if (vals[y] >= targetCapital) {
            return y === 0
              ? { crossoverLabel: labelReached, yearsToCrossover: 0, projLiquidAtTarget: vals[0] }
              : { crossoverLabel: `${currentYear + y} (${y} ${labelYears})`, yearsToCrossover: y, projLiquidAtTarget: vals[y] };
          }
        }
        return { crossoverLabel: labelNotReached, yearsToCrossover: null, projLiquidAtTarget: vals[35] };
      }

      const finalCrossover = projectCrossover(targetFreedomCapital, totalLiquidBase);
      const transitionCrossover = projectCrossover(transitionTargetCapital, totalLiquidBase);

      // Kept under their original names for backward compatibility with every
      // existing reference to "the" crossover (which has always meant the
      // Final Retirement Target — the smaller, achievable-sooner number).
      const crossoverYear = finalCrossover.crossoverLabel;
      const yearsToCrossover = finalCrossover.yearsToCrossover;
      const projLiquid = finalCrossover.projLiquidAtTarget;

      // BUGFIX: this used to divide by totalLiquidBase (every liquid investment,
      // reserve-tagged or not), which mixed long-term FIRE portfolio money into a
      // metric that's supposed to answer "how many months does our DEDICATED,
      // safety-net money cover" — and was inconsistent with the badge/alerts
      // above, which already (tried to) talk specifically about the reserve.
      const emergencyMonths = totalMonthlyLivingCost > 0 ? emergencyReserveBase / totalMonthlyLivingCost : 0;
      const ptsRunway = Math.min(25, Math.round((emergencyMonths / 6) * 25));
      
      const debtRatio = totalAssets > 0 ? (totalDebts / totalAssets) : (totalDebts > 0 ? Infinity : 0);
      let ptsDebt;
      if (Number(state.debts.revolving) > 0) {
        // High-cost revolving debt caps the score regardless of the ratio
        ptsDebt = 5;
      } else if (totalDebts <= 0) {
        // No debt at all is a perfect score, independent of asset base
        ptsDebt = 25;
      } else if (totalAssets <= 0) {
        // BUGFIX: previously a family with $0 assets and real debt fell into the
        // `totalAssets > 0 ? ... : 0` branch of debtRatio (=> ratio 0), which then
        // scored a perfect 25/25 here. Debt with nothing to back it is the worst
        // case this score exists to catch, so it should score 0, not full marks.
        ptsDebt = 0;
      } else {
        ptsDebt = Math.max(0, Math.round((1 - debtRatio) * 25));
      }
      ptsDebt = Math.min(25, ptsDebt);

      const ptsSavings = Math.min(25, Math.round((savingsRate / 25) * 25));
      const ptsHedge = Math.min(25, Math.round((foreignDiversificationPct / 25) * 25));

      // The currency-diversification component is OPTIONAL and lighter: holding
      // foreign currency is not the right answer for every family (it depends on
      // where future spending will happen), so by default it stays out of the
      // score. When included it weighs 10% (weights 3/3/3/1); when excluded the
      // other three components carry the whole 100 points. Each component is
      // still measured on its own 0-25 scale, and the total is normalised.
      const scoreIncludesHedge = Boolean(state.scoreIncludeHedge);
      const hedgeWeight = scoreIncludesHedge ? 1 : 0;
      const weightedScore = 3 * (ptsRunway + ptsDebt + ptsSavings) / 25 + hedgeWeight * (ptsHedge / 25);
      const totalScore = Math.min(100, Math.round(100 * weightedScore / (9 + hedgeWeight)));

      return {
        totalRealEstateValue,
        totalMortgageDebt,
        totalRentalIncome,
        totalRentalIncomeNet,
        rentalIncomeTax,
        totalLiquidBase,
        foreignPortfolioBase,
        foreignDiversificationPct,
        weightedPortfolioYield,
        inflationRate,
        realAnnualReturn,
        realAnnualReturnPct,
        monthlyPassiveIncome,
        livingCostCoveragePct,
        totalDebts,
        totalAssets,
        netWorth,
        totalEarnersGross,
        totalEarnersNet,
        earnerNetById,
        lifeInsuranceFamilyShare,
        totalNetInflow,
        baseOutflows,
        kidsMonthlyTotal,
        goalsMonthlyTotal,
        totalGoalsSaved,
        misc15,
        totalMonthlyLivingCost,
        totalFixedOutflows,
        totalLifestyleOutflows,
        totalDeployedOutflows,
        cashDelta,
        debtPaymentsMonthly: debtPayments.total,
        debtPaymentsEstimated: debtPayments.estimatedTotal,
        debtPaymentsEstimatedCount: debtPayments.estimatedCount,
        lifeEvents: lifeEventsActive,
        monthlySurplus,
        postKidsMonthlyLivingCost,
        monthlyInvest,
        savingsRate,
        targetFreedomCapital,
        baseTargetFreedomCapital,
        withdrawalTaxFactorApplied,
        crossoverYear,
        yearsToCrossover,
        projLiquidAtCrossover: projLiquid,
        totalScore,
        ptsRunway,
        ptsDebt,
        ptsSavings,
        ptsHedge,
        scoreIncludesHedge,
        emergencyMonths,
        emergencyReserveBase,
        careerGrowthRate,
        careerGrowthProportional,
        insuranceMonthlyTotal,
        recommendedLifeInsuranceCoverage,
        lifeInsuranceCoverage,
        lifeInsuranceGap,
        expectedMonthlyGovPension,
        debtInterestCostAnnual,
        totalEquityVested,
        totalEquityUnvested,
        leanFITarget,
        fatFITarget,
        coastFINumber,
        hasReachedCoastFI,
        yearsToTraditionalRetirement,
        healthcareInflationRate,
        healthCapitalNeeded
      };
    }

    // Runs calculateMetrics() on ANOTHER data object (a scenario), then puts the real
    // one back, even if the calculation throws. Used by the What-if and Life events tabs.
    function calculateMetricsFor(candidate) {
      const saved = state;
      try { state = candidate; return calculateMetrics(); } finally { state = saved; }
    }
