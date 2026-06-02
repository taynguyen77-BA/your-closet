import type {
  AppNotification,
  ClothingItem,
  CommunityListing,
  ListingReport,
  MarketplaceMessage,
  Mission,
  Outfit,
  PlanLimit,
  Transaction,
  TradeOffer,
  User,
  WardrobeEvent,
} from '@/models';
import type { AiUsageLog } from '@/services/ai/types';
import { createRepository, uploadImage } from './repository';

export const usersService = createRepository<User>('users');
export const clothesService = createRepository<ClothingItem>('clothes');
export const outfitsService = createRepository<Outfit>('outfits');
export const eventsService = createRepository<WardrobeEvent>('events');
export const listingsService = createRepository<CommunityListing>('listings');
export const missionsService = createRepository<Mission>('missions');
export const planLimitsService = createRepository<PlanLimit>('plan_limits');
export const userMissionsService = createRepository<Mission & { userId: string }>('user_missions');
export const transactionsService = createRepository<Transaction>('transactions');
export const marketplaceMessagesService = createRepository<MarketplaceMessage>('marketplace_messages');
export const tradeOffersService = createRepository<TradeOffer>('trade_offers');
export const listingReportsService = createRepository<ListingReport>('listing_reports');
export const notificationsService = createRepository<AppNotification>('notifications');
export const aiUsageLogsService = createRepository<AiUsageLog & { id: string }>('ai_logs');
export const clothingImagesService = { upload: uploadImage };
