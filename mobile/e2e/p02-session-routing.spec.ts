/**
 * P-02 — Session flow & post-login routing gate
 *
 * Business goal (BRD 3.1.2, 3.1.4, 2.1):
 *  - New user without style survey → routed to /onboarding/style-survey
 *  - Returning user (survey done/skipped) → routed directly to /(tabs)
 *  - Session expiry → routed to /auth/welcome, onboardingCompleted preserved
 *
 * Routing gate note: the gate allows unauthenticated users at public guest routes
 * (/(tabs) home, community, etc.). Redirect to /auth/welcome only fires when the
 * user tries to reach a PRIVATE route (e.g. /settings, /profile/edit).
 *
 * Duplicate-account prevention (BRD 3.1.2) requires a real Firebase backend
 * and is NOT testable in this environment (no credentials configured).
 * Documented as COVERAGE GAP below.
 *
 * Server: auth-flow (port 8081) — DEMO_MODE=false
 */
import { test, expect } from '@playwright/test';
import { clearAppStorage, setOnboardingCompleted, waitForRoute } from './helpers/storage';

// Traceability:
// Requirement: BRD 3.1.2, 3.1.4, flow 2.1
// Story: P-02
// AC: routing gate + session expiry behavior

test.describe('P-02 — Routing gate & session handling', () => {
  test('AC-P02-1: Unauthenticated user accessing a private route is redirected to /auth/welcome', async ({ page }) => {
    // Traceability: BRD 3.1.4 routing gate — private routes require auth
    // "Private" routes are not in publicGuestRoutes; /settings is one such route.
    await page.goto('/');
    await clearAppStorage(page);
    await setOnboardingCompleted(page, true);
    await page.reload();
    // Navigate to a private route — routing gate must redirect to /auth/welcome
    await page.goto('/settings');
    await waitForRoute(page, /auth\/welcome/);
    await expect(page).toHaveURL(/auth\/welcome/);
  });

  test('AC-P02-2: User without onboarding sees /auth/onboarding first', async ({ page }) => {
    // Traceability: BRD 3.1 — first launch shows onboarding before auth
    await page.goto('/');
    await clearAppStorage(page);
    await page.reload();
    await waitForRoute(page, /auth\/onboarding/);
    await expect(page).toHaveURL(/auth\/onboarding/);
    // Onboarding slides are rendered
    await expect(page.getByText(/Quản lý tủ đồ|AI gợi ý|Cộng đồng/i).first()).toBeVisible();
  });

  test('AC-P02-3: Session expiry — private route redirects to /auth/welcome, onboarding not re-shown', async ({ page }) => {
    // Traceability: BRD 3.1 session expiry — must preserve onboardingCompleted
    // Simulate: onboarding done, was authenticated, now session gone (cleared auth state).
    // Navigating to a private route must redirect to /auth/welcome, NOT /auth/onboarding.
    await page.goto('/');
    await clearAppStorage(page);
    await setOnboardingCompleted(page, true);
    await page.reload();
    await page.goto('/profile/edit');
    await waitForRoute(page, /auth\/welcome/);
    await expect(page).toHaveURL(/auth\/welcome/);
    // Critically: NOT routed to /auth/onboarding
    await expect(page).not.toHaveURL(/auth\/onboarding/);
  });

  test('AC-P02-4: Direct navigation to a private tab route redirects unauthenticated user to /auth/welcome', async ({ page }) => {
    // Traceability: BRD 3.1.4 — protected routes redirect unauthenticated users
    await page.goto('/');
    await clearAppStorage(page);
    await setOnboardingCompleted(page, true);
    await page.reload();
    // Try forcing navigation to a private route (/settings)
    await page.goto('/settings');
    await waitForRoute(page, /auth\/welcome/);
    // Should be redirected to welcome, not the settings page
    await expect(page).toHaveURL(/auth\/welcome/);
    await expect(page).not.toHaveURL(/settings/);
  });

  // ⚠️ COVERAGE GAP — P-02 Duplicate account prevention
  // BRD 3.1.2: Signing in with the same phone number via two different providers
  // must resolve to the same users/{uid} document (tested via Firestore transaction
  // in the backend session/verify route). NOT testable here because:
  //   - No Firebase credentials configured in this environment
  //   - Requires two real sign-in flows against a live Firebase project
  // Evidence of implementation: admin/src/app/api/auth/session/verify/route.ts
  // uses adminDb.runTransaction() to check for existing phoneNumber before creating a new doc.

  // ⚠️ COVERAGE GAP — P-02 New-user style survey routing
  // BRD 3.1.4: After first login, if hasCompletedStyleSurvey=false AND styleSurveySkipped=false,
  // user must be routed to /onboarding/style-survey.
  // NOT testable E2E here because we cannot complete a real Firebase sign-in
  // to produce an authenticated user with hasCompletedStyleSurvey=false.
  // Evidence of implementation: mobile/app/_layout.tsx line 49+80 (needsStyleSurvey + router.replace).
});
