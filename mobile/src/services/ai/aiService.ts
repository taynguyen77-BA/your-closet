import { aiUsageLogsService } from '@/services/api/resources';
import { isFirebaseConfigured } from '@/services/firebase/config';
import { BackendAiProvider, MockAiProvider } from './providers';
import type { AiFallbackMeta, AiFeature, AiProvider, AiResult, AiUsageLog, OutfitSuggestionInput, StyleProfileInput, VirtualTryOnInput } from './types';

export * from './types';
export { AiServiceError } from './providers';

const enableRealAi = process.env.EXPO_PUBLIC_ENABLE_REAL_AI === 'true';
const demoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
const mock = new MockAiProvider();
const provider: AiProvider = demoMode && !enableRealAi ? mock : new BackendAiProvider();
const costs: Record<AiFeature, number> = {
  clothing_detection: 0.002, outfit_recommendation: 0.01, virtual_try_on: 0.08, style_profile: 0.015,
};

async function log(userId: string, feature: AiFeature, inputSummary: string, resultStatus: AiUsageLog['resultStatus']) {
  if (enableRealAi || !isFirebaseConfigured()) return;
  try { await aiUsageLogsService.create({ userId, feature, inputSummary, resultStatus, costEstimate: resultStatus === 'success' ? costs[feature] : 0, createdAt: new Date().toISOString() }); }
  catch { /* AI output should remain usable when analytics logging is unavailable. */ }
}

/** AC 45.4 — user-facing notice whenever a fallback model served the result. */
export const FALLBACK_QUALITY_NOTICE = 'Kết quả có thể chất lượng thấp hơn do hệ thống đang dùng phương án dự phòng.';

async function run<T>(userId: string, feature: AiFeature, summary: string, action: (selected: AiProvider) => Promise<T>): Promise<AiResult<T>> {
  try {
    const data = await action(provider);
    await log(userId, feature, summary, 'success');
    // AC 45.4 / BRD 3.4.6.3 / Section 9 fallback rule: a fallback-served result must warn
    // the user about lower quality and must NOT charge their quota. The backend reports
    // this via `fallbackUsed` on the routed response (see admin AI routes).
    const fallbackUsed = Boolean((data as AiFallbackMeta | null)?.fallbackUsed);
    return {
      data,
      source: enableRealAi ? 'real' : 'mock',
      quotaChargeEligible: !fallbackUsed,
      quotaManagedByBackend: enableRealAi,
      fallbackUsed,
      fallbackMessage: fallbackUsed ? FALLBACK_QUALITY_NOTICE : undefined,
    };
  } catch (error) {
    if (!demoMode) throw error;
    const data = await action(mock);
    await log(userId, feature, summary, 'fallback');
    return { data, source: 'mock', quotaChargeEligible: false, quotaManagedByBackend: false, fallbackUsed: true, fallbackMessage: 'AI đang bận. Ứng dụng đã chuẩn bị một gợi ý cơ bản để bạn tiếp tục.' };
  }
}

export const aiService = {
  detectClothingFromImage: (userId: string, uri: string) => run(userId, 'clothing_detection', 'One clothing image', (p) => p.detectClothingFromImage(uri)),
  analyzeAndEnhanceClothingImage: (userId: string, uri: string) => run(userId, 'clothing_detection', 'One clothing image with enhancement candidates', (p) => p.analyzeAndEnhanceClothingImage(uri)),
  suggestOutfits: (userId: string, input: OutfitSuggestionInput) => run(userId, 'outfit_recommendation', `${input.wardrobe.length} wardrobe items; ${input.weather.condition}; ${input.location ?? input.weather.location}; ${input.eventContext?.name ?? input.mood ?? 'general'}`, (p) => p.suggestOutfits(input)),
  generateVirtualTryOn: (userId: string, input: VirtualTryOnInput) => run(userId, 'virtual_try_on', `${input.outfitItemIds.length} outfit items; scene=${input.scene}`, (p) => p.generateVirtualTryOn(input)),
  analyzeStyleProfile: (userId: string, input: StyleProfileInput) => run(userId, 'style_profile', `${input.wardrobe.length} wardrobe items`, (p) => p.analyzeStyleProfile(input)),
};
