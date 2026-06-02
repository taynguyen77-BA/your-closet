import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/theme';

export default function ShoppingScreen() {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
      <GlassCard>
        <AppText variant="h2">Sản phẩm affiliate</AppText>
        <AppText variant="bodySmall" muted style={{ marginTop: spacing.sm }}>
          Chưa có sản phẩm phù hợp. Gợi ý mua sắm sẽ xuất hiện khi đối tác affiliate được kết nối.
        </AppText>
      </GlassCard>
    </View>
  );
}
