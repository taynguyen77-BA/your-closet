import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import type { User as FirebaseUser, ConfirmationResult } from 'firebase/auth';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  RecaptchaVerifier,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signInWithCredential,
  signInWithCustomToken,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { AuthRequest } from 'expo-auth-session/build/AuthRequest';
import { makeRedirectUri } from 'expo-auth-session/build/AuthSession';
import { Prompt, ResponseType } from 'expo-auth-session/build/AuthRequest.types';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { User } from '@/models';
import { getFirebaseAuth, getFirebaseFirestore, getFirebaseStorage, getFirebaseStatus } from '@/services/firebase/config';

export type AuthProviderName = 'phone' | 'google' | 'facebook';
export const ONBOARDING_COMPLETED_KEY = 'your_closet_onboarding_completed';
export const GUEST_SESSION_KEY = 'your_closet_guest_session';
const BIOMETRIC_ENABLED_KEY = 'your_closet_biometric_enabled';
let phoneConfirmation: ConfirmationResult | null = null;

const auth = () => getFirebaseAuth();
const db = () => getFirebaseFirestore();
const redirectUri = () => makeRedirectUri({ scheme: 'tudocuaban', path: 'auth/callback', preferLocalhost: true });
const env = (key: string) => process.env[key]?.trim() ?? '';
const apiBaseUrl = () => process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_URL ?? '';

interface AuthSessionVerifyResponse {
  user: User;
  customToken?: string;
}

export function getMissingGoogleClientConfig() {
  if (Platform.OS === 'web') return [] as string[];
  const key = Platform.OS === 'ios' ? 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID' : 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID';
  return env(key) ? [] : [key];
}

export function friendlyAuthError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.includes('invalid-credential') || code.includes('user-not-found')) return 'Thông tin đăng nhập chưa đúng. Bạn thử lại nhé.';
  if (code.includes('missing-phone-number') || code.includes('invalid-phone-number')) return 'Số điện thoại chưa đúng định dạng. Hãy nhập kèm mã quốc gia, ví dụ +84.';
  if (code.includes('invalid-verification-code')) return 'Mã OTP chưa đúng. Bạn kiểm tra lại tin nhắn nhé.';
  if (code.includes('too-many-requests')) return 'Bạn thử lại sau ít phút nhé.';
  return error instanceof Error ? error.message : 'Chưa kết nối được. Bạn thử lại sau một chút nhé.';
}

export async function getOnboardingCompleted() {
  return (await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY)) === 'true';
}

export async function setOnboardingCompleted() {
  await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
}

export async function getGuestSessionEnabled() {
  return (await AsyncStorage.getItem(GUEST_SESSION_KEY)) === 'true';
}

export async function setGuestSessionEnabled(enabled: boolean) {
  if (enabled) await AsyncStorage.setItem(GUEST_SESSION_KEY, 'true');
  else await AsyncStorage.removeItem(GUEST_SESSION_KEY);
}

export function subscribeToFirebaseAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth(), callback);
}

export function resolveSupportedAuthProvider(firebaseUser: FirebaseUser): AuthProviderName {
  const providerIds = firebaseUser.providerData.map((provider) => provider.providerId);
  if (providerIds.includes('google.com')) return 'google';
  if (providerIds.includes('facebook.com')) return 'facebook';
  if (providerIds.includes('phone') || firebaseUser.phoneNumber) return 'phone';
  throw new Error('Ứng dụng chỉ hỗ trợ đăng nhập bằng số điện thoại OTP, Google hoặc Facebook.');
}

export async function ensureUserProfile(firebaseUser: FirebaseUser, provider: AuthProviderName): Promise<User> {
  const resolvedProvider = resolveSupportedAuthProvider(firebaseUser);
  if (provider !== resolvedProvider) throw new Error('Phiên đăng nhập không khớp nhà cung cấp được hỗ trợ.');
  const verified = await verifyAuthSession(firebaseUser);
  if (verified.customToken) {
    await signInWithCustomToken(auth(), verified.customToken);
  }
  return verified.user;
}

async function verifyAuthSession(firebaseUser: FirebaseUser): Promise<AuthSessionVerifyResponse> {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) throw new Error('API chưa được cấu hình để xác minh phiên đăng nhập.');
  const idToken = await firebaseUser.getIdToken(true).catch(async () => {
    await signOut(auth()).catch(() => undefined);
    throw new Error('Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại nhé.');
  });
  const response = await fetch(new URL('/api/auth/session/verify', baseUrl).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) {
    await signOut(auth()).catch(() => undefined);
    throw new Error(response.status === 401 ? 'Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại nhé.' : 'Không thể xác minh phiên đăng nhập.');
  }
  const body = await response.json() as { data?: AuthSessionVerifyResponse };
  if (!body.data?.user) throw new Error('Không thể xác minh hồ sơ đăng nhập.');
  return body.data;
}

