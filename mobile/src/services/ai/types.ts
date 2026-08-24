import type { AdvancedStylePreferences, AffiliateProduct, ClothingItem, CommunityListing, Outfit, StylePreferences, User, WardrobeEvent, WeatherInfo } from '@/models';

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

export interface EnhancedClothingCandidate {
  id: string;
  imageUrl: string;
  label?: string;
  confidence?: number;
}

export interface ClothingImageAnalysis extends DetectedClothingMeta {
  confidenceScore: number;
  qualityWarnings: string[];
  enhancedImageCandidates: EnhancedClothingCandidate[];
}

export interface ClothingReviewDraft {
  originalImageUrl: string;
  selectedImageUrl: string;
  /** Local source URI retained only for retry/re-upload after a failed save. */
  sourceImageUri?: string;
  /** Server-issued Storage object path for the original upload; not AI/user-editable. */
  storagePath?: string;
  storedUpload?: { url: string; path: string };
  /** Stable logical create key reused if the user retries save. */
  createRequestId?: string;
  analysis?: ClothingImageAnalysis;
  name: string;
  type: ClothingItem['type'];
  material?: string;
  color: string;
  style?: string;
  season: string[];
  tags: string[];
  confidenceScore?: number;
  qualityWarnings: string[];
  enhancedImageCandidates: EnhancedClothingCandidate[];
}

export interface OutfitSuggestionInput {
  userStylePreferences?: StylePreferences;
  advancedStylePreferences?: AdvancedStylePreferences;
  weather: WeatherInfo;
  wardrobe: ClothingItem[];
  eventContext?: WardrobeEvent;
  events?: WardrobeEvent[];
  location?: string;
  mood?: string;
  dressCode?: string;
  budgetPreference?: string;
  dislikedColors?: string[];
  dislikedStyles?: string[];
  savedOutfits?: Outfit[];
  rarelyWornItems?: ClothingItem[];
  favoriteItems?: ClothingItem[];
  communityListings?: CommunityListing[];
  affiliateProducts?: AffiliateProduct[];
}

export interface OutfitSuggestionItem {
  clothingId: string;
  name: string;
  type: ClothingItem['type'];
  imageUrl?: string;
  reason?: string;
}

export interface MissingOutfitItem {
  type: ClothingItem['type'] | string;
  name: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

export interface SuggestedCommunityListing {
  listingId: string;
  title: string;
  reason: string;
  imageUrl?: string;
  priceLabel?: string;
}

export interface SuggestedAffiliateProduct {
  productId: string;
  name: string;
  store: string;
  reason: string;
  imageUrl?: string;
  priceLabel?: string;
  link?: string;
}

export interface OutfitRecommendation {
  name: string;
  items: OutfitSuggestionItem[];
  aiExplanation: string;
  tasteMatchExplanation: string;
  weatherCompatibility: string;
  locationEventCompatibility: string;
  colorMatching: string;
  styleMatching?: string;
  styleScore: number;
  matchingScore: number;
  missingItems: MissingOutfitItem[];
  communityListingSuggestions: SuggestedCommunityListing[];
  affiliateShoppingSuggestions: SuggestedAffiliateProduct[];
  confidenceScore: number;
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

/**
 * Fields the AI backend attaches to every routed response so the client can honour
 * the fallback rule (AC 45.4 / BRD 3.4.6.3 / BRD Section 9).
 */
export interface AiFallbackMeta {
  modelUsed?: string;
  fallbackUsed?: boolean;
}

export interface AiResult<T> {
  data: T;
  source: 'real' | 'mock';
  /** false when a fallback model served the result — a fallback must not charge quota. */
  quotaChargeEligible: boolean;
  quotaManagedByBackend: boolean;
  /** true when a lower-cost fallback model served this result. */
  fallbackUsed: boolean;
  fallbackMessage?: string;
}

export interface AiProvider {
  detectClothingFromImage(uri: string): Promise<DetectedClothingMeta>;
  analyzeAndEnhanceClothingImage(uri: string): Promise<ClothingImageAnalysis>;
  suggestOutfits(input: OutfitSuggestionInput): Promise<OutfitRecommendation[]>;
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
