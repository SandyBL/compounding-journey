    // =====================================================================
    // Life events: things that will happen and change the money plan: a bonus, an
    // inheritance, buying a home, a career break, tuition years...
    // They feed the SAME projection engine as every other tab (simulateRealPortfolio),
    // so the freedom year on Overview, the Retirement chart and the What-if tab all
    // include them. Here the person edits them and sees the plan WITH vs WITHOUT them.
    // =====================================================================
    let lifeEventsChartInstance = null;
    const LIFE_EVENT_HORIZON_YEARS = 35;   // same horizon as the freedom-year projection

    // Automatic events (from the debt payoff plan) carry a translation key instead of a typed name.
    function leEventName(ev) { return ev.nameKey ? t(ev.nameKey) : ev.name; }

    function renderLifeEventsAuto() {
      const wrap = document.getElementById('le-auto-section'), box = document.getElementById('container-life-events-auto');
      if (!wrap || !box) return;
      const auto = buildDebtPlanEvents(state);
      wrap.classList.toggle('hidden', auto.length === 0);
      box.innerHTML = auto.map(ev => {
        const line = ev.direction === 'out'
          ? t('leAutoExtraLine').replace('{amount}', fmt(ev.amount)).replace('{time}', dpMonthsText(ev.toMonth))
          : t('leAutoFreedLine').replace('{amount}', fmt(ev.amount)).replace('{date}', dpDateText(ev.fromMonth));
        return `<div class="p-3.5 bg-slate-950 rounded-xl border ${ev.direction === 'in' ? 'border-emerald-500/30' : 'border-slate-800'} space-y-1.5 text-xs">
          <div class="flex justify-between items-center gap-2">
            <span class="font-bold text-white">🔗 ${escapeHtml(leEventName(ev))}</span>
            <button onclick="switchTab('view-balancesheet')" class="text-gold-400 hover:text-gold-300 font-semibold whitespace-nowrap">${t('leAutoEdit')} ↗</button>
          </div>
          <p class="text-slate-400 leading-relaxed">${escapeHtml(line)}</p>
        </div>`;
      }).join('');
    }

    function leYearNow() { return new Date().getFullYear(); }
    function lePrimaryAge() { return (state.earners && state.earners.length > 0) ? (Number(state.earners[0].age) || 35) : 35; }
    function leFirstEarnerNet() {
      const s = JSON.parse(JSON.stringify(state));
      s.earners = (s.earners || []).slice(0, 1);
      s.lifeEvents = [];
      return Math.round(calculateMetricsFor(s).totalEarnersNet);
    }

    // ---------- editing ----------
    window.addLifeEvent = function(template) {
      const cy = leYearNow(), base = Date.now();
      const mk = (i, o) => Object.assign({ id: base + i, kind: 'oneoff', direction: 'out', name: '', year: cy + 1, amount: 0, years: 1, enabled: true }, o);
      let list;
      if (template === 'home') {
        list = [mk(0, { name: t('leTplHomeDown'), year: cy + 2 }),
                mk(1, { name: t('leTplHomeMonthly'), kind: 'monthly', year: cy + 2, years: 25 })];
      } else if (template === 'career') {
        list = [mk(0, { name: t('leTplCareer'), kind: 'monthly', amount: leFirstEarnerNet(), years: 1 })];
      } else if (template === 'windfall') {
        list = [mk(0, { name: t('leTplWindfall'), direction: 'in' })];
      } else if (template === 'tuition') {
        list = [mk(0, { name: t('leTplTuition'), kind: 'monthly', year: cy + 2, years: 4 })];
      } else if (template === 'purchase') {
        list = [mk(0, { name: t('leTplPurchase') })];
      } else {
        list = [mk(0, { name: t('leTplCustom') })];
      }
      state.lifeEvents = (state.lifeEvents || []).concat(list);
      handleDataUpdate();
    };

    window.updateLifeEvent = function(id, field, val) {
      const ev = (state.lifeEvents || []).find(x => x.id === id);
      if (!ev) return;
      if (field === 'amount') ev.amount = Math.min(SAN_MONEY_MAX, Math.max(0, parseFloat(val) || 0));
      else if (field === 'year') ev.year = Math.min(2200, Math.max(1990, Math.round(parseFloat(val)) || leYearNow()));
      // Same fix as the sabbatical duration field (ui/tab-scenarios.js): empty stays
      // null (shown as an empty field, not forced back to 1 mid-edit) rather than
      // clamping on every keystroke, which made it hard to clear and freely retype.
      else if (field === 'years') ev.years = (val === '' || val === null || val === undefined) ? null : Math.min(60, Math.max(1, Math.round(parseFloat(val)) || 1));
      else if (field === 'enabled') ev.enabled = !!val;
      else if (field === 'kind') ev.kind = val === 'monthly' ? 'monthly' : 'oneoff';
      else if (field === 'direction') ev.direction = val === 'in' ? 'in' : 'out';
      else if (field === 'name') ev.name = String(val).slice(0, 80);
      handleDataUpdate();
    };

    window.removeLifeEvent = function(id) {
      state.lifeEvents = (state.lifeEvents || []).filter(x => x.id !== id);
      handleDataUpdate();
    };

    // ---------- the two projections: with and without the events ----------
    function leProjections(m) {
      const params = {
        start: m.totalLiquidBase, monthlyInvest: m.monthlyInvest, years: LIFE_EVENT_HORIZON_YEARS, realReturn: m.realAnnualReturn,
        careerGrowthRate: m.careerGrowthRate, careerGrowthProportional: m.careerGrowthProportional, surplus: m.monthlySurplus
      };
      const withEv = simulateRealPortfolio(Object.assign({ events: m.lifeEvents }, params));
      const without = simulateRealPortfolio(Object.assign({ events: [] }, params));
      const cross = (vals) => { const i = vals.findIndex(v => v >= m.targetFreedomCapital); return i < 0 ? null : i; };
      return { withEv, without, crossWith: cross(withEv.values), crossWithout: cross(without.values) };
    }

    // ---------- rendering ----------
    function renderLifeEventsList() {
      const container = document.getElementById('container-life-events');
      if (!container) return;
      const focusState = saveFocusState();
      container.innerHTML = '';
      const cy = leYearNow(), age0 = lePrimaryAge();
      const events = (state.lifeEvents || []).slice().sort((a, b) => (a.year - b.year) || (a.id - b.id));
      if (events.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 p-3 rounded-xl border border-dashed border-slate-800">${t('leEmpty')}</p>`;
      }
      events.forEach(ev => {
        const monthly = ev.kind === 'monthly';
        const end = ev.year + (ev.years || 1) - 1;
        const hints = [];
        if (!(Number(ev.amount) > 0)) hints.push(t('leHintAmount'));
        if (monthly ? end < cy : ev.year < cy) hints.push(t('leHintPast'));
        else if (ev.year - cy > LIFE_EVENT_HORIZON_YEARS) hints.push(t('leHintFar'));
        const when = monthly
          ? `${ev.year}–${end} · ${t('leAge')} ${age0 + ev.year - cy}–${age0 + end - cy}`
          : `${ev.year} · ${t('leAge')} ${age0 + ev.year - cy}`;
        const inflow = ev.direction === 'in';
        const div = document.createElement('div');
        div.className = `p-3.5 bg-slate-950 rounded-xl border ${ev.enabled === false ? 'border-slate-800 opacity-60' : (inflow ? 'border-emerald-500/30' : 'border-slate-800')} space-y-2.5 text-xs`;
        div.innerHTML = `
          <div class="flex justify-between items-center gap-2">
            <span class="text-base">${monthly ? '🔁' : '📌'}</span>
            <input type="text" data-focus-key="event-${ev.id}-name" value="${escapeHtml(ev.name)}" oninput="updateLifeEvent(${ev.id}, 'name', this.value)" class="font-bold text-white bg-transparent border-b border-slate-800 focus:border-gold-500 focus:outline-none w-full px-1 py-0.5" maxlength="80">
            <label class="flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap cursor-pointer" title="${escapeHtml(t('leOnTip'))}">
              <input type="checkbox" data-focus-key="event-${ev.id}-enabled" ${ev.enabled === false ? '' : 'checked'} onchange="updateLifeEvent(${ev.id}, 'enabled', this.checked)" class="rounded border-slate-700 text-teal-500 focus:ring-teal-400"> ${t('leOn')}
            </label>
            <button onclick="removeLifeEvent(${ev.id})" class="text-rose-400 hover:text-rose-300 font-bold flex-shrink-0" title="${escapeHtml(t('leDelete'))}">✕</button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-${monthly ? 5 : 4} gap-2">
            <div class="space-y-0.5">
              <span class="text-[10px] text-slate-400 block">${t('leType')}</span>
              <select data-focus-key="event-${ev.id}-kind" onchange="updateLifeEvent(${ev.id}, 'kind', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-semibold">
                <option value="oneoff" ${monthly ? '' : 'selected'}>${t('leKindOneoff')}</option>
                <option value="monthly" ${monthly ? 'selected' : ''}>${t('leKindMonthly')}</option>
              </select>
            </div>
            <div class="space-y-0.5">
              <span class="text-[10px] text-slate-400 block">${t('leDirection')}</span>
              <select data-focus-key="event-${ev.id}-direction" onchange="updateLifeEvent(${ev.id}, 'direction', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-semibold">
                <option value="out" ${inflow ? '' : 'selected'}>${t('leDirOut')}</option>
                <option value="in" ${inflow ? 'selected' : ''}>${t('leDirIn')}</option>
              </select>
            </div>
            <div class="space-y-0.5">
              <span class="text-[10px] text-slate-400 block">${monthly ? t('leAmountMonthly') : t('leAmount')}</span>
              <input type="number" min="0" step="100" data-focus-key="event-${ev.id}-amount" value="${ev.amount}" oninput="updateLifeEvent(${ev.id}, 'amount', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold">
            </div>
            <div class="space-y-0.5">
              <span class="text-[10px] text-slate-400 block">${monthly ? t('leStartYear') : t('leYear')}</span>
              <input type="number" min="1990" max="2200" step="1" data-focus-key="event-${ev.id}-year" value="${ev.year}" oninput="updateLifeEvent(${ev.id}, 'year', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold">
            </div>
            ${monthly ? `<div class="space-y-0.5">
              <span class="text-[10px] text-slate-400 block">${t('leDuration')}</span>
              <input type="number" min="1" max="60" step="1" data-focus-key="event-${ev.id}-years" value="${ev.years === null ? '' : (ev.years || 1)}" oninput="updateLifeEvent(${ev.id}, 'years', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold">
            </div>` : ''}
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2 text-[10px]">
            <span class="text-slate-400">${when}</span>
            ${hints.map(h => `<span class="text-amber-400">⚠ ${h}</span>`).join('')}
          </div>`;
        container.appendChild(div);
      });
      restoreFocusState(focusState);
    }

    function renderLifeEventsVerdict(m, p) {
      const box = document.getElementById('le-verdict');
      if (!box) return;
      const lines = [];
      const active = (m.lifeEvents || []).filter(e => e.enabled !== false && Number(e.amount) > 0);
      const age0 = lePrimaryAge(), cy = leYearNow();
      const at = (i) => ({ age: age0 + i, year: cy + i });
      if (active.length === 0) {
        lines.push({ tone: 'info', text: t('leVerdictNone') });
      } else {
        const a = p.crossWithout, b = p.crossWith;
        const v = { age: b === null ? '' : at(b).age, year: b === null ? '' : at(b).year, age0: a === null ? '' : at(a).age, year0: a === null ? '' : at(a).year };
        if (a === null && b === null) lines.push({ tone: 'warn', text: t('leVerdictNeither') });
        else if (a === null) lines.push({ tone: 'good', text: wiFill('leVerdictNowReached', v) });
        else if (b === null) lines.push({ tone: 'warn', text: wiFill('leVerdictNowLost', v) });
        else if (b === a) lines.push({ tone: 'info', text: wiFill('leVerdictSame', v) });
        else if (b > a) lines.push({ tone: 'warn', text: wiFill('leVerdictLater', Object.assign({ years: wiYearsText(b - a) }, v)) });
        else lines.push({ tone: 'good', text: wiFill('leVerdictEarlier', Object.assign({ years: wiYearsText(a - b) }, v)) });
      }
      if (p.withEv.depletedAtYear !== null) {
        lines.push({ tone: 'warn', text: wiFill('leWarnDepleted', { year: cy + p.withEv.depletedAtYear, amount: fmt(p.withEv.unfunded) }) });
      }
      const cls = { good: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200', warn: 'border-amber-500/40 bg-amber-950/30 text-amber-200', info: 'border-slate-700 bg-slate-950 text-slate-300' };
      box.innerHTML = lines.map(l => `<p class="p-3 rounded-xl border text-xs leading-relaxed ${cls[l.tone]}">${escapeHtml(l.text)}</p>`).join('');
    }

    function renderLifeEventsChart(m, p) {
      const canvas = document.getElementById('chart-life-events');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const n = LIFE_EVENT_HORIZON_YEARS, cy = leYearNow(), age0 = lePrimaryAge();
      const labels = Array.from({ length: n + 1 }, (_, i) => cy + i);
      // names of the events that start in each year (shown in the tooltip; marked on the line)
      const namesAt = labels.map(() => []);
      (m.lifeEvents || []).forEach(ev => {
        if (ev.enabled === false || !(Number(ev.amount) > 0)) return;
        const k = Math.round(ev.year - cy);
        if (k >= 0 && k <= n) namesAt[k].push(`${ev.direction === 'in' ? '＋' : '−'} ${leEventName(ev)}`);
      });
      const round = (a) => a.map(Math.round);
      if (lifeEventsChartInstance) lifeEventsChartInstance.destroy();
      lifeEventsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: t('leSeriesWithout'), data: round(p.without.values), borderColor: '#94a3b8', borderDash: [5, 4], borderWidth: 1.6, pointRadius: 0, fill: false, tension: 0.3 },
            { label: t('leSeriesWith'), data: round(p.withEv.values), borderColor: BRAND.gold, backgroundColor: 'rgba(197, 155, 39, 0.10)', fill: true, tension: 0.3, borderWidth: 2.5,
              pointRadius: namesAt.map(a => a.length ? 5 : 0), pointBackgroundColor: BRAND.gold },
            { label: t('rtChartTarget'), data: labels.map(() => Math.round(m.targetFreedomCapital)), borderColor: BRAND.orange, borderDash: [2, 4], borderWidth: 1.3, pointRadius: 0, fill: false }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#94a3b8', font: { size: 10, family: 'Inter' } } },
            tooltip: { callbacks: {
              title: (items) => { const i = items[0].dataIndex; return `${labels[i]} · ${t('leAge')} ${age0 + i}`; },
              afterBody: (items) => namesAt[items[0].dataIndex]
            } }
          },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 }, callback: v => (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k') } }
          }
        }
      });
    }

    function renderLifeEvents(m) {
      const view = document.getElementById('view-events');
      if (!view || view.classList.contains('hidden')) return;      // only work when the tab is open
      m = m || calculateMetrics();
      renderLifeEventsList();
      renderLifeEventsAuto();
      const p = leProjections(m);
      renderLifeEventsVerdict(m, p);
      renderLifeEventsChart(m, p);
    }

