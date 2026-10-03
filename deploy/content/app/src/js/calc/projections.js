    /**
     * Capitaliza el capital inicial y los aportes mensuales a lo largo de 1 año.
     * Utiliza la fórmula de valor futuro de una anualidad anticipada (Annuity Due / "Pague-se Primeiro"),
     * garantizando que cada aporte mensual comience a devengar intereses desde el inicio del período.
     */
    function compoundOneYear(startingCapital, monthlyContribution, annualRate) {
      const capital = Number(startingCapital) || 0;
      const pmt = Number(monthlyContribution) || 0;
      const r = Number(annualRate) || 0;

      if (pmt === 0 && capital === 0) return 0;
      if (1 + r <= 0) return 0;

      if (Math.abs(r) < 0.00001) {
        return capital + (pmt * 12);
      }

      // Tasa mensual equivalente geométrica: i = (1 + r)^(1/12) - 1
      const monthlyRate = Math.pow(1 + r, 1 / 12) - 1;

      // Valor futuro de 12 aportes mensuales anticipados: PMT * [((1 + i)^12 - 1) / i] * (1 + i)
      const fvAnnuity = pmt * ((Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate) * (1 + monthlyRate);

      return (capital * (1 + r)) + fvAnnuity;
    }

    // Projects the monthly investment contribution for a future projection
    // year, accounting for real (above-inflation) career growth — raises,
    // promotions, job changes — building on top of today's contribution.
    // `yearIndex` is 0 for the current year (no growth applied yet), 1 for one
    // year of growth, etc. When `proportional` is false, the household is
    // assumed to keep contributing the same real amount regardless of any
    // raises (lifestyle inflation absorbs the difference instead) — the more
    // conservative default for a safety-oriented planning tool. `growthRate` is
    // a real percentage (already net of inflation, consistent with the rest of
    // this engine, which projects in real terms via the Fisher equation).
    function getProjectedMonthlyContribution(baseMonthlyInvest, yearIndex, growthRate, proportional) {
      const base = Number(baseMonthlyInvest) || 0;
      if (!proportional) return base;
      const rate = Number(growthRate) || 0;
      if (rate === 0) return base;
      return base * Math.pow(1 + (rate / 100), yearIndex);
    }

    // ---- Life events -------------------------------------------------------
    // A life event is either a ONE-OFF amount (kind 'oneoff': a bonus, an inheritance,
    // a down payment, a car...) or a MONTHLY amount for a number of years (kind
    // 'monthly': a career break, tuition years, a mortgage payment, new rental income).
    // direction 'in' = money coming in, 'out' = money going out. Amounts are positive
    // numbers in the profile's base currency, in today's purchasing power.
    // Turns the events into two arrays indexed by "years from now" (0 = this year):
    //   oneOff[k]  : net one-off amount at the START of year k
    //   monthly[k] : net monthly amount active during year k
    // Events in the past are ignored (a monthly event that started in the past but
    // has not ended yet still counts for its remaining years); events beyond the
    // horizon are ignored; disabled events are ignored.
    function buildLifeEventSchedule(events, years, currentYear) {
      const cy = currentYear === undefined ? new Date().getFullYear() : currentYear;
      const oneOff = new Array(years + 1).fill(0);
      const monthly = new Array(years + 1).fill(0);
      (Array.isArray(events) ? events : []).forEach(ev => {
        if (!ev || ev.enabled === false) return;
        const amt = (ev.direction === 'in' ? 1 : -1) * (Number(ev.amount) || 0);
        if (!amt) return;
        // Month-precise form (used by the automatic debt-plan events): `fromMonth`..`toMonth`
        // are counted in months from now (1 = next month; toMonth null = open-ended), and each
        // year gets the fraction of its 12 months that overlap. Sub-annual timing stays exact.
        if (ev.kind === 'monthly' && typeof ev.fromMonth === 'number') {
          const to = typeof ev.toMonth === 'number' ? ev.toMonth : Infinity;
          for (let yr = 0; yr <= years; yr++) {
            const overlap = Math.max(0, Math.min(12 * yr + 12, to) - Math.max(12 * yr + 1, ev.fromMonth) + 1);
            if (overlap > 0) monthly[yr] += amt * overlap / 12;
          }
          return;
        }
        const k = Math.round((Number(ev.year) || cy) - cy);
        if (ev.kind === 'monthly') {
          const dur = Math.max(1, Math.round(Number(ev.years) || 1));
          for (let j = 0; j < dur; j++) {
            const idx = k + j;
            if (idx >= 0 && idx <= years) monthly[idx] += amt;
          }
        } else if (k >= 0 && k <= years) {
          oneOff[k] += amt;
        }
      });
      return { oneOff, monthly };
    }

    // THE projection of the liquid portfolio, in real terms, one value per year
    // (values[0] = today, values[years] = years from now). Used by the freedom-year
    // calculation, the Retirement chart, the What-if tab and the Life events tab, so
    // they can never disagree.
    // Each year: the monthly investment (with career growth) compounds at the real
    // return. Life events change that as follows:
    //  - a ONE-OFF amount is added/removed at the start of its year;
    //  - a MONTHLY amount that brings money IN is invested;
    //  - a MONTHLY amount that takes money OUT is paid first from the unallocated
    //    monthly surplus (`surplus`), then by investing less, and if that is not enough
    //    the portfolio pays the rest (a negative contribution = withdrawals).
    // The portfolio cannot go below zero: what it cannot cover is reported as
    // `unfunded`, with the year it ran out (`depletedAtYear`).
    // With no events the arithmetic is exactly the plain compounding loop this replaced.
    function simulateRealPortfolio(o) {
      const years = Math.max(0, Math.floor(o.years) || 0);
      const sched = buildLifeEventSchedule(o.events, years, o.currentYear);
      const surplus = Math.max(0, Number(o.surplus) || 0);
      let proj = o.start;
      let unfunded = 0, depletedAtYear = null;
      const settle = (idx) => {
        if (proj < 0) { unfunded += -proj; if (depletedAtYear === null) depletedAtYear = idx; proj = 0; }
      };
      if (sched.oneOff[0] !== 0) { proj += sched.oneOff[0]; settle(0); }
      const values = [proj];
      for (let y = 0; y < years; y++) {
        let contribution = getProjectedMonthlyContribution(o.monthlyInvest, y, o.careerGrowthRate, o.careerGrowthProportional);
        const d = sched.monthly[y];
        if (d !== 0) contribution += d > 0 ? d : -Math.max(0, -d - surplus);
        proj = compoundOneYear(proj, contribution, o.realReturn);
        settle(y + 1);
        if (sched.oneOff[y + 1] !== 0) { proj += sched.oneOff[y + 1]; settle(y + 1); }
        values.push(proj);
      }
      return { values, depletedAtYear, unfunded };
    }

    // Single source of truth for "how many months does this goal have left" and
    // "how much does it need per month" — used by calculateMetrics (for the
    // Balance Sheet / Cash Flow integration) and by the Goals tab render, so the
    // displayed contribution is always exactly what feeds the rest of the app.
    function getGoalMonthsRemaining(g) {
      const raw = Number(g.timeValue) || 0;
      const months = g.timeUnit === 'years' ? raw * 12 : raw;
      return Math.max(1, Math.round(months)); // floor of 1 month avoids div-by-zero / negative time
    }

    function getGoalRemainingAmount(g) {
      const target = Number(g.targetAmount) || 0;
      const saved = Number(g.currentSaved) || 0;
      return Math.max(0, target - saved);
    }

    function getGoalMonthlyContribution(g) {
      const remaining = getGoalRemainingAmount(g);
      if (remaining <= 0) return 0; // goal already reached — no further contribution needed
      return remaining / getGoalMonthsRemaining(g);
    }

    // Shared savings goals ("joint" owner): with per-earner contribution tracking on, this
    // compares each earner's own contribution against an EQUAL split of the total saved so
    // far — not a true time-based pace (this app does not timestamp individual contributions,
    // only running totals), so this answers "who has put in more than their equal share of
    // what's saved so far", not "who is on schedule". null when tracking is off, or with
    // fewer than 2 earners (nothing to compare against).
    function getGoalContributionBalance(goal, earners) {
      if (!goal.trackContributions || !Array.isArray(earners) || earners.length < 2) return null;
      const contributions = goal.contributions || {};
      const total = earners.reduce((s, e) => s + (Number(contributions[e.id]) || 0), 0);
      const fairShare = total / earners.length;
      return earners.map(e => {
        const contributed = Number(contributions[e.id]) || 0;
        return { earnerId: e.id, name: e.name, contributed, fairShare, diff: contributed - fairShare };
      });
    }

