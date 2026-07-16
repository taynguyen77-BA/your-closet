/**
 * P-01 — OTP cooldown enforcement (AC 42 / 42.1 / 42.2)
 *
 * Business goal (BRD 3.1.1.3): after 3 incorrect OTP entries, the system
 * enforces a 60-second cooldown and disables the Resend action.
 *
 * Server: auth-flow (port 8081) — DEMO_MODE=false, Firebase absent.
 * verifyOtp() throws because phoneConfirmation is null (no prior loginWithPhone call).
 * The component treats every throw as a failed OTP attempt — correct here because
 * we are testing client-side counter/cooldown logic, not Firebase itself.
 *
 * Note on page.clock: installed BEFORE navigation in the expiry test so that
 * React's setInterval (created when cooldown starts) is under fake-clock control.
 */
import { test, expect } from '@playwright/test';
import { clearAppStorage, setOnboardingCompleted } from './helpers/storage';

// Traceability:
// Requirement: BRD 3.1.1.3
// Story: P-01
// AC: 42, 42.1, 42.2

async function reachOtpScreen(page: Parameters<typeof clearAppStorage>[0]) {
  await page.goto('/');
  await clearAppStorage(page);
  await setOnboardingCompleted(page, true);
  await page.reload();
  await page.goto('/auth/otp');
  await page.waitForLoadState('networkidle');
}

async function submitOtp(page: Parameters<typeof clearAppStorage>[0], code = '000000') {
  await page.getByPlaceholder('123456').fill(code);
  await page.getByText('Xác minh OTP').click();
  // Wait for async verifyOtp to resolve and component to re-render
  await page.waitForTimeout(400);
}

test.describe('AC 42 — OTP retry counter and 60s cooldown', () => {
  test('AC-42.1a: First incorrect OTP shows error message; verify & resend remain available', async ({ page }) => {
    // Traceability: BRD 3.1.1.3, AC 42.1
    await reachOtpScreen(page);
    await submitOtp(page);
    // AC 42.1 — specific error message on wrong attempt
    await expect(page.getByText('Mã OTP không đúng, thử lại')).toBeVisible();
    // Cooldown must NOT have started yet
    await expect(page.getByTestId('otp-cooldown')).toHaveCount(0);
    // Resend button still shows normal label (no countdown suffix)
    await expect(page.getByText('Gửi lại mã')).toBeVisible();
  });

  test('AC-42.1b: Second incorrect OTP still shows error; still no cooldown', async ({ page }) => {
    // Traceability: BRD 3.1.1.3, AC 42.1 — window allows 3 attempts
    await reachOtpScreen(page);
    await submitOtp(page, '111111');
    await submitOtp(page, '222222');
    await expect(page.getByText('Mã OTP không đúng, thử lại')).toBeVisible();
    await expect(page.getByTestId('otp-cooldown')).toHaveCount(0);
    // Resend still unlocked
    await expect(page.getByText('Gửi lại mã')).toBeVisible();
  });

  test('AC-42.2: Third incorrect OTP activates cooldown; Resend disabled with countdown label', async ({ page }) => {
    // Traceability: BRD 3.1.1.3, AC 42.2
    await reachOtpScreen(page);
    await submitOtp(page, '111111');
    await submitOtp(page, '222222');
    await submitOtp(page, '333333');
    // Cooldown countdown text must appear
    await expect(page.getByTestId('otp-cooldown')).toBeVisible();
    await expect(page.getByTestId('otp-cooldown')).toContainText(/Vui lòng chờ \d+s/);
    // Resend button label changes to show remaining seconds
    await expect(page.getByText(/Gửi lại mã \(\d+s\)/)).toBeVisible();
    // Input is read-only during cooldown (editable=false → readonly on RN Web)
    await expect(page.getByPlaceholder('123456')).toHaveAttribute('readonly', '');
  });

  test('AC-42.2 expiry: after 60s cooldown expires, counter resets and Resend returns to normal', async ({ page }) => {
    // Traceability: BRD 3.1.1.3, AC 42.2 — cooldown must fully lift after 60s
    await reachOtpScreen(page);
    // Trigger 3 failures — on the 3rd, the component will call setCooldownRemaining(60)
    // which triggers a useEffect that creates a setInterval.
    // Install fake clock BEFORE the 3rd submit so the setInterval is under clock control.
    await submitOtp(page, '111111');
    await submitOtp(page, '222222');
    await page.clock.install({ time: Date.now() });
    await submitOtp(page, '333333');
    await expect(page.getByTestId('otp-cooldown')).toBeVisible();
    // Run the clock forward 61 seconds, firing all intermediate setInterval callbacks
    await page.clock.runFor(61_000);
    // Cooldown indicator must disappear
    await expect(page.getByTestId('otp-cooldown')).toHaveCount(0);
    // Resend button back to normal (no second-count suffix)
    await expect(page.getByText('Gửi lại mã')).toBeVisible();
    await expect(page.getByText(/Gửi lại mã \(\d+s\)/)).toHaveCount(0);
    // Input is editable again (readonly attr removed)
    await expect(page.getByPlaceholder('123456')).not.toHaveAttribute('readonly', '');
  });
});
