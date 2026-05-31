import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

export default function ClosetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const item = useAppStore((s) => s.clothing.find((c) => c.id === id));

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText>Không tìm thấy món đồ</AppText>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Image source={{ uri: item.imageUrl }} style={[styles.hero, { borderRadius: radius.lg }]} />
      <AppText variant="h1" style={{ marginTop: spacing.lg }}>
        {item.name}
      </AppText>
      <AppText variant="bodySmall" muted>
        {item.type} · {item.color} · {item.material}
      </AppText>
      <GlassCard style={{ marginTop: spacing.lg }}>
        <AppText variant="bodySmall">Đã mặc {item.timesWorn} lần</AppText>
        <AppText variant="bodySmall" muted style={{ marginTop: 4 }}>
          Tags: {item.tags.join(', ')}
        </AppText>
        {item.season && (
          <AppText variant="bodySmall" muted>
            Mùa: {item.season.join(', ')}
          </AppText>
        )}
      </GlassCard>
      <View style={[styles.actions, { marginTop: spacing.xl }]}>
        <Button label="Sửa" variant="secondary" style={{ flex: 1, marginRight: 8 }} />
        <Button label="Xóa" variant="ghost" style={{ flex: 1, marginRight: 8 }} />
        <Button label="Thêm outfit" style={{ flex: 1 }} />
      </View>
      <Button
        label="Đăng lên cộng đồng"
        variant="accent"
        onPress={() => router.push('/community/create')}
        style={{ marginTop: spacing.md }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 360 },
  actions: { flexDirection: 'row', marginTop: 24 },
});
