/* =================================================================
       ESTADO GLOBAL Y CONFIGURACIÓN
       ================================================================= */
    let leaderboardScores = [
      { pilot: 'Capitán FIRE', category: 'High Risk SWR', reached100: true, crashYears: 0, tacticYears: 0, finalBalance: 1250000, score: 7000 },
      { pilot: 'Piloto FatCat', category: 'Fat FIRE', reached100: true, crashYears: 0, tacticYears: 0, finalBalance: 3100000, score: 6440 },
      { pilot: 'As Trinity', category: 'Trinity Standard', reached100: true, crashYears: 0, tacticYears: 2, finalBalance: 1850000, score: 6390 },
      { pilot: 'Volador Lean', category: 'Tight Lean FIRE', reached100: true, crashYears: 1, tacticYears: 12, finalBalance: 420000, score: 5768 },
      { pilot: 'Caza Wingman', category: 'High Risk SWR', reached100: false, crashYears: 10, tacticYears: 25, finalBalance: 0, score: 100 }
    ];
    let activeLeaderboardFilter = 'ALL';

    const state = {
      pilotName: 'Capitán FIRE',
      activePreset: 'High Risk SWR',

      // Configuración de Vuelo
      nestEgg: 850000,
      annualSpending: 45000,
      startAge: 50,
      targetAge: 100,
      
      // Asignación
      pctStocks: 80,
      pctBonds: 15,
      pctCash: 5,
      useTargetDateFund: false,

      // 6 Tácticas en Cabina
      actJob: false,
      actCutSpend: false,
      actCashBuffer: false,
      actGuardrails: false,
      actDownsize: false,
      actPension: false,

      // Telemetría de Simulación
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

    // Calibración de Referencias de Mercado
    const MARKET_BENCHMARKS = {
      stocks: { mean: 0.082, stdDev: 0.24 }, // Mayor dispersión y volatilidad de acciones
      bonds: { mean: 0.035, stdDev: 0.06 },  // Rendimiento de bonos
      cash: { mean: 0.015, stdDev: 0.01 },   // Rendimiento de efectivo
      inflation: { mean: 0.035, stdDev: 0.025 } // Inflación IPC
    };

    // Secuencias Históricas de Caída
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
        { stock: -0.40, bond: 0.18, infl: 0.00 } // Caída 2008
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
       INICIALIZACIÓN Y CONTROLES DE INTERFAZ
       ================================================================= */
    window.onload = function() {
      updatePilotName();
      updateControlsUI();
      renderLeaderboardTable();
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
        state.activePreset = 'High Risk SWR';
      } else if (state.nestEgg === 1000000 && state.annualSpending === 40000) {
        state.activePreset = 'Trinity Standard';
      } else if (state.nestEgg === 650000 && state.annualSpending === 35000) {
        state.activePreset = 'Tight Lean FIRE';
      } else if (state.nestEgg === 1500000 && state.annualSpending === 75000) {
        state.activePreset = 'Fat FIRE';
      } else {
        state.activePreset = 'Custom Scenario';
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

      checkAndDetectPresetCategory();

      const seqEl = document.getElementById('select-market-sequence');
      if (seqEl) state.marketSequence = seqEl.value;

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
          badgeSwr.innerText = `${swrStr} (ALTO RIESGO)`;
          badgeSwr.className = 'font-mono px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 animate-pulse';
        } else if (swrVal > 3.8) {
          badgeSwr.innerText = `${swrStr} (RIESGO MODERADO)`;
          badgeSwr.className = 'font-mono px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800';
        } else {
          badgeSwr.innerText = `${swrStr} (SWR SEGURO)`;
          badgeSwr.className = 'font-mono px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800';
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
          crashCounter.innerText = `${state.yearsInCrashlineConsecutive} / 10 Años`;
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
        state.activePreset = 'High Risk SWR';
        setControlValues(850000, 45000, 50, 100, 80, 15, 5);
      } else if (type === 'trinity') {
        state.activePreset = 'Trinity Standard';
        setControlValues(1000000, 40000, 50, 100, 70, 20, 10);
      } else if (type === 'leanfire') {
        state.activePreset = 'Tight Lean FIRE';
        setControlValues(650000, 35000, 50, 100, 85, 10, 5);
      } else if (type === 'fatfire') {
        state.activePreset = 'Fat FIRE';
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
       ASIGNACIÓN DE ACTIVOS Y FONDO FECHA OBJETIVO
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
      if (tdfText) tdfText.innerText = `Edad ${age}: ${stocks}% Acciones / ${bonds}% Bonos / ${cash}% Efectivo`;
    }

    /* =================================================================
       AJUSTES TÁCTICOS EN CABINA DE VUELO
       ================================================================= */
    function toggleAction(action) {
      playSound('click');
      if (action === 'job') {
        state.actJob = !state.actJob;
        updateActionCardUI('job', state.actJob, 'glow-cyan', 'border-cyan-500');
      } else if (action === 'cutspend') {
        state.actCutSpend = !state.actCutSpend;
        updateActionCardUI('cutspend', state.actCutSpend, 'glow-amber', 'border-amber-500');
      } else if (action === 'cashbuffer') {
        state.actCashBuffer = !state.actCashBuffer;
        updateActionCardUI('cashbuffer', state.actCashBuffer, 'glow-green', 'border-emerald-500');
      } else if (action === 'guardrails') {
        state.actGuardrails = !state.actGuardrails;
        updateActionCardUI('guardrails', state.actGuardrails, 'glow-cyan', 'border-purple-500');
      } else if (action === 'downsize') {
        state.actDownsize = !state.actDownsize;
        updateActionCardUI('downsize', state.actDownsize, 'glow-cyan', 'border-blue-500');
        if (state.actDownsize && state.isSimulating) {
          state.currentNestEgg += 100000;
          showCopilotBanner(
            '🏠 INYECCIÓN POR REDUCCIÓN DE VIVENDA',
            '¡Inyectaste +$100.000 de combustible de emergencia tras vender o reducir tu vivienda!',
            '💡 Consejo: El capital inmobiliario funciona como un potente colchón de longevidad.',
            'info'
          );
        }
      } else if (action === 'pension') {
        state.actPension = !state.actPension;
        updateActionCardUI('pension', state.actPension, 'glow-cyan', 'border-pink-500');
      }
      renderCanvas();
    }

    function updateActionCardUI(key, isActive, glowClass, borderClass) {
      const card = document.getElementById('card-action-' + key);
      const badge = document.getElementById('badge-action-' + key);
      const check = document.getElementById('check-action-' + key);

      if (!card || !badge) return;

      if (isActive) {
        card.classList.add(glowClass, borderClass, 'bg-slate-900/90');
        badge.innerText = 'ACTIVO';
        badge.className = 'text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold';
        if (check) check.checked = true;
      } else {
        card.classList.remove(glowClass, borderClass, 'bg-slate-900/90');
        badge.innerText = 'INACTIVO';
        badge.className = 'text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700';
        if (check) check.checked = false;
      }
    }

    /* =================================================================
       MOTOR DE SIMULACIÓN (PASO A PASO Y LÓGICA CRASHLINE)
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
      if (launchBtnText) launchBtnText.innerText = 'PAUSAR VUELO';

      const badge = document.getElementById('hud-flight-status-badge');
      if (badge) {
        badge.innerText = '✈️ EN VUELO (EN EL AIRE)';
        badge.className = 'px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-700 animate-pulse';
      }

      state.simulationInterval = setInterval(simulateOneYearStep, 800);
    }

    function pauseFlightSimulation() {
      state.isSimulating = false;
      if (state.simulationInterval) clearInterval(state.simulationInterval);

      const launchBtnText = document.getElementById('btn-launch-text');
      if (launchBtnText) launchBtnText.innerText = 'REANUDAR VUELO';

      const badge = document.getElementById('hud-flight-status-badge');
      if (badge) {
        badge.innerText = '⏸️ VUELO EN PAUSA';
        badge.className = 'px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-amber-950 text-amber-400 border border-amber-800';
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
      if (launchBtnText) launchBtnText.innerText = 'DESPEGAR VUELO';

      const badge = document.getElementById('hud-flight-status-badge');
      if (badge) {
        badge.innerText = 'Listo en Pista';
        badge.className = 'px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800';
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

      let effectiveSpend = state.annualSpending;

      if (state.actJob) {
        effectiveSpend = Math.max(0, effectiveSpend - 15000);
      }
      if (state.actCutSpend) {
        effectiveSpend = effectiveSpend * 0.85;
      }
      if (state.actPension && state.currentAge >= 62) {
        effectiveSpend = Math.max(0, effectiveSpend - 20000);
      }

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

        const yearsElapsed = state.currentAge - state.startAge;
        if (yearsElapsed <= 15 && (yearsElapsed % 5 === 2 || yearsElapsed === 3)) {
          stockRet -= 0.18;
        }
      }

      if (state.actGuardrails && stockRet < -0.15) {
        effectiveSpend = effectiveSpend * 0.90;
      }

      effectiveSpend = effectiveSpend * (1 + Math.max(0, infl));

      let weightedReturn = (stockRet * (state.pctStocks / 100)) + 
                         (bondRet * (state.pctBonds / 100)) + 
                         (MARKET_BENCHMARKS.cash.mean * (state.pctCash / 100));

      if (state.actCashBuffer && stockRet < 0) {
        weightedReturn += 0.035;
      }

      let startBal = state.currentNestEgg;
      let afterSpend = startBal - effectiveSpend;
      let endBal = afterSpend * (1 + weightedReturn);

      state.currentNestEgg = Math.round(endBal);
      if (state.currentNestEgg > state.peakNestEgg) {
        state.peakNestEgg = state.currentNestEgg;
      }

      const container = document.getElementById('hud-visual-container');
      if (state.currentNestEgg <= 0) {
        state.yearsInCrashlineConsecutive++;
        state.totalCrashlineYears++;
        if (container) container.classList.add('crash-warning');

        showCopilotBanner(
          '🚨 EMERGENCIA EN DESPLOME: PERDIDA DE SUSTENTACIÓN',
          `¡Tu patrimonio neto cayó a $0 a los ${state.currentAge} Años! Te quedan ${10 - state.yearsInCrashlineConsecutive} año(s) en la zona de desplome antes del fin de juego. ¡Activa empleo parcial, reducción o recortes!`,
          '💡 Consejo: Activa Trabajo Parcial, Reducción de Vivienda o Recorte de Gastos para salir de la bancarrota $0.',
          'danger'
        );
        playSound('alert');
      } else {
        state.yearsInCrashlineConsecutive = 0;
        if (container) container.classList.remove('crash-warning');
      }

      state.historyLogs.push({
        age: state.currentAge,
        startBal: startBal,
        spend: effectiveSpend,
        returnPct: weightedReturn,
        endBal: state.currentNestEgg,
        inCrashline: state.currentNestEgg <= 0
      });

      const hudAge = document.getElementById('hud-current-age');
      if (hudAge) hudAge.innerText = state.currentAge;

      const hudVal = document.getElementById('hud-portfolio-val');
      if (hudVal) hudVal.innerText = '$' + state.currentNestEgg.toLocaleString();

      const curSwr = ((effectiveSpend / Math.max(1, state.currentNestEgg)) * 100).toFixed(1);
      const hudSwr = document.getElementById('hud-current-swr');
      if (hudSwr) hudSwr.innerText = state.currentNestEgg > 0 ? curSwr + '%' : 'CAÍDA';

      const crashCounter = document.getElementById('hud-crashline-counter');
      if (crashCounter) {
        crashCounter.innerText = `${state.yearsInCrashlineConsecutive} / 10 Años`;
        if (state.yearsInCrashlineConsecutive > 0) {
          crashCounter.className = 'text-red-400 font-bold text-sm animate-pulse';
        } else {
          crashCounter.className = 'text-emerald-400 font-bold text-sm';
        }
      }

      checkCopilotEvents(stockRet, infl);

      renderCanvas();

      if (state.yearsInCrashlineConsecutive >= 10) {
        finishFlightSimulation();
      }
    }

    function checkCopilotEvents(stockRet, infl) {
      if (state.currentNestEgg > 0) {
        if (stockRet < -0.15) {
          showCopilotBanner(
            '🚨 CAÍDA DE MERCADO: RIESGO DE SECUENCIA DE RENDIMIENTOS',
            `Las acciones cayeron un ${(stockRet * 100).toFixed(1)}% a los ${state.currentAge} años. ¡La alta exposición a acciones en mercados bajistas causa fuertes caídas!`,
            '💡 Consejo: Reequilibra hacia bonos o activa "Escudo de Efectivo" y "Trabajo Parcial".',
            'warning'
          );
        } else if (infl > 0.05) {
          showCopilotBanner(
            '🔥 PICO DE INFLACIÓN SHOCK',
            `La inflación saltó al ${(infl * 100).toFixed(1)}%, aumentando los costos de vida.`,
            '💡 Consejo: Mantén cierto crecimiento en acciones a largo plazo para superar la inflación.',
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
        banner.className = 'absolute top-3 left-3 right-3 p-3.5 rounded-xl bg-slate-900/95 border border-red-500/80 text-xs backdrop-blur-md shadow-2xl transition-all duration-300 flex items-start gap-3 border-l-4 border-l-red-500';
        if (icon) icon.className = 'fa-solid fa-triangle-exclamation text-red-400';
      } else if (type === 'warning') {
        banner.className = 'absolute top-3 left-3 right-3 p-3.5 rounded-xl bg-slate-900/95 border border-amber-500/80 text-xs backdrop-blur-md shadow-2xl transition-all duration-300 flex items-start gap-3 border-l-4 border-l-amber-500';
        if (icon) icon.className = 'fa-solid fa-fire text-amber-400';
      } else {
        banner.className = 'absolute top-3 left-3 right-3 p-3.5 rounded-xl bg-slate-900/95 border border-cyan-500/80 text-xs backdrop-blur-md shadow-2xl transition-all duration-300 flex items-start gap-3 border-l-4 border-l-cyan-500';
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
        title.innerText = '¡MISIÓN CUMPLIDA!';
        title.className = 'text-lg font-hud font-bold text-emerald-400';
        msg.innerText = `¡Felicitaciones Piloto ${state.pilotName}! ¡Aterrizaste con éxito a los 100 Años con $${state.currentNestEgg.toLocaleString()} en altitud de combustible restante!`;
        iconBox.className = 'w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl bg-emerald-950 text-emerald-400 border border-emerald-700 shadow-lg glow-green';
        icon.className = 'fa-solid fa-trophy';
        playSound('success');
      } else {
        title.innerText = '¡VUELO DESTRUIDO: BANCARROTA EN DESPLOME!';
        title.className = 'text-lg font-hud font-bold text-red-400';
        msg.innerText = `Piloto ${state.pilotName}, tu vuelo permaneció en la zona de desplome de $0 durante 10 años consecutivos a los ${state.currentAge} años. ¡Tu portafolio se quedó sin combustible!`;
        iconBox.className = 'w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl bg-red-950 text-red-400 border border-red-700 shadow-lg glow-red';
        icon.className = 'fa-solid fa-plane-slash';
        playSound('crash');
      }

      if (pilotName) pilotName.innerText = state.pilotName;
      if (debriefCat) debriefCat.innerText = state.activePreset;
      if (finalBal) finalBal.innerText = '$' + Math.max(0, state.currentNestEgg).toLocaleString();
      if (years) years.innerText = survivedYears + ' Años (Edad ' + state.currentAge + ')';
      if (crashYrs) crashYrs.innerText = state.totalCrashlineYears + ' Año(s)';
      if (tacticYrs) tacticYrs.innerText = `${state.totalTacticYears} Años-Táctica (-${state.totalTacticYears * 75} pts)`;

      registerScoreToLeaderboard(state.pilotName, state.activePreset, reachedTarget, state.totalCrashlineYears, state.totalTacticYears, Math.max(0, state.currentNestEgg));

      modal.classList.remove('hidden');

      // The run is over and the button that started it is now behind a
      // full-screen overlay, so focus has to follow the debrief.
      title.setAttribute('tabindex', '-1');
      title.focus({ preventScroll: true });
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
       SISTEMA DE CLASIFICACIÓN POR CATEGORÍA
       ================================================================= */
    function getCategoryBonus(category) {
      if (category === 'Tight Lean FIRE') return 2000;
      if (category === 'High Risk SWR') return 1500;
      if (category === 'Custom Scenario') return 1000;
      if (category === 'Trinity Standard') return 800;
      if (category === 'Fat FIRE') return 200;
      return 1000;
    }

    function registerScoreToLeaderboard(pilot, category, reached100, crashYears, tacticYears, finalBalance) {
      let baseScore = reached100 ? 5000 : 1000;
      let catBonus = getCategoryBonus(category);
      let crashPenalty = crashYears * 500;
      let tacticPenalty = (tacticYears || 0) * 75;
      let wealthBonus = Math.round(finalBalance / 2500);

      let score = baseScore + catBonus - crashPenalty - tacticPenalty + wealthBonus;
      score = Math.max(100, score);

      leaderboardScores.push({
        pilot: pilot,
        category: category || 'Custom Scenario',
        reached100: reached100,
        crashYears: crashYears,
        tacticYears: tacticYears || 0,
        finalBalance: finalBalance,
        score: score
      });

      leaderboardScores.sort((a, b) => b.score - a.score);

      renderLeaderboardTable();
    }

    function filterLeaderboard(cat) {
      activeLeaderboardFilter = cat;
      const categories = ['ALL', 'High Risk SWR', 'Trinity Standard', 'Tight Lean FIRE', 'Fat FIRE', 'Custom Scenario'];
      categories.forEach(c => {
        const btn = document.getElementById('lb-filter-' + c);
        if (btn) {
          if (c === cat) {
            btn.className = 'px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold transition';
          } else {
            btn.className = 'px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition';
          }
        }
      });
      renderLeaderboardTable();
      playSound('click');
    }

    function getCategoryBadgeHTML(cat) {
      if (cat === 'High Risk SWR') {
        return `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800"><i class="fa-solid fa-fire text-red-400 mr-1"></i>SWR Alto Riesgo</span>`;
      } else if (cat === 'Trinity Standard') {
        return `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800"><i class="fa-solid fa-shield-halved text-cyan-400 mr-1"></i>Estándar Trinity</span>`;
      } else if (cat === 'Tight Lean FIRE') {
        return `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800"><i class="fa-solid fa-leaf text-emerald-400 mr-1"></i>Lean FIRE Ajustado</span>`;
      } else if (cat === 'Fat FIRE') {
        return `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800"><i class="fa-solid fa-crown text-purple-400 mr-1"></i>Fat FIRE Holgado</span>`;
      } else {
        return `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700"><i class="fa-solid fa-sliders mr-1"></i>Escenario Personalizado</span>`;
      }
    }

    function renderLeaderboardTable() {
      const tbody = document.getElementById('leaderboard-table-body');
      if (!tbody) return;

      tbody.innerHTML = '';

      const filtered = activeLeaderboardFilter === 'ALL'
        ? leaderboardScores
        : leaderboardScores.filter(e => e.category === activeLeaderboardFilter);

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="py-6 text-center text-slate-400 font-sans">
              No hay registros de vuelo para <strong>${activeLeaderboardFilter}</strong>. ¡Vuela este escenario para marcar la primera puntuación!
            </td>
          </tr>
        `;
        return;
      }

      filtered.forEach((entry, idx) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-900/80 transition';
        
        let rankBadge = `<span class="font-bold text-slate-400">#${idx + 1}</span>`;
        if (idx === 0) rankBadge = `<span class="font-bold text-amber-400"><i class="fa-solid fa-crown mr-1" aria-hidden="true"></i> #1</span>`;
        if (idx === 1) rankBadge = `<span class="font-bold text-slate-300"><i class="fa-solid fa-medal mr-1" aria-hidden="true"></i> #2</span>`;
        if (idx === 2) rankBadge = `<span class="font-bold text-amber-600"><i class="fa-solid fa-award mr-1" aria-hidden="true"></i> #3</span>`;

        row.innerHTML = `
          <td class="py-3 px-3 font-hud">${rankBadge}</td>
          <td class="py-3 px-3 font-bold text-white">${entry.pilot}</td>
          <td class="py-3 px-3">${getCategoryBadgeHTML(entry.category)}</td>
          <td class="py-3 px-3 font-bold">${entry.reached100 ? '<span class="text-emerald-400"><i class="fa-solid fa-circle-check"></i> SÍ</span>' : '<span class="text-red-400"><i class="fa-solid fa-circle-xmark"></i> NO</span>'}</td>
          <td class="py-3 px-3 text-red-400 font-bold">${entry.crashYears} Año(s)</td>
          <td class="py-3 px-3 text-amber-300 font-bold">${entry.tacticYears || 0} Años-Táctica</td>
          <td class="py-3 px-3 text-emerald-400 font-bold">$${entry.finalBalance.toLocaleString()}</td>
          <td class="py-3 px-3 text-amber-400 font-bold font-hud">${entry.score.toLocaleString()} pts</td>
        `;
        tbody.appendChild(row);
      });
    }

    function clearLeaderboard() {
      leaderboardScores = [];
      renderLeaderboardTable();
      playSound('click');
    }

    /* =================================================================
       VISUALIZADOR HUD EN CANVAS Y DIBUJO DE TRAYECTORIA
       ================================================================= */
    function renderCanvas() {
      const canvas = document.getElementById('flightCanvas');
      if (!canvas || !canvas.parentElement) return;

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
        skyGrad.addColorStop(0, '#7f1d1d');
        skyGrad.addColorStop(1, '#020617');
        if (canvasStatusText) {
          canvasStatusText.innerText = `EMERGENCIA EN DESPLOME: ¡${state.yearsInCrashlineConsecutive}/10 Años en Bancarrota $0!`;
          if (canvasStatusDot) canvasStatusDot.className = 'w-2 h-2 rounded-full bg-red-500 animate-ping';
        }
      } else if (healthRatio > 0.8) {
        skyGrad.addColorStop(0, '#0a192f');
        skyGrad.addColorStop(1, '#020c1b');
        if (canvasStatusText) {
          canvasStatusText.innerText = 'Atmósfera: Cielos Despejados y Altitud Segura';
          if (canvasStatusDot) canvasStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
        }
      } else {
        skyGrad.addColorStop(0, '#1e1b4b');
        skyGrad.addColorStop(1, '#0f172a');
        if (canvasStatusText) {
          canvasStatusText.innerText = 'Atmósfera: Turbulencia Leve / Precaución de Altitud';
          if (canvasStatusDot) canvasStatusDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
        }
      }

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      const maxVal = Math.max(state.nestEgg * 2.2, state.peakNestEgg * 1.2);
      const topY = 40;
      const bottomY = H - 35;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;

      const numGridLines = 4;
      for (let i = 0; i <= numGridLines; i++) {
        const y = bottomY - (i / numGridLines) * (bottomY - topY);
        const dollarVal = (i / numGridLines) * maxVal;

        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(W, y);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '9px Orbitron';
        ctx.fillText('$' + (dollarVal / 1000).toFixed(0) + 'k', 8, y + 3);
      }

      const totalYears = Math.max(1, state.targetAge - state.startAge);
      const startX = 60;
      const endX = W - 30;

      ctx.fillStyle = '#64748b';
      ctx.font = '10px Orbitron';
      for (let age = state.startAge; age <= state.targetAge; age += 10) {
        const pct = (age - state.startAge) / totalYears;
        const x = startX + pct * (endX - startX);
        ctx.fillText(`Edad ${age}`, x - 18, H - 12);
      }

      if (state.historyLogs.length > 0) {
        const lastLog = state.historyLogs[state.historyLogs.length - 1];
        const prevBal = state.historyLogs.length > 1 ? state.historyLogs[state.historyLogs.length - 2].endBal : state.nestEgg;
        const deltaBal = lastLog.endBal - prevBal;

        if (pitchBadge) {
          if (state.yearsInCrashlineConsecutive > 0) {
            pitchBadge.innerHTML = `<span class="text-red-400 font-bold animate-pulse"><i class="fa-solid fa-plane-circle-exclamation"></i> 🚨 PERDIDA SUSTENTACIÓN</span>`;
          } else if (deltaBal > 10000) {
            pitchBadge.innerHTML = `<span class="text-emerald-400"><i class="fa-solid fa-arrow-trend-up"></i> 🛫 ASCENDIENDO</span>`;
          } else if (deltaBal >= -5000) {
            pitchBadge.innerHTML = `<span class="text-cyan-300"><i class="fa-solid fa-arrow-right"></i> ✈️ CRUCERO NIVELADO</span>`;
          } else {
            pitchBadge.innerHTML = `<span class="text-amber-400"><i class="fa-solid fa-arrow-trend-down"></i> 📉 DESCENDIENDO</span>`;
          }
        }

        ctx.beginPath();
        ctx.strokeStyle = state.yearsInCrashlineConsecutive > 0 ? '#ef4444' : '#06b6d4';
        ctx.lineWidth = 3;

        const startY = bottomY - ((state.nestEgg / maxVal) * (bottomY - topY));
        ctx.moveTo(startX, startY);

        state.historyLogs.forEach((log, idx) => {
          const x = startX + ((idx + 1) / totalYears) * (endX - startX);
          const y = bottomY - (Math.max(0, log.endBal) / maxVal) * (bottomY - topY);
          ctx.lineTo(x, y);
        });

        ctx.stroke();

        const lastIdx = state.historyLogs.length - 1;
        const lastX = startX + ((lastIdx + 1) / totalYears) * (endX - startX);
        const lastY = bottomY - (Math.max(0, state.historyLogs[lastIdx].endBal) / maxVal) * (bottomY - topY);

        ctx.lineTo(lastX, bottomY);
        ctx.lineTo(startX, bottomY);
        ctx.closePath();

        let fillGrad = ctx.createLinearGradient(0, 0, 0, H);
        fillGrad.addColorStop(0, state.yearsInCrashlineConsecutive > 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(6, 182, 212, 0.25)');
        fillGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
        ctx.fillStyle = fillGrad;
        ctx.fill();

        drawAirplane(ctx, lastX, lastY, state.yearsInCrashlineConsecutive > 0 ? 0.1 : healthRatio);
      } else {
        const startY = bottomY - ((state.nestEgg / maxVal) * (bottomY - topY));
        drawAirplane(ctx, startX, startY, 1.0);
        if (pitchBadge) {
          pitchBadge.innerHTML = `<span class="text-emerald-400">🛫 LISTO EN PISTA</span>`;
        }
      }

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, bottomY);
      ctx.lineTo(W, bottomY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef4444';
      ctx.font = '10px Orbitron';
      ctx.fillText('ZONA CRASHLINE (BANCARROTA $0)', 65, bottomY - 6);
    }

    function drawAirplane(ctx, x, y, healthRatio) {
      ctx.save();
      ctx.translate(x, y);

      ctx.shadowColor = healthRatio > 0.3 ? '#06b6d4' : '#ef4444';
      ctx.shadowBlur = 12;

      ctx.fillStyle = healthRatio > 0.3 ? '#38bdf8' : '#f87171';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
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
       MANEJADORES DE CALCULADORAS
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
      if (totalEl) totalEl.innerText = '$' + Math.round(totalAnnual).toLocaleString() + ' / año';
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
        formulaEl.innerText = `$${Math.round(spend).toLocaleString()} × ${multiplier.toFixed(1)} = $${Math.round(requiredEgg).toLocaleString()} (Regla del ${multiplier.toFixed(1)}x)`;
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
       PESTAÑA 3: SIMULADOR MONTE CARLO DE 1.000 CORRIDAS
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

      const tbody = document.getElementById('mc-table-body');
      if (tbody) {
        tbody.innerHTML = '';
        [10, 20, 30, 40, 50].forEach(y => {
          if (y <= totalYears) {
            let arr = trajectorySnapshots[y].sort((a, b) => a - b);
            let n = arr.length;
            let row = document.createElement('tr');
            row.className = 'hover:bg-slate-900/60 transition';
            row.innerHTML = `
              <td class="py-2.5 px-3 font-bold text-white">Edad ${state.startAge + y} (${y} Años)</td>
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
       FUNCIONES MATEMÁTICAS Y NAVEGACIÓN DE PESTAÑAS
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
          btnEl.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold font-hud text-slate-400 hover:text-white transition';
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
        activeBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold font-hud text-cyan-400 bg-cyan-950/80 border border-cyan-800 transition';
        activeBtn.setAttribute('aria-selected', 'true');
        activeBtn.setAttribute('tabindex', '0');
        if (focusTab) activeBtn.focus();
      }

      if (tabKey === 'cockpit') {
        renderCanvas();
      } else if (tabKey === 'leaderboard') {
        renderLeaderboardTable();
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
       SINTETIZADOR DE SONIDO WEBAUDIO
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
        // AudioContext no disponible o bloqueado por navegador
      }
    }
