// HABIT DATABASE IN SPANISH
        const HABITS_DATA = [
            {
                id: 'coffee',
                title: 'Café Especial y Bebidas Diarias',
                icon: 'fa-mug-hot',
                category: 'Micro-Hábito Diario',
                baseCost: 5,
                unit: 'day', // 'day', 'week', 'month'
                desc: 'Cafés especiales, bebidas energéticas o cafés helados comprados al paso.',
                tip: 'Invierte en una prensa francesa o cafetera de espresso de calidad para casa y un termo hermético. ¡Mantienes tu ritual diario por menos de €0.50 por taza!',
                choicePct: 100
            },
            {
                id: 'lunch',
                title: 'Restaurantes y Entregas de Almuerzo Diarias',
                icon: 'fa-utensils',
                category: 'Micro-Hábito Diario',
                baseCost: 15,
                unit: 'day',
                desc: 'Pedir por UberEats/DoorDash o comer fuera en lugar de llevar almuerzo preparado.',
                tip: 'Prepara comidas en lote los domingos o ten comidas congeladas gourmet en el trabajo para reducir el delivery a 1 día por semana como recompensa.',
                choicePct: 100
            },
            {
                id: 'subscriptions',
                title: 'Suscripciones a Streaming y Apps No Utilizadas',
                icon: 'fa-tv',
                category: 'Recurrente Mensual',
                baseCost: 120,
                unit: 'month',
                desc: 'Múltiples servicios de streaming, membresías de gimnasio o aplicaciones sin uso.',
                tip: 'Adopta la "Regla de Una a la Vez": suscríbete a solo 1 servicio de streaming al mes, mira lo que quieras, cancela y cambia.',
                choicePct: 100
            },
            {
                id: 'carLease',
                title: 'Renovar el Leasing del Auto Cada 3 Años',
                icon: 'fa-car',
                category: 'Estilo de Vida Mayor',
                baseCost: 350,
                unit: 'month',
                desc: 'Manejar siempre un auto arrendado nuevo en lugar de mantener un vehículo propio confiable y pagado.',
                tip: 'Compra un auto seminuevo certificado de 3 años y mantenlo durante 7–10 años. Redirige las cuotas del leasing directamente a fondos indexados.',
                choicePct: 100
            },
            {
                id: 'impulseShopping',
                title: 'Compras Impulsivas de Ropa y Tecnología',
                icon: 'fa-bag-shopping',
                category: 'Gasto Impulsivo',
                baseCost: 40,
                unit: 'week',
                desc: 'Comprar camisetas, accesorios o ofertas tecnológicas que no tenías planeadas.',
                tip: 'Aplica la "Regla de Enfriamiento de 72 Horas" para compras no esenciales. Si aún lo quieres 3 días después, evalúa primero su costo en horas de trabajo.',
                choicePct: 100
            },
            {
                id: 'weekendDining',
                title: 'Salidas Fin de Semana y Cenas Premium',
                icon: 'fa-martini-glass-citrus',
                category: 'Social y Ocio',
                baseCost: 80,
                unit: 'week',
                desc: 'Cócteles, comida para llevar y cenas sociales de alto nivel los fines de semana.',
                tip: 'Organiza cenas comunitarias ("potluck") con amigos o cambia a agua con gas después de 1 cóctel cuando salgas a comer para mantener la diversión sin la gran cuenta.',
                choicePct: 100
            },
            {
                id: 'energySnacks',
                title: 'Snacks y Bebidas de Conveniencia Diarios',
                icon: 'fa-bolt',
                category: 'Micro-Hábito Diario',
                baseCost: 6,
                unit: 'day',
                desc: 'Snacks de gasolinera, latas de energía y compras impulsivas en máquinas expendedoras.',
                tip: 'Compra snacks y bebidas al por mayor en clubes de descuento y ten paquetes de emergencia en tu auto, mochila o escritorio.',
                choicePct: 100
            },
            {
                id: 'techUpgrades',
                title: 'Actualización Anual de Teléfono Inteligente',
                icon: 'fa-mobile-screen-button',
                category: 'Estilo de Vida Mayor',
                baseCost: 50,
                unit: 'month',
                desc: 'Cambiar tu teléfono cada año por el modelo más nuevo.',
                tip: 'Cambia la batería de tu teléfono después de 2 años en lugar de comprar un dispositivo nuevo. Apunta a un ciclo de vida de 4 años por teléfono.',
                choicePct: 100
            },
            {
                id: 'gymMembership',
                title: 'Membresías de Gimnasio y Fitness No Usadas',
                icon: 'fa-dumbbell',
                category: 'Recurrente Mensual',
                baseCost: 60,
                unit: 'month',
                desc: 'Pagar acceso a gimnasios boutique o apps de fitness que raras veces usas.',
                tip: 'Si vas menos de dos veces por semana, congela la membresía. Intenta correr al aire libre, calistenia o pases por visita.',
                choicePct: 100
            },
            {
                id: 'storageUnit',
                title: 'Alquiler de Bodegas/Trasteros para Acumulación',
                icon: 'fa-boxes-stacked',
                category: 'Recurrente Mensual',
                baseCost: 150,
                unit: 'month',
                desc: 'Alquilar un espacio fuera de casa para guardar muebles viejos y artículos extra.',
                tip: 'Organiza una venta de garaje de fin de semana o dona los objetos. Si el contenido no vale 2 años de alquiler, ¡liquídalo!',
                choicePct: 100
            },
            {
                id: 'foodWaste',
                title: 'Desperdicio de Comida y Comestibles Vencidos',
                icon: 'fa-trash-arrow-up',
                category: 'Gasto Impulsivo',
                baseCost: 40,
                unit: 'week',
                desc: 'Comestibles y productos frescos que se echan a perder en el refrigerador antes de comerlos.',
                tip: 'Compra con una lista exacta de comidas, haz un inventario antes de comprar y congela alimentos frescos antes de que se arruinen.',
                choicePct: 100
            },
            {
                id: 'shortRideshares',
                title: 'Viajes Cortos en Apps de Transporte (Uber/Lyft)',
                icon: 'fa-taxi',
                category: 'Micro-Hábito Diario',
                baseCost: 25,
                unit: 'week',
                desc: 'Pedir viajes en app para distancias cortas que podrías caminar o hacer en transporte público.',
                tip: 'Ponte la regla de caminar cualquier trayecto de menos de 15 minutos o mantén una tarjeta de transporte público a mano. ¡Sirve como ejercicio diario gratuito!',
                choicePct: 100
            },
            {
                id: 'bottledWater',
                title: 'Agua Embotellada y Bebidas de Un Solo Uso',
                icon: 'fa-bottle-water',
                category: 'Micro-Hábito Diario',
                baseCost: 3,
                unit: 'day',
                desc: 'Comprar botellas de agua, gaseosas o tés por pura conveniencia.',
                tip: 'Lleva una botella de agua de acero inoxidable reutilizable con filtro. Ahorras dinero y reduces el plástico al instante.',
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

                const unitLabel = habit.unit === 'day' ? 'día' : (habit.unit === 'week' ? 'sem' : 'mes');

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
                                    ${habit.category} • Base: €${habit.baseCost}/${unitLabel}
                                </span>
                            </div>
                        </div>

                        <!-- Badge: Work Days Saved & Actions -->
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold font-mono ${monthlySaved > 0 ? 'text-emerald-700 bg-emerald-100' : 'text-espresso-800/60 bg-cream-200'} px-2.5 py-1 rounded-lg block">
                                ${monthlySaved > 0 ? '+' + workDaysSavedPerYear.toFixed(1) + ' Días Trabajo/Año Ahorrados' : 'Gasto Total'}
                            </span>
                            ${habit.isCustom ? `
                                <button onclick="deleteHabit(${idx})" class="text-rose-600 hover:text-rose-800 p-1 text-xs font-bold transition-colors" title="Eliminar Gasto">
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
                                <strong class="text-gold-700 font-bold block mb-0.5">Consejo de Acción Inteligente:</strong>
                                <span class="text-espresso-800/90 leading-normal">${habit.tip}</span>
                            </div>
                        </div>
                    ` : ''}

                    <!-- EDITABLE COST & FREQUENCY INPUT ROW -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 p-3 bg-cream-100/90 rounded-xl border border-cream-300">
                        <div class="flex items-center justify-between gap-2">
                            <label class="text-xs font-bold text-espresso-900">Gasto Base (€):</label>
                            <div class="relative flex items-center">
                                <span class="absolute left-2.5 text-xs text-espresso-800 font-bold">€</span>
                                <input type="number" min="0" step="1" value="${habit.baseCost}" 
                                    data-onchange="updateHabitBaseCost(${idx}, this.value)" 
                                    class="w-28 pl-6 pr-2 py-1 bg-cream-50 rounded-lg border border-cream-300 text-xs font-bold font-mono text-forest-800 focus:ring-2 focus:ring-forest-800">
                            </div>
                        </div>

                        <div class="flex items-center justify-between gap-2">
                            <label class="text-xs font-bold text-espresso-900">Frecuencia:</label>
                            <select data-onchange="updateHabitUnit(${idx}, this.value)" 
                                class="px-2.5 py-1 bg-cream-50 rounded-lg border border-cream-300 text-xs font-bold text-espresso-900 focus:ring-2 focus:ring-forest-800 cursor-pointer">
                                <option value="day" ${habit.unit === 'day' ? 'selected' : ''}>Diario (€/día)</option>
                                <option value="week" ${habit.unit === 'week' ? 'selected' : ''}>Semanal (€/sem)</option>
                                <option value="month" ${habit.unit === 'month' ? 'selected' : ''}>Mensual (€/mes)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Slider Control -->
                    <div class="space-y-2 bg-cream-100 p-3.5 rounded-xl border border-cream-200">
                        <div class="flex justify-between items-center text-xs font-bold">
                            <span class="text-espresso-900">Opción de Gasto: <strong class="text-forest-800 font-mono">${habit.choicePct}%</strong></span>
                            <span class="text-espresso-800 font-mono">Actual: €${Math.round(currentMonthlyCost)}/mes <span class="text-[10px] font-normal text-espresso-800/70">(Total: €${Math.round(fullMonthlyCost)}/mes)</span></span>
                        </div>

                        <input type="range" min="0" max="100" step="25" value="${habit.choicePct}" 
                            data-oninput="updateHabitChoice(${idx}, this.value)" 
                            class="w-full accent-forest-800 bg-cream-300 h-2 rounded-lg cursor-pointer">

                        <div class="flex justify-between text-[10px] font-semibold text-espresso-800/70">
                            <span>0% (Eliminado)</span>
                            <span>50% (Recortado)</span>
                            <span>100% (Mantener Todo)</span>
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
                title: 'Nuevo Gasto Personalizado',
                icon: 'fa-receipt',
                category: 'Gasto Personalizado',
                baseCost: 10,
                unit: 'day',
                desc: 'Ingresa el costo y la frecuencia de tu gasto recurrente personalizado.',
                tip: 'Analiza si este gasto te aporta verdadero valor o si puede ser optimizado sin afectar tu calidad de vida.',
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
            document.getElementById('computedHourlyWage').innerText = `€${wage.toFixed(2)}/hr`;

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
            document.getElementById('baselineAgeDisplay').innerText = `Edad ${baselineFreedomAge}`;
            document.getElementById('optimizedAgeDisplay').innerText = `Edad ${optimizedFreedomAge}`;

            const badge = document.getElementById('yearsSavedBadge');
            if (yearsPulledForward > 0) {
                badge.classList.remove('hidden');
                badge.innerHTML = `<i class="fa-solid fa-calendar-check"></i><span>¡Libertad Adelantada ${yearsPulledForward} AÑOS!</span>`;
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
            document.getElementById('statMonthlySaved').innerText = `+€${Math.round(monthlySaved).toLocaleString('es-ES')}/mes`;
            document.getElementById('statWorkDaysSaved').innerText = `${annualWorkDaysSaved.toFixed(1)} Días/Año`;
            document.getElementById('stat30YearWealth').innerText = `€${Math.round(wealthGained30Yr).toLocaleString('es-ES')}`;

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
                    note.textContent = 'No se pudo dibujar el gráfico. Todas las cifras que mostraría también aparecen como texto en esta página.';
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
                labels.push(`Año ${i}`);
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
                            label: 'Estrategia de Hábitos Optimizada',
                            data: optimizedData,
                            borderColor: '#2e6f40',
                            backgroundColor: 'rgba(46, 111, 64, 0.15)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.3,
                            pointBackgroundColor: '#2e6f40'
                        },
                        {
                            label: 'Hábitos Base (Sin Recortes)',
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
                                callback: val => '€' + (val / 1000).toFixed(0) + 'k',
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
