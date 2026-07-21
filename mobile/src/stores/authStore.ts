import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User } from '@/models';
import { mockUser } from '@/data/mockData';
import {
  assertFirebaseReady,
  disableBiometric as disableBiometricPreference,
  enableBiometric as enableBiometricPreference,
  ensureUserProfile,
  friendlyAuthError,
  getBiometricEnabled,
  getFreshIdToken,
  getGuestSessionEnabled,
  getOnboardingCompleted,
  loginWithFacebook as facebookLogin,
  loginWithGoogle as googleLogin,
  loginWithPhone as phoneLogin,
  logoutFirebase,
  requestAccountDeletion,
  resolveSupportedAuthProvider,
  setGuestSessionEnabled,
  setOnboardingCompleted,
  subscribeToFirebaseAuth,
  updateUserProfile,
  uploadAvatar as uploadAvatarFile,
  verifyBiometric as verifyDeviceBiometric,
  verifyOtp as otpVerify,
} from '@/services/auth/authService';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
export type AuthFlowRoute =
  | '/auth/welcome'
  | '/auth/phone'
  | '/auth/otp';
let unsubscribe: (() => void) | undefined;
const useDemoMode = () => process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
const useDemoAuthBypass = () => process.env.EXPO_PUBLIC_DEMO_AUTH_BYPASS === 'true';

interface OnboardingPayload {
  username?: string;
  fashionStyle?: string;
  favoriteColors?: string[];
  fashionGoals?: string[];
  avatarUrl?: string;
  preferences?: string[];
}

interface AuthState {
  firebaseUser: FirebaseUser | null;
  currentUser: User | null;
  appUser: User | null;
  authStatus: AuthStatus;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  authError?: string;
  firebaseSetupError?: string;
  showGuestPrompt: boolean;
  onboardingCompleted: boolean;
  biometricEnabled: boolean;
  biometricVerified: boolean;
  initializeAuth: () => Promise<void>;
  startGuestSession: () => Promise<void>;
  completeFirstLaunchOnboarding: () => Promise<void>;
  loginWithPhone: (phoneNumber: string) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithFacebook: () => Promise<boolean>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  updateProfile: (patch: Partial<User>) => Promise<boolean>;
  uploadAvatar: (uri: string) => Promise<string | null>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  verifyBiometric: () => Promise<boolean>;
  markBiometricRequired: () => void;
  updateOnboarding: (payload: OnboardingPayload) => Promise<void>;
  requireAccount: () => boolean;
  enterAuthFlow: (targetRoute: AuthFlowRoute) => AuthFlowRoute;
  closeGuestPrompt: () => void;
}

const setFailure = (set: (patch: Partial<AuthState>) => void, error: unknown) => {
  set({ isAuthLoading: false, authStatus: 'unauthenticated', isAuthenticated: false, authError: friendlyAuthError(error) });
};

const setAuthenticated = (set: (patch: Partial<AuthState>) => void, currentUser: User) => {
  void setGuestSessionEnabled(false);
  set({
    currentUser,
    appUser: currentUser,
    authStatus: 'authenticated',
    isAuthenticated: true,
    isGuest: false,
    isAuthLoading: false,
    biometricVerified: true,
    authError: undefined,
  });
};

