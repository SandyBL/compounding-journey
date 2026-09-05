/**
 * The one button on the Freedom Calendar and the Market Time Machine that sends
 * anything anywhere.
 *
 * Both tools are pure arithmetic in the browser. Neither ranks a result, so
 * neither has a leaderboard, a display name, or any reason to have ever spoken
 * to the server - which also meant that everything anybody ever modelled with
 * them was discarded the moment the tab closed. That is a genuine loss: what
 * people assume about returns, which spending they treat as negotiable, which
 * decade of market history they choose to live through, are questions with no
 * published answer anywhere, and these two tools are asked them thousands of
 * times.
 *
 * So each of them now carries one button. This file is what it does.
 *
 * WHAT IT DELIBERATELY IS NOT
 *
 * It is not a beacon. Nothing here runs on load, on unload, on a timer, or on
 * any event except a click on the button itself, and the button is in the page
 * with a paragraph above it saying what pressing it stores. A tool that quietly
 * posted the same fields on every slider movement would collect far more data
 * and would be a different thing, described by a different word.
 *
 * It sends no name. The endpoint refuses one for these two simulators, and this
 * file never had one to send.
 *
 * WHY IT CARRIES NO PROSE
 *
 * The three sentences it puts on screen - sending, thank you, that failed - are
 * read off `data-` attributes on the box in the page, the same way
 * sim-leaderboard.js reads nothing translatable. One shared file that reads its
 * strings from the markup is better than six files that hard-code them, and the
 * strings themselves live in the simulator generator's shared table, so both
 * tools describe the offer with the same words.
 *
 * WHERE THE PAYLOAD COMES FROM
 *
 * `window.describeContributedRun()`, defined by each simulator's behaviour
 * bundle. It returns `{ simulator, score, tiebreak, details }` for the run as it
 * currently stands, or null if there is nothing worth sending yet - a Market
 * Time Machine that has not been scrubbed forward a single year has no result,
 * and a row of zeroes would land in an average as if somebody had meant it.
 */
(function () {
  'use strict';

  var ENDPOINT = '/api/simulator-leaderboard';

  function box() {
    return document.getElementById('contributeBox');
  }

  /**
   * Moves the block to one of four states and says why in the live region.
   *
   * `data-state` is what the stylesheet reads; the status paragraph is what a
   * screen reader announces, and it is `aria-live="polite"` in the markup so
   * the announcement follows the click rather than interrupting it.
   */
  function setState(state, message) {
    var element = box();
    if (!element) return;

    element.setAttribute('data-state', state);

    var button = document.getElementById('contributeButton');
    if (button) button.disabled = state === 'sending' || state === 'done';

    var status = document.getElementById('contributeStatus');
    if (status) status.textContent = message || '';
  }

  /**
   * Shows or hides the whole block.
   *
   * It ships as `data-state="empty"`, which the stylesheet hides, because an
   * offer to contribute a run is meaningless before there is a run: both tools
   * render their default numbers on load, and a button offering to publish the
   * tool's own defaults would fill the data set with the tool's own defaults.
   * Each simulator calls this from its recalculation with the one condition
   * that means "a person has told this page something".
   *
   * A run already sent, or in flight, is left alone. Moving a slider after
   * contributing should not re-arm the button, and should certainly not hide
   * the thank-you.
   */
  window.contributeReady = function (ready) {
    var element = box();
    if (!element) return;
    var state = element.getAttribute('data-state');
    if (state === 'sending' || state === 'done') return;
    if (state === 'failed' && ready) return;
    element.setAttribute('data-state', ready ? 'idle' : 'empty');
  };

  /** A sentence the page rendered, or an empty string if it did not. */
  function copy(name) {
    var element = box();
    return (element && element.getAttribute('data-' + name)) || '';
  }

  /**
   * Sends the run the page describes, once.
   *
   * Named on `window` because the button reaches it through `data-onclick`,
   * which sim-actions.js resolves against the global scope and which cannot
   * express anything but a call to a plain function.
   */
  window.contributeRun = function () {
    var element = box();
    if (!element) return;
    // Already sent, or already sending. The endpoint would happily take a
    // second copy of the same run, and a data set where one enthusiastic
    // visitor appears eleven times is worse than one where they appear once.
    if (element.getAttribute('data-state') === 'done') return;
    if (element.getAttribute('data-state') === 'sending') return;
    // Not reachable through the button, which is hidden with the block, but a
    // stray call should not post the tool's defaults.
    if (element.getAttribute('data-state') === 'empty') return;

    var payload = null;
    if (typeof window.describeContributedRun === 'function') {
      try {
        payload = window.describeContributedRun();
      } catch (error) {
        // A bug in the describing function is not something to report to the
        // visitor as a network failure, and it is not a reason to send a
        // half-built row either.
        console.error('sim-contribute: the page could not describe its run.', error);
        payload = null;
      }
    }

    if (!payload || typeof payload.simulator !== 'string') {
      setState('failed', copy('failed'));
      return;
    }

    setState('sending', copy('sending'));

    // No credentials, no cookies, no cache. The request carries the run and
    // nothing that could identify the browser that sent it beyond what any
    // HTTP request carries.
    fetch(ENDPOINT, {
      method: 'POST',
      credentials: 'omit',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        simulator: payload.simulator,
        board: 'DATA',
        score: payload.score,
        tiebreak: payload.tiebreak,
        details: payload.details || {},
        language: (document.documentElement.lang || 'en').split('-')[0]
      })
    })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (body) {
        if (!body || body.recorded !== true) throw new Error('not recorded');
        setState('done', copy('thanks'));
      })
      .catch(function (error) {
        // The run is not lost, only unsent, and the copy says so. The button
        // is re-enabled by setState because 'failed' is not a terminal state:
        // the commonest cause of getting here is a connection that comes back.
        console.warn('sim-contribute: the run could not be sent.', error);
        setState('failed', copy('failed'));
      });
  };
})();
