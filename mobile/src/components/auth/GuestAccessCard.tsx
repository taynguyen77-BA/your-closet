import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme';

interface GuestAccessCardProps {
  title?: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function GuestAccessCard({
  title = 'Đăng nhập để dùng tính năng này',
  description = 'Tạo tài khoản để lưu tủ đồ, outfit, lịch trình và hồ sơ phong cách cá nhân.',
  icon = 'lock-closed-outline',
}: GuestAccessCardProps) {
  const router = useRouter();
  const enterAuthFlow = useAuthStore((s) => s.enterAuthFlow);
  const { colors, radius, spacing } = useTheme();
  const goToAuth = () => router.push(enterAuthFlow('/auth/welcome') as never);
  return (
    <GlassCard style={{ marginBottom: spacing.lg, borderColor: colors.pink }}>
      <View style={[styles.icon, { backgroundColor: colors.pink, borderRadius: radius.full }]}>
        <Ionicons name={icon} size={26} color={colors.accentDark} />
      </View>
      <AppText variant="h2" style={styles.title}>{title}</AppText>
      <AppText variant="bodySmall" muted style={styles.description}>{description}</AppText>
      <View style={styles.actions}>
        <Button label="Đăng nhập hoặc tạo tài khoản" icon="log-in-outline" onPress={goToAuth} style={styles.action} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  icon: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { marginBottom: 6 },
  description: { lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  action: { flex: 1 },
});
