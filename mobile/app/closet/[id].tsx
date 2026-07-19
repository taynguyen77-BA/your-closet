import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
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
  const { colors, spacing, rounded } = useTheme();
  const item = useAppStore((s) => s.clothing.find((value) => value.id === id));
  const outfits = useAppStore((s) => s.outfits);
  const updateClothing = useAppStore((s) => s.updateClothing);
  const deleteClothing = useAppStore((s) => s.deleteClothing);
  const addClothingToOutfit = useAppStore((s) => s.addClothingToOutfit);

  const [editing, setEditing] = useState(false);
  const [choosingOutfit, setChoosingOutfit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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
        <Ionicons name="shirt-outline" size={58} color={colors.primary} />
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
        <LinearGradient colors={['transparent', 'rgba(26,18,8,0.82)']} style={StyleSheet.absoluteFill} />
        <View style={styles.heroCopy}>
          <VibeBadge label={item.type} color="rgba(255,255,255,0.88)" />
          <AppText variant="display" color="#fff">{item.name}</AppText>
          <AppText color="#fff">{item.color} · {item.material ?? 'Chưa có thông tin chất liệu'}</AppText>
        </View>
      </View>

      <Animated.View entering={FadeInDown.duration(420)} style={{ padding: spacing.lg }}>
        <View style={styles.chips}>
          {[item.type, item.color, item.material, ...item.tags].filter(Boolean).map((tag) => (
            <VibeBadge key={tag} label={tag!} color={colors.sand} />
          ))}
        </View>

        <View style={[styles.insight, { borderRadius: rounded.lg, backgroundColor: colors.primary }]}>
          <AppText variant="caption" color={colors.sand}>PHÂN TÍCH TỦ ĐỒ</AppText>
          <AppText variant="h2" color="#fff">Đã mặc {item.timesWorn} lần</AppText>
          <AppText variant="bodySmall" color="#fff">
            {item.timesWorn < 3
              ? 'Hãy tạo một diện mạo mới cho món đồ này hoặc chuyển lại cho cộng đồng.'
              : 'Đây là món đồ đáng tin cậy. Hãy để AI phối lại thành một bộ đồ mới.'}
          </AppText>
        </View>

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
          onPress={() => setConfirmDelete(true)}
          style={{ marginTop: 10 }}
        />
      </Animated.View>

      {/* Edit — full-screen editorial layout (Stitch ch_nh_s_a_m_n_wardro). */}
      <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}>
        <View style={[styles.editScreen, { backgroundColor: colors.background }]}>
          <View style={[styles.editHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setEditing(false)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Đóng">
              <Ionicons name="close" size={26} color={colors.primary} />
            </Pressable>
            <AppText variant="h2" color={colors.primary}>Chỉnh sửa món đồ</AppText>
            <Pressable onPress={() => void saveEdit()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Xong">
              <AppText variant="label" color={colors.primary}>XONG</AppText>
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editContent}>
            <View style={styles.editPreview}>
              <SafeImage source={{ uri: item.imageUrl }} style={[styles.editImage, { borderRadius: rounded.DEFAULT, backgroundColor: colors.surface }]} contentFit="cover" fallbackLabel="ẢNH MÓN ĐỒ" />
              <AppText variant="caption" color={colors.warmGray} style={styles.editPreviewCaption}>XEM TRƯỚC HÌNH ẢNH SẢN PHẨM</AppText>
            </View>
            <EditField label="TÊN MÓN ĐỒ" placeholder="Tên món đồ" value={name} onChangeText={setName} colors={colors} />
            <View style={styles.editRow}>
              <EditField label="MÀU SẮC" placeholder="Màu sắc" value={color} onChangeText={setColor} colors={colors} style={styles.editCol} />
              <EditField label="CHẤT LIỆU" placeholder="Chất liệu" value={material} onChangeText={setMaterial} colors={colors} style={styles.editCol} />
            </View>
            <View style={styles.editRow}>
              <EditField label="LOẠI" placeholder="Loại (top/bottom/dress/…)" value={typeRaw} onChangeText={setTypeRaw} colors={colors} style={styles.editCol} />
              <EditField label="PHONG CÁCH" placeholder="Phong cách" value={style} onChangeText={setStyle} colors={colors} style={styles.editCol} />
            </View>
            <EditField label="MÙA" placeholder="Mùa, cách nhau bằng dấu phẩy" value={seasonRaw} onChangeText={setSeasonRaw} colors={colors} />
            <EditField label="TAGS" placeholder="Tags, cách nhau bằng dấu phẩy" value={tagsRaw} onChangeText={setTagsRaw} colors={colors} />
          </ScrollView>
        </View>
      </Modal>

      {/* Outfit picker */}
      <Modal visible={choosingOutfit} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface, borderRadius: rounded.lg }]}>
            <View style={styles.modalHandle} />
            <AppText variant="h1">Chọn bộ đồ</AppText>
            {outfits.map((outfit) => (
              <Pressable
                key={outfit.id}
                onPress={() => void addClothingToOutfit(item.id, outfit.id).then(() => { setChoosingOutfit(false); Alert.alert('Đã thêm', `Đã thêm vào ${outfit.name}.`); })}
                style={[styles.option, { borderBottomColor: colors.border }]}
              >
                <AppText variant="label">{outfit.name}</AppText>
                <Ionicons name="add-circle" size={22} color={colors.primary} />
              </Pressable>
            ))}
            {outfits.length === 0 ? <AppText muted style={{ marginVertical: 14 }}>Chưa có bộ đồ để thêm món đồ.</AppText> : null}
            <Button label="Đóng" variant="ghost" onPress={() => setChoosingOutfit(false)} />
          </View>
        </View>
      </Modal>

      {/* Delete confirmation — custom modal replacing the native Alert (Stitch x_a_m_n_wardro). */}
      <DeleteConfirmModal
        visible={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); void deleteClothing(item.id).then(() => router.replace('/(tabs)/closet')); }}
      />
    </ScrollView>
  );
}

