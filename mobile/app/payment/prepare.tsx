import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { MEMBERSHIP_PLANS, PAYMENT_METHODS } from '@/constants/membership';
import { useTheme } from '@/theme';

export default function PaymentPrepareScreen() {
  const { plan: planId, method: methodId } = useLocalSearchParams<{ plan: string; method: string }>();
  const { colors, spacing } = useTheme();
  const plan = MEMBERSHIP_PLANS.find((item) => item.id === planId);
  const method = PAYMENT_METHODS.find((item) => item.id === methodId);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
      <GlassCard>
        <AppText variant="h2">{plan?.name ?? 'Gói thành viên'}</AppText>
        <AppText variant="body" style={{ marginTop: spacing.sm }}>{plan?.priceLabel}</AppText>
        <AppText variant="bodySmall" muted style={{ marginTop: spacing.sm }}>
          Phương thức: {method?.label ?? methodId}
        </AppText>
        <AppText variant="bodySmall" muted style={{ marginTop: spacing.lg }}>
          Cổng thanh toán chưa được cấu hình. Yêu cầu đã được chuẩn bị nhưng chưa thể gửi sang nhà cung cấp.
        </AppText>
        <Button label="Chưa thể tiếp tục: thiếu cổng thanh toán" disabled style={{ marginTop: spacing.lg }} />
      </GlassCard>
    </View>
  );
}
