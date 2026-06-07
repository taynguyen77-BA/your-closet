import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { getMissingGoogleClientConfig } from '@/services/auth/authService';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme';

function SocialButton({ icon, label, disabled, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; disabled?: boolean; onPress: () => void }) {
  const { colors, radius } = useTheme();
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.social, { borderColor: colors.border, borderRadius: radius.lg, opacity: disabled ? 0.48 : pressed ? 0.78 : 1 }]}>
      <View style={[styles.socialIcon, { backgroundColor: colors.backgroundTint }]}>
        <Ionicons name={icon} size={20} color={colors.text} />
      </View>
      <AppText variant="label" style={styles.socialLabel}>{label}</AppText>
    </Pressable>
  );
}

export default function Welcome() {
  const router = useRouter();
  const { loginWithGoogle, loginWithFacebook, authError, isAuthLoading, firebaseSetupError } = useAuthStore();
  const missingGoogleConfig = getMissingGoogleClientConfig();
  return (
    <AuthScreen title="Mặc đúng vibe, mỗi ngày." subtitle="Tủ đồ thông minh, outfit xinh và AI stylist luôn nhớ phong cách riêng của bạn.">
      <View style={styles.header}>
        <AppText variant="h2" style={styles.heading}>Tiếp tục vào Tủ đồ của bạn</AppText>
        <AppText muted style={styles.helper}>Nếu tài khoản đã tồn tại, bạn sẽ được đăng nhập. Nếu chưa, ứng dụng sẽ tạo hồ sơ mới cho bạn.</AppText>
      </View>
      <View style={styles.stack}>
        <Button label="Tiếp tục với số điện thoại" onPress={() => router.push('/auth/phone' as never)} />
        <SocialButton icon="logo-google" label={isAuthLoading ? 'Đang kết nối Google...' : missingGoogleConfig.length ? 'Thiếu Google Client ID' : 'Tiếp tục với Google'} disabled={missingGoogleConfig.length > 0} onPress={() => { void loginWithGoogle(); }} />
        <SocialButton icon="logo-facebook" label="Tiếp tục với Facebook" onPress={() => { void loginWithFacebook(); }} />
        {authError ? <AppText variant="bodySmall" color="#B94B54" style={styles.message}>{authError}</AppText> : null}
        {!authError && missingGoogleConfig.length ? <AppText variant="bodySmall" color="#B94B54" style={styles.message}>Điền {missingGoogleConfig.join(', ')} trong mobile/.env và bật Google provider trong Firebase.</AppText> : null}
        {!authError && firebaseSetupError ? <AppText variant="bodySmall" muted style={styles.message}>Bản xem trước local. Điền Firebase keys để đăng nhập thật.</AppText> : null}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 18 },
  heading: { fontSize: 25, lineHeight: 31 },
  helper: { marginTop: 6, fontSize: 14, lineHeight: 21 },
  stack: { gap: 12 },
  social: { minHeight: 54, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#fff' },
  socialIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  socialLabel: { flex: 1, textAlign: 'center', marginRight: 46 },
  message: { textAlign: 'center', marginTop: 2 },
});
