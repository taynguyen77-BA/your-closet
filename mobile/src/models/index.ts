export type MembershipPlan = 'free' | 'premium' | 'elite';

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

export type MissionType =
  | 'daily_checkin'
  | 'watch_ad'
  | 'survey'
  | 'invite_friend'
  | 'share_outfit';

export interface User {
  id: string;
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
  provider?: 'phone' | 'google' | 'facebook' | 'email' | string;
  biometricEnabled?: boolean;
  hasCompletedOnboarding?: boolean;
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
  enhancedImageUrl?: string;
  type: ClothingType;
  material?: string;
  color: string;
  style?: string;
  season?: string[];
  tags: string[];
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
  listingType: ListingType;
  price?: number;
  size?: string;
  gender?: string;
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
  imageUrl?: string;
  priceLabel?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface WeatherInfo {
  temperature: number;
  condition: string;
  icon: string;
  location: string;
  humidity?: number;
}
