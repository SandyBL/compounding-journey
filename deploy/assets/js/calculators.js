/**
 * The standalone calculator pages' behaviour.
 *
 * Relationship to assets/js/home.js, which matters: the same three
 * calculations also run on the home page, inside a tabbed widget. That copy is
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

  var ENGINES = {
    'compound-interest': compoundInterest,
    'financial-freedom': financialFreedom,
    'life-cost': lifeCost
  };

  /* ---------------------------------------------------------------- wiring - */

  function setUp(form) {
    var engine = ENGINES[form.getAttribute('data-calculator')];
    if (!engine) return;

    var inputs = Array.prototype.slice.call(form.querySelectorAll('[data-field]'));
    var panel = form.closest('.calc-panel') || form.parentNode;
    var outputs = Array.prototype.slice.call(panel.querySelectorAll('[data-result]'));
    var resultBox = panel.querySelector('.calc-result');
    var errorBox = panel.querySelector('.calc-error');

    function run() {
      var values = {};
      inputs.forEach(function (input) {
        values[input.getAttribute('data-field')] = parseFloat(input.value);
      });

      var result = engine(values);

      if (result.valid === false) {
        if (errorBox) errorBox.hidden = false;
        if (resultBox) resultBox.hidden = true;
        return;
      }
      if (errorBox) errorBox.hidden = true;
      if (resultBox) resultBox.hidden = false;

      outputs.forEach(function (output) {
        var key = output.getAttribute('data-result');
        if (key in result) output.textContent = result[key];
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
