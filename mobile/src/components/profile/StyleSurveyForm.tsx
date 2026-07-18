import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { StylePreferences, User } from '@/models';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { layout, rounded, useTheme } from '@/theme';

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
    <Pressable onPress={onPress} style={[styles.chip, { borderRadius: rounded.full, borderColor: selected ? colors.primary : colors.sand, backgroundColor: selected ? colors.sand : colors.surface }]}>
      {swatch ? <View style={[styles.swatch, { backgroundColor: swatch, borderColor: colors.border }]} /> : null}
      <AppText variant="label" color={colors.primary}>{label}</AppText>
    </Pressable>
  );
}

/** Editorial swatch tile per Stitch bước 2: rounded square + label below. */
function SwatchTile({ label, hex, selected, onPress }: { label: string; hex: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.swatchTile}>
      <View
        style={[
          styles.swatchBlock,
          { backgroundColor: hex, borderRadius: rounded.lg, borderColor: selected ? colors.primary : colors.border, borderWidth: selected ? 2 : 1 },
        ]}
      >
        {selected ? <Ionicons name="checkmark" size={18} color={hex === '#FFFFFF' || hex === '#DCCAB0' ? colors.primary : colors.textInverse} /> : null}
      </View>
      <AppText variant="bodySmall" color={colors.textSecondary} style={styles.swatchLabel}>{label}</AppText>
    </Pressable>
  );
}

