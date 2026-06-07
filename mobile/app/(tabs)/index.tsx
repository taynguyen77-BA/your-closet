import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { GuestAccessCard } from '@/components/auth/GuestAccessCard';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme';

const quickActions = [
  { label: 'Thêm đồ', icon: 'add-circle-outline' as const, route: '/(tabs)/closet' },
  { label: 'AI Stylist', icon: 'sparkles-outline' as const, route: '/(tabs)/try-on' },
  { label: 'Cộng đồng', icon: 'people-outline' as const, route: '/(tabs)/community' },
  { label: 'Mua sắm', icon: 'bag-handle-outline' as const, route: '/shopping' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { colors, gradients, spacing } = useTheme();
  const { weather, outfits, events, missions, trends, user, clothing } = useAppStore();
  const { isAuthenticated, isGuest } = useAuthStore();
  const isPublicViewer = isGuest || !isAuthenticated;
  const hero = outfits[0];
  const unused = clothing.filter((item) => item.timesWorn < 3).length;
  const activeMissions = missions.filter((item) => !item.isClaimed).slice(0, 2);
  const visibleQuickActions = isPublicViewer ? quickActions.filter((item) => ['Cộng đồng', 'Mua sắm'].includes(item.label)) : quickActions;

  return (
    <Screen padded={false} bottomOffset={96}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <View style={styles.header}>
          <View>
            <AppText variant="caption" muted>Chào buổi sáng</AppText>
            <AppText variant="display" style={styles.name}>{isPublicViewer ? 'Bạn mới' : user.username}</AppText>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.avatar}>
            <AppText variant="label" color={colors.textInverse}>MA</AppText>
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.duration(420)}>
          <LinearGradient colors={gradients.hero} style={[styles.card, styles.hero, { shadowColor: colors.shadow }]}>
            <View style={styles.heroIcon}><Ionicons name="sparkles" size={18} color={colors.accentDark} /></View>
            <AppText variant="caption" color={colors.accentLight}>{isPublicViewer ? 'KHÁM PHÁ YOUR CLOSET' : 'TRỢ LÝ PHỐI ĐỒ AI'}</AppText>
            <AppText variant="display" color={colors.textInverse} style={styles.heroTitle}>{isPublicViewer ? 'Xem vibe cộng đồng,\nđăng nhập để lưu gu.' : 'Trang phục nhẹ nhàng,\n'}{!isPublicViewer ? <AppText variant="display" color={colors.accent} style={styles.heroAccent}>tâm trạng thật xinh.</AppText> : null}</AppText>
            <AppText variant="bodySmall" color={colors.warmLight} style={styles.heroCopy}>{isPublicViewer ? 'Bạn có thể xem cộng đồng và mua sắm gợi ý trước. Tủ đồ cá nhân và AI stylist cần tài khoản.' : 'Một bộ đồ nhẹ nhàng, đúng tâm trạng và sẵn sàng cho ngày mới của bạn.'}</AppText>
            <Pressable onPress={() => router.push(isPublicViewer ? '/(tabs)/community' : '/(tabs)/try-on')} style={[styles.primaryButton, { backgroundColor: colors.accent }]}>
              <Ionicons name={isPublicViewer ? 'people-outline' : 'sparkles'} size={17} color={colors.textInverse} />
              <AppText variant="label" color={colors.textInverse}>{isPublicViewer ? 'Khám phá cộng đồng' : 'Phối đồ cùng AI'}</AppText>
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {!isPublicViewer ? <View style={styles.miniRow}>
          <View style={[styles.card, styles.miniCard]}>
            <Ionicons name="heart-outline" size={18} color={colors.accent} />
            <AppText variant="caption" color={colors.accent}>PHONG CÁCH HÔM NAY</AppText>
            <AppText variant="h3">Lãng mạn{'\n'}thường ngày</AppText>
          </View>
          <View style={[styles.card, styles.miniCard]}>
            <Ionicons name="flower-outline" size={18} color={colors.accent} />
            <AppText variant="caption" color={colors.accent}>TÂM TRẠNG</AppText>
            <AppText variant="h3">Rạng rỡ{'\n'}tự nhiên</AppText>
          </View>
        </View> : null}

        <View style={[styles.card, styles.weather, { shadowColor: colors.shadow }]}>
          <View>
            <AppText variant="caption" muted>{weather.location}</AppText>
            <AppText variant="display" style={styles.temperature}>{weather.temperature}° · {weather.condition}</AppText>
            <AppText variant="bodySmall" muted>Độ ẩm {weather.humidity}%</AppText>
          </View>
          <AppText style={styles.sun}>☀️</AppText>
        </View>

        {!isPublicViewer ? <View style={[styles.card, styles.streak]}>
          <View>
            <AppText variant="caption" color={colors.text}>CHUỖI PHONG CÁCH</AppText>
            <AppText variant="body" color={colors.text} style={styles.streakText}>7 ngày liên tiếp chăm chút phong cách</AppText>
          </View>
          <View style={styles.xp}><AppText variant="caption" color={colors.accent}>+240 XP</AppText></View>
        </View> : null}

        {!isPublicViewer ? <>
        <View style={styles.sectionHeader}>
          <AppText variant="h3" style={styles.sectionTitle}>Lịch trình hôm nay</AppText>
          <Pressable onPress={() => router.push('/(tabs)/events')}>
            <AppText variant="bodySmall" color={colors.primary}>Lên kế hoạch</AppText>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {events.slice(0, 3).map((event, index) => (
            <Pressable key={event.id} onPress={() => router.push('/(tabs)/events')} style={[styles.card, styles.event]}>
              <AppText variant="caption" color={index === 0 ? colors.primary : colors.textMuted}>{index === 0 ? 'TIẾP THEO' : event.eventType}</AppText>
              <AppText variant="label" numberOfLines={1}>{event.name}</AppText>
              <AppText variant="bodySmall" muted numberOfLines={1}>{event.date} · {event.location}</AppText>
            </Pressable>
          ))}
        </ScrollView>
        </> : null}

        {!isPublicViewer ? <SectionTitle title="Outfit AI của hôm nay" action="Xem thêm" onPress={() => router.push('/outfits')} /> : null}
        {!isPublicViewer && hero ? (
          <Pressable onPress={() => router.push(`/outfit/${hero.id}`)} style={[styles.card, styles.outfitCard]}>
            {hero.previewImageUrl ? <SafeImage source={{ uri: hero.previewImageUrl }} style={styles.outfitImage} contentFit="cover" fallbackLabel="ẢNH OUTFIT" /> : null}
            <View style={styles.outfitBody}>
              <View style={styles.outfitMeta}>
              <View style={styles.darkPill}><AppText variant="caption" color={colors.accent}>✦ PHỐI ĐỒ AI</AppText></View>
              <View style={styles.sandPill}><AppText variant="label">{hero.matchingScore ?? 92}% phù hợp</AppText></View>
              </View>
              <AppText variant="caption" color={colors.accent}>LÃNG MẠN · THƯỜNG NGÀY</AppText>
              <AppText variant="h2" style={styles.outfitName}>{hero.name}</AppText>
              <AppText variant="bodySmall" muted numberOfLines={2}>{hero.aiExplanation}</AppText>
              <View style={styles.actionRow}>
                <Button label="Mặc hôm nay" small icon="checkmark-circle-outline" onPress={() => router.push(`/outfit/${hero.id}`)} style={styles.actionButton} />
                <Button label="Thử đồ" small variant="secondary" icon="scan-outline" onPress={() => router.push(`/(tabs)/try-on?outfitId=${hero.id}`)} style={styles.actionButton} />
              </View>
            </View>
          </Pressable>
        ) : null}

        {isPublicViewer ? <GuestAccessCard title="Đăng nhập để bật AI stylist" description="AI cần tủ đồ, ảnh, lịch trình và gu cá nhân để gợi ý outfit đúng với bạn." icon="sparkles-outline" /> : null}

        <SectionTitle title="Bắt đầu nhanh" />
        <View style={styles.quickGrid}>
          {visibleQuickActions.map((item) => (
          <Pressable key={item.label} onPress={() => router.push(item.route as never)} style={[styles.card, styles.quick, { shadowColor: colors.shadow }]}>
              <View style={styles.quickIcon}><Ionicons name={item.icon} size={21} color={colors.primary} /></View>
              <AppText variant="label">{item.label}</AppText>
            </Pressable>
          ))}
        </View>

        {!isPublicViewer ? <Pressable onPress={() => router.push('/(tabs)/closet')} style={[styles.card, styles.insight]}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color={colors.accent}>PHÂN TÍCH TỦ ĐỒ</AppText>
            <AppText variant="h3" style={styles.insightTitle}>{unused} món đồ đang chờ được mặc lại</AppText>
            <AppText variant="bodySmall" muted>Bạn có thể tạo {Math.max(12, clothing.length * 5 + 3)} bộ đồ mới từ tủ đồ hiện tại.</AppText>
          </View>
          <Ionicons name="arrow-forward-circle" size={32} color={colors.primary} />
        </Pressable> : null}

        {!isPublicViewer ? <SectionTitle title="Nhiệm vụ hôm nay" action="Tất cả" onPress={() => router.push('/missions')} /> : null}
        {!isPublicViewer && activeMissions.map((mission) => (
          <Pressable key={mission.id} onPress={() => router.push('/missions')} style={[styles.card, styles.mission]}>
            <View style={styles.missionIcon}><Ionicons name="ribbon-outline" size={20} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <AppText variant="label">{mission.title}</AppText>
              <AppText variant="bodySmall" muted>{mission.progress}/{mission.target} · +{mission.rewardAiTries} lượt AI</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.accent} />
          </Pressable>
        ))}

        <SectionTitle title="Đang được yêu thích" action="Khám phá" onPress={() => router.push('/(tabs)/community' as never)} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}>
        {trends.map((trend) => (
          <Pressable key={trend.id} onPress={() => router.push('/(tabs)/community' as never)} style={styles.trend}>
            <SafeImage source={{ uri: trend.previewImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" fallbackLabel="ẢNH XU HƯỚNG" />
            <View style={styles.trendOverlay} />
            <View style={styles.trendText}>
              <AppText variant="h3" color={colors.textInverse}>{trend.name}</AppText>
              <AppText variant="caption" color={colors.accent}>{trend.season}</AppText>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="h3" style={styles.sectionTitle}>{title}</AppText>
      {action && onPress ? <Pressable onPress={onPress}><AppText variant="bodySmall" color="#1E1712">{action}</AppText></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  name: { marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E1712' },
  card: { overflow: 'hidden', backgroundColor: '#FFFFFF', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 3 },
  hero: { minHeight: 258, borderRadius: 22, padding: 22, justifyContent: 'flex-end', backgroundColor: '#1E1712', shadowOpacity: 0.2, shadowRadius: 22, shadowOffset: { width: 0, height: 13 }, elevation: 5 },
  heroIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,249,241,0.92)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 25, lineHeight: 29, marginTop: 14 },
  heroAccent: { fontStyle: 'italic' },
  heroCopy: { maxWidth: 315, marginTop: 8, lineHeight: 20 },
  primaryButton: { alignSelf: 'flex-start', borderRadius: 100, paddingHorizontal: 18, paddingVertical: 11, marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 7 },
  miniRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  miniCard: { flex: 1, minHeight: 126, borderRadius: 16, padding: 14, justifyContent: 'space-between' },
  weather: { minHeight: 88, borderRadius: 16, padding: 14, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  temperature: { fontSize: 20, lineHeight: 26, marginVertical: 2 },
  sun: { fontSize: 28 },
  streak: { minHeight: 76, borderRadius: 16, backgroundColor: '#D4B896', padding: 16, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakText: { marginTop: 5 },
  xp: { borderRadius: 100, backgroundColor: '#1E1712', paddingHorizontal: 12, paddingVertical: 7 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 24 },
  sectionTitle: { fontFamily: 'DM Sans', fontSize: 16, fontWeight: '500', letterSpacing: 0 },
  event: { width: 190, gap: 5, borderRadius: 16, padding: 14, marginRight: 10 },
  outfitCard: { borderRadius: 18 },
  outfitImage: { width: '100%', height: 220 },
  outfitBody: { padding: 16 },
  outfitMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  darkPill: { borderRadius: 100, backgroundColor: '#1E1712', paddingHorizontal: 11, paddingVertical: 7 },
  sandPill: { borderRadius: 100, backgroundColor: '#D4B896', paddingHorizontal: 12, paddingVertical: 7 },
  outfitName: { marginTop: 4, marginBottom: 5 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionButton: { flex: 1 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quick: { width: '48.5%', borderRadius: 16, padding: 14, marginBottom: 10 },
  quickIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#D4B896', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  insight: { borderRadius: 16, padding: 16, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  insightTitle: { marginVertical: 4 },
  mission: { borderRadius: 16, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8 },
  missionIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#D4B896', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  trend: { width: 210, height: 250, marginRight: 12, borderRadius: 16, overflow: 'hidden', justifyContent: 'flex-end' },
  trendOverlay: { ...StyleSheet.absoluteFill, backgroundColor: '#1E1712', opacity: 0.58 },
  trendText: { padding: 14 },
});
