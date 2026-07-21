/**
 * GAP-A regression tests — client half of AC 45.4 / BRD 3.4.6.3 / BRD Section 9.
 *
 * The backend now reports `fallbackUsed` on every routed response. This asserts the
 * client honours the fallback rule: a fallback-served result must NOT charge the user's
 * quota (`quotaChargeEligible: false`) and MUST carry the lower-quality notice.
 *
 * Before the fix, `run()` returned `quotaChargeEligible: true` unconditionally on the
 * success path, so a real server-side fallback silently charged the user.
 */

jest.mock('@/services/api/resources', () => ({
  aiUsageLogsService: { create: jest.fn().mockResolvedValue({}) },
}));
jest.mock('@/services/firebase/config', () => ({
  isFirebaseConfigured: () => false,
  getFirebaseAuth: () => ({ currentUser: null }),
}));

import { aiService, FALLBACK_QUALITY_NOTICE } from '@/services/ai/aiService';
import { BackendAiProvider } from '@/services/ai/providers';
import type { ClothingImageAnalysis, DetectedClothingMeta } from '@/services/ai/types';

type DetectResponse = DetectedClothingMeta & { fallbackUsed?: boolean; modelUsed?: string };
type EnhanceResponse = ClothingImageAnalysis & { fallbackUsed?: boolean; modelUsed?: string };

const BASE_DETECT: DetectedClothingMeta = {
  type: 'top',
  color: 'Beige',
  material: 'Linen',
  style: 'Minimal',
  season: ['summer'],
  tags: ['casual'],
  suggestedName: 'Áo linen beige',
};

const BASE_ENHANCE: ClothingImageAnalysis = {
  ...BASE_DETECT,
  confidenceScore: 0.8,
  qualityWarnings: [],
  enhancedImageCandidates: [{ id: 'c1', imageUrl: 'https://x/1.png', label: 'Ảnh sạch' }],
};

afterEach(() => jest.restoreAllMocks());

describe('GAP-A — aiService honours the fallback rule (AC 45.4)', () => {
  test('backend reports fallbackUsed=true → quota NOT charged + quality notice shown', async () => {
    const response: DetectResponse = { ...BASE_DETECT, fallbackUsed: true, modelUsed: 'gemini-2.5-flash-lite' };
    jest.spyOn(BackendAiProvider.prototype, 'detectClothingFromImage').mockResolvedValue(response);

    const result = await aiService.detectClothingFromImage('user-1', 'file:///photo.jpg');

    expect(result.fallbackUsed).toBe(true);
    // BRD Section 9: "do not charge user quota for a fallback-served result"
    expect(result.quotaChargeEligible).toBe(false);
    // AC 45.4: "notifies the user the result may be lower quality"
    expect(result.fallbackMessage).toBe(FALLBACK_QUALITY_NOTICE);
    expect(result.data.suggestedName).toBe('Áo linen beige');
  });

  test('backend reports fallbackUsed=false → quota IS charged + no notice', async () => {
    const response: DetectResponse = { ...BASE_DETECT, fallbackUsed: false, modelUsed: 'gemini-2.5-flash' };
    jest.spyOn(BackendAiProvider.prototype, 'detectClothingFromImage').mockResolvedValue(response);

    const result = await aiService.detectClothingFromImage('user-1', 'file:///photo.jpg');

    expect(result.fallbackUsed).toBe(false);
    expect(result.quotaChargeEligible).toBe(true);
    expect(result.fallbackMessage).toBeUndefined();
  });

  test('enhance path: fallbackUsed=true → quota NOT charged + notice shown', async () => {
    const response: EnhanceResponse = { ...BASE_ENHANCE, fallbackUsed: true, modelUsed: 'gemini-3.1-flash-lite-image' };
    jest.spyOn(BackendAiProvider.prototype, 'analyzeAndEnhanceClothingImage').mockResolvedValue(response);

    const result = await aiService.analyzeAndEnhanceClothingImage('user-1', 'file:///photo.jpg');

    expect(result.fallbackUsed).toBe(true);
    expect(result.quotaChargeEligible).toBe(false);
    expect(result.fallbackMessage).toBe(FALLBACK_QUALITY_NOTICE);
  });

  test('response without fallbackUsed field is treated as no fallback (quota charged)', async () => {
    jest.spyOn(BackendAiProvider.prototype, 'detectClothingFromImage').mockResolvedValue(BASE_DETECT);

    const result = await aiService.detectClothingFromImage('user-1', 'file:///photo.jpg');

    expect(result.fallbackUsed).toBe(false);
    expect(result.quotaChargeEligible).toBe(true);
  });
});
