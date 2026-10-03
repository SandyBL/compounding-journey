    // Hand-off to the Compounding Journey "Monte Carlo FIRE" simulator. Only a plain
    // link is used: no data is put in the URL, the person types their numbers in there.
    function renderMonteCarloLink(m) {
      const link = document.getElementById('link-mc-simulator');
      if (link) link.href = BRAND.simulatorUrl[state.language] || BRAND.simulatorUrl.en;
      setText('lbl-mc-portfolio', fmt(m.totalLiquidBase));
      setText('lbl-mc-spending', fmt(m.totalMonthlyLivingCost * 12));
      setText('lbl-mc-contrib', fmt(m.monthlyInvest));
      setText('lbl-mc-return', `${m.weightedPortfolioYield.toFixed(1)}% / ${(Number(state.inflationRate) || 0).toFixed(1)}%`);
    }

    function renderRetirementChart(m) {
      const canvas = document.getElementById('chart-retirement-trajectory');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const years = 30;
      const labels = [];
      const dataNominal = [];
      const dataReal = [];
      const dataTarget = [];

      const currentYear = new Date().getFullYear();
      const nomRate = m.weightedPortfolioYield / 100;
      const realRate = m.realAnnualReturn;
      // Same projection as the freedom-year calculation (including life events).
      const sim = (rate) => simulateRealPortfolio({
        start: m.totalLiquidBase, monthlyInvest: m.monthlyInvest, years, realReturn: rate,
        careerGrowthRate: m.careerGrowthRate, careerGrowthProportional: m.careerGrowthProportional,
        events: m.lifeEvents, surplus: m.monthlySurplus
      }).values;
      const nominalValues = sim(nomRate), realValues = sim(realRate);
      for (let y = 0; y <= years; y++) {
        labels.push(`${currentYear + y}`);
        dataNominal.push(Math.round(nominalValues[y]));
        dataReal.push(Math.round(realValues[y]));
        dataTarget.push(Math.round(m.targetFreedomCapital));
      }

      if (retirementChartInstance) retirementChartInstance.destroy();

      retirementChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: t('rtChartReal'),
              data: dataReal,
              borderColor: BRAND.greenLight,
              backgroundColor: 'rgba(109, 178, 116, 0.10)',
              fill: true,
              tension: 0.3,
              borderWidth: 2.5
            },
            {
              label: t('rtChartNominal'),
              data: dataNominal,
              borderColor: BRAND.gold,
              borderDash: [5, 5],
              tension: 0.3,
              borderWidth: 1.5,
              fill: false
            },
            {
              label: t('rtChartTarget'),
              data: dataTarget,
              borderColor: BRAND.orange,
              borderDash: [2, 4],
              pointRadius: 0,
              borderWidth: 1.5,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#94a3b8', font: { size: 10, family: 'Inter' } }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#94a3b8', font: { size: 9 } }
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#94a3b8',
                font: { size: 9 },
                callback: v => (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k')
              }
            }
          }
        }
      });
    }

