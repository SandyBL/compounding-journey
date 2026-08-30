// HISTORICAL ANNUAL RETURN DATA (1920 – 2026) %
        const HISTORICAL_YEARS_DATA = [
            { year: 1920, stocks: 5.2, bonds: 11.2, reits: 3.0, gold: 0.0, cash: 5.5 },
            { year: 1921, stocks: 12.6, bonds: 15.8, reits: 4.0, gold: 0.0, cash: 5.0 },
            { year: 1922, stocks: 28.4, bonds: 8.2, reits: 10.0, gold: 0.0, cash: 4.0 },
            { year: 1923, stocks: -3.2, bonds: 3.5, reits: 2.0, gold: 0.0, cash: 4.2 },
            { year: 1924, stocks: 26.8, bonds: 7.4, reits: 12.0, gold: 0.0, cash: 3.8 },
            { year: 1925, stocks: 22.5, bonds: 6.1, reits: 15.0, gold: 0.0, cash: 3.5 },
            { year: 1926, stocks: 11.6, bonds: 5.4, reits: 8.0, gold: 0.0, cash: 3.5 },
            { year: 1927, stocks: 37.5, bonds: 4.8, reits: 18.0, gold: 0.0, cash: 3.2 },
            { year: 1928, stocks: 43.6, bonds: 0.8, reits: 20.0, gold: 0.0, cash: 4.0 },
            
            // CRASH EVENT 1929
            { year: 1929, stocks: -8.4, bonds: 4.2, reits: -12.0, gold: 0.0, cash: 4.8, event: {
                title: 'The Great Crash of 1929',
                icon: 'fa-building-circle-exclamation',
                desc: 'Black Tuesday marks the start of the Great Depression. Unchecked speculation sparked massive stock market sell-offs and systemic bank failures.',
                impact: 'Stocks dropped -8.4% in 1929 and kept falling for years. Treasury bonds provided positive downside protection (+4.2%).'
            }},
            { year: 1930, stocks: -24.9, bonds: 4.5, reits: -20.0, gold: 0.0, cash: 2.4 },
            { year: 1931, stocks: -43.3, bonds: -2.6, reits: -35.0, gold: 0.0, cash: 1.1, event: {
                title: 'Bottom of the Great Depression (1931)',
                icon: 'fa-burst',
                desc: 'The single worst year in Wall Street history. Widespread panic led millions of investors to lock in ruinous losses.',
                impact: 'Devastating -43.3% plunge in equities. Portfolios holding gold and treasury bonds drastically cushioned overall capital destruction.'
            }},
            { year: 1932, stocks: -8.2, bonds: 8.8, reits: -18.0, gold: 0.0, cash: 1.0 },
            { year: 1933, stocks: 54.0, bonds: 1.9, reits: 25.0, gold: 20.0, cash: 0.3 },
            { year: 1934, stocks: -1.4, bonds: 8.0, reits: 5.0, gold: 69.0, cash: 0.2 },
            { year: 1935, stocks: 47.7, bonds: 4.5, reits: 30.0, gold: 0.0, cash: 0.2 },
            { year: 1936, stocks: 33.9, bonds: 5.0, reits: 20.0, gold: 0.0, cash: 0.2 },
            { year: 1937, stocks: -35.0, bonds: 1.6, reits: -25.0, gold: 0.0, cash: 0.3, event: {
                title: 'Secondary Recession of 1937',
                icon: 'fa-triangle-exclamation',
                desc: 'Premature monetary tightening by the Fed and public spending cuts triggered a sharp relapse mid-recovery.',
                impact: 'Equities crashed -35.0%, testing the emotional discipline of investors who had survived the 1929 crash.'
            }},
            { year: 1938, stocks: 31.1, bonds: 5.5, reits: 15.0, gold: 0.0, cash: 0.1 },
            { year: 1939, stocks: -0.4, bonds: 4.4, reits: -2.0, gold: 0.0, cash: 0.0 },
            { year: 1940, stocks: -9.8, bonds: 3.0, reits: -5.0, gold: 0.0, cash: 0.0 },
            { year: 1941, stocks: -11.6, bonds: 0.5, reits: -8.0, gold: 0.0, cash: 0.1 },
            { year: 1942, stocks: 20.3, bonds: 2.3, reits: 12.0, gold: 0.0, cash: 0.3 },
            { year: 1943, stocks: 25.9, bonds: 2.1, reits: 18.0, gold: 0.0, cash: 0.3 },
            { year: 1944, stocks: 19.8, bonds: 2.8, reits: 15.0, gold: 0.0, cash: 0.3 },
            { year: 1945, stocks: 36.4, bonds: 3.8, reits: 22.0, gold: 0.0, cash: 0.3 },
            { year: 1946, stocks: -8.1, bonds: 3.1, reits: -4.0, gold: 0.0, cash: 0.4 },
            { year: 1947, stocks: 5.7, bonds: 0.9, reits: 2.0, gold: 0.0, cash: 0.6 },
            { year: 1948, stocks: 5.5, bonds: 1.9, reits: 4.0, gold: 0.0, cash: 1.0 },
            { year: 1949, stocks: 18.8, bonds: 4.6, reits: 10.0, gold: 0.0, cash: 1.1 },
            { year: 1950, stocks: 31.7, bonds: 0.1, reits: 15.0, gold: 0.0, cash: 1.2 },
            { year: 1951, stocks: 24.0, bonds: -0.3, reits: 12.0, gold: 0.0, cash: 1.5 },
            { year: 1952, stocks: 18.4, bonds: 2.3, reits: 8.0, gold: 0.0, cash: 1.7 },
            { year: 1953, stocks: -1.0, bonds: 3.6, reits: 2.0, gold: 0.0, cash: 1.8 },
            { year: 1954, stocks: 52.6, bonds: 2.7, reits: 28.0, gold: 0.0, cash: 0.9 },
            { year: 1955, stocks: 31.6, bonds: -1.3, reits: 18.0, gold: 0.0, cash: 1.7 },
            { year: 1956, stocks: 6.6, bonds: -2.3, reits: 4.0, gold: 0.0, cash: 2.6 },
            { year: 1957, stocks: -10.8, bonds: 6.8, reits: -6.0, gold: 0.0, cash: 3.2 },
            { year: 1958, stocks: 43.4, bonds: -2.1, reits: 25.0, gold: 0.0, cash: 1.8 },
            { year: 1959, stocks: 12.0, bonds: -2.7, reits: 8.0, gold: 0.0, cash: 3.3 },
            { year: 1960, stocks: 0.5, bonds: 11.6, reits: 3.0, gold: 0.0, cash: 2.9 },
            { year: 1961, stocks: 26.9, bonds: 2.1, reits: 16.0, gold: 0.0, cash: 2.2 },
            { year: 1962, stocks: -8.7, bonds: 5.7, reits: -4.0, gold: 0.0, cash: 2.7 },
            { year: 1963, stocks: 22.8, bonds: 1.6, reits: 12.0, gold: 0.0, cash: 3.1 },
            { year: 1964, stocks: 16.5, bonds: 3.7, reits: 10.0, gold: 0.0, cash: 3.5 },
            { year: 1965, stocks: 12.5, bonds: 0.7, reits: 8.0, gold: 0.0, cash: 3.9 },
            { year: 1966, stocks: -10.1, bonds: 2.9, reits: -8.0, gold: 0.0, cash: 4.8 },
            { year: 1967, stocks: 24.0, bonds: -1.6, reits: 18.0, gold: 0.0, cash: 4.3 },
            { year: 1968, stocks: 11.1, bonds: 3.3, reits: 9.0, gold: 0.0, cash: 5.3 },
            { year: 1969, stocks: -8.5, bonds: -5.0, reits: -6.0, gold: 0.0, cash: 6.6 },
            { year: 1970, stocks: 4.0, bonds: 12.1, reits: 2.0, gold: 0.0, cash: 6.5 },
            { year: 1971, stocks: 14.3, bonds: 9.8, reits: 12.0, gold: 17.0, cash: 4.4 },
            { year: 1972, stocks: 19.0, bonds: 2.8, reits: 8.0, gold: 48.0, cash: 3.8 },
            { year: 1973, stocks: -14.7, bonds: -1.1, reits: -15.0, gold: 72.0, cash: 6.9 },
            { year: 1974, stocks: -26.5, bonds: 4.4, reits: -28.0, gold: 66.0, cash: 7.9, event: {
                title: 'Oil Shock & Stagflation (1974)',
                icon: 'fa-fire-flame-curved',
                desc: 'OPEC oil embargo, double-digit inflation, and severe recession. Gold surged as a premier inflation hedge asset.',
                impact: 'Stocks fell -26.5% and Real Estate -28.0%. In contrast, Gold exploded by an astounding +66.0%!'
            }},
            { year: 1975, stocks: 37.2, bonds: 9.2, reits: 18.0, gold: -24.0, cash: 5.8 },
            { year: 1976, stocks: 23.8, bonds: 16.8, reits: 48.0, gold: -4.0, cash: 5.1 },
            { year: 1977, stocks: -7.2, bonds: -0.7, reits: 22.0, gold: 23.0, cash: 5.1 },
            { year: 1978, stocks: 6.6, bonds: -1.2, reits: 10.0, gold: 37.0, cash: 7.2 },
            { year: 1979, stocks: 18.4, bonds: 0.7, reits: 24.0, gold: 126.0, cash: 10.0 },
            { year: 1980, stocks: 32.4, bonds: -3.0, reits: 25.0, gold: 12.0, cash: 11.5 },
            { year: 1981, stocks: -4.9, bonds: 8.2, reits: 4.0, gold: -32.0, cash: 14.0 },
            { year: 1982, stocks: 21.5, bonds: 32.8, reits: 20.0, gold: 15.0, cash: 10.6 },
            { year: 1983, stocks: 22.5, bonds: 3.2, reits: 14.0, gold: -15.0, cash: 8.6 },
            { year: 1984, stocks: 6.3, bonds: 13.7, reits: 18.0, gold: -19.0, cash: 9.5 },
            { year: 1985, stocks: 31.7, bonds: 25.7, reits: 19.0, gold: 6.0, cash: 7.5 },
            { year: 1986, stocks: 18.7, bonds: 24.3, reits: 18.0, gold: 19.0, cash: 6.0 },
            { year: 1987, stocks: 5.3, bonds: -2.7, reits: -3.0, gold: 24.0, cash: 5.8, event: {
                title: 'Black Monday (1987)',
                icon: 'fa-bolt',
                desc: 'Largest single-day percentage crash in Dow Jones history (-22.6%). Computerized trading algorithms sparked systemic cascades.',
                impact: 'Despite October panic, markets recovered to close the year up +5.3% overall for equities.'
            }},
            { year: 1988, stocks: 16.6, bonds: 9.7, reits: 13.0, gold: -15.0, cash: 6.7 },
            { year: 1989, stocks: 31.7, bonds: 14.5, reits: 8.0, gold: -2.0, cash: 8.1 },
            { year: 1990, stocks: -3.1, bonds: 9.0, reits: -15.0, gold: -8.0, cash: 7.5 },
            { year: 1991, stocks: 30.5, bonds: 15.0, reits: 35.0, gold: -4.0, cash: 5.4 },
            { year: 1992, stocks: 7.6, bonds: 9.3, reits: 14.0, gold: -6.0, cash: 3.5 },
            { year: 1993, stocks: 10.1, bonds: 14.2, reits: 19.0, gold: 17.0, cash: 3.0 },
            { year: 1994, stocks: 1.3, bonds: -2.9, reits: 3.0, gold: -2.0, cash: 4.3 },
            { year: 1995, stocks: 37.6, bonds: 23.5, reits: 15.0, gold: 1.0, cash: 5.5 },
            { year: 1996, stocks: 23.0, bonds: 1.4, reits: 35.0, gold: -5.0, cash: 5.0 },
            { year: 1997, stocks: 33.4, bonds: 9.9, reits: 20.0, gold: -21.0, cash: 5.1 },
            { year: 1998, stocks: 28.6, bonds: 14.9, reits: -18.0, gold: -1.0, cash: 4.9 },
            { year: 1999, stocks: 21.0, bonds: -9.0, reits: -4.0, gold: 1.0, cash: 4.7 },
            { year: 2000, stocks: -9.1, bonds: 11.6, reits: 26.8, gold: -0.6, cash: 5.8, event: {
                title: 'Dot-Com Bubble Burst (2000)',
                icon: 'fa-laptop-code',
                desc: 'Collapse of euphoric valuations in unprofitable internet startups. Triggered a 3-year bear market in equities.',
                impact: 'Stocks crashed -9.1%, while Treasury Bonds (+11.6%) and Real Estate/REITs (+26.8%) served as outstanding buffers.'
            }},
            { year: 2001, stocks: -11.9, bonds: 8.4, reits: 15.5, gold: 2.5, cash: 3.8 },
            { year: 2002, stocks: -22.1, bonds: 15.1, reits: 3.8, gold: 24.7, cash: 1.7 },
            { year: 2003, stocks: 28.7, bonds: 2.2, reits: 37.1, gold: 19.4, cash: 1.0 },
            { year: 2004, stocks: 10.9, bonds: 4.3, reits: 31.6, gold: 5.5, cash: 1.2 },
            { year: 2005, stocks: 4.9, bonds: 2.9, reits: 12.2, gold: 18.0, cash: 3.0 },
            { year: 2006, stocks: 15.8, bonds: 4.3, reits: 35.1, gold: 23.0, cash: 4.8 },
            { year: 2007, stocks: 5.5, bonds: 10.2, reits: -15.7, gold: 30.9, cash: 4.7 },
            { year: 2008, stocks: -37.0, bonds: 20.1, reits: -37.7, gold: 5.6, cash: 1.5, event: {
                title: '2008 Global Financial Crisis',
                icon: 'fa-skull-crossbones',
                desc: 'Lehman Brothers bankruptcy and global subprime credit collapse. The deepest market slump since 1929.',
                impact: 'Stocks fell -37.0% and REITs -37.7%. However, Treasury Bonds surged +20.1%, proving the power of portfolio diversification!'
            }},
            { year: 2009, stocks: 26.5, bonds: -11.1, reits: 28.0, gold: 23.4, cash: 0.1 },
            { year: 2010, stocks: 15.1, bonds: 8.5, reits: 27.9, gold: 29.5, cash: 0.1 },
            { year: 2011, stocks: 2.1, bonds: 16.0, reits: 8.3, gold: 10.2, cash: 0.1 },
            { year: 2012, stocks: 16.0, bonds: 2.9, reits: 19.7, gold: 7.0, cash: 0.1 },
            { year: 2013, stocks: 32.4, bonds: -2.7, reits: 2.9, gold: -28.3, cash: 0.1 },
            { year: 2014, stocks: 13.7, bonds: 10.7, reits: 28.0, gold: -1.7, cash: 0.0 },
            { year: 2015, stocks: 1.4, bonds: 1.2, reits: 2.8, gold: -10.4, cash: 0.1 },
            { year: 2016, stocks: 11.9, bonds: 1.0, reits: 8.6, gold: 8.5, cash: 0.2 },
            { year: 2017, stocks: 21.8, bonds: 2.8, reits: 8.7, gold: 13.7, cash: 0.8 },
            { year: 2018, stocks: -4.4, bonds: 0.8, reits: -4.0, gold: -1.6, cash: 1.8 },
            { year: 2019, stocks: 31.5, bonds: 9.6, reits: 28.7, gold: 18.3, cash: 2.2 },
            { year: 2020, stocks: 18.4, bonds: 11.3, reits: -5.1, gold: 24.6, cash: 0.5, event: {
                title: 'Pandemic & Global Lockdowns (2020)',
                icon: 'fa-virus-covid',
                desc: 'Instant economic freeze followed by unprecedented multi-trillion dollar fiscal and central bank stimulus.',
                impact: 'After a -34% flash crash, markets rebounded to end up +18.4% for the year powered by massive liquidity.'
            }},
            { year: 2021, stocks: 28.7, bonds: -1.5, reits: 41.3, gold: -3.6, cash: 0.1 },
            { year: 2022, stocks: -18.1, bonds: -13.0, reits: -24.9, gold: -0.1, cash: 1.5, event: {
                title: 'Monetary Tightening & Inflation (2022)',
                icon: 'fa-arrow-trend-down',
                desc: 'Aggressive Fed rate hikes to combat inflation. Worst simultaneous decline in stocks and bonds in 50 years!',
                impact: 'Stocks lost -18.1% and Bonds dropped -13.0%, testing investors who relied solely on bonds for safety.'
            }},
            { year: 2023, stocks: 26.3, bonds: 5.5, reits: 11.4, gold: 13.1, cash: 5.0 },
            { year: 2024, stocks: 24.2, bonds: 1.2, reits: 8.5, gold: 27.2, cash: 5.2 },
            { year: 2025, stocks: 12.5, bonds: 4.8, reits: 9.1, gold: 11.0, cash: 4.5 },
            { year: 2026, stocks: 9.8, bonds: 5.0, reits: 7.5, gold: 8.2, cash: 4.0 }
        ];

        const PORTFOLIO_BENCHMARKS = {
            classic6040: { name: 'Classic (60/40)', stocks: 60, bonds: 40, reits: 0, gold: 0, cash: 0, color: '#2563eb' },
            allweather: { name: 'All-Weather (Dalio)', stocks: 30, bonds: 55, reits: 0, gold: 15, cash: 0, color: '#7c3aed' },
            permanent: { name: 'Permanent (Browne)', stocks: 25, bonds: 25, reits: 0, gold: 25, cash: 25, color: '#d97706' },
            aggressive: { name: '100% Stocks', stocks: 100, bonds: 0, reits: 0, gold: 0, cash: 0, color: '#e11d48' },
            conservative: { name: 'Conservative (20/80)', stocks: 20, bonds: 60, reits: 0, gold: 0, cash: 20, color: '#0d9488' }
        };

        let state = {
            allocation: { stocks: 60, bonds: 40, reits: 0, gold: 0, cash: 0 },
            initialCapital: 100000,
            startYear: 1920,
            currentYearIdx: 0,
            isPlaying: false,
            wasPlayingBeforeModal: false,
            timer: null,
            chartInstance: null,
            
            // Portfolios Data Tracks
            customTrack: [],
            classicTrack: [],
            allWeatherTrack: [],
            permanentTrack: [],
            aggressiveTrack: [],
            conservativeTrack: []
        };

        function onSliderChange(assetKey, val) {
            state.allocation[assetKey] = parseInt(val, 10);
            document.getElementById(`val_${assetKey}`).innerText = `${state.allocation[assetKey]}%`;
            // Without aria-valuetext the slider is announced as "60", not "60 percent".
            document.getElementById(`slider_${assetKey}`).setAttribute('aria-valuetext', `${state.allocation[assetKey]}%`);
            document.getElementById('presetSelect').value = 'custom';
            checkTotalAllocation();
            updateTooltipComposition();
            recalculateSimulation();
        }

        function updateTooltipComposition() {
            const compEl = document.getElementById('tooltipCustomComposition');
            if (!compEl) return;
            compEl.innerHTML = `
                <div>• ${state.allocation.stocks}% Stocks</div>
                <div>• ${state.allocation.bonds}% Bonds</div>
                <div>• ${state.allocation.reits}% Real Estate/REITs</div>
                <div>• ${state.allocation.gold}% Gold</div>
                <div>• ${state.allocation.cash}% Cash</div>
            `;
        }

        function checkTotalAllocation() {
            const sum = Object.values(state.allocation).reduce((a, b) => a + b, 0);
            const badge = document.getElementById('totalAllocationBadge');
            const normBtn = document.getElementById('normalizeBtn');
            const playBtn = document.getElementById('playPauseBtn');

            badge.innerText = `${sum}%`;
            if (sum === 100) {
                badge.className = 'text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300';
                normBtn.classList.add('hidden');
                playBtn.disabled = false;
                playBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                badge.className = 'text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300';
                normBtn.classList.remove('hidden');
                playBtn.disabled = true;
                playBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }

        function normalizeAllocation() {
            const sum = Object.values(state.allocation).reduce((a, b) => a + b, 0);
            if (sum === 0) {
                state.allocation = { stocks: 60, bonds: 40, reits: 0, gold: 0, cash: 0 };
            } else {
                let currentSum = 0;
                const keys = Object.keys(state.allocation);
                keys.forEach((k, idx) => {
                    if (idx === keys.length - 1) {
                        state.allocation[k] = 100 - currentSum;
                    } else {
                        state.allocation[k] = Math.round((state.allocation[k] / sum) * 100);
                        currentSum += state.allocation[k];
                    }
                });
            }

            Object.keys(state.allocation).forEach(k => {
                document.getElementById(`slider_${k}`).value = state.allocation[k];
                document.getElementById(`val_${k}`).innerText = `${state.allocation[k]}%`;
            });

            checkTotalAllocation();
            updateTooltipComposition();
            recalculateSimulation();
        }

        function applyPreset(presetKey) {
            if (presetKey === 'custom' || !PORTFOLIO_BENCHMARKS[presetKey]) return;
            const target = PORTFOLIO_BENCHMARKS[presetKey];
            state.allocation = { stocks: target.stocks, bonds: target.bonds, reits: target.reits, gold: target.gold, cash: target.cash };

            Object.keys(state.allocation).forEach(k => {
                document.getElementById(`slider_${k}`).value = state.allocation[k];
                document.getElementById(`val_${k}`).innerText = `${state.allocation[k]}%`;
            });

            checkTotalAllocation();
            updateTooltipComposition();
            recalculateSimulation();
        }

        function changeStartYear(val) {
            state.startYear = parseInt(val, 10);
            const foundIdx = HISTORICAL_YEARS_DATA.findIndex(d => d.year === state.startYear);
            state.currentYearIdx = foundIdx !== -1 ? foundIdx : 0;
            pauseSimulation();
            recalculateSimulation();
        }

        function recalculateSimulation() {
            const capInput = document.getElementById('initialCapitalInput');
            state.initialCapital = parseFloat(capInput.value) || 100000;

            const startIdx = HISTORICAL_YEARS_DATA.findIndex(d => d.year === state.startYear);
            if (startIdx === -1) return;

            // Reset tracks
            state.customTrack = [];
            state.classicTrack = [];
            state.allWeatherTrack = [];
            state.permanentTrack = [];
            state.aggressiveTrack = [];
            state.conservativeTrack = [];

            let customVal = state.initialCapital;
            let classicVal = state.initialCapital;
            let allWeatherVal = state.initialCapital;
            let permanentVal = state.initialCapital;
            let aggressiveVal = state.initialCapital;
            let conservativeVal = state.initialCapital;

            for (let i = startIdx; i <= state.currentYearIdx; i++) {
                const item = HISTORICAL_YEARS_DATA[i];

                // Helper return function
                const calcReturn = (alloc) => {
                    return (alloc.stocks / 100) * item.stocks +
                           (alloc.bonds / 100) * item.bonds +
                           (alloc.reits / 100) * item.reits +
                           (alloc.gold / 100) * item.gold +
                           (alloc.cash / 100) * item.cash;
                };

                // 1. Custom Portfolio
                customVal *= (1 + calcReturn(state.allocation) / 100);

                // 2. Benchmarks
                classicVal *= (1 + calcReturn(PORTFOLIO_BENCHMARKS.classic6040) / 100);
                allWeatherVal *= (1 + calcReturn(PORTFOLIO_BENCHMARKS.allweather) / 100);
                permanentVal *= (1 + calcReturn(PORTFOLIO_BENCHMARKS.permanent) / 100);
                aggressiveVal *= (1 + calcReturn(PORTFOLIO_BENCHMARKS.aggressive) / 100);
                conservativeVal *= (1 + calcReturn(PORTFOLIO_BENCHMARKS.conservative) / 100);

                state.customTrack.push({ year: item.year, val: Math.round(customVal) });
                state.classicTrack.push({ year: item.year, val: Math.round(classicVal) });
                state.allWeatherTrack.push({ year: item.year, val: Math.round(allWeatherVal) });
                state.permanentTrack.push({ year: item.year, val: Math.round(permanentVal) });
                state.aggressiveTrack.push({ year: item.year, val: Math.round(aggressiveVal) });
                state.conservativeTrack.push({ year: item.year, val: Math.round(conservativeVal) });
            }

            // The numbers are the product and the chart illustrates them, so the
            // text is written first: a failure inside renderChart() can no longer
            // take updateMetrics() and renderLogList() with it.
            updateMetrics();
            renderLogList();
            renderChart();
        }

        function renderChart() {
            const ctx = document.getElementById('timeMachineChart');
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

            const labels = state.customTrack.map(d => d.year);

            if (state.chartInstance) {
                state.chartInstance.destroy();
                state.chartInstance = null;
            }

            state.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: '🟢 Your Custom Portfolio',
                            data: state.customTrack.map(d => d.val),
                            borderColor: '#134e2a',
                            backgroundColor: 'rgba(19, 78, 42, 0.08)',
                            borderWidth: 3.5,
                            fill: true,
                            tension: 0.1,
                            pointRadius: 2
                        },
                        {
                            label: '🔵 Classic 60/40',
                            data: state.classicTrack.map(d => d.val),
                            borderColor: '#2563eb',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.1,
                            pointRadius: 0
                        },
                        {
                            label: '🟣 All-Weather (Dalio)',
                            data: state.allWeatherTrack.map(d => d.val),
                            borderColor: '#7c3aed',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.1,
                            pointRadius: 0
                        },
                        {
                            label: '🟠 Permanent (Browne)',
                            data: state.permanentTrack.map(d => d.val),
                            borderColor: '#d97706',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.1,
                            pointRadius: 0
                        },
                        {
                            label: '🔴 100% Stocks (Aggressive)',
                            data: state.aggressiveTrack.map(d => d.val),
                            borderColor: '#e11d48',
                            borderWidth: 2,
                            borderDash: [4, 4],
                            fill: false,
                            tension: 0.1,
                            pointRadius: 0
                        },
                        {
                            label: '🟢 Conservative (20/80)',
                            data: state.conservativeTrack.map(d => d.val),
                            borderColor: '#0d9488',
                            borderWidth: 1.5,
                            borderDash: [2, 2],
                            fill: false,
                            tension: 0.1,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                font: { size: 11, family: 'Inter' },
                                boxWidth: 12
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return ` ${context.dataset.label}: $${context.raw.toLocaleString()}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function(val) {
                                    if (val >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
                                    if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
                                    if (val >= 1e3) return '$' + (val / 1e3).toFixed(0) + 'k';
                                    return '$' + val;
                                },
                                font: { size: 10, family: 'Inter' }
                            },
                            grid: { color: '#efe9df' }
                        },
                        x: {
                            ticks: { font: { size: 10, family: 'Inter' } },
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        function updateMetrics() {
            if (state.customTrack.length === 0) return;

            const latestCustom = state.customTrack[state.customTrack.length - 1];
            const latestClassic = state.classicTrack[state.classicTrack.length - 1];
            const latestWeather = state.allWeatherTrack[state.allWeatherTrack.length - 1];
            const latestPermanent = state.permanentTrack[state.permanentTrack.length - 1];
            const latestAggressive = state.aggressiveTrack[state.aggressiveTrack.length - 1];
            const latestConservative = state.conservativeTrack[state.conservativeTrack.length - 1];
            
            const currentYear = latestCustom.year;
            const yearsCount = currentYear - state.startYear;

            document.getElementById('currentYearDisplay').innerText = `YEAR: ${currentYear}`;
            document.getElementById('progressBadge').innerText = `${state.startYear} - ${currentYear}`;

            const calcCagr = (val) => yearsCount > 0 ? ((Math.pow(val / state.initialCapital, 1 / yearsCount) - 1) * 100).toFixed(1) : '0.0';

            // 1. Custom Stat
            document.getElementById('statCustomVal').innerText = `$${latestCustom.val.toLocaleString()}`;
            document.getElementById('statCustomCagr').innerText = `CAGR: ${calcCagr(latestCustom.val)}%`;

            // 2. Classic Stat
            document.getElementById('statClassicVal').innerText = `$${latestClassic.val.toLocaleString()}`;
            document.getElementById('statClassicCagr').innerText = `CAGR: ${calcCagr(latestClassic.val)}%`;

            // 3. All-Weather Stat
            document.getElementById('statWeatherVal').innerText = `$${latestWeather.val.toLocaleString()}`;
            document.getElementById('statWeatherCagr').innerText = `CAGR: ${calcCagr(latestWeather.val)}%`;

            // 4. Permanent Stat
            document.getElementById('statPermanentVal').innerText = `$${latestPermanent.val.toLocaleString()}`;
            document.getElementById('statPermanentCagr').innerText = `CAGR: ${calcCagr(latestPermanent.val)}%`;

            // 5. Aggressive Stat
            document.getElementById('statAggressiveVal').innerText = `$${latestAggressive.val.toLocaleString()}`;
            document.getElementById('statAggressiveCagr').innerText = `CAGR: ${calcCagr(latestAggressive.val)}%`;

            // 6. Conservative Stat
            document.getElementById('statConservativeVal').innerText = `$${latestConservative.val.toLocaleString()}`;
            document.getElementById('statConservativeCagr').innerText = `CAGR: ${calcCagr(latestConservative.val)}%`;

            updateResultCta({
                yearsCount,
                currentYear,
                customVal: latestCustom.val,
                classicVal: latestClassic.val,
                customCagr: calcCagr(latestCustom.val),
                classicCagr: calcCagr(latestClassic.val)
            });
        }

        /**
         * Classifies the run for the result-aware panel.
         *
         * updateMetrics() is called once per simulated year, so this is called
         * once per simulated year too, and the panel's text is rewritten each
         * time. That is deliberate: the visitor is watching a portfolio move
         * through history, and a reading of it that froze at year ten would be
         * describing a chart that is no longer on screen.
         *
         * Ten years is where it starts speaking. Before that the gap between
         * any two allocations is mostly which year the simulation happened to
         * begin in, and a confident sentence about a three-year backtest is the
         * kind of thing this tool exists to argue against.
         */
        function updateResultCta(result) {
            if (!window.SimCta) return;
            if (result.yearsCount < 10) return;

            const gap = result.customVal - result.classicVal;
            const cashGold = (state.allocation.cash || 0) + (state.allocation.gold || 0);

            // An allocation held mostly in cash and gold is a different result
            // from simply losing to the benchmark, and it is the one worth
            // naming: it loses slowly, comfortably, and for a reason the
            // visitor chose on purpose.
            let bucket;
            if (gap > 0) bucket = 'beat';
            else if (cashGold > 50) bucket = 'inflationExposed';
            else bucket = 'lagged';

            window.SimCta.show(bucket, {
                years: result.yearsCount,
                startYear: state.startYear,
                endYear: result.currentYear,
                customVal: window.SimCta.money(result.customVal),
                diff: window.SimCta.money(Math.abs(gap)),
                customCagr: result.customCagr,
                classicCagr: result.classicCagr,
                cashGold
            });
        }

        function renderLogList() {
            const listEl = document.getElementById('simLogList');
            if (!listEl) return;
            listEl.innerHTML = '';

            const startIdx = HISTORICAL_YEARS_DATA.findIndex(d => d.year === state.startYear);
            for (let i = startIdx; i <= state.currentYearIdx; i++) {
                const item = HISTORICAL_YEARS_DATA[i];
                if (item.event) {
                    const row = document.createElement('div');
                    row.className = 'flex items-center justify-between p-1.5 rounded bg-amber-100/70 border border-amber-300 text-espresso-950 font-medium cursor-pointer hover:bg-amber-200 transition';
                    row.innerHTML = `
                        <span class="flex items-center gap-1.5 font-serif font-bold text-amber-900">
                            <i class="fa-solid ${item.event.icon} text-amber-700" aria-hidden="true"></i>
                            ${item.year}: ${item.event.title}
                        </span>
                        <span class="font-mono text-[10px] text-amber-800 font-bold">VIEW EVENT</span>
                    `;
                    row.onclick = () => showEventModal(item.event, item.year);
                    listEl.appendChild(row);
                }
            }
        }

        function togglePlayPause() {
            if (state.isPlaying) {
                pauseSimulation();
            } else {
                startSimulation();
            }
        }

        function startSimulation() {
            const maxIdx = HISTORICAL_YEARS_DATA.length - 1;
            if (state.currentYearIdx >= maxIdx) {
                state.currentYearIdx = HISTORICAL_YEARS_DATA.findIndex(d => d.year === state.startYear);
            }

            state.isPlaying = true;
            document.getElementById('playPauseIcon').className = 'fa-solid fa-pause';
            document.getElementById('playPauseText').innerText = 'Pause Journey';

            state.timer = setInterval(() => {
                if (state.currentYearIdx < maxIdx) {
                    state.currentYearIdx++;
                    recalculateSimulation();

                    const currentItem = HISTORICAL_YEARS_DATA[state.currentYearIdx];
                    if (currentItem && currentItem.event) {
                        pauseSimulation();
                        state.wasPlayingBeforeModal = true;
                        showEventModal(currentItem.event, currentItem.year);
                    }
                } else {
                    pauseSimulation();
                }
            }, 800);
        }

        function pauseSimulation() {
            state.isPlaying = false;
            if (state.timer) {
                clearInterval(state.timer);
                state.timer = null;
            }
            document.getElementById('playPauseIcon').className = 'fa-solid fa-play';
            document.getElementById('playPauseText').innerText = 'Start Journey';
        }

        function advanceOneYear() {
            pauseSimulation();
            const maxIdx = HISTORICAL_YEARS_DATA.length - 1;
            if (state.currentYearIdx < maxIdx) {
                state.currentYearIdx++;
                recalculateSimulation();

                const currentItem = HISTORICAL_YEARS_DATA[state.currentYearIdx];
                if (currentItem && currentItem.event) {
                    state.wasPlayingBeforeModal = false;
                    showEventModal(currentItem.event, currentItem.year);
                }
            }
        }

        function showEventModal(eventData, year) {
            document.getElementById('eventModalYear').innerText = `HISTORICAL EVENT (${year})`;
            document.getElementById('eventModalTitle').innerText = eventData.title;
            document.getElementById('eventModalIcon').className = `fa-solid ${eventData.icon}`;
            document.getElementById('eventModalDesc').innerText = eventData.desc;
            document.getElementById('eventModalStats').innerText = eventData.impact;

            document.getElementById('eventModal').classList.remove('hidden');
        }

        function closeEventModal(resume = true) {
            document.getElementById('eventModal').classList.add('hidden');
            if (resume && state.wasPlayingBeforeModal) {
                state.wasPlayingBeforeModal = false;
                startSimulation();
            } else {
                state.wasPlayingBeforeModal = false;
                pauseSimulation();
            }
        }

        function toggleHowToPlayModal() {
            const modal = document.getElementById('howToPlayModal');
            modal.classList.toggle('hidden');
        }

        function resetSimulation() {
            pauseSimulation();
            state.wasPlayingBeforeModal = false;
            document.getElementById('startYearSelect').value = '1920';
            changeStartYear(1920);
        }

        window.onload = function() {
            checkTotalAllocation();
            updateTooltipComposition();
            recalculateSimulation();
        };
