// Opens the glossary term a URL asks for.
//
// The glossary is one page per language and each term is a `<details>` whose id
// is the term's slug, which is the last segment of the URL that term used to
// have. So `/en/glossary/#compound-interest` is where the retired
// `/en/glossary/compound-interest/` now points, where the auto-linker sends
// every mention of the phrase in every article, and where a term's own
// cross-references go.
//
// A browser navigating to a fragment scrolls to the element and stops there. If
// that element is a closed `<details>`, the reader arrives at a heading and has
// to work out that the definition they followed a link for is one more click
// away. That is the whole of what this file fixes.
//
// Everything else about the accordion is the browser's: `<details name>` is
// what makes only one term open at a time, and the summary, the arrow and the
// keyboard handling are native. Without this script the page still works and
// every term still opens - a reader who follows a deep link just lands on a
// closed one. That is the level of degradation this is allowed to have.
(function () {
  var SELECTOR = 'details.glossary-item';

  // Read from the DOM rather than trusted: `location.hash` is attacker-supplied
  // and is about to go into a selector. Anything that is not the shape of a
  // slug this site generates is not looked up at all.
  var SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  function termFromHash() {
    var slug;
    // `#%` is a hash a reader can type and not a sequence decodeURIComponent
    // will accept. Letting it throw here would take the hashchange and toggle
    // listeners below down with it, so a malformed fragment costs the page its
    // behaviour for the rest of the visit.
    try {
      slug = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    } catch (error) {
      return null;
    }
    if (!slug || !SLUG.test(slug)) return null;
    var element = document.getElementById(slug);
    return element && element.matches(SELECTOR) ? element : null;
  }

  function reveal(term, scroll) {
    // Setting `open` on one member of a `name` group is what closes the rest,
    // so nothing here has to close anything.
    var wasOpen = term.open;
    term.open = true;

    // The browser has already scrolled to the closed disclosure by the time
    // this runs, and opening it has just pushed its own content down the page.
    // Scrolling again puts the definition where the reader is looking; the CSS
    // `scroll-margin-top` on the element is what keeps it out from under the
    // sticky header.
    if (scroll || !wasOpen) term.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  var onArrival = termFromHash();
  if (onArrival) reveal(onArrival, true);

  // A same-page anchor - one term's "related terms", or an auto-linked mention
  // inside another definition - is a hash change and not a navigation, so it
  // gets no load event of its own.
  window.addEventListener('hashchange', function () {
    var term = termFromHash();
    if (term) reveal(term, true);
  });

  // Opening a term by hand puts its address in the URL bar, which is what makes
  // a definition on a shared page something a reader can send to somebody else.
  //
  // `replaceState` rather than a hash assignment: assigning to the hash would
  // scroll the page under the reader's hands and stack an entry in their
  // history for every term they opened, so the back button would walk the
  // glossary instead of leaving it.
  document.addEventListener('toggle', function (event) {
    var term = event.target;
    if (!term.open || !term.matches || !term.matches(SELECTOR) || !term.id) return;
    if (!window.history || !window.history.replaceState) return;
    if (window.location.hash === '#' + term.id) return;
    window.history.replaceState(null, '', '#' + term.id);
  }, true); // Capturing, because `toggle` does not bubble.
})();
