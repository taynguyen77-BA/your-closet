import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppText } from '@/components/ui/AppText';
import type { Outfit } from '@/models';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

interface OutfitCardProps {
  outfit: Outfit;
  compact?: boolean;
}

export function OutfitCard({ outfit, compact }: OutfitCardProps) {
  const { colors, radius, spacing } = useTheme();
  const router = useRouter();
  const saveOutfit = useAppStore((s) => s.saveOutfit);

  return (
    <GlassCard style={{ marginBottom: spacing.lg, padding: 0, overflow: 'hidden' }}>
      {outfit.previewImageUrl ? (
        <Image
          source={{ uri: outfit.previewImageUrl }}
          style={[styles.image, compact && styles.imageCompact]}
          contentFit="cover"
        />
      ) : null}
      <View style={{ padding: spacing.lg }}>
        <View style={styles.header}>
          <AppText variant="h3">{outfit.name}</AppText>
          {outfit.matchingScore ? (
            <View style={[styles.score, { backgroundColor: colors.pink }]}>
              <AppText variant="caption">{outfit.matchingScore}%</AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.items}>
          {outfit.items.map((item) => (
            <AppText key={item.clothingId} variant="bodySmall" muted>
              · {item.name}
            </AppText>
          ))}
        </View>

        {!compact && outfit.aiExplanation ? (
          <View style={[styles.explain, { backgroundColor: colors.beige, borderRadius: radius.sm }]}>
            <AppText variant="bodySmall">{outfit.aiExplanation}</AppText>
            {outfit.weatherCompatibility ? (
              <AppText variant="caption" muted style={{ marginTop: 4 }}>
                {outfit.weatherCompatibility}
              </AppText>
            ) : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            label="Thử ngay"
            variant="primary"
            small
            icon="shirt-outline"
            onPress={() => router.push(`/(tabs)/try-on?outfitId=${outfit.id}`)}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            label={outfit.isSaved ? 'Đã lưu' : 'Lưu'}
            variant="secondary"
            small
            icon="bookmark-outline"
            onPress={() => saveOutfit(outfit.id)}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            label="Chi tiết"
            variant="ghost"
            small
            onPress={() => router.push(`/outfit/${outfit.id}`)}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 180 },
  imageCompact: { height: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  score: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  items: { marginBottom: 8 },
  explain: { padding: 10, marginBottom: 12 },
  actions: { flexDirection: 'row' },
});
