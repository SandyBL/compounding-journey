    // =====================================================================
    // Central registry of "as of" dates for every jurisdiction-specific numeric tax
    // rule in the app. Used both for on-screen "Rules as of ..." badges and for the
    // annual-review test (tests/suites/tax-rules-review.test.js), which fails once a
    // rule is more than ~18 months old, so keeping the tests green forces a periodic
    // check of whether these numbers are still current.
    //
    // This is a FUNCTION, not a top-level const: several entries read constants
    // declared in tax/spain.js and calc/withdrawal.js, and building the object at
    // load time would depend on this file's position in order.json relative to
    // those (a top-level const referencing a not-yet-declared const throws). A
    // function body isn't evaluated until called, well after every file has loaded,
    // so this file's own position in the load order never matters.
    //
    // `confirmed: false` entries are numbers already in the app that were NOT
    // checked against a cited official source while building this feature — update
    // them with a real citation and date as soon as they are verified, rather than
    // inventing one.
    function getTaxRulesRegistry() {
      return {
        BR_IRPF: { date: '2026-01-01', source: 'Lei 15.191/2025 (2026 monthly table) + Lei 15.270/2025 (reform reducer)', confirmed: true },
        BR_INSS: { date: null, source: 'Employee INSS contribution table: not checked against an official source in this codebase — verify the current thresholds before relying on it.', confirmed: false },
        BR_PRIVATE_PENSION: { date: null, source: 'PGBL/VGBL regressive withdrawal table (rate falls from 35% to 10% as holding time rises): the 10% default assumes 10+ years and was not checked against an official table here — verify.', confirmed: false },
        BR_DIVIDENDS: { date: '2026-01-01', source: 'Lei 15.270/2025 (dividend withholding above R$50k/month + IRPFM); informational guide text only, not used in any calculation', confirmed: true },
        ES_SS: { date: ES_SS_EMPLOYEE_RATE_YEAR + '-01-01', source: 'Orden PJC/297/2026, BOE-A-2026-7296', confirmed: true },
        ES_IRPF: { date: '2026-01-01', source: '2026 combined state+regional scale, verified against a published example (EUR 30,000/yr gross -> EUR 7,165.50/yr)', confirmed: true },
        ES_SAVINGS: { date: ES_SAVINGS_SCALE_YEAR + '-01-01', source: 'CNMV guide, January 2026', confirmed: true },
        ES_RENTAL: { date: '2023-05-26', source: 'Agencia Tributaria, art. 23.2 LIRPF (the rule is contract-date dependent, not a yearly one — the date here is when the current tiers took effect)', confirmed: true, annual: false },
        ES_PENSION_PLAN: { date: null, source: 'EUR 1,500 / 30% individual pension-plan limit: not checked against the current annual limit in this codebase — verify before relying on it.', confirmed: false },
        BR_ITCMD_REGIONAL: { date: '2026-09-01', source: 'itcmd.com.br/tabela-itcmd-2026 (revised September 2026): the ceiling ("herança") bracket published per state; most states are progressive under LC 227/2026, a few keep one flat rate', confirmed: true },
        ES_ISD_REGIONAL: { date: '2026-09-01', source: 'Cross-checked regional summaries (ineaf.es, jmdominguez.es, guiafiscal.es "Mapa de Sucesiones 2026", tribunalegal.es), accessed September 2026: assumes a spouse or child inheriting (Groups I/II) with the region\'s own rebate applied — a different heir is taxed far more heavily almost everywhere and is not what this default models', confirmed: true },
        ES_ITP_REGIONAL: { date: '2026-09-01', source: 'rankia.com, tribeus.es, guiareformas.es, guiafiscal.es/patrimonio/itp/andalucia, accessed September 2026: general rate on a resale-home purchase, informational only. Only regions with one clear confirmed source are listed — the rest show "—" rather than a guess', confirmed: true }
      };
    }

    // Localized "Rules as of <month year>" (or an "unverified" note for entries with
    // no cited source), and the citation as a tooltip. Used next to a section title.
    function taxRulesAsOfText(key) {
      const r = getTaxRulesRegistry()[key];
      if (!r) return '';
      if (!r.confirmed || !r.date) return t('taxRulesUnverified');
      return t('taxRulesAsOf').replace('{date}', new Date(r.date).toLocaleDateString(dpLocale(), { year: 'numeric', month: 'long' }));
    }
    function taxRulesSourceText(key) {
      const r = getTaxRulesRegistry()[key];
      return r ? r.source : '';
    }
    function taxRulesBadge(key) {
      const r = getTaxRulesRegistry()[key];
      if (!r) return '';
      const cls = r.confirmed ? 'text-slate-400' : 'text-amber-400';
      return `<span class="text-[10px] ${cls} font-normal ml-1.5 whitespace-nowrap" title="${escapeHtml(taxRulesSourceText(key))}">${r.confirmed ? '📅' : '⚠️'} ${escapeHtml(taxRulesAsOfText(key))}</span>`;
    }

