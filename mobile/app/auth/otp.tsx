import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthInput } from '@/components/auth/AuthInput';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { useAuthStore } from '@/stores/authStore';

export default function OtpScreen() {
  const router = useRouter();
  const { verifyOtp, authError, isAuthLoading } = useAuthStore();
  const [code, setCode] = useState('');
  return <AuthScreen title="Nhập mã OTP" subtitle="Mã xác minh vừa được gửi tới số điện thoại của bạn."><AuthInput placeholder="123456" keyboardType="number-pad" value={code} onChangeText={setCode} maxLength={6} />{authError ? <AppText variant="bodySmall">{authError}</AppText> : null}<Button label={isAuthLoading ? 'Đang xác minh...' : 'Xác minh OTP'} disabled={code.trim().length < 6 || isAuthLoading} onPress={async () => { if (await verifyOtp(code)) router.replace('/(tabs)'); }} /><Button label="Gửi lại mã" variant="ghost" onPress={() => router.back()} style={{ marginTop: 8 }} /></AuthScreen>;
}
