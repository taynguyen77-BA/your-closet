/**
 * P-05 — Firestore Security Rules unit tests
 *
 * Uses @firebase/rules-unit-testing against the local Firestore emulator.
 * Run with: firebase emulators:exec --only firestore "npm test" (from this directory)
 *   OR:     start emulator separately, then run npm test
 *
 * Traceability:
 *   Requirement: BRD 3.1.5 (users own-data isolation)
 *   Rules file:  firebase/firestore.rules
 *   AC:
 *     P05-1  User A cannot read/write User B's document
 *     P05-2  Non-admin cannot read adminUsers
 *     P05-3  User cannot set plan field via raw Firestore write (only server may)
 *     P05-4  Unauthenticated guest reads 5 public collections, cannot write
 *     P05-5  Package-2+ collections (clothes/outfits/events) deny all to unauthenticated
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_PATH = resolve(__dirname, '../../firebase/firestore.rules');

let testEnv: RulesTestEnvironment;

const USER_A = 'user-a-uid';
const USER_B = 'user-b-uid';

// Minimal valid user profile matching the 'create' rule requirements
const validUserProfile = (uid: string) => ({
  id: uid,
  uid,
  name: 'Test User',
  displayName: 'Test User',
  username: '',
  email: 'test@example.com',
  avatarUrl: '',
  authProvider: 'phone' as const,
  phoneNumber: '+84900000001',
  provider: 'phone' as const,
  biometricEnabled: false,
  hasCompletedStyleSurvey: false,
  styleSurveySkipped: false,
  styleProfileCompletionPercent: 0,
  plan: 'free' as const,
  aiUsageRemaining: 10,
  aiUsageMonthlyLimit: 10,
  aiQuotaPeriod: '2026-07',
  closetItemLimit: 50,
  closetItemCount: 0,
  status: 'active' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  stylePreferences: {
    preferredStyles: [],
    favoriteColors: [],
    lifestyleOccasions: [],
    fashionConfidence: '',
    updatedAt: new Date().toISOString(),
  },
});

/** Firebase token claims that satisfy usesSupportedConsumerAuthProvider() rule */
const phoneTokenClaims = {
  firebase: { sign_in_provider: 'phone' as const },
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-your-closet',
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

// ── Helper factories ─────────────────────────────────────────────────────────

function asUser(uid: string, additionalClaims = phoneTokenClaims) {
  return testEnv.authenticatedContext(uid, additionalClaims);
}

function asGuest() {
  return testEnv.unauthenticatedContext();
}

async function seedUser(uid: string) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', uid), validUserProfile(uid));
  });
}

async function seedPublicDoc(collectionName: string, docId: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), collectionName, docId), data);
  });
}

// ── P05-1: users isolation ───────────────────────────────────────────────────

describe('P05-1 — users: owner isolation (User A ≠ User B)', () => {
  test('User A can read their own document', async () => {
    await seedUser(USER_A);
    const ctx = asUser(USER_A);
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'users', USER_A)));
  });

  test('User A cannot read User B\'s document', async () => {
    await seedUser(USER_B);
    const ctx = asUser(USER_A);
    await assertFails(getDoc(doc(ctx.firestore(), 'users', USER_B)));
  });

  test('User A cannot write to User B\'s document', async () => {
    await seedUser(USER_B);
    const ctx = asUser(USER_A);
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'users', USER_B), { name: 'Attacker' }),
    );
  });

  test('User A cannot delete User B\'s document', async () => {
    await seedUser(USER_B);
    const ctx = asUser(USER_A);
    await assertFails(deleteDoc(doc(ctx.firestore(), 'users', USER_B)));
  });

  test('User A can update their own allowed fields', async () => {
    await seedUser(USER_A);
    const ctx = asUser(USER_A);
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), 'users', USER_A), {
        name: 'New Name',
        displayName: 'New Name',
        updatedAt: new Date().toISOString(),
      }),
    );
  });
});

// ── P05-2: adminUsers access control ────────────────────────────────────────

