/**
 * Playwright config — Your Closet mobile web E2E
 *
 * Two projects:
 *  auth-flow  → static dist-preview-unauth (baked DEMO_MODE=false, no Firebase config)
 *               so app starts unauthenticated → routes to /auth/welcome. Used for P-01, P-02, P-03.
 *  demo-auth  → static dist-preview (baked DEMO_MODE=true AUTH_BYPASS=true)
 *               so the app is immediately authenticated as mockUser. Used for P-06.
 *
 * Rebuild the SPAs with the SAME env the pipeline uses (.github/workflows/deploy.yml
 * "Build mobile SPA"). Setting only DEMO_MODE is not enough: authStore reads
 * EXPO_PUBLIC_DEMO_AUTH_BYPASS independently, so leaving it at the .env default of
 * true yields an "unauth" build that silently logs in as mockUser. --clear is
 * required too — EXPO_PUBLIC_* values are inlined at build time and a cached bundle
 * keeps the previous ones.
 *
 * Unauth SPA:
 *   EXPO_PUBLIC_DEMO_MODE=false EXPO_PUBLIC_DEMO_AUTH_BYPASS=false \
 *   EXPO_PUBLIC_FIREBASE_API_KEY= EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN= \
 *   EXPO_PUBLIC_FIREBASE_PROJECT_ID= EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET= \
 *   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID= EXPO_PUBLIC_FIREBASE_APP_ID= \
 *   npx expo export -p web --output-dir dist-preview-unauth --clear
 *
 * Auth SPA:
 *   EXPO_PUBLIC_DEMO_MODE=true EXPO_PUBLIC_DEMO_AUTH_BYPASS=true \
 *   npx expo export -p web --output-dir dist-preview --clear
 */
import { defineConfig, devices } from '@playwright/test';

const UNAUTH_PORT = 8081;
const AUTH_PORT   = 8082;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,           // sequential — two servers share state via app
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  projects: [
    {
      name: 'auth-flow',
      testMatch: ['**/p01-*.spec.ts', '**/p02-*.spec.ts', '**/p03-*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${UNAUTH_PORT}`,
        viewport: { width: 390, height: 844 },  // iPhone-like for RN web
      },
    },
    {
      name: 'demo-auth',
      testMatch: ['**/p06-*.spec.ts', '**/p07-*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${AUTH_PORT}`,
        viewport: { width: 390, height: 844 },
      },
    },
  ],

  webServer: [
    {
      // Unauthenticated: static SPA built with DEMO_MODE=false (via .env.local override)
      // Firebase config is absent → assertFirebaseReady() fails → isAuthenticated=false → /auth/welcome
      command: `npx serve dist-preview-unauth --single --listen ${UNAUTH_PORT}`,
      url: `http://localhost:${UNAUTH_PORT}`,
      timeout: 15_000,
      reuseExistingServer: true,
    },
    {
      // Authenticated: serve pre-built dist-preview (baked DEMO_MODE=true AUTH_BYPASS=true)
      command: `npx serve dist-preview --single --listen ${AUTH_PORT}`,
      url: `http://localhost:${AUTH_PORT}`,
      timeout: 15_000,
      reuseExistingServer: true,
    },
  ],
});
