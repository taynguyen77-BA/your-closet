import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail,
  signInWithEmailAndPassword, signOut, updateProfile,
} from 'firebase/auth';
import { PLAN_LIMITS } from '@/constants/membership';
import type { User } from '@/models';
import { getFirebaseAuth, getFirebaseStatus } from '@/services/firebase/config';
import { usersService } from '@/services/firebase';

const GUEST_ID = 'user-1';
let unsubscribe: (() => void) | undefined;
const now = () => new Date().toISOString();
const friendlyError = (error: unknown) => {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Email hoặc mật khẩu chưa đúng. Thử lại nhé.';
  if (code.includes('email-already-in-use')) return 'Email này đã có tài khoản. Bạn thử đăng nhập nhé.';
  if (code.includes('weak-password')) return 'Mật khẩu cần ít nhất 6 ký tự.';
  if (code.includes('invalid-email')) return 'Email chưa đúng định dạng.';
  if (code.includes('too-many-requests')) return 'Bạn thử lại sau ít phút nhé.';
  return 'Chưa kết nối được. Bạn thử lại sau một chút nhé.';
};
const profileFor = (firebaseUser: FirebaseUser, name?: string): User => ({
  id: firebaseUser.uid, name: name ?? firebaseUser.displayName ?? 'Bạn mới',
  username: '', email: firebaseUser.email ?? '', plan: 'free',
  aiUsageRemaining: PLAN_LIMITS.free.aiMonthly, aiUsageMonthlyLimit: PLAN_LIMITS.free.aiMonthly,
  aiQuotaPeriod: new Date().toISOString().slice(0, 7), closetItemLimit: PLAN_LIMITS.free.closetItems,
  closetItemCount: 0, authProvider: firebaseUser.providerData[0]?.providerId ?? 'password',
  hasCompletedOnboarding: false, status: 'active', createdAt: now(), lastLoginAt: now(),
});

interface OnboardingPayload { username: string; fashionStyle?: string; favoriteColors?: string[]; fashionGoals?: string[]; avatarUrl?: string }
interface AuthState {
  firebaseUser: FirebaseUser | null; appUser: User | null; isAuthenticated: boolean; isGuest: boolean;
  isAuthLoading: boolean; authError?: string; hasCompletedOnboarding: boolean; showGuestPrompt: boolean;
  initializeAuth: () => void; login: (email: string, password: string) => Promise<boolean>;
  register: (value: { name: string; email: string; password: string }) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>; logout: () => Promise<void>;
  continueAsGuest: () => void; updateOnboarding: (payload: OnboardingPayload) => Promise<void>;
  requireAccount: () => boolean; closeGuestPrompt: () => void;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null, appUser: null, isAuthenticated: false, isGuest: false, isAuthLoading: true,
  hasCompletedOnboarding: false, showGuestPrompt: false,
  initializeAuth: () => {
    if (!getFirebaseStatus().isConfigured) return set({ isGuest: true, isAuthLoading: false });
    if (unsubscribe) return;
    unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      if (!firebaseUser) return set({ firebaseUser: null, appUser: null, isAuthenticated: false, isGuest: false, isAuthLoading: false, hasCompletedOnboarding: false });
      try {
        const appUser = await usersService.get(firebaseUser.uid);
        set({ firebaseUser, appUser: appUser ?? profileFor(firebaseUser), isAuthenticated: true, isGuest: false, isAuthLoading: false, hasCompletedOnboarding: Boolean(appUser?.hasCompletedOnboarding) });
        if (appUser) await usersService.update(firebaseUser.uid, { lastLoginAt: now() });
      } catch { set({ firebaseUser, appUser: profileFor(firebaseUser), isAuthenticated: true, isGuest: false, isAuthLoading: false }); }
    });
  },
  login: async (email, password) => {
    set({ isAuthLoading: true, authError: undefined });
    try { await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password); return true; }
    catch (error) { set({ isAuthLoading: false, authError: friendlyError(error) }); return false; }
  },
  register: async ({ name, email, password }) => {
    set({ isAuthLoading: true, authError: undefined });
    try {
      const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      await updateProfile(credential.user, { displayName: name.trim() });
      const appUser = profileFor(credential.user, name.trim()); await usersService.create(appUser);
      set({ firebaseUser: credential.user, appUser, isAuthenticated: true, isGuest: false, isAuthLoading: false });
      return true;
    } catch (error) { set({ isAuthLoading: false, authError: friendlyError(error) }); return false; }
  },
  sendPasswordReset: async (email) => {
    set({ authError: undefined });
    try { await sendPasswordResetEmail(getFirebaseAuth(), email.trim()); return true; }
    catch (error) { set({ authError: friendlyError(error) }); return false; }
  },
  logout: async () => {
    if (getFirebaseStatus().isConfigured && get().firebaseUser) await signOut(getFirebaseAuth());
    set({ firebaseUser: null, appUser: null, isAuthenticated: false, isGuest: false, hasCompletedOnboarding: false });
  },
  continueAsGuest: () => set({ firebaseUser: null, appUser: null, isAuthenticated: false, isGuest: true, isAuthLoading: false }),
  updateOnboarding: async (payload) => {
    const user = get().appUser; if (!user) return;
    const patch = { ...payload, hasCompletedOnboarding: true, updatedAt: now() };
    await usersService.update(user.id, patch); set({ appUser: { ...user, ...patch }, hasCompletedOnboarding: true });
  },
  requireAccount: () => { if (!get().isGuest) return true; set({ showGuestPrompt: true }); return false; },
  closeGuestPrompt: () => set({ showGuestPrompt: false }),
}));
export const EXPERIENCE_USER_ID = GUEST_ID;
