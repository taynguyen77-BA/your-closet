import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { useAuthStore } from '@/stores/authStore';
import { layout, useTheme } from '@/theme';

export default function PhoneAuth() {
  const router = useRouter();
  const { loginWithPhone, authError, isAuthLoading } = useAuthStore();
  const [phone, setPhone] = useState('+84');
  const { colors, typeScale } = useTheme();

  return (
    <AuthScreen
      title="Nhập số điện thoại"
      footer={
        <Button
          label={isAuthLoading ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
          large
          style={styles.action}
          disabled={phone.trim().length < 9 || isAuthLoading}
          onPress={async () => { if (await loginWithPhone(phone)) router.push('/auth/otp' as never); }}
        />
      }
    >
      <View style={styles.field}>
        <AppText variant="caption" color={colors.warmGray}>Số điện thoại</AppText>
        <View style={styles.inputRow}>
          <AppText style={[typeScale.bodyLg, styles.prefix, { color: colors.primary, borderBottomColor: colors.primary }]}>
            +84
          </AppText>
          <TextInput
            autoFocus
            keyboardType="phone-pad"
            placeholder="000 000 000"
            placeholderTextColor={colors.textMuted}
            value={phone}
            onChangeText={setPhone}
            style={[typeScale.bodyLg, styles.input, { color: colors.primary, borderBottomColor: colors.primary }]}
          />
        </View>
        <AppText variant="bodySmall" color={colors.warmGray}>Chúng tôi sẽ gửi mã xác nhận qua SMS</AppText>
      </View>

      {Platform.OS === 'web' ? (
        <View nativeID="phone-recaptcha-container" />
      ) : (
        <AppText variant="bodySmall" muted>
          Phone Auth native cần cấu hình Firebase native verification hoặc backend OTP.
        </AppText>
      )}
      {authError ? <AppText variant="bodySmall" color={colors.error}>{authError}</AppText> : null}

      <Button
        label="Chọn cách khác"
        variant="ghost"
        onPress={() => router.replace('/auth/welcome' as never)}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  field: { gap: layout.unit },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: layout.unit },
  prefix: { borderBottomWidth: 1, paddingBottom: 8, minWidth: 48 },
  input: { flex: 1, borderBottomWidth: 1, paddingVertical: 8 },
  action: { width: '100%' },
});
