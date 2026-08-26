// GAME STATE
        let monthsPassed = 0; // Increments in steps of 12 (Years)
        let cash = 10000;
        let baseMonthlySalary = 3200; // Household Active Salary baseline
        let pieChartInstance = null;

        // ASSET DATA DEFINITIONS (SPANISH TRANSLATION)
        const assets = [
            { id: 'dividend_etf', name: 'ETF de Dividendos', icon: 'fa-chart-line', unitCost: 1000, baseYield: 4, monthlyYieldPerUnit: 4, ownedUnits: 0, desc: 'Índice de dividendos del mercado. Los pagos se componen y crecen orgánicamente.', riskText: 'Bajo Riesgo / Crecimiento Cts.' },
            { id: 'bonds', name: 'Bonos del Tesoro', icon: 'fa-building-columns', unitCost: 500, baseYield: 2, monthlyYieldPerUnit: 2, ownedUnits: 0, desc: 'Respaldados por el gobierno. Rinde más en ciclos de altas tasas.', riskText: 'Garantizado / Seguro' },
            { id: 'rental_property', name: 'Condominio Alquiler', icon: 'fa-city', unitCost: 15000, baseYield: 110, monthlyYieldPerUnit: 110, ownedUnits: 0, desc: 'Flujo inmobiliario. Sujeto a costos ocasionales de reparación.', riskText: 'Riesgo Medio / Flujo Caja' },
            { id: 'reit_index', name: 'Índice REIT', icon: 'fa-building', unitCost: 2500, baseYield: 16, monthlyYieldPerUnit: 16, ownedUnits: 0, desc: 'Fondo de inversión inmobiliaria. Pagos mensuales constantes.', riskText: 'Riesgo Moderado / Bienes Raíces' },
            { id: 'digital_business', name: 'Negocio en Línea', icon: 'fa-laptop-code', unitCost: 5000, baseYield: 65, monthlyYieldPerUnit: 65, ownedUnits: 0, desc: 'E-commerce digital. Alto rendimiento, sensible a costos publicitarios.', riskText: 'Alto Rendimiento / Volátil' },
            { id: 'bitcoin', name: 'Bitcoin (BTC)', icon: 'fa-brands fa-bitcoin', unitCost: 4000, baseYield: 15, monthlyYieldPerUnit: 15, ownedUnits: 0, desc: 'Criptoactivo. Grandes auges alcistas, presión en ciclos bajistas.', riskText: 'Alta Volatilidad / Especulativo' }
        ];

        /* =================================================================
           CLASIFICACIÓN GLOBAL (una sola tabla, todos los visitantes, todos
           los idiomas). Se lee y se escribe en /api/simulator-leaderboard.
           ================================================================= */
        const LEADERBOARD_SIMULATOR = 'passive-income-engine';

        // 'loading' while the request is in flight, 'error' when it failed,
        // 'ready' otherwise. An empty board and an unreachable one both draw no
        // rows and mean opposite things, so they are not the same state.
        let leaderboardEntries = [];
        let leaderboardState = 'loading';

        // FAMILY & LIFE CYCLE STATE
        let familyState = {
            hasKid: false,
            kidAgeMonths: 0,
            kidEventTriggered: false,
            hasPet: false,
            hasElderCare: false,
            promotionTriggered: false,
            inflationMultiplier: 1.0,
            totalJoyAccumulated: 0
        };

        let currentLifestyle = {
            housing: 'standard',
            transport: 'used',
            lifestyle: 'balanced',
            subscriptions: 'standard',
            travel: 'annual',
            shopping: 'standard'
        };

        const lifestyleCosts = {
            housing: { modest: 800, standard: 1200, luxury: 2200 },
            transport: { public: 100, used: 300, lease: 800 },
            lifestyle: { frugal: 300, balanced: 500, lavish: 1100 },
            subscriptions: { basic: 30, standard: 120, unlimited: 350 },
            travel: { staycation: 100, annual: 300, luxury: 750 },
            shopping: { minimal: 100, standard: 250, luxury: 650 }
        };

        // LIFESTYLE JOY / HAPPINESS POINTS
        const lifestyleHappiness = {
            housing: { modest: 5, standard: 15, luxury: 30 },
            transport: { public: 2, used: 8, lease: 20 },
            lifestyle: { frugal: 5, balanced: 15, lavish: 30 },
            subscriptions: { basic: 2, standard: 8, unlimited: 18 },
            travel: { staycation: 3, annual: 12, luxury: 25 },
            shopping: { minimal: 2, standard: 8, luxury: 18 }
        };

        function getHappinessScore() {
            return lifestyleHappiness.housing[currentLifestyle.housing] +
                   lifestyleHappiness.transport[currentLifestyle.transport] +
                   lifestyleHappiness.lifestyle[currentLifestyle.lifestyle] +
                   lifestyleHappiness.subscriptions[currentLifestyle.subscriptions] +
                   lifestyleHappiness.travel[currentLifestyle.travel] +
                   lifestyleHappiness.shopping[currentLifestyle.shopping];
        }

        function getMonthlyExpenses() {
            let base = lifestyleCosts.housing[currentLifestyle.housing] +
                       lifestyleCosts.transport[currentLifestyle.transport] +
                       lifestyleCosts.lifestyle[currentLifestyle.lifestyle] +
                       lifestyleCosts.subscriptions[currentLifestyle.subscriptions] +
                       lifestyleCosts.travel[currentLifestyle.travel] +
                       lifestyleCosts.shopping[currentLifestyle.shopping];

            // Parenting stage expense additions
            if (familyState.hasKid) {
                const ageYears = Math.floor(familyState.kidAgeMonths / 12);
                if (ageYears < 6) base += 500;        // Baby / Toddler
                else if (ageYears < 13) base += 750;  // Primary School
                else base += 1000;                    // Teenager
            }

            // Pet extra expenses
            if (familyState.hasPet) {
                base += 120;
            }

            // Eldercare support for aging parents
            if (familyState.hasElderCare) {
                base += 250;
            }

            // Apply macro inflation creep
            base = base * familyState.inflationMultiplier;

            return Math.round(base);
        }

        function getTotalMonthlyPassiveIncome() {
            return assets.reduce((sum, asset) => sum + (asset.ownedUnits * asset.monthlyYieldPerUnit), 0);
        }

        function getTotalInvestedCapital() {
            return assets.reduce((sum, asset) => sum + (asset.ownedUnits * asset.unitCost), 0);
        }

        function getNetWorth() {
            return cash + getTotalInvestedCapital();
        }

        function getNetMonthlySurplus() {
            return baseMonthlySalary + getTotalMonthlyPassiveIncome() - getMonthlyExpenses();
        }

        function getFreedomCoveragePct() {
            const exp = getMonthlyExpenses();
            if (exp === 0) return 100;
            return Math.min(100, (getTotalMonthlyPassiveIncome() / exp) * 100);
        }

        function advanceTime(months = 12) {
            let eventLogs = [];
            monthsPassed += 12;

            const joyScore = getHappinessScore();
            familyState.totalJoyAccumulated += joyScore * 12;

            // 1. DYNAMIC INFLATION CREEP (Every 2 years / 24 months)
            if (monthsPassed % 24 === 0) {
                const oldExpenses = getMonthlyExpenses();
                familyState.inflationMultiplier *= 1.04; // +4% inflation
                const newExpenses = getMonthlyExpenses();
                const expDiff = newExpenses - oldExpenses;
                eventLogs.push(`💸 <strong>Inflación Progresiva (+4%):</strong> La inflación macroeconómica aumentó los gastos del hogar en <strong>+$${expDiff.toLocaleString()}/mes</strong> (Nuevos Gastos: $${newExpenses.toLocaleString()}/mes).`);
            }

            // 2. HAPPINESS / LIFE JOY COMPENSATION EFFECTS
            if (joyScore >= 70) { 
                if (Math.random() < 0.40) {
                    const bonus = Math.floor(Math.random() * 2500) + 2000;
                    cash += bonus;
                    eventLogs.push(`🌟 <strong>¡Impulso por Alta Alegría de Vivir!</strong> Tu alto bienestar y buena energía en el trabajo te valieron un Bono de Rendimiento de <strong>+$${bonus.toLocaleString()}</strong> al Efectivo Disponible.`);
                }
            } else if (joyScore < 30) {
                if (Math.random() < 0.30) {
                    const burnoutCost = 1200;
                    if (cash >= burnoutCost) cash -= burnoutCost;
                    eventLogs.push(`😫 <strong>Agotamiento por Frugalidad:</strong> La privación excesiva generó estrés acumulado. Gastaste <strong>-$${burnoutCost.toLocaleString()}</strong> en salud, terapias y descanso.`);
                }
            }

            // 3. FAMILY & LIFE CYCLE STAGES
            if (!familyState.hasKid && !familyState.kidEventTriggered && monthsPassed >= 24) {
                if (Math.random() < 0.25 || monthsPassed === 48) {
                    familyState.hasKid = true;
                    familyState.kidEventTriggered = true;
                    familyState.kidAgeMonths = 0;

                    if (currentLifestyle.housing === 'modest') {
                        currentLifestyle.housing = 'standard';
                        document.getElementById('housingSelect').value = 'standard';
                    }
                    
                    eventLogs.push(`🍼 <strong>Evento de Vida: ¡Nació un Bebé!</strong> Se añadieron <strong>+$500/mes</strong> en gastos por guardería, pañales y cuidado infantil.`);
                }
            } else if (familyState.hasKid) {
                const prevAgeYears = Math.floor(familyState.kidAgeMonths / 12);
                familyState.kidAgeMonths += 12;
                const newAgeYears = Math.floor(familyState.kidAgeMonths / 12);

                if (newAgeYears >= 18) {
                    familyState.hasKid = false;
                    eventLogs.push(`🎓 <strong>¡Nido Vacío!</strong> Tu hijo cumplió 18 años y se mudó a la universidad. ¡Los gastos cayeron <strong>-$1,000/mes</strong>!`);
                } else if (prevAgeYears < 6 && newAgeYears >= 6) {
                    eventLogs.push(`🎒 <strong>Etapa Escolar:</strong> Tu hijo ingresó a la escuela primaria. Los gastos aumentaron <strong>+$250/mes</strong> (+$750/mes presupuesto total hijo) en útiles y deportes.`);
                } else if (prevAgeYears < 13 && newAgeYears >= 13) {
                    eventLogs.push(`🎧 <strong>Etapa Adolescente:</strong> Pasatiempos, tecnología y ropa aumentaron los gastos del hijo en <strong>+$250/mes</strong> (+$1,000/mes presupuesto total).`);
                }
            }

            // Career Promotion
            const promotionChance = joyScore >= 50 ? 0.40 : 0.20;
            if (!familyState.promotionTriggered && monthsPassed >= 36 && Math.random() < promotionChance) {
                familyState.promotionTriggered = true;
                const raiseAmount = 400;
                baseMonthlySalary += raiseAmount;
                eventLogs.push(`💼 <strong>¡Promoción Profesional!</strong> ¡Aumento de sueldo! El salario activo del hogar subió <strong>+$${raiseAmount}/mes</strong> (Nuevo Salario: $${baseMonthlySalary.toLocaleString()}/mes).`);
            }

            // Pet Adoption
            if (!familyState.hasPet && monthsPassed >= 60 && Math.random() < 0.15) {
                familyState.hasPet = true;
                eventLogs.push(`🐶 <strong>¡Adoptaste una Mascota!</strong> Se añadieron <strong>+$120/mes</strong> en comida, veterinario y seguro de mascota.`);
            }

            // Aging Parents Healthcare Support
            if (!familyState.hasElderCare && monthsPassed >= 120 && Math.random() < 0.20) {
                familyState.hasElderCare = true;
                eventLogs.push(`👴 <strong>Apoyo a Padres Mayores:</strong> Asumiste apoyo médico mensual para tus padres, añadiendo <strong>+$250/mes</strong> a los gastos.`);
            }

            // 4. OUT-OF-POCKET EXPENSE SHOCKS & WINDFALLS
            const shockRoll = Math.random();
            if (shockRoll < 0.10 && cash >= 1000) {
                const cost = Math.floor(Math.random() * 800) + 1000;
                cash -= cost;
                eventLogs.push(`🏥 <strong>Emergencia Médica / Dental:</strong> Factura de salud inesperada descontó <strong>-$${cost.toLocaleString()}</strong> del Efectivo.`);
            } else if (shockRoll >= 0.10 && shockRoll < 0.20 && cash >= 1200) {
                const cost = Math.floor(Math.random() * 1000) + 1200;
                cash -= cost;
                eventLogs.push(`🚗 <strong>Reparación Mecánica Mayor:</strong> Se descontaron <strong>-$${cost.toLocaleString()}</strong> del Efectivo por el vehículo.`);
            } else if (shockRoll >= 0.20 && shockRoll < 0.28 && cash >= 1500) {
                const cost = Math.floor(Math.random() * 1200) + 1600;
                cash -= cost;
                eventLogs.push(`🏛️ <strong>Aumento de Impuestos de Propiedad:</strong> Ajuste anual de impuestos descontó <strong>-$${cost.toLocaleString()}</strong> del Efectivo.`);
            } else if (shockRoll >= 0.28 && shockRoll < 0.33) {
                const bonus = Math.floor(Math.random() * 2000) + 1500;
                cash += bonus;
                eventLogs.push(`💻 <strong>¡Ingreso Extra por Proyecto Freelance!</strong> Sumaste un bono de <strong>+$${bonus.toLocaleString()}</strong> en efectivo.`);
            } else if (shockRoll >= 0.33 && shockRoll < 0.38) {
                const inheritance = Math.floor(Math.random() * 5000) + 6000;
                cash += inheritance;
                eventLogs.push(`🎁 <strong>¡Herencia o Regalo Familiar!</strong> Recibiste una suma de <strong>+$${inheritance.toLocaleString()}</strong> a tu Efectivo Disponible.`);
            } else if (shockRoll >= 0.38 && shockRoll < 0.42) {
                const taxBonus = Math.floor(Math.random() * 1500) + 1200;
                cash += taxBonus;
                eventLogs.push(`🧾 <strong>Reembolso de Impuestos y Bono:</strong> Retorno fiscal y evaluación anual acreditaron <strong>+$${taxBonus.toLocaleString()}</strong> en efectivo.`);
            }

            // 5. ASSET DYNAMICS
            // Dividend ETF Organic Compounding
            const divEtf = assets.find(a => a.id === 'dividend_etf');
            if (divEtf) {
                const compoundRate = 1 + (0.035 + Math.random() * 0.03);
                const oldYield = divEtf.monthlyYieldPerUnit;
                divEtf.monthlyYieldPerUnit = parseFloat((divEtf.monthlyYieldPerUnit * compoundRate).toFixed(1));
                const yieldDiff = (divEtf.monthlyYieldPerUnit - oldYield).toFixed(1);
                if (divEtf.ownedUnits > 0) {
                    const totalEtfBoost = (yieldDiff * divEtf.ownedUnits).toFixed(0);
                    eventLogs.push(`📈 <strong>¡Crecimiento de Dividendos!</strong> Las empresas aumentaron pagos (+${((compoundRate - 1)*100).toFixed(1)}%). El rendimiento subió +$${yieldDiff}/mes por unidad (Impulso total: <strong>+$${totalEtfBoost}/mes</strong>).`);
                }
            }

            // Treasury Bonds Rate Cycles
            const bonds = assets.find(a => a.id === 'bonds');
            if (Math.random() < 0.25) {
                if (bonds) {
                    bonds.monthlyYieldPerUnit = 3.2;
                    bonds.riskText = 'Ciclo de Altas Tasas (7.7% APY)';
                    if (bonds.ownedUnits > 0) {
                        const bondBoost = ((3.2 - bonds.baseYield) * bonds.ownedUnits).toFixed(0);
                        eventLogs.push(`🏦 <strong>Alza de Tasas del Banco Central:</strong> El rendimiento de los Bonos subió a <strong>+$3.2/unidad</strong> (7.7% APY). Añadió <strong>+$${bondBoost}/mes</strong> al flujo pasivo.`);
                    }
                }
            } else if (bonds) {
                bonds.monthlyYieldPerUnit = bonds.baseYield;
                bonds.riskText = 'Garantizado / Seguro';
            }

            // Bitcoin Single Evaluation
            const btc = assets.find(a => a.id === 'bitcoin');
            if (btc) {
                const btcRoll = Math.random();
                if (btcRoll < 0.28) {
                    btc.monthlyYieldPerUnit = 65;
                    if (btc.ownedUnits > 0) {
                        const btcGain = ((65 - btc.baseYield) * btc.ownedUnits).toFixed(0);
                        eventLogs.push(`🚀 <strong>Mercado Alcista en Bitcoin:</strong> ¡El rally elevó el flujo a +$65/unidad/mes! Añadió <strong>+$${btcGain}/mes</strong> a tu ingreso pasivo.`);
                    }
                } else if (btcRoll < 0.52) {
                    btc.monthlyYieldPerUnit = -15;
                    if (btc.ownedUnits > 0) {
                        const btcLoss = (Math.abs(-15 - btc.baseYield) * btc.ownedUnits).toFixed(0);
                        eventLogs.push(`📉 <strong>Mercado Bajista en Bitcoin:</strong> Corrección temporal de precio (-$15/unidad/mes). Redujo el flujo pasivo en <strong>-$${btcLoss}/mes</strong>.`);
                    }
                } else {
                    btc.monthlyYieldPerUnit = btc.baseYield;
                }
            }

            // Digital Business
            const biz = assets.find(a => a.id === 'digital_business');
            if (biz) {
                const bizRoll = Math.random();
                if (bizRoll < 0.25) {
                    biz.monthlyYieldPerUnit = 120;
                    if (biz.ownedUnits > 0) {
                        eventLogs.push(`🚀 <strong>Auge en Negocio Digital:</strong> Lanzamiento exitoso elevó el rendimiento a +$120/unidad/mes este año.`);
                    }
                } else if (bizRoll < 0.45) {
                    biz.monthlyYieldPerUnit = 35;
                    if (biz.ownedUnits > 0) {
                        eventLogs.push(`⚠️ <strong>Aumento de Costos Publicitarios:</strong> Mayor competencia redujo el rendimiento del negocio a +$35/unidad/mes este año.`);
                    }
                } else {
                    biz.monthlyYieldPerUnit = biz.baseYield;
                }
            }

            // Condo Repair
            const condo = assets.find(a => a.id === 'rental_property');
            if (condo && condo.ownedUnits > 0 && Math.random() < 0.20) {
                const repairCost = Math.floor(Math.random() * 1500) + 1000;
                if (cash >= repairCost) {
                    cash -= repairCost;
                    eventLogs.push(`🛠️ <strong>Reparación en Condominio:</strong> Pago de mantenimiento de emergencia: <strong>-$${repairCost.toLocaleString()}</strong> del Efectivo Disponible.`);
                }
            }

            // 6. CASH SURPLUS ACCUMULATION
            const netMonthly = baseMonthlySalary + getTotalMonthlyPassiveIncome() - getMonthlyExpenses();
            const annualNetAdded = netMonthly * 12;
            cash += annualNetAdded;

            // UPDATE UI FEEDBACK
            const toast = document.getElementById('turnSummaryToast');
            const toastTitle = document.getElementById('turnSummaryTitle');
            const toastText = document.getElementById('turnSummaryText');
            const eventLogList = document.getElementById('eventLogList');
            
            if (toast && toastText) {
                const yearsPassedStr = `Año ${Math.floor(monthsPassed / 12)}`;
                toastTitle.innerText = `Período Avanzado (${yearsPassedStr})`;
                toastText.innerHTML = `Superávit neto acumulado: <strong class="font-mono text-emerald-800">${annualNetAdded >= 0 ? '+' : ''}$${Math.round(annualNetAdded).toLocaleString()}</strong> (${netMonthly >= 0 ? '+' : ''}$${Math.round(netMonthly).toLocaleString()}/mes x 12 meses sumados al Efectivo).`;

                if (eventLogs.length > 0) {
                    eventLogList.classList.remove('hidden');
                    eventLogList.innerHTML = eventLogs.map(e => `
                        <div class="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-950">${e}</div>
                    `).join('');
                } else {
                    eventLogList.classList.add('hidden');
                    eventLogList.innerHTML = '';
                }

                toast.classList.remove('hidden');
            }

            renderUI();

            if (getTotalMonthlyPassiveIncome() >= getMonthlyExpenses() && getMonthlyExpenses() > 0) {
                triggerCrossoverVictory();
            }
        }

        function toggleHowToPlayModal() {
            const modal = document.getElementById('howToPlayModal');
            if (modal) modal.classList.toggle('hidden');
        }

        function toggleLeaderboardModal() {
            const modal = document.getElementById('leaderboardModal');
            if (modal) {
                modal.classList.toggle('hidden');
                if (!modal.classList.contains('hidden')) {
                    loadLeaderboard();
                }
            }
        }

        function loadLeaderboard() {
            leaderboardState = 'loading';
            renderLeaderboardTable();

            window.SimLeaderboard.load(LEADERBOARD_SIMULATOR, 'ALL')
                .then((entries) => {
                    leaderboardEntries = entries;
                    leaderboardState = 'ready';
                    renderLeaderboardTable();
                })
                .catch(() => {
                    leaderboardState = 'error';
                    renderLeaderboardTable();
                });
        }

        function leaderboardNoticeRow(message) {
            return `
                <tr>
                    <td colspan="4" class="p-4 text-center text-espresso-800/70 font-medium">${message}</td>
                </tr>
            `;
        }

        function renderLeaderboardTable() {
            const container = document.getElementById('leaderboardTableBody');
            if (!container) return;

            if (leaderboardState === 'loading') {
                container.innerHTML = leaderboardNoticeRow('Cargando el Salón de la Fama global…');
                return;
            }
            if (leaderboardState === 'error') {
                container.innerHTML = leaderboardNoticeRow('No se pudo acceder al Salón de la Fama. Inténtalo de nuevo en un momento.');
                return;
            }
            if (leaderboardEntries.length === 0) {
                container.innerHTML = leaderboardNoticeRow('Todavía nadie ha alcanzado el cruce. Llega tú y la primera línea será tuya.');
                return;
            }

            container.innerHTML = '';
            // The list arrives ranked by the endpoint - fewest months first, and
            // the larger net worth ahead where two runs took the same time - so
            // there is nothing to sort here. Sorting a second time on the client
            // is how the page and the board start disagreeing about who won.
            leaderboardEntries.forEach((entry, idx) => {
                const yrs = Math.floor(entry.score / 12);
                const timeStr = yrs > 0 ? `${yrs} Años (${entry.score}m)` : `${entry.score} Meses`;

                let rankBadge = `<span class="font-bold font-mono text-espresso-800">${idx + 1}</span>`;
                if (idx === 0) rankBadge = `<i class="fa-solid fa-crown text-amber-500 text-sm" aria-hidden="true"></i>`;
                else if (idx === 1) rankBadge = `<i class="fa-solid fa-medal text-slate-400 text-sm" aria-hidden="true"></i>`;
                else if (idx === 2) rankBadge = `<i class="fa-solid fa-medal text-amber-700 text-sm" aria-hidden="true"></i>`;

                const isMine = window.SimLeaderboard.isMine(LEADERBOARD_SIMULATOR, entry.id);
                const tr = document.createElement('tr');
                tr.className = isMine
                    ? 'bg-gold-500/15 hover:bg-gold-500/25'
                    : (idx % 2 === 0 ? 'bg-cream-50/50 hover:bg-cream-100' : 'bg-cream-100/40 hover:bg-cream-100');
                tr.innerHTML = `
                    <td class="p-2.5 text-center">${rankBadge}</td>
                    <td class="p-2.5 font-semibold text-espresso-950">${window.SimLeaderboard.escapeHtml(entry.name)}${isMine ? ' <span class="text-[9px] font-bold uppercase tracking-wide text-gold-600">Tú</span>' : ''}</td>
                    <td class="p-2.5 text-center font-mono font-bold text-forest-800">${timeStr}</td>
                    <td class="p-2.5 text-right font-mono font-bold text-espresso-900">$${entry.tiebreak.toLocaleString()}</td>
                `;
                container.appendChild(tr);
            });
        }

        function submitPlayerScore() {
            const nameInput = document.getElementById('playerNameInput');
            const button = document.getElementById('submitScoreButton');
            const name = nameInput ? nameInput.value.trim() : '';
            if (!name) return;

            // One row per crossover. The button is a write to a table everybody
            // reads, so a second click while the first request is open is a
            // duplicate entry rather than a no-op.
            if (button) button.disabled = true;

            window.SimLeaderboard.submit({
                simulator: LEADERBOARD_SIMULATOR,
                board: 'ALL',
                name: name,
                score: monthsPassed,
                tiebreak: Math.round(getNetWorth())
            })
                .then((result) => {
                    leaderboardEntries = result.entries;
                    leaderboardState = 'ready';
                    renderLeaderboardTable();

                    const submitBox = document.getElementById('victoryLeaderboardSubmit');
                    if (submitBox) {
                        submitBox.innerHTML = `
                            <div class="text-center py-1 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5">
                                <i class="fa-solid fa-circle-check text-emerald-600" aria-hidden="true"></i>
                                ¡Tu partida ya está en el Salón de la Fama global!
                            </div>
                        `;
                    }

                    setTimeout(() => {
                        closeVictoryModal();
                        toggleLeaderboardModal();
                    }, 800);
                })
                .catch(() => {
                    // The run is not lost, only unsent. Saying so in the box the
                    // button lived in keeps the offer on screen to try again.
                    const submitBox = document.getElementById('victoryLeaderboardSubmit');
                    if (submitBox) {
                        const warning = document.createElement('p');
                        warning.className = 'text-[11px] font-bold text-rose-700';
                        warning.textContent = 'No se pudo enviar tu partida al Salón de la Fama. Comprueba tu conexión y vuelve a pulsar Guardar.';
                        submitBox.appendChild(warning);
                    }
                })
                .finally(() => {
                    if (button) button.disabled = false;
                });
        }

        // The board is shared, so the only sensible thing this button can do is
        // fetch it again. It used to overwrite the local copy with the seeded
        // one, which is a reset nobody else could see; wiping a table other
        // people are ranked in from a browser is not a reset, it is vandalism.
        function refreshLeaderboard() {
            loadLeaderboard();
        }

        function triggerCrossoverVictory() {
            const exp = getMonthlyExpenses();
            const pass = getTotalMonthlyPassiveIncome();
            const joyScore = getHappinessScore();
            
            document.getElementById('victoryPassive').innerText = `+$${Math.round(pass).toLocaleString()}/mes`;
            document.getElementById('victoryExpenses').innerText = `$${exp.toLocaleString()}/mes`;
            
            const yrs = Math.floor(monthsPassed / 12);
            document.getElementById('victoryTime').innerText = `${yrs} Años (${monthsPassed} Meses)`;
            document.getElementById('victoryNetWorth').innerText = `$${Math.round(getNetWorth()).toLocaleString()}`;

            // Life Joy Title
            const joyTitleElem = document.getElementById('victoryJoyTitle');
            if (joyTitleElem) {
                if (joyScore >= 75) {
                    joyTitleElem.innerHTML = `👑 <strong class="text-amber-700">Maestro de Riqueza y Alegría</strong> (${joyScore}/100 Alegría)`;
                } else if (joyScore >= 45) {
                    joyTitleElem.innerHTML = `⚖️ <strong class="text-emerald-700">Constructor Balanceado</strong> (${joyScore}/100 Alegría)`;
                } else {
                    joyTitleElem.innerHTML = `🪙 <strong class="text-rose-700">Asceta Frugal</strong> (${joyScore}/100 Alegría)`;
                }
            }

            document.getElementById('victoryModal').classList.remove('hidden');
        }

        function closeVictoryModal() {
            const modal = document.getElementById('victoryModal');
            if (modal) modal.classList.add('hidden');
        }

        function renderUI() {
            const exp = getMonthlyExpenses();
            const pass = getTotalMonthlyPassiveIncome();
            const coverage = getFreedomCoveragePct();
            const netSurplus = getNetMonthlySurplus();
            const joyScore = getHappinessScore();

            // Header stats
            document.getElementById('cashDisplay').innerText = `$${Math.round(cash).toLocaleString()}`;
            document.getElementById('activeDisplay').innerText = `$${baseMonthlySalary.toLocaleString()}/mes`;
            document.getElementById('expensesDisplay').innerText = `$${exp.toLocaleString()}/mes`;
            document.getElementById('passiveDisplay').innerText = `+$${Math.round(pass).toLocaleString()}/mes`;
            document.getElementById('freedomPctDisplay').innerText = `${coverage.toFixed(1)}%`;
            document.getElementById('freedomProgressBar').style.width = `${coverage}%`;
            document.getElementById('marketplaceCash').innerText = `$${Math.round(cash).toLocaleString()}`;

            // Life Joy Card Update
            const joyDisplay = document.getElementById('happinessDisplay');
            const joySubtext = document.getElementById('happinessSubtext');
            if (joyDisplay && joySubtext) {
                joyDisplay.innerText = `${joyScore} / 100`;
                if (joyScore >= 70) {
                    joySubtext.innerText = 'Alta energía • Impulso de bonos!';
                    joySubtext.className = 'block text-[9px] text-emerald-800 font-bold mt-0.5';
                } else if (joyScore >= 40) {
                    joySubtext.innerText = 'Balanceado • Ritmo sostenible';
                    joySubtext.className = 'block text-[9px] text-amber-900/70 font-medium mt-0.5';
                } else {
                    joySubtext.innerText = 'Frugalidad extrema • Riesgo estrés';
                    joySubtext.className = 'block text-[9px] text-rose-700 font-bold mt-0.5';
                }
            }

            // Family Status Badge
            const familyBadge = document.getElementById('familyStatusBadge');
            const familyText = document.getElementById('familyStatusText');
            if (familyState.hasKid) {
                familyBadge.classList.remove('hidden');
                const yrs = Math.floor(familyState.kidAgeMonths / 12);
                let stageLabel = "Bebé/Párvulo (+$500/mes)";
                if (yrs >= 13) stageLabel = "Adolescente (+$1,000/mes)";
                else if (yrs >= 6) stageLabel = "Escuela Primaria (+$750/mes)";
                familyText.innerText = `Hijo Edad ${yrs} • ${stageLabel}`;
            } else {
                familyBadge.classList.add('hidden');
            }

            // Turn Action Projected Savings
            const projElem = document.getElementById('projectedMonthlySavings');
            if (projElem) {
                projElem.innerText = `${netSurplus >= 0 ? '+' : ''}$${Math.round(netSurplus).toLocaleString()}/mes`;
                projElem.className = netSurplus >= 0 ? 'text-gold-400 font-mono font-bold' : 'text-rose-300 font-mono font-bold';
            }

            // Time & Crossover Bar
            const years = Math.floor(monthsPassed / 12);
            document.getElementById('monthsPassedBadge').innerText = `Año ${years}`;

            document.getElementById('barExpenseVal').innerText = `$${exp.toLocaleString()}/mes`;
            document.getElementById('barPassiveVal').innerText = `+$${Math.round(pass).toLocaleString()}/mes`;

            // Normalize racing bar scales
            const maxBarScale = Math.max(exp, pass, 3000);
            document.getElementById('expensesBar').style.width = `${Math.min(100, (exp / maxBarScale) * 100)}%`;
            document.getElementById('passiveBar').style.width = `${Math.min(100, (pass / maxBarScale) * 100)}%`;

            const gap = exp - pass;
            const gapElem = document.getElementById('crossoverGapNotice');
            if (gap <= 0) {
                gapElem.className = 'text-center py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 rounded-lg border border-emerald-300';
                gapElem.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600 mr-1"></i> ¡PUNTO DE CRUCE ALCANZADO!`;
            } else {
                gapElem.className = 'text-center py-1 text-xs font-medium text-espresso-800/80 bg-cream-100 rounded-lg border border-cream-200';
                gapElem.innerHTML = `Brecha: <span class="font-bold text-rose-700">$${Math.round(gap).toLocaleString()}/mes</span> para la libertad.`;
            }

            renderMarketplace();
            renderHoldingsSidebar();
        }

        function renderMarketplace() {
            const container = document.getElementById('assetGridContainer');
            if (!container) return;
            container.innerHTML = '';

            assets.forEach((asset) => {
                const canAfford = cash >= asset.unitCost;
                const card = document.createElement('div');
                card.className = 'p-3 rounded-xl bg-cream-100 border border-cream-300 space-y-1.5 flex flex-col justify-between';

                const yieldColor = asset.monthlyYieldPerUnit >= 0 ? 'text-emerald-700' : 'text-rose-600';
                const yieldSign = asset.monthlyYieldPerUnit >= 0 ? '+' : '';

                card.innerHTML = `
                    <div>
                        <div class="flex items-center justify-between text-[11px] font-bold text-espresso-950">
                            <span class="flex items-center gap-1.5 truncate">
                                <i class="fa-solid ${asset.icon} text-forest-800" aria-hidden="true"></i>
                                ${asset.name}
                            </span>
                        </div>
                        <p class="text-[10px] text-espresso-800/70 mt-0.5 line-clamp-2">${asset.desc}</p>
                    </div>

                    <div class="space-y-1.5 pt-1.5 border-t border-cream-200">
                        <div class="flex justify-between items-center text-[11px]">
                            <span class="text-espresso-800/70">Costo: <strong class="text-espresso-950 font-mono">$${asset.unitCost.toLocaleString()}</strong></span>
                            <span class="${yieldColor} font-bold font-mono">${yieldSign}$${asset.monthlyYieldPerUnit}/mes</span>
                        </div>
                        <div class="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 truncate">
                            <i class="fa-solid fa-shield-halved mr-0.5 text-amber-600" aria-hidden="true"></i>${asset.riskText}
                        </div>

                        <div class="flex gap-1.5">
                            <button data-onclick="buyAsset('${asset.id}', 1)" ${!canAfford ? 'disabled' : ''} class="flex-1 py-1 rounded-lg bg-forest-800 hover:bg-forest-700 disabled:opacity-40 text-white text-[11px] font-bold transition">
                                Comprar 1
                            </button>
                            <button data-onclick="buyMaxAsset('${asset.id}')" ${!canAfford ? 'disabled' : ''} class="px-2 py-1 rounded-lg border border-forest-800 text-forest-800 hover:bg-forest-800 hover:text-white disabled:opacity-40 text-[11px] font-bold transition">
                                Máx
                            </button>
                        </div>
                        ${asset.ownedUnits > 0 ? `
                        <div class="flex gap-1.5 pt-1 border-t border-cream-200">
                            <button data-onclick="sellAsset('${asset.id}', 1)" class="flex-1 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold transition">
                                Vender 1
                            </button>
                            <button data-onclick="sellAllAsset('${asset.id}')" class="px-2 py-0.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[10px] font-bold transition">
                                Vender Todo (${asset.ownedUnits})
                            </button>
                        </div>
                        ` : ''}
                    </div>
                `;

                container.appendChild(card);
            });
        }

        function renderHoldingsSidebar() {
            const container = document.getElementById('holdingsContainer');
            const totalHoldingsCount = assets.reduce((sum, a) => sum + a.ownedUnits, 0);
            
            document.getElementById('holdingsCountBadge').innerText = `${totalHoldingsCount} Activos`;
            document.getElementById('sidebarTotalInvested').innerText = `$${getTotalInvestedCapital().toLocaleString()}`;
            document.getElementById('sidebarTotalPassive').innerText = `+$${Math.round(getTotalMonthlyPassiveIncome()).toLocaleString()}/mes`;

            updateAssetPieChart();

            if (!container) return;
            container.innerHTML = '';

            const activeHoldings = assets.filter(a => a.ownedUnits > 0);

            if (activeHoldings.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-4 text-espresso-800/60 italic text-xs">
                        Aún no posees activos. ¡Compra en el mercado!
                    </div>
                `;
                return;
            }

            activeHoldings.forEach((asset) => {
                const totalIncome = asset.ownedUnits * asset.monthlyYieldPerUnit;
                const div = document.createElement('div');
                div.className = 'p-2 rounded-xl bg-cream-100 border border-cream-300 space-y-1.5';

                div.innerHTML = `
                    <div class="flex items-center justify-between text-xs">
                        <div class="flex items-center gap-1.5">
                            <i class="fa-solid ${asset.icon} text-forest-800" aria-hidden="true"></i>
                            <div>
                                <span class="font-bold text-espresso-950 block leading-tight text-[11px]">${asset.name}</span>
                                <span class="text-[9px] text-espresso-800/70 font-mono">${asset.ownedUnits} Unid. ($${(asset.ownedUnits * asset.unitCost).toLocaleString()})</span>
                            </div>
                        </div>
                        <span class="font-bold font-mono text-xs ${totalIncome >= 0 ? 'text-emerald-700' : 'text-rose-600'}">${totalIncome >= 0 ? '+' : ''}$${Math.round(totalIncome)}/mes</span>
                    </div>
                    <div class="flex items-center justify-end gap-1.5 pt-1 border-t border-cream-200">
                        <button data-onclick="sellAsset('${asset.id}', 1)" class="px-2 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold transition">
                            Vender 1
                        </button>
                        <button data-onclick="sellAllAsset('${asset.id}')" class="px-2 py-0.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[10px] font-bold transition">
                            Vender Todo
                        </button>
                    </div>
                `;

                container.appendChild(div);
            });
        }

        function updateAssetPieChart() {
            const pieContainer = document.getElementById('pieChartContainer');
            const ctx = document.getElementById('assetPieChart');
            if (!ctx || !pieContainer) return;

            // chart-4.4.1.umd.min.js is deferred and can fail to load. Every value
            // the chart plots is already on the page as text, so the graceful path
            // is to say so and stop; throwing here would take the rest of the
            // render down with it.
            if (typeof Chart === 'undefined') {
                if (!ctx.dataset.fallbackShown) {
                    ctx.dataset.fallbackShown = 'true';
                    // The canvas is a blank box once the chart cannot draw, and its container
                    // is height-constrained; hiding it lets the note take the same space.
                    ctx.hidden = true;
                    const note = document.createElement('p');
                    note.className = 'chart-unavailable';
                    note.textContent = 'No se pudo dibujar el gráfico. Todas las cifras que mostraría también aparecen como texto en esta página.';
                    ctx.insertAdjacentElement('afterend', note);
                }
                return;
            }

            const activeHoldings = assets.filter(a => a.ownedUnits > 0);

            if (activeHoldings.length === 0) {
                pieContainer.classList.add('hidden');
                if (pieChartInstance) {
                    pieChartInstance.destroy();
                    pieChartInstance = null;
                }
                return;
            }

            pieContainer.classList.remove('hidden');

            const labels = activeHoldings.map(a => a.name);
            const dataValues = activeHoldings.map(a => a.ownedUnits * a.unitCost);
            const totalVal = dataValues.reduce((a, b) => a + b, 0);

            const colorPalette = [
                '#134e2a', // Verde Bosque
                '#d4a338', // Oro
                '#3a2719', // Espresso
                '#10b981', // Esmeralda
                '#2563eb', // Azul Real
                '#9333ea'  // Púrpura
            ];

            if (pieChartInstance) {
                pieChartInstance.destroy();
                pieChartInstance = null;
            }

            try {
                pieChartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: dataValues,
                            backgroundColor: colorPalette.slice(0, activeHoldings.length),
                            borderWidth: 2,
                            borderColor: '#fcfaf7'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    font: { size: 9, family: 'Inter' },
                                    boxWidth: 8,
                                    padding: 4
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const val = context.raw || 0;
                                        const pct = totalVal > 0 ? ((val / totalVal) * 100).toFixed(1) : 0;
                                        return ` $${val.toLocaleString()} (${pct}%)`;
                                    }
                                }
                            }
                        },
                        cutout: '55%'
                    }
                });
            } catch(e) {
                console.error("Error al renderizar gráfico:", e);
                pieChartInstance = null;
            }
        }

        function buyAsset(assetId, units = 1) {
            const asset = assets.find(a => a.id === assetId);
            if (!asset) return;

            const totalCost = asset.unitCost * units;
            if (cash >= totalCost) {
                cash -= totalCost;
                asset.ownedUnits += units;
                renderUI();

                if (getTotalMonthlyPassiveIncome() >= getMonthlyExpenses()) {
                    triggerCrossoverVictory();
                }
            }
        }

        function buyMaxAsset(assetId) {
            const asset = assets.find(a => a.id === assetId);
            if (!asset) return;

            const maxUnits = Math.floor(cash / asset.unitCost);
            if (maxUnits > 0) {
                buyAsset(assetId, maxUnits);
            }
        }

        function sellAsset(assetId, units = 1) {
            const asset = assets.find(a => a.id === assetId);
            if (!asset || asset.ownedUnits < units) return;

            const returnCash = asset.unitCost * units;
            cash += returnCash;
            asset.ownedUnits -= units;
            renderUI();
        }

        function sellAllAsset(assetId) {
            const asset = assets.find(a => a.id === assetId);
            if (!asset || asset.ownedUnits <= 0) return;

            sellAsset(assetId, asset.ownedUnits);
        }

        function updateLifestyle(type, value) {
            currentLifestyle[type] = value;
            
            // Update cost badges
            document.getElementById('housingCostBadge').innerText = `$${lifestyleCosts.housing[currentLifestyle.housing]}/mes`;
            document.getElementById('transportCostBadge').innerText = `$${lifestyleCosts.transport[currentLifestyle.transport]}/mes`;
            document.getElementById('lifestyleCostBadge').innerText = `$${lifestyleCosts.lifestyle[currentLifestyle.lifestyle]}/mes`;
            document.getElementById('subscriptionsCostBadge').innerText = `$${lifestyleCosts.subscriptions[currentLifestyle.subscriptions]}/mes`;
            document.getElementById('travelCostBadge').innerText = `$${lifestyleCosts.travel[currentLifestyle.travel]}/mes`;
            document.getElementById('shoppingCostBadge').innerText = `$${lifestyleCosts.shopping[currentLifestyle.shopping]}/mes`;

            renderUI();
        }

        function resetSimulation() {
            monthsPassed = 0;
            cash = 10000;
            baseMonthlySalary = 3200;
            familyState = { 
                hasKid: false, 
                kidAgeMonths: 0, 
                kidEventTriggered: false, 
                hasPet: false, 
                hasElderCare: false,
                promotionTriggered: false,
                inflationMultiplier: 1.0,
                totalJoyAccumulated: 0 
            };
            currentLifestyle = { housing: 'standard', transport: 'used', lifestyle: 'balanced', subscriptions: 'standard', travel: 'annual', shopping: 'standard' };

            assets.forEach(a => {
                a.ownedUnits = 0;
                a.monthlyYieldPerUnit = a.baseYield;
            });

            document.getElementById('housingSelect').value = 'standard';
            document.getElementById('transportSelect').value = 'used';
            document.getElementById('lifestyleSelect').value = 'balanced';
            document.getElementById('subscriptionsSelect').value = 'standard';
            document.getElementById('travelSelect').value = 'annual';
            document.getElementById('shoppingSelect').value = 'standard';

            updateLifestyle('housing', 'standard');
            closeVictoryModal();
            renderUI();
        }

        // Named rather than written into the button's attribute. The dismissal
        // is one DOM call, but sim-actions.js deliberately only understands a
        // function name and literal arguments - an attribute that could express
        // `document.getElementById(...).classList.add(...)` could express
        // anything, which is the property that made inline handlers worth
        // removing in the first place.
        function dismissTurnSummary() {
            const toast = document.getElementById('turnSummaryToast');
            if (toast) toast.classList.add('hidden');
        }

        window.onload = function() {
            renderUI();
        };
