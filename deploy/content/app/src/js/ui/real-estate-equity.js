    function renderRealEstateList() {
      const container = document.getElementById('container-real-estate-list');
      if (!container) return;
      const focusState = saveFocusState();
      container.innerHTML = '';

      (state.realEstate || []).forEach(r => {
        const div = document.createElement('div');
        div.className = "p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs";
        div.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center">
            <div class="sm:col-span-2">
              <label class="text-[10px] text-slate-400 block font-semibold">${t('reLabelName')}</label>
              <input type="text" data-focus-key="re-${r.id}-name" value="${escapeHtml(r.name)}" oninput="updateRealEstate(${r.id}, 'name', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold">
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold">${t('liLabelCurrency')}</label>
              <select data-focus-key="re-${r.id}-currency" onchange="updateRealEstate(${r.id}, 'currency', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold">
                <option value="BRL" ${(r.currency || 'BRL') === 'BRL' ? 'selected' : ''}>R$ BRL</option>
                <option value="USD" ${r.currency === 'USD' ? 'selected' : ''}>$ USD</option>
                <option value="EUR" ${r.currency === 'EUR' ? 'selected' : ''}>€ EUR</option>
              </select>
            </div>
            <div class="flex items-center justify-end">
              <button onclick="removeRealEstate(${r.id})" class="text-rose-400 hover:text-rose-300 font-bold p-1" title="${t('btnDelete')}">✕</button>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold">${t('reLabelMarketValue')}</label>
              <input type="number" data-focus-key="re-${r.id}-marketValue" value="${r.marketValue}" oninput="updateRealEstate(${r.id}, 'marketValue', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold">
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold">${t('reLabelMortgage')}</label>
              <input type="number" data-focus-key="re-${r.id}-mortgageDebt" value="${r.mortgageDebt}" oninput="updateRealEstate(${r.id}, 'mortgageDebt', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold text-rose-300">
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold">${t('reLabelRent')}</label>
              <input type="number" data-focus-key="re-${r.id}-monthlyRentInflow" value="${r.monthlyRentInflow || 0}" oninput="updateRealEstate(${r.id}, 'monthlyRentInflow', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold text-emerald-400">
            </div>
          </div>
          <div class="grid grid-cols-1 gap-2.5">${ownerFieldHtml('re', r.id, r.owner)}</div>
        `;
        container.appendChild(div);
      });
      restoreFocusState(focusState);
    }

    function renderEquityGrantsList() {
      const container = document.getElementById('container-equity-grants-list');
      if (!container) return;
      const focusState = saveFocusState();
      container.innerHTML = '';

      (state.equityGrants || []).forEach(g => {
        const div = document.createElement('div');
        div.className = "p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs";
        div.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center">
            <div class="sm:col-span-2">
              <label class="text-[10px] text-slate-400 block font-semibold">${t('eqLabelName')}</label>
              <input type="text" data-focus-key="eq-${g.id}-name" value="${escapeHtml(g.name)}" oninput="updateEquityGrant(${g.id}, 'name', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold">
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold">${t('liLabelCurrency')}</label>
              <select data-focus-key="eq-${g.id}-currency" onchange="updateEquityGrant(${g.id}, 'currency', this.value)" class="w-full glass-input rounded-lg px-2 py-1 font-bold">
                <option value="BRL" ${(g.currency || 'BRL') === 'BRL' ? 'selected' : ''}>R$ BRL</option>
                <option value="USD" ${g.currency === 'USD' ? 'selected' : ''}>$ USD</option>
                <option value="EUR" ${g.currency === 'EUR' ? 'selected' : ''}>€ EUR</option>
              </select>
            </div>
            <div class="flex items-center justify-end">
              <button onclick="removeEquityGrant(${g.id})" class="text-rose-400 hover:text-rose-300 font-bold p-1" title="${t('btnDelete')}">✕</button>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold flex items-center">
                ${t('eqLabelVested')}
                <span class="field-tip">?<span class="field-tip-content">${t('eqVestedTip')}</span></span>
              </label>
              <input type="number" data-focus-key="eq-${g.id}-vestedValue" value="${g.vestedValue || 0}" oninput="updateEquityGrant(${g.id}, 'vestedValue', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold text-teal-400">
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block font-semibold flex items-center">
                ${t('eqLabelUnvested')}
                <span class="field-tip">?<span class="field-tip-content">${t('eqUnvestedTip')}</span></span>
              </label>
              <input type="number" data-focus-key="eq-${g.id}-unvestedValue" value="${g.unvestedValue || 0}" oninput="updateEquityGrant(${g.id}, 'unvestedValue', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-medium text-slate-400">
            </div>
          </div>
        `;
        container.appendChild(div);
      });
      restoreFocusState(focusState);
    }

    window.addEquityGrant = function() {
      state.equityGrants.push({
        id: Date.now(),
        name: t('eqNewName'),
        currency: state.baseCurrency || 'BRL',
        vestedValue: 0,
        unvestedValue: 0
      });
      handleDataUpdate();
    };

    window.removeEquityGrant = function(id) {
      state.equityGrants = state.equityGrants.filter(g => g.id !== id);
      handleDataUpdate();
    };

    window.updateEquityGrant = function(id, field, val) {
      const g = state.equityGrants.find(x => x.id === id);
      if (g) {
        g[field] = ['vestedValue', 'unvestedValue'].includes(field) ? (parseFloat(val) || 0) : val;
        handleDataUpdate();
      }
    };

    window.addRealEstate = function() {
      state.realEstate.push({
        id: Date.now(),
        name: t('reNewName'),
        currency: state.baseCurrency || 'BRL',
        marketValue: 500000,
        mortgageDebt: 100000,
        monthlyRentInflow: 0
      });
      handleDataUpdate();
    };

    window.removeRealEstate = function(id) {
      state.realEstate = state.realEstate.filter(r => r.id !== id);
      handleDataUpdate();
    };

    window.updateRealEstate = function(id, field, val) {
      const r = state.realEstate.find(x => x.id === id);
      if (r) {
        r[field] = ['marketValue', 'mortgageDebt', 'monthlyRentInflow'].includes(field) ? (parseFloat(val) || 0) : val;
        handleDataUpdate();
      }
    };

