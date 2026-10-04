// The client half of the Subscribe dialog (scripts/newsletter-subscribe.mjs).
//
// Every page carries the dialog as static markup, so Netlify Forms can find the
// form and so the page works with no script at all: a trigger is a link to
// #subscribe, the stylesheet shows the dialog when it is the target, and the
// form posts normally. This script upgrades that to a real modal - opened with
// showModal(), so focus is trapped, Escape closes it and the page behind is
// inert - and submits the form in place.
(() => {
  const dialog = document.querySelector('[data-subscribe-dialog]');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  // The header is a containing block for fixed elements. The dialog is
  // rendered outside it, but it is moved to the end of <body> regardless, so
  // nothing about where a template happened to put it can clip it.
  if (dialog.parentElement !== document.body) document.body.appendChild(dialog);
  dialog.classList.add('subscribe-dialog--enhanced');

  const form = dialog.querySelector('[data-subscribe-form]');
  const placementField = dialog.querySelector('[data-subscribe-placement-field]');
  const error = dialog.querySelector('[data-subscribe-error]');
  const submit = dialog.querySelector('[data-subscribe-submit]');
  const views = {
    form: dialog.querySelector('[data-subscribe-view="form"]'),
    success: dialog.querySelector('[data-subscribe-view="success"]')
  };
  const submitLabel = submit.textContent;
  let opener = null;

  const clearHash = () => {
    if (window.location.hash === `#${dialog.id}`) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const showView = (name) => {
    for (const [key, view] of Object.entries(views)) view.hidden = key !== name;
  };

  const open = (placement, trigger) => {
    opener = trigger ?? document.activeElement;
    placementField.value = placement || 'direct';
    if (!views.success.hidden && form.dataset.done !== 'true') showView('form');
    error.hidden = true;
    if (!dialog.open) dialog.showModal();
    const first = views.form.hidden ? dialog.querySelector('[data-subscribe-success-title]') : dialog.querySelector('#subscribe-first-name');
    first?.focus();
  };

  // A trigger inside a phone menu closes that menu first, so the dialog is
  // not opened over a drawer that would still be there when it closes. Focus
  // then returns to the menu's own toggle rather than to a hidden link.
  const closeMenuAround = (trigger) => {
    const homeMenu = trigger.closest('#mobile-menu');
    if (homeMenu && !homeMenu.hidden) {
      homeMenu.querySelector('[data-mobile-menu-close]')?.click();
      return document.querySelector('.mobile-menu-toggle') ?? trigger;
    }
    const panel = trigger.closest('.site-menu-panel');
    if (panel && !panel.hidden) {
      const toggle = document.querySelector('.site-menu-toggle');
      toggle?.click();
      return toggle ?? trigger;
    }
    return trigger;
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  dialog.addEventListener('close', () => {
    clearHash();
    if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    opener = null;
  });

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-subscribe-open]');
    if (trigger) {
      event.preventDefault();
      open(trigger.dataset.subscribePlacement, closeMenuAround(trigger));
      return;
    }
    if (!dialog.open) return;
    if (event.target.closest('[data-subscribe-close]')) {
      event.preventDefault();
      close();
      return;
    }
    // A click on the backdrop lands on the <dialog> itself, outside the card.
    if (event.target === dialog) close();
  });

  const fail = (message, field) => {
    error.textContent = message;
    error.hidden = false;
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    }
  };

  form.addEventListener('input', (event) => {
    event.target.removeAttribute?.('aria-invalid');
    error.hidden = true;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const firstName = form.elements.first_name;
    const email = form.elements.email;
    firstName.value = firstName.value.trim();
    email.value = email.value.trim();

    if (!firstName.value) return fail(dialog.dataset.errorName, firstName);
    if (!email.value || !email.checkValidity()) return fail(dialog.dataset.errorEmail, email);

    submit.disabled = true;
    submit.textContent = dialog.dataset.sending;
    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      });
      if (!response.ok) throw new Error(`Form endpoint answered ${response.status}`);
      form.dataset.done = 'true';
      form.reset();
      showView('success');
      dialog.querySelector('[data-subscribe-success-title]')?.focus();
    } catch (problem) {
      console.error('Subscription failed.', problem);
      fail(dialog.dataset.errorGeneric);
    } finally {
      submit.disabled = false;
      submit.textContent = submitLabel;
    }
  });

  // A link from another page - /en/#subscribe - opens the dialog on arrival,
  // and so does following a trigger with the keyboard shortcut for a new tab.
  const openFromHash = () => {
    if (window.location.hash === `#${dialog.id}`) open('link');
  };
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
})();
