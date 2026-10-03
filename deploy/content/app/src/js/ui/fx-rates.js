    function renderDynamicFxInputs() {
      const container = document.getElementById('container-dynamic-fx-rates');
      if (!container) return;
      container.innerHTML = '';

      const base = state.baseCurrency || 'BRL';
      const allCurrs = ['USD', 'EUR', 'BRL'];
      const foreignCurrs = allCurrs.filter(c => c !== base);

      if (!state.fxRates) {
        state.fxRates = Object.assign({}, DEFAULT_FX_PRESETS[base]);
      }

      setText('lbl-fx-base-tag', `${t('bsMoedaBase')} ${base}`);
      setText('lbl-fx-last-updated', state.fxLastUpdated || t('fxNeverConfirmed'));

      foreignCurrs.forEach(fc => {
        const currentRate = state.fxRates[fc] !== undefined ? state.fxRates[fc] : (DEFAULT_FX_PRESETS[base]?.[fc] || 1);
        const div = document.createElement('div');
        div.className = "p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs";
        div.innerHTML = `
          <div class="space-y-0.5">
            <span class="font-bold text-slate-300 block flex items-center">
              1 ${fc} =
              ${makeTip(t('bsFxRateTipTemplate').replace('{fc}', fc).replace('{base}', base), 'tip-left')}
            </span>
            <span class="text-[10px] text-slate-400">${t('bsFxQuoteTemplate').replace('{fc}', fc).replace('{base}', base)}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <input type="number" step="0.01" min="0.0001" value="${currentRate}" oninput="updateFxRate('${fc}', this.value)" class="w-20 glass-input rounded-lg px-2 py-1 text-right font-bold text-teal-400 text-xs">
            <span class="text-[11px] font-bold text-slate-400">${base}</span>
          </div>
        `;
        container.appendChild(div);
      });
    }

    window.refreshFxTimestamp = function() {
      state.fxLastUpdated = new Date().toISOString().slice(0, 10);
      setText('lbl-fx-last-updated', state.fxLastUpdated);
      saveState();
    };

    window.updateFxRate = function(foreignCurr, newRate) {
      if (!state.fxRates) state.fxRates = {};
      state.fxRates[foreignCurr] = parseFloat(newRate) || 1;
      state.fxLastUpdated = new Date().toISOString().slice(0, 10);
      setText('lbl-fx-last-updated', state.fxLastUpdated);
      handleDataUpdate();
    };

