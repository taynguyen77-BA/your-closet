import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthInput } from '@/components/auth/AuthInput';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuthStore } from '@/stores/authStore';
import { rounded, useTheme } from '@/theme';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const {
    currentUser, authError, isAuthLoading,
    loginWithGoogle, loginWithFacebook, loginWithPhone, verifyOtp, deleteAccount,
  } = useAuthStore();
  const provider = currentUser?.provider;
  const [acknowledged, setAcknowledged] = useState(false);
  const [reauthenticated, setReauthenticated] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [deleting, setDeleting] = useState(false);

  const reauthenticateWithProvider = async () => {
    const ok = provider === 'google' ? await loginWithGoogle() : provider === 'facebook' ? await loginWithFacebook() : false;
    if (ok) setReauthenticated(true);
  };

  const sendOtp = async () => {
    if (!currentUser?.phoneNumber) return;
    if (await loginWithPhone(currentUser.phoneNumber)) setOtpSent(true);
  };

  const confirmOtp = async () => {
    if (await verifyOtp(otpCode)) setReauthenticated(true);
  };

  const confirmDeletion = () => {
    Alert.alert(
      'Xoá tài khoản vĩnh viễn?',
      'Toàn bộ tủ đồ, outfit, sự kiện, tin đăng và dữ liệu cá nhân của bạn sẽ bị xoá và không thể khôi phục.',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá vĩnh viễn',
          style: 'destructive',
          onPress: () => {
            setDeleting(true);
            void deleteAccount().then((ok) => {
              setDeleting(false);
              if (ok) router.replace('/auth/welcome');
            });
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <GlassCard style={{ marginBottom: spacing.md, borderColor: colors.error }}>
        <AppText variant="label" style={{ color: colors.error, marginBottom: 6 }}>Hành động không thể hoàn tác</AppText>
        <AppText variant="bodySmall" muted>
          Xoá tài khoản sẽ xoá vĩnh viễn hồ sơ, tủ đồ, outfit, sự kiện, nhiệm vụ, thông báo, tin đăng, tin nhắn chợ đồ và gói thành viên của bạn. Hành động này không thể hoàn tác.
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: spacing.md }}>
          <Switch value={acknowledged} onValueChange={setAcknowledged} trackColor={{ true: colors.error }} />
          <AppText variant="bodySmall" style={{ flex: 1 }}>Tôi hiểu hành động này không thể hoàn tác.</AppText>
        </View>
      </GlassCard>

      {acknowledged && !reauthenticated ? (
        <GlassCard style={{ marginBottom: spacing.md }}>
          <AppText variant="label" style={{ marginBottom: 6 }}>Xác minh lại danh tính</AppText>
          <AppText variant="bodySmall" muted style={{ marginBottom: spacing.md }}>
            Để bảo vệ tài khoản, bạn cần xác minh lại trước khi xoá.
          </AppText>
          {provider === 'google' || provider === 'facebook' ? (
            <Button
              label={isAuthLoading ? 'Đang xác minh...' : `Xác minh lại bằng ${provider === 'google' ? 'Google' : 'Facebook'}`}
              variant="secondary"
              disabled={isAuthLoading}
              onPress={() => { void reauthenticateWithProvider(); }}
            />
          ) : !otpSent ? (
            <Button
              label={isAuthLoading ? 'Đang gửi mã...' : 'Gửi mã OTP xác minh'}
              variant="secondary"
              disabled={isAuthLoading || !currentUser?.phoneNumber}
              onPress={() => { void sendOtp(); }}
            />
          ) : (
            <>
              <AuthInput placeholder="Nhập mã OTP" keyboardType="number-pad" value={otpCode} onChangeText={setOtpCode} maxLength={6} />
              <Button
                label={isAuthLoading ? 'Đang xác minh...' : 'Xác minh OTP'}
                disabled={isAuthLoading || otpCode.trim().length < 6}
                onPress={() => { void confirmOtp(); }}
              />
            </>
          )}
          {authError ? <AppText variant="bodySmall" muted style={{ marginTop: 8 }}>{authError}</AppText> : null}
        </GlassCard>
      ) : null}

      {reauthenticated ? (
        <AppText variant="bodySmall" muted style={{ marginBottom: spacing.md }}>Đã xác minh danh tính. Bạn có thể xoá tài khoản.</AppText>
      ) : null}

      <Pressable
        onPress={confirmDeletion}
        disabled={!acknowledged || !reauthenticated || deleting}
        style={({ pressed }) => ({
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 42,
          borderRadius: rounded.full,
          backgroundColor: colors.error,
          opacity: !acknowledged || !reauthenticated || deleting ? 0.5 : pressed ? 0.85 : 1,
        })}
      >
        <AppText variant="label" color={colors.textInverse}>{deleting ? 'Đang xoá tài khoản...' : 'Xoá tài khoản vĩnh viễn'}</AppText>
      </Pressable>
    </ScrollView>
  );
}
