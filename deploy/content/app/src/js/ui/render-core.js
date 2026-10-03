    function updateUI() {
      const m = calculateMetrics();

      // High-Cost Debt Warning Banner
      const revolvingDebt = Number(state.debts?.revolving) || 0;
      const bannerRevolving = document.getElementById('banner-highcost-debt');
      const lblRevolvingDebt = document.getElementById('lbl-banner-revolving-debt');
      renderBackupBanner();
      renderNextStepsBanner(m);
      renderInstallHint();
      renderAllAlerts(m);
      if (bannerRevolving) {
        if (revolvingDebt > 0) {
          bannerRevolving.classList.remove('hidden');
          if (lblRevolvingDebt) lblRevolvingDebt.innerText = fmt(revolvingDebt);
        } else {
          bannerRevolving.classList.add('hidden');
        }
      }

      // Top KPI Cards
      setText('lbl-dash-networth', fmt(m.netWorth));
      setText('lbl-dash-liquid', `${t('liqPrefix')} ${fmt(m.totalLiquidBase)}`);
      setText('lbl-bs-goals-saved', fmt(m.totalGoalsSaved));
      setText('lbl-cf-goals-monthly', `${fmt(m.goalsMonthlyTotal)} ${t('perMonth')}`);

      setText('lbl-dash-passive-income', `${fmt(m.monthlyPassiveIncome)} ${t('perMonth')}`);
      setText('lbl-dash-passive-pct', `${m.livingCostCoveragePct.toFixed(0)}${t('pctCovered')}`);
      const elPassiveBar = document.getElementById('bar-dash-passive-coverage');
      if (elPassiveBar) elPassiveBar.style.width = `${Math.min(100, m.livingCostCoveragePct)}%`;
      const elPassiveSub = document.getElementById('lbl-dash-passive-sub');
      if (elPassiveSub) {
        elPassiveSub.innerText = m.livingCostCoveragePct >= 100
          ? t('allBillsCovered')
          : t('coversTemplate').replace('{a}', fmt(m.monthlyPassiveIncome)).replace('{b}', fmt(m.totalMonthlyLivingCost));
      }

      setText('lbl-dash-crossover', m.crossoverYear);
      setText('lbl-dash-target-freedom', `${t('targetPrefix')} ${fmt(m.targetFreedomCapital)}`);
      setText('lbl-dash-savings-rate', `${m.savingsRate.toFixed(1)}%`);
      
      const gap = m.savingsRate - state.targetSavingsRate;
      const gapEl = document.getElementById('lbl-dash-savings-gap');
      if (gapEl) {
        if (gap >= 0) {
          gapEl.innerText = `+${gap.toFixed(1)}% ${t('aboveTarget')}`;
          gapEl.className = "font-bold text-emerald-400";
        } else {
          gapEl.innerText = `${gap.toFixed(1)}% ${t('belowTarget')}`;
          gapEl.className = "font-bold text-amber-400";
        }
      }

      setText('lbl-dash-score', m.totalScore);
      const barScore = document.getElementById('bar-dash-score');
      if (barScore) barScore.style.width = `${m.totalScore}%`;

      setText('lbl-score-pill-runway', `${m.ptsRunway}/25`);
      setText('lbl-score-pill-debt', `${m.ptsDebt}/25`);
      setText('lbl-score-pill-savings', `${m.ptsSavings}/25`);
      const pillDiversif = document.getElementById('lbl-score-pill-diversif');
      if (pillDiversif) {
        pillDiversif.innerText = m.scoreIncludesHedge ? `${m.ptsHedge}/25` : '—';
        const pillBox = pillDiversif.parentElement;
        if (pillBox) {
          pillBox.style.opacity = m.scoreIncludesHedge ? '1' : '0.5';
          pillBox.title = m.scoreIncludesHedge ? t('scoreHedgePillOnTitle') : t('scoreHedgePillOffTitle');
        }
      }
      const elDashScore = document.getElementById('lbl-dash-score');
      if (elDashScore) elDashScore.title = t('scoreWeightsNote');

      const badgeEmergency = document.getElementById('badge-emergency-reserve-summary');
      if (badgeEmergency) {
        badgeEmergency.innerText = t('badgeEmergencyTpl').replace('{amount}', fmt(m.emergencyReserveBase)).replace('{months}', m.emergencyMonths.toFixed(1));
        badgeEmergency.className = m.emergencyMonths >= 6
          ? "px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
          : "px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30";
      }

      setText('lbl-crossover-year', m.crossoverYear);
      renderCrossoverMilestones(m);
      renderDeathBenefitAnalysis(m);

      // Balance Sheet FX & Currency Bar
      renderDynamicFxInputs();
      const base = state.baseCurrency || 'BRL';
      const hedgingTitle = document.getElementById('lbl-hedging-bar-title');
      if (hedgingTitle) {
        hedgingTitle.innerText = t('bsHedgingBarTitleTemplate').replace('{base}', base);
      }

      setText('lbl-hard-currency-pct', t('bsForeignPctTemplate').replace('{pct}', m.foreignDiversificationPct.toFixed(1)).replace('{base}', base));
      const barHardCurr = document.getElementById('bar-hard-currency');
      if (barHardCurr) barHardCurr.style.width = `${Math.min(100, m.foreignDiversificationPct)}%`;
      setText('lbl-weighted-portfolio-yield', `${m.weightedPortfolioYield.toFixed(1)}% ${t('perAnnumAbbrev')}`);

      // Retirement Tab
      setText('lbl-ret-nominal-yield', `${m.weightedPortfolioYield.toFixed(1)}% ${t('perAnnumAbbrev')}`);
      const elRetReal = document.getElementById('lbl-ret-real-yield');
      if (elRetReal) {
        elRetReal.innerText = `${m.realAnnualReturnPct >= 0 ? '+' : ''}${m.realAnnualReturnPct.toFixed(2)}% ${t('perAnnumAbbrev')}`;
        elRetReal.className = m.realAnnualReturnPct >= 0 ? "text-lg font-black text-emerald-400" : "text-lg font-black text-rose-400";
      }
      setText('lbl-ret-target-capital', fmt(m.targetFreedomCapital));

      // Outflows & Buffer
      const elBufferInput = document.getElementById('input-outflow-buffer-pct');
      if (elBufferInput && document.activeElement !== elBufferInput) {
        elBufferInput.value = state.safetyBufferPct !== undefined ? state.safetyBufferPct : 15;
      }
      setText('lbl-outflow-misc-15', `+${fmt(m.misc15)} ${t('perMonth')}`);
      setText('lbl-debt-interest-cost', `${fmt(m.debtInterestCostAnnual)} ${t('perYear')}`);
      setText('lbl-eq-total-vested', fmt(m.totalEquityVested));
      setText('lbl-eq-total-unvested', fmt(m.totalEquityUnvested));

      const lblCreditBand = document.getElementById('lbl-credit-score-band');
      if (lblCreditBand) {
        const band = getCreditScoreBand(state.creditScore);
        if (!band) {
          lblCreditBand.innerText = '—';
          lblCreditBand.className = 'font-black text-sm text-slate-400';
        } else {
          lblCreditBand.innerText = t(band.labelKey);
          lblCreditBand.className = `font-black text-sm ${band.colorClass}`;
        }
      }

      setText('lbl-fi-lean', fmt(m.leanFITarget));
      renderMonteCarloLink(m);
      setText('lbl-fi-full', fmt(m.targetFreedomCapital));
      setText('lbl-fi-fat', fmt(m.fatFITarget));
      setText('lbl-coast-fi-number', fmt(m.coastFINumber));
      const boxCoastFi = document.getElementById('box-coast-fi');
      if (boxCoastFi) {
        boxCoastFi.className = m.hasReachedCoastFI
          ? "p-2.5 rounded-lg border flex items-center justify-between flex-wrap gap-2 bg-emerald-950/40 border-emerald-700/50"
          : "p-2.5 rounded-lg border flex items-center justify-between flex-wrap gap-2 bg-slate-900 border-slate-800";
      }

      setText('lbl-total-outflow-sum', `${fmt(m.totalMonthlyLivingCost)} ${t('perMonth')}`);

      // Real monthly family cost after any employer-paid share of the life
      // insurance premium (asked for directly — many employers cover some or
      // all of it, so the full premium overstates what the family pays).
      const insLifeFamilyShareEl = document.getElementById('lbl-ins-life-family-share');
      if (insLifeFamilyShareEl) {
        const pct = Math.min(100, Math.max(0, Number(state.insurance.lifeInsuranceEmployerCoveragePct) || 0));
        if (pct > 0 && Number(state.insurance.lifeInsuranceMonthlyPremium) > 0) {
          insLifeFamilyShareEl.innerText = fillTpl('insLifeFamilyShareLabel', { amount: fmt(m.lifeInsuranceFamilyShare), pct: pct });
        } else {
          insLifeFamilyShareEl.innerText = '';
        }
      }

      // Life Insurance Needs-Gap Analysis
      setText('lbl-ins-recommended', fmt(m.recommendedLifeInsuranceCoverage));
      const boxInsGap = document.getElementById('box-ins-gap');
      const lblInsGapLabel = document.getElementById('lbl-ins-gap-label');
      const lblInsGapValue = document.getElementById('lbl-ins-gap-value');
      if (boxInsGap && lblInsGapLabel && lblInsGapValue) {
        if (m.lifeInsuranceGap <= 0) {
          boxInsGap.className = "p-2 rounded-lg border bg-emerald-950/40 border-emerald-700/50";
          lblInsGapLabel.className = "text-[10px] block text-emerald-400";
          lblInsGapLabel.innerText = t('insGapCoveredLabel');
          lblInsGapValue.className = "text-sm font-black text-emerald-400";
          lblInsGapValue.innerText = t('insGapCoveredValue');
        } else {
          boxInsGap.className = "p-2 rounded-lg border bg-amber-950/40 border-amber-700/50";
          lblInsGapLabel.className = "text-[10px] block text-amber-400";
          lblInsGapLabel.innerText = t('insGapShortfallLabel');
          lblInsGapValue.className = "text-sm font-black text-amber-400";
          lblInsGapValue.innerText = fmt(m.lifeInsuranceGap);
        }
      }

      // Cash Flow Reconciliation Dashboard UI
      const fixedPct = m.totalNetInflow > 0 ? (m.totalFixedOutflows / m.totalNetInflow) * 100 : 0;
      const lifestylePct = m.totalNetInflow > 0 ? (m.totalLifestyleOutflows / m.totalNetInflow) * 100 : 0;
      const investPct = m.savingsRate;

      setText('lbl-cf-bucket-fixed-sum', `${fmt(m.totalFixedOutflows)} ${t('perMonth')}`);
      setText('lbl-cf-bucket-fixed-pct', `${fixedPct.toFixed(1)}%`);

      const debtPct = m.totalNetInflow > 0 ? (m.debtPaymentsMonthly / m.totalNetInflow) * 100 : 0;
      setText('lbl-cf-bucket-debt-sum', `${fmt(m.debtPaymentsMonthly)} ${t('perMonth')}`);
      setText('lbl-cf-bucket-debt-pct', `${debtPct.toFixed(1)}%`);
      const elDebtEst = document.getElementById('lbl-cf-bucket-debt-est');
      if (elDebtEst) {
        elDebtEst.classList.toggle('hidden', !(m.debtPaymentsEstimatedCount > 0));
        elDebtEst.innerText = m.debtPaymentsEstimatedCount > 0
          ? t('cfBucketDebtEst').replace('{n}', m.debtPaymentsEstimatedCount).replace('{amount}', fmt(m.debtPaymentsEstimated)) : '';
      }

      setText('lbl-cf-bucket-lifestyle-sum', `${fmt(m.totalLifestyleOutflows)} ${t('perMonth')}`);
      setText('lbl-cf-bucket-lifestyle-pct', `${lifestylePct.toFixed(1)}%`);

      setText('lbl-cf-bucket-invest-sum', `${fmt(m.monthlyInvest)} ${t('perMonth')}`);
      setText('lbl-cf-bucket-invest-pct', `${investPct.toFixed(1)}%`);

      setText('lbl-cf-reconcile-inflow', fmt(m.totalNetInflow));
      setText('lbl-cf-reconcile-outflow', fmt(m.totalDeployedOutflows));

      const elDiffTitle = document.getElementById('lbl-cf-reconcile-diff-title');
      const elDiffVal = document.getElementById('lbl-cf-reconcile-diff-val');
      const elBadgeStatus = document.getElementById('badge-cf-equilibrium-status');

      const absDelta = Math.abs(m.cashDelta);
      if (absDelta <= 100) {
        if (elDiffTitle) elDiffTitle.innerText = t('cfBalancedTitle');
        if (elDiffVal) {
          elDiffVal.innerText = `${t('cfBalancedVal')} (${fmt(0)})`;
          elDiffVal.className = "text-sm font-black text-emerald-400";
        }
        if (elBadgeStatus) {
          elBadgeStatus.innerHTML = `<span>✅</span> <span>${t('cfBalanced')}</span>`;
          elBadgeStatus.className = "px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
        }
      } else if (m.cashDelta > 100) {
        if (elDiffTitle) elDiffTitle.innerText = t('cfSurplusTitle');
        if (elDiffVal) {
          elDiffVal.innerText = `+${fmt(m.cashDelta)}`;
          elDiffVal.className = "text-sm font-black text-teal-300";
        }
        if (elBadgeStatus) {
          elBadgeStatus.innerHTML = `<span>💰</span> <span>${t('cfSurplusBadge')}: +${fmt(m.cashDelta)} ${t('perMonth')}</span>`;
          elBadgeStatus.className = "px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 bg-teal-500/10 text-teal-300 border border-teal-500/30";
        }
      } else {
        if (elDiffTitle) elDiffTitle.innerText = t('cfDeficitTitle');
        if (elDiffVal) {
          elDiffVal.innerText = `-${fmt(absDelta)}`;
          elDiffVal.className = "text-sm font-black text-rose-400";
        }
        if (elBadgeStatus) {
          elBadgeStatus.innerHTML = `<span>⚠️</span> <span>${t('cfDeficitBadge')}: -${fmt(absDelta)} ${t('perMonth')}</span>`;
          elBadgeStatus.className = "px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30";
        }
      }

      renderRadarObservations(m);
      renderEarnersList();
      renderRealEstateList();
      renderEquityGrantsList();
      renderLiquidInvestmentsList();
      renderChildrenList();
      renderGoalsList();
      renderBudgetMatrix(m);
      renderTaxStudy(m);
      syncRentalTaxRows();
      renderEstateSuccession(m);
      renderRetirementChart(m);
      renderWhatIf();
      renderLifeEvents(m);
      renderDebtPlanner(m);
      renderRecurringExpenses();
      renderBillsSubscriptions();
      renderMortgageCard(m);
      renderWithdrawalPhase(m);
      renderCheckinView();
    }

