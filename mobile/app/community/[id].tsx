import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { PLATFORM_FEE_RATE } from '@/constants/membership';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const listing = useAppStore((s) => s.communityListings.find((l) => l.id === id));

  if (!listing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText>Không tìm thấy tin đăng</AppText>
      </View>
    );
  }

  const fee = listing.price ? Math.round(listing.price * PLATFORM_FEE_RATE) : 0;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Image source={{ uri: listing.imageUrls[0] }} style={[styles.hero, { borderRadius: radius.lg }]} />
      <AppText variant="h1" style={{ marginTop: spacing.lg }}>
        {listing.title}
      </AppText>
      <AppText variant="body" muted>
        {listing.description}
      </AppText>
      <AppText variant="bodySmall" muted style={{ marginTop: spacing.sm }}>
        {listing.sellerName} · {listing.location} · {listing.condition}
      </AppText>
      {listing.price ? (
        <AppText variant="h2" style={{ marginTop: spacing.md }}>
          {listing.price.toLocaleString('vi-VN')}đ
        </AppText>
      ) : null}
      {fee > 0 && (
        <AppText variant="bodySmall" muted>
          Phí nền tảng 10%: {fee.toLocaleString('vi-VN')}đ
        </AppText>
      )}
      <View style={styles.actions}>
        <Button label="Nhắn tin" variant="secondary" style={{ flex: 1, marginRight: 8 }} />
        <Button label="Trao đổi" variant="ghost" style={{ flex: 1, marginRight: 8 }} />
        {listing.listingType === 'sale' && (
          <Button label="Mua ngay" style={{ flex: 1 }} />
        )}
      </View>
      <Button label="Báo cáo" variant="ghost" small style={{ marginTop: spacing.md }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 320 },
  actions: { flexDirection: 'row', marginTop: 24 },
});
