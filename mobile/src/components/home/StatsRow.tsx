import { StyleSheet, View } from 'react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppText } from '@/components/ui/AppText';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

export function StatsRow() {
  const { spacing } = useTheme();
  const { user, clothing } = useAppStore();

  const stats = [
    { label: 'Tủ đồ', value: `${user.closetItemCount}` },
    { label: 'AI còn lại', value: user.plan === 'free' ? `${user.aiUsageRemaining}` : '∞' },
    { label: 'Outfit tháng', value: '12' },
    { label: 'Dùng nhiều', value: (clothing.sort((a, b) => b.timesWorn - a.timesWorn)[0]?.name.slice(0, 8) ?? '—') + (clothing.length ? '…' : '') },
  ];

  return (
    <View style={[styles.row, { gap: spacing.sm, marginBottom: spacing.lg }]}>
      {stats.map((s) => (
        <GlassCard key={s.label} style={styles.stat}>
          <AppText variant="h3">{s.value}</AppText>
          <AppText variant="caption" muted>
            {s.label}
          </AppText>
        </GlassCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  stat: { flex: 1, minWidth: '45%', padding: 12 },
});
