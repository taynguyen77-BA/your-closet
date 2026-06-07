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

export interface AiResult<T> {
  data: T;
  source: 'real' | 'mock';
  quotaChargeEligible: boolean;
  quotaManagedByBackend: boolean;
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
