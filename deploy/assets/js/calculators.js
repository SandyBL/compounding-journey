/**
 * The standalone calculator pages' behaviour.
 *
 * Relationship to assets/js/home.js, which matters: all four calculations
 * also run on the home page, inside a tabbed widget. That copy is
 * not imported here and this one is not imported there, and the duplication is
 * deliberate rather than an oversight.
 *
 * home.js is not a hand-written file. generate-home-pages.mjs extracts it
 * byte-for-byte out of the inline <script> block in content/home/index.html and
 * throws if the block is no longer identical, which is what stops the home
 * page's markup and its behaviour drifting apart. Refactoring the three
 * calculation functions out into a module either breaks that check or makes the
 * home template depend on a file it cannot see - so the formulas are restated
 * here instead, and the pairing is recorded in a comment at each one. If a
 * formula changes, it changes in two places; the alternative was making the
 * home page's build fragile to protect against roughly forty lines of
 * arithmetic diverging.
 *
 * Everything else here is different from home.js on purpose. There are no
 * tabs (one calculation per page), the results are announced to screen readers
 * (a value that changes without a page reload is invisible otherwise), and the
 * whole thing is driven by data attributes emitted by
 * generate-tool-pages.mjs rather than by hard-coded element ids - so adding a
 * fourth calculator is a data entry in content/site/tools.mjs and an engine
 * below, and no changes to the wiring.
 */
