import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { GuestAccessCard } from '@/components/auth/GuestAccessCard';
import { AppText } from '@/components/ui/AppText';
import { ClosetItemCard, EmptyClosetState, FilterPill, FloatingActionButton, GradientScreenHeader, SearchBar } from '@/components/ui/FashionUi';
import { SafeImage } from '@/components/ui/SafeImage';
import type { ClothingItem } from '@/models';
import type { ClothingReviewDraft } from '@/services/ai/types';
import { aiService } from '@/services/ai/aiService';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/authStore';

type Filter = 'all' | 'top' | 'bottom' | 'dress' | 'shoes' | 'bag' | 'favorites' | 'rarely';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' }, { key: 'top', label: 'Áo' }, { key: 'bottom', label: 'Quần' },
  { key: 'dress', label: 'Váy' }, { key: 'shoes', label: 'Giày' }, { key: 'bag', label: 'Túi' },
  { key: 'favorites', label: 'Yêu thích' }, { key: 'rarely', label: 'Ít mặc' },
];

export default function ClosetScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const clothing = useAppStore((s) => s.clothing);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const createClothing = useAppStore((s) => s.createClothing);
  const canUseAiTry = useAppStore((s) => s.canUseAiTry);
  const consumeAiTry = useAppStore((s) => s.consumeAiTry);
  const closetViewMode = useAppStore((s) => s.closetViewMode);
  const setClosetViewMode = useAppStore((s) => s.setClosetViewMode);
  const { isAuthenticated, isGuest } = useAuthStore();
  const isPublicViewer = isGuest || !isAuthenticated;
  const [saving, setSaving] = useState(false);
  const [reviewDraft, setReviewDraft] = useState<ClothingReviewDraft | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const normalizedSearch = search.trim().toLowerCase();
  const rarelyWorn = clothing.filter((item) => item.timesWorn < 3).length;
  const favorites = clothing.filter((item) => item.isFavorite).length;
  const outfitPotential = clothing.length ? Math.max(clothing.length * 3, 8) : 0;
  const wardrobeScore = clothing.length ? Math.min(96, 66 + (clothing.length - rarelyWorn) * 5 + favorites * 2) : 0;
  const filtered = clothing.filter((item) => {
    const matchesSearch = !normalizedSearch || item.name.toLowerCase().includes(normalizedSearch) || item.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));
    const matchesFilter = filter === 'all' || (filter === 'favorites' ? item.isFavorite : filter === 'rarely' ? item.timesWorn < 3 : item.type === filter);
    return matchesSearch && matchesFilter;
  });

  if (isPublicViewer) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
        <GradientScreenHeader eyebrow="TỦ ĐỒ CÁ NHÂN" title="Đăng nhập để tạo tủ đồ" subtitle="Tủ đồ cần tài khoản để lưu ảnh, nhận diện bằng AI và đồng bộ giữa các thiết bị." />
        <GuestAccessCard icon="shirt-outline" title="Tủ đồ chỉ dành cho tài khoản" description="Sau khi đăng nhập, bạn có thể thêm món đồ, yêu thích, tìm kiếm và dùng AI để phối outfit." />
        <Button label="Xem cộng đồng trước" variant="secondary" icon="people-outline" onPress={() => router.push('/(tabs)/community')} />
      </View>
    );
  }

  const pickImage = async () => {
    if (!useAuthStore.getState().requireAccount()) return;
    if (saving) return;
    if (useAppStore.getState().user.closetItemCount >= useAppStore.getState().user.closetItemLimit) return Alert.alert('Tủ đồ đã đầy', 'Nâng cấp gói thành viên để thêm nhiều món đồ hơn.');
    let result;
    try { result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 }); }
    catch { return Alert.alert('Chưa mở được thư viện ảnh', 'Kiểm tra quyền truy cập ảnh rồi thử lại nhé.'); }
    if (result.canceled || !result.assets[0]) return;
    if (!canUseAiTry()) return Alert.alert('Hết lượt AI', 'Nâng cấp hoặc hoàn thành nhiệm vụ để nhận diện thêm quần áo.');
    setSaving(true);
    setAnalysisError(null);
    try {
      const aiResult = await aiService.analyzeAndEnhanceClothingImage(useAppStore.getState().user.id, result.assets[0].uri);
      const meta = aiResult.data;
      if (!meta.suggestedName || !meta.type || !meta.color) throw new Error('AI result is missing required clothing metadata.');
      const candidates = meta.enhancedImageCandidates ?? [];
      setReviewDraft({ originalImageUrl: result.assets[0].uri, selectedImageUrl: candidates[0]?.imageUrl ?? result.assets[0].uri, analysis: meta, name: meta.suggestedName, type: meta.type, material: meta.material, color: meta.color, style: meta.style, season: meta.season ?? [], tags: meta.tags, confidenceScore: meta.confidenceScore, qualityWarnings: meta.qualityWarnings ?? [], enhancedImageCandidates: candidates });
      if (aiResult.quotaChargeEligible) await consumeAiTry(!aiResult.quotaManagedByBackend);
      if (aiResult.fallbackMessage) Alert.alert('Đã chuẩn bị bản nháp', aiResult.fallbackMessage);
    } catch {
      setAnalysisError('AI chưa phân tích được ảnh này. Bạn vẫn có thể nhập thủ công để lưu món đồ.');
      setReviewDraft(createManualDraft(result.assets[0].uri));
    }
    finally { setSaving(false); }
  };

  const updateDraft = (patch: Partial<ClothingReviewDraft>) => setReviewDraft((draft) => draft ? { ...draft, ...patch } : draft);
  const splitList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
  const saveDraft = async () => {
    if (!reviewDraft) return;
    if (!reviewDraft.name.trim() || !reviewDraft.color.trim()) return Alert.alert('Thiếu thông tin', 'Nhập tên và màu sắc trước khi lưu nhé.');
    setSaving(true);
    try {
      const newItem: Omit<ClothingItem, 'id' | 'imageUrl'> = {
        userId: useAppStore.getState().user.id,
        name: reviewDraft.name.trim(),
        originalImageUrl: reviewDraft.originalImageUrl,
        enhancedImageUrl: reviewDraft.selectedImageUrl,
        type: reviewDraft.type,
        material: reviewDraft.material?.trim() || undefined,
        color: reviewDraft.color.trim(),
        style: reviewDraft.style?.trim() || undefined,
        season: reviewDraft.season,
        tags: reviewDraft.tags,
        aiMetadata: reviewDraft.analysis ? { ...reviewDraft.analysis, enhancedImageCandidates: undefined } : undefined,
        aiConfidenceScore: reviewDraft.confidenceScore,
        aiQualityWarnings: reviewDraft.qualityWarnings,
        isFavorite: false,
        timesWorn: 0,
        createdAt: new Date().toISOString(),
      };
      await createClothing(newItem, reviewDraft.selectedImageUrl);
      setReviewDraft(null);
      setAnalysisError(null);
      Alert.alert('Đã thêm vào tủ', `${newItem.name} đã sẵn sàng để AI stylist phối đồ.`);
    } catch { Alert.alert('Chưa lưu được món đồ', 'Thử lại sau một chút nhé. Chế độ trải nghiệm vẫn lưu dữ liệu trên thiết bị của bạn.'); }
    finally { setSaving(false); }
  };

  const header = <View style={{ gap: spacing.md }}>
    <GradientScreenHeader eyebrow="TỦ ĐỒ THÔNG MINH" title="Tủ đồ của bạn, phong cách của bạn" subtitle="Phối mới mỗi ngày với gợi ý từ AI." />
    <View style={[styles.health, { borderRadius: radius.xl, backgroundColor: colors.primary }]}>
      <View style={styles.healthTop}><View style={{ flex: 1 }}><AppText variant="caption" color={colors.accent}>SỨC KHỎE TỦ ĐỒ</AppText><AppText variant="h1" color={colors.textInverse}>{wardrobeScore}/100 · Đang rất ổn</AppText></View><AppText variant="h2" color={colors.accent}>{wardrobeScore}</AppText></View>
      <AppText variant="bodySmall" color={colors.warmGray}>Nền tảng tủ đồ tốt. Thêm một món nổi bật để phối đa dạng hơn.</AppText>
      <View style={[styles.healthBar, { backgroundColor: colors.warmGray }]}><View style={[styles.healthFill, { backgroundColor: colors.accent, width: `${wardrobeScore}%` }]} /></View>
      <Pressable onPress={() => router.push('/(tabs)/try-on')} style={[styles.healthCta, { borderTopColor: colors.warmGray }]}><AppText variant="label" color={colors.accent}>AI phối đồ →</AppText></Pressable>
    </View>
    <View style={[styles.statsCard, { borderRadius: radius.xl, borderColor: colors.border, backgroundColor: colors.surface }]}>
      {[['shirt-outline', clothing.length, 'TỔNG SỐ MÓN'], ['heart', favorites, 'YÊU THÍCH'], ['time-outline', rarelyWorn, 'ÍT MẶC'], ['sparkles', outfitPotential, 'KHẢ NĂNG PHỐI']].map(([icon, value, label], index) => <View key={label as string} style={[styles.statCell, index % 2 === 0 && styles.statRightBorder, index < 2 && styles.statBottomBorder, { borderColor: colors.border }]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.accentDark} /><AppText variant="h2">{value}</AppText><AppText variant="caption" muted>{label}</AppText></View>)}
    </View>
    <View style={styles.toolbar}><Button label={saving ? 'Đang thêm...' : 'Thêm món'} icon="camera-outline" onPress={pickImage} disabled={saving} style={{ flex: 1 }} /><Button label="AI phối đồ" variant="secondary" icon="sparkles-outline" onPress={() => router.push('/(tabs)/try-on')} style={{ marginLeft: 8 }} /></View>
    <SearchBar value={search} onChangeText={setSearch} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.filters}>{FILTERS.map((item) => <FilterPill key={item.key} label={item.label} active={filter === item.key} onPress={() => setFilter(item.key)} />)}</View></ScrollView>
    <View style={styles.section}><View><AppText variant="h2">Các món đồ của bạn</AppText><AppText variant="bodySmall" muted>{filtered.length} món sẵn sàng để phối</AppText></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Pressable onPress={() => setClosetViewMode(closetViewMode === 'grid' ? 'list' : 'grid')}><Ionicons name={closetViewMode === 'grid' ? 'list-outline' : 'grid-outline'} size={22} color={colors.accentDark} /></Pressable><Pressable onPress={() => setFilter('all')}><Ionicons name="options-outline" size={22} color={colors.accentDark} /></Pressable></View></View>
  </View>;

  const numColumns = closetViewMode === 'grid' ? 2 : 1;
  return <View style={{ flex: 1, backgroundColor: colors.background }}><FlatList key={closetViewMode} data={filtered} numColumns={numColumns} keyExtractor={(item) => item.id} renderItem={({ item }) => <ClosetItemCard item={item} onPress={() => router.push(`/closet/${item.id}`)} onFavorite={() => void toggleFavorite(item.id)} />} columnWrapperStyle={closetViewMode === 'grid' ? styles.row : undefined} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 190 }} ListHeaderComponent={header} ListEmptyComponent={<EmptyClosetState onPress={() => void pickImage()} />} showsVerticalScrollIndicator={false} /><FloatingActionButton onPress={() => void pickImage()} /><Modal visible={Boolean(reviewDraft)} animationType="slide" transparent><View style={styles.overlay}><View style={[styles.reviewModal, { backgroundColor: colors.surface, borderRadius: radius.xl }]}>{reviewDraft ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}><View style={styles.modalHead}><View><AppText variant="caption" muted>KIỂM TRA TRƯỚC KHI LƯU</AppText><AppText variant="h1">AI đã chuẩn bị bản nháp</AppText></View><Pressable onPress={() => setReviewDraft(null)}><Ionicons name="close" size={24} color={colors.text} /></Pressable></View>{analysisError ? <View style={[styles.warning, { backgroundColor: colors.beige }]}><Ionicons name="alert-circle-outline" size={18} color={colors.accentDark} /><AppText variant="bodySmall" style={{ flex: 1 }}>{analysisError}</AppText></View> : null}<View style={styles.imageGrid}><View style={styles.imageBlock}><AppText variant="caption" muted>ẢNH GỐC</AppText><SafeImage source={{ uri: reviewDraft.originalImageUrl }} style={[styles.reviewImage, { borderRadius: radius.md }]} contentFit="cover" /></View><View style={styles.imageBlock}><AppText variant="caption" muted>ẢNH SẼ LƯU</AppText><SafeImage source={{ uri: reviewDraft.selectedImageUrl }} style={[styles.reviewImage, { borderRadius: radius.md }]} contentFit="cover" /></View></View><AppText variant="label">Chọn ảnh sạch</AppText><ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.candidates}><Candidate uri={reviewDraft.originalImageUrl} label="Ảnh gốc" selected={reviewDraft.selectedImageUrl === reviewDraft.originalImageUrl} onPress={() => updateDraft({ selectedImageUrl: reviewDraft.originalImageUrl })} />{reviewDraft.enhancedImageCandidates.map((candidate) => <Candidate key={candidate.id} uri={candidate.imageUrl} label={candidate.label ?? 'Ảnh AI'} selected={reviewDraft.selectedImageUrl === candidate.imageUrl} onPress={() => updateDraft({ selectedImageUrl: candidate.imageUrl })} />)}</View></ScrollView>{typeof reviewDraft.confidenceScore === 'number' ? <AppText variant="bodySmall" muted>Độ tin cậy AI: {Math.round(reviewDraft.confidenceScore * 100)}%</AppText> : null}{reviewDraft.qualityWarnings.length ? <View style={[styles.warning, { backgroundColor: colors.beige }]}><Ionicons name="warning-outline" size={18} color={colors.accentDark} /><AppText variant="bodySmall" style={{ flex: 1 }}>{reviewDraft.qualityWarnings.join(' · ')}</AppText></View> : null}<DraftInput label="Tên món đồ" value={reviewDraft.name} onChangeText={(name) => updateDraft({ name })} /><DraftInput label="Loại" value={reviewDraft.type} onChangeText={(type) => updateDraft({ type: normalizeType(type) })} /><DraftInput label="Màu sắc" value={reviewDraft.color} onChangeText={(color) => updateDraft({ color })} /><DraftInput label="Chất liệu" value={reviewDraft.material ?? ''} onChangeText={(material) => updateDraft({ material })} /><DraftInput label="Phong cách" value={reviewDraft.style ?? ''} onChangeText={(style) => updateDraft({ style })} /><DraftInput label="Mùa, cách nhau bằng dấu phẩy" value={reviewDraft.season.join(', ')} onChangeText={(value) => updateDraft({ season: splitList(value) })} /><DraftInput label="Tags, cách nhau bằng dấu phẩy" value={reviewDraft.tags.join(', ')} onChangeText={(value) => updateDraft({ tags: splitList(value) })} /><Button label={saving ? 'Đang lưu...' : 'Save to Closet'} icon="checkmark-circle-outline" onPress={() => void saveDraft()} disabled={saving} /><View style={styles.modalActions}><Button label="Retake/Upload again" variant="secondary" icon="camera-outline" onPress={() => { setReviewDraft(null); void pickImage(); }} style={{ flex: 1 }} /><Button label="Cancel" variant="ghost" onPress={() => setReviewDraft(null)} style={{ flex: 1 }} /></View></ScrollView> : null}</View></View></Modal></View>;
}

