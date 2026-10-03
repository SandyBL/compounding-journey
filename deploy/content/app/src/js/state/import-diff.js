    // =====================================================================
    // Conflict-aware import: before EITHER import path (JSON or Excel) replaces
    // anything, it builds the prospective new state, compares it section by
    // section against the CURRENT profile, and shows the person what would
    // actually change — instead of confirming a blind "replace everything?"
    // and finding out only afterward. Nothing is applied until they confirm
    // having seen the diff; Cancel leaves the profile completely untouched.
    // =====================================================================
    function diffList(oldArr, newArr, nameFn, fields) {
      const oldById = {}; (oldArr || []).forEach(x => { oldById[x.id] = x; });
      const newById = {}; (newArr || []).forEach(x => { newById[x.id] = x; });
      const allIds = Array.from(new Set([].concat(Object.keys(oldById), Object.keys(newById))));
      let added = 0, removed = 0, changed = 0, unchanged = 0; const details = [];
      allIds.forEach(id => {
        const o = oldById[id], n = newById[id];
        if (!o && n) { added++; details.push({ type: 'added', text: nameFn(n) }); }
        else if (o && !n) { removed++; details.push({ type: 'removed', text: nameFn(o) }); }
        else {
          const diffFields = fields.filter(f => JSON.stringify(o[f]) !== JSON.stringify(n[f]));
          if (diffFields.length) { changed++; details.push({ type: 'changed', text: nameFn(n), fields: diffFields.map(f => ({ field: f, from: o[f], to: n[f] })) }); }
          else unchanged++;
        }
      });
      return { added, removed, changed, unchanged, empty: allIds.length === 0, details };
    }
    function diffScalarGroup(oldObj, newObj, fields) {
      let changed = 0, unchanged = 0; const details = [];
      fields.forEach(f => {
        const same = JSON.stringify((oldObj || {})[f]) === JSON.stringify((newObj || {})[f]);
        if (same) unchanged++; else { changed++; details.push({ field: f, from: (oldObj || {})[f], to: (newObj || {})[f] }); }
      });
      return { added: 0, removed: 0, changed, unchanged, empty: false, details };
    }
    // A field value for display in the review modal: money-shaped numbers use fmt()
    // (in the CURRENT display currency — a genuine approximation when currencies
    // differ, clearly a preview rather than a precise recomputation), everything
    // else falls back to a plain string.
    const DIFF_MONEY_FIELDS = ['balanceOriginal', 'marketValue', 'mortgageDebt', 'grossMonthly', 'targetAmount', 'currentSaved', 'amount', 'parcelas', 'revolving', 'autoLoans', 'housing', 'utilities', 'telecom', 'groceries', 'dining', 'transport', 'cleaning', 'subs', 'elderCare', 'charitableGiving'];
    function diffValueText(field, v) {
      if (v === undefined || v === null || v === '') return '—';
      if (DIFF_MONEY_FIELDS.includes(field) && typeof v === 'number') return fmt(v);
      if (typeof v === 'boolean') return v ? t('wiYes') : t('wiNo');
      return String(v);
    }

    function computeImportDiff(oldState, newState) {
      const sections = [];
      const add = (key, labelKey, result) => sections.push({ key, label: t(labelKey), result });

      add('profile', 'diffSectionProfile', diffScalarGroup(oldState, newState,
        ['country', 'language', 'baseCurrency', 'householdMode', 'targetSavingsRate', 'inflationRate', 'careerGrowthRate', 'traditionalRetirementAge']));
      add('earners', 'diffSectionEarners', diffList(oldState.earners, newState.earners, e => e.name || t('demoRole1'), ['name', 'grossMonthly', 'regime']));
      add('realEstate', 'diffSectionRealEstate', diffList(oldState.realEstate, newState.realEstate, r => r.name || '', ['name', 'marketValue', 'mortgageDebt', 'owner']));
      add('investments', 'diffSectionInvestments', diffList(oldState.liquidInvestments, newState.liquidInvestments, i => i.name || '', ['name', 'balanceOriginal', 'currency', 'owner']));
      add('debts', 'diffSectionDebts', diffScalarGroup(oldState.debts, newState.debts, ['parcelas', 'revolving', 'revolvingRatePct', 'autoLoans', 'autoLoansRatePct']));
      add('outflows', 'diffSectionCashflow', diffScalarGroup(oldState.outflows, newState.outflows, XLSX_OUTFLOW_KEYS.map(([k]) => k)));
      add('recurringExpenses', 'diffSectionRecurring', diffList(oldState.recurringExpenses, newState.recurringExpenses, x => x.name || '', ['name', 'category', 'amount', 'splitType']));
      add('goals', 'diffSectionGoals', diffList(oldState.goals, newState.goals, g => g.name || '', ['name', 'targetAmount', 'currentSaved', 'owner']));
      add('lifeEvents', 'diffSectionEvents', diffList((oldState.lifeEvents || []).filter(e => !e.auto), (newState.lifeEvents || []).filter(e => !e.auto), e => e.name || '', ['name', 'amount', 'year']));
      add('estateSettings', 'diffSectionEstate', diffScalarGroup(oldState.estateSettings, newState.estateSettings, ['region', 'successionTaxRatePctOverride', 'hasWill', 'guardianDesignated']));

      return sections.filter(s => !s.result.empty);
    }

    // ---------- the review modal ----------
    let importReviewOnConfirm = null;

    function diffFieldLabel(field) {
      const known = { name: 'xlsxName', grossMonthly: 'recAmount', regime: 'earnerRegimeLabel', marketValue: 'reLabelMarketValue', mortgageDebt: 'reLabelMortgage',
        owner: 'ownerLabel', balanceOriginal: 'xlsxBalance', currency: 'xlsxCurrency', category: 'recCategory', amount: 'xlsxAmount', splitType: 'recSplitType',
        targetAmount: 'glTargetAmount', currentSaved: 'glCurrentSaved', year: 'leYear', country: 'xlsxAssetType', language: 'householdModeLabel', baseCurrency: 'xlsxCurrency',
        householdMode: 'householdModeLabel', region: 'estRegionLabel', successionTaxRatePctOverride: 'estRateLabel', hasWill: 'estHasWillLabel', guardianDesignated: 'estGuardianLabel' };
      return known[field] && I18N[state.language] && I18N[state.language][known[field]] ? t(known[field]) : field;
    }

    function renderImportReviewSections(sections) {
      const box = document.getElementById('import-review-sections');
      if (!box) return;
      box.innerHTML = sections.map(s => {
        const r = s.result;
        const parts = [];
        if (r.added) parts.push(`<span class="text-emerald-400 font-bold">+${r.added} ${t('diffAdded')}</span>`);
        if (r.removed) parts.push(`<span class="text-rose-400 font-bold">−${r.removed} ${t('diffRemoved')}</span>`);
        if (r.changed) parts.push(`<span class="text-gold-300 font-bold">${r.changed} ${t('diffChanged')}</span>`);
        if (r.unchanged) parts.push(`<span class="text-slate-400">${r.unchanged} ${t('diffUnchanged')}</span>`);
        // one row per changed FIELD: a scalar-group diff has one row per field, a list
        // diff has one row per changed ITEM (naming it, then each of its changed fields).
        const oneField = (f) => `${escapeHtml(diffFieldLabel(f.field))}: ${escapeHtml(diffValueText(f.field, f.from))} → <span class="text-white">${escapeHtml(diffValueText(f.field, f.to))}</span>`;
        const examples = r.details.slice(0, 3).map(d => {
          if (d.type === 'added') return `<div class="text-[10px] text-emerald-400/90">+ ${escapeHtml(d.text)}</div>`;
          if (d.type === 'removed') return `<div class="text-[10px] text-rose-400/90">− ${escapeHtml(d.text)}</div>`;
          if (d.type === 'changed') return `<div class="text-[10px] text-slate-400"><span class="text-slate-200">${escapeHtml(d.text)}</span> — ${d.fields.map(oneField).join('; ')}</div>`;
          return `<div class="text-[10px] text-slate-400">${oneField(d)}</div>`;
        }).join('');
        const moreCount = r.details.length - Math.min(3, r.details.length);
        return `<div class="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
          <div class="flex items-center justify-between gap-2"><span class="text-slate-200 font-semibold">${escapeHtml(s.label)}</span><span class="flex gap-2 text-[11px]">${parts.join(' · ') || `<span class="text-slate-400">${t('diffUnchanged')}</span>`}</span></div>
          ${examples ? `<div class="mt-1 space-y-0.5">${examples}${moreCount > 0 ? `<div class="text-[10px] text-slate-600">${t('diffMore').replace('{n}', moreCount)}</div>` : ''}</div>` : ''}
        </div>`;
      }).join('') || `<p class="text-xs text-slate-400 p-3 text-center">${t('diffNothingChanged')}</p>`;
    }

    function showImportReviewModal(diff, onConfirm) {
      importReviewOnConfirm = onConfirm;
      renderImportReviewSections(diff);
      const totalChanges = diff.reduce((s, x) => s + x.result.added + x.result.removed + x.result.changed, 0);
      const subtitle = document.getElementById('import-review-subtitle');
      if (subtitle) subtitle.innerText = totalChanges > 0 ? t('diffSubtitleChanges').replace('{n}', totalChanges) : t('diffSubtitleNone');
      const modal = document.getElementById('modal-import-review');
      if (modal) modal.classList.remove('hidden');
    }
    window.closeImportReviewModal = function() {
      importReviewOnConfirm = null;
      const modal = document.getElementById('modal-import-review');
      if (modal) modal.classList.add('hidden');
    };
    window.confirmImportReview = function() {
      const fn = importReviewOnConfirm;
      window.closeImportReviewModal();
      if (fn) fn();
    };

