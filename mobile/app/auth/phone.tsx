import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform, View } from 'react-native';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthInput } from '@/components/auth/AuthInput';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { useAuthStore } from '@/stores/authStore';

export default function PhoneAuth() {
  const router = useRouter();
  const { loginWithPhone, authError, isAuthLoading } = useAuthStore();
  const [phone, setPhone] = useState('+84');
  return <AuthScreen title="Tiếp tục với số điện thoại" subtitle="Nếu số này đã có tài khoản, bạn sẽ được đăng nhập. Nếu chưa, ứng dụng sẽ tạo hồ sơ mới sau khi xác minh OTP."><AuthInput placeholder="+84..." keyboardType="phone-pad" value={phone} onChangeText={setPhone} />{Platform.OS === 'web' ? <View nativeID="phone-recaptcha-container" /> : <AppText variant="bodySmall" muted>Phone Auth native cần cấu hình Firebase native verification hoặc backend OTP.</AppText>}{authError ? <AppText variant="bodySmall">{authError}</AppText> : null}<Button label={isAuthLoading ? 'Đang gửi OTP...' : 'Tiếp tục'} disabled={phone.trim().length < 9 || isAuthLoading} onPress={async () => { if (await loginWithPhone(phone)) router.push('/auth/otp' as never); }} /><Button label="Chọn cách khác" variant="ghost" onPress={() => router.replace('/auth/welcome' as never)} style={{ marginTop: 8 }} /></AuthScreen>;
}
