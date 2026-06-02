import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { MEMBERSHIP_PLANS, PAYMENT_METHODS } from '@/constants/membership';
import { useTheme } from '@/theme';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';

export default function MembershipScreen() {
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const planLimits = useAppStore((state) => state.planLimits);
  const user = useAppStore((state) => state.user);
  const outfitCount = useAppStore((state) => state.outfits.length);
  const avoidedPurchases = useAppStore((state) => state.clothing.filter((item) => item.timesWorn > 7).length);
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const [payment, setPayment] = useState('vnpay');

  const checkout = () => {
    if (!useAuthStore.getState().requireAccount()) return;
    router.push(`/payment/prepare?plan=${selectedPlan}&method=${payment}`);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <AppText variant="bodySmall" muted>GIÁ TRỊ BẠN ĐÃ NHẬN</AppText>
      <AppText variant="display">Phong cách tốt hơn, ít tốn công hơn</AppText>
      <View style={styles.valueRow}>
        {[[`${outfitCount}`, 'outfit đã tạo'], [`${outfitCount * 20}m`, 'thời gian tiết kiệm'], [`${avoidedPurchases}`, 'món được mặc lại']].map(([value, label]) => <View key={label} style={[styles.valueCard, { backgroundColor: colors.beige, borderRadius: radius.md }]}><AppText variant="h2">{value}</AppText><AppText variant="caption" muted>{label}</AppText></View>)}
      </View>
      <View style={[styles.current, { backgroundColor: colors.primary, borderRadius: radius.xl }]}>
        <AppText variant="caption" color={colors.accent}>GÓI HIỆN TẠI</AppText>
        <AppText variant="h2" color={colors.textInverse}>{planLimits[user.plan].label}</AppText>
        <AppText variant="bodySmall" color={colors.warmGray}>{user.aiUsageRemaining}/{user.aiUsageMonthlyLimit} credits AI còn lại · {user.closetItemCount} món trong tủ</AppText>
      </View>
      {MEMBERSHIP_PLANS.map((plan) => (
        <GlassCard
          key={plan.id}
          style={{
            marginBottom: 16,
            ...(selectedPlan === plan.id
              ? { borderColor: colors.accent, borderWidth: 2 }
              : {}),
          }}
        >
          <View style={styles.planHeader}>
            <AppText variant="h2">{plan.name}</AppText>
            {plan.badge && (
              <View style={[styles.badge, { backgroundColor: colors.pink }]}>
                <AppText variant="caption">{plan.badge}</AppText>
              </View>
            )}
          </View>
          <AppText variant="h3" color={colors.accentDark}>
            {plan.priceLabel}
          </AppText>
          <AppText variant="bodySmall" muted>
            {planLimits[plan.id].aiMonthly < 0 ? 'Không giới hạn AI' : `${planLimits[plan.id].aiMonthly} lượt AI/tháng`}
            {' · '}
            {planLimits[plan.id].closetItems < 0 ? 'Tủ đồ không giới hạn' : `Tối đa ${planLimits[plan.id].closetItems} món`}
          </AppText>
          {plan.features.map((f) => (
            <AppText key={f} variant="bodySmall" style={{ marginTop: 4 }}>
              ✓ {f}
            </AppText>
          ))}
          <Button
            label={selectedPlan === plan.id ? 'Đã chọn' : 'Chọn gói'}
            variant={selectedPlan === plan.id ? 'primary' : 'secondary'}
            small
            onPress={() => setSelectedPlan(plan.id)}
            style={{ marginTop: 12, alignSelf: 'flex-start' }}
          />
        </GlassCard>
      ))}

      <AppText variant="h3" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
        Phương thức thanh toán
      </AppText>
      <View style={styles.payments}>
        {PAYMENT_METHODS.map((m) => (
          <Button
            key={m.id}
            label={m.label}
            variant={payment === m.id ? 'primary' : 'ghost'}
            small
            onPress={() => setPayment(m.id)}
            style={{ marginRight: 8, marginBottom: 8 }}
          />
        ))}
      </View>

      <Button label="Thanh toán" onPress={checkout} style={{ marginTop: spacing.lg }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  valueRow: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  valueCard: { flex: 1, padding: 10, minHeight: 76 },
  current: { padding: 16, marginBottom: 20 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  payments: { flexDirection: 'row', flexWrap: 'wrap' },
});
