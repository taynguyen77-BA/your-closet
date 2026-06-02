import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { VibeBadge } from '@/components/ui/FashionUi';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';

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

  if (!item) return <View style={[styles.fallback, { backgroundColor: colors.background }]}><Ionicons name="shirt-outline" size={58} color={colors.accentDark} /><AppText variant="h2">Không tìm thấy món đồ</AppText><AppText muted>Món đồ có thể đã được xóa khỏi tủ.</AppText><Button label="Về tủ đồ" onPress={() => router.replace('/(tabs)/closet')} /></View>;

  return <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
    <View style={styles.imageWrap}><Image source={{ uri: item.imageUrl }} style={styles.hero} contentFit="cover" /><LinearGradient colors={['transparent', 'rgba(23,10,38,0.82)']} style={StyleSheet.absoluteFill} /><View style={styles.heroCopy}><VibeBadge label={item.type} color="rgba(255,255,255,0.88)" /><AppText variant="display" color="#fff">{item.name}</AppText><AppText color="#fff">{item.color} · {item.material ?? 'Material not set'}</AppText></View></View>
    <Animated.View entering={FadeInDown.duration(420)} style={{ padding: spacing.lg }}>
      <View style={styles.chips}>{[item.type, item.color, item.material, ...item.tags].filter(Boolean).map((tag) => <VibeBadge key={tag} label={tag!} color={colors.lavender} />)}</View>
      <LinearGradient colors={gradients.ai} style={[styles.insight, { borderRadius: radius.xl }]}><AppText variant="caption" color="#fff">CLOSET INTEL</AppText><AppText variant="h2" color="#fff">{item.timesWorn} wears and counting</AppText><AppText variant="bodySmall" color="#fff">{item.timesWorn < 3 ? 'Give this piece a new moment or pass it to the community.' : 'A proven wardrobe player. Let AI remix it into a fresh outfit.'}</AppText></LinearGradient>
      <View style={styles.actions}><Button label="Edit" variant="secondary" icon="create-outline" onPress={() => setEditing(true)} style={styles.action} /><Button label="Add to outfit" variant="secondary" icon="add-circle-outline" onPress={() => setChoosingOutfit(true)} style={styles.action} /><Button label="Try with AI" variant="ai" icon="sparkles" onPress={() => router.push(`/(tabs)/try-on?itemId=${item.id}`)} style={styles.action} /><Button label="Post to community" variant="community" icon="people-outline" onPress={() => router.push(`/community/create?itemId=${item.id}`)} style={styles.action} /></View>
      <Button label="Delete item" variant="ghost" icon="trash-outline" onPress={() => Alert.alert('Xóa món đồ?', 'Thao tác này không thể hoàn tác.', [{ text: 'Hủy', style: 'cancel' }, { text: 'Xóa', style: 'destructive', onPress: () => void deleteClothing(item.id).then(() => router.replace('/(tabs)/closet')) }])} style={{ marginTop: 10 }} />
    </Animated.View>
    <Modal visible={editing} transparent animationType="slide"><View style={styles.overlay}><View style={[styles.modal, { backgroundColor: colors.surface, borderRadius: radius.xxl }]}><View style={styles.modalHandle} /><AppText variant="h1">Refresh the details</AppText><AppText muted>Keep your closet intel accurate.</AppText><TextInput value={name} onChangeText={setName} placeholder="Tên món đồ" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: colors.beige, color: colors.text, borderRadius: radius.md }]} /><TextInput value={color} onChangeText={setColor} placeholder="Màu sắc" placeholderTextColor={colors.textMuted} style={[styles.input, { backgroundColor: colors.beige, color: colors.text, borderRadius: radius.md }]} /><Button label="Save changes" onPress={() => void updateClothing(item.id, { name, color }).then(() => setEditing(false))} /><Button label="Cancel" variant="ghost" onPress={() => setEditing(false)} style={{ marginTop: 8 }} /></View></View></Modal>
    <Modal visible={choosingOutfit} transparent animationType="slide"><View style={styles.overlay}><View style={[styles.modal, { backgroundColor: colors.surface, borderRadius: radius.xxl }]}><View style={styles.modalHandle} /><AppText variant="h1">Pick an outfit</AppText>{outfits.map((outfit) => <Pressable key={outfit.id} onPress={() => void addClothingToOutfit(item.id, outfit.id).then(() => { setChoosingOutfit(false); Alert.alert('Đã thêm', `Đã thêm vào ${outfit.name}.`); })} style={[styles.option, { borderBottomColor: colors.border }]}><AppText variant="label">{outfit.name}</AppText><Ionicons name="add-circle" size={22} color={colors.accentDark} /></Pressable>)}{outfits.length === 0 ? <AppText muted style={{ marginVertical: 14 }}>Chưa có outfit để thêm món đồ.</AppText> : null}<Button label="Close" variant="ghost" onPress={() => setChoosingOutfit(false)} /></View></View></Modal>
  </ScrollView>;
}
const styles = StyleSheet.create({ fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }, imageWrap: { height: 470 }, hero: { width: '100%', height: '100%' }, heroCopy: { position: 'absolute', left: 18, right: 18, bottom: 20, gap: 6 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, insight: { padding: 17, gap: 4, marginTop: 16 }, actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 9, marginTop: 16 }, action: { width: '48%' }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(23,10,38,0.56)' }, modal: { padding: 20, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }, modalHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 4, backgroundColor: '#D6CCD9', marginBottom: 16 }, input: { padding: 13, marginTop: 12 }, option: { paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 } });
