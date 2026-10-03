    function renderBudgetMatrix(m) {
      const tbody = document.getElementById('table-budget-matrix-body');
      if (!tbody) return;
      tbody.innerHTML = '';

      // BUGFIX (found while writing test coverage for this function): this used to
      // hardcode its own 8-row list, predating elderCare/charitableGiving (added later
      // alongside the other 8 as part of the full 10-category outflow model). Someone's
      // elder-care or charitable-giving spending was counted correctly everywhere else
      // (cash flow totals, the Financial Security Score, Excel export) but silently never
      // shown in this one comparison table. Now built from XLSX_OUTFLOW_KEYS — the SAME
      // canonical category list the Excel export and recurring-expense category dropdown
      // already use — so a future 11th category only needs to be added in one place.
      const rows = XLSX_OUTFLOW_KEYS.map(([key, labelKey]) => ({ key, label: t(labelKey), actual: state.outflows[key] || 0 }));

      rows.forEach(r => {
        const target = state.budgetTargets[r.key] || 0;
        const diff = target - r.actual;
        const isUnder = diff >= 0;
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-900/50 transition";
        tr.innerHTML = `
          <td class="p-3 font-semibold text-slate-200">${r.label}</td>
          <td class="p-3 text-right">
            <input type="number" value="${target}" oninput="updateBudgetTarget('${r.key}', this.value)" class="w-24 glass-input rounded-lg px-2 py-0.5 text-right font-bold text-xs">
          </td>
          <td class="p-3 text-right font-bold text-white">${fmt(r.actual)}</td>
          <td class="p-3 text-right font-bold ${isUnder ? 'text-emerald-400' : 'text-rose-400'}">
            ${isUnder ? '+' : ''}${fmt(diff)}
          </td>
          <td class="p-3 text-center">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isUnder ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}">
              ${isUnder ? t('budgetWithin') : t('budgetExceeded')}
            </span>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    window.updateBudgetTarget = function(key, val) {
      if (!state.budgetTargets) state.budgetTargets = {};
      state.budgetTargets[key] = parseFloat(val) || 0;
      handleDataUpdate();
    };

    window.copyActualsToBudget = function() {
      state.budgetTargets = Object.assign({}, state.outflows);
      handleDataUpdate();
    };

