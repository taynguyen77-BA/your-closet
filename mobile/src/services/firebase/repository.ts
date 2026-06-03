import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseStorage } from './config';

export async function uploadImage(userId: string, uri: string): Promise<string> {
  if (!uri) throw new Error('Không tìm thấy ảnh để tải lên.');
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Không đọc được ảnh đã chọn.');
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Tệp đã chọn không phải là ảnh.');
  if (blob.size === 0) throw new Error('Ảnh đã chọn đang trống.');
  if (blob.size > 10 * 1024 * 1024) throw new Error('Ảnh vượt quá giới hạn 10 MB.');
  const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `users/${userId}/clothes/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(storageRef);
}
