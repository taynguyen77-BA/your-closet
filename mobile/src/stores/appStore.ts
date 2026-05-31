import { create } from 'zustand';
import {
  mockClothing,
  mockCommunityListings,
  mockEvents,
  mockMissions,
  mockOutfits,
  mockTrends,
  mockUser,
  mockWeather,
} from '@/data/mockData';
import type {
  ClothingItem,
  CommunityListing,
  FashionTrend,
  Mission,
  Outfit,
  User,
  WardrobeEvent,
  WeatherInfo,
} from '@/models';

interface AppState {
  user: User;
  weather: WeatherInfo;
  clothing: ClothingItem[];
  outfits: Outfit[];
  events: WardrobeEvent[];
  trends: FashionTrend[];
  missions: Mission[];
  communityListings: CommunityListing[];
  savedOutfitIds: string[];
  closetViewMode: 'grid' | 'list';

  setClosetViewMode: (mode: 'grid' | 'list') => void;
  toggleFavorite: (id: string) => void;
  saveOutfit: (id: string) => void;
  useAiTry: () => boolean;
  claimMission: (id: string) => void;
  addClothing: (item: ClothingItem) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: mockUser,
  weather: mockWeather,
  clothing: mockClothing,
  outfits: mockOutfits,
  events: mockEvents,
  trends: mockTrends,
  missions: mockMissions,
  communityListings: mockCommunityListings,
  savedOutfitIds: ['o2'],
  closetViewMode: 'grid',

  setClosetViewMode: (mode) => set({ closetViewMode: mode }),

  toggleFavorite: (id) =>
    set((state) => ({
      clothing: state.clothing.map((c) =>
        c.id === id ? { ...c, isFavorite: !c.isFavorite } : c,
      ),
    })),

  saveOutfit: (id) =>
    set((state) => ({
      savedOutfitIds: state.savedOutfitIds.includes(id)
        ? state.savedOutfitIds
        : [...state.savedOutfitIds, id],
      outfits: state.outfits.map((o) =>
        o.id === id ? { ...o, isSaved: true } : o,
      ),
    })),

  useAiTry: () => {
    const { user } = get();
    if (user.plan !== 'free') return true;
    if (user.aiUsageRemaining <= 0) return false;
    set({
      user: { ...user, aiUsageRemaining: user.aiUsageRemaining - 1 },
    });
    return true;
  },

  claimMission: (id) =>
    set((state) => {
      const mission = state.missions.find((m) => m.id === id);
      if (!mission || !mission.isCompleted || mission.isClaimed) return state;
      return {
        missions: state.missions.map((m) =>
          m.id === id ? { ...m, isClaimed: true } : m,
        ),
        user: {
          ...state.user,
          aiUsageRemaining:
            state.user.aiUsageRemaining + mission.rewardAiTries,
        },
      };
    }),

  addClothing: (item) =>
    set((state) => ({
      clothing: [item, ...state.clothing],
      user: {
        ...state.user,
        closetItemCount: state.user.closetItemCount + 1,
      },
    })),
}));
