        const callbackParameters = new URLSearchParams(window.location.hash.slice(1));
        const hasIdentityCallback = ['invite_token', 'recovery_token'].some((key) => callbackParameters.has(key));

        if (hasIdentityCallback) await runIdentityCallback();

        async function runIdentityCallback() {
            const dialog = document.querySelector('#identity-callback');
            const title = document.querySelector('#identity-callback-title');
            const copy = document.querySelector('#identity-callback-copy');
            const form = document.querySelector('#identity-callback-form');
            const password = document.querySelector('#identity-password');
            const confirmation = document.querySelector('#identity-password-confirmation');
            const button = document.querySelector('#identity-callback-button');
            const status = document.querySelector('#identity-callback-status');
            const closeButton = document.querySelector('#identity-callback-close');

            // Every one of these is required, and a missing one used to surface as
            // "Cannot set properties of null" thrown from inside showDialog - at
            // which point the reader had a token in the address bar, no dialog, and
            // nothing to act on. Refusing to start leaves the homepage usable.
            const parts = { dialog, title, copy, form, password, confirmation, button, status, closeButton };
            const missing = Object.keys(parts).filter((name) => !parts[name]);
            if (missing.length > 0) {
                console.error(`The account-setup dialog is missing ${missing.join(', ')}; not handling the identity link.`);
                return;
            }

            // Restored on close rather than blanked, so the dialog cannot leave the
            // page permanently unscrollable behind it - which is exactly what a
            // hard-coded '' would do if anything else were managing overflow.
            let previousOverflow = '';
            let opener = null;
            let pressStartedOnBackdrop = false;

            const focusableInDialog = () => [...dialog.querySelectorAll('button, input, select, textarea, a[href]')]
                .filter((node) => !node.disabled && node.getClientRects().length > 0);

            const onKeydown = (event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeDialog();
                    return;
                }

                // aria-modal tells a screen reader the rest of the page is inert;
                // Tab is what makes that true for everybody else. Without this,
                // tabbing out of the card lands on a homepage the overlay is
                // covering, with no visible focus ring anywhere.
                if (event.key !== 'Tab') return;

                const focusable = focusableInDialog();
                if (focusable.length === 0) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                const active = document.activeElement;

                if (event.shiftKey && (active === first || !dialog.contains(active))) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
                    event.preventDefault();
                    first.focus();
                }
            };

            const openDialog = (focusTarget) => {
                opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                previousOverflow = document.body.style.overflow;
                dialog.hidden = false;
                document.body.style.overflow = 'hidden';
                document.addEventListener('keydown', onKeydown);
                focusTarget.focus();
            };

            // The link stays in the address bar. Dismissing is meant to be a way
            // out of the dialog, not a way to destroy a single-use token: someone
            // who closes it by accident gets their invitation back by reloading.
            const closeDialog = () => {
                dialog.hidden = true;
                document.body.style.overflow = previousOverflow;
                document.removeEventListener('keydown', onKeydown);
                opener?.focus();
            };

            closeButton.addEventListener('click', closeDialog);

            // Both halves of the press have to land on the backdrop. Selecting
            // text in a field and releasing the mouse outside the card still
            // produces a click whose target is the overlay, and closing on that
            // would throw away a half-typed password.
            dialog.addEventListener('pointerdown', (event) => {
                pressStartedOnBackdrop = event.target === dialog;
            });
            dialog.addEventListener('click', (event) => {
                if (event.target === dialog && pressStartedOnBackdrop) closeDialog();
            });

            const showCallbackError = (message) => {
                title.textContent = 'This link is unavailable';
                copy.textContent = 'The invitation or password-reset link could not be verified. Request a new email and try again.';
                form.hidden = true;
                status.textContent = message;
                // The form is gone, so the close button is the only thing left to
                // focus - and the only thing left to do.
                openDialog(closeButton);
            };

            try {
                // Self-hosted, and only fetched by the small number of visitors
                // who arrive on an invite or recovery link - which is why it is a
                // dynamic import rather than a second module in the head.
                const identity = await import('/assets/js/netlify-identity-1.2.0.js');
                const result = await identity.handleAuthCallback();

                if (!result || !['invite', 'recovery'].includes(result.type)) {
                    showCallbackError('This link is not a supported account setup link.');
                } else {
                    title.textContent = result.type === 'invite' ? 'Accept your invitation' : 'Reset your password';
                    copy.textContent = result.type === 'invite'
                        ? 'Create a password to activate your account and continue to the Content Studio.'
                        : 'Choose a new password for your account to continue to the Content Studio.';
                    openDialog(password);

                    form.addEventListener('submit', async (event) => {
                        event.preventDefault();
                        status.textContent = '';

                        if (password.value !== confirmation.value) {
                            status.textContent = 'The passwords do not match.';
                            confirmation.focus();
                            return;
                        }

                        button.disabled = true;
                        button.textContent = 'Saving…';

                        try {
                            if (result.type === 'invite') {
                                await identity.acceptInvite(result.token, password.value);
                            } else {
                                await identity.updateUser({ password: password.value });
                            }

                            status.style.color = '#1e4620';
                            status.textContent = 'Password saved. Opening the Content Studio…';
                            window.setTimeout(() => window.location.assign('/admin/'), 700);
                        } catch (error) {
                            status.textContent = error instanceof Error ? error.message : 'Unable to save the password.';
                            button.disabled = false;
                            button.textContent = 'Save password';
                        }
                    });
                }
            } catch (error) {
                showCallbackError(error instanceof Error ? error.message : 'Unable to process this account link.');
            }
        }
    