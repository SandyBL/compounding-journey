    function renderEarnersList() {
      const container = document.getElementById('container-earners-list');
      if (!container) return;
      const focusState = saveFocusState();
      container.innerHTML = '';

      const reg = getJurisdictionRegimes(state.country || 'BR');

      (state.earners || []).forEach(e => {
        const isEmp = isEmployedRegime(e.regime);
        const div = document.createElement('div');
        div.className = "p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs";
        div.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-center">
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold">${t('earnerLabelName')}</label>
              <input type="text" data-focus-key="earner-${e.id}-name" value="${escapeHtml(e.name)}" oninput="updateEarner(${e.id}, 'name', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold">
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold">${t('earnerLabelAge')}</label>
              <input type="number" data-focus-key="earner-${e.id}-age" value="${e.age}" oninput="updateEarner(${e.id}, 'age', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold">
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold flex items-center">
                ${t('earnerLabelRegime')}
                <span class="field-tip">?<span class="field-tip-content">${t('earnerRegimeTip')}</span></span>
              </label>
              <select data-focus-key="earner-${e.id}-regime" onchange="updateEarner(${e.id}, 'regime', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold">
                ${reg.options.map(o => `<option value="${escapeHtml(o)}" ${e.regime === o ? 'selected' : ''}>${escapeHtml(regimeDisplay(o))}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold flex items-center">
                ${t('earnerLabelGross')}
                <span class="field-tip">?<span class="field-tip-content">${t('earnerGrossTip')}</span></span>
              </label>
              <input type="number" data-focus-key="earner-${e.id}-grossMonthly" value="${e.grossMonthly}" oninput="updateEarner(${e.id}, 'grossMonthly', this.value)" ${e.manualNetOverride ? 'disabled' : ''} class="w-full glass-input rounded-lg px-2.5 py-1 font-bold text-teal-400 ${e.manualNetOverride ? 'opacity-40' : ''}">
            </div>
            <div class="flex items-center justify-between gap-2">
              ${(isEmp && (state.country || 'BR') !== 'GL') ? `
                <div class="flex-1">
                  <label class="text-[10px] text-slate-400 block truncate font-semibold">${escapeHtml(reg.benefitLabel)}</label>
                  <input type="number" data-focus-key="earner-${e.id}-foodVoucher" value="${e.foodVoucher || 0}" oninput="updateEarner(${e.id}, 'foodVoucher', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-medium">
                </div>
              ` : `
                <div class="flex-1">
                  <label class="text-[10px] text-slate-400 block truncate font-semibold flex items-center">
                    <span class="truncate">${escapeHtml(reg.contractorLabel)}</span>
                    <span class="field-tip">?<span class="field-tip-content">${t((state.country || 'BR') === 'GL' ? 'earnerGlTaxTip' : 'earnerContractorTaxTip')}</span></span>
                  </label>
                  <input type="number" step="0.5" data-focus-key="earner-${e.id}-pjTaxRate" value="${(typeof e.pjTaxRate === 'number') ? e.pjTaxRate : reg.contractorTaxDefault}" oninput="updateEarner(${e.id}, 'pjTaxRate', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-medium">
                </div>
              `}
              <button onclick="removeEarner(${e.id})" class="text-rose-400 hover:text-rose-300 font-bold p-1 self-end" title="${t('earnerDeleteTitle')}">✕</button>
            </div>
          </div>
          <!-- Real Payslip Net Salary Override \u2014 moved right after the main income row
               (used to sit at the very bottom of the card, past several unrelated,
               regime-specific fields, which made it easy to miss for someone who simply
               doesn't know their gross salary and only recognizes what actually lands in
               their account each month). Gross is visually disabled while this is on,
               since it's genuinely not used for the income calculation in that state
               (calc/metrics.js uses realNetSalary directly) \u2014 not just decorative. -->
          <div class="pt-1.5 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <label class="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input type="checkbox" data-focus-key="earner-${e.id}-manualNetOverride" ${e.manualNetOverride ? 'checked' : ''} onchange="toggleEarnerOverride(${e.id}, this.checked)" class="rounded border-slate-600 bg-slate-800 text-gold-500 focus:ring-gold-500">
              <span class="font-medium">${t('earnerManualOverride')}</span>
            </label>
            ${e.manualNetOverride ? `
              <div class="flex items-center gap-1.5">
                <span class="text-slate-400">${t('earnerNetDeposited')}</span>
                <input type="number" data-focus-key="earner-${e.id}-realNetSalary" value="${e.realNetSalary || 0}" oninput="updateEarner(${e.id}, 'realNetSalary', this.value)" class="w-28 glass-input rounded-lg px-2 py-1 font-bold text-emerald-400">
              </div>
            ` : `
              <span class="text-slate-400 text-[10px]">${t('earnerEstimatedCalc')}</span>
            `}
          </div>
          ${isEmp ? `
          <!-- 13th salary (a legally mandated extra month's pay for Brazilian CLT
               employees, and a similar convention recognized elsewhere) and a
               company-results bonus: real income most families DO receive but
               rarely think to include, since both arrive as irregular, once-a-year
               payments. Smoothed into the monthly figure (calc/metrics.js), not
               shown only as a one-off lump to remember to plan around. Only shown
               for employed regimes \u2014 a self-employed/PJ earner doesn't have an
               employer paying either of these. -->
          <div class="pt-1.5 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <label class="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input type="checkbox" data-focus-key="earner-${e.id}-has13thSalary" ${e.has13thSalary ? 'checked' : ''} onchange="updateEarner(${e.id}, 'has13thSalary', this.checked)" class="rounded border-slate-600 bg-slate-800 text-gold-500 focus:ring-gold-500">
              <span class="font-medium">${t('earner13thSalary')}</span>
              <span class="field-tip">?<span class="field-tip-content">${t('earner13thSalaryTip')}</span></span>
            </label>
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400">${t('earnerAnnualBonus')}</span>
              <input type="number" data-focus-key="earner-${e.id}-annualBonus" value="${e.annualBonus || 0}" oninput="updateEarner(${e.id}, 'annualBonus', this.value)" class="w-24 glass-input rounded-lg px-2 py-1 font-bold text-emerald-400">
            </div>
          </div>
          ` : ''}
          ${(!isEmp && (state.country || 'BR') === 'BR') ? `
          <div class="pt-1.5 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold">${t('earnerPJTypeLabel')}</label>
              <select data-focus-key="earner-${e.id}-pjCompanyType" onchange="setEarnerCompanyType(${e.id}, this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-medium">
                ${['simples3', 'simples5', 'presumido', 'mei', 'custom'].map(k => `<option value="${k}" ${(e.pjCompanyType || 'custom') === k ? 'selected' : ''}>${t('pjType_' + k)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold flex items-center">
                ${t('earnerProLaboreLabel')}
                <span class="field-tip">?<span class="field-tip-content">${t('earnerProLaboreTip')}</span></span>
              </label>
              <input type="number" min="0" max="100" step="1" data-focus-key="earner-${e.id}-proLaborePct" value="${(e.proLaborePct === undefined || e.proLaborePct === null) ? 28 : e.proLaborePct}" oninput="updateEarner(${e.id}, 'proLaborePct', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-medium">
            </div>
            <p class="text-[10px] text-amber-400/90 self-end">${t('earnerPJAssumptionNote')}</p>
          </div>
          ` : ''}
          ${(isEmp && (state.country || 'BR') === 'ES') ? `
          <!-- Spain: contract type changes the unemployment contribution; cap note when pay exceeds the maximum base -->
          <div class="pt-1.5 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <label class="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input type="checkbox" data-focus-key="earner-${e.id}-esFixedTerm" ${e.esFixedTerm ? 'checked' : ''} onchange="updateEarner(${e.id}, 'esFixedTerm', this.checked)" class="rounded border-slate-700 text-teal-500 focus:ring-teal-400">
              <span class="font-medium">${t('esFixedTermLabel')}</span>${taxRulesBadge('ES_SS')}
              <span class="field-tip">?<span class="field-tip-content">${t('esFixedTermTip')}</span></span>
            </label>
            ${Number(e.grossMonthly) > ES_SS_MAX_BASE_MONTHLY ? `<span class="text-[10px] text-gold-300">${t('esSsCapNote').replace('{max}', formatSpainMaxBase()).replace('{year}', ES_SS_EMPLOYEE_RATE_YEAR)}</span>` : ''}
          </div>
          ` : ''}
        `;
        container.appendChild(div);
      });
      restoreFocusState(focusState);
    }

    window.addEarner = function() {
      const reg = getJurisdictionRegimes(state.country || 'BR');
      const newEarner = {
        id: Date.now(),
        name: t('earnerNewName'),
        role: '',   // empty on purpose: shown as a translated "Member" (see displayRole)
        age: 35,
        regime: reg.options[0],
        grossMonthly: 12000,
        hasHealth: true,
        foodVoucher: 0,
        pjTaxRate: reg.contractorTaxDefault,
        pjCompanyType: (state.country || 'BR') === 'BR' ? 'simples3' : 'custom',
        proLaborePct: 28,
        manualNetOverride: false,
        realNetSalary: 0,
        has13thSalary: false,
        annualBonus: 0
      };
      state.earners.push(newEarner);
      handleDataUpdate();
    };

    window.removeEarner = function(id) {
      state.earners = state.earners.filter(e => e.id !== id);
      cascadeOwnerOnEarnerRemoval(id);   // anything they owned goes back to "joint"
      handleDataUpdate();
    };

    window.updateEarner = function(id, field, val) {
      const e = state.earners.find(x => x.id === id);
      if (e) {
        e[field] = ['age', 'grossMonthly', 'foodVoucher', 'pjTaxRate', 'realNetSalary', 'proLaborePct', 'annualBonus'].includes(field) ? (parseFloat(val) || 0) : val;
        // Editing the rate by hand means it is no longer one of the presets.
        if (field === 'pjTaxRate') e.pjCompanyType = 'custom';
        handleDataUpdate();
      }
    };

    // Starting-point effective rates by company type (all editable afterwards):
    // Simples Nacional first-bracket rates (Anexo III 6%, Anexo V 15.5%); Lucro
    // Presumido for services with 5% ISS = PIS 0.65 + COFINS 3 + ISS 5 + IRPJ 4.8
    // + CSLL 2.88 = 16.33%; MEI pays a fixed monthly DAS, so 2% is only a rough
    // placeholder — enter DAS / revenue as the effective rate.
    const PJ_COMPANY_PRESETS = { simples3: 6.0, simples5: 15.5, presumido: 16.33, mei: 2.0 };
    window.setEarnerCompanyType = function(id, type) {
      const e = state.earners.find(x => x.id === id);
      if (!e) return;
      e.pjCompanyType = type;
      if (PJ_COMPANY_PRESETS[type] !== undefined) e.pjTaxRate = PJ_COMPANY_PRESETS[type];
      handleDataUpdate();
    };

    window.toggleEarnerOverride = function(id, checked) {
      const e = state.earners.find(x => x.id === id);
      if (e) {
        e.manualNetOverride = checked;
        handleDataUpdate();
      }
    };

