    /* Auto-sync engine: keeps a live rolling snapshot for the current calendar month */
    function autoSyncCurrentMonthSnapshot(m) {
      if (!state.monthlySnapshots) state.monthlySnapshots = [];

      // Avoid creating auto-snapshots for completely empty baseline sessions before setup
      const hasData = (state.earners && state.earners.length > 0) ||
                      (state.liquidInvestments && state.liquidInvestments.length > 0) ||
                      (state.realEstate && state.realEstate.length > 0) ||
                      m.totalAssets > 0 || m.totalDebts > 0;
      if (!hasData) return;

      const now = new Date();
      const currentMonthKey = now.toISOString().slice(0, 7); // e.g. "2026-09"
      const currentDateStr = now.toISOString().slice(0, 10);
      const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const lang = state.language || 'pt';
      const monthNames = {
        pt: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      };
      const mName = (monthNames[lang] || monthNames.pt)[now.getMonth()];
      // BUGFIX (found while writing test coverage for this function): this label used
      // to be a hand-rolled language ternary, the same bypass-of-t()-and-i18n issue
      // found and fixed in renderCrossoverMilestones (ui/overview.js) — invisible to
      // the translation-completeness tests, and would need its own hand-edit for a
      // 4th language instead of just filling in one more dictionary entry.
      const defaultLabel = t('evoAutoSnapshotLabel').replace('{month}', mName).replace('{year}', now.getFullYear());

      // Search for an existing auto-synced snapshot or an unflagged snapshot for the current month
      let existingIndex = state.monthlySnapshots.findIndex(s => s.autoSynced && s.date && s.date.slice(0, 7) === currentMonthKey);

      if (existingIndex === -1) {
        existingIndex = state.monthlySnapshots.findIndex(s => !s.isManual && s.date && s.date.slice(0, 7) === currentMonthKey);
      }

      const syncPayload = {
        date: currentDateStr,
        time: currentTimeStr,
        netWorth: Math.round(m.netWorth),
        liquidInvestments: Math.round(m.totalLiquidBase),
        totalDebts: Math.round(m.totalDebts),
        totalAssets: Math.round(m.totalAssets),
        savingsRate: parseFloat(m.savingsRate.toFixed(1)),
        autoSynced: true
      };

      if (existingIndex >= 0) {
        const existing = state.monthlySnapshots[existingIndex];
        state.monthlySnapshots[existingIndex] = {
          ...existing,
          ...syncPayload,
          label: existing.label || defaultLabel
        };
      } else {
        state.monthlySnapshots.push({
          id: Date.now(),
          label: defaultLabel,
          ...syncPayload
        });
      }
    }

    function renderCheckinView() {
      const tbody = document.getElementById('table-snapshots-body');
      if (tbody) {
        tbody.innerHTML = '';
        (state.monthlySnapshots || []).slice().reverse().forEach(snap => {
          const tr = document.createElement('tr');
          tr.className = "hover:bg-slate-900/50 transition";
          const autoBadge = snap.autoSynced
            ? `<span class="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">Auto</span>`
            : `<span class="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">Manual</span>`;
          tr.innerHTML = `
            <td class="p-3 font-semibold text-slate-200">${escapeHtml(snap.date)}</td>
            <td class="p-3 text-slate-300 flex items-center">${escapeHtml(snap.label)}${autoBadge}</td>
            <td class="p-3 text-right font-black text-white">${fmt(snap.netWorth)}</td>
            <td class="p-3 text-right text-teal-400 font-bold">${fmt(snap.liquidInvestments)}</td>
            <td class="p-3 text-right text-rose-400 font-bold">${fmt(snap.totalDebts)}</td>
            <td class="p-3 text-center">
              <button onclick="deleteSnapshot(${snap.id})" class="text-rose-400 hover:text-rose-300 font-bold text-xs" title="${t('evoDeleteTitle')}">✕</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }

      const canvas = document.getElementById('chart-checkin-history');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const snaps = (state.monthlySnapshots || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
      const labels = snaps.map(s => s.date);
      const nwData = snaps.map(s => s.netWorth);
      const liqData = snaps.map(s => s.liquidInvestments);

      if (checkinChartInstance) checkinChartInstance.destroy();

      checkinChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: t('evoChartNetWorth'),
              data: nwData,
              borderColor: BRAND.gold,
              backgroundColor: 'rgba(197, 155, 39, 0.10)',
              fill: true,
              tension: 0.3,
              borderWidth: 2
            },
            {
              label: t('evoChartLiquid'),
              data: liqData,
              borderColor: BRAND.greenLight,
              tension: 0.3,
              borderWidth: 1.5,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#94a3b8', font: { size: 10, family: 'Inter' } }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#94a3b8', font: { size: 9 } }
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#94a3b8',
                font: { size: 9 },
                callback: v => (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k')
              }
            }
          }
        }
      });
    }

    window.openAddSnapshotModal = function() {
      document.getElementById('modal-add-snapshot').classList.remove('hidden');
    };

    window.closeAddSnapshotModal = function() {
      document.getElementById('modal-add-snapshot').classList.add('hidden');
    };

    window.confirmAddSnapshot = function() {
      const label = document.getElementById('input-new-snapshot-label').value.trim() || t('snapshotDefaultLabel');
      const m = calculateMetrics();
      const now = new Date();
      const newSnap = {
        id: Date.now(),
        date: now.toISOString().slice(0, 10),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        label: label,
        netWorth: Math.round(m.netWorth),
        liquidInvestments: Math.round(m.totalLiquidBase),
        totalDebts: Math.round(m.totalDebts),
        totalAssets: Math.round(m.totalAssets),
        savingsRate: parseFloat(m.savingsRate.toFixed(1)),
        isManual: true,
        autoSynced: false
      };
      state.monthlySnapshots.push(newSnap);
      closeAddSnapshotModal();
      handleDataUpdate();
    };

    window.deleteSnapshot = function(id) {
      state.monthlySnapshots = state.monthlySnapshots.filter(s => s.id !== id);
      handleDataUpdate();
    };

