/**
 * The result-aware call to action the five simulators end a run on.
 *
 * Every simulator already finished with the same panel: one sentence chosen at
 * build time, two buttons of equal weight, sitting below the explainer at the
 * very bottom of the page. That panel is still there and still the catch-all.
 * What it cannot do is say anything about the run that just happened - and the
 * run that just happened is the only thing the visitor is thinking about at the
 * moment it ends. Somebody who has just been told their portfolio ran out of
 * money at 78 and somebody who pulled their freedom date forward nine years
 * were being shown identical copy and offered identical links.
 *
 * So the simulators now classify their own outcome into one of a handful of
 * named buckets and hand it here with the numbers that produced it. This file
 * is the machinery for that - it holds no sentence a person reads. The copy per
 * bucket lives in assets/js/sim-cta.<language>.js, which is hand-authored per
 * language for the same reason the behaviour bundles are generated per
 * language: this is written prose, not a string table, and the Spanish reading
 * of a failed retirement plan is not a translation of the English one.
 *
 * Two things happen on a reveal, in this order, and the order is the point:
 *
 *   1. The result is read back in the visitor's own numbers. No ask attached.
 *   2. One primary action, routed by outcome, and one text link. Not two
 *      buttons of equal weight, which is the shape that gets neither pressed.
 *
 * Nothing here asks for an address. An earlier version of this panel collected
 * one and offered a written-up reading of the result in return, which turned a
 * finished interaction into a promise the site had no way to keep: the reply
 * would have been hand-written, one visitor at a time, from numbers sitting in
 * a form dashboard. So the panel asks for nothing and gives the visitor the
 * next step directly instead.
 *
 * Where that step is the contact form, the numbers travel with them: the result
 * is written to sessionStorage on the way out and home.js opens the form with
 * the message already drafted. Same handoff the address was meant to buy, minus
 * the wait and minus the address.
 */
