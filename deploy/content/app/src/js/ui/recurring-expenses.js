    // =====================================================================
    // Recurring expenses (Cash Flow, "split" household mode only): an itemized
    // list that replaces the ten plain category totals with named, splittable
    // line items — this is also where a subscription is tracked, since it is
    // just a recurring item in the "subs" category. In "shared" mode none of
    // this is shown and the plain category inputs work exactly as before.
    // state.outflows.<category> stays the single source every OTHER part of the
    // app reads (metrics, budget, print, Excel export...); in split mode it is
    // simply DERIVED from the sum of this list's items every time the list
    // changes, via recomputeOutflowsFromRecurring().
    // =====================================================================
    const RECURRING_CATEGORY_KEYS = XLSX_OUTFLOW_KEYS.map(([k]) => k);   // the 10 valid categories, one canonical list

    function recomputeOutflowsFromRecurring() {
      // BUGFIX: this used to write unconditionally. It happened to look mode-safe only because
      // its callers (updateRecurringExpense, etc.) always ended with handleDataUpdate(), whose
      // readInputsIntoState() would immediately overwrite state.outflows back from the (correct,
      // unchanged) plain inputs in Shared mode — one bug quietly papering over another. Any new
      // caller that skipped that specific sequence (e.g. calling this directly, or from a future
      // Excel/JSON import path) would have silently corrupted Shared mode's cash-flow totals from
      // whatever happens to be sitting in the bills list. The invariant ("Shared mode's outflows
      // are never touched by this feature") now holds here, at the only place it can be violated,
      // instead of depending on a downstream function to fix it after the fact.
      if ((state.householdMode || 'shared') !== 'split') return;
      const sums = {}; RECURRING_CATEGORY_KEYS.forEach(k => { sums[k] = 0; });
      (state.recurringExpenses || []).forEach(item => { if (sums[item.category] !== undefined) sums[item.category] += Number(item.amount) || 0; });
      RECURRING_CATEGORY_KEYS.forEach(k => { state.outflows[k] = sums[k]; });
    }

    // First time switching into split mode: pre-fill one "joint" item per category that
    // currently has a non-zero amount, so the total is IDENTICAL right after switching —
    // nothing to reconcile, the person can then split individual items apart from there.
    // A no-op if the list already has items (e.g. switching back and forth).
    function seedRecurringExpensesFromOutflows() {
      if ((state.recurringExpenses || []).length > 0) return;
      const base = Date.now();
      state.recurringExpenses = XLSX_OUTFLOW_KEYS
        .filter(([k]) => Number(state.outflows[k]) > 0)
        .map(([k, labelKey], i) => ({ id: base + i, name: t(labelKey), category: k, amount: Number(state.outflows[k]) || 0, splitType: 'joint', earnerId: null, customSplits: {} }));
    }

    // ---------- editing ----------
    window.addRecurringExpense = function() {
      const defaultCat = RECURRING_CATEGORY_KEYS[0];
      state.recurringExpenses = state.recurringExpenses || [];
      state.recurringExpenses.push({ id: Date.now(), name: '', category: defaultCat, amount: 0, splitType: 'joint', earnerId: null, customSplits: {}, dueDay: null });
      recomputeOutflowsFromRecurring();
      handleDataUpdate();
    };
    window.removeRecurringExpense = function(id) {
      state.recurringExpenses = (state.recurringExpenses || []).filter(x => x.id !== id);
      recomputeOutflowsFromRecurring();
      handleDataUpdate();
    };
    window.updateRecurringExpense = function(id, field, val) {
      const item = (state.recurringExpenses || []).find(x => x.id === id);
      if (!item) return;
      if (field === 'amount') item.amount = Math.max(0, parseFloat(val) || 0);
      else if (field === 'dueDay') { const d = Math.round(parseFloat(val)); item.dueDay = (d >= 1 && d <= 31) ? d : null; }
      else if (field === 'category') item.category = RECURRING_CATEGORY_KEYS.includes(val) ? val : RECURRING_CATEGORY_KEYS[0];
      else if (field === 'splitType') { item.splitType = ['joint', 'individual', 'custom'].includes(val) ? val : 'joint'; if (item.splitType !== 'custom') item.customSplits = {}; if (item.splitType !== 'individual') item.earnerId = null; }
      else if (field === 'earnerId') item.earnerId = val ? Math.floor(Number(val)) : null;
      else item.name = String(val).slice(0, 80);
      recomputeOutflowsFromRecurring();
      handleDataUpdate();
    };
    window.updateRecurringSplitPct = function(id, earnerId, val) {
      const item = (state.recurringExpenses || []).find(x => x.id === id);
      if (!item) return;
      item.customSplits = item.customSplits || {};
      const pct = Math.min(100, Math.max(0, parseFloat(val) || 0));
      item.customSplits[String(earnerId)] = pct;
      handleDataUpdate();
    };

    // How much of an item's amount a given earner bears (for the "who pays" summary).
    // 'joint' items are not attributed to anyone specific (shown as a separate total).
    // 'custom' items are normalized so shares always add up to the item's full amount,
    // even if the entered percentages do not sum to exactly 100.
    function recurringItemShareForEarner(item, earnerId) {
      const amt = Number(item.amount) || 0;
      if (item.splitType === 'individual') return String(item.earnerId) === String(earnerId) ? amt : 0;
      if (item.splitType === 'custom') {
        const splits = item.customSplits || {};
        const total = Object.values(splits).reduce((s, v) => s + (Number(v) || 0), 0);
        if (total <= 0) return 0;
        return amt * (Number(splits[String(earnerId)]) || 0) / total;
      }
      return 0;   // joint
    }
    function recurringWhoPaysSummary() {
      const items = state.recurringExpenses || [];
      const perEarner = {}; (state.earners || []).forEach(e => { perEarner[e.id] = 0; });
      let joint = 0;
      items.forEach(item => {
        if (item.splitType === 'joint') { joint += Number(item.amount) || 0; return; }
        (state.earners || []).forEach(e => { perEarner[e.id] += recurringItemShareForEarner(item, e.id); });
      });
      return { joint, perEarner };
    }

    // ---------- rendering ----------
    function renderRecurringExpenses() {
      const container = document.getElementById('container-recurring-expenses');
      if (!container) return;
      const split = (state.householdMode || 'shared') === 'split';
      const rowShared = document.getElementById('row-cashflow-shared');
      const rowSplit = document.getElementById('row-cashflow-split');
      if (rowShared) rowShared.classList.toggle('hidden', split);
      if (rowSplit) rowSplit.classList.toggle('hidden', !split);
      if (!split) return;

      const focusState = saveFocusState();
      container.innerHTML = '';
      const earners = state.earners || [];
      (state.recurringExpenses || []).forEach(item => {
        const div = document.createElement('div');
        div.className = 'p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs';
        const isCustom = item.splitType === 'custom';
        const isIndividual = item.splitType === 'individual';
        div.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
            <div class="sm:col-span-2">
              <label class="text-[10px] text-slate-400 block font-semibold">${t('reLabelName')}</label>
              <input type="text" data-focus-key="rec-${item.id}-name" value="${escapeHtml(item.name)}" placeholder="${escapeHtml(t('recNamePlaceholder'))}" oninput="updateRecurringExpense(${item.id}, 'name', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-semibold">
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold">${t('recCategory')}</label>
              <select data-focus-key="rec-${item.id}-category" onchange="updateRecurringExpense(${item.id}, 'category', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-semibold">
                ${XLSX_OUTFLOW_KEYS.map(([k, labelKey]) => `<option value="${k}" ${item.category === k ? 'selected' : ''}>${escapeHtml(t(labelKey))}</option>`).join('')}
              </select>
            </div>
            <div class="flex items-end justify-between gap-2">
              <div class="flex-1">
                <label class="text-[10px] text-slate-400 block font-semibold">${t('recAmount')}</label>
                <input type="number" min="0" step="10" data-focus-key="rec-${item.id}-amount" value="${item.amount}" oninput="updateRecurringExpense(${item.id}, 'amount', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold">
              </div>
              <button onclick="removeRecurringExpense(${item.id})" class="text-rose-400 hover:text-rose-300 font-bold p-1" title="${escapeHtml(t('btnDelete'))}">✕</button>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold">${t('recSplitType')}</label>
              <select data-focus-key="rec-${item.id}-splitType" onchange="updateRecurringExpense(${item.id}, 'splitType', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-semibold">
                <option value="joint" ${item.splitType === 'joint' ? 'selected' : ''}>${escapeHtml(t('recSplitJoint'))}</option>
                <option value="individual" ${isIndividual ? 'selected' : ''}>${escapeHtml(t('recSplitIndividual'))}</option>
                <option value="custom" ${isCustom ? 'selected' : ''}>${escapeHtml(t('recSplitCustom'))}</option>
              </select>
            </div>
            ${isIndividual ? `<div class="sm:col-span-2">
              <label class="text-[10px] text-slate-400 block font-semibold">${t('recWhoPays')}</label>
              <select data-focus-key="rec-${item.id}-earnerId" onchange="updateRecurringExpense(${item.id}, 'earnerId', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-semibold">
                ${earners.map(e => `<option value="${e.id}" ${String(item.earnerId) === String(e.id) ? 'selected' : ''}>${escapeHtml(e.name || t('demoRole1'))}</option>`).join('')}
              </select>
            </div>` : ''}
            ${isCustom ? `<div class="sm:col-span-2 flex flex-wrap gap-2">
              ${earners.map(e => `<label class="flex items-center gap-1 text-[10px] text-slate-400">${escapeHtml(e.name || t('demoRole1'))}
                <input type="number" min="0" max="100" step="1" data-focus-key="rec-${item.id}-split-${e.id}" value="${(item.customSplits || {})[e.id] || 0}" oninput="updateRecurringSplitPct(${item.id}, ${e.id}, this.value)" class="w-14 glass-input rounded-lg px-1.5 py-0.5 text-right font-bold">%</label>`).join('')}
            </div>` : ''}
          </div>`;
        container.appendChild(div);
      });
      restoreFocusState(focusState);

      // "who pays" summary
      const summaryEl = document.getElementById('container-recurring-summary');
      if (summaryEl) {
        const { joint, perEarner } = recurringWhoPaysSummary();
        const rows = [`<div class="flex justify-between"><span class="text-slate-400">${t('recSummaryJoint')}</span><strong class="text-white">${fmt(joint)}</strong></div>`]
          .concat(earners.map(e => `<div class="flex justify-between"><span class="text-slate-400">${escapeHtml(e.name || t('demoRole1'))}</span><strong class="text-white">${fmt(perEarner[e.id] || 0)}</strong></div>`));
        summaryEl.innerHTML = rows.join('');
      }
    }

    // =====================================================================
    // Bills & subscriptions: a due-date and reminder layer on top of the SAME
    // state.recurringExpenses list from the household-split feature. Available
    // regardless of household mode — due dates are a general-purpose concept, not
    // a splitting one. Adding/editing an item here (or its due day) NEVER changes
    // state.outflows: that derivation (recomputeOutflowsFromRecurring) stays gated
    // to split mode exactly as before, so nothing about Shared mode's cash-flow
    // calculation is touched by any of this.
    // =====================================================================
    const BILLS_REMINDER_WINDOW_DAYS = 7;

    // Days-in-month aware: day 31 in a 30-day month (or 29/30 in February) clamps
    // down to that month's last day, the same way most billing systems behave.
    function daysInMonth(year, monthIndex) { return new Date(year, monthIndex + 1, 0).getDate(); }
    function clampDueDay(year, monthIndex, day) { return Math.min(day, daysInMonth(year, monthIndex)); }

    // The next occurrence of a monthly due day, on/after today (today counts as
    // "due in 0 days", not rolled to next month). Returns null if no due day is set.
    function getRecurringNextDueDate(item, today) {
      if (!(item.dueDay >= 1 && item.dueDay <= 31)) return null;
      const now = today || new Date();
      const y = now.getFullYear(), m = now.getMonth();
      const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let due = new Date(y, m, clampDueDay(y, m, item.dueDay));
      if (due < todayMid) {
        const nm = m + 1, ny = y + Math.floor(nm / 12), nmMod = ((nm % 12) + 12) % 12;
        due = new Date(ny, nmMod, clampDueDay(ny, nmMod, item.dueDay));
      }
      return due;
    }
    function getRecurringDaysUntilDue(item, today) {
      const due = getRecurringNextDueDate(item, today);
      if (!due) return null;
      const now = today || new Date(), t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return Math.round((due - t) / 86400000);
    }

    // "You have N subscriptions totaling $X/month" (category = subs) and the same
    // for every OTHER recurring item (a "bill"), plus a combined total.
    function getRecurringBillsSummary() {
      const items = state.recurringExpenses || [];
      const subs = items.filter(x => x.category === 'subs');
      const bills = items.filter(x => x.category !== 'subs');
      const sum = (arr) => arr.reduce((s, x) => s + (Number(x.amount) || 0), 0);
      return { subsCount: subs.length, subsTotal: sum(subs), billsCount: bills.length, billsTotal: sum(bills), totalCount: items.length, totalAmount: sum(items) };
    }

    // Every item WITH a due day set, soonest first — this is the "due-date list".
    function getUpcomingRecurringItems() {
      return (state.recurringExpenses || [])
        .filter(x => x.dueDay >= 1 && x.dueDay <= 31)
        .map(x => Object.assign({}, x, { daysUntilDue: getRecurringDaysUntilDue(x) }))
        .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    }
    // Only the ones due soon (the reminder banner's trigger).
    function getDueSoonRecurringItems() {
      return getUpcomingRecurringItems().filter(x => x.daysUntilDue <= BILLS_REMINDER_WINDOW_DAYS);
    }
    function dueInText(days) {
      if (days === 0) return t('billsDueToday');
      if (days === 1) return t('billsDueTomorrow');
      return t('billsDueInDays').replace('{n}', days);
    }

    // ---------- rendering (mode-independent: shown in both Shared and Split) ----------
    function renderBillsSubscriptions() {
      const listEl = document.getElementById('container-bills-list');
      const summaryEl = document.getElementById('bills-summary');
      const bannerEl = document.getElementById('bills-due-soon-banner');
      if (!listEl || !summaryEl) return;

      const s = getRecurringBillsSummary();
      summaryEl.innerHTML = s.totalCount === 0 ? `<p class="text-xs text-slate-400">${t('billsEmpty')}</p>` : `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span class="text-slate-400 block">${t('billsSubsSummary')}</span>
            <strong class="text-white text-sm">${t('billsCountTemplate').replace('{n}', s.subsCount).replace('{amount}', fmt(s.subsTotal))}</strong>
          </div>
          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span class="text-slate-400 block">${t('billsOtherSummary')}</span>
            <strong class="text-white text-sm">${t('billsCountTemplate').replace('{n}', s.billsCount).replace('{amount}', fmt(s.billsTotal))}</strong>
          </div>
        </div>`;

      const dueSoon = getDueSoonRecurringItems();
      if (bannerEl) {
        bannerEl.classList.toggle('hidden', dueSoon.length === 0);
        if (dueSoon.length > 0) {
          const names = dueSoon.slice(0, 3).map(x => `${escapeHtml(x.name || t('recNamePlaceholder'))} (${dueInText(x.daysUntilDue)})`).join(', ');
          bannerEl.innerHTML = `<p class="text-xs text-amber-200">⏰ ${t('billsDueSoonTemplate').replace('{n}', dueSoon.length).replace('{window}', BILLS_REMINDER_WINDOW_DAYS)}: ${names}${dueSoon.length > 3 ? ` ${t('diffMore').replace('{n}', dueSoon.length - 3)}` : ''}</p>`;
        }
      }

      const focusState = saveFocusState();
      listEl.innerHTML = '';
      const upcoming = getUpcomingRecurringItems();
      const noDueDate = (state.recurringExpenses || []).filter(x => !(x.dueDay >= 1 && x.dueDay <= 31));
      upcoming.concat(noDueDate).forEach(item => {
        const div = document.createElement('div');
        const urgent = item.dueDay && item.daysUntilDue <= BILLS_REMINDER_WINDOW_DAYS;
        div.className = `p-2.5 bg-slate-950 rounded-xl border ${urgent ? 'border-amber-500/40' : 'border-slate-800'} space-y-1.5 text-xs`;
        div.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
            <div class="sm:col-span-2">
              <label class="text-[10px] text-slate-400 block font-semibold">${t('reLabelName')}</label>
              <input type="text" data-focus-key="bill-${item.id}-name" value="${escapeHtml(item.name)}" placeholder="${escapeHtml(t('recNamePlaceholder'))}" oninput="updateRecurringExpense(${item.id}, 'name', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-semibold">
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold">${t('recCategory')}</label>
              <select data-focus-key="bill-${item.id}-category" onchange="updateRecurringExpense(${item.id}, 'category', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-semibold">
                ${XLSX_OUTFLOW_KEYS.map(([k, labelKey]) => `<option value="${k}" ${item.category === k ? 'selected' : ''}>${escapeHtml(t(labelKey))}</option>`).join('')}
              </select>
            </div>
            <div class="flex items-end justify-between gap-2">
              <div class="flex-1">
                <label class="text-[10px] text-slate-400 block font-semibold">${t('recAmount')}</label>
                <input type="number" min="0" step="10" data-focus-key="bill-${item.id}-amount" value="${item.amount}" oninput="updateRecurringExpense(${item.id}, 'amount', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold">
              </div>
              <button onclick="removeRecurringExpense(${item.id})" class="text-rose-400 hover:text-rose-300 font-bold p-1" title="${escapeHtml(t('btnDelete'))}">✕</button>
            </div>
          </div>
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              <label class="text-[10px] text-slate-400">${t('billsDueDayLabel')}</label>
              <input type="number" min="1" max="31" step="1" data-focus-key="bill-${item.id}-dueDay" value="${item.dueDay || ''}" placeholder="${t('billsNoDueDate')}" oninput="updateRecurringExpense(${item.id}, 'dueDay', this.value)" class="w-16 glass-input rounded-lg px-2 py-1 text-right font-bold">
            </div>
            ${item.dueDay ? `<span class="text-[10px] ${urgent ? 'text-amber-400 font-bold' : 'text-slate-400'}">${dueInText(item.daysUntilDue)}</span>` : `<span class="text-[10px] text-slate-600">${t('billsNoDueDateHint')}</span>`}
          </div>`;
        listEl.appendChild(div);
      });
      restoreFocusState(focusState);
    }

    // Adds a new item straight into the bills list (name/category/amount/due day —
    // no split fields shown here; those only matter in the split-mode Cash Flow card).
    window.addBillOrSubscription = function() {
      addRecurringExpense();
      renderBillsSubscriptions();
    };

