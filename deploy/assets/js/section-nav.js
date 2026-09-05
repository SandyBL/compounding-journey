/**
 * Scrolls the current section's tab into view.
 *
 * The section nav is seven items wide and the strip that holds it scrolls
 * horizontally, so on a phone it shows the first three or four. A reader on the
 * sessions page therefore saw Diario ... Plantillas and never saw the one thing
 * the nav was changed to tell them: which page they are on. The highlight was
 * there, off the right-hand edge.
 *
 * So the tab marked aria-current - either value of it: "page" on the section's
 * own landing page, "true" on anything under it - is scrolled to the middle of
 * the strip. This
 * is the only script the generated section pages load for their chrome, and it
 * is progressive enhancement in the strict sense: without it the nav is a
 * complete, working, scrollable list of links, and the state is still announced
 * by aria-current to anybody using a screen reader, who is not reading the
 * strip by eye anyway.
 *
 * `block: 'nearest'` matters more than it looks. Without it the browser is free
 * to scroll the page vertically as well as the strip horizontally, which on a
 * page loaded at the top means the header scrolls itself out of view - the
 * document jumping on load for no reason a reader can see.
 *
 * It cannot be inline: _headers sets script-src 'self' with no 'unsafe-inline',
 * so an inline block would be blocked by the CSP on every page it appears on.
 */
(() => {
  const current = document.querySelector('.site-section-tabs a[aria-current]');
  if (!current) return;

  const strip = current.closest('.site-section-tabs');
  // Nothing overflows, so nothing is hidden and scrolling would only be a
  // chance to get the vertical position wrong.
  if (!strip || strip.scrollWidth <= strip.clientWidth) return;

  current.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
})();