export async function loginWithGoogle() {
  if (Platform.OS === 'web') {
    const credential = await signInWithPopup(auth(), new GoogleAuthProvider());
    return ensureUserProfile(credential.user, 'google');
  }
  const clientId = Platform.OS === 'ios' ? env('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID') : env('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID');
  if (!clientId) throw new Error(`Thiếu Google Client ID. Điền ${getMissingGoogleClientConfig().join(', ')} trong mobile/.env và bật Google provider trong Firebase.`);
  const request = new AuthRequest({
    clientId,
    redirectUri: redirectUri(),
    responseType: ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    usePKCE: false,
    prompt: Prompt.SelectAccount,
  });
  const result = await request.promptAsync({ authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' });
  if (result.type !== 'success' || !result.params.id_token) throw new Error('Google login chưa hoàn tất. Kiểm tra OAuth redirect URI và native client ID.');
  const credential = await signInWithCredential(auth(), GoogleAuthProvider.credential(result.params.id_token));
  return ensureUserProfile(credential.user, 'google');
}

export async function loginWithFacebook() {
  const appId = env('EXPO_PUBLIC_FACEBOOK_APP_ID');
  if (!appId) throw new Error('Thiếu EXPO_PUBLIC_FACEBOOK_APP_ID. Bật Facebook provider trong Firebase và cấu hình OAuth redirect URI.');
  if (Platform.OS === 'web') {
    const credential = await signInWithPopup(auth(), new FacebookAuthProvider());
    return ensureUserProfile(credential.user, 'facebook');
  }
  const request = new AuthRequest({
    clientId: appId,
    redirectUri: redirectUri(),
    responseType: ResponseType.Token,
    scopes: ['public_profile', 'email'],
    usePKCE: false,
  });
  const result = await request.promptAsync({ authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth' });
  if (result.type !== 'success' || !result.params.access_token) throw new Error('Facebook login chưa hoàn tất. Kiểm tra Facebook App ID và OAuth redirect URI.');
  const credential = await signInWithCredential(auth(), FacebookAuthProvider.credential(result.params.access_token));
  return ensureUserProfile(credential.user, 'facebook');
}

export async function loginWithPhone(phoneNumber: string) {
  if (Platform.OS !== 'web') throw new Error('Firebase Phone Auth trên Expo native cần native verification flow hoặc custom backend OTP.');
  const verifier = new RecaptchaVerifier(auth(), 'phone-recaptcha-container', { size: 'invisible' });
  phoneConfirmation = await signInWithPhoneNumber(auth(), phoneNumber.trim(), verifier);
}

export async function verifyOtp(code: string) {
  if (!phoneConfirmation) throw new Error('Bạn cần gửi OTP trước khi xác minh.');
  const credential = await phoneConfirmation.confirm(code.trim());
  phoneConfirmation = null;
  return ensureUserProfile(credential.user, 'phone');
}

export async function logoutFirebase() {
  await disableBiometric();
  await signOut(auth());
}

export async function getFreshIdToken() {
  const firebaseUser = auth().currentUser;
  if (!firebaseUser) throw new Error('Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại nhé.');
  return firebaseUser.getIdToken(true);
}

export async function requestAccountDeletion(idToken: string) {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) throw new Error('API chưa được cấu hình để xoá tài khoản.');
  const response = await fetch(new URL('/api/auth/account', baseUrl).toString(), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({} as { error?: string }));
    if (body.error === 'REAUTH_REQUIRED' || response.status === 401) throw new Error('Bạn cần xác minh lại danh tính trước khi xoá tài khoản.');
    throw new Error('Không thể xoá tài khoản. Bạn thử lại sau nhé.');
  }
}

export async function updateUserProfile(uid: string, patch: Partial<User>) {
  await updateDoc(doc(db(), 'users', uid), { ...patch, updatedAt: serverTimestamp() });
  const firebaseUser = auth().currentUser;
  if (firebaseUser && (patch.name || patch.avatarUrl)) {
    await updateFirebaseProfile(firebaseUser, { displayName: patch.name, photoURL: patch.avatarUrl });
  }
}

export async function uploadAvatarFile(uid: string, uri: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Tệp đã chọn không phải là ảnh.');
  const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  const storageRef = ref(getFirebaseStorage(), `avatars/${uid}/profile.${extension}`);
  await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(storageRef);
}

export const uploadAvatar = uploadAvatarFile;

export async function getBiometricEnabled() {
  if (Platform.OS === 'web') return false;
  return (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === 'true';
}

export async function enableBiometricPreference() {
  if (Platform.OS === 'web') throw new Error('Sinh trắc học không hỗ trợ trên web.');
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!compatible || !enrolled) throw new Error('Thiết bị chưa bật Face ID, Touch ID hoặc vân tay.');
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
  return true;
}

export async function disableBiometricPreference() {
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
}

export async function verifyDeviceBiometric() {
  if (Platform.OS === 'web') return true;
  const enabled = await getBiometricEnabled();
  if (!enabled) return true;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Mở Tủ đồ của bạn',
    cancelLabel: 'Đăng nhập lại',
    fallbackLabel: 'Dùng mật mã',
  });
  return result.success;
}

export const enableBiometric = enableBiometricPreference;
export const disableBiometric = disableBiometricPreference;
export const verifyBiometric = verifyDeviceBiometric;

export function assertFirebaseReady() {
  const status = getFirebaseStatus();
  if (!status.isConfigured) throw new Error(`Thiếu cấu hình Firebase: ${status.missing.join(', ')}`);
}
