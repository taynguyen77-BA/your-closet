import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.menuRow, { paddingVertical: spacing.md }]}>
      <Ionicons name={icon} size={22} color={colors.accentDark} />
      <AppText variant="body" style={{ flex: 1, marginLeft: 12 }}>
        {label}
      </AppText>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, gradients, spacing, radius } = useTheme();
  const user = useAppStore((s) => s.user);
  const planInfo = useAppStore((s) => s.planLimits[s.user.plan]);
  const styleXp = useAppStore((s) => s.clothing.length * 20 + s.outfits.length * 40 + s.savedOutfitIds.length * 30);
  const styleLevel = Math.max(1, Math.floor(styleXp / 200) + 1);
  const levelProgress = styleXp % 200;

  return (
    <Screen>
      <LinearGradient colors={gradients.hero} style={[styles.cover, { borderRadius: radius.xxl }]}>
        <Ionicons name="sparkles" size={24} color="#fff" />
        <AppText variant="caption" color="#fff">FASHION PROFILE</AppText>
        <AppText variant="h1" color="#fff">Your style diary</AppText>
      </LinearGradient>
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: user.avatarUrl }}
          style={[styles.avatar, { borderRadius: radius.full }]}
        />
        <View style={{ marginLeft: spacing.lg, flex: 1 }}>
          <AppText variant="h1">{user.username}</AppText>
          <AppText variant="bodySmall" muted>
            {user.fashionStyle}
          </AppText>
          <AppText variant="bodySmall" muted>
            {user.preferences?.join(' · ')}
          </AppText>
        </View>
      </View>

      <View style={styles.achievements}>
        {[['ribbon-outline', 'Trend Scout'], ['heart-outline', 'Closet Crush'], ['sparkles-outline', 'AI Muse']].map(([icon, label]) => <View key={label} style={[styles.achievement, { backgroundColor: colors.surface, borderRadius: radius.xl }]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.accentDark} /><AppText variant="caption">{label}</AppText></View>)}
      </View>

      <View style={[styles.level, { backgroundColor: colors.lavender, borderRadius: radius.xl }]}>
        <View style={styles.levelTop}><View><AppText variant="caption" muted>STYLE LEVEL {String(styleLevel).padStart(2, '0')}</AppText><AppText variant="h2">Fashion Explorer</AppText></View><AppText variant="label" color={colors.accentDark}>{levelProgress} / 200 XP</AppText></View>
        <View style={[styles.progress, { backgroundColor: colors.surfaceGlass }]}><View style={[styles.progressFill, { backgroundColor: colors.accentDark, width: `${(levelProgress / 200) * 100}%` }]} /></View>
        <AppText variant="bodySmall" muted style={{ marginTop: 7 }}>Còn {200 - levelProgress} XP để mở cấp độ tiếp theo</AppText>
      </View>

      <GlassCard style={{ marginBottom: spacing.lg }}>
        <AppText variant="caption" muted>
          Gói hiện tại
        </AppText>
        <AppText variant="h2">{planInfo.label}</AppText>
        <AppText variant="bodySmall" muted style={{ marginTop: 4 }}>
          AI: {user.plan === 'free' ? `${user.aiUsageRemaining}/${user.aiUsageMonthlyLimit}` : 'Không giới hạn'}
          {' · '}
          Tủ: {user.closetItemCount}
          {user.plan === 'free' ? `/${user.closetItemLimit}` : ''}
        </AppText>
        <View style={styles.planActions}>
          <Button label="Nâng cấp" onPress={() => router.push('/membership')} style={{ flex: 1, marginRight: 8 }} />
          <Button
            label="Nhiệm vụ"
            variant="secondary"
            onPress={() => router.push('/missions')}
            style={{ flex: 1 }}
          />
        </View>
      </GlassCard>

      <SectionHeader title="Cộng đồng" />
      <GlassCard style={{ marginBottom: spacing.lg, paddingVertical: 0 }}>
        <MenuRow icon="people-outline" label="Xem cộng đồng" onPress={() => router.push('/community')} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow icon="add-circle-outline" label="Đăng tin mới" onPress={() => router.push('/community/create')} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow icon="list-outline" label="Tin đăng của tôi" onPress={() => router.push('/community?filter=mine')} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow icon="bookmark-outline" label="Outfit đã lưu" onPress={() => router.push('/outfits?filter=saved')} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow icon="time-outline" label="Lịch sử outfit" onPress={() => router.push('/outfits')} />
      </GlassCard>

      <SectionHeader title="Cài đặt" />
      <GlassCard style={{ paddingVertical: 0 }}>
        <MenuRow icon="notifications-outline" label="Thông báo" onPress={() => router.push('/settings')} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow icon="shield-outline" label="Quyền riêng tư" onPress={() => router.push('/settings')} />
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { minHeight: 142, padding: 18, justifyContent: 'flex-end', gap: 4 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginTop: -26, marginBottom: 18, paddingHorizontal: 12 },
  avatar: { width: 80, height: 80 },
  planActions: { flexDirection: 'row', marginTop: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1 },
  level: { padding: 16, marginBottom: 16 },
  levelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progress: { height: 7, borderRadius: 99, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%' },
  achievements: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  achievement: { flex: 1, padding: 10, gap: 6, minHeight: 76, justifyContent: 'space-between' },
});
