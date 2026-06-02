import type { AiProvider, DetectedClothingMeta, OutfitSuggestionInput, StyleProfileInput, VirtualTryOnInput } from './types';
import { getFirebaseAuth } from '@/services/firebase/config';

const MOCK_DETECTION: DetectedClothingMeta = {
  type: 'top', material: 'Cotton blend', color: 'Soft Pink', style: 'Casual',
  season: ['spring', 'summer'], tags: ['casual', 'everyday'], suggestedName: 'Áo thun pastel',
};

const sceneImages: Record<string, string> = {
  beach: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
  urban: 'https://images.unsplash.com/photo-1483985988355-763728ebc55b?w=800',
  party: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
  office: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800',
  casual: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
};

export class AiServiceError extends Error {
  constructor(message: string, public readonly code: 'config' | 'timeout' | 'network' | 'server' | 'invalid_response') {
    super(message);
    this.name = 'AiServiceError';
  }
}

export class MockAiProvider implements AiProvider {
  async detectClothingFromImage(): Promise<DetectedClothingMeta> { await delay(350); return MOCK_DETECTION; }
  async suggestOutfits(input: OutfitSuggestionInput) {
    await delay(500);
    const tops = input.wardrobe.filter((c) => c.type === 'top');
    const bottoms = input.wardrobe.filter((c) => c.type === 'bottom');
    const shoes = input.wardrobe.filter((c) => c.type === 'shoes');
    if (!tops.length || !bottoms.length) return [];
    return [{
      name: `Gợi ý cho ${input.weather.condition}`,
      items: [tops[0], bottoms[0], ...shoes.slice(0, 1)].map((c) => ({ clothingId: c.id, name: c.name, type: c.type })),
      aiExplanation: `Phù hợp ${input.weather.temperature}°C tại ${input.weather.location}. Hãy ưu tiên tông màu hài hòa với tủ đồ hiện tại.`,
      weatherCompatibility: `${input.weather.condition}, ${input.weather.temperature}°C`,
      colorMatching: 'Neutral & pastel harmony', styleMatching: 'Personal style match 90%', matchingScore: 90,
    }];
  }
  async generateVirtualTryOn(input: VirtualTryOnInput) { await delay(650); return sceneImages[input.scene] ?? sceneImages.casual; }
  async analyzeStyleProfile(input: StyleProfileInput) {
    await delay(400);
    const colors = [...new Set(input.wardrobe.map((item) => item.color))].slice(0, 4);
    return { summary: 'Phong cách linh hoạt, dễ phối đồ hằng ngày.', primaryStyles: ['casual'], preferredColors: colors, recommendations: ['Thêm một lớp outerwear trung tính để phối nhiều dịp hơn.'] };
  }
}

const apiBaseUrl = process.env.EXPO_PUBLIC_AI_API_BASE_URL?.replace(/\/$/, '');
const timeoutMs = 12_000;

export class BackendAiProvider implements AiProvider {
  detectClothingFromImage(uri: string) {
    const form = new FormData();
    form.append('image', { uri, name: 'clothing.jpg', type: 'image/jpeg' } as unknown as Blob);
    return this.post<DetectedClothingMeta>('/clothing/detect', form);
  }
  suggestOutfits(input: OutfitSuggestionInput) { return this.post<ReturnType<MockAiProvider['suggestOutfits']> extends Promise<infer T> ? T : never>('/outfits/recommend', input); }
  generateVirtualTryOn(input: VirtualTryOnInput) {
    const form = new FormData();
    form.append('image', { uri: input.userPhotoUri, name: 'user-photo.jpg', type: 'image/jpeg' } as unknown as Blob);
    form.append('outfitItemIds', JSON.stringify(input.outfitItemIds));
    form.append('scene', input.scene);
    return this.post<string>('/try-on/generate', form);
  }
  analyzeStyleProfile(input: StyleProfileInput) { return this.post<Awaited<ReturnType<MockAiProvider['analyzeStyleProfile']>>>('/style-profile/analyze', input); }

  private async post<T>(path: string, body: unknown): Promise<T> {
    if (!apiBaseUrl) throw new AiServiceError('AI backend chưa được cấu hình.', 'config');
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const token = await getFirebaseAuth().currentUser?.getIdToken();
        const isForm = body instanceof FormData;
        const response = await fetch(`${apiBaseUrl}${path}`, {
          method: 'POST',
          headers: { ...(isForm ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: isForm ? body : JSON.stringify(body), signal: controller.signal,
        });
        if (!response.ok) throw new AiServiceError(`AI backend trả về lỗi ${response.status}.`, 'server');
        return (await response.json()) as T;
      } catch (error) {
        lastError = error;
        if (error instanceof AiServiceError && error.code === 'server') throw error;
        if (attempt === 0) await delay(300);
      } finally { clearTimeout(timer); }
    }
    if (lastError instanceof Error && lastError.name === 'AbortError') throw new AiServiceError('AI phản hồi quá lâu.', 'timeout');
    throw new AiServiceError('Không thể kết nối dịch vụ AI.', 'network');
  }
}

function delay(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }
