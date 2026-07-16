/**
 * Playwright config — Your Closet mobile web E2E
 *
 * Two projects:
 *  auth-flow  → static dist-preview-unauth (baked DEMO_MODE=false, no Firebase config)
 *               so app starts unauthenticated → routes to /auth/welcome. Used for P-01, P-02, P-03.
 *  demo-auth  → static dist-preview (baked DEMO_MODE=true AUTH_BYPASS=true)
 *               so the app is immediately authenticated as mockUser. Used for P-06.
 *
 * To rebuild unauth SPA: create .env.local with DEMO_MODE=false, run
 *   npx expo export -p web --output-dir dist-preview-unauth
 * then delete .env.local.
 * To rebuild auth SPA:
 *   npx expo export -p web --output-dir dist-preview
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
