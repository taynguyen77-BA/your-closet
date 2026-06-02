import { getFirebaseAuth, isFirebaseConfigured } from '@/services/firebase/config';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
export interface ApiMeta { total: number; limit: number; cursor: string | null }
export interface ApiEnvelope<T> { data: T; meta: ApiMeta }
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

export async function apiFetch<T>(path: string, options?: RequestInit & { params?: Record<string, string> }): Promise<T> {
  if (!BASE_URL) throw new ApiError('API chưa được cấu hình.', 503);
  const url = new URL(path, BASE_URL);
  Object.entries(options?.params ?? {}).forEach(([key, value]) => value && url.searchParams.set(key, value));
  const token = isFirebaseConfigured() ? await getFirebaseAuth().currentUser?.getIdToken() : undefined;
  const response = await fetch(url.toString(), {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options?.headers },
  });
  if (!response.ok) throw new ApiError(response.status === 401 ? 'Bạn cần đăng nhập để tiếp tục.' : 'Không thể tải dữ liệu. Thử lại nhé.', response.status);
  if (response.status === 204) return undefined as T;
  return (await response.json() as ApiEnvelope<T>).data;
}
