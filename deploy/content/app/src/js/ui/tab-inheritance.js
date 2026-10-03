    // getDefaultSuccessionTaxRate(country, region) and the region data/tables live in
    // tax/regional-rates.js — Portugal abolished inheritance tax between spouse/
    // children/parents in 2004 (Imposto do Selo art. 6º al. e), which is why this
    // app never modeled a Portuguese default; Global keeps a flat placeholder since
    // "rules vary enormously by country" is the only honest thing to say there.

    function getSuccessionCountryNote(country, lang) {
      const key = country === 'GL' ? 'estNoteGL' : (country === 'ES' ? 'estNoteES' : 'estNoteBR');
      return t(key);
    }

    function renderEstateSuccession(m) {
      const container = document.getElementById('container-estate-succession-content');
      if (!container) return;

      const country = state.country || 'BR';
      const es = state.estateSettings || {};
      const region = es.region || null;
      const defaultRate = getDefaultSuccessionTaxRate(country, region);
      const elRateInput = document.getElementById('input-estate-tax-rate');
      const override = es.successionTaxRatePctOverride;
      const ratePct = (typeof override === 'number') ? override : defaultRate;
      if (elRateInput && document.activeElement !== elRateInput) {
        elRateInput.value = ratePct;
      }
      const noteEl = document.getElementById('lbl-est-country-note');
      if (noteEl) noteEl.innerText = getSuccessionCountryNote(country, state.language);

      // Region selector: only meaningful for BR/ES; Global keeps its single placeholder.
      const rowRegion = document.getElementById('row-estate-region');
      const selRegion = document.getElementById('select-estate-region');
      const hasRegions = country === 'BR' || country === 'ES';
      if (rowRegion) rowRegion.classList.toggle('hidden', !hasRegions);
      if (selRegion && hasRegions) {
        const names = getRegionNames(country);
        const codes = Object.keys(names).sort((a, b) => names[a].localeCompare(names[b]));
        const optionsHtml = `<option value="">${escapeHtml(t('estRegionNotSet'))}</option>` +
          codes.map(c => `<option value="${c}" ${region === c ? 'selected' : ''}>${escapeHtml(names[c])}</option>`).join('');
        if (selRegion.innerHTML !== optionsHtml) selRegion.innerHTML = optionsHtml;
        selRegion.value = region || '';
      }
      const badgeEl = document.getElementById('lbl-est-rate-badge');
      if (badgeEl) badgeEl.innerHTML = taxRulesBadge(country === 'ES' ? 'ES_ISD_REGIONAL' : (country === 'BR' ? 'BR_ITCMD_REGIONAL' : ''));

      // Spain-only: property transfer tax (ITP) reference for a future home purchase.
      const itpRow = document.getElementById('row-estate-itp');
      if (itpRow) {
        const rate = country === 'ES' ? getRegionalItpRate(region) : null;
        itpRow.classList.toggle('hidden', country !== 'ES');
        if (country === 'ES') {
          const valEl = document.getElementById('lbl-est-itp-value');
          const badgeItp = document.getElementById('lbl-est-itp-badge');
          if (valEl) valEl.innerText = rate === null ? t('estItpUnknown') : `${rate}%`;
          if (badgeItp) badgeItp.innerHTML = taxRulesBadge('ES_ITP_REGIONAL');
        }
      }

      const grossEstate = m.netWorth;
      const childCount = (state.children || []).length || 1;
      const estimatedEstateTax = Math.max(0, grossEstate * (ratePct / 100));
      const netToDistribute = grossEstate - estimatedEstateTax;
      const perChild = netToDistribute / childCount;

      container.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span class="text-slate-400 block">${t('estGrossEstate')}</span>
            <strong class="text-white text-sm font-black">${fmt(grossEstate)}</strong>
          </div>
          <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span class="text-rose-400 block">${t('estTaxEstimate').replace('{pct}', ratePct.toFixed(1))}</span>
            <strong class="text-rose-300 text-sm font-black">${fmt(estimatedEstateTax)}</strong>
          </div>
          <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span class="text-teal-300 block">${t('estNetInheritance')}</span>
            <strong class="text-teal-400 text-sm font-black">${fmt(netToDistribute)}</strong>
          </div>
          <div class="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-1">
            <span class="text-emerald-300 block">${t('estPerChild').replace('{n}', childCount)}</span>
            <strong class="text-emerald-400 text-sm font-black">${fmt(perChild)}</strong>
          </div>
        </div>
      `;

      // Will / guardian checkboxes + name field, synced from state (`es` already
      // holds state.estateSettings from earlier in this function)
      const elHasWill = document.getElementById('input-has-will');
      const elGuardianDesignated = document.getElementById('input-guardian-designated');
      const elGuardianName = document.getElementById('input-guardian-name');
      if (elHasWill) elHasWill.checked = Boolean(es.hasWill);
      if (elGuardianDesignated) elGuardianDesignated.checked = Boolean(es.guardianDesignated);
      if (elGuardianName && document.activeElement !== elGuardianName) elGuardianName.value = es.guardianName || '';

      const banner = document.getElementById('banner-no-guardian');
      if (banner) {
        const hasKids = (state.children || []).length > 0;
        banner.classList.toggle('hidden', !(hasKids && !es.guardianDesignated));
      }
    }