function createManualDraft(uri: string): ClothingReviewDraft {
  return { originalImageUrl: uri, selectedImageUrl: uri, name: '', type: 'other', color: '', season: [], tags: [], qualityWarnings: ['AI không trả về kết quả đủ rõ để tự điền thông tin.'], enhancedImageCandidates: [] };
}

function normalizeType(value: string): ClothingItem['type'] {
  const type = value.trim().toLowerCase();
  return ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'bag', 'other'].includes(type) ? type as ClothingItem['type'] : 'other';
}

function DraftInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  const { colors, radius } = useTheme();
  return <TextInput value={value} onChangeText={onChangeText} placeholder={label} placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: colors.beige, color: colors.text, borderRadius: radius.md }]} />;
}

function Candidate({ uri, label, selected, onPress }: { uri: string; label: string; selected: boolean; onPress: () => void }) {
  const { colors, radius } = useTheme();
  return <Pressable onPress={onPress} style={[styles.candidate, { borderColor: selected ? colors.accentDark : colors.border, borderRadius: radius.md }]}><SafeImage source={{ uri }} style={styles.candidateImage} contentFit="cover" /><AppText variant="caption" numberOfLines={1}>{label}</AppText>{selected ? <Ionicons name="checkmark-circle" size={18} color={colors.accentDark} style={styles.candidateCheck} /> : null}</Pressable>;
}

