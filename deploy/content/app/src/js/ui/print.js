    window.prepareAndPrint = function() {
      const m = calculateMetrics();
      renderPrintSummary(m);
      setTimeout(() => {
        window.print();
      }, 50);
    };

    window.renderPrintSummary = function(m) {
      const elDate = document.getElementById('print-date');
      if (elDate) {
        const now = new Date();
        elDate.innerText = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      setText('print-jurisdiction', getCountryDisplayName(state.country));
      setText('print-currency', state.baseCurrency || 'BRL');

      setText('print-kpi-networth', fmt(m.netWorth));
      setText('print-kpi-liquid', `${fmt(m.totalLiquidBase)} (${m.livingCostCoveragePct.toFixed(0)}${t('pctCovered')})`);
      setText('print-kpi-crossover', m.crossoverYear);
      setText('print-kpi-savings', `${m.savingsRate.toFixed(1)}%`);
      setText('print-kpi-score', `${m.totalScore} / 100`);

      setText('print-sum-realestate', fmt(m.totalRealEstateValue));
      const reBody = document.getElementById('print-table-realestate');
      if (reBody) {
        reBody.innerHTML = '';
        (state.realEstate || []).forEach(r => {
          const tr = document.createElement('tr');
          tr.className = "border-b border-slate-100";
          tr.innerHTML = `
            <td class="font-medium text-slate-800 py-0.5 truncate max-w-[120px]">${escapeHtml(r.name)}</td>
            <td class="text-right py-0.5">${fmt(r.marketValue)}</td>
            <td class="text-right py-0.5 text-rose-600">${fmt(r.mortgageDebt)}</td>
            <td class="text-right py-0.5 text-emerald-700">${fmt(r.monthlyRentInflow)}</td>
          `;
          reBody.appendChild(tr);
        });
      }

      setText('print-yield-weighted', `${m.weightedPortfolioYield.toFixed(1)}% ${t('perAnnumAbbrev')}`);
      setText('print-sum-liquid', fmt(m.totalLiquidBase));
      const liqBody = document.getElementById('print-table-liquid');
      if (liqBody) {
        liqBody.innerHTML = '';
        (state.liquidInvestments || []).slice(0, 5).forEach(item => {
          const tr = document.createElement('tr');
          tr.className = "border-b border-slate-100";
          const nativeFormatted = fmt(item.balanceOriginal, item.currency);
          tr.innerHTML = `
            <td class="font-medium text-slate-800 py-0.5 truncate max-w-[120px]">${escapeHtml(item.name)}</td>
            <td class="text-center py-0.5 text-slate-400 font-bold">${escapeHtml(item.currency)}</td>
            <td class="text-right py-0.5 font-bold">${nativeFormatted}</td>
            <td class="text-right py-0.5 text-emerald-700">${escapeHtml(item.annualYieldPct)}%</td>
          `;
          liqBody.appendChild(tr);
        });
      }

      setText('print-sum-debt', fmt(m.totalDebts));
      setText('print-debt-parcelas', fmt(state.debts.parcelas));
      setText('print-debt-revolving', fmt(state.debts.revolving));
      setText('print-debt-auto', fmt(state.debts.autoLoans));

      // The withdrawal-phase feature can adjust this same target upward for withdrawal
      // taxes (state.withdrawalPlan.applyToTarget) — m.targetFreedomCapital already
      // reflects that when the toggle is on, so the number itself needs no change here;
      // only a label so the printed page does not silently look identical to before.
      const targetSuffix = (state.withdrawalPlan || {}).applyToTarget ? ` ${t('prtTaxAdjustedSuffix')}` : '';
      setText('print-freedom-nestegg', `${t('prtTargetPrefix')} ${fmt(m.targetFreedomCapital)}${targetSuffix}`);

      const crossContainer = document.getElementById('print-crossover-members');
      if (crossContainer) {
        crossContainer.innerHTML = '';
        const lang = state.language || 'pt';
        const yrsLabel = lang === 'en' ? 'years' : (lang === 'es' ? 'años' : 'anos');
        (state.earners || []).forEach(e => {
          const curAge = Number(e.age) || 35;
          const memberAgeText = m.yearsToCrossover !== null
            ? `${curAge + m.yearsToCrossover} ${yrsLabel} <span class="text-[7px] text-emerald-700 font-normal">(+${m.yearsToCrossover} ${yrsLabel})</span>`
            : `<span class="text-amber-700 font-bold">> 35 ${yrsLabel}</span>`;

          const box = document.createElement('div');
          box.className = "p-1 rounded bg-white border border-emerald-300";
          box.innerHTML = `
            <div class="text-[7px] text-slate-400 uppercase">${escapeHtml(displayRole(e.role))}: ${escapeHtml(e.name)}</div>
            <div class="font-black text-slate-900">${memberAgeText}</div>
          `;
          crossContainer.appendChild(box);
        });
      }

      setText('print-cf-netinflow', `${fmt(m.totalNetInflow)} ${t('perMonth')}`);
      setText('print-cf-inflow-val', fmt(m.totalNetInflow));
      setText('print-cf-base-outflows', fmt(m.baseOutflows + m.kidsMonthlyTotal));
      setText('print-cf-misc15', `+${fmt(m.misc15)} (${state.safetyBufferPct || 15}%)`);
      setText('print-cf-total-burn', `${fmt(m.totalMonthlyLivingCost)} ${t('perMonth')}`);
      setText('print-cf-debt-payments', `${fmt(m.debtPaymentsMonthly)} ${t('perMonth')}`);
      setText('print-cf-monthly-invest', `${fmt(m.monthlyInvest)} ${t('perMonth')}`);

      const fixedPct = m.totalNetInflow > 0 ? (m.baseOutflows / m.totalNetInflow) * 100 : 0;
      const lifestylePct = m.totalNetInflow > 0 ? (((Number(state.outflows.dining) || 0) + (Number(state.outflows.subs) || 0)) / m.totalNetInflow) * 100 : 0;
      setText('print-bm-fixed', `${fixedPct.toFixed(0)}%`);
      setText('print-bm-lifestyle', `${lifestylePct.toFixed(0)}%`);
      setText('print-bm-invest', `${m.savingsRate.toFixed(0)}%`);

      setText('print-score-total', `${m.totalScore} / 100`);
      setText('print-score-runway', `${m.ptsRunway}/25`);
      setText('print-score-debt', `${m.ptsDebt}/25`);
      setText('print-score-savings', `${m.ptsSavings}/25`);
      setText('print-score-hedge', m.scoreIncludesHedge ? `${m.ptsHedge}/25` : `— ${t('prtOptional')}`);

      renderPrintHealthSnapshot(m);

      // Protection & Planning summary (insurance, gov pension, estate/
      // guardian, tax-advantaged balance, debt interest cost) — these were
      // added to the app well after the print page was first built, so this
      // section is what keeps the 1-page executive summary from silently
      // going stale relative to everything else the app now tracks.
      setText('print-insurance-premium', `${fmt(m.insuranceMonthlyTotal)} ${t('perMonth')}`);

      const lifeGapBox = document.getElementById('print-life-gap-box');
      const lifeGapLabel = document.getElementById('print-life-gap-label');
      const lifeGapValue = document.getElementById('print-life-gap-value');
      if (lifeGapBox && lifeGapLabel && lifeGapValue) {
        if (m.lifeInsuranceGap <= 0) {
          lifeGapBox.className = "p-1 rounded border bg-emerald-50 border-emerald-200";
          lifeGapLabel.className = "text-[7px] uppercase font-bold text-emerald-700";
          lifeGapLabel.innerText = t('insGapCoveredLabel');
          lifeGapValue.className = "text-xs text-emerald-800";
          lifeGapValue.innerText = t('insGapCoveredValue');
        } else {
          lifeGapBox.className = "p-1 rounded border bg-rose-50 border-rose-200";
          lifeGapLabel.className = "text-[7px] uppercase font-bold text-rose-700";
          lifeGapLabel.innerText = t('insGapShortfallLabel');
          lifeGapValue.className = "text-xs text-rose-800";
          lifeGapValue.innerText = fmt(m.lifeInsuranceGap);
        }
      }

      setText('print-gov-pension', `${fmt(m.expectedMonthlyGovPension)} ${t('perMonth')}`);

      const estateOverride = state.estateSettings && state.estateSettings.successionTaxRatePctOverride;
      const estateRatePct = (typeof estateOverride === 'number') ? estateOverride : getDefaultSuccessionTaxRate(state.country || 'BR', (state.estateSettings || {}).region);
      setText('print-estate-rate', `${estateRatePct.toFixed(1)}% · ${fmt(Math.max(0, m.netWorth * estateRatePct / 100))}`);

      const guardianBox = document.getElementById('print-guardian-box');
      const guardianLabel = document.getElementById('print-guardian-label');
      const guardianValue = document.getElementById('print-guardian-value');
      if (guardianBox && guardianLabel && guardianValue) {
        const es = state.estateSettings || {};
        const hasKids = (state.children || []).length > 0;
        const missingGuardian = hasKids && !es.guardianDesignated;
        guardianBox.className = missingGuardian
          ? "p-1 rounded border bg-amber-50 border-amber-200"
          : "p-1 rounded border bg-slate-50 border-slate-200";
        guardianLabel.className = missingGuardian ? "text-[7px] uppercase font-bold text-amber-700" : "text-[7px] uppercase font-bold text-slate-400";
        guardianValue.className = missingGuardian ? "text-xs text-amber-800" : "text-xs text-slate-950";
        const willPart = es.hasWill ? t('estHasWillLabel') : `✕ ${t('estHasWillLabel')}`;
        const guardianPart = es.guardianDesignated ? t('estGuardianDesignatedLabel') : `✕ ${t('estGuardianDesignatedLabel')}`;
        guardianValue.innerText = `${willPart} · ${guardianPart}`;
      }

      const trackedTypes = state.country === 'ES' ? ['pension_plan'] : (state.country === 'GL' ? ['tax_deferred'] : ['pgbl', 'vgbl']);
      setText('print-tax-advantaged', fmt(getTaxAdvantagedBalance(state.country || 'BR', trackedTypes)));

      setText('print-debt-interest', `${fmt(m.debtInterestCostAnnual)} ${t('perYear')}`);

      // A dated, transparent footnote for a printed document: which of the jurisdiction's
      // own tax rules this profile's numbers assume, and as of when — the SAME registry
      // (and citations) the in-app "Rules as of..." badges already use, so this can never
      // disagree with what the person sees on the Tax Planning / Withdrawal tabs.
      const asOfEl = document.getElementById('print-tax-asof');
      if (asOfEl) {
        const key = state.country === 'ES' ? 'ES_IRPF' : (state.country === 'BR' ? 'BR_IRPF' : null);
        asOfEl.innerText = key ? taxRulesAsOfText(key) : '';
      }
    };


    // =====================================================================
    // Executive health snapshot: strengths, weaknesses and recommendations,
    // replacing the old flat 3-line "observations" list. Recommendations are
    // tied directly to whichever Financial Security Score component
    // (Reserve / Debt / Savings / Global-currency hedge) is weakest, since
    // the point of this section is specifically "what would raise the
    // score" \u2014 not a general list of tips. Every check here reuses an
    // engine the app already relies on elsewhere (the same math the
    // Overview alerts, the Rebalancing card and the Mortgage card use), so
    // this can never disagree with what the person sees on those tabs.
    // =====================================================================
    function fillTpl(key, vars) {
      return Object.keys(vars || {}).reduce((acc, k) => acc.split('{' + k + '}').join(vars[k]), t(key));
    }

    function buildPrintHealthSnapshot(m) {
      const strengths = [], weaknesses = [];

      // Emergency reserve \u2014 same 3-month minimum as the Overview alert, and the SAME
      // "only if there is a real living cost to measure against" guard that alert
      // already has (ui/alerts.js). BUGFIX: this check was missing that guard, so a
      // completely blank profile (0 living cost, so "0.0 months covered") showed a
      // nonsensical weakness with nothing actually entered yet.
      if (m.totalMonthlyLivingCost > 0) {
        if (m.emergencyMonths >= ALERT_EMERGENCY_MONTHS_MIN) strengths.push(fillTpl('prtStrReserveOk', { months: m.emergencyMonths.toFixed(1) }));
        else weaknesses.push(fillTpl('prtWeakReserveLow', { months: m.emergencyMonths.toFixed(1) }));
      }

      // Guardian designated, if there are children.
      const es = state.estateSettings || {};
      if ((state.children || []).length > 0 && !es.guardianDesignated) weaknesses.push(t('prtWeakNoGuardian'));

      // High-cost (revolving/overdraft) debt.
      const revolving = convertToBase(Math.max(0, Number(state.debts.revolving) || 0), state.baseCurrency);
      if (revolving <= 0) strengths.push(t('prtStrNoRevolving'));
      else weaknesses.push(fillTpl('prtWeakRevolving', { amount: fmt(revolving) }));

      // Savings rate vs. the household's own target \u2014 only if there is real income to
      // measure a rate against. BUGFIX: calc/metrics.js itself already guards the
      // DIVISION (savingsRate is 0, not NaN, with zero income), but this presentation
      // layer did not check WHY the rate was 0 before calling it a weakness \u2014 "no income
      // entered yet" and "has income but saves nothing" are very different situations,
      // and a blank profile was nonsensically shown as "25 points below target."
      if (m.totalNetInflow > 0) {
        if (m.savingsRate >= state.targetSavingsRate) strengths.push(fillTpl('prtStrSavingsOk', { rate: m.savingsRate.toFixed(1) }));
        else weaknesses.push(fillTpl('prtWeakSavingsLow', { gap: (state.targetSavingsRate - m.savingsRate).toFixed(1) }));
      }

      // This month's cash flow.
      if (m.cashDelta < 0) weaknesses.push(fillTpl('prtWeakCashNegative', { amount: fmt(Math.abs(m.cashDelta)) }));

      // Portfolio allocation drift vs. the person's own risk target (Withdrawal tab).
      const alloc = summarizeAllocation(state, 0, 0);
      if (alloc.total > 0) {
        const rb = computeRebalancingSuggestion(alloc, state.targetRiskyAllocationPct);
        if (rb.direction === null) strengths.push(t('prtStrAllocationOk'));
        else weaknesses.push(fillTpl('prtWeakDrift', { drift: Math.abs(rb.driftPct).toFixed(0) }));
      }

      // Mortgage rate vs. the portfolio's own weighted yield (same comparison the Mortgage
      // card's "prepay or invest?" verdict uses) \u2014 only for the largest mortgaged property,
      // to keep this one line, and only when the gap is wide enough to be a real signal.
      const mortgaged = (state.realEstate || []).filter(r => Number(r.mortgageDebt) > 0).sort((a, b) => Number(b.mortgageDebt) - Number(a.mortgageDebt));
      if (mortgaged.length > 0) {
        const terms = resolveMortgageTerms(mortgaged[0], state);
        if (terms.ratePct > m.weightedPortfolioYield + 1) weaknesses.push(fillTpl('prtWeakMortgageRate', { rate: terms.ratePct.toFixed(1), yield: m.weightedPortfolioYield.toFixed(1) }));
        else if (terms.ratePct > 0) strengths.push(t('prtStrMortgageOk'));
      }

      // Life insurance gap (already computed for the Protection section below) \u2014 only if
      // there is a real recommended coverage amount to compare against (real debt and/or
      // real living costs to protect). BUGFIX: a blank profile has 0 recommended
      // coverage (nothing to protect yet, not genuinely "well protected"), which
      // nonsensically showed up as a strength ("life insurance coverage is sufficient")
      // for someone who had entered nothing at all.
      if (m.recommendedLifeInsuranceCoverage > 0) {
        if (m.lifeInsuranceGap <= 0) strengths.push(t('prtStrInsuranceOk'));
        else weaknesses.push(fillTpl('prtWeakInsuranceGap', { amount: fmt(m.lifeInsuranceGap) }));
      }

      // Bills/subscriptions due very soon (a small, timely nudge rather than a strength/weakness).
      const dueSoon = (typeof getDueSoonRecurringItems === 'function') ? getDueSoonRecurringItems() : [];
      if (dueSoon.length > 0) weaknesses.push(fillTpl('prtWeakBillsDueSoon', { n: dueSoon.length }));

      // Recommendations: whichever score components sit below 80% of their own maximum,
      // weakest first \u2014 this is deliberately about THE SCORE, not a generic tips list.
      // BUGFIX: a completely blank profile recommended "prioritize the emergency reserve"
      // and "increase the savings rate" — not wrong in the sense of a miscalculation, but
      // not actually ACTIONABLE advice either, since there is no real living-cost or
      // income data yet for either recommendation to be responding to. Debt does not
      // need the same guard: zero debt by default genuinely means a perfect, not a
      // hollow, debt score, so it naturally never triggers a recommendation on its own.
      const components = [
        { pts: m.ptsRunway, max: 25, rec: 'prtRecReserve', dataAvailable: m.totalMonthlyLivingCost > 0 },
        { pts: m.ptsDebt, max: 25, rec: 'prtRecDebt', dataAvailable: true },
        { pts: m.ptsSavings, max: 25, rec: 'prtRecSavings', dataAvailable: m.totalNetInflow > 0 }
      ];
      if (m.scoreIncludesHedge) components.push({ pts: m.ptsHedge, max: 25, rec: 'prtRecHedge', dataAvailable: m.recommendedLifeInsuranceCoverage > 0 });
      const recommendations = components.filter(c => c.dataAvailable && c.pts < c.max * 0.8).sort((a, b) => a.pts - b.pts).slice(0, 3).map(c => t(c.rec));

      return { strengths: strengths.slice(0, 5), weaknesses: weaknesses.slice(0, 5), recommendations };
    }

    function renderPrintHealthSnapshot(m) {
      const snap = buildPrintHealthSnapshot(m);
      const strEl = document.getElementById('print-strengths-list');
      const weakEl = document.getElementById('print-weaknesses-list');
      const recEl = document.getElementById('print-recommendations-list');
      const line = (cls, icon, text) => `<div class="${cls}">${icon} ${escapeHtml(text)}</div>`;
      if (strEl) strEl.innerHTML = snap.strengths.length ? snap.strengths.map(x => line('text-emerald-800', '\u2713', x)).join('') : `<div class="text-slate-400">${escapeHtml(t('prtNoneNoted'))}</div>`;
      if (weakEl) weakEl.innerHTML = snap.weaknesses.length ? snap.weaknesses.map(x => line('text-rose-800', '\u26a0', x)).join('') : `<div class="text-slate-400">${escapeHtml(t('prtNoneNoted'))}</div>`;
      if (recEl) recEl.innerHTML = snap.recommendations.length ? snap.recommendations.map((x, i) => line('text-slate-800 font-semibold', `${i + 1}.`, x)).join('') : `<div class="text-slate-400">${escapeHtml(t('prtRecNone'))}</div>`;
    }
