/**
 * The client half of the shared simulator leaderboard.
 *
 * Three of the five simulators keep a board: the Simulator Hub ranks financial
 * literacy, the Passive Income Engine ranks time to crossover, and Monte Carlo
 * FIRE ranks a flight score per scenario preset. None of them used to leave the
 * browser. Two wrote to localStorage and one to a plain array, all three were
 * seeded with invented names so a first-time visitor would see a ranking, and
 * so a score "submitted to the leaderboard" was submitted to a table nobody
 * else could read - the pages said "compare your result with other investors"
 * and there were no other investors in it.
 *
 * They now share one board, stored by /api/simulator-leaderboard and visible to
 * every visitor in every language. This file is what the three behaviour
 * bundles call to reach it, and it exists as one shared file rather than three
 * copies because none of it is translated: it moves numbers and returns data,
 * and every string a person reads stays in the page that renders it.
 *
 * Loaded on the three scoring simulators only. The Freedom Calendar and the
 * Market Time Machine have no board and no score to rank, so they do not link
 * it - see the `leaderboard` flag in scripts/generate-simulator-pages.mjs.
 */
(function () {
  'use strict';

  var ENDPOINT = '/api/simulator-leaderboard';

  // A board is worth waiting a moment for and not worth hanging a results
  // screen on. Every caller has a visible failure path, so a slow endpoint
  // becomes "the board could not be loaded" rather than a spinner that stays.
  var TIMEOUT_MS = 8000;

  /**
   * The ids this browser has submitted, per simulator, so a page can mark which
   * row is the visitor's own.
   *
   * In sessionStorage rather than in a variable, because Monte Carlo FIRE
   * re-renders its table on every filter change and the Passive Income Engine
   * opens its board in a modal that is built fresh each time; a variable would
   * lose the mark on the first of those. It is per tab and disposable - the
   * board itself is the record, and this is only which line of it to highlight.
   */
  function storageKey(simulator) {
    return 'cj:leaderboard:mine:' + simulator;
  }

  function mine(simulator) {
    try {
      var raw = sessionStorage.getItem(storageKey(simulator));
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (error) {
      // Private windows and disabled storage both land here. The board still
      // works; it just cannot point out which entry belongs to this visitor.
      return [];
    }
  }

  function remember(simulator, id) {
    if (!id) return;
    try {
      var ids = mine(simulator);
      if (ids.indexOf(String(id)) === -1) ids.push(String(id));
      // Trimmed from the front: somebody who plays twenty times cares about the
      // recent ones, and an unbounded list in session storage is a leak.
      sessionStorage.setItem(storageKey(simulator), JSON.stringify(ids.slice(-20)));
    } catch (error) {
      // As above - losing the highlight is not worth failing a submission over.
    }
  }

  /**
   * Escapes a value for insertion into innerHTML.
   *
   * This is the reason it is here rather than left to each page. Before the
   * board was shared, a name in it was typed by the person reading it, so
   * building a row with `${entry.name}` risked nothing but your own markup.
   * Names now arrive from other people. The endpoint already strips the
   * characters that could start a tag before it stores anything, and every page
   * escapes on the way into the DOM as well, because one layer that has to be
   * remembered in nine places is not a layer.
   */
  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function request(url, options) {
    var settings = options || {};
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = controller
      ? setTimeout(function () {
          controller.abort();
        }, TIMEOUT_MS)
      : null;

    if (controller) settings.signal = controller.signal;

    return fetch(url, settings)
      .then(function (response) {
        return response
          .json()
          .catch(function () {
            return null;
          })
          .then(function (body) {
            if (!response.ok) {
              var message = body && body.error ? body.error : 'HTTP ' + response.status;
              throw new Error(message);
            }
            return body || {};
          });
      })
      .finally(function () {
        if (timer) clearTimeout(timer);
      });
  }

  /**
   * The top of one board, best first.
   *
   * Resolves to an array. It rejects rather than resolving to `[]` when the
   * request fails, because the two mean different things on screen: an empty
   * board says "be the first", and a failed one has to say so instead of
   * claiming nobody has played.
   */
  function load(simulator, board) {
    var query = ENDPOINT + '?simulator=' + encodeURIComponent(simulator) + '&board=' + encodeURIComponent(board || 'ALL');
    return request(query, { method: 'GET', headers: { Accept: 'application/json' } }).then(function (body) {
      return Array.isArray(body.entries) ? body.entries : [];
    });
  }

  /**
   * Adds a score to a board and resolves to the board as it now stands.
   *
   * The endpoint answers a POST with the updated ranking, so a page submits and
   * redraws from one round trip - and redraws a list that certainly contains
   * the score just added, which a follow-up GET could miss if somebody else
   * submitted in between.
   *
   * `language` is filled in from the document so no caller has to remember it;
   * it is recorded with the row and is not what the board is keyed on. The board
   * is deliberately global, so a run submitted from the Portuguese page ranks
   * against one submitted from the English page.
   */
  function submit(entry) {
    var payload = {
      simulator: entry.simulator,
      board: entry.board || 'ALL',
      name: entry.name,
      score: entry.score,
      tiebreak: entry.tiebreak,
      details: entry.details || {},
      language: (document.documentElement.lang || 'en').split('-')[0]
    };

    return request(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (body) {
      remember(payload.simulator, body.submittedId);
      return {
        submittedId: body.submittedId || null,
        entries: Array.isArray(body.entries) ? body.entries : []
      };
    });
  }

  window.SimLeaderboard = {
    load: load,
    submit: submit,
    mine: mine,
    escapeHtml: escapeHtml,
    /** True when `id` is a row this browser submitted in this session. */
    isMine: function (simulator, id) {
      return mine(simulator).indexOf(String(id)) !== -1;
    }
  };
})();
