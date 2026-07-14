/**
 * P-07 Unit tests: AI Routing Resolver
 * Verifies: correct resolution per tier for all features, fallback on failure,
 * Batch routing for clothing_enhance (all tiers), Standard for virtual_tryon (all tiers),
 * non-image-model for clothing_detection (all tiers).
 */

import { resolveModel, callWithFallback, invalidateAiRoutingCache } from "@/lib/server/ai-resolver";

// Mock firebase-admin to avoid real Firestore calls
jest.mock("@/lib/server/firebase-admin", () => ({
  adminDb: {
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn(),
      }),
      add: jest.fn().mockResolvedValue({}),
    }),
  },
}));

import { adminDb } from "@/lib/server/firebase-admin";


const MOCK_CONFIG = {
  id: "ai_routing",
  clothing_detection: { free: "gemini-2.5-flash", pro: "gemini-2.5-flash", premium: "gemini-2.5-flash", fallback: "gemini-2.5-flash-lite" },
  clothing_enhance: { free: "gemini-3.1-flash-lite-image", pro: "gemini-3.1-flash-image", premium: "gemini-3-pro-image", fallback: "gemini-3.1-flash-lite-image" },
  outfit_recommend: { free: "gemini-2.5-flash-lite", pro: "gemini-2.5-flash", premium: "gemini-2.5-pro", fallback: "gemini-2.5-flash-lite" },
  virtual_tryon: { free: "gemini-3.1-flash-lite-image", pro: "gemini-3.1-flash-image", premium: "gemini-3-pro-image", fallback: "gemini-3.1-flash-lite-image" },
  style_profile_analyze: { free: "gemini-2.5-flash-lite", pro: "gemini-2.5-flash", premium: "gemini-2.5-pro", fallback: "gemini-2.5-flash-lite" },
  updatedAt: "2026-07-14T00:00:00.000Z",
};

beforeEach(() => {
  invalidateAiRoutingCache();
  // Reset the mock chain for each test
  const col = (adminDb.collection as jest.Mock).mockReturnValue({
    doc: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ exists: true, data: () => MOCK_CONFIG }),
    }),
    add: jest.fn().mockResolvedValue({}),
  });
  (adminDb.collection as jest.Mock) = col;
});

describe("resolveModel — correct model per feature and tier", () => {
  const tiers = ["free", "pro", "premium"] as const;

  for (const tier of tiers) {
    test(`clothing_detection ${tier}: resolves to text/vision model (not -image)`, async () => {
      const resolved = await resolveModel("clothing_detection", tier);
      expect(resolved.modelId).toBe(MOCK_CONFIG.clothing_detection[tier]);
      expect(resolved.modelId).not.toMatch(/-image$/);
    });

    test(`clothing_enhance ${tier}: useBatchApi=true`, async () => {
      const resolved = await resolveModel("clothing_enhance", tier);
      expect(resolved.useBatchApi).toBe(true);
      expect(resolved.modelId).toBe(MOCK_CONFIG.clothing_enhance[tier]);
    });

    test(`virtual_tryon ${tier}: useBatchApi=false (real-time)`, async () => {
      const resolved = await resolveModel("virtual_tryon", tier);
      expect(resolved.useBatchApi).toBe(false);
    });

    test(`outfit_recommend ${tier}: resolves correct model`, async () => {
      const resolved = await resolveModel("outfit_recommend", tier);
      expect(resolved.modelId).toBe(MOCK_CONFIG.outfit_recommend[tier]);
      expect(resolved.useBatchApi).toBe(false);
    });

    test(`style_profile_analyze ${tier}: resolves correct model`, async () => {
      const resolved = await resolveModel("style_profile_analyze", tier);
      expect(resolved.modelId).toBe(MOCK_CONFIG.style_profile_analyze[tier]);
    });
  }
});

