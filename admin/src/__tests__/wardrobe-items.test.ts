import { NextRequest } from "next/server";
import { POST } from "@/app/api/wardrobe/items/route";
import { GET as GET_ITEM, PATCH as PATCH_ITEM, DELETE as DELETE_ITEM } from "@/app/api/wardrobe/items/[id]/route";
import { authenticate } from "@/lib/server/authorize";
import { adminDb, adminStorage } from "@/lib/server/firebase-admin";

jest.mock("@/lib/server/authorize", () => ({ authenticate: jest.fn() }));
jest.mock("@/lib/server/firebase-admin", () => ({ adminDb: { collection: jest.fn(), runTransaction: jest.fn() }, adminStorage: { bucket: jest.fn() } }));

const auth = authenticate as jest.Mock;
const collection = adminDb.collection as jest.Mock;
const runTransaction = adminDb.runTransaction as jest.Mock;
const bucket = adminStorage.bucket as jest.Mock;
const storageFileLookup = jest.fn();
const storageFileDelete = jest.fn();

const baseItem = {
  userId: "user-1", name: "Áo linen", imageUrl: "https://firebasestorage.googleapis.com/v0/b/test/o/users%2Fuser-1%2Fclothes%2Fabc1234567.jpg?alt=media&token=t",
  storagePath: "users/user-1/clothes/abc1234567.jpg", originalImageUrl: "https://firebasestorage.googleapis.com/v0/b/test/o/users%2Fuser-1%2Fclothes%2Fabc1234567.jpg?alt=media&token=t", type: "top", color: "trắng", tags: [], season: [], isFavorite: false, timesWorn: 0,
  createdAt: "2026-08-24T00:00:00.000Z",
};

type MockRef = { collectionName: string; id: string; get: () => Promise<{ exists: boolean; id: string; data: () => Record<string, unknown> | null }>; set: (value: Record<string, unknown>) => Promise<void> };
type MockTransaction = { get: (ref: MockRef) => Promise<{ exists: boolean; id: string; data: () => Record<string, unknown> | null }>; set: (ref: MockRef, value: Record<string, unknown>) => void; update: (ref: MockRef, value: Record<string, unknown>) => void; delete: (ref: MockRef) => void; create: (ref: MockRef, value: Record<string, unknown>) => void };

let state: { item: Record<string, unknown> | null; request: Record<string, unknown> | null; user: Record<string, unknown> };
const makeRef = (collectionName: string, id: string) => ({ collectionName, id, get: jest.fn(async () => {
  if (collectionName === "clothes") return { exists: Boolean(state.item), id, data: () => state.item };
  if (collectionName === "wardrobe_requests") return { exists: Boolean(state.request), id, data: () => state.request };
  return { exists: true, id, data: () => state.user };
}), set: jest.fn(async () => undefined) });

beforeEach(() => {
  jest.clearAllMocks();
  state = { item: null, request: null, user: { status: "active", closetItemCount: 0, closetItemLimit: 50 } };
  auth.mockResolvedValue({ uid: "user-1", isAdmin: false });
  collection.mockImplementation((name: string) => ({ doc: jest.fn((id?: string) => makeRef(name, id ?? "item-1")) }));
  runTransaction.mockImplementation(async (callback: (transaction: MockTransaction) => Promise<void>) => callback({
    get: async (ref: MockRef) => ref.get(),
    set: (ref: MockRef, value: Record<string, unknown>) => {
      if (ref.collectionName === "clothes") state.item = value;
      if (ref.collectionName === "wardrobe_requests") state.request = value;
    },
    update: (ref: MockRef, value: Record<string, unknown>) => { void ref; state.user = { ...state.user, ...value }; },
    delete: (ref: MockRef) => { void ref; state.item = null; },
    create: (ref: MockRef, value: Record<string, unknown>) => { if (ref.collectionName === "wardrobe_requests") state.request = value; },
  }));
  storageFileLookup.mockReset();
  storageFileDelete.mockReset().mockResolvedValue(undefined);
  storageFileLookup.mockReturnValue({ delete: storageFileDelete });
  bucket.mockReturnValue({ file: storageFileLookup });
});

function createRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/wardrobe/items", { method: "POST", headers: { "Idempotency-Key": "save-1", ...headers }, body: JSON.stringify(body) });
}

const validPayload = { ...baseItem };

describe("wardrobe item API", () => {
  test("creates one owned item atomically and replays duplicate submission", async () => {
    const first = await POST(createRequest(validPayload));
    expect(first.status).toBe(201);
    expect((await first.json()).data.item).toMatchObject({ userId: "user-1", name: "Áo linen" });
    expect(state.user.closetItemCount).toBe(1);

    const second = await POST(createRequest(validPayload));
    expect(second.status).toBe(200);
    expect((await second.json()).data.replayed).toBe(true);
    expect(state.user.closetItemCount).toBe(1);
  });

  test("rejects a cross-user create even when the body attempts to claim another UID", async () => {
    const response = await POST(createRequest({ ...validPayload, userId: "user-2" }));
    expect(response.status).toBe(403);
    expect(runTransaction).not.toHaveBeenCalled();
  });

  test("allows owner read/update/delete but blocks cross-user item access and image reference replacement", async () => {
    state.item = { ...baseItem };
    const ownRead = await GET_ITEM(new NextRequest("http://localhost/api/wardrobe/items/item-1"), { params: Promise.resolve({ id: "item-1" }) });
    expect(ownRead.status).toBe(200);

    auth.mockResolvedValue({ uid: "user-2", isAdmin: false });
    const foreignRead = await GET_ITEM(new NextRequest("http://localhost/api/wardrobe/items/item-1"), { params: Promise.resolve({ id: "item-1" }) });
    expect(foreignRead.status).toBe(403);

    auth.mockResolvedValue({ uid: "user-1", isAdmin: false });
    const replace = await PATCH_ITEM(new NextRequest("http://localhost/api/wardrobe/items/item-1", { method: "PATCH", body: JSON.stringify({ imageUrl: "https://example.com/other.jpg" }) }), { params: Promise.resolve({ id: "item-1" }) });
    expect(replace.status).toBe(400);

    const update = await PATCH_ITEM(new NextRequest("http://localhost/api/wardrobe/items/item-1", { method: "PATCH", headers: { "Idempotency-Key": "update-1" }, body: JSON.stringify({ name: "Áo linen mới" }) }), { params: Promise.resolve({ id: "item-1" }) });
    expect(update.status).toBe(200);

    state.request = null;
    const remove = await DELETE_ITEM(new NextRequest("http://localhost/api/wardrobe/items/item-1", { method: "DELETE", headers: { "Idempotency-Key": "delete-1" } }), { params: Promise.resolve({ id: "item-1" }) });
    expect(remove.status).toBe(204);
    expect(storageFileLookup).toHaveBeenCalledWith(baseItem.storagePath);
  });
});
