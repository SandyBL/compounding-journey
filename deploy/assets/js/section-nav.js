/**
 * The client half of the site nav: it turns the hamburger in the header on, and
 * it opens the Recursos menu inside the header's nav pill.
 *
 * The pill scripts/section-nav.mjs renders needs 1180px - seven items in
 * Spanish and Portuguese come to about 547px even with the type reduced - and a
 * phone has 390. So below that width the pill is display:none and the button
 * this file reveals is the whole of the site navigation: the same eight links,
 * as a panel under the header. Above it the button is display:none and the pill
 * is what is shown. One shape at each width, the same two widths the home page
 * swaps its own pill and drawer at.
 *
 * The button ships with `hidden` and this file removes it, which is the whole
 * of the progressive enhancement contract here: with no script the header still
 * carries the brand, the return link and the flags, no dead control appears,
 * and the footer row of the same eight links is the route on from the page - on
 * the simulators, whose footer is a docked call to action, the return link is.
 * The pill itself needs nothing from this file - above 1180px the Recursos menu
 * opens on :hover and :focus-within in CSS - so a scriptless desktop reader
 * gets a complete, working nav, dropdown included.
 *
 * There used to be a full-width strip of tabs below the header, and this file
 * used to scroll its current tab into the middle. The strip is gone: it showed
 * three of eight items on a phone with no scrollbar to say so, and above 768px
 * it was a second navigation with the same name as the pill on the home page.
 *
 * The two labels come off the button as data attributes rather than living
 * here, because this one file is served to all three languages and there is no
 * way for it to know which. assets/js/home.js reads its equivalents out of a
 * translation table it already loads; this script has no such table and does
 * not need one for two strings.
 *
 * It cannot be inline: _headers sets script-src 'self' with no 'unsafe-inline',
 * so an inline block would be blocked by the CSP on every page it appears on.
 */
(() => {
  const menu = document.querySelector('.site-header-menu');
  const toggle = menu?.querySelector('.site-menu-toggle');
  const panel = menu?.querySelector('.site-menu-panel');

  // The simulators hold the pill back to 1280px, because the middle of their
  // header also carries up to four of the tool's own controls - so that is
  // where their button stands down, and where the resize below has to close an
  // open panel. header.css has the matching pair of rules.
  const desktopNavBreakpoint = document.querySelector('.simulator-header-shell') ? 1280 : 1180;

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

    // The line the whole arrangement depends on. Nothing is hidden in exchange
    // for it, so there is no order in which the page is left without a nav.
    toggle.hidden = false;

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

    // Widening the window past the breakpoint shows the pill and hides the
    // button. The panel's own rules stop applying on their own, but
    // aria-expanded would be left claiming a menu is open on a control nobody
    // can see, and narrowing back would then reopen it unasked.
    window.matchMedia(`(min-width: ${desktopNavBreakpoint}px)`).addEventListener('change', (event) => {
      if (event.matches) setOpen(false);
    });
  }

  // The Recursos menu in the pill.
  //
  // CSS already opens it on :hover and :focus-within, and that is what keeps it
  // working with no script at all. What this adds is the two things those
  // selectors cannot do: a click that latches it open, and a way to dismiss it
  // that is not "move the pointer away" - which is no way at all on a touch
  // screen, where a tap on the label is a hover that never ends.
  //
  // Same handlers, same data-open attribute and same order as the home page's
  // copy in its own script, because it is the same component. Both write
  // aria-expanded on the button so the state is announced, not just painted.
  const dropdown = document.querySelector('[data-resources-dropdown]');
  const dropdownToggle = dropdown?.querySelector('.desktop-resources-toggle');

  if (!dropdown || !dropdownToggle) return;

  const setDropdownOpen = (open) => {
    dropdown.toggleAttribute('data-open', open);
    dropdownToggle.setAttribute('aria-expanded', String(open));
  };

  dropdownToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    setDropdownOpen(!dropdown.hasAttribute('data-open'));
  });

  dropdown.addEventListener('pointerenter', () => setDropdownOpen(true));
  dropdown.addEventListener('pointerleave', () => setDropdownOpen(false));
  dropdown.addEventListener('focusin', () => setDropdownOpen(true));
  dropdown.addEventListener('focusout', (event) => {
    if (!dropdown.contains(event.relatedTarget)) setDropdownOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (!dropdown.contains(event.target)) setDropdownOpen(false);
  });

  // Dismissing a menu must return focus to the control that opened it, or the
  // reader is dropped at the top of the page.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !dropdown.hasAttribute('data-open')) return;
    const inside = dropdown.contains(document.activeElement);
    setDropdownOpen(false);
    if (inside) dropdownToggle.focus();
  });
})();