describe("resolveModel — fallback chains", () => {
  test("clothing_detection fallback is also a text/vision model", async () => {
    const resolved = await resolveModel("clothing_detection", "free");
    expect(resolved.fallbackModelId).toBe(MOCK_CONFIG.clothing_detection.fallback);
    expect(resolved.fallbackModelId).not.toMatch(/-image$/);
  });

  test("clothing_enhance fallback preserves Batch routing", async () => {
    const resolved = await resolveModel("clothing_enhance", "pro");
    expect(resolved.fallbackModelId).toBe(MOCK_CONFIG.clothing_enhance.fallback);
    expect(resolved.useBatchApi).toBe(true);
  });
});

describe("resolveModel — safety: clothing_detection cannot use image model", () => {
  test("throws if admin_settings sets an -image model for clothing_detection", async () => {
    const badConfig = {
      ...MOCK_CONFIG,
      clothing_detection: { free: "gemini-3.1-flash-lite-image", pro: "gemini-3.1-flash-image", premium: "gemini-3-pro-image", fallback: "gemini-3.1-flash-lite-image" },
    };
    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => badConfig }),
      }),
      add: jest.fn().mockResolvedValue({}),
    });
    await expect(resolveModel("clothing_detection", "free")).rejects.toThrow("cannot use an image model");
  });
});

describe("callWithFallback — fallback on primary failure", () => {
  test("uses fallback model when primary caller throws, sets fallbackUsed=true", async () => {
    let callCount = 0;
    const caller = jest.fn().mockImplementation((modelId: string) => {
      callCount++;
      if (callCount === 1) throw new Error("Primary model unavailable");
      return Promise.resolve(`result-with-${modelId}`);
    });

    const { modelUsed, fallbackUsed } = await callWithFallback("outfit_recommend", "free", "user-123", caller);
    expect(fallbackUsed).toBe(true);
    expect(modelUsed).toBe(MOCK_CONFIG.outfit_recommend.fallback);
    expect(caller).toHaveBeenCalledTimes(2);
  });

  test("uses primary model when it succeeds, fallbackUsed=false", async () => {
    const caller = jest.fn().mockResolvedValue("primary-result");
    const { fallbackUsed, modelUsed } = await callWithFallback("virtual_tryon", "pro", "user-456", caller);
    expect(fallbackUsed).toBe(false);
    expect(modelUsed).toBe(MOCK_CONFIG.virtual_tryon.pro);
    expect(caller).toHaveBeenCalledTimes(1);
  });

  test("clothing_enhance caller always receives useBatchApi=true", async () => {
    const receivedBatch: boolean[] = [];
    const caller = jest.fn().mockImplementation((_modelId: string, useBatchApi: boolean) => {
      receivedBatch.push(useBatchApi);
      return Promise.resolve("ok");
    });
    await callWithFallback("clothing_enhance", "free", "user-789", caller);
    expect(receivedBatch[0]).toBe(true);
  });

  test("virtual_tryon caller always receives useBatchApi=false", async () => {
    const receivedBatch: boolean[] = [];
    const caller = jest.fn().mockImplementation((_modelId: string, useBatchApi: boolean) => {
      receivedBatch.push(useBatchApi);
      return Promise.resolve("ok");
    });
    await callWithFallback("virtual_tryon", "premium", "user-abc", caller);
    expect(receivedBatch[0]).toBe(false);
  });
});

describe("resolveModel — reads from admin_settings, no hardcoded values", () => {
  test("changing admin_settings config changes resolveModel output", async () => {
    const altConfig = {
      ...MOCK_CONFIG,
      outfit_recommend: { free: "alt-flash-lite", pro: "alt-flash", premium: "alt-pro", fallback: "alt-flash-lite" },
    };
    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => altConfig }),
      }),
      add: jest.fn().mockResolvedValue({}),
    });

    const resolved = await resolveModel("outfit_recommend", "free");
    expect(resolved.modelId).toBe("alt-flash-lite");
  });
});
