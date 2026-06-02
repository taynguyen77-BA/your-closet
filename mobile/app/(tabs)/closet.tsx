import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { ClosetItemCard, EmptyClosetState, FilterPill, FloatingActionButton, GradientScreenHeader, SearchBar, StatBubble } from '@/components/ui/FashionUi';
import type { ClothingItem } from '@/models';
import { aiService } from '@/services/ai/aiService';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

type Filter = 'all' | 'top' | 'bottom' | 'dress' | 'shoes' | 'bag' | 'favorites' | 'rarely';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'top', label: 'Tops' }, { key: 'bottom', label: 'Bottoms' },
  { key: 'dress', label: 'Dress' }, { key: 'shoes', label: 'Shoes' }, { key: 'bag', label: 'Bags' },
  { key: 'favorites', label: 'Favorites' }, { key: 'rarely', label: 'Rarely worn' },
];

export default function ClosetScreen() {
  const router = useRouter();
  const { colors, gradients, spacing, radius } = useTheme();
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
    } catch { Alert.alert('Chưa thêm được món đồ', 'Thử lại sau một chút nhé. Experience Mode vẫn lưu các trải nghiệm local của bạn.'); }
    finally { setSaving(false); }
  };

  const header = <View style={{ gap: spacing.md }}>
    <GradientScreenHeader eyebrow="SMART WARDROBE" title="Your Closet, Your Vibe" subtitle="Mix, match, repeat — AI helps you glow up." />
    <LinearGradient colors={gradients.dark} style={[styles.health, { borderRadius: radius.xl }]}>
      <View style={{ flex: 1 }}><AppText variant="caption" color={colors.lemon}>WARDROBE HEALTH</AppText><AppText variant="h1" color={colors.textInverse}>{wardrobeScore}/100 · Looking fresh</AppText><AppText variant="bodySmall" color={colors.warmGray}>AI says: your everyday base is strong. Add one statement piece for more outfit range.</AppText><Button label="AI phối đồ" small variant="ai" icon="sparkles" onPress={() => router.push('/(tabs)/try-on')} style={{ alignSelf: 'flex-start', marginTop: 10 }} /></View>
      <View style={[styles.score, { borderColor: colors.lemon }]}><AppText variant="h2" color={colors.textInverse}>{wardrobeScore}</AppText></View>
    </LinearGradient>
    <View style={styles.stats}><StatBubble icon="shirt-outline" value={clothing.length} label="Total items" tint={colors.pink} /><StatBubble icon="heart" value={favorites} label="Favorites" tint={colors.lavender} delay={60} /><StatBubble icon="time-outline" value={rarelyWorn} label="Rarely worn" tint={colors.mint} delay={120} /><StatBubble icon="sparkles" value={outfitPotential} label="Outfit potential" tint={colors.lemon} delay={180} /></View>
    <View style={styles.toolbar}><Button label={saving ? 'Adding...' : 'Add item'} icon="camera-outline" onPress={pickImage} disabled={saving} style={{ flex: 1 }} /><Button label="AI phối đồ" variant="secondary" icon="sparkles-outline" onPress={() => router.push('/(tabs)/try-on')} style={{ marginLeft: 8 }} /></View>
    <SearchBar value={search} onChangeText={setSearch} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.filters}>{FILTERS.map((item) => <FilterPill key={item.key} label={item.label} active={filter === item.key} onPress={() => setFilter(item.key)} />)}</View></ScrollView>
    <View style={styles.section}><View><AppText variant="h2">Your pieces</AppText><AppText variant="bodySmall" muted>{filtered.length} items ready to style</AppText></View><Pressable onPress={() => setFilter('all')}><Ionicons name="options-outline" size={22} color={colors.accentDark} /></Pressable></View>
  </View>;

  return <View style={{ flex: 1, backgroundColor: colors.background }}><FlatList data={filtered} numColumns={2} keyExtractor={(item) => item.id} renderItem={({ item }) => <ClosetItemCard item={item} onPress={() => router.push(`/closet/${item.id}`)} onFavorite={() => void toggleFavorite(item.id)} />} columnWrapperStyle={styles.row} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 112 }} ListHeaderComponent={header} ListEmptyComponent={<EmptyClosetState onPress={() => void pickImage()} />} showsVerticalScrollIndicator={false} /><FloatingActionButton onPress={() => void pickImage()} /></View>;
}
const styles = StyleSheet.create({ health: { padding: 17, flexDirection: 'row', alignItems: 'center' }, score: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginLeft: 10 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, toolbar: { flexDirection: 'row' }, filters: { flexDirection: 'row', gap: 8, paddingBottom: 2 }, section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3, marginBottom: 12 }, row: { justifyContent: 'space-between' } });
