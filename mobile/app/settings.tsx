import { Switch, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/theme';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { biometricEnabled, enableBiometric, disableBiometric, authError, logout } = useAuthStore();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [dailySuggestions, setDailySuggestions] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
      <GlassCard style={{ marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="body">Thông báo push</AppText>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: colors.accent }} />
        </View>
      </GlassCard>
      <GlassCard style={{ marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="body">Nhắc sự kiện</AppText>
          <Switch value={eventReminders} onValueChange={setEventReminders} trackColor={{ true: colors.accent }} />
        </View>
      </GlassCard>
      <GlassCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="body">Gợi ý AI hàng ngày</AppText>
          <Switch value={dailySuggestions} onValueChange={setDailySuggestions} trackColor={{ true: colors.accent }} />
        </View>
      </GlassCard>
      <GlassCard style={{ marginTop: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="body">Đăng nhập bằng Face ID / Vân tay</AppText>
            <AppText variant="bodySmall" muted>Yêu cầu xác minh sinh trắc học khi mở app.</AppText>
          </View>
          <Switch value={biometricEnabled} onValueChange={(value) => { void (value ? enableBiometric() : disableBiometric()); }} trackColor={{ true: colors.accent }} />
        </View>
        {authError ? <AppText variant="bodySmall" muted style={{ marginTop: 8 }}>{authError}</AppText> : null}
      </GlassCard>
      <AppText variant="bodySmall" muted style={{ marginTop: spacing.lg }}>
        Quyền riêng tư: dữ liệu của bạn được bảo vệ khi đồng bộ cloud. Báo cáo vi phạm qua mục Cộng đồng.
      </AppText>
      <Button label="Đăng xuất" variant="secondary" onPress={() => { void logout(); }} style={{ marginTop: spacing.lg }} />
      <Button label="Xoá tài khoản" variant="ghost" onPress={() => router.push('/profile/delete-account' as never)} style={{ marginTop: spacing.md }} />
    </View>
  );
}
