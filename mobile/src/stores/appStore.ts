import { create } from 'zustand';
import {
  mockClothing, mockCommunityListings, mockEvents, mockMissions, mockOutfits,
  mockTrends, mockUser, mockWeather,
} from '@/data/mockData';
import type {
  AffiliateProduct, ClothingItem, CommunityListing, FashionTrend, ListingReport, MarketplaceMessage, MembershipPlan,
  Mission, Outfit, PlanLimit, TradeOffer, Transaction, User, WardrobeEvent, WeatherInfo,
} from '@/models';
import { useAuthStore } from '@/stores/authStore';
import {
  affiliateProductsService, clothesService, eventsService, listingReportsService, listingsService,
  marketplaceMessagesService, missionsService, outfitsService, planLimitsService, tradeOffersService,
  transactionsService, trendsService, userMissionsService, usersService,
} from '@/services/api/resources';
import { clothingImagesService } from '@/services/firebase';
import { DEFAULT_MISSIONS, PLAN_LIMITS } from '@/constants/membership';

const useMocks = () => process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
const emptyUser: User = { id: '', username: '', email: '', plan: 'free', aiUsageRemaining: 0, aiUsageMonthlyLimit: 0, aiQuotaPeriod: '', closetItemLimit: 0, closetItemCount: 0, createdAt: '' };
const emptyPlanLimits: Record<MembershipPlan, PlanLimit> = {
  free: { id: 'free', label: '—', aiMonthly: 0, closetItems: 0 },
  premium: { id: 'premium', label: '—', aiMonthly: 0, closetItems: 0 },
  elite: { id: 'elite', label: '—', aiMonthly: 0, closetItems: 0 },
};
type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface AppState {
  user: User; weather: WeatherInfo; clothing: ClothingItem[]; outfits: Outfit[];
  events: WardrobeEvent[]; trends: FashionTrend[]; missions: Mission[];
  communityListings: CommunityListing[]; savedOutfitIds: string[];
  affiliateProducts: AffiliateProduct[];
  closetViewMode: 'grid' | 'list'; loadState: LoadState; error?: string;
  planLimits: Record<MembershipPlan, PlanLimit>;
  initialize: () => Promise<void>;
  resetSession: () => void;
  setClosetViewMode: (mode: 'grid' | 'list') => void;
  toggleFavorite: (id: string) => Promise<void>;
  saveOutfit: (id: string) => Promise<void>;
  addClothingToOutfit: (clothingId: string, outfitId: string) => Promise<void>;
  canUseAiTry: () => boolean;
  consumeAiTry: (persist?: boolean) => Promise<void>;
  completeMission: (id: string) => Promise<void>;
  claimMission: (id: string) => Promise<void>;
  createClothing: (item: Omit<ClothingItem, 'id' | 'imageUrl'>, localImageUri: string) => Promise<void>;
  updateClothing: (id: string, patch: Partial<ClothingItem>) => Promise<void>;
  deleteClothing: (id: string) => Promise<void>;
  createEvent: (event: Omit<WardrobeEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, patch: Partial<WardrobeEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  createListing: (listing: Omit<CommunityListing, 'id'>) => Promise<void>;
  updateListing: (id: string, patch: Partial<CommunityListing>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  sendMarketplaceMessage: (message: Omit<MarketplaceMessage, 'id'>) => Promise<void>;
  createTradeOffer: (offer: Omit<TradeOffer, 'id'>) => Promise<void>;
  createListingReport: (report: Omit<ListingReport, 'id' | 'status'>) => Promise<void>;
  createTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<Transaction>;
}

const reportError = (set: (patch: Partial<AppState>) => void, error: unknown) => {
  set({ error: error instanceof Error ? error.message : 'Không thể đồng bộ dữ liệu. Thử lại nhé.' });
};
const currentQuotaPeriod = () => new Date().toISOString().slice(0, 7);
const missionRewardPeriod = (mission: Mission) => mission.type === 'daily_checkin'
  ? new Date().toISOString().slice(0, 10)
  : currentQuotaPeriod();
const userMissionId = (userId: string, missionId: string) => `${userId}_${missionId}`;
const applyPlanLimit = (user: User, limits: Record<MembershipPlan, PlanLimit>) => {
  const limit = limits[user.plan];
  const reset = user.aiQuotaPeriod !== currentQuotaPeriod();
  return {
    ...user,
    aiQuotaPeriod: currentQuotaPeriod(),
    aiUsageMonthlyLimit: limit.aiMonthly,
    aiUsageRemaining: reset ? limit.aiMonthly : user.aiUsageRemaining,
    closetItemLimit: limit.closetItems,
  };
};
const mergeMissionState = (definitions: Mission[], progress: Mission[]) => definitions
  .filter((mission) => mission.isActive !== false)
  .map((mission) => {
    const saved = progress.find((item) => item.missionId === mission.id);
    const rewardPeriod = missionRewardPeriod(mission);
    return saved?.rewardPeriod === rewardPeriod
      ? { ...mission, ...saved, id: mission.id }
      : { ...mission, id: mission.id, progress: 0, isCompleted: false, isClaimed: false, rewardPeriod };
  });

export const useAppStore = create<AppState>((set, get) => ({
  user: useMocks() ? mockUser : emptyUser, weather: mockWeather, clothing: useMocks() ? mockClothing : [],
  outfits: useMocks() ? mockOutfits : [], events: useMocks() ? mockEvents : [],
  trends: useMocks() ? mockTrends : [], missions: useMocks() ? mockMissions : [],
  communityListings: useMocks() ? mockCommunityListings : [],
  affiliateProducts: [],
  savedOutfitIds: ['o2'], closetViewMode: 'grid', loadState: 'idle',
  planLimits: useMocks() ? PLAN_LIMITS : emptyPlanLimits,
  initialize: async () => {
    if (useMocks()) return set({ loadState: 'ready', user: applyPlanLimit(mockUser, PLAN_LIMITS), clothing: mockClothing, outfits: mockOutfits, events: mockEvents, communityListings: mockCommunityListings, missions: mergeMissionState(DEFAULT_MISSIONS, mockMissions) });
    set({ loadState: 'loading', error: undefined });
    try {
      const authUser = useAuthStore.getState().appUser;
      const [remoteLimits, missionDefinitions, trends, approvedListings, affiliateProducts] = await Promise.all([
        planLimitsService.list({ status: 'active' }), missionsService.list({ status: 'active' }),
        trendsService.list({ status: 'published' }), listingsService.list({ status: 'approved' }),
        affiliateProductsService.list({ status: 'active' }),
      ]);
      const planLimits = remoteLimits.reduce((all, limit) => ({ ...all, [limit.id]: limit }), { ...emptyPlanLimits });
      if (!authUser) return set({ loadState: 'ready', planLimits, trends, missions: missionDefinitions, communityListings: approvedListings, affiliateProducts, clothing: [], outfits: [], events: [], savedOutfitIds: [] });
      const userId = authUser.id;
      const [user, clothing, outfits, events, userMissions, ownListings] = await Promise.all([
        usersService.get(userId), clothesService.list({ userId }), outfitsService.list({ userId }),
        eventsService.list({ userId }), userMissionsService.list({ userId }), listingsService.list({ userId }),
      ]);
      const communityListings = [...approvedListings, ...ownListings.filter((listing) => !approvedListings.some((approved) => approved.id === listing.id))];
      const currentUser = applyPlanLimit(user, planLimits);
      const mergedMissions = mergeMissionState(missionDefinitions, userMissions);
      set({
        user: currentUser, clothing, outfits, events, trends, missions: mergedMissions, planLimits, communityListings, affiliateProducts,
        savedOutfitIds: outfits.filter((item) => item.isSaved).map((item) => item.id),
        loadState: 'ready',
      });
    } catch {
      set({ loadState: 'error', error: 'Không thể tải dữ liệu. Kiểm tra kết nối rồi thử lại nhé.' });
    }
  },
  resetSession: () => set({ user: useMocks() ? mockUser : emptyUser, clothing: [], outfits: [], events: [], communityListings: [], affiliateProducts: [], missions: [], savedOutfitIds: [], loadState: 'idle', error: undefined }),
  setClosetViewMode: (closetViewMode) => set({ closetViewMode }),
  toggleFavorite: async (id) => {
    const item = get().clothing.find((value) => value.id === id); if (!item) return;
    const patch = { isFavorite: !item.isFavorite };
    set({ clothing: get().clothing.map((value) => value.id === id ? { ...value, ...patch } : value) });
    if (!useMocks()) try { await clothesService.update(id, patch); } catch (error) { reportError(set, error); }
  },
  saveOutfit: async (id) => {
    set({ savedOutfitIds: [...new Set([...get().savedOutfitIds, id])], outfits: get().outfits.map((o) => o.id === id ? { ...o, isSaved: true } : o) });
    if (!useMocks()) try { await outfitsService.update(id, { isSaved: true }); } catch (error) { reportError(set, error); }
  },
  addClothingToOutfit: async (clothingId, outfitId) => {
    const clothing = get().clothing.find((item) => item.id === clothingId);
    const outfit = get().outfits.find((item) => item.id === outfitId);
    if (!clothing || !outfit || outfit.items.some((item) => item.clothingId === clothingId)) return;
    const items = [...outfit.items, { clothingId, name: clothing.name, type: clothing.type }];
    if (!useMocks()) await outfitsService.update(outfitId, { items });
    set({ outfits: get().outfits.map((item) => item.id === outfitId ? { ...item, items } : item) });
  },
  canUseAiTry: () => {
    const { user } = get(); return user.plan !== 'free' || user.aiUsageRemaining > 0;
  },
  consumeAiTry: async (persist = true) => {
    const { user } = get(); if (user.plan !== 'free' || user.aiUsageRemaining <= 0) return;
    const updated = { ...user, aiUsageRemaining: user.aiUsageRemaining - 1 }; set({ user: updated });
    if (persist && !useMocks()) reportError(set, new Error('Quota production phải được cập nhật bởi AI backend.'));
  },
  completeMission: async (id) => {
    if (!useMocks()) throw new Error('Nhiệm vụ production phải được cập nhật bởi backend.');
    const mission = get().missions.find((item) => item.id === id);
    if (!mission || mission.isCompleted || mission.isClaimed) return;
    const completed = { ...mission, progress: mission.target, isCompleted: true, completedAt: new Date().toISOString(), rewardPeriod: missionRewardPeriod(mission) };
    set({ missions: get().missions.map((item) => item.id === id ? completed : item) });
  },
  claimMission: async (id) => {
    if (!useMocks()) throw new Error('Phần thưởng production phải được cấp bởi backend.');
    const mission = get().missions.find((m) => m.id === id); if (!mission || !mission.isCompleted || mission.isClaimed) return;
    const user = { ...get().user, aiUsageRemaining: get().user.aiUsageRemaining + mission.rewardAiTries };
    const claimed = { ...mission, isClaimed: true, claimedAt: new Date().toISOString() };
    set({ missions: get().missions.map((m) => m.id === id ? claimed : m), user });
  },
  createClothing: async (item, uri) => {
    try {
      const imageUrl = useMocks() ? uri : await clothingImagesService.upload(item.userId, uri);
      const created = useMocks() ? { ...item, id: `c-${Date.now()}`, imageUrl } : await clothesService.create({ ...item, imageUrl });
      const user = { ...get().user, closetItemCount: get().user.closetItemCount + 1 };
      set({ clothing: [created, ...get().clothing], user });
      if (!useMocks()) await usersService.update(user.id, { closetItemCount: user.closetItemCount });
    } catch (error) { reportError(set, error); throw error; }
  },
  updateClothing: async (id, patch) => { if (!useMocks()) await clothesService.update(id, patch); set({ clothing: get().clothing.map((item) => item.id === id ? { ...item, ...patch } : item) }); },
  deleteClothing: async (id) => { if (!useMocks()) await clothesService.remove(id); set({ clothing: get().clothing.filter((item) => item.id !== id) }); },
  createEvent: async (value) => { const item = useMocks() ? { ...value, id: `e-${Date.now()}` } : await eventsService.create(value); set({ events: [item, ...get().events] }); },
  updateEvent: async (id, patch) => { if (!useMocks()) await eventsService.update(id, patch); set({ events: get().events.map((item) => item.id === id ? { ...item, ...patch } : item) }); },
  deleteEvent: async (id) => { if (!useMocks()) await eventsService.remove(id); set({ events: get().events.filter((item) => item.id !== id) }); },
  createListing: async (value) => { const item = useMocks() ? { ...value, id: `l-${Date.now()}` } : await listingsService.create(value); set({ communityListings: [item, ...get().communityListings] }); },
  updateListing: async (id, patch) => { if (!useMocks()) await listingsService.update(id, patch); set({ communityListings: get().communityListings.map((item) => item.id === id ? { ...item, ...patch } : item) }); },
  deleteListing: async (id) => { if (!useMocks()) await listingsService.remove(id); set({ communityListings: get().communityListings.filter((item) => item.id !== id) }); },
  sendMarketplaceMessage: async (value) => { if (!useMocks()) await marketplaceMessagesService.create(value); },
  createTradeOffer: async (value) => { if (!useMocks()) await tradeOffersService.create(value); },
  createListingReport: async (value) => {
    const report = { ...value, status: 'open' as const };
    if (!useMocks()) await listingReportsService.create(report);
    set({ communityListings: get().communityListings.map((item) => item.id === value.listingId ? { ...item, reportsCount: item.reportsCount + 1 } : item) });
  },
  createTransaction: async (value) => {
    const transaction = useMocks() ? { ...value, id: `tx-${Date.now()}` } : await transactionsService.create(value);
    return transaction;
  },
}));
