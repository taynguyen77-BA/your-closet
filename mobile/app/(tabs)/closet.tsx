import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { ClosetItemCard, EmptyClosetState, FilterPill, FloatingActionButton, GradientScreenHeader, SearchBar } from '@/components/ui/FashionUi';
import type { ClothingItem } from '@/models';
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
  const [saving, setSaving] = useState(false);
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
    try {
      const aiResult = await aiService.detectClothingFromImage(useAppStore.getState().user.id, result.assets[0].uri);
      const meta = aiResult.data;
      const newItem: Omit<ClothingItem, 'id' | 'imageUrl'> = { userId: useAppStore.getState().user.id, name: meta.suggestedName, type: meta.type, material: meta.material, color: meta.color, style: meta.style, season: meta.season, tags: meta.tags, isFavorite: false, timesWorn: 0, createdAt: new Date().toISOString() };
      await createClothing(newItem, result.assets[0].uri);
      if (aiResult.quotaChargeEligible) await consumeAiTry(!aiResult.quotaManagedByBackend);
      Alert.alert('Đã thêm vào tủ', `AI nhận diện: ${meta.suggestedName}`);
    } catch { Alert.alert('Chưa thêm được món đồ', 'Thử lại sau một chút nhé. Chế độ trải nghiệm vẫn lưu dữ liệu trên thiết bị của bạn.'); }
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
    <View style={styles.section}><View><AppText variant="h2">Các món đồ của bạn</AppText><AppText variant="bodySmall" muted>{filtered.length} món sẵn sàng để phối</AppText></View><Pressable onPress={() => setFilter('all')}><Ionicons name="options-outline" size={22} color={colors.accentDark} /></Pressable></View>
  </View>;

  return <View style={{ flex: 1, backgroundColor: colors.background }}><FlatList data={filtered} numColumns={2} keyExtractor={(item) => item.id} renderItem={({ item }) => <ClosetItemCard item={item} onPress={() => router.push(`/closet/${item.id}`)} onFavorite={() => void toggleFavorite(item.id)} />} columnWrapperStyle={styles.row} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 190 }} ListHeaderComponent={header} ListEmptyComponent={<EmptyClosetState onPress={() => void pickImage()} />} showsVerticalScrollIndicator={false} /><FloatingActionButton onPress={() => void pickImage()} /></View>;
}
const styles = StyleSheet.create({ health: { padding: 16, gap: 8 }, healthTop: { flexDirection: 'row', alignItems: 'center' }, healthBar: { height: 6, borderRadius: 3, overflow: 'hidden' }, healthFill: { height: '100%' }, healthCta: { borderTopWidth: 1, paddingTop: 10, marginTop: 2 }, statsCard: { flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden', borderWidth: 1 }, statCell: { width: '50%', minHeight: 88, padding: 12, gap: 3 }, statRightBorder: { borderRightWidth: 1 }, statBottomBorder: { borderBottomWidth: 1 }, toolbar: { flexDirection: 'row' }, filters: { flexDirection: 'row', gap: 8, paddingBottom: 2 }, section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3, marginBottom: 12 }, row: { justifyContent: 'space-between' } });