(function () {
  'use strict';

  /**
   * Where each route sends someone.
   *
   * The two Google Forms measure different things - one reads income, expenses,
   * assets and debts, the other reads goals, horizon and tolerance for a
   * drawdown - and each simulator produces evidence for exactly one of them.
   * Which one a bucket asks for is declared in the copy file next to the
   * sentence that asks for it, because the sentence and the destination are one
   * decision.
   *
   * `contact` is the site's own form rather than a third party, and it is the
   * route for the outcomes where a long questionnaire is the wrong next thing:
   * a plan that fails, or a plan that only works if the visitor lives a life
   * they would not choose.
   */
  var FORMS = {
    financialSnapshot: 'https://forms.gle/JBNEUfAsCptJW8k47',
    investmentProfile: 'https://forms.gle/W3pfmhuaSaAUufu76'
  };

  var panel = null;
  var copy = null;
  var elements = {};
  var revealed = false;
  var initialized = false;
  var warnedMissingCopy = false;

  function byId(id) {
    return document.getElementById(id);
  }

  /**
   * The page's language, taken from the document rather than passed in.
   *
   * `<html lang>` is generated per language and verify-output.mjs fails the
   * build when it disagrees with the URL it is served from, so it is the one
   * value on the page that is checked to be right. Reading it here is what lets
   * this file format a number without a placeholder in five templates.
   */
  function language() {
    var declared = (document.documentElement.getAttribute('lang') || '').slice(0, 2).toLowerCase();
    return declared === 'es' || declared === 'pt' ? declared : 'en';
  }

  function integer(value) {
    var number = Number(value);
    if (!isFinite(number)) return '0';
    return Math.round(number).toLocaleString(language());
  }

  /**
   * The symbol each language's simulators label money with. The amounts are
   * illustrative and identical in all three languages, so this is a label and
   * not a conversion - it matches what the simulator pages themselves print,
   * which generate-simulator-pages.mjs resolves from the same three symbols.
   */
  var CURRENCY = { en: '$', es: '€', pt: 'R$' };

  function money(value) {
    var symbol = CURRENCY[language()];
    var number = Number(value);
    if (!isFinite(number)) return symbol + '0';
    // A monthly cash flow can be negative, and a sign after the symbol
    // ("$-300") reads as a typo, so it goes in front of it.
    return (number < 0 ? '-' + symbol : symbol) + integer(Math.abs(number));
  }

  function fillTokens(text, tokens) {
    if (typeof text !== 'string') return '';
    return text.replace(/\{(\w+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(tokens, key) ? String(tokens[key]) : match;
    });
  }

  function setText(element, text) {
    if (!element) return;
    element.textContent = text || '';
    // An empty paragraph still occupies its margins, and a bucket that has no
    // lever line is a bucket where nothing should be in its place.
    if (element.hasAttribute('data-optional')) element.hidden = !text;
  }

  /** The destination of a route, resolved against this page's language. */
  function href(route) {
    var home = panel.getAttribute('data-home') || '/';
    if (FORMS[route]) return FORMS[route];
    // The form, not the section that contains it. #contacto is the top of a
    // section that opens with a biography and a newsletter card, and the form is
    // roughly two screens below that - so somebody sent here to talk about a
    // result they had just been given arrived at an introduction and had to go
    // looking. #contact-form is the anchor the page already uses for its own
    // "open the inquiry form" button, and the prefilled message is waiting in it.
    if (route === 'contact') return home + '?from=simulator#contact-form';
    if (route === 'tools') return home + '#herramientas';
    if (route === 'templates') return home + '#plantillas';
    return home + '#assessment';
  }

  function isExternal(route) {
    return Boolean(FORMS[route]);
  }

  function applyLink(element, label, route) {
    if (!element) return;
    if (!label || !route) {
      element.hidden = true;
      return;
    }
    element.hidden = false;
    element.textContent = label;
    element.setAttribute('href', href(route));
    if (isExternal(route)) {
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');
    } else {
      element.removeAttribute('target');
      element.removeAttribute('rel');
    }
  }

  /**
   * What the routed conversation should already know.
   *
   * Written to sessionStorage rather than into the link, because the numbers in
   * it are a stranger's finances: a URL carrying them is a URL that gets pasted
   * into a chat window, mailed to a friend, or logged by whatever sits in
   * front of the site. sessionStorage is same-origin, per tab, and gone when
   * the tab closes, and the home page reads it to fill in the contact form -
   * see the handoff in assets/js/home.js.
   */
  function rememberContext(bucketKey, headline, detail) {
    try {
      sessionStorage.setItem('cj:simulator:context', JSON.stringify({
        simulator: panel.getAttribute('data-simulator') || '',
        outcome: bucketKey,
        headline: headline,
        detail: detail,
        language: language()
      }));
    } catch (error) {
      // Private windows and disabled storage. The link still works; the contact
      // form on the other end simply opens empty, and the visitor writes their
      // own opening line instead of editing one.
    }
  }

  /* ===================================================================
     REVEAL
     =================================================================== */

  /**
   * Show the panel for one outcome, or update it if it is already showing.
   *
   * Called on every recalculation in the two tools that have no ending - the
   * Freedom Calendar recomputes on each slider move - so it has to be cheap and
   * it has to stop re-announcing itself. The first call reveals and animates;
   * later calls rewrite the text in place and leave the animation and the
   * scroll position alone.
   *
   * A bucket the copy file does not define is a bucket somebody added to a
   * simulator and did not write copy for. Showing the panel with an empty
   * heading would be worse than not showing it, so it is skipped and reported.
   */
  function show(bucketKey, tokens) {
    init();
    if (!panel || !copy) return;

    var buckets = copy.buckets[panel.getAttribute('data-simulator')] || {};
    var bucket = buckets[bucketKey];
    if (!bucket) {
      console.warn('sim-cta: no copy for outcome "' + bucketKey + '".');
      return;
    }

    var values = tokens || {};
    var title = fillTokens(bucket.title, values);
    var body = fillTokens(bucket.body, values);

    setText(elements.eyebrow, fillTokens(bucket.eyebrow, values));
    setText(elements.title, title);
    setText(elements.body, body);
    setText(elements.lever, fillTokens(bucket.lever, values));

    applyLink(elements.primary, bucket.primaryLabel, bucket.primaryRoute);
    applyLink(elements.secondary, bucket.secondaryLabel, bucket.secondaryRoute);

    // Either slot, not just the primary one. "Or talk it through with me" is the
    // secondary link in fourteen of the twenty-two outcomes and the primary in
    // three, so keying this to the primary route meant the numbers travelled for
    // the three and the other fourteen arrived at an empty form - which is the
    // one thing routing an outcome to a person was supposed to avoid.
    if (bucket.primaryRoute === 'contact' || bucket.secondaryRoute === 'contact') {
      rememberContext(bucketKey, title, body);
    }

    if (!revealed) {
      panel.hidden = false;
      revealed = true;
    }
  }

  /**
   * Bring the panel to the visitor's attention on request.
   *
   * Only ever called from a control they pressed - the debrief modal in Monte
   * Carlo FIRE and the victory modal in the Passive Income Engine both offer
   * it - so moving focus here is following them rather than interrupting them.
   * `scrollIntoView` is left to honour the reduced-motion preference through
   * the CSS `scroll-behavior` the page already sets, and focus is taken without
   * a second scroll of its own.
   */
  function focusPanel() {
    if (!panel || panel.hidden) return;
    panel.scrollIntoView({ block: 'center' });
    if (elements.title) {
      elements.title.setAttribute('tabindex', '-1');
      elements.title.focus({ preventScroll: true });
    }
  }

  /* ===================================================================
     WIRING
     =================================================================== */

  /**
   * Wire the panel. Safe to call as often as anything likes; wires once.
   *
   * This used to run behind `document.readyState === 'loading'`, and that guard
   * is the reason the panel never appeared on a single page. Deferred scripts
   * execute after the parse, when the readiness is already "interactive" and
   * never "loading" - so the guard always took its else branch and ran this
   * synchronously, from inside a file loaded *before* the copy bundle it reads.
   * The bundle was never missing. It simply had not run yet, and the check for
   * it reported a permanent failure over a race it had created itself.
   *
   * So the readiness of the document is no longer what this waits on, because
   * it was never the thing that mattered. Two properties replace it:
   *
   *   - Calling twice is free, so both the bottom of this file and the first
   *     result a simulator produces can call it, and whichever arrives first
   *     does the work.
   *   - An absent copy bundle does not latch. "Not loaded" and "will never
   *     load" are indistinguishable from here, so this assumes the recoverable
   *     one and tries again on the next call - by which point a simulator has a
   *     result to show, and every deferred script on the page has run.
   *
   * The panel is hidden until a reveal, so wiring it late is not visible: what
   * would be visible is wiring it never.
   */
  function init() {
    if (initialized) return;

    panel = byId('sim-cta-result');
    if (!panel) return;

    copy = window.SIM_CTA_COPY;
    if (!copy || !copy.ui || !copy.buckets) {
      // Warned once rather than on every attempt, because this is now on a path
      // that retries. If it is still showing by the time a simulator has a
      // result, the bundle really is missing - a 404, or a file that threw on
      // its way to assigning the global - and the panel stays hidden while the
      // static one at the foot of the page does what it did before.
      if (!warnedMissingCopy) {
        console.warn('sim-cta: the copy bundle for this language has not loaded.');
        warnedMissingCopy = true;
      }
      // Cleared rather than left as-is: a bundle that loaded but is malformed
      // would otherwise leave a truthy `copy` that show() waves through.
      panel = null;
      copy = null;
      return;
    }

    initialized = true;

    elements = {
      eyebrow: byId('sim-cta-eyebrow'),
      title: byId('sim-cta-title'),
      body: byId('sim-cta-body'),
      lever: byId('sim-cta-lever'),
      primary: byId('sim-cta-primary'),
      secondary: byId('sim-cta-secondary')
    };

    // The one line of standing text in the panel, from the copy bundle rather
    // than a translated placeholder in each of the five templates. The panel is
    // hidden until a reveal, so nobody sees the unlabelled state.
    setText(byId('sim-cta-disclaimer'), copy.ui.disclaimer);
  }

  window.SimCta = {
    show: show,
    focus: focusPanel,
    money: money,
    integer: integer,
    /** Whether a run has already produced an outcome on this page. */
    revealed: function () {
      return revealed;
    }
  };

  // The first of the two chances this gets. The page's own scripts are deferred,
  // so the DOM is parsed by the time this line runs and the copy bundle loaded
  // just above it; when both hold, the panel is wired here and now. When they
  // do not, show() wires it later. Neither route is load-bearing on its own,
  // which is the point - the previous version had exactly one and it was wrong.
  init();
})();
