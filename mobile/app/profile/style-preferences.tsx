import { useRouter } from 'expo-router';
import { StyleSurveyForm } from '@/components/profile/StyleSurveyForm';
import { useAuthStore } from '@/stores/authStore';

export default function StylePreferencesScreen() {
  const router = useRouter();
  const { currentUser, updateProfile } = useAuthStore();
  return (
    <StyleSurveyForm
      user={currentUser}
      mode="edit"
      onSave={async (patch) => {
        await updateProfile({ ...patch, styleSurveySkipped: false });
        router.back();
      }}
      onSkip={async () => router.back()}
    />
  );
}
