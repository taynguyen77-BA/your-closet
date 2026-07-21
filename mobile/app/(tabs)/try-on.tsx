import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GuestAccessCard } from '@/components/auth/GuestAccessCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SafeImage } from '@/components/ui/SafeImage';
import type { OutfitRecommendation } from '@/services/ai/types';
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
  const { colors, gradients, spacing, radius } = useTheme();
  const outfits = useAppStore((s) => s.outfits);
  const clothing = useAppStore((s) => s.clothing);
  const weather = useAppStore((s) => s.weather);
  const events = useAppStore((s) => s.events);
  const communityListings = useAppStore((s) => s.communityListings);
  const affiliateProducts = useAppStore((s) => s.affiliateProducts);
  const canUseAiTry = useAppStore((s) => s.canUseAiTry);
  const consumeAiTry = useAppStore((s) => s.consumeAiTry);
  const completeMission = useAppStore((s) => s.completeMission);
  const saveOutfit = useAppStore((s) => s.saveOutfit);
  const user = useAppStore((s) => s.user);
  const { isAuthenticated, isGuest } = useAuthStore();
  const isPublicViewer = isGuest || !isAuthenticated;
  const selectedOutfit = outfits.find((item) => item.id === outfitId) ?? outfits[0];

  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [scene, setScene] = useState('casual');
  const [location, setLocation] = useState(weather.location);
  const [mood, setMood] = useState('');
  const [dressCode, setDressCode] = useState('');
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);

  if (isPublicViewer) {
    return (
      <Screen bottomOffset={96}>
        <LinearGradient colors={gradients.ai} style={[styles.aiHero, { borderRadius: radius.xl, shadowColor: colors.shadow }]}>
          <View style={styles.aiIcon}><Ionicons name="sparkles" size={19} color={colors.accentDark} /></View>
          <AppText variant="caption" color={colors.accentLight}>TRỢ LÝ PHỐI ĐỒ AI</AppText>
          <AppText variant="display" color={colors.textInverse}>AI stylist cần gu riêng của bạn</AppText>
          <AppText variant="bodySmall" color={colors.warmLight} style={styles.aiCopy}>Đăng nhập để AI đọc tủ đồ, lịch trình và hồ sơ phong cách trước khi gợi ý.</AppText>
        </LinearGradient>
        <GuestAccessCard icon="sparkles-outline" title="Đăng nhập để dùng AI stylist" description="Tính năng thử đồ, tạo ảnh, lưu outfit và tiêu hao lượt AI chỉ mở khi có tài khoản." />
        <Button label="Xem cộng đồng" variant="secondary" icon="people-outline" onPress={() => router.push('/(tabs)/community')} />
      </Screen>
    );
  }

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
  const recommendOutfits = async () => {
    if (!useAuthStore.getState().requireAccount()) return;
    if (!canUseAiTry()) return Alert.alert('Hết lượt', 'Nâng cấp hoặc làm nhiệm vụ để có thêm lượt gợi ý.');
    setRecommendLoading(true);
    try {
      const eventContext = events[0];
      const result = await aiService.suggestOutfits(useAppStore.getState().user.id, {
        userStylePreferences: user.stylePreferences,
        advancedStylePreferences: user.advancedStylePreferences,
        wardrobe: clothing,
        weather,
        eventContext,
        events,
        location: location.trim() || eventContext?.location || weather.location,
        mood: mood.trim() || undefined,
        dressCode: dressCode.trim() || eventContext?.dressCode,
        budgetPreference: user.advancedStylePreferences?.budgetLevel,
        dislikedColors: [...(user.stylePreferences?.dislikedColors ?? []), ...(user.advancedStylePreferences?.dislikedColors ?? [])],
        dislikedStyles: user.advancedStylePreferences?.avoidStyles,
        savedOutfits: outfits.filter((item) => item.isSaved),
        rarelyWornItems: clothing.filter((item) => item.timesWorn < 3),
        favoriteItems: clothing.filter((item) => item.isFavorite),
        communityListings: communityListings.filter((item) => item.status === 'approved'),
        affiliateProducts: affiliateProducts.filter((item) => item.status !== 'inactive'),
      });
      setRecommendations(result.data);
      if (result.data.length > 0 && result.quotaChargeEligible) await consumeAiTry(!result.quotaManagedByBackend);
      if (result.fallbackMessage) Alert.alert('Gợi ý dự phòng', result.fallbackMessage);
    } catch {
      Alert.alert('Chưa thể gợi ý outfit', 'Hãy thử lại với bối cảnh rõ hơn hoặc thêm vài món cơ bản vào tủ đồ.');
    } finally { setRecommendLoading(false); }
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
      <LinearGradient colors={gradients.ai} style={[styles.aiHero, { borderRadius: radius.xl, shadowColor: colors.shadow }]}>
        <View style={styles.aiIcon}><Ionicons name="sparkles" size={19} color={colors.accentDark} /></View>
        <AppText variant="caption" color={colors.accentLight}>TRỢ LÝ PHỐI ĐỒ AI</AppText>
        <AppText variant="display" color={colors.textInverse}>Nâng tầm phong cách của bạn</AppText>
        <AppText variant="bodySmall" color={colors.warmLight} style={styles.aiCopy}>Từ lịch trình đến bộ đồ hoàn chỉnh, bắt đầu với mục tiêu của bạn.</AppText>
      </LinearGradient>
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
        label={recommendLoading ? 'Đang phối...' : 'Gợi ý outfit thông minh'}
        variant="ai"
        icon="sparkles"
        onPress={recommendOutfits}
        disabled={recommendLoading}
      />
      <View style={[styles.contextPanel, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
        <TextInput placeholder="Địa điểm" value={location} onChangeText={setLocation} placeholderTextColor={colors.textMuted} style={[styles.contextInput, { backgroundColor: colors.beige, color: colors.text, borderRadius: radius.md }]} />
        <TextInput placeholder="Mood hôm nay" value={mood} onChangeText={setMood} placeholderTextColor={colors.textMuted} style={[styles.contextInput, { backgroundColor: colors.beige, color: colors.text, borderRadius: radius.md }]} />
        <TextInput placeholder="Dress code / dịp" value={dressCode} onChangeText={setDressCode} placeholderTextColor={colors.textMuted} style={[styles.contextInput, { backgroundColor: colors.beige, color: colors.text, borderRadius: radius.md }]} />
      </View>
      <Button label="Lên lịch bộ đồ cho sự kiện" variant="ghost" icon="calendar-outline" onPress={() => router.push('/(tabs)/events')} style={{ marginTop: spacing.sm }} />

      {recommendations.length > 0 && (
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="Gợi ý dành riêng cho bạn" />
          {recommendations.map((item, index) => <RecommendationCard key={`${item.name}-${index}`} recommendation={item} />)}
        </View>
      )}

      <Button
        label={loading ? 'Đang tạo ảnh...' : 'Tạo ảnh thử đồ'}
        variant="secondary"
        icon="shirt-outline"
        onPress={generate}
        disabled={loading}
        style={{ marginTop: spacing.md }}
      />

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
  aiHero: { minHeight: 218, padding: 22, gap: 5, justifyContent: 'flex-end', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 5 },
  aiIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,249,241,0.92)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  aiCopy: { maxWidth: 330, lineHeight: 20 },
  quota: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 50, paddingHorizontal: 11, paddingVertical: 7, marginTop: 10 },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16 },
  step: { alignItems: 'center', gap: 5 },
  stepDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  outfitTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 12 },
  upload: { minHeight: 220, borderWidth: 1.4, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 18 },
  uploadCopy: { alignItems: 'center', gap: 5 },
  preview: { width: '100%', height: '100%' },
  scene: { minWidth: 76, alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8, borderWidth: 1 },
  contextPanel: { borderWidth: 1, padding: 12, gap: 8, marginTop: 12 },
  contextInput: { padding: 12, fontSize: 15 },
  result: { width: '100%', height: 400 },
  resultActions: { flexDirection: 'row', marginTop: 12 },
  recCard: { borderWidth: 1, padding: 14, gap: 10, marginBottom: 12 },
  recTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  score: { minWidth: 48, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  infoLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  recSection: { gap: 7, marginTop: 2 },
  itemRow: { gap: 8 },
  closetChip: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  chipImage: { width: 46, height: 46, borderRadius: 6 },
  suggestionLine: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  suggestionImage: { width: 48, height: 48 },
});

