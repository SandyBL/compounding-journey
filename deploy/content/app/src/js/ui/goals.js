    // Per-earner contribution tracking, split mode only, joint goals only, 2+ earners only
    // (nothing to compare with one earner). Everything else about a goal works exactly the
    // same with or without this — it only appears once you opt in via the toggle.
    function goalContributionHtml(g) {
      const split = (state.householdMode || 'shared') === 'split';
      const earners = state.earners || [];
      if (!split || String(g.owner || 'joint') !== 'joint' || earners.length < 2) return '';
      if (!g.trackContributions) {
        return `<button onclick="setGoalContributionTracking(${g.id}, true)" class="text-[11px] text-teal-400 hover:text-teal-300 font-semibold text-left">${escapeHtml(t('glEnableTracking'))}</button>`;
      }
      const balance = getGoalContributionBalance(g, earners) || [];
      const rows = earners.map(e => {
        const b = balance.find(x => x.earnerId === e.id) || { contributed: 0, diff: 0 };
        const ahead = b.diff > 0.5, behind = b.diff < -0.5;
        const noteKey = ahead ? 'glAheadBy' : (behind ? 'glBehindBy' : 'glOnPace');
        const noteText = noteKey === 'glOnPace' ? t('glOnPace') : t(noteKey).replace('{amount}', fmt(Math.abs(b.diff)));
        return `<div class="flex items-center justify-between gap-2">
          <span class="text-[11px] text-slate-400 truncate">${escapeHtml(e.name || t('demoRole1'))}</span>
          <div class="flex items-center gap-1.5">
            <input type="number" min="0" step="10" data-focus-key="goal-${g.id}-contrib-${e.id}" value="${(g.contributions || {})[e.id] || 0}" oninput="updateGoalContribution(${g.id}, ${e.id}, this.value)" class="w-24 glass-input rounded-lg px-2 py-1 text-right font-bold text-[11px]">
            <span class="text-[10px] ${ahead ? 'text-emerald-400' : (behind ? 'text-amber-400' : 'text-slate-400')} whitespace-nowrap">${escapeHtml(noteText)}</span>
          </div>
        </div>`;
      }).join('');
      return `<div class="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">${escapeHtml(t('glContributionsTitle'))}</span>
          <button onclick="setGoalContributionTracking(${g.id}, false)" class="text-[10px] text-slate-400 hover:text-slate-300">${escapeHtml(t('glDisableTracking'))}</button>
        </div>
        ${rows}
        <p class="text-[10px] text-slate-600 leading-relaxed">${escapeHtml(t('glContributionsNote'))}</p>
      </div>`;
    }

    function renderGoalsList() {
      const container = document.getElementById('container-goals-list');
      if (!container) return;
      const focusState = saveFocusState();
      container.innerHTML = '';
      const filterEl = document.getElementById('owner-filter-goals');
      if (filterEl) filterEl.innerHTML = ownerFilterBar('goals', (state.ownerFilter || {}).goals);
      const ownerFilterVal = (state.ownerFilter || {}).goals || 'all';

      (state.goals || []).forEach(g => {
        if (ownerFilterVal !== 'all' && String(g.owner || 'joint') !== ownerFilterVal) return;
        const remaining = getGoalRemainingAmount(g);
        const monthsLeft = getGoalMonthsRemaining(g);
        const monthlyNeeded = getGoalMonthlyContribution(g);
        const pct = g.targetAmount > 0 ? (g.currentSaved / g.targetAmount) * 100 : 0;
        const reached = remaining <= 0;
        const monthUnit = monthsLeft === 1 ? t('glMonthSingular') : t('glMonthPlural');

        const div = document.createElement('div');
        div.className = "p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs";
        div.innerHTML = `
          <div class="flex justify-between items-center gap-2">
            <input type="text" data-focus-key="goal-${g.id}-name" value="${escapeHtml(g.name)}" oninput="updateGoal(${g.id}, 'name', this.value)" class="font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-teal-500 outline-none flex-1 min-w-0">
            <button onclick="removeGoal(${g.id})" class="text-rose-400 hover:text-rose-300 font-bold flex-shrink-0">✕</button>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-0.5">
              <span class="text-[10px] text-slate-400 block">${t('glTargetAmount')}</span>
              <input type="number" data-focus-key="goal-${g.id}-targetAmount" value="${g.targetAmount}" oninput="updateGoal(${g.id}, 'targetAmount', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold text-white">
            </div>
            <div class="space-y-0.5">
              <span class="text-[10px] text-slate-400 block">${t('glCurrentSaved')}</span>
              <input type="number" data-focus-key="goal-${g.id}-currentSaved" value="${g.currentSaved}" ${g.trackContributions ? "disabled" : ""} oninput="updateGoal(${g.id}, 'currentSaved', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold text-teal-400">
            </div>
          </div>

          <div class="space-y-0.5">
            <span class="text-[10px] text-slate-400 block flex items-center">
              <span>${t('glTimeframeLabel')}</span>
              <span class="field-tip">?<span class="field-tip-content">${t('glTimeframeTip')}</span></span>
            </span>
            <div class="flex items-center gap-1.5">
              <input type="number" min="1" step="1" data-focus-key="goal-${g.id}-timeValue" value="${g.timeValue}" oninput="updateGoal(${g.id}, 'timeValue', this.value)" class="w-20 glass-input rounded-lg px-2 py-1 font-bold text-white">
              <select data-focus-key="goal-${g.id}-timeUnit" onchange="updateGoal(${g.id}, 'timeUnit', this.value)" class="glass-input rounded-lg px-2 py-1 font-semibold text-slate-200 text-[11px]">
                <option value="months" ${g.timeUnit !== 'years' ? 'selected' : ''}>${t('glMonths')}</option>
                <option value="years" ${g.timeUnit === 'years' ? 'selected' : ''}>${t('glYears')}</option>
              </select>
            </div>
          </div>

          <div class="p-2 rounded-lg ${reached ? 'bg-emerald-950/50 border border-emerald-700/50' : 'bg-slate-900 border border-slate-800'} flex items-center justify-between">
            <span class="text-[10px] text-slate-400">${reached ? t('glReached') : t('glMonthlyNeededTemplate').replace('{n}', monthsLeft).replace('{unit}', monthUnit)}</span>
            <strong class="${reached ? 'text-emerald-400' : 'text-emerald-400'} text-sm">${reached ? fmt(0) : fmt(monthlyNeeded)}</strong>
          </div>

          <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div class="bg-teal-400 h-full rounded-full" style="width: ${Math.min(100, pct)}%"></div>
          </div>
          <div class="grid grid-cols-1 gap-2.5">${ownerFieldHtml('goal', g.id, g.owner)}</div>
          ${goalContributionHtml(g)}
        `;
        container.appendChild(div);
      });
      restoreFocusState(focusState);
    }

    window.updateGoal = function(id, field, val) {
      const g = state.goals.find(x => x.id === id);
      if (g) {
        // With per-earner tracking on, currentSaved is DERIVED from the contributions below —
        // the plain field is disabled in the UI, and this is the defensive backstop.
        if (field === 'currentSaved' && g.trackContributions) return;
        g[field] = ['targetAmount', 'currentSaved', 'timeValue'].includes(field) ? (parseFloat(val) || 0) : val;
        handleDataUpdate();
      }
    };

    // Turning tracking ON puts the ENTIRE current total under the first earner (arbitrary,
    // but non-destructive — nothing is lost) so the person can redistribute it manually from
    // there. Turning it OFF just freezes currentSaved at whatever it last derived to; the
    // contributions are kept (not deleted), same "reversible, nothing lost" pattern as the
    // household-mode toggle.
    window.setGoalContributionTracking = function(id, on) {
      const g = state.goals.find(x => x.id === id);
      if (!g) return;
      // BUGFIX: this used to unconditionally reseed contributions from whatever currentSaved
      // happened to be at the moment, even on a SECOND enable — silently discarding a
      // breakdown from an earlier enable/disable cycle and replacing it with the (possibly
      // since-edited) lump sum instead. Only seed from currentSaved the FIRST time (when there
      // is no existing breakdown yet); once one exists, re-enabling re-derives currentSaved
      // FROM it, matching "contributions are kept, not deleted" when tracking is turned off.
      const hasExisting = g.contributions && Object.keys(g.contributions).length > 0;
      if (on && !g.trackContributions && !hasExisting) {
        const firstEarner = (state.earners || [])[0];
        g.contributions = firstEarner ? { [firstEarner.id]: g.currentSaved } : {};
      }
      g.trackContributions = !!on;
      if (g.trackContributions) g.currentSaved = Object.values(g.contributions || {}).reduce((s, v) => s + (Number(v) || 0), 0);
      handleDataUpdate();
    };
    window.updateGoalContribution = function(id, earnerId, val) {
      const g = state.goals.find(x => x.id === id);
      if (!g || !g.trackContributions) return;
      g.contributions = g.contributions || {};
      g.contributions[earnerId] = Math.max(0, parseFloat(val) || 0);
      g.currentSaved = Object.values(g.contributions).reduce((s, v) => s + (Number(v) || 0), 0);
      handleDataUpdate();
    };

    window.addGoal = function() {
      state.goals.push({
        id: Date.now(),
        name: t('glNewGoalName'),
        targetAmount: 30000,
        currentSaved: 5000,
        timeValue: 12,
        timeUnit: "months",
        owner: 'joint',
        trackContributions: false,
        contributions: {}
      });
      handleDataUpdate();
    };

    window.removeGoal = function(id) {
      state.goals = state.goals.filter(g => g.id !== id);
      handleDataUpdate();
    };

