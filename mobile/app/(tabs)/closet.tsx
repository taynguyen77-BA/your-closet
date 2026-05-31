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
} from 'react-native';
import { AiUsageBanner } from '@/components/ui/AiUsageBanner';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { aiService } from '@/services/ai/aiService';
import { useAppStore } from '@/stores/appStore';
import type { ClothingItem } from '@/models';
import { useTheme } from '@/theme';

export default function ClosetScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const clothing = useAppStore((s) => s.clothing);
  const viewMode = useAppStore((s) => s.closetViewMode);
  const setViewMode = useAppStore((s) => s.setClosetViewMode);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const addClothing = useAppStore((s) => s.addClothing);
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const meta = await aiService.detectClothingFromImage(result.assets[0].uri);
    const newItem: ClothingItem = {
      id: `c-${Date.now()}`,
      userId: 'user-1',
      name: meta.suggestedName,
      imageUrl: result.assets[0].uri,
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
    addClothing(newItem);
    Alert.alert('Đã thêm', `AI nhận diện: ${meta.suggestedName}`);
  };

  const renderItem = ({ item }: { item: ClothingItem }) => (
    <Pressable
      onPress={() => router.push(`/closet/${item.id}`)}
      style={[
        viewMode === 'grid' ? styles.gridItem : styles.listItem,
        { backgroundColor: colors.surface, borderRadius: radius.md },
      ]}
    >
      <Image source={{ uri: item.imageUrl }} style={viewMode === 'grid' ? styles.gridImg : styles.listImg} />
      <View style={styles.itemInfo}>
        <AppText variant="label" numberOfLines={1}>
          {item.name}
        </AppText>
        <AppText variant="bodySmall" muted>
          {item.type} · {item.color}
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
        <AppText variant="display" style={{ marginBottom: spacing.md }}>
          Tủ đồ
        </AppText>

        <AiUsageBanner />

        <View style={styles.toolbar}>
          <Button label="Chụp / Tải ảnh" icon="camera-outline" onPress={pickImage} style={{ flex: 1 }} />
          <Button
            label="Cộng đồng"
            variant="secondary"
            icon="people-outline"
            onPress={() => router.push('/community/create')}
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

        <FlatList
          data={filtered}
          key={viewMode}
          numColumns={viewMode === 'grid' ? 2 : 1}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row' },
  search: { padding: 12, fontSize: 15 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6 },
  gridRow: { justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 12, overflow: 'hidden' },
  listItem: { flexDirection: 'row', marginBottom: 12, padding: 8, alignItems: 'center' },
  gridImg: { width: '100%', height: 140 },
  listImg: { width: 72, height: 72, borderRadius: 8 },
  itemInfo: { flex: 1, padding: 8 },
  fav: { position: 'absolute', top: 8, right: 8 },
});
