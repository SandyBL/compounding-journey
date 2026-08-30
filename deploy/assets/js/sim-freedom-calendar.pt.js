// HABIT DATABASE IN PORTUGUESE
        const HABITS_DATA = [
            {
                id: 'coffee',
                title: 'Cafés Especiais e Bebidas Diárias',
                icon: 'fa-mug-hot',
                category: 'Micro-Hábito Diário',
                baseCost: 5,
                unit: 'day', // 'day', 'week', 'month'
                desc: 'Cafés especiais, energéticos ou cafés gelados comprados no dia a dia.',
                tip: 'Invista em uma prensa francesa ou cafeteira de espresso de qualidade para casa e um copo térmico. Você mantém seu ritual diário por menos de R$0.50 por xícara!',
                choicePct: 100
            },
            {
                id: 'lunch',
                title: 'Restaurantes e Delivery no Almoço',
                icon: 'fa-utensils',
                category: 'Micro-Hábito Diário',
                baseCost: 15,
                unit: 'day',
                desc: 'Pedir por apps de entrega (UberEats/iFood) ou comer fora diariamente em vez de levar almoço.',
                tip: 'Prepare refeições em lote nos fins de semana ou tenha refeições congeladas no trabalho para reduzir o delivery a 1 dia por semana como recompensa.',
                choicePct: 100
            },
            {
                id: 'subscriptions',
                title: 'Assinaturas de Streaming e Apps Não Utilizados',
                icon: 'fa-tv',
                category: 'Recurrente Mensal',
                baseCost: 120,
                unit: 'month',
                desc: 'Múltiples serviços de streaming, academias ou aplicativos sem uso regular.',
                tip: 'Adote a "Regra de Uma por Vez": assine apenas 1 serviço de streaming por mês, assista o que quiser, cancele e troque.',
                choicePct: 100
            },
            {
                id: 'carLease',
                title: 'Renovar o Leasing do Carro a Cada 3 Anos',
                icon: 'fa-car',
                category: 'Estilo de Vida Maior',
                baseCost: 350,
                unit: 'month',
                desc: 'Dirigir sempre um carro zero arrendado em vez de manter um veículo próprio confiável e quitado.',
                tip: 'Compre um seminovo certificado de 3 anos e mantenha-o por 7–10 anos. Redirecione as parcelas do leasing diretamente para fundos de índice.',
                choicePct: 100
            },
            {
                id: 'impulseShopping',
                title: 'Compras Impulsivas de Roupas e Tecnologia',
                icon: 'fa-bag-shopping',
                category: 'Gasto Impulsivo',
                baseCost: 40,
                unit: 'week',
                desc: 'Comprar roupas, acessórios ou ofertas de tecnologia não planejadas.',
                tip: 'Aplique a "Regra de Esfriamento de 72 Horas" para compras não essenciais. Se ainda quiser após 3 dias, avalie primeiro o custo em horas de trabalho.',
                choicePct: 100
            },
            {
                id: 'weekendDining',
                title: 'Saídas de Fim de Semana e Jantares Premium',
                icon: 'fa-martini-glass-citrus',
                category: 'Social e Lazer',
                baseCost: 80,
                unit: 'week',
                desc: 'Drinks, delivery gourmet e jantares sociais de alto padrão nos fins de semana.',
                tip: 'Organize jantares comunitários ("potluck") com amigos ou mude para água com gás após 1 drink ao sair para comer.',
                choicePct: 100
            },
            {
                id: 'energySnacks',
                title: 'Lanches e Bebidas de Conveniência',
                icon: 'fa-bolt',
                category: 'Micro-Hábito Diário',
                baseCost: 6,
                unit: 'day',
                desc: 'Lanches de posto de gasolina, energéticos e compras impulsivas em máquinas de venda.',
                tip: 'Compre lanches e bebidas no atacado e mantenha pacotes de emergência no seu carro, mochila ou mesa de trabalho.',
                choicePct: 100
            },
            {
                id: 'techUpgrades',
                title: 'Troca Anual de Smartphone',
                icon: 'fa-mobile-screen-button',
                category: 'Estilo de Vida Maior',
                baseCost: 50,
                unit: 'month',
                desc: 'Trocar de celular todo ano pelo modelo mais recente.',
                tip: 'Troque a bateria do seu celular após 2 anos em vez de comprar um aparelho novo. Mire em um ciclo de uso de 4 anos por aparelho.',
                choicePct: 100
            },
            {
                id: 'gymMembership',
                title: 'Mensalidades de Academia Não Utilizadas',
                icon: 'fa-dumbbell',
                category: 'Recurrente Mensal',
                baseCost: 60,
                unit: 'month',
                desc: 'Pagar mensalidade de academias boutique ou apps fitness que raramente utiliza.',
                tip: 'Se você vai menos de duas vezes por semana, cancele ou pause a assinatura. Experimente corridas ao ar livre, calistenia ou passes avulsos.',
                choicePct: 100
            },
            {
                id: 'storageUnit',
                title: 'Aluguel de Depósitos/Guarda-Móveis para Acúmulo',
                icon: 'fa-boxes-stacked',
                category: 'Recurrente Mensal',
                baseCost: 150,
                unit: 'month',
                desc: 'Alugar um espaço fora de casa para guardar móveis antigos e itens extras.',
                tip: 'Faça um desapego ou venda os itens. Se o conteúdo não vale 2 anos de aluguel, desfaça-se dele!',
                choicePct: 100
            },
            {
                id: 'foodWaste',
                title: 'Desperdício de Alimentos e Compras Vencidas',
                icon: 'fa-trash-arrow-up',
                category: 'Gasto Impulsivo',
                baseCost: 40,
                unit: 'week',
                desc: 'Alimentos frescos e feira que estragam na geladeira antes de serem consumidos.',
                tip: 'Compre com uma lista exata de refeições, faça um inventário antes de ir ao mercado e congele alimentos frescos antes que estraguem.',
                choicePct: 100
            },
            {
                id: 'shortRideshares',
                title: 'Viagens Curtas em Apps de Transporte (Uber/99)',
                icon: 'fa-taxi',
                category: 'Micro-Hábito Diário',
                baseCost: 25,
                unit: 'week',
                desc: 'Pedir corridas em aplicativos para distâncias curtas que poderiam ser feitas a pé ou de transporte público.',
                tip: 'Crie a regra de caminhar qualquer trajeto menor que 15 minutos. Funciona como exercício diário gratuito!',
                choicePct: 100
            },
            {
                id: 'bottledWater',
                title: 'Garrafas de Água e Bebidas Descartáveis',
                icon: 'fa-bottle-water',
                category: 'Micro-Hábito Diário',
                baseCost: 3,
                unit: 'day',
                desc: 'Comprar garrafas de água, refrigerantes ou chás por pura conveniência.',
                tip: 'Carregue uma garrafa de água reutilizável de aço inoxidável com filtro. Você economiza dinheiro e reduz o plástico instantaneamente.',
                choicePct: 100
            }
        ];

        // USER PROFILE BASELINE STATE
        let profile = {
            currentAge: 30,
            annualIncome: 60000,
            workHoursPerWeek: 40,
            startingNetWorth: 15000,
            basicMonthlyExpenses: 2500, // Rent, groceries, utilities, basics
            realReturnRate: 0.07, // 7% real compound interest rate
            safeWithdrawalRate: 0.04 // 4% rule (FIRE 25x rule)
        };

        let habits = JSON.parse(JSON.stringify(HABITS_DATA));
        let chartInstance = null;

        function getHourlyWage() {
            const annualHours = Math.max(1, profile.workHoursPerWeek * 52);
            return Math.max(0.01, profile.annualIncome / annualHours);
        }

        function getHabitMonthlyCost(habit, forceChoicePct = null) {
            const pct = (forceChoicePct !== null) ? forceChoicePct : habit.choicePct;
            const effectiveCost = (habit.baseCost * pct) / 100;
            
            if (habit.unit === 'day') {
                return effectiveCost * (365 / 12);
            } else if (habit.unit === 'week') {
                return effectiveCost * (52 / 12);
            } else {
                return effectiveCost;
            }
        }

        function calculate30YearWealth(monthlySavings) {
            if (monthlySavings <= 0) return 0;
            const r = profile.realReturnRate / 12;
            const n = 360;
            return monthlySavings * ((Math.pow(1 + r, n) - 1) / r);
        }

        function simulateFreedomAge(monthlyHabitsCost) {
            const annualExpenses = (profile.basicMonthlyExpenses + monthlyHabitsCost) * 12;
            const targetNetWorth = annualExpenses / profile.safeWithdrawalRate;
            let currentNW = profile.startingNetWorth;
            const annualSavings = Math.max(0, profile.annualIncome - annualExpenses);

            if (currentNW >= targetNetWorth) return profile.currentAge;

            let years = 0;
            const maxYears = 70;

            while (currentNW < targetNetWorth && years < maxYears) {
                currentNW = (currentNW * (1 + profile.realReturnRate)) + annualSavings;
                years++;
            }

            return Math.min(85, profile.currentAge + years);
        }

        function renderHabitCards() {
            const container = document.getElementById('habitsContainer');
            if (!container) return;
            container.innerHTML = '';

            const hourlyWage = getHourlyWage();

            habits.forEach((habit, idx) => {
                const fullMonthlyCost = getHabitMonthlyCost(habit, 100);
                const currentMonthlyCost = getHabitMonthlyCost(habit);
                const monthlySaved = fullMonthlyCost - currentMonthlyCost;

                const annualSaved = monthlySaved * 12;
                const workHoursSavedPerYear = annualSaved / hourlyWage;
                const workDaysSavedPerYear = workHoursSavedPerYear / 8; // Assuming 8-hr workday

                const card = document.createElement('div');
                card.className = 'bg-cream-50 rounded-2xl p-5 border border-cream-300 custom-shadow transition-all duration-200 hover:border-cream-400';

                const unitLabel = habit.unit === 'day' ? 'dia' : (habit.unit === 'week' ? 'sem' : 'mês');

                card.innerHTML = `
                    <div class="flex items-start justify-between gap-3 mb-2">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-forest-800/10 text-forest-800 flex items-center justify-center text-lg flex-shrink-0">
                                <i class="fa-solid ${habit.icon}" aria-hidden="true"></i>
                            </div>
                            <div>
                                ${habit.isCustom ? 
                                    `<input type="text" value="${habit.title}" data-onchange="updateHabitTitle(${idx}, this.value)" class="font-bold text-espresso-950 text-base bg-transparent border-b border-dashed border-cream-400 focus:outline-none focus:border-forest-800">` : 
                                    `<h4 class="font-bold text-espresso-950 text-base">${habit.title}</h4>`
                                }
                                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-cream-200 text-espresso-800 block mt-0.5 w-fit">
                                    ${habit.category} • Base: R$${habit.baseCost}/${unitLabel}
                                </span>
                            </div>
                        </div>

                        <!-- Badge: Work Days Saved & Actions -->
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold font-mono ${monthlySaved > 0 ? 'text-emerald-700 bg-emerald-100' : 'text-espresso-800/60 bg-cream-200'} px-2.5 py-1 rounded-lg block">
                                ${monthlySaved > 0 ? '+' + workDaysSavedPerYear.toFixed(1) + ' Dias Trabalho/Ano Economizados' : 'Gasto Total'}
                            </span>
                            ${habit.isCustom ? `
                                <button onclick="deleteHabit(${idx})" class="text-rose-600 hover:text-rose-800 p-1 text-xs font-bold transition-colors" title="Excluir Gasto">
                                    <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <p class="text-xs text-espresso-800/80 mb-3 leading-relaxed">${habit.desc}</p>

                    ${habit.tip ? `
                        <div class="mb-3 p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-start gap-2 text-xs text-espresso-900">
                            <i class="fa-solid fa-lightbulb text-gold-600 mt-0.5 flex-shrink-0" aria-hidden="true"></i>
                            <div>
                                <strong class="text-gold-700 font-bold block mb-0.5">Dica de Ação Inteligente:</strong>
                                <span class="text-espresso-800/90 leading-normal">${habit.tip}</span>
                            </div>
                        </div>
                    ` : ''}

                    <!-- EDITABLE COST & FREQUENCY INPUT ROW -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 p-3 bg-cream-100/90 rounded-xl border border-cream-300">
                        <div class="flex items-center justify-between gap-2">
                            <label class="text-xs font-bold text-espresso-900">Gasto Base (R$):</label>
                            <div class="relative flex items-center">
                                <span class="absolute left-2.5 text-xs text-espresso-800 font-bold">R$</span>
                                <input type="number" min="0" step="1" value="${habit.baseCost}" 
                                    data-onchange="updateHabitBaseCost(${idx}, this.value)" 
                                    class="w-28 pl-6 pr-2 py-1 bg-cream-50 rounded-lg border border-cream-300 text-xs font-bold font-mono text-forest-800 focus:ring-2 focus:ring-forest-800">
                            </div>
                        </div>

                        <div class="flex items-center justify-between gap-2">
                            <label class="text-xs font-bold text-espresso-900">Frequência:</label>
                            <select data-onchange="updateHabitUnit(${idx}, this.value)" 
                                class="px-2.5 py-1 bg-cream-50 rounded-lg border border-cream-300 text-xs font-bold text-espresso-900 focus:ring-2 focus:ring-forest-800 cursor-pointer">
                                <option value="day" ${habit.unit === 'day' ? 'selected' : ''}>Diário (R$/dia)</option>
                                <option value="week" ${habit.unit === 'week' ? 'selected' : ''}>Semanal (R$/sem)</option>
                                <option value="month" ${habit.unit === 'month' ? 'selected' : ''}>Mensal (R$/mês)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Slider Control -->
                    <div class="space-y-2 bg-cream-100 p-3.5 rounded-xl border border-cream-200">
                        <div class="flex justify-between items-center text-xs font-bold">
                            <span class="text-espresso-900">Opção de Gasto: <strong class="text-forest-800 font-mono">${habit.choicePct}%</strong></span>
                            <span class="text-espresso-800 font-mono">Atual: R$${Math.round(currentMonthlyCost)}/mês <span class="text-[10px] font-normal text-espresso-800/70">(Total: R$${Math.round(fullMonthlyCost)}/mês)</span></span>
                        </div>

                        <input type="range" min="0" max="100" step="25" value="${habit.choicePct}" 
                            data-oninput="updateHabitChoice(${idx}, this.value)" 
                            class="w-full accent-forest-800 bg-cream-300 h-2 rounded-lg cursor-pointer">

                        <div class="flex justify-between text-[10px] font-semibold text-espresso-800/70">
                            <span>0% (Eliminado)</span>
                            <span>50% (Reduzido)</span>
                            <span>100% (Manter Tudo)</span>
                        </div>
                    </div>
                `;

                container.appendChild(card);
            });
        }

        function updateHabitBaseCost(index, value) {
            const val = parseFloat(value);
            habits[index].baseCost = isNaN(val) ? 0 : Math.max(0, val);
            recalculateAll();
            renderHabitCards();
        }

        function updateHabitUnit(index, unit) {
            habits[index].unit = unit;
            renderHabitCards();
            recalculateAll();
        }

        function updateHabitTitle(index, title) {
            habits[index].title = title || 'Gasto Personalizado';
        }

        function addCustomHabit() {
            habits.push({
                id: 'custom_' + Date.now(),
                title: 'Novo Gasto Personalizado',
                icon: 'fa-receipt',
                category: 'Gasto Personalizado',
                baseCost: 10,
                unit: 'day',
                desc: 'Insira o custo e a frequência do seu gasto recorrente personalizado.',
                tip: 'Analise se este gasto traz valor real para você ou se pode ser otimizado sem afetar sua qualidade de vida.',
                choicePct: 100,
                isCustom: true
            });
            renderHabitCards();
            recalculateAll();
        }

        function deleteHabit(index) {
            habits.splice(index, 1);
            renderHabitCards();
            recalculateAll();
        }

        function updateHabitChoice(index, value) {
            habits[index].choicePct = parseInt(value, 10);
            renderHabitCards();
            recalculateAll();
        }

        function setGlobalPreset(pct) {
            habits.forEach(h => h.choicePct = pct);
            renderHabitCards();
            recalculateAll();
        }

        function toggleProfileDrawer() {
            const drawer = document.getElementById('profileDrawer');
            if (drawer) drawer.classList.toggle('hidden');
        }

        function updateProfileSettings() {
            profile.currentAge = parseInt(document.getElementById('inputCurrentAge').value, 10) || 30;
            profile.annualIncome = parseFloat(document.getElementById('inputAnnualIncome').value) || 60000;
            profile.workHoursPerWeek = parseInt(document.getElementById('inputWorkHours').value, 10) || 40;
            profile.startingNetWorth = parseFloat(document.getElementById('inputNetWorth').value) || 15000;
            profile.basicMonthlyExpenses = parseFloat(document.getElementById('inputBasicExpenses').value) || 2500;

            const wage = getHourlyWage();
            document.getElementById('computedHourlyWage').innerText = `R$${wage.toFixed(2)}/hr`;

            renderHabitCards();
            recalculateAll();
        }

        function recalculateAll() {
            const hourlyWage = getHourlyWage();

            // Total Monthly Spend at 100%
            const baselineMonthlyHabits = habits.reduce((sum, h) => sum + getHabitMonthlyCost(h, 100), 0);
            
            // Total Monthly Spend at Current Choices
            const optimizedMonthlyHabits = habits.reduce((sum, h) => sum + getHabitMonthlyCost(h), 0);

            const monthlySaved = baselineMonthlyHabits - optimizedMonthlyHabits;
            const annualSaved = monthlySaved * 12;

            // Work Time Saved
            const annualWorkHoursSaved = annualSaved / hourlyWage;
            const annualWorkDaysSaved = annualWorkHoursSaved / 8;

            // 30-Year Compounded Wealth Gained
            const wealthGained30Yr = calculate30YearWealth(monthlySaved);

            // Freedom Target Ages
            const baselineFreedomAge = simulateFreedomAge(baselineMonthlyHabits);
            const optimizedFreedomAge = simulateFreedomAge(optimizedMonthlyHabits);
            const yearsPulledForward = Math.max(0, baselineFreedomAge - optimizedFreedomAge);

            // UPDATE UI ELEMENTS
            document.getElementById('baselineAgeDisplay').innerText = `Idade ${baselineFreedomAge}`;
            document.getElementById('optimizedAgeDisplay').innerText = `Idade ${optimizedFreedomAge}`;

            const badge = document.getElementById('yearsSavedBadge');
            if (yearsPulledForward > 0) {
                badge.classList.remove('hidden');
                badge.innerHTML = `<i class="fa-solid fa-calendar-check"></i><span>¡Liberdade Antecipada em ${yearsPulledForward} ANOS!</span>`;
            } else {
                badge.classList.add('hidden');
            }

            document.getElementById('currentAgeLabel').innerText = profile.currentAge;
            document.getElementById('timelineTargetLabel').innerText = optimizedFreedomAge;

            // Progress Fill Bar
            const totalRange = Math.max(1, 65 - profile.currentAge);
            const progressPct = Math.min(100, Math.max(10, ((65 - optimizedFreedomAge) / totalRange) * 100));
            document.getElementById('timelineProgressFill').style.width = `${progressPct}%`;

            // Stat Cards
            document.getElementById('statMonthlySaved').innerText = `+R$${Math.round(monthlySaved).toLocaleString('pt-BR')}/mês`;
            document.getElementById('statWorkDaysSaved').innerText = `${annualWorkDaysSaved.toFixed(1)} Dias/Ano`;
            document.getElementById('stat30YearWealth').innerText = `R$${Math.round(wealthGained30Yr).toLocaleString('pt-BR')}`;

            // Update Chart
            updateWealthChart(baselineMonthlyHabits, optimizedMonthlyHabits);

            updateResultCta({
                monthlySaved,
                annualWorkDaysSaved,
                wealthGained30Yr,
                baselineFreedomAge,
                optimizedFreedomAge,
                yearsPulledForward
            });
        }

        /**
         * Classifies the run for the result-aware panel, and hands it the
         * numbers the copy quotes back.
         *
         * recalculateAll() runs on every slider movement, including the first
         * render, so the interesting part of this is when it says nothing. A
         * visitor who has not moved anything yet has told the tool nothing
         * about themselves, and a panel that appears before they have touched a
         * habit is an offer attached to no result. `monthlySaved > 0` is the
         * cheapest honest signal that a choice has been made.
         *
         * The outcome is deliberately not "how much did you save" but "what
         * kind of situation is this". A visitor who found nine years and one
         * who found one year need different next steps; a visitor whose plan
         * never reaches independence however hard they cut needs a different
         * conversation altogether, and asking them to fill in a long
         * questionnaire is the wrong response to it.
         */
        function updateResultCta(result) {
            if (!window.SimCta) return;
            if (result.monthlySaved <= 0) return;

            // The tool caps its own projection at 85, which is how it says
            // "not within a working life". Asked with every habit at zero,
            // that answer is about the shape of the plan rather than about
            // spending, and no slider on this page moves it.
            const cannotGetThereAtAll = simulateFreedomAge(0) >= 85;

            const years = result.yearsPulledForward;
            let bucket;
            if (cannotGetThereAtAll) bucket = 'stalled';
            else if (years < 1) return; // real money, not yet a whole year of life
            else if (years >= 6) bucket = 'major';
            else if (years >= 3) bucket = 'strong';
            else bucket = 'modest';

            // The single habit carrying the most of the saving. Named rather
            // than ranked, because the point being made is that the easiest
            // slider to move and the largest leak are often not the same one.
            let top = null;
            habits.forEach((habit) => {
                const saved = getHabitMonthlyCost(habit, 100) - getHabitMonthlyCost(habit);
                if (!top || saved > top.saved) top = { title: habit.title, saved };
            });

            window.SimCta.show(bucket, {
                years,
                age: result.optimizedFreedomAge,
                baselineAge: result.baselineFreedomAge,
                monthly: window.SimCta.money(result.monthlySaved),
                workDays: window.SimCta.integer(result.annualWorkDaysSaved),
                wealth: window.SimCta.money(result.wealthGained30Yr),
                topHabit: top ? top.title : '',
                topHabitMonthly: top ? window.SimCta.money(top.saved) : ''
            });
        }

        function updateWealthChart(baselineHabitsMonthly, optimizedHabitsMonthly) {
            const ctx = document.getElementById('wealthChart');
            if (!ctx) return;

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

            const yearsToProject = 30;
            const labels = [];
            const baselineData = [];
            const optimizedData = [];

            const baselineAnnualSavings = Math.max(0, profile.annualIncome - (profile.basicMonthlyExpenses * 12) - (baselineHabitsMonthly * 12));
            const optimizedAnnualSavings = Math.max(0, profile.annualIncome - (profile.basicMonthlyExpenses * 12) - (optimizedHabitsMonthly * 12));

            for (let i = 0; i <= yearsToProject; i += 5) {
                labels.push(`Ano ${i}`);
            }

            let curB = profile.startingNetWorth;
            let curO = profile.startingNetWorth;

            for (let year = 0; year <= yearsToProject; year++) {
                if (year % 5 === 0) {
                    baselineData.push(Math.round(curB));
                    optimizedData.push(Math.round(curO));
                }
                curB = (curB * (1 + profile.realReturnRate)) + baselineAnnualSavings;
                curO = (curO * (1 + profile.realReturnRate)) + optimizedAnnualSavings;
            }

            if (chartInstance) {
                chartInstance.destroy();
            }

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Estratégia de Hábitos Otimizada',
                            data: optimizedData,
                            borderColor: '#2e6f40',
                            backgroundColor: 'rgba(46, 111, 64, 0.15)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.3,
                            pointBackgroundColor: '#2e6f40'
                        },
                        {
                            label: 'Hábitos de Base (Sem Cortes)',
                            data: baselineData,
                            borderColor: '#e11d48',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            pointBackgroundColor: '#e11d48'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { size: 11, family: 'Inter' },
                                boxWidth: 12
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: val => 'R$' + (val / 1000).toFixed(0) + 'k',
                                font: { size: 10 }
                            }
                        },
                        x: {
                            ticks: { font: { size: 10 } }
                        }
                    }
                }
            });
        }

        // ON INITIAL LOAD
        window.onload = function() {
            updateProfileSettings();
        };
