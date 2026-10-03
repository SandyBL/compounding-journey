    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // BUGFIX: every dynamic list (earners, children, real estate, liquid
    // investments, goals) rebuilds its ENTIRE container.innerHTML from scratch
    // on every single render pass — and a render pass happens on every
    // keystroke, since oninput="updateX(...)" calls handleDataUpdate(), which
    // calls updateUI(), which re-runs renderXList(). Rebuilding the DOM
    // destroys the actual <input> element the user is typing into and creates
    // a brand new one in its place — so the browser loses focus, and the very
    // next keystroke goes nowhere until the user manually clicks back into the
    // field. That's the "type one letter and it kicks you out" bug.
    //
    // The fix: every input/select inside these cards carries a stable
    // data-focus-key (e.g. "earner-123-name"). Call saveFocusState() right
    // before tearing down the container, do the rebuild exactly as before,
    // then call restoreFocusState() with its result — it re-finds the new
    // element with the same key, refocuses it, and restores the cursor
    // position (and, for text/number inputs, exactly what the user had typed,
    // in case the freshly-rendered value lags one keystroke behind state).
    function saveFocusState() {
      const active = document.activeElement;
      if (!active || !active.dataset || !active.dataset.focusKey) return null;
      const saved = { key: active.dataset.focusKey, value: active.value };
      if (typeof active.selectionStart === 'number') {
        saved.selStart = active.selectionStart;
        saved.selEnd = active.selectionEnd;
      }
      return saved;
    }

    function restoreFocusState(saved) {
      if (!saved) return;
      const el = document.querySelector(`[data-focus-key="${saved.key}"]`);
      if (!el) return;
      // Only restore the in-progress value for plain text/number fields — a
      // checkbox or select's "value" isn't something you're mid-keystroke on,
      // and forcing it here could fight with a change the user just made.
      if ((el.tagName === 'INPUT') && (el.type === 'text' || el.type === 'number') && el.value !== saved.value) {
        el.value = saved.value;
      }
      el.focus();
      if (typeof saved.selStart === 'number' && typeof el.setSelectionRange === 'function') {
        try { el.setSelectionRange(saved.selStart, saved.selEnd); } catch (e) { /* not all input types support this */ }
      }
    }

