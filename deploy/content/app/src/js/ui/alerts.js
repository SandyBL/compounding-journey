    // =====================================================================
    // Proactive alerts: everything else in this app is pull-based (you have to
    // open the right tab to see a problem). These are shown right on Overview,
    // the tab people land on first, using the SAME banner pattern already used
    // for the backup reminder: one static div per alert, toggled by a computed
    // condition, dismissible, and — for the financial ones below — the
    // dismissal clears itself once the condition goes away, so if the same
    // problem comes back later you are told again rather than staying silently
    // suppressed forever. Two of these banners (high-cost debt, next steps)
    // already existed as unwired markup with translated copy; the other four
    // are new, covering the specific gaps this was written for.
    // =====================================================================
    const ALERT_EMERGENCY_MONTHS_MIN = 3;
    const ALERT_FREEDOM_MONTHS_WINDOW = 6;

    // A finer, near-term "months to freedom" estimate for the "approaching
    // freedom" alert only. calculateMetrics()'s own yearsToCrossover is whole
    // years, too coarse for "you're about 3 months away" — this linearly
    // interpolates within the single year the crossover actually happens in,
    // using the SAME projection engine and inputs metrics itself uses. Never
    // touches calc/metrics.js; only used here. Returns null unless the
    // crossover is projected within about the next year (deliberately
    // conservative rather than extrapolating a guess further out).
    function estimateMonthsToFreedom(m) {
      if (m.yearsToCrossover === null || m.yearsToCrossover > 1) return null;
      const vals = simulateRealPortfolio({
        start: m.totalLiquidBase, monthlyInvest: m.monthlyInvest, years: 1, realReturn: m.realAnnualReturn,
        careerGrowthRate: m.careerGrowthRate, careerGrowthProportional: m.careerGrowthProportional,
        events: m.lifeEvents, surplus: m.monthlySurplus
      }).values;
      const target = m.targetFreedomCapital;
      // BUGFIX: reported directly — a completely blank profile (nothing entered yet, so
      // living costs and therefore the freedom target both compute to exactly 0) showed
      // "you've already reached financial freedom," since 0 >= 0 is trivially true. The
      // two cases were wrongly treated as the same thing: a genuinely REACHED target and
      // a MISSING one are not the same, and only the first should ever say "reached."
      if (!(target > 0)) return null;   // no real target yet (no living-cost data entered) -> no estimate at all, not "already there"
      if (vals[0] >= target) return 0;  // a real, positive target has genuinely already been reached
      if (vals[1] < target) return null;
      const frac = (target - vals[0]) / (vals[1] - vals[0]);
      return Math.max(0, Math.round(frac * 12));
    }

    // NOTE: two banners already existed here before this feature, both fully wired and
    // deliberately left untouched: banner-highcost-debt (render-core.js's updateUI(), no
    // dismiss button by design — high-cost debt is meant to stay visible) and
    // banner-next-steps (renderNextStepsBanner/dismissNextStepsBanner in banners-pwa.js,
    // a one-time onboarding nudge). The four below are the new, general-purpose alerts.

    // ---------- 1. Emergency reserve below a sensible minimum (new) ----------
    function renderEmergencyReserveBanner(m) {
      const banner = document.getElementById('banner-emergency-reserve');
      if (!banner) return;
      const low = m.totalMonthlyLivingCost > 0 && m.emergencyMonths < ALERT_EMERGENCY_MONTHS_MIN;
      if (!low) state.emergencyReserveBannerDismissed = false;
      const el = document.getElementById('lbl-emergency-reserve-months');
      if (el) el.innerText = m.emergencyMonths.toFixed(1);
      banner.classList.toggle('hidden', !(low && !state.emergencyReserveBannerDismissed));
    }
    window.dismissEmergencyReserveBanner = function() {
      state.emergencyReserveBannerDismissed = true;
      saveState();
      renderEmergencyReserveBanner(calculateMetrics());
    };

    // ---------- 2. Bills / subscriptions due soon (new; reuses the bills feature) ----------
    function renderBillsDueSoonAlertBanner() {
      const banner = document.getElementById('banner-bills-due-soon');
      if (!banner) return;
      const dueSoon = getDueSoonRecurringItems();
      if (dueSoon.length === 0) state.billsDueSoonBannerDismissed = false;
      const el = document.getElementById('lbl-bills-due-soon-text');
      if (el && dueSoon.length > 0) {
        const names = dueSoon.slice(0, 3).map(x => `${escapeHtml(x.name || t('recNamePlaceholder'))} (${dueInText(x.daysUntilDue)})`).join(', ');
        el.innerHTML = `${t('billsDueSoonTemplate').replace('{n}', dueSoon.length).replace('{window}', BILLS_REMINDER_WINDOW_DAYS)}: ${names}`;
      }
      banner.classList.toggle('hidden', !(dueSoon.length > 0 && !state.billsDueSoonBannerDismissed));
    }
    window.dismissBillsDueSoonBanner = function() {
      state.billsDueSoonBannerDismissed = true;
      saveState();
      renderBillsDueSoonAlertBanner();
    };

    // ---------- 3. Approaching financial freedom (new; positive-toned) ----------
    function renderFreedomApproachingBanner(m) {
      const banner = document.getElementById('banner-freedom-approaching');
      if (!banner) return;
      const months = estimateMonthsToFreedom(m);
      const approaching = months !== null && months <= ALERT_FREEDOM_MONTHS_WINDOW;
      if (!approaching) state.freedomApproachingBannerDismissed = false;
      const el = document.getElementById('lbl-freedom-approaching-text');
      if (el && approaching) {
        el.innerText = months === 0 ? t('freedomApproachingNow') : t('freedomApproachingTemplate').replace('{n}', months);
      }
      banner.classList.toggle('hidden', !(approaching && !state.freedomApproachingBannerDismissed));
    }
    window.dismissFreedomApproachingBanner = function() {
      state.freedomApproachingBannerDismissed = true;
      saveState();
      renderFreedomApproachingBanner(calculateMetrics());
    };

    // ---------- 4. Negative cash flow: spending exceeds income (new) ----------
    function renderCashFlowNegativeBanner(m) {
      const banner = document.getElementById('banner-cashflow-negative');
      if (!banner) return;
      const negative = m.cashDelta < 0;
      if (!negative) state.cashFlowNegativeBannerDismissed = false;
      const el = document.getElementById('lbl-cashflow-negative-amount');
      if (el) el.innerText = fmt(Math.abs(m.cashDelta));
      banner.classList.toggle('hidden', !(negative && !state.cashFlowNegativeBannerDismissed));
    }
    window.dismissCashFlowNegativeBanner = function() {
      state.cashFlowNegativeBannerDismissed = true;
      saveState();
      renderCashFlowNegativeBanner(calculateMetrics());
    };

    function renderAllAlerts(m) {
      renderEmergencyReserveBanner(m);
      renderBillsDueSoonAlertBanner();
      renderFreedomApproachingBanner(m);
      renderCashFlowNegativeBanner(m);
    }

