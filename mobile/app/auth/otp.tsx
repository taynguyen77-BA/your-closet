import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/AppText';
import { useAuthStore } from '@/stores/authStore';
import { layout, rounded, useTheme } from '@/theme';

// AC 42 / 42.1 / 42.2 — BRD 3.1.1.3
const MAX_ATTEMPTS = 3;
const COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

export default function OtpScreen() {
  const router = useRouter();
  const { verifyOtp } = useAuthStore();
  const { colors, typeScale } = useTheme();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const inputs = useRef<(TextInput | null)[]>([]);

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

  function setDigit(index: number, value: string) {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      // Backspace on an empty box steps back to the previous one.
      const next = code.split('');
      next[index] = '';
      setCode(next.join('').slice(0, OTP_LENGTH));
      setOtpError(null);
      if (index > 0) inputs.current[index - 1]?.focus();
      return;
    }
    const next = code.padEnd(OTP_LENGTH, ' ').split('');
    // Pasting the whole code into one box should fill the row.
    digits.split('').forEach((d, offset) => {
      if (index + offset < OTP_LENGTH) next[index + offset] = d;
    });
    setCode(next.join('').replace(/ /g, '').slice(0, OTP_LENGTH));
    setOtpError(null);
    const landed = Math.min(index + digits.length, OTP_LENGTH - 1);
    inputs.current[landed]?.focus();
  }

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
    <AuthScreen
      title="Xác nhận OTP"
      subtitle="Mã xác minh vừa được gửi tới số điện thoại của bạn."
      footer={
        <Button
          label={isVerifying ? 'Đang xác minh...' : 'Xác minh OTP'}
          large
          style={styles.action}
          disabled={code.trim().length < OTP_LENGTH || isVerifying || inCooldown}
          onPress={handleVerify}
        />
      }
    >
      <View style={styles.boxes}>
        {Array.from({ length: OTP_LENGTH }).map((_, i) => (
          <TextInput
            key={i}
            testID={`otp-digit-${i}`}
            ref={(el) => { inputs.current[i] = el; }}
            value={code[i] ?? ''}
            onChangeText={(v) => setDigit(i, v)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus();
            }}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            editable={!inCooldown}
            selectTextOnFocus
            style={[
              typeScale.headlineSm,
              styles.box,
              { color: colors.primary, backgroundColor: colors.surface, borderColor: colors.sand, borderRadius: rounded.lg },
            ]}
          />
        ))}
      </View>

      {otpError ? (
        <AppText testID="otp-error" variant="bodySmall" color={colors.error}>{otpError}</AppText>
      ) : null}
      {inCooldown ? (
        <AppText testID="otp-cooldown" variant="bodySmall" color={colors.warning}>
          {`Vui lòng chờ ${cooldownRemaining}s trước khi gửi lại mã.`}
        </AppText>
      ) : null}

      <View style={styles.resend}>
        <AppText variant="bodySmall" color={colors.warmGray}>Không nhận được mã?</AppText>
        <Pressable disabled={inCooldown} onPress={() => router.back()} hitSlop={8}>
          <AppText
            variant="label"
            color={inCooldown ? colors.textMuted : colors.primary}
            style={[styles.resendLink, { textDecorationColor: colors.primary }]}
          >
            {inCooldown ? `Gửi lại mã (${cooldownRemaining}s)` : 'Gửi lại mã'}
          </AppText>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  boxes: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  box: { flex: 1, height: 56, borderWidth: 1, textAlign: 'center' },
  resend: { alignItems: 'center', gap: layout.unit * 2, marginTop: layout.stackSm },
  resendLink: { textDecorationLine: 'underline' },
  action: { width: '100%' },
});
