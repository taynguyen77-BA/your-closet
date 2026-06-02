import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseDb, getFirebaseStorage } from './config';

type Entity = { id: string };
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createRepository<T extends Entity>(collectionName: string) {
  return {
    async list(userId?: string): Promise<T[]> {
      const source = userId
        ? query(collection(getFirebaseDb(), collectionName), where('userId', '==', userId))
        : collection(getFirebaseDb(), collectionName);
      const snapshot = await getDocs(source);
      return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
    },
    async listBy(field: keyof T & string, value: unknown): Promise<T[]> {
      const snapshot = await getDocs(query(collection(getFirebaseDb(), collectionName), where(field, '==', value)));
      return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
    },
    async get(id: string): Promise<T | undefined> {
      const snapshot = await getDoc(doc(getFirebaseDb(), collectionName, id));
      return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : undefined;
    },
    async create(value: Omit<T, 'id'> & { id?: string }): Promise<T> {
      const { id, ...data } = value;
      if (id) {
        await setDoc(doc(getFirebaseDb(), collectionName, id), clean(data));
        return { id, ...data } as T;
      }
      const created = await addDoc(collection(getFirebaseDb(), collectionName), clean(data));
      return { id: created.id, ...data } as T;
    },
    async update(id: string, patch: Partial<T>): Promise<void> {
      const { id: _id, ...data } = patch;
      await updateDoc(doc(getFirebaseDb(), collectionName, id), clean(data));
    },
    async remove(id: string): Promise<void> {
      await deleteDoc(doc(getFirebaseDb(), collectionName, id));
    },
  };
}

export async function uploadImage(userId: string, uri: string): Promise<string> {
  if (!uri) throw new Error('Không tìm thấy ảnh để tải lên.');
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Không đọc được ảnh đã chọn.');
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Tệp đã chọn không phải là ảnh.');
  if (blob.size === 0) throw new Error('Ảnh đã chọn đang trống.');
  if (blob.size > 10 * 1024 * 1024) throw new Error('Ảnh vượt quá giới hạn 10 MB.');
  const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `clothes/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(storageRef);
}
