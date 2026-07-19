/**
 * P-07..P-14 — Package 2 (AI Routing + Closet) E2E
 *
 * Server: demo-auth (port 8082) — dist-preview built with EXPO_PUBLIC_DEMO_MODE=true
 * EXPO_PUBLIC_DEMO_AUTH_BYPASS=true → app starts authenticated as mockUser, closet
 * seeded from mockClothing (c1 Áo linen beige/worn12, c2 Quần wide-leg/8,
 * c3 Giày sandal/15, c4 Túi crossbody/20).
 *
 * SCOPE NOTE: The AI Review Draft flow (image pick → clothing_detection → enhance →
 * candidate pick) and bulk-upload ≤5 enforcement rely on native expo-image-picker,
 * which cannot be driven deterministically in RN-web Playwright. Those are covered by
 * unit tests (admin ai-resolver, 25 tests) at the correct layer and reported as e2e
 * coverage gaps, NOT invented here. API routes (/api/ai/clothing/*, /api/admin/ai-routing)
 * live in the separate Next.js admin app and require a live backend + Firebase token +
 * GOOGLE_AI_API_KEY — out of scope for the mobile-web SPA under test.
 */
import { test, expect } from '@playwright/test';
import { clearAppStorage, setOnboardingCompleted, waitForRoute } from './helpers/storage';

// Traceability:
// Requirement: BRD 3.2.1 (add/bulk), 3.2.4 (correct fields), 3.2.5 (CRUD/view), 3.2.6 (limit)
// Story: P-09 (item CRUD), P-10 (bulk entry), P-13 (item detail + wear count)
// AC: AI Closet AC 1–30 (v1.5, superseded deltas only in v2_1) — mapped to BRD 3.2.x

