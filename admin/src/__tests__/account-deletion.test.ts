import { NextRequest } from "next/server";
import { DELETE } from "@/app/api/auth/account/route";
import { adminAuth, adminDb, adminStorage } from "@/lib/server/firebase-admin";

jest.mock("@/lib/server/firebase-admin", () => ({
  adminAuth: { verifyIdToken: jest.fn(), deleteUser: jest.fn() },
  adminDb: { collection: jest.fn(), batch: jest.fn() },
  adminStorage: { bucket: jest.fn() },
}));

const verifyIdToken = adminAuth.verifyIdToken as jest.Mock;
const deleteUser = adminAuth.deleteUser as jest.Mock;
const collection = adminDb.collection as jest.Mock;
const bucket = adminStorage.bucket as jest.Mock;
const storageFileDelete = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  verifyIdToken.mockResolvedValue({ uid: "user-1", auth_time: Math.floor(Date.now() / 1000) });
  deleteUser.mockResolvedValue(undefined);
  storageFileDelete.mockResolvedValue(undefined);
  bucket.mockReturnValue({ getFiles: jest.fn().mockResolvedValue([[{ delete: storageFileDelete }]]) });
  collection.mockImplementation(() => ({
    where: jest.fn(() => ({ limit: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ empty: true, docs: [] }) })) })),
    doc: jest.fn(() => ({ delete: jest.fn().mockResolvedValue(undefined) })),
  }));
});

describe("account deletion wardrobe cleanup", () => {
  test("deletes owned wardrobe Storage assets before deleting Auth identity", async () => {
    const response = await DELETE(new NextRequest("http://localhost/api/auth/account", { method: "DELETE", headers: { Authorization: "Bearer fresh-token" } }));
    expect(response.status).toBe(200);
    expect(bucket().getFiles).toHaveBeenCalledWith({ prefix: "users/user-1/clothes/" });
    expect(storageFileDelete).toHaveBeenCalledWith({ ignoreNotFound: true });
    expect(deleteUser).toHaveBeenCalledWith("user-1");
  });

  test("rejects a stale session before touching Storage or Auth deletion", async () => {
    verifyIdToken.mockResolvedValue({ uid: "user-1", auth_time: Math.floor(Date.now() / 1000) - 601 });
    const response = await DELETE(new NextRequest("http://localhost/api/auth/account", { method: "DELETE", headers: { Authorization: "Bearer stale-token" } }));
    expect(response.status).toBe(401);
    expect(bucket).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });
});
