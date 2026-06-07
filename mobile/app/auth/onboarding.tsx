import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme';

const pages = [
  ['shirt-outline', 'Quản lý tủ đồ', 'Lưu áo quần, giày túi và phụ kiện vào một nơi thật gọn, dễ tìm khi cần phối.'],
  ['sparkles-outline', 'AI gợi ý outfit', 'Stylist AI hiểu màu sắc, thời tiết và vibe bạn thích để gợi ý outfit mỗi ngày.'],
  ['camera-outline', 'Try-on & sự kiện', 'Chuẩn bị outfit cho hẹn hò, đi làm, tiệc cưới hoặc chuyến đi cuối tuần.'],
  ['people-outline', 'Cộng đồng pass đồ', 'Bán, trao đổi hoặc pass lại món đồ đẹp để vòng đời thời trang nhẹ nhàng hơn.'],
] as const;

export default function Onboarding() {
  const router = useRouter();
  const { colors } = useTheme();
  const complete = useAuthStore((s) => s.completeFirstLaunchOnboarding);
  const startGuestSession = useAuthStore((s) => s.startGuestSession);
  const [index, setIndex] = useState(0);
  const page = pages[index];
  const finish = async () => { await complete(); router.replace('/auth/welcome'); };
  const continueAsGuest = async () => {
    await complete();
    startGuestSession();
    router.replace('/(tabs)');
  };
  return (
    <LinearGradient colors={['#FFF6F8', '#F2F7FF', '#F8F1FF']} style={styles.root}>
      <Pressable style={styles.skip} onPress={() => { void finish(); }}><AppText muted>Bỏ qua</AppText></Pressable>
      <View style={[styles.art, { backgroundColor: colors.surface }]}><Ionicons name={page[0]} size={92} color={colors.accentDark} /></View>
      <View style={styles.copy}>
        <AppText variant="display" style={{ textAlign: 'center' }}>{page[1]}</AppText>
        <AppText muted style={{ textAlign: 'center', marginTop: 12 }}>{page[2]}</AppText>
      </View>
      <View style={styles.dots}>{pages.map((_, dot) => <View key={dot} style={[styles.dot, { backgroundColor: dot === index ? colors.primary : colors.border }]} />)}</View>
      <Button label={index === pages.length - 1 ? 'Bắt đầu' : 'Tiếp tục'} onPress={() => { if (index === pages.length - 1) void finish(); else setIndex(index + 1); }} />
      <Button label="Trải nghiệm không đăng nhập" variant="ghost" icon="sparkles-outline" onPress={() => { void continueAsGuest(); }} style={styles.guestButton} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, padding: 24, justifyContent: 'center' }, skip: { position: 'absolute', top: 58, right: 24 }, art: { width: 190, height: 190, borderRadius: 95, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 34 }, copy: { minHeight: 170, justifyContent: 'center' }, dots: { flexDirection: 'row', alignSelf: 'center', gap: 8, marginBottom: 24 }, dot: { width: 9, height: 9, borderRadius: 9 }, guestButton: { marginTop: 8 } });
