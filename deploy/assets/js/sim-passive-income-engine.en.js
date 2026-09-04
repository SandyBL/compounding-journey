// GAME STATE
        let monthsPassed = 0; // Increments in steps of 12 (Years)
        let cash = 10000;
        let baseMonthlySalary = 3200; // Household Active Salary baseline
        let pieChartInstance = null;

        // ASSET DATA DEFINITIONS
        const assets = [
            { id: 'dividend_etf', name: 'Dividend ETF', icon: 'fa-chart-line', unitCost: 1000, baseYield: 4, monthlyYieldPerUnit: 4, ownedUnits: 0, desc: 'Broad market dividend index. Payouts compound & grow organically over time.', riskText: 'Low Risk / Compounding Growth' },
            { id: 'bonds', name: 'Treasury Bonds', icon: 'fa-building-columns', unitCost: 500, baseYield: 2, monthlyYieldPerUnit: 2, ownedUnits: 0, desc: 'Government backed. High yields during rate hike cycles.', riskText: 'Guaranteed / Safe' },
            { id: 'rental_property', name: 'Rental Condo', icon: 'fa-city', unitCost: 15000, baseYield: 110, monthlyYieldPerUnit: 110, ownedUnits: 0, desc: 'Real estate cash flow. Subject to occasional repair shocks.', riskText: 'Medium Risk / Cash Flow' },
            { id: 'reit_index', name: 'REIT Index', icon: 'fa-building', unitCost: 2500, baseYield: 16, monthlyYieldPerUnit: 16, ownedUnits: 0, desc: 'Real Estate Investment Trust pool. Consistent monthly payouts.', riskText: 'Moderate Risk / Real Estate' },
            { id: 'digital_business', name: 'Online Business', icon: 'fa-laptop-code', unitCost: 5000, baseYield: 65, monthlyYieldPerUnit: 65, ownedUnits: 0, desc: 'Digital asset ecommerce. High yield, subject to ad cost shifts.', riskText: 'High Yield / Volatile' },
            { id: 'bitcoin', name: 'Bitcoin (BTC)', icon: 'fa-brands fa-bitcoin', unitCost: 4000, baseYield: 15, monthlyYieldPerUnit: 15, ownedUnits: 0, desc: 'Crypto asset. Huge surge during bull markets, yield drag in bear cycles.', riskText: 'High Volatility / Speculative' }
        ];

        /* =================================================================
           GLOBAL LEADERBOARD (one board, every visitor, every language)
           Read from and written to /api/simulator-leaderboard.
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

        // TIME ADVANCEMENT & ANNUAL SIMULATION LOOP
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
                eventLogs.push(`💸 <strong>Inflation Creep (+4%):</strong> Macro inflation increased general household living expenses by <strong>+$${expDiff.toLocaleString()}/mo</strong> (New Monthly Expenses: $${newExpenses.toLocaleString()}/mo).`);
            }

            // 2. HAPPINESS / LIFE JOY COMPENSATION EFFECTS
            if (joyScore >= 70) { 
                if (Math.random() < 0.40) {
                    const bonus = Math.floor(Math.random() * 2500) + 2000;
                    cash += bonus;
                    eventLogs.push(`🌟 <strong>High Life Joy Boost!</strong> Your high well-being and positive energy at work earned you an annual Performance Bonus of <strong>+$${bonus.toLocaleString()}</strong> added to Available Cash!`);
                }
            } else if (joyScore < 30) {
                if (Math.random() < 0.30) {
                    const burnoutCost = 1200;
                    if (cash >= burnoutCost) cash -= burnoutCost;
                    eventLogs.push(`😫 <strong>Frugality Burnout:</strong> Severe lifestyle deprivation caused exhaustion. Spent <strong>-$${burnoutCost.toLocaleString()}</strong> on health, wellness & stress recovery.`);
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
                    
                    eventLogs.push(`🍼 <strong>Life Event: Baby Born!</strong> Added <strong>+$500/mo</strong> living expense for nursery, diapers & childcare.`);
                }
            } else if (familyState.hasKid) {
                const prevAgeYears = Math.floor(familyState.kidAgeMonths / 12);
                familyState.kidAgeMonths += 12;
                const newAgeYears = Math.floor(familyState.kidAgeMonths / 12);

                if (newAgeYears >= 18) {
                    familyState.hasKid = false;
                    eventLogs.push(`🎓 <strong>Empty Nest!</strong> Child turned 18 and moved out to college. Childcare expenses decreased by <strong>-$1,000/mo</strong>!`);
                } else if (prevAgeYears < 6 && newAgeYears >= 6) {
                    eventLogs.push(`🎒 <strong>School Age Upgrade:</strong> Child entered primary school! Expenses increased by <strong>+$250/mo</strong> (+$750/mo total child budget) for gear, activities & tuition.`);
                } else if (prevAgeYears < 13 && newAgeYears >= 13) {
                    eventLogs.push(`🎧 <strong>Teenager Stage:</strong> Teenager hobbies, tech, apparel, and appetite increased childcare costs by <strong>+$250/mo</strong> (+$1,000/mo total child budget).`);
                }
            }

            // Career Promotion
            const promotionChance = joyScore >= 50 ? 0.40 : 0.20;
            if (!familyState.promotionTriggered && monthsPassed >= 36 && Math.random() < promotionChance) {
                familyState.promotionTriggered = true;
                const raiseAmount = 400;
                baseMonthlySalary += raiseAmount;
                eventLogs.push(`💼 <strong>Career Promotion & Raise!</strong> Earned a promotion! Active household salary increased by <strong>+$${raiseAmount}/mo</strong> (New Active Salary: $${baseMonthlySalary.toLocaleString()}/mo).`);
            }

            // Pet Adoption
            if (!familyState.hasPet && monthsPassed >= 60 && Math.random() < 0.15) {
                familyState.hasPet = true;
                eventLogs.push(`🐶 <strong>Life Event: Adopted a Pet!</strong> Added <strong>+$120/mo</strong> ongoing expenses for vet care, food, and pet insurance.`);
            }

            // Aging Parents Healthcare Support
            if (!familyState.hasElderCare && monthsPassed >= 120 && Math.random() < 0.20) {
                familyState.hasElderCare = true;
                eventLogs.push(`👴 <strong>Aging Parents Healthcare Support:</strong> Assumed monthly medical caregiving support for aging parents, adding <strong>+$250/mo</strong> to living expenses.`);
            }

            // 4. OUT-OF-POCKET EXPENSE SHOCKS & WINDFALLS
            const shockRoll = Math.random();
            if (shockRoll < 0.10 && cash >= 1000) {
                const cost = Math.floor(Math.random() * 800) + 1000;
                cash -= cost;
                eventLogs.push(`🏥 <strong>Medical / Dental Emergency:</strong> Unexpected health bill deducted <strong>-$${cost.toLocaleString()}</strong> from Available Cash.`);
            } else if (shockRoll >= 0.10 && shockRoll < 0.20 && cash >= 1200) {
                const cost = Math.floor(Math.random() * 1000) + 1200;
                cash -= cost;
                eventLogs.push(`🚗 <strong>Major Vehicle Transmission Repair:</strong> Deducted <strong>-$${cost.toLocaleString()}</strong> from Available Cash.`);
            } else if (shockRoll >= 0.20 && shockRoll < 0.28 && cash >= 1500) {
                const cost = Math.floor(Math.random() * 1200) + 1600;
                cash -= cost;
                eventLogs.push(`🏛️ <strong>Property Tax & Escrow Hike:</strong> Annual escrow shortfall deducted <strong>-$${cost.toLocaleString()}</strong> from Available Cash.`);
            } else if (shockRoll >= 0.28 && shockRoll < 0.33) {
                const bonus = Math.floor(Math.random() * 2000) + 1500;
                cash += bonus;
                eventLogs.push(`💻 <strong>Side Hustle Windfall!</strong> Freelance gig added <strong>+$${bonus.toLocaleString()}</strong> bonus cash!`);
            } else if (shockRoll >= 0.33 && shockRoll < 0.38) {
                const inheritance = Math.floor(Math.random() * 5000) + 6000;
                cash += inheritance;
                eventLogs.push(`🎁 <strong>Family Inheritance / Financial Gift!</strong> Received a surprise lump sum inheritance of <strong>+$${inheritance.toLocaleString()}</strong> added to Available Cash!`);
            } else if (shockRoll >= 0.38 && shockRoll < 0.42) {
                const taxBonus = Math.floor(Math.random() * 1500) + 1200;
                cash += taxBonus;
                eventLogs.push(`🧾 <strong>Tax Refund & Performance Bonus:</strong> Work annual review & tax return credited <strong>+$${taxBonus.toLocaleString()}</strong> to Available Cash.`);
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
                    eventLogs.push(`📈 <strong>Dividend Organic Growth!</strong> Corporate payouts raised dividend payouts by +${((compoundRate - 1)*100).toFixed(1)}%. Per unit yield rose +$${yieldDiff}/mo (Total portfolio boost: <strong>+$${totalEtfBoost}/mo</strong>).`);
                }
            }

            // Treasury Bonds Rate Cycles
            const bonds = assets.find(a => a.id === 'bonds');
            if (Math.random() < 0.25) {
                if (bonds) {
                    bonds.monthlyYieldPerUnit = 3.2;
                    bonds.riskText = 'High Rate Era (7.7% APY)';
                    if (bonds.ownedUnits > 0) {
                        const bondBoost = ((3.2 - bonds.baseYield) * bonds.ownedUnits).toFixed(0);
                        eventLogs.push(`🏦 <strong>Central Bank Rate Hike:</strong> Treasury Bonds yield spiked to <strong>+$3.2/unit</strong> (7.7% APY). Added <strong>+$${bondBoost}/mo</strong> to bond cash flow.`);
                    }
                }
            } else if (bonds) {
                bonds.monthlyYieldPerUnit = bonds.baseYield;
                bonds.riskText = 'Guaranteed / Safe';
            }

            // Bitcoin Single Evaluation
            const btc = assets.find(a => a.id === 'bitcoin');
            if (btc) {
                const btcRoll = Math.random();
                if (btcRoll < 0.28) {
                    btc.monthlyYieldPerUnit = 65;
                    if (btc.ownedUnits > 0) {
                        const btcGain = ((65 - btc.baseYield) * btc.ownedUnits).toFixed(0);
                        eventLogs.push(`🚀 <strong>Bitcoin Bull Market:</strong> Crypto rally surged cash flow yield to +$65/unit/mo! Added <strong>+$${btcGain}/mo</strong> to passive cash flow.`);
                    }
                } else if (btcRoll < 0.52) {
                    btc.monthlyYieldPerUnit = -15;
                    if (btc.ownedUnits > 0) {
                        const btcLoss = (Math.abs(-15 - btc.baseYield) * btc.ownedUnits).toFixed(0);
                        eventLogs.push(`📉 <strong>Bitcoin Bear Market:</strong> Price correction caused temporary yield drag (-$15/unit/mo). Reduced passive cash flow by <strong>-$${btcLoss}/mo</strong>.`);
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
                        eventLogs.push(`🚀 <strong>Online Business Boom:</strong> Product launch raised yield to +$120/unit/mo for the year.`);
                    }
                } else if (bizRoll < 0.45) {
                    biz.monthlyYieldPerUnit = 35;
                    if (biz.ownedUnits > 0) {
                        eventLogs.push(`⚠️ <strong>Digital Ad Cost Hike:</strong> Increased ad competition reduced business yield to +$35/unit/mo for the year.`);
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
                    eventLogs.push(`🛠️ <strong>Condo Maintenance Repair:</strong> Paid emergency HVAC & roof repair out-of-pocket: <strong>-$${repairCost.toLocaleString()}</strong> from Available Cash.`);
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
                const yearsPassedStr = `Year ${Math.floor(monthsPassed / 12)}`;
                toastTitle.innerText = `Advanced +1 Year (${yearsPassedStr})`;
                toastText.innerHTML = `Net annual cash surplus collected: <strong class="font-mono text-emerald-800">${annualNetAdded >= 0 ? '+' : ''}$${Math.round(annualNetAdded).toLocaleString()}</strong> (${netMonthly >= 0 ? '+' : ''}$${Math.round(netMonthly).toLocaleString()}/mo x 12 months added to Available Cash).`;

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
                container.innerHTML = leaderboardNoticeRow('Loading the global Hall of Fame…');
                return;
            }
            if (leaderboardState === 'error') {
                container.innerHTML = leaderboardNoticeRow('The Hall of Fame could not be reached. Try again in a moment.');
                return;
            }
            if (leaderboardEntries.length === 0) {
                container.innerHTML = leaderboardNoticeRow('Nobody has reached crossover yet. Get there and the first line is yours.');
                return;
            }

            container.innerHTML = '';
            // The list arrives ranked by the endpoint - fewest months first, and
            // the larger net worth ahead where two runs took the same time - so
            // there is nothing to sort here. Sorting a second time on the client
            // is how the page and the board start disagreeing about who won.
            leaderboardEntries.forEach((entry, idx) => {
                const yrs = Math.floor(entry.score / 12);
                const timeStr = yrs > 0 ? `${yrs} Years (${entry.score}m)` : `${entry.score} Months`;

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
                    <td class="p-2.5 font-semibold text-espresso-950">${window.SimLeaderboard.escapeHtml(entry.name)}${isMine ? ' <span class="text-[9px] font-bold uppercase tracking-wide text-gold-600">You</span>' : ''}</td>
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
                                Your run is on the global Hall of Fame!
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
                        warning.textContent = 'Your run could not be sent to the Hall of Fame. Check your connection and press Save Score again.';
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
            
            document.getElementById('victoryPassive').innerText = `+$${Math.round(pass).toLocaleString()}/mo`;
            document.getElementById('victoryExpenses').innerText = `$${exp.toLocaleString()}/mo`;
            
            const yrs = Math.floor(monthsPassed / 12);
            document.getElementById('victoryTime').innerText = `${yrs} Years (${monthsPassed} Months)`;
            document.getElementById('victoryNetWorth').innerText = `$${Math.round(getNetWorth()).toLocaleString()}`;

            // Life Joy Title
            const joyTitleElem = document.getElementById('victoryJoyTitle');
            if (joyTitleElem) {
                if (joyScore >= 75) {
                    joyTitleElem.innerHTML = `👑 <strong class="text-amber-700">Joyful Wealth Master</strong> (${joyScore}/100 Joy)`;
                } else if (joyScore >= 45) {
                    joyTitleElem.innerHTML = `⚖️ <strong class="text-emerald-700">Balanced Builder</strong> (${joyScore}/100 Joy)`;
                } else {
                    joyTitleElem.innerHTML = `🪙 <strong class="text-rose-700">Frugal Ascetic</strong> (${joyScore}/100 Joy)`;
                }
            }

            document.getElementById('victoryModal').classList.remove('hidden');
        }

        function closeVictoryModal() {
            const modal = document.getElementById('victoryModal');
            if (modal) modal.classList.add('hidden');
        }

        // The victory modal's route to the panel. Closing it first is what makes
        // the panel reachable, and SimCta.focus() moves focus onto it - correct
        // only because somebody pressed a button asking to go there.
        function openSimCta() {
            closeVictoryModal();
            if (window.SimCta) window.SimCta.focus();
        }

        /**
         * Classifies the run for the result-aware panel.
         *
         * Called from renderUI(), so once per simulated year rather than only
         * at crossover - and it says nothing for the first ten of them. Before
         * year ten the coverage percentage is mostly the starting salary, and
         * there is no result yet to read back.
         *
         * The joy score is what splits crossover into three, and it is the
         * whole reason this tool has one. Reaching financial independence in
         * six years by cutting everything that makes a life is not a better
         * outcome than reaching it in eleven while living, and it is the run
         * least likely to be finished in real life. It gets warmth and a
         * conversation, not a questionnaire.
         */
        function updateResultCta() {
            if (!window.SimCta) return;

            const years = Math.floor(monthsPassed / 12);
            const coverage = getFreedomCoveragePct();
            if (coverage < 100 && years < 10) return;

            const exp = getMonthlyExpenses();
            const pass = getTotalMonthlyPassiveIncome();
            const joy = getHappinessScore();

            let bucket;
            if (coverage >= 100) {
                if (joy >= 75) bucket = 'crossoverJoyful';
                else if (joy < 45) bucket = 'crossoverAscetic';
                else bucket = 'crossoverBalanced';
            } else if (coverage >= 75) {
                bucket = 'close';
            } else {
                bucket = 'far';
            }

            window.SimCta.show(bucket, {
                years,
                joy,
                coverage: Math.round(coverage),
                passive: window.SimCta.money(pass),
                expenses: window.SimCta.money(exp),
                gap: window.SimCta.money(Math.max(0, exp - pass)),
                netWorth: window.SimCta.money(getNetWorth())
            });
        }

        function renderUI() {
            const exp = getMonthlyExpenses();
            const pass = getTotalMonthlyPassiveIncome();
            const coverage = getFreedomCoveragePct();
            const netSurplus = getNetMonthlySurplus();
            const joyScore = getHappinessScore();

            // Header stats
            document.getElementById('cashDisplay').innerText = `$${Math.round(cash).toLocaleString()}`;
            document.getElementById('activeDisplay').innerText = `$${baseMonthlySalary.toLocaleString()}/mo`;
            document.getElementById('expensesDisplay').innerText = `$${exp.toLocaleString()}/mo`;
            document.getElementById('passiveDisplay').innerText = `+$${Math.round(pass).toLocaleString()}/mo`;
            document.getElementById('freedomPctDisplay').innerText = `${coverage.toFixed(1)}%`;
            document.getElementById('freedomProgressBar').style.width = `${coverage}%`;
            document.getElementById('marketplaceCash').innerText = `$${Math.round(cash).toLocaleString()}`;

            // Life Joy Card Update
            const joyDisplay = document.getElementById('happinessDisplay');
            const joySubtext = document.getElementById('happinessSubtext');
            if (joyDisplay && joySubtext) {
                joyDisplay.innerText = `${joyScore} / 100`;
                if (joyScore >= 70) {
                    joySubtext.innerText = 'High energy • Bonus & raise boost!';
                    joySubtext.className = 'block text-[9px] text-emerald-800 font-bold mt-0.5';
                } else if (joyScore >= 40) {
                    joySubtext.innerText = 'Balanced • Sustainable pace';
                    joySubtext.className = 'block text-[9px] text-amber-900/70 font-medium mt-0.5';
                } else {
                    joySubtext.innerText = 'Extreme frugal • Burnout risk';
                    joySubtext.className = 'block text-[9px] text-rose-700 font-bold mt-0.5';
                }
            }

            // Family Status Badge
            const familyBadge = document.getElementById('familyStatusBadge');
            const familyText = document.getElementById('familyStatusText');
            if (familyState.hasKid) {
                familyBadge.classList.remove('hidden');
                const yrs = Math.floor(familyState.kidAgeMonths / 12);
                let stageLabel = "Baby/Toddler (+$500/mo)";
                if (yrs >= 13) stageLabel = "Teenager (+$1,000/mo)";
                else if (yrs >= 6) stageLabel = "Primary School (+$750/mo)";
                familyText.innerText = `Child Age ${yrs} • ${stageLabel}`;
            } else {
                familyBadge.classList.add('hidden');
            }

            // Turn Action Projected Savings
            const projElem = document.getElementById('projectedMonthlySavings');
            if (projElem) {
                projElem.innerText = `${netSurplus >= 0 ? '+' : ''}$${Math.round(netSurplus).toLocaleString()}/mo`;
                projElem.className = netSurplus >= 0 ? 'text-gold-400 font-mono font-bold' : 'text-rose-300 font-mono font-bold';
            }

            // Time & Crossover Bar
            const years = Math.floor(monthsPassed / 12);
            document.getElementById('monthsPassedBadge').innerText = `Year ${years}`;

            document.getElementById('barExpenseVal').innerText = `$${exp.toLocaleString()}/mo`;
            document.getElementById('barPassiveVal').innerText = `+$${Math.round(pass).toLocaleString()}/mo`;

            // Normalize racing bar scales
            const maxBarScale = Math.max(exp, pass, 3000);
            document.getElementById('expensesBar').style.width = `${Math.min(100, (exp / maxBarScale) * 100)}%`;
            document.getElementById('passiveBar').style.width = `${Math.min(100, (pass / maxBarScale) * 100)}%`;

            const gap = exp - pass;
            const gapElem = document.getElementById('crossoverGapNotice');
            if (gap <= 0) {
                gapElem.className = 'text-center py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 rounded-lg border border-emerald-300';
                gapElem.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600 mr-1"></i> CROSSOVER ACHIEVED!`;
            } else {
                gapElem.className = 'text-center py-1 text-xs font-medium text-espresso-800/80 bg-cream-100 rounded-lg border border-cream-200';
                gapElem.innerHTML = `Gap: <span class="font-bold text-rose-700">$${Math.round(gap).toLocaleString()}/mo</span> to freedom.`;
            }

            renderMarketplace();
            renderHoldingsSidebar();
            updateResultCta();
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
                            <span class="text-espresso-800/70">Cost: <strong class="text-espresso-950 font-mono">$${asset.unitCost.toLocaleString()}</strong></span>
                            <span class="${yieldColor} font-bold font-mono">${yieldSign}$${asset.monthlyYieldPerUnit}/mo</span>
                        </div>
                        <div class="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 truncate">
                            <i class="fa-solid fa-shield-halved mr-0.5 text-amber-600" aria-hidden="true"></i>${asset.riskText}
                        </div>

                        <div class="flex gap-1.5">
                            <button data-onclick="buyAsset('${asset.id}', 1)" ${!canAfford ? 'disabled' : ''} class="flex-1 py-1 rounded-lg bg-forest-800 hover:bg-forest-700 disabled:opacity-40 text-white text-[11px] font-bold transition">
                                Buy 1
                            </button>
                            <button data-onclick="buyMaxAsset('${asset.id}')" ${!canAfford ? 'disabled' : ''} class="px-2 py-1 rounded-lg border border-forest-800 text-forest-800 hover:bg-forest-800 hover:text-white disabled:opacity-40 text-[11px] font-bold transition">
                                Max
                            </button>
                        </div>
                        ${asset.ownedUnits > 0 ? `
                        <div class="flex gap-1.5 pt-1 border-t border-cream-200">
                            <button data-onclick="sellAsset('${asset.id}', 1)" class="flex-1 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold transition">
                                Sell 1
                            </button>
                            <button data-onclick="sellAllAsset('${asset.id}')" class="px-2 py-0.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[10px] font-bold transition">
                                Sell All (${asset.ownedUnits})
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
            
            document.getElementById('holdingsCountBadge').innerText = `${totalHoldingsCount} Assets`;
            document.getElementById('sidebarTotalInvested').innerText = `$${getTotalInvestedCapital().toLocaleString()}`;
            document.getElementById('sidebarTotalPassive').innerText = `+$${Math.round(getTotalMonthlyPassiveIncome()).toLocaleString()}/mo`;

            updateAssetPieChart();

            if (!container) return;
            container.innerHTML = '';

            const activeHoldings = assets.filter(a => a.ownedUnits > 0);

            if (activeHoldings.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-4 text-espresso-800/60 italic text-xs">
                        No cash-flow assets owned yet. Buy units in the marketplace!
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
                                <span class="text-[9px] text-espresso-800/70 font-mono">${asset.ownedUnits} Units ($${(asset.ownedUnits * asset.unitCost).toLocaleString()})</span>
                            </div>
                        </div>
                        <span class="font-bold font-mono text-xs ${totalIncome >= 0 ? 'text-emerald-700' : 'text-rose-600'}">${totalIncome >= 0 ? '+' : ''}$${Math.round(totalIncome)}/mo</span>
                    </div>
                    <div class="flex items-center justify-end gap-1.5 pt-1 border-t border-cream-200">
                        <button data-onclick="sellAsset('${asset.id}', 1)" class="px-2 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold transition">
                            Sell 1
                        </button>
                        <button data-onclick="sellAllAsset('${asset.id}')" class="px-2 py-0.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[10px] font-bold transition">
                            Sell All
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
                    note.textContent = 'The chart could not be drawn. Every figure it would show is also listed as text on this page.';
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

            // The six slice colours are the six series colours, in the same
            // order, so a holding in the doughnut is the colour the same
            // holding would be as a line on the chart above it.
            const theme = window.SimChartTheme;
            const colorPalette = theme.series.map(s => s.line);

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
                            backgroundColor: colorPalette.slice(0, activeHoldings.length)
                        }]
                    },
                    options: {
                        plugins: {
                            legend: {
                                // The only legend that overrides the shared
                                // one: this chart is 128px tall in a sidebar,
                                // so the default 11px with 12px of padding
                                // would take more room than the doughnut.
                                labels: {
                                    font: { size: 9 },
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
                console.error("Chart render error:", e);
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
            document.getElementById('housingCostBadge').innerText = `$${lifestyleCosts.housing[currentLifestyle.housing]}/mo`;
            document.getElementById('transportCostBadge').innerText = `$${lifestyleCosts.transport[currentLifestyle.transport]}/mo`;
            document.getElementById('lifestyleCostBadge').innerText = `$${lifestyleCosts.lifestyle[currentLifestyle.lifestyle]}/mo`;
            document.getElementById('subscriptionsCostBadge').innerText = `$${lifestyleCosts.subscriptions[currentLifestyle.subscriptions]}/mo`;
            document.getElementById('travelCostBadge').innerText = `$${lifestyleCosts.travel[currentLifestyle.travel]}/mo`;
            document.getElementById('shoppingCostBadge').innerText = `$${lifestyleCosts.shopping[currentLifestyle.shopping]}/mo`;

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
