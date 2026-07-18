import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { layout, rounded, useTheme } from '@/theme';
import { useAuthStore } from '@/stores/authStore';

function SectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return <AppText variant="caption" color={colors.warmGray} style={styles.sectionLabel}>{children}</AppText>;
}

function ToggleRow({
  icon,
  label,
  hint,
  value,
  onValueChange,
  divider,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  divider?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <>
      <View style={styles.row}>
        <Ionicons name={icon} size={22} color={colors.primary} style={styles.rowIcon} />
        <View style={styles.rowBody}>
          <AppText variant="body" color={colors.primary}>{label}</AppText>
          {hint ? <AppText variant="bodySmall" muted style={{ marginTop: 2 }}>{hint}</AppText> : null}
        </View>
        <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary, false: colors.border }} thumbColor={colors.surface} />
      </View>
      {divider ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
    </>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { biometricEnabled, enableBiometric, disableBiometric, authError, logout } = useAuthStore();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [dailySuggestions, setDailySuggestions] = useState(true);
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.contentContainer}>
      {/* placeholder — pending real asset, see docs/OPEN_ITEMS_assets_pending.md (Settings hero, 16:9) */}
      <View style={[styles.hero, { backgroundColor: colors.sand, borderRadius: rounded.lg }]}>
        <AppText variant="h3" color={colors.primary}>Trải nghiệm thời trang tinh tế.</AppText>
      </View>

      <SectionLabel>BẢO MẬT</SectionLabel>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.sand, borderRadius: rounded.DEFAULT }]}>
        <ToggleRow
          icon="finger-print-outline"
          label="Face ID / Vân tay"
          hint="Yêu cầu xác minh sinh trắc học khi mở app."
          value={biometricEnabled}
          onValueChange={(value) => { void (value ? enableBiometric() : disableBiometric()); }}
        />
        {authError ? <AppText variant="bodySmall" muted style={styles.rowError}>{authError}</AppText> : null}
      </View>

      <SectionLabel>THÔNG BÁO</SectionLabel>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.sand, borderRadius: rounded.DEFAULT }]}>
        <ToggleRow icon="notifications-outline" label="Thông báo push" value={pushEnabled} onValueChange={setPushEnabled} divider />
        <ToggleRow icon="calendar-outline" label="Nhắc sự kiện" value={eventReminders} onValueChange={setEventReminders} divider />
        <ToggleRow icon="sparkles-outline" label="Gợi ý AI hàng ngày" value={dailySuggestions} onValueChange={setDailySuggestions} />
      </View>

      <SectionLabel>QUYỀN RIÊNG TƯ</SectionLabel>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.sand, borderRadius: rounded.DEFAULT }]}>
        <View style={styles.row}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} style={styles.rowIcon} />
          <AppText variant="bodySmall" muted style={styles.rowBody}>
            Dữ liệu của bạn được bảo vệ khi đồng bộ cloud. Báo cáo vi phạm qua mục Cộng đồng.
          </AppText>
        </View>
      </View>

      {/* Help/Support content kept inline per ADR-10 (no dedicated route while R2 is unresolved). */}
      <SectionLabel>TRỢ GIÚP & HỖ TRỢ</SectionLabel>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.sand, borderRadius: rounded.DEFAULT }]}>
        <View style={styles.helpItem}>
          <AppText variant="label" color={colors.primary}>Chưa đăng nhập được?</AppText>
          <AppText variant="bodySmall" muted style={{ marginTop: 2 }}>Kiểm tra kết nối mạng và thử gửi lại mã OTP. Mỗi số điện thoại tạo một hồ sơ duy nhất.</AppText>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.helpItem}>
          <AppText variant="label" color={colors.primary}>Quản lý gói thành viên</AppText>
          <AppText variant="bodySmall" muted style={{ marginTop: 2 }}>Xem hạn dùng và nâng cấp trong trang Cá nhân → Nâng cấp.</AppText>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.helpItem}>
          <AppText variant="label" color={colors.primary}>Gửi phản hồi</AppText>
          <AppText variant="bodySmall" muted style={{ marginTop: 2 }}>Góp ý và báo lỗi được tiếp nhận trong mục Cộng đồng của ứng dụng.</AppText>
        </View>
      </View>

      {/* Logout confirmation kept inline per ADR-10 (no dedicated confirm route). */}
      <View style={styles.footer}>
        {confirmLogout ? (
          <View style={[styles.confirm, { borderColor: colors.sand, borderRadius: rounded.DEFAULT }]}>
            <AppText variant="body" color={colors.primary} style={styles.confirmText}>Đăng xuất khỏi tài khoản này?</AppText>
            <View style={styles.confirmActions}>
              <Button label="Huỷ" variant="secondary" onPress={() => setConfirmLogout(false)} style={styles.confirmBtn} />
              <Button label="Đăng xuất" onPress={() => { void logout(); }} style={styles.confirmBtn} />
            </View>
          </View>
        ) : (
          <Button label="Đăng xuất" variant="secondary" icon="log-out-outline" onPress={() => setConfirmLogout(true)} />
        )}
        <Pressable onPress={() => router.push('/profile/delete-account' as never)} style={styles.deleteRow} hitSlop={8}>
          <AppText variant="label" color={colors.error}>Xoá tài khoản</AppText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: { padding: layout.marginMobile, paddingBottom: 40 },
  hero: { width: '100%', aspectRatio: 16 / 9, marginBottom: layout.stackMd, overflow: 'hidden', justifyContent: 'flex-end', padding: 16 },
  sectionLabel: { marginTop: layout.stackMd, marginBottom: layout.stackSm },
  card: { borderWidth: 1, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  rowIcon: {},
  rowBody: { flex: 1 },
  rowError: { paddingBottom: 12 },
  divider: { height: 1 },
  helpItem: { paddingVertical: 14 },
  footer: { marginTop: layout.stackLg, gap: layout.stackMd },
  confirm: { borderWidth: 1, padding: 16, gap: 12 },
  confirmText: { textAlign: 'center' },
  confirmActions: { flexDirection: 'row', gap: 10 },
  confirmBtn: { flex: 1 },
  deleteRow: { alignItems: 'center', paddingVertical: 8 },
});