const demoUser = (): User => ({
  ...mockUser,
  hasCompletedStyleSurvey: true,
  styleProfileCompletionPercent: mockUser.styleProfileCompletionPercent ?? 100,
});

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  currentUser: null,
  appUser: null,
  authStatus: 'loading',
  isAuthLoading: true,
  isAuthenticated: false,
  isGuest: false,
  showGuestPrompt: false,
  onboardingCompleted: false,
  biometricEnabled: false,
  biometricVerified: false,
  initializeAuth: async () => {
    if (useDemoMode() && useDemoAuthBypass()) {
      const onboardingCompleted = await getOnboardingCompleted();
      set({
        firebaseUser: null,
        currentUser: { ...mockUser, hasCompletedStyleSurvey: mockUser.hasCompletedStyleSurvey ?? false, styleProfileCompletionPercent: mockUser.styleProfileCompletionPercent ?? 0 },
        appUser: { ...mockUser, hasCompletedStyleSurvey: mockUser.hasCompletedStyleSurvey ?? false, styleProfileCompletionPercent: mockUser.styleProfileCompletionPercent ?? 0 },
        authStatus: 'authenticated',
        isAuthenticated: true,
        isGuest: false,
        isAuthLoading: false,
        onboardingCompleted,
        biometricEnabled: false,
        biometricVerified: true,
        firebaseSetupError: undefined,
      });
      return;
    }
    try {
      const [onboardingCompleted, biometricEnabled, guestSessionEnabled] = await Promise.all([getOnboardingCompleted(), getBiometricEnabled(), getGuestSessionEnabled()]);
      set({ onboardingCompleted, biometricEnabled, isAuthLoading: true, authStatus: 'loading', firebaseSetupError: undefined });
      assertFirebaseReady();
      if (unsubscribe) {
        set({ isAuthLoading: false });
        return;
      }
      unsubscribe = subscribeToFirebaseAuth(async (firebaseUser) => {
        if (!firebaseUser) {
          if (guestSessionEnabled) {
            set({
              firebaseUser: null,
              currentUser: null,
              appUser: null,
              authStatus: 'unauthenticated',
              isAuthenticated: false,
              isGuest: true,
              isAuthLoading: false,
              biometricVerified: true,
            });
            return;
          }
          set({ firebaseUser: null, currentUser: null, appUser: null, authStatus: 'unauthenticated', isAuthenticated: false, isGuest: false, isAuthLoading: false, biometricVerified: false });
          return;
        }
        try {
          void setGuestSessionEnabled(false);
          const provider = resolveSupportedAuthProvider(firebaseUser);
          const currentUser = await ensureUserProfile(firebaseUser, provider);
          const needsBiometric = await getBiometricEnabled();
          set({
            firebaseUser,
            currentUser,
            appUser: currentUser,
            authStatus: 'authenticated',
            isAuthenticated: true,
            isGuest: false,
            isAuthLoading: false,
            biometricEnabled: needsBiometric,
            biometricVerified: !needsBiometric,
          });
        } catch (error) {
          setFailure(set, error);
        }
      });
    } catch (error) {
      if (useDemoMode()) {
        const currentUser = demoUser();
        set({
          firebaseUser: null,
          currentUser,
          appUser: currentUser,
          authStatus: 'authenticated',
          isAuthenticated: true,
          isGuest: false,
          isAuthLoading: false,
          onboardingCompleted: true,
          biometricEnabled: false,
          biometricVerified: true,
          firebaseSetupError: undefined,
          authError: undefined,
        });
        return;
      }
      set({ firebaseSetupError: friendlyAuthError(error), authStatus: 'unauthenticated', isAuthLoading: false, isAuthenticated: false, isGuest: false });
    }
  },
  startGuestSession: async () => {
    await setGuestSessionEnabled(true);
    set({
      firebaseUser: null,
      currentUser: null,
      appUser: null,
      authStatus: 'unauthenticated',
      isAuthenticated: false,
      isGuest: true,
      isAuthLoading: false,
      biometricEnabled: false,
      biometricVerified: true,
      authError: undefined,
      showGuestPrompt: false,
    });
  },
  completeFirstLaunchOnboarding: async () => {
    await setOnboardingCompleted();
    set({ onboardingCompleted: true });
  },
  loginWithPhone: async (phoneNumber) => {
    set({ isAuthLoading: true, authError: undefined });
    try { await phoneLogin(phoneNumber); set({ isAuthLoading: false }); return true; }
    catch (error) { setFailure(set, error); return false; }
  },
  verifyOtp: async (code) => {
    // Do NOT set isAuthLoading: true here — doing so unmounts the OTP screen (layout
    // returns the splash when isAuthLoading=true), which breaks the retry/cooldown
    // counter and causes a false routing-gate redirect. The component manages its own
    // loading state (isVerifying) for button feedback.
    set({ authError: undefined });
    try {
      const currentUser = await otpVerify(code);
      setAuthenticated(set, currentUser);
      return true;
    } catch (error) { setFailure(set, error); return false; }
  },
  loginWithGoogle: async () => {
    set({ isAuthLoading: true, authError: undefined });
    try { const currentUser = await googleLogin(); setAuthenticated(set, currentUser); return true; }
    catch (error) { setFailure(set, error); return false; }
  },
  loginWithFacebook: async () => {
    set({ isAuthLoading: true, authError: undefined });
    try { const currentUser = await facebookLogin(); setAuthenticated(set, currentUser); return true; }
    catch (error) { setFailure(set, error); return false; }
  },
  logout: async () => {
    await setGuestSessionEnabled(false);
    if (useDemoMode() && useDemoAuthBypass()) {
      set({ currentUser: null, appUser: null, authStatus: 'unauthenticated', isAuthenticated: false, isGuest: false, biometricEnabled: false, biometricVerified: false, isAuthLoading: false });
      return;
    }
    try { await logoutFirebase(); } finally {
      set({ firebaseUser: null, currentUser: null, appUser: null, authStatus: 'unauthenticated', isAuthenticated: false, isGuest: false, biometricEnabled: false, biometricVerified: false, isAuthLoading: false });
    }
  },
  deleteAccount: async () => {
    try {
      const idToken = await getFreshIdToken();
      await requestAccountDeletion(idToken);
    } catch (error) {
      set({ authError: friendlyAuthError(error) });
      return false;
    }
    await setGuestSessionEnabled(false);
    try { await logoutFirebase(); } finally {
      set({ firebaseUser: null, currentUser: null, appUser: null, authStatus: 'unauthenticated', isAuthenticated: false, isGuest: false, biometricEnabled: false, biometricVerified: false, isAuthLoading: false, authError: undefined });
    }
    return true;
  },
  updateProfile: async (patch) => {
    const user = get().currentUser; if (!user) return false;
    if (useDemoMode() && useDemoAuthBypass()) {
      const updated = { ...user, ...patch };
      set({ currentUser: updated, appUser: updated });
      return true;
    }
    try {
      await updateUserProfile(user.id, patch);
      const updated = { ...user, ...patch };
      set({ currentUser: updated, appUser: updated });
      return true;
    } catch (error) { set({ authError: friendlyAuthError(error) }); return false; }
  },
  uploadAvatar: async (uri) => {
    const user = get().currentUser; if (!user) return null;
    try {
      const avatarUrl = await uploadAvatarFile(user.id, uri);
      await get().updateProfile({ avatarUrl });
      return avatarUrl;
    } catch (error) { set({ authError: friendlyAuthError(error) }); return null; }
  },
  enableBiometric: async () => {
    const user = get().currentUser; if (!user) return false;
    try {
      await enableBiometricPreference();
      await get().updateProfile({ biometricEnabled: true });
      set({ biometricEnabled: true, biometricVerified: true });
      return true;
    } catch (error) { set({ authError: friendlyAuthError(error) }); return false; }
  },
  disableBiometric: async () => {
    await disableBiometricPreference();
    await get().updateProfile({ biometricEnabled: false });
    set({ biometricEnabled: false, biometricVerified: true });
  },
  verifyBiometric: async () => {
    const ok = await verifyDeviceBiometric();
    set({ biometricVerified: ok });
    return ok;
  },
  markBiometricRequired: () => set({ biometricVerified: false }),
  updateOnboarding: async (payload) => {
    await get().updateProfile({ ...payload, hasCompletedOnboarding: true });
  },
  requireAccount: () => {
    const isAuthenticated = get().isAuthenticated;
    if (!isAuthenticated) set({ showGuestPrompt: true });
    return isAuthenticated;
  },
  enterAuthFlow: (targetRoute) => {
    void setGuestSessionEnabled(false);
    set({
      firebaseUser: null,
      currentUser: null,
      appUser: null,
      authStatus: 'unauthenticated',
      isAuthenticated: false,
      isGuest: false,
      isAuthLoading: false,
      biometricEnabled: false,
      biometricVerified: false,
      authError: undefined,
      showGuestPrompt: false,
    });
    return targetRoute;
  },
  closeGuestPrompt: () => set({ showGuestPrompt: false }),
}));

export const EXPERIENCE_USER_ID = '';