/**
 * Delete-confirm dialog. Replaces Alert.alert, so it re-creates the affordances the
 * native alert gave for free: Android hardware back cancels (onRequestClose), Escape
 * cancels, focus is trapped between the two actions on web, and dialog/action a11y
 * roles + labels are declared explicitly.
 */
function DeleteConfirmModal({ visible, onCancel, onConfirm }: { visible: boolean; onCancel: () => void; onConfirm: () => void }) {
  const { colors, rounded } = useTheme();
  const confirmRef = useRef<any>(null);
  const cancelRef = useRef<any>(null);

  // Re-create the web keyboard affordances the native Alert gave for free (the
  // Android hardware back button is handled natively via onRequestClose). On web:
  // safe initial focus on Cancel, Escape cancels, and Tab/Shift+Tab is trapped
  // between the two actions so focus never leaves the dialog.
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const doc = (globalThis as { document?: Document }).document;
    const focusTimer = setTimeout(() => { try { cancelRef.current?.focus?.(); } catch { /* noop */ } }, 0);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); return; }
      if (e.key !== 'Tab') return;
      const nodes = [confirmRef.current, cancelRef.current].filter(Boolean);
      if (nodes.length < 2) return;
      e.preventDefault();
      const idx = nodes.indexOf(doc?.activeElement);
      const nextIdx = e.shiftKey
        ? (idx <= 0 ? nodes.length - 1 : idx - 1)
        : (idx === -1 || idx === nodes.length - 1 ? 0 : idx + 1);
      nodes[nextIdx]?.focus?.();
    };
    doc?.addEventListener('keydown', onKeyDown, true);
    return () => { clearTimeout(focusTimer); doc?.removeEventListener('keydown', onKeyDown, true); };
  }, [visible, onCancel]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      {/* Scrim is a plain View (no tap-to-dismiss) to match a native modal alert; the
          dialog is dismissed via the Hủy action, the Android back button, or Escape. */}
      <View style={styles.deleteBackdrop}>
        <View
          style={[styles.deleteCard, { backgroundColor: colors.surface, borderRadius: rounded.lg }]}
          accessibilityViewIsModal
          accessibilityRole="alert"
          accessibilityLabel="Xóa món đồ?"
        >
          <View style={styles.deleteBody}>
            <AppText variant="h1" style={styles.deleteCentered}>Xóa món đồ?</AppText>
            <AppText variant="body" muted style={styles.deleteCentered}>Thao tác này không thể hoàn tác.</AppText>
          </View>
          <View style={[styles.deleteDivider, { backgroundColor: colors.border }]} />
          <Pressable ref={confirmRef} onPress={onConfirm} accessibilityRole="button" accessibilityLabel="Xóa" style={styles.deleteAction}>
            <AppText variant="label" color={colors.error}>Xóa</AppText>
          </Pressable>
          <View style={[styles.deleteDivider, { backgroundColor: colors.border }]} />
          <Pressable ref={cancelRef} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Hủy" style={styles.deleteAction}>
            <AppText variant="label" color={colors.primary}>Hủy</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** Editorial field per Stitch: an uppercase caption above an underline-only input. */
function EditField({ label, placeholder, value, onChangeText, colors, style }: { label: string; placeholder: string; value: string; onChangeText: (v: string) => void; colors: { text: string; textMuted: string; warmGray: string; sand: string }; style?: ViewStyle }) {
  return (
    <View style={[styles.editField, style]}>
      <AppText variant="caption" color={colors.warmGray} style={styles.editLabel}>{label}</AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.editInput, { color: colors.text, borderBottomColor: colors.sand }]}
      />
    </View>
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
  editScreen: { flex: 1 },
  editHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, borderBottomWidth: 1 },
  editContent: { padding: 20, paddingBottom: 48, gap: 20 },
  editPreview: { alignItems: 'center', gap: 10 },
  editImage: { width: '62%', aspectRatio: 3 / 4 },
  editPreviewCaption: { letterSpacing: 1 },
  editField: { gap: 6 },
  editLabel: {},
  editInput: { borderBottomWidth: 1, paddingVertical: 8, fontSize: 16, fontFamily: 'DM Sans' },
  editRow: { flexDirection: 'row', gap: 16 },
  editCol: { flex: 1 },
  deleteBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(26,18,8,0.5)', padding: 32 },
  deleteCard: { width: '100%', maxWidth: 340, overflow: 'hidden' },
  deleteBody: { padding: 24, alignItems: 'center', gap: 8 },
  deleteCentered: { textAlign: 'center' },
  deleteDivider: { height: 1 },
  deleteAction: { paddingVertical: 16, alignItems: 'center' },
});
