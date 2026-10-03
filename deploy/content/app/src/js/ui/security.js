    // =====================================================================
    // PIN / biometric lock: a SCREEN LOCK, not encryption. It hides the app
    // behind a PIN (or, where the device supports it, a platform biometric)
    // until unlocked, deterring a casual look at a shared/unattended device.
    // It does NOT encrypt localStorage \u2014 the underlying financial data is
    // stored exactly as it always was, in plain sanitized JSON, and anyone
    // with direct access to the browser's storage (dev tools, the device's
    // file system) can still read it. This is stated here and in the setup
    // UI on purpose: promising real encryption this app does not implement
    // would be actively misleading.
    //
    // Never lets the person get permanently locked out: the sanitizer
    // (state/sanitize.js) forces pinEnabled back to false whenever the
    // stored hash/salt are missing or malformed, and "Forgot PIN?" on the
    // lock screen itself always works (no old PIN required) since there is
    // no encrypted data to lose by resetting it \u2014 only the lock itself.
    // =====================================================================
    let appLocked = false;              // in-memory only, NEVER persisted: a corrupted
                                         // "still locked" flag in localStorage could brick
                                         // the app on next load with no way back in.
    let lastActivityAt = Date.now();
    let inactivityIntervalId = null;
    const PIN_MIN_LENGTH = 4, PIN_MAX_LENGTH = 8;

    function secDefaults() {
      return { pinEnabled: false, pinHash: null, pinSalt: null, autoLockMinutes: 5, biometricEnabled: false, biometricCredentialId: null };
    }
    function secState() { return Object.assign(secDefaults(), state.security || {}); }

    function randomSaltHex() {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // SHA-256 of salt+pin, as a hex string. Async (Web Crypto), like every real browser's
    // implementation \u2014 every caller below is async too, all the way out to the onclick handler.
    async function hashPin(pin, salt) {
      const bytes = new TextEncoder().encode(String(salt) + ':' + String(pin));
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    function isValidPinFormat(pin) {
      return typeof pin === 'string' && new RegExp(`^\\d{${PIN_MIN_LENGTH},${PIN_MAX_LENGTH}}$`).test(pin);
    }

    // ---------- setup (from the unlocked Profile > Security screen) ----------
    window.setupPinLock = async function(pin, confirmPin) {
      if (!isValidPinFormat(pin)) { showAlertModal(t('secErrorTitle'), t('secErrorFormat')); return false; }
      if (pin !== confirmPin) { showAlertModal(t('secErrorTitle'), t('secErrorMismatch')); return false; }
      const salt = randomSaltHex();
      const hash = await hashPin(pin, salt);
      state.security = Object.assign(secState(), { pinEnabled: true, pinHash: hash, pinSalt: salt });
      saveState();
      renderSecuritySettings();
      return true;
    };
    // Requires the CURRENT pin (a courtesy check when the app is already unlocked, not a
    // real security boundary) \u2014 the actual "I forgot it" path is resetPinForgotten() below,
    // reachable from the lock screen itself, which never asks for the old PIN at all.
    window.changePinLock = async function(currentPin, newPin, confirmNewPin) {
      const sec = secState();
      if (!sec.pinEnabled) return false;
      const currentHash = await hashPin(currentPin, sec.pinSalt);
      if (currentHash !== sec.pinHash) { showAlertModal(t('secErrorTitle'), t('secErrorWrongCurrent')); return false; }
      return setupPinLock(newPin, confirmNewPin);
    };
    window.handleDisablePinClick = function() {
      const row = document.getElementById('sec-disable-row');
      if (row) row.classList.remove('hidden');
      const input = document.getElementById('input-sec-disable-pin');
      if (input) { input.value = ''; input.focus(); }
    };
    window.disablePinLock = async function(currentPin) {
      const sec = secState();
      if (!sec.pinEnabled) return true;
      const currentHash = await hashPin(currentPin, sec.pinSalt);
      if (currentHash !== sec.pinHash) { showAlertModal(t('secErrorTitle'), t('secErrorWrongCurrent')); return false; }
      state.security = Object.assign(secState(), { pinEnabled: false, pinHash: null, pinSalt: null, biometricEnabled: false, biometricCredentialId: null });
      saveState();
      renderSecuritySettings();
      return true;
    };
    window.updateAutoLockMinutes = function(val) {
      const mins = Math.min(120, Math.max(0, Math.round(parseFloat(val)) || 0));
      state.security = Object.assign(secState(), { autoLockMinutes: mins });
      saveState();
    };

    // ---------- unlocking (from the lock screen) ----------
    window.attemptPinUnlock = async function(pin) {
      const sec = secState();
      if (!sec.pinEnabled) { unlockApp(); return true; }
      const hash = await hashPin(pin, sec.pinSalt);
      if (hash === sec.pinHash) { unlockApp(); return true; }
      const errEl = document.getElementById('lock-error');
      if (errEl) { errEl.innerText = t('secWrongPin'); errEl.classList.remove('hidden'); }
      return false;
    };
    // No old PIN needed: there is no encrypted data behind it to lose, only the lock.
    window.resetPinForgotten = function() {
      showConfirmModal({
        title: t('secForgotTitle'), body: t('secForgotBody'),
        onConfirm: function() {
          state.security = secDefaults();
          saveState();
          unlockApp();
        }
      });
    };

    function showLockScreen() {
      appLocked = true;
      const el = document.getElementById('lock-screen');
      if (el) el.classList.remove('hidden');
      const pinInput = document.getElementById('input-lock-pin');
      if (pinInput) pinInput.value = '';
      const errEl = document.getElementById('lock-error');
      if (errEl) errEl.classList.add('hidden');
      const bioBtn = document.getElementById('btn-lock-biometric');
      if (bioBtn) bioBtn.classList.toggle('hidden', !(webAuthnSupported() && secState().biometricEnabled));
    }
    window.lockNow = function() {
      if (!secState().pinEnabled) return;   // nothing set up to lock behind
      showLockScreen();
    };
    function unlockApp() {
      appLocked = false;
      const el = document.getElementById('lock-screen');
      if (el) el.classList.add('hidden');
      resetInactivityTimer();
      syncFormInputsFromState();
      updateUI();
      syncHeaderLockButton();   // this is the only path to a first render when a PIN is set
    }

    // Shows/hides the quick "Lock now" header icon based on whether a PIN is actually
    // configured — showing it with nothing behind it would just be confusing. Called
    // from unlockApp() (covers the initial page load for a returning PIN-protected
    // user) and from renderSecuritySettings() (covers setting up, disabling, or
    // resetting the PIN from the Profile modal).
    function syncHeaderLockButton() {
      const btn = document.getElementById('btn-header-lock');
      if (!btn) return;
      btn.classList.toggle('hidden', !secState().pinEnabled);
      btn.classList.toggle('flex', secState().pinEnabled);
    }

    // ---------- inactivity auto-lock ----------
    // shouldAutoLock() is pure and directly testable; the scheduling around it
    // (setInterval) cannot be exercised the same way in a non-browser test run.
    window.resetInactivityTimer = function() { lastActivityAt = Date.now(); };
    function shouldAutoLock() {
      const mins = secState().autoLockMinutes;
      if (!(mins > 0)) return false;
      return (Date.now() - lastActivityAt) >= mins * 60000;
    }
    function checkInactivityAndLock() {
      if (appLocked) return;
      if (secState().pinEnabled && shouldAutoLock()) lockNow();
    }
    function startInactivityWatch() {
      resetInactivityTimer();
      ['click', 'keydown', 'mousemove', 'touchstart'].forEach(evt => document.addEventListener(evt, resetInactivityTimer));
      if (inactivityIntervalId) clearInterval(inactivityIntervalId);
      inactivityIntervalId = setInterval(checkInactivityAndLock, 15000);
    }

    // ---------- biometric (WebAuthn), best-effort: the PIN always still works ----------
    function webAuthnSupported() {
      return typeof PublicKeyCredential !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.credentials;
    }
    window.setupBiometric = async function() {
      if (!webAuthnSupported()) { showAlertModal(t('secErrorTitle'), t('secBiometricUnsupported')); return false; }
      const sec = secState();
      if (!sec.pinEnabled) { showAlertModal(t('secErrorTitle'), t('secBiometricNeedsPin')); return false; }
      try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const userId = crypto.getRandomValues(new Uint8Array(16));
        const cred = await navigator.credentials.create({ publicKey: {
          challenge, rp: { name: 'Family Wealth Compass' },
          user: { id: userId, name: 'household', displayName: 'Household' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 60000
        } });
        if (!cred) throw new Error('no credential returned');
        const idB64 = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
        state.security = Object.assign(secState(), { biometricEnabled: true, biometricCredentialId: idB64 });
        saveState();
        renderSecuritySettings();
        return true;
      } catch (e) {
        showAlertModal(t('secErrorTitle'), t('secBiometricFailed'));
        return false;
      }
    };
    window.disableBiometric = function() {
      state.security = Object.assign(secState(), { biometricEnabled: false, biometricCredentialId: null });
      saveState();
      renderSecuritySettings();
    };
    // Failure of any kind (declined, no hardware, cancelled) just leaves the app locked
    // with the PIN still available \u2014 biometrics are only ever a convenience on top of it.
    window.tryBiometricUnlock = async function() {
      const sec = secState();
      if (!webAuthnSupported() || !sec.biometricEnabled || !sec.biometricCredentialId) return false;
      try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const idBytes = Uint8Array.from(atob(sec.biometricCredentialId), c => c.charCodeAt(0));
        const assertion = await navigator.credentials.get({ publicKey: {
          challenge, allowCredentials: [{ id: idBytes, type: 'public-key' }], userVerification: 'required', timeout: 60000
        } });
        if (assertion) { unlockApp(); return true; }
        return false;
      } catch (e) {
        return false;
      }
    };

    // ---------- rendering: Security settings in the Profile modal ----------
    function renderSecuritySettings() {
      const sec = secState();
      const setupRow = document.getElementById('sec-setup-row');
      const manageRow = document.getElementById('sec-manage-row');
      if (setupRow) setupRow.classList.toggle('hidden', sec.pinEnabled);
      if (manageRow) manageRow.classList.toggle('hidden', !sec.pinEnabled);
      const disableRow = document.getElementById('sec-disable-row');
      if (disableRow) disableRow.classList.add('hidden');   // only shown after "Remove" is clicked
      const autoLockInput = document.getElementById('input-autolock-minutes');
      if (autoLockInput && document.activeElement !== autoLockInput) autoLockInput.value = sec.autoLockMinutes;
      const bioRow = document.getElementById('sec-biometric-row');
      if (bioRow) bioRow.classList.toggle('hidden', !(sec.pinEnabled && webAuthnSupported()));
      const bioToggleOn = document.getElementById('btn-biometric-enable');
      const bioToggleOff = document.getElementById('btn-biometric-disable');
      if (bioToggleOn) bioToggleOn.classList.toggle('hidden', sec.biometricEnabled);
      if (bioToggleOff) bioToggleOff.classList.toggle('hidden', !sec.biometricEnabled);
      syncHeaderLockButton();
    }

