/**
 * GAP-A regression tests — AC 45.4 / BRD 3.4.6.3 / BRD Section 9 fallback rule.
 *
 * These test the API ROUTE layer, not the resolver. The resolver was always correct
 * (25/25 passing) — the defect was that the routes dropped `fallbackUsed` from the
 * response, so the client could neither warn the user nor skip the quota charge.
 * A resolver-level test cannot catch that; only a route-level test can.
 */

jest.mock("@/lib/server/firebase-admin", () => ({
  adminAuth: { verifyIdToken: jest.fn() },
  adminDb: { collection: jest.fn() },
}));

import { adminAuth, adminDb } from "@/lib/server/firebase-admin";
import { invalidateAiRoutingCache } from "@/lib/server/ai-resolver";
import { POST as detectPOST } from "@/app/api/ai/clothing/detect/route";
import { POST as enhancePOST } from "@/app/api/ai/clothing/analyze-and-enhance/route";
import type { NextRequest } from "next/server";

const PRIMARY_FREE = "gemini-2.5-flash";
const FALLBACK_DETECT = "gemini-2.5-flash-lite";
const PRIMARY_ENHANCE_FREE = "gemini-3.1-flash-lite-image";

const MOCK_CONFIG = {
  id: "ai_routing",
  clothing_detection: { free: PRIMARY_FREE, pro: PRIMARY_FREE, premium: PRIMARY_FREE, fallback: FALLBACK_DETECT },
  clothing_enhance: { free: PRIMARY_ENHANCE_FREE, pro: "gemini-3.1-flash-image", premium: "gemini-3-pro-image", fallback: PRIMARY_ENHANCE_FREE },
  outfit_recommend: { free: "gemini-2.5-flash-lite", pro: PRIMARY_FREE, premium: "gemini-2.5-pro", fallback: "gemini-2.5-flash-lite" },
  virtual_tryon: { free: PRIMARY_ENHANCE_FREE, pro: "gemini-3.1-flash-image", premium: "gemini-3-pro-image", fallback: PRIMARY_ENHANCE_FREE },
  style_profile_analyze: { free: "gemini-2.5-flash-lite", pro: PRIMARY_FREE, premium: "gemini-2.5-pro", fallback: "gemini-2.5-flash-lite" },
  updatedAt: "2026-07-16T00:00:00.000Z",
};

const aiLogsAdd = jest.fn().mockResolvedValue({});

function geminiBody(text: string) {
  return { candidates: [{ content: { parts: [{ text }] } }] };
}

const DETECT_JSON = JSON.stringify({
  type: "top", color: "Beige", material: "Linen", style: "Minimal",
  season: ["summer"], tags: ["casual"], suggestedName: "Áo linen beige",
  confidenceScore: 0.8, qualityWarnings: [],
});

const ENHANCE_JSON = JSON.stringify({
  enhancedImageCandidates: [{ id: "c1", label: "Ảnh sạch", imageUrl: "https://placehold.co/400x500", confidence: 0.8 }],
  qualityWarnings: [],
  analysis: {},
});

function buildRequest(url: string): NextRequest {
  const form = new FormData();
  form.append("image", new File([new Uint8Array([1, 2, 3])], "clothing.jpg", { type: "image/jpeg" }));
  return new Request(url, {
    method: "POST",
    body: form,
    headers: { authorization: "Bearer test-token" },
  }) as unknown as NextRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
  invalidateAiRoutingCache();
  process.env.GOOGLE_AI_API_KEY = "test-key";
  (adminAuth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: "user-gapA" });
  (adminDb.collection as jest.Mock).mockImplementation((name: string) => {
    if (name === "ai_logs") return { add: aiLogsAdd };
    if (name === "users") {
      return { doc: () => ({ get: async () => ({ exists: true, data: () => ({ plan: "free" }) }) }) };
    }
    // admin_settings
    return { doc: () => ({ get: async () => ({ exists: true, data: () => MOCK_CONFIG }) }) };
  });
});

describe("GAP-A — /api/ai/clothing/detect surfaces fallbackUsed (AC 45.4)", () => {
  test("primary model fails → fallback serves → response has fallbackUsed=true + fallback modelUsed", async () => {
    const calledModels: string[] = [];
    global.fetch = jest.fn().mockImplementation(async (url: string) => {
      // NOTE: match the fallback FIRST — "gemini-2.5-flash-lite" contains "gemini-2.5-flash".
      if (url.includes(`${FALLBACK_DETECT}:generateContent`)) {
        calledModels.push(FALLBACK_DETECT);
        return { ok: true, json: async () => geminiBody(DETECT_JSON) };
      }
      calledModels.push(PRIMARY_FREE);
      return { ok: false, status: 500 }; // primary model down
    }) as unknown as typeof fetch;

    const res = await detectPOST(buildRequest("http://localhost/api/ai/clothing/detect"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(calledModels).toEqual([PRIMARY_FREE, FALLBACK_DETECT]); // primary tried, then fallback
    expect(body.fallbackUsed).toBe(true);
    expect(body.modelUsed).toBe(FALLBACK_DETECT);
    expect(body.suggestedName).toBe("Áo linen beige"); // payload still intact
  });

  test("primary model succeeds → fallbackUsed=false + primary modelUsed", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => geminiBody(DETECT_JSON),
    }) as unknown as typeof fetch;

    const res = await detectPOST(buildRequest("http://localhost/api/ai/clothing/detect"));
    const body = await res.json();

    expect(body.fallbackUsed).toBe(false);
    expect(body.modelUsed).toBe(PRIMARY_FREE);
  });
});

describe("GAP-A — /api/ai/clothing/analyze-and-enhance surfaces fallbackUsed (AC 45.4)", () => {
  test("primary fails → fallback serves → response has fallbackUsed=true", async () => {
    let call = 0;
    global.fetch = jest.fn().mockImplementation(async () => {
      call += 1;
      if (call === 1) return { ok: false, status: 503 }; // primary down
      return { ok: true, json: async () => geminiBody(ENHANCE_JSON) };
    }) as unknown as typeof fetch;

    const res = await enhancePOST(buildRequest("http://localhost/api/ai/clothing/analyze-and-enhance"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.fallbackUsed).toBe(true);
    expect(body.modelUsed).toBe(MOCK_CONFIG.clothing_enhance.fallback);
    expect(body.enhancedImageCandidates).toHaveLength(1); // free tier = 1 candidate
  });

  test("primary succeeds → fallbackUsed=false", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => geminiBody(ENHANCE_JSON),
    }) as unknown as typeof fetch;

    const res = await enhancePOST(buildRequest("http://localhost/api/ai/clothing/analyze-and-enhance"));
    const body = await res.json();

    expect(body.fallbackUsed).toBe(false);
    expect(body.modelUsed).toBe(PRIMARY_ENHANCE_FREE);
  });
});
