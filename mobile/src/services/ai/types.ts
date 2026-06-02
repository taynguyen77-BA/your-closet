import type { ClothingItem, Outfit, User, WardrobeEvent, WeatherInfo } from '@/models';

export type AiFeature =
  | 'clothing_detection'
  | 'outfit_recommendation'
  | 'virtual_try_on'
  | 'style_profile';

export interface DetectedClothingMeta {
  type: ClothingItem['type'];
  material?: string;
  color: string;
  style?: string;
  season?: string[];
  tags: string[];
  suggestedName: string;
}

export interface OutfitSuggestionInput {
  weather: WeatherInfo;
  wardrobe: ClothingItem[];
  events?: WardrobeEvent[];
  stylePreferences?: string[];
}

export interface VirtualTryOnInput {
  userPhotoUri: string;
  outfitItemIds: string[];
  scene: string;
}

export interface StyleProfileInput {
  wardrobe: ClothingItem[];
  savedOutfits?: Outfit[];
  preferences?: string[];
}

export interface StyleProfile {
  summary: string;
  primaryStyles: string[];
  preferredColors: string[];
  recommendations: string[];
}

export interface AiResult<T> {
  data: T;
  source: 'real' | 'mock';
  quotaChargeEligible: boolean;
  quotaManagedByBackend: boolean;
  fallbackMessage?: string;
}

export interface AiProvider {
  detectClothingFromImage(uri: string): Promise<DetectedClothingMeta>;
  suggestOutfits(input: OutfitSuggestionInput): Promise<Partial<Outfit>[]>;
  generateVirtualTryOn(input: VirtualTryOnInput): Promise<string>;
  analyzeStyleProfile(input: StyleProfileInput): Promise<StyleProfile>;
}

export interface AiUsageLog {
  userId: string;
  feature: AiFeature;
  inputSummary: string;
  resultStatus: 'success' | 'fallback' | 'error';
  costEstimate: number;
  createdAt: string;
}

export type AiUser = Pick<User, 'id'>;