describe('P05-2 — adminUsers: non-admin cannot read', () => {
  test('Regular authenticated user cannot read adminUsers', async () => {
    await seedPublicDoc('adminUsers', 'admin-1', { email: 'admin@test.com', role: 'super_admin', status: 'active' });
    const ctx = asUser(USER_A);
    await assertFails(getDoc(doc(ctx.firestore(), 'adminUsers', 'admin-1')));
  });

  test('Unauthenticated user cannot read adminUsers', async () => {
    await seedPublicDoc('adminUsers', 'admin-1', { email: 'admin@test.com', role: 'super_admin', status: 'active' });
    const ctx = asGuest();
    await assertFails(getDoc(doc(ctx.firestore(), 'adminUsers', 'admin-1')));
  });

  test('Unauthenticated user cannot write adminUsers', async () => {
    const ctx = asGuest();
    await assertFails(
      setDoc(doc(ctx.firestore(), 'adminUsers', 'evil-admin'), { role: 'super_admin', status: 'active' }),
    );
  });
});

// ── P05-3: users.plan is NOT user-writable ───────────────────────────────────

describe('P05-3 — users.plan: user cannot escalate their own plan via raw write', () => {
  test('User cannot update their own plan field', async () => {
    await seedUser(USER_A);
    const ctx = asUser(USER_A);
    // plan is NOT in the update allowlist in firestore.rules
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'users', USER_A), {
        plan: 'premium',
        updatedAt: new Date().toISOString(),
      }),
    );
  });

  test('User cannot update aiUsageRemaining directly', async () => {
    await seedUser(USER_A);
    const ctx = asUser(USER_A);
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'users', USER_A), {
        aiUsageRemaining: 9999,
        updatedAt: new Date().toISOString(),
      }),
    );
  });

  test('User cannot set plan=premium when creating their doc', async () => {
    // The create rule enforces plan == 'free'
    const ctx = asUser(USER_A, phoneTokenClaims);
    await assertFails(
      setDoc(doc(ctx.firestore(), 'users', USER_A), {
        ...validUserProfile(USER_A),
        plan: 'premium',  // ← violates: request.resource.data.plan == 'free'
      }),
    );
  });

  test('User creating their doc with plan=free is allowed', async () => {
    const ctx = asUser(USER_A, phoneTokenClaims);
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), 'users', USER_A), validUserProfile(USER_A)),
    );
  });
});

// ── P05-4: Guest reads 5 public collections, cannot write ───────────────────

describe('P05-4 — unauthenticated guest: public read, no write', () => {
  const publicCollections = [
    { name: 'plan_limits',       docId: 'free',      data: { status: 'active', label: 'Free' } },
    { name: 'missions',          docId: 'daily',     data: { status: 'active', title: 'Daily checkin' } },
    { name: 'trends',            docId: 'trend-1',   data: { status: 'published', name: 'Linen' } },
    { name: 'affiliate_products', docId: 'prod-1',   data: { status: 'active', name: 'Shirt' } },
    { name: 'listings',          docId: 'listing-1', data: { status: 'approved', title: 'Váy midi', userId: 'other' } },
  ] as const;

  for (const col of publicCollections) {
    test(`Guest can read active/published ${col.name} document`, async () => {
      await seedPublicDoc(col.name, col.docId, col.data);
      const ctx = asGuest();
      await assertSucceeds(getDoc(doc(ctx.firestore(), col.name, col.docId)));
    });

    test(`Guest cannot write to ${col.name}`, async () => {
      const ctx = asGuest();
      await assertFails(
        setDoc(doc(ctx.firestore(), col.name, 'evil-doc'), { ...col.data }),
      );
    });
  }
});

// ── P05-5: Package-2+ collections deny unauthenticated ──────────────────────

