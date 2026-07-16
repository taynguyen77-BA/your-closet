/**
 * P-06 — Biometric, logout, delete account, profile edit scope
 *
 * Business goal (BRD 3.1.5–3.1.8):
 *  - Biometric preference toggle in settings (local convenience, no Firebase change)
 *  - Logout clears session, preserves onboardingCompleted
 *  - Delete account requires explicit acknowledgment + re-authentication before button enables
 *  - Profile edit sends ONLY displayName / avatarUrl (no plan/tier/quota changes)
 *
 * Server: demo-auth (port 8082) — dist-preview with DEMO_MODE=true AUTH_BYPASS=true
 * so the app starts immediately authenticated as mockUser.
 */
import { test, expect } from '@playwright/test';
import { setOnboardingCompleted, clearAppStorage, waitForRoute } from './helpers/storage';

// Traceability:
// Requirement: BRD 3.1.5, 3.1.6, 3.1.7.1–3.1.7.3, 3.1.8
// Story: P-06
// AC: biometric toggle, logout flow, delete account gating, profile edit field scope

test.describe('P-06 — Authenticated profile & account management', () => {
  test.beforeEach(async ({ page }) => {
    // dist-preview has DEMO_MODE=true AUTH_BYPASS=true baked in, so Firebase is bypassed
    // and the app sets mockUser as authenticated. But the routing gate also checks
    // onboardingCompleted in localStorage, so we must set it before the app renders.
    await page.goto('/');
    await clearAppStorage(page);
    await setOnboardingCompleted(page, true);
    await page.reload();
    await waitForRoute(page, /\(tabs\)|tabs\/|^http:\/\/localhost:8082\/$/);
  });

  // ── Biometric (BRD 3.1.5) ──────────────────────────────────────────────────

  test('AC-P06-1: Settings page shows biometric toggle', async ({ page }) => {
    // Traceability: BRD 3.1.5 — biometric is a local preference toggle
    await page.goto('/settings');
    await expect(page.getByText(/Face ID|Vân tay|sinh trắc/i).first()).toBeVisible();
    // Switch/toggle is present
    const biometricSwitch = page.locator('[role="switch"]').first();
    await expect(biometricSwitch).toBeVisible();
  });

  test('AC-P06-2: Settings page has logout button', async ({ page }) => {
    // Traceability: BRD 3.1.6 — logout is accessible from settings
    // Note: Button wraps Pressable in Animated.View — accessible name not computed by Playwright.
    // Use getByText which matches the inner AppText label.
    await page.goto('/settings');
    await expect(page.getByText('Đăng xuất')).toBeVisible();
  });

  test('AC-P06-3: Settings page has delete-account navigation', async ({ page }) => {
    // Traceability: BRD 3.1.7 — delete account entry point
    await page.goto('/settings');
    // Match "Xoá tài khoản" (exact) to avoid matching "Xoá tài khoản vĩnh viễn"
    await expect(page.getByText('Xoá tài khoản', { exact: true })).toBeVisible();
  });

  // ── Delete account (BRD 3.1.7) ────────────────────────────────────────────

  test('AC-P06-4: Delete-account page renders acknowledgment switch', async ({ page }) => {
    // Traceability: BRD 3.1.7.3 — user must explicitly acknowledge before delete
    await page.goto('/profile/delete-account');
    await expect(page.getByText(/không thể hoàn tác/i).first()).toBeVisible();
    const ackSwitch = page.locator('[role="switch"]').first();
    await expect(ackSwitch).toBeVisible();
  });

  test('AC-P06-5: Delete button is disabled until acknowledgment switch toggled', async ({ page }) => {
    // Traceability: BRD 3.1.7.3 — delete button gated behind acknowledgment
    // Raw Pressable with disabled=true → opacity 0.5 in RN Web. Role propagation varies.
    // Verify text is visible, then check an ancestor has opacity 0.5 via JS evaluation.
    await page.goto('/profile/delete-account');
    const deleteText = page.getByText('Xoá tài khoản vĩnh viễn');
    await expect(deleteText).toBeVisible();
    const isOpacityHalf = await deleteText.evaluate((el) => {
      let node: Element | null = el;
      while (node) {
        const opacity = parseFloat(window.getComputedStyle(node).opacity);
        if (opacity < 1) return true;
        node = node.parentElement;
      }
      return false;
    });
    expect(isOpacityHalf).toBe(true);
  });

  test('AC-P06-6: Toggling acknowledgment switch reveals re-auth section', async ({ page }) => {
    // Traceability: BRD 3.1.7.1 — re-auth required before delete allowed
    await page.goto('/profile/delete-account');
    // Toggle the acknowledgment switch
    const ackSwitch = page.locator('[role="switch"]').first();
    await ackSwitch.click();
    // Re-auth section appears: "Xác minh lại danh tính"
    await expect(page.getByText(/Xác minh lại danh tính/i)).toBeVisible();
  });

  test('AC-P06-7: Delete button remains disabled until re-auth completed', async ({ page }) => {
    // Traceability: BRD 3.1.7.1 — delete button gates on both acknowledged AND reauthenticated
    await page.goto('/profile/delete-account');
    const ackSwitch = page.locator('[role="switch"]').first();
    await ackSwitch.click();
    // acknowledged=true but reauthenticated=false → delete button still disabled (opacity 0.5)
    const deleteText = page.getByText('Xoá tài khoản vĩnh viễn');
    await expect(deleteText).toBeVisible();
    const isOpacityHalf = await deleteText.evaluate((el) => {
      let node: Element | null = el;
      while (node) {
        if (parseFloat(window.getComputedStyle(node).opacity) < 1) return true;
        node = node.parentElement;
      }
      return false;
    });
    expect(isOpacityHalf).toBe(true);
  });

  // ── Profile edit field scope (BRD 3.1.8) ──────────────────────────────────

  test('AC-P06-8: Profile edit page shows only name and avatar fields', async ({ page }) => {
    // Traceability: BRD 3.1.8 — only displayName/avatarUrl sent, no plan/tier/quota
    // Button component wraps Pressable in Animated.View — use getByText for label matching.
    await page.goto('/profile/edit');
    // Name input is present
    await expect(page.getByPlaceholder(/Tên hiển thị/i)).toBeVisible();
    // Avatar change button
    await expect(page.getByText('Đổi avatar')).toBeVisible();
    // Save button
    await expect(page.getByText(/Lưu hồ sơ/i)).toBeVisible();
  });

  test('AC-P06-9: Profile edit page has NO plan, tier, quota, or payment fields', async ({ page }) => {
    // Traceability: BRD 3.1.8 — plan/tier/quota fields must not be editable by user
    await page.goto('/profile/edit');
    const planInput = page.locator('input[placeholder*="plan" i], input[placeholder*="tier" i], input[placeholder*="quota" i]');
    const paymentInput = page.locator('input[type="number"][placeholder*="price" i]');
    await expect(planInput).toHaveCount(0);
    await expect(paymentInput).toHaveCount(0);
    // No text mentioning these dangerous fields
    await expect(page.getByText(/aiUsage|aiMonthly|closetItemLimit|plan.*free|premium/i)).toHaveCount(0);
  });

  test('AC-P06-10: Save button disabled when name field is empty', async ({ page }) => {
    // Traceability: BRD 3.1.8 — displayName is required
    // Button component wraps Pressable in Animated.View; disabled → opacity 0.5.
    await page.goto('/profile/edit');
    const nameInput = page.getByPlaceholder(/Tên hiển thị/i);
    await nameInput.fill('');
    const saveText = page.getByText(/Lưu hồ sơ/i);
    await expect(saveText).toBeVisible();
    const isOpacityHalf = await saveText.evaluate((el) => {
      let node: Element | null = el;
      while (node) {
        if (parseFloat(window.getComputedStyle(node).opacity) < 1) return true;
        node = node.parentElement;
      }
      return false;
    });
    expect(isOpacityHalf).toBe(true);
  });
});
