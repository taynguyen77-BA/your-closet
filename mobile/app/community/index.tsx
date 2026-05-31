import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

const LISTING_LABELS = { sale: 'Bán', trade: 'Trao đổi', giveaway: 'Tặng' };

export default function CommunityScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const listings = useAppStore((s) => s.communityListings);

  return (
    <FlatList
      data={listings}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: spacing.lg }}
      style={{ backgroundColor: colors.background }}
      ListHeaderComponent={
        <AppText variant="bodySmall" muted style={{ marginBottom: spacing.lg }}>
          Lọc theo size, giới tính, loại, địa điểm — Pass đồ bền vững
        </AppText>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/community/${item.id}`)}
          style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg }]}
        >
          <Image source={{ uri: item.imageUrls[0] }} style={styles.image} contentFit="cover" />
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
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16, overflow: 'hidden' },
  image: { width: '100%', height: 180 },
  info: { padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});