/** Style option as an editorial photo card per Stitch bước 1 (2-col grid). */
function StyleCard({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.styleCard}>
      {/* placeholder — pending real asset, see docs/OPEN_ITEMS_assets_pending.md (Style Survey b1, 3:4 per style) */}
      <View
        style={[
          styles.styleThumb,
          { backgroundColor: colors.sand, borderRadius: rounded.DEFAULT, borderColor: selected ? colors.primary : 'transparent', borderWidth: selected ? 2 : 0 },
        ]}
      >
        {selected ? (
          <View style={[styles.styleCheck, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={14} color={colors.textInverse} />
          </View>
        ) : null}
      </View>
      <AppText variant="label" color={colors.primary} style={styles.styleCardLabel}>{label}</AppText>
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
  const { colors, typeScale } = useTheme();
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

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top progress bar — Stitch survey chrome (thin, Espresso fill on a light track). */}
      <View style={[styles.progress, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
      </View>

      <View style={styles.header}>
        {step > 0 ? (
          <Pressable accessibilityLabel="Quay lại" hitSlop={8} onPress={() => setStep((s) => Math.max(0, s - 1))}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>
        ) : <View style={styles.headerSpacer} />}
        <AppText variant="caption" color={colors.warmGray}>{mode === 'initial' ? 'CÁ NHÂN HÓA' : 'HỒ SƠ PHONG CÁCH'}</AppText>
        <Pressable onPress={() => { void skip(); }} disabled={saving} hitSlop={8}>
          <AppText variant="label" color={colors.warmGray}>Bỏ qua</AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Per-step editorial hero at the Stitch aspect ratio. */}
        {step === 1 ? (
          // placeholder — pending real asset, see docs/OPEN_ITEMS_assets_pending.md (Style Survey b2 colors, 16:9)
          <View style={[styles.hero169, { backgroundColor: colors.sand, borderRadius: rounded.lg }]} />
        ) : null}
        {step === 3 ? (
          // placeholder — pending real asset, see docs/OPEN_ITEMS_assets_pending.md (Style Survey b4 confidence, 4:5)
          <View style={[styles.hero45, { backgroundColor: colors.sand, borderRadius: rounded.lg }]} />
        ) : null}

        <AppText style={[typeScale.headlineMd, styles.title, { color: colors.primary }]}>{steps[step].title}</AppText>
        <AppText variant="bodySmall" color={colors.textSecondary} style={styles.helper}>{steps[step].helper}</AppText>

        {step === 0 ? (
          <View style={styles.cardGrid}>
            {STYLE_OPTIONS.map((item) => (
              <StyleCard key={item} label={item} selected={prefs.preferredStyles.includes(item)} onPress={() => setPrefs((p) => ({ ...p, preferredStyles: toggle(p.preferredStyles, item) }))} />
            ))}
          </View>
        ) : null}
        {step === 1 ? (
          <View style={styles.swatchGrid}>
            {COLOR_OPTIONS.map((item) => (
              <SwatchTile key={item} label={item} hex={COLOR_SWATCHES[item]} selected={prefs.favoriteColors.includes(item)} onPress={() => setPrefs((p) => ({ ...p, favoriteColors: toggle(p.favoriteColors, item, 5) }))} />
            ))}
          </View>
        ) : null}
        {step === 2 ? (
          <View style={styles.grid}>
            {OCCASION_OPTIONS.map((item) => (
              <Chip key={item} label={item} selected={prefs.lifestyleOccasions.includes(item)} onPress={() => setPrefs((p) => ({ ...p, lifestyleOccasions: toggle(p.lifestyleOccasions, item) }))} />
            ))}
          </View>
        ) : null}
        {step === 3 ? (
          <View style={styles.options}>
            {CONFIDENCE_OPTIONS.map(([value, label]) => (
              <Pressable key={value} onPress={() => setPrefs((p) => ({ ...p, fashionConfidence: value }))} style={[styles.option, { borderRadius: rounded.DEFAULT, borderColor: prefs.fashionConfidence === value ? colors.primary : colors.sand, backgroundColor: prefs.fashionConfidence === value ? colors.sand : colors.surface }]}>
                <AppText variant="body" color={colors.primary}>{label}</AppText>
              </Pressable>
            ))}
          </View>
        ) : null}
        {step === 4 ? (
          <View style={styles.metaBlock}>
            <AppText variant="h3">Giới tính</AppText>
            <View style={styles.grid}>{GENDER_OPTIONS.map((item) => <Chip key={item} label={item} selected={prefs.gender === item} onPress={() => setPrefs((p) => ({ ...p, gender: item }))} />)}</View>
            <AppText variant="h3">Nhóm tuổi</AppText>
            <View style={styles.grid}>{AGE_OPTIONS.map((item) => <Chip key={item} label={item} selected={prefs.ageGroup === item} onPress={() => setPrefs((p) => ({ ...p, ageGroup: item }))} />)}</View>
          </View>
        ) : null}

        <View style={[styles.completion, { backgroundColor: colors.surface, borderColor: colors.sand, borderRadius: rounded.DEFAULT }]}>
          <View style={styles.percentRow}>
            <AppText variant="h3">Hoàn thiện hồ sơ phong cách</AppText>
            <AppText variant="h3" color={colors.primary}>{percent}%</AppText>
          </View>
          <AppText variant="bodySmall" muted style={styles.completionHelp}>+5 lượt AI gợi ý khi hoàn thành hồ sơ nâng cao. Phần thưởng sẽ được xử lý bởi hệ thống quota.</AppText>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Button label="Quay lại" variant="secondary" disabled={step === 0 || saving} onPress={() => setStep((s) => Math.max(0, s - 1))} style={styles.footerBack} />
        <Button label={step === steps.length - 1 ? (saving ? 'Đang lưu...' : 'Hoàn tất hồ sơ phong cách') : 'Tiếp tục'} large disabled={saving} onPress={() => { if (step === steps.length - 1) void save(false); else setStep((s) => s + 1); }} style={styles.footerNext} />
      </View>
    </View>
  );
}

export const calculateStyleProfileCompletion = percentFor;

const styles = StyleSheet.create({
  root: { flex: 1 },
  progress: { height: 3, width: '100%' },
  progressFill: { height: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.marginMobile, paddingTop: 20, paddingBottom: layout.stackSm },
  headerSpacer: { width: 24 },
  scroll: { paddingHorizontal: layout.marginMobile, paddingBottom: layout.stackMd },
  hero169: { width: '100%', aspectRatio: 16 / 9, marginBottom: layout.stackMd, overflow: 'hidden' },
  hero45: { width: '100%', aspectRatio: 4 / 5, marginBottom: layout.stackMd, overflow: 'hidden' },
  title: { marginTop: layout.unit },
  helper: { marginTop: layout.unit, marginBottom: layout.stackMd },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 4 },
  chip: { minHeight: 38, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
  swatch: { width: 16, height: 16, borderRadius: rounded.full, borderWidth: 1 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: layout.stackMd },
  styleCard: { width: '47%' },
  styleThumb: { width: '100%', aspectRatio: 3 / 4, alignItems: 'flex-end', padding: 8 },
  styleCheck: { width: 22, height: 22, borderRadius: rounded.full, alignItems: 'center', justifyContent: 'center' },
  styleCardLabel: { textAlign: 'center', marginTop: 8 },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: layout.stackMd },
  swatchTile: { width: '22%', alignItems: 'center' },
  swatchBlock: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  swatchLabel: { textAlign: 'center', marginTop: 6 },
  options: { gap: 10, marginTop: 4 },
  option: { borderWidth: 1, padding: 14 },
  metaBlock: { gap: 14, marginTop: 4 },
  completion: { borderWidth: 1, padding: 16, marginTop: layout.stackLg },
  percentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  completionHelp: { marginTop: 4 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: layout.marginMobile, paddingTop: layout.stackSm, paddingBottom: 32 },
  footerBack: { flex: 1 },
  footerNext: { flex: 1.4 },
});
