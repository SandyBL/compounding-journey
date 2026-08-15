// Tells the site that this article was read.
//
// The featured card at the top of the journal index is chosen at build time
// from how often each article has been opened, and this is what produces that
// number. It posts the language and slug of the page it is on to
// /api/article-view, which adds one to a counter (netlify/functions/
// article-view.mjs) and stores nothing else. No identifier is sent, none is
// stored, and nothing is read back into the page.
//
// One count per article per browsing session: the flag below stops a reload, a
// back-navigation or a second visit in the same tab from being counted again,
// so an article cannot climb the ranking on one person refreshing it. A new
// session counts again, which is what makes the number a measure of reading
// rather than of visitors.
(function () {
  const article = document.querySelector('[data-article-slug]');
  if (!article) return;

  const slug = article.getAttribute('data-article-slug');
  const language = document.documentElement.lang;
  if (!slug || !language) return;

  const key = `cj:viewed:${language}:${slug}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // Storage can be unavailable (private windows, storage disabled). The view
    // is still worth counting; it just loses the once-per-session guarantee.
  }

  const body = JSON.stringify({ language, slug });
  const endpoint = '/api/article-view';

  // sendBeacon survives the page being closed a moment later, which a plain
  // fetch does not. keepalive gets the same behaviour where it is missing.
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
    // A counter is not worth a console error on an article page.
  });
})();
