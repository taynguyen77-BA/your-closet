/**
 * P-04 — migrate-tier-enum.ts integration tests
 *
 * Traceability:
 * Story: P-04
 * BRD: 3.16.1–3.16.3 (tier enum migration free/premium/elite → free/pro/premium)
 *
 * Prerequisites: Firestore emulator running at 127.0.0.1:8080
 *   firebase emulators:start --only firestore
 *
 * These tests spawn the migration script as a child process (the script has top-level
 * side-effects that run on import, so spawning is the only safe isolation boundary).
 *
 * Field constraint: users collection uses "plan" (MembershipPlan = 'free'|'pro'|'premium').
 * The script also handles a legacy "tier" field and "subscriptions" / "plan_limits"
 * collections — all verified below.
 *
 * Nothing in this file touches the real Firestore project.
 * FIRESTORE_EMULATOR_HOST is required for all admin SDK calls in beforeEach/afterEach.
 */

import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const SCRIPT = resolve(ROOT, 'admin/scripts/migrate-tier-enum.ts');
const TSX = resolve(ROOT, 'admin/node_modules/.bin/tsx');

// Shared output dir for all migration report files generated during tests
const TMP_OUTPUT = join(tmpdir(), 'p04-migration-test-reports');
mkdirSync(TMP_OUTPUT, { recursive: true });

// Emulator coordinates — must match firebase.json
const EMULATOR_HOST = '127.0.0.1:8080';
const PROJECT_ID = 'demo-your-closet';

// Base env for every script spawn: emulator is always set so no real project is touched.
const EMULATOR_ENV = {
  ...process.env,
  FIRESTORE_EMULATOR_HOST: EMULATOR_HOST,
  FIREBASE_PROJECT_ID: PROJECT_ID,
  TIER_MIGRATION_OUTPUT_DIR: TMP_OUTPUT,
};

// ─── Firestore admin client (emulator only) ──────────────────────────────────

