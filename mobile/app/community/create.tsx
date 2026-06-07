import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/authStore';

const purposes = [['sale', 'Bán', 'pricetag'], ['trade', 'Trao đổi', 'swap-horizontal'], ['giveaway', 'Tặng', 'gift']] as const;
const conditions = [['new', 'Mới'], ['like_new', 'Like new'], ['good', 'Tốt'], ['fair', 'Đã dùng']] as const;

export default function CreateListingScreen() {
  const { itemId, type } = useLocalSearchParams<{ itemId?: string; type?: 'sale' | 'trade' | 'giveaway' }>();
  const router = useRouter();
  const { colors, gradients, spacing, radius } = useTheme();
  const { clothing, user, createListing } = useAppStore();
  const [step, setStep] = useState(1);
  const [selectedId, setSelectedId] = useState(itemId);
  const [listingType, setListingType] = useState<'sale' | 'trade' | 'giveaway'>(type ?? 'sale');
  const [title, setTitle] = useState(''); const [description, setDescription] = useState('');
  const [price, setPrice] = useState(''); const [condition, setCondition] = useState<'new' | 'like_new' | 'good' | 'fair'>('like_new');
  const [size, setSize] = useState(''); const [gender, setGender] = useState('Unisex'); const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const item = clothing.find((value) => value.id === selectedId);
  const validDetails = title.trim() && description.trim() && size.trim() && gender.trim() && location.trim() && (listingType !== 'sale' || Number(price) > 0);
  const next = () => {
    if (step === 1 && !item) return Alert.alert('Chọn một món đồ', 'Tin đăng cần bắt đầu từ một món trong tủ của bạn.');
    if (step === 3 && !validDetails) return Alert.alert('Thêm một chút nữa nhé', 'Điền đủ tiêu đề, mô tả, size, phong cách, địa điểm và giá bán hợp lệ.');
    setStep(Math.min(5, step + 1));
  };
  const submit = async () => {
    if (!useAuthStore.getState().requireAccount()) return;
    if (!item || !validDetails) return;
    setSaving(true);
    try {
      await createListing({ userId: user.id, sellerName: user.username, sellerAvatarUrl: user.avatarUrl, clothingItemId: item.id, title: title.trim(), description: description.trim(), imageUrls: [item.imageUrl], condition, conditionScore: condition === 'new' ? 1 : condition === 'like_new' ? 0.92 : condition === 'good' ? 0.76 : 0.54, listingType, type: item.type, category: item.type, color: item.color, styleTags: [item.style, ...item.tags].filter(Boolean) as string[], material: item.material, price: listingType === 'sale' ? Number(price) : undefined, size: size.trim(), gender: gender.trim(), location: location.trim(), tags: item.tags, status: 'pending_review', reportsCount: 0, createdAt: new Date().toISOString() });
      setStep(5);
    } catch { Alert.alert('Không thể lưu', 'Kiểm tra kết nối rồi thử lại.'); }
    finally { setSaving(false); }
  };
  const input = [styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, borderRadius: radius.lg }];
  return <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
    <LinearGradient colors={gradients.community} style={[styles.header, { borderRadius: radius.xl }]}><AppText variant="caption" color={colors.textInverse}>PASS IT FORWARD</AppText><AppText variant="h1" color={colors.textInverse}>Đăng món theo vibe của bạn</AppText><AppText variant="bodySmall" color={colors.textInverse}>Nhanh, rõ ràng, và luôn qua kiểm duyệt.</AppText></LinearGradient>
    <View style={styles.progress}>{['Chọn đồ', 'Mục đích', 'Chi tiết', 'Preview', 'Xong'].map((label, index) => <View key={label} style={styles.progressItem}><View style={[styles.dot, { backgroundColor: step >= index + 1 ? colors.community : colors.warmGray }]}><AppText variant="caption" color={step >= index + 1 ? colors.textInverse : colors.textMuted}>{index + 1}</AppText></View><AppText variant="caption" muted>{label}</AppText></View>)}</View>
    {step === 1 && <><AppText variant="h2">Chọn món từ tủ đồ</AppText><AppText variant="bodySmall" muted style={styles.help}>Ảnh đẹp sẵn rồi, bạn chỉ cần chọn món muốn chuyển lại.</AppText><View style={styles.grid}>{clothing.map((value) => <Pressable key={value.id} onPress={() => setSelectedId(value.id)} style={[styles.item, { borderColor: selectedId === value.id ? colors.community : colors.border, borderRadius: radius.lg }]}><SafeImage source={{ uri: value.imageUrl }} style={styles.itemImage} fallbackLabel="ẢNH MÓN ĐỒ" /><AppText variant="label" numberOfLines={1} style={{ padding: 8 }}>{value.name}</AppText></Pressable>)}</View></>}
    {step === 2 && <><AppText variant="h2">Bạn muốn làm gì?</AppText><AppText variant="bodySmall" muted style={styles.help}>Chọn mục tiêu để người xem hiểu ngay.</AppText>{purposes.map(([value, label]) => <Pressable key={value} onPress={() => setListingType(value)} style={[styles.choice, { backgroundColor: listingType === value ? colors.lavender : colors.surface, borderColor: listingType === value ? colors.secondary : colors.border, borderRadius: radius.lg }]}><AppText variant="h3">{label}</AppText><AppText variant="bodySmall" muted>{value === 'sale' ? 'Đặt giá và tìm chủ mới cho món đồ.' : value === 'trade' ? 'Đổi lấy một món hợp vibe hơn.' : 'Trao món đồ cho người đang cần.'}</AppText></Pressable>)}</>}
    {step === 3 && <><AppText variant="h2">Kể một chút về món đồ</AppText><AppText variant="bodySmall" muted style={styles.help}>Thông tin rõ giúp món của bạn được chốt nhanh hơn.</AppText><TextInput placeholder="Tên món đồ" placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle} style={input} /><TextInput placeholder="Điểm hay, tình trạng thực tế..." placeholderTextColor={colors.textMuted} value={description} onChangeText={setDescription} multiline style={[input, { minHeight: 84 }]} />{listingType === 'sale' ? <TextInput placeholder="Giá bán (VND)" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={price} onChangeText={setPrice} style={input} /> : null}<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>{conditions.map(([value, label]) => <Pressable key={value} onPress={() => setCondition(value)} style={[styles.pill, { backgroundColor: condition === value ? colors.mint : colors.surface, borderColor: colors.border }]}><AppText variant="label">{label}</AppText></Pressable>)}</ScrollView><TextInput placeholder="Size: M, 38, Freesize..." placeholderTextColor={colors.textMuted} value={size} onChangeText={setSize} style={input} /><TextInput placeholder="Style / giới tính" placeholderTextColor={colors.textMuted} value={gender} onChangeText={setGender} style={input} /><TextInput placeholder="Địa điểm" placeholderTextColor={colors.textMuted} value={location} onChangeText={setLocation} style={input} /></>}
    {step === 4 && item && <><AppText variant="h2">Xem trước tin đăng</AppText><View style={[styles.preview, { backgroundColor: colors.surface, borderRadius: radius.xl }]}><SafeImage source={{ uri: item.imageUrl }} style={styles.previewImage} fallbackLabel="ẢNH MÓN ĐỒ" /><View style={{ padding: 14 }}><AppText variant="h2">{title}</AppText><AppText variant="h1" color={colors.community}>{listingType === 'sale' ? `${Number(price).toLocaleString('vi-VN')}đ` : listingType === 'trade' ? 'Sẵn sàng trao đổi' : 'Tặng miễn phí'}</AppText><AppText variant="bodySmall" muted>{size} · {condition} · {location}</AppText><AppText style={{ marginTop: 10 }}>{description}</AppText></View></View></>}
    {step === 5 && <LinearGradient colors={gradients.marketplace} style={[styles.done, { borderRadius: radius.xl }]}><AppText variant="display" color={colors.textInverse}>Đã gửi duyệt!</AppText><AppText color={colors.textInverse}>Món của bạn đã nằm trong Tin đăng của tôi với trạng thái Chờ duyệt.</AppText><Button label="Xem tin đăng của tôi" variant="secondary" onPress={() => router.replace('/community?filter=mine')} style={{ marginTop: 16 }} /><Button label="Về cộng đồng" variant="ghost" onPress={() => router.replace('/(tabs)/community' as never)} style={{ marginTop: 8 }} /></LinearGradient>}
    {step < 5 ? <View style={styles.footer}>{step > 1 ? <Button label="Quay lại" variant="ghost" onPress={() => setStep(step - 1)} style={{ marginRight: 8 }} /> : null}<Button label={step === 4 ? saving ? 'Đang đăng...' : 'Gửi duyệt' : 'Tiếp tục'} variant="community" onPress={step === 4 ? () => void submit() : next} disabled={saving} style={{ flex: 1 }} /></View> : null}
  </ScrollView>;
}
const styles = StyleSheet.create({ header: { padding: 18 }, progress: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 }, progressItem: { alignItems: 'center', gap: 4 }, dot: { width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, help: { marginBottom: 14 }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, item: { width: '48.5%', overflow: 'hidden', borderWidth: 2, marginBottom: 10 }, itemImage: { height: 150, width: '100%' }, choice: { padding: 16, borderWidth: 1.5, marginBottom: 10 }, input: { padding: 13, borderWidth: 1, marginBottom: 9 }, pill: { paddingHorizontal: 14, paddingVertical: 9, marginRight: 8, borderRadius: 99, borderWidth: 1 }, preview: { overflow: 'hidden' }, previewImage: { height: 330, width: '100%' }, done: { padding: 22 }, footer: { flexDirection: 'row', marginTop: 18 } });
