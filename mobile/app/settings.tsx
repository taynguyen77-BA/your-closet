import { Switch, View } from 'react-native';
import { useState } from 'react';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/theme';

export default function SettingsScreen() {
  const { colors, spacing } = useTheme();
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
      <AppText variant="bodySmall" muted style={{ marginTop: spacing.lg }}>
        Quyền riêng tư: dữ liệu của bạn được bảo vệ khi đồng bộ cloud. Báo cáo vi phạm qua mục Cộng đồng.
      </AppText>
    </View>
  );
}
