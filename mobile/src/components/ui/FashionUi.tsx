import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import type { ClothingItem } from '@/models';
import { useTheme } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

export function AnimatedPressable({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: ViewStyle }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[style, animatedStyle]}><Pressable onPress={onPress} onPressIn={() => { scale.value = withSpring(0.97); }} onPressOut={() => { scale.value = withSpring(1); }}>{children}</Pressable></Animated.View>;
}

export function GradientScreenHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const { radius, colors } = useTheme();
  return <Animated.View entering={FadeInDown.duration(420)}><View style={[styles.hero, { borderRadius: radius.xl, backgroundColor: colors.primary }]}>
    <AppText variant="caption" color={colors.textInverse}>{eyebrow}</AppText>
    <AppText variant="display" color={colors.textInverse} style={styles.heroTitle}>{title}</AppText>
    <AppText variant="body" color={colors.textInverse}>{subtitle}</AppText>
    <View style={styles.heroOrb} />
  </View></Animated.View>;
}

export function FloatingActionButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const lift = useSharedValue(0);
  useEffect(() => { lift.value = withRepeat(withSequence(withSpring(-4), withSpring(0)), -1, true); }, [lift]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  return <Animated.View style={[styles.fabWrap, style]}><Pressable onPress={onPress} style={[styles.fab, { backgroundColor: colors.primary }]}><Ionicons name="add" size={22} color={colors.accent} /><AppText variant="label" color={colors.textInverse}>Thêm mới</AppText></Pressable></Animated.View>;
}

export function SearchBar({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  const { colors, radius } = useTheme();
  return <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.full }]}>
    <Ionicons name="search" size={19} color={colors.accentDark} />
    <TextInput value={value} onChangeText={onChangeText} placeholder="Tìm trong tủ đồ..." placeholderTextColor={colors.textMuted} style={[styles.searchInput, { color: colors.text }]} />
    {value ? <Pressable onPress={() => onChangeText('')}><Ionicons name="close-circle" size={18} color={colors.textMuted} /></Pressable> : null}
  </View>;
}

export function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, radius } = useTheme();
  return <Pressable onPress={onPress} style={[styles.pill, { borderRadius: radius.full, backgroundColor: active ? colors.deepPurple : colors.surface, borderColor: active ? colors.deepPurple : colors.border }]}>
    <AppText variant="bodySmall" color={active ? colors.textInverse : colors.text}>{label}</AppText>
  </Pressable>;
}

export function StatBubble({ icon, value, label, tint, delay = 0 }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string; tint: string; delay?: number }) {
  const { radius, colors } = useTheme();
  return <Animated.View entering={FadeInDown.delay(delay).duration(350)} style={[styles.stat, { backgroundColor: tint, borderRadius: radius.lg }]}>
    <Ionicons name={icon} size={18} color={colors.deepPurple} /><AppText variant="h2">{value}</AppText><AppText variant="caption" muted>{label}</AppText>
  </Animated.View>;
}

export function VibeBadge({ label, color }: { label: string; color?: string }) {
  const { colors, radius } = useTheme();
  return <View style={[styles.badge, { backgroundColor: color ?? colors.surfaceGlass, borderRadius: radius.full }]}><AppText variant="caption">{label}</AppText></View>;
}
export const NeonBadge = VibeBadge;

function status(item: ClothingItem) {
  if (item.timesWorn === 0) return 'Mới';
  if (item.isFavorite) return 'Yêu thích';
  if (item.timesWorn < 3) return 'Ít mặc';
  if (item.timesWorn > 12) return 'Hay mặc';
  return null;
}

export function ClosetItemCard({ item, onPress, onFavorite }: { item: ClothingItem; onPress: () => void; onFavorite: () => void }) {
  const { colors, radius } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  return <AnimatedPressable onPress={onPress} style={styles.cardWrap}><View style={[styles.card, { borderRadius: radius.xl, backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
    {imageFailed ? <View style={[styles.cardImage, styles.imageFallback]}><Ionicons name="shirt-outline" size={42} color={colors.accent} /><AppText variant="caption" color={colors.accent}>ẢNH MÓN ĐỒ</AppText></View> : <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" onError={() => setImageFailed(true)} />}
    <View style={[StyleSheet.absoluteFill, styles.cardOverlay]} />
    <View style={styles.cardTop}><VibeBadge label={item.type} color="rgba(255,255,255,0.84)" /><Pressable onPress={onFavorite} hitSlop={12}><Ionicons name={item.isFavorite ? 'heart' : 'heart-outline'} size={22} color={item.isFavorite ? colors.electricPink : '#fff'} /></Pressable></View>
    <View style={styles.cardBottom}>{status(item) ? <VibeBadge label={status(item)!} color="rgba(255,255,255,0.84)" /> : null}<AppText variant="h3" color="#fff" numberOfLines={1}>{item.name}</AppText><AppText variant="bodySmall" color="#fff">{item.color} · Đã mặc {item.timesWorn} lần</AppText></View>
  </View></AnimatedPressable>;
}

export function EmptyClosetState({ onPress }: { onPress: () => void }) {
  const { colors, radius } = useTheme();
  return <View style={[styles.empty, { borderRadius: radius.xl, backgroundColor: colors.primary }]}>
    <Ionicons name="shirt-outline" size={56} color={colors.textInverse} />
    <AppText variant="h1" color={colors.textInverse}>Tủ đồ của bạn đang chờ được làm mới</AppText>
    <AppText color={colors.textInverse}>Thêm món đầu tiên để AI giúp bạn tạo những bộ đồ mới.</AppText>
    <Button label="Thêm món đầu tiên" icon="add" variant="secondary" onPress={onPress} style={{ marginTop: 14, alignSelf: 'flex-start' }} />
  </View>;
}

const styles = StyleSheet.create({
  hero: { padding: 20, overflow: 'hidden', minHeight: 174, justifyContent: 'flex-end' }, heroTitle: { maxWidth: 280, marginVertical: 5 }, heroOrb: { position: 'absolute', right: -24, top: -30, width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(255,255,255,0.18)' },
  fabWrap: { position: 'absolute', right: 18, bottom: 108, zIndex: 20 }, fab: { minHeight: 54, borderRadius: 27, paddingHorizontal: 17, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 14, minHeight: 48 }, searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 15 },
  pill: { paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1 }, stat: { flex: 1, minWidth: '46%', padding: 12, gap: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4 }, cardWrap: { width: '48%' }, card: { height: 230, overflow: 'hidden', marginBottom: 13 }, cardImage: { width: '100%', height: '100%' }, imageFallback: { backgroundColor: '#F5F0E8', alignItems: 'center', justifyContent: 'center', gap: 6 }, cardOverlay: { backgroundColor: '#1A1208', opacity: 0.58 }, cardTop: { position: 'absolute', top: 9, left: 9, right: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, cardBottom: { position: 'absolute', left: 10, right: 10, bottom: 10, gap: 3 }, empty: { padding: 22, gap: 8, marginTop: 8 },
});
