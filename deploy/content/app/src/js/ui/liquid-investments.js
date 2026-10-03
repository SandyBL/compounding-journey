    function renderLiquidInvestmentsList() {
      const container = document.getElementById('container-liquid-investments-list');
      if (!container) return;
      const focusState = saveFocusState();
      container.innerHTML = '';
      const filterEl = document.getElementById('owner-filter-investments');
      if (filterEl) filterEl.innerHTML = ownerFilterBar('investments', (state.ownerFilter || {}).investments);
      const ownerFilterVal = (state.ownerFilter || {}).investments || 'all';

      const country = state.country || 'BR';
      const accountTypeOptions = getRetirementAccountOptions(country);

      (state.liquidInvestments || []).forEach(item => {
        if (ownerFilterVal !== 'all' && String(item.owner || 'joint') !== ownerFilterVal) return;
        const isReserve = Boolean(item.isEmergencyReserve);
        const liquidityTier = item.liquidityTier || 'short';
        const volatilityTier = item.volatilityTier || 'medium';
        const accountType = item.accountType || 'none';
        const qualifies = qualifiesForEmergencyReserve(item);
        const div = document.createElement('div');
        div.className = "p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs";
        div.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-center">
            <div class="sm:col-span-2">
              <label class="text-[10px] text-slate-400 block font-semibold">${t('liLabelName')}</label>
              <input type="text" data-focus-key="li-${item.id}-name" value="${escapeHtml(item.name)}" oninput="updateLiquidInvestment(${item.id}, 'name', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold">
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold">${t('liLabelCurrency')}</label>
              <select data-focus-key="li-${item.id}-currency" onchange="updateLiquidInvestment(${item.id}, 'currency', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold">
                <option value="BRL" ${item.currency === 'BRL' ? 'selected' : ''}>R$ BRL</option>
                <option value="USD" ${item.currency === 'USD' ? 'selected' : ''}>$ USD</option>
                <option value="EUR" ${item.currency === 'EUR' ? 'selected' : ''}>€ EUR</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold">${t('liLabelBalance')}</label>
              <input type="number" data-focus-key="li-${item.id}-balanceOriginal" value="${item.balanceOriginal}" oninput="updateLiquidInvestment(${item.id}, 'balanceOriginal', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold text-teal-400">
            </div>
            <div class="flex items-center justify-between gap-2">
              <div class="flex-1">
                <label class="text-[10px] text-slate-400 block font-semibold flex items-center">
                  ${t('liLabelYield')}
                  <span class="field-tip">?<span class="field-tip-content">${t('liYieldTip')}</span></span>
                </label>
                <input type="number" step="0.1" data-focus-key="li-${item.id}-annualYieldPct" value="${item.annualYieldPct}" oninput="updateLiquidInvestment(${item.id}, 'annualYieldPct', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold text-emerald-400">
              </div>
              <button onclick="removeLiquidInvestment(${item.id})" class="text-rose-400 hover:text-rose-300 font-bold p-1 self-end" title="${t('btnDelete')}">✕</button>
            </div>
          </div>

          <!-- Tax-Advantaged Account Type — links this holding to the actual
               PGBL/VGBL/Plan de Pensiones/PPR deduction tracked in the Tax
               Planning tab, instead of that tab staying purely hypothetical -->
          <div>
            <label class="text-[10px] text-slate-400 block font-semibold flex items-center">
              ${t('liAccountTypeLabel')}
              <span class="field-tip">?<span class="field-tip-content">${t('liAccountTypeTip')}</span></span>
            </label>
            <select data-focus-key="li-${item.id}-accountType" onchange="updateLiquidInvestment(${item.id}, 'accountType', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-medium text-[11px]">
              ${accountTypeOptions.map(o => `<option value="${o.value}" ${accountType === o.value ? 'selected' : ''}>${t(o.labelKey)}</option>`).join('')}
            </select>
          </div>

          ${accountType !== 'none' ? `
          <div>
            <label class="text-[10px] text-slate-400 block font-semibold flex items-center">
              ${t('liContributedLabel').replace('{year}', new Date().getFullYear())}
              <span class="field-tip">?<span class="field-tip-content">${t('liContributedTip')}</span></span>
            </label>
            <input type="number" min="0" data-focus-key="li-${item.id}-contributedThisYear" value="${getContributedThisYear(item)}" oninput="updateLiquidInvestment(${item.id}, 'contributedThisYear', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold text-teal-400">
          </div>
          ` : ''}

          <!-- How a withdrawal from this holding is taxed (Retirement tab > Withdrawal phase) -->
          <div class="grid grid-cols-2 gap-2.5 items-end">
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold flex items-center">
                ${t('liWdTaxLabel')}
                <span class="field-tip">?<span class="field-tip-content">${t('liWdTaxTip')}</span></span>
              </label>
              <select data-focus-key="li-${item.id}-wdTax" onchange="updateLiquidInvestment(${item.id}, 'wdTax', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-semibold">
                ${['auto', 'taxable', 'deferred', 'defGains', 'exempt'].map(v => `<option value="${v}" ${(item.wdTax || 'auto') === v ? 'selected' : ''}>${t('liWd_' + v)}</option>`).join('')}
              </select>
            </div>
            ${['taxable', 'defGains'].includes(resolveWithdrawalTaxClass(item)) ? `<div>
              <label class="text-[10px] text-slate-400 block font-semibold flex items-center">
                ${t('liGainLabel')}
                <span class="field-tip">?<span class="field-tip-content">${t('liGainTip')}</span></span>
              </label>
              <input type="number" min="0" max="100" step="1" data-focus-key="li-${item.id}-gainPct" value="${typeof item.gainPct === 'number' ? item.gainPct : ''}" placeholder="${WD_DEFAULT_GAIN_PCT}" oninput="updateLiquidInvestment(${item.id}, 'gainPct', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold">
            </div>` : '<div></div>'}
          </div>

          <div class="grid grid-cols-1 gap-2.5">${ownerFieldHtml('li', item.id, item.owner)}</div>

          <!-- Liquidity & Volatility classification — gates whether this asset
               can even be offered as an emergency reserve below -->
          <div class="grid grid-cols-2 gap-2.5 items-center">
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold flex items-center">
                ${t('liLabelLiquidity')}
                <span class="field-tip">?<span class="field-tip-content">${t('liLiquidityTip')}</span></span>
              </label>
              <select data-focus-key="li-${item.id}-liquidityTier" onchange="updateLiquidInvestment(${item.id}, 'liquidityTier', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-medium text-[11px]">
                <option value="same_day" ${liquidityTier === 'same_day' ? 'selected' : ''}>${t('liLiquiditySameDay')}</option>
                <option value="short" ${liquidityTier === 'short' ? 'selected' : ''}>${t('liLiquidityShort')}</option>
                <option value="long" ${liquidityTier === 'long' ? 'selected' : ''}>${t('liLiquidityLong')}</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold flex items-center">
                ${t('liLabelVolatility')}
                <span class="field-tip">?<span class="field-tip-content">${t('liVolatilityTip')}</span></span>
              </label>
              <select data-focus-key="li-${item.id}-volatilityTier" onchange="updateLiquidInvestment(${item.id}, 'volatilityTier', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-medium text-[11px]">
                <option value="low" ${volatilityTier === 'low' ? 'selected' : ''}>${t('liVolatilityLow')}</option>
                <option value="medium" ${volatilityTier === 'medium' ? 'selected' : ''}>${t('liVolatilityMedium')}</option>
                <option value="high" ${volatilityTier === 'high' ? 'selected' : ''}>${t('liVolatilityHigh')}</option>
              </select>
            </div>
          </div>

          <!-- Dedicated Emergency Reserve Checkbox — only enabled when the
               classification above actually qualifies (D+0/D+1 liquidity AND
               low volatility) -->
          <div class="pt-2 border-t border-slate-900 flex items-center justify-between flex-wrap gap-2 text-[11px]">
            <label class="flex items-center gap-2 ${qualifies ? 'cursor-pointer text-slate-300 hover:text-teal-300' : 'cursor-not-allowed text-slate-600'} transition">
              <input type="checkbox" data-focus-key="li-${item.id}-isEmergencyReserve" ${isReserve ? 'checked' : ''} ${qualifies ? '' : 'disabled'} onchange="toggleEmergencyReserve(${item.id}, this.checked)" class="rounded border-slate-700 text-teal-500 focus:ring-teal-400 h-4 w-4 bg-slate-900 disabled:opacity-40">
              <span class="font-semibold flex items-center gap-1.5">
                <span>💧</span> <span>${t('liEmergencyReserveLabel')}</span>
              </span>
            </label>
            <span class="text-[10px] ${isReserve ? 'text-teal-400 font-bold' : (qualifies ? 'text-slate-400' : 'text-amber-500')}">
              ${isReserve ? t('liReserveOn') : (qualifies ? t('liReserveOff') : (accountType !== 'none' ? t('liReserveBlockedAccountType') : t('liReserveBlocked')))}
            </span>
          </div>
        `;
        container.appendChild(div);
      });
      restoreFocusState(focusState);
    }

    // Which tax-advantaged retirement account types are relevant depends on
    // fiscal jurisdiction — a Brazilian PGBL/VGBL, a Spanish Plan de
    // Pensiones, and a generic tax-deferred account are different vehicles with different
    // rules, so only the ones for the household's actual country are offered.
    function getRetirementAccountOptions(country) {
      const opts = [{ value: 'none', labelKey: 'liAccountTypeNone' }];
      if (country === 'ES') {
        opts.push({ value: 'pension_plan', labelKey: 'liAccountTypePensionPlanES' });
      } else if (country === 'GL') {
        opts.push({ value: 'tax_deferred', labelKey: 'liAccountTypeGeneric' });
      } else {
        opts.push({ value: 'pgbl', labelKey: 'liAccountTypePGBL' });
        opts.push({ value: 'vgbl', labelKey: 'liAccountTypeVGBL' });
      }
      return opts;
    }


    // NEW RULE: an emergency reserve must be able to be withdrawn same-day or
    // next-day (D+0/D+1) AND be low-volatility. A stock or equity ETF can't be
    // an emergency fund no matter how "liquid" the brokerage makes it feel —
    // its PRICE can drop sharply exactly when a family needs to cash it out
    // (e.g. in a market downturn that coincides with a job loss). A CDB de
    // liquidez diária, a money-market fund, or plain savings *can* qualify,
    // since both conditions hold. This is the single source of truth for that
    // rule — checked here before ever setting isEmergencyReserve=true.
    function qualifiesForEmergencyReserve(item) {
      const liquidityTier = item.liquidityTier || 'short';
      const volatilityTier = item.volatilityTier || 'medium';
      // BUGFIX: this didn't consider accountType at all — a PGBL/VGBL/Plan de
      // Pensiones/PPR account could be marked "same-day liquidity, low
      // volatility" and still get flagged as the emergency reserve, even
      // though these accounts carry real early-withdrawal penalties or tax
      // surcharges in every jurisdiction this app models. Retirement-account
      // status now overrides whatever liquidity/volatility was selected.
      const accountType = item.accountType || 'none';
      if (accountType !== 'none') return false;
      return liquidityTier === 'same_day' && volatilityTier === 'low';
    }

    window.toggleEmergencyReserve = function(id, checked) {
      const it = state.liquidInvestments.find(x => x.id === id);
      if (it) {
        // Enforced here too (not just via the disabled checkbox in the UI) —
        // this is the actual gate, the disabled attribute is just the visible
        // hint that it's gated.
        it.isEmergencyReserve = Boolean(checked) && qualifiesForEmergencyReserve(it);
        handleDataUpdate();
      }
    };

    window.addLiquidInvestment = function() {
      state.liquidInvestments.push({
        id: Date.now(),
        name: t('liNewName'),
        currency: state.baseCurrency || "BRL",
        balanceOriginal: 25000,
        annualYieldPct: 9.5,
        liquidityTier: 'short',
        volatilityTier: 'medium',
        accountType: 'none',
        isEmergencyReserve: false
      });
      handleDataUpdate();
    };

    window.removeLiquidInvestment = function(id) {
      state.liquidInvestments = state.liquidInvestments.filter(i => i.id !== id);
      handleDataUpdate();
    };

    window.updateLiquidInvestment = function(id, field, val) {
      const it = state.liquidInvestments.find(x => x.id === id);
      if (it && field === 'gainPct') {                 // blank = "not entered": the withdrawal view assumes a default share
        const v = parseFloat(val);
        it.gainPct = (val === '' || !isFinite(v)) ? null : Math.min(100, Math.max(0, v));
        handleDataUpdate();
        return;
      }
      if (it) {
        it[field] = ['balanceOriginal', 'annualYieldPct', 'contributedThisYear'].includes(field) ? (parseFloat(val) || 0) : val;
        // Contributions are tracked per calendar year: stamp the year so a value
        // typed this year stops counting once the year changes.
        if (field === 'contributedThisYear') it.contributionYear = new Date().getFullYear();
        // If liquidity/volatility just changed and this item was flagged as
        // reserve, re-check the rule — a reserve that gets re-classified as
        // locked-up or higher-volatility no longer qualifies and should stop
        // counting toward the emergency reserve automatically, not silently
        // keep counting until someone happens to notice the checkbox.
        if ((field === 'liquidityTier' || field === 'volatilityTier') && it.isEmergencyReserve && !qualifiesForEmergencyReserve(it)) {
          it.isEmergencyReserve = false;
        }
        handleDataUpdate();
      }
    };

