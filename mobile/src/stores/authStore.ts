import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User } from '@/models';
import {
  assertFirebaseReady,
  disableBiometric as disableBiometricPreference,
  enableBiometric as enableBiometricPreference,
  ensureUserProfile,
  friendlyAuthError,
  getBiometricEnabled,
  getOnboardingCompleted,
  loginWithEmail as emailLogin,
  loginWithFacebook as facebookLogin,
  loginWithGoogle as googleLogin,
  loginWithPhone as phoneLogin,
  logoutFirebase,
  registerWithEmail as emailRegister,
  sendResetEmail,
  setOnboardingCompleted,
  subscribeToFirebaseAuth,
  updateUserProfile,
  uploadAvatar as uploadAvatarFile,
  verifyBiometric as verifyDeviceBiometric,
  verifyOtp as otpVerify,
} from '@/services/auth/authService';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
let unsubscribe: (() => void) | undefined;

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
  authError?: string;
  firebaseSetupError?: string;
  showGuestPrompt: boolean;
  onboardingCompleted: boolean;
  biometricEnabled: boolean;
  biometricVerified: boolean;
  initializeAuth: () => Promise<void>;
  completeFirstLaunchOnboarding: () => Promise<void>;
  loginWithPhone: (phoneNumber: string) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithFacebook: () => Promise<boolean>;
  registerWithEmail: (value: { name: string; email: string; password: string }) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<boolean>;
  uploadAvatar: (uri: string) => Promise<string | null>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  verifyBiometric: () => Promise<boolean>;
  markBiometricRequired: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (value: { name: string; email: string; password: string }) => Promise<boolean>;
  updateOnboarding: (payload: OnboardingPayload) => Promise<void>;
  requireAccount: () => boolean;
  closeGuestPrompt: () => void;
}

const setFailure = (set: (patch: Partial<AuthState>) => void, error: unknown) => {
  set({ isAuthLoading: false, authError: friendlyAuthError(error) });
};

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  currentUser: null,
  appUser: null,
  authStatus: 'loading',
  isAuthLoading: true,
  isAuthenticated: false,
  showGuestPrompt: false,
  onboardingCompleted: false,
  biometricEnabled: false,
  biometricVerified: false,
  initializeAuth: async () => {
    try {
      assertFirebaseReady();
      const [onboardingCompleted, biometricEnabled] = await Promise.all([getOnboardingCompleted(), getBiometricEnabled()]);
      set({ onboardingCompleted, biometricEnabled, isAuthLoading: true, authStatus: 'loading', firebaseSetupError: undefined });
      if (unsubscribe) return;
      unsubscribe = subscribeToFirebaseAuth(async (firebaseUser) => {
        if (!firebaseUser) {
          set({ firebaseUser: null, currentUser: null, appUser: null, authStatus: 'unauthenticated', isAuthenticated: false, isAuthLoading: false, biometricVerified: false });
          return;
        }
        try {
          const provider = firebaseUser.providerData[0]?.providerId?.includes('phone') ? 'phone' : firebaseUser.providerData[0]?.providerId?.includes('facebook') ? 'facebook' : firebaseUser.providerData[0]?.providerId?.includes('google') ? 'google' : 'email';
          const currentUser = await ensureUserProfile(firebaseUser, provider);
          const needsBiometric = await getBiometricEnabled();
          set({
            firebaseUser,
            currentUser,
            appUser: currentUser,
            authStatus: 'authenticated',
            isAuthenticated: true,
            isAuthLoading: false,
            biometricEnabled: needsBiometric,
            biometricVerified: !needsBiometric,
          });
        } catch (error) {
          setFailure(set, error);
        }
      });
    } catch (error) {
      set({ firebaseSetupError: friendlyAuthError(error), authStatus: 'unauthenticated', isAuthLoading: false, isAuthenticated: false });
    }
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
    set({ isAuthLoading: true, authError: undefined });
    try {
      const currentUser = await otpVerify(code);
      set({ currentUser, appUser: currentUser, authStatus: 'authenticated', isAuthenticated: true, isAuthLoading: false });
      return true;
    } catch (error) { setFailure(set, error); return false; }
  },
  loginWithGoogle: async () => {
    set({ isAuthLoading: true, authError: undefined });
    try { const currentUser = await googleLogin(); set({ currentUser, appUser: currentUser, isAuthLoading: false }); return true; }
    catch (error) { setFailure(set, error); return false; }
  },
  loginWithFacebook: async () => {
    set({ isAuthLoading: true, authError: undefined });
    try { const currentUser = await facebookLogin(); set({ currentUser, appUser: currentUser, isAuthLoading: false }); return true; }
    catch (error) { setFailure(set, error); return false; }
  },
  registerWithEmail: async ({ name, email, password }) => {
    set({ isAuthLoading: true, authError: undefined });
    try { const currentUser = await emailRegister(name, email, password); set({ currentUser, appUser: currentUser, isAuthLoading: false }); return true; }
    catch (error) { setFailure(set, error); return false; }
  },
  loginWithEmail: async (email, password) => {
    set({ isAuthLoading: true, authError: undefined });
    try { const currentUser = await emailLogin(email, password); set({ currentUser, appUser: currentUser, isAuthLoading: false }); return true; }
    catch (error) { setFailure(set, error); return false; }
  },
  sendPasswordReset: async (email) => {
    set({ authError: undefined });
    try { await sendResetEmail(email); return true; }
    catch (error) { set({ authError: friendlyAuthError(error) }); return false; }
  },
  logout: async () => {
    try { await logoutFirebase(); } finally {
      set({ firebaseUser: null, currentUser: null, appUser: null, authStatus: 'unauthenticated', isAuthenticated: false, biometricEnabled: false, biometricVerified: false, isAuthLoading: false });
    }
  },
  updateProfile: async (patch) => {
    const user = get().currentUser; if (!user) return false;
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
  login: (email, password) => get().loginWithEmail(email, password),
  register: (value) => get().registerWithEmail(value),
  updateOnboarding: async (payload) => {
    await get().updateProfile({ ...payload, hasCompletedOnboarding: true });
  },
  requireAccount: () => get().isAuthenticated,
  closeGuestPrompt: () => undefined,
}));

export const EXPERIENCE_USER_ID = '';