async function getDb() {
  const { initializeApp, getApps, getApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  if (!getApps().length) {
    initializeApp({ projectId: PROJECT_ID });
  }
  return getFirestore(getApp());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function clearCollection(db: any, collectionName: string) {
  const snap = await db.collection(collectionName).get();
  const batch = db.batch();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snap.docs.forEach((doc: any) => batch.delete(doc.ref));
  if (snap.size > 0) await batch.commit();
}

async function seedUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  id: string,
  data: Record<string, unknown>,
) {
  await db.collection('users').doc(id).set(data);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function runScript(args: string[], env: NodeJS.ProcessEnv = EMULATOR_ENV) {
  return spawnSync(TSX, [SCRIPT, ...args], {
    encoding: 'utf8',
    env,
    timeout: 30_000,
  });
}

// ─── Before/after ────────────────────────────────────────────────────────────

// Firestore emulator guard: skip all tests if emulator is unreachable
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
beforeAll(async () => {
  try {
    // Set env before any firebase-admin import so it routes to emulator
    process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;
    process.env.FIREBASE_PROJECT_ID = PROJECT_ID;
    db = await getDb();
    // Probe: a lightweight read that fails fast when emulator is down
    await db.collection('_probe').limit(1).get();
  } catch {
    throw new Error(
      `Firestore emulator not reachable at ${EMULATOR_HOST}. ` +
        'Start it with: firebase emulators:start --only firestore',
    );
  }
});

beforeEach(async () => {
  // Wipe all collections used by the migration script
  await Promise.all([
    clearCollection(db, 'users'),
    clearCollection(db, 'subscriptions'),
    clearCollection(db, 'plan_limits'),
  ]);
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('P-04 — migrate-tier-enum.ts', () => {

  // ── (a) dry-run mode ───────────────────────────────────────────────────────

  describe('(a) dry-run: does not write to Firestore', () => {
    test('elite user tier is NOT changed in dry-run mode', async () => {
      await seedUser(db, 'user-elite', {
        email: 'elite@example.com',
        displayName: 'Elite User',
        plan: 'elite',
        tier: 'elite',
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      const result = runScript(['--target-env=LOCAL']); // no --execute

      expect(result.status).toBe(0);
      // Script self-reports dry-run
      expect(result.stdout).toContain('dry-run');

      const doc = await db.collection('users').doc('user-elite').get();
      const data = doc.data()!;
      // Dry-run must leave the document completely unchanged
      expect(data.plan).toBe('elite');
      expect(data.tier).toBe('elite');
      expect(data.email).toBe('elite@example.com');
      expect(data.displayName).toBe('Elite User');
    });

    test('free and premium users are not touched in dry-run', async () => {
      await Promise.all([
        seedUser(db, 'user-free', { email: 'free@example.com', plan: 'free', createdAt: 'ts' }),
        seedUser(db, 'user-premium', { email: 'premium@example.com', plan: 'premium', createdAt: 'ts' }),
      ]);

      const result = runScript(['--target-env=LOCAL']);
      expect(result.status).toBe(0);

      const [freeDoc, premDoc] = await Promise.all([
        db.collection('users').doc('user-free').get(),
        db.collection('users').doc('user-premium').get(),
      ]);
      expect(freeDoc.data()!.plan).toBe('free');
      expect(premDoc.data()!.plan).toBe('premium');
    });
  });

  // ── (b) execute mode safety gate ──────────────────────────────────────────

  describe('(b) execute mode: hard-blocks without FIRESTORE_EMULATOR_HOST', () => {
    test('process.exit(1) when --execute is passed without FIRESTORE_EMULATOR_HOST', () => {
      const env = {
        ...process.env,
        FIREBASE_PROJECT_ID: PROJECT_ID,
        TIER_MIGRATION_OUTPUT_DIR: TMP_OUTPUT,
        // Explicitly unset the emulator host
        FIRESTORE_EMULATOR_HOST: undefined,
      };
      delete env.FIRESTORE_EMULATOR_HOST;

      const result = spawnSync(TSX, [SCRIPT, '--execute', '--target-env=LOCAL'], {
        encoding: 'utf8',
        env,
        timeout: 10_000,
      });

      // enforceEnvironmentGate() calls process.exit(1)
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('FIRESTORE_EMULATOR_HOST');
      expect(result.stderr).toContain('Aborting');
    });
  });

  // ── (c) execute on emulator: actual data migration ─────────────────────────

  describe('(c) execute on emulator: migration correctness', () => {
    test('elite → premium; free and premium unchanged; other fields preserved', async () => {
      // Seed three users with representative tiers
      await Promise.all([
        seedUser(db, 'user-elite-1', {
          email: 'elite@example.com',
          displayName: 'Elite User',
          plan: 'elite',
          tier: 'elite',
          createdAt: '2024-01-01T00:00:00.000Z',
          avatarUrl: 'https://example.com/avatar.png',
        }),
        seedUser(db, 'user-free-1', {
          email: 'free@example.com',
          displayName: 'Free User',
          plan: 'free',
          createdAt: '2024-03-01T00:00:00.000Z',
        }),
        seedUser(db, 'user-premium-1', {
          email: 'premium@example.com',
          displayName: 'Premium User',
          plan: 'premium',
          tier: 'premium',
          createdAt: '2024-06-01T00:00:00.000Z',
        }),
      ]);

      const result = runScript(['--execute', '--target-env=LOCAL']);

      expect(result.status).toBe(0);

      const [eliteDoc, freeDoc, premDoc] = await Promise.all([
        db.collection('users').doc('user-elite-1').get(),
        db.collection('users').doc('user-free-1').get(),
        db.collection('users').doc('user-premium-1').get(),
      ]);

      // elite → premium (both plan and tier fields)
      const eliteData = eliteDoc.data()!;
      expect(eliteData.plan).toBe('premium');
      expect(eliteData.tier).toBe('premium');
      // All other fields must be preserved (not overwritten or lost)
      expect(eliteData.email).toBe('elite@example.com');
      expect(eliteData.displayName).toBe('Elite User');
      expect(eliteData.avatarUrl).toBe('https://example.com/avatar.png');
      expect(eliteData.createdAt).toBe('2024-01-01T00:00:00.000Z');

      // free stays free
      const freeData = freeDoc.data()!;
      expect(freeData.plan).toBe('free');
      expect(freeData.email).toBe('free@example.com');
      expect(freeData.displayName).toBe('Free User');
      expect(freeData.createdAt).toBe('2024-03-01T00:00:00.000Z');

      // premium stays premium
      const premData = premDoc.data()!;
      expect(premData.plan).toBe('premium');
      expect(premData.tier).toBe('premium');
      expect(premData.email).toBe('premium@example.com');
      expect(premData.displayName).toBe('Premium User');
    });

    test('user with only plan:elite (no tier field) is migrated correctly', async () => {
      await seedUser(db, 'user-plan-only', {
        email: 'plan-only@example.com',
        plan: 'elite',
        // no tier field
        createdAt: '2024-01-15T00:00:00.000Z',
      });

      const result = runScript(['--execute', '--target-env=LOCAL']);
      expect(result.status).toBe(0);

      const doc = await db.collection('users').doc('user-plan-only').get();
      const data = doc.data()!;
      expect(data.plan).toBe('premium');
      expect(data.email).toBe('plan-only@example.com');
      expect(data.createdAt).toBe('2024-01-15T00:00:00.000Z');
    });

    test('subscriptions with tier:elite are migrated to premium', async () => {
      await db.collection('subscriptions').doc('sub-elite').set({
        userId: 'user-elite-1',
        tier: 'elite',
        plan: 'elite',
        startDate: '2024-01-01',
      });

      const result = runScript(['--execute', '--target-env=LOCAL']);
      expect(result.status).toBe(0);

      const doc = await db.collection('subscriptions').doc('sub-elite').get();
      const data = doc.data()!;
      expect(data.tier).toBe('premium');
      expect(data.plan).toBe('premium');
      // Other fields preserved
      expect(data.userId).toBe('user-elite-1');
      expect(data.startDate).toBe('2024-01-01');
    });

    test('plan_limits/elite is renamed to plan_limits/premium; plan_limits/premium renamed to pro', async () => {
      await Promise.all([
        db.collection('plan_limits').doc('premium').set({ id: 'premium', label: 'Premium', maxItems: 100 }),
        db.collection('plan_limits').doc('elite').set({ id: 'elite', label: 'Elite', maxItems: 500 }),
      ]);

      const result = runScript(['--execute', '--target-env=LOCAL']);
      expect(result.status).toBe(0);

      const [proDoc, premiumDoc, eliteDoc] = await Promise.all([
        db.collection('plan_limits').doc('pro').get(),
        db.collection('plan_limits').doc('premium').get(),
        db.collection('plan_limits').doc('elite').get(),
      ]);

      // Old premium → now pro
      expect(proDoc.exists).toBe(true);
      expect(proDoc.data()!.id).toBe('pro');
      expect(proDoc.data()!.label).toBe('Pro');
      expect(proDoc.data()!.maxItems).toBe(100);

      // Old elite → now premium
      expect(premiumDoc.exists).toBe(true);
      expect(premiumDoc.data()!.id).toBe('premium');
      expect(premiumDoc.data()!.label).toBe('Premium');
      expect(premiumDoc.data()!.maxItems).toBe(500);

      // Old elite doc deleted
      expect(eliteDoc.exists).toBe(false);
    });

    test('audit report JSON is written after execute run', async () => {
      const { readdirSync } = await import('node:fs');

      const before = readdirSync(TMP_OUTPUT).length;

      runScript(['--execute', '--target-env=LOCAL']);

      const after = readdirSync(TMP_OUTPUT);
      expect(after.length).toBeGreaterThan(before);
      // Report file is named with tier-migration prefix
      const latestReport = after.filter((f) => f.startsWith('tier-migration-')).at(-1);
      expect(latestReport).toBeDefined();
    });
  });
});
