import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminStorage } from "@/lib/server/firebase-admin";
import { corsHeaders } from "@/lib/server/resources";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore-schema";

export const runtime = "nodejs";

// A deletion request must be backed by a token issued within this window of a
// real sign-in (Google/Facebook re-consent or phone OTP re-verify), not just
// any still-valid session token. BRD 3.1.7.1.
const REAUTH_WINDOW_SECONDS = 5 * 60;

// BRD 3.1.7.2 — exactly these 8 collections, owned-by-user records only.
// marketplace_messages ownership is the message author (senderId), not the
// other party in the thread (sellerId).
const CASCADE_COLLECTIONS: { collection: string; ownerField: string }[] = [
  { collection: FIRESTORE_COLLECTIONS.clothes, ownerField: "userId" },
  { collection: FIRESTORE_COLLECTIONS.outfits, ownerField: "userId" },
  { collection: FIRESTORE_COLLECTIONS.events, ownerField: "userId" },
  { collection: FIRESTORE_COLLECTIONS.userMissions, ownerField: "userId" },
  { collection: FIRESTORE_COLLECTIONS.notifications, ownerField: "userId" },
  { collection: FIRESTORE_COLLECTIONS.listings, ownerField: "userId" },
  { collection: FIRESTORE_COLLECTIONS.marketplaceMessages, ownerField: "senderId" },
  { collection: FIRESTORE_COLLECTIONS.subscriptions, ownerField: "userId" },
];

const BATCH_SIZE = 500;

async function deleteStorageForUser(uid: string) {
  const [files] = await adminStorage.bucket().getFiles({ prefix: `users/${uid}/clothes/` });
  for (const file of files) await file.delete({ ignoreNotFound: true });
}

async function deleteCollectionForUser(collection: string, ownerField: string, uid: string) {
  const ref = adminDb.collection(collection);
  for (;;) {
    const snapshot = await ref.where(ownerField, "==", uid).limit(BATCH_SIZE).get();
    if (snapshot.empty) return;
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    if (snapshot.size < BATCH_SIZE) return;
  }
}

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: corsHeaders });
}

export async function DELETE(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return fail("UNAUTHORIZED", 401);

  const decoded = await adminAuth.verifyIdToken(token, true).catch(() => null);
  if (!decoded) return fail("UNAUTHORIZED", 401);

  const authAgeSeconds = Date.now() / 1000 - decoded.auth_time;
  if (authAgeSeconds > REAUTH_WINDOW_SECONDS) return fail("REAUTH_REQUIRED", 401);

  const uid = decoded.uid;
  try {
    // Delete owned wardrobe assets first. If Storage cleanup fails, stop before
    // deleting the Firestore/Auth identity so the account remains recoverable.
    await deleteStorageForUser(uid);
    for (const { collection, ownerField } of CASCADE_COLLECTIONS) {
      await deleteCollectionForUser(collection, ownerField, uid);
    }
    await adminDb.collection(FIRESTORE_COLLECTIONS.users).doc(uid).delete();
    // ai_logs/ai_usage retention is intentionally not changed here because no
    // product/legal retention policy is currently approved. See V2.1.2 report.
    await adminAuth.deleteUser(uid);
    return NextResponse.json({ data: { deleted: true } }, { status: 200, headers: corsHeaders });
  } catch {
    return fail("SERVER_ERROR", 500);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
