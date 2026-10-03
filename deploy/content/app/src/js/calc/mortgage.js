    // =====================================================================
    // Mortgage: amortization schedule and the "prepay or invest?" comparison.
    // Pure functions, no DOM. Same conventions as the debt planner: the rate is an
    // effective ANNUAL rate (a year of interest on an unchanged balance = balance x rate),
    // interest accrues monthly, and payments are made at the END of each month.
    // =====================================================================
    const MORTGAGE_MAX_MONTHS = 600;      // 50 years

    // Month-by-month schedule. `extraMonthly` is paid on top of the payment every month;
    // `lumpSum` is paid today and reduces the balance immediately.
    // months = null means the payment never covers the interest (the balance grows).
    function buildAmortization(balance, ratePct, payment, opts) {
      const o = Object.assign({ extraMonthly: 0, lumpSum: 0, maxMonths: MORTGAGE_MAX_MONTHS }, opts || {});
      const EPS = 1e-9, CENT = 0.005, i = debtMonthlyRate(ratePct);
      const lump = Math.min(Math.max(0, Number(o.lumpSum) || 0), Math.max(0, balance));
      let bal = Math.max(0, balance) - lump;
      const monthlyPay = Math.max(0, payment) + Math.max(0, Number(o.extraMonthly) || 0);
      const rows = [];
      let interestSum = 0, paidSum = lump;
      while (bal > EPS && rows.length < o.maxMonths) {
        let interest = bal * i, due = bal + interest, pay = Math.min(monthlyPay, due);
        if (due - pay < CENT) pay = due;               // float residue: the last payment absorbs it, so no phantom extra month
        bal = due - pay;
        if (bal <= EPS) bal = 0;
        rows.push({ month: rows.length + 1, payment: pay, interest, principal: pay - interest, balance: bal });
        interestSum += interest; paidSum += pay;
      }
      const done = bal <= EPS;
      return { months: done ? rows.length : null, rows, totalInterest: done ? interestSum : null, totalPaid: done ? paidSum : null, lumpApplied: lump };
    }

    // The schedule grouped in years of 12 payments (year 0 = the next 12 payments).
    function summarizeAmortizationByYear(rows) {
      const years = [];
      rows.forEach(r => {
        const y = Math.ceil(r.month / 12) - 1;
        const a = years[y] || (years[y] = { year: y, payment: 0, interest: 0, principal: 0, balance: 0 });
        a.payment += r.payment; a.interest += r.interest; a.principal += r.principal; a.balance = r.balance;
      });
      return years;
    }

    // Prepay or invest? The SAME money either pays the mortgage down or is invested.
    // Fairness rule: both strategies have the same total monthly outlay (payment + extra):
    //  - PREPAY  pays payment + extra on the mortgage (and the lump sum today); once the mortgage
    //            is gone, the whole outlay is invested.
    //  - INVEST  pays only the scheduled payment on the mortgage and invests the extra (and the
    //            lump sum today); once the mortgage is gone, the whole outlay is invested.
    // Compared by NET WEALTH at the horizon = investments - what is still owed.
    // (If the investments earn exactly the mortgage's rate, both end with identical wealth.)
    // o: balance, ratePct, payment, extraMonthly, lumpSum, returnPct (before tax), taxPct,
    //    horizonMonths (0 = until the mortgage would end), inflationPct
    function comparePrepayInvest(o) {
      const EPS = 1e-9, CENT = 0.005;
      const extra = Math.max(0, Number(o.extraMonthly) || 0), lump = Math.max(0, Number(o.lumpSum) || 0);
      const payment = Math.max(0, Number(o.payment) || 0);
      const baseline = buildAmortization(o.balance, o.ratePct, payment);
      const H = o.horizonMonths > 0 ? Math.min(MORTGAGE_MAX_MONTHS, Math.round(o.horizonMonths))
        : (baseline.months !== null ? Math.max(1, baseline.months) : 360);
      const i = debtMonthlyRate(o.ratePct);
      const returnNetPct = Math.max(0, Number(o.returnPct) || 0) * (1 - Math.min(100, Math.max(0, Number(o.taxPct) || 0)) / 100);
      const rm = debtMonthlyRate(returnNetPct);
      const outlay = payment + extra;

      function run(prepay) {
        let bal = Math.max(0, o.balance), inv = 0, interest = 0, contributed = 0;
        if (prepay) { const l = Math.min(lump, bal); bal -= l; inv = lump - l; contributed = lump - l; }
        else { inv = lump; contributed = lump; }
        let freeMonth = bal <= EPS ? 0 : null;
        const wealth = [inv - bal], owed = [bal];
        for (let m = 1; m <= H; m++) {
          const it = bal > EPS ? bal * i : 0;
          interest += it;
          const due = bal + it;
          let pay = Math.min(prepay ? outlay : payment, due);
          if (due - pay < CENT) pay = due;
          bal = due - pay;
          if (bal <= EPS) { bal = 0; if (freeMonth === null) freeMonth = m; }
          const invested = outlay - pay;                 // whatever of the outlay is not used on the mortgage
          inv = inv * (1 + rm) + invested; contributed += invested;
          wealth.push(inv - bal); owed.push(bal);
        }
        const deflator = Math.pow(1 + Math.max(0, Number(o.inflationPct) || 0) / 100, H / 12);
        return { investments: inv, owed: bal, wealth: inv - bal, wealthReal: (inv - bal) / deflator, contributed, gains: inv - contributed, interest, freeMonth, series: wealth, owedSeries: owed };
      }
      const prepay = run(true), invest = run(false);
      const doNothingInterest = baseline.rows.slice(0, H).reduce((s, r) => s + r.interest, 0);
      return {
        horizonMonths: H, returnNetPct, mortgageRatePct: Math.max(0, Number(o.ratePct) || 0),
        baseline: { months: baseline.months, interestToHorizon: doNothingInterest, interestTotal: baseline.totalInterest },
        prepay, invest, difference: invest.wealth - prepay.wealth
      };
    }