const styles = StyleSheet.create({ health: { padding: 16, gap: 8 }, healthTop: { flexDirection: 'row', alignItems: 'center' }, healthBar: { height: 6, borderRadius: 3, overflow: 'hidden' }, healthFill: { height: '100%' }, healthCta: { borderTopWidth: 1, paddingTop: 10, marginTop: 2 }, statsCard: { flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden', borderWidth: 1 }, statCell: { width: '50%', minHeight: 88, padding: 12, gap: 3 }, statRightBorder: { borderRightWidth: 1 }, statBottomBorder: { borderBottomWidth: 1 }, toolbar: { flexDirection: 'row' }, filters: { flexDirection: 'row', gap: 8, paddingBottom: 2 }, section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3, marginBottom: 12 }, row: { justifyContent: 'space-between' }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(30,23,18,0.72)' }, reviewModal: { maxHeight: '92%', padding: 18, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }, modalHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }, imageGrid: { flexDirection: 'row', gap: 10 }, imageBlock: { flex: 1, gap: 6 }, reviewImage: { width: '100%', aspectRatio: 0.82 }, candidates: { flexDirection: 'row', gap: 10, paddingBottom: 4 }, candidate: { width: 112, borderWidth: 2, padding: 6, gap: 5 }, candidateImage: { width: '100%', height: 94, borderRadius: 6 }, candidateCheck: { position: 'absolute', top: 8, right: 8 }, warning: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8 }, input: { padding: 12, fontSize: 15 }, modalActions: { flexDirection: 'row', gap: 8, paddingBottom: 10 } });