describe('P05-5 — private collections: deny unauthenticated read/write', () => {
  const privateCollections = ['clothes', 'outfits', 'events', 'subscriptions', 'notifications', 'ai_logs', 'user_missions'];

  for (const col of privateCollections) {
    test(`Unauthenticated cannot read ${col}`, async () => {
      await seedPublicDoc(col, 'doc-1', { userId: USER_A, data: 'sensitive' });
      const ctx = asGuest();
      await assertFails(getDoc(doc(ctx.firestore(), col, 'doc-1')));
    });

    test(`Unauthenticated cannot write to ${col}`, async () => {
      const ctx = asGuest();
      await assertFails(
        setDoc(doc(ctx.firestore(), col, 'evil-doc'), { userId: 'attacker' }),
      );
    });
  }
});

// ── P05-6: cms_content — authenticated read, public read if published ────────

describe('P05-6 — cms_content: published docs readable by anyone', () => {
  test('Guest can read published cms_content', async () => {
    await seedPublicDoc('cms_content', 'banner-1', { status: 'published', title: 'Home banner' });
    const ctx = asGuest();
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'cms_content', 'banner-1')));
  });

  test('Guest cannot read draft cms_content', async () => {
    await seedPublicDoc('cms_content', 'draft-1', { status: 'draft', title: 'Draft banner' });
    const ctx = asGuest();
    await assertFails(getDoc(doc(ctx.firestore(), 'cms_content', 'draft-1')));
  });

  test('Guest cannot write cms_content', async () => {
    const ctx = asGuest();
    await assertFails(
      setDoc(doc(ctx.firestore(), 'cms_content', 'evil'), { status: 'published', body: 'injected' }),
    );
  });
});

// ── P08: admin_settings — non-admin write denied ─────────────────────────────

describe('P08 — admin_settings: non-admin write is denied', () => {
  const ROUTING_DOC = 'ai_routing';
  const routingData = {
    id: ROUTING_DOC,
    clothing_detection: { free: 'model-a', pro: 'model-b', premium: 'model-c', fallback: 'model-a' },
    updatedAt: new Date().toISOString(),
  };

  test('Unauthenticated user cannot write to admin_settings', async () => {
    const ctx = asGuest();
    await assertFails(setDoc(doc(ctx.firestore(), 'admin_settings', ROUTING_DOC), routingData));
  });

  test('Authenticated non-admin user cannot write to admin_settings', async () => {
    const ctx = asUser(USER_A);
    await assertFails(setDoc(doc(ctx.firestore(), 'admin_settings', ROUTING_DOC), routingData));
  });

  test('Authenticated non-admin user cannot read admin_settings', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'admin_settings', ROUTING_DOC), routingData);
    });
    const ctx = asUser(USER_A);
    await assertFails(getDoc(doc(ctx.firestore(), 'admin_settings', ROUTING_DOC)));
  });
});

// ── P09: clothes — ownership isolation ───────────────────────────────────────

describe('P09 — clothes: user cannot read/write another user\'s items', () => {
  const clothingDoc = (userId: string) => ({ userId, name: 'Test item', type: 'top', color: 'white', tags: [], isFavorite: false, timesWorn: 0, createdAt: new Date().toISOString() });

  test('User A can read their own clothing item', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'clothes', 'item-a'), clothingDoc(USER_A));
    });
    const ctx = asUser(USER_A);
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'clothes', 'item-a')));
  });

  test('User A cannot read User B clothing item', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'clothes', 'item-b'), clothingDoc(USER_B));
    });
    const ctx = asUser(USER_A);
    await assertFails(getDoc(doc(ctx.firestore(), 'clothes', 'item-b')));
  });

  test('User A cannot write to User B clothing item', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'clothes', 'item-b2'), clothingDoc(USER_B));
    });
    const ctx = asUser(USER_A);
    await assertFails(updateDoc(doc(ctx.firestore(), 'clothes', 'item-b2'), { name: 'Hijacked' }));
  });

  test('User A can create their own clothing item', async () => {
    const ctx = asUser(USER_A);
    await assertSucceeds(setDoc(doc(ctx.firestore(), 'clothes', 'new-item-a'), clothingDoc(USER_A)));
  });
});
