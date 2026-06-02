import { aiUsageLogsService } from '@/services/api/resources';
import { isFirebaseConfigured } from '@/services/firebase/config';
import { BackendAiProvider, MockAiProvider } from './providers';
import type { AiFeature, AiProvider, AiResult, AiUsageLog, OutfitSuggestionInput, StyleProfileInput, VirtualTryOnInput } from './types';

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

async function run<T>(userId: string, feature: AiFeature, summary: string, action: (selected: AiProvider) => Promise<T>): Promise<AiResult<T>> {
  try {
    const data = await action(provider);
    await log(userId, feature, summary, 'success');
    return { data, source: enableRealAi ? 'real' : 'mock', quotaChargeEligible: true, quotaManagedByBackend: enableRealAi };
  } catch (error) {
    if (!demoMode) throw error;
    const data = await action(mock);
    await log(userId, feature, summary, 'fallback');
    return { data, source: 'mock', quotaChargeEligible: false, quotaManagedByBackend: false, fallbackMessage: 'AI đang bận. Ứng dụng đã chuẩn bị một gợi ý cơ bản để bạn tiếp tục.' };
  }
}

export const aiService = {
  detectClothingFromImage: (userId: string, uri: string) => run(userId, 'clothing_detection', 'One clothing image', (p) => p.detectClothingFromImage(uri)),
  suggestOutfits: (userId: string, input: OutfitSuggestionInput) => run(userId, 'outfit_recommendation', `${input.wardrobe.length} wardrobe items; ${input.weather.condition}`, (p) => p.suggestOutfits(input)),
  generateVirtualTryOn: (userId: string, input: VirtualTryOnInput) => run(userId, 'virtual_try_on', `${input.outfitItemIds.length} outfit items; scene=${input.scene}`, (p) => p.generateVirtualTryOn(input)),
  analyzeStyleProfile: (userId: string, input: StyleProfileInput) => run(userId, 'style_profile', `${input.wardrobe.length} wardrobe items`, (p) => p.analyzeStyleProfile(input)),
};
