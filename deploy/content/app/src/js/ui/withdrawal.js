    // =====================================================================
    // Withdrawal phase card (Retirement tab): taxes on withdrawals, a year-by-year drawdown
    // under three withdrawal orders, the tax-adjusted freedom target, and the allocation.
    // The engine lives in calc/withdrawal.js.
    // =====================================================================
    let withdrawalChartInstance = null;

    function wdPlan() {
      return Object.assign({ startAge: 0, untilAge: 95, pensionStartAge: 65, monthlySpending: null, order: 'taxable_first', realReturnPct: null,
                             brGainsPct: 15, brPensionPct: 10, glGainsPct: 15, safeBucketYears: 3, applyToTarget: false }, state.withdrawalPlan || {});
    }

    // ---------- editing ----------
    window.updateWithdrawalPlan = function(field, val) {
      const p = wdPlan(), num = (v) => parseFloat(v);
      const orNull = (v, lo, hi) => (v === '' || v === null || v === undefined || !isFinite(num(v))) ? null : Math.min(hi, Math.max(lo, num(v)));
      if (field === 'startAge') p.startAge = Math.min(100, Math.max(0, Math.round(num(val)) || 0));
      else if (field === 'untilAge') p.untilAge = Math.min(110, Math.max(60, Math.round(num(val)) || 95));
      else if (field === 'pensionStartAge') p.pensionStartAge = Math.min(80, Math.max(50, Math.round(num(val)) || 65));
      else if (field === 'monthlySpending') p.monthlySpending = orNull(val, 0, SAN_MONEY_MAX);
      else if (field === 'realReturnPct') p.realReturnPct = orNull(val, -10, 30);
      else if (field === 'order') p.order = ['taxable_first', 'deferred_first', 'proportional'].includes(val) ? val : 'taxable_first';
      else if (field === 'brGainsPct' || field === 'brPensionPct' || field === 'glGainsPct') p[field] = Math.min(60, Math.max(0, num(val) || 0));
      else if (field === 'safeBucketYears') p.safeBucketYears = Math.min(10, Math.max(0, num(val) || 0));
      else if (field === 'applyToTarget') p.applyToTarget = !!val;
      state.withdrawalPlan = p;
      handleDataUpdate();
    };

    function syncWithdrawalInputs() {
      const p = wdPlan();
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
      set('input-wd-start', p.startAge > 0 ? p.startAge : '');
      set('input-wd-until', p.untilAge);
      set('input-wd-pension-age', p.pensionStartAge);
      set('input-wd-spending', p.monthlySpending === null ? '' : p.monthlySpending);
      set('input-wd-order', p.order);
      set('input-wd-return', p.realReturnPct === null ? '' : p.realReturnPct);
      set('input-wd-br-gains', p.brGainsPct);
      set('input-wd-br-pension', p.brPensionPct);
      set('input-wd-gl-gains', p.glGainsPct);
      set('input-wd-safe', p.safeBucketYears);
      const cb = document.getElementById('input-wd-apply'); if (cb) cb.checked = !!p.applyToTarget;
    }

    // The portfolio as it will be when withdrawals start: grown (and contributed to) until then, with
    // the same mix. New contributions add cost basis (they are not gains); growth adds gains.
    function projectBucketsToStart(now, startTotal, contributions, fallbackYield) {
      const total = wdTotal(now), out = cloneBuckets(now);
      if (!(startTotal > 0)) { Object.keys(out).forEach(k => { out[k].bal = 0; out[k].basis = 0; }); return out; }
      if (total > 0) {
        const f = startTotal / total;
        Object.keys(out).forEach(k => {
          const share = now[k].bal / total;
          out[k].bal = now[k].bal * f;
          out[k].basis = (k === 'taxable' || k === 'defGains') ? Math.min(out[k].bal, now[k].basis + share * contributions) : 0;
        });
      } else {
        out.taxable = { bal: startTotal, basis: Math.min(startTotal, Math.max(0, contributions)), yield: fallbackYield, yieldSum: 0 };
      }
      return out;
    }

    function wdAgeText(r, until) { return r.depletedAge !== null ? `${t('wdLastsAt')} ${r.depletedAge}` : `${t('wdLastsBeyond')} ${until}`; }

    window.updateTargetRiskyAllocation = function(val) {
      const v = Math.min(100, Math.max(0, Math.round(parseFloat(val)) || 0));
      state.targetRiskyAllocationPct = v;
      handleDataUpdate();
    };

    // ---------- rendering ----------
    function renderWithdrawalPhase(m) {
      const view = document.getElementById('view-retirement');
      const card = document.getElementById('card-withdrawal');
      if (!card || (view && view.classList.contains('hidden'))) return;       // only work when the tab is open
      m = m || calculateMetrics();
      const p = wdPlan(), country = state.country || 'BR';
      const rowBr = document.getElementById('row-wd-br'), rowGl = document.getElementById('row-wd-gl'), rowEs = document.getElementById('row-wd-es');
      if (rowBr) rowBr.classList.toggle('hidden', country !== 'BR');
      if (rowGl) rowGl.classList.toggle('hidden', country !== 'GL');
      if (rowEs) { rowEs.classList.toggle('hidden', country !== 'ES'); rowEs.innerHTML = t('wdEsNote') + taxRulesBadge('ES_SAVINGS'); }

      const primaryAge = (state.earners && state.earners.length > 0) ? (Number(state.earners[0].age) || 35) : 35;
      const freedomAge = m.yearsToCrossover === null ? null : primaryAge + m.yearsToCrossover;
      const retireAge = Number(state.traditionalRetirementAge) > 0 ? Number(state.traditionalRetirementAge) : 65;
      const startAge = p.startAge > 0 ? p.startAge : (freedomAge !== null ? freedomAge : retireAge);
      const untilAge = Math.max(startAge + 1, p.untilAge);
      const yearsToStart = Math.min(60, Math.max(0, startAge - primaryAge));
      const spending = (p.monthlySpending === null ? m.postKidsMonthlyLivingCost : p.monthlySpending) * 12;
      const pension = Math.max(0, m.expectedMonthlyGovPension) * 12;
      const startSim = simulateRealPortfolio({ start: m.totalLiquidBase, monthlyInvest: m.monthlyInvest, years: yearsToStart, realReturn: m.realAnnualReturn,
        careerGrowthRate: m.careerGrowthRate, careerGrowthProportional: m.careerGrowthProportional, events: m.lifeEvents, surplus: m.monthlySurplus });
      const pStart = startSim.values[yearsToStart];
      let contributions = 0;
      for (let y = 0; y < yearsToStart; y++) contributions += 12 * getProjectedMonthlyContribution(m.monthlyInvest, y, m.careerGrowthRate, m.careerGrowthProportional);
      const buckets = projectBucketsToStart(buildWithdrawalBuckets(state), pStart, contributions, m.weightedPortfolioYield);
      const cfg = wdTaxConfig(state);
      const run = (order) => simulateWithdrawalPhase({ buckets, order, cfg, years: untilAge - startAge, startAge, spending, pension, pensionStartAge: p.pensionStartAge,
        realReturnPct: p.realReturnPct, inflationPct: state.inflationRate });
      const orders = ['proportional', 'taxable_first', 'deferred_first'];
      const res = {}; orders.forEach(o => { res[o] = run(o); });
      const chosen = res[p.order] || res.taxable_first;
      const th = 'p-2.5 text-right';

      // -- year 1 --
      const f = chosen.first;
      const box = (label, value, sub) => `<div class="p-3 bg-slate-950 rounded-xl border border-slate-800"><span class="text-[10px] text-slate-400 block">${label}</span><strong class="text-white text-sm font-black">${value}</strong>${sub ? `<span class="block text-[10px] text-slate-400">${sub}</span>` : ''}</div>`;
      const lines = [];
      const tone = { good: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200', warn: 'border-amber-500/40 bg-amber-950/30 text-amber-200', info: 'border-slate-700 bg-slate-950 text-slate-300' };
      if (!(pStart > 0) || !f) {
        document.getElementById('wd-summary').innerHTML = '';
        lines.push({ tone: 'warn', text: t('wdVerdictNoPortfolio').replace('{age}', startAge) });
      } else {
        const effRate = f.gross > 0 ? f.tax / f.gross * 100 : 0;
        document.getElementById('wd-summary').innerHTML =
          box(t('wdSumPortfolio').replace('{age}', startAge), fmt(pStart), yearsToStart > 0 ? `${t('wdInTodays')}` : '') +
          box(t('wdSumNet'), fmt(f.need), pension > 0 ? t('wdSumNetSub').replace('{age}', p.pensionStartAge) : '') +
          box(t('wdSumGross'), fmt(f.gross)) + box(t('wdSumTax'), fmt(f.tax), `${effRate.toFixed(1)}% ${t('wdOfWithdrawal')}`) +
          box(t('wdSumWr'), `${(f.gross / pStart * 100).toFixed(2)}%`, t('wdSumWrSub'));
        lines.push({ tone: 'info', text: t('wdVerdictYear1').replace('{net}', fmt(f.need)).replace('{gross}', fmt(f.gross)).replace('{tax}', fmt(f.tax)).replace('{rate}', effRate.toFixed(1)).replace('{age}', startAge) });
        if (chosen.depletedAge !== null) lines.push({ tone: 'warn', text: t('wdVerdictDepleted').replace('{age}', chosen.depletedAge) });
        else lines.push({ tone: 'good', text: t('wdVerdictLasts').replace('{until}', untilAge).replace('{end}', fmt(chosen.endBalance)) });
        // does the order matter?
        const ranked = orders.map(o => ({ o, r: res[o] })).sort((a, b) => (b.r.lastsUntilAge - a.r.lastsUntilAge) || (b.r.endBalance - a.r.endBalance));
        const best = ranked[0], worst = ranked[ranked.length - 1];
        const gap = worst.r.totalTax - best.r.totalTax;
        if (best.r.lastsUntilAge === worst.r.lastsUntilAge && Math.abs(best.r.endBalance - worst.r.endBalance) < Math.max(1, 0.002 * pStart)) lines.push({ tone: 'info', text: t('wdVerdictOrderSame') });
        else lines.push({ tone: 'good', text: t('wdVerdictBestOrder').replace('{order}', t('wdCol' + ({ proportional: 'Proportional', taxable_first: 'TaxableFirst', deferred_first: 'DeferredFirst' })[best.o])).replace('{end}', fmt(best.r.endBalance)).replace('{worst}', fmt(worst.r.endBalance)) });
      }
      // the freedom target with and without tax
      const factor = withdrawalTaxFactor(state, m.baseTargetFreedomCapital, p.order);
      if (m.baseTargetFreedomCapital > 0) {
        lines.push({ tone: factor > 1.005 ? 'warn' : 'info', text: t('wdVerdictTarget').replace('{base}', fmt(m.baseTargetFreedomCapital)).replace('{adjusted}', fmt(m.baseTargetFreedomCapital * factor)).replace('{pct}', ((factor - 1) * 100).toFixed(1)) });
        if (p.applyToTarget) lines.push({ tone: 'info', text: t('wdVerdictTargetApplied') });
      }
      document.getElementById('wd-verdict').innerHTML = lines.map(l => `<p class="p-3 rounded-xl border text-xs leading-relaxed ${tone[l.tone]}">${escapeHtml(l.text)}</p>`).join('');

      // -- the three orders side by side --
      const bestOrder = orders.map(o => ({ o, r: res[o] })).sort((a, b) => (b.r.lastsUntilAge - a.r.lastsUntilAge) || (b.r.endBalance - a.r.endBalance))[0].o;
      const star = (o) => o === bestOrder ? ` <span class="text-[10px] text-emerald-400 font-bold">★</span>` : '';
      const row = (label, fn) => `<tr class="border-t border-slate-800/60"><td class="p-2.5 text-slate-400">${label}</td>${orders.map(o => `<td class="${th} ${o === p.order ? 'text-gold-300 font-black' : 'text-slate-200'}">${fn(res[o])}</td>`).join('')}</tr>`;
      document.getElementById('wd-strategies').innerHTML = `<table class="w-full text-xs"><thead class="bg-slate-900/90 text-slate-400 font-semibold"><tr><th class="p-2.5 text-left">&nbsp;</th>
        ${orders.map(o => `<th class="${th} ${o === p.order ? 'text-gold-300' : ''}">${t('wdCol' + ({ proportional: 'Proportional', taxable_first: 'TaxableFirst', deferred_first: 'DeferredFirst' })[o])}${star(o)}</th>`).join('')}</tr></thead><tbody>
        ${row(t('wdRowTax1'), r => fmt(r.first ? r.first.tax : 0))}
        ${row(t('wdRowTaxTotal'), r => fmt(r.totalTax))}
        ${row(t('wdRowLasts'), r => r.depletedAge !== null ? `<span class="text-amber-400">${wdAgeText(r, untilAge)}</span>` : wdAgeText(r, untilAge))}
        ${row(t('wdRowEnd').replace('{age}', untilAge), r => fmt(r.endBalance))}</tbody></table>`;

      // -- chart: portfolio during retirement, per order --
      const ages = Array.from({ length: untilAge - startAge + 1 }, (_, k) => startAge + k);
      const series = (r) => ages.map((a, k) => Math.round(k === 0 ? pStart : (k - 1 < r.rows.length ? r.rows[k - 1].balanceEnd : 0)));
      const canvas = document.getElementById('chart-withdrawal');
      if (canvas) {
        if (withdrawalChartInstance) withdrawalChartInstance.destroy();
        withdrawalChartInstance = new Chart(canvas.getContext('2d'), {
          type: 'line',
          data: { labels: ages, datasets: [
            { label: t('wdColProportional'), data: series(res.proportional), borderColor: '#94a3b8', borderDash: [5, 4], borderWidth: 1.6, pointRadius: 0, fill: false, tension: 0.2 },
            { label: t('wdColTaxableFirst'), data: series(res.taxable_first), borderColor: BRAND.greenLight, borderWidth: 2, pointRadius: 0, fill: false, tension: 0.2 },
            { label: t('wdColDeferredFirst'), data: series(res.deferred_first), borderColor: BRAND.gold, borderWidth: 2.5, pointRadius: 0, fill: false, tension: 0.2 }
          ] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10, family: 'Inter' } } } },
            scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 } }, title: { display: true, text: t('wiAxisAge'), color: '#94a3b8', font: { size: 9 } } },
                      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, callback: v => (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k') } } } }
        });
      }

      // -- allocation --
      const alloc = summarizeAllocation(state, spending, p.safeBucketYears);
      const pct = (v) => alloc.total > 0 ? (v / alloc.total * 100).toFixed(0) + '%' : '—';
      const list = (title, rows) => `<div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5"><span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">${title}</span>
        ${rows.filter(r => r[1] > 0).map(r => `<div class="flex justify-between text-xs"><span class="text-slate-300">${r[0]}</span><span class="text-slate-200 font-semibold">${fmt(r[1])} <span class="text-slate-400">${pct(r[1])}</span></span></div>`).join('') || `<span class="text-xs text-slate-400">—</span>`}</div>`;
      const cur = Object.keys(alloc.byCurrency).sort((a, b) => alloc.byCurrency[b] - alloc.byCurrency[a]).map(c => [escapeHtml(c), alloc.byCurrency[c]]);
      document.getElementById('wd-alloc').innerHTML = '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">' +
        list(t('wdByRisk'), [[t('liVolatilityLow'), alloc.byVolatility.low], [t('liVolatilityMedium'), alloc.byVolatility.medium], [t('liVolatilityHigh'), alloc.byVolatility.high]]) +
        list(t('wdByLiquidity'), [[t('liLiquiditySameDay'), alloc.byLiquidity.same_day], [t('liLiquidityShort'), alloc.byLiquidity.short], [t('liLiquidityLong'), alloc.byLiquidity.long]]) +
        list(t('wdByTax'), [[t('wdClassTaxable'), alloc.byTaxClass.taxable], [t('wdClassDefGains'), alloc.byTaxClass.defGains], [t('wdClassDeferred'), alloc.byTaxClass.deferred], [t('wdClassExempt'), alloc.byTaxClass.exempt]]) +
        list(t('wdByCurrency'), cur) + '</div>';
      const alines = [];
      if (alloc.total <= 0) alines.push({ tone: 'info', text: t('wdAllocEmpty') });
      else {
        if (alloc.safeYears !== null) {
          const short = alloc.safeShortfall > 0.5;
          alines.push({ tone: short ? 'warn' : 'good', text: (short ? t('wdSafeShort') : t('wdSafeOk')).replace('{years}', alloc.safeYears.toFixed(1)).replace('{target}', p.safeBucketYears).replace('{amount}', fmt(alloc.safeShortfall)) });
        }
        const high = alloc.byVolatility.high / alloc.total;
        if (high > 0.8) alines.push({ tone: 'warn', text: t('wdRiskHigh').replace('{pct}', (high * 100).toFixed(0)) });
        else if (high < 0.2) alines.push({ tone: 'info', text: t('wdRiskLow').replace('{pct}', (high * 100).toFixed(0)) });
      }
      document.getElementById('wd-alloc-verdict').innerHTML = alines.map(l => `<p class="p-3 rounded-xl border text-xs leading-relaxed ${tone[l.tone]}">${escapeHtml(l.text)}</p>`).join('');

      // -- rebalancing: target vs. actual risky/not-so-risky split, and a benchmark link --
      const targetRiskyInput = document.getElementById('input-target-risky');
      if (targetRiskyInput && document.activeElement !== targetRiskyInput) targetRiskyInput.value = state.targetRiskyAllocationPct;
      const rb = computeRebalancingSuggestion(alloc, state.targetRiskyAllocationPct);
      const barsEl = document.getElementById('rebalance-bars');
      if (barsEl) {
        if (rb.total <= 0) {
          barsEl.innerHTML = `<p class="text-xs text-slate-400">${t('wdAllocEmpty')}</p>`;
        } else {
          const bar = (label, pct, colorClass) => `<div class="space-y-1">
            <div class="flex justify-between text-[11px]"><span class="text-slate-400">${label}</span><span class="text-slate-200 font-semibold">${pct.toFixed(0)}%</span></div>
            <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden"><div class="${colorClass} h-full rounded-full" style="width: ${Math.min(100, Math.max(0, pct))}%"></div></div>
          </div>`;
          barsEl.innerHTML = bar(t('rebalanceActualRisky'), rb.riskyPct, 'bg-orange-400') + bar(t('rebalanceTargetRisky'), rb.targetRiskyPct, 'bg-gold-500');
        }
      }
      const rebalanceVerdictEl = document.getElementById('rebalance-verdict');
      if (rebalanceVerdictEl) {
        if (rb.total <= 0) rebalanceVerdictEl.innerHTML = '';
        else if (rb.direction === null) {
          rebalanceVerdictEl.innerHTML = `<p class="p-3 rounded-xl border text-xs leading-relaxed ${tone.good}">${escapeHtml(t('rebalanceWithinBand').replace('{drift}', Math.abs(rb.driftPct).toFixed(1)))}</p>`;
        } else {
          const msgKey = rb.direction === 'trimRisky' ? 'rebalanceTrimRisky' : 'rebalanceAddRisky';
          rebalanceVerdictEl.innerHTML = `<p class="p-3 rounded-xl border text-xs leading-relaxed ${tone.warn}">${escapeHtml(t(msgKey).replace('{amount}', fmt(rb.rebalanceAmount)).replace('{drift}', Math.abs(rb.driftPct).toFixed(1)))}</p>`;
        }
      }
      const yieldEl = document.getElementById('rebalance-yield-text');
      if (yieldEl) yieldEl.innerText = t('rebalanceYieldTemplate').replace('{pct}', m.weightedPortfolioYield.toFixed(1)).replace('{risky}', rb.riskyPct.toFixed(0)).replace('{safe}', rb.nonRiskyPct.toFixed(0));
      const mtmLink = document.getElementById('link-market-time-machine');
      if (mtmLink) mtmLink.href = BRAND.marketTimeMachineUrl[state.language] || BRAND.marketTimeMachineUrl.en;

      const spendInput = document.getElementById('input-wd-spending');
      if (spendInput) spendInput.placeholder = t('wdSpendingAuto').replace('{amount}', fmt(m.postKidsMonthlyLivingCost));
      const startInput = document.getElementById('input-wd-start');
      if (startInput) startInput.placeholder = t('wdStartAuto').replace('{age}', startAge);
      const retInput = document.getElementById('input-wd-return');
      if (retInput) retInput.placeholder = t('wdReturnAuto');
    }

