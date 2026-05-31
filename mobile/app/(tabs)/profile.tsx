import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PLAN_LIMITS } from '@/data/mockData';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

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
  const planInfo = PLAN_LIMITS[user.plan];

  return (
    <Screen>
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
        <MenuRow icon="list-outline" label="Tin đăng của tôi" onPress={() => router.push('/community')} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow icon="bookmark-outline" label="Outfit đã lưu" onPress={() => {}} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow icon="time-outline" label="Lịch sử outfit" onPress={() => {}} />
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
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80 },
  planActions: { flexDirection: 'row', marginTop: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1 },
});
