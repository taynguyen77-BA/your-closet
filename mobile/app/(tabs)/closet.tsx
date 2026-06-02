import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ScrollView,
} from 'react-native';
import { AiUsageBanner } from '@/components/ui/AiUsageBanner';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { aiService } from '@/services/ai/aiService';
import { useAppStore } from '@/stores/appStore';
import type { ClothingItem } from '@/models';
import { useTheme } from '@/theme';
import { DataState } from '@/components/ui/DataState';
import { LinearGradient } from 'expo-linear-gradient';

export default function ClosetScreen() {
  const router = useRouter();
  const { colors, gradients, spacing, radius } = useTheme();
  const clothing = useAppStore((s) => s.clothing);
  const viewMode = useAppStore((s) => s.closetViewMode);
  const setViewMode = useAppStore((s) => s.setClosetViewMode);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const createClothing = useAppStore((s) => s.createClothing);
  const canUseAiTry = useAppStore((s) => s.canUseAiTry);
  const consumeAiTry = useAppStore((s) => s.consumeAiTry);
  const loadState = useAppStore((s) => s.loadState);
  const error = useAppStore((s) => s.error);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = clothing.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some((t) => t.includes(search.toLowerCase()));
    const matchFilter = !filter || c.type === filter;
    return matchSearch && matchFilter;
  });
  const unusedCount = clothing.filter((item) => item.timesWorn < 3).length;
  const activeCount = clothing.length - unusedCount;
  const wardrobeScore = clothing.length ? Math.min(96, 68 + activeCount * 4) : 0;
  const itemBadge = (item: ClothingItem) => {
    if (item.timesWorn === 0) return 'Chưa mặc';
    if (item.timesWorn < 3) return 'Nên pass lại';
    if (item.timesWorn > 12) return 'Mặc thường xuyên';
    return item.isFavorite ? 'Yêu thích' : null;
  };

  const pickImage = async () => {
    if (saving) return;
    if (useAppStore.getState().user.closetItemCount >= useAppStore.getState().user.closetItemLimit) {
      Alert.alert('Tủ đồ đã đầy', 'Nâng cấp gói thành viên để thêm nhiều món đồ hơn.');
      return;
    }
    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
    } catch {
      Alert.alert('Không thể mở thư viện ảnh', 'Kiểm tra quyền truy cập ảnh rồi thử lại.');
      return;
    }
    if (result.canceled || !result.assets[0]) return;
    if (!canUseAiTry()) {
      Alert.alert('Hết lượt AI', 'Nâng cấp hoặc hoàn thành nhiệm vụ để nhận diện thêm quần áo.');
      return;
    }

    setSaving(true);
    try {
      const aiResult = await aiService.detectClothingFromImage(useAppStore.getState().user.id, result.assets[0].uri);
      const meta = aiResult.data;
      const newItem: Omit<ClothingItem, 'id' | 'imageUrl'> = {
      userId: useAppStore.getState().user.id,
      name: meta.suggestedName,
      type: meta.type,
      material: meta.material,
      color: meta.color,
      style: meta.style,
      season: meta.season,
      tags: meta.tags,
      isFavorite: false,
      timesWorn: 0,
      createdAt: new Date().toISOString(),
      };
      await createClothing(newItem, result.assets[0].uri);
      if (aiResult.quotaChargeEligible) await consumeAiTry(!aiResult.quotaManagedByBackend);
      Alert.alert('Đã thêm', `AI nhận diện: ${meta.suggestedName}`);
    } catch {
      Alert.alert('Không thể lưu', 'Kiểm tra kết nối Firebase rồi thử lại.');
    } finally { setSaving(false); }
  };

  const renderItem = ({ item }: { item: ClothingItem }) => (
    <Pressable
      onPress={() => router.push(`/closet/${item.id}`)}
      style={[
        viewMode === 'grid' ? styles.gridItem : styles.listItem,
        { backgroundColor: colors.surface, borderRadius: radius.md },
      ]}
    >
      <Image source={{ uri: item.imageUrl }} style={viewMode === 'grid' ? styles.gridImg : styles.listImg} contentFit="cover" />
      {itemBadge(item) ? <View style={[styles.itemBadge, { backgroundColor: colors.surfaceGlass }]}><AppText variant="caption">{itemBadge(item)}</AppText></View> : null}
      <View style={styles.itemInfo}>
        <AppText variant="label" numberOfLines={1}>
          {item.name}
        </AppText>
        <AppText variant="bodySmall" muted>
          {item.type} · {item.color} · {item.timesWorn} lần mặc
        </AppText>
      </View>
      <Pressable onPress={() => toggleFavorite(item.id)} style={styles.fav}>
        <Ionicons
          name={item.isFavorite ? 'heart' : 'heart-outline'}
          size={20}
          color={colors.accentDark}
        />
      </Pressable>
    </Pressable>
  );

  return (
    <Screen scroll={false} padded>
      <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <AppText variant="bodySmall" muted>TỦ ĐỒ THÔNG MINH</AppText>
        <AppText variant="display" style={{ marginBottom: spacing.md }}>Phong cách của bạn</AppText>

        <LinearGradient colors={gradients.deep} style={[styles.health, { borderRadius: radius.xl }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color={colors.accent}>WARDROBE HEALTH</AppText>
            <AppText variant="h1" color={colors.textInverse}>{wardrobeScore}/100 · Cân bằng tốt</AppText>
            <AppText variant="bodySmall" color={colors.warmGray}>Tủ đồ neutral dễ phối. Thêm một đôi sneaker trắng để linh hoạt hơn.</AppText>
          </View>
          <View style={[styles.healthScore, { borderColor: colors.accent }]}><AppText variant="h2" color={colors.textInverse}>{wardrobeScore}</AppText></View>
        </LinearGradient>

        <View style={styles.metrics}>
          {[['Tổng món', clothing.length], ['Đang mặc', activeCount], ['Ít dùng', unusedCount]].map(([label, value]) => (
            <View key={label} style={[styles.metric, { backgroundColor: colors.beige, borderRadius: radius.md }]}>
              <AppText variant="h2">{value}</AppText><AppText variant="caption" muted>{label}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.toolbar}>
          <Button label={saving ? 'Đang tải ảnh...' : 'Chụp / Tải ảnh'} icon="camera-outline" onPress={pickImage} disabled={saving} style={{ flex: 1 }} />
          <Button
            label="Phân tích AI"
            variant="secondary"
            icon="sparkles-outline"
            onPress={() => router.push('/shopping')}
            style={{ marginLeft: 8 }}
          />
        </View>

        <TextInput
          placeholder="Tìm kiếm..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={[
            styles.search,
            {
              backgroundColor: colors.beige,
              borderRadius: radius.md,
              color: colors.text,
              marginVertical: spacing.md,
            },
          ]}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 12 }}>
        <View style={styles.filters}>
          {['top', 'bottom', 'dress', 'shoes'].map((t) => (
            <Pressable
              key={t}
              onPress={() => setFilter(filter === t ? null : t)}
              style={[
                styles.chip,
                {
                  backgroundColor: filter === t ? colors.accent : colors.beige,
                  borderRadius: radius.full,
                },
              ]}
            >
              <AppText variant="bodySmall">{t}</AppText>
            </Pressable>
          ))}
          <Pressable onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <Ionicons
              name={viewMode === 'grid' ? 'list' : 'grid'}
              size={24}
              color={colors.text}
            />
          </Pressable>
        </View>
        </ScrollView>

        <FlatList
          data={filtered}
          key={viewMode}
          numColumns={viewMode === 'grid' ? 2 : 1}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<DataState loading={loadState === 'loading'} error={error} empty emptyText="Tủ đồ đang trống. Thêm món đầu tiên của bạn." />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row' },
  health: { padding: 18, flexDirection: 'row', alignItems: 'center' },
  healthScore: { width: 58, height: 58, borderRadius: 29, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  metrics: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  metric: { flex: 1, padding: 11 },
  search: { padding: 12, fontSize: 15 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6 },
  gridRow: { justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 12, overflow: 'hidden' },
  listItem: { flexDirection: 'row', marginBottom: 12, padding: 8, alignItems: 'center' },
  gridImg: { width: '100%', height: 190 },
  listImg: { width: 72, height: 72, borderRadius: 8 },
  itemInfo: { flex: 1, padding: 8 },
  fav: { position: 'absolute', top: 8, right: 8 },
  itemBadge: { position: 'absolute', left: 8, top: 8, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 4 },
});
