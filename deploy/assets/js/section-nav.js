/**
 * The client half of the site nav: it turns the hamburger in the header on, and
 * centres the current tab in the strip when the strip is what is shown.
 *
 * The strip is eight items wide and about 620px of them, so on a 390px viewport
 * it showed three and gave no sign that five more were off the right-hand edge:
 * a touch device draws no scrollbar, and the eighth item was not clipped
 * mid-word in a way that would have hinted at a ninth. Centring the current tab
 * - which is all this file used to do - told a reader on the sessions page
 * where they were and still left most of the site unreachable from that page.
 *
 * So below 768px the button scripts/section-nav.mjs renders in the header is
 * revealed, the strip stands down, and the same eight links open as a panel
 * under the header. Above that width nothing here shows: the strip fits.
 *
 * Revealing the button and standing the strip down are the same two lines,
 * which is the point: with no script, nothing is hidden and nothing is
 * replaced, and the page keeps a complete, working, scrollable strip of links
 * whose state is still announced by aria-current. This is progressive
 * enhancement in the strict sense - the menu is the improvement, not the
 * mechanism.
 *
 * The two labels come off the button as data attributes rather than living
 * here, because this one file is served to all three languages and there is no
 * way for it to know which. assets/js/home.js reads its equivalents out of a
 * translation table it already loads; this script has no such table and does
 * not need one for two strings.
 *
 * `block: 'nearest'` on the scroll matters more than it looks. Without it the
 * browser is free to scroll the page vertically as well as the strip
 * horizontally, which on a page loaded at the top means the header scrolls
 * itself out of view - the document jumping on load for no reason a reader can
 * see.
 *
 * It cannot be inline: _headers sets script-src 'self' with no 'unsafe-inline',
 * so an inline block would be blocked by the CSP on every page it appears on.
 */
(() => {
  const menu = document.querySelector('.site-header-menu');
  const toggle = menu?.querySelector('.site-menu-toggle');
  const panel = menu?.querySelector('.site-menu-panel');

  if (menu && toggle && panel) {
    const labelOpen = toggle.getAttribute('data-label-open') || '';
    const labelClose = toggle.getAttribute('data-label-close') || labelOpen;

    const setOpen = (open) => {
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      // The name of a disclosure describes what activating it will do, so it
      // has to change with the state: "Open the navigation menu" on a button
      // that is about to close one is a lie a screen reader would repeat.
      toggle.setAttribute('aria-label', open ? labelClose : labelOpen);
    };

    // The two lines the whole arrangement depends on, together, so the strip is
    // never taken away for a button that cannot open a panel.
    toggle.hidden = false;
    document.documentElement.setAttribute('data-site-menu', '');

    toggle.addEventListener('click', () => setOpen(panel.hidden));

    // A tap anywhere else closes it. Ordinary links inside the panel are not
    // special-cased: activating one navigates, which ends this document.
    document.addEventListener('click', (event) => {
      if (!panel.hidden && !menu.contains(event.target)) setOpen(false);
    });

    // Escape has to hand focus back to the button, or a keyboard reader who
    // dismisses the menu is left with no focused element and continues from the
    // top of the document.
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || panel.hidden) return;
      setOpen(false);
      toggle.focus();
    });

    // Widening the window past 768px shows the strip again and hides the
    // button. The panel's own rules stop applying on their own, but
    // aria-expanded would be left claiming a menu is open on a control nobody
    // can see, and narrowing back would then reopen it unasked.
    window.matchMedia('(min-width: 768px)').addEventListener('change', (event) => {
      if (event.matches) setOpen(false);
    });
  }

  const tabs = document.querySelector('.site-section-tabs');
  const current = tabs?.querySelector('a[aria-current]');
  if (!current) return;

  // Nothing overflows - either because the strip fits or because the menu has
  // taken its place and it is not being painted at all - so scrolling would
  // only be a chance to get the vertical position wrong.
  if (tabs.scrollWidth <= tabs.clientWidth) return;

  current.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
})();
