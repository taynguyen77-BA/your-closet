import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { ReactNode, useEffect } from 'react';
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
  const { gradients, radius, colors } = useTheme();
  return <Animated.View entering={FadeInDown.duration(420)}><LinearGradient colors={gradients.hero} style={[styles.hero, { borderRadius: radius.xxl }]}>
    <AppText variant="caption" color={colors.textInverse}>{eyebrow}</AppText>
    <AppText variant="display" color={colors.textInverse} style={styles.heroTitle}>{title}</AppText>
    <AppText variant="body" color={colors.textInverse}>{subtitle}</AppText>
    <View style={styles.heroOrb} />
  </LinearGradient></Animated.View>;
}

export function FloatingActionButton({ onPress }: { onPress: () => void }) {
  const { gradients, colors } = useTheme();
  const lift = useSharedValue(0);
  useEffect(() => { lift.value = withRepeat(withSequence(withSpring(-4), withSpring(0)), -1, true); }, [lift]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  return <Animated.View style={[styles.fabWrap, style]}><Pressable onPress={onPress}><LinearGradient colors={gradients.primary} style={[styles.fab, { shadowColor: colors.primary }]}><Ionicons name="add" size={30} color="#fff" /></LinearGradient></Pressable></Animated.View>;
}

export function SearchBar({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  const { colors, radius } = useTheme();
  return <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.full }]}>
    <Ionicons name="search" size={19} color={colors.accentDark} />
    <TextInput value={value} onChangeText={onChangeText} placeholder="Search your closet..." placeholderTextColor={colors.textMuted} style={[styles.searchInput, { color: colors.text }]} />
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
  if (item.timesWorn === 0) return 'New';
  if (item.isFavorite) return 'Favorite';
  if (item.timesWorn < 3) return 'Rarely worn';
  if (item.timesWorn > 12) return 'Most worn';
  return null;
}

export function ClosetItemCard({ item, onPress, onFavorite }: { item: ClothingItem; onPress: () => void; onFavorite: () => void }) {
  const { colors, gradients, radius } = useTheme();
  return <AnimatedPressable onPress={onPress} style={styles.cardWrap}><View style={[styles.card, { borderRadius: radius.xl, backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" />
    <LinearGradient colors={['transparent', 'rgba(20,8,35,0.76)']} style={StyleSheet.absoluteFill} />
    <View style={styles.cardTop}><VibeBadge label={item.type} color="rgba(255,255,255,0.84)" /><Pressable onPress={onFavorite} hitSlop={12}><Ionicons name={item.isFavorite ? 'heart' : 'heart-outline'} size={22} color={item.isFavorite ? colors.electricPink : '#fff'} /></Pressable></View>
    <View style={styles.cardBottom}>{status(item) ? <VibeBadge label={status(item)!} color="rgba(255,255,255,0.84)" /> : null}<AppText variant="h3" color="#fff" numberOfLines={1}>{item.name}</AppText><AppText variant="bodySmall" color="#fff">{item.color} · {item.timesWorn} wears</AppText></View>
  </View></AnimatedPressable>;
}

export function EmptyClosetState({ onPress }: { onPress: () => void }) {
  const { colors, gradients, radius } = useTheme();
  return <LinearGradient colors={gradients.ai} style={[styles.empty, { borderRadius: radius.xxl }]}>
    <Ionicons name="shirt-outline" size={56} color={colors.textInverse} />
    <AppText variant="h1" color={colors.textInverse}>Your closet is ready for a glow-up</AppText>
    <AppText color={colors.textInverse}>Add a piece and let AI help you build fresh outfit energy.</AppText>
    <Button label="Add your first item" icon="add" variant="secondary" onPress={onPress} style={{ marginTop: 14, alignSelf: 'flex-start' }} />
  </LinearGradient>;
}

const styles = StyleSheet.create({
  hero: { padding: 20, overflow: 'hidden', minHeight: 174, justifyContent: 'flex-end' }, heroTitle: { maxWidth: 280, marginVertical: 5 }, heroOrb: { position: 'absolute', right: -24, top: -30, width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(255,255,255,0.18)' },
  fabWrap: { position: 'absolute', right: 20, bottom: 22, zIndex: 20 }, fab: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 14, minHeight: 48 }, searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 15 },
  pill: { paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1 }, stat: { flex: 1, minWidth: '46%', padding: 12, gap: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4 }, cardWrap: { width: '48%' }, card: { height: 230, overflow: 'hidden', marginBottom: 13, shadowOpacity: 0.15, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 3 }, cardImage: { width: '100%', height: '100%' }, cardTop: { position: 'absolute', top: 9, left: 9, right: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, cardBottom: { position: 'absolute', left: 10, right: 10, bottom: 10, gap: 3 }, empty: { padding: 22, gap: 8, marginTop: 8 },
});
