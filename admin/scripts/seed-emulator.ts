/**
 * Seeds the Firestore emulator with test data for tier enum migration verification.
 * Includes the collision case (plan_limits/premium already exists alongside plan_limits/elite).
 *
 * Prerequisites: FIRESTORE_EMULATOR_HOST must be set.
 * Run from admin/: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/seed-emulator.ts
 */
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("ERROR: FIRESTORE_EMULATOR_HOST not set. This script must target the local emulator only.");
  process.exit(1);
}

const app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? "demo-your-closet" });
const db = getFirestore(app);

async function clearCollection(name: string) {
  const snap = await db.collection(name).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

async function seed() {
  // Clear existing data so the seed is idempotent and the migration can be re-run cleanly.
  await Promise.all(["users", "subscriptions", "plan_limits"].map(clearCollection));

  const now = FieldValue.serverTimestamp();

  // users — mix of current-enum and legacy-elite values
  await Promise.all([
    db.doc("users/user-free").set({ uid: "user-free", tier: "free", email: "free@test.com", createdAt: now, updatedAt: now }),
    db.doc("users/user-pro").set({ uid: "user-pro", tier: "pro", email: "pro@test.com", createdAt: now, updatedAt: now }),
    db.doc("users/user-premium").set({ uid: "user-premium", tier: "premium", email: "premium@test.com", createdAt: now, updatedAt: now }),
    db.doc("users/user-elite-1").set({ uid: "user-elite-1", tier: "elite", email: "elite1@test.com", createdAt: now, updatedAt: now }),
    // user-elite-2 has BOTH tier and plan set to elite (tests both fields migrated)
    db.doc("users/user-elite-2").set({ uid: "user-elite-2", tier: "elite", plan: "elite", email: "elite2@test.com", createdAt: now, updatedAt: now }),
  ]);

  // subscriptions
  await Promise.all([
    db.doc("subscriptions/sub-free").set({ userId: "user-free", tier: "free", createdAt: now, updatedAt: now }),
    db.doc("subscriptions/sub-elite").set({ userId: "user-elite-1", tier: "elite", createdAt: now, updatedAt: now }),
  ]);

  // plan_limits — COLLISION CASE: plan_limits/premium already exists alongside plan_limits/elite.
  // After migration: elite should merge into premium (not overwrite), and old-premium should rename to pro.
  // But since plan_limits/pro also already exists here, the rename triggers a collision warning too.
  await Promise.all([
    db.doc("plan_limits/free").set({ id: "free", label: "Free", maxItems: 20, createdAt: now, updatedAt: now }),
    db.doc("plan_limits/pro").set({ id: "pro", label: "Pro", maxItems: 100, createdAt: now, updatedAt: now }),
    // pre-existing "premium" doc — this is the old-naming that should map to "pro" tier in the new scheme
    db.doc("plan_limits/premium").set({ id: "premium", label: "Premium (pre-migration)", maxItems: 200, createdAt: now, updatedAt: now }),
    // "elite" should be migrated to "premium" in the new scheme
    db.doc("plan_limits/elite").set({ id: "elite", label: "Elite", maxItems: 500, createdAt: now, updatedAt: now }),
  ]);

  console.log("✓ Emulator seeded.");
  console.log("  users:         user-free(free), user-pro(pro), user-premium(premium), user-elite-1(elite), user-elite-2(elite+plan:elite)");
  console.log("  subscriptions: sub-free(free), sub-elite(elite)");
  console.log("  plan_limits:   free, pro, premium(pre-existing!), elite  ← collision case ready");
}

void seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
