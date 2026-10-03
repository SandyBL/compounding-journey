    // Sums the actual tracked balance across liquid investments the user has
    // marked as PGBL/VGBL (Brazil), a Plan de Pensiones (Spain), or a PPR
    // (Portugal) — connecting the deduction-ceiling math below to real held
    // assets instead of leaving it a pure hypothetical ("if you contributed
    // this much, you'd save this much") with no link to what's actually saved.
    function getTaxAdvantagedBalance(country, accountTypes) {
      let total = 0;
      (state.liquidInvestments || []).forEach(item => {
        if (accountTypes.includes(item.accountType)) {
          total += convertToBase(Number(item.balanceOriginal) || 0, item.currency || state.baseCurrency);
        }
      });
      return total;
    }

    function renderTaxStudy(m) {
      const container = document.getElementById('container-tax-study-content');
      if (!container) return;
      const c = state.country || 'BR';

      let html = '';
      const rowExtraDeps = document.getElementById('row-br-extra-dependents');
      if (rowExtraDeps) rowExtraDeps.classList.toggle('hidden', c !== 'BR');
      const rowGlTax = document.getElementById('row-gl-tax-settings');
      if (rowGlTax) rowGlTax.classList.toggle('hidden', c !== 'GL');

      if (c === 'BR') {
        const plan = calcBrazilPGBLPlan();
        const taxableSalaryGross = plan.taxableAnnual;
        const pgblCeiling = plan.ceilingAnnual;
        const potentialSavings = plan.savingsAnnual;
        const effectiveTaxRate = m.totalEarnersGross > 0 ? ((m.totalEarnersGross - m.totalEarnersNet) / m.totalEarnersGross) * 100 : 0;
        // Only PGBL is deductible; VGBL gives no deduction, so it never counts
        // toward the annual limit (its balance is still shown for reference).
        const contributed = getRetirementContributionsThisYear(['pgbl']);
        const contributedPct = pgblCeiling > 0 ? Math.min(100, (contributed / pgblCeiling) * 100) : 0;
        const totalBalance = getTaxAdvantagedBalance(c, ['pgbl', 'vgbl']);
        const depCount = getBrazilDependentsCount();
        const hasPJ = (state.earners || []).some(e => !isEmployedRegime(e.regime));
        const savingsNote = potentialSavings <= 0
          ? t('taxSavingsExempt')
          : t('taxSavingsMarginalTpl').replace('{pct}', plan.marginalPct.toFixed(1));
        const year = new Date().getFullYear();

        html = `
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span class="text-slate-400 block">${t('taxTaxableIncome')}</span>
              <strong class="text-white text-base font-black">${fmt(taxableSalaryGross)}</strong>
              <span class="text-[10px] text-slate-400 block">${hasPJ ? t('taxTaxableSubPJ') : 'CLT'}</span>
            </div>
            <div class="p-3.5 bg-slate-950 rounded-xl border border-teal-500/30 space-y-1">
              <span class="text-teal-300 block">${t('taxPgblCeiling')}</span>
              <strong class="text-teal-400 text-base font-black">${fmt(pgblCeiling)}</strong>
              <span class="text-[10px] text-teal-500 block">${t('taxPgblCeilingSub')}</span>
            </div>
            <div class="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-1">
              <span class="text-emerald-300 block">${t('taxPotentialSavings')}</span>
              <strong class="text-emerald-400 text-base font-black">${fmt(potentialSavings)}</strong>
              <span class="text-[10px] text-emerald-500 block">${savingsNote}</span>
            </div>
            <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span class="text-slate-400 block">${t('taxEffectiveRate')}${taxRulesBadge('BR_IRPF')}</span>
              <strong class="text-white text-base font-black">${effectiveTaxRate.toFixed(1)}%</strong>
              <span class="text-[10px] text-slate-400 block">${t('taxEffectiveRateSubBR')}</span>
            </div>
          </div>

          <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-300 font-semibold">${t('taxContribTitleBR').replace('{year}', year)}${taxRulesBadge('BR_PRIVATE_PENSION')}</span>
              <span class="text-white font-black">${fmt(contributed)} <span class="text-slate-400 font-normal">/ ${fmt(pgblCeiling)}</span></span>
            </div>
            <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div class="bg-teal-400 h-full rounded-full" style="width: ${contributedPct}%"></div>
            </div>
            <p class="text-[10px] text-slate-400">${t('taxTrackedDescBR')}</p>
            <p class="text-[10px] text-slate-400">${t('taxBalanceLine')} <strong class="text-slate-200">${fmt(totalBalance)}</strong></p>
          </div>

          <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300">
            ${t('taxDependentsLine').replace('{n}', depCount).replace('{v}', fmt(depCount * BR_DEPENDENT_DEDUCTION))}
          </div>

          <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
            <h4 class="font-bold text-white text-sm flex items-center gap-2">
              <span>💡</span> <span>${t('taxBrGuideTitle')}</span>
            </h4>
            <div class="space-y-2 text-slate-300 text-[11px] leading-relaxed">
              <p>• ${t('taxBrB1')}</p>
              <p>• ${t('taxBrB2')}${taxRulesBadge('BR_DIVIDENDS')}</p>
              <p>• ${t('taxBrB3')}</p>
              <p>• ${t('taxBrB4')}</p>
              ${hasPJ ? `<p class="text-amber-300">• <strong>${t('taxPJAssumptionTitle')}</strong> ${t('taxPJAssumptionBody')}</p>` : ''}
            </div>
          </div>
        `;
      } else if (c === 'ES') {
        const plan = calcSpainPensionPlan();
        const contributed = getRetirementContributionsThisYear(['pension_plan']);
        const contributedPct = plan.ceilingAnnual > 0 ? Math.min(100, (contributed / plan.ceilingAnnual) * 100) : 0;
        const totalBalance = getTaxAdvantagedBalance(c, ['pension_plan']);
        const year = new Date().getFullYear();

        html = `
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span class="text-slate-400 block">${t('taxEsIncomeLabel')}${taxRulesBadge('ES_IRPF')}</span>
              <strong class="text-white text-base font-black">${fmt(m.totalEarnersGross * 12)}</strong>
            </div>
            <div class="p-3.5 bg-slate-950 rounded-xl border border-teal-500/30 space-y-1">
              <span class="text-teal-300 block">${t('taxEsLimitLabel')}${taxRulesBadge('ES_PENSION_PLAN')}</span>
              <strong class="text-teal-400 text-base font-black">${fmt(plan.ceilingAnnual)}</strong>
              <span class="text-[10px] text-teal-400">${t('taxPensionCeilingSubES')}</span>
            </div>
            <div class="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-1">
              <span class="text-emerald-300 block">${t('taxEsSavingsLabel')}</span>
              <strong class="text-emerald-400 text-base font-black">${fmt(plan.savingsAnnual)}</strong>
              <span class="text-[10px] text-emerald-400">${t('taxSavingsMarginalTpl').replace('{pct}', plan.marginalPct.toFixed(1))}</span>
            </div>
          </div>

          <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-300 font-semibold">${t('taxContribTitleES').replace('{year}', year)}</span>
              <span class="text-white font-black">${fmt(contributed)} <span class="text-slate-400 font-normal">/ ${fmt(plan.ceilingAnnual)}</span></span>
            </div>
            <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div class="bg-teal-400 h-full rounded-full" style="width: ${contributedPct}%"></div>
            </div>
            <p class="text-[10px] text-slate-400">${t('taxTrackedDescES')}</p>
            <p class="text-[10px] text-slate-400">${t('taxBalanceLine')} <strong class="text-slate-200">${fmt(totalBalance)}</strong></p>
          </div>
        `;
      } else {
        // Global: generic view. Every figure comes from rates the person enters,
        // so it shows the SHAPE of tax planning (what a deduction is worth, how
        // much room is left) without claiming to know any country's rules.
        const limit = Math.max(0, Number(state.glRetirementAnnualLimit) || 0);
        const marginal = typeof state.glMarginalTaxRatePct === 'number' ? state.glMarginalTaxRatePct : 25;
        const contributed = getRetirementContributionsThisYear(['tax_deferred']);
        const totalBalance = getTaxAdvantagedBalance(c, ['tax_deferred']);
        const pct = limit > 0 ? Math.min(100, (contributed / limit) * 100) : 0;
        const potentialSavings = limit * (marginal / 100);
        const effectiveTaxRate = m.totalEarnersGross > 0 ? ((m.totalEarnersGross - m.totalEarnersNet) / m.totalEarnersGross) * 100 : 0;
        const year = new Date().getFullYear();

        html = `
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span class="text-slate-400 block">${t('taxGlIncomeLabel')}</span>
              <strong class="text-white text-base font-black">${fmt(m.totalEarnersGross * 12)}</strong>
              <span class="text-[10px] text-slate-400 block">${t('taxGlIncomeSub')}</span>
            </div>
            <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span class="text-slate-400 block">${t('taxEffectiveRate')}</span>
              <strong class="text-white text-base font-black">${effectiveTaxRate.toFixed(1)}%</strong>
              <span class="text-[10px] text-slate-400 block">${t('taxGlEffectiveSub')}</span>
            </div>
            <div class="p-3.5 bg-slate-950 rounded-xl border border-teal-500/30 space-y-1">
              <span class="text-teal-300 block">${t('taxGlLimitCard')}</span>
              <strong class="text-teal-400 text-base font-black">${limit > 0 ? fmt(limit) : '—'}</strong>
              <span class="text-[10px] text-teal-500 block">${limit > 0 ? t('taxGlLimitSet') : t('taxGlLimitUnset')}</span>
            </div>
            <div class="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-1">
              <span class="text-emerald-300 block">${t('taxPotentialSavings')}</span>
              <strong class="text-emerald-400 text-base font-black">${limit > 0 ? fmt(potentialSavings) : '—'}</strong>
              <span class="text-[10px] text-emerald-500 block">${t('taxGlSavingsSub').replace('{pct}', marginal.toFixed(1))}</span>
            </div>
          </div>

          <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-300 font-semibold">${t('taxContribTitleGL').replace('{year}', year)}</span>
              <span class="text-white font-black">${fmt(contributed)} <span class="text-slate-400 font-normal">/ ${limit > 0 ? fmt(limit) : '—'}</span></span>
            </div>
            <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div class="bg-teal-400 h-full rounded-full" style="width: ${pct}%"></div>
            </div>
            <p class="text-[10px] text-slate-400">${t('taxTrackedDescGL')}</p>
            <p class="text-[10px] text-slate-400">${t('taxBalanceLine')} <strong class="text-slate-200">${fmt(totalBalance)}</strong></p>
          </div>

          <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
            <h4 class="font-bold text-white text-sm flex items-center gap-2">
              <span>💡</span> <span>${t('taxGlGuideTitle')}</span>
            </h4>
            <div class="space-y-2 text-slate-300 text-[11px] leading-relaxed">
              <p>• ${t('taxGlB1')}</p>
              <p>• ${t('taxGlB2')}</p>
              <p>• ${t('taxGlB3')}</p>
              <p>• ${t('taxGlB4')}</p>
              <p class="text-amber-300">• ${t('taxGlB5')}</p>
            </div>
          </div>
        `;
      }

      // Charitable giving tax estimate — simplified, country-specific rule of
      // thumb (like the rest of this tab, an educational approximation, not a
      // substitute for real tax advice). Shown regardless of country whenever
      // the family has entered a monthly donation amount.
      const annualCharitable = (Number(state.outflows.charitableGiving) || 0) * 12;
      if (annualCharitable > 0) {
        let creditEstimate = 0;
        let creditNoteKey = 'taxCharitableNoteBR';
        if (c === 'ES') {
          // 80% credit on the first €150/yr, 35% beyond (recurring-donation
          // bonus of up to 40% ignored here for simplicity).
          creditEstimate = Math.min(annualCharitable, 150) * 0.80 + Math.max(0, annualCharitable - 150) * 0.35;
          creditNoteKey = 'taxCharitableNoteES';
        } else if (c === 'GL') {
          // Global: the person's own assumed deduction rate (default 0%: many
          // countries give nothing, others a credit or deduction).
          creditEstimate = annualCharitable * ((Number(state.glCharitableDeductionPct) || 0) / 100);
          creditNoteKey = 'taxCharitableNoteGL';
        } else {
          // Brazil: deduction limited to specific funds/entities and capped
          // around 6% of tax due — far narrower than "any donation," flagged
          // in the note rather than modeled precisely.
          creditEstimate = annualCharitable * 0.06;
          creditNoteKey = 'taxCharitableNoteBR';
        }

        html += `
          <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <span class="text-slate-300 font-semibold flex items-center">
                ${t('taxCharitableTitle')}
                <span class="field-tip">?<span class="field-tip-content">${t(creditNoteKey)}</span></span>
              </span>
              <span class="text-white font-black">${fmt(annualCharitable)} ${t('perYear')}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-slate-400">${t('taxCharitableCreditLabel')}</span>
              <strong class="text-emerald-400">${fmt(creditEstimate)}</strong>
            </div>
          </div>
        `;
      }

      container.innerHTML = html;
    }

