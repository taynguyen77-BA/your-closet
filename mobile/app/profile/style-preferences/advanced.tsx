import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { AdvancedStylePreferences, User } from '@/models';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { COLOR_OPTIONS, STYLE_OPTIONS, calculateStyleProfileCompletion } from '@/components/profile/StyleSurveyForm';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme';

const BODY_SHAPES = ['Không muốn tiết lộ', 'Rectangle', 'Triangle', 'Inverted Triangle', 'Oval', 'Hourglass', 'Pear', 'Apple'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const BRANDS = ['Uniqlo', 'Zara', 'H&M', 'Nike', 'Adidas', 'Mango', 'Routine', 'Coolmate', 'Local Brand', 'Luxury Brand'];
const BUDGETS = ['Tiết kiệm', 'Trung bình', 'Cao cấp', 'Luxury'];
const FITS = ['Slim fit', 'Regular fit', 'Oversized', 'Relaxed'];

function toggle(list: string[] = [], item: string) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors, radius } = useTheme();
  return <Pressable onPress={onPress} style={[styles.chip, { borderRadius: radius.full, borderColor: selected ? colors.accentDark : colors.border, backgroundColor: selected ? colors.lavender : colors.surface }]}><AppText variant="label" color={selected ? colors.accentDark : colors.text}>{label}</AppText></Pressable>;
}

function Field({ label, value, onChangeText, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'numeric' }) {
  const { colors, radius } = useTheme();
  return <View style={{ flex: 1, minWidth: 120 }}><AppText variant="caption" muted>{label}</AppText><TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg, color: colors.text }]} /></View>;
}

export default function AdvancedStylePreferencesScreen() {
  const { colors, spacing } = useTheme();
  const { currentUser, updateProfile, authError } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [advanced, setAdvanced] = useState<AdvancedStylePreferences>({ ...(currentUser?.advancedStylePreferences ?? {}) });
  const set = (patch: Partial<AdvancedStylePreferences>) => setAdvanced((value) => ({ ...value, ...patch }));
  const save = async () => {
    setSaving(true);
    const cleaned: AdvancedStylePreferences = {
      ...advanced,
      heightCm: advanced.heightCm ? Number(advanced.heightCm) : undefined,
      weightKg: advanced.weightKg ? Number(advanced.weightKg) : undefined,
      updatedAt: new Date().toISOString(),
    };
    const styleProfileCompletionPercent = calculateStyleProfileCompletion(currentUser?.stylePreferences ?? { preferredStyles: [], favoriteColors: [], lifestyleOccasions: [], fashionConfidence: '' }, true);
    await updateProfile({ advancedStylePreferences: cleaned, styleProfileCompletionPercent } as Partial<User>);
    setSaving(false);
  };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <AppText variant="display">Hồ sơ phong cách nâng cao</AppText>
      <AppText muted style={{ marginTop: 6 }}>Không bắt buộc. Dữ liệu này giúp AI hiểu fit, ngân sách và thương hiệu bạn thích.</AppText>
      <GlassCard style={{ marginTop: spacing.lg }}>
        <AppText variant="h3">Dáng người</AppText>
        <View style={styles.grid}>{BODY_SHAPES.map((item) => <Chip key={item} label={item} selected={advanced.bodyShape === item} onPress={() => set({ bodyShape: item })} />)}</View>
        <View style={[styles.row, { marginTop: spacing.lg }]}>
          <Field label="Chiều cao (cm)" value={advanced.heightCm ? String(advanced.heightCm) : ''} keyboardType="numeric" onChangeText={(value) => set({ heightCm: value ? Number(value) : undefined })} />
          <Field label="Cân nặng (kg)" value={advanced.weightKg ? String(advanced.weightKg) : ''} keyboardType="numeric" onChangeText={(value) => set({ weightKg: value ? Number(value) : undefined })} />
          <Field label="Size giày" value={advanced.shoeSize ?? ''} onChangeText={(value) => set({ shoeSize: value })} />
        </View>
      </GlassCard>
      <GlassCard style={{ marginTop: spacing.md }}>
        <AppText variant="h3">Size và fit</AppText>
        <AppText variant="caption" muted style={{ marginTop: 10 }}>Áo</AppText>
        <View style={styles.grid}>{SIZES.map((item) => <Chip key={`top-${item}`} label={item} selected={advanced.topSize === item} onPress={() => set({ topSize: item })} />)}</View>
        <AppText variant="caption" muted style={{ marginTop: 14 }}>Quần / váy</AppText>
        <View style={styles.grid}>{SIZES.map((item) => <Chip key={`bottom-${item}`} label={item} selected={advanced.bottomSize === item} onPress={() => set({ bottomSize: item })} />)}</View>
        <AppText variant="caption" muted style={{ marginTop: 14 }}>Form yêu thích</AppText>
        <View style={styles.grid}>{FITS.map((item) => <Chip key={item} label={item} selected={advanced.fitPreference === item} onPress={() => set({ fitPreference: item })} />)}</View>
      </GlassCard>
      <GlassCard style={{ marginTop: spacing.md }}>
        <AppText variant="h3">Thương hiệu và ngân sách</AppText>
        <View style={styles.grid}>{BRANDS.map((item) => <Chip key={item} label={item} selected={advanced.favoriteBrands?.includes(item) ?? false} onPress={() => set({ favoriteBrands: toggle(advanced.favoriteBrands, item) })} />)}</View>
        <AppText variant="caption" muted style={{ marginTop: 14 }}>Ngân sách</AppText>
        <View style={styles.grid}>{BUDGETS.map((item) => <Chip key={item} label={item} selected={advanced.budgetLevel === item} onPress={() => set({ budgetLevel: item })} />)}</View>
      </GlassCard>
      <GlassCard style={{ marginTop: spacing.md }}>
        <AppText variant="h3">Điều muốn tránh</AppText>
        <AppText variant="caption" muted style={{ marginTop: 10 }}>Phong cách muốn tránh</AppText>
        <View style={styles.grid}>{STYLE_OPTIONS.map((item) => <Chip key={item} label={item} selected={advanced.avoidStyles?.includes(item) ?? false} onPress={() => set({ avoidStyles: toggle(advanced.avoidStyles, item) })} />)}</View>
        <AppText variant="caption" muted style={{ marginTop: 14 }}>Màu không thích</AppText>
        <View style={styles.grid}>{COLOR_OPTIONS.map((item) => <Chip key={item} label={item} selected={advanced.dislikedColors?.includes(item) ?? false} onPress={() => set({ dislikedColors: toggle(advanced.dislikedColors, item) })} />)}</View>
      </GlassCard>
      {authError ? <AppText variant="bodySmall" muted style={{ marginTop: spacing.md }}>{authError}</AppText> : null}
      <Button label={saving ? 'Đang lưu...' : 'Lưu hồ sơ nâng cao'} disabled={saving} onPress={() => { void save(); }} style={{ marginTop: spacing.lg }} />
      <AppText variant="bodySmall" muted style={{ marginTop: spacing.sm }}>+5 lượt AI gợi ý khi hoàn thành hồ sơ nâng cao. Phần thưởng sẽ được xử lý bởi hệ thống quota.</AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 12 },
  chip: { minHeight: 38, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9, justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  input: { borderWidth: 1, minHeight: 44, paddingHorizontal: 12, marginTop: 6 },
});
