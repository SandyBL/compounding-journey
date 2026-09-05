/**
 * The share row's copy-link button, and the native share sheet where there is
 * one.
 *
 * Everything else in the row is a plain anchor to a network's share endpoint
 * and needs nothing from this file: with JavaScript off, six of the seven
 * targets still work. This adds the two things that cannot be done in markup.
 *
 * The button ships `hidden` and is revealed here only if the clipboard API is
 * actually available, so a browser that cannot copy never shows a button that
 * does nothing. On a phone, `navigator.share` opens the OS share sheet - which
 * reaches Instagram, Signal, Messages and everything else installed, none of
 * which has a share URL - so where it exists the button offers that first and
 * falls back to copying.
 */
(function () {
  'use strict';

  var button = document.querySelector('[data-share-copy]');
  if (!button) return;

  var canCopy = !!(navigator.clipboard && navigator.clipboard.writeText);
  var canShare = typeof navigator.share === 'function';
  if (!canCopy && !canShare) return;

  button.hidden = false;

  var url = button.getAttribute('data-copy-url') || window.location.href;
  var idle = button.getAttribute('data-label-copy') || button.textContent;
  var done = button.getAttribute('data-label-copied') || idle;
  var timer = null;

  function confirmCopy() {
    button.textContent = done;
    button.setAttribute('data-copied', 'true');
    window.clearTimeout(timer);
    // Long enough to be read, short enough that the button is back to its real
    // label before the reader looks again.
    timer = window.setTimeout(function () {
      button.textContent = idle;
      button.removeAttribute('data-copied');
    }, 2400);
  }

  button.addEventListener('click', function () {
    var title = document.title;

    if (canShare) {
      navigator
        .share({ title: title, url: url })
        .catch(function () {
          // A dismissed share sheet rejects exactly like a failed one, so the
          // only safe response is to do nothing: copying instead would put the
          // link on the clipboard of somebody who just cancelled.
        });
      return;
    }

    navigator.clipboard.writeText(url).then(confirmCopy, function () {
      // Clipboard writes can be refused by permission policy even where the
      // API exists. Selecting the URL is not possible from a button, so the
      // honest fallback is to leave the label alone and let the reader use the
      // address bar.
    });
  });
})();
