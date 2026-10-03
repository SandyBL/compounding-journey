    // Spain: individual pension-plan deduction is the lesser of EUR 1,500 and
    // 30% of net work income, per person. Savings use each earner's real
    // marginal IRPF (difference in tax with vs without the deduction).
    function calcSpainPensionPlan() {
      let ceilingAnnual = 0, savingsAnnual = 0;
      (state.earners || []).forEach(e => {
        const g = Number(e.grossMonthly) || 0;
        if (g <= 0) return;
        const ss = isEmployedRegime(e.regime) ? calcSpainEmployeeSS(g, e.esFixedTerm) : 0;
        const base = Math.max(0, g - ss);
        const cap = Math.min(1500, 0.30 * base * 12);
        const saved = calcSpainIRPF(base) - calcSpainIRPF(Math.max(0, base - cap / 12));
        ceilingAnnual += cap;
        savingsAnnual += Math.max(0, saved) * 12;
      });
      return {
        ceilingAnnual, savingsAnnual,
        marginalPct: ceilingAnnual > 0 ? (savingsAnnual / ceilingAnnual) * 100 : 0
      };
    }

