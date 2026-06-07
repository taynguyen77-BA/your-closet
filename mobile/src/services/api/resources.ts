import type {
  AdminSetting, AffiliateProduct, AppNotification, ClothingItem, CmsContent, CommunityListing, ListingReport, MarketplaceMessage, Mission,
  FashionTrend, Outfit, PlanLimit, ShoppingEvent, TradeOffer, Transaction, User, WardrobeEvent,
} from '@/models';
import type { AiUsageLog } from '@/services/ai/types';
import { apiFetch } from './client';
type Entity = { id: string };
function resource<T extends Entity>(collection: string) {
  const base = `/api/resources/${collection}`;
  return {
    list: (params?: Record<string, string>) => apiFetch<T[]>(base, { params }),
    get: (id: string) => apiFetch<T>(`${base}/${id}`),
    create: (value: Omit<T, 'id'> & { id?: string }) => apiFetch<T>(base, { method: 'POST', body: JSON.stringify(value) }),
    update: (id: string, patch: Partial<T>) => apiFetch<T>(`${base}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    remove: (id: string) => apiFetch<void>(`${base}/${id}`, { method: 'DELETE' }),
  };
}
export const usersService = resource<User>('users');
export const clothesService = resource<ClothingItem>('clothes');
export const outfitsService = resource<Outfit>('outfits');
export const eventsService = resource<WardrobeEvent>('events');
export const listingsService = resource<CommunityListing>('listings');
export const missionsService = resource<Mission>('missions');
export const trendsService = resource<FashionTrend>('trends');
export const planLimitsService = resource<PlanLimit>('plan_limits');
export const userMissionsService = resource<Mission & { userId: string }>('user_missions');
export const transactionsService = resource<Transaction>('transactions');
export const marketplaceMessagesService = resource<MarketplaceMessage>('marketplace_messages');
export const tradeOffersService = resource<TradeOffer>('trade_offers');
export const listingReportsService = resource<ListingReport>('listing_reports');
export const notificationsService = resource<AppNotification>('notifications');
export const aiUsageLogsService = resource<AiUsageLog & { id: string }>('ai_logs');
export const affiliateProductsService = resource<AffiliateProduct>('affiliate_products');
export const shoppingEventsService = resource<ShoppingEvent>('shopping_events');
export const cmsContentService = resource<CmsContent>('cms_content');
export const adminSettingsService = resource<AdminSetting>('admin_settings');
