    // =====================================================================
    // Debt payoff planner: engine (pure functions, no DOM).
    // Compares paying only the minimums with the two classic strategies:
    //   snowball  = extra money goes to the SMALLEST balance first (quick wins)
    //   avalanche = extra money goes to the HIGHEST interest rate first (least interest)
    // The rule for both: pay every minimum; the rest of the monthly budget (the extra
    // amount PLUS the payments freed by debts already cleared) attacks the target debt.
    // Interest uses the same convention as the "annual interest cost" on the Balance
    // Sheet: the rate is an effective ANNUAL rate, so a year of interest on an unchanged
    // balance equals balance x rate. Payments are made at the end of each month.
    // =====================================================================
    const DEBT_PLAN_MAX_MONTHS = 600;            // 50 years; beyond that a debt counts as "never paid off"
    const DEBT_ESTIMATED_MIN_PCT = 0.01;         // estimated payment = one month of interest + 1% of the balance

    function debtMonthlyRate(annualPct) {
      return Math.pow(1 + Math.max(0, Number(annualPct) || 0) / 100, 1 / 12) - 1;
    }
    function estimateDebtPayment(balance, annualPct) {
      return balance * (debtMonthlyRate(annualPct) + DEBT_ESTIMATED_MIN_PCT);
    }

    // Level payment that pays `balance` off in exactly `months` months (standard annuity formula).
    function annuityPayment(balance, ratePct, months) {
      if (!(months > 0) || !(balance > 0)) return 0;
      const i = debtMonthlyRate(ratePct);
      return i > 0 ? balance * i / (1 - Math.pow(1 + i, -months)) : balance / months;
    }

    // Everything the app knows about one property's mortgage, in the base currency.
    // The payment comes from, in this order: what the person entered, else the payment implied by
    // the remaining term (people usually know "22 years left"), else an ESTIMATE (flagged as such).
    function resolveMortgageTerms(r, st) {
      const cur = r.currency || st.baseCurrency;
      const balance = convertToBase(Math.max(0, Number(r.mortgageDebt) || 0), cur);
      const ratePct = Math.max(0, Number(r.mortgageRatePct) || 0);
      const given = convertToBase(Math.max(0, Number(r.mortgagePayment) || 0), cur);
      const termYears = Math.max(0, Number(r.mortgageTermYears) || 0);
      let payment, source;
      if (given > 0) { payment = given; source = 'entered'; }
      else if (termYears > 0 && balance > 0) { payment = annuityPayment(balance, ratePct, Math.round(termYears * 12)); source = 'term'; }
      else { payment = estimateDebtPayment(balance, ratePct); source = 'estimated'; }
      return { balance, ratePct, payment, source, termYears, givenPayment: source === 'entered' ? given : 0 };
    }

    // The debts the planner works with, taken from the Balance Sheet data. Balances live in
    // the debts card / property cards; the planner only adds the payment and (for
    // properties) the rate. A payment left at 0 is ESTIMATED and flagged as such.
    function buildPlanDebts(st, includeMortgages) {
      const out = [];
      const d = (st && st.debts) || {};
      const add = (id, kind, name, balance, ratePct, payment) => {
        balance = Math.max(0, Number(balance) || 0);
        if (balance <= 0) return;
        const rate = Math.max(0, Number(ratePct) || 0);
        const given = Math.max(0, Number(payment) || 0);
        out.push({ id, kind, name, balance, ratePct: rate, payment: given > 0 ? given : estimateDebtPayment(balance, rate), estimated: !(given > 0), givenPayment: given });
      };
      add('installments', 'installments', null, d.parcelas, 0, d.parcelasMinPayment);          // interest-free by definition
      add('revolving', 'revolving', null, d.revolving, d.revolvingRatePct, d.revolvingMinPayment);
      add('auto', 'auto', null, d.autoLoans, d.autoLoansRatePct, d.autoLoansMinPayment);
      if (includeMortgages) {
        (st.realEstate || []).forEach(r => {
          const x = resolveMortgageTerms(r, st);
          if (x.balance <= 0) return;
          out.push({ id: 'mortgage-' + r.id, kind: 'mortgage', name: r.name || '', balance: x.balance, ratePct: x.ratePct, payment: x.payment,
                     estimated: x.source === 'estimated', derivedFromTerm: x.source === 'term', givenPayment: x.givenPayment });
        });
      }
      return out;
    }

    // strategy: 'minimum' | 'snowball' | 'avalanche'
    function simulateDebtPayoff(debts, extraMonthly, strategy) {
      const EPS = 1e-9;
      const items = debts.map(d => ({ id: d.id, bal: d.balance, i: debtMonthlyRate(d.ratePct), rate: d.ratePct, pay: d.payment, interest: 0, doneMonth: null }));
      const rolling = strategy === 'snowball' || strategy === 'avalanche';
      const budget = items.reduce((s, x) => s + x.pay, 0) + (rolling ? Math.max(0, Number(extraMonthly) || 0) : 0);
      const total = () => items.reduce((s, x) => s + x.bal, 0);
      const series = [total()];
      let totalInterest = 0, totalPaid = 0, month = 0, firstDone = null;
      while (month < DEBT_PLAN_MAX_MONTHS && items.some(x => x.doneMonth === null)) {
        month++;
        items.forEach(x => {                                   // 1. interest on what is still owed
          if (x.doneMonth !== null) return;
          const it = x.bal * x.i; x.bal += it; x.interest += it; totalInterest += it;
        });
        let paidMinimums = 0;
        items.forEach(x => {                                   // 2. every minimum payment
          if (x.doneMonth !== null) return;
          let p = Math.min(x.pay, x.bal);
          if (x.bal - p < 0.005) p = x.bal;          // float residue below half a cent is absorbed by the final payment
          x.bal -= p; paidMinimums += p; totalPaid += p;
        });
        if (rolling) {                                         // 3. everything left in the budget hits the target debt
          let pool = budget - paidMinimums;
          const active = items.filter(x => x.doneMonth === null && x.bal > EPS);
          active.sort(strategy === 'avalanche'
            ? (a, b) => (b.rate - a.rate) || (a.bal - b.bal)
            : (a, b) => (a.bal - b.bal) || (b.rate - a.rate));
          for (const x of active) {
            if (pool <= EPS) break;
            let p = Math.min(pool, x.bal);
            if (x.bal - p < 0.005 && pool >= x.bal - 0.005) p = x.bal;
            x.bal -= p; pool -= p; totalPaid += p;
          }
        }
        items.forEach(x => {                                   // 4. who is finished?
          if (x.doneMonth === null && x.bal <= EPS) { x.bal = 0; x.doneMonth = month; if (firstDone === null) firstDone = month; }
        });
        series.push(total());
      }
      const done = items.every(x => x.doneMonth !== null);
      return {
        strategy, months: done ? month : null,
        totalInterest: done ? totalInterest : null, totalPaid: done ? totalPaid : null,
        firstDoneMonth: firstDone, series,
        payoffs: items.map(x => ({ id: x.id, month: x.doneMonth, interest: x.interest }))
      };
    }

    function compareDebtStrategies(debts, extraMonthly) {
      const minimum = simulateDebtPayoff(debts, 0, 'minimum');
      const snowball = simulateDebtPayoff(debts, extraMonthly, 'snowball');
      const avalanche = simulateDebtPayoff(debts, extraMonthly, 'avalanche');
      return { minimum, snowball, avalanche };
    }

    // Every debt's monthly payment, for the Cash Flow tab. Mortgages are always included here
    // (they are real cash leaving the month), whether or not the payoff plan covers them.
    // A payment left blank is the planner's estimate (see estimateDebtPayment) and is counted
    // separately so the screen can say how much of the line is estimated.
    function getMonthlyDebtPayments(st) {
      const debts = buildPlanDebts(st, true);
      const estimated = debts.filter(d => d.estimated);
      return {
        total: debts.reduce((s, d) => s + d.payment, 0),
        estimatedTotal: estimated.reduce((s, d) => s + d.payment, 0),
        estimatedCount: estimated.length,
        count: debts.length
      };
    }

    // The payoff plan as automatic Life events (derived every time, never stored, so they cannot
    // go stale). They enter the same projection as the events the person adds:
    //  1. EXTRA payments: the plan's extra amount leaves the monthly surplus (and, if the surplus
    //     is not enough, the monthly investing) from month 1 until the last debt is cleared.
    //  2. FREED payments: from the month after the last debt is cleared, the payments that were in
    //     the Cash Flow (the sum of the debts' payments) are no longer made and are invested.
    // Nothing is created if the plan never finishes, if there are no debts, or if the person
    // turned "send freed payments to investing" off.
    function buildDebtPlanEvents(st) {
      const plan = Object.assign({ extraMonthly: 0, includeMortgages: false, method: 'avalanche', autoEvents: true }, (st && st.debtPlan) || {});
      if (!plan.autoEvents) return [];
      const debts = buildPlanDebts(st, !!plan.includeMortgages);
      if (debts.length === 0) return [];
      const sim = simulateDebtPayoff(debts, plan.extraMonthly, plan.method === 'snowball' ? 'snowball' : 'avalanche');
      if (sim.months === null || sim.months < 1) return [];
      const T = sim.months, cy = new Date().getFullYear();
      const paymentsSum = debts.reduce((s, d) => s + d.payment, 0);
      const extra = Math.max(0, Number(plan.extraMonthly) || 0);
      const out = [];
      if (extra > 0) {
        out.push({ id: -1, auto: true, kind: 'monthly', direction: 'out', nameKey: 'dpEventExtra', year: cy, years: Math.ceil(T / 12), amount: extra, fromMonth: 1, toMonth: T, enabled: true });
      }
      if (paymentsSum > 0) {
        out.push({ id: -2, auto: true, kind: 'monthly', direction: 'in', nameKey: 'dpEventFreed', year: cy + Math.floor(T / 12), years: 60, amount: paymentsSum, fromMonth: T + 1, toMonth: null, enabled: true });
      }
      return out;
    }

