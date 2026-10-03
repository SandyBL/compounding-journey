    // Life insurance death-benefit analysis — asked for directly: the app already
    // tracked a life insurance COVERAGE amount (state.insurance.lifeInsuranceCoverage)
    // for the Score's hedge component and the print summary's "gap" check, but never
    // showed what that number actually MEANS for the family day to day — how many
    // years would it (plus existing liquid assets) actually cover living costs if a
    // parent died, specially with kids in the picture, and is the amount even
    // reasonable, too little, or more than necessary.
    //
    // Computed per earner (each parent's death has a different financial impact,
    // since each earns a different amount), not as a single household-wide number.
    // Deliberately NOT part of calculateMetrics()'s own return object, matching the
    // existing pattern for other specialized, not-every-render analyses
    // (computeRebalancingSuggestion in calc/withdrawal.js) — called explicitly by the
    // Overview card and the what-if "parent dies" scenario instead.
    //
    // Simplifications stated plainly rather than silently assumed: living costs are
    // assumed to stay the same after a death (a conservative assumption — in reality a
    // family might reduce some spending, but a child's own costs very much continue,
    // and this avoids guessing at which specific costs would fall); the insurance
    // payout is treated as a lump sum added to liquid assets, drawn down alongside them
    // at a 0% real return for this specific analysis (deliberately NOT the portfolio's
    // own real return assumption — a family in this situation is living through a
    // crisis, not executing a disciplined decades-long investment plan, so assuming
    // continued market growth on top of a lump-sum payout would overstate how long the
    // money really lasts); and the "is this enough" comparison anchors on the YOUNGEST
    // child's own independence age, since that's the single most concrete, meaningful
    // horizon a family raising kids actually cares about (if there are no children, the
    // same 1-year "gap to cover" framing still applies, without clamping to the floor
    // of 1 that a child's own age gap would otherwise never report).
    function calcDeathBenefitAnalysis(m, earnerId) {
      const earner = (state.earners || []).find(e => e.id === earnerId);
      if (!earner) return null;

      const earnerNet = (m.earnerNetById && m.earnerNetById[earnerId]) || 0;
      const remainingMonthlyIncome = Math.max(0, m.totalEarnersNet - earnerNet);
      const monthlyGap = Math.max(0, m.totalMonthlyLivingCost - remainingMonthlyIncome);
      const payout = Number(state.insurance.lifeInsuranceCoverage) || 0;
      const availableFunds = m.totalLiquidBase + payout;

      // No real ongoing shortfall: the household's remaining income alone already
      // covers living costs, so the insurance (and existing savings) become a pure
      // cushion rather than something being drawn down out of necessity.
      const yearsOfCoverage = monthlyGap <= 0 ? null : (availableFunds / monthlyGap) / 12;

      const kids = state.children || [];
      const yearsUntilYoungestIndependent = kids.length > 0
        ? Math.max(...kids.map(k => Math.max(0, (Number(k.independenceAge) || 23) - (Number(k.age) || 0))))
        : 0;

      // "Enough" means the money (existing assets + payout) outlasts the horizon that
      // actually matters: until the youngest child is independent. Deliberately null
      // (no verdict, not a silent "true") when there are no children — there's no
      // natural horizon to measure against in that case, so a pass/fail claim would be
      // unsupported either way; the raw years-of-coverage number still speaks for
      // itself, informationally, in the UI. Still true whenever there's no real
      // ongoing gap to begin with (yearsOfCoverage === null), regardless of children.
      const isEnough = yearsOfCoverage === null ? true : (kids.length === 0 ? null : (yearsOfCoverage >= yearsUntilYoungestIndependent));

      // A rough, explicitly-approximate suggested ADDITIONAL coverage: the extra lump
      // sum that would close the gap to the youngest child's independence, holding
      // today's monthly gap constant (not a precise actuarial recommendation — a
      // starting point for the family's own conversation with their insurer).
      let suggestedCoverageChange = 0;
      if (monthlyGap > 0 && kids.length > 0 && !isEnough) {
        const neededFunds = monthlyGap * 12 * yearsUntilYoungestIndependent;
        suggestedCoverageChange = Math.max(0, neededFunds - availableFunds);
      }
      // The flip side: coverage that's far beyond what's needed (more than double the
      // real horizon) means the family may be paying premium for protection they are
      // unlikely to need at this amount — worth a cheaper-premium conversation too.
      // Bounded by the payout itself: never suggests "reducing" by more than the
      // coverage actually is.
      let overCoverageAmount = 0;
      if (monthlyGap > 0 && yearsOfCoverage !== null && kids.length > 0 && yearsUntilYoungestIndependent > 0 && yearsOfCoverage > yearsUntilYoungestIndependent * 2) {
        const fundsNeededForHorizon = monthlyGap * 12 * yearsUntilYoungestIndependent;
        const excessFunds = availableFunds - fundsNeededForHorizon;
        overCoverageAmount = Math.max(0, Math.min(payout, excessFunds));
      }

      return {
        earnerId, earnerName: earner.name,
        earnerNet, remainingMonthlyIncome, monthlyGap, payout, availableFunds,
        yearsOfCoverage, yearsUntilYoungestIndependent, hasChildren: kids.length > 0,
        isEnough, suggestedCoverageChange, overCoverageAmount
      };
    }

    // One analysis per earner, in earner order — the natural shape for a "one card
    // per earner" Overview display, mirroring renderCrossoverMilestones' own pattern.
    function calcDeathBenefitAnalysisAll(m) {
      return (state.earners || []).map(e => calcDeathBenefitAnalysis(m, e.id)).filter(Boolean);
    }
