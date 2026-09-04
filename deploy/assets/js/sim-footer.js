/**
 * Docks the simulator footer to the bottom of the viewport and shows it only
 * while the visitor is scrolling.
 *
 * A simulator is a control panel: sliders, a chart, a table of results, and a
 * row of figures that change as the sliders move. All of it wants to be on
 * screen at once, and on a laptop it very nearly is - which made the footer
 * expensive. It is a disclaimer and a copyright line. It is read once, if ever,
 * and it was permanently occupying the bottom of the document.
 *
 * So it is now out of the flow and off screen, and it comes back on the one
 * signal that reliably means "I am looking around the page rather than using
 * it": scrolling. It leaves again 2.5 seconds after the last scroll event.
 *
 * Why 2.5 seconds. The bar takes about 280ms to arrive and the same to leave,
 * so anything under about 1.5s reads as a flicker rather than an element, and
 * is too short to finish the sentence in it. Past about 4s it stops feeling
 * like a response to scrolling and starts feeling like a bar that is sometimes
 * there, and the screen space it borrowed is not coming back quickly enough to
 * have been worth borrowing. 2.5s is long enough to read the line and short
 * enough that it is gone before the next slider drag. The value lives in
 * sim-system.css as --sim-footer-linger and is read from there, so the timing
 * and the transition it has to outlast are declared next to each other.
 *
 * Four things override the timer, because a bar that vanishes while it is being
 * used is worse than one that never moves:
 *
 * - The bottom of the document. There is nothing below the footer to make room
 *   for, so at the end of the page it simply stays.
 * - Hover. The pointer is on it.
 * - Keyboard focus inside it. Handled in CSS by :focus-within, and also here,
 *   so that arriving by Tab does not start a countdown.
 * - A page that does not scroll. No scroll signal will ever come, so the footer
 *   stays in the flow where it was.
 *
 * Progressive enhancement, deliberately: the `--dockable` class that takes the
 * footer out of the flow is added by this script. Without JavaScript, or before
 * this file runs, the footer is an ordinary block at the end of the document.
 * The docking is only ever applied by the code that can also undo it.
 *
 * The language suggestion bar (header.css) is also fixed to the bottom of the
 * viewport, on the pages where a visitor's browser language does not match the
 * one they are reading. Rather than stacking on top of it or hiding behind it,
 * the footer is lifted by its measured height through --sim-footer-offset.
 */
(function () {
  'use strict';

  var LINGER_FALLBACK = 2500;
  /** How close to the end of the document counts as the end of it. */
  var BOTTOM_SLACK = 24;

  var footer = document.querySelector('.simulator-footer');
  if (!footer) return;

  var spacer = document.querySelector('.simulator-footer-spacer');
  var suggestion = document.querySelector('.language-suggestion');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var linger = LINGER_FALLBACK;
  var timer = null;
  var revealed = false;
  var hovered = false;
  var focused = false;
  var docked = false;

  /**
   * Reads --sim-footer-linger so the delay is not stated twice. A stylesheet
   * that has not loaded yet returns an empty string, which falls back.
   */
  function readLinger() {
    var declared = window.getComputedStyle(document.documentElement)
      .getPropertyValue('--sim-footer-linger')
      .trim();
    var parsed = parseFloat(declared);
    if (!isFinite(parsed) || parsed <= 0) return LINGER_FALLBACK;
    return /ms\s*$/.test(declared) ? parsed : parsed * 1000;
  }

  function atBottom() {
    var scrolled = window.scrollY || document.documentElement.scrollTop || 0;
    var viewport = window.innerHeight || document.documentElement.clientHeight;
    return scrolled + viewport >= document.documentElement.scrollHeight - BOTTOM_SLACK;
  }

  function canScroll() {
    var viewport = window.innerHeight || document.documentElement.clientHeight;
    return document.documentElement.scrollHeight - viewport > BOTTOM_SLACK * 2;
  }

  /**
   * Reserves the bar's height at the end of the document. Without this the last
   * panel on the page would sit underneath a revealed footer, which is the one
   * way an overlay can cost more than the block it replaced. Measured rather
   * than assumed, because the note inside wraps to a different number of lines
   * in each language and at each width.
   */
  function measure() {
    if (!docked) return;
    if (spacer) spacer.style.height = footer.offsetHeight + 'px';
    if (suggestion) {
      // The bar is display:none until it has something to say, in which case it
      // occupies nothing and the offset is zero.
      var height = suggestion.offsetHeight || 0;
      document.documentElement.style.setProperty('--sim-footer-offset', height + 'px');
    }
  }

  function show() {
    if (revealed) return;
    revealed = true;
    footer.classList.add('is-revealed');
  }

  function hide() {
    if (!revealed) return;
    // Never while it is being read or tabbed through, and never at the end of
    // the document, where it is not in front of anything.
    if (hovered || focused || atBottom()) return;
    revealed = false;
    footer.classList.remove('is-revealed');
  }

  function restartTimer() {
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(function () {
      timer = null;
      hide();
    }, linger);
  }

  function onScroll() {
    if (!docked) return;
    show();
    if (atBottom()) {
      // Pinned rather than timed: re-arming the timer here would hide the bar
      // the moment someone stopped reading at the end of the page.
      if (timer !== null) { window.clearTimeout(timer); timer = null; }
      return;
    }
    restartTimer();
  }

  /**
   * Takes the footer out of the flow. Only called on a page that scrolls: on a
   * short page no scroll event will ever arrive, so docking it there would hide
   * the footer permanently.
   */
  function dock() {
    if (docked) return;
    docked = true;
    footer.classList.add('simulator-footer--dockable');
    if (spacer) spacer.hidden = false;
    measure();
  }

  function undock() {
    if (!docked) return;
    docked = false;
    revealed = false;
    footer.classList.remove('simulator-footer--dockable', 'is-revealed');
    if (spacer) { spacer.hidden = true; spacer.style.height = ''; }
    if (timer !== null) { window.clearTimeout(timer); timer = null; }
  }

  /**
   * The simulators grow: running one adds a chart, a table and a result panel
   * to a page that may not have been scrollable when it loaded. So whether the
   * footer is docked is re-decided on resize and whenever the document changes
   * height, rather than once on load.
   */
  function sync() {
    linger = readLinger();
    if (canScroll()) { dock(); measure(); } else { undock(); }
  }

  footer.addEventListener('mouseenter', function () {
    hovered = true;
    show();
    if (timer !== null) { window.clearTimeout(timer); timer = null; }
  });

  footer.addEventListener('mouseleave', function () {
    hovered = false;
    if (docked && !atBottom()) restartTimer();
  });

  footer.addEventListener('focusin', function () {
    focused = true;
    show();
    if (timer !== null) { window.clearTimeout(timer); timer = null; }
  });

  footer.addEventListener('focusout', function (event) {
    if (footer.contains(event.relatedTarget)) return;
    focused = false;
    if (docked && !atBottom()) restartTimer();
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', sync);

  // A visitor who prefers reduced motion still gets the extra screen space -
  // the bar appears and disappears without the slide, which sim-system.css
  // handles by dropping the transition. Nothing to do here beyond keeping the
  // listener, so that the preference changing mid-session is picked up.
  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', sync);
  }

  if (typeof ResizeObserver === 'function') {
    var observer = new ResizeObserver(sync);
    observer.observe(document.documentElement);
    if (suggestion) observer.observe(suggestion);
  }

  sync();
})();