(function () {
  'use strict';

  var CURRENCIES = ['EUR', 'USD', 'BRL'];
  var STORAGE_KEY = 'preferredCalculatorCurrency';

  var LOCALES = { es: 'es-ES', en: 'en-US', pt: 'pt-PT' };

  var language = (document.documentElement.getAttribute('lang') || 'es').toLowerCase();
  if (!LOCALES[language]) language = 'es';
  var locale = LOCALES[language];

  /** The currency preference is shared with the home page's widget, by key. */
  var currency = language === 'en' ? 'USD' : 'EUR';
  try {
    var saved = (localStorage.getItem(STORAGE_KEY) || '').toUpperCase();
    if (CURRENCIES.indexOf(saved) !== -1) currency = saved;
  } catch (error) {
    /* Private browsing denies localStorage. The default is fine. */
  }

  function formatCurrency(amount) {
    if (!isFinite(amount)) return '—';
    return amount.toLocaleString(locale, { style: 'currency', currency: currency });
  }

  function formatNumber(amount, decimals) {
    if (!isFinite(amount)) return '—';
    return amount.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /* ------------------------------------------------------------- engines -- */

  /**
   * Monthly compounding loop, matching calculateCompoundInterest() in home.js.
   *
   * A closed-form annuity formula would be one line and slightly faster, but
   * the loop is what the home page runs, and two implementations of the same
   * published number that round differently is a worse problem than sixty
   * iterations of a multiply.
   */
  function compoundInterest(values) {
    var initial = values.initial || 0;
    var monthly = values.monthly || 0;
    var years = Math.round(values.years || 0);
    var rate = values.rate || 0;

    var monthlyRate = (rate / 100) / 12;
    var totalMonths = years * 12;
    var invested = initial + (monthly * totalMonths);
    var total = initial;

    for (var month = 0; month < totalMonths; month += 1) {
      total = (total * (1 + monthlyRate)) + monthly;
    }

    return {
      total: formatCurrency(total),
      invested: formatCurrency(invested),
      interest: formatCurrency(Math.max(0, total - invested))
    };
  }

  /**
   * The 4% rule plus a payment formula, matching calculateFreedom() in home.js.
   * The 300 multiplier and the 8% rate are stated in the page's own "how it
   * works" section, so they are not configurable here - a reader comparing the
   * two would find the same numbers.
   */
  function financialFreedom(values) {
    var yearsRemaining = Math.max(0, Math.round((values.targetAge || 0) - (values.currentAge || 0)));
    var targetFund = (values.desiredIncome || 0) * 300;

    var monthlyRate = 0.08 / 12;
    var totalMonths = yearsRemaining * 12;
    var contribution = totalMonths > 0
      ? (targetFund * monthlyRate) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : targetFund;

    var suffix = language === 'en' ? '/month' : language === 'pt' ? '/mês' : '/mes';

    return {
      target: formatCurrency(targetFund),
      years: formatNumber(yearsRemaining, 0),
      savings: formatCurrency(contribution) + suffix
    };
  }

  /** Two divisions, matching calculateLifeCost() in home.js. */
  function lifeCost(values) {
    var salary = values.monthlySalary || 0;
    var hoursWorked = values.monthlyHours || 0;
    var price = Math.max(0, values.purchaseCost || 0);

    var valid = salary > 0 && hoursWorked > 0;
    var hourly = valid ? salary / hoursWorked : 0;
    var hours = hourly > 0 ? price / hourly : 0;

    return {
      hours: formatNumber(hours, hours > 0 && hours < 10 ? 1 : 0),
      hourly: formatCurrency(hourly),
      /* Read by the caller, not rendered: an invalid rate is a user error, not
         a result, so the page shows its error message instead of "0 hours". */
      valid: valid
    };
  }

  /* --------------------------------------------- negative compounding -- */

  /*
   * Twin: calculateNegativeCompounding() and NEGATIVE_REGIMES in home.js, a
   * compact home-page tab without the chart. A rate or a change to the loop
   * below has to be made there too. Its frictionless portfolio is, on
   * purpose, the exact loop compoundInterest() runs above, so the same inputs
   * give the same "ideal" figure on both pages and the difference between
   * them is only ever the friction.
   */

  /** Spain's savings-income scale (base del ahorro), applied band by band. */
  var SPAIN_SAVINGS_BANDS = [[6000, 0.19], [50000, 0.21], [200000, 0.23], [300000, 0.27], [Infinity, 0.30]];

  function spainSavingsTax(gain) {
    var tax = 0;
    var floor = 0;
    for (var i = 0; i < SPAIN_SAVINGS_BANDS.length && gain > floor; i += 1) {
      var ceiling = SPAIN_SAVINGS_BANDS[i][0];
      tax += (Math.min(gain, ceiling) - floor) * SPAIN_SAVINGS_BANDS[i][1];
      floor = ceiling;
    }
    return tax;
  }

  function flatTax(rate) {
    return function (gain) { return gain * rate; };
  }

  /** Brazil's regressive table for fixed income, by how long the money stayed in. */
  function brazilRegressiveTax(gain, years) {
    var months = years * 12;
    var rate = months <= 6 ? 0.225 : months <= 12 ? 0.20 : months <= 24 ? 0.175 : 0.15;
    return gain * rate;
  }

  /*
   * The tax regimes the page offers, keyed by the option values in
   * content/site/tools.mjs. The rates are the ones each option's explanation
   * card states, so a reader can check one against the other.
   *
   *   every        - months between periodic tax events.
   *   distribution - share of the balance paid out (and taxed) at each event,
   *                  then reinvested net of tax. Dividends, fund distributions.
   *   accrual      - tax on the whole unrealised gain at each event, taken by
   *                  cancelling units. Brazil's come-cotas.
   *   periodicTax  - how a distribution is taxed.
   *   exitTax      - how the gain still untaxed at the end is taxed.
   *   exitOnTotal  - a rate on the whole balance, contributions included. A
   *                  Spanish pension plan taken as a lump sum.
   */
  var REGIMES = {
    ES_REPARTO: { every: 12, distribution: 0.03, periodicTax: spainSavingsTax, exitTax: spainSavingsTax },
    ES_TRASPASO: { exitTax: spainSavingsTax },
    ES_PENSIONES: { exitOnTotal: 0.30 },
    US_TURNOVER: { every: 12, distribution: 0.03, periodicTax: flatTax(0.15), exitTax: flatTax(0.15) },
    US_ETF: { every: 12, distribution: 0.015, periodicTax: flatTax(0.15), exitTax: flatTax(0.15) },
    US_HIGH: { every: 12, distribution: 0.015, periodicTax: flatTax(0.238), exitTax: flatTax(0.238) },
    US_ROTH: {},
    BR_COMECOTAS: { every: 6, accrual: flatTax(0.15), exitTax: brazilRegressiveTax },
    BR_REGRESSIVA: { exitTax: brazilRegressiveTax },
    BR_ACOES: { exitTax: flatTax(0.15) },
    BR_ISENTO: {}
  };

  /**
   * Two portfolios side by side, month by month, from the same inputs.
   *
   * The ideal one is compoundInterest() exactly. The real one grows at the
   * same rate, then pays the annual fee (a twelfth a month, on the whole
   * balance), then pays whatever its tax regime charges along the way, and at
   * the end pays the exit tax on the gain still owed. `basis` is the money
   * that has already been taxed or was never income - contributions, and
   * distributions reinvested after tax - so the exit tax is charged on the
   * rest and nothing is taxed twice.
   *
   * The gap between the two splits into what was paid directly and the growth
   * that money would have gone on to earn had it stayed invested. The second
   * part is the negative compounding the page is named after.
   */
  function negativeCompounding(values) {
    var initial = Math.max(0, values.initial || 0);
    var monthly = Math.max(0, values.monthly || 0);
    var years = Math.max(1, Math.round(values.years || 0));
    var rate = values.rate || 0;
    var feeRate = Math.max(0, values.fee || 0) / 100;
    var regime = REGIMES[values.regime] || {};

    var monthlyRate = (rate / 100) / 12;
    var totalMonths = years * 12;

    var ideal = initial;
    var net = initial;
    var basis = initial;
    var fees = 0;
    var periodicTax = 0;

    var labels = [0];
    var idealSeries = [initial];
    var netSeries = [initial];

    for (var month = 1; month <= totalMonths; month += 1) {
      ideal = (ideal * (1 + monthlyRate)) + monthly;

      net = net * (1 + monthlyRate);
      var fee = net * feeRate / 12;
      net = net - fee + monthly;
      fees += fee;
      basis += monthly;

      if (regime.every && month % regime.every === 0) {
        var tax = 0;
        if (regime.distribution) {
          var paidOut = net * regime.distribution;
          tax = regime.periodicTax(paidOut, years);
          basis += paidOut - tax;
        } else if (regime.accrual && net > basis) {
          tax = regime.accrual(net - basis, years);
          basis = net - tax;
        }
        net -= tax;
        periodicTax += tax;
      }

      if (month % 12 === 0) {
        labels.push(month / 12);
        idealSeries.push(ideal);
        netSeries.push(net);
      }
    }

    var exitTax = 0;
    if (regime.exitOnTotal) {
      exitTax = net * regime.exitOnTotal;
    } else if (regime.exitTax && net > basis) {
      exitTax = regime.exitTax(net - basis, years);
    }
    net -= exitTax;

    /* The drop at the exit is the point of the chart, so it gets its own
       point rather than being folded into the last year. */
    if (exitTax > 0) {
      labels.push('exit');
      idealSeries.push(ideal);
      netSeries.push(net);
    }

    var invested = initial + (monthly * totalMonths);
    var gap = Math.max(0, ideal - net);
    var lostGrowth = Math.max(0, gap - fees - periodicTax - exitTax);
    var yearSuffix = language === 'en' ? ' years' : language === 'pt' ? ' anos' : ' años';

    return {
      gap: formatCurrency(gap),
      ideal: formatCurrency(ideal),
      net: formatCurrency(net),
      erosion: ideal > 0 ? formatNumber((gap / ideal) * 100, 1) + ' %' : '—',
      invested: formatCurrency(invested),
      fees: formatCurrency(fees),
      periodicTax: formatCurrency(periodicTax),
      exitTax: formatCurrency(exitTax),
      lostGrowth: formatCurrency(lostGrowth),
      /* Years of contributions the gap is worth. With no monthly
         contribution there is nothing to measure it in, so it says so. */
      yearsLost: monthly > 0 ? formatNumber(gap / (monthly * 12), 1) + yearSuffix : '—',
      series: { labels: labels, ideal: idealSeries, net: netSeries },
      /* Nothing invested means nothing to erode: the page shows its message
         rather than a row of zeros that reads like a finding. */
      valid: ideal > 0
    };
  }

  var ENGINES = {
    'compound-interest': compoundInterest,
    'financial-freedom': financialFreedom,
    'life-cost': lifeCost,
    'negative-compounding': negativeCompounding
  };

  /* ---------------------------------------------------------------- chart - */

  /**
   * Draws, or redraws, the two-line chart a tool can ask for. Chart.js is
   * deferred and can fail to load; the result block above the chart carries
   * every number, so a missing chart hides its figure and costs nothing else.
   */
  function drawChart(canvas, series, existing) {
    if (typeof window.Chart === 'undefined') {
      var figure = canvas.closest('figure');
      if (figure) figure.hidden = true;
      return null;
    }

    var names = {};
    try {
      names = JSON.parse(canvas.getAttribute('data-chart') || '{}');
    } catch (error) {
      /* Malformed labels still leave a chart worth drawing. */
    }

    var labels = series.labels.map(function (label) {
      return label === 'exit' ? names.exit : (names.year || '') + ' ' + label;
    });

    if (existing) {
      existing.data.labels = labels;
      existing.data.datasets[0].data = series.ideal;
      existing.data.datasets[1].data = series.net;
      existing.update();
      return existing;
    }

    var theme = window.SimChartTheme;
    var green = theme ? theme.line(0) : '#1e4620';
    var rust = theme ? theme.role.negative : '#a6402a';
    var sans = '"DM Sans", system-ui, sans-serif';

    function compact(value) {
      return value.toLocaleString(locale, {
        style: 'currency', currency: currency, notation: 'compact', maximumFractionDigits: 1
      });
    }

    return new window.Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: names.ideal,
            data: series.ideal,
            borderColor: green,
            backgroundColor: theme ? theme.fill(0) : 'rgba(30, 70, 32, 0.10)',
            fill: true
          },
          {
            label: names.net,
            data: series.net,
            borderColor: rust,
            backgroundColor: 'rgba(166, 64, 42, 0.12)',
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { font: { family: sans, size: 11, weight: '600' } } },
          tooltip: {
            callbacks: {
              label: function (context) {
                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: sans }, maxRotation: 0, autoSkipPadding: 12 } },
          y: { beginAtZero: true, ticks: { font: { family: sans }, callback: compact } }
        }
      }
    });
  }

  /* ---------------------------------------------------------------- wiring - */

  function setUp(form) {
    var engine = ENGINES[form.getAttribute('data-calculator')];
    if (!engine) return;

    var inputs = Array.prototype.slice.call(form.querySelectorAll('[data-field]'));
    var panel = form.closest('.calc-panel') || form.parentNode;
    var outputs = Array.prototype.slice.call(panel.querySelectorAll('[data-result]'));
    var resultBox = panel.querySelector('.calc-result');
    var errorBox = panel.querySelector('.calc-error');
    var notes = Array.prototype.slice.call(panel.querySelectorAll('[data-show-for]'));
    var presets = Array.prototype.slice.call(panel.querySelectorAll('[data-preset]'));
    var canvas = panel.querySelector('canvas[data-chart]');
    var figure = canvas ? canvas.closest('figure') : null;
    var chart = null;

    function run() {
      var values = {};
      inputs.forEach(function (input) {
        // A select carries an option id, not a number.
        values[input.getAttribute('data-field')] = input.tagName === 'SELECT' ? input.value : parseFloat(input.value);
      });

      // The explanation card for the chosen option, and no other.
      notes.forEach(function (note) {
        note.hidden = values[note.getAttribute('data-show-for')] !== note.getAttribute('data-show-value');
      });

      var result = engine(values);

      if (result.valid === false) {
        if (errorBox) errorBox.hidden = false;
        if (resultBox) resultBox.hidden = true;
        if (figure) figure.hidden = true;
        return;
      }
      if (errorBox) errorBox.hidden = true;
      if (resultBox) resultBox.hidden = false;

      outputs.forEach(function (output) {
        var key = output.getAttribute('data-result');
        if (key in result) output.textContent = result[key];
      });

      if (canvas && result.series) {
        if (figure) figure.hidden = false;
        chart = drawChart(canvas, result.series, chart);
      }
    }

    // A preset sets the fields it names and leaves the rest as they are, so a
    // reader can keep their own amounts and compare products on top of them.
    presets.forEach(function (button) {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', function () {
        var values;
        try {
          values = JSON.parse(button.getAttribute('data-preset'));
        } catch (error) {
          return;
        }
        inputs.forEach(function (input) {
          var key = input.getAttribute('data-field');
          if (key in values) input.value = values[key];
        });
        presets.forEach(function (other) {
          other.setAttribute('aria-pressed', other === button ? 'true' : 'false');
        });
        run();
      });
    });

    // Editing a field by hand means no preset describes the form any more.
    function clearPresets() {
      presets.forEach(function (button) {
        button.setAttribute('aria-pressed', 'false');
      });
    }

    // Submitting is what a keyboard user does and what the button does without
    // any script at all; the page just has nowhere to submit to, so it is
    // intercepted. `input` gives live updates for everyone else.
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      run();
    });
    inputs.forEach(function (input) {
      input.addEventListener('input', run);
      input.addEventListener('input', clearPresets);
      // Older Safari fires only `change` on a <select>.
      if (input.tagName === 'SELECT') input.addEventListener('change', run);
    });

    var selector = panel.querySelector('[data-currency]');
    if (selector) {
      selector.value = currency;
      selector.addEventListener('change', function () {
        if (CURRENCIES.indexOf(selector.value) === -1) return;
        currency = selector.value;
        try {
          localStorage.setItem(STORAGE_KEY, currency);
        } catch (error) {
          /* A preference that cannot be saved still applies to this page. */
        }
        run();
      });
    }

    // Run once so the page never shows an empty result box next to filled-in
    // default values, which reads as broken.
    run();
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-calculator]'), setUp);
})();
