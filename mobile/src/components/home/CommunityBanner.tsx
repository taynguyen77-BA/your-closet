import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme';

export function CommunityBanner() {
  const router = useRouter();
  const { radius } = useTheme();

  return (
    <Pressable onPress={() => router.push('/community')}>
      <LinearGradient
        colors={['#1E1712', '#1E1712']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.banner, { borderRadius: radius.lg }]}
      >
        <AppText variant="h3">Pass đồ – Giải phóng tủ, kết nối cộng đồng</AppText>
        <AppText variant="bodySmall" muted style={{ marginTop: 4 }}>
          Trao đổi · Bán · Tặng — Khám phá ngay →
        </AppText>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { padding: 20, marginBottom: 16 },
});
