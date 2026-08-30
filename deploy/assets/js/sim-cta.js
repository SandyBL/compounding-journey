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
 * Three things happen on a reveal, in this order, and the order is the point:
 *
 *   1. The result is read back in the visitor's own numbers. No ask attached.
 *   2. One field - an email address - offers the written-up version. This is
 *      the rung the site did not have: before it, the only route from a result
 *      to a conversation was a long form on another page in another tab, which
 *      is three commitments presented as one.
 *   3. One primary action, routed by outcome, and one text link. Not two
 *      buttons of equal weight, which is the shape that gets neither pressed.
 *
 * The result itself is never gated. It is already on the screen and it is what
 * the visitor came for; charging for the interpretation after the fact would
 * cost more trust than the address is worth.
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

  // Netlify Forms is reached by posting to a path the site actually serves; the
  // panel is on fifteen of them, so the page's own URL is the one path that is
  // always right. Same-origin, which is what `form-action 'self'` in _headers
  // allows, and what `connect-src 'self'` allows this to fetch.
  var SUBMIT_TIMEOUT_MS = 10000;

  var panel = null;
  var copy = null;
  var elements = {};
  var current = null;
  var revealed = false;

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
    if (route === 'contact') return home + '?from=simulator#contacto';
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
      // Private windows and disabled storage. The link still works; the form on
      // the other end simply opens empty, which is what it did before.
    }
  }

  function setHidden(name, value) {
    var field = elements.form && elements.form.querySelector('[name="' + name + '"]');
    if (field) field.value = value == null ? '' : String(value);
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
   * later calls rewrite the text in place and leave the animation, the scroll
   * position and any submitted state alone.
   *
   * A bucket the copy file does not define is a bucket somebody added to a
   * simulator and did not write copy for. Showing the panel with an empty
   * heading would be worse than not showing it, so it is skipped and reported.
   */
  function show(bucketKey, tokens) {
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

    setHidden('outcome', bucketKey);
    setHidden('headline', title);
    setHidden('detail', body);
    setHidden('routed_to', bucket.primaryRoute || '');

    if (bucket.primaryRoute === 'contact') rememberContext(bucketKey, title, body);

    current = { bucket: bucketKey, title: title, body: body };

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
     THE ONE FIELD
     =================================================================== */

  function status(message, isError) {
    if (!elements.status) return;
    elements.status.textContent = message || '';
    elements.status.className = 'sim-result-cta__status' + (isError ? ' sim-result-cta__status--error' : '');
  }

  /**
   * Posted rather than navigated, so the result the visitor is reading stays on
   * the screen behind the confirmation. Netlify Forms requires the urlencoded
   * content type and a `form-name` field, both of which the markup carries.
   */
  function submit(event) {
    event.preventDefault();
    if (!elements.form || !elements.email) return;

    var address = elements.email.value.trim();
    // Deliberately the loosest possible check. The field is type="email" and
    // the server is the only thing that can really tell; rejecting an unusual
    // but valid address here would lose a lead to a regex.
    if (address.indexOf('@') < 1 || address.lastIndexOf('.') < address.indexOf('@')) {
      status(copy.ui.formErrorInvalid, true);
      elements.email.focus();
      return;
    }

    setHidden('subject', copy.ui.formSubject + ' — ' + (current ? current.title : ''));

    elements.submit.disabled = true;
    var restore = elements.submit.textContent;
    elements.submit.textContent = copy.ui.formSubmitting;
    status('');

    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, SUBMIT_TIMEOUT_MS);

    fetch(window.location.pathname, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(elements.form)).toString(),
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        succeed();
      })
      .catch(function () {
        elements.submit.disabled = false;
        elements.submit.textContent = restore;
        status(copy.ui.formErrorFailed, true);
      })
      .then(function () {
        clearTimeout(timer);
      });
  }

  /**
   * The field is replaced by the confirmation rather than cleared, so there is
   * nothing left to submit twice, and the routed action below it stays exactly
   * where it was - the address was the small step, and the next one is still on
   * offer.
   */
  function succeed() {
    if (!elements.form) return;
    var confirmation = document.createElement('div');

    var heading = document.createElement('p');
    heading.className = 'sim-result-cta__form-heading';
    heading.textContent = copy.ui.formSuccessTitle;

    var note = document.createElement('p');
    note.className = 'sim-result-cta__note';
    note.textContent = copy.ui.formSuccessBody;

    confirmation.appendChild(heading);
    confirmation.appendChild(note);

    elements.form.replaceChildren(confirmation);
    elements.form.setAttribute('role', 'status');
  }

  /* ===================================================================
     WIRING
     =================================================================== */

  function init() {
    panel = byId('sim-cta-result');
    if (!panel) return;

    copy = window.SIM_CTA_COPY;
    if (!copy || !copy.ui || !copy.buckets) {
      // The copy file failed to load. The panel has no sentences to show, so it
      // stays hidden and the static one at the foot of the page is what the
      // visitor gets - which is the behaviour these pages had before.
      console.warn('sim-cta: the copy bundle for this language is missing.');
      panel = null;
      return;
    }

    elements = {
      eyebrow: byId('sim-cta-eyebrow'),
      title: byId('sim-cta-title'),
      body: byId('sim-cta-body'),
      lever: byId('sim-cta-lever'),
      form: byId('sim-cta-form'),
      email: byId('sim-cta-email'),
      submit: byId('sim-cta-submit'),
      status: byId('sim-cta-status'),
      primary: byId('sim-cta-primary'),
      secondary: byId('sim-cta-secondary')
    };

    // The form's own labels come from the copy bundle rather than from a
    // translated placeholder in each of the five templates. It is hidden until
    // a reveal, so there is no flash: nobody sees the unlabelled state. What
    // has to be in the markup at build time is the form element and its field
    // names, which is all Netlify's form detection reads.
    setText(byId('sim-cta-form-heading'), copy.ui.formHeading);
    setText(byId('sim-cta-note'), copy.ui.formNote);
    setText(byId('sim-cta-disclaimer'), copy.ui.disclaimer);
    if (elements.email) {
      elements.email.setAttribute('placeholder', copy.ui.formPlaceholder);
      elements.email.setAttribute('aria-label', copy.ui.formLabel);
    }
    if (elements.submit) elements.submit.textContent = copy.ui.formSubmit;

    setHidden('language', language());

    if (elements.form) elements.form.addEventListener('submit', submit);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
