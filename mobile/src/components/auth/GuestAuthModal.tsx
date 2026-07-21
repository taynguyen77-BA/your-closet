import { Modal, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { rounded, useTheme } from '@/theme';
export function GuestAuthModal() {
  const router = useRouter(); const { colors } = useTheme();
  const visible = useAuthStore((s) => s.showGuestPrompt); const close = useAuthStore((s) => s.closeGuestPrompt); const enterAuthFlow = useAuthStore((s) => s.enterAuthFlow);
  return <Modal visible={visible} transparent animationType="fade"><View style={styles.overlay}><View style={[styles.card, { backgroundColor: colors.surface, borderRadius: rounded.lg }]}>
    <AppText variant="h2">Tạo tài khoản để lưu phong cách của bạn</AppText>
    <AppText variant="bodySmall" muted style={{ marginVertical: 10 }}>Giữ tủ đồ, outfit và những lựa chọn rất riêng của bạn trên mọi thiết bị.</AppText>
    <Button label="Đăng nhập hoặc tạo tài khoản" onPress={() => { close(); router.push(enterAuthFlow('/auth/welcome') as never); }} />
    <Button label="Tiếp tục trải nghiệm" variant="ghost" onPress={close} style={{ marginTop: 8 }} />
  </View></View></Modal>;
}
const styles = StyleSheet.create({ overlay: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: '#0006' }, card: { padding: 20 } });
