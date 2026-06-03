import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseStatus,
  getFirebaseStorage,
} from '@/services/firebase/config';
import { uploadImage } from '@/services/firebase/repository';

export const auth = getFirebaseAuth;
export const db = getFirebaseFirestore;
export const storage = getFirebaseStorage;

export function assertFirebaseReady() {
  const status = getFirebaseStatus();
  if (!status.isConfigured) {
    throw new Error(`Thiếu cấu hình Firebase: ${status.missing.join(', ')}. Điền EXPO_PUBLIC_FIREBASE_* trong mobile/.env.`);
  }
}

export async function uploadAvatarImage(userId: string, uri: string): Promise<string> {
  assertFirebaseReady();
  if (!uri) throw new Error('Không tìm thấy ảnh avatar để tải lên.');
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Không đọc được ảnh đã chọn.');
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Tệp đã chọn không phải là ảnh.');
  if (blob.size > 5 * 1024 * 1024) throw new Error('Avatar vượt quá giới hạn 5 MB.');
  const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  const storageRef = ref(getFirebaseStorage(), `avatars/${userId}/profile-${Date.now()}.${extension}`);
  await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(storageRef);
}

export const clothingImagesService = { upload: uploadImage };
