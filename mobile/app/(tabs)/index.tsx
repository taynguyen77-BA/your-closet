import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { CommunityBanner } from '@/components/home/CommunityBanner';
import { StatsRow } from '@/components/home/StatsRow';
import { WeatherWidget } from '@/components/home/WeatherWidget';
import { Screen } from '@/components/layout/Screen';
import { OutfitCard } from '@/components/outfit/OutfitCard';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const weather = useAppStore((s) => s.weather);
  const outfits = useAppStore((s) => s.outfits);
  const events = useAppStore((s) => s.events);
  const trends = useAppStore((s) => s.trends);
  const user = useAppStore((s) => s.user);

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <AppText variant="bodySmall" muted>
            Xin chào,
          </AppText>
          <AppText variant="display">{user.username}</AppText>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/profile')}>
          <Image
            source={{ uri: user.avatarUrl }}
            style={[styles.avatar, { borderRadius: radius.full }]}
          />
        </Pressable>
      </View>

      <WeatherWidget weather={weather} />

      <SectionHeader title="Gợi ý AI hôm nay" actionLabel="Xem tất cả" />
      {outfits.slice(0, 2).map((o) => (
        <OutfitCard key={o.id} outfit={o} />
      ))}

      <SectionHeader title="Sự kiện sắp tới" actionLabel="Lên lịch" onAction={() => router.push('/(tabs)/events')} />
      {events.map((e) => (
        <GlassCard key={e.id} style={{ marginBottom: spacing.md }}>
          <AppText variant="h3">{e.name}</AppText>
          <AppText variant="bodySmall" muted>
            {e.date} · {e.location}
          </AppText>
          <AppText variant="bodySmall" style={{ marginTop: 4 }}>
            {e.linkedOutfitIds.length > 0
              ? `${e.linkedOutfitIds.length} outfit đã lưu`
              : 'Chưa có outfit — Gợi ý ngay'}
          </AppText>
        </GlassCard>
      ))}

      <SectionHeader title="Thống kê nhanh" />
      <StatsRow />

      <SectionHeader title="Xu hướng thời trang" />
      {trends.map((t) => (
        <GlassCard key={t.id} style={{ marginBottom: spacing.md }}>
          <AppText variant="h3">{t.name}</AppText>
          <AppText variant="bodySmall" muted style={{ marginVertical: 4 }}>
            {t.season}
          </AppText>
          <AppText variant="bodySmall">{t.description}</AppText>
          {t.missingItemSuggestions.length > 0 && (
            <AppText variant="caption" muted style={{ marginTop: 8 }}>
              Thiếu: {t.missingItemSuggestions.join(', ')}
            </AppText>
          )}
        </GlassCard>
      ))}

      <SectionHeader title="Cộng đồng" />
      <CommunityBanner />

      <Pressable
        onPress={() => {}}
        style={[styles.shopBanner, { backgroundColor: colors.primary, borderRadius: radius.lg }]}
      >
        <AppText variant="h3" color={colors.textInverse}>
          Mua sắm gợi ý
        </AppText>
        <AppText variant="bodySmall" color={colors.textInverse} style={{ opacity: 0.8 }}>
          Sản phẩm affiliate được AI đề xuất
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: { width: 48, height: 48 },
  shopBanner: { padding: 20, marginBottom: 24 },
});
