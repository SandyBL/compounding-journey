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
                title: 'O Grande Colapso de 1929',
                icon: 'fa-building-circle-exclamation',
                desc: 'Terça-Feira Negra e início da Grande Depressão. O mercado de ações colapsou após anos de especulação desenfreada, desencadeando falências bancárias em massa.',
                impact: 'Ações caíram -8.4% em 1929 e continuaram caindo nos anos seguintes. Títulos do tesouro ofereceram proteção positiva (+4.2%).'
            }},
            { year: 1930, stocks: -24.9, bonds: 4.5, reits: -20.0, gold: 0.0, cash: 2.4 },
            { year: 1931, stocks: -43.3, bonds: -2.6, reits: -35.0, gold: 0.0, cash: 1.1, event: {
                title: 'Fundo da Grande Depressão (1931)',
                icon: 'fa-burst',
                desc: 'Pior ano da história de Wall Street. O desespero fez milhões de investidores realizarem todas as suas perdas e jurarem nunca mais voltar às ações.',
                impact: 'Queda devastadora de -43.3% nas ações. Portfólios com ouro e títulos amorteceram a queda drasticamente.'
            }},
            { year: 1932, stocks: -8.2, bonds: 8.8, reits: -18.0, gold: 0.0, cash: 1.0 },
            { year: 1933, stocks: 54.0, bonds: 1.9, reits: 25.0, gold: 20.0, cash: 0.3 },
            { year: 1934, stocks: -1.4, bonds: 8.0, reits: 5.0, gold: 69.0, cash: 0.2 },
            { year: 1935, stocks: 47.7, bonds: 4.5, reits: 30.0, gold: 0.0, cash: 0.2 },
            { year: 1936, stocks: 33.9, bonds: 5.0, reits: 20.0, gold: 0.0, cash: 0.2 },
            { year: 1937, stocks: -35.0, bonds: 1.6, reits: -25.0, gold: 0.0, cash: 0.3, event: {
                title: 'Recessão Secundária de 1937',
                icon: 'fa-triangle-exclamation',
                desc: 'Aperto monetário do Fed e cortes de gastos públicos resultaram em uma recaída violenta no meio da recuperação.',
                impact: 'Ações despencaram -35.0%, testando a disciplina de quem havia sobrevivido à crise de 1929.'
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
                title: 'Choque do Petróleo e Estagflação (1974)',
                icon: 'fa-fire-flame-curved',
                desc: 'Embargo de petróleo da OPEP, inflação de dois dígitos e desaceleração econômica severa. O ouro explodiu como ativo de proteção.',
                impact: 'Ações caíram -26.5% e Imóveis -28.0%. Em contrapartida, o Ouro subiu impressionantes +66.0%!'
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
                title: 'Segunda-Feira Negra (1987)',
                icon: 'fa-bolt',
                desc: 'Maior queda percentual em um único dia da história do Dow Jones (-22.6%). Falhas em modelos computadorizados provocaram vendas em cascata.',
                impact: 'Apesar do pânico em outubro, o mercado recuperou-se e encerrou o ano com saldo positivo de +5.3% nas ações.'
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
                title: 'Estouro da Bolha Dot-Com (2000)',
                icon: 'fa-laptop-code',
                desc: 'Colapso de valuations eufóricos de empresas de tecnologia sem lucro. Início de um bear market de 3 anos nas ações.',
                impact: 'Ações despencaram -9.1%, enquanto Títulos (+11.6%) e Imóveis/REITs (+26.8%) atuaram como excelentes amortecedores.'
            }},
            { year: 2001, stocks: -11.9, bonds: 8.4, reits: 15.5, gold: 2.5, cash: 3.8 },
            { year: 2002, stocks: -22.1, bonds: 15.1, reits: 3.8, gold: 24.7, cash: 1.7 },
            { year: 2003, stocks: 28.7, bonds: 2.2, reits: 37.1, gold: 19.4, cash: 1.0 },
            { year: 2004, stocks: 10.9, bonds: 4.3, reits: 31.6, gold: 5.5, cash: 1.2 },
            { year: 2005, stocks: 4.9, bonds: 2.9, reits: 12.2, gold: 18.0, cash: 3.0 },
            { year: 2006, stocks: 15.8, bonds: 4.3, reits: 35.1, gold: 23.0, cash: 4.8 },
            { year: 2007, stocks: 5.5, bonds: 10.2, reits: -15.7, gold: 30.9, cash: 4.7 },
            { year: 2008, stocks: -37.0, bonds: 20.1, reits: -37.7, gold: 5.6, cash: 1.5, event: {
                title: 'Crise Financeira Global de 2008',
                icon: 'fa-skull-crossbones',
                desc: 'Falência do Lehman Brothers e colapso do sistema de crédito subprime mundial. A pior queda desde 1929.',
                impact: 'Ações caíram -37.0% e REITs -37.7%. No entanto, Títulos do Tesouro subiram +20.1%, provando o poder da diversificação!'
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
                title: 'Pandemia & Lockdowns Globais (2020)',
                icon: 'fa-virus-covid',
                desc: 'Paralisação econômica global relâmpago seguida por estímulos fiscais e monetários trilionários sem precedentes.',
                impact: 'Após um crash de -34% em poucas semanas, o mercado encerrou o ano em alta forte de +18.4% impulsionado por liquidez.'
            }},
            { year: 2021, stocks: 28.7, bonds: -1.5, reits: 41.3, gold: -3.6, cash: 0.1 },
            { year: 2022, stocks: -18.1, bonds: -13.0, reits: -24.9, gold: -0.1, cash: 1.5, event: {
                title: 'Aperto Monetário & Inflação (2022)',
                icon: 'fa-arrow-trend-down',
                desc: 'O Fed elevou os juros agressivamente para combater a inflação. Pior queda simultânea em ações e títulos em 50 anos!',
                impact: 'Ações caíram -18.1% e Títulos caíram -13.0%, testando investidores que dependiam apenas de títulos como proteção.'
            }},
            { year: 2023, stocks: 26.3, bonds: 5.5, reits: 11.4, gold: 13.1, cash: 5.0 },
            { year: 2024, stocks: 24.2, bonds: 1.2, reits: 8.5, gold: 27.2, cash: 5.2 },
            { year: 2025, stocks: 12.5, bonds: 4.8, reits: 9.1, gold: 11.0, cash: 4.5 },
            { year: 2026, stocks: 9.8, bonds: 5.0, reits: 7.5, gold: 8.2, cash: 4.0 }
        ];

        const PORTFOLIO_BENCHMARKS = {
            classic6040: { name: 'Clássico (60/40)', stocks: 60, bonds: 40, reits: 0, gold: 0, cash: 0 },
            allweather: { name: 'Todo Clima (Dalio)', stocks: 30, bonds: 55, reits: 0, gold: 15, cash: 0 },
            permanent: { name: 'Permanente (Browne)', stocks: 25, bonds: 25, reits: 0, gold: 25, cash: 25 },
            aggressive: { name: '100% Ações', stocks: 100, bonds: 0, reits: 0, gold: 0, cash: 0 },
            conservative: { name: 'Conservador (20/80)', stocks: 20, bonds: 60, reits: 0, gold: 0, cash: 20 }
        };

        /**
         * The last year the simulation drew, or null before the first draw.
         * Only the contribute button reads it.
         */
        let lastRun = null;

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
                <div>• ${state.allocation.stocks}% Ações</div>
                <div>• ${state.allocation.bonds}% Títulos</div>
                <div>• ${state.allocation.reits}% Imóveis/REITs</div>
                <div>• ${state.allocation.gold}% Ouro</div>
                <div>• ${state.allocation.cash}% Caixa</div>
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
                    note.textContent = 'Não foi possível desenhar o gráfico. Todos os valores que mostraria também aparecem como texto nesta página.';
                    ctx.insertAdjacentElement('afterend', note);
                }
                return;
            }

            const labels = state.customTrack.map(d => d.year);

            if (state.chartInstance) {
                state.chartInstance.destroy();
                state.chartInstance = null;
            }

            // Six series, indexed into the shared palette in the order the
            // cards under the chart show them, so a chip and the line it names
            // are the same colour. Series five and six are the pair that is
            // closest in luminance, so those are the two that dash - the same
            // pair .sim-series__key dashes in the markup.
            const theme = window.SimChartTheme;

            state.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Seu Portfólio Personalizado',
                            data: state.customTrack.map(d => d.val),
                            borderColor: theme.line(0),
                            backgroundColor: theme.fill(0),
                            borderWidth: 3.5,
                            fill: true,
                            pointRadius: 2
                        },
                        {
                            label: 'Clássico 60/40',
                            data: state.classicTrack.map(d => d.val),
                            borderColor: theme.line(2),
                            fill: false
                        },
                        {
                            label: 'Todo Clima (Dalio)',
                            data: state.allWeatherTrack.map(d => d.val),
                            borderColor: theme.line(5),
                            borderDash: [2, 2],
                            fill: false
                        },
                        {
                            label: 'Permanente (Browne)',
                            data: state.permanentTrack.map(d => d.val),
                            borderColor: theme.line(1),
                            fill: false
                        },
                        {
                            label: '100% Ações (Agressivo)',
                            data: state.aggressiveTrack.map(d => d.val),
                            borderColor: theme.line(3),
                            fill: false
                        },
                        {
                            label: 'Conservador (20/80)',
                            data: state.conservativeTrack.map(d => d.val),
                            borderColor: theme.line(4),
                            borderDash: [4, 4],
                            fill: false
                        }
                    ]
                },
                options: {
                    // The chart is rebuilt on every simulated year, so an
                    // animation would be competing with the next redraw.
                    animation: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return ` ${context.dataset.label}: R$${context.raw.toLocaleString()}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function(val) {
                                    if (val >= 1e9) return 'R$' + (val / 1e9).toFixed(1) + 'B';
                                    if (val >= 1e6) return 'R$' + (val / 1e6).toFixed(1) + 'M';
                                    if (val >= 1e3) return 'R$' + (val / 1e3).toFixed(0) + 'k';
                                    return 'R$' + val;
                                }
                            }
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

            document.getElementById('currentYearDisplay').innerText = `ANO: ${currentYear}`;
            document.getElementById('progressBadge').innerText = `${state.startYear} - ${currentYear}`;

            const calcCagr = (val) => yearsCount > 0 ? ((Math.pow(val / state.initialCapital, 1 / yearsCount) - 1) * 100).toFixed(1) : '0.0';

            // 1. Custom Stat
            document.getElementById('statCustomVal').innerText = `R$${latestCustom.val.toLocaleString()}`;
            document.getElementById('statCustomCagr').innerText = `CAGR: ${calcCagr(latestCustom.val)}%`;

            // 2. Classic Stat
            document.getElementById('statClassicVal').innerText = `R$${latestClassic.val.toLocaleString()}`;
            document.getElementById('statClassicCagr').innerText = `CAGR: ${calcCagr(latestClassic.val)}%`;

            // 3. All-Weather Stat
            document.getElementById('statWeatherVal').innerText = `R$${latestWeather.val.toLocaleString()}`;
            document.getElementById('statWeatherCagr').innerText = `CAGR: ${calcCagr(latestWeather.val)}%`;

            // 4. Permanent Stat
            document.getElementById('statPermanentVal').innerText = `R$${latestPermanent.val.toLocaleString()}`;
            document.getElementById('statPermanentCagr').innerText = `CAGR: ${calcCagr(latestPermanent.val)}%`;

            // 5. Aggressive Stat
            document.getElementById('statAggressiveVal').innerText = `R$${latestAggressive.val.toLocaleString()}`;
            document.getElementById('statAggressiveCagr').innerText = `CAGR: ${calcCagr(latestAggressive.val)}%`;

            // 6. Conservative Stat
            document.getElementById('statConservativeVal').innerText = `R$${latestConservative.val.toLocaleString()}`;
            document.getElementById('statConservativeCagr').innerText = `CAGR: ${calcCagr(latestConservative.val)}%`;

            updateResultCta({
                yearsCount,
                currentYear,
                customVal: latestCustom.val,
                classicVal: latestClassic.val,
                customCagr: calcCagr(latestCustom.val),
                classicCagr: calcCagr(latestClassic.val)
            });

            // What the contribute button would send if it were pressed now. It
            // is replaced once per simulated year, so it always describes the
            // chart currently on screen and never an earlier version of it.
            lastRun = {
                yearsCount,
                customVal: Math.round(latestCustom.val),
                classicVal: Math.round(latestClassic.val)
            };

            // Ten years, the same threshold the result panel uses, and for the
            // same reason: the difference between two allocations over three
            // years is mostly the start year, and a data set of three-year
            // backtests would be a data set of start years.
            if (window.contributeReady) window.contributeReady(yearsCount >= 10);
        }

        /**
         * The run the contribute button offers to keep, or null if there is not
         * one yet. Read by assets/js/sim-contribute.js.
         *
         * None of it is about the visitor. It is an allocation, a stretch of
         * market history, and what the two came to - and that combination is the
         * whole reason to record anything here. People do not choose a start
         * year at random: they choose 1929, or 2000, or the year they were born,
         * and which decades people want to live through is a fact about how
         * people think about risk that nobody has published.
         *
         * The benchmark value is sent alongside the run's own, over exactly the
         * same years, because a portfolio that returned 9% a year is a fact
         * about the decade until you know what the default did over the same
         * decade. Storing both means a published average can compare them;
         * storing one would mean recomputing the other later and hoping the
         * historical series had not been edited in between.
         *
         * The CAGR goes in the score column offset by 10,000, so a portfolio
         * that lost money is still a non-negative number in a column every
         * board sorts on: 10,000 is flat, 10,700 is +7% a year, 9,200 is -8%.
         */
        function describeContributedRun() {
            if (!lastRun || lastRun.yearsCount < 10) return null;

            const presetEl = document.getElementById('presetSelect');
            const preset = presetEl ? presetEl.value : 'custom';

            const growth = lastRun.customVal / state.initialCapital;
            const cagr = growth > 0 ? Math.pow(growth, 1 / lastRun.yearsCount) - 1 : -1;

            return {
                simulator: 'market-time-machine',
                score: clamp(10000 + cagr * 10000, 0, 20000),
                tiebreak: clamp(lastRun.customVal, 0, 1000000000),
                details: {
                    startYear: recordable(state.startYear, 1920, 2026),
                    yearsElapsed: recordable(lastRun.yearsCount, 0, 110),
                    initialCapital: recordable(state.initialCapital, 1, 1000000000),
                    pctStocks: recordable(state.allocation.stocks, 0, 100),
                    pctBonds: recordable(state.allocation.bonds, 0, 100),
                    pctReits: recordable(state.allocation.reits, 0, 100),
                    pctGold: recordable(state.allocation.gold, 0, 100),
                    pctCash: recordable(state.allocation.cash, 0, 100),
                    preset: PORTFOLIO_BENCHMARKS[preset] ? preset : 'custom',
                    finalValue: recordable(lastRun.customVal, 0, 1000000000),
                    benchmarkValue: recordable(lastRun.classicVal, 0, 1000000000),
                    maxDrawdownBps: recordable(worstDrawdown(state.customTrack) * 10000, 0, 10000)
                }
            };
        }

        /**
         * The deepest peak-to-trough fall the track took, as a fraction.
         *
         * Computed here rather than tracked during the simulation because the
         * track is the simulation: recalculateSimulation() rebuilds it from the
         * start year every time anything changes, so a running maximum kept
         * alongside it would be one more thing that has to be reset in the same
         * place and would eventually not be.
         */
        function worstDrawdown(track) {
            let peak = 0;
            let worst = 0;
            (track || []).forEach((point) => {
                if (point.val > peak) peak = point.val;
                if (peak > 0) {
                    const fall = (peak - point.val) / peak;
                    if (fall > worst) worst = fall;
                }
            });
            return worst;
        }

        /** The value if the record can hold it, and nothing if it cannot. */
        function recordable(value, min, max) {
            const number = Math.round(Number(value));
            if (!Number.isFinite(number) || number < min || number > max) return undefined;
            return number;
        }

        /** The nearest value the record can hold, for the columns it requires. */
        function clamp(value, min, max) {
            const number = Math.round(Number(value));
            if (!Number.isFinite(number)) return min;
            return Math.max(min, Math.min(max, number));
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
                        <span class="font-mono text-[10px] text-amber-800 font-bold">VER EVENTO</span>
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
            document.getElementById('playPauseText').innerText = 'Pausar Viagem';

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
            document.getElementById('playPauseText').innerText = 'Iniciar Viagem';
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
            document.getElementById('eventModalYear').innerText = `EVENTO HISTÓRICO (${year})`;
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
