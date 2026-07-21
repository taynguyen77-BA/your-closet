/**
 * P-03 — Guest access & GuestAuthModal
 *
 * Business goal (BRD 3.1.3): Unauthenticated users may browse public content
 * (community listings, trends). Actions that require an account (posting,
 * saving, messaging) show GuestAuthModal instead of proceeding.
 *
 * Server: auth-flow (port 8081) — DEMO_MODE=false
 * Guest state: complete onboarding → press "Trải nghiệm không đăng nhập" → isGuest=true
 *
 * Button component selector note:
 *  The app's Button component wraps Pressable in Animated.View, so
 *  getByRole('button', {name}) does NOT find it — use getByText(label) instead.
 *  Tab bar items have role="tab" and support getByRole('tab', {name}).
 */
import { test, expect } from '@playwright/test';
import { clearAppStorage, waitForRoute } from './helpers/storage';

// Traceability:
// Requirement: BRD 3.1.3
// Story: P-03
// AC: guest browse + modal gating + modal dismiss + modal → auth flow

async function reachGuestHome(page: Parameters<typeof waitForRoute>[0]) {
  await page.goto('/');
  await clearAppStorage(page);
  await page.reload();
  // Without onboardingCompleted, routing gate sends to /auth/onboarding.
  await waitForRoute(page, /auth\/onboarding/);
  // Click through onboarding slides (4 slides, 3 "Tiếp tục" buttons + 1 final CTA).
  // Button wraps Pressable in Animated.View — use getByText for label.
  for (let i = 0; i < 3; i++) {
    await page.getByText('Tiếp tục').click();
    await page.waitForTimeout(300);
  }
  // Click "Trải nghiệm không đăng nhập" (guest mode CTA) — starts guest session.
  await page.getByText('Trải nghiệm không đăng nhập').click();
  // After guest session starts, Expo Router routes to /(tabs) which renders at URL "/".
  await page.waitForURL(/^http:\/\/localhost:8081\/($|\()/, { timeout: 8000 });
}

test.describe('P-03 — Guest access & auth gate', () => {
  test('AC-P03-1: Guest can reach community listing feed without signing in', async ({ page }) => {
    // Traceability: BRD 3.1.3 — public browse allowed
    await reachGuestHome(page);
    // Navigate to community tab — tab bar items use role="tab".
    await page.getByRole('tab', { name: /Cộng đồng/i }).click();
    // Community hub should render — check for feed tab or marketplace tab
    await expect(page.getByText(/Bảng tin|Trao đổi|Mua bán/i).first()).toBeVisible();
  });

  test('AC-P03-2: Guest sees community listings (approved content visible)', async ({ page }) => {
    // Traceability: BRD 3.1.3 — public listings readable by guests
    await reachGuestHome(page);
    await page.goto('/(tabs)/community');
    // The marketplace tab shows approved listings — verify listings area renders
    await expect(page.getByText(/Góc trao đổi|Mua bán|Xu hướng|Bảng tin/i).first()).toBeVisible();
  });

  test('AC-P03-3: Guest "Đăng nhập để đăng" button visible on community feed', async ({ page }) => {
    // Traceability: BRD 3.1.3 — guest sees invite to sign in for posting
    await reachGuestHome(page);
    await page.goto('/(tabs)/community');
    // isPublicViewer=true → shows "Đăng nhập để đăng" text (Button component).
    // Button wraps Pressable in Animated.View — use getByText.
    await expect(page.getByText('Đăng nhập để đăng')).toBeVisible();
  });

  test('AC-P03-4: Guest clicking restricted action triggers GuestAuthModal', async ({ page }) => {
    // Traceability: BRD 3.1.3 — requireAccount() shows modal
    await reachGuestHome(page);
    await page.goto('/(tabs)/community');
    // Button component — use getByText to click.
    await page.getByText('Đăng nhập để đăng').click();
    // GuestAuthModal should appear
    await expect(page.getByText(/Tạo tài khoản để lưu phong cách/i)).toBeVisible();
  });

  test('AC-P03-5: GuestAuthModal "Tiếp tục trải nghiệm" dismisses modal', async ({ page }) => {
    // Traceability: BRD 3.1.3 — guest can dismiss modal and stay as guest
    await reachGuestHome(page);
    await page.goto('/(tabs)/community');
    await page.getByText('Đăng nhập để đăng').click();
    await expect(page.getByText(/Tạo tài khoản để lưu phong cách/i)).toBeVisible();
    // Dismiss button inside GuestAuthModal
    await page.getByText(/Tiếp tục trải nghiệm/i).click();
    // Modal closes
    await expect(page.getByText(/Tạo tài khoản để lưu phong cách/i)).not.toBeVisible();
    // Still on community page
    await expect(page).toHaveURL(/community/);
  });

  test('AC-P03-6: GuestAuthModal "Đăng nhập" navigates to /auth/welcome', async ({ page }) => {
    // Traceability: BRD 3.1.3 — modal routes guest to auth welcome
    await reachGuestHome(page);
    await page.goto('/(tabs)/community');
    await page.getByText('Đăng nhập để đăng').click();
    await expect(page.getByText(/Tạo tài khoản để lưu phong cách/i)).toBeVisible();
    await page.getByText(/Đăng nhập hoặc tạo tài khoản/i).click();
    await waitForRoute(page, /auth\/welcome/);
    await expect(page).toHaveURL(/auth\/welcome/);
  });

  test('AC-P03-7: Guest cannot access /community/create directly', async ({ page }) => {
    // Traceability: BRD 3.1.3 — create post is a gated route
    await reachGuestHome(page);
    await page.goto('/community/create');
    // Routing gate in _layout.tsx: guestBlockedRoute includes community/create → redirect to /(tabs)
    await expect(page).not.toHaveURL(/community\/create/);
  });
});
