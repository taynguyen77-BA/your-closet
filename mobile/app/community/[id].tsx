import { useLocalSearchParams } from 'expo-router';
import { Alert, Modal, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { AppText } from '@/components/ui/AppText';
import { PLATFORM_FEE_RATE } from '@/constants/membership';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/authStore';

export default function CommunityDetailScreen() {
  const { id, source, recommendationId } = useLocalSearchParams<{ id: string; source?: string; recommendationId?: string }>();
  const { colors, gradients, spacing, radius } = useTheme();
  const listing = useAppStore((s) => s.communityListings.find((l) => l.id === id));
  const user = useAppStore((s) => s.user);
  const sendMarketplaceMessage = useAppStore((s) => s.sendMarketplaceMessage);
  const createTradeOffer = useAppStore((s) => s.createTradeOffer);
  const createListingReport = useAppStore((s) => s.createListingReport);
  const createTransaction = useAppStore((s) => s.createTransaction);
  const [flow, setFlow] = useState<'message' | 'trade' | 'buy' | 'report' | null>(null);
  const [text, setText] = useState('');
  const isOwn = listing?.userId === user.id;
  const canInteract = listing?.status === 'approved' && !isOwn;

  if (!listing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText>Không tìm thấy tin đăng</AppText>
      </View>
    );
  }

  const fee = listing.price ? Math.round(listing.price * PLATFORM_FEE_RATE) : 0;
  const complete = async () => {
    if (flow !== 'report' && !useAuthStore.getState().requireAccount()) return;
    if (!flow) return;
    const createdAt = new Date().toISOString();
    try {
      if (flow === 'message') await sendMarketplaceMessage({ listingId: listing.id, senderId: user.id, sellerId: listing.userId, body: text.trim(), createdAt });
      if (flow === 'trade') await createTradeOffer({ listingId: listing.id, buyerId: user.id, sellerId: listing.userId, message: text.trim(), status: 'pending', createdAt });
      if (flow === 'report') await createListingReport({ listingId: listing.id, reporterId: user.id, reason: text.trim(), createdAt });
      if (flow === 'buy') await createTransaction({ listingId: listing.id, buyerId: user.id, sellerId: listing.userId, amount: listing.price ?? 0, platformFeePercentage: PLATFORM_FEE_RATE * 100, platformFee: fee, status: 'pending', source: source === 'ai_stylist' ? 'ai_stylist' : 'community', recommendationId, createdAt });
      Alert.alert('Đã ghi nhận', flow === 'report' ? 'Báo cáo đã được gửi để kiểm duyệt.' : flow === 'buy' ? 'Đơn hàng đã tạo. Trạng thái hiện tại: chờ thanh toán.' : 'Yêu cầu đã được gửi tới người bán.');
      setText(''); setFlow(null);
    } catch { Alert.alert('Chưa thể gửi', 'Kiểm tra kết nối rồi thử lại.'); }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={[styles.heroWrap, { borderRadius: radius.xl }]}><SafeImage source={{ uri: listing.imageUrls[0] }} style={styles.hero} fallbackLabel="ẢNH MÓN ĐỒ" /><View style={[styles.photoCount, { backgroundColor: colors.surfaceGlass }]}><AppText variant="caption">1 / {listing.imageUrls.length}</AppText></View></View>
      <AppText variant="h1" style={{ marginTop: spacing.lg }}>
        {listing.title}
      </AppText>
      <AppText variant="body" muted>
        {listing.description}
      </AppText>
      <View style={styles.chips}>{[listing.listingType === 'sale' ? 'Đang bán' : listing.listingType === 'trade' ? 'Sẵn sàng trao đổi' : 'Tặng miễn phí', `Cỡ ${listing.size ?? 'Chưa rõ'}`, listing.condition, listing.location].map((chip) => <View key={chip} style={[styles.chip, { backgroundColor: colors.lavender }]}><AppText variant="caption">{chip}</AppText></View>)}</View>
      {listing.price ? (
        <AppText variant="h2" style={{ marginTop: spacing.md }}>
          {listing.price.toLocaleString('vi-VN')}đ
        </AppText>
      ) : null}
      {fee > 0 && (
        <AppText variant="bodySmall" muted>
          Phí nền tảng 10%: {fee.toLocaleString('vi-VN')}đ
        </AppText>
      )}
      <View style={[styles.seller, { backgroundColor: colors.surface, borderRadius: radius.xl }]}>
        <SafeImage source={{ uri: listing.sellerAvatarUrl ?? user.avatarUrl }} style={styles.avatar} />
        <View style={{ flex: 1 }}><AppText variant="h3">{listing.sellerName}</AppText><AppText variant="bodySmall" muted>Seller · phản hồi nhanh trong ngày</AppText></View>
        <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
      </View>
      {!canInteract ? <View style={[styles.notice, { backgroundColor: colors.lemon, borderRadius: radius.lg }]}><AppText variant="label">{isOwn ? 'Đây là tin đăng của bạn' : 'Tin đăng chưa sẵn sàng giao dịch'}</AppText><AppText variant="bodySmall" muted>{isOwn ? 'Bạn có thể theo dõi kiểm duyệt trong Tin đăng của tôi.' : 'Chỉ tin đăng đã duyệt mới có thể nhắn tin, trao đổi hoặc mua.'}</AppText></View> : null}
      <View style={styles.actions}>
        <Button label="Message" variant="secondary" icon="chatbubble-outline" disabled={!canInteract} onPress={() => setFlow('message')} style={{ flex: 1, marginRight: 8 }} />
        <Button label="Trade" variant="ghost" icon="swap-horizontal-outline" disabled={!canInteract} onPress={() => setFlow('trade')} style={{ flex: 1, marginRight: 8 }} />
        {listing.listingType === 'sale' && (
          <Button label="Buy now" disabled={!canInteract} onPress={() => setFlow('buy')} style={{ flex: 1 }} />
        )}
      </View>
      <LinearGradient colors={gradients.marketplace} style={[styles.safety, { borderRadius: radius.lg }]}>
        <AppText variant="label" color={colors.textInverse}>Giao dịch an toàn</AppText>
        <AppText variant="bodySmall" muted>Giữ trao đổi trong ứng dụng. Không chuyển tiền ngoài luồng hoặc chia sẻ mã xác thực. Gặp trực tiếp ở nơi công cộng khi trao đổi.</AppText>
      </LinearGradient>
      <Button label="Báo cáo" variant="ghost" small onPress={() => setFlow('report')} style={{ marginTop: spacing.md }} />
      <Modal visible={flow !== null} transparent animationType="slide">
        <View style={styles.overlay}><View style={[styles.modal, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
          <AppText variant="h2">{flow === 'message' ? 'Nhắn tin người bán' : flow === 'trade' ? 'Đề nghị trao đổi' : flow === 'buy' ? 'Xác nhận mua' : 'Báo cáo tin đăng'}</AppText>
          <AppText variant="bodySmall" muted style={{ marginVertical: spacing.sm }}>
            {flow === 'buy' ? `Tổng dự kiến: ${((listing.price ?? 0) + fee).toLocaleString('vi-VN')}đ. Thanh toán sẽ được xác nhận với người bán.` : 'Nhập nội dung để gửi yêu cầu.'}
          </AppText>
          {flow !== 'buy' ? <TextInput value={text} onChangeText={setText} multiline placeholder="Nội dung" style={[styles.input, { backgroundColor: colors.beige }]} /> : null}
          <Button label={flow === 'report' ? 'Gửi báo cáo' : flow === 'buy' ? 'Tạo đơn hàng' : 'Gửi yêu cầu'} onPress={() => void complete()} disabled={flow !== 'buy' && !text.trim()} />
          <Button label="Hủy" variant="ghost" onPress={() => setFlow(null)} style={{ marginTop: 8 }} />
        </View></View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heroWrap: { overflow: 'hidden' },
  hero: { width: '100%', height: 390 },
  photoCount: { position: 'absolute', right: 12, bottom: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 99 },
  seller: { flexDirection: 'row', alignItems: 'center', padding: 13, marginTop: 18 },
  avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 10 },
  notice: { padding: 12, marginTop: 14 },
  actions: { flexDirection: 'row', marginTop: 24 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0006' },
  modal: { padding: 20 },
  input: { minHeight: 90, padding: 12, marginBottom: 12 },
  safety: { padding: 12, marginTop: 20 },
});
