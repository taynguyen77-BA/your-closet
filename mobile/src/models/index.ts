export type MembershipPlan = 'free' | 'pro' | 'premium';

export type ClothingType =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'shoes'
  | 'accessory'
  | 'bag'
  | 'other';

export type EventType =
  | 'wedding'
  | 'party'
  | 'work'
  | 'date'
  | 'travel'
  | 'casual'
  | 'formal'
  | 'other';

export type ListingType = 'sale' | 'trade' | 'giveaway';
export type ListingStatus = 'pending_review' | 'approved' | 'rejected';
export type TransactionStatus = 'pending' | 'paid' | 'shipped' | 'handed_over' | 'completed' | 'cancelled';
export type FashionConfidence =
  | 'easy_basics'
  | 'better_everyday'
  | 'explore_new_styles'
  | 'fashion_focused'
  | string;

export interface StylePreferences {
  preferredStyles: string[];
  favoriteColors: string[];
  lifestyleOccasions: string[];
  fashionConfidence: FashionConfidence;
  gender?: string;
  ageGroup?: string;
  dislikedColors?: string[];
  updatedAt?: string;
}

export interface AdvancedStylePreferences {
  bodyShape?: string;
  heightCm?: number;
  weightKg?: number;
  topSize?: string;
  bottomSize?: string;
  shoeSize?: string;
  favoriteBrands?: string[];
  budgetLevel?: string;
  fitPreference?: string;
  avoidStyles?: string[];
  dislikedColors?: string[];
  updatedAt?: string;
}

export type MissionType =
  | 'daily_checkin'
  | 'watch_ad'
  | 'survey'
  | 'invite_friend'
  | 'share_outfit';

export interface User {
  id: string;
  uid?: string;
  name?: string;
  username: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  displayName?: string;
  gender?: string;
  dateOfBirth?: string;
  fashionStyle?: string;
  preferences?: string[];
  favoriteColors?: string[];
  fashionGoals?: string[];
  authProvider?: string;
  provider?: 'phone' | 'google' | 'facebook' | string;
  biometricEnabled?: boolean;
  hasCompletedOnboarding?: boolean;
  hasCompletedStyleSurvey?: boolean;
  styleSurveySkipped?: boolean;
  styleSurveyCompletedAt?: string;
  styleProfileCompletionPercent?: number;
  styleProfileRewardClaimed?: boolean;
  stylePreferences?: StylePreferences;
  advancedStylePreferences?: AdvancedStylePreferences;
  status?: 'active' | 'suspended' | 'banned';
  lastLoginAt?: string;
  plan: MembershipPlan;
  aiUsageRemaining: number;
  aiUsageMonthlyLimit: number;
  aiQuotaPeriod: string;
  closetItemLimit: number;
  closetItemCount: number;
  planExpiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClothingItem {
  id: string;
  userId: string;
  name: string;
  imageUrl: string;
  originalImageUrl?: string;
  enhancedImageUrl?: string;
  type: ClothingType;
  material?: string;
  color: string;
  style?: string;
  season?: string[];
  tags: string[];
  aiMetadata?: Record<string, unknown>;
  aiConfidenceScore?: number;
  aiQualityWarnings?: string[];
  isFavorite: boolean;
  timesWorn: number;
  createdAt: string;
  updatedAt?: string;
}

export interface OutfitItemRef {
  clothingId: string;
  name: string;
  type: ClothingType;
}

export interface Outfit {
  id: string;
  userId: string;
  name: string;
  previewImageUrl?: string;
  items: OutfitItemRef[];
  aiExplanation?: string;
  weatherCompatibility?: string;
  colorMatching?: string;
  styleMatching?: string;
  matchingScore?: number;
  eventId?: string;
  isSaved: boolean;
  createdAt: string;
  updatedAt?: string;
  status?: 'active' | 'hidden' | 'removed';
}

export interface WardrobeEvent {
  id: string;
  userId: string;
  name: string;
  date: string;
  location: string;
  eventType: EventType;
  dressCode?: string;
  weatherStyle?: string;
  mood?: string;
  linkedOutfitIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface FashionTrend {
  id: string;
  name: string;
  description: string;
  season: string;
  eventType?: EventType;
  location?: string;
  previewImageUrl?: string;
  matchingItemIds: string[];
  missingItemSuggestions: string[];
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface Mission {
  id: string;
  missionId?: string;
  title: string;
  description: string;
  type: MissionType;
  rewardAiTries: number;
  progress: number;
  target: number;
  isCompleted: boolean;
  isClaimed: boolean;
  isActive?: boolean;
  completedAt?: string;
  claimedAt?: string;
  rewardPeriod?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanLimit {
  id: MembershipPlan;
  label: string;
  aiMonthly: number;
  closetItems: number;
  status?: 'active' | 'inactive';
  updatedAt?: string;
  priceLabel?: string;
  features?: string[];
  badge?: string;
}

export interface CmsContent {
  id: string;
  key: string;
  type: 'home_banner' | 'onboarding_slide' | 'faq' | 'legal' | 'seasonal_collection' | string;
  title: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  locale?: string;
  status: 'draft' | 'published' | 'archived';
  sortOrder?: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminSetting {
  id: string;
  value: unknown;
  scope?: 'mobile' | 'admin' | 'backend' | string;
  status?: 'active' | 'inactive';
  updatedAt?: string;
}

export interface CommunityListing {
  id: string;
  userId: string;
  sellerName: string;
  sellerAvatarUrl?: string;
  clothingItemId: string;
  title: string;
  description: string;
  imageUrls: string[];
  condition: 'new' | 'like_new' | 'good' | 'fair';
  conditionScore?: number;
  listingType: ListingType;
  type?: ClothingType;
  category?: ClothingType | string;
  color?: string;
  styleTags?: string[];
  price?: number;
  size?: string;
  gender?: string;
  material?: string;
  location: string;
  tags: string[];
  status: ListingStatus;
  moderationNote?: string;
  reportsCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  amount: number;
  platformFeePercentage: number;
  platformFee: number;
  status: TransactionStatus;
  source?: 'ai_stylist' | 'community' | 'direct' | string;
  recommendationId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MarketplaceMessage {
  id: string;
  listingId: string;
  senderId: string;
  sellerId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TradeOffer {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  offeredClothingItemId?: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface ListingReport {
  id: string;
  listingId: string;
  reporterId: string;
  reason: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'event' | 'ai' | 'mission' | 'community' | 'membership';
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AffiliateProduct {
  id: string;
  name: string;
  store: string;
  link: string;
  category?: ClothingType | string;
  type?: ClothingType | string;
  colors?: string[];
  styleTags?: string[];
  sizes?: string[];
  gender?: string;
  price?: number;
  commissionRate?: number;
  partnerName?: string;
  deeplink?: string;
  trackingCode?: string;
  imageUrl?: string;
  priceLabel?: string;
  status?: 'active' | 'inactive';
  clicks?: number;
  conversions?: number;
  revenueVnd?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ShoppingEventType = 'affiliate_click' | 'product_impression' | 'community_item_click';

export interface ShoppingEvent {
  id: string;
  userId: string;
  eventType: ShoppingEventType;
  targetType: 'affiliate_product' | 'community_listing';
  targetId: string;
  source: 'ai_stylist' | 'shopping' | 'community' | string;
  recommendationId?: string;
  reason?: string;
  outfitId?: string;
  createdAt: string;
}

export interface WeatherInfo {
  temperature: number;
  condition: string;
  icon: string;
  location: string;
  humidity?: number;
}
