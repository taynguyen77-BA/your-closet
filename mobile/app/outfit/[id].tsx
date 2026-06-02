import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { SafeImage } from '@/components/ui/SafeImage';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const outfit = useAppStore((s) => s.outfits.find((o) => o.id === id));

  if (!outfit) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText>Không tìm thấy outfit</AppText>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      {outfit.previewImageUrl && (
        <SafeImage source={{ uri: outfit.previewImageUrl }} style={[styles.hero, { borderRadius: radius.lg }]} fallbackLabel="ẢNH OUTFIT" />
      )}
      <AppText variant="h1" style={{ marginTop: spacing.lg }}>
        {outfit.name}
      </AppText>
      {outfit.matchingScore && (
        <AppText variant="label" color={colors.accentDark}>
          Điểm phù hợp: {outfit.matchingScore}%
        </AppText>
      )}
      <GlassCard style={{ marginTop: spacing.lg }}>
        <AppText variant="h3">Món trong outfit</AppText>
        {outfit.items.map((item) => (
          <AppText key={item.clothingId} variant="body" style={{ marginTop: 8 }}>
            · {item.name} ({item.type})
          </AppText>
        ))}
      </GlassCard>
      {outfit.aiExplanation && (
        <GlassCard style={{ marginTop: spacing.md }}>
          <AppText variant="h3">Giải thích AI</AppText>
          <AppText variant="bodySmall" style={{ marginTop: 8 }}>
            {outfit.aiExplanation}
          </AppText>
          {outfit.colorMatching && (
            <AppText variant="bodySmall" muted style={{ marginTop: 4 }}>
              Màu sắc: {outfit.colorMatching}
            </AppText>
          )}
          {outfit.styleMatching && (
            <AppText variant="bodySmall" muted>
              Phong cách: {outfit.styleMatching}
            </AppText>
          )}
        </GlassCard>
      )}
      <Button label="Thử ngay" onPress={() => router.push(`/(tabs)/try-on?outfitId=${outfit.id}`)} style={{ marginTop: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 360 },
});
