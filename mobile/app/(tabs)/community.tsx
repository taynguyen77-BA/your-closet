import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/theme';
import { FloatingActionButton } from '@/components/ui/FashionUi';
import { SafeImage } from '@/components/ui/SafeImage';
import type { CommunityListing } from '@/models';

type HubTab = 'feed' | 'challenges' | 'exchange' | 'marketplace' | 'mine';
const tabs: { id: HubTab; label: string }[] = [
  { id: 'feed', label: 'Bảng tin' }, { id: 'challenges', label: 'Thử thách' },
  { id: 'exchange', label: 'Trao đổi' }, { id: 'marketplace', label: 'Mua bán' }, { id: 'mine', label: 'Của tôi' },
];
const challenges = [
  ['7-Day Outfit Remix', 'Biến 7 món quen thành 7 look mới', '5/7 ngày', '680', '120 XP', '#D4B896'],
  ['No-buy Week', 'Mặc lại tủ đồ, không mua mới trong tuần', '3/7 ngày', '1.2K', '80 XP', '#D4B896'],
  ['Office Glow-up', 'Nâng vibe công sở bằng item sẵn có', '2/5 look', '426', '70 XP', '#D4B896'],
  ['Summer Color Pop', 'Thêm một màu nổi bật vào outfit', '1/3 look', '905', '60 XP', '#D4B896'],
];
const statusLabels = { pending_review: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Bị từ chối' };

export default function CommunityHubScreen() {
  const router = useRouter();
  const { colors, gradients, spacing, radius } = useTheme();
  const [active, setActive] = useState<HubTab>('feed');
  const [exchangeFilter, setExchangeFilter] = useState('Gần bạn');
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  const { communityListings: listings, trends, user } = useAppStore();
  const approved = listings.filter((item) => item.status === 'approved');
  const mine = listings.filter((item) => item.userId === user.id);
  const exchange = approved.filter((item) => item.listingType !== 'sale');
  const marketplace = approved.filter((item) => item.listingType === 'sale');

  const listingCard = (item: CommunityListing, showStatus = false) => (
    <Pressable key={item.id} onPress={() => router.push(`/community/${item.id}`)} style={[styles.product, { backgroundColor: colors.surface, borderRadius: radius.xl }]}>
      <SafeImage source={{ uri: item.imageUrls[0] }} style={styles.productImage} contentFit="cover" fallbackLabel="ẢNH MÓN ĐỒ" />
      <Pressable accessibilityLabel={`Lưu ${item.title}`} onPress={() => setSavedListingIds((ids) => ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id])} style={[styles.heart, { backgroundColor: colors.surfaceGlass }]}><Ionicons name={savedListingIds.includes(item.id) ? 'heart' : 'heart-outline'} size={17} color={colors.community} /></Pressable>
      <View style={styles.productInfo}>
        <AppText variant="label" numberOfLines={1}>{item.title}</AppText>
        <AppText variant="h3" color={item.price ? colors.community : colors.marketplace}>{item.price ? `${item.price.toLocaleString('vi-VN')}đ` : item.listingType === 'trade' ? 'Sẵn sàng trao đổi' : 'Tặng miễn phí'}</AppText>
        <AppText variant="bodySmall" muted>{item.size ?? 'Freesize'} · {item.location}</AppText>
        <View style={styles.seller}><SafeImage source={{ uri: item.sellerAvatarUrl ?? user.avatarUrl }} style={styles.miniAvatar} /><AppText variant="caption" muted>{item.sellerName}</AppText></View>
        {showStatus ? <View style={[styles.status, { backgroundColor: item.status === 'approved' ? colors.mint : item.status === 'rejected' ? colors.peach : colors.lemon }]}><AppText variant="caption">{statusLabels[item.status]}</AppText></View> : null}
      </View>
    </Pressable>
  );

  return (
    <Screen padded={false} bottomOffset={96}>
      <LinearGradient colors={gradients.community} style={[styles.hero, { borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl }]}>
        <AppText variant="caption" color={colors.textInverse}>CỘNG ĐỒNG PHONG CÁCH</AppText>
        <AppText variant="display" color={colors.textInverse}>Vòng tròn phong cách</AppText>
        <AppText variant="body" color={colors.textInverse}>Mix đồ, pass đồ, săn outfit cùng cộng đồng</AppText>
        <View style={styles.heroActions}>
          <Button label="Đăng outfit" small icon="camera-outline" variant="secondary" onPress={() => router.push('/community/create?intent=post')} style={{ marginRight: 8 }} />
          <Button label="Pass đồ ngay" small icon="pricetag-outline" variant="secondary" onPress={() => router.push('/community/create')} />
        </View>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsWrap} contentContainerStyle={[styles.tabs, { paddingHorizontal: spacing.lg }]}>
        {tabs.map((tab) => <Pressable key={tab.id} onPress={() => setActive(tab.id)} style={[styles.tab, { backgroundColor: active === tab.id ? colors.deepPurple : colors.surface, borderColor: colors.border }]}><AppText variant="label" color={active === tab.id ? colors.textInverse : colors.text}>{tab.label}</AppText></Pressable>)}
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.lg }}>
        {active === 'feed' && <>
          {trends.map((trend, index) => <View key={trend.id} style={[styles.post, { backgroundColor: colors.surface, borderRadius: radius.xl }]}>
            <View style={styles.author}><SafeImage source={{ uri: index ? approved[0]?.sellerAvatarUrl ?? user.avatarUrl : user.avatarUrl }} style={styles.avatar} /><View style={{ flex: 1 }}><AppText variant="label">{index ? 'Phong cách của Linh' : user.username}</AppText><AppText variant="bodySmall" muted>{trend.season} · Phong cách của bạn</AppText></View><Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} /></View>
            <SafeImage source={{ uri: trend.previewImageUrl }} style={styles.look} contentFit="cover" fallbackLabel="ẢNH PHONG CÁCH" />
            <View style={styles.social}><Ionicons name="heart-outline" size={23} color={colors.community} /><AppText variant="label">{124 + index * 89}</AppText><Ionicons name="chatbubble-outline" size={21} color={colors.deepPurple} /><AppText variant="label">{18 + index * 7}</AppText><Ionicons name="bookmark-outline" size={23} color={colors.deepPurple} style={{ marginLeft: 'auto' }} /></View>
            <AppText variant="bodySmall">{trend.description}</AppText>
            <Button label="Thử style này" variant="ai" small icon="sparkles" onPress={() => router.push('/(tabs)/try-on')} style={{ marginTop: 12, alignSelf: 'flex-start' }} />
          </View>)}
        </>}
        {active === 'challenges' && <>
          <AppText variant="h1">Thử thách nâng tầm phong cách</AppText><AppText variant="bodySmall" muted style={{ marginBottom: 12 }}>Chơi cùng cộng đồng, mở thêm XP và lượt AI.</AppText>
          {challenges.map(([title, description, progress, people, reward, color]) => <View key={title} style={[styles.challenge, { backgroundColor: color, borderRadius: radius.xl }]}><AppText variant="caption" color={colors.textInverse}>{people} NGƯỜI THAM GIA · {reward}</AppText><AppText variant="h2" color={colors.textInverse}>{title}</AppText><AppText variant="bodySmall" color={colors.textInverse}>{description}</AppText><AppText variant="label" color={colors.textInverse} style={{ marginTop: 12 }}>{progress}</AppText><Button label="Tham gia ngay" small variant="secondary" onPress={() => router.push(title === 'No-buy Week' ? '/missions' : '/community/create?intent=post')} style={{ alignSelf: 'flex-start', marginTop: 10 }} /></View>)}
        </>}
        {active === 'exchange' && <>
          <View style={styles.sectionTop}><View><AppText variant="h1">Góc trao đổi</AppText><AppText variant="bodySmall" muted>Đổi món cũ, tìm một phong cách mới.</AppText></View><Button label="Đăng món" small variant="community" icon="add" onPress={() => router.push('/community/create?type=trade')} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 14 }}>{['Gần bạn', 'Freesize', 'Như mới', 'Miễn phí'].map((label) => <Pressable key={label} onPress={() => setExchangeFilter(label)} style={[styles.filter, { backgroundColor: exchangeFilter === label ? colors.mint : colors.surface, borderColor: colors.border }]}><AppText variant="bodySmall">{label}</AppText></Pressable>)}</ScrollView>
          <View style={styles.grid}>{exchange.map((item) => listingCard(item))}</View>
        </>}
        {active === 'marketplace' && <>
          <View style={styles.sectionTop}><View><AppText variant="h1">Món hay vừa tìm thấy</AppText><AppText variant="bodySmall" muted>Những món đồ cũ đang chờ một câu chuyện mới.</AppText></View><Button label="Xem tất cả" small variant="secondary" onPress={() => router.push('/community')} /></View>
          <View style={styles.grid}>{marketplace.map((item) => listingCard(item))}</View>
        </>}
        {active === 'mine' && <>
          <View style={styles.sectionTop}><View><AppText variant="h1">Tin đăng của tôi</AppText><AppText variant="bodySmall" muted>Theo dõi trạng thái các món bạn đã đăng.</AppText></View><Button label="Đăng mới" small variant="community" icon="add" onPress={() => router.push('/community/create')} /></View>
          {mine.length ? <View style={styles.grid}>{mine.map((item) => listingCard(item, true))}</View> : <LinearGradient colors={gradients.marketplace} style={[styles.empty, { borderRadius: radius.xl }]}><Ionicons name="shirt-outline" size={38} color={colors.textInverse} /><AppText variant="h2" color={colors.textInverse}>Tủ đồ bạn có món nào muốn pass?</AppText><AppText variant="bodySmall" color={colors.textInverse}>Đăng món đầu tiên để tìm đúng người hợp vibe.</AppText><Button label="Đăng món đầu tiên" small variant="secondary" onPress={() => router.push('/community/create')} style={{ marginTop: 12, alignSelf: 'flex-start' }} /></LinearGradient>}
        </>}
      </View>
      <FloatingActionButton onPress={() => router.push('/community/create')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 22 },
  heroActions: { flexDirection: 'row', marginTop: 16 },
  tabsWrap: { flexGrow: 0, height: 66 },
  tabs: { alignItems: 'center', paddingVertical: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1, marginRight: 8 },
  post: { padding: 10, marginBottom: 16 },
  author: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  look: { height: 420, width: '100%', borderRadius: 24 },
  social: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 11 },
  sectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  challenge: { padding: 18, marginBottom: 12 },
  filter: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, borderWidth: 1, marginRight: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 18 },
  product: { width: '48.5%', overflow: 'hidden', marginBottom: 12 },
  productImage: { width: '100%', height: 190 },
  heart: { position: 'absolute', right: 8, top: 8, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  productInfo: { padding: 10 },
  seller: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  miniAvatar: { width: 18, height: 18, borderRadius: 9 },
  status: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 4, marginTop: 8 },
  empty: { padding: 20, marginTop: 10 },
});
