/**
 * AI Routing Resolver — resolveModel(feature, tier)
 * Single enforcement chokepoint for all AI model selection (BRD 1.3.4, Section 9).
 * No hardcoded model IDs — all read from admin_settings/ai_routing.
 */

import { adminDb } from "./firebase-admin";
import type { AiFeature, AiRoutingConfig, AiFeatureRoutingRow } from "@/types/ai-routing";

export type AiTier = "free" | "pro" | "premium";

export interface ResolvedModel {
  modelId: string;
  fallbackModelId: string;
  /** true only for clothing_enhance (BRD 1.3.6) */
  useBatchApi: boolean;
}

export interface AiCallLog {
  feature: AiFeature;
  tier: AiTier;
  userId: string;
  modelUsed: string;
  fallbackUsed: boolean;
  success: boolean;
  timestamp: string;
  costEstimate: number;
}

// clothing_enhance: Batch at every tier (BRD 1.3.6)
// virtual_tryon: Standard (real-time) at every tier (BRD Section 7)
// all others: Standard
const BATCH_FEATURES = new Set<AiFeature>(["clothing_enhance"]);

// clothing_detection must never use an image-generation model (BRD Section 9 cost note)
const IMAGE_MODEL_SUFFIX = "-image";

function assertNotImageModel(feature: AiFeature, modelId: string): string {
  if (feature === "clothing_detection" && modelId.endsWith(IMAGE_MODEL_SUFFIX)) {
    throw new Error(
      `[ai-resolver] clothing_detection cannot use an image model: "${modelId}". ` +
        "This is a cost mistake — use a text/vision model instead."
    );
  }
  return modelId;
}

let configCache: { config: AiRoutingConfig; cachedAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

async function getRoutingConfig(): Promise<AiRoutingConfig> {
  const now = Date.now();
  if (configCache && now - configCache.cachedAt < CACHE_TTL_MS) {
    return configCache.config;
  }
  const snap = await adminDb.collection("admin_settings").doc("ai_routing").get();
  if (!snap.exists) {
    throw new Error("[ai-resolver] admin_settings/ai_routing document not found. Seed it via /api/admin/ai-routing.");
  }
  const config = snap.data() as AiRoutingConfig;
  configCache = { config, cachedAt: now };
  return config;
}

/** Invalidate the in-process config cache (used in tests and after PUT /api/admin/ai-routing). */
export function invalidateAiRoutingCache(): void {
  configCache = null;
}

export async function resolveModel(feature: AiFeature, tier: AiTier): Promise<ResolvedModel> {
  const config = await getRoutingConfig();
  const row = config[feature] as AiFeatureRoutingRow;
  const modelId = assertNotImageModel(feature, row[tier]);
  const fallbackModelId = assertNotImageModel(feature, row.fallback);
  return {
    modelId,
    fallbackModelId,
    useBatchApi: BATCH_FEATURES.has(feature),
  };
}

/**
 * Wrapper: calls the AI provider with the resolved model.
 * On primary failure, retries once with the fallback model.
 * Writes exactly one ai_logs entry per call (P-14).
 */
export async function callWithFallback<T>(
  feature: AiFeature,
  tier: AiTier,
  userId: string,
  caller: (modelId: string, useBatchApi: boolean) => Promise<T>
): Promise<{ result: T; modelUsed: string; fallbackUsed: boolean }> {
  const { modelId, fallbackModelId, useBatchApi } = await resolveModel(feature, tier);

  let modelUsed = modelId;
  let fallbackUsed = false;
  let result: T;

  try {
    result = await caller(modelId, useBatchApi);
  } catch {
    // Primary failed — retry with fallback
    modelUsed = fallbackModelId;
    fallbackUsed = true;
    result = await caller(fallbackModelId, useBatchApi);
  }

  // Write ai_logs (fire-and-forget — do not let logging failure surface to caller)
  writeAiLog({ feature, tier, userId, modelUsed, fallbackUsed, success: true, timestamp: new Date().toISOString(), costEstimate: 0 }).catch(
    (err) => console.error("[ai-resolver] ai_logs write failed:", err)
  );

  return { result, modelUsed, fallbackUsed };
}

async function writeAiLog(log: AiCallLog): Promise<void> {
  await adminDb.collection("ai_logs").add(log);
}
