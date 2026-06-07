import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { GuestAccessCard } from '@/components/auth/GuestAccessCard';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme';
import { DataState } from '@/components/ui/DataState';
import { LinearGradient } from 'expo-linear-gradient';

export default function MissionsScreen() {
  const { colors, gradients, spacing, radius } = useTheme();
  const missions = useAppStore((s) => s.missions);
  const claimMission = useAppStore((s) => s.claimMission);
  const completeMission = useAppStore((s) => s.completeMission);
  const loadState = useAppStore((s) => s.loadState);
  const error = useAppStore((s) => s.error);
  const { isAuthenticated, isGuest } = useAuthStore();
  const isPublicViewer = isGuest || !isAuthenticated;
  const runMissionAction = async (action: () => Promise<void>) => {
    try { await action(); }
    catch { Alert.alert('Chế độ trải nghiệm', 'Nhiệm vụ này sẽ được đồng bộ khi dịch vụ trực tuyến sẵn sàng.'); }
  };

  if (isPublicViewer) {
    return (
      <FlatList
        data={[]}
        contentContainerStyle={{ padding: spacing.lg }}
        style={{ backgroundColor: colors.background }}
        ListHeaderComponent={
          <>
            <LinearGradient colors={gradients.premium} style={[styles.hero, { borderRadius: radius.xxl }]}>
              <AppText variant="caption" color="#fff">GLOW-UP CLUB</AppText>
              <AppText variant="display" color="#fff">Nhiệm vụ cần tài khoản.</AppText>
              <AppText color="#fff">Đăng nhập để theo dõi tiến độ, nhận thưởng và đồng bộ lượt AI.</AppText>
            </LinearGradient>
            <GuestAccessCard icon="ribbon-outline" title="Đăng nhập để làm nhiệm vụ" description="Tiến độ, phần thưởng và lượt AI là dữ liệu cá nhân nên không hiển thị trong chế độ guest." />
          </>
        }
        renderItem={() => null}
      />
    );
  }

  return (
    <FlatList
      data={missions}
      keyExtractor={(m) => m.id}
      contentContainerStyle={{ padding: spacing.lg }}
      style={{ backgroundColor: colors.background }}
      ListHeaderComponent={
        <LinearGradient colors={gradients.premium} style={[styles.hero, { borderRadius: radius.xxl }]}>
          <AppText variant="caption" color="#fff">GLOW-UP CLUB</AppText>
          <AppText variant="display" color="#fff">Little wins, more style.</AppText>
          <AppText color="#fff">Hoàn thành nhiệm vụ để nhận thêm lượt AI và nâng fashion XP.</AppText>
        </LinearGradient>
      }
      ListEmptyComponent={<DataState loading={loadState === 'loading'} error={error} empty emptyText="Hiện chưa có nhiệm vụ nào." />}
      renderItem={({ item }) => {
        const progressPct = Math.min(100, (item.progress / item.target) * 100);
        return (
          <GlassCard style={{ marginBottom: spacing.md }}>
            <AppText variant="h3">{item.title}</AppText>
            <AppText variant="bodySmall" muted style={{ marginVertical: 4 }}>
              {item.description}
            </AppText>
            <AppText variant="label" color={colors.accentDark}>
              +{item.rewardAiTries} lượt AI
            </AppText>
            <View style={[styles.bar, { backgroundColor: colors.beige, marginTop: 8 }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${progressPct}%`, backgroundColor: colors.accent },
                ]}
              />
            </View>
            <AppText variant="bodySmall" muted style={{ marginTop: 4 }}>
              {item.progress}/{item.target}
            </AppText>
            {item.isCompleted && !item.isClaimed && (
              <Button
                label="Nhận thưởng"
                small
                onPress={() => void runMissionAction(() => claimMission(item.id))}
                style={{ marginTop: 12, alignSelf: 'flex-start' }}
              />
            )}
            {!item.isCompleted && (
              <Button
                label={item.type === 'watch_ad' ? 'Xem quảng cáo mẫu' : item.type === 'invite_friend' ? 'Mời bạn' : item.type === 'share_outfit' ? 'Chia sẻ outfit' : 'Điểm danh'}
                variant="secondary"
                small
                onPress={() => void runMissionAction(() => completeMission(item.id))}
                style={{ marginTop: 12, alignSelf: 'flex-start' }}
              />
            )}
          </GlassCard>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  hero: { padding: 20, gap: 5, marginBottom: 16 },
  bar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%' },
});