function RecommendationCard({ recommendation }: { recommendation: OutfitRecommendation }) {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.recCard, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg }]}>
      <View style={styles.recTop}>
        <View style={{ flex: 1 }}>
          <AppText variant="h2">{recommendation.name}</AppText>
          <AppText variant="bodySmall" muted>{recommendation.tasteMatchExplanation}</AppText>
        </View>
        <View style={[styles.score, { backgroundColor: colors.accent }]}><AppText variant="label" color={colors.textInverse}>{recommendation.styleScore}%</AppText></View>
      </View>
      <AppText variant="bodySmall">{recommendation.aiExplanation}</AppText>
      <InfoLine icon="partly-sunny-outline" text={recommendation.weatherCompatibility} />
      <InfoLine icon="location-outline" text={recommendation.locationEventCompatibility} />
      <InfoLine icon="color-palette-outline" text={recommendation.colorMatching} />
      <RecommendationSection title="From your closet">
        <View style={styles.itemRow}>{recommendation.items.map((item) => <View key={item.clothingId} style={[styles.closetChip, { backgroundColor: colors.beige, borderRadius: radius.md }]}>{item.imageUrl ? <SafeImage source={{ uri: item.imageUrl }} style={styles.chipImage} contentFit="cover" /> : null}<View style={{ flex: 1 }}><AppText variant="label" numberOfLines={1}>{item.name}</AppText>{item.reason ? <AppText variant="caption" muted numberOfLines={2}>{item.reason}</AppText> : null}</View></View>)}</View>
      </RecommendationSection>
      <RecommendationSection title="You may need">
        {recommendation.missingItems.length ? recommendation.missingItems.map((item) => <AppText key={`${item.type}-${item.name}`} variant="bodySmall">• {item.name}: {item.reason}</AppText>) : <AppText variant="bodySmall" muted>Tủ đồ hiện tại đã đủ để mặc đẹp.</AppText>}
      </RecommendationSection>
      <RecommendationSection title="Available from community">
        {recommendation.communityListingSuggestions.length ? recommendation.communityListingSuggestions.map((item) => <SuggestionLine key={item.listingId} title={item.title} meta={item.priceLabel} reason={item.reason} imageUrl={item.imageUrl} />) : <AppText variant="bodySmall" muted>Không cần tìm thêm từ cộng đồng cho outfit này.</AppText>}
      </RecommendationSection>
      <RecommendationSection title="Shop from partners">
        {recommendation.affiliateShoppingSuggestions.length ? recommendation.affiliateShoppingSuggestions.map((item) => <SuggestionLine key={item.productId} title={item.name} meta={`${item.store}${item.priceLabel ? ` · ${item.priceLabel}` : ''}`} reason={item.reason} imageUrl={item.imageUrl} />) : <AppText variant="bodySmall" muted>Không có gợi ý mua sắm vì tủ đồ đã đáp ứng bối cảnh.</AppText>}
      </RecommendationSection>
      <AppText variant="caption" muted>Độ tin cậy: {Math.round(recommendation.confidenceScore * 100)}%</AppText>
    </View>
  );
}

function RecommendationSection({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.recSection}><AppText variant="label">{title}</AppText>{children}</View>;
}

function InfoLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { colors } = useTheme();
  return <View style={styles.infoLine}><Ionicons name={icon} size={15} color={colors.accentDark} /><AppText variant="bodySmall" style={{ flex: 1 }}>{text}</AppText></View>;
}

function SuggestionLine({ title, meta, reason, imageUrl }: { title: string; meta?: string; reason: string; imageUrl?: string }) {
  const { colors, radius } = useTheme();
  return <View style={styles.suggestionLine}>{imageUrl ? <SafeImage source={{ uri: imageUrl }} style={[styles.suggestionImage, { borderRadius: radius.sm }]} contentFit="cover" /> : null}<View style={{ flex: 1 }}><AppText variant="label">{title}</AppText>{meta ? <AppText variant="caption" color={colors.accentDark}>{meta}</AppText> : null}<AppText variant="bodySmall" muted>{reason}</AppText></View></View>;
}
