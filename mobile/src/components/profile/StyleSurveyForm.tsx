import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { StylePreferences, User } from '@/models';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { rounded, useTheme } from '@/theme';

export const STYLE_OPTIONS = ['Minimalist', 'Korean', 'Streetwear', 'Casual', 'Smart Casual', 'Office', 'Luxury', 'Vintage', 'Sporty', 'Y2K', 'Elegant', 'Feminine', 'Neutral', 'Trendy'];
export const COLOR_OPTIONS = ['Black', 'White', 'Beige', 'Brown', 'Grey', 'Navy', 'Blue', 'Green', 'Red', 'Pink', 'Purple', 'Yellow', 'Orange', 'Pastel'];
export const OCCASION_OPTIONS = ['Đi học', 'Đi làm', 'Cafe cuối tuần', 'Đi chơi', 'Hẹn hò', 'Du lịch', 'Tiệc', 'Tập gym', 'Công tác', 'Sự kiện', 'Ở nhà', 'Chụp ảnh / social post'];
export const CONFIDENCE_OPTIONS = [
  ['easy_basics', 'Tôi chỉ cần mặc gọn gàng, dễ phối'],
  ['better_everyday', 'Tôi muốn mặc đẹp hơn mỗi ngày'],
  ['explore_new_styles', 'Tôi thích thử nhiều phong cách mới'],
  ['fashion_focused', 'Tôi rất quan tâm thời trang'],
] as const;
const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác', 'Không muốn tiết lộ'];
const AGE_OPTIONS = ['<18', '18-24', '25-34', '35-44', '45+'];
const COLOR_SWATCHES: Record<string, string> = {
  Black: '#171717', White: '#FFFFFF', Beige: '#DCCAB0', Brown: '#8B5E3C', Grey: '#9CA3AF', Navy: '#1F3763',
  Blue: '#4F8FDB', Green: '#6DAA72', Red: '#D95757', Pink: '#F4A7B9', Purple: '#9B7BD8', Yellow: '#F1C75B',
  Orange: '#ED9455', Pastel: '#C9DDF8',
};

const emptyPreferences: StylePreferences = { preferredStyles: [], favoriteColors: [], lifestyleOccasions: [], fashionConfidence: '' };
const percentFor = (value: StylePreferences, hasAdvanced = false) => {
  const score = [
    value.preferredStyles.length > 0,
    value.favoriteColors.length > 0,
    value.lifestyleOccasions.length > 0,
    Boolean(value.fashionConfidence),
    Boolean(value.gender || value.ageGroup),
  ].filter(Boolean).length;
  return Math.min(100, score * 18 + (hasAdvanced ? 10 : 0));
};

function toggle(list: string[], item: string, max?: number) {
  if (list.includes(item)) return list.filter((value) => value !== item);
  if (max && list.length >= max) return list;
  return [...list, item];
}

function Chip({ label, selected, onPress, swatch }: { label: string; selected: boolean; onPress: () => void; swatch?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.chip, { borderRadius: rounded.full, borderColor: selected ? colors.accentDark : colors.border, backgroundColor: selected ? colors.lavender : colors.surface }]}>
      {swatch ? <View style={[styles.swatch, { backgroundColor: swatch, borderColor: colors.border }]} /> : null}
      <AppText variant="label" color={selected ? colors.accentDark : colors.text}>{label}</AppText>
    </Pressable>
  );
}

