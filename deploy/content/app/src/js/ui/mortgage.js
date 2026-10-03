    // =====================================================================
    // Mortgage card (Balance Sheet tab): the schedule and "prepay or invest?".
    // The engine (buildAmortization / comparePrepayInvest) lives in calc/mortgage.js and the
    // payment resolution (entered > remaining term > estimate) in calc/debt-payoff.js.
    // =====================================================================
    let mortgageBalanceChartInstance = null, mortgageWealthChartInstance = null;

    function msProps() { return (state.realEstate || []).filter(r => Number(r.mortgageDebt) > 0); }
    function msPlan() { return Object.assign({ propertyId: null, extraMonthly: 0, lumpSum: 0, returnPct: null, taxPct: 0, horizonYears: 0 }, state.mortgagePlan || {}); }
    function msSelected() {
      const list = msProps(), id = msPlan().propertyId;
      return list.find(r => r.id === id) || list[0] || null;
    }
    const msChartTicks = { color: '#94a3b8', font: { size: 9 }, autoSkip: false };

    // ---------- editing ----------
    window.updateMortgagePlan = function(field, val) {
      const p = msPlan();
      if (field === 'propertyId') p.propertyId = Math.floor(Number(val)) || null;
      else if (field === 'extraMonthly') p.extraMonthly = Math.min(SAN_MONEY_MAX, Math.max(0, parseFloat(val) || 0));
      else if (field === 'lumpSum') p.lumpSum = Math.min(SAN_MONEY_MAX, Math.max(0, parseFloat(val) || 0));
      else if (field === 'returnPct') p.returnPct = (val === '' || val === null || val === undefined) ? null : Math.min(60, Math.max(0, parseFloat(val) || 0));
      else if (field === 'taxPct') p.taxPct = Math.min(60, Math.max(0, parseFloat(val) || 0));
      else if (field === 'horizonYears') p.horizonYears = Math.min(50, Math.max(0, Math.round(parseFloat(val)) || 0));
      state.mortgagePlan = p;
      handleDataUpdate();
    };

    // rate / payment / remaining term of the SELECTED property (the same fields as the Debt planner table)
    window.updateMortgageTerms = function(field, val) {
      const r = msSelected();
      if (!r) return;
      const v = Math.max(0, parseFloat(val) || 0);
      if (field === 'rate') r.mortgageRatePct = Math.min(300, v);
      else if (field === 'pay') r.mortgagePayment = v;
      else if (field === 'term') r.mortgageTermYears = Math.min(60, v);
      handleDataUpdate();
    };

    function syncMortgageInputs() {
      const p = msPlan();
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
      set('input-ms-extra', p.extraMonthly);
      set('input-ms-lump', p.lumpSum);
      set('input-ms-return', p.returnPct === null ? '' : p.returnPct);
      set('input-ms-tax', p.taxPct);
      set('input-ms-horizon', p.horizonYears > 0 ? p.horizonYears : '');
    }

    // ---------- rendering ----------
    function renderMortgageCard(m) {
      const view = document.getElementById('view-balancesheet');
      const card = document.getElementById('card-mortgage');
      if (!card || (view && view.classList.contains('hidden'))) return;       // only work when the tab is open
      m = m || calculateMetrics();
      const list = msProps();
      const empty = document.getElementById('ms-empty'), body = document.getElementById('ms-body');
      if (list.length === 0) {
        if (empty) { empty.classList.remove('hidden'); empty.innerText = t('msEmpty'); }
        if (body) body.classList.add('hidden');
        return;
      }
      if (empty) { empty.classList.add('hidden'); empty.innerText = ''; }
      if (body) body.classList.remove('hidden');

      const r = msSelected(), plan = msPlan();
      const focusState = saveFocusState();
      const rowProp = document.getElementById('row-ms-property'), sel = document.getElementById('select-mortgage-property');
      if (rowProp) rowProp.classList.toggle('hidden', list.length < 2);
      if (sel) {
        sel.innerHTML = list.map(p => `<option value="${p.id}" ${p.id === r.id ? 'selected' : ''}>${escapeHtml(p.name || '')}</option>`).join('');
        sel.value = String(r.id);
      }
      const terms = resolveMortgageTerms(r, state);
      const cur = escapeHtml(r.currency || state.baseCurrency);
      const fxToBase = convertToBase(1, r.currency || state.baseCurrency) || 1;   // the input is in the property's currency

      // -- the terms (rate, payment, remaining term) --
      const sourceText = { entered: t('msSourceEntered'), term: t('msSourceTerm'), estimated: t('msSourceEstimated') }[terms.source];
      document.getElementById('ms-terms').innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div class="space-y-0.5">
            <span class="text-[10px] text-slate-400 block">${t('msRate')}</span>
            <input type="number" min="0" max="300" step="0.1" data-focus-key="ms-rate" value="${r.mortgageRatePct || 0}" oninput="updateMortgageTerms('rate', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold">
            ${terms.ratePct === 0 ? `<span class="block text-[10px] text-amber-400">⚠ ${t('msRateHint')}</span>` : ''}
          </div>
          <div class="space-y-0.5">
            <span class="text-[10px] text-slate-400 block">${t('msPayment')} (${cur})</span>
            <input type="number" min="0" step="10" data-focus-key="ms-pay" value="${r.mortgagePayment > 0 ? r.mortgagePayment : ''}" placeholder="${Math.round(terms.payment / fxToBase)}" oninput="updateMortgageTerms('pay', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold">
            <span class="block text-[10px] ${terms.source === 'estimated' ? 'text-amber-400' : 'text-slate-400'}">${sourceText}</span>
          </div>
          <div class="space-y-0.5">
            <span class="text-[10px] text-slate-400 block">${t('msTerm')}</span>
            <input type="number" min="0" max="60" step="0.5" data-focus-key="ms-term" value="${r.mortgageTermYears > 0 ? r.mortgageTermYears : ''}" placeholder="—" oninput="updateMortgageTerms('term', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold">
          </div>
        </div>`;

      // -- the schedule --
      const base = buildAmortization(terms.balance, terms.ratePct, terms.payment);
      const firstInterest = terms.balance * debtMonthlyRate(terms.ratePct);
      const box = (label, value, sub) => `<div class="p-3 bg-slate-950 rounded-xl border border-slate-800"><span class="text-[10px] text-slate-400 block">${label}</span><strong class="text-white text-sm font-black">${value}</strong>${sub ? `<span class="block text-[10px] text-slate-400">${sub}</span>` : ''}</div>`;
      const never = base.months === null;
      document.getElementById('ms-warn').innerHTML = never
        ? `<p class="p-3 rounded-xl border text-xs leading-relaxed border-amber-500/40 bg-amber-950/30 text-amber-200">${escapeHtml(t('msNeverPays').replace('{interest}', fmt(firstInterest)))}</p>` : '';
      document.getElementById('ms-summary').innerHTML =
        box(t('msSumBalance'), fmt(terms.balance)) +
        box(t('msSumPayment'), `${fmt(terms.payment)} ${t('perMonth')}`) +
        box(t('msSumEnd'), never ? t('dpNever') : dpMonthsText(base.months), never ? '' : dpDateText(base.months)) +
        box(t('msSumInterest'), never ? '—' : fmt(base.totalInterest), never ? '' : `${(base.totalInterest / terms.balance * 100).toFixed(0)}% ${t('msOfLoan')}`) +
        box(t('msSumFirst'), `${terms.payment > 0 ? (Math.min(100, firstInterest / terms.payment * 100)).toFixed(0) : 0}%`, t('msSumFirstSub'));
      const years = summarizeAmortizationByYear(base.rows);
      const th = 'p-2.5 text-right';
      document.getElementById('ms-schedule').innerHTML = `<table class="w-full text-xs"><thead class="bg-slate-900/90 text-slate-400 font-semibold sticky top-0"><tr>
        <th class="p-2.5 text-left">${t('msColYear')}</th><th class="${th}">${t('msColPaid')}</th><th class="${th}">${t('msColInterest')}</th><th class="${th}">${t('msColPrincipal')}</th><th class="${th}">${t('msColBalance')}</th></tr></thead><tbody>${
        years.map(y => `<tr class="border-t border-slate-800/60"><td class="p-2.5 text-slate-300">${new Date().getFullYear() + y.year}</td><td class="${th} text-slate-200">${fmt(y.payment)}</td><td class="${th} text-amber-400">${fmt(y.interest)}</td><td class="${th} text-emerald-400">${fmt(y.principal)}</td><td class="${th} text-white font-semibold">${fmt(y.balance)}</td></tr>`).join('') || `<tr><td class="p-3 text-slate-400" colspan="5">—</td></tr>`}</tbody></table>`;

      // -- prepay vs invest --
      const returnPct = plan.returnPct === null ? m.weightedPortfolioYield : plan.returnPct;
      const retInput = document.getElementById('input-ms-return');
      if (retInput) retInput.placeholder = t('msReturnAuto').replace('{pct}', m.weightedPortfolioYield.toFixed(1));
      const hasAmount = plan.extraMonthly > 0 || plan.lumpSum > 0;
      const wrap = document.getElementById('ms-compare-wrap');
      if (wrap) wrap.classList.toggle('hidden', !hasAmount);
      const lines = [];
      const tone = { good: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200', warn: 'border-amber-500/40 bg-amber-950/30 text-amber-200', info: 'border-slate-700 bg-slate-950 text-slate-300' };
      let cmp = null;
      if (!hasAmount) {
        lines.push({ tone: 'info', text: t('msVerdictNothing') });
      } else {
        cmp = comparePrepayInvest({ balance: terms.balance, ratePct: terms.ratePct, payment: terms.payment, extraMonthly: plan.extraMonthly, lumpSum: plan.lumpSum,
          returnPct, taxPct: plan.taxPct, horizonMonths: plan.horizonYears * 12, inflationPct: state.inflationRate });
        const p = cmp.prepay, iv = cmp.invest, H = cmp.horizonMonths;
        const tol = Math.max(1, 0.0025 * Math.max(Math.abs(p.wealth), Math.abs(iv.wealth)));
        const v = { years: dpMonthsText(H), rate: terms.ratePct.toFixed(1), ret: cmp.returnNetPct.toFixed(1) };
        if (Math.abs(cmp.difference) <= tol) lines.push({ tone: 'info', text: t('msVerdictEqual').replace('{diff}', fmt(Math.abs(cmp.difference))) });
        else if (cmp.difference < 0) lines.push({ tone: 'good', text: t('msVerdictPrepay').replace('{diff}', fmt(-cmp.difference)).replace('{years}', v.years) });
        else lines.push({ tone: 'good', text: t('msVerdictInvest').replace('{diff}', fmt(cmp.difference)).replace('{years}', v.years) });
        lines.push({ tone: 'info', text: t('msVerdictGuaranteed').replace('{rate}', v.rate).replace('{ret}', v.ret) });
        if (terms.ratePct === 0) lines.push({ tone: 'warn', text: t('msRateHint') });
        lines.push({ tone: 'info', text: t('msVerdictCaveats') });
      }
      document.getElementById('ms-verdict').innerHTML = lines.map(l => `<p class="p-3 rounded-xl border text-xs leading-relaxed ${tone[l.tone]}">${escapeHtml(l.text)}</p>`).join('');

      if (cmp) {
        const p = cmp.prepay, iv = cmp.invest, H = cmp.horizonMonths;
        const owedAtH = H <= base.rows.length && H > 0 ? base.rows[H - 1].balance : (base.months === null ? terms.balance : 0);
        const best = p.wealth > iv.wealth ? 'p' : 'i', star = (k) => (Math.abs(cmp.difference) > 1 && best === k) ? ` <span class="text-[10px] text-emerald-400 font-bold">★</span>` : '';
        const free = (mo) => mo === null ? `<span class="text-amber-400">${t('dpNever')}</span>` : (mo === 0 ? t('wiAlreadyFree') : `${dpMonthsText(mo)}<span class="block text-[10px] text-slate-400">${dpDateText(mo)}</span>`);
        const row = (label, a, b, c, strong) => `<tr class="border-t border-slate-800/60 ${strong ? 'bg-slate-900/40' : ''}"><td class="p-2.5 text-slate-400">${label}</td><td class="${th} text-slate-300">${a}</td><td class="${th} text-slate-200 font-semibold">${b}</td><td class="${th} text-gold-300 font-black">${c}</td></tr>`;
        document.getElementById('ms-compare').innerHTML = `<table class="w-full text-xs"><thead class="bg-slate-900/90 text-slate-400 font-semibold"><tr>
          <th class="p-2.5 text-left">&nbsp;</th><th class="${th}">${t('msColDoNothing')}</th><th class="${th}">${t('msColPrepay')}${star('p')}</th><th class="${th} text-gold-300">${t('msColInvest')}${star('i')}</th></tr></thead><tbody>
          ${row(t('msRowFree'), free(cmp.baseline.months), free(p.freeMonth), free(iv.freeMonth))}
          ${row(t('msRowInterest'), fmt(cmp.baseline.interestToHorizon), fmt(p.interest), fmt(iv.interest))}
          ${row(t('msRowInvested'), '—', fmt(p.investments), fmt(iv.investments))}
          ${row(t('msRowOwed'), fmt(owedAtH), fmt(p.owed), fmt(iv.owed))}
          ${row(t('msRowWealth'), '—', fmt(p.wealth), fmt(iv.wealth), true)}
          ${row(t('msRowReal'), '—', fmt(p.wealthReal), fmt(iv.wealthReal))}
          </tbody></table>`;
        // wealth chart
        const labels = Array.from({ length: H + 1 }, (_, k) => k), rnd = (a) => a.map(Math.round);
        const wc = document.getElementById('chart-mortgage-wealth');
        if (wc) {
          if (mortgageWealthChartInstance) mortgageWealthChartInstance.destroy();
          mortgageWealthChartInstance = new Chart(wc.getContext('2d'), {
            type: 'line',
            data: { labels, datasets: [
              { label: t('msChartWealthPrepay'), data: rnd(p.series), borderColor: BRAND.greenLight, borderWidth: 2, pointRadius: 0, fill: false, tension: 0.2 },
              { label: t('msChartWealthInvest'), data: rnd(iv.series), borderColor: BRAND.gold, backgroundColor: 'rgba(197, 155, 39, 0.10)', borderWidth: 2.5, pointRadius: 0, fill: false, tension: 0.2 }
            ] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10, family: 'Inter' } } } },
              scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: Object.assign({}, msChartTicks, { callback: (v, k) => (k % 12 === 0 ? `${k / 12} ${t('dpYearsShort')}` : '') }) },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, callback: v => (Math.abs(v) >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k') } } } }
          });
        }
      }

      // -- balance over time: as scheduled vs. with the extra money --
      const withExtra = hasAmount ? buildAmortization(terms.balance, terms.ratePct, terms.payment, { extraMonthly: plan.extraMonthly, lumpSum: plan.lumpSum }) : null;
      const horizon = Math.max(12, base.months === null ? 120 : base.months);
      const labels = Array.from({ length: horizon + 1 }, (_, k) => k);
      const series = (a, lump) => labels.map(k => Math.round(k === 0 ? terms.balance - (lump || 0) : (k <= a.rows.length ? a.rows[k - 1].balance : 0)));
      const bc = document.getElementById('chart-mortgage-balance');
      if (bc) {
        if (mortgageBalanceChartInstance) mortgageBalanceChartInstance.destroy();
        const sets = [{ label: t('msChartBalance'), data: series(base), borderColor: '#94a3b8', borderWidth: 2, pointRadius: 0, fill: false, tension: 0.2 }];
        if (withExtra) sets.push({ label: t('msChartBalancePrepay'), data: series(withExtra, withExtra.lumpApplied), borderColor: BRAND.gold, backgroundColor: 'rgba(197, 155, 39, 0.10)', borderWidth: 2.5, pointRadius: 0, fill: true, tension: 0.2 });
        mortgageBalanceChartInstance = new Chart(bc.getContext('2d'), {
          type: 'line', data: { labels, datasets: sets },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10, family: 'Inter' } } } },
            scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: Object.assign({}, msChartTicks, { callback: (v, k) => (k % 12 === 0 ? `${k / 12} ${t('dpYearsShort')}` : '') }) },
                      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, callback: v => (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k') } } } }
        });
      }
      restoreFocusState(focusState);
    }

