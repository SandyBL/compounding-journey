    window.dismissBackupBanner = function() {
      state.backupBannerDismissed = true;
      saveState();
      renderBackupBanner();
    };

    // Shows the reminder when there's no export on record, or the last one is
    // stale (>30 days old) — and the user hasn't dismissed it. Dismissing only
    // suppresses the CURRENT staleness; a fresh export, or the reminder going
    // stale again later, both bring it back (see exportDataJSON and the daily
    // staleness check here).
    function renderBackupBanner() {
      const banner = document.getElementById('banner-backup-reminder');
      const statusLbl = document.getElementById('lbl-last-export-status');
      if (!banner) return;

      const lastExportedAt = state.lastExportedAt ? new Date(state.lastExportedAt) : null;
      const daysSinceExport = lastExportedAt ? (Date.now() - lastExportedAt.getTime()) / 86400000 : Infinity;
      const isStale = daysSinceExport > 30;

      if (statusLbl) {
        statusLbl.textContent = lastExportedAt
          ? t('profBackupLast').replace('{date}', lastExportedAt.toLocaleDateString()).replace('{days}', Math.floor(daysSinceExport))
          : t('profBackupNone');
      }

      const shouldShow = isStale && !state.backupBannerDismissed;
      banner.classList.toggle('hidden', !shouldShow);
    }

    // ---- Installable app / iOS storage --------------------------------------
    function isIOSDevice() {
      try {
        const ua = navigator.userAgent || '';
        return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      } catch (e) { return false; }
    }
    function isRunningStandalone() {
      try {
        if (navigator.standalone === true) return true;
        return typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
      } catch (e) { return false; }
    }
    function renderInstallHint() {
      const el = document.getElementById('banner-install-hint');
      if (!el) return;
      el.classList.toggle('hidden', !(isIOSDevice() && !isRunningStandalone() && !state.installHintDismissed));
    }
    window.dismissInstallHint = function() {
      state.installHintDismissed = true;
      saveState();
      renderInstallHint();
    };
    // Registers the service worker (offline support) and asks the browser to
    // keep this site's storage. Both are best-effort: they only work when the
    // page is served over HTTPS next to sw.js, and failures are ignored.
    function registerPWA() {
      try {
        if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
          navigator.serviceWorker.register('sw.js').catch(() => {});
        }
        if (navigator.storage && typeof navigator.storage.persist === 'function') {
          navigator.storage.persist().catch(() => {});
        }
      } catch (e) { /* not available in this environment */ }
    }

    window.dismissNextStepsBanner = function() {
      state.nextStepsBannerDismissed = true;
      saveState();
      renderNextStepsBanner();
    };

    // UX FIX: the setup wizard only ever collects one earner and a handful of
    // starting numbers, then closes with no guidance — a first-time user was
    // left staring at a mostly-empty dashboard with no indication of what to
    // fill in next across the other 8 tabs. This nudge appears only while the
    // profile still looks exactly like what the wizard alone produced (no
    // second earner, no children, no real estate, no debts, no goals); adding
    // ANY of these — or dismissing it directly — makes it go away for good.
    function renderNextStepsBanner(m) {
      const banner = document.getElementById('banner-next-steps');
      const linksContainer = document.getElementById('container-next-steps-links');
      if (!banner) return;

      const stillMinimal = state.wizardCompleted
        && !state.nextStepsBannerDismissed
        && (state.earners || []).length <= 1
        && (state.children || []).length === 0
        && (state.realEstate || []).length === 0
        && (state.goals || []).length === 0
        && (!m || m.totalDebts <= 0);

      banner.classList.toggle('hidden', !stillMinimal);
      if (!stillMinimal || !linksContainer) return;

      const pillClass = "px-2.5 py-1 rounded-lg bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-600/50 text-[11px] font-bold transition";
      const pills = [
        { key: 'nextStepSpouse', tab: 'view-cashflow' },
        { key: 'nextStepChildren', tab: 'view-cashflow' },
        { key: 'nextStepRealEstate', tab: 'view-balancesheet' },
        { key: 'nextStepDebts', tab: 'view-balancesheet' },
        { key: 'nextStepGoals', tab: 'view-goals' }
      ];
      linksContainer.innerHTML = pills.map(p =>
        `<button onclick="switchTab('${p.tab}')" class="${pillClass}">${t(p.key)}</button>`
      ).join('');
    }

