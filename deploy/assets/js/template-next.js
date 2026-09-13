// Reveals the "what next" panel on a template page, once the download has
// actually been asked for.
//
// The panel is rendered into the page at build time by scripts/
// generate-template-pages.mjs and starts hidden. It is not a gate: the
// download link is an ordinary link to an ordinary file, the browser has
// already started fetching it by the time anything here runs, and a reader
// with no JavaScript gets the file exactly as before - they just do not get
// the panel. Nothing here can prevent, delay or condition a download.
//
// Two counters go to /api/template-download: `download` when the link is
// used, `next` when one of the panel's two links is followed. The second
// divided by the first is the only way to tell whether the panel is worth
// keeping. Both carry the language and the template's stable id and nothing
// else - no identifier is sent, none is stored, and nothing is read back.
//
// One count per template per event per browsing session, for the same reason
// as assets/js/article-view.js: a reader who downloads the same workbook
// three times in one sitting is one reader, and a counter that says otherwise
// is not measuring anything.
(function () {
  const panel = document.getElementById('template-next');
  const trigger = document.querySelector('[data-template-download]');
  if (!panel || !trigger) return;

  const template = panel.getAttribute('data-template');
  const language = document.documentElement.lang;
  if (!template || !language) return;

  const endpoint = '/api/template-download';

  function count(event) {
    const key = `cj:template:${language}:${template}:${event}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Storage can be unavailable (private windows, storage disabled). The
      // event is still worth counting; it just loses the once-per-session
      // guarantee.
    }

    const body = JSON.stringify({ language, template, event });

    // sendBeacon survives the page being replaced a moment later, which a
    // plain fetch does not - and following the panel's own link does exactly
    // that. keepalive gets the same behaviour where sendBeacon is missing.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      return;
    }

    fetch(endpoint, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true
    }).catch(() => {
      // A counter is not worth a console error on a template page.
    });
  }

  function reveal() {
    if (!panel.hidden) return;
    panel.hidden = false;

    // A live region inside a hidden element announces nothing, so the status
    // node sits outside the panel and is filled from the panel's own eyebrow
    // once that text is on screen. Taking the sentence from the DOM rather
    // than from here keeps every translated string in the page where a
    // translator can see it.
    const status = document.getElementById('template-next-status');
    const eyebrow = panel.querySelector('.template-next-eyebrow');
    if (status && eyebrow) status.textContent = eyebrow.textContent;
  }

  trigger.addEventListener('click', function () {
    count('download');
    reveal();
  });

  // Delegated rather than bound per link: the panel's two anchors are the only
  // things inside it, and a click on either is the take-up this measures.
  panel.addEventListener('click', function (clicked) {
    if (clicked.target.closest('a')) count('next');
  });
})();
