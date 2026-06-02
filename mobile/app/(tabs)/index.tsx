import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

const quickActions = [
  { label: 'Thêm đồ', icon: 'add-circle-outline' as const, route: '/(tabs)/closet' },
  { label: 'AI Stylist', icon: 'sparkles-outline' as const, route: '/(tabs)/try-on' },
  { label: 'Cộng đồng', icon: 'people-outline' as const, route: '/(tabs)/community' },
  { label: 'Mua sắm', icon: 'bag-handle-outline' as const, route: '/shopping' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { colors, gradients, spacing, radius } = useTheme();
  const { weather, outfits, events, missions, trends, user, clothing } = useAppStore();
  const hero = outfits[0];
  const unused = clothing.filter((item) => item.timesWorn < 3).length;
  const activeMissions = missions.filter((item) => !item.isClaimed).slice(0, 2);

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <View style={styles.header}>
          <View>
            <AppText variant="bodySmall" muted>Chào buổi sáng</AppText>
            <AppText variant="display">{user.username}</AppText>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/profile')}>
            <Image source={{ uri: user.avatarUrl }} style={[styles.avatar, { borderRadius: radius.full }]} />
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.duration(420)}>
          <LinearGradient colors={gradients.hero} style={[styles.editorial, { borderRadius: radius.xxl }]}>
            <View style={styles.editorialSpark}><Ionicons name="sparkles" size={22} color="#fff" /></View>
            <AppText variant="caption" color="#fff">YOUR AI STYLIST</AppText>
            <AppText variant="display" color="#fff">Soft looks, big mood.</AppText>
            <AppText color="#fff">I found a dreamy outfit direction for your day. Ready to style your main character moment?</AppText>
            <Button label="Style me with AI" variant="secondary" icon="sparkles" onPress={() => router.push('/(tabs)/try-on')} style={{ alignSelf: 'flex-start', marginTop: 14 }} />
          </LinearGradient>
        </Animated.View>

        <View style={styles.moodRow}>
          <View style={[styles.mood, { backgroundColor: colors.pink, borderRadius: radius.xl }]}><Ionicons name="heart-outline" size={22} color={colors.community} /><AppText variant="caption" muted>DAILY VIBE</AppText><AppText variant="h3">Romantic casual</AppText></View>
          <View style={[styles.mood, { backgroundColor: colors.sky, borderRadius: radius.xl }]}><Ionicons name="flower-outline" size={22} color={colors.deepPurple} /><AppText variant="caption" muted>MOOD</AppText><AppText variant="h3">Easy glow</AppText></View>
        </View>

        <LinearGradient colors={gradients.sunshine} style={[styles.weather, { borderRadius: radius.xl }]}>
          <View>
            <AppText variant="caption" muted>THỜI TIẾT HÔM NAY</AppText>
            <AppText variant="h2">{weather.temperature}° · {weather.condition}</AppText>
            <AppText variant="bodySmall" muted>{weather.location} · Độ ẩm {weather.humidity}%</AppText>
          </View>
          <Ionicons name="sunny-outline" size={36} color={colors.gold} />
        </LinearGradient>

        <LinearGradient colors={gradients.ai} style={[styles.streak, { borderRadius: radius.xl }]}>
          <View><AppText variant="caption" color={colors.textInverse}>STYLE STREAK</AppText><AppText variant="h2" color={colors.textInverse}>7 days in your glow-up era</AppText></View>
          <View style={styles.xp}><AppText variant="h3" color={colors.textInverse}>+240 XP</AppText></View>
        </LinearGradient>

        <SectionHeader title="Lịch trình hôm nay" actionLabel="Lên kế hoạch" onAction={() => router.push('/(tabs)/events')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {events.slice(0, 3).map((event, index) => (
            <Pressable key={event.id} onPress={() => router.push('/(tabs)/events')} style={[styles.event, { backgroundColor: index === 0 ? colors.primary : colors.beige, borderRadius: radius.lg }]}>
              <AppText variant="caption" color={index === 0 ? colors.accent : colors.textMuted}>{index === 0 ? 'TIẾP THEO' : event.eventType.toUpperCase()}</AppText>
              <AppText variant="label" color={index === 0 ? colors.textInverse : colors.text} numberOfLines={1}>{event.name}</AppText>
              <AppText variant="bodySmall" color={index === 0 ? colors.warmGray : colors.textMuted}>{event.date} · {event.location}</AppText>
            </Pressable>
          ))}
        </ScrollView>

        <SectionHeader title="Outfit AI của hôm nay" actionLabel="Xem thêm" onAction={() => router.push('/outfits')} />
        {hero ? (
          <Pressable onPress={() => router.push(`/outfit/${hero.id}`)} style={{ borderRadius: radius.xl, overflow: 'hidden' }}>
            <Image source={{ uri: hero.previewImageUrl }} style={styles.heroImage} contentFit="cover" />
            <LinearGradient colors={['transparent', 'rgba(24,18,20,0.92)']} style={styles.heroOverlay}>
              <View style={styles.heroTop}>
                <View style={[styles.aiPill, { backgroundColor: colors.surfaceGlass }]}>
                  <Ionicons name="sparkles" size={14} color={colors.accentDark} />
                  <AppText variant="caption"> AI STYLIST</AppText>
                </View>
                <View style={[styles.score, { backgroundColor: colors.surfaceGlass }]}>
                  <AppText variant="label">{hero.matchingScore ?? 92}% match</AppText>
                </View>
              </View>
              <View>
                <AppText variant="h1" color={colors.textInverse}>{hero.name}</AppText>
                <AppText variant="bodySmall" color={colors.warmGray} numberOfLines={2}>{hero.aiExplanation}</AppText>
                <View style={styles.matchRow}>
                  <AppText variant="caption" color={colors.warmGray}>☀ 96% THỜI TIẾT</AppText>
                  <AppText variant="caption" color={colors.warmGray}>  ·  90% LỊCH TRÌNH</AppText>
                </View>
                <View style={styles.heroActions}>
                  <Button label="Mặc hôm nay" small icon="checkmark-circle-outline" onPress={() => router.push(`/outfit/${hero.id}`)} style={{ flex: 1, marginRight: 8 }} />
                  <Button label="Thử đồ" small variant="accent" icon="scan-outline" onPress={() => router.push(`/(tabs)/try-on?outfitId=${hero.id}`)} style={{ flex: 1 }} />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        ) : null}

        <SectionHeader title="Bắt đầu nhanh" />
        <View style={styles.quickGrid}>
          {quickActions.map((item) => (
            <Pressable key={item.label} onPress={() => router.push(item.route as never)} style={[styles.quick, { backgroundColor: [colors.pink, colors.lavender, colors.mint, colors.lemon][quickActions.indexOf(item)], borderRadius: radius.lg }]}>
              <View style={[styles.quickIcon, { backgroundColor: colors.surfaceGlass }]}>
                <Ionicons name={item.icon} size={22} color={colors.accentDark} />
              </View>
              <AppText variant="label">{item.label}</AppText>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => router.push('/(tabs)/closet')} style={[styles.insight, { backgroundColor: colors.sage, borderRadius: radius.xl }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" muted>PHÂN TÍCH TỦ ĐỒ</AppText>
            <AppText variant="h3">{unused} món đồ đang chờ được mặc lại</AppText>
            <AppText variant="bodySmall" muted>Bạn có thể tạo {Math.max(12, clothing.length * 5 + 3)} outfit mới từ tủ đồ hiện tại.</AppText>
          </View>
          <Ionicons name="arrow-forward-circle" size={32} color={colors.accentDark} />
        </Pressable>

        <SectionHeader title="Nhiệm vụ hôm nay" actionLabel="Tất cả" onAction={() => router.push('/missions')} />
        {activeMissions.map((mission) => (
          <Pressable key={mission.id} onPress={() => router.push('/missions')} style={[styles.mission, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
            <View style={[styles.missionIcon, { backgroundColor: colors.lavender }]}><Ionicons name="ribbon-outline" size={20} color={colors.accentDark} /></View>
            <View style={{ flex: 1 }}><AppText variant="label">{mission.title}</AppText><AppText variant="bodySmall" muted>{mission.progress}/{mission.target} · +{mission.rewardAiTries} lượt AI</AppText></View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}

        <SectionHeader title="Đang được yêu thích" actionLabel="Khám phá" onAction={() => router.push('/(tabs)/community' as never)} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}>
        {trends.map((trend) => (
          <Pressable key={trend.id} onPress={() => router.push('/(tabs)/community' as never)} style={[styles.trend, { borderRadius: radius.lg }]}>
            <Image source={{ uri: trend.previewImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={['transparent', 'rgba(20,15,17,0.76)']} style={StyleSheet.absoluteFill} />
            <View style={styles.trendText}><AppText variant="h3" color={colors.textInverse}>{trend.name}</AppText><AppText variant="caption" color={colors.warmGray}>{trend.season}</AppText></View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  avatar: { width: 48, height: 48 },
  editorial: { padding: 20, minHeight: 210, justifyContent: 'flex-end', overflow: 'hidden' },
  editorialSpark: { position: 'absolute', right: 24, top: 22, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  moodRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  mood: { flex: 1, padding: 14, minHeight: 108, justifyContent: 'space-between' },
  weather: { padding: 13, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  streak: { padding: 16, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xp: { padding: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)' },
  event: { width: 190, padding: 14, marginRight: 10 },
  heroImage: { width: '100%', height: 430 },
  heroOverlay: { ...StyleSheet.absoluteFill, padding: 16, justifyContent: 'space-between' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between' },
  aiPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99 },
  score: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99 },
  matchRow: { flexDirection: 'row', marginTop: 8 },
  heroActions: { flexDirection: 'row', marginTop: 14 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quick: { width: '48.5%', padding: 14, marginBottom: 10 },
  quickIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  insight: { padding: 16, marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  mission: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8 },
  missionIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  trend: { width: 210, height: 250, marginRight: 12, overflow: 'hidden', justifyContent: 'flex-end' },
  trendText: { padding: 14 },
});
