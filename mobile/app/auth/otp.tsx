import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthInput } from '@/components/auth/AuthInput';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme';

// AC 42 / 42.1 / 42.2 — BRD 3.1.1.3
const MAX_ATTEMPTS = 3;
const COOLDOWN_SECONDS = 60;

export default function OtpScreen() {
  const router = useRouter();
  const { verifyOtp } = useAuthStore();
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const id = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          // Cooldown expired — reset attempt counter so user can try again
          setAttemptCount(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownRemaining]);

  const inCooldown = cooldownRemaining > 0;

  async function handleVerify() {
    setOtpError(null);
    setIsVerifying(true);
    const ok = await verifyOtp(code);
    setIsVerifying(false);
    if (ok) {
      router.replace('/(tabs)');
      return;
    }
    // AC 42.1 — show error on each incorrect attempt within the 3-attempt window
    setOtpError('Mã OTP không đúng, thử lại');
    const next = attemptCount + 1;
    setAttemptCount(next);
    // AC 42.2 — after 3rd failure, start 60-second cooldown
    if (next >= MAX_ATTEMPTS) {
      setCooldownRemaining(COOLDOWN_SECONDS);
    }
  }

  return (
    <AuthScreen title="Nhập mã OTP" subtitle="Mã xác minh vừa được gửi tới số điện thoại của bạn.">
      <AuthInput
        placeholder="123456"
        keyboardType="number-pad"
        value={code}
        onChangeText={(v) => { setCode(v); setOtpError(null); }}
        maxLength={6}
        editable={!inCooldown}
      />
      {otpError ? (
        <AppText testID="otp-error" variant="bodySmall" color={colors.error}>{otpError}</AppText>
      ) : null}
      {inCooldown ? (
        <AppText testID="otp-cooldown" variant="bodySmall" color={colors.warning}>
          {`Vui lòng chờ ${cooldownRemaining}s trước khi gửi lại mã.`}
        </AppText>
      ) : null}
      <Button
        label={isVerifying ? 'Đang xác minh...' : 'Xác minh OTP'}
        disabled={code.trim().length < 6 || isVerifying || inCooldown}
        onPress={handleVerify}
      />
      <Button
        label={inCooldown ? `Gửi lại mã (${cooldownRemaining}s)` : 'Gửi lại mã'}
        variant="ghost"
        onPress={() => router.back()}
        disabled={inCooldown}
        style={{ marginTop: 8 }}
      />
    </AuthScreen>
  );
}
