    // =====================================================================
    // Household money model: "shared" (the original behavior — one pool of
    // assets and expenses for the whole family, nothing below is shown) or
    // "split" (adds an owner tag to investments/real estate/goals, a filter to
    // view just one person's items, and a recurring-expenses list in Cash Flow
    // with a per-item split between earners). Switching modes never deletes
    // data: it only changes what the UI shows and, for expenses, which fields
    // are the editable source of truth (see recomputeOutflowsFromRecurring in
    // ui/recurring-expenses.js).
    // =====================================================================
    function getOwnerOptions() {
      return [{ value: 'joint', label: t('ownerJoint') }].concat(
        (state.earners || []).map(e => ({ value: String(e.id), label: e.name || t('demoRole1') }))
      );
    }
    function getOwnerLabel(owner) {
      if (!owner || owner === 'joint') return t('ownerJoint');
      const e = (state.earners || []).find(x => String(x.id) === String(owner));
      return e ? (e.name || t('demoRole1')) : t('ownerJoint');
    }
    // Called whenever an earner is removed: anything they owned goes back to "joint"
    // rather than pointing at an id that no longer exists.
    function cascadeOwnerOnEarnerRemoval(earnerId) {
      const key = String(earnerId);
      [state.liquidInvestments, state.realEstate, state.goals].forEach(list => {
        (list || []).forEach(item => { if (String(item.owner) === key) item.owner = 'joint'; });
      });
      (state.recurringExpenses || []).forEach(item => {
        if (String(item.earnerId) === key) { item.splitType = 'joint'; item.earnerId = null; }
        if (item.customSplits && Object.prototype.hasOwnProperty.call(item.customSplits, key)) delete item.customSplits[key];
      });
      // BUGFIX (found by the integration/data-sync audit): goal contribution tracking and
      // named scenarios were both added to the app AFTER this cascade function was first
      // written, and neither was ever wired into it. A removed earner's own entry in
      // goal.contributions stayed behind with a dangling id — currentSaved (the sum of
      // contributions) looked correct for the rest of THIS session, but the sanitizer's
      // own earner-id validation (state/sanitize.js) would silently drop that entry on the
      // very next save/reload, so the goal's total would inexplicably shrink by that
      // earner's amount with no warning. Recomputing currentSaved here, immediately, makes
      // the live session match what reloading would produce instead of silently disagreeing
      // with it. Scenario earnerId fields are nulled the same way the sanitizer already
      // treats a dangling reference, for the same reason: in-session state should never
      // say one thing while a reload says another.
      (state.goals || []).forEach(g => {
        if (g.contributions && Object.prototype.hasOwnProperty.call(g.contributions, key)) {
          delete g.contributions[key];
          if (g.trackContributions) g.currentSaved = Object.values(g.contributions).reduce((s, v) => s + (Number(v) || 0), 0);
        }
      });
      (state.scenarios || []).forEach(sc => {
        if (sc.careerChange && String(sc.careerChange.earnerId) === key) sc.careerChange.earnerId = null;
        if (sc.sabbatical && String(sc.sabbatical.earnerId) === key) sc.sabbatical.earnerId = null;
      });
    }

    window.setHouseholdMode = function(mode) {
      if (mode !== 'shared' && mode !== 'split') return;
      if (mode === state.householdMode) return;
      const apply = function() {
        state.householdMode = mode;
        if (mode === 'split') seedRecurringExpensesFromOutflows();   // no-op if the list is already non-empty
        handleDataUpdate();
        syncHouseholdModeButtons();
      };
      showConfirmModal({
        title: mode === 'split' ? t('householdConfirmSplitTitle') : t('householdConfirmSharedTitle'),
        body: mode === 'split' ? t('householdConfirmSplitBody') : t('householdConfirmSharedBody'),
        onConfirm: apply
      });
    };

    function syncHouseholdModeButtons() {
      const mode = state.householdMode || 'shared';
      ['shared', 'split'].forEach(m => {
        const btn = document.getElementById(`btn-household-${m}`);
        if (!btn) return;
        btn.className = m === mode
          ? 'p-2 rounded-xl border border-gold-500 bg-gold-500/15 text-gold-300 font-bold transition'
          : 'p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 font-bold transition';
      });
    }

    window.setOwnerFilter = function(list, value) {
      state.ownerFilter = Object.assign({ investments: 'all', realEstate: 'all', goals: 'all' }, state.ownerFilter || {});
      if (['investments', 'realEstate', 'goals'].includes(list)) state.ownerFilter[list] = value;
      // A view filter only — it never touches any calculation, so a plain re-render is enough.
      if (list === 'investments') renderLiquidInvestmentsList();
      else if (list === 'realEstate') renderRealEstateList();
      else if (list === 'goals') renderGoalsList();
    };

    function ownerFilterBar(listKey, currentFilter) {
      if ((state.householdMode || 'shared') !== 'split') return '';
      const opts = [{ value: 'all', label: t('ownerAll') }].concat(getOwnerOptions());
      return `<div class="flex flex-wrap items-center gap-1.5 text-[11px] mb-2">
        <span class="text-slate-400 font-semibold">${t('ownerFilterLabel')}</span>
        ${opts.map(o => `<button onclick="setOwnerFilter('${listKey}', '${o.value}')" class="px-2 py-0.5 rounded-full border ${((currentFilter || 'all') === o.value) ? 'border-gold-500 bg-gold-500/15 text-gold-300 font-bold' : 'border-slate-700 text-slate-400'} transition">${escapeHtml(o.label)}</button>`).join('')}
      </div>`;
    }
    function ownerFieldHtml(idPrefix, id, owner) {
      if ((state.householdMode || 'shared') !== 'split') return '';
      return `<div class="space-y-0.5">
        <label class="text-[10px] text-slate-400 block font-semibold">${t('ownerLabel')}</label>
        <select data-focus-key="${idPrefix}-${id}-owner" onchange="update${idPrefix === 'li' ? 'LiquidInvestment' : (idPrefix === 're' ? 'RealEstate' : 'Goal')}(${id}, 'owner', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-semibold">
          ${getOwnerOptions().map(o => `<option value="${o.value}" ${String(owner || 'joint') === o.value ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}
        </select>
      </div>`;
    }

