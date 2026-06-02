import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';
import { DataState } from '@/components/ui/DataState';

export default function MissionsScreen() {
  const { colors, spacing } = useTheme();
  const missions = useAppStore((s) => s.missions);
  const claimMission = useAppStore((s) => s.claimMission);
  const completeMission = useAppStore((s) => s.completeMission);
  const loadState = useAppStore((s) => s.loadState);
  const error = useAppStore((s) => s.error);
  const runMissionAction = async (action: () => Promise<void>) => {
    try { await action(); }
    catch { Alert.alert('Chưa thể cập nhật', 'Tính năng nhiệm vụ cần backend production để xác thực phần thưởng.'); }
  };

  return (
    <FlatList
      data={missions}
      keyExtractor={(m) => m.id}
      contentContainerStyle={{ padding: spacing.lg }}
      style={{ backgroundColor: colors.background }}
      ListHeaderComponent={
        <AppText variant="bodySmall" muted style={{ marginBottom: spacing.lg }}>
          Hoàn thành nhiệm vụ để nhận thêm lượt AI miễn phí
        </AppText>
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
  bar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%' },
});