test.describe('Package 2 — Closet (authenticated demo)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppStorage(page);
    await setOnboardingCompleted(page, true);
    await page.reload();
    await waitForRoute(page, /\(tabs\)|tabs\/|localhost:8082\/?$/);
    await page.goto('/closet');
  });

  // ── Closet list / view (BRD 3.2.5) ───────────────────────────────────────

  test('AC-P2-1: Closet list renders all seeded items for authenticated user', async ({ page }) => {
    // Traceability: BRD 3.2.5 — user can view their closet
    await expect(page.getByText('Áo linen beige')).toBeVisible();
    await expect(page.getByText('Quần wide-leg trắng')).toBeVisible();
    await expect(page.getByText('Giày sandal nude')).toBeVisible();
    await expect(page.getByText('Túi crossbody đen')).toBeVisible();
  });

  test('AC-P2-2: Add-item entry points present — single + bulk (P-10)', async ({ page }) => {
    // Traceability: BRD 3.2.1 — single add ("Thêm món") and bulk add ("Thêm nhiều")
    await expect(page.getByText('Thêm món')).toBeVisible();
    await expect(page.getByText('Thêm nhiều')).toBeVisible();
  });

  test('AC-P2-3: Filter pill narrows list by type (bag)', async ({ page }) => {
    // Traceability: BRD 3.2.5 — filter closet by category
    await page.getByText('Túi', { exact: true }).click();
    await expect(page.getByText('Túi crossbody đen')).toBeVisible();
    await expect(page.getByText('Áo linen beige')).toHaveCount(0);
  });

  test('AC-P2-4: Search narrows list by name token', async ({ page }) => {
    // Traceability: BRD 3.2.5 — search within closet
    await page.getByPlaceholder('Tìm trong tủ đồ...').fill('linen');
    await expect(page.getByText('Áo linen beige')).toBeVisible();
    await expect(page.getByText('Túi crossbody đen')).toHaveCount(0);
  });

  // ── Item detail (BRD 3.2.4, 3.2.5) ────────────────────────────────────────

  test('AC-P2-5: Item detail shows wear count (P-13)', async ({ page }) => {
    // Traceability: BRD 3.2.5 — timesWorn surfaced on detail; c1 worn 12 times
    await page.goto('/closet/c1');
    await expect(page.getByText('Đã mặc 12 lần')).toBeVisible();
  });

  test('AC-P2-6: Item detail edit modal exposes all correctable fields (P-09/3.2.4)', async ({ page }) => {
    // Traceability: BRD 3.2.4 — user can correct any field: name/color/material/style/type/season/tags
    await page.goto('/closet/c1');
    await page.getByText('Chỉnh sửa').click();
    await expect(page.getByPlaceholder('Tên món đồ')).toBeVisible();
    await expect(page.getByPlaceholder('Màu sắc')).toBeVisible();
    await expect(page.getByPlaceholder('Chất liệu')).toBeVisible();
    await expect(page.getByPlaceholder('Phong cách')).toBeVisible();
    await expect(page.getByPlaceholder(/Loại/)).toBeVisible();
    await expect(page.getByPlaceholder(/Mùa/)).toBeVisible();
    await expect(page.getByPlaceholder(/Tags/)).toBeVisible();
  });

  test('AC-P2-7: Item detail exposes delete action (BRD 3.2.5)', async ({ page }) => {
    // Traceability: BRD 3.2.5 — user can delete a closet item
    await page.goto('/closet/c1');
    await expect(page.getByText('Xóa món đồ')).toBeVisible();
  });

  test('AC-P2-8: Editing a field persists the corrected value (BRD 3.2.4)', async ({ page }) => {
    // Traceability: BRD 3.2.4 — corrected value persists, not the original
    await page.goto('/closet/c1');
    await page.getByText('Chỉnh sửa').click();
    const nameInput = page.getByPlaceholder('Tên món đồ');
    await nameInput.fill('Áo linen beige EDITED');
    await page.getByText('Lưu thay đổi').click();
    // Modal closes, hero/title reflects edited name
    await expect(page.getByText('Áo linen beige EDITED').first()).toBeVisible();
  });

  // ── Delete confirm (BRD 3.2.5) — custom modal replacing native Alert (Bước 3b) ──
  // This flow was previously uncoverable: the native Alert.alert cannot be driven in
  // the RN-web Playwright harness. The custom modal now makes it testable.

  test('AC-P2-9: Delete action opens a confirmation dialog (not a native alert)', async ({ page }) => {
    // Traceability: BRD 3.2.5 — deletion is confirmed before it happens
    await page.goto('/closet/c2');
    await page.getByText('Xóa món đồ').click();
    await expect(page.getByText('Xóa món đồ?')).toBeVisible();
    await expect(page.getByText('Thao tác này không thể hoàn tác.')).toBeVisible();
    await expect(page.getByText('Hủy', { exact: true })).toBeVisible();
  });

  test('AC-P2-10: Cancelling the dialog keeps the item and stays on detail', async ({ page }) => {
    // Traceability: BRD 3.2.5 — cancel must not delete
    await page.goto('/closet/c2');
    await page.getByText('Xóa món đồ').click();
    await page.getByText('Hủy', { exact: true }).click();
    // Dialog dismissed, still on the item detail (title still shown, not deleted)
    await expect(page.getByText('Thao tác này không thể hoàn tác.')).toHaveCount(0);
    await expect(page.getByText('Quần wide-leg trắng').first()).toBeVisible();
    // And the item still exists in the closet list
    await page.goto('/closet');
    await expect(page.getByText('Quần wide-leg trắng')).toBeVisible();
  });

  test('AC-P2-11: Confirming runs the delete and leaves the item detail for the list', async ({ page }) => {
    // Traceability: BRD 3.2.5 — confirm executes the deletion.
    // NOTE: the demo build re-seeds mockClothing from initialize() on every route change
    // (appStore.ts), so a deleted item reappears after the post-delete navigation and
    // "gone from the list" is not assertable end-to-end here. We assert the observable
    // confirm side-effect — it runs deleteClothing + navigates from the detail to the
    // closet list, whereas cancel (AC-P2-10) stays on the detail. Store-level removal is
    // the deleteClothing filter in appStore. This same re-seed masked the flow under the
    // old native Alert too; it was simply never testable there.
    await page.goto('/closet/c2');
    await expect(page.getByText('PHÂN TÍCH TỦ ĐỒ')).toBeVisible(); // detail-only marker
    await page.getByText('Xóa món đồ').click();
    await page.getByText('Xóa', { exact: true }).click();
    // Left the detail for the closet list (confirm ran deleteClothing + router.replace)
    await expect(page.getByText('SỨC KHỎE TỦ ĐỒ')).toBeVisible(); // list-only marker
    await expect(page.getByText('PHÂN TÍCH TỦ ĐỒ')).toHaveCount(0);
  });

  test('AC-P2-12: Escape key cancels the dialog (native-Alert parity)', async ({ page }) => {
    // Traceability: BRD 3.2.5 — the custom dialog restores the keyboard dismissal the
    // native Alert provided. (Android hardware back → onRequestClose is native and not
    // exercisable in web Playwright; Escape is the web-observable equivalent.)
    await page.goto('/closet/c2');
    await page.getByText('Xóa món đồ').click();
    await expect(page.getByText('Thao tác này không thể hoàn tác.')).toBeVisible();
    await page.keyboard.press('Escape');
    // Dialog dismissed without deleting; still on the item detail
    await expect(page.getByText('Thao tác này không thể hoàn tác.')).toHaveCount(0);
    await expect(page.getByText('PHÂN TÍCH TỦ ĐỒ')).toBeVisible();
  });
});
