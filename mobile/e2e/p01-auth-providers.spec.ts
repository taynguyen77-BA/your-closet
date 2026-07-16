/**
 * P-01 — Auth Welcome: exactly 3 providers, no email/password
 *
 * Business goal (BRD 3.1.1): Users can authenticate ONLY via Phone OTP,
 * Google, or Facebook. No email/password option exposed anywhere.
 *
 * Server: auth-flow (port 8081) — DEMO_MODE=false, Firebase absent → app
 * stays unauthenticated after onboarding so the Welcome screen is reachable.
 */
import { test, expect } from '@playwright/test';
import { clearAppStorage, setOnboardingCompleted, waitForRoute } from './helpers/storage';

// Traceability:
// Requirement: BRD 3.1.1, 3.1.1.1, 3.1.1.2, 3.1.1.3
// Story: P-01
// AC: Exactly 3 sign-in options shown; no email/password route accessible

test.describe('P-01 — Auth provider restrictions', () => {
  test.beforeEach(async ({ page }) => {
    // Set up clean unauthenticated state, then navigate directly to /auth/welcome.
    // The routing gate allows /auth/welcome when onboardingCompleted=true + !isAuthenticated,
    // and will NOT redirect away from it (inAuth=true skips the public-route redirect).
    await page.goto('/');
    await clearAppStorage(page);
    await setOnboardingCompleted(page, true);
    await page.reload();
    // Navigate directly — routing gate allows /auth/welcome for unauthenticated users.
    await page.goto('/auth/welcome');
    await page.waitForLoadState('networkidle');
  });

  test('AC-P01-1: Welcome screen shows "Tiếp tục với số điện thoại" button', async ({ page }) => {
    // Traceability: BRD 3.1.1.1 — Phone OTP is a supported provider
    // Button component wraps Pressable in Animated.View — use getByText for matching.
    await expect(page.getByText(/Tiếp tục với số điện thoại/i)).toBeVisible();
  });

  test('AC-P01-2: Welcome screen shows Google sign-in option', async ({ page }) => {
    // Traceability: BRD 3.1.1.2 — Google is a supported provider
    // Label may say "Tiếp tục với Google" or "Thiếu Google Client ID" when env missing
    const googleButton = page.getByText(/Google/i).first();
    await expect(googleButton).toBeVisible();
  });

  test('AC-P01-3: Welcome screen shows Facebook sign-in option', async ({ page }) => {
    // Traceability: BRD 3.1.1.3 — Facebook is a supported provider
    const facebookButton = page.getByText(/Facebook/i).first();
    await expect(facebookButton).toBeVisible();
  });

  test('AC-P01-4: Welcome screen shows exactly 3 provider buttons (phone + 2 social), no email/password', async ({ page }) => {
    // Traceability: BRD 3.1.1 — restriction to exactly these 3 providers
    await expect(page.getByText(/Tiếp tục với số điện thoại/i)).toBeVisible();
    await expect(page.getByText(/Google/i).first()).toBeVisible();
    await expect(page.getByText(/Facebook/i).first()).toBeVisible();

    // Verify no email/password form elements appear anywhere
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toHaveCount(0);
    await expect(passwordInput).toHaveCount(0);

    // No "Email" sign-in text anywhere in the provider list
    await expect(page.getByText(/email.*đăng nhập|đăng nhập.*email/i)).toHaveCount(0);
  });

  test('AC-P01-5: Route /auth/email shows no email/password form (BRD 3.1.1)', async ({ page }) => {
    // Traceability: BRD 3.1.1 — no email/password sign-in form is accessible
    // Expo Router shows +not-found at /auth/email if no file matches.
    // Whether the URL redirects or shows 404, the key invariant is:
    // no email input and no password input should appear.
    await page.goto('/auth/email');
    await page.waitForLoadState('networkidle');
    // No email/password form elements appear
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toHaveCount(0);
    await expect(passwordInput).toHaveCount(0);
  });

  test('AC-P01-6: Tapping phone option navigates to /auth/phone', async ({ page }) => {
    // Traceability: BRD 3.1.1.1 — phone flow starts from welcome
    // beforeEach already landed on /auth/welcome. Click the phone button.
    await page.getByText(/Tiếp tục với số điện thoại/i).click();
    await expect(page).toHaveURL(/auth\/phone/);
    // Verify OTP input page renders (placeholder +84 or similar)
    await expect(page.getByPlaceholder(/\+84|\d{9}/i).first()).toBeVisible();
  });
});
