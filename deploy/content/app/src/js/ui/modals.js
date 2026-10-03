    // UX FIX: destructive-action confirmations (loading example data, wizard
    // re-run, importing a backup) and their error/success notices used to be
    // plain browser confirm()/alert() dialogs — functional, but visually
    // jarring against this app's fully custom UI, and impossible to style or
    // extend. This is a single reusable modal both classes of call route
    // through: showConfirmModal() for a real "confirm vs. cancel" decision
    // (only used for genuinely destructive actions, never as a blanket
    // replacement for every dialog), and showAlertModal() for a one-button
    // acknowledgment (info/error/success notices).
    let _confirmModalCallback = null;
    let _confirmModalCancelCallback = null;

    function showConfirmModal(opts) {
      const titleEl = document.getElementById('confirm-modal-title');
      const bodyEl = document.getElementById('confirm-modal-body');
      const iconEl = document.getElementById('confirm-modal-icon');
      const cancelBtn = document.getElementById('confirm-modal-cancel-btn');
      const confirmBtn = document.getElementById('confirm-modal-confirm-btn');
      const modal = document.getElementById('modal-confirm-action');
      if (!modal || !titleEl || !bodyEl || !cancelBtn || !confirmBtn) return;

      titleEl.innerText = opts.title || '';
      bodyEl.innerText = opts.body || '';
      if (iconEl) iconEl.innerText = opts.icon || (opts.isAlert ? 'ℹ️' : '⚠️');

      confirmBtn.innerText = opts.confirmLabel || t('confirmModalDefaultOk');
      if (opts.isAlert) {
        cancelBtn.classList.add('hidden');
      } else {
        cancelBtn.classList.remove('hidden');
        cancelBtn.innerText = opts.cancelLabel || t('confirmModalDefaultCancel');
      }

      _confirmModalCallback = typeof opts.onConfirm === 'function' ? opts.onConfirm : null;
      _confirmModalCancelCallback = typeof opts.onCancel === 'function' ? opts.onCancel : null;
      modal.classList.remove('hidden');
    }

    // Drop-in replacement for alert(): a single-button acknowledgment using
    // the same visual component, so error/success notices match the app too.
    function showAlertModal(title, body) {
      showConfirmModal({ title: title, body: body, isAlert: true });
    }

    window.handleConfirmModalConfirm = function() {
      document.getElementById('modal-confirm-action').classList.add('hidden');
      const cb = _confirmModalCallback;
      _confirmModalCallback = null;
      _confirmModalCancelCallback = null;
      if (cb) cb();
    };

    window.handleConfirmModalCancel = function() {
      document.getElementById('modal-confirm-action').classList.add('hidden');
      const cb = _confirmModalCancelCallback;
      _confirmModalCallback = null;
      _confirmModalCancelCallback = null;
      if (cb) cb();
    };

    // =====================================================================
    // Mobile bug, reported directly: opening a modal that scrolls internally
    // (Profile, the Wizard) would, once the person's finger reached the top or
    // bottom of the modal's own scroll area, hand the rest of the scroll gesture
    // to the PAGE BEHIND it — the background visibly scrolled under the overlay.
    // Separately, the page could be nudged a couple of pixels left/right even
    // though everything fits, a classic symptom of some element being a hair
    // wider than the viewport and nothing stopping the resulting horizontal
    // rubber-banding on mobile Safari.
    //
    // Fixed with: (1) overscroll-behavior: contain on every modal's own
    // scrollable region (styles/app.css), which stops a scroll gesture from
    // "chaining" into whatever is behind it once the modal's own content is
    // fully scrolled; (2) locking the BODY itself (position: fixed, the
    // standard trick for iOS Safari specifically, where overflow:hidden alone
    // on <body> does not reliably stop background touch-scrolling) for as long
    // as ANY modal is open, restoring the exact scroll position on close so the
    // page does not visibly jump; (3) overflow-x: hidden on html/body as a
    // blanket guard against the 1-2px horizontal slack that causes the wobble,
    // regardless of which specific element turns out to be responsible.
    //
    // This is a SINGLE, centralized mechanism (a MutationObserver watching
    // every element tagged .app-modal for its "hidden" class changing) rather
    // than one more line added to each of the 6 existing open/close function
    // pairs — correct automatically for any modal added in the future too,
    // and impossible to half-apply by missing one call site.
    let _bodyScrollLockY = 0;
    function _isAnyModalOpen() {
      return Array.from(document.querySelectorAll('.app-modal')).some(el => !el.classList.contains('hidden'));
    }
    function _syncBodyScrollLock() {
      const shouldLock = _isAnyModalOpen();
      const alreadyLocked = document.body.classList.contains('body-scroll-locked');
      if (shouldLock && !alreadyLocked) {
        _bodyScrollLockY = window.scrollY || window.pageYOffset || 0;
        document.body.style.top = `-${_bodyScrollLockY}px`;
        document.body.classList.add('body-scroll-locked');
      } else if (!shouldLock && alreadyLocked) {
        document.body.classList.remove('body-scroll-locked');
        document.body.style.top = '';
        window.scrollTo(0, _bodyScrollLockY);
      }
    }
    (function setupModalScrollLock() {
      if (typeof document === 'undefined' || !document.querySelectorAll) return;
      const modals = document.querySelectorAll('.app-modal');
      if (!modals.length) return;
      if (typeof MutationObserver === 'undefined') return;   // very old browser: degrade silently, no scroll lock
      const observer = new MutationObserver(_syncBodyScrollLock);
      modals.forEach(el => observer.observe(el, { attributes: true, attributeFilter: ['class'] }));
      _syncBodyScrollLock();   // in case a modal is already open at setup time
    })();