export function StyleSurveyForm({
  user,
  mode,
  onSave,
  onSkip,
}: {
  user?: User | null;
  mode: 'initial' | 'edit';
  onSave: (patch: Partial<User>) => Promise<void>;
  onSkip?: () => Promise<void>;
}) {
  const { colors, spacing } = useTheme();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<StylePreferences>({ ...emptyPreferences, ...(user?.stylePreferences ?? {}) });
  const percent = useMemo(() => percentFor(prefs, Boolean(user?.advancedStylePreferences)), [prefs, user?.advancedStylePreferences]);
  const steps = [
    { title: 'Bạn thích phong cách nào nhất?', helper: 'Chọn vài phong cách bạn thích để AI phối đồ hợp gu hơn.' },
    { title: 'Bạn thích mặc màu nào?', helper: 'Chọn tối đa 5 màu bạn hay mặc hoặc muốn mặc nhiều hơn.' },
    { title: 'Bạn thường cần phối đồ cho dịp nào?', helper: 'AI sẽ ưu tiên bối cảnh thật trong lịch sống của bạn.' },
    { title: 'Bạn muốn AI hỗ trợ theo cách nào?', helper: 'Một lựa chọn là đủ để gợi ý có đúng nhịp hơn.' },
    { title: 'Một chút thông tin để gợi ý chuẩn hơn', helper: 'Không bắt buộc. Bạn có thể chỉnh sửa sau trong Hồ sơ.' },
  ];
  const save = async (skip = false) => {
    setSaving(true);
    const completedAt = new Date().toISOString();
    await onSave({
      stylePreferences: { ...prefs, updatedAt: completedAt },
      hasCompletedStyleSurvey: true,
      styleSurveySkipped: skip,
      styleSurveyCompletedAt: completedAt,
      styleProfileCompletionPercent: skip ? Math.max(user?.styleProfileCompletionPercent ?? 0, percent) : percent,
    });
    setSaving(false);
  };
  const skip = async () => {
    if (onSkip) {
      setSaving(true);
      await onSkip();
      setSaving(false);
      return;
    }
    await save(true);
  };
  return (
    <LinearGradient colors={['#FFF7F7', '#F3F8FF', '#F8F2FF']} style={styles.root}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xl }}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color={colors.accentDark}>{mode === 'initial' ? 'CÁ NHÂN HÓA' : 'HỒ SƠ PHONG CÁCH'}</AppText>
            <AppText variant="display">Cùng cá nhân hoá tủ đồ của bạn</AppText>
          </View>
          <Pressable onPress={() => { void skip(); }} disabled={saving}><AppText muted>Bỏ qua</AppText></Pressable>
        </View>
        <View style={[styles.progress, { backgroundColor: colors.surface }]}><View style={[styles.progressFill, { width: `${((step + 1) / steps.length) * 100}%`, backgroundColor: colors.accent }]} /></View>
        <GlassCard style={{ marginTop: spacing.lg }}>
          <View style={[styles.iconBubble, { backgroundColor: colors.lavender, borderRadius: rounded.full }]}><Ionicons name="sparkles-outline" size={26} color={colors.accentDark} /></View>
          <AppText variant="h1">{steps[step].title}</AppText>
          <AppText muted style={{ marginTop: 6 }}>{steps[step].helper}</AppText>
          {step === 0 ? <View style={styles.grid}>{STYLE_OPTIONS.map((item) => <Chip key={item} label={item} selected={prefs.preferredStyles.includes(item)} onPress={() => setPrefs((p) => ({ ...p, preferredStyles: toggle(p.preferredStyles, item) }))} />)}</View> : null}
          {step === 1 ? <View style={styles.grid}>{COLOR_OPTIONS.map((item) => <Chip key={item} label={item} swatch={COLOR_SWATCHES[item]} selected={prefs.favoriteColors.includes(item)} onPress={() => setPrefs((p) => ({ ...p, favoriteColors: toggle(p.favoriteColors, item, 5) }))} />)}</View> : null}
          {step === 2 ? <View style={styles.grid}>{OCCASION_OPTIONS.map((item) => <Chip key={item} label={item} selected={prefs.lifestyleOccasions.includes(item)} onPress={() => setPrefs((p) => ({ ...p, lifestyleOccasions: toggle(p.lifestyleOccasions, item) }))} />)}</View> : null}
          {step === 3 ? <View style={{ gap: 10, marginTop: spacing.lg }}>{CONFIDENCE_OPTIONS.map(([value, label]) => <Pressable key={value} onPress={() => setPrefs((p) => ({ ...p, fashionConfidence: value }))} style={[styles.option, { borderRadius: rounded.DEFAULT, borderColor: prefs.fashionConfidence === value ? colors.accentDark : colors.border, backgroundColor: prefs.fashionConfidence === value ? colors.lavender : colors.surface }]}><AppText variant="body">{label}</AppText></Pressable>)}</View> : null}
          {step === 4 ? <View style={{ gap: 14, marginTop: spacing.lg }}><AppText variant="h3">Giới tính</AppText><View style={styles.grid}>{GENDER_OPTIONS.map((item) => <Chip key={item} label={item} selected={prefs.gender === item} onPress={() => setPrefs((p) => ({ ...p, gender: item }))} />)}</View><AppText variant="h3">Nhóm tuổi</AppText><View style={styles.grid}>{AGE_OPTIONS.map((item) => <Chip key={item} label={item} selected={prefs.ageGroup === item} onPress={() => setPrefs((p) => ({ ...p, ageGroup: item }))} />)}</View></View> : null}
        </GlassCard>
        <GlassCard style={{ marginTop: spacing.md, backgroundColor: colors.beige }}>
          <View style={styles.percentRow}><AppText variant="h3">Hoàn thiện hồ sơ phong cách</AppText><AppText variant="h3" color={colors.accentDark}>{percent}%</AppText></View>
          <AppText variant="bodySmall" muted style={{ marginTop: 4 }}>+5 lượt AI gợi ý khi hoàn thành hồ sơ nâng cao. Phần thưởng sẽ được xử lý bởi hệ thống quota.</AppText>
        </GlassCard>
        <View style={styles.actions}>
          <Button label="Quay lại" variant="secondary" disabled={step === 0 || saving} onPress={() => setStep((s) => Math.max(0, s - 1))} style={{ flex: 1 }} />
          <Button label={step === steps.length - 1 ? (saving ? 'Đang lưu...' : 'Hoàn tất hồ sơ phong cách') : 'Tiếp tục'} disabled={saving} onPress={() => { if (step === steps.length - 1) void save(false); else setStep((s) => s + 1); }} style={{ flex: 1.4 }} />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

export const calculateStyleProfileCompletion = percentFor;

const styles = StyleSheet.create({
  root: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  progress: { height: 7, borderRadius: rounded.full, overflow: 'hidden', marginTop: 18 },
  progressFill: { height: '100%' },
  iconBubble: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 16 },
  chip: { minHeight: 38, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
  swatch: { width: 16, height: 16, borderRadius: rounded.full, borderWidth: 1 },
  option: { borderWidth: 1, padding: 14 },
  percentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
});
