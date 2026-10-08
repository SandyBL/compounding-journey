// The course page's client half: two small jobs, neither of which the page
// needs in order to work.
//
// 1. Campaign parameters. A reader who arrives from an ad lands here with
//    utm_* and gclid in the address. Every buy button carries
//    data-course-checkout, and this copies those parameters onto it, so the
//    Hotmart checkout - and Hotmart's sales reports - know which campaign the
//    sale came from. Hotmart reads its own `src` parameter for that, so
//    utm_source is also passed as `src` when the link does not set one. The
//    parameters are kept in sessionStorage for the rest of the visit, so a
//    reader who reads an article first and buys afterwards is still credited.
//
// 2. The coupon button. The code is printed as text, which works everywhere;
//    the "Copy" button is revealed only where the clipboard API exists.
(function () {
  'use strict';

  var KEY = 'cj-course-campaign';
  var NAMES = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid'];

  function campaign() {
    var found = {};
    var params = new URLSearchParams(window.location.search);
    NAMES.forEach(function (name) {
      var value = params.get(name);
      if (value) found[name] = value.slice(0, 200);
    });
    try {
      if (Object.keys(found).length) {
        window.sessionStorage.setItem(KEY, JSON.stringify(found));
        return found;
      }
      return JSON.parse(window.sessionStorage.getItem(KEY) || '{}') || {};
    } catch (error) {
      return found;
    }
  }

  var tracked = campaign();
  if (Object.keys(tracked).length) {
    document.querySelectorAll('a[data-course-checkout]').forEach(function (link) {
      var url;
      try { url = new URL(link.href); } catch (error) { return; }
      Object.keys(tracked).forEach(function (name) {
        if (!url.searchParams.has(name)) url.searchParams.set(name, tracked[name]);
      });
      if (tracked.utm_source && !url.searchParams.has('src')) url.searchParams.set('src', tracked.utm_source);
      link.href = url.toString();
    });
  }

  if (navigator.clipboard && window.isSecureContext) {
    document.querySelectorAll('[data-course-coupon-copy]').forEach(function (button) {
      var code = button.parentElement && button.parentElement.querySelector('[data-course-coupon]');
      if (!code) return;
      var label = button.textContent;
      button.hidden = false;
      button.addEventListener('click', function () {
        navigator.clipboard.writeText(code.textContent.trim()).then(function () {
          button.textContent = button.getAttribute('data-label-copied') || label;
          window.setTimeout(function () { button.textContent = label; }, 2000);
        }).catch(function () {});
      });
    });
  }
}());
