import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';
import { DataState } from '@/components/ui/DataState';
import { SafeImage } from '@/components/ui/SafeImage';
import { LinearGradient } from 'expo-linear-gradient';

const LISTING_LABELS = { sale: 'Bán', trade: 'Trao đổi', giveaway: 'Tặng' };
const STATUS_LABELS = { pending_review: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Bị từ chối' };

export default function CommunityScreen() {
  const router = useRouter();
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { colors, gradients, spacing, radius } = useTheme();
  const listings = useAppStore((s) => s.communityListings);
  const loadState = useAppStore((s) => s.loadState);
  const error = useAppStore((s) => s.error);
  const userId = useAppStore((s) => s.user.id);
  const visibleListings = filter === 'mine'
    ? listings.filter((item) => item.userId === userId)
    : listings.filter((item) => item.status === 'approved');

  return (
    <FlatList
      data={visibleListings}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: spacing.lg }}
      style={{ backgroundColor: colors.background }}
      ListHeaderComponent={
        <LinearGradient colors={filter === 'mine' ? gradients.ai : gradients.marketplace} style={[styles.header, { borderRadius: radius.xl, marginBottom: spacing.lg }]}>
          <AppText variant="caption" color={colors.textInverse}>{filter === 'mine' ? 'MY LISTINGS' : 'COMMUNITY MARKETPLACE'}</AppText>
          <AppText variant="h1" color={colors.textInverse}>{filter === 'mine' ? 'Món của bạn' : 'Fresh finds'}</AppText>
          <AppText variant="bodySmall" color={colors.textInverse}>{filter === 'mine' ? 'Theo dõi tin đăng và trạng thái kiểm duyệt.' : 'Pass đồ bền vững, tìm item hợp vibe.'}</AppText>
          <Button label="Đăng món từ tủ đồ" small variant="secondary" onPress={() => router.push('/community/create')} style={{ marginTop: spacing.md, alignSelf: 'flex-start' }} />
        </LinearGradient>
      }
      ListEmptyComponent={<DataState loading={loadState === 'loading'} error={error} empty emptyText="Chưa có tin đăng cộng đồng." />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/community/${item.id}`)}
          style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg }]}
        >
          <SafeImage source={{ uri: item.imageUrls[0] }} style={styles.image} contentFit="cover" fallbackLabel="ẢNH MÓN ĐỒ" />
          <View style={styles.info}>
            <AppText variant="h3">{item.title}</AppText>
            <AppText variant="bodySmall" muted>
              {item.sellerName} · {item.location}
            </AppText>
            <View style={styles.row}>
              <View style={[styles.badge, { backgroundColor: colors.pink }]}>
                <AppText variant="caption">{LISTING_LABELS[item.listingType]}</AppText>
              </View>
              {item.price ? (
                <AppText variant="label">{item.price.toLocaleString('vi-VN')}đ</AppText>
              ) : null}
            </View>
            {filter === 'mine' ? <AppText variant="caption" muted>{STATUS_LABELS[item.status]}</AppText> : null}
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: { padding: 17 },
  card: { marginBottom: 16, overflow: 'hidden' },
  image: { width: '100%', height: 180 },
  info: { padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});
