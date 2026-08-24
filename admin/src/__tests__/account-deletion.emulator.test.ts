import { NextRequest } from "next/server";
import { deleteApp, getApps } from "firebase-admin/app";
import { adminAuth, adminDb, adminStorage } from "@/lib/server/firebase-admin";
import { DELETE } from "@/app/api/auth/account/route";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "demo-your-closet";
const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const UID = `account-delete-${process.pid}`;

function authRequest(token: string) {
  return new NextRequest("http://localhost/api/auth/account", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function issueIdToken(uid: string) {
  const customToken = await adminAuth.createCustomToken(uid);
  const response = await fetch(`http://${AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=emulator-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  if (!response.ok) throw new Error(`Auth emulator token exchange failed: ${response.status}`);
  const body = (await response.json()) as { idToken: string };
  return body.idToken;
}

async function deleteIfPresent(uid: string) {
  try {
    await adminAuth.deleteUser(uid);
  } catch {
    // Cleanup is idempotent for the test account.
  }
  await adminDb.collection("users").doc(uid).delete().catch(() => undefined);
  await adminDb.collection("clothes").doc(`${uid}-clothes`).delete().catch(() => undefined);
  await adminDb.collection("outfits").doc(`${uid}-outfit`).delete().catch(() => undefined);
  const [files] = await adminStorage.bucket().getFiles({ prefix: `users/${uid}/clothes/` });
  await Promise.all(files.map((file) => file.delete({ ignoreNotFound: true }).catch(() => undefined)));
}

describe("account deletion with Admin SDK emulators", () => {
  beforeAll(async () => {
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
      throw new Error("Account deletion emulator test requires Auth, Firestore, and Storage emulator hosts");
    }
    process.env.FIREBASE_PROJECT_ID = PROJECT_ID;
    process.env.GCLOUD_PROJECT = PROJECT_ID;

    await deleteIfPresent(UID);
    await adminAuth.createUser({ uid: UID, displayName: "Account deletion emulator test" });
    await adminDb.collection("users").doc(UID).set({ userId: UID, email: `${UID}@example.test` });
    await adminDb.collection("clothes").doc(`${UID}-clothes`).set({ userId: UID, imageUrl: `users/${UID}/clothes/item.jpg` });
    await adminDb.collection("outfits").doc(`${UID}-outfit`).set({ userId: UID });
    await adminStorage.bucket().file(`users/${UID}/clothes/item.jpg`).save(Buffer.from("emulator-image"), {
      metadata: { contentType: "image/jpeg" },
    });
  });

  afterAll(async () => {
    await deleteIfPresent(UID);
    for (const app of getApps()) await deleteApp(app);
  });

  test("deletes owned Storage, Firestore, and Auth data in order", async () => {
    const token = await issueIdToken(UID);
    const response = await DELETE(authRequest(token));

    expect(response.status).toBe(200);
    await expect(adminAuth.getUser(UID)).rejects.toMatchObject({ code: "auth/user-not-found" });
    expect((await adminDb.collection("users").doc(UID).get()).exists).toBe(false);
    expect((await adminDb.collection("clothes").doc(`${UID}-clothes`).get()).exists).toBe(false);
    expect((await adminDb.collection("outfits").doc(`${UID}-outfit`).get()).exists).toBe(false);
    expect((await adminStorage.bucket().getFiles({ prefix: `users/${UID}/clothes/` }))[0]).toHaveLength(0);
  });

  test("fails closed when Storage cleanup fails", async () => {
    const failingUid = `${UID}-storage-failure`;
    await adminAuth.createUser({ uid: failingUid });
    await adminDb.collection("users").doc(failingUid).set({ userId: failingUid });
    await adminStorage.bucket().file(`users/${failingUid}/clothes/item.jpg`).save(Buffer.from("emulator-image"), {
      metadata: { contentType: "image/jpeg" },
    });

    const file = adminStorage.bucket().file(`users/${failingUid}/clothes/item.jpg`);
    const filePrototype = Object.getPrototypeOf(file) as { delete: (...args: unknown[]) => Promise<unknown> };
    const deleteSpy = jest.spyOn(filePrototype, "delete").mockRejectedValueOnce(new Error("simulated storage failure"));
    try {
      const token = await issueIdToken(failingUid);
      const response = await DELETE(authRequest(token));

      expect(response.status).toBe(500);
      expect((await adminDb.collection("users").doc(failingUid).get()).exists).toBe(true);
      await expect(adminAuth.getUser(failingUid)).resolves.toMatchObject({ uid: failingUid });
    } finally {
      deleteSpy.mockRestore();
      await deleteIfPresent(failingUid);
    }
  });
});
