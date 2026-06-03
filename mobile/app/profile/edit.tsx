import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthInput } from '@/components/auth/AuthInput';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { currentUser, updateProfile, uploadAvatar, authError } = useAuthStore();
  const [name, setName] = useState(currentUser?.name ?? currentUser?.displayName ?? '');
  const [username, setUsername] = useState(currentUser?.username ?? '');
  const [fashionStyle, setFashionStyle] = useState(currentUser?.fashionStyle ?? '');
  const [preferences, setPreferences] = useState((currentUser?.preferences ?? []).join(', '));
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!result.canceled) {
      setSaving(true);
      const uploaded = await uploadAvatar(result.assets[0].uri);
      if (uploaded) setAvatarUrl(uploaded);
      setSaving(false);
    }
  };

  const save = async () => {
    setSaving(true);
    const ok = await updateProfile({
      name: name.trim(),
      displayName: name.trim(),
      username: username.trim(),
      fashionStyle: fashionStyle.trim(),
      preferences: preferences.split(',').map((item) => item.trim()).filter(Boolean),
      avatarUrl: avatarUrl || undefined,
    });
    setSaving(false);
    if (ok) router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <GlassCard>
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <SafeImage source={{ uri: avatarUrl }} style={{ width: 104, height: 104, borderRadius: radius.full, backgroundColor: colors.lavender }} />
          <Button label={saving ? 'Đang tải ảnh...' : 'Đổi avatar'} variant="secondary" onPress={() => { void pickAvatar(); }} style={{ marginTop: spacing.md }} />
        </View>
        <AuthInput placeholder="Tên hiển thị" value={name} onChangeText={setName} />
        <AuthInput placeholder="Username" autoCapitalize="none" value={username} onChangeText={setUsername} />
        <AuthInput placeholder="Phong cách · minimal, Y2K, sporty..." value={fashionStyle} onChangeText={setFashionStyle} />
        <AuthInput placeholder="Sở thích · váy, blazer, pastel..." value={preferences} onChangeText={setPreferences} />
        {authError ? <AppText variant="bodySmall" muted>{authError}</AppText> : null}
        <Button label={saving ? 'Đang lưu...' : 'Lưu hồ sơ'} disabled={saving || !name.trim()} onPress={() => { void save(); }} style={{ marginTop: spacing.md }} />
      </GlassCard>
    </ScrollView>
  );
}
