    window.exportDataJSON = function() {
      state.lastExportedAt = new Date().toISOString();
      state.backupBannerDismissed = false; // fresh export starts a new staleness clock/reminder cycle
      saveState();
      renderBackupBanner();

      const blob = new Blob([JSON.stringify(buildExportPayload(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dateStamp = state.lastExportedAt.slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family-wealth-compass_backup_${dateStamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    window.handleImportFileSelected = function(inputEl) {
      const file = inputEl.files && inputEl.files[0];
      if (!file) return;
      if (file.size > MAX_BACKUP_BYTES) {
        showAlertModal(t('importErrorTitle'), t('importErrorTooLarge'));
        inputEl.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = function(evt) {
        let parsed;
        try {
          parsed = JSON.parse(evt.target.result);
        } catch (e) {
          showAlertModal(t('importErrorTitle'), t('importErrorBadJson'));
          inputEl.value = '';
          return;
        }

        // Reject anything that doesn't identify itself as a backup from this app
        // (a bare {} used to pass and, once confirmed, wiped the whole profile).
        const verdict = classifyBackupFile(parsed);
        if (!verdict.ok) {
          showAlertModal(t('importErrorTitle'), t(verdict.reason));
          inputEl.value = '';
          return;
        }

        // Never trust an imported file at face value — always route it through the
        // same sanitize/migrate pass used for localStorage, so a backup taken from an
        // older version of the app (missing fields, stale schemaVersion) is upgraded
        // exactly like a normal reload would. Built BEFORE anything is shown or
        // applied, so the diff below reflects exactly what confirming would do.
        let incoming;
        try {
          incoming = migrateAndSanitizeState(verdict.raw);
        } catch (e) {
          showAlertModal(t('importErrorTitle'), t('importErrorCorrupted'));
          inputEl.value = '';
          return;
        }
        const diff = computeImportDiff(state, incoming);
        showImportReviewModal(diff, function() {
          // The app lock is a LOCAL device preference, not household "data" — an
          // imported file never carries it (buildExportPayload strips it on the way
          // out), and importing someone else's backup must not silently reset or
          // remove whatever lock is already set up on THIS device.
          incoming.security = state.security;
          state = incoming;
          syncHeaderCountry();
          syncBaseCurrencyButtons();
          applyTranslations();
          syncFormInputsFromState();
          // Same flow as every other "replace the whole profile" path: the form was
          // just synced from the new state, so render and save directly instead of
          // routing through handleDataUpdate (which re-reads the DOM first).
          updateUI();
          saveState();
          closeProfileModal();
          showAlertModal(t('importSuccessTitle'), t('importSuccessBody') + (verdict.legacy ? '\n\n' + t('importLegacyNote') : ''));
        });
        inputEl.value = '';
      };
      reader.onerror = function() {
        showAlertModal(t('importErrorTitle'), t('importErrorReadFailed'));
        inputEl.value = '';
      };
      reader.readAsText(file);
    };

