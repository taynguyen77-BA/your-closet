import type {
  AffiliateProduct,
  ClothingItem,
  CommunityListing,
  Outfit,
  StylePreferences,
  User,
  WardrobeEvent,
  WeatherInfo,
} from '@/models';

export type RecommendationSource = 'community' | 'affiliate';
export type RecommendationReasonKey = 'complete_outfit' | 'taste_match' | 'weather_location' | 'community' | 'partner';

export interface ShoppingRecommendation {
  id: string;
  source: RecommendationSource;
  reasonKey: RecommendationReasonKey;
  reason: string;
  score: number;
  itemType?: string;
  imageUrl?: string;
  title: string;
  subtitle: string;
  priceLabel?: string;
  listing?: CommunityListing;
  product?: AffiliateProduct;
}

interface RecommendationInput {
  user: User;
  weather: WeatherInfo;
  wardrobe: ClothingItem[];
  outfits: Outfit[];
  events: WardrobeEvent[];
  communityListings: CommunityListing[];
  affiliateProducts: AffiliateProduct[];
  outfitId?: string;
}

const outfitBaseTypes = ['top', 'bottom', 'dress', 'shoes'];
const accessoryTypes = ['outerwear', 'bag', 'accessory'];
const conditionScores: Record<string, number> = { new: 1, like_new: 0.92, good: 0.76, fair: 0.54 };
const reasonLabels: Record<RecommendationReasonKey, string> = {
  complete_outfit: 'Hoàn thiện outfit này',
  taste_match: 'Hợp gu của bạn',
  weather_location: 'Phù hợp thời tiết / địa điểm',
  community: 'Từ cộng đồng',
  partner: 'Từ đối tác',
};

const normalize = (value?: string) => value?.trim().toLowerCase() ?? '';
const tokens = (values: Array<string | undefined>) => values.flatMap((value) => normalize(value).split(/[\s,;/_-]+/)).filter(Boolean);
const overlap = (left: string[], right: string[]) => left.filter((item) => right.includes(item)).length;
const priceLabel = (price?: number, fallback?: string) => price ? `${price.toLocaleString('vi-VN')}đ` : fallback;
const productUrl = (product: AffiliateProduct) => product.deeplink || product.link;

const budgetCeiling = (user: User) => {
  const level = normalize(user.advancedStylePreferences?.budgetLevel);
  if (level.includes('low') || level.includes('tiết kiệm')) return 400000;
  if (level.includes('high') || level.includes('premium') || level.includes('cao')) return 2500000;
  return 900000;
};

const preferredStyleTokens = (user: User) => tokens([
  user.fashionStyle,
  ...(user.preferences ?? []),
  ...(user.stylePreferences?.preferredStyles ?? []),
  ...(user.stylePreferences?.lifestyleOccasions ?? []),
]);

const preferredColorTokens = (user: User, outfitItems: ClothingItem[]) => tokens([
  ...(user.favoriteColors ?? []),
  ...(user.stylePreferences?.favoriteColors ?? []),
  ...outfitItems.map((item) => item.color),
]);

const linkedEvent = (events: WardrobeEvent[], outfit?: Outfit) => (
  outfit?.eventId ? events.find((event) => event.id === outfit.eventId) : events.find((event) => outfit?.id && event.linkedOutfitIds.includes(outfit.id))
);

const missingTypes = (outfit?: Outfit, wardrobe: ClothingItem[] = []) => {
  if (!outfit) return accessoryTypes;
  const used = new Set(outfit.items.map((item) => item.type));
  const needed = outfitBaseTypes.filter((type) => !used.has(type as ClothingItem['type']));
  if (needed.length) return needed;
  const wardrobeTypes = new Set(wardrobe.map((item) => item.type));
  return accessoryTypes.filter((type) => !used.has(type as ClothingItem['type']) || !wardrobeTypes.has(type as ClothingItem['type'])).slice(0, 2);
};

const rankCommon = ({
  type,
  tags,
  colors,
  price,
  location,
  gender,
  user,
  outfit,
  outfitItems,
  event,
  missing,
  weather,
}: {
  type?: string;
  tags: string[];
  colors: string[];
  price?: number;
  location?: string;
  gender?: string;
  user: User;
  outfit?: Outfit;
  outfitItems: ClothingItem[];
  event?: WardrobeEvent;
  missing: string[];
  weather: WeatherInfo;
}) => {
  const preferredStyles = preferredStyleTokens(user);
  const preferredColors = preferredColorTokens(user, outfitItems);
  const styleMatch = Math.min(overlap(tags, preferredStyles), 4) * 12;
  const colorMatch = Math.min(overlap(colors, preferredColors), 3) * 10;
  const missingMatch = type && missing.includes(normalize(type)) ? 30 : 0;
  const eventTokens = tokens([event?.eventType, event?.dressCode, event?.mood, weather.condition]);
  const eventMatch = Math.min(overlap(tags, eventTokens), 3) * 9;
  const locationMatch = location && normalize(location).includes(normalize(event?.location || weather.location)) ? 8 : 0;
  const genderMatch = !gender || !user.gender || normalize(gender).includes('unisex') || normalize(gender) === normalize(user.gender) ? 5 : -8;
  const budget = price ? Math.max(-12, 14 - Math.max(0, price - budgetCeiling(user)) / 70000) : 6;
  const outfitSignal = outfit ? 8 : 0;
  return styleMatch + colorMatch + missingMatch + eventMatch + locationMatch + genderMatch + budget + outfitSignal;
};

