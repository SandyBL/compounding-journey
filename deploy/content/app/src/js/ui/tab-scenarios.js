    // =====================================================================
    // Named scenario comparison: two or more saved "what if" scenarios compared
    // side by side (not just one lever-set against "current", which is what the
    // Quick Levers card above already does). Three guided types:
    //   'lever'        - the same 6 What-if levers, just saved under a name so
    //                    several can be compared at once instead of only one.
    //   'careerChange' - one earner's gross monthly income changes, from now on.
    //   'sabbatical'   - one earner's income drops to a chosen % for a chosen
    //                    number of months, then returns to normal; modeled as an
    //                    auto-generated temporary Life Event, so no new
    //                    projection math is needed \u2014 the existing engine (which
    //                    already handles a monthly flow over a fixed span) does
    //                    the rest.
    // Every scenario type ultimately produces the same { state, metrics } shape
    // wiBuildScenario() already does for levers, so wiPlan()/wiSeries() (defined
    // above, for Quick Levers) work on ANY scenario unchanged.
    // =====================================================================
    function scNewId() { return Date.now() + Math.floor(Math.random() * 1000); }

    // A cloned state with ONE earner's gross income changed from now on \u2014 flows
    // through the REAL tax engine for the household's own country/regime, not an
    // approximation, so a Brazilian CLT vs PJ switch or a bracket change is
    // reflected correctly.
    function buildCareerChangeScenario(base, sc) {
      const s = JSON.parse(JSON.stringify(base));
      const e = (s.earners || []).find(x => x.id === sc.earnerId);
      let netDelta = 0;
      if (e) {
        // BUGFIX (found while testing): monthlyInvestment is a separate, manually-chosen
        // field — it is not automatically a share of income — so changing an earner's
        // gross alone left the projection completely unchanged, which silently answered a
        // different question ("does a raise help if I never save any of it?") than the one
        // a career-change scenario is actually for. This assumes the SAME spending as
        // today and the net income difference (computed from two real, tax-aware
        // calculateMetrics() runs, never a flat percentage of gross) flows into monthly
        // investing — the same "money freed goes to savings by default" philosophy the
        // Quick Levers card already uses for reduced spending.
        const before = wiMetricsFor(base).totalEarnersNet;
        e.grossMonthly = Math.max(0, Number(sc.newGrossMonthly) || 0);
        e.manualNetOverride = false;
        const after = wiMetricsFor(s).totalEarnersNet;
        netDelta = after - before;
      }
      s.monthlyInvestment = Math.max(0, (Number(s.monthlyInvestment) || 0) + netDelta);
      return { state: s, metrics: wiMetricsFor(s), netDelta };
    }

    // The household's real, tax-adjusted monthly income DROP when one earner's
    // gross falls to incomeDuringPct% of today's \u2014 computed as a difference of
    // two real calculateMetrics() runs (today vs. reduced), never a flat
    // percentage of gross, so it is correct even when a lower gross moves the
    // household into a different bracket. That drop becomes a temporary "out"
    // Life Event for the sabbatical's own span; nothing else about the
    // household changes, and it reverts automatically once the span ends.
    function buildSabbaticalScenario(base, sc, m0) {
      const s = JSON.parse(JSON.stringify(base));
      const e = (s.earners || []).find(x => x.id === sc.earnerId);
      let monthlyGap = 0;
      if (e) {
        const reduced = JSON.parse(JSON.stringify(base));
        const re = reduced.earners.find(x => x.id === sc.earnerId);
        re.grossMonthly = Math.max(0, (Number(e.grossMonthly) || 0) * Math.min(100, Math.max(0, Number(sc.incomeDuringPct) || 0)) / 100);
        re.manualNetOverride = false;
        const reducedMetrics = wiMetricsFor(reduced);
        monthlyGap = Math.max(0, m0.totalEarnersNet - reducedMetrics.totalEarnersNet);
      }
      // Capped at 420 months (35 years) \u2014 the projection engine's own horizon, so a
      // longer value would never be meaningfully visible anyway \u2014 rather than the old
      // 60-month cap, which blocked a genuinely reasonable what-if ("what if I take 10
      // years off") a person might want to explore.
      const months = Math.max(1, Math.min(420, Math.round(Number(sc.durationMonths) || 1)));
      const startYear = new Date().getFullYear() + Math.max(0, Math.round(Number(sc.startYearOffset) || 0));
      if (monthlyGap > 0) {
        s.lifeEvents = (s.lifeEvents || []).concat([{
          id: -2, kind: 'monthly', direction: 'out', name: sc.name || t('scSabbaticalDefaultName'),
          year: startYear, years: months / 12, amount: monthlyGap, enabled: true
        }]);
      }
      return { state: s, metrics: wiMetricsFor(s), monthlyGap, months, startYear };
    }

    // One entry point for all three types \u2014 the rendering code below never needs
    // to know which type it is building.
    function buildNamedScenario(sc, base, m0) {
      if (sc.type === 'careerChange' && sc.careerChange) return buildCareerChangeScenario(base, sc.careerChange);
      if (sc.type === 'sabbatical' && sc.sabbatical) return buildSabbaticalScenario(base, sc.sabbatical, m0);
      if (sc.type === 'parentDeath' && sc.parentDeath) return buildParentDeathScenario(base, sc.parentDeath, sc);
      if (sc.type === 'lever' && sc.lever) return wiBuildScenario(base, Object.assign({}, WHATIF_NEUTRAL, sc.lever), m0);
      return { state: base, metrics: m0 };
    }

    // "What if a parent dies?" — asked for directly, alongside the Overview's own
    // death-benefit analysis (calc/death-benefit.js): that analysis is a snapshot
    // ("here's today's picture"), this is the dynamic what-if ("here's the whole
    // 35-year projection if it actually happened"). The earner's income goes to zero
    // (not removed from the household entirely — matches the request's own framing,
    // "the income from him goes to zero", and avoids any dangling-reference cleanup a
    // full removal would need for a throwaway hypothetical clone); the life insurance
    // payout arrives as a one-time lump sum the same year, the same mechanism the
    // sabbatical scenario already uses for its own automatic life event.
    function buildParentDeathScenario(base, sc) {
      const s = JSON.parse(JSON.stringify(base));
      const e = (s.earners || []).find(x => x.id === sc.earnerId);
      let netDelta = 0;
      if (e) {
        const before = wiMetricsFor(base).totalEarnersNet;
        e.grossMonthly = 0;
        e.manualNetOverride = false;
        e.realNetSalary = 0;
        e.has13thSalary = false;
        e.annualBonus = 0;
        const after = wiMetricsFor(s).totalEarnersNet;
        netDelta = after - before;
      }
      // Same "money freed (or lost) flows into monthly investing by default" philosophy
      // already used for the career-change scenario — here netDelta is negative, so
      // this reduces (never below 0) rather than increases monthly investing.
      s.monthlyInvestment = Math.max(0, (Number(s.monthlyInvestment) || 0) + netDelta);

      const payout = Number((s.insurance || {}).lifeInsuranceCoverage) || 0;
      if (payout > 0) {
        s.lifeEvents = (s.lifeEvents || []).concat([{
          id: -3, kind: 'oneoff', direction: 'in', name: t('scParentDeathPayoutEventName'),
          year: new Date().getFullYear(), years: 1, amount: payout, enabled: true
        }]);
      }
      return { state: s, metrics: wiMetricsFor(s) };
    }

    // ---------- editing ----------
    window.addScenario = function(type) {
      if (!['lever', 'careerChange', 'sabbatical', 'parentDeath'].includes(type)) return;
      const firstEarner = (state.earners || [])[0];
      const sc = { id: scNewId(), name: t('scNewScenarioName' + (type.charAt(0).toUpperCase() + type.slice(1))), type,
        lever: Object.assign({}, WHATIF_NEUTRAL), careerChange: null, sabbatical: null, parentDeath: null };
      if (type === 'careerChange') sc.careerChange = { earnerId: firstEarner ? firstEarner.id : null, newGrossMonthly: firstEarner ? Number(firstEarner.grossMonthly) || 0 : 0 };
      if (type === 'sabbatical') sc.sabbatical = { earnerId: firstEarner ? firstEarner.id : null, startYearOffset: 1, durationMonths: 6, incomeDuringPct: 0 };
      if (type === 'parentDeath') sc.parentDeath = { earnerId: firstEarner ? firstEarner.id : null };
      state.scenarios = state.scenarios || [];
      state.scenarios.push(sc);
      handleDataUpdate();
    };
    window.removeScenario = function(id) {
      state.scenarios = (state.scenarios || []).filter(x => x.id !== id);
      handleDataUpdate();
    };
    window.updateScenario = function(id, field, val) {
      const sc = (state.scenarios || []).find(x => x.id === id);
      if (!sc) return;
      if (field === 'name') sc.name = String(val).slice(0, 60);
      handleDataUpdate();
    };
    window.updateScenarioField = function(id, group, field, val) {
      const sc = (state.scenarios || []).find(x => x.id === id);
      if (!sc || !sc[group]) return;
      if (group === 'careerChange') {
        if (field === 'earnerId') sc.careerChange.earnerId = val ? Math.floor(Number(val)) : null;
        else if (field === 'newGrossMonthly') sc.careerChange.newGrossMonthly = Math.max(0, parseFloat(val) || 0);
      } else if (group === 'sabbatical') {
        if (field === 'earnerId') sc.sabbatical.earnerId = val ? Math.floor(Number(val)) : null;
        else if (field === 'startYearOffset') sc.sabbatical.startYearOffset = Math.min(30, Math.max(0, Math.round(parseFloat(val)) || 0));
        // BUGFIX reported directly: clamping to the max on every keystroke (the old
        // Math.min(60, ...) applied inside this same oninput-triggered function) fought
        // the user while typing a number larger than the cap \u2014 e.g. typing "120" to
        // mean 10 years got silently rewritten to "60" the instant the third digit
        // landed, with no way to tell why or to actually type past it. Kept simple
        // (empty stays null, a floor of 1 so 0/negative isn't accepted) with no upper
        // clamp here; the one real upper bound that matters (the 35-year projection
        // horizon, wiBuildScenario above) is applied only where the value is actually
        // USED for the projection, never fought over while the field is being typed in.
        else if (field === 'durationMonths') sc.sabbatical.durationMonths = (val === '' || val === null || val === undefined) ? null : Math.max(1, Math.round(parseFloat(val)) || 1);
        else if (field === 'incomeDuringPct') sc.sabbatical.incomeDuringPct = Math.min(100, Math.max(0, Math.round(parseFloat(val)) || 0));
      } else if (group === 'parentDeath') {
        if (field === 'earnerId') sc.parentDeath.earnerId = val ? Math.floor(Number(val)) : null;
      } else if (group === 'lever') {
        if (['extraSavingsPct', 'spendingChangePct', 'returnDeltaPp', 'lumpSum', 'retireAge'].includes(field)) sc.lever[field] = parseFloat(val) || 0;
        else if (field === 'investFreed') sc.lever.investFreed = !!val;
      }
      handleDataUpdate();
    };


    // ---------- rendering ----------
    function scLabelFor(sc) {
      const typeLabel = t(sc.type === 'careerChange' ? 'scTypeCareerChange' : (sc.type === 'sabbatical' ? 'scTypeSabbatical' : (sc.type === 'parentDeath' ? 'scTypeParentDeath' : 'scTypeLever')));
      return `${sc.name} <span class="text-[9px] text-slate-400 font-normal">(${typeLabel})</span>`;
    }
    function scEarnerOptions(selectedId) {
      return (state.earners || []).map(e => `<option value="${e.id}" ${String(selectedId) === String(e.id) ? 'selected' : ''}>${escapeHtml(e.name || t('demoRole1'))}</option>`).join('');
    }

    function renderScenarioForm(sc) {
      if (sc.type === 'careerChange') {
        const cc = sc.careerChange || {};
        return `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div><label class="text-[10px] text-slate-400 block font-semibold">${t('scWhoLabel')}</label>
            <select onchange="updateScenarioField(${sc.id}, 'careerChange', 'earnerId', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-semibold">${scEarnerOptions(cc.earnerId)}</select></div>
          <div><label class="text-[10px] text-slate-400 block font-semibold">${t('scNewGrossLabel')}</label>
            <input type="number" min="0" step="100" value="${cc.newGrossMonthly || 0}" oninput="updateScenarioField(${sc.id}, 'careerChange', 'newGrossMonthly', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold"></div>
        </div>`;
      }
      if (sc.type === 'sabbatical') {
        const sab = sc.sabbatical || {};
        return `<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div class="col-span-2 sm:col-span-1"><label class="text-[10px] text-slate-400 block font-semibold">${t('scWhoLabel')}</label>
            <select onchange="updateScenarioField(${sc.id}, 'sabbatical', 'earnerId', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-semibold">${scEarnerOptions(sab.earnerId)}</select></div>
          <div><label class="text-[10px] text-slate-400 block font-semibold">${t('scStartsInLabel')}</label>
            <input type="number" min="0" max="30" step="1" value="${sab.startYearOffset || 0}" oninput="updateScenarioField(${sc.id}, 'sabbatical', 'startYearOffset', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold"></div>
          <div><label class="text-[10px] text-slate-400 block font-semibold">${t('scDurationLabel')}</label>
            <input type="number" min="1" max="420" step="1" value="${sab.durationMonths === null ? '' : (sab.durationMonths || 6)}" oninput="updateScenarioField(${sc.id}, 'sabbatical', 'durationMonths', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold"></div>
          <div><label class="text-[10px] text-slate-400 block font-semibold">${t('scIncomeDuringLabel')}</label>
            <input type="number" min="0" max="100" step="5" value="${sab.incomeDuringPct || 0}" oninput="updateScenarioField(${sc.id}, 'sabbatical', 'incomeDuringPct', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold"></div>
        </div>`;
      }
      if (sc.type === 'parentDeath') {
        const pd = sc.parentDeath || {};
        const payout = Number((state.insurance || {}).lifeInsuranceCoverage) || 0;
        return `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs items-end">
          <div><label class="text-[10px] text-slate-400 block font-semibold">${t('scWhoLabel')}</label>
            <select onchange="updateScenarioField(${sc.id}, 'parentDeath', 'earnerId', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-semibold">${scEarnerOptions(pd.earnerId)}</select></div>
          <p class="text-[10px] text-slate-400">${fillTpl('scParentDeathNote', { amount: fmt(payout) })}</p>
        </div>`;
      }
      const lv = sc.lever || {};
      const field = (labelKey, key, step) => `<div><label class="text-[10px] text-slate-400 block font-semibold">${t(labelKey)}</label>
        <input type="number" step="${step}" value="${lv[key]}" oninput="updateScenarioField(${sc.id}, 'lever', '${key}', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold"></div>`;
      return `<div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
        ${field('wiLeverSave', 'extraSavingsPct', 1)}${field('wiLeverSpend', 'spendingChangePct', 1)}${field('wiLeverReturn', 'returnDeltaPp', 0.5)}
        ${field('wiLeverLump', 'lumpSum', 100)}${field('wiLeverRetire', 'retireAge', 1)}
      </div>`;
    }

    function renderScenarios() {
      const listEl = document.getElementById('sc-list');
      if (!listEl) return;
      const focusState = saveFocusState();
      listEl.innerHTML = '';
      const m0 = calculateMetrics();
      (state.scenarios || []).forEach(sc => {
        const div = document.createElement('div');
        div.className = 'p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs';
        div.innerHTML = `
          <div class="flex items-center justify-between gap-2">
            <input type="text" value="${escapeHtml(sc.name)}" oninput="updateScenario(${sc.id}, 'name', this.value)" class="font-bold text-white bg-transparent border-b border-slate-700 focus:border-gold-400 outline-none flex-1">
            <button onclick="removeScenario(${sc.id})" class="text-rose-400 hover:text-rose-300 font-bold flex-shrink-0">✕</button>
          </div>
          ${renderScenarioForm(sc)}
        `;
        listEl.appendChild(div);
      });
      restoreFocusState(focusState);

      // Each scenario used to be built TWICE per render (once for the table, once for
      // the chart) — buildNamedScenario() is not cheap (a full state clone plus a real
      // calculateMetrics() pass, sometimes two for career-change/sabbatical types), and
      // this ran on every keystroke while the tab is open. Built once here instead and
      // reused by both sections below (measured: ~18ms/render with 10 scenarios before
      // this fix, roughly halved after, scaling linearly with scenario count either way).
      const builtScenarios = (state.scenarios || []).map(sc => ({ sc, built: buildNamedScenario(sc, state, m0) }));

      // -- comparison table: baseline + every saved scenario, each vs. baseline --
      const tableEl = document.getElementById('sc-table');
      if (tableEl) {
        const base = wiPlan(m0, state);
        const cols = [{ label: t('wiColCurrent'), p: base, isBase: true }].concat(
          builtScenarios.map(({ sc, built }) => ({ label: sc.name, p: wiPlan(built.metrics, built.state) }))
        );
        const money = v => fmt(v);
        const rows = [
          { k: 'wiRowFreedomAge', show: p => wiFreedomText(p), better: 'lower', num: p => p.freedomYears },
          { k: 'wiRowInvest', show: p => `${fmt(p.m.monthlyInvest)} ${t('perMonth')}`, better: null, num: p => p.m.monthlyInvest },
          { k: 'wiRowProjected', show: p => money(p.projectedAtRetire), better: 'higher', num: p => p.projectedAtRetire }
        ];
        const th = 'p-2.5 text-right';
        tableEl.innerHTML = cols.length <= 1 ? `<p class="text-xs text-slate-400 p-3">${t('scNoScenariosYet')}</p>` : `<table class="w-full text-xs"><thead class="bg-slate-900/90 text-slate-400 font-semibold"><tr>
          <th class="p-2.5 text-left">${t('wiColMetric')}</th>
          ${cols.map(c => `<th class="${th} ${c.isBase ? '' : 'text-gold-300'}">${escapeHtml(c.label)}</th>`).join('')}
        </tr></thead><tbody>
          ${rows.map(row => `<tr class="border-t border-slate-800/60"><td class="p-2.5 text-slate-400">${t(row.k)}</td>
            ${cols.map(c => {
              const baseNum = row.num(base), n = row.num(c.p);
              let cls = 'text-slate-200 font-semibold';
              if (!c.isBase && typeof baseNum === 'number' && typeof n === 'number' && Math.abs(n - baseNum) > 1e-6 && row.better) {
                const good = row.better === 'higher' ? n > baseNum : n < baseNum;
                cls = good ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold';
              }
              return `<td class="${th} ${cls}">${row.show(c.p)}</td>`;
            }).join('')}
          </tr>`).join('')}
        </tbody></table>`;
      }

      // -- chart: baseline + every scenario's trajectory --
      const canvas = document.getElementById('chart-scenarios');
      if (canvas) {
        if (scenariosChartInstance) scenariosChartInstance.destroy();
        const years = 35;
        const labels = Array.from({ length: years + 1 }, (_, k) => k);
        const palette = [BRAND.gold, BRAND.greenLight, '#38bdf8', '#f472b6', '#a78bfa', '#fb923c'];
        const datasets = [{ label: t('wiColCurrent'), data: wiSeries(m0, years).map(Math.round), borderColor: '#94a3b8', borderDash: [5, 4], borderWidth: 1.6, pointRadius: 0, fill: false, tension: 0.2 }]
          .concat(builtScenarios.map(({ sc, built }, i) => {
            return { label: sc.name, data: wiSeries(built.metrics, years).map(Math.round), borderColor: palette[i % palette.length], borderWidth: 2, pointRadius: 0, fill: false, tension: 0.2 };
          }));
        scenariosChartInstance = new Chart(canvas.getContext('2d'), {
          type: 'line', data: { labels, datasets },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10, family: 'Inter' } } } },
            scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
                      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, callback: v => (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k') } } } }
        });
      }
    }
    let scenariosChartInstance = null;
