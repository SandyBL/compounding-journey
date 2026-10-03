    // =====================================================================
    // What-if scenarios: the person changes a few levers and sees the CURRENT plan
    // and the WHAT-IF plan side by side.
    // Both plans come from the app's own calculateMetrics(): the scenario is a
    // modified COPY of the data (the real data is never touched), so "current plan"
    // always equals what the Overview and Retirement tabs show.
    // =====================================================================
    let whatIfChartInstance = null;
    const WHATIF_NEUTRAL = { extraSavingsPct: 0, spendingChangePct: 0, returnDeltaPp: 0, lumpSum: 0, retireAge: 0, investFreed: true };
    const WHATIF_LIMITS = { extraSavingsPct: [-50, 100], spendingChangePct: [-50, 50], returnDeltaPp: [-5, 5], lumpSum: [0, 1e9] };
    const WHATIF_HORIZON_YEARS = 35;   // same horizon the freedom-year projection uses

    function wiLevers() { return Object.assign({}, WHATIF_NEUTRAL, state.whatIf || {}); }
    function wiIsNeutral(w) { return !w.extraSavingsPct && !w.spendingChangePct && !w.returnDeltaPp && !w.lumpSum && !(w.retireAge > 0); }
    function wiFill(key, vars) { return Object.keys(vars).reduce((acc, k) => acc.split('{' + k + '}').join(vars[k]), t(key)); }

    // Same engine, other data (see calculateMetricsFor in calc/metrics.js).
    function wiMetricsFor(candidate) { return calculateMetricsFor(candidate); }

    // Real-terms portfolio, year by year: the SAME projection as the freedom-year
    // calculation and the Retirement chart (including life events).
    function wiSeries(m, years, monthlyOverride) {
      return simulateRealPortfolio({
        start: m.totalLiquidBase, monthlyInvest: monthlyOverride === undefined ? m.monthlyInvest : monthlyOverride, years,
        realReturn: m.realAnnualReturn, careerGrowthRate: m.careerGrowthRate, careerGrowthProportional: m.careerGrowthProportional,
        events: m.lifeEvents, surplus: m.monthlySurplus
      }).values;
    }
    function wiProjectedAt(m, years, monthlyOverride) {
      const s = wiSeries(m, years, monthlyOverride);
      return s[s.length - 1];
    }

    // Smallest starting monthly investment that reaches the target by `years`.
    // 0 = no further investing needed; null = monthly investing alone cannot get there.
    function wiRequiredMonthly(m, years) {
      const target = m.targetFreedomCapital;
      if (wiProjectedAt(m, years, 0) >= target) return 0;
      if (years <= 0) return null;
      let hi = Math.max(1, m.monthlyInvest || 1), guard = 0;
      while (wiProjectedAt(m, years, hi) < target && guard++ < 60) hi *= 2;
      if (wiProjectedAt(m, years, hi) < target) return null;
      let lo = 0;
      for (let i = 0; i < 50; i++) {
        const mid = (lo + hi) / 2;
        if (wiProjectedAt(m, years, mid) >= target) hi = mid; else lo = mid;
      }
      return hi;
    }

    function wiPlan(m, st) {
      const primaryAge = (st.earners && st.earners.length > 0) ? (Number(st.earners[0].age) || 35) : 35;
      const retireAge = Number(st.traditionalRetirementAge) > 0 ? Number(st.traditionalRetirementAge) : 65;
      const yearsToRetire = Math.max(0, retireAge - primaryAge);
      const projectedAtRetire = wiProjectedAt(m, yearsToRetire);
      const gap = projectedAtRetire - m.targetFreedomCapital;
      const yc = m.yearsToCrossover;                       // null = not within 35 years
      return {
        m, primaryAge, retireAge, yearsToRetire, projectedAtRetire, gap,
        required: wiRequiredMonthly(m, yearsToRetire),
        freedomYears: yc,
        freedomAge: yc === null ? null : primaryAge + yc,
        freedomYear: yc === null ? null : new Date().getFullYear() + yc
      };
    }

    // The scenario = a copy of the data with the levers applied.
    function wiBuildScenario(base, w, m0) {
      const s = JSON.parse(JSON.stringify(base));
      if (w.returnDeltaPp) {
        (s.liquidInvestments || []).forEach(i => { i.annualYieldPct = Math.max(0, (Number(i.annualYieldPct) || 0) + w.returnDeltaPp); });
      }
      if (w.spendingChangePct && s.outflows) {
        Object.keys(s.outflows).forEach(k => { if (typeof s.outflows[k] === 'number') s.outflows[k] = s.outflows[k] * (1 + w.spendingChangePct / 100); });
      }
      s.monthlyInvestment = Math.max(0, (Number(s.monthlyInvestment) || 0) + (w.extraSavingsPct / 100) * m0.totalNetInflow);
      if (w.lumpSum > 0) {
        s.liquidInvestments = s.liquidInvestments || [];
        s.liquidInvestments.push({ id: -1, name: 'What-if', currency: s.baseCurrency || 'BRL', balanceOriginal: w.lumpSum,
          annualYieldPct: Math.max(0, m0.weightedPortfolioYield + (w.returnDeltaPp || 0)), liquidityTier: 'long', volatilityTier: 'medium', isEmergencyReserve: false, accountType: 'none' });
      }
      if (w.retireAge > 0) s.traditionalRetirementAge = w.retireAge;
      let ms = wiMetricsFor(s);
      // Spending less frees money each month; by default it is invested.
      if (w.investFreed && w.spendingChangePct < 0) {
        const freed = m0.baseOutflows - ms.baseOutflows;
        if (freed > 0) { s.monthlyInvestment += freed; ms = wiMetricsFor(s); }
      }
      return { state: s, metrics: ms };
    }

    function computeWhatIf() {
      const w = wiLevers();
      const m0 = calculateMetrics();
      const base = wiPlan(m0, state);
      const built = wiBuildScenario(state, w, m0);
      const scen = wiPlan(built.metrics, built.state);
      const cashShort = built.metrics.cashDelta < 0 && built.metrics.cashDelta < m0.cashDelta - 0.5 ? -built.metrics.cashDelta : 0;
      return { w, base, scen, neutral: wiIsNeutral(w), cashShort };
    }

    // ---------- rendering ----------
    function wiFreedomText(p) {
      if (p.freedomYears === null) return t('wiNotReached');
      if (p.freedomYears === 0) return t('wiAlreadyFree');
      return `${p.freedomAge} (${p.freedomYear})`;
    }
    function wiYearsText(n) { return `${n} ${t(n === 1 ? 'wiYearSing' : 'wiYearPlur')}`; }

    function renderWhatIfVerdict(r) {
      const box = document.getElementById('wi-verdict');
      if (!box) return;
      const b = r.base, s = r.scen, lines = [];
      const vars = { age: s.freedomAge, year: s.freedomYear, age0: b.freedomAge, year0: b.freedomYear };
      if (r.neutral) {
        lines.push({ tone: 'info', text: t('wiNoChange') });
      } else if (b.freedomYears === 0 && s.freedomYears === 0) {
        lines.push({ tone: 'info', text: t('wiVerdictBothFree') });
      } else if (b.freedomYears === null && s.freedomYears === null) {
        lines.push({ tone: 'warn', text: t('wiVerdictNeither') });
      } else if (b.freedomYears === null) {
        lines.push({ tone: 'good', text: wiFill('wiVerdictNowReached', vars) });
      } else if (s.freedomYears === null) {
        lines.push({ tone: 'warn', text: wiFill('wiVerdictNowLost', vars) });
      } else {
        const d = b.freedomYears - s.freedomYears;       // positive = earlier
        if (d > 0) lines.push({ tone: 'good', text: wiFill('wiVerdictEarlier', Object.assign({ years: wiYearsText(d) }, vars)) });
        else if (d < 0) lines.push({ tone: 'warn', text: wiFill('wiVerdictLater', Object.assign({ years: wiYearsText(-d) }, vars)) });
        else lines.push({ tone: 'info', text: wiFill('wiVerdictSame', vars) });
      }
      if (!r.neutral) {
        // The retirement-age question, for the scenario's chosen age
        const need = s.required;
        const rv = { age: s.retireAge, proj: fmt(s.projectedAtRetire), target: fmt(s.m.targetFreedomCapital), gap: fmt(Math.abs(s.gap)), cur: fmt(s.m.monthlyInvest),
                     req: need === null ? '—' : fmt(need) };
        if (s.yearsToRetire === 0) lines.push({ tone: 'info', text: wiFill('wiRetirePast', rv) });
        if (s.gap >= 0) lines.push({ tone: 'good', text: wiFill('wiVerdictRetireOk', rv) });
        else if (need === null) lines.push({ tone: 'warn', text: wiFill('wiVerdictRetireShortNoMonthly', rv) });
        else lines.push({ tone: 'warn', text: wiFill('wiVerdictRetireShort', rv) });
      }
      if (r.cashShort > 0) lines.push({ tone: 'warn', text: wiFill('wiWarnCash', { short: fmt(r.cashShort) }) });
      const cls = { good: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200', warn: 'border-amber-500/40 bg-amber-950/30 text-amber-200', info: 'border-slate-700 bg-slate-950 text-slate-300' };
      box.innerHTML = lines.map(l => `<p class="p-3 rounded-xl border text-xs leading-relaxed ${cls[l.tone]}">${escapeHtml(l.text)}</p>`).join('');
    }

    function renderWhatIfTable(r) {
      const el = document.getElementById('wi-table');
      if (!el) return;
      const b = r.base, s = r.scen;
      const money = v => fmt(v);
      const signedMoney = v => (v >= 0 ? '+' : '−') + fmt(Math.abs(v));
      const perMo = v => `${fmt(v)} ${t('perMonth')}`;
      const reqText = p => p.required === null ? t('wiNeedsLumpSum') : (p.required === 0 ? t('wiAlreadyEnough') : perMo(p.required));
      // better: 'higher' | 'lower' | null (neutral); d() returns a number for the difference, or null
      const rows = [
        { k: 'wiRowInvest', show: p => perMo(p.m.monthlyInvest), num: p => p.m.monthlyInvest, diff: d => (d > 0 ? '+' : '−') + perMo(Math.abs(d)), better: null },
        { k: 'wiRowSavingsRate', show: p => `${p.m.savingsRate.toFixed(1)}%`, num: p => p.m.savingsRate, diff: d => `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} ${t('wiPts')}`, better: 'higher' },
        { k: 'wiRowPortfolio', show: p => money(p.m.totalLiquidBase), num: p => p.m.totalLiquidBase, diff: d => signedMoney(d), better: 'higher' },
        { k: 'wiRowSpend', show: p => money(p.m.totalMonthlyLivingCost * 12), num: p => p.m.totalMonthlyLivingCost * 12, diff: d => signedMoney(d), better: 'lower' },
        { k: 'wiRowTarget', show: p => money(p.m.targetFreedomCapital), num: p => p.m.targetFreedomCapital, diff: d => signedMoney(d), better: 'lower' },
        { k: 'wiRowFreedomAge', show: wiFreedomText, num: p => p.freedomYears, diff: d => `${d > 0 ? '+' : '−'}${wiYearsText(Math.abs(d))}`, better: 'lower', strong: true },
        { k: 'wiRowRetireAge', show: p => `${p.retireAge}`, num: p => p.retireAge, diff: d => `${d > 0 ? '+' : '−'}${wiYearsText(Math.abs(d))}`, better: null },
        { k: 'wiRowProjected', show: p => money(p.projectedAtRetire), num: p => p.projectedAtRetire, diff: d => signedMoney(d), better: 'higher' },
        { k: 'wiRowGap', show: p => signedMoney(p.gap), num: p => p.gap, diff: d => signedMoney(d), better: 'higher', strong: true },
        { k: 'wiRowRequired', show: reqText, num: p => p.required, diff: d => (d > 0 ? '+' : '−') + perMo(Math.abs(d)), better: 'lower' },
        { k: 'wiRowCoast', show: p => t(p.m.hasReachedCoastFI ? 'wiYes' : 'wiNo'), num: () => null, diff: () => '', better: null }
      ];
      const cell = 'p-2.5 align-top';
      const body = rows.map(row => {
        const nb = row.num(b), ns = row.num(s);
        let diffTxt = '—', tone = 'text-slate-400';
        if (typeof nb === 'number' && typeof ns === 'number' && Math.abs(ns - nb) > 1e-6) {
          const d = ns - nb;
          diffTxt = row.diff(d);
          const good = row.better === 'higher' ? d > 0 : (row.better === 'lower' ? d < 0 : null);
          tone = good === null ? 'text-slate-300' : (good ? 'text-emerald-400' : 'text-amber-400');
        }
        return `<tr class="border-t border-slate-800/60 ${row.strong ? 'bg-slate-900/40' : ''}">
          <td class="${cell} text-slate-400">${t(row.k)}</td>
          <td class="${cell} text-right text-slate-200 font-semibold">${row.show(b)}</td>
          <td class="${cell} text-right text-gold-300 font-black">${row.show(s)}</td>
          <td class="${cell} text-right font-bold ${tone}">${diffTxt}</td>
        </tr>`;
      }).join('');
      el.innerHTML = `<table class="w-full text-xs"><thead class="bg-slate-900/90 text-slate-400 font-semibold">
        <tr><th class="p-2.5 text-left">${t('wiColMetric')}</th><th class="p-2.5 text-right">${t('wiColCurrent')}</th><th class="p-2.5 text-right text-gold-300">${t('wiColScenario')}</th><th class="p-2.5 text-right">${t('wiColDiff')}</th></tr>
        </thead><tbody>${body}</tbody></table>`;
    }

    function renderWhatIfChart(r) {
      const canvas = document.getElementById('chart-whatif');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const n = WHATIF_HORIZON_YEARS;
      const labels = Array.from({ length: n + 1 }, (_, i) => r.base.primaryAge + i);
      const line = (m) => wiSeries(m, n).map(Math.round);
      const flat = (v) => labels.map(() => Math.round(v));
      if (whatIfChartInstance) whatIfChartInstance.destroy();
      whatIfChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: t('wiColCurrent'), data: line(r.base.m), borderColor: '#94a3b8', backgroundColor: 'rgba(148, 163, 184, 0.06)', fill: true, tension: 0.3, borderWidth: 2, pointRadius: 0 },
            { label: t('wiColScenario'), data: line(r.scen.m), borderColor: BRAND.gold, backgroundColor: 'rgba(197, 155, 39, 0.10)', fill: true, tension: 0.3, borderWidth: 2.5, pointRadius: 0 },
            { label: t('wiChartTargetBase'), data: flat(r.base.m.targetFreedomCapital), borderColor: '#94a3b8', borderDash: [4, 4], borderWidth: 1.2, pointRadius: 0, fill: false },
            { label: t('wiChartTargetScenario'), data: flat(r.scen.m.targetFreedomCapital), borderColor: BRAND.orange, borderDash: [2, 4], borderWidth: 1.2, pointRadius: 0, fill: false }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10, family: 'Inter' } } } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 } }, title: { display: true, text: t('wiAxisAge'), color: '#94a3b8', font: { size: 9 } } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, callback: v => (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k') } }
          }
        }
      });
    }

    function renderWhatIf() {
      const view = document.getElementById('view-whatif');
      if (!view || view.classList.contains('hidden')) return;      // only work when the tab is open
      const r = computeWhatIf();
      renderWhatIfVerdict(r);
      renderWhatIfTable(r);
      renderWhatIfChart(r);
      renderScenarios();
      const link = document.getElementById('link-wi-simulator');
      if (link) link.href = BRAND.simulatorUrl[state.language] || BRAND.simulatorUrl.en;
    }

    // ---------- inputs ----------
    function syncWhatIfInputs() {
      const w = wiLevers();
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
      set('input-wi-save', w.extraSavingsPct);
      set('input-wi-spend', w.spendingChangePct);
      set('input-wi-return', w.returnDeltaPp);
      set('input-wi-lump', w.lumpSum);
      set('input-wi-retire', w.retireAge > 0 ? w.retireAge : '');
      const cb = document.getElementById('input-wi-invest-freed');
      if (cb) cb.checked = !!w.investFreed;
    }

    window.updateWhatIf = function(field, raw) {
      let v = parseFloat(raw);
      if (!isFinite(v)) v = 0;
      if (field === 'retireAge') v = v > 0 ? Math.min(90, Math.max(40, Math.round(v))) : 0;   // 0 / empty = same as the current plan
      else if (field === 'investFreed') v = !!raw;
      else { const lim = WHATIF_LIMITS[field]; v = Math.min(lim[1], Math.max(lim[0], v)); }
      state.whatIf = Object.assign({}, WHATIF_NEUTRAL, state.whatIf || {});
      state.whatIf[field] = v;
      saveState();
      renderWhatIf();
    };

    window.applyWhatIfPreset = function(name) {
      const w = Object.assign({}, WHATIF_NEUTRAL, state.whatIf || {});
      if (name === 'save5') w.extraSavingsPct = 5;
      else if (name === 'retire55') w.retireAge = 55;
      else if (name === 'cut10') { w.spendingChangePct = -10; w.investFreed = true; }
      else if (name === 'return2') w.returnDeltaPp = -2;
      else if (name === 'reset') Object.assign(w, WHATIF_NEUTRAL);
      state.whatIf = w;
      syncWhatIfInputs();
      saveState();
      renderWhatIf();
    };