const reasonFor = (score: number, source: RecommendationSource, missingMatch: boolean, weatherMatch: boolean): RecommendationReasonKey => {
  if (missingMatch) return 'complete_outfit';
  if (weatherMatch) return 'weather_location';
  if (score >= 42) return 'taste_match';
  return source === 'community' ? 'community' : 'partner';
};

export const getRecommendationReasonLabel = (key: RecommendationReasonKey) => reasonLabels[key];
export const getAffiliateProductUrl = productUrl;

export function buildShoppingRecommendations(input: RecommendationInput): ShoppingRecommendation[] {
  const outfit = input.outfitId ? input.outfits.find((item) => item.id === input.outfitId) : input.outfits.find((item) => item.matchingScore || item.isSaved);
  const outfitItems = outfit?.items
    .map((ref) => input.wardrobe.find((item) => item.id === ref.clothingId))
    .filter(Boolean) as ClothingItem[] || [];
  const event = linkedEvent(input.events, outfit);
  const missing = missingTypes(outfit, input.wardrobe).map(normalize);
  const now = Date.now();

  const community = input.communityListings
    .filter((listing) => listing.status === 'approved' && listing.userId !== input.user.id)
    .map((listing) => {
      const type = normalize(listing.type || listing.category || listing.tags.find((tag) => outfitBaseTypes.concat(accessoryTypes).includes(normalize(tag))));
      const tags = tokens([listing.title, listing.description, listing.material, ...(listing.tags ?? []), ...(listing.styleTags ?? [])]);
      const colors = tokens([listing.color, listing.title]);
      const score = rankCommon({ type, tags, colors, price: listing.price, location: listing.location, gender: listing.gender, user: input.user, outfit, outfitItems, event, missing, weather: input.weather })
        + (listing.conditionScore ?? conditionScores[listing.condition] ?? 0.65) * 14
        + (listing.listingType === 'sale' ? 6 : 2)
        + Math.max(0, 7 - (now - new Date(listing.createdAt).getTime()) / 86400000 / 10);
      const reasonKey = reasonFor(score, 'community', Boolean(type && missing.includes(type)), tags.includes(normalize(input.weather.condition)) || Boolean(event?.location && normalize(listing.location).includes(normalize(event.location))));
      return {
        id: `community-${listing.id}`,
        source: 'community' as const,
        reasonKey,
        reason: reasonKey === 'complete_outfit' ? `Bù phần còn thiếu: ${listing.title}` : reasonKey === 'weather_location' ? `Gần ${event?.location || input.weather.location}, hợp bối cảnh hôm nay` : 'Tin cộng đồng khớp gu và màu bạn hay mặc',
        score,
        itemType: type,
        imageUrl: listing.imageUrls[0],
        title: listing.title,
        subtitle: `${listing.sellerName} · ${listing.location}`,
        priceLabel: priceLabel(listing.price, listing.listingType === 'trade' ? 'Trao đổi' : 'Tặng miễn phí'),
        listing,
      };
    });

  const affiliate = input.affiliateProducts
    .filter((product) => product.status !== 'inactive')
    .map((product) => {
      const type = normalize(product.type || product.category);
      const tags = tokens([product.name, product.partnerName, product.store, ...(product.styleTags ?? [])]);
      const colors = tokens(product.colors ?? []);
      const score = rankCommon({ type, tags, colors, price: product.price, location: product.partnerName || product.store, gender: product.gender, user: input.user, outfit, outfitItems, event, missing, weather: input.weather })
        + (product.sizes?.some((size) => tokens([input.user.advancedStylePreferences?.topSize, input.user.advancedStylePreferences?.bottomSize, input.user.advancedStylePreferences?.shoeSize]).includes(normalize(size))) ? 8 : 0)
        + (product.commissionRate ?? 0) * 10;
      const reasonKey = reasonFor(score, 'affiliate', Boolean(type && missing.includes(type)), tags.includes(normalize(input.weather.condition)));
      return {
        id: `affiliate-${product.id}`,
        source: 'affiliate' as const,
        reasonKey,
        reason: reasonKey === 'complete_outfit' ? 'Lấp khoảng trống outfit từ đối tác' : reasonKey === 'weather_location' ? 'Chất liệu và vibe hợp thời tiết / địa điểm' : 'Sản phẩm đối tác khớp hồ sơ phong cách',
        score,
        itemType: type,
        imageUrl: product.imageUrl,
        title: product.name,
        subtitle: product.partnerName || product.store,
        priceLabel: priceLabel(product.price, product.priceLabel),
        product,
      };
    });

  return [...community.sort((a, b) => b.score - a.score).slice(0, 8), ...affiliate.sort((a, b) => b.score - a.score).slice(0, 8)]
    .sort((a, b) => {
      if (a.reasonKey === 'complete_outfit' && b.reasonKey !== 'complete_outfit') return -1;
      if (a.reasonKey !== 'complete_outfit' && b.reasonKey === 'complete_outfit') return 1;
      if (a.source === 'community' && b.source === 'affiliate') return -0.5;
      if (a.source === 'affiliate' && b.source === 'community') return 0.5;
      return b.score - a.score;
    });
}
