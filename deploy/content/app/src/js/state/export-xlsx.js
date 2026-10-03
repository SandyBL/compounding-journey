    // =====================================================================
    // Excel export / import: round-trips the household's editable numbers through a
    // workbook. Sheets are read back by POSITION (not by translated name/header text),
    // so a file exported in one language imports correctly in another. Every editable
    // sheet's first column is a stable, never-translated key or numeric id: blank on a
    // new row means "add this as new"; a row deleted from the sheet is treated as
    // deleted from the app (Investments / Debts / Goals / Life Events are a FULL
    // REPLACE of that list, not a merge). The Summary and Balance Sheet sheets are a
    // read-only snapshot: editing them has no effect on import.
    // Amounts are the holding's OWN currency (never converted), as plain numbers, so
    // editing a cell and reimporting cannot silently change what a number means.
    // =====================================================================
    const XLSX_MARKER = 'family-wealth-compass-xlsx-export';
    const XLSX_SCHEMA_VERSION = 1;
    const XLSX_SHEET_ORDER = ['readme', 'summary', 'balance', 'cashflow', 'investments', 'debts', 'goals', 'events'];
    const XLSX_OUTFLOW_KEYS = [
      ['housing', 'cfLabelHousing'], ['utilities', 'cfLabelUtilities'], ['telecom', 'catTelecom'],
      ['groceries', 'cfLabelGroceries'], ['dining', 'cfLabelDining'], ['transport', 'cfLabelTransport'],
      ['cleaning', 'cfLabelCleaning'], ['subs', 'catSubs'], ['elderCare', 'cfLabelElderCare'], ['charitableGiving', 'cfLabelCharitable']
    ];
    const XLSX_DEBT_KEYS = ['parcelas', 'revolving', 'autoLoans'];

    function xlsxNum(v) { return Math.round((Number(v) || 0) * 100) / 100; }   // a plain number, cents kept, no formatting

    // ---------- building sheets (export) ----------
    function xlsxReadmeSheet() {
      return XLSX.utils.aoa_to_sheet([
        [XLSX_MARKER, XLSX_SCHEMA_VERSION],
        [t('xlsxReadmeTitle')],
        [t('xlsxReadmeBody1')], [t('xlsxReadmeBody2')], [t('xlsxReadmeBody3')], [t('xlsxReadmeBody4')]
      ]);
    }
    function xlsxSummarySheet(m) {
      return XLSX.utils.aoa_to_sheet([
        [t('xlsxLabel'), t('xlsxValue')],
        [t('lblNetWorth'), fmt(m.netWorth)], [t('xlsxTotalAssets'), fmt(m.totalAssets)],
        [t('xlsxTotalDebts'), fmt(m.totalDebts)], [t('xlsxTotalLiquid'), fmt(m.totalLiquidBase)],
        [t('ovwPayYourselfFirst'), fmt(m.monthlyInvest)], [t('lblSavingsRate'), `${m.savingsRate.toFixed(1)}%`],
        [t('xlsxFreedomTarget'), fmt(m.targetFreedomCapital)], [t('ovwFreedomYear').replace(':', ''), m.crossoverYear],
        [t('bsCreditScoreLabel').replace(/[:：].*$/, ''), state.creditScore || ''],
        [t('xlsxExportedAt'), new Date().toLocaleString(dpLocale())]
      ]);
    }
    function xlsxBalanceSheet() {
      const rows = [[t('xlsxAssetType'), t('xlsxName'), t('xlsxCurrency'), t('xlsxAmountBase')]];
      (state.realEstate || []).forEach(r => rows.push([t('bsRealEstateTitle'), r.name || '', r.currency || state.baseCurrency, fmt(convertToBase(Number(r.marketValue) || 0, r.currency || state.baseCurrency))]));
      (state.liquidInvestments || []).forEach(i => rows.push([t('bsLiquidTitle'), i.name || '', i.currency || state.baseCurrency, fmt(convertToBase(Number(i.balanceOriginal) || 0, i.currency || state.baseCurrency))]));
      rows.push(['', '', '', '', ]);
      rows.push([t('bsDebtsTitle'), '', '', '']);
      rows.push([t('bsDebtInstallments'), '', '', fmt(Number(state.debts.parcelas) || 0)]);
      rows.push([t('bsDebtRevolving'), '', '', fmt(Number(state.debts.revolving) || 0)]);
      rows.push([t('bsDebtAuto'), '', '', fmt(Number(state.debts.autoLoans) || 0)]);
      (state.realEstate || []).forEach(r => { if (Number(r.mortgageDebt) > 0) rows.push([t('dpDebtMortgage'), r.name || '', r.currency || state.baseCurrency, fmt(convertToBase(Number(r.mortgageDebt) || 0, r.currency || state.baseCurrency))]); });
      return XLSX.utils.aoa_to_sheet(rows);
    }
    function xlsxCashflowSheet(m) {
      const rows = [[t('xlsxKey'), t('xlsxCategory'), t('xlsxAmountMonthly')]];
      // BUGFIX: this row is labeled "Net Income Total" but used to export e.grossMonthly
      // (the gross figure) \u2014 wrong even for an ordinary earner, and actively misleading
      // for one using the manual net-salary override (ui/earners.js's "Real Payslip Net
      // Salary Override"), whose grossMonthly can be 0 or a stale, unrelated number while
      // their REAL income (realNetSalary) was never read here at all. Now uses
      // m.earnerNetById \u2014 the same real net-income resolution calculateMetrics() itself
      // uses (manual override honored, tax engine otherwise) \u2014 instead of a separate,
      // drift-prone recalculation.
      (state.earners || []).forEach(e => rows.push([e.id, `${t('cfNetIncomeTotal')}: ${e.name || ''}`, xlsxNum((m && m.earnerNetById && m.earnerNetById[e.id]) || 0)]));
      rows.push(['monthlyInvestment', t('ovwPayYourselfFirst'), xlsxNum(state.monthlyInvestment)]);
      XLSX_OUTFLOW_KEYS.forEach(([k, key]) => rows.push([k, t(key), xlsxNum(state.outflows[k])]));
      rows.push(['', '', '']);
      rows.push(['', t('xlsxReferenceOnlyBelow'), '']);
      (state.children || []).forEach(c => rows.push(['', `${t('cfBucketFixedSub')}: ${c.name || ''}`, xlsxNum((Number(c.schoolMonthly) || 0) + (Number(c.collegeMonthly) || 0))]));
      rows.push(['', t('cfBucketDebtTitle'), xlsxNum(m.debtPaymentsMonthly)]);
      rows.push(['', t('cfNetIncomeTotal'), xlsxNum(m.totalNetInflow)]);
      return XLSX.utils.aoa_to_sheet(rows);
    }
    function xlsxInvestmentsSheet() {
      const rows = [[t('xlsxIdCol'), t('xlsxName'), t('xlsxCurrency'), t('xlsxBalance'), t('liLabelYield'), t('liLabelLiquidity'), t('liLabelVolatility'), t('liAccountTypeLabel'), t('liWdTaxLabel'), t('liGainLabel'), t('liContributedLabel').replace('{year}', new Date().getFullYear()), t('xlsxOwner')]];
      (state.liquidInvestments || []).forEach(i => rows.push([i.id, i.name || '', i.currency || state.baseCurrency, xlsxNum(i.balanceOriginal), i.annualYieldPct, i.liquidityTier, i.volatilityTier, i.accountType, i.wdTax || 'auto', i.gainPct === null || i.gainPct === undefined ? '' : i.gainPct, xlsxNum(i.contributedThisYear), i.owner || 'joint']));
      return XLSX.utils.aoa_to_sheet(rows);
    }
    function xlsxDebtsSheet() {
      const rows = [[t('xlsxKey'), t('xlsxName'), t('xlsxBalance'), t('dpColRate'), t('dpColPayment')]];
      const d = state.debts;
      rows.push(['parcelas', t('bsDebtInstallments'), xlsxNum(d.parcelas), 0, xlsxNum(d.parcelasMinPayment)]);
      rows.push(['revolving', t('bsDebtRevolving'), xlsxNum(d.revolving), d.revolvingRatePct, xlsxNum(d.revolvingMinPayment)]);
      rows.push(['autoLoans', t('bsDebtAuto'), xlsxNum(d.autoLoans), d.autoLoansRatePct, xlsxNum(d.autoLoansMinPayment)]);
      (state.realEstate || []).forEach(r => {
        if (Number(r.mortgageDebt) <= 0) return;
        const terms = resolveMortgageTerms(r, state);
        rows.push(['mortgage-' + r.id, `${t('dpDebtMortgage')}: ${r.name || ''}`, xlsxNum(terms.balance), terms.ratePct, xlsxNum(terms.payment)]);
      });
      return XLSX.utils.aoa_to_sheet(rows);
    }
    function xlsxGoalsSheet() {
      const rows = [[t('xlsxIdCol'), t('xlsxName'), t('glTargetAmount'), t('glCurrentSaved'), t('xlsxTimeValue'), t('xlsxTimeUnit'), t('xlsxOwner'), t('xlsxTracked'), t('xlsxContributions')]];
      (state.goals || []).forEach(g => rows.push([g.id, g.name || '', xlsxNum(g.targetAmount), xlsxNum(g.currentSaved), g.timeValue, g.timeUnit, g.owner || 'joint',
        g.trackContributions ? 1 : 0, JSON.stringify(g.contributions || {})]));
      return XLSX.utils.aoa_to_sheet(rows);
    }
    function xlsxEventsSheet() {
      const rows = [[t('xlsxIdCol'), t('xlsxName'), t('leType'), t('leDirection'), t('xlsxAmount'), t('leYear'), t('leDuration'), t('leOn'), t('xlsxAutomatic')]];
      (state.lifeEvents || []).forEach(e => rows.push([e.id, e.name || '', e.kind, e.direction, xlsxNum(e.amount), e.year, e.years, e.enabled !== false, t('wiNo')]));
      buildDebtPlanEvents(state).forEach(e => rows.push(['', e.nameKey ? t(e.nameKey) : '', e.kind, e.direction, xlsxNum(e.amount), e.year, e.years || '', true, t('wiYes')]));
      return XLSX.utils.aoa_to_sheet(rows);
    }

    window.exportDataXLSX = function() {
      if (typeof XLSX === 'undefined') { showAlertModal(t('xlsxUnavailableTitle'), t('xlsxUnavailableBody')); return; }
      const m = calculateMetrics();
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, xlsxReadmeSheet(), t('xlsxSheetReadme'));
      XLSX.utils.book_append_sheet(wb, xlsxSummarySheet(m), t('xlsxSheetSummary'));
      XLSX.utils.book_append_sheet(wb, xlsxBalanceSheet(), t('xlsxSheetBalance'));
      XLSX.utils.book_append_sheet(wb, xlsxCashflowSheet(m), t('xlsxSheetCashflow'));
      XLSX.utils.book_append_sheet(wb, xlsxInvestmentsSheet(), t('xlsxSheetInvestments'));
      XLSX.utils.book_append_sheet(wb, xlsxDebtsSheet(), t('xlsxSheetDebts'));
      XLSX.utils.book_append_sheet(wb, xlsxGoalsSheet(), t('xlsxSheetGoals'));
      XLSX.utils.book_append_sheet(wb, xlsxEventsSheet(), t('xlsxSheetEvents'));
      const dateStamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `family-wealth-compass_export_${dateStamp}.xlsx`);
    };

    // ---------- reading sheets back (import) ----------
    function xlsxSheetRows(wb, key) {
      const idx = XLSX_SHEET_ORDER.indexOf(key);
      const name = wb.SheetNames[idx];
      if (!name) return [];
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' });
      return rows.slice(1);          // drop the header row; position, not text, drives parsing
    }
    const xlsxN = (v) => { const n = Number(v); return isFinite(n) ? n : 0; };
    const xlsxB = (v) => v === true || v === 'true' || v === 1 || v === '1' || (typeof v === 'string' && /^(yes|sim|s[ií])$/i.test(v.trim()));
    const xlsxId = (v) => { const n = Math.floor(Number(v)); return (isFinite(n) && n > 0) ? n : undefined; };   // blank/junk = new row

    function xlsxValidate(wb) {
      if (!wb || !Array.isArray(wb.SheetNames) || wb.SheetNames.length < XLSX_SHEET_ORDER.length) return t('xlsxImportBadFile');
      const readme = wb.Sheets[wb.SheetNames[0]];
      const first = XLSX.utils.sheet_to_json(readme, { header: 1, defval: '' })[0] || [];
      if (first[0] !== XLSX_MARKER) return t('xlsxImportBadFile');
      if (Number(first[1]) > XLSX_SCHEMA_VERSION) return t('xlsxImportNewerVersion');
      return null;
    }

    function xlsxParseInvestments(wb, existing) {
      const byId = {}; (existing || []).forEach(i => { byId[i.id] = i; });
      return xlsxSheetRows(wb, 'investments').filter(r => r[1] !== '' && r[1] !== undefined).map(r => {
        const id = xlsxId(r[0]), base = (id && byId[id]) || {};
        return Object.assign({}, base, {
          id, name: r[1], currency: r[2] || state.baseCurrency, balanceOriginal: xlsxN(r[3]), annualYieldPct: xlsxN(r[4]),
          liquidityTier: r[5], volatilityTier: r[6], accountType: r[7], wdTax: r[8],
          gainPct: r[9] === '' ? null : xlsxN(r[9]), contributedThisYear: xlsxN(r[10]), contributionYear: base.contributionYear,
          owner: r[11] || 'joint'   // applyXlsxImport() runs this through migrateAndSanitizeState right away, which re-validates it against the current earners
        });
      });
    }
    function xlsxParseGoals(wb, existing) {
      const byId = {}; (existing || []).forEach(g => { byId[g.id] = g; });
      return xlsxSheetRows(wb, 'goals').filter(r => r[1] !== '' && r[1] !== undefined).map(r => {
        const id = xlsxId(r[0]);
        let contributions = {};
        try { contributions = JSON.parse(r[8]) || {}; if (typeof contributions !== 'object' || Array.isArray(contributions)) contributions = {}; } catch (e) { contributions = {}; }
        return { id, name: r[1], targetAmount: xlsxN(r[2]), currentSaved: xlsxN(r[3]), timeValue: xlsxN(r[4]), timeUnit: r[5], owner: r[6] || 'joint',
          trackContributions: r[7] === 1 || r[7] === '1' || r[7] === true, contributions };   // re-validated by the sanitizer right after
      });
    }
    function xlsxParseEvents(wb, existing) {
      const byId = {}; (existing || []).forEach(e => { byId[e.id] = e; });
      return xlsxSheetRows(wb, 'events')
        .filter(r => r[1] !== '' && r[1] !== undefined && !xlsxB(r[8]))       // automatic rows are never re-created
        .map(r => ({ id: xlsxId(r[0]), name: r[1], kind: r[2], direction: r[3], amount: xlsxN(r[4]), year: xlsxN(r[5]), years: xlsxN(r[6]) || 1, enabled: xlsxB(r[7]) }));
    }
    function xlsxParseDebtsAndCashflow(wb, s) {
      const cf = xlsxSheetRows(wb, 'cashflow');
      const byEarnerId = {}; cf.forEach(r => { const id = xlsxId(r[0]); if (id) byEarnerId[id] = xlsxN(r[2]); });
      // This row now exports the earner's real NET income (see xlsxCashflowSheet, fixed
      // alongside this), not grossMonthly \u2014 so an edited cell is applied back the same
      // way: as a net-salary override (ui/earners.js's manualNetOverride mechanism), the
      // exact number reimported exactly, never silently reinterpreted as a gross figure
      // it was never meant to be. Matches the project's own "a cell can be edited and
      // reimported without changing what it means" rule for every other XLSX field.
      //
      // BUGFIX caught by the untouched-profile round-trip test: comparing against the
      // earner's CURRENT real net income (computed BEFORE anything in this function
      // mutates s.earners) and only applying the override when the imported number
      // genuinely differs. Without this, re-importing a person's own, completely
      // untouched export would unconditionally flip manualNetOverride to true for every
      // earner on every single re-import \u2014 a side effect with no real edit behind it.
      const currentNetById = (calculateMetricsFor(s).earnerNetById) || {};
      (s.earners || []).forEach(e => {
        if (byEarnerId[e.id] === undefined) return;
        const imported = byEarnerId[e.id];
        const current = Number(currentNetById[e.id]) || 0;
        if (Math.abs(imported - current) > 0.01) { e.manualNetOverride = true; e.realNetSalary = imported; }
      });
      const miRow = cf.find(r => r[0] === 'monthlyInvestment');
      if (miRow) s.monthlyInvestment = xlsxN(miRow[2]);
      const byKey = {}; cf.forEach(r => { if (typeof r[0] === 'string' && r[0] && r[0] !== 'monthlyInvestment') byKey[r[0]] = xlsxN(r[2]); });
      XLSX_OUTFLOW_KEYS.forEach(([k]) => { if (byKey[k] !== undefined) s.outflows[k] = byKey[k]; });

      const debtRows = xlsxSheetRows(wb, 'debts');
      const byDebtKey = {}; debtRows.forEach(r => { if (r[0]) byDebtKey[r[0]] = r; });
      XLSX_DEBT_KEYS.forEach(k => {
        const r = byDebtKey[k]; if (!r) return;
        s.debts[k] = xlsxN(r[2]);
        if (k !== 'parcelas') s.debts[k + 'RatePct'] = xlsxN(r[3]);
        s.debts[(k === 'parcelas' ? 'parcelas' : k) + 'MinPayment'] = xlsxN(r[4]);
      });
      (s.realEstate || []).forEach(r => {
        const row = byDebtKey['mortgage-' + r.id]; if (!row) return;
        r.mortgageDebt = xlsxN(row[2]); r.mortgageRatePct = xlsxN(row[3]); r.mortgagePayment = xlsxN(row[4]);
      });
    }

    window.handleImportXlsxFileSelected = function(input) {
      const file = input.files && input.files[0];
      if (!file) return;
      if (typeof XLSX === 'undefined') { showAlertModal(t('xlsxUnavailableTitle'), t('xlsxUnavailableBody')); input.value = ''; return; }
      const reader = new FileReader();
      reader.onload = function(ev) {
        input.value = '';
        let wb;
        try { wb = XLSX.read(ev.target.result, { type: 'array' }); }
        catch (e) { showAlertModal(t('xlsxImportErrorTitle'), t('xlsxImportBadFile')); return; }
        const problem = xlsxValidate(wb);
        if (problem) { showAlertModal(t('xlsxImportErrorTitle'), problem); return; }
        let incoming;
        try {
          incoming = buildXlsxImportState(wb);
        } catch (e) {
          showAlertModal(t('xlsxImportErrorTitle'), t('xlsxImportBadFile'));
          return;
        }
        const diff = computeImportDiff(state, incoming);
        showImportReviewModal(diff, function() { applyXlsxImportState(incoming); });
      };
      reader.readAsArrayBuffer(file);
    };

    // Builds the prospective new state WITHOUT touching the real one, so it can be
    // diffed and reviewed before anything is applied.
    function buildXlsxImportState(wb) {
      const s = JSON.parse(JSON.stringify(state));
      s.liquidInvestments = xlsxParseInvestments(wb, state.liquidInvestments);
      s.goals = xlsxParseGoals(wb, state.goals);
      s.lifeEvents = xlsxParseEvents(wb, state.lifeEvents);
      xlsxParseDebtsAndCashflow(wb, s);
      return migrateAndSanitizeState(s);
    }
    function applyXlsxImportState(incoming) {
      // Same reasoning as the JSON import path: the app lock is local to this device,
      // never part of an export, and must survive an Excel import unchanged.
      incoming.security = state.security;
      state = incoming;
      updateUI();
      saveState();
      showAlertModal(t('xlsxImportDoneTitle'), t('xlsxImportDoneBody'));
    }

