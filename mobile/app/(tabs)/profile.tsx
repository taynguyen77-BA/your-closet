import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SafeImage } from '@/components/ui/SafeImage';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/authStore';

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
  const { colors, spacing, radius } = useTheme();
  const user = useAppStore((s) => s.user);
  const planInfo = useAppStore((s) => s.planLimits[s.user.plan]);
  const styleXp = useAppStore((s) => s.clothing.length * 20 + s.outfits.length * 40 + s.savedOutfitIds.length * 30);
  const styleLevel = Math.max(1, Math.floor(styleXp / 200) + 1);
  const levelProgress = styleXp % 200;
  const { appUser, logout, biometricEnabled } = useAuthStore();
  const profile = appUser ?? user;

  return (
    <Screen bottomOffset={96}>
      <View style={[styles.cover, { borderRadius: radius.xl, backgroundColor: colors.primary }]}>
        <AppText variant="caption" color={colors.accent}>HỒ SƠ PHONG CÁCH</AppText>
        <AppText variant="h1" color={colors.textInverse}>Nhật ký phong cách của bạn</AppText>
        <View style={styles.profileHeader}>
        <SafeImage
          source={{ uri: profile.avatarUrl }}
          style={[styles.avatar, { borderRadius: radius.full, borderColor: colors.background }]}
        />
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <AppText variant="h1" color={colors.textInverse}>{profile.name ?? profile.username}</AppText>
          <AppText variant="bodySmall" color={colors.warmGray}>
            {profile.phoneNumber || profile.email || 'Chưa thêm email/số điện thoại'}
          </AppText>
          <AppText variant="bodySmall" color={colors.accent}>
            {profile.username ? `@${profile.username}` : 'Chọn username trong hồ sơ'}
          </AppText>
          <AppText variant="bodySmall" color={colors.warmGray}>Provider: {profile.provider ?? profile.authProvider ?? 'email'}</AppText>
        </View>
        </View>
      </View>

      <View style={[styles.level, { backgroundColor: colors.surface, borderRadius: radius.xl }]}>
        <View style={styles.levelTop}><AppText variant="caption" muted>CẤP {String(styleLevel).padStart(2, '0')}</AppText><AppText variant="h3">Nhà khám phá phong cách</AppText><AppText variant="label" color={colors.accentDark}>{levelProgress} / 200 XP</AppText></View>
        <View style={[styles.progress, { backgroundColor: colors.background }]}><View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${(levelProgress / 200) * 100}%` }]} /></View>
        <AppText variant="bodySmall" muted style={{ marginTop: 7 }}>Còn {200 - levelProgress} XP nữa là lên cấp!</AppText>
      </View>

      <View style={styles.achievements}>
        {[['ribbon-outline', 'BẮT NHỊP XU HƯỚNG'], ['heart-outline', 'YÊU TỦ ĐỒ'], ['sparkles-outline', 'NÀNG THƠ AI']].map(([icon, label]) => <View key={label} style={[styles.achievement, { backgroundColor: colors.surface, borderRadius: radius.xl }]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.accentDark} /><AppText variant="caption">{label}</AppText></View>)}
      </View>

      <GlassCard style={{ marginBottom: spacing.lg, backgroundColor: colors.beige }}>
        <AppText variant="caption" muted>
          Gói hiện tại
        </AppText>
        <AppText variant="h2">{planInfo.label}</AppText>
        <AppText variant="bodySmall" muted style={{ marginTop: 4 }}>
          AI: <AppText variant="bodySmall" color={colors.accentDark}>{user.plan === 'free' ? `${user.aiUsageRemaining}/${user.aiUsageMonthlyLimit}` : 'Không giới hạn'}</AppText>
          {' · '}
          Tủ: <AppText variant="bodySmall" color={colors.accentDark}>{user.closetItemCount}{user.plan === 'free' ? `/${user.closetItemLimit}` : ''}</AppText>
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
        <MenuRow icon="bookmark-outline" label="Bộ đồ đã lưu" onPress={() => router.push('/outfits?filter=saved')} />
      </GlassCard>

      <SectionHeader title="Cài đặt" />
      <GlassCard style={{ paddingVertical: 0 }}>
        <MenuRow icon="person-outline" label="Chỉnh sửa hồ sơ" onPress={() => router.push('/profile/edit' as never)} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow icon="finger-print-outline" label={biometricEnabled ? 'Face ID / Vân tay đang bật' : 'Thiết lập Face ID / Vân tay'} onPress={() => router.push('/settings')} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow icon="notifications-outline" label="Thông báo" onPress={() => router.push('/settings')} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow icon="shield-outline" label="Quyền riêng tư" onPress={() => router.push('/settings')} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} /><MenuRow icon="log-out-outline" label="Đăng xuất" onPress={() => { void logout(); }} />
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { minHeight: 190, padding: 18, gap: 4, marginBottom: 32 },
  profileHeader: { position: 'absolute', left: 16, right: 16, bottom: -32, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 76, height: 76, borderWidth: 3 },
  planActions: { flexDirection: 'row', marginTop: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1 },
  level: { padding: 16, marginBottom: 16 },
  levelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  progress: { height: 6, borderRadius: 99, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%' },
  achievements: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  achievement: { flex: 1, padding: 10, gap: 6, minHeight: 76, justifyContent: 'space-between' },
});
