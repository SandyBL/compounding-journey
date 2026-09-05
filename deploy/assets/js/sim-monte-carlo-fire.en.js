/* =================================================================
       GLOBAL STATE & CONFIGURATION
       ================================================================= */
    const LEADERBOARD_SIMULATOR = 'monte-carlo-fire';

    /* The five scenario presets, as the keys their boards are addressed by.
       The board is one table shared by the English, Spanish and Portuguese
       pages, so what identifies a preset cannot be its name: "High Risk SWR"
       is "SWR de Alto Risco" on /pt/, and keying a board on the label would
       have split one ranking into three that could not see each other. The
       key is what travels; the label is looked up for display. */
    const PRESET_KEYS = ['highrisk', 'trinity', 'leanfire', 'fatfire', 'custom'];

    const PRESET_LABELS = {
      highrisk: 'High Risk SWR',
      trinity: 'Trinity Standard',
      leanfire: 'Tight Lean FIRE',
      fatfire: 'Fat FIRE',
      custom: 'Custom Scenario'
    };

    /* What the category badge in the board is drawn from - the same five keys,
       and the classes the badge used to repeat once per language. */
    const PRESET_BADGES = {
      highrisk: { classes: 'bg-red-50 text-red-300 border border-red-200', icon: 'fa-fire text-red-400' },
      trinity: { classes: 'bg-cyan-50 text-cyan-300 border border-cyan-200', icon: 'fa-shield-halved text-cyan-400' },
      leanfire: { classes: 'bg-emerald-50 text-emerald-300 border border-emerald-200', icon: 'fa-leaf text-emerald-400' },
      fatfire: { classes: 'bg-purple-50 text-purple-300 border border-purple-200', icon: 'fa-crown text-purple-400' },
      custom: { classes: 'bg-cream-200 text-espresso-900 border border-cream-400', icon: 'fa-sliders' }
    };

    /* The board as last read from /api/simulator-leaderboard, and which of
       three things the table is showing: the rows, the fact that they are on
       their way, or the fact that they could not be fetched. An empty board
       and an unreachable one are the same list of no rows, and only one of
       them means nobody has flown this preset yet. */
    let leaderboardEntries = [];
    let leaderboardState = 'loading';
    let activeLeaderboardFilter = 'ALL';

    /* Which read is the current one. Clicking along the category filters
       starts a request per click and they can land out of order, so a
       response that is no longer the newest is dropped instead of drawn. */
    let leaderboardRequest = 0;

    const state = {
      pilotName: 'Captain FIRE',
      activePresetKey: 'highrisk',
      // Flight setup
      nestEgg: 850000,
      annualSpending: 45000,
      startAge: 50,
      targetAge: 100,
      
      // Allocation
      pctStocks: 80,
      pctBonds: 15,
      pctCash: 5,
      useTargetDateFund: false,

      // 6 Mid-flight tactics
      actJob: false,
      actCutSpend: false,
      actCashBuffer: false,
      actGuardrails: false,
      actDownsize: false,
      actPension: false,

      // Live simulation telemetry
      isSimulating: false,
      currentAge: 50,
      currentNestEgg: 850000,
      peakNestEgg: 850000,
      yearsInCrashlineConsecutive: 0,
      totalCrashlineYears: 0,
      totalTacticYears: 0,
      marketSequence: 'simulated',
      simulationInterval: null,
      historyLogs: []
    };

    // Calibration for market benchmarks
    const MARKET_BENCHMARKS = {
      stocks: { mean: 0.082, stdDev: 0.24 }, // Higher equity dispersion & volatility drag
      bonds: { mean: 0.035, stdDev: 0.06 },  // Bond yield
      cash: { mean: 0.015, stdDev: 0.01 },   // Cash yield
      inflation: { mean: 0.035, stdDev: 0.025 } // CPI inflation
    };

    // Historical crash sequences
    const PRESET_HISTORICAL_SEQUENCES = {
      '1970s': [
        { stock: -0.18, bond: -0.03, infl: 0.07 },
        { stock: -0.28, bond: 0.01, infl: 0.12 },
        { stock: 0.35, bond: 0.07, infl: 0.09 },
        { stock: 0.20, bond: 0.09, infl: 0.07 },
        { stock: -0.12, bond: -0.02, infl: 0.14 },
        { stock: 0.16, bond: 0.04, infl: 0.11 }
      ],
      '2000s': [
        { stock: -0.12, bond: 0.10, infl: 0.03 },
        { stock: -0.15, bond: 0.08, infl: 0.02 },
        { stock: -0.25, bond: 0.09, infl: 0.01 },
        { stock: 0.26, bond: 0.02, infl: 0.02 },
        { stock: 0.08, bond: 0.04, infl: 0.03 },
        { stock: -0.40, bond: 0.18, infl: 0.00 } // 2008 Crash
      ],
      'bull': [
        { stock: 0.16, bond: 0.04, infl: 0.02 },
        { stock: 0.19, bond: 0.03, infl: 0.02 },
        { stock: 0.14, bond: 0.05, infl: 0.02 },
        { stock: 0.24, bond: 0.02, infl: 0.02 },
        { stock: 0.15, bond: 0.04, infl: 0.02 }
      ]
    };

    /* =================================================================
       INITIALIZATION & UI CONTROLS
       ================================================================= */
    window.onload = function() {
      updatePilotName();
      updateControlsUI();
      loadLeaderboard();
      renderCanvas();
    };

    window.addEventListener('resize', renderCanvas);

    function updatePilotName() {
      const el = document.getElementById('input-pilot-name');
      if (el && el.value.trim() !== '') {
        state.pilotName = el.value.trim();
      }
    }

    function checkAndDetectPresetCategory() {
      if (state.nestEgg === 850000 && state.annualSpending === 45000) {
        state.activePresetKey = 'highrisk';
      } else if (state.nestEgg === 1000000 && state.annualSpending === 40000) {
        state.activePresetKey = 'trinity';
      } else if (state.nestEgg === 650000 && state.annualSpending === 35000) {
        state.activePresetKey = 'leanfire';
      } else if (state.nestEgg === 1500000 && state.annualSpending === 75000) {
        state.activePresetKey = 'fatfire';
      } else {
        state.activePresetKey = 'custom';
      }
    }

    function updateControlsUI() {
      const nestEggEl = document.getElementById('input-nestegg');
      const spendingEl = document.getElementById('input-spending');
      const startAgeEl = document.getElementById('input-startage');
      const endAgeEl = document.getElementById('input-endage');

      if (nestEggEl) state.nestEgg = parseFloat(nestEggEl.value) || 850000;
      if (spendingEl) state.annualSpending = parseFloat(spendingEl.value) || 45000;
      if (startAgeEl) state.startAge = parseInt(startAgeEl.value) || 50;
      if (endAgeEl) state.targetAge = parseInt(endAgeEl.value) || 100;

      // Auto-detect if current parameters match a preset or represent a custom scenario
      checkAndDetectPresetCategory();

      const seqEl = document.getElementById('select-market-sequence');
      if (seqEl) state.marketSequence = seqEl.value;

      // Update text displays safely
      const dispEgg = document.getElementById('disp-nestegg');
      if (dispEgg) dispEgg.innerText = '$' + state.nestEgg.toLocaleString();
      if (nestEggEl) nestEggEl.setAttribute('aria-valuetext', '$' + state.nestEgg.toLocaleString());

      const dispSpend = document.getElementById('disp-spending');
      if (dispSpend) dispSpend.innerText = '$' + state.annualSpending.toLocaleString();
      if (spendingEl) spendingEl.setAttribute('aria-valuetext', '$' + state.annualSpending.toLocaleString());

      const swrVal = (state.annualSpending / state.nestEgg) * 100;
      const swrStr = swrVal.toFixed(1) + '%';
      
      const badgeSwr = document.getElementById('disp-swr-badge');
      if (badgeSwr) {
        if (swrVal > 4.5) {
          badgeSwr.innerText = `${swrStr} (HIGH RISK)`;
          badgeSwr.className = 'font-mono px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-400 border border-red-200 animate-pulse';
        } else if (swrVal > 3.8) {
          badgeSwr.innerText = `${swrStr} (MODERATE RISK)`;
          badgeSwr.className = 'font-mono px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-400 border border-amber-200';
        } else {
          badgeSwr.innerText = `${swrStr} (SAFE SWR)`;
          badgeSwr.className = 'font-mono px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-400 border border-emerald-200';
        }
      }

      if (!state.isSimulating) {
        state.currentAge = state.startAge;
        state.currentNestEgg = state.nestEgg;
        state.peakNestEgg = state.nestEgg;

        const hudAge = document.getElementById('hud-current-age');
        if (hudAge) hudAge.innerText = state.currentAge;

        const hudVal = document.getElementById('hud-portfolio-val');
        if (hudVal) hudVal.innerText = '$' + state.currentNestEgg.toLocaleString();

        const hudSwr = document.getElementById('hud-current-swr');
        if (hudSwr) hudSwr.innerText = swrStr;

        const crashCounter = document.getElementById('hud-crashline-counter');
        if (crashCounter) {
          crashCounter.innerText = `${state.yearsInCrashlineConsecutive} / 10 Yrs`;
          crashCounter.className = 'text-emerald-400 font-bold text-sm';
        }
      }

      if (state.useTargetDateFund) {
        updateTargetDateGlidepath(state.currentAge);
      }

      renderCanvas();
    }

    function loadPreset(type) {
      playSound('click');
      if (type === 'highrisk') {
        state.activePresetKey = 'highrisk';
        setControlValues(850000, 45000, 50, 100, 80, 15, 5);
      } else if (type === 'trinity') {
        state.activePresetKey = 'trinity';
        setControlValues(1000000, 40000, 50, 100, 70, 20, 10);
      } else if (type === 'leanfire') {
        state.activePresetKey = 'leanfire';
        setControlValues(650000, 35000, 50, 100, 85, 10, 5);
      } else if (type === 'fatfire') {
        state.activePresetKey = 'fatfire';
        setControlValues(1500000, 75000, 50, 100, 75, 20, 5);
      }
    }

    function setControlValues(egg, spend, start, end, stocks, bonds, cash) {
      document.getElementById('input-nestegg').value = egg;
      document.getElementById('input-spending').value = spend;
      document.getElementById('input-startage').value = start;
      document.getElementById('input-endage').value = end;

      state.pctStocks = stocks;
      state.pctBonds = bonds;
      state.pctCash = cash;

      document.getElementById('input-stocks').value = stocks;
      document.getElementById('input-bonds').value = bonds;
      document.getElementById('input-cash').value = cash;

      document.getElementById('disp-pct-stocks').innerText = stocks + '%';
      document.getElementById('disp-pct-bonds').innerText = bonds + '%';
      document.getElementById('disp-pct-cash').innerText = cash + '%';

      updateControlsUI();
    }

    /* =================================================================
       ASSET ALLOCATION & TARGET DATE FUND
       ================================================================= */
    function adjustAssetAllocation(changed) {
      if (state.useTargetDateFund) return;

      let s = parseInt(document.getElementById('input-stocks').value) || 0;
      let b = parseInt(document.getElementById('input-bonds').value) || 0;
      let c = parseInt(document.getElementById('input-cash').value) || 0;

      if (changed === 'stocks') {
        let rem = 100 - s;
        b = Math.round(rem * 0.7);
        c = rem - b;
      } else if (changed === 'bonds') {
        let rem = 100 - b;
        s = Math.round(rem * 0.8);
        c = rem - s;
      } else {
        let rem = 100 - c;
        s = Math.round(rem * 0.75);
        b = rem - s;
      }

      state.pctStocks = s;
      state.pctBonds = b;
      state.pctCash = c;

      document.getElementById('input-stocks').value = s;
      document.getElementById('input-bonds').value = b;
      document.getElementById('input-cash').value = c;

      document.getElementById('disp-pct-stocks').innerText = s + '%';
      document.getElementById('disp-pct-bonds').innerText = b + '%';
      document.getElementById('disp-pct-cash').innerText = c + '%';

      // A range input announces its raw value, so an allocation slider read
      // out as "80" rather than "80 percent".
      document.getElementById('input-stocks').setAttribute('aria-valuetext', s + '%');
      document.getElementById('input-bonds').setAttribute('aria-valuetext', b + '%');
      document.getElementById('input-cash').setAttribute('aria-valuetext', c + '%');
    }

    function toggleTargetDateFund() {
      const toggle = document.getElementById('toggle-tdf');
      state.useTargetDateFund = toggle.checked;

      const slidersBox = document.getElementById('allocation-sliders-container');
      const tdfCard = document.getElementById('tdf-glidepath-card');

      if (state.useTargetDateFund) {
        if (slidersBox) slidersBox.classList.add('opacity-40', 'pointer-events-none');
        if (tdfCard) tdfCard.classList.remove('hidden');
        updateTargetDateGlidepath(state.currentAge);
      } else {
        if (slidersBox) slidersBox.classList.remove('opacity-40', 'pointer-events-none');
        if (tdfCard) tdfCard.classList.add('hidden');
      }
      playSound('click');
    }

    function updateTargetDateGlidepath(age) {
      let stocks = Math.max(20, Math.min(90, 110 - age));
      let bonds = Math.max(10, Math.min(70, age - 20));
      let cash = 100 - (stocks + bonds);
      if (cash < 5) {
        cash = 5;
        bonds = 100 - stocks - cash;
      }

      state.pctStocks = stocks;
      state.pctBonds = bonds;
      state.pctCash = cash;

      const barS = document.getElementById('tdf-bar-stocks');
      const barB = document.getElementById('tdf-bar-bonds');
      const barC = document.getElementById('tdf-bar-cash');

      if (barS) barS.style.width = stocks + '%';
      if (barB) barB.style.width = bonds + '%';
      if (barC) barC.style.width = cash + '%';

      const tdfText = document.getElementById('tdf-status-text');
      if (tdfText) tdfText.innerText = `Age ${age}: ${stocks}% Stocks / ${bonds}% Bonds / ${cash}% Cash`;
    }

    /* =================================================================
       MID-FLIGHT 6 TACTICAL ADJUSTMENTS
       ================================================================= */
    function toggleAction(action) {
      playSound('click');
      if (action === 'job') {
        state.actJob = !state.actJob;
        updateActionCardUI('job', state.actJob, 'border-cyan-500');
      } else if (action === 'cutspend') {
        state.actCutSpend = !state.actCutSpend;
        updateActionCardUI('cutspend', state.actCutSpend, 'border-amber-500');
      } else if (action === 'cashbuffer') {
        state.actCashBuffer = !state.actCashBuffer;
        updateActionCardUI('cashbuffer', state.actCashBuffer, 'border-emerald-500');
      } else if (action === 'guardrails') {
        state.actGuardrails = !state.actGuardrails;
        updateActionCardUI('guardrails', state.actGuardrails, 'border-purple-500');
      } else if (action === 'downsize') {
        state.actDownsize = !state.actDownsize;
        updateActionCardUI('downsize', state.actDownsize, 'border-blue-500');
        if (state.actDownsize && state.isSimulating) {
          state.currentNestEgg += 100000; // Instant emergency lump-sum injection
          showCopilotBanner(
            '🏠 REAL ESTATE DOWNSIZING INJECTION',
            'You injected +$100,000 emergency fuel from downsizing your home into your retirement portfolio!',
            '💡 Tip: Real estate equity acts as a powerful last-resort longevity buffer.',
            'info'
          );
        }
      } else if (action === 'pension') {
        state.actPension = !state.actPension;
        updateActionCardUI('pension', state.actPension, 'border-pink-500');
      }
      renderCanvas();
    }

    function updateActionCardUI(key, isActive, borderClass) {
      const card = document.getElementById('card-action-' + key);
      const badge = document.getElementById('badge-action-' + key);
      const check = document.getElementById('check-action-' + key);

      if (!card || !badge) return;

      if (isActive) {
        card.classList.add('is-active', borderClass);
        badge.innerText = 'ACTIVE';
        badge.className = 'text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-300 border border-cyan-200 font-bold';
        if (check) check.checked = true;
      } else {
        card.classList.remove('is-active', borderClass);
        badge.innerText = 'INACTIVE';
        badge.className = 'text-[9px] font-mono px-2 py-0.5 rounded bg-cream-200 text-espresso-800 border border-cream-400';
        if (check) check.checked = false;
      }
    }

    /* =================================================================
       SIMULATION ENGINE (STEP BY STEP FLIGHT & CRASHLINE LOGIC)
       ================================================================= */
    function toggleFlightSimulation() {
      if (state.isSimulating) {
        pauseFlightSimulation();
      } else {
        startFlightSimulation();
      }
    }

    function startFlightSimulation() {
      if (state.currentAge >= state.targetAge || state.yearsInCrashlineConsecutive >= 10) {
        resetFlightSimulation();
      }

      state.isSimulating = true;
      playSound('engine');

      const launchBtnText = document.getElementById('btn-launch-text');
      if (launchBtnText) launchBtnText.innerText = 'PAUSE FLIGHT';

      const badge = document.getElementById('hud-flight-status-badge');
      if (badge) {
        badge.innerText = '✈️ IN FLIGHT (AIRBORNE)';
        badge.className = 'px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-cyan-50 text-cyan-400 border border-cyan-200 animate-pulse';
      }

      state.simulationInterval = setInterval(simulateOneYearStep, 800);
    }

    function pauseFlightSimulation() {
      state.isSimulating = false;
      if (state.simulationInterval) clearInterval(state.simulationInterval);

      const launchBtnText = document.getElementById('btn-launch-text');
      if (launchBtnText) launchBtnText.innerText = 'RESUME FLIGHT';

      const badge = document.getElementById('hud-flight-status-badge');
      if (badge) {
        badge.innerText = '⏸️ FLIGHT PAUSED';
        badge.className = 'px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-amber-50 text-amber-400 border border-amber-200';
      }
    }

    function resetFlightSimulation() {
      pauseFlightSimulation();
      state.currentAge = state.startAge;
      state.currentNestEgg = state.nestEgg;
      state.peakNestEgg = state.nestEgg;
      state.yearsInCrashlineConsecutive = 0;
      state.totalCrashlineYears = 0;
      state.totalTacticYears = 0;
      state.historyLogs = [];

      hideCopilotBanner();

      const container = document.getElementById('hud-visual-container');
      if (container) container.classList.remove('crash-warning');

      const launchBtnText = document.getElementById('btn-launch-text');
      if (launchBtnText) launchBtnText.innerText = 'LAUNCH FLIGHT';

      const badge = document.getElementById('hud-flight-status-badge');
      if (badge) {
        badge.innerText = 'Ready On Tarmac';
        badge.className = 'px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-emerald-50 text-emerald-400 border border-emerald-200';
      }

      updateControlsUI();
      playSound('click');
    }

    function simulateOneYearStep() {
      if (state.currentAge >= state.targetAge || state.yearsInCrashlineConsecutive >= 10) {
        finishFlightSimulation();
        return;
      }

      state.currentAge++;

      // Track active tactics penalty (1 Tactic-Year per active tactic per year)
      let activeTacticsThisYear = 0;
      if (state.actJob) activeTacticsThisYear++;
      if (state.actCutSpend) activeTacticsThisYear++;
      if (state.actCashBuffer) activeTacticsThisYear++;
      if (state.actGuardrails) activeTacticsThisYear++;
      if (state.actDownsize) activeTacticsThisYear++;
      if (state.actPension) activeTacticsThisYear++;
      state.totalTacticYears += activeTacticsThisYear;

      if (state.useTargetDateFund) {
        updateTargetDateGlidepath(state.currentAge);
      }

      // Calculate annual living spending
      let effectiveSpend = state.annualSpending;

      // Apply mid-flight tactical adjustments
      if (state.actJob) {
        effectiveSpend = Math.max(0, effectiveSpend - 15000);
      }
      if (state.actCutSpend) {
        effectiveSpend = effectiveSpend * 0.85;
      }
      if (state.actPension && state.currentAge >= 62) {
        effectiveSpend = Math.max(0, effectiveSpend - 20000);
      }

      // Generate annual market returns with Sequence of Returns Risk (SORR) stress testing
      let stockRet = 0, bondRet = 0, infl = 0;

      if (state.marketSequence !== 'simulated' && PRESET_HISTORICAL_SEQUENCES[state.marketSequence]) {
        const seq = PRESET_HISTORICAL_SEQUENCES[state.marketSequence];
        const stepIdx = (state.currentAge - state.startAge - 1) % seq.length;
        stockRet = seq[stepIdx].stock;
        bondRet = seq[stepIdx].bond;
        infl = seq[stepIdx].infl;
      } else {
        stockRet = randomGaussian(MARKET_BENCHMARKS.stocks.mean, MARKET_BENCHMARKS.stocks.stdDev);
        bondRet = randomGaussian(MARKET_BENCHMARKS.bonds.mean, MARKET_BENCHMARKS.bonds.stdDev);
        infl = randomGaussian(MARKET_BENCHMARKS.inflation.mean, MARKET_BENCHMARKS.inflation.stdDev);

        // Inject periodic bear market shocks during early retirement decades (Ages 50 - 65)
        const yearsElapsed = state.currentAge - state.startAge;
        if (yearsElapsed <= 15 && (yearsElapsed % 5 === 2 || yearsElapsed === 3)) {
          stockRet -= 0.18; // -18% market shock to enforce early SORR vulnerability
        }
      }

      // Apply Dynamic Guardrails rule
      if (state.actGuardrails && stockRet < -0.15) {
        effectiveSpend = effectiveSpend * 0.90;
      }

      // Adjust spending for inflation
      effectiveSpend = effectiveSpend * (1 + Math.max(0, infl));

      // Weighted portfolio return
      let weightedReturn = (stockRet * (state.pctStocks / 100)) + 
                         (bondRet * (state.pctBonds / 100)) + 
                         (MARKET_BENCHMARKS.cash.mean * (state.pctCash / 100));

      // Cash Buffer tactic protects stock liquidation in down years
      if (state.actCashBuffer && stockRet < 0) {
        weightedReturn += 0.035;
      }

      // Calculate ending balance
      let startBal = state.currentNestEgg;
      let afterSpend = startBal - effectiveSpend;
      let endBal = afterSpend * (1 + weightedReturn);

      state.currentNestEgg = Math.round(endBal);
      if (state.currentNestEgg > state.peakNestEgg) {
        state.peakNestEgg = state.currentNestEgg;
      }

      // Crashline Check ($0 or below)
      const container = document.getElementById('hud-visual-container');
      if (state.currentNestEgg <= 0) {
        state.yearsInCrashlineConsecutive++;
        state.totalCrashlineYears++;
        if (container) container.classList.add('crash-warning');

        showCopilotBanner(
          '🚨 CRASHLINE EMERGENCY: PORTFOLIO STALL',
          `Your net worth hit $0 at Age ${state.currentAge}! You have ${10 - state.yearsInCrashlineConsecutive} year(s) remaining in the crashline before game over. Activate side income, downsizing, or spending cuts to bounce back!`,
          '💡 Tip: Turn on Part-Time Income, Real Estate Downsizing, or Cut Spending to climb out of $0 bankruptcy.',
          'danger'
        );
        playSound('alert');
      } else {
        state.yearsInCrashlineConsecutive = 0; // Reset consecutive counter if balance climbs back > $0
        if (container) container.classList.remove('crash-warning');
      }

      // Record log entry
      state.historyLogs.push({
        age: state.currentAge,
        startBal: startBal,
        spend: effectiveSpend,
        returnPct: weightedReturn,
        endBal: state.currentNestEgg,
        inCrashline: state.currentNestEgg <= 0
      });

      // Update Telemetry Displays
      const hudAge = document.getElementById('hud-current-age');
      if (hudAge) hudAge.innerText = state.currentAge;

      const hudVal = document.getElementById('hud-portfolio-val');
      if (hudVal) hudVal.innerText = '$' + state.currentNestEgg.toLocaleString();

      const curSwr = ((effectiveSpend / Math.max(1, state.currentNestEgg)) * 100).toFixed(1);
      const hudSwr = document.getElementById('hud-current-swr');
      if (hudSwr) hudSwr.innerText = state.currentNestEgg > 0 ? curSwr + '%' : 'CRASH';

      const crashCounter = document.getElementById('hud-crashline-counter');
      if (crashCounter) {
        crashCounter.innerText = `${state.yearsInCrashlineConsecutive} / 10 Yrs`;
        if (state.yearsInCrashlineConsecutive > 0) {
          crashCounter.className = 'text-red-400 font-bold text-sm animate-pulse';
        } else {
          crashCounter.className = 'text-emerald-400 font-bold text-sm';
        }
      }

      checkCopilotEvents(stockRet, infl);

      renderCanvas();

      // Check if player failed 10-year crashline limit
      if (state.yearsInCrashlineConsecutive >= 10) {
        finishFlightSimulation();
      }
    }

    function checkCopilotEvents(stockRet, infl) {
      if (state.currentNestEgg > 0) {
        if (stockRet < -0.15) {
          showCopilotBanner(
            '🚨 MARKET DROP: SEQUENCE OF RETURNS RISK',
            `Equities dropped ${(stockRet * 100).toFixed(1)}% at Age ${state.currentAge}. High stock exposure during bear markets causes steep drawdowns!`,
            '💡 Tip: Rebalance into bonds or activate "Cash Bucket Shield" and "Side Income".',
            'warning'
          );
        } else if (infl > 0.05) {
          showCopilotBanner(
            '🔥 INFLATION SURGE SHOCK',
            `Inflation jumped to ${(infl * 100).toFixed(1)}%, driving up living costs.`,
            '💡 Tip: Keep some equity growth in your portfolio long-term to outpace inflation.',
            'warning'
          );
        }
      }
    }

    function showCopilotBanner(title, msg, tip, type) {
      const banner = document.getElementById('copilot-banner');
      const titleEl = document.getElementById('copilot-title');
      const msgEl = document.getElementById('copilot-message');
      const tipEl = document.getElementById('copilot-tip');
      const icon = document.getElementById('copilot-icon');

      if (!banner || !titleEl || !msgEl || !tipEl) return;

      titleEl.innerText = title;
      msgEl.innerText = msg;
      tipEl.innerText = tip;

      if (type === 'danger') {
        banner.className = 'absolute top-3 left-3 right-3 p-3.5 rounded-xl bg-cream-50 border border-red-300 text-xs backdrop-blur-md transition-all duration-300 flex items-start gap-3 border-l-4 border-l-red-500';
        if (icon) icon.className = 'fa-solid fa-triangle-exclamation text-red-400';
      } else if (type === 'warning') {
        banner.className = 'absolute top-3 left-3 right-3 p-3.5 rounded-xl bg-cream-50 border border-amber-300 text-xs backdrop-blur-md transition-all duration-300 flex items-start gap-3 border-l-4 border-l-amber-500';
        if (icon) icon.className = 'fa-solid fa-fire text-amber-400';
      } else {
        banner.className = 'absolute top-3 left-3 right-3 p-3.5 rounded-xl bg-cream-50 border border-cyan-300 text-xs backdrop-blur-md transition-all duration-300 flex items-start gap-3 border-l-4 border-l-cyan-500';
        if (icon) icon.className = 'fa-solid fa-circle-info text-cyan-400';
      }

      banner.classList.remove('hidden');
    }

    function hideCopilotBanner() {
      const banner = document.getElementById('copilot-banner');
      if (banner) banner.classList.add('hidden');
    }

    function finishFlightSimulation() {
      pauseFlightSimulation();

      const modal = document.getElementById('modal-flight-debrief');
      const title = document.getElementById('debrief-title');
      const msg = document.getElementById('debrief-msg');
      const iconBox = document.getElementById('debrief-icon-box');
      const icon = document.getElementById('debrief-icon');
      const pilotName = document.getElementById('debrief-pilot-name');
      const debriefCat = document.getElementById('debrief-scenario-cat');
      const finalBal = document.getElementById('debrief-final-bal');
      const years = document.getElementById('debrief-years');
      const crashYrs = document.getElementById('debrief-crashline-yrs');
      const tacticYrs = document.getElementById('debrief-tactic-yrs');

      if (!modal) return;

      const survivedYears = state.currentAge - state.startAge;
      const reachedTarget = state.currentAge >= state.targetAge && state.currentNestEgg > 0;

      if (reachedTarget) {
        title.innerText = 'MISSION ACCOMPLISHED!';
        title.className = 'text-lg font-bold text-emerald-400';
        msg.innerText = `Congratulations Pilot ${state.pilotName}! You successfully landed at Age 100 with $${state.currentNestEgg.toLocaleString()} in remaining nest egg altitude!`;
        iconBox.className = 'w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl bg-emerald-50 text-emerald-400 border border-emerald-200 shadow-lg';
        icon.className = 'fa-solid fa-trophy';
        playSound('success');
      } else {
        title.innerText = 'FLIGHT DESTROYED: CRASHLINE ENGINE FAILURE';
        title.className = 'text-lg font-bold text-red-400';
        msg.innerText = `Pilot ${state.pilotName}, your flight remained in the $0 crashline zone for 10 consecutive years at Age ${state.currentAge}. Your retirement portfolio ran out of fuel!`;
        iconBox.className = 'w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl bg-red-50 text-red-400 border border-red-200 shadow-lg';
        icon.className = 'fa-solid fa-plane-slash';
        playSound('crash');
      }

      if (pilotName) pilotName.innerText = state.pilotName;
      if (debriefCat) debriefCat.innerText = presetLabel(state.activePresetKey);
      if (finalBal) finalBal.innerText = '$' + Math.max(0, state.currentNestEgg).toLocaleString();
      if (years) years.innerText = survivedYears + ' Years (Age ' + state.currentAge + ')';
      if (crashYrs) crashYrs.innerText = state.totalCrashlineYears + ' Year(s)';
      if (tacticYrs) tacticYrs.innerText = `${state.totalTacticYears} Tactic-Yrs (-${state.totalTacticYears * 75} pts)`;

      // The flight is over, so its score goes to the shared board under the
      // preset it was flown on.
      registerScoreToLeaderboard(state.pilotName, state.activePresetKey, reachedTarget, state.totalCrashlineYears, state.totalTacticYears, Math.max(0, state.currentNestEgg));

      modal.classList.remove('hidden');

      // The run is over and the button that started it is now behind a
      // full-screen overlay, so focus has to follow the debrief.
      title.setAttribute('tabindex', '-1');
      title.focus({ preventScroll: true });

      updateResultCta(reachedTarget, survivedYears);
    }

    /**
     * Classifies the finished flight for the result-aware panel.
     *
     * The panel is filled in behind the debrief overlay rather than after it,
     * so it is already there whichever way the pilot leaves the modal - and
     * openSimCta() below is the direct route to it.
     *
     * Four outcomes, and the two that are not obvious are the interesting
     * ones. A flight that survived after ten years at zero altitude is not
     * the same result as one that never got near the floor, because the
     * number a survival probability reports is not the thing that makes
     * somebody abandon a plan. And a flight that ended with three times what
     * it started with is not simply a better win: it is a plan that was
     * over-funded, which was paid for with working years nobody gets back.
     */
    function updateResultCta(reachedTarget, survivedYears) {
      if (!window.SimCta) return;

      const finalBalance = Math.max(0, state.currentNestEgg);
      const swr = state.nestEgg > 0 ? ((state.annualSpending / state.nestEgg) * 100).toFixed(1) : '0.0';
      const multiple = state.nestEgg > 0 ? (finalBalance / state.nestEgg).toFixed(1) : '0.0';

      let bucket;
      if (!reachedTarget) bucket = 'crashed';
      else if (state.totalCrashlineYears >= 3) bucket = 'fragile';
      else if (finalBalance > state.nestEgg * 2) bucket = 'comfortable';
      else bucket = 'landed';

      window.SimCta.show(bucket, {
        age: state.currentAge,
        years: survivedYears,
        crashYears: state.totalCrashlineYears,
        finalBalance: window.SimCta.money(finalBalance),
        nestEgg: window.SimCta.money(state.nestEgg),
        spending: window.SimCta.money(state.annualSpending),
        swr,
        multiple
      });
    }

    // The debrief's route to the panel. Closing the modal first is what makes
    // the panel reachable at all - it is behind a full-screen overlay - and
    // SimCta.focus() moves focus onto it, which is only correct because a
    // pilot pressed a button asking to go there.
    function openSimCta() {
      closeDebriefModal();
      if (window.SimCta) window.SimCta.focus();
    }

    function closeDebriefModal() {
      const modal = document.getElementById('modal-flight-debrief');
      // Focus is inside the overlay that is about to be hidden, so it has to
      // be handed back to the control that opened the run.
      const debriefReturnFocus = document.getElementById('btn-launch-flight')
        || document.getElementById('input-nestegg');
      if (modal) modal.classList.add('hidden');
      if (debriefReturnFocus) debriefReturnFocus.focus({ preventScroll: true });
    }

    // The debrief's "see the leaderboard" button did both of these from its own
    // attribute. Two statements in one attribute is more than a data-onclick can
    // say, and the pair is one action anyway.
    function closeDebriefAndShowLeaderboard() {
      closeDebriefModal();
      switchTab('leaderboard');
    }

    // Escape closes the debrief, and Tab is kept inside it while it is open.
    // `aria-modal="true"` tells a screen reader the rest of the page is inert;
    // it does not make it inert, so without this the Tab key walks out of the
    // dialog into a page the same attribute just said was not there.
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' && event.key !== 'Tab') return;

      const modal = document.getElementById('modal-flight-debrief');
      if (!modal || modal.classList.contains('hidden')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeDebriefModal();
        return;
      }

      const focusable = [...modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]')]
        .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('tabindex') !== '-1');
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      // Also catches focus sitting on the heading, which is tabindex="-1" and so
      // is not in the list: from there, either direction wraps to an end.
      if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    /* =================================================================
       LEADERBOARD SYSTEM BY CATEGORY
       ================================================================= */
    /** The display name of a preset, in the language of this page. */
    function presetLabel(key) {
      return PRESET_LABELS[key] || PRESET_LABELS.custom;
    }

    /** Which board is on screen, named the way the empty state reads it. */
    function boardLabel() {
      return activeLeaderboardFilter === 'ALL' ? 'ALL CATEGORIES' : presetLabel(activeLeaderboardFilter);
    }

    function getCategoryBonus(key) {
      if (key === 'leanfire') return 2000;
      if (key === 'highrisk') return 1500;
      if (key === 'custom') return 1000;
      if (key === 'trinity') return 800;
      if (key === 'fatfire') return 200;
      return 1000;
    }

    /**
     * The assumptions the flight was flown under, in the shape the endpoint
     * stores them.
     *
     * Sent with the score rather than derived from it later, because none of it
     * can be derived from it later: a score of 5,800 does not say whether it
     * came from withdrawing 3% over thirty years or 5% over fifty, and those
     * are the two runs anybody reading a published average would want told
     * apart. The board shows none of this. It is recorded so that "what do
     * people actually assume about safe withdrawal rates" is a question this
     * site can answer with its own numbers.
     *
     * The withdrawal rate is computed here rather than server-side and carried
     * in basis points, because the stored column rounds to whole numbers and a
     * rate rounded to a whole percent is the wrong resolution for the one
     * argument it exists to settle. A run whose starting capital was cleared to
     * zero sends no rate at all instead of an infinity: the field is optional,
     * and a missing value is honest where a placeholder would enter the average.
     */
    function flightAssumptions() {
      const assumptions = {
        startCapital: recordable(state.nestEgg, 0, 1000000000),
        annualSpending: recordable(state.annualSpending, 0, 100000000),
        startAge: recordable(state.startAge, 18, 100),
        horizonYears: recordable(state.targetAge - state.startAge, 1, 90),
        pctStocks: recordable(state.pctStocks, 0, 100),
        pctBonds: recordable(state.pctBonds, 0, 100),
        pctCash: recordable(state.pctCash, 0, 100),
        targetDateFund: !!state.useTargetDateFund,
        marketSequence: state.marketSequence,
        // Which levers were pulled, whether or not they were pulled in time.
        tacticJob: !!state.actJob,
        tacticCutSpend: !!state.actCutSpend,
        tacticCashBuffer: !!state.actCashBuffer,
        tacticGuardrails: !!state.actGuardrails,
        tacticDownsize: !!state.actDownsize,
        tacticPension: !!state.actPension
      };

      if (state.nestEgg > 0) {
        assumptions.withdrawalBps = recordable((state.annualSpending / state.nestEgg) * 10000, 0, 5000);
      }

      return assumptions;
    }

    /**
     * The value if it is one the record can hold, and nothing if it is not.
     *
     * Every field above comes from a number box a visitor can type anything
     * into, and the endpoint refuses a write whose details fall outside the
     * range it declares. Somebody modelling a €1 portfolio spending €45,000 a
     * year has a withdrawal rate of 450,000 basis points, which is a real
     * thing to try in a simulator and is not a rate; left in, it would cost
     * them the score they earned, and clamped to 5,000 it would enter every
     * published average as a 50% withdrawal that nobody chose.
     *
     * So an impossible value is dropped instead. The field is optional at the
     * far end, the aggregate counts how many runs actually carried it, and a
     * missing number stays missing rather than becoming a wrong one.
     */
    function recordable(value, min, max) {
      const number = Math.round(Number(value));
      if (!Number.isFinite(number) || number < min || number > max) return undefined;
      return number;
    }

    function registerScoreToLeaderboard(pilot, boardKey, reached100, crashYears, tacticYears, finalBalance) {
      // Score formula: 
      // Base score (5000 pts for reaching 100, 1000 pts baseline)
      // + Scenario Difficulty Bonus (Lean FIRE +2000, High Risk SWR +1500, Trinity +800, Fat FIRE +200)
      // - (crashYears * 500 pts penalty) 
      // - (tacticYears * 75 pts penalty per active tactic-year) 
      // + (finalBalance / 2500 pts wealth bonus)
      let baseScore = reached100 ? 5000 : 1000;
      let catBonus = getCategoryBonus(boardKey);
      let crashPenalty = crashYears * 500;
      let tacticPenalty = (tacticYears || 0) * 75;
      let wealthBonus = Math.round(finalBalance / 2500);

      let score = baseScore + catBonus - crashPenalty - tacticPenalty + wealthBonus;
      // Clamped at both ends, and to the range the endpoint accepts. A flight
      // that ends with a nine-figure portfolio is a real flight, and losing
      // its score to a rejected write would be a worse outcome than a score
      // that stops climbing.
      score = Math.min(100000, Math.max(100, score));

      const board = PRESET_LABELS[boardKey] ? boardKey : 'custom';
      const nestEgg = Math.min(1000000000, Math.max(0, Math.round(finalBalance)));

      // The board is switched to the one the flight was on before the write is
      // sent, so the pilot watches their own run arrive rather than being left
      // on whichever filter they had open.
      activeLeaderboardFilter = board;
      syncFilterButtons();
      leaderboardState = 'loading';
      renderLeaderboardTable();

      const token = ++leaderboardRequest;
      window.SimLeaderboard.submit({
        simulator: LEADERBOARD_SIMULATOR,
        board: board,
        name: pilot,
        score: score,
        // Ranked on score; equal scores settled by the bigger nest egg. The
        // remaining columns are carried as details because the board displays
        // them and does not rank on them.
        tiebreak: nestEgg,
        details: Object.assign(
          {
            reached100: !!reached100,
            crashYears: crashYears || 0,
            tacticYears: tacticYears || 0,
            finalBalance: nestEgg
          },
          flightAssumptions()
        )
      })
        .then(function (result) {
          if (token !== leaderboardRequest) return;
          leaderboardEntries = result.entries;
          leaderboardState = 'ready';
          renderLeaderboardTable();
        })
        .catch(function () {
          if (token !== leaderboardRequest) return;
          leaderboardEntries = [];
          leaderboardState = 'error';
          renderLeaderboardTable();
        });
    }

    /**
     * Reads one board and draws it.
     *
     * Called on load, on every filter click and from the refresh button, so
     * the table is the board as it stands rather than the board as it stood
     * when the page opened - somebody else's flight can land while this one is
     * still being flown.
     */
    function loadLeaderboard() {
      const token = ++leaderboardRequest;
      leaderboardState = 'loading';
      renderLeaderboardTable();

      window.SimLeaderboard.load(LEADERBOARD_SIMULATOR, activeLeaderboardFilter)
        .then(function (entries) {
          if (token !== leaderboardRequest) return;
          leaderboardEntries = entries;
          leaderboardState = 'ready';
          renderLeaderboardTable();
        })
        .catch(function () {
          if (token !== leaderboardRequest) return;
          leaderboardEntries = [];
          leaderboardState = 'error';
          renderLeaderboardTable();
        });
    }

    function refreshLeaderboard() {
      playSound('click');
      loadLeaderboard();
    }

    function syncFilterButtons() {
      ['ALL'].concat(PRESET_KEYS).forEach(function (key) {
        const btn = document.getElementById('lb-filter-' + key);
        if (!btn) return;
        btn.setAttribute('aria-pressed', key === activeLeaderboardFilter ? 'true' : 'false');
      });
    }

    function filterLeaderboard(board) {
      // 'ALL' is every preset ranked together, which the endpoint reads as one
      // board and nothing ever writes to.
      activeLeaderboardFilter = PRESET_LABELS[board] ? board : 'ALL';
      syncFilterButtons();
      playSound('click');
      loadLeaderboard();
    }

    function getCategoryBadgeHTML(key) {
      const badge = PRESET_BADGES[key] || PRESET_BADGES.custom;
      return `<span class="px-2 py-0.5 rounded text-[10px] font-bold ${badge.classes}"><i class="fa-solid ${badge.icon} mr-1" aria-hidden="true"></i>${presetLabel(key)}</span>`;
    }

    function leaderboardNoticeRow(message) {
      return `
          <tr>
            <td colspan="8" class="py-6 text-center text-espresso-800 font-sans">
              ${message}
            </td>
          </tr>
        `;
    }

    function renderLeaderboardTable() {
      const tbody = document.getElementById('leaderboard-table-body');
      if (!tbody) return;

      if (leaderboardState === 'loading') {
        tbody.innerHTML = leaderboardNoticeRow('Loading the global board…');
        return;
      }

      if (leaderboardState === 'error') {
        tbody.innerHTML = leaderboardNoticeRow('The global board could not be reached. Check your connection and press Refresh.');
        return;
      }

      if (leaderboardEntries.length === 0) {
        tbody.innerHTML = leaderboardNoticeRow(`              No flight logs on the global board yet for <strong>${boardLabel()}</strong>. Fly this preset and yours is the first score every other pilot sees.
`);
        return;
      }

      tbody.innerHTML = '';

      // Already ranked and already filtered - the endpoint returns the top of
      // one board, best first, so there is nothing to sort here.
      leaderboardEntries.forEach((entry, idx) => {
        const details = entry.details || {};
        const isMine = window.SimLeaderboard.isMine(LEADERBOARD_SIMULATOR, entry.id);
        const row = document.createElement('tr');
        row.className = isMine
          ? 'bg-amber-50 hover:bg-cream-100 transition'
          : 'hover:bg-cream-100 transition';
        
        let rankBadge = `<span class="font-bold text-espresso-800">#${idx + 1}</span>`;
        if (idx === 0) rankBadge = `<span class="font-bold text-amber-400"><i class="fa-solid fa-crown mr-1" aria-hidden="true"></i> #1</span>`;
        if (idx === 1) rankBadge = `<span class="font-bold text-espresso-900"><i class="fa-solid fa-medal mr-1" aria-hidden="true"></i> #2</span>`;
        if (idx === 2) rankBadge = `<span class="font-bold text-amber-600"><i class="fa-solid fa-award mr-1" aria-hidden="true"></i> #3</span>`;

        row.innerHTML = `
          <td class="py-3 px-3">${rankBadge}</td>
          <td class="py-3 px-3 font-bold text-espresso-900">${window.SimLeaderboard.escapeHtml(entry.name)}${isMine ? ' <span class="text-[10px] text-amber-400 font-bold">(YOU)</span>' : ''}</td>
          <td class="py-3 px-3">${getCategoryBadgeHTML(entry.board)}</td>
          <td class="py-3 px-3 font-bold">${details.reached100 ? '<span class="text-emerald-400"><i class="fa-solid fa-circle-check"></i> YES</span>' : '<span class="text-red-400"><i class="fa-solid fa-circle-xmark"></i> NO</span>'}</td>
          <td class="py-3 px-3 text-red-400 font-bold">${details.crashYears || 0} Year(s)</td>
          <td class="py-3 px-3 text-amber-300 font-bold">${details.tacticYears || 0} Tactic-Yrs</td>
          <td class="py-3 px-3 text-emerald-400 font-bold">$${(details.finalBalance || 0).toLocaleString()}</td>
          <td class="py-3 px-3 text-amber-400 font-bold font-hud">${entry.score.toLocaleString()} pts</td>
        `;
        tbody.appendChild(row);
      });
    }

    /* =================================================================
       ENHANCED CANVAS HUD VISUALIZER & CRASHLINE RENDERING
       ================================================================= */
    function renderCanvas() {
      const canvas = document.getElementById('flightCanvas');
      if (!canvas || !canvas.parentElement) return;

      // The same palette assets/js/sim-chart-theme.js hands Chart.js on the
      // other four tools. The fallbacks are there because this is the only
      // drawing code on the site that would throw rather than merely look
      // wrong if the file failed to load.
      const theme = window.SimChartTheme || {};
      const role = theme.role || {};
      const paper = role.surface || '#fffdf8';
      const line = theme.line ? theme.line(0) : '#1e4620';
      const alarm = role.negative || '#a6402a';
      const face = theme.font || 'ui-sans-serif, system-ui, sans-serif';

      const ctx = canvas.getContext('2d');
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;

      const W = canvas.width;
      const H = canvas.height;

      const healthRatio = Math.max(0, Math.min(1.5, state.currentNestEgg / state.nestEgg));
      let skyGrad = ctx.createLinearGradient(0, 0, 0, H);

      const canvasStatusDot = document.getElementById('canvas-sky-status-dot');
      const canvasStatusText = document.getElementById('canvas-sky-status-text');
      const pitchBadge = document.getElementById('hud-pitch-badge');

      if (state.yearsInCrashlineConsecutive > 0) {
        skyGrad.addColorStop(0, 'rgba(166, 64, 42, 0.16)');
        skyGrad.addColorStop(1, paper);
        if (canvasStatusText) {
          canvasStatusText.innerText = `CRASHLINE EMERGENCY: ${state.yearsInCrashlineConsecutive}/10 Years in $0 Bankruptcy Zone!`;
          if (canvasStatusDot) canvasStatusDot.className = 'w-2 h-2 rounded-full bg-red-500 animate-ping';
        }
      } else if (healthRatio > 0.8) {
        skyGrad.addColorStop(0, 'rgba(30, 70, 32, 0.12)');
        skyGrad.addColorStop(1, paper);
        if (canvasStatusText) {
          canvasStatusText.innerText = 'Atmosphere: Clear Skies & Safe Cruising Altitude';
          if (canvasStatusDot) canvasStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
        }
      } else {
        skyGrad.addColorStop(0, 'rgba(138, 90, 11, 0.14)');
        skyGrad.addColorStop(1, paper);
        if (canvasStatusText) {
          canvasStatusText.innerText = 'Atmosphere: Mild Turbulence / Altitude Caution';
          if (canvasStatusDot) canvasStatusDot.className = 'w-2 h-2 rounded-full bg-amber-500 animate-pulse';
        }
      }

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Bounds
      const maxVal = Math.max(state.nestEgg * 2.2, state.peakNestEgg * 1.2);
      const topY = 40;
      const bottomY = H - 35;

      // Draw Grid Lines & Y-Axis Dollar Labels
      ctx.strokeStyle = role.grid || '#efeae0';
      ctx.lineWidth = 1;

      const numGridLines = 4;
      for (let i = 0; i <= numGridLines; i++) {
        const y = bottomY - (i / numGridLines) * (bottomY - topY);
        const dollarVal = (i / numGridLines) * maxVal;

        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(W, y);
        ctx.stroke();

        ctx.fillStyle = role.ink || '#574838';
        ctx.font = '600 9px ' + face;
        ctx.fillText('$' + (dollarVal / 1000).toFixed(0) + 'k', 8, y + 3);
      }

      // X-Axis Age Labels
      const totalYears = Math.max(1, state.targetAge - state.startAge);
      const startX = 60;
      const endX = W - 30;

      ctx.fillStyle = role.ink || '#574838';
      ctx.font = '600 10px ' + face;
      for (let age = state.startAge; age <= state.targetAge; age += 10) {
        const pct = (age - state.startAge) / totalYears;
        const x = startX + pct * (endX - startX);
        ctx.fillText(`Age ${age}`, x - 18, H - 12);
      }

      // Trajectory Pitch Status
      if (state.historyLogs.length > 0) {
        const lastLog = state.historyLogs[state.historyLogs.length - 1];
        const prevBal = state.historyLogs.length > 1 ? state.historyLogs[state.historyLogs.length - 2].endBal : state.nestEgg;
        const deltaBal = lastLog.endBal - prevBal;

        if (pitchBadge) {
          if (state.yearsInCrashlineConsecutive > 0) {
            pitchBadge.innerHTML = `<span class="text-red-400 font-bold animate-pulse"><i class="fa-solid fa-plane-circle-exclamation"></i> 🚨 CRASHLINE STALL</span>`;
          } else if (deltaBal > 10000) {
            pitchBadge.innerHTML = `<span class="text-emerald-400"><i class="fa-solid fa-arrow-trend-up"></i> 🛫 CLIMBING</span>`;
          } else if (deltaBal >= -5000) {
            pitchBadge.innerHTML = `<span class="text-cyan-300"><i class="fa-solid fa-arrow-right"></i> ✈️ LEVEL CRUISE</span>`;
          } else {
            pitchBadge.innerHTML = `<span class="text-amber-400"><i class="fa-solid fa-arrow-trend-down"></i> 📉 DESCENDING</span>`;
          }
        }

        // Draw Curve
        ctx.beginPath();
        ctx.strokeStyle = state.yearsInCrashlineConsecutive > 0 ? alarm : line;
        ctx.lineWidth = 3;

        const startY = bottomY - ((state.nestEgg / maxVal) * (bottomY - topY));
        ctx.moveTo(startX, startY);

        state.historyLogs.forEach((log, idx) => {
          const x = startX + ((idx + 1) / totalYears) * (endX - startX);
          const y = bottomY - (Math.max(0, log.endBal) / maxVal) * (bottomY - topY);
          ctx.lineTo(x, y);
        });

        ctx.stroke();

        // Area fill
        const lastIdx = state.historyLogs.length - 1;
        const lastX = startX + ((lastIdx + 1) / totalYears) * (endX - startX);
        const lastY = bottomY - (Math.max(0, state.historyLogs[lastIdx].endBal) / maxVal) * (bottomY - topY);

        ctx.lineTo(lastX, bottomY);
        ctx.lineTo(startX, bottomY);
        ctx.closePath();

        let fillGrad = ctx.createLinearGradient(0, 0, 0, H);
        fillGrad.addColorStop(0, state.yearsInCrashlineConsecutive > 0 ? 'rgba(166, 64, 42, 0.28)' : 'rgba(30, 70, 32, 0.22)');
        fillGrad.addColorStop(1, 'rgba(255, 253, 248, 0)');
        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Draw Airplane
        drawAirplane(ctx, lastX, lastY, state.yearsInCrashlineConsecutive > 0 ? 0.1 : healthRatio);
      } else {
        const startY = bottomY - ((state.nestEgg / maxVal) * (bottomY - topY));
        drawAirplane(ctx, startX, startY, 1.0);
        if (pitchBadge) {
          pitchBadge.innerHTML = `<span class="text-emerald-400">🛫 READY ON TARMAC</span>`;
        }
      }

      // Ground Crashline ($0 Bankruptcy)
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = alarm;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, bottomY);
      ctx.lineTo(W, bottomY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = alarm;
      ctx.font = '700 10px ' + face;
      ctx.fillText('CRASHLINE ZONE ($0 BANKRUPTCY)', 65, bottomY - 6);
    }

    function drawAirplane(ctx, x, y, healthRatio) {
      ctx.save();
      ctx.translate(x, y);

      const theme = window.SimChartTheme || {};
      const role = theme.role || {};

      ctx.fillStyle = healthRatio > 0.3
        ? (theme.line ? theme.line(0) : '#1e4620')
        : (role.negative || '#a6402a');
      ctx.beginPath();
      ctx.moveTo(16, 0); // Nose
      ctx.lineTo(-12, -10); // Left wing
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 10); // Right wing
      ctx.closePath();
      ctx.fill();

      // Thrust flame
      ctx.fillStyle = role.gold || '#c59b27';
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-18, -3);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-18, 3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    /* =================================================================
       CALCULATORS HANDLERS
       ================================================================= */
    function openSpendCalculator() {
      const modal = document.getElementById('modal-calc-spend');
      if (modal) modal.classList.remove('hidden');
      computeCalculatedSpend();
      playSound('click');
    }
    function closeSpendCalculator() {
      const modal = document.getElementById('modal-calc-spend');
      if (modal) modal.classList.add('hidden');
    }
    function computeCalculatedSpend() {
      const h = parseFloat(document.getElementById('calc-spend-housing').value) || 0;
      const f = parseFloat(document.getElementById('calc-spend-food').value) || 0;
      const md = parseFloat(document.getElementById('calc-spend-health').value) || 0;
      const t = parseFloat(document.getElementById('calc-spend-travel').value) || 0;
      const m = parseFloat(document.getElementById('calc-spend-misc').value) || 0;

      const totalMonthly = h + f + md + t + m;
      const totalAnnual = totalMonthly * 12;

      const totalEl = document.getElementById('calc-spend-total');
      if (totalEl) totalEl.innerText = '$' + Math.round(totalAnnual).toLocaleString() + ' / yr';
      return totalAnnual;
    }
    function applyCalculatedSpend() {
      const annualSpend = computeCalculatedSpend();
      const input = document.getElementById('input-spending');
      if (input) input.value = Math.min(250000, Math.max(15000, annualSpend));
      updateControlsUI();
      closeSpendCalculator();
      playSound('success');
    }

    function openNestEggCalculator() {
      const modal = document.getElementById('modal-calc-nestegg');
      if (modal) modal.classList.remove('hidden');
      const spendInput = document.getElementById('calc-egg-spend');
      if (spendInput) spendInput.value = state.annualSpending;
      computeCalculatedEgg();
      playSound('click');
    }
    function closeNestEggCalculator() {
      const modal = document.getElementById('modal-calc-nestegg');
      if (modal) modal.classList.add('hidden');
    }
    function computeCalculatedEgg() {
      const spend = parseFloat(document.getElementById('calc-egg-spend').value) || 45000;
      const swrPct = parseFloat(document.getElementById('calc-egg-swr').value) || 4.0;
      const multiplier = 100 / swrPct;

      const requiredEgg = spend * multiplier;

      const formulaEl = document.getElementById('calc-egg-formula');
      if (formulaEl) {
        formulaEl.innerText = `$${Math.round(spend).toLocaleString()} × ${multiplier.toFixed(1)} = $${Math.round(requiredEgg).toLocaleString()} (${multiplier.toFixed(1)}x Rule)`;
      }
      const totalEl = document.getElementById('calc-egg-total');
      if (totalEl) totalEl.innerText = '$' + Math.round(requiredEgg).toLocaleString();
      return requiredEgg;
    }
    function applyCalculatedEgg() {
      const reqEgg = computeCalculatedEgg();
      const input = document.getElementById('input-nestegg');
      if (input) input.value = Math.min(5000000, Math.max(200000, reqEgg));
      updateControlsUI();
      closeNestEggCalculator();
      playSound('success');
    }

    /* =================================================================
       TAB 3: 1,000 MONTE CARLO BATCH SIMULATOR
       ================================================================= */
    function runMonteCarloBatch() {
      playSound('click');

      const numSims = 1000;
      const totalYears = Math.max(1, state.targetAge - state.startAge);
      let successCount = 0;
      let endingBalances = [];
      let trajectorySnapshots = {
        10: [], 20: [], 30: [], 40: [], 50: []
      };

      for (let sim = 0; sim < numSims; sim++) {
        let bal = state.nestEgg;
        let spend = state.annualSpending;

        if (state.actJob) spend = Math.max(0, spend - 15000);
        if (state.actCutSpend) spend = spend * 0.85;

        let crashYearsConsec = 0;

        for (let year = 1; year <= totalYears; year++) {
          if (bal <= 0) {
            crashYearsConsec++;
            bal = 0;
          } else {
            crashYearsConsec = 0;
            let sRet = randomGaussian(MARKET_BENCHMARKS.stocks.mean, MARKET_BENCHMARKS.stocks.stdDev);
            let bRet = randomGaussian(MARKET_BENCHMARKS.bonds.mean, MARKET_BENCHMARKS.bonds.stdDev);
            let infl = randomGaussian(MARKET_BENCHMARKS.inflation.mean, MARKET_BENCHMARKS.inflation.stdDev);

            spend = spend * (1 + Math.max(0, infl));
            let wRet = (sRet * (state.pctStocks / 100)) + (bRet * (state.pctBonds / 100)) + (MARKET_BENCHMARKS.cash.mean * (state.pctCash / 100));

            if (state.actCashBuffer && sRet < 0) wRet += 0.03;

            bal = (bal - spend) * (1 + wRet);
          }

          if (year % 10 === 0 && trajectorySnapshots[year]) {
            trajectorySnapshots[year].push(Math.max(0, bal));
          }
        }

        if (bal > 0) successCount++;
        endingBalances.push(Math.max(0, bal));
      }

      endingBalances.sort((a, b) => a - b);

      const successRate = ((successCount / numSims) * 100).toFixed(1);
      const medianEnd = endingBalances[Math.floor(numSims * 0.5)];
      const p10 = endingBalances[Math.floor(numSims * 0.1)];
      const p90 = endingBalances[Math.floor(numSims * 0.9)];

      const succEl = document.getElementById('mc-metric-success');
      const medEl = document.getElementById('mc-metric-median');
      const p10El = document.getElementById('mc-metric-p10');
      const p90El = document.getElementById('mc-metric-p90');

      if (succEl) succEl.innerText = successRate + '%';
      if (medEl) medEl.innerText = '$' + Math.round(medianEnd).toLocaleString();
      if (p10El) p10El.innerText = '$' + Math.round(p10).toLocaleString();
      if (p90El) p90El.innerText = '$' + Math.round(p90).toLocaleString();

      // Render percentile table
      const tbody = document.getElementById('mc-table-body');
      if (tbody) {
        tbody.innerHTML = '';
        [10, 20, 30, 40, 50].forEach(y => {
          if (y <= totalYears) {
            let arr = trajectorySnapshots[y].sort((a, b) => a - b);
            let n = arr.length;
            let row = document.createElement('tr');
            row.className = 'hover:bg-cream-100 transition';
            row.innerHTML = `
              <td class="py-2.5 px-3 font-bold text-espresso-900">Age ${state.startAge + y} (${y} Yrs)</td>
              <td class="py-2.5 px-3 text-red-400 font-bold">$${Math.round(arr[Math.floor(n * 0.10)] || 0).toLocaleString()}</td>
              <td class="py-2.5 px-3 text-amber-400">$${Math.round(arr[Math.floor(n * 0.25)] || 0).toLocaleString()}</td>
              <td class="py-2.5 px-3 text-cyan-300 font-bold">$${Math.round(arr[Math.floor(n * 0.50)] || 0).toLocaleString()}</td>
              <td class="py-2.5 px-3 text-emerald-400">$${Math.round(arr[Math.floor(n * 0.75)] || 0).toLocaleString()}</td>
              <td class="py-2.5 px-3 text-purple-400 font-bold">$${Math.round(arr[Math.floor(n * 0.90)] || 0).toLocaleString()}</td>
            `;
            tbody.appendChild(row);
          }
        });
      }

      playSound('success');
    }

    /* =================================================================
       MATH HELPERS & TAB SWITCHING
       ================================================================= */
    function randomGaussian(mean, stdDev) {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      return mean + num * stdDev;
    }

    const TAB_KEYS = ['cockpit', 'leaderboard', 'montecarlo', 'academy'];

    // `focusTab` says whether the newly selected tab should also take focus.
    // A click already put focus on the button that was clicked, and stealing it
    // back would be a no-op at best; arrow-key navigation is the case that has
    // to move it, because in the tab pattern the arrow keys move the selection
    // and the focus together.
    function switchTab(tabKey, focusTab) {
      playSound('click');
      const tabs = TAB_KEYS;
      tabs.forEach(t => {
        const tabEl = document.getElementById('tab-' + t);
        const btnEl = document.getElementById('nav-btn-' + t);
        if (tabEl) tabEl.classList.add('hidden');
        if (btnEl) {
          btnEl.className = 'sim-tab';
          // The colour change above is the whole of what a sighted user gets.
          // These two attributes are the same information for everybody else:
          // which tab is current, and which single button the Tab key lands on
          // so that arrowing between four tabs does not cost four tab stops.
          btnEl.setAttribute('aria-selected', 'false');
          btnEl.setAttribute('tabindex', '-1');
        }
      });

      const activeTab = document.getElementById('tab-' + tabKey);
      const activeBtn = document.getElementById('nav-btn-' + tabKey);

      if (activeTab) activeTab.classList.remove('hidden');
      if (activeBtn) {
        activeBtn.className = 'sim-tab';
        activeBtn.setAttribute('aria-selected', 'true');
        activeBtn.setAttribute('tabindex', '0');
        if (focusTab) activeBtn.focus();
      }

      if (tabKey === 'cockpit') {
        renderCanvas();
      } else if (tabKey === 'leaderboard') {
        loadLeaderboard();
      } else if (tabKey === 'montecarlo') {
        runMonteCarloBatch();
      }
    }

    // Left/Right move between tabs and wrap; Home and End jump to the ends.
    // Without this a tablist is four buttons that happen to sit in a row, and
    // the roving tabindex set above would make three of them unreachable.
    document.addEventListener('keydown', function (event) {
      const button = event.target.closest && event.target.closest('[role="tab"]');
      if (!button) return;

      const current = TAB_KEYS.indexOf(button.id.replace('nav-btn-', ''));
      if (current === -1) return;

      let next = null;
      if (event.key === 'ArrowRight') next = (current + 1) % TAB_KEYS.length;
      else if (event.key === 'ArrowLeft') next = (current - 1 + TAB_KEYS.length) % TAB_KEYS.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = TAB_KEYS.length - 1;
      if (next === null) return;

      event.preventDefault();
      switchTab(TAB_KEYS[next], true);
    });

    /* =================================================================
       WEBAUDIO SOUND SYNTHESIS
       ================================================================= */
    function playSound(type) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'click') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
        } else if (type === 'engine') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.exponentialRampToValueAtTime(240, now + 0.2);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === 'alert') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(880, now + 0.1);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === 'success') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.1);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
        } else if (type === 'crash') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
        }
      } catch (e) {
        // AudioContext disabled or blocked by browser policy
      }
    }
