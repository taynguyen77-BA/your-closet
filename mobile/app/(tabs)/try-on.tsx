import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SafeImage } from '@/components/ui/SafeImage';
import { aiService } from '@/services/ai/aiService';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/authStore';

const SCENES = [
  { id: 'beach', label: 'Biển', icon: 'sunny' as const },
  { id: 'mountain', label: 'Núi', icon: 'trail-sign' as const },
  { id: 'urban', label: 'Đô thị', icon: 'business' as const },
  { id: 'party', label: 'Tiệc', icon: 'wine' as const },
  { id: 'casual', label: 'Thường ngày', icon: 'cafe' as const },
  { id: 'office', label: 'Văn phòng', icon: 'briefcase' as const },
];

export default function TryOnScreen() {
  const router = useRouter();
  const { outfitId } = useLocalSearchParams<{ outfitId?: string }>();
  const { colors, spacing, radius } = useTheme();
  const outfits = useAppStore((s) => s.outfits);
  const canUseAiTry = useAppStore((s) => s.canUseAiTry);
  const consumeAiTry = useAppStore((s) => s.consumeAiTry);
  const completeMission = useAppStore((s) => s.completeMission);
  const saveOutfit = useAppStore((s) => s.saveOutfit);
  const user = useAppStore((s) => s.user);
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
    if (!useAuthStore.getState().requireAccount()) return;
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
    <Screen bottomOffset={96}>
      <View style={[styles.aiHero, { borderRadius: radius.xl, backgroundColor: colors.primary }]}>
        <AppText variant="caption" color={colors.accent}>TRỢ LÝ PHỐI ĐỒ AI</AppText>
        <AppText variant="display" color={colors.textInverse}>Nâng tầm phong cách của bạn</AppText>
        <AppText variant="bodySmall" color={colors.warmGray}>Từ lịch trình đến bộ đồ hoàn chỉnh, bắt đầu với mục tiêu của bạn.</AppText>
      </View>
      <View style={[styles.quota, { borderColor: colors.border }]}>
        <Ionicons name="sparkles" size={15} color={colors.accentDark} />
        <AppText variant="bodySmall">{user.plan === 'free' ? `${user.aiUsageRemaining}/${user.aiUsageMonthlyLimit} lượt AI · ${user.closetItemCount}/${user.closetItemLimit} món` : 'AI không giới hạn'}</AppText>
      </View>
      <View style={styles.steps}>
        {['Ảnh', 'Mục tiêu', 'Gợi ý', 'Thử đồ'].map((label, index) => {
          const completed = index === 0 && Boolean(userPhoto);
          const active = index === (userPhoto ? 1 : 0);
          return <View key={label} style={styles.step}><View style={[styles.stepDot, { backgroundColor: completed ? colors.primary : active ? colors.accent : 'transparent', borderColor: active ? colors.accent : colors.border }]}><AppText variant="caption" color={completed ? colors.textInverse : active ? colors.text : colors.textMuted}>{completed ? '✓' : index + 1}</AppText></View><AppText variant="caption" muted>{label}</AppText></View>;
        })}
      </View>
      {selectedOutfit ? <View style={[styles.outfitTag, { borderColor: colors.border }]}><Ionicons name="shirt-outline" size={15} color={colors.accentDark} /><AppText variant="bodySmall">Bộ đồ: {selectedOutfit.name}</AppText></View> : null}

      <SectionHeader title="Ảnh của bạn" />
      <Pressable
        onPress={pickPhoto}
        style={({ pressed }) => [styles.upload, { backgroundColor: pressed ? colors.accent : colors.beige, borderRadius: radius.lg, borderColor: colors.border }]}
      >
        {userPhoto ? (
          <Image source={{ uri: userPhoto }} style={styles.preview} contentFit="cover" />
        ) : (
          <View style={styles.uploadCopy}><Ionicons name="camera-outline" size={28} color={colors.accentDark} /><AppText variant="label">Chạm để tải ảnh</AppText><AppText variant="bodySmall" muted>Ảnh toàn thân · JPG hoặc PNG</AppText></View>
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
                backgroundColor: scene === s.id ? colors.primary : colors.beige,
                borderRadius: 12,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name={s.icon} size={20} color={scene === s.id ? colors.textInverse : colors.textMuted} />
            <AppText variant="bodySmall" color={scene === s.id ? colors.textInverse : colors.textMuted}>{s.label}</AppText>
          </Pressable>
        ))}
      </ScrollView>

      <Button
        label={loading ? 'Đang tạo...' : 'Tạo phong cách của tôi'}
        variant="ai"
        icon="sparkles"
        onPress={generate}
        disabled={loading}
      />
      <Button label="Lên lịch bộ đồ cho sự kiện" variant="ghost" icon="calendar-outline" onPress={() => router.push('/(tabs)/events')} style={{ marginTop: spacing.sm }} />

      {result && (
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="Kết quả" />
          <SafeImage source={{ uri: result }} style={[styles.result, { borderRadius: radius.lg }]} fallbackLabel="ẢNH KẾT QUẢ" />
          <View style={styles.resultActions}>
            <Button label={!selectedOutfit ? 'Không có outfit' : selectedOutfit.isSaved ? 'Đã lưu' : 'Lưu'} variant="secondary" small disabled={!selectedOutfit} onPress={() => selectedOutfit && useAuthStore.getState().requireAccount() ? void saveOutfit(selectedOutfit.id) : undefined} style={{ flex: 1, marginRight: 8 }} />
            <Button label="Chia sẻ" variant="ghost" small onPress={() => void share()} style={{ flex: 1, marginRight: 8 }} />
            <Button label="Tải về" variant="ghost" small onPress={() => void download()} style={{ flex: 1 }} />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  aiHero: { padding: 18, gap: 4 },
  quota: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 50, paddingHorizontal: 11, paddingVertical: 7, marginTop: 10 },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16 },
  step: { alignItems: 'center', gap: 5 },
  stepDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  outfitTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 12 },
  upload: { height: 200, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  uploadCopy: { alignItems: 'center', gap: 5 },
  preview: { width: '100%', height: '100%' },
  scene: { minWidth: 76, alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8, borderWidth: 1 },
  result: { width: '100%', height: 400 },
  resultActions: { flexDirection: 'row', marginTop: 12 },
});
