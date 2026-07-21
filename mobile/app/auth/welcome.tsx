import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { getMissingGoogleClientConfig } from '@/services/auth/authService';
import { useAuthStore } from '@/stores/authStore';
import { layout, rounded, useTheme } from '@/theme';

function SocialButton({ icon, label, disabled, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; disabled?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.social,
        { borderColor: colors.sand, borderRadius: rounded.DEFAULT, opacity: disabled ? 0.48 : pressed ? 0.78 : 1 },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
      <AppText variant="label" color={colors.primary}>{label}</AppText>
    </Pressable>
  );
}

export default function Welcome() {
  const router = useRouter();
  const { loginWithGoogle, loginWithFacebook, authError, isAuthLoading, firebaseSetupError } = useAuthStore();
  const missingGoogleConfig = getMissingGoogleClientConfig();
  const { colors, typeScale } = useTheme();

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {/* Editorial hero. Stitch fills this with a full-bleed fashion photograph;
          no such asset ships with the app yet, so it renders as a Sand-on-Linen
          tonal field with the wordmark in the same position. */}
      <View style={[styles.hero, { backgroundColor: colors.sand }]}>
        <AppText style={[typeScale.displayLgMobile, styles.wordmark, { color: colors.primary }]}>
          Tủ đồ của bạn
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={styles.sheetScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.copy}>
            <AppText style={[typeScale.headlineSm, styles.centered, { color: colors.primary }]}>
              Tủ đồ của bạn, thông minh hơn
            </AppText>
            <AppText style={[typeScale.bodyMd, styles.centered, { color: colors.textSecondary }]}>
              AI gợi ý trang phục mỗi ngày, thử đồ ảo, và kết nối cộng đồng thời trang
            </AppText>
          </View>

          <View style={styles.actions}>
            <Button
              label="Tiếp tục với số điện thoại"
              icon="call-outline"
              style={styles.action}
              onPress={() => router.push('/auth/phone' as never)}
            />
            <SocialButton
              icon="logo-google"
              label={isAuthLoading ? 'Đang kết nối Google...' : missingGoogleConfig.length ? 'Thiếu Google Client ID' : 'Tiếp tục với Google'}
              disabled={missingGoogleConfig.length > 0}
              onPress={() => { void loginWithGoogle(); }}
            />
            <SocialButton
              icon="logo-facebook"
              label="Tiếp tục với Facebook"
              onPress={() => { void loginWithFacebook(); }}
            />
          </View>

          {authError ? <AppText variant="bodySmall" color={colors.error} style={styles.centered}>{authError}</AppText> : null}
          {!authError && missingGoogleConfig.length ? (
            <AppText variant="bodySmall" color={colors.error} style={styles.centered}>
              Điền {missingGoogleConfig.join(', ')} trong mobile/.env và bật Google provider trong Firebase.
            </AppText>
          ) : null}
          {!authError && firebaseSetupError ? (
            <AppText variant="bodySmall" muted style={styles.centered}>Bản xem trước local. Điền Firebase keys để đăng nhập thật.</AppText>
          ) : null}

          <AppText style={[typeScale.labelSm, styles.centered, styles.terms, { color: colors.warmGray }]}>
            Bằng việc tiếp tục, bạn đồng ý với Điều khoản & Chính sách bảo mật
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', paddingTop: 72 },
  wordmark: { textAlign: 'center' },
  sheetScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  // Stitch pins the sheet to the bottom with an explicit rounded-t-[32px], opting
  // out of the token scale for this surface.
  sheet: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: layout.marginMobile,
    paddingTop: 40,
    paddingBottom: 48,
    alignItems: 'center',
  },
  copy: { gap: layout.unit, marginBottom: layout.stackLg },
  centered: { textAlign: 'center' },
  actions: { width: '100%', gap: 16, marginBottom: layout.stackMd },
  action: { width: '100%' },
  social: {
    minHeight: 54,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  terms: { marginTop: layout.stackSm, paddingHorizontal: 24 },
});
