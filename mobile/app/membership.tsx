import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { MEMBERSHIP_PLANS, PAYMENT_METHODS } from '@/constants/membership';
import { useTheme } from '@/theme';

export default function MembershipScreen() {
  const { colors, spacing, radius } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const [payment, setPayment] = useState('vnpay');

  const checkout = () => {
    const plan = MEMBERSHIP_PLANS.find((p) => p.id === selectedPlan);
    const method = PAYMENT_METHODS.find((m) => m.id === payment);
    Alert.alert(
      'Thanh toán',
      `Gói ${plan?.name} qua ${method?.label}. Tích hợp VNPay/MoMo/Apple Pay sẽ kết nối Firebase Functions.`,
    );
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
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
            {plan.aiGenerations} · {plan.closetLimit}
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
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  payments: { flexDirection: 'row', flexWrap: 'wrap' },
});
