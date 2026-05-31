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

export type MissionType =
  | 'daily_checkin'
  | 'watch_ad'
  | 'survey'
  | 'invite_friend'
  | 'share_outfit';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  fashionStyle?: string;
  preferences?: string[];
  plan: MembershipPlan;
  aiUsageRemaining: number;
  aiUsageMonthlyLimit: number;
  closetItemLimit: number;
  closetItemCount: number;
  planExpiresAt?: string;
  createdAt: string;
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
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  rewardAiTries: number;
  progress: number;
  target: number;
  isCompleted: boolean;
  isClaimed: boolean;
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
  createdAt: string;
}

export interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  amount: number;
  platformFee: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'event' | 'ai' | 'mission' | 'community' | 'membership';
  read: boolean;
  createdAt: string;
}

export interface WeatherInfo {
  temperature: number;
  condition: string;
  icon: string;
  location: string;
  humidity?: number;
}
