import { useEffect, useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { SafeImage } from '@/components/ui/SafeImage';
import { useTheme } from '@/theme';
import { useAppStore } from '@/stores/appStore';
import {
  buildShoppingRecommendations,
  getAffiliateProductUrl,
  getRecommendationReasonLabel,
  type RecommendationReasonKey,
  type ShoppingRecommendation,
} from '@/services/recommendations/shoppingRecommendations';

const groupOrder: RecommendationReasonKey[] = ['complete_outfit', 'taste_match', 'weather_location', 'community', 'partner'];

export default function ShoppingScreen() {
  const { outfitId } = useLocalSearchParams<{ outfitId?: string }>();
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const state = useAppStore();
  const trackShoppingEvent = useAppStore((s) => s.trackShoppingEvent);
  const recommendations = useMemo(() => buildShoppingRecommendations({
    user: state.user,
    weather: state.weather,
    wardrobe: state.clothing,
    outfits: state.outfits,
    events: state.events,
    communityListings: state.communityListings,
    affiliateProducts: state.affiliateProducts,
    outfitId,
  }), [state.affiliateProducts, state.clothing, state.communityListings, state.events, state.outfits, state.user, state.weather, outfitId]);
  const grouped = groupOrder
    .map((key) => ({ key, title: getRecommendationReasonLabel(key), items: recommendations.filter((item) => item.reasonKey === key) }))
    .filter((group) => group.items.length);

  useEffect(() => {
    recommendations.slice(0, 12).forEach((item) => {
      void trackShoppingEvent({
        userId: state.user.id || 'guest-preview',
        eventType: 'product_impression',
        targetType: item.source === 'affiliate' ? 'affiliate_product' : 'community_listing',
        targetId: item.product?.id || item.listing?.id || item.id,
        source: 'ai_stylist',
        recommendationId: item.id,
        reason: item.reason,
        outfitId,
      });
    });
  }, [outfitId, recommendations, state.user.id, trackShoppingEvent]);

  const openRecommendation = async (item: ShoppingRecommendation) => {
    await trackShoppingEvent({
      userId: state.user.id || 'guest-preview',
      eventType: item.source === 'affiliate' ? 'affiliate_click' : 'community_item_click',
      targetType: item.source === 'affiliate' ? 'affiliate_product' : 'community_listing',
      targetId: item.product?.id || item.listing?.id || item.id,
      source: 'ai_stylist',
      recommendationId: item.id,
      reason: item.reason,
      outfitId,
    });
    if (item.listing) return router.push(`/community/${item.listing.id}?source=ai_stylist&recommendationId=${encodeURIComponent(item.id)}`);
    if (item.product) return Linking.openURL(getAffiliateProductUrl(item.product));
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.header}>
        <AppText variant="caption" muted>AI STYLIST SHOPPING</AppText>
        <AppText variant="h1">Gợi ý mua sắm theo outfit</AppText>
        <AppText variant="bodySmall" muted>
          Ưu tiên món từ cộng đồng trước, sau đó mới tới sản phẩm đối tác có tracking affiliate.
        </AppText>
      </View>
      {!grouped.length ? (
        <GlassCard>
          <AppText variant="h2">Chưa có gợi ý phù hợp</AppText>
          <AppText variant="bodySmall" muted style={{ marginTop: spacing.sm }}>
            Khi AI Stylist có outfit, lịch trình, hồ sơ gu và dữ liệu đối tác, sản phẩm liên quan sẽ xuất hiện ở đây.
          </AppText>
        </GlassCard>
      ) : grouped.map((group) => (
        <View key={group.key} style={{ marginBottom: spacing.lg }}>
          <AppText variant="h2" style={{ marginBottom: spacing.sm }}>{group.title}</AppText>
          {group.items.map((item) => (
            <Pressable key={item.id} onPress={() => void openRecommendation(item)} style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
              {item.imageUrl ? <SafeImage source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" fallbackLabel="ẢNH SẢN PHẨM" /> : null}
              <View style={styles.info}>
                <View style={styles.row}>
                  <AppText variant="caption" color={item.source === 'community' ? colors.community : colors.accentDark}>
                    {item.source === 'community' ? 'Từ cộng đồng' : 'Từ đối tác'}
                  </AppText>
                  <AppText variant="caption" muted>{Math.round(item.score)} điểm</AppText>
                </View>
                <AppText variant="h3" numberOfLines={2}>{item.title}</AppText>
                <AppText variant="bodySmall" muted numberOfLines={1}>{item.subtitle}</AppText>
                <AppText variant="bodySmall" style={{ marginTop: 8 }} numberOfLines={2}>{item.reason}</AppText>
                <View style={[styles.row, { marginTop: 10 }]}>
                  <AppText variant="label">{item.priceLabel ?? 'Xem chi tiết'}</AppText>
                  <Button label={item.source === 'community' ? 'Xem món' : 'Mua'} small onPress={() => void openRecommendation(item)} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 18, gap: 5 },
  card: { flexDirection: 'row', overflow: 'hidden', marginBottom: 12 },
  image: { width: 112, minHeight: 148 },
  info: { flex: 1, padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
});
