import { Linking, ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/theme';
import { useAppStore } from '@/stores/appStore';

export default function ShoppingScreen() {
  const { colors, spacing } = useTheme();
  const products = useAppStore((state) => state.affiliateProducts);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      {!products.length ? <GlassCard>
        <AppText variant="h2">Sản phẩm affiliate</AppText>
        <AppText variant="bodySmall" muted style={{ marginTop: spacing.sm }}>
          Chưa có sản phẩm phù hợp. Gợi ý mua sắm sẽ xuất hiện khi đối tác affiliate được kết nối.
        </AppText>
      </GlassCard> : products.map((product) => <GlassCard key={product.id} style={{ marginBottom: spacing.md }}>
        <AppText variant="h2">{product.name}</AppText><AppText variant="bodySmall" muted>{product.store}</AppText>
        {product.priceLabel ? <AppText style={{ marginTop: spacing.sm }}>{product.priceLabel}</AppText> : null}
        <Button label="Xem sản phẩm" onPress={() => void Linking.openURL(product.link)} style={{ marginTop: spacing.md }} />
      </GlassCard>)}
    </ScrollView>
  );
}
