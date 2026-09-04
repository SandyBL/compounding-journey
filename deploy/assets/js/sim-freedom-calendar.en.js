// HABIT DATABASE
        const HABITS_DATA = [
            {
                id: 'coffee',
                title: 'Daily Specialty Coffee & Drinks',
                icon: 'fa-mug-hot',
                category: 'Daily Micro-Habit',
                baseCost: 5,
                unit: 'day', // 'day', 'week', 'month'
                desc: 'Specialty lattes, energy drinks, or iced coffee purchased on the go.',
                tip: 'Invest in a quality french press or espresso maker at home and a leakproof travel mug. You keep the daily ritual for under $0.50/cup!',
                choicePct: 100
            },
            {
                id: 'lunch',
                title: 'Daily Restaurant & Lunch Delivery',
                icon: 'fa-utensils',
                category: 'Daily Micro-Habit',
                baseCost: 15,
                unit: 'day',
                desc: 'Ordering UberEats/DoorDash or eating out instead of packing lunch.',
                tip: 'Prep meals in batch on Sundays or keep gourmet frozen meals at work to cut takeout down to 1 day per week as a true reward.',
                choicePct: 100
            },
            {
                id: 'subscriptions',
                title: 'Unused Streaming & App Subscriptions',
                icon: 'fa-tv',
                category: 'Monthly Recurring',
                baseCost: 120,
                unit: 'month',
                desc: 'Multiple streaming services, unused gym or app memberships.',
                tip: 'Adopt the "One-at-a-Time Rule": subscribe to only 1 streaming service per month, binge what you want, cancel, and switch.',
                choicePct: 100
            },
            {
                id: 'carLease',
                title: 'Upgrading Car Lease Every 3 Years',
                icon: 'fa-car',
                category: 'Major Lifestyle',
                baseCost: 350,
                unit: 'month',
                desc: 'Always driving a new leased car vs keeping a paid-off reliable vehicle.',
                tip: 'Buy a 3-year-old certified pre-owned car and keep it for 7–10 years. Redirect former lease payments straight into index funds.',
                choicePct: 100
            },
            {
                id: 'impulseShopping',
                title: 'Unplanned Clothes & Gadget Buying',
                icon: 'fa-bag-shopping',
                category: 'Impulse Spending',
                baseCost: 40,
                unit: 'week',
                desc: 'Buying t-shirts, accessories, or tech deals you weren\'t planning on.',
                tip: 'Use the "72-Hour Cooling Off Rule" for non-essential buys. If you still want it 3 days later, consider its hourly work cost first.',
                choicePct: 100
            },
            {
                id: 'weekendDining',
                title: 'Weekend Drinks & Premium Dining',
                icon: 'fa-martini-glass-citrus',
                category: 'Social & Leisure',
                baseCost: 80,
                unit: 'week',
                desc: 'Cocktails, takeout, and high-end weekend social dining.',
                tip: 'Host potluck dinner parties with friends or switch to sparkling water after 1 cocktail when dining out to keep the fun without the huge bill.',
                choicePct: 100
            },
            {
                id: 'energySnacks',
                title: 'Daily Convenience Snacks & Drinks',
                icon: 'fa-bolt',
                category: 'Daily Micro-Habit',
                baseCost: 6,
                unit: 'day',
                desc: 'Gas station snacks, energy cans, and vending machine impulse grabs.',
                tip: 'Buy bulk snacks and beverages at wholesale clubs and keep emergency packs in your car, backpack, or desk drawer.',
                choicePct: 100
            },
            {
                id: 'techUpgrades',
                title: 'Yearly Smartphone Upgrades',
                icon: 'fa-mobile-screen-button',
                category: 'Major Lifestyle',
                baseCost: 50,
                unit: 'month',
                desc: 'Trading in your phone every single year for the newest model.',
                tip: 'Upgrade your phone battery after 2 years instead of buying a whole new device. Aim for a 4-year phone lifecycle.',
                choicePct: 100
            },
            {
                id: 'gymMembership',
                title: 'Unused Gym & Fitness Memberships',
                icon: 'fa-dumbbell',
                category: 'Monthly Recurring',
                baseCost: 60,
                unit: 'month',
                desc: 'Paying for boutique gym access or fitness apps you rarely use.',
                tip: 'If you go less than twice a week, freeze the membership. Try outdoor running, bodyweight training, or pay-per-visit passes.',
                choicePct: 100
            },
            {
                id: 'storageUnit',
                title: 'Storage Unit Rentals for Clutter',
                icon: 'fa-boxes-stacked',
                category: 'Monthly Recurring',
                baseCost: 150,
                unit: 'month',
                desc: 'Renting off-site space to hold old furniture and extra items.',
                tip: 'Host a weekend declutter garage sale or donate the items. If the contents aren\'t worth 2 years of rent, liquidate them!',
                choicePct: 100
            },
            {
                id: 'foodWaste',
                title: 'Food Waste & Expired Groceries',
                icon: 'fa-trash-arrow-up',
                category: 'Impulse Spending',
                baseCost: 40,
                unit: 'week',
                desc: 'Groceries and fresh produce that spoil in the fridge before being eaten.',
                tip: 'Shop with an exact meal plan list, do a "fridge inventory" before grocery shopping, and freeze fresh items before they spoil.',
                choicePct: 100
            },
            {
                id: 'shortRideshares',
                title: 'Short Convenience Rideshares (Uber/Lyft)',
                icon: 'fa-taxi',
                category: 'Daily Micro-Habit',
                baseCost: 25,
                unit: 'week',
                desc: 'Ordering rideshares for short distances you could walk or transit.',
                tip: 'Set a rule to walk any trip under 15 minutes or keep a monthly public transit card handy. It doubles as free daily exercise!',
                choicePct: 100
            },
            {
                id: 'bottledWater',
                title: 'Single-Use Bottled Water & Drinks',
                icon: 'fa-bottle-water',
                category: 'Daily Micro-Habit',
                baseCost: 3,
                unit: 'day',
                desc: 'Buying bottled water cases, sodas, or teas out of convenience.',
                tip: 'Carry an insulated stainless steel water bottle with an inline filter. Saves money and reduces plastic waste instantly.',
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

        // HELPER CALCULATION FUNCTIONS
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

        // RENDER HABIT CARDS
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
                                    ${habit.category} • Baseline: $${habit.baseCost}/${habit.unit}
                                </span>
                            </div>
                        </div>

                        <!-- Badge: Work Days Saved & Actions -->
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold font-mono ${monthlySaved > 0 ? 'text-emerald-700 bg-emerald-100' : 'text-espresso-800/60 bg-cream-200'} px-2.5 py-1 rounded-lg block">
                                ${monthlySaved > 0 ? '+' + workDaysSavedPerYear.toFixed(1) + ' Work Days/Yr Saved' : 'Full Spending'}
                            </span>
                            ${habit.isCustom ? `
                                <button onclick="deleteHabit(${idx})" class="text-rose-600 hover:text-rose-800 p-1 text-xs font-bold transition-colors" title="Remove Habit">
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
                                <strong class="text-gold-700 font-bold block mb-0.5">Smart Action Tip:</strong>
                                <span class="text-espresso-800/90 leading-normal">${habit.tip}</span>
                            </div>
                        </div>
                    ` : ''}

                    <!-- EDITABLE COST & FREQUENCY INPUT ROW -->
                    <div class="sim-inset grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 p-3">
                        <div class="flex items-center justify-between gap-2">
                            <label class="text-xs font-bold text-espresso-900">Base Expense ($):</label>
                            <div class="relative flex items-center">
                                <span class="absolute left-2.5 text-xs text-espresso-800 font-bold">$</span>
                                <input type="number" min="0" step="1" value="${habit.baseCost}" 
                                    data-onchange="updateHabitBaseCost(${idx}, this.value)" 
                                    class="sim-field sim-field--inline w-28 pl-6 pr-2 py-1">
                            </div>
                        </div>

                        <div class="flex items-center justify-between gap-2">
                            <label class="text-xs font-bold text-espresso-900">Frequency:</label>
                            <select data-onchange="updateHabitUnit(${idx}, this.value)" 
                                class="sim-field px-2.5 py-1">
                                <option value="day" ${habit.unit === 'day' ? 'selected' : ''}>Daily ($/day)</option>
                                <option value="week" ${habit.unit === 'week' ? 'selected' : ''}>Weekly ($/wk)</option>
                                <option value="month" ${habit.unit === 'month' ? 'selected' : ''}>Monthly ($/mo)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Slider Control -->
                    <div class="sim-inset space-y-2 p-3.5">
                        <div class="flex justify-between items-center text-xs font-bold">
                            <span class="text-espresso-900">Spending Choice: <strong class="text-forest-800 font-mono">${habit.choicePct}%</strong></span>
                            <span class="text-espresso-800 font-mono">Actual: $${Math.round(currentMonthlyCost)}/mo <span class="text-[10px] font-normal text-espresso-800/70">(Full: $${Math.round(fullMonthlyCost)}/mo)</span></span>
                        </div>

                        <input type="range" min="0" max="100" step="25" value="${habit.choicePct}" 
                            data-oninput="updateHabitChoice(${idx}, this.value)" 
                            class="w-full">

                        <div class="flex justify-between text-[10px] font-semibold text-espresso-800/70">
                            <span>0% (Eliminated)</span>
                            <span>50% (Trimmed)</span>
                            <span>100% (Keep All)</span>
                        </div>
                    </div>
                `;

                container.appendChild(card);
            });
        }

        // UPDATE HABIT BASE COST
        function updateHabitBaseCost(index, value) {
            const val = parseFloat(value);
            habits[index].baseCost = isNaN(val) ? 0 : Math.max(0, val);
            recalculateAll();
            renderHabitCards();
        }

        // UPDATE HABIT FREQUENCY UNIT
        function updateHabitUnit(index, unit) {
            habits[index].unit = unit;
            renderHabitCards();
            recalculateAll();
        }

        // UPDATE CUSTOM HABIT TITLE
        function updateHabitTitle(index, title) {
            habits[index].title = title || 'Custom Expense';
        }

        // ADD CUSTOM HABIT
        function addCustomHabit() {
            habits.push({
                id: 'custom_' + Date.now(),
                title: 'New Custom Expense',
                icon: 'fa-receipt',
                category: 'Custom Expense',
                baseCost: 10,
                unit: 'day',
                desc: 'Enter your custom recurring expense cost and frequency above.',
                choicePct: 100,
                isCustom: true
            });
            renderHabitCards();
            recalculateAll();
        }

        // DELETE HABIT
        function deleteHabit(index) {
            habits.splice(index, 1);
            renderHabitCards();
            recalculateAll();
        }

        // UPDATE INDIVIDUAL HABIT CHOICE
        function updateHabitChoice(index, value) {
            habits[index].choicePct = parseInt(value, 10);
            renderHabitCards();
            recalculateAll();
        }

        // SET GLOBAL PRESET (0%, 50%, 100%)
        function setGlobalPreset(pct) {
            habits.forEach(h => h.choicePct = pct);
            renderHabitCards();
            recalculateAll();
        }

        // TOGGLE PROFILE DRAWER
        function toggleProfileDrawer() {
            const drawer = document.getElementById('profileDrawer');
            if (drawer) drawer.classList.toggle('hidden');
        }

        // UPDATE PROFILE SETTINGS FROM INPUTS
        function updateProfileSettings() {
            profile.currentAge = parseInt(document.getElementById('inputCurrentAge').value, 10) || 30;
            profile.annualIncome = parseFloat(document.getElementById('inputAnnualIncome').value) || 60000;
            profile.workHoursPerWeek = parseInt(document.getElementById('inputWorkHours').value, 10) || 40;
            profile.startingNetWorth = parseFloat(document.getElementById('inputNetWorth').value) || 15000;
            profile.basicMonthlyExpenses = parseFloat(document.getElementById('inputBasicExpenses').value) || 2500;

            const wage = getHourlyWage();
            document.getElementById('computedHourlyWage').innerText = `$${wage.toFixed(2)}/hr`;

            renderHabitCards();
            recalculateAll();
        }

        // RECALCULATE ALL METRICS & UPDATE UI
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
            document.getElementById('baselineAgeDisplay').innerText = `Age ${baselineFreedomAge}`;
            document.getElementById('optimizedAgeDisplay').innerText = `Age ${optimizedFreedomAge}`;

            const badge = document.getElementById('yearsSavedBadge');
            if (yearsPulledForward > 0) {
                badge.classList.remove('hidden');
                badge.innerHTML = `<i class="fa-solid fa-calendar-check"></i><span>Freedom Pulled Forward ${yearsPulledForward} YEARS!</span>`;
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
            document.getElementById('statMonthlySaved').innerText = `+$${Math.round(monthlySaved).toLocaleString('en-US')}/mo`;
            document.getElementById('statWorkDaysSaved').innerText = `${annualWorkDaysSaved.toFixed(1)} Days/Yr`;
            document.getElementById('stat30YearWealth').innerText = `$${Math.round(wealthGained30Yr).toLocaleString('en-US')}`;

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

        // RENDER / UPDATE CHART
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
                    note.textContent = 'The chart could not be drawn. Every figure it would show is also listed as text on this page.';
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

            let baselineNW = profile.startingNetWorth;
            let optimizedNW = profile.startingNetWorth;

            for (let i = 0; i <= yearsToProject; i += 5) {
                labels.push(`Year ${i}`);
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

            // The optimised path is the first series and the baseline it is
            // measured against is the negative role, on all four tools that
            // draw one. Typeface, ink, grid, legend, tooltip, line weight and
            // tension come from assets/js/sim-chart-theme.js.
            const theme = window.SimChartTheme;

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Optimized Habits Strategy',
                            data: optimizedData,
                            borderColor: theme.line(0),
                            backgroundColor: theme.fill(0, 0.14),
                            borderWidth: 3,
                            fill: true,
                            pointBackgroundColor: theme.line(0)
                        },
                        {
                            label: 'Baseline Habits (Uncut)',
                            data: baselineData,
                            borderColor: theme.role.negative,
                            backgroundColor: 'transparent',
                            borderDash: [5, 5],
                            pointBackgroundColor: theme.role.negative
                        }
                    ]
                },
                options: {
                    scales: {
                        y: {
                            ticks: {
                                callback: val => '$' + (val / 1000).toFixed(0) + 'k'
                            }
                        }
                    }
                }
            });
        }

        // ON INITIAL LOAD
        window.onload = function() {
            updateProfileSettings();
        };
