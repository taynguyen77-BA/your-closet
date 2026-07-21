/**
 * Helpers to manipulate Expo's AsyncStorage (maps to localStorage on web)
 * so tests can set up known state without going through the full auth flow.
 */
import type { Page } from '@playwright/test';

const ONBOARDING_KEY = 'your_closet_onboarding_completed';
const GUEST_SESSION_KEY = 'your_closet_guest_session';

export async function setOnboardingCompleted(page: Page, value: boolean) {
  await page.evaluate(
    ([k, v]: [string, string]) => localStorage.setItem(k, v),
    [ONBOARDING_KEY, value ? 'true' : 'false'],
  );
}

export async function setGuestSession(page: Page, value: boolean) {
  await page.evaluate(
    ([k, v]: [string, string]) => {
      if (v === 'true') localStorage.setItem(k, v);
      else localStorage.removeItem(k);
    },
    [GUEST_SESSION_KEY, value ? 'true' : 'false'],
  );
}

export async function clearAppStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

/** Navigate to root and wait for the routing effect to settle */
export async function waitForRoute(page: Page, urlPattern: RegExp, timeout = 8000) {
  await page.waitForURL(urlPattern, { timeout });
}
