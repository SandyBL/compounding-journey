    // =====================================================================
    // Withdrawal phase: taxes on withdrawals, a year-by-year drawdown, and the allocation
    // summary. Pure functions, no DOM. Everything is in REAL terms (today's purchasing power),
    // in the profile's base currency.
    // =====================================================================
    // Every liquid holding falls in one of four tax classes for withdrawals:
    //   taxable    - tax is due on the GAIN part of what you withdraw (funds, stocks, CDBs...)
    //   defGains   - tax-deferred, taxed on gains only (Brazil's VGBL)
    //   deferred   - tax-deferred, the WHOLE withdrawal is taxed (PGBL, Spain's plan de pensiones)
    //   exempt     - no tax on withdrawal (LCI/LCA, ...)
    const WD_ORDERS = {
      taxable_first: ['taxable', 'defGains', 'deferred', 'exempt'],
      deferred_first: ['deferred', 'defGains', 'taxable', 'exempt'],
      proportional: null
    };
    const WD_DEFAULT_GAIN_PCT = 30;       // assumed share of a taxable holding that is unrealized gain, when not entered

    // Spain: savings-income scale (base del ahorro), Renta 2025 / year 2026 (CNMV guide, Jan 2026).
    // Applies progressively to realized gains, dividends and interest. Update once a year.
    const ES_SAVINGS_SCALE_YEAR = 2026;
    const ES_SAVINGS_SCALE = [[6000, 0.19], [50000, 0.21], [200000, 0.23], [300000, 0.27], [Infinity, 0.30]];
    function esSavingsTax(gains) {
      let left = Math.max(0, Number(gains) || 0), lower = 0, tax = 0;
      for (const [upper, rate] of ES_SAVINGS_SCALE) {
        const slice = Math.min(left, upper - lower);
        if (slice <= 0) break;
        tax += slice * rate; left -= slice; lower = upper;
      }
      return tax;
    }

    function resolveWithdrawalTaxClass(item) {
      const w = item.wdTax || 'auto';
      if (w === 'taxable' || w === 'deferred' || w === 'defGains' || w === 'exempt') return w;
      const a = item.accountType || 'none';
      if (a === 'pgbl' || a === 'pension_plan' || a === 'tax_deferred') return 'deferred';
      if (a === 'vgbl') return 'defGains';
      return 'taxable';
    }

    // The liquid portfolio grouped by tax class: balance, cost basis (for the classes taxed on gains)
    // and the balance-weighted yield. Foreign holdings are converted to the base currency.
    function buildWithdrawalBuckets(st) {
      const mk = () => ({ bal: 0, basis: 0, yieldSum: 0, yield: 0 });
      const b = { taxable: mk(), defGains: mk(), deferred: mk(), exempt: mk() };
      (st.liquidInvestments || []).forEach(it => {
        const bal = convertToBase(Math.max(0, Number(it.balanceOriginal) || 0), it.currency || st.baseCurrency);
        if (bal <= 0) return;
        const k = resolveWithdrawalTaxClass(it), c = b[k];
        const gain = typeof it.gainPct === 'number' ? Math.min(100, Math.max(0, it.gainPct)) : WD_DEFAULT_GAIN_PCT;
        c.bal += bal;
        c.basis += (k === 'taxable' || k === 'defGains') ? bal * (1 - gain / 100) : 0;
        c.yieldSum += bal * (Number(it.annualYieldPct) || 0);
      });
      Object.keys(b).forEach(k => { b[k].yield = b[k].bal > 0 ? b[k].yieldSum / b[k].bal : 0; });
      return b;
    }
    function wdTotal(b) { return b.taxable.bal + b.defGains.bal + b.deferred.bal + b.exempt.bal; }
    function cloneBuckets(b) { const o = {}; Object.keys(b).forEach(k => { o[k] = Object.assign({}, b[k]); }); return o; }
    function scaleBuckets(b, total) {
      const t = wdTotal(b), f = t > 0 ? total / t : 0, o = cloneBuckets(b);
      Object.keys(o).forEach(k => { o[k].bal *= f; o[k].basis *= f; });
      return o;
    }
    const wdGainFrac = (c) => (c.bal > 0 ? Math.max(0, (c.bal - c.basis) / c.bal) : 0);

    // Tax configuration for the person's fiscal residence (editable rates for Brazil and Global).
    function wdTaxConfig(st) {
      const p = Object.assign({ brGainsPct: 15, brPensionPct: 10, glGainsPct: 15 }, st.withdrawalPlan || {});
      return { country: st.country || 'BR', brGainsPct: p.brGainsPct, brPensionPct: p.brPensionPct, glGainsPct: p.glGainsPct,
               glOrdinaryPct: typeof st.glMarginalTaxRatePct === 'number' ? st.glMarginalTaxRatePct : 25 };
    }

    // Annual tax on one year's withdrawals. f = realized gains from taxable holdings, realized gains
    // from tax-deferred-gains holdings, and the whole amount taken from deferred holdings.
    //  Spain : gains -> the savings scale; deferred (plan de pensiones) -> taxed as work income
    //          (calcSpainIRPF works on a monthly base, hence the /12 and x12).
    //  Brazil: gains at the capital-gains rate (15% = long-term fixed income and stocks); private pensions at
    //          the regressive-table rate (10% after 10 years); LCI/LCA exempt.
    //  Global: gains at one editable rate, deferred withdrawals at the ordinary (marginal) rate.
    function calcWithdrawalTax(cfg, f) {
      const gT = Math.max(0, f.gainsTaxable || 0), gD = Math.max(0, f.gainsDef || 0), dw = Math.max(0, f.deferredWhole || 0);
      if (cfg.country === 'ES') return esSavingsTax(gT + gD) + calcSpainIRPF(dw / 12) * 12;
      if (cfg.country === 'GL') return (gT + gD) * cfg.glGainsPct / 100 + dw * cfg.glOrdinaryPct / 100;
      return gT * cfg.brGainsPct / 100 + (gD + dw) * cfg.brPensionPct / 100;
    }

    // How a gross withdrawal W is taken from the holdings, in the chosen order.
    function planWithdrawal(W, b, order) {
      const total = wdTotal(b), take = { taxable: 0, defGains: 0, deferred: 0, exempt: 0 };
      const w = Math.min(Math.max(0, W), total);
      const seq = WD_ORDERS[order];
      if (!seq) { Object.keys(take).forEach(k => { take[k] = total > 0 ? w * b[k].bal / total : 0; }); }
      else { let left = w; seq.forEach(k => { const t = Math.min(left, b[k].bal); take[k] = t; left -= t; }); }
      return { take, flows: {
        gainsTaxable: b.taxable.bal > 0 ? take.taxable * wdGainFrac(b.taxable) : 0,
        gainsDef: b.defGains.bal > 0 ? take.defGains * wdGainFrac(b.defGains) : 0,
        deferredWhole: take.deferred } };
    }
    function wdNet(W, b, order, cfg) {
      const p = planWithdrawal(W, b, order);
      return Math.min(Math.max(0, W), wdTotal(b)) - calcWithdrawalTax(cfg, p.flows);
    }
    // The gross withdrawal that leaves `need` AFTER tax. depleted = even everything is not enough.
    function grossUpWithdrawal(need, b, order, cfg) {
      const total = wdTotal(b);
      if (!(need > 0)) return { gross: 0, depleted: false };
      if (wdNet(total, b, order, cfg) < need - 1e-9) return { gross: total, depleted: true };
      let lo = need, hi = total;
      for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (wdNet(mid, b, order, cfg) >= need) hi = mid; else lo = mid; }
      return { gross: hi, depleted: false };
    }
    function applyWithdrawal(b, take) {
      ['taxable', 'defGains'].forEach(k => { const c = b[k]; if (c.bal > 0 && take[k] > 0) { const f = Math.min(1, take[k] / c.bal); c.basis *= (1 - f); c.bal -= take[k]; } });
      ['deferred', 'exempt'].forEach(k => { b[k].bal = Math.max(0, b[k].bal - take[k]); });
      Object.keys(b).forEach(k => { if (b[k].bal < 1e-9) { b[k].bal = 0; b[k].basis = 0; } });
    }

    // Year-by-year drawdown. o: buckets (at the start age), order, cfg, years, startAge, spending (net of
    // tax, per year), pension (per year, net), pensionStartAge, realReturnPct (null = each class's own yield),
    // inflationPct. Each year: spending not covered by the pension is withdrawn (grossed up for tax) at the
    // START of the year, then what is left grows.
    function simulateWithdrawalPhase(o) {
      const b = cloneBuckets(o.buckets), rows = [];
      let totalTax = 0, totalGross = 0, depletedAge = null;
      const infl = Math.max(0, Number(o.inflationPct) || 0) / 100;
      const growth = (k) => (o.realReturnPct === null || o.realReturnPct === undefined)
        ? (1 + b[k].yield / 100) / (1 + infl) : 1 + o.realReturnPct / 100;
      const g0 = {}; Object.keys(b).forEach(k => { g0[k] = growth(k); });
      for (let y = 0; y < o.years; y++) {
        const age = o.startAge + y;
        const need = Math.max(0, o.spending - (age >= o.pensionStartAge ? o.pension : 0));
        const g = grossUpWithdrawal(need, b, o.order, o.cfg);
        const plan = planWithdrawal(g.gross, b, o.order);
        const tax = calcWithdrawalTax(o.cfg, plan.flows);
        applyWithdrawal(b, plan.take);
        totalTax += tax; totalGross += g.gross;
        rows.push({ age, need, gross: g.gross, tax, net: g.gross - tax, depleted: g.depleted, balanceStart: 0, balanceEnd: 0 });
        if (g.depleted) { depletedAge = age; rows[rows.length - 1].balanceEnd = 0; break; }
        Object.keys(b).forEach(k => { b[k].bal *= g0[k]; });          // growth on what is left (basis unchanged)
        rows[rows.length - 1].balanceEnd = wdTotal(b);
      }
      const last = rows[rows.length - 1];
      return { rows, totalTax, totalGross, depletedAge, lastsUntilAge: depletedAge !== null ? depletedAge : o.startAge + o.years,
               endBalance: depletedAge !== null ? 0 : (last ? last.balanceEnd : wdTotal(b)), first: rows[0] || null };
    }

    // How much bigger the freedom target must be once withdrawal taxes are counted. The target is
    // "spending / 4%", i.e. it assumes 4% of the portfolio can be SPENT. If part of every withdrawal goes
    // to tax, the portfolio must be larger: find T with net(4% of T) = 4% of the original target
    // (a fixed point; the tax rate depends on the size because of brackets). `mix` is the portfolio's
    // current class shares; with no holdings we assume a taxable portfolio with the default gain share.
    function withdrawalTaxFactor(st, baseTarget, order) {
      if (!(baseTarget > 0)) return 1;
      let mix = buildWithdrawalBuckets(st);
      if (!(wdTotal(mix) > 0)) mix = { taxable: { bal: 1, basis: 1 - WD_DEFAULT_GAIN_PCT / 100, yield: 0 }, defGains: { bal: 0, basis: 0, yield: 0 }, deferred: { bal: 0, basis: 0, yield: 0 }, exempt: { bal: 0, basis: 0, yield: 0 } };
      const cfg = wdTaxConfig(st), want = 0.04 * baseTarget;
      let T = baseTarget;
      for (let i = 0; i < 40; i++) {
        const sc = scaleBuckets(mix, T), G = 0.04 * T;
        const tax = calcWithdrawalTax(cfg, planWithdrawal(G, sc, order).flows);
        const next = baseTarget / Math.max(0.05, 1 - tax / G);      // the net share of each withdrawal is 1 - tax rate
        if (Math.abs(next - T) < 1e-9 * baseTarget) { T = next; break; }
        T = next;
      }
      return T / baseTarget;
    }

    // The liquid portfolio seen by risk, liquidity, tax class and currency, plus the "safe bucket":
    // low-volatility holdings that are not locked up, in years of spending. Holding a few years of
    // spending in them means a market drop early in retirement does not force selling growth assets.
    function summarizeAllocation(st, annualSpending, targetYears) {
      const out = { total: 0, byVolatility: { low: 0, medium: 0, high: 0 }, byLiquidity: { same_day: 0, short: 0, long: 0 },
                    byTaxClass: { taxable: 0, defGains: 0, deferred: 0, exempt: 0 }, byCurrency: {}, safe: 0 };
      (st.liquidInvestments || []).forEach(it => {
        const bal = convertToBase(Math.max(0, Number(it.balanceOriginal) || 0), it.currency || st.baseCurrency);
        if (bal <= 0) return;
        out.total += bal;
        out.byVolatility[it.volatilityTier || 'medium'] = (out.byVolatility[it.volatilityTier || 'medium'] || 0) + bal;
        out.byLiquidity[it.liquidityTier || 'short'] = (out.byLiquidity[it.liquidityTier || 'short'] || 0) + bal;
        out.byTaxClass[resolveWithdrawalTaxClass(it)] += bal;
        const cur = it.currency || st.baseCurrency;
        out.byCurrency[cur] = (out.byCurrency[cur] || 0) + bal;
        if ((it.volatilityTier || 'medium') === 'low' && (it.liquidityTier || 'short') !== 'long') out.safe += bal;
      });
      const spend = Math.max(0, Number(annualSpending) || 0);
      out.safeYears = spend > 0 ? out.safe / spend : null;
      out.safeTarget = spend * Math.max(0, Number(targetYears) || 0);
      out.safeShortfall = Math.max(0, out.safeTarget - out.safe);
      return out;
    }

    // Rebalancing: a target vs. actual split of "risky" (growth-oriented) vs. "not so risky"
    // (defensive) assets, derived from the SAME volatility tags already tracked per holding —
    // no new per-investment field. High volatility counts fully as risky, low fully as
    // not-risky; medium (genuinely ambiguous — a balanced fund, a REIT, ...) is split evenly
    // between the two, a defensible midpoint rather than an arbitrary side. A drift smaller
    // than REBALANCE_TOLERANCE_PP percentage points is treated as "close enough" (a common
    // practical rebalancing band) rather than prompting an action for a trivial difference.
    const REBALANCE_TOLERANCE_PP = 5;
    function computeRebalancingSuggestion(alloc, targetRiskyPct) {
      const target = Math.min(100, Math.max(0, Number(targetRiskyPct) || 0));
      if (!(alloc.total > 0)) {
        return { total: 0, riskyAmount: 0, nonRiskyAmount: 0, riskyPct: 0, nonRiskyPct: 0, targetRiskyPct: target, driftPct: 0, rebalanceAmount: 0, direction: null };
      }
      const riskyAmount = alloc.byVolatility.high + 0.5 * alloc.byVolatility.medium;
      const nonRiskyAmount = alloc.total - riskyAmount;
      const riskyPct = riskyAmount / alloc.total * 100;
      const driftPct = riskyPct - target;
      const targetRiskyAmount = alloc.total * target / 100;
      const rebalanceAmount = Math.abs(riskyAmount - targetRiskyAmount);
      const direction = Math.abs(driftPct) <= REBALANCE_TOLERANCE_PP ? null : (driftPct > 0 ? 'trimRisky' : 'addRisky');
      return { total: alloc.total, riskyAmount, nonRiskyAmount, riskyPct, nonRiskyPct: 100 - riskyPct, targetRiskyPct: target, driftPct, rebalanceAmount, direction };
    }

