    // =====================================================================
    // Debt payoff planner: the card under the debts on the Balance Sheet tab.
    // The engine (buildPlanDebts / compareDebtStrategies) lives in calc/debt-payoff.js.
    // =====================================================================
    let debtPlanChartInstance = null;

    function dpLocale() { return ({ pt: 'pt-BR', es: 'es-ES', en: 'en-US' })[state.language] || 'en-US'; }
    function dpMonthsText(n) {
      const y = Math.floor(n / 12), mo = n % 12, parts = [];
      if (y > 0) parts.push(`${y} ${t(y === 1 ? 'wiYearSing' : 'wiYearPlur')}`);
      if (mo > 0 || y === 0) parts.push(`${mo} ${t(mo === 1 ? 'dpMonthSing' : 'dpMonthPlur')}`);
      return parts.join(' ');
    }
    function dpDateText(n) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() + n, 1);
      return d.toLocaleDateString(dpLocale(), { month: 'short', year: 'numeric' });
    }
    function dpDebtLabel(d) {
      if (d.kind === 'installments') return t('dpDebtInstallments');
      if (d.kind === 'revolving') return t('dpDebtRevolving');
      if (d.kind === 'auto') return t('dpDebtAuto');
      return `${t('dpDebtMortgage')}: ${d.name || ''}`;
    }

    // ---------- editing ----------
    window.updateDebtPlan = function(field, val) {
      state.debtPlan = Object.assign({ extraMonthly: 0, includeMortgages: false, method: 'avalanche', autoEvents: true }, state.debtPlan || {});
      if (field === 'extraMonthly') state.debtPlan.extraMonthly = Math.min(SAN_MONEY_MAX, Math.max(0, parseFloat(val) || 0));
      else if (field === 'includeMortgages') state.debtPlan.includeMortgages = !!val;
      else if (field === 'autoEvents') state.debtPlan.autoEvents = !!val;
      else if (field === 'method') state.debtPlan.method = val === 'snowball' ? 'snowball' : 'avalanche';
      handleDataUpdate();
    };

    window.useSurplusForDebts = function() {
      const surplus = Math.floor(Math.max(0, calculateMetrics().cashDelta));
      const el = document.getElementById('input-dp-extra');
      if (el) el.value = surplus;
      updateDebtPlan('extraMonthly', surplus);
    };

    // rate / payment of one row of the table
    window.updateDebtRow = function(key, field, val) {
      const v = Math.max(0, parseFloat(val) || 0);
      const rate = Math.min(300, v);
      if (key === 'revolving') {
        if (field === 'rate') {
          state.debts.revolvingRatePct = rate;
          const el = document.getElementById('input-debt-revolving-rate'); if (el) el.value = rate;   // same field as the debts card above
        } else state.debts.revolvingMinPayment = v;
      } else if (key === 'auto') {
        if (field === 'rate') {
          state.debts.autoLoansRatePct = rate;
          const el = document.getElementById('input-debt-auto-rate'); if (el) el.value = rate;
        } else state.debts.autoLoansMinPayment = v;
      } else if (key === 'installments') {
        state.debts.parcelasMinPayment = v;
      } else if (key.indexOf('mortgage-') === 0) {
        const p = (state.realEstate || []).find(r => 'mortgage-' + r.id === key);
        if (p) { if (field === 'rate') p.mortgageRatePct = rate; else p.mortgagePayment = v; }
      }
      handleDataUpdate();
    };

    function syncDebtPlanInputs() {
      const p = Object.assign({ extraMonthly: 0, includeMortgages: false, autoEvents: true }, state.debtPlan || {});
      const au = document.getElementById('input-dp-auto'); if (au) au.checked = !!p.autoEvents;
      const ex = document.getElementById('input-dp-extra'); if (ex) ex.value = p.extraMonthly;
      const cb = document.getElementById('input-dp-mortgages'); if (cb) cb.checked = !!p.includeMortgages;
    }

    // ---------- rendering ----------
    function renderDebtPlanner(m) {
      const view = document.getElementById('view-balancesheet');
      const card = document.getElementById('card-debt-planner');
      if (!card || (view && view.classList.contains('hidden'))) return;       // only work when the tab is open
      m = m || calculateMetrics();
      const plan = Object.assign({ extraMonthly: 0, includeMortgages: false, method: 'avalanche' }, state.debtPlan || {});
      const hasMortgage = (state.realEstate || []).some(r => Number(r.mortgageDebt) > 0);
      const rowMort = document.getElementById('row-dp-mortgages'); if (rowMort) rowMort.classList.toggle('hidden', !hasMortgage);
      const surplus = Math.floor(Math.max(0, m.cashDelta));
      const btn = document.getElementById('btn-dp-surplus');
      if (btn) { btn.classList.toggle('hidden', surplus <= 0); btn.innerText = t('dpUseSurplus').replace('{amount}', fmt(surplus)); }

      const debts = buildPlanDebts(state, plan.includeMortgages);
      const focusState = saveFocusState();
      const empty = document.getElementById('dp-empty'), body = document.getElementById('dp-body');
      if (debts.length === 0) {
        if (empty) { empty.classList.remove('hidden'); empty.innerText = t(hasMortgage && !plan.includeMortgages ? 'dpEmptyMortgageOnly' : 'dpEmpty'); }
        if (body) body.classList.add('hidden');
        return;
      }
      if (empty) { empty.classList.add('hidden'); empty.innerText = ''; }   // no stale message left behind
      if (body) body.classList.remove('hidden');

      const cmp = compareDebtStrategies(debts, plan.extraMonthly);
      const ret = m.weightedPortfolioYield;

      // -- the debts and their payments --
      const th = 'p-2.5 text-right';
      const rows = debts.map(d => {
        const risk = d.ratePct > 0 && d.ratePct > ret;
        const monthlyInterest = d.balance * debtMonthlyRate(d.ratePct);
        const belowInterest = d.givenPayment > 0 && d.givenPayment < monthlyInterest - 0.005;
        const rateCell = d.kind === 'installments'
          ? `<span class="text-slate-400">0%</span>`
          : `<input type="number" min="0" max="300" step="0.5" data-focus-key="dp-${d.id}-rate" value="${d.ratePct}" oninput="updateDebtRow('${d.id}', 'rate', this.value)" class="w-20 glass-input rounded-lg px-2 py-1 text-right font-bold">`;
        return `<tr class="border-t border-slate-800/60">
          <td class="p-2.5 text-slate-200">${escapeHtml(dpDebtLabel(d))}
            ${risk ? `<span class="block text-[10px] text-amber-400">⚠ ${t('dpCostsMore').replace('{ret}', ret.toFixed(1))}</span>` : ''}
            ${belowInterest ? `<span class="block text-[10px] text-amber-400">⚠ ${t('dpBelowInterest').replace('{interest}', fmt(monthlyInterest))}</span>` : ''}
          </td>
          <td class="${th} text-white font-semibold">${fmt(d.balance)}</td>
          <td class="${th}">${rateCell}</td>
          <td class="${th}">
            <input type="number" min="0" step="10" data-focus-key="dp-${d.id}-pay" value="${d.givenPayment > 0 ? d.givenPayment : ''}" placeholder="${Math.round(d.payment)}" oninput="updateDebtRow('${d.id}', 'pay', this.value)" class="w-24 glass-input rounded-lg px-2 py-1 text-right font-bold">
            ${d.estimated ? `<span class="block text-[10px] text-slate-400">${t('dpEstimated')}</span>` : ''}
            ${d.derivedFromTerm ? `<span class="block text-[10px] text-slate-400">${t('msSourceTerm')}</span>` : ''}
          </td>
        </tr>`;
      }).join('');
      document.getElementById('dp-table').innerHTML = `<table class="w-full text-xs"><thead class="bg-slate-900/90 text-slate-400 font-semibold"><tr>
        <th class="p-2.5 text-left">${t('dpColDebt')}</th><th class="${th}">${t('dpColBalance')}</th><th class="${th}">${t('dpColRate')}</th><th class="${th}">${t('dpColPayment')}</th></tr></thead><tbody>${rows}</tbody></table>`;

      // -- three strategies side by side --
      const mm = cmp.minimum, sn = cmp.snowball, av = cmp.avalanche;
      const never = t('dpNever');
      const monthsCell = (r) => r.months === null ? `<span class="text-amber-400">${never}</span>` : `${dpMonthsText(r.months)}<span class="block text-[10px] text-slate-400">${dpDateText(r.months)}</span>`;
      const moneyCell = (v) => v === null ? '—' : fmt(v);
      const savedCell = (r) => (r.totalInterest === null || mm.totalInterest === null) ? '—' : fmt(Math.max(0, mm.totalInterest - r.totalInterest));
      const firstCell = (r) => r.firstDoneMonth === null ? '—' : dpMonthsText(r.firstDoneMonth);
      const bestInterest = [sn, av].filter(r => r.totalInterest !== null).sort((a, b) => a.totalInterest - b.totalInterest)[0];
      const bothFinite = sn.totalInterest !== null && av.totalInterest !== null;
      const star = (r) => (bothFinite && r === bestInterest && Math.abs(sn.totalInterest - av.totalInterest) > 0.5) ? ` <span class="text-[10px] text-emerald-400 font-bold">★ ${t('dpBest')}</span>` : '';
      const row = (label, f) => `<tr class="border-t border-slate-800/60"><td class="p-2.5 text-slate-400">${label}</td><td class="${th} text-slate-300">${f(mm)}</td><td class="${th} text-slate-200 font-semibold">${f(sn)}</td><td class="${th} text-gold-300 font-black">${f(av)}</td></tr>`;
      document.getElementById('dp-compare').innerHTML = `<table class="w-full text-xs"><thead class="bg-slate-900/90 text-slate-400 font-semibold"><tr>
        <th class="p-2.5 text-left">&nbsp;</th>
        <th class="${th}">${t('dpColMinOnly')}</th>
        <th class="${th}">${t('dpColSnowball')}${star(sn)}<span class="block text-[10px] font-normal text-slate-400">${t('dpSnowballDesc')}</span></th>
        <th class="${th} text-gold-300">${t('dpColAvalanche')}${star(av)}<span class="block text-[10px] font-normal text-slate-400">${t('dpAvalancheDesc')}</span></th></tr></thead><tbody>
        ${row(t('dpRowDebtFree'), monthsCell)}${row(t('dpRowInterest'), r => moneyCell(r.totalInterest))}${row(t('dpRowSaved'), savedCell)}${row(t('dpRowFirst'), firstCell)}${row(t('dpRowTotalPaid'), r => moneyCell(r.totalPaid))}
        </tbody></table>`;

      // -- verdict in plain language --
      const lines = [];
      if (av.months === null && sn.months === null) {
        lines.push({ tone: 'warn', text: t('dpVerdictNever') });
      } else {
        const diff = (sn.totalInterest !== null && av.totalInterest !== null) ? sn.totalInterest - av.totalInterest : null;
        if (diff !== null) {
          if (diff > Math.max(1, av.totalInterest * 0.005)) {
            lines.push({ tone: 'good', text: t('dpVerdictAvalancheBetter').replace('{saved}', fmt(diff)) });
            if (sn.firstDoneMonth !== null && av.firstDoneMonth !== null && sn.firstDoneMonth < av.firstDoneMonth) {
              lines.push({ tone: 'info', text: t('dpVerdictSnowballWin').replace('{first}', dpMonthsText(sn.firstDoneMonth)).replace('{n}', dpMonthsText(av.firstDoneMonth - sn.firstDoneMonth)) });
            }
          } else {
            lines.push({ tone: 'info', text: t('dpVerdictSimilar').replace('{diff}', fmt(Math.max(0, diff))) });
          }
        }
        const best = (bestInterest || av);
        if (mm.months === null && best.months !== null) lines.push({ tone: 'good', text: t('dpVerdictMinNever').replace('{time}', dpMonthsText(best.months)) });
        else if (best.months !== null && mm.months !== null && (plan.extraMonthly > 0 || best.months < mm.months)) {
          lines.push({ tone: 'good', text: t('dpVerdictSaved').replace('{months}', dpMonthsText(Math.max(0, mm.months - best.months))).replace('{interest}', fmt(Math.max(0, mm.totalInterest - best.totalInterest))) });
        }
      }
      // What the automatic Life events do: the freed payments go to investing once everything is cleared
      const freed = buildDebtPlanEvents(state).find(e => e.id === -2);
      if (freed) {
        lines.push({ tone: 'info', text: t('dpVerdictFreed').replace('{amount}', fmt(freed.amount)).replace('{date}', dpDateText(freed.fromMonth)) });
        const off = JSON.parse(JSON.stringify(state)); off.debtPlan.autoEvents = false;
        const y1 = m.yearsToCrossover, y0 = calculateMetricsFor(off).yearsToCrossover;
        if (y1 !== null && y0 === null) lines.push({ tone: 'good', text: t('dpVerdictFreedReaches') });
        else if (y1 !== null && y0 !== null && y1 !== y0) lines.push({ tone: y1 < y0 ? 'good' : 'warn', text: t(y1 < y0 ? 'dpVerdictFreedEarlier' : 'dpVerdictFreedLater').replace('{years}', wiYearsText(Math.abs(y0 - y1))) });
      }
      if (!(plan.extraMonthly > 0)) lines.push({ tone: 'info', text: t('dpVerdictNoExtra') });
      const cls = { good: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200', warn: 'border-amber-500/40 bg-amber-950/30 text-amber-200', info: 'border-slate-700 bg-slate-950 text-slate-300' };
      document.getElementById('dp-verdict').innerHTML = lines.map(l => `<p class="p-3 rounded-xl border text-xs leading-relaxed ${cls[l.tone]}">${escapeHtml(l.text)}</p>`).join('');

      // -- payoff order of the chosen strategy --
      const chosen = plan.method === 'snowball' ? sn : av;
      const byId = {}; debts.forEach(d => { byId[d.id] = d; });
      const order = chosen.payoffs.slice().sort((a, b) => ((a.month === null ? 1e9 : a.month) - (b.month === null ? 1e9 : b.month)));
      const tab = (key, label) => `<button onclick="updateDebtPlan('method', '${key}')" class="px-2.5 py-1 rounded-full border ${plan.method === key || (key === 'avalanche' && plan.method !== 'snowball') ? 'border-gold-500 bg-gold-500/15 text-gold-300 font-bold' : 'border-slate-700 text-slate-400'} transition">${label}</button>`;
      document.getElementById('dp-order').innerHTML = `
        <div class="flex flex-wrap items-center gap-2 text-[11px] mb-2"><span class="text-slate-400 font-semibold">${t('dpOrderTitle')}</span>${tab('avalanche', t('dpColAvalanche'))}${tab('snowball', t('dpColSnowball'))}</div>
        <ol class="space-y-1.5 text-xs">${order.map((p, i) => `<li class="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between gap-2">
          <span class="text-slate-200"><strong class="text-gold-400">${i + 1}.</strong> ${escapeHtml(dpDebtLabel(byId[p.id]))}</span>
          <span class="text-slate-400 text-right">${p.month === null ? never : `${t('dpClearedIn')} ${dpMonthsText(p.month)} (${dpDateText(p.month)})`} · ${t('dpInterestPaid')} ${fmt(p.interest)}</span></li>`).join('')}</ol>`;

      // -- balance over time --
      const finite = [mm, sn, av].filter(r => r.months !== null).map(r => r.months);
      const horizon = Math.min(DEBT_PLAN_MAX_MONTHS, Math.max(12, finite.length ? Math.max.apply(null, finite) : 120));
      const labels = Array.from({ length: horizon + 1 }, (_, i) => i);
      const pick = (r) => labels.map(i => Math.round(i < r.series.length ? r.series[i] : 0));
      const canvas = document.getElementById('chart-debt-plan');
      if (canvas) {
        if (debtPlanChartInstance) debtPlanChartInstance.destroy();
        debtPlanChartInstance = new Chart(canvas.getContext('2d'), {
          type: 'line',
          data: { labels, datasets: [
            { label: t('dpColMinOnly'), data: pick(mm), borderColor: '#94a3b8', borderDash: [5, 4], borderWidth: 1.6, pointRadius: 0, fill: false, tension: 0.2 },
            { label: t('dpColSnowball'), data: pick(sn), borderColor: BRAND.greenLight, borderWidth: 2, pointRadius: 0, fill: false, tension: 0.2 },
            { label: t('dpColAvalanche'), data: pick(av), borderColor: BRAND.gold, backgroundColor: 'rgba(197, 155, 39, 0.10)', borderWidth: 2.5, pointRadius: 0, fill: true, tension: 0.2 }
          ] },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10, family: 'Inter' } } } },
            scales: {
              x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, autoSkip: false, callback: (v, i) => (i % 12 === 0 ? `${i / 12} ${t('dpYearsShort')}` : '') } },
              y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, callback: v => (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k') } }
            }
          }
        });
      }
      restoreFocusState(focusState);
    }

