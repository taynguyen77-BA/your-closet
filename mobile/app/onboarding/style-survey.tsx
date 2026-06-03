import { useRouter } from 'expo-router';
import { StyleSurveyForm } from '@/components/profile/StyleSurveyForm';
import { useAuthStore } from '@/stores/authStore';

export default function InitialStyleSurveyScreen() {
  const router = useRouter();
  const { currentUser, updateProfile } = useAuthStore();
  return (
    <StyleSurveyForm
      user={currentUser}
      mode="initial"
      onSave={async (patch) => {
        await updateProfile(patch);
        router.replace('/(tabs)');
      }}
      onSkip={async () => {
        await updateProfile({
          hasCompletedStyleSurvey: true,
          styleSurveySkipped: true,
          styleSurveyCompletedAt: new Date().toISOString(),
          styleProfileCompletionPercent: currentUser?.styleProfileCompletionPercent ?? 0,
        });
        router.replace('/(tabs)');
      }}
    />
  );
}
