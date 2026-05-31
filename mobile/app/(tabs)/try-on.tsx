import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { AiUsageBanner } from '@/components/ui/AiUsageBanner';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { aiService } from '@/services/ai/aiService';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

const SCENES = [
  { id: 'beach', label: 'Biển', icon: 'sunny' as const },
  { id: 'mountain', label: 'Núi', icon: 'trail-sign' as const },
  { id: 'urban', label: 'Đô thị', icon: 'business' as const },
  { id: 'party', label: 'Tiệc', icon: 'wine' as const },
  { id: 'casual', label: 'Casual', icon: 'cafe' as const },
  { id: 'office', label: 'Văn phòng', icon: 'briefcase' as const },
];

export default function TryOnScreen() {
  const { colors, spacing, radius } = useTheme();
  const outfits = useAppStore((s) => s.outfits);
  const useAiTry = useAppStore((s) => s.useAiTry);

  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [scene, setScene] = useState('casual');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
    if (!res.canceled && res.assets[0]) setUserPhoto(res.assets[0].uri);
  };

  const generate = async () => {
    if (!userPhoto) {
      Alert.alert('Chưa có ảnh', 'Vui lòng tải ảnh toàn thân để thử đồ ảo.');
      return;
    }
    if (!useAiTry()) {
      Alert.alert('Hết lượt', 'Nâng cấp hoặc làm nhiệm vụ để có thêm lượt thử.');
      return;
    }
    setLoading(true);
    const itemIds = outfits[0]?.items.map((i) => i.clothingId) ?? [];
    const url = await aiService.generateVirtualTryOn(userPhoto, itemIds, scene);
    setResult(url);
    setLoading(false);
  };

  return (
    <Screen>
      <AppText variant="display" style={{ marginBottom: spacing.md }}>
        Thử đồ AI
      </AppText>
      <AiUsageBanner />

      <SectionHeader title="Ảnh của bạn" />
      <Pressable
        onPress={pickPhoto}
        style={[styles.upload, { backgroundColor: colors.beige, borderRadius: radius.lg }]}
      >
        {userPhoto ? (
          <Image source={{ uri: userPhoto }} style={styles.preview} contentFit="cover" />
        ) : (
          <AppText variant="body" muted>
            Chạm để tải ảnh toàn thân
          </AppText>
        )}
      </Pressable>

      <SectionHeader title="Bối cảnh" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
        {SCENES.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setScene(s.id)}
            style={[
              styles.scene,
              {
                backgroundColor: scene === s.id ? colors.accent : colors.surface,
                borderRadius: radius.md,
                borderColor: colors.border,
              },
            ]}
          >
            <AppText variant="label">{s.label}</AppText>
          </Pressable>
        ))}
      </ScrollView>

      <Button
        label={loading ? 'Đang tạo...' : 'Tạo ảnh thử đồ'}
        icon="sparkles"
        onPress={generate}
      />

      {result && (
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="Kết quả" />
          <Image source={{ uri: result }} style={[styles.result, { borderRadius: radius.lg }]} />
          <View style={styles.resultActions}>
            <Button label="Lưu" variant="secondary" small style={{ flex: 1, marginRight: 8 }} />
            <Button label="Chia sẻ" variant="ghost" small style={{ flex: 1, marginRight: 8 }} />
            <Button label="Tải về" variant="ghost" small style={{ flex: 1 }} />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  upload: { height: 200, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  preview: { width: '100%', height: '100%' },
  scene: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderWidth: 1 },
  result: { width: '100%', height: 400 },
  resultActions: { flexDirection: 'row', marginTop: 12 },
});
