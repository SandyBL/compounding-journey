// GAME STATE
        let monthsPassed = 0; // Increments in steps of 12 (Years)
        let cash = 10000;
        let baseMonthlySalary = 3200; // Household Active Salary baseline
        let pieChartInstance = null;

        // ASSET DATA DEFINITIONS (PORTUGUESE TRANSLATION)
        const assets = [
            { id: 'dividend_etf', name: 'ETF de Dividendos', icon: 'fa-chart-line', unitCost: 1000, baseYield: 4, monthlyYieldPerUnit: 4, ownedUnits: 0, desc: 'Índice de dividendos do mercado. Os pagamentos se multiplicam e crescem organicamente.', riskText: 'Baixo Risco / Crescimento Contínuo' },
            { id: 'bonds', name: 'Títulos do Tesouro', icon: 'fa-building-columns', unitCost: 500, baseYield: 2, monthlyYieldPerUnit: 2, ownedUnits: 0, desc: 'Garantidos pelo governo. Rendem mais em ciclos de juros altos.', riskText: 'Garantido / Seguro' },
            { id: 'rental_property', name: 'Imóvel para Aluguel', icon: 'fa-city', unitCost: 15000, baseYield: 110, monthlyYieldPerUnit: 110, ownedUnits: 0, desc: 'Fluxo imobiliário. Sujeito a custos ocasionais de reforma.', riskText: 'Risco Médio / Fluxo de Caixa' },
            { id: 'reit_index', name: 'Fundos Imobiliários (REITs)', icon: 'fa-building', unitCost: 2500, baseYield: 16, monthlyYieldPerUnit: 16, ownedUnits: 0, desc: 'Fundo de investimento imobiliário. Pagamentos mensais constantes.', riskText: 'Risco Moderado / Imóveis' },
            { id: 'digital_business', name: 'Negócio Digital', icon: 'fa-laptop-code', unitCost: 5000, baseYield: 65, monthlyYieldPerUnit: 65, ownedUnits: 0, desc: 'E-commerce digital. Alto rendimento, sensível a custos de anúncios.', riskText: 'Alto Rendimento / Volátil' },
            { id: 'bitcoin', name: 'Bitcoin (BTC)', icon: 'fa-brands fa-bitcoin', unitCost: 4000, baseYield: 15, monthlyYieldPerUnit: 15, ownedUnits: 0, desc: 'Criptoativo. Grandes ciclos de alta, pressão em ciclos de baixa.', riskText: 'Alta Volatilidade / Especulativo' }
        ];

        const DEFAULT_LEADERBOARD = [
            { name: "Sofia Chen (Gurus do FIRE)", months: 264, netWorth: 680000 },
            { name: "Marcos Vance", months: 288, netWorth: 590000 },
            { name: "Elena Rostova", months: 312, netWorth: 510000 },
            { name: "David K.", months: 348, netWorth: 440000 },
            { name: "Sara e Alexandre", months: 384, netWorth: 390000 }
        ];

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
                eventLogs.push(`💸 <strong>Inflação Progressiva (+4%):</strong> A inflação macroeconômica aumentou as despesas da família em <strong>+$${expDiff.toLocaleString()}/mês</strong> (Novas Despesas: $${newExpenses.toLocaleString()}/mês).`);
            }

            // 2. HAPPINESS / LIFE JOY COMPENSATION EFFECTS
            if (joyScore >= 70) { 
                if (Math.random() < 0.40) {
                    const bonus = Math.floor(Math.random() * 2500) + 2000;
                    cash += bonus;
                    eventLogs.push(`🌟 <strong>Bônus de Alta Alegria de Viver!</strong> Sua ótima energia e bem-estar no trabalho renderam um Bônus de Desempenho de <strong>+$${bonus.toLocaleString()}</strong> no Saldo de Caixa.`);
                }
            } else if (joyScore < 30) {
                if (Math.random() < 0.30) {
                    const burnoutCost = 1200;
                    if (cash >= burnoutCost) cash -= burnoutCost;
                    eventLogs.push(`😫 <strong>Esgotamento por Frugalidade Extrema:</strong> O estresse acumulado exigiu gastos de <strong>-$${burnoutCost.toLocaleString()}</strong> em saúde e descanso.`);
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
                    
                    eventLogs.push(`🍼 <strong>Evento de Vida: Nascimento de um Bebê!</strong> Adicionados <strong>+$500/mês</strong> em custos de fraldas, berçário e cuidados.`);
                }
            } else if (familyState.hasKid) {
                const prevAgeYears = Math.floor(familyState.kidAgeMonths / 12);
                familyState.kidAgeMonths += 12;
                const newAgeYears = Math.floor(familyState.kidAgeMonths / 12);

                if (newAgeYears >= 18) {
                    familyState.hasKid = false;
                    eventLogs.push(`🎓 <strong>Ninho Vazio!</strong> Seu filho completou 18 anos e foi para a faculdade. As despesas caíram em <strong>-$1.000/mês</strong>!`);
                } else if (prevAgeYears < 6 && newAgeYears >= 6) {
                    eventLogs.push(`🎒 <strong>Fase Escolar:</strong> Seu filho entrou no ensino fundamental. Custos aumentaram em <strong>+$250/mês</strong> (+$750/mês total do filho) em material e esportes.`);
                } else if (prevAgeYears < 13 && newAgeYears >= 13) {
                    eventLogs.push(`🎧 <strong>Fase Adolescente:</strong> Atividades, tecnologia e roupas elevaram os gastos do filho em <strong>+$250/mês</strong> (+$1.000/mês total).`);
                }
            }

            // Career Promotion
            const promotionChance = joyScore >= 50 ? 0.40 : 0.20;
            if (!familyState.promotionTriggered && monthsPassed >= 36 && Math.random() < promotionChance) {
                familyState.promotionTriggered = true;
                const raiseAmount = 400;
                baseMonthlySalary += raiseAmount;
                eventLogs.push(`💼 <strong>Promoção de Carreira!</strong> Aumento salarial! O salário ativo da família subiu <strong>+$${raiseAmount}/mês</strong> (Novo Salário: $${baseMonthlySalary.toLocaleString()}/mês).`);
            }

            // Pet Adoption
            if (!familyState.hasPet && monthsPassed >= 60 && Math.random() < 0.15) {
                familyState.hasPet = true;
                eventLogs.push(`🐶 <strong>Adoção de um Pet!</strong> Adicionados <strong>+$120/mês</strong> em ração, veterinário e plano de saúde animal.`);
            }

            // Aging Parents Healthcare Support
            if (!familyState.hasElderCare && monthsPassed >= 120 && Math.random() < 0.20) {
                familyState.hasElderCare = true;
                eventLogs.push(`👴 <strong>Apoio a Pais Idosos:</strong> Você assumiu suporte médico mensal para seus pais, adicionando <strong>+$250/mês</strong> às despesas.`);
            }

            // 4. OUT-OF-POCKET EXPENSE SHOCKS & WINDFALLS
            const shockRoll = Math.random();
            if (shockRoll < 0.10 && cash >= 1000) {
                const cost = Math.floor(Math.random() * 800) + 1000;
                cash -= cost;
                eventLogs.push(`🏥 <strong>Emergência Médica / Odontológica:</strong> Despesa de saúde inesperada de <strong>-$${cost.toLocaleString()}</strong> no Caixa.`);
            } else if (shockRoll >= 0.10 && shockRoll < 0.20 && cash >= 1200) {
                const cost = Math.floor(Math.random() * 1000) + 1200;
                cash -= cost;
                eventLogs.push(`🚗 <strong>Manutenção do Veículo:</strong> Conserto do carro exigiu <strong>-$${cost.toLocaleString()}</strong> do Caixa.`);
            } else if (shockRoll >= 0.20 && shockRoll < 0.28 && cash >= 1500) {
                const cost = Math.floor(Math.random() * 1200) + 1600;
                cash -= cost;
                eventLogs.push(`🏛️ <strong>Aumento de IPTU / Seguros:</strong> Reajuste anual de impostos descontou <strong>-$${cost.toLocaleString()}</strong> do Caixa.`);
            } else if (shockRoll >= 0.28 && shockRoll < 0.33) {
                const bonus = Math.floor(Math.random() * 2000) + 1500;
                cash += bonus;
                eventLogs.push(`💻 <strong>Projeto Freelance Extra!</strong> Você ganhou um extra de <strong>+$${bonus.toLocaleString()}</strong> em dinheiro.`);
            } else if (shockRoll >= 0.33 && shockRoll < 0.38) {
                const inheritance = Math.floor(Math.random() * 5000) + 6000;
                cash += inheritance;
                eventLogs.push(`🎁 <strong>Herança ou Presente Familiar!</strong> Você recebeu uma quantia de <strong>+$${inheritance.toLocaleString()}</strong> no Caixa.`);
            } else if (shockRoll >= 0.38 && shockRoll < 0.42) {
                const taxBonus = Math.floor(Math.random() * 1500) + 1200;
                cash += taxBonus;
                eventLogs.push(`🧾 <strong>Restituição de Imposto de Renda:</strong> O retorno fiscal adicionou <strong>+$${taxBonus.toLocaleString()}</strong> ao Caixa.`);
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
                    eventLogs.push(`📈 <strong>Crescimento de Dividendos!</strong> As empresas aumentaram os proventos (+${((compoundRate - 1)*100).toFixed(1)}%). O rendimento subiu +$${yieldDiff}/mês por unidade (Ganho total: <strong>+$${totalEtfBoost}/mês</strong>).`);
                }
            }

            // Treasury Bonds Rate Cycles
            const bonds = assets.find(a => a.id === 'bonds');
            if (Math.random() < 0.25) {
                if (bonds) {
                    bonds.monthlyYieldPerUnit = 3.2;
                    bonds.riskText = 'Alta dos Juros (7.7% ao ano)';
                    if (bonds.ownedUnits > 0) {
                        const bondBoost = ((3.2 - bonds.baseYield) * bonds.ownedUnits).toFixed(0);
                        eventLogs.push(`🏦 <strong>Alta de Juros pelo Banco Central:</strong> O rendimento dos Títulos subiu para <strong>+$3.2/unidade</strong> (7.7% ao ano). Adicionou <strong>+$${bondBoost}/mês</strong> à renda passiva.`);
                    }
                }
            } else if (bonds) {
                bonds.monthlyYieldPerUnit = bonds.baseYield;
                bonds.riskText = 'Garantido / Seguro';
            }

            // Bitcoin Single Evaluation
            const btc = assets.find(a => a.id === 'bitcoin');
            if (btc) {
                const btcRoll = Math.random();
                if (btcRoll < 0.28) {
                    btc.monthlyYieldPerUnit = 65;
                    if (btc.ownedUnits > 0) {
                        const btcGain = ((65 - btc.baseYield) * btc.ownedUnits).toFixed(0);
                        eventLogs.push(`🚀 <strong>Ciclo de Alta no Bitcoin:</strong> O rally impulsionou o fluxo para +$65/unidade/mês! Somou <strong>+$${btcGain}/mês</strong> à sua renda passiva.`);
                    }
                } else if (btcRoll < 0.52) {
                    btc.monthlyYieldPerUnit = -15;
                    if (btc.ownedUnits > 0) {
                        const btcLoss = (Math.abs(-15 - btc.baseYield) * btc.ownedUnits).toFixed(0);
                        eventLogs.push(`📉 <strong>Ciclo de Baixa no Bitcoin:</strong> Correção temporária de preço (-$15/unidade/mês). Reduziu a renda passiva em <strong>-$${btcLoss}/mês</strong>.`);
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
                        eventLogs.push(`🚀 <strong>Expansão do Negócio Digital:</strong> Novo produto elevou o rendimento para +$120/unidade/mês este ano.`);
                    }
                } else if (bizRoll < 0.45) {
                    biz.monthlyYieldPerUnit = 35;
                    if (biz.ownedUnits > 0) {
                        eventLogs.push(`⚠️ <strong>Aumento de Custos com Anúncios:</strong> Maior concorrência reduziu o rendimento do negócio digital para +$35/unidade/mês este ano.`);
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
                    eventLogs.push(`🛠️ <strong>Reforma no Imóvel:</strong> Despesa emergencial de manutenção: <strong>-$${repairCost.toLocaleString()}</strong> do Caixa.`);
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
                const yearsPassedStr = `Ano ${Math.floor(monthsPassed / 12)}`;
                toastTitle.innerText = `Período Avançado (${yearsPassedStr})`;
                toastText.innerHTML = `Superávit líquido acumulado: <strong class="font-mono text-emerald-800">${annualNetAdded >= 0 ? '+' : ''}$${Math.round(annualNetAdded).toLocaleString()}</strong> (${netMonthly >= 0 ? '+' : ''}$${Math.round(netMonthly).toLocaleString()}/mês x 12 meses somados ao Caixa).`;

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
                    renderLeaderboardTable();
                }
            }
        }

        function getLeaderboard() {
            const saved = localStorage.getItem('compounding_journey_leaderboard_pt');
            if (saved) {
                try { return JSON.parse(saved); } catch(e) {}
            }
            return DEFAULT_LEADERBOARD;
        }

        function saveLeaderboard(data) {
            localStorage.setItem('compounding_journey_leaderboard_pt', JSON.stringify(data));
        }

        function renderLeaderboardTable() {
            const container = document.getElementById('leaderboardTableBody');
            if (!container) return;
            const list = getLeaderboard();
            list.sort((a, b) => a.months - b.months);

            container.innerHTML = '';
            list.forEach((entry, idx) => {
                const yrs = Math.floor(entry.months / 12);
                const timeStr = yrs > 0 ? `${yrs} Anos (${entry.months}m)` : `${entry.months} Meses`;

                let rankBadge = `<span class="font-bold font-mono text-espresso-800">${idx + 1}</span>`;
                if (idx === 0) rankBadge = `<i class="fa-solid fa-crown text-amber-500 text-sm" aria-hidden="true"></i>`;
                else if (idx === 1) rankBadge = `<i class="fa-solid fa-medal text-slate-400 text-sm" aria-hidden="true"></i>`;
                else if (idx === 2) rankBadge = `<i class="fa-solid fa-medal text-amber-700 text-sm" aria-hidden="true"></i>`;

                const tr = document.createElement('tr');
                tr.className = idx % 2 === 0 ? 'bg-cream-50/50 hover:bg-cream-100' : 'bg-cream-100/40 hover:bg-cream-100';
                tr.innerHTML = `
                    <td class="p-2.5 text-center">${rankBadge}</td>
                    <td class="p-2.5 font-semibold text-espresso-950">${entry.name}</td>
                    <td class="p-2.5 text-center font-mono font-bold text-forest-800">${timeStr}</td>
                    <td class="p-2.5 text-right font-mono font-bold text-espresso-900">$${entry.netWorth.toLocaleString()}</td>
                `;
                container.appendChild(tr);
            });
        }

        function submitPlayerScore() {
            const nameInput = document.getElementById('playerNameInput');
            const name = nameInput ? nameInput.value.trim() : '';
            if (!name) return;

            const list = getLeaderboard();
            list.push({
                name: name,
                months: monthsPassed,
                netWorth: Math.round(getNetWorth())
            });

            saveLeaderboard(list);

            const submitBox = document.getElementById('victoryLeaderboardSubmit');
            if (submitBox) {
                submitBox.innerHTML = `
                    <div class="text-center py-1 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-circle-check text-emerald-600" aria-hidden="true"></i>
                        Pontuação salva no Salão da Fama!
                    </div>
                `;
            }

            setTimeout(() => {
                closeVictoryModal();
                toggleLeaderboardModal();
            }, 800);
        }

        function resetLeaderboard() {
            saveLeaderboard(DEFAULT_LEADERBOARD);
            renderLeaderboardTable();
        }

        function triggerCrossoverVictory() {
            const exp = getMonthlyExpenses();
            const pass = getTotalMonthlyPassiveIncome();
            const joyScore = getHappinessScore();
            
            document.getElementById('victoryPassive').innerText = `+$${Math.round(pass).toLocaleString()}/mês`;
            document.getElementById('victoryExpenses').innerText = `$${exp.toLocaleString()}/mês`;
            
            const yrs = Math.floor(monthsPassed / 12);
            document.getElementById('victoryTime').innerText = `${yrs} Anos (${monthsPassed} Meses)`;
            document.getElementById('victoryNetWorth').innerText = `$${Math.round(getNetWorth()).toLocaleString()}`;

            // Life Joy Title
            const joyTitleElem = document.getElementById('victoryJoyTitle');
            if (joyTitleElem) {
                if (joyScore >= 75) {
                    joyTitleElem.innerHTML = `👑 <strong class="text-amber-700">Mestre da Riqueza e Alegria</strong> (${joyScore}/100 Alegria)`;
                } else if (joyScore >= 45) {
                    joyTitleElem.innerHTML = `⚖️ <strong class="text-emerald-700">Construtor Equilibrado</strong> (${joyScore}/100 Alegria)`;
                } else {
                    joyTitleElem.innerHTML = `🪙 <strong class="text-rose-700">Asceta Frugal</strong> (${joyScore}/100 Alegria)`;
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
            document.getElementById('activeDisplay').innerText = `$${baseMonthlySalary.toLocaleString()}/mês`;
            document.getElementById('expensesDisplay').innerText = `$${exp.toLocaleString()}/mês`;
            document.getElementById('passiveDisplay').innerText = `+$${Math.round(pass).toLocaleString()}/mês`;
            document.getElementById('freedomPctDisplay').innerText = `${coverage.toFixed(1)}%`;
            document.getElementById('freedomProgressBar').style.width = `${coverage}%`;
            document.getElementById('marketplaceCash').innerText = `$${Math.round(cash).toLocaleString()}`;

            // Life Joy Card Update
            const joyDisplay = document.getElementById('happinessDisplay');
            const joySubtext = document.getElementById('happinessSubtext');
            if (joyDisplay && joySubtext) {
                joyDisplay.innerText = `${joyScore} / 100`;
                if (joyScore >= 70) {
                    joySubtext.innerText = 'Alta energia • Bônus frequentes!';
                    joySubtext.className = 'block text-[9px] text-emerald-800 font-bold mt-0.5';
                } else if (joyScore >= 40) {
                    joySubtext.innerText = 'Equilibrado • Ritmo sustentável';
                    joySubtext.className = 'block text-[9px] text-amber-900/70 font-medium mt-0.5';
                } else {
                    joySubtext.innerText = 'Frugalidade extrema • Risco de estresse';
                    joySubtext.className = 'block text-[9px] text-rose-700 font-bold mt-0.5';
                }
            }

            // Family Status Badge
            const familyBadge = document.getElementById('familyStatusBadge');
            const familyText = document.getElementById('familyStatusText');
            if (familyState.hasKid) {
                familyBadge.classList.remove('hidden');
                const yrs = Math.floor(familyState.kidAgeMonths / 12);
                let stageLabel = "Bebé (+$500/mês)";
                if (yrs >= 13) stageLabel = "Adolescente (+$1.000/mês)";
                else if (yrs >= 6) stageLabel = "Ensino Fundamental (+$750/mês)";
                familyText.innerText = `Filho ${yrs} Anos • ${stageLabel}`;
            } else {
                familyBadge.classList.add('hidden');
            }

            // Turn Action Projected Savings
            const projElem = document.getElementById('projectedMonthlySavings');
            if (projElem) {
                projElem.innerText = `${netSurplus >= 0 ? '+' : ''}$${Math.round(netSurplus).toLocaleString()}/mês`;
                projElem.className = netSurplus >= 0 ? 'text-gold-400 font-mono font-bold' : 'text-rose-300 font-mono font-bold';
            }

            // Time & Crossover Bar
            const years = Math.floor(monthsPassed / 12);
            document.getElementById('monthsPassedBadge').innerText = `Ano ${years}`;

            document.getElementById('barExpenseVal').innerText = `$${exp.toLocaleString()}/mês`;
            document.getElementById('barPassiveVal').innerText = `+$${Math.round(pass).toLocaleString()}/mês`;

            // Normalize racing bar scales
            const maxBarScale = Math.max(exp, pass, 3000);
            document.getElementById('expensesBar').style.width = `${Math.min(100, (exp / maxBarScale) * 100)}%`;
            document.getElementById('passiveBar').style.width = `${Math.min(100, (pass / maxBarScale) * 100)}%`;

            const gap = exp - pass;
            const gapElem = document.getElementById('crossoverGapNotice');
            if (gap <= 0) {
                gapElem.className = 'text-center py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 rounded-lg border border-emerald-300';
                gapElem.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600 mr-1"></i> PONTO DE CRUZAMENTO ALCANÇADO!`;
            } else {
                gapElem.className = 'text-center py-1 text-xs font-medium text-espresso-800/80 bg-cream-100 rounded-lg border border-cream-200';
                gapElem.innerHTML = `Falta: <span class="font-bold text-rose-700">$${Math.round(gap).toLocaleString()}/mês</span> para a liberdade.`;
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
                            <span class="text-espresso-800/70">Preço: <strong class="text-espresso-950 font-mono">$${asset.unitCost.toLocaleString()}</strong></span>
                            <span class="${yieldColor} font-bold font-mono">${yieldSign}$${asset.monthlyYieldPerUnit}/mês</span>
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
                                Vender Tudo (${asset.ownedUnits})
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
            
            document.getElementById('holdingsCountBadge').innerText = `${totalHoldingsCount} Ativos`;
            document.getElementById('sidebarTotalInvested').innerText = `$${getTotalInvestedCapital().toLocaleString()}`;
            document.getElementById('sidebarTotalPassive').innerText = `+$${Math.round(getTotalMonthlyPassiveIncome()).toLocaleString()}/mês`;

            updateAssetPieChart();

            if (!container) return;
            container.innerHTML = '';

            const activeHoldings = assets.filter(a => a.ownedUnits > 0);

            if (activeHoldings.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-4 text-espresso-800/60 italic text-xs">
                        Você ainda não possui ativos. Compre no mercado!
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
                        <span class="font-bold font-mono text-xs ${totalIncome >= 0 ? 'text-emerald-700' : 'text-rose-600'}">${totalIncome >= 0 ? '+' : ''}$${Math.round(totalIncome)}/mês</span>
                    </div>
                    <div class="flex items-center justify-end gap-1.5 pt-1 border-t border-cream-200">
                        <button data-onclick="sellAsset('${asset.id}', 1)" class="px-2 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold transition">
                            Vender 1
                        </button>
                        <button data-onclick="sellAllAsset('${asset.id}')" class="px-2 py-0.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[10px] font-bold transition">
                            Vender Tudo
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
                    note.textContent = 'Não foi possível desenhar o gráfico. Todos os valores que mostraria também aparecem como texto nesta página.';
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
                '#134e2a', // Verde Floresta
                '#d4a338', // Ouro
                '#3a2719', // Espresso
                '#10b981', // Esmeralda
                '#2563eb', // Azul
                '#9333ea'  // Roxo
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
                console.error("Erro ao renderizar gráfico:", e);
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
            document.getElementById('housingCostBadge').innerText = `$${lifestyleCosts.housing[currentLifestyle.housing]}/mês`;
            document.getElementById('transportCostBadge').innerText = `$${lifestyleCosts.transport[currentLifestyle.transport]}/mês`;
            document.getElementById('lifestyleCostBadge').innerText = `$${lifestyleCosts.lifestyle[currentLifestyle.lifestyle]}/mês`;
            document.getElementById('subscriptionsCostBadge').innerText = `$${lifestyleCosts.subscriptions[currentLifestyle.subscriptions]}/mês`;
            document.getElementById('travelCostBadge').innerText = `$${lifestyleCosts.travel[currentLifestyle.travel]}/mês`;
            document.getElementById('shoppingCostBadge').innerText = `$${lifestyleCosts.shopping[currentLifestyle.shopping]}/mês`;

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
