import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { OutfitCard } from '@/components/outfit/OutfitCard';
import { AiUsageBanner } from '@/components/ui/AiUsageBanner';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { Outfit } from '@/models';
import { aiService } from '@/services/ai/aiService';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

export default function EventsScreen() {
  const { colors, spacing, radius } = useTheme();
  const events = useAppStore((s) => s.events);
  const clothing = useAppStore((s) => s.clothing);
  const weather = useAppStore((s) => s.weather);
  const useAiTry = useAppStore((s) => s.useAiTry);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [eventType, setEventType] = useState('party');
  const [suggestions, setSuggestions] = useState<Partial<Outfit>[]>([]);
  const [loading, setLoading] = useState(false);

  const suggestOutfit = async () => {
    if (!useAiTry()) {
      Alert.alert('Hết lượt AI', 'Nâng cấp hoặc hoàn thành nhiệm vụ để có thêm lượt.');
      return;
    }
    setLoading(true);
    const results = await aiService.suggestOutfits({
      weather,
      wardrobe: clothing,
    });
    setSuggestions(results);
    setLoading(false);
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.beige, borderRadius: radius.md, color: colors.text },
  ];

  return (
    <Screen>
      <AppText variant="display" style={{ marginBottom: spacing.md }}>
        Sự kiện
      </AppText>
      <AiUsageBanner />

      <SectionHeader title="Tạo sự kiện" />
      <GlassCard>
        <TextInput placeholder="Tên sự kiện" value={name} onChangeText={setName} style={inputStyle} />
        <TextInput placeholder="Ngày (YYYY-MM-DD)" value={date} onChangeText={setDate} style={inputStyle} />
        <TextInput placeholder="Địa điểm" value={location} onChangeText={setLocation} style={inputStyle} />
        <TextInput
          placeholder="Loại: wedding, party, work, travel..."
          value={eventType}
          onChangeText={setEventType}
          style={inputStyle}
        />
        <Button
          label={loading ? 'Đang gợi ý...' : 'Gợi ý outfit AI'}
          icon="sparkles"
          onPress={suggestOutfit}
          style={{ marginTop: spacing.md }}
        />
        <Button label="Lưu sự kiện" variant="secondary" style={{ marginTop: spacing.sm }} />
      </GlassCard>

      {suggestions.length > 0 && (
        <>
          <SectionHeader title="Outfit gợi ý" />
          {suggestions.map((o, i) => (
            <OutfitCard
              key={i}
              outfit={{
                id: `suggest-${i}`,
                userId: 'user-1',
                name: o.name ?? 'Outfit gợi ý',
                items: o.items ?? [],
                aiExplanation: o.aiExplanation,
                weatherCompatibility: o.weatherCompatibility,
                colorMatching: o.colorMatching,
                styleMatching: o.styleMatching,
                matchingScore: o.matchingScore,
                isSaved: false,
                createdAt: new Date().toISOString(),
              }}
            />
          ))}
        </>
      )}

      {suggestions.length === 0 && clothing.length < 3 && (
        <GlassCard style={{ marginTop: spacing.lg }}>
          <AppText variant="h3">Gợi ý mua sắm</AppText>
          <AppText variant="bodySmall" muted style={{ marginVertical: 8 }}>
            Tủ đồ chưa đủ để tạo outfit. Xem sản phẩm affiliate được đề xuất.
          </AppText>
          <Button label="Xem sản phẩm" variant="accent" />
        </GlassCard>
      )}

      <SectionHeader title="Sự kiện của bạn" />
      {events.map((e) => (
        <GlassCard key={e.id} style={{ marginBottom: spacing.md }}>
          <AppText variant="h3">{e.name}</AppText>
          <AppText variant="bodySmall" muted>
            {e.date} · {e.location} · {e.eventType}
          </AppText>
          {e.dressCode && (
            <AppText variant="bodySmall">Dress code: {e.dressCode}</AppText>
          )}
        </GlassCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { padding: 12, marginBottom: 8, fontSize: 15 },
});
