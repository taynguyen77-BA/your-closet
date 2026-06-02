import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const router = useRouter();
  const { outfitId } = useLocalSearchParams<{ outfitId?: string }>();
  const { colors, gradients, spacing, radius } = useTheme();
  const outfits = useAppStore((s) => s.outfits);
  const canUseAiTry = useAppStore((s) => s.canUseAiTry);
  const consumeAiTry = useAppStore((s) => s.consumeAiTry);
  const completeMission = useAppStore((s) => s.completeMission);
  const saveOutfit = useAppStore((s) => s.saveOutfit);
  const selectedOutfit = outfits.find((item) => item.id === outfitId) ?? outfits[0];

  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [scene, setScene] = useState('casual');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
      if (!res.canceled && res.assets[0]) setUserPhoto(res.assets[0].uri);
    } catch {
      Alert.alert('Không thể mở thư viện ảnh', 'Kiểm tra quyền truy cập ảnh rồi thử lại.');
    }
  };

  const generate = async () => {
    if (!userPhoto) {
      Alert.alert('Chưa có ảnh', 'Vui lòng tải ảnh toàn thân để thử đồ ảo.');
      return;
    }
    if (!canUseAiTry()) {
      Alert.alert('Hết lượt', 'Nâng cấp hoặc làm nhiệm vụ để có thêm lượt thử.');
      return;
    }
    setLoading(true);
    const itemIds = selectedOutfit?.items.map((i) => i.clothingId) ?? [];
    try {
      const generated = await aiService.generateVirtualTryOn(useAppStore.getState().user.id, { userPhotoUri: userPhoto, outfitItemIds: itemIds, scene });
      setResult(generated.data);
      if (generated.quotaChargeEligible) await consumeAiTry(!generated.quotaManagedByBackend);
      if (generated.fallbackMessage) Alert.alert('Ảnh minh họa dự phòng', generated.fallbackMessage);
    } catch {
      Alert.alert('Chưa thể tạo ảnh', 'Bạn vẫn có thể lưu outfit và thử lại với ảnh toàn thân rõ nét sau.');
    } finally { setLoading(false); }
  };
  const localResult = async () => {
    if (!result) throw new Error('Không có ảnh kết quả.');
    if (result.startsWith('file://')) return result;
    const target = `${FileSystem.cacheDirectory}try-on-${Date.now()}.jpg`;
    return (await FileSystem.downloadAsync(result, target)).uri;
  };
  const share = async () => {
    try {
      if (!await Sharing.isAvailableAsync()) return Alert.alert('Không hỗ trợ', 'Thiết bị này không hỗ trợ bảng chia sẻ.');
      await Sharing.shareAsync(await localResult());
      await completeMission('share-outfit');
    } catch { Alert.alert('Không thể chia sẻ', 'Không tải được ảnh kết quả.'); }
  };
  const download = async () => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) return Alert.alert('Cần quyền truy cập', 'Cho phép lưu ảnh để tải kết quả về thư viện.');
      await MediaLibrary.saveToLibraryAsync(await localResult());
      Alert.alert('Đã tải về', 'Ảnh đã được lưu vào thư viện.');
    } catch { Alert.alert('Không thể tải về', 'Không lưu được ảnh kết quả.'); }
  };

  return (
    <Screen>
      <LinearGradient colors={gradients.ai} style={[styles.aiHero, { borderRadius: radius.xl }]}>
        <AppText variant="bodySmall" color={colors.textInverse}>AI STYLIST</AppText>
        <AppText variant="display" color={colors.textInverse}>Your look, but elevated</AppText>
        <AppText variant="bodySmall" color={colors.textInverse}>Từ lịch trình đến outfit hoàn chỉnh, bắt đầu với mục tiêu của bạn.</AppText>
      </LinearGradient>
      <AiUsageBanner />
      <View style={styles.steps}>
        {['Ảnh', 'Mục tiêu', 'Gợi ý', 'Thử đồ'].map((label, index) => <View key={label} style={styles.step}><View style={[styles.stepDot, { backgroundColor: index < 2 ? colors.primary : colors.beige }]}><AppText variant="caption" color={index < 2 ? colors.textInverse : colors.textMuted}>{index + 1}</AppText></View><AppText variant="caption" muted>{label}</AppText></View>)}
      </View>
      {selectedOutfit ? <AppText variant="bodySmall" muted style={{ marginBottom: spacing.md }}>Outfit: {selectedOutfit.name}</AppText> : null}

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

      <SectionHeader title="Bạn đang chuẩn bị cho dịp nào?" />
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
        label={loading ? 'Đang tạo...' : 'Generate My Look'}
        variant="ai"
        icon="sparkles"
        onPress={generate}
        disabled={loading}
      />
      <Button label="Lên lịch outfit cho sự kiện" variant="ghost" icon="calendar-outline" onPress={() => router.push('/(tabs)/events')} style={{ marginTop: spacing.sm }} />

      {result && (
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="Kết quả" />
          <Image source={{ uri: result }} style={[styles.result, { borderRadius: radius.lg }]} />
          <View style={styles.resultActions}>
            <Button label={!selectedOutfit ? 'Không có outfit' : selectedOutfit.isSaved ? 'Đã lưu' : 'Lưu'} variant="secondary" small disabled={!selectedOutfit} onPress={() => selectedOutfit ? void saveOutfit(selectedOutfit.id) : undefined} style={{ flex: 1, marginRight: 8 }} />
            <Button label="Chia sẻ" variant="ghost" small onPress={() => void share()} style={{ flex: 1, marginRight: 8 }} />
            <Button label="Tải về" variant="ghost" small onPress={() => void download()} style={{ flex: 1 }} />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  aiHero: { padding: 18 },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 18 },
  step: { alignItems: 'center', gap: 5 },
  stepDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  upload: { height: 200, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  preview: { width: '100%', height: '100%' },
  scene: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderWidth: 1 },
  result: { width: '100%', height: 400 },
  resultActions: { flexDirection: 'row', marginTop: 12 },
});
