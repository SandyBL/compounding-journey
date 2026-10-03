    // ---- Backup identity ------------------------------------------------------
    // Exports are wrapped in an envelope carrying these, and imports refuse
    // anything that doesn't identify itself as coming from this app — so a
    // stray JSON file (even a bare {}) can never replace a whole profile.
    const APP_EXPORT_ID = 'compounding-journey-family';
    const EXPORT_FORMAT_VERSION = 1;
    const CURRENT_SCHEMA_VERSION = 3;
    // Backups exported BEFORE the marker existed have no `app` field. They are
    // still accepted when they are structurally recognisable as this app's own
    // state (and the person is told so). Set to false to reject every file
    // without the marker.
    const ACCEPT_LEGACY_BACKUPS = true;
    const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

    // ---- Sanitizing helpers ---------------------------------------------------
    const SAN_MONEY_MAX = 1e13;
    const SAN_BASE_CURRENCIES = ['BRL', 'EUR', 'USD'];
    const SAN_ITEM_CURRENCIES = ['BRL', 'EUR', 'USD', 'GBP'];
    const SAN_REGIMES = ['CLT', 'PJ', 'Cuenta Ajena', 'Autónomo', 'Employee', 'Self-employed'];

    function sNum(v, fb) {
      let n = NaN;
      if (typeof v === 'number') n = v;
      else if (typeof v === 'string' && v.trim() !== '') n = Number(v);
      return Number.isFinite(n) ? n : fb;
    }
    function sNumR(v, min, max, fb) {
      const n = sNum(v, NaN);
      if (!Number.isFinite(n)) return fb;
      return Math.min(max, Math.max(min, n));
    }
    function sMoney(v, fb) { return sNumR(v, 0, SAN_MONEY_MAX, fb === undefined ? 0 : fb); }
    function sNumOrNull(v, min, max) {
      if (v === null || v === undefined || v === '') return null;
      const n = sNum(v, NaN);
      return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
    }
    function sStr(v, max) {
      if (typeof v === 'string') return v.slice(0, max || 200);
      if (typeof v === 'number' && Number.isFinite(v)) return String(v).slice(0, max || 200);
      return '';
    }
    function sBool(v, fb) {
      if (typeof v === 'boolean') return v;
      if (v === 'true') return true;
      if (v === 'false') return false;
      return fb;
    }
    function sEnum(v, allowed, fb) { return allowed.includes(v) ? v : fb; }
    function sObj(v) { return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }
    function sArr(v, max) { return Array.isArray(v) ? v.slice(0, max) : []; }
    // Ids end up inside onclick="...(${id})" attributes, where HTML escaping
    // cannot help, so they must be real positive integers — never strings.
    function makeIdGenerator() {
      const used = new Set();
      let seq = 0;
      return function(v) {
        let n = Math.floor(sNum(v, NaN));
        if (!Number.isSafeInteger(n) || n <= 0 || used.has(n)) {
          n = Date.now() * 1000 + (seq++);
          while (used.has(n)) n++;
        }
        used.add(n);
        return n;
      };
    }
    // Plain-data deep copy that drops prototype-polluting keys, functions and
    // anything nested absurdly deep.
    function safeClone(v, depth) {
      const d = depth || 0;
      if (d > 8) return null;
      if (Array.isArray(v)) return v.slice(0, 5000).map(x => safeClone(x, d + 1));
      if (v && typeof v === 'object') {
        const o = {};
        Object.keys(v).forEach(k => {
          if (k === '__proto__' || k === 'constructor' || k === 'prototype') return;
          o[k] = safeClone(v[k], d + 1);
        });
        return o;
      }
      if (typeof v === 'function' || typeof v === 'symbol') return null;
      return v;
    }

    // Rebuilds the state from scratch out of whitelisted, type-checked fields.
    // Unknown fields are dropped, numbers are real numbers, enums are valid.
    // Runs for every load from localStorage and every imported backup.
    function sanitizeState(res) {
      // Ids must be unique within their own list only (each list looks items up by id).
      let nextId = makeIdGenerator();
      const country = sEnum(res.country, ['BR', 'ES', 'GL'], 'BR');
      const baseCurrency = sEnum(res.baseCurrency, SAN_BASE_CURRENCIES, country === 'BR' ? 'BRL' : (country === 'GL' ? 'USD' : 'EUR'));
      const itemCurr = v => sEnum(v, SAN_ITEM_CURRENCIES, baseCurrency);
      const defaultRegime = country === 'ES' ? 'Cuenta Ajena' : (country === 'GL' ? 'Employee' : 'CLT');
      const out = {};

      out.schemaVersion = CURRENT_SCHEMA_VERSION;
      out.householdMode = sEnum(res.householdMode, ['shared', 'split'], 'shared');
      out.targetRiskyAllocationPct = sNumR(res.targetRiskyAllocationPct, 0, 100, 70);

      // App lock (ui/security.js): a corrupted or partial lock state must NEVER be able
      // to leave pinEnabled true without a valid hash+salt to check against — that would
      // permanently lock the person out with no way back in. Any inconsistency here falls
      // all the way back to "no lock" rather than guessing; the person can always set a
      // fresh PIN from the Profile modal.
      {
        const rawSec = sObj(res.security);
        const pinHash = typeof rawSec.pinHash === 'string' && /^[0-9a-f]{64}$/.test(rawSec.pinHash) ? rawSec.pinHash : null;
        const pinSalt = typeof rawSec.pinSalt === 'string' && rawSec.pinSalt.length > 0 ? rawSec.pinSalt : null;
        const pinEnabled = sBool(rawSec.pinEnabled, false) && !!pinHash && !!pinSalt;
        const biometricCredentialId = typeof rawSec.biometricCredentialId === 'string' && rawSec.biometricCredentialId.length > 0 ? rawSec.biometricCredentialId : null;
        const biometricEnabled = sBool(rawSec.biometricEnabled, false) && pinEnabled && !!biometricCredentialId;
        out.security = {
          pinEnabled, pinHash: pinEnabled ? pinHash : null, pinSalt: pinEnabled ? pinSalt : null,
          autoLockMinutes: Math.round(sNumR(rawSec.autoLockMinutes, 0, 120, 5)),
          biometricEnabled, biometricCredentialId: biometricEnabled ? biometricCredentialId : null
        };
      }

      out.emergencyReserveBannerDismissed = sBool(res.emergencyReserveBannerDismissed, false);
      out.billsDueSoonBannerDismissed = sBool(res.billsDueSoonBannerDismissed, false);
      out.freedomApproachingBannerDismissed = sBool(res.freedomApproachingBannerDismissed, false);
      out.cashFlowNegativeBannerDismissed = sBool(res.cashFlowNegativeBannerDismissed, false);
      const of = sObj(res.ownerFilter);
      out.ownerFilter = { investments: sStr(of.investments, 20) || 'all', realEstate: sStr(of.realEstate, 20) || 'all', goals: sStr(of.goals, 20) || 'all' };
      out.country = country;
      out.language = sEnum(res.language, ['pt', 'es', 'en'], 'pt');
      out.languageUserChosen = sBool(res.languageUserChosen, false);
      out.baseCurrency = baseCurrency;
      out.displayCurrency = sEnum(res.displayCurrency, SAN_BASE_CURRENCIES, baseCurrency);

      const rawFx = sObj(res.fxRates);
      const fx = {};
      ['USD', 'EUR', 'BRL', 'GBP'].forEach(k => {
        if (k === baseCurrency) return;
        const n = sNumR(rawFx[k], 0.0001, 1000000, NaN);
        if (Number.isFinite(n)) fx[k] = n;
      });
      out.fxRates = Object.keys(fx).length ? fx : Object.assign({}, DEFAULT_FX_PRESETS[baseCurrency] || {});
      out.fxRatesBaseCurrency = sEnum(res.fxRatesBaseCurrency, SAN_BASE_CURRENCIES, null);
      out.fxLastUpdated = (typeof res.fxLastUpdated === 'string' && /^\d{4}-\d{2}-\d{2}/.test(res.fxLastUpdated)) ? res.fxLastUpdated.slice(0, 20) : null;

      out.targetSavingsRate = sNumR(res.targetSavingsRate, 0, 100, 25);
      out.inflationRate = sNumR(res.inflationRate, 0, 100, getDefaultInflation(country));
      out.careerGrowthRate = sNumR(res.careerGrowthRate, 0, 50, 2);
      out.careerGrowthProportional = sBool(res.careerGrowthProportional, true);
      out.safetyBufferPct = sNumR(res.safetyBufferPct, 0, 100, 15);
      out.wizardCompleted = sBool(res.wizardCompleted, false);
      out.expectedMonthlyGovPension = sMoney(res.expectedMonthlyGovPension);
      out.creditScore = sNumOrNull(res.creditScore, 0, 1000);
      out.healthcareInflationRate = sNumOrNull(res.healthcareInflationRate, 0, 100);
      out.traditionalRetirementAge = sNumR(res.traditionalRetirementAge, 30, 100, 65);
      out.brExtraDependents = Math.floor(sNumR(res.brExtraDependents, 0, 20, 0));
      out.esRentalReductionPct = sEnum(Number(res.esRentalReductionPct), [50, 60, 70, 90], 50);
      out.glRentalTaxRatePct = sNumR(res.glRentalTaxRatePct, 0, 60, 20);
      out.glRetirementAnnualLimit = sMoney(res.glRetirementAnnualLimit);
      out.glMarginalTaxRatePct = sNumR(res.glMarginalTaxRatePct, 0, 80, 25);
      out.glCharitableDeductionPct = sNumR(res.glCharitableDeductionPct, 0, 100, 0);
      nextId = makeIdGenerator();
      out.lifeEvents = sArr(res.lifeEvents, 40).map(e0 => {
        const e = sObj(e0);
        return {
          id: nextId(e.id),
          kind: sEnum(e.kind, ['oneoff', 'monthly'], 'oneoff'),
          direction: sEnum(e.direction, ['in', 'out'], 'out'),
          name: sStr(e.name, 80),
          year: Math.round(sNumR(e.year, 1990, 2200, new Date().getFullYear() + 1)),
          amount: sMoney(e.amount),
          years: Math.round(sNumR(e.years, 1, 60, 1)),
          enabled: sBool(e.enabled, true)
        };
      });
      const wp = sObj(res.withdrawalPlan);
      out.withdrawalPlan = {
        startAge: Math.round(sNumR(wp.startAge, 0, 100, 0)),
        untilAge: Math.round(sNumR(wp.untilAge, 60, 110, 95)),
        pensionStartAge: Math.round(sNumR(wp.pensionStartAge, 50, 80, 65)),
        monthlySpending: sNumOrNull(wp.monthlySpending, 0, SAN_MONEY_MAX),
        order: sEnum(wp.order, ['taxable_first', 'deferred_first', 'proportional'], 'taxable_first'),
        realReturnPct: sNumOrNull(wp.realReturnPct, -10, 30),
        brGainsPct: sNumR(wp.brGainsPct, 0, 60, 15),
        brPensionPct: sNumR(wp.brPensionPct, 0, 60, 10),
        glGainsPct: sNumR(wp.glGainsPct, 0, 60, 15),
        safeBucketYears: sNumR(wp.safeBucketYears, 0, 10, 3),
        applyToTarget: sBool(wp.applyToTarget, false)
      };
      const wi = (res.whatIf && typeof res.whatIf === 'object') ? res.whatIf : {};
      out.whatIf = {
        extraSavingsPct: sNumR(wi.extraSavingsPct, -50, 100, 0),
        spendingChangePct: sNumR(wi.spendingChangePct, -50, 50, 0),
        returnDeltaPp: sNumR(wi.returnDeltaPp, -5, 5, 0),
        lumpSum: sMoney(wi.lumpSum),
        retireAge: Number(wi.retireAge) > 0 ? sNumR(wi.retireAge, 40, 90, 0) : 0,
        investFreed: sBool(wi.investFreed, true)
      };
      out.scoreIncludeHedge = sBool(res.scoreIncludeHedge, false);
      out.monthlyInvestment = sMoney(res.monthlyInvestment);

      const numObj = (src, keys, fbMap) => {
        const o = {};
        const r = sObj(src);
        keys.forEach(k => { o[k] = sMoney(r[k], fbMap && fbMap[k] !== undefined ? fbMap[k] : 0); });
        return o;
      };
      out.debts = numObj(res.debts, ['parcelas', 'revolving', 'autoLoans']);
      out.debts.revolvingRatePct = sNumR(sObj(res.debts).revolvingRatePct, 0, 300, 12);
      out.debts.autoLoansRatePct = sNumR(sObj(res.debts).autoLoansRatePct, 0, 300, 18);
      out.debts.parcelasMinPayment = sMoney(sObj(res.debts).parcelasMinPayment);
      out.debts.revolvingMinPayment = sMoney(sObj(res.debts).revolvingMinPayment);
      out.debts.autoLoansMinPayment = sMoney(sObj(res.debts).autoLoansMinPayment);
      const dp = sObj(res.debtPlan);
      out.debtPlan = {
        extraMonthly: sMoney(dp.extraMonthly),
        includeMortgages: sBool(dp.includeMortgages, false),
        method: sEnum(dp.method, ['avalanche', 'snowball'], 'avalanche'),
        autoEvents: sBool(dp.autoEvents, true)
      };
      out.outflows = numObj(res.outflows, ['housing', 'utilities', 'telecom', 'groceries', 'dining', 'transport', 'cleaning', 'subs', 'elderCare', 'charitableGiving']);
      out.budgetTargets = numObj(res.budgetTargets, RECURRING_CATEGORY_KEYS);
      out.insurance = numObj(res.insurance, ['lifeInsuranceCoverage', 'lifeInsuranceMonthlyPremium', 'disabilityMonthlyBenefit', 'disabilityMonthlyPremium', 'healthInsuranceMonthlyPremium', 'propertyInsuranceMonthlyPremium']);
      // Many employers cover some or all of a life insurance premium \u2014 asked for
      // directly, since treating the FULL premium as a family cost overstates what
      // the household is actually paying out of pocket. 0 (the default) means nothing
      // is employer-covered, matching the pre-existing behavior exactly for anyone who
      // never touches this.
      out.insurance.lifeInsuranceEmployerCoveragePct = sNumR(sObj(res.insurance).lifeInsuranceEmployerCoveragePct, 0, 100, 0);

      const es = sObj(res.estateSettings);
      out.estateSettings = {
        hasWill: sBool(es.hasWill, false),
        guardianDesignated: sBool(es.guardianDesignated, false),
        guardianName: sStr(es.guardianName, 120),
        // typeof check first: a bare object-key lookup would coerce an array like ['SP']
        // to the string "SP" and wrongly accept it (and then store the array itself).
        region: (typeof es.region === 'string' && country === 'BR' && BR_ITCMD_BY_STATE[es.region] !== undefined) ? es.region
          : (typeof es.region === 'string' && country === 'ES' && ES_ISD_DIRECT_FAMILY_BY_REGION[es.region] !== undefined) ? es.region : null,
        successionTaxRatePctOverride: sNumOrNull(es.successionTaxRatePctOverride, 0, 100)
      };

      nextId = makeIdGenerator();
      out.earners = sArr(res.earners, 50).map(e0 => {
        const e = sObj(e0);
        return {
          id: nextId(e.id), name: sStr(e.name, 80), role: sStr(e.role, 40),
          age: sNumR(e.age, 0, 120, 35), regime: sEnum(e.regime, SAN_REGIMES, defaultRegime),
          grossMonthly: sMoney(e.grossMonthly), hasHealth: sBool(e.hasHealth, true), esFixedTerm: sBool(e.esFixedTerm, false),
          foodVoucher: sMoney(e.foodVoucher), pjTaxRate: sNumR(e.pjTaxRate, 0, 100, 6),
          pjCompanyType: sEnum(e.pjCompanyType, ['simples3', 'simples5', 'presumido', 'mei', 'custom'], 'custom'),
          proLaborePct: sNumR(e.proLaborePct, 0, 100, 28),
          manualNetOverride: sBool(e.manualNetOverride, false), realNetSalary: sMoney(e.realNetSalary),
          // 13th salary / Christmas bonus + a company-results bonus, both smoothed into
          // the monthly net income (calc/metrics.js's calcEarnerNet) rather than shown
          // only as a one-off lump the person has to remember to plan around.
          has13thSalary: sBool(e.has13thSalary, false), annualBonus: sMoney(e.annualBonus)
        };
      });
      nextId = makeIdGenerator();
      out.children = sArr(res.children, 30).map(k0 => {
        const k = sObj(k0);
        return {
          id: nextId(k.id), name: sStr(k.name, 80), age: sNumR(k.age, 0, 120, 5),
          schoolMonthly: sMoney(k.schoolMonthly), collegeMonthly: sMoney(k.collegeMonthly),
          independenceAge: sNumR(k.independenceAge, 0, 120, 23)
        };
      });
      nextId = makeIdGenerator();
      // 'joint' or a real earner's id (as a string, matching what the <select> writes);
      // an id that no longer exists (earner removed, or just never existed) falls back to 'joint'.
      const validOwnerIds = out.earners.map(e => String(e.id));

      // Named scenarios (What-if tab): earnerId fields validated against the SAME
      // validOwnerIds list already built above for owner tags — an earner deleted
      // after a scenario was saved must never leave the scenario pointing at a dead id.
      nextId = makeIdGenerator();
      out.scenarios = sArr(res.scenarios, 30).map(x0 => {
        const x = sObj(x0);
        const type = sEnum(x.type, ['lever', 'careerChange', 'sabbatical', 'parentDeath'], 'lever');
        const lever = sObj(x.lever);
        const cc = sObj(x.careerChange);
        const sab = sObj(x.sabbatical);
        const validEarnerId = (v) => (validOwnerIds.includes(String(v))) ? Math.floor(Number(v)) : null;
        return {
          id: nextId(x.id), name: sStr(x.name, 60) || 'Scenario', type,
          lever: {
            extraSavingsPct: sNumR(lever.extraSavingsPct, -100, 100, 0), spendingChangePct: sNumR(lever.spendingChangePct, -100, 100, 0),
            returnDeltaPp: sNumR(lever.returnDeltaPp, -20, 20, 0), lumpSum: sMoney(lever.lumpSum),
            retireAge: Math.round(sNumR(lever.retireAge, 0, 100, 0)), investFreed: sBool(lever.investFreed, true)
          },
          careerChange: type === 'careerChange' ? { earnerId: validEarnerId(cc.earnerId), newGrossMonthly: sMoney(cc.newGrossMonthly) } : null,
          sabbatical: type === 'sabbatical' ? {
            earnerId: validEarnerId(sab.earnerId), startYearOffset: Math.round(sNumR(sab.startYearOffset, 0, 30, 0)),
            // BUGFIX (found while adding the parent-death scenario, not caught at the
            // time of the original fix): the mobile-input fix raised this field's real
            // upper bound to 420 months (35 years, the projection engine's own horizon)
            // everywhere else \u2014 the oninput handler and the calculation-read site \u2014 but
            // this sanitizer, which runs on every page load/reload, still clamped to the
            // OLD 60-month cap. A person's genuine "what if I took 10 years off"
            // (durationMonths: 120) would have silently reverted to 60 the next time
            // they reloaded the app, undoing the very fix meant to let them set it.
            durationMonths: Math.round(sNumR(sab.durationMonths, 1, 420, 6)), incomeDuringPct: Math.round(sNumR(sab.incomeDuringPct, 0, 100, 0))
          } : null,
          parentDeath: type === 'parentDeath' ? { earnerId: validEarnerId(x.parentDeath && x.parentDeath.earnerId) } : null
        };
      });
      const sOwner = (v) => (v === 'joint' || validOwnerIds.includes(String(v))) ? (v === 'joint' ? 'joint' : String(v)) : 'joint';

      out.realEstate = sArr(res.realEstate, 50).map(r0 => {
        const r = sObj(r0);
        return {
          id: nextId(r.id), name: sStr(r.name, 80), currency: itemCurr(r.currency),
          marketValue: sMoney(r.marketValue), mortgageDebt: sMoney(r.mortgageDebt), monthlyRentInflow: sMoney(r.monthlyRentInflow),
          mortgageRatePct: sNumR(r.mortgageRatePct, 0, 300, 0), mortgagePayment: sMoney(r.mortgagePayment),
          mortgageTermYears: sNumR(r.mortgageTermYears, 0, 60, 0), owner: sOwner(r.owner)
        };
      });
      const mp = sObj(res.mortgagePlan), mpId = Math.floor(sNum(mp.propertyId, NaN));
      out.mortgagePlan = {
        propertyId: out.realEstate.some(r => r.id === mpId) ? mpId : null,     // must be a property that exists
        extraMonthly: sMoney(mp.extraMonthly),
        lumpSum: sMoney(mp.lumpSum),
        returnPct: sNumOrNull(mp.returnPct, 0, 60),
        taxPct: sNumR(mp.taxPct, 0, 60, 0),
        horizonYears: Math.round(sNumR(mp.horizonYears, 0, 50, 0))
      };
      nextId = makeIdGenerator();
      out.liquidInvestments = sArr(res.liquidInvestments, 100).map(i0 => {
        const i = sObj(i0);
        const yr = Math.floor(sNumR(i.contributionYear, 1970, 2200, 0));
        return {
          id: nextId(i.id), name: sStr(i.name, 80), currency: itemCurr(i.currency),
          balanceOriginal: sMoney(i.balanceOriginal), annualYieldPct: sNumR(i.annualYieldPct, -100, 1000, 0),
          liquidityTier: sEnum(i.liquidityTier, ['same_day', 'short', 'long'], 'short'),
          volatilityTier: sEnum(i.volatilityTier, ['low', 'medium', 'high'], 'medium'),
          accountType: sEnum(i.accountType, ['none', 'pgbl', 'vgbl', 'pension_plan', 'tax_deferred'], 'none'),
          contributedThisYear: sMoney(i.contributedThisYear), contributionYear: yr > 0 ? yr : null,
          isEmergencyReserve: sBool(i.isEmergencyReserve, false),
          wdTax: sEnum(i.wdTax, ['auto', 'taxable', 'deferred', 'defGains', 'exempt'], 'auto'),
          gainPct: sNumOrNull(i.gainPct, 0, 100), owner: sOwner(i.owner)
        };
      });
      nextId = makeIdGenerator();
      out.goals = sArr(res.goals, 100).map(g0 => {
        const g = sObj(g0);
        const tv = sNumR(g.timeValue, 0, 1200, 12);
        // Per-earner contribution tracking (joint goals only): keys must be real earner ids
        // (same validOwnerIds list as the owner tag above), values are plain amounts. When
        // tracking is on, currentSaved is DERIVED as the sum — never independently trusted
        // from an imported file, so it cannot drift from what the contributions actually add up to.
        const rawContrib = sObj(g.contributions), contributions = {};
        Object.keys(rawContrib).forEach(k => { if (validOwnerIds.includes(String(k))) contributions[k] = sMoney(rawContrib[k]); });
        const trackContributions = sBool(g.trackContributions, false);
        const derivedSaved = Object.values(contributions).reduce((s, v) => s + v, 0);
        return {
          id: nextId(g.id), name: sStr(g.name, 80), targetAmount: sMoney(g.targetAmount),
          currentSaved: trackContributions ? derivedSaved : sMoney(g.currentSaved),
          timeValue: tv > 0 ? tv : 12, timeUnit: sEnum(g.timeUnit, ['months', 'years'], 'months'), owner: sOwner(g.owner),
          trackContributions, contributions
        };
      });

      // Cash Flow, split-household mode: each item's category must be one of the ten
      // real outflow buckets (the same ones state.outflows has), or it can never be
      // summed into anything meaningful. earnerId / customSplits keys are checked
      // against the SAME validOwnerIds list as owner above, for the same reason —
      // a share attributed to a deleted earner should never survive a save/reload.
      const RECURRING_VALID_CATEGORIES = ['housing', 'utilities', 'telecom', 'groceries', 'dining', 'transport', 'cleaning', 'subs', 'elderCare', 'charitableGiving'];
      nextId = makeIdGenerator();
      out.recurringExpenses = sArr(res.recurringExpenses, 200).map(x0 => {
        const x = sObj(x0);
        const splitType = sEnum(x.splitType, ['joint', 'individual', 'custom'], 'joint');
        const earnerId = (splitType === 'individual' && validOwnerIds.includes(String(x.earnerId))) ? Math.floor(Number(x.earnerId)) : null;
        const rawSplits = sObj(x.customSplits);
        const customSplits = {};
        if (splitType === 'custom') {
          Object.keys(rawSplits).forEach(k => { if (validOwnerIds.includes(String(k))) customSplits[k] = sNumR(rawSplits[k], 0, 100, 0); });
        }
        const dueDayNum = Math.round(Number(x.dueDay));
        return {
          id: nextId(x.id), name: sStr(x.name, 80),
          category: sEnum(x.category, RECURRING_VALID_CATEGORIES, 'housing'),
          amount: sMoney(x.amount), splitType, earnerId, customSplits,
          dueDay: (dueDayNum >= 1 && dueDayNum <= 31) ? dueDayNum : null   // null = no due date set (not tracked in the bills/reminders list)
        };
      });

      nextId = makeIdGenerator();
      out.equityGrants = sArr(res.equityGrants, 100).map(q0 => {
        const q = sObj(q0);
        return {
          id: nextId(q.id), name: sStr(q.name, 80), currency: itemCurr(q.currency),
          vestedValue: sMoney(q.vestedValue), unvestedValue: sMoney(q.unvestedValue)
        };
      });
      nextId = makeIdGenerator();
      out.monthlySnapshots = sArr(res.monthlySnapshots, 1000).map(n0 => {
        const n = sObj(n0);
        const date = sStr(n.date, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
        return {
          id: nextId(n.id), date, time: sStr(n.time, 16), label: sStr(n.label, 120),
          netWorth: sNumR(n.netWorth, -SAN_MONEY_MAX, SAN_MONEY_MAX, 0),
          liquidInvestments: sNumR(n.liquidInvestments, -SAN_MONEY_MAX, SAN_MONEY_MAX, 0),
          totalDebts: sNumR(n.totalDebts, -SAN_MONEY_MAX, SAN_MONEY_MAX, 0),
          totalAssets: sNumR(n.totalAssets, -SAN_MONEY_MAX, SAN_MONEY_MAX, 0),
          savingsRate: sNumR(n.savingsRate, -1000, 1000, 0),
          isManual: sBool(n.isManual, false), autoSynced: sBool(n.autoSynced, false)
        };
      }).filter(Boolean);

      out.lastExportedAt = (typeof res.lastExportedAt === 'string' && !isNaN(Date.parse(res.lastExportedAt))) ? res.lastExportedAt.slice(0, 40) : null;
      out.backupBannerDismissed = sBool(res.backupBannerDismissed, false);
      out.nextStepsBannerDismissed = sBool(res.nextStepsBannerDismissed, false);
      out.installHintDismissed = sBool(res.installHintDismissed, false);
      return out;
    }

    // Decides whether a parsed file may be imported and returns the raw state
    // to feed through migrateAndSanitizeState.
    function classifyBackupFile(parsed) {
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { ok: false, reason: 'importErrorBadShape' };
      }
      if (parsed.app !== undefined) {
        if (parsed.app !== APP_EXPORT_ID) return { ok: false, reason: 'importErrorWrongApp' };
        const v = Number(parsed.schemaVersion);
        if (!parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data) || !Number.isFinite(v) || v < 1) {
          return { ok: false, reason: 'importErrorNotBackup' };
        }
        if (v > CURRENT_SCHEMA_VERSION) return { ok: false, reason: 'importErrorTooNew' };
        return { ok: true, raw: parsed.data, legacy: false };
      }
      if (ACCEPT_LEGACY_BACKUPS && typeof parsed.schemaVersion === 'number') {
        const checks = [
          Array.isArray(parsed.earners), Array.isArray(parsed.liquidInvestments), Array.isArray(parsed.children),
          Array.isArray(parsed.goals), Array.isArray(parsed.monthlySnapshots),
          !!parsed.debts && typeof parsed.debts === 'object', !!parsed.outflows && typeof parsed.outflows === 'object',
          typeof parsed.country === 'string'
        ];
        if (checks.filter(Boolean).length >= 5 && parsed.schemaVersion <= CURRENT_SCHEMA_VERSION) {
          return { ok: true, raw: parsed, legacy: true };
        }
      }
      return { ok: false, reason: 'importErrorNotBackup' };
    }

    function buildExportPayload() {
      // state.security (the PIN hash + salt) is deliberately left OUT of every export.
      // A short numeric PIN has a tiny keyspace; shipping its hash+salt in a shared
      // backup file (emailed, uploaded, handed to an accountant) would let anyone with
      // the file brute-force it offline in seconds. The lock is a LOCAL privacy screen
      // for this one browser/device; it has no reason to travel with the data.
      const { security, ...dataWithoutSecurity } = state;
      return {
        app: APP_EXPORT_ID,
        exportFormat: EXPORT_FORMAT_VERSION,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        exportedAt: state.lastExportedAt || new Date().toISOString(),
        data: dataWithoutSecurity
      };
    }

    function migrateAndSanitizeState(raw) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE));
      }
      raw = safeClone(raw);
      // Portugal is no longer a dedicated fiscal residence. Saved Portuguese
      // profiles become "Global" and keep their numbers: employees' take-home
      // pay is preserved by converting the old Portuguese formula into an
      // equivalent effective rate.
      if (raw.country === 'PT') {
        raw.country = 'GL';
        if (typeof raw.ptRentalTaxRatePct === 'number' && typeof raw.glRentalTaxRatePct !== 'number') raw.glRentalTaxRatePct = raw.ptRentalTaxRatePct;
        if (Array.isArray(raw.earners)) {
          raw.earners.forEach(e => {
            if (!e || typeof e !== 'object') return;
            if (e.regime === 'Trabalhador por Conta de Outrem') {
              const g = Number(e.grossMonthly) || 0;
              e.regime = 'Employee';
              e.pjTaxRate = g > 0 ? Math.round(((g * 0.11 + legacyPortugalIRS(g)) / g) * 1000) / 10 : 25;
            } else if (e.regime === 'Trabalhador Independente') {
              e.regime = 'Self-employed';
            }
          });
        }
        if (Array.isArray(raw.liquidInvestments)) {
          raw.liquidInvestments.forEach(i => { if (i && i.accountType === 'ppr') i.accountType = 'tax_deferred'; });
        }
      }
      const cloned = JSON.parse(JSON.stringify(DEFAULT_BLANK_STATE));
      const res = Object.assign({}, cloned, raw);
      // A file that doesn't state these gets the COUNTRY's default (in sanitizeState),
      // not the blank Brazilian profile's.
      if (raw.baseCurrency === undefined) delete res.baseCurrency;
      if (raw.inflationRate === undefined) delete res.inflationRate;

      res.safetyBufferPct = typeof raw.safetyBufferPct === 'number' ? raw.safetyBufferPct : 15.0;

      // New fields (interest rates on debts, insurance/protection, government
      // pension estimate, estate settings) — merge onto the blank-state
      // defaults rather than requiring them, so an old saved profile that
      // predates these gets sensible starting values instead of undefined.
      res.debts = Object.assign({}, cloned.debts, raw.debts || {});
      res.outflows = Object.assign({}, cloned.outflows, raw.outflows || {});
      res.insurance = Object.assign({}, cloned.insurance, raw.insurance || {});
      res.expectedMonthlyGovPension = Number(raw.expectedMonthlyGovPension) || 0;
      res.estateSettings = Object.assign({}, cloned.estateSettings, raw.estateSettings || {});
      // Saved profiles that already have a language keep it: treat it as chosen so
      // a later country change never overrides it.
      res.languageUserChosen = (typeof raw.languageUserChosen === 'boolean') ? raw.languageUserChosen : Boolean(raw.language);
      res.creditScore = (typeof raw.creditScore === 'number') ? raw.creditScore : null;
      res.healthcareInflationRate = (typeof raw.healthcareInflationRate === 'number') ? raw.healthcareInflationRate : null;
      res.traditionalRetirementAge = (typeof raw.traditionalRetirementAge === 'number' && raw.traditionalRetirementAge > 0) ? raw.traditionalRetirementAge : 65;
      res.brExtraDependents = Math.max(0, Math.floor(Number(raw.brExtraDependents) || 0));
      res.esRentalReductionPct = [50, 60, 70, 90].includes(Number(raw.esRentalReductionPct)) ? Number(raw.esRentalReductionPct) : 50;
      res.scoreIncludeHedge = Boolean(raw.scoreIncludeHedge);
      res.equityGrants = Array.isArray(raw.equityGrants) ? raw.equityGrants.map(g => ({
        id: g.id || (Date.now() + Math.floor(Math.random() * 1000)),
        name: g.name || '',
        currency: g.currency || res.baseCurrency || 'BRL',
        vestedValue: Number(g.vestedValue) || 0,
        unvestedValue: Number(g.unvestedValue) || 0
      })) : [];
      res.careerGrowthRate = typeof raw.careerGrowthRate === 'number' ? raw.careerGrowthRate : 2.0;
      // Default true (proportional): the household is assumed to invest a
      // constant share of income, so contributions grow along with career
      // growth. An existing saved state that predates this feature gets this
      // same default rather than silently landing on the flat-contribution
      // behavior it never had a chance to opt into.
      res.careerGrowthProportional = typeof raw.careerGrowthProportional === 'boolean' ? raw.careerGrowthProportional : true;
      res.lastExportedAt = raw.lastExportedAt || null;
      res.backupBannerDismissed = Boolean(raw.backupBannerDismissed);
      res.nextStepsBannerDismissed = Boolean(raw.nextStepsBannerDismissed);
      res.budgetTargets = Object.assign({}, cloned.budgetTargets, raw.budgetTargets || {});
      res.fxRates = Object.assign({}, cloned.fxRates, raw.fxRates || {});
      // Older saved states won't have fxRatesBaseCurrency. Since we can't know for
      // certain which base those legacy rates were built for, treat them as
      // untrustworthy and force a clean re-derivation on next currency sync rather
      // than risk silently mismatched rates.
      res.fxRatesBaseCurrency = typeof raw.fxRatesBaseCurrency === 'string' ? raw.fxRatesBaseCurrency : null;

      // One-time migration (schemaVersion < 3): inflation used to default to a
      // flat 4.5% for every jurisdiction, which overstated it for Eurozone (ES/PT)
      // households. 4.5% was never a real user choice under the old code — it was
      // the only value the old code could ever produce by default — so for any
      // pre-migration non-BR state still sitting at exactly 4.5%, we correct it to
      // that jurisdiction's proper default. A genuinely custom rate the user typed
      // in (anything other than 4.5%) is left untouched.
      if ((Number(raw.schemaVersion) || 0) < 3 && res.country !== 'BR' && Number(res.inflationRate) === 4.5) {
        res.inflationRate = getDefaultInflation(res.country);
      }
      res.schemaVersion = 3;

      if (!Array.isArray(res.earners)) res.earners = cloned.earners;
      // PJ company type + assumed pro-labore (Brazil). Existing PJ members keep
      // their rate untouched ('custom'); pro-labore keeps the 28% assumption.
      res.earners = res.earners.map(e => ({
        ...e,
        pjCompanyType: e.pjCompanyType || 'custom',
        proLaborePct: (typeof e.proLaborePct === 'number') ? e.proLaborePct : 28
      }));
      if (!Array.isArray(res.realEstate)) res.realEstate = cloned.realEstate;
      // BUGFIX: real estate items never had a currency field before, so every
      // property was silently treated as if it were in the base currency. For
      // anything saved before this fix, that assumption becomes explicit here
      // (rather than a mysterious blank field) — the family's numbers are
      // unchanged either way, but a genuinely foreign property can now be
      // corrected by picking its real currency from the new dropdown.
      res.realEstate = res.realEstate.map(r => ({
        ...r,
        currency: r.currency || res.baseCurrency || 'BRL'
      }));
      if (!Array.isArray(res.liquidInvestments)) res.liquidInvestments = cloned.liquidInvestments;
      // NEW RULE: emergency reserve now requires same-day/next-day liquidity
      // AND low volatility. Items saved before this rule existed have no
      // liquidityTier/volatilityTier at all. Anything already flagged
      // isEmergencyReserve is grandfathered in with qualifying values (the
      // user already made that call under the old rules); anything not
      // flagged gets a neutral, non-qualifying default so the new rule is
      // actually enforced the next time someone tries to flag it.
      res.liquidInvestments = res.liquidInvestments.map(item => {
        if (item.liquidityTier && item.volatilityTier) return item;
        if (item.isEmergencyReserve) {
          return { ...item, liquidityTier: item.liquidityTier || 'same_day', volatilityTier: item.volatilityTier || 'low' };
        }
        return { ...item, liquidityTier: item.liquidityTier || 'short', volatilityTier: item.volatilityTier || 'medium' };
      });
      // Tax-advantaged retirement account tracking (PGBL/VGBL, Planes de
      // Pensiones, PPR): previously these were only discussed in the Tax
      // Planning tab as a hypothetical deduction opportunity — there was no
      // way to actually mark a held investment as one of these accounts, so
      // the tab could never show real progress, only "what if." Existing
      // items default to 'none' (a standard taxable/liquid holding).
      res.liquidInvestments = res.liquidInvestments.map(item => ({
        ...item,
        accountType: item.accountType || 'none',
        contributedThisYear: Number(item.contributedThisYear) || 0,
        contributionYear: item.contributionYear || null
      }));
      if (!Array.isArray(res.children)) res.children = cloned.children;
      if (!Array.isArray(res.goals)) res.goals = cloned.goals;
      // Goals moved from a manually-typed "monthlyAlloc" to an auto-calculated
      // contribution derived from (target - saved) / time-to-goal. Any goal that
      // doesn't already have a valid timeValue (i.e. saved before this change)
      // gets one back-derived from its old monthlyAlloc, so the transition is
      // seamless rather than resetting everyone's goals to a default timeline.
      res.goals = res.goals.map(g => {
        const targetAmount = Number(g.targetAmount) || 0;
        const currentSaved = Number(g.currentSaved) || 0;
        let timeValue = Number(g.timeValue);
        let timeUnit = g.timeUnit === 'years' ? 'years' : 'months';
        if (!(timeValue > 0)) {
          const remaining = Math.max(0, targetAmount - currentSaved);
          const oldMonthlyAlloc = Number(g.monthlyAlloc) || 0;
          timeValue = (oldMonthlyAlloc > 0 && remaining > 0)
            ? Math.max(1, Math.round(remaining / oldMonthlyAlloc))
            : 12;
          timeUnit = 'months';
        }
        return {
          ...g,   // BUGFIX: this used to build a brand-new object with only these six fields,
                  // silently dropping anything added to a goal since (found: it was discarding
                  // the "owner" tag on every import/reload before it ever reached the sanitizer's
                  // own owner validation, which never saw a value to validate).
          id: g.id || Date.now() + Math.floor(Math.random() * 1000),
          name: g.name || (I18N[res.language] || I18N.en).goalFallbackName,
          targetAmount,
          currentSaved,
          timeValue,
          timeUnit
        };
      });
      if (!Array.isArray(res.monthlySnapshots)) res.monthlySnapshots = cloned.monthlySnapshots;

      return sanitizeState(res);
    }

