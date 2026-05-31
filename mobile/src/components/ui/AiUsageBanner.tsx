import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import { useAppStore } from '@/stores/appStore';
import { AppText } from './AppText';

export function AiUsageBanner() {
  const { colors, radius, spacing } = useTheme();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const isUnlimited = user.plan !== 'free';

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.lavender,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.lg,
        },
      ]}
    >
      <View style={styles.row}>
        <Ionicons name="sparkles" size={20} color={colors.accentDark} />
        <View style={styles.text}>
          <AppText variant="label">
            {isUnlimited
              ? 'AI không giới hạn'
              : `Còn ${user.aiUsageRemaining}/${user.aiUsageMonthlyLimit} lượt AI`}
          </AppText>
          {!isUnlimited && (
            <AppText variant="bodySmall" muted>
              Tủ đồ: {user.closetItemCount}/{user.closetItemLimit} món
            </AppText>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => router.push('/membership')}>
          <AppText variant="label" color={colors.accentDark}>
            Nâng cấp
          </AppText>
        </Pressable>
        <Pressable onPress={() => router.push('/missions')}>
          <AppText variant="label" color={colors.accentDark}>
            Nhiệm vụ +
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {},
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  text: { marginLeft: 10, flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
});
