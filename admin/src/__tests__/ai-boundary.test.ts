import { NextRequest } from "next/server";
import { POST } from "@/app/api/ai/[...path]/route";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";
import { finalizeAiUsage, reserveAiUsage } from "@/lib/server/ai-usage";

jest.mock("@/lib/server/firebase-admin", () => ({
  adminAuth: { verifyIdToken: jest.fn() },
  adminDb: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({ get: jest.fn() })),
    })),
  },
}));

jest.mock("@/lib/server/ai-usage", () => ({
  aiUsageErrorResponse: jest.fn((error: unknown) => ({ code: "AI_REQUEST_FAILED", message: String(error), status: 503 })),
  reserveAiUsage: jest.fn(),
  finalizeAiUsage: jest.fn(),
}));

const verifyIdToken = adminAuth.verifyIdToken as jest.Mock;
const collection = adminDb.collection as jest.Mock;
const reserve = reserveAiUsage as jest.Mock;
const finalize = finalizeAiUsage as jest.Mock;

beforeEach(() => {
  jest.restoreAllMocks();
  verifyIdToken.mockReset();
  collection.mockReset();
  reserve.mockReset();
  finalize.mockReset();
  process.env.AI_API_BASE_URL = "https://ai.example.test";
  verifyIdToken.mockResolvedValue({ uid: "user-1" });
  collection.mockReturnValue({ doc: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ plan: "free", status: "active" }) }) })) });
  reserve.mockResolvedValue({ usageId: "usage-1", userId: "user-1", operation: "outfit_recommend", plan: "free", idempotencyKey: "outfit_recommend:req-1", requestId: "req-1", quotaUnits: 1, unlimited: false, quotaPeriod: "2026-08", status: "RESERVED", fallbackUsed: false, isReplay: false });
  finalize.mockResolvedValue({ status: "COMMITTED", isReplay: false });
});

afterEach(() => {
  delete process.env.AI_API_BASE_URL;
});

describe("AI route boundary", () => {
  test("rejects an unknown operation before authentication or upstream forwarding", async () => {
    const response = await POST(new NextRequest("http://localhost/api/ai/not-allowed", { method: "POST" }), { params: Promise.resolve({ path: ["not-allowed"] }) });
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: "AI_OPERATION_NOT_ALLOWED" });
    expect(verifyIdToken).not.toHaveBeenCalled();
    expect(reserve).not.toHaveBeenCalled();
  });

  test("rejects a valid operation without a Firebase token", async () => {
    verifyIdToken.mockResolvedValue(null);
    const response = await POST(new NextRequest("http://localhost/api/ai/outfits/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wardrobe: [], weather: {} }) }), { params: Promise.resolve({ path: ["outfits", "recommend"] }) });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "UNAUTHORIZED" });
    expect(reserve).not.toHaveBeenCalled();
  });

  test("rejects malformed JSON before quota reservation", async () => {
    const response = await POST(new NextRequest("http://localhost/api/ai/outfits/recommend", { method: "POST", headers: { Authorization: "Bearer token", "Content-Type": "application/json" }, body: "{bad" }), { params: Promise.resolve({ path: ["outfits", "recommend"] }) });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "INVALID_JSON" });
    expect(reserve).not.toHaveBeenCalled();
  });

  test("forwards only the exact allowlisted path after auth, validation and reservation", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: [{ name: "test" }] }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const response = await POST(new NextRequest("http://localhost/api/ai/outfits/recommend", { method: "POST", headers: { Authorization: "Bearer token", "Content-Type": "application/json", "Idempotency-Key": "req-1" }, body: JSON.stringify({ wardrobe: [], weather: {} }) }), { params: Promise.resolve({ path: ["outfits", "recommend"] }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [{ name: "test" }] });
    expect(fetchMock).toHaveBeenCalledWith("https://ai.example.test/outfits/recommend", expect.objectContaining({ method: "POST" }));
    expect(reserve).toHaveBeenCalledTimes(1);
    expect(finalize).toHaveBeenCalledWith(expect.objectContaining({ resultStatus: "success", fallbackUsed: false }));
    fetchMock.mockRestore();
  });
});
