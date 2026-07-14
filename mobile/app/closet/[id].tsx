import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { VibeBadge } from '@/components/ui/FashionUi';
import { SafeImage } from '@/components/ui/SafeImage';
import type { ClothingType } from '@/models';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

function normalizeType(value: string): ClothingType {
  const t = value.trim().toLowerCase();
  return ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'bag', 'other'].includes(t)
    ? (t as ClothingType)
    : 'other';
}

export default function ClosetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, gradients, spacing, radius } = useTheme();
  const item = useAppStore((s) => s.clothing.find((value) => value.id === id));
  const outfits = useAppStore((s) => s.outfits);
  const updateClothing = useAppStore((s) => s.updateClothing);
  const deleteClothing = useAppStore((s) => s.deleteClothing);
  const addClothingToOutfit = useAppStore((s) => s.addClothingToOutfit);

  const [editing, setEditing] = useState(false);
  const [choosingOutfit, setChoosingOutfit] = useState(false);
  const [name, setName] = useState(item?.name ?? '');
  const [color, setColor] = useState(item?.color ?? '');
  const [material, setMaterial] = useState(item?.material ?? '');
  const [style, setStyle] = useState(item?.style ?? '');
  const [typeRaw, setTypeRaw] = useState<string>(item?.type ?? 'other');
  const [seasonRaw, setSeasonRaw] = useState((item?.season ?? []).join(', '));
  const [tagsRaw, setTagsRaw] = useState((item?.tags ?? []).join(', '));

  const openEdit = () => {
    setName(item?.name ?? '');
    setColor(item?.color ?? '');
    setMaterial(item?.material ?? '');
    setStyle(item?.style ?? '');
    setTypeRaw(item?.type ?? 'other');
    setSeasonRaw((item?.season ?? []).join(', '));
    setTagsRaw((item?.tags ?? []).join(', '));
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!name.trim() || !color.trim()) return Alert.alert('Thiếu thông tin', 'Nhập tên và màu sắc trước khi lưu nhé.');
    await updateClothing(item!.id, {
      name: name.trim(),
      color: color.trim(),
      material: material.trim() || undefined,
      style: style.trim() || undefined,
      type: normalizeType(typeRaw),
      season: seasonRaw.split(',').map((s) => s.trim()).filter(Boolean),
      tags: tagsRaw.split(',').map((s) => s.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    });
    setEditing(false);
  };

  if (!item) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.background }]}>
        <Ionicons name="shirt-outline" size={58} color={colors.accentDark} />
        <AppText variant="h2">Không tìm thấy món đồ</AppText>
        <AppText muted>Món đồ có thể đã được xóa khỏi tủ.</AppText>
        <Button label="Về tủ đồ" onPress={() => router.replace('/(tabs)/closet')} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
      <View style={styles.imageWrap}>
        <SafeImage source={{ uri: item.imageUrl }} style={styles.hero} contentFit="cover" fallbackLabel="ẢNH MÓN ĐỒ" />
        <LinearGradient colors={['transparent', 'rgba(23,10,38,0.82)']} style={StyleSheet.absoluteFill} />
        <View style={styles.heroCopy}>
          <VibeBadge label={item.type} color="rgba(255,255,255,0.88)" />
          <AppText variant="display" color="#fff">{item.name}</AppText>
          <AppText color="#fff">{item.color} · {item.material ?? 'Chưa có thông tin chất liệu'}</AppText>
        </View>
      </View>

      <Animated.View entering={FadeInDown.duration(420)} style={{ padding: spacing.lg }}>
        <View style={styles.chips}>
          {[item.type, item.color, item.material, ...item.tags].filter(Boolean).map((tag) => (
            <VibeBadge key={tag} label={tag!} color={colors.lavender} />
          ))}
        </View>

        <LinearGradient colors={gradients.ai} style={[styles.insight, { borderRadius: radius.xl }]}>
          <AppText variant="caption" color="#fff">PHÂN TÍCH TỦ ĐỒ</AppText>
          <AppText variant="h2" color="#fff">Đã mặc {item.timesWorn} lần</AppText>
          <AppText variant="bodySmall" color="#fff">
            {item.timesWorn < 3
              ? 'Hãy tạo một diện mạo mới cho món đồ này hoặc chuyển lại cho cộng đồng.'
              : 'Đây là món đồ đáng tin cậy. Hãy để AI phối lại thành một bộ đồ mới.'}
          </AppText>
        </LinearGradient>

        <View style={styles.actions}>
          <Button label="Chỉnh sửa" variant="secondary" icon="create-outline" onPress={openEdit} style={styles.action} />
          <Button label="Thêm vào bộ đồ" variant="secondary" icon="add-circle-outline" onPress={() => setChoosingOutfit(true)} style={styles.action} />
          <Button label="Thử cùng AI" variant="ai" icon="sparkles" onPress={() => router.push(`/(tabs)/try-on?itemId=${item.id}`)} style={styles.action} />
          <Button label="Đăng lên cộng đồng" variant="community" icon="people-outline" onPress={() => router.push(`/community/create?itemId=${item.id}`)} style={styles.action} />
        </View>

        <Button
          label="Xóa món đồ"
          variant="ghost"
          icon="trash-outline"
          onPress={() =>
            Alert.alert('Xóa món đồ?', 'Thao tác này không thể hoàn tác.', [
              { text: 'Hủy', style: 'cancel' },
              { text: 'Xóa', style: 'destructive', onPress: () => void deleteClothing(item.id).then(() => router.replace('/(tabs)/closet')) },
            ])
          }
          style={{ marginTop: 10 }}
        />
      </Animated.View>

      {/* Edit Modal — all fields */}
      <Modal visible={editing} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface, borderRadius: radius.xxl }]}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              <AppText variant="h1">Cập nhật thông tin</AppText>
              <AppText muted>Giữ thông tin tủ đồ luôn chính xác.</AppText>
              <Field label="Tên món đồ" value={name} onChangeText={setName} colors={colors} radius={radius} />
              <Field label="Màu sắc" value={color} onChangeText={setColor} colors={colors} radius={radius} />
              <Field label="Chất liệu" value={material} onChangeText={setMaterial} colors={colors} radius={radius} />
              <Field label="Phong cách" value={style} onChangeText={setStyle} colors={colors} radius={radius} />
              <Field label="Loại (top/bottom/dress/…)" value={typeRaw} onChangeText={setTypeRaw} colors={colors} radius={radius} />
              <Field label="Mùa, cách nhau bằng dấu phẩy" value={seasonRaw} onChangeText={setSeasonRaw} colors={colors} radius={radius} />
              <Field label="Tags, cách nhau bằng dấu phẩy" value={tagsRaw} onChangeText={setTagsRaw} colors={colors} radius={radius} />
              <Button label="Lưu thay đổi" onPress={() => void saveEdit()} />
              <Button label="Hủy" variant="ghost" onPress={() => setEditing(false)} style={{ marginTop: 4 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Outfit picker */}
      <Modal visible={choosingOutfit} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface, borderRadius: radius.xxl }]}>
            <View style={styles.modalHandle} />
            <AppText variant="h1">Chọn bộ đồ</AppText>
            {outfits.map((outfit) => (
              <Pressable
                key={outfit.id}
                onPress={() => void addClothingToOutfit(item.id, outfit.id).then(() => { setChoosingOutfit(false); Alert.alert('Đã thêm', `Đã thêm vào ${outfit.name}.`); })}
                style={[styles.option, { borderBottomColor: colors.border }]}
              >
                <AppText variant="label">{outfit.name}</AppText>
                <Ionicons name="add-circle" size={22} color={colors.accentDark} />
              </Pressable>
            ))}
            {outfits.length === 0 ? <AppText muted style={{ marginVertical: 14 }}>Chưa có bộ đồ để thêm món đồ.</AppText> : null}
            <Button label="Đóng" variant="ghost" onPress={() => setChoosingOutfit(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Field({ label, value, onChangeText, colors, radius }: { label: string; value: string; onChangeText: (v: string) => void; colors: { beige: string; text: string; textMuted: string }; radius: { md: number } }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={label}
      placeholderTextColor={colors.textMuted}
      style={{ backgroundColor: colors.beige, color: colors.text, borderRadius: radius.md, padding: 12, fontSize: 14 }}
    />
  );
}

const styles = StyleSheet.create({
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  imageWrap: { height: 470 },
  hero: { width: '100%', height: '100%' },
  heroCopy: { position: 'absolute', left: 18, right: 18, bottom: 20, gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  insight: { padding: 17, gap: 4, marginTop: 16 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 9, marginTop: 16 },
  action: { width: '48%' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(30,23,18,0.72)' },
  modal: { maxHeight: '88%', padding: 20, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  modalHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 4, backgroundColor: '#D4B896', marginBottom: 16 },
  option: { paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
});
