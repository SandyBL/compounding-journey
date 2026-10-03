    function renderCrossoverMilestones(m) {
      const container = document.getElementById('container-crossover-milestones');
      if (!container) return;
      container.innerHTML = '';

      // BUGFIX (found while writing test coverage for this function): these four
      // labels used to be hand-rolled language ternaries, bypassing the app's real
      // t()/i18n system entirely — invisible to structure.test.js's "every used key
      // exists" and translation-leak checks, and a second place a 4th language would
      // have to be added by hand instead of just filling in one more dictionary.
      const yrsLabel = t('ovYearsLabel');

      (state.earners || []).forEach(e => {
        const curAge = Number(e.age) || 35;
        const freeAgeText = m.yearsToCrossover !== null
          ? `<strong class="text-emerald-400 font-bold">${curAge + m.yearsToCrossover} ${yrsLabel}</strong> (+${m.yearsToCrossover} ${yrsLabel})`
          : `<strong class="text-amber-400 font-bold">${t('ovNotReached')}</strong>`;

        const div = document.createElement('div');
        div.className = "p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs";
        div.innerHTML = `
          <div class="flex justify-between items-center">
            <span class="font-bold text-white">${escapeHtml(e.name)}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">${escapeHtml(displayRole(e.role))}</span>
          </div>
          <div class="text-slate-400">${t('ovCurAgeLabel')}: <strong class="text-slate-200">${curAge} ${yrsLabel}</strong></div>
          <div class="text-slate-400">${t('ovFreeAgeLabel')}: ${freeAgeText}</div>
        `;
        container.appendChild(div);
      });
    }

    // Life insurance death-benefit analysis — one card per earner (calc/death-benefit.js
    // computes each one's own analysis, since each parent's death has a different
    // financial impact). Deliberately NOT shown at all when there is no real life
    // insurance coverage AND no gap to speak of, to avoid cluttering the Overview with
    // an analysis that has nothing to say yet — the print summary's existing "life
    // insurance gap" weakness already flags that absence for someone to act on.
    function renderDeathBenefitAnalysis(m) {
      const container = document.getElementById('container-death-benefit');
      if (!container) return;
      container.innerHTML = '';
      const analyses = calcDeathBenefitAnalysisAll(m);
      const yrsLabel = t('ovYearsLabel');

      analyses.forEach(a => {
        // Nothing meaningful to show for an earner with no real income gap AND no
        // coverage at all — not a protection story, just an empty one.
        if (a.monthlyGap <= 0 && a.payout <= 0) return;

        const div = document.createElement('div');
        div.className = "p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs";

        // BUGFIX found while testing: yearsOfCoverage is only ever null when there is
        // no real gap to begin with (monthlyGap <= 0, the GOOD case already handled
        // above) — a real gap with literally zero funds to cover it computes as a
        // finite 0, not null, so a dedicated "null means no coverage at all" branch
        // here was actually unreachable and fell through to a confusing "covers the
        // family's expenses for 0.0 years" instead. Checked directly against the
        // number (near-zero, not exactly null) so this genuinely critical case is
        // never silently missed.
        let verdictHtml;
        if (a.monthlyGap <= 0) {
          verdictHtml = `<div class="text-emerald-400 font-semibold">${t('dbNoGap')}</div>`;
        } else if (a.yearsOfCoverage === null || a.yearsOfCoverage < 0.1) {
          verdictHtml = `<div class="text-rose-400 font-semibold">${t('dbNoCoverageAtAll')}</div>`;
        } else {
          const yearsText = a.yearsOfCoverage >= 99 ? t('dbCoverageIndefinite') : fillTpl2('dbCoverageYears', { years: a.yearsOfCoverage.toFixed(1) });
          verdictHtml = `<div class="${a.isEnough === false ? 'text-rose-400' : 'text-emerald-400'} font-semibold">${yearsText}</div>`;
        }
        if (a.monthlyGap > 0 && a.hasChildren) {
          verdictHtml += `<div class="text-slate-400">${fillTpl2('dbKidsHorizon', { years: a.yearsUntilYoungestIndependent })}</div>`;
        }

        let recommendationHtml = '';
        if (a.suggestedCoverageChange > 0) {
          recommendationHtml = `<div class="text-amber-400 text-[11px] pt-1 border-t border-slate-900">${fillTpl2('dbRecIncrease', { amount: fmt(a.suggestedCoverageChange) })}</div>`;
        } else if (a.overCoverageAmount > 0) {
          recommendationHtml = `<div class="text-sky-300 text-[11px] pt-1 border-t border-slate-900">${fillTpl2('dbRecDecrease', { amount: fmt(a.overCoverageAmount) })}</div>`;
        }

        div.innerHTML = `
          <div class="flex justify-between items-center">
            <span class="font-bold text-white">${escapeHtml(a.earnerName)}</span>
          </div>
          <div class="text-slate-400">${fillTpl2('dbPayoutLabel', { amount: fmt(a.payout) })}</div>
          ${verdictHtml}
          ${recommendationHtml}
        `;
        container.appendChild(div);
      });
    }

    // A tiny local fillTpl — ui/print.js's own fillTpl() is identical, but this file
    // may render before print.js depending on future reordering, and the function is
    // tiny enough that duplicating it here is simpler than worrying about load order.
    function fillTpl2(key, vars) {
      return Object.keys(vars || {}).reduce((acc, k) => acc.split('{' + k + '}').join(vars[k]), t(key));
    }

    function renderRadarObservations(m) {
      const container = document.getElementById('container-radar-observations');
      if (!container) return;
      container.innerHTML = '';

      const items = [];
      const base = state.baseCurrency || 'BRL';

      const fillTpl = (key, vars) => Object.keys(vars).reduce((acc, k) => acc.split('{' + k + '}').join(vars[k]), t(key));

      if (m.emergencyMonths < 6) {
        items.push({
          icon: '💧',
          title: t('radReserveLowTitle'),
          desc: fillTpl('radReserveLowDesc', { reserve: fmt(m.emergencyReserveBase), months: m.emergencyMonths.toFixed(1), target: fmt(m.totalMonthlyLivingCost * 6) }),
          border: 'border-amber-500/30'
        });
      } else {
        items.push({
          icon: '🛡️',
          title: t('radReserveOkTitle'),
          desc: fillTpl('radReserveOkDesc', { reserve: fmt(m.emergencyReserveBase), months: m.emergencyMonths.toFixed(1) }),
          border: 'border-emerald-500/30'
        });
      }

      if (Number(state.debts.revolving) > 0) {
        items.push({ icon: '💡', title: t('radRevolvingTitle'), desc: fillTpl('radRevolvingDesc', { amount: fmt(state.debts.revolving) }), border: 'border-amber-500/40' });
      } else {
        items.push({ icon: '✅', title: t('radNoRevolvingTitle'), desc: t('radNoRevolvingDesc'), border: 'border-teal-500/30' });
      }

      if (m.savingsRate >= state.targetSavingsRate) {
        items.push({ icon: '🚀', title: t('radSavingsGoodTitle'), desc: fillTpl('radSavingsGoodDesc', { rate: m.savingsRate.toFixed(1), target: state.targetSavingsRate }), border: 'border-emerald-500/30' });
      } else {
        items.push({ icon: '🎯', title: t('radSavingsLowTitle'), desc: fillTpl('radSavingsLowDesc', { rate: m.savingsRate.toFixed(1), amount: fmt((m.totalNetInflow * state.targetSavingsRate / 100) - m.monthlyInvest), target: state.targetSavingsRate }), border: 'border-slate-800' });
      }

      // Currency diversification is optional and not right for every family, so
      // this observation only appears for people who included it in their score.
      if (state.scoreIncludeHedge) {
        if (m.foreignDiversificationPct < 20) {
          items.push({ icon: '🌐', title: t('radIntlOptTitle'), desc: fillTpl('radIntlLowDesc', { pct: m.foreignDiversificationPct.toFixed(1), base: base }), border: 'border-slate-800' });
        } else {
          items.push({ icon: '🌍', title: t('radIntlTitle'), desc: fillTpl('radIntlHighDesc', { pct: m.foreignDiversificationPct.toFixed(1), base: base }), border: 'border-teal-500/30' });
        }
      }

      items.forEach(it => {
        const div = document.createElement('div');
        div.className = `p-3 rounded-xl bg-slate-950 border ${it.border} space-y-1`;
        div.innerHTML = `
          <div class="font-bold text-white flex items-center gap-1.5">
            <span>${it.icon}</span> <span>${it.title}</span>
          </div>
          <p class="text-slate-400 text-[11px] leading-relaxed">${it.desc}</p>
        `;
        container.appendChild(div);
      });
    }

