        const callbackParameters = new URLSearchParams(window.location.hash.slice(1));
        const hasIdentityCallback = ['invite_token', 'recovery_token'].some((key) => callbackParameters.has(key));

        if (hasIdentityCallback) {
            const dialog = document.querySelector('#identity-callback');
            const title = document.querySelector('#identity-callback-title');
            const copy = document.querySelector('#identity-callback-copy');
            const form = document.querySelector('#identity-callback-form');
            const password = document.querySelector('#identity-password');
            const confirmation = document.querySelector('#identity-password-confirmation');
            const button = document.querySelector('#identity-callback-button');
            const status = document.querySelector('#identity-callback-status');

            const showDialog = () => {
                dialog.hidden = false;
                document.body.style.overflow = 'hidden';
                password.focus();
            };

            const showCallbackError = (message) => {
                title.textContent = 'This link is unavailable';
                copy.textContent = 'The invitation or password-reset link could not be verified. Request a new email and try again.';
                form.hidden = true;
                status.textContent = message;
                dialog.hidden = false;
                document.body.style.overflow = 'hidden';
            };

            try {
                const identity = await import('https://cdn.jsdelivr.net/npm/@netlify/identity@1.2.0/+esm');
                const result = await identity.handleAuthCallback();

                if (!result || !['invite', 'recovery'].includes(result.type)) {
                    showCallbackError('This link is not a supported account setup link.');
                } else {
                    title.textContent = result.type === 'invite' ? 'Accept your invitation' : 'Reset your password';
                    copy.textContent = result.type === 'invite'
                        ? 'Create a password to activate your account and continue to the Content Studio.'
                        : 'Choose a new password for your account to continue to the Content Studio.';
                    showDialog();

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
    