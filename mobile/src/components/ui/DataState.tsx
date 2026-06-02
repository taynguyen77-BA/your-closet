import { ActivityIndicator, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '@/theme';

export function DataState({ loading, error, empty, emptyText }: {
  loading?: boolean; error?: string; empty?: boolean; emptyText: string;
}) {
  const { colors, spacing } = useTheme();
  if (!loading && !error && !empty) return null;
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
      {loading ? <ActivityIndicator color={colors.accentDark} /> : null}
      <AppText variant="bodySmall" muted style={{ marginTop: loading ? spacing.sm : 0, textAlign: 'center' }}>
        {loading ? 'Đang tải dữ liệu...' : error ? 'Experience Mode · Dữ liệu local đang sẵn sàng.' : emptyText}
      </AppText>
    </View>
  );
}
