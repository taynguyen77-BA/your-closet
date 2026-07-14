import type { AiProvider, ClothingImageAnalysis, DetectedClothingMeta, MissingOutfitItem, OutfitRecommendation, OutfitSuggestionInput, StyleProfileInput, VirtualTryOnInput } from './types';
import type { ClothingItem } from '@/models';
import { getFirebaseAuth } from '@/services/firebase/config';

const MOCK_DETECTION: DetectedClothingMeta = {
  type: 'top', material: 'Cotton blend', color: 'Soft Pink', style: 'Casual',
  season: ['spring', 'summer'], tags: ['casual', 'everyday'], suggestedName: 'Áo thun pastel',
};

const MOCK_ANALYSIS: ClothingImageAnalysis = {
  ...MOCK_DETECTION,
  confidenceScore: 0.91,
  qualityWarnings: [],
  enhancedImageCandidates: [
    { id: 'clean-front', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900', label: 'Ảnh sạch nền sáng', confidence: 0.9 },
    { id: 'catalog-flatlay', imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=900', label: 'Ảnh kiểu catalog', confidence: 0.84 },
  ],
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
  async analyzeAndEnhanceClothingImage(): Promise<ClothingImageAnalysis> { await delay(550); return MOCK_ANALYSIS; }
  async suggestOutfits(input: OutfitSuggestionInput): Promise<OutfitRecommendation[]> {
    await delay(500);
    const dislikedColors = new Set((input.dislikedColors ?? []).map((item) => item.toLowerCase()));
    const dislikedStyles = new Set((input.dislikedStyles ?? []).map((item) => item.toLowerCase()));
    const allowed = input.wardrobe.filter((item) => !dislikedColors.has(item.color.toLowerCase()) && !dislikedStyles.has((item.style ?? '').toLowerCase()));
    const byPriority = [...allowed].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || a.timesWorn - b.timesWorn);
    const pick = (types: string[]) => byPriority.find((item) => types.includes(item.type));
    const top = pick(['top']);
    const bottom = pick(['bottom']);
    const dress = pick(['dress']);
    const shoes = pick(['shoes']);
    const bag = pick(['bag', 'accessory']);
    const selected = [dress ?? top, dress ? undefined : bottom, shoes, bag].filter(isClothingItem);
    if (!selected.length) return [];
    const missing: MissingOutfitItem[] = ([
      !shoes ? { type: 'shoes', name: 'Một đôi giày hợp dịp', reason: `Tủ đồ chưa có giày rõ vai trò cho ${input.eventContext?.name ?? input.location ?? input.weather.location}.`, priority: 'high' as const } : undefined,
      !bag ? { type: 'bag', name: 'Túi hoặc phụ kiện hoàn thiện outfit', reason: 'Một phụ kiện nhỏ sẽ làm bộ đồ có chủ đích hơn mà không cần mua cả set mới.', priority: 'medium' as const } : undefined,
    ] as Array<MissingOutfitItem | undefined>).filter(isMissingItem);
    const communityListingSuggestions = missing.length ? (input.communityListings ?? []).slice(0, 2).map((listing) => ({
      listingId: listing.id,
      title: listing.title,
      reason: `Khớp phần còn thiếu: ${missing[0]?.name.toLowerCase()}. Ưu tiên cộng đồng trước khi mua mới.`,
      imageUrl: listing.imageUrls[0],
      priceLabel: listing.price ? `${listing.price.toLocaleString('vi-VN')}đ` : listing.listingType,
    })) : [];
    const affiliateShoppingSuggestions = missing.length && communityListingSuggestions.length === 0 ? (input.affiliateProducts ?? []).slice(0, 2).map((product) => ({
      productId: product.id,
      name: product.name,
      store: product.store,
      reason: `Chỉ gợi ý mua vì tủ đồ thiếu ${missing[0]?.name.toLowerCase()}.`,
      imageUrl: product.imageUrl,
      priceLabel: product.priceLabel,
      link: product.link,
    })) : [];
    const styleNames = input.userStylePreferences?.preferredStyles?.join(', ') || input.advancedStylePreferences?.fitPreference || 'phong cách thường ngày của bạn';
    return [{
      name: `${input.mood ? `${input.mood} ` : ''}${input.eventContext?.name ?? input.location ?? input.weather.condition}`,
      items: selected.map((c) => ({ clothingId: c.id, name: c.name, type: c.type, imageUrl: c.enhancedImageUrl ?? c.imageUrl, reason: c.isFavorite ? 'Món bạn yêu thích nên giữ làm điểm neo.' : c.timesWorn < 3 ? 'Món ít mặc, đáng được tái sử dụng.' : 'Có màu và chất liệu dễ phối.' })),
      aiExplanation: `Bộ này bắt đầu từ đồ có sẵn trong tủ, hợp ${styleNames}, rồi cân bằng với thời tiết ${input.weather.temperature}°C tại ${input.location ?? input.weather.location}.`,
      tasteMatchExplanation: `Ưu tiên ${styleNames}; tránh ${[...dislikedColors, ...dislikedStyles].join(', ') || 'các lựa chọn lệch gu đã khai báo'}.`,
      weatherCompatibility: `${input.weather.condition}, ${input.weather.temperature}°C${input.weather.humidity ? `, độ ẩm ${input.weather.humidity}%` : ''}. Chất liệu và độ thoáng được ưu tiên.`,
      locationEventCompatibility: `${input.location ?? input.weather.location}${input.dressCode ? ` · dress code: ${input.dressCode}` : ''}. Outfit giữ mức lịch sự theo bối cảnh.`,
      colorMatching: `Các màu ${selected.map((item) => item.color).join(', ')} đi theo nhóm trung tính, dễ nhìn ngoài trời lẫn trong nhà.`,
      styleMatching: 'Personal stylist match',
      styleScore: missing.length ? 84 : 92,
      matchingScore: missing.length ? 84 : 92,
      missingItems: missing,
      communityListingSuggestions,
      affiliateShoppingSuggestions,
      confidenceScore: missing.length ? 0.82 : 0.91,
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
  analyzeAndEnhanceClothingImage(uri: string) {
    const form = new FormData();
    form.append('image', { uri, name: 'clothing.jpg', type: 'image/jpeg' } as unknown as Blob);
    return this.post<ClothingImageAnalysis>('/clothing/analyze-and-enhance', form);
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
    for (let attempt = 0; attempt < 3; attempt += 1) {
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
        if (attempt < 2) await delay(300 * (attempt + 1));
      } finally { clearTimeout(timer); }
    }
    if (lastError instanceof Error && lastError.name === 'AbortError') throw new AiServiceError('AI phản hồi quá lâu.', 'timeout');
    throw new AiServiceError('Không thể kết nối dịch vụ AI.', 'network');
  }
}

function delay(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function isClothingItem(item: ClothingItem | undefined): item is ClothingItem { return Boolean(item); }
function isMissingItem(item: MissingOutfitItem | undefined): item is MissingOutfitItem { return Boolean(item); }
