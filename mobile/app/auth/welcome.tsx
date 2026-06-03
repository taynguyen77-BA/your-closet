import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme';

function SocialButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const { colors, radius } = useTheme();
  return <Pressable onPress={onPress} style={[styles.social, { borderColor: colors.border, borderRadius: radius.lg }]}><Ionicons name={icon} size={20} color={colors.accentDark} /><AppText variant="label">{label}</AppText></Pressable>;
}

export default function Welcome() {
  const router = useRouter();
  const { loginWithGoogle, loginWithFacebook, authError, isAuthLoading } = useAuthStore();
  return (
    <AuthScreen title="Mặc đúng vibe, mỗi ngày." subtitle="Tủ đồ thông minh, outfit xinh và AI stylist luôn nhớ phong cách riêng của bạn.">
      <AppText variant="h2">Đăng nhập hoặc tạo tài khoản</AppText>
      <View style={{ gap: 10, marginTop: 16 }}>
        <Button label="Tiếp tục với số điện thoại" onPress={() => router.push('/auth/phone' as never)} />
        <SocialButton icon="logo-google" label={isAuthLoading ? 'Đang kết nối Google...' : 'Tiếp tục với Google'} onPress={() => { void loginWithGoogle(); }} />
        <SocialButton icon="logo-facebook" label="Tiếp tục với Facebook" onPress={() => { void loginWithFacebook(); }} />
        <Button label="Đăng nhập bằng email" variant="secondary" onPress={() => router.push('/auth/login')} />
        <Button label="Đăng ký" variant="ghost" onPress={() => router.push('/auth/register')} />
        {authError ? <AppText variant="bodySmall" muted>{authError}</AppText> : null}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({ social: { minHeight: 48, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 } });
