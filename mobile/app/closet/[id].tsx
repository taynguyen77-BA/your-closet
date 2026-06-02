import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

export default function ClosetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const item = useAppStore((s) => s.clothing.find((c) => c.id === id));
  const outfits = useAppStore((s) => s.outfits);
  const updateClothing = useAppStore((s) => s.updateClothing);
  const deleteClothing = useAppStore((s) => s.deleteClothing);
  const addClothingToOutfit = useAppStore((s) => s.addClothingToOutfit);
  const [editing, setEditing] = useState(false);
  const [choosingOutfit, setChoosingOutfit] = useState(false);
  const [name, setName] = useState(item?.name ?? '');
  const [color, setColor] = useState(item?.color ?? '');

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText>Không tìm thấy món đồ</AppText>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Image source={{ uri: item.imageUrl }} style={[styles.hero, { borderRadius: radius.lg }]} />
      <AppText variant="h1" style={{ marginTop: spacing.lg }}>
        {item.name}
      </AppText>
      <AppText variant="bodySmall" muted>
        {item.type} · {item.color} · {item.material}
      </AppText>
      <GlassCard style={{ marginTop: spacing.lg }}>
        <AppText variant="bodySmall">Đã mặc {item.timesWorn} lần</AppText>
        <AppText variant="bodySmall" muted style={{ marginTop: 4 }}>
          Tags: {item.tags.join(', ')}
        </AppText>
        {item.season && (
          <AppText variant="bodySmall" muted>
            Mùa: {item.season.join(', ')}
          </AppText>
        )}
      </GlassCard>
      <View style={[styles.actions, { marginTop: spacing.xl }]}>
        <Button label="Sửa" variant="secondary" onPress={() => setEditing(true)} style={{ flex: 1, marginRight: 8 }} />
        <Button label="Xóa" variant="ghost" onPress={() => Alert.alert('Xóa món đồ?', 'Thao tác này không thể hoàn tác.', [{ text: 'Hủy', style: 'cancel' }, { text: 'Xóa', style: 'destructive', onPress: () => void deleteClothing(item.id).then(() => router.back()) }])} style={{ flex: 1, marginRight: 8 }} />
        <Button label="Thêm outfit" onPress={() => setChoosingOutfit(true)} style={{ flex: 1 }} />
      </View>
      <Button
        label="Đăng lên cộng đồng"
        variant="accent"
        onPress={() => router.push(`/community/create?itemId=${item.id}`)}
        style={{ marginTop: spacing.md }}
      />
      <Modal visible={editing} transparent animationType="slide">
        <View style={styles.overlay}><View style={[styles.modal, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
          <AppText variant="h2">Sửa món đồ</AppText>
          <TextInput value={name} onChangeText={setName} placeholder="Tên" style={[styles.input, { backgroundColor: colors.beige }]} />
          <TextInput value={color} onChangeText={setColor} placeholder="Màu" style={[styles.input, { backgroundColor: colors.beige }]} />
          <Button label="Lưu thay đổi" onPress={() => void updateClothing(item.id, { name, color }).then(() => setEditing(false))} />
          <Button label="Hủy" variant="ghost" onPress={() => setEditing(false)} style={{ marginTop: 8 }} />
        </View></View>
      </Modal>
      <Modal visible={choosingOutfit} transparent animationType="slide">
        <View style={styles.overlay}><View style={[styles.modal, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
          <AppText variant="h2">Chọn outfit</AppText>
          {outfits.map((outfit) => <Pressable key={outfit.id} onPress={() => void addClothingToOutfit(item.id, outfit.id).then(() => { setChoosingOutfit(false); Alert.alert('Đã thêm', `Đã thêm vào ${outfit.name}.`); })} style={styles.option}><AppText>{outfit.name}</AppText></Pressable>)}
          {outfits.length === 0 ? <AppText variant="bodySmall" muted style={{ marginVertical: 12 }}>Chưa có outfit để thêm món đồ.</AppText> : null}
          <Button label="Đóng" variant="ghost" onPress={() => setChoosingOutfit(false)} />
        </View></View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 360 },
  actions: { flexDirection: 'row', marginTop: 24 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0006' },
  modal: { padding: 20 },
  input: { padding: 12, marginTop: 12 },
  option: { paddingVertical: 14 },
});
