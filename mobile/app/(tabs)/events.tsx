import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { OutfitCard } from '@/components/outfit/OutfitCard';
import { AiUsageBanner } from '@/components/ui/AiUsageBanner';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GuestAccessCard } from '@/components/auth/GuestAccessCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { Outfit } from '@/models';
import { aiService } from '@/services/ai/aiService';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';
import { DataState } from '@/components/ui/DataState';
import type { EventType } from '@/models';
import { useAuthStore } from '@/stores/authStore';

export default function EventsScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const events = useAppStore((s) => s.events);
  const clothing = useAppStore((s) => s.clothing);
  const weather = useAppStore((s) => s.weather);
  const canUseAiTry = useAppStore((s) => s.canUseAiTry);
  const consumeAiTry = useAppStore((s) => s.consumeAiTry);
  const createEvent = useAppStore((s) => s.createEvent);
  const loadState = useAppStore((s) => s.loadState);
  const error = useAppStore((s) => s.error);
  const { isAuthenticated, isGuest } = useAuthStore();
  const isPublicViewer = isGuest || !isAuthenticated;

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [eventType, setEventType] = useState('party');
  const [suggestions, setSuggestions] = useState<Partial<Outfit>[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (isPublicViewer) {
    return (
      <Screen bottomOffset={96}>
        <AppText variant="display" style={{ marginBottom: spacing.md }}>Sự kiện</AppText>
        <GuestAccessCard icon="calendar-outline" title="Đăng nhập để lưu lịch trình" description="Sự kiện, dress code và gợi ý outfit theo thời tiết là dữ liệu cá nhân nên cần tài khoản." />
        <Button label="Xem mua sắm gợi ý" variant="secondary" icon="bag-handle-outline" onPress={() => router.push('/shopping')} />
      </Screen>
    );
  }

  const saveEvent = async () => {
    if (!name || !date || !location) return Alert.alert('Thiếu thông tin', 'Nhập tên, ngày và địa điểm sự kiện.');
    setSaving(true);
    try {
      await createEvent({ userId: useAppStore.getState().user.id, name, date, location, eventType: eventType as EventType, linkedOutfitIds: [], createdAt: new Date().toISOString() });
      setName(''); setDate(''); setLocation('');
      Alert.alert('Đã lưu', 'Sự kiện đã được lưu.');
    } catch { Alert.alert('Chưa lưu được', 'Thử lại sau một chút nhé. Chế độ trải nghiệm vẫn sẵn sàng để bạn khám phá ứng dụng.'); }
    finally { setSaving(false); }
  };

  const suggestOutfit = async () => {
    if (!canUseAiTry()) {
      Alert.alert('Hết lượt AI', 'Nâng cấp hoặc hoàn thành nhiệm vụ để có thêm lượt.');
      return;
    }
    setLoading(true);
    try {
      const result = await aiService.suggestOutfits(useAppStore.getState().user.id, { weather, wardrobe: clothing });
      setSuggestions(result.data);
      if (result.data.length > 0 && result.quotaChargeEligible) await consumeAiTry(!result.quotaManagedByBackend);
      if (result.fallbackMessage) Alert.alert('Gợi ý dự phòng', result.fallbackMessage);
    } catch {
      Alert.alert('Chưa thể tạo gợi ý', 'Thử phối một áo, một quần hoặc váy và đôi giày phù hợp với thời tiết hôm nay.');
    } finally { setLoading(false); }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.beige, borderRadius: radius.md, color: colors.text },
  ];

  return (
    <Screen bottomOffset={96}>
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
          placeholder="Loại: đám cưới, tiệc, công việc, du lịch..."
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
        <Button label={saving ? 'Đang lưu...' : 'Lưu sự kiện'} variant="secondary" onPress={saveEvent} style={{ marginTop: spacing.sm }} />
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
            Tủ đồ chưa đủ để tạo bộ đồ. Xem các sản phẩm được đề xuất.
          </AppText>
          <Button label="Xem sản phẩm" variant="accent" onPress={() => router.push('/shopping')} />
        </GlassCard>
      )}

      <SectionHeader title="Sự kiện của bạn" />
      <DataState loading={loadState === 'loading'} error={error} empty={events.length === 0} emptyText="Bạn chưa có sự kiện nào." />
      {events.map((e) => (
        <GlassCard key={e.id} style={{ marginBottom: spacing.md }}>
          <AppText variant="h3">{e.name}</AppText>
          <AppText variant="bodySmall" muted>
            {e.date} · {e.location} · {e.eventType}
          </AppText>
          {e.dressCode && (
            <AppText variant="bodySmall">Quy định trang phục: {e.dressCode}</AppText>
          )}
        </GlassCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { padding: 12, marginBottom: 8, fontSize: 15 },
});
