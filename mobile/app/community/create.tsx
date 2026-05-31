import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme';

export default function CreateListingScreen() {
  const { colors, spacing, radius } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listingType, setListingType] = useState<'sale' | 'trade' | 'giveaway'>('sale');
  const [price, setPrice] = useState('');

  const submit = () => {
    Alert.alert('Đã gửi', 'Tin đăng sẽ được kiểm duyệt trước khi hiển thị.');
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.beige, borderRadius: radius.md, color: colors.text },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
      <AppText variant="bodySmall" muted style={{ marginBottom: spacing.lg }}>
        Chọn món từ tủ đồ, thêm mô tả và loại giao dịch
      </AppText>
      <Button label="Chọn từ tủ đồ" variant="secondary" icon="shirt-outline" />
      <TextInput placeholder="Tiêu đề" value={title} onChangeText={setTitle} style={[inputStyle, { marginTop: spacing.lg }]} />
      <TextInput
        placeholder="Mô tả"
        value={description}
        onChangeText={setDescription}
        multiline
        style={[inputStyle, { minHeight: 80 }]}
      />
      <View style={styles.types}>
        {(['sale', 'trade', 'giveaway'] as const).map((t) => (
          <Button
            key={t}
            label={t === 'sale' ? 'Bán' : t === 'trade' ? 'Trao đổi' : 'Tặng'}
            variant={listingType === t ? 'primary' : 'ghost'}
            small
            onPress={() => setListingType(t)}
            style={{ marginRight: 8 }}
          />
        ))}
      </View>
      {listingType === 'sale' && (
        <TextInput placeholder="Giá (VND)" value={price} onChangeText={setPrice} keyboardType="numeric" style={inputStyle} />
      )}
      <Button label="Đăng tin" onPress={submit} style={{ marginTop: spacing.xl }} />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { padding: 12, marginBottom: 8, fontSize: 15 },
  types: { flexDirection: 'row', marginVertical: 8 },
});
