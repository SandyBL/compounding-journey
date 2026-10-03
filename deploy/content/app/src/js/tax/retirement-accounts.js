    // Retirement-account contributions made in the CURRENT calendar year. The
    // annual deduction limits apply to contributions, not to the accumulated
    // balance: R$ 200k already sitting in a PGBL says nothing about whether
    // this year's limit was used. A stored value from a previous year counts
    // as zero.
    function getContributedThisYear(item) {
      return Number(item.contributionYear) === new Date().getFullYear()
        ? (Number(item.contributedThisYear) || 0) : 0;
    }

    function getRetirementContributionsThisYear(accountTypes) {
      let total = 0;
      (state.liquidInvestments || []).forEach(item => {
        if (accountTypes.includes(item.accountType)) {
          total += convertToBase(getContributedThisYear(item), item.currency || state.baseCurrency);
        }
      });
      return total;
    }

