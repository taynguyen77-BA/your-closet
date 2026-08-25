import { getFirebaseAuth, isFirebaseConfigured } from '@/services/firebase/config';
import { frontendBuildSha } from '@/constants/runtime';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_URL ?? '';
export interface ApiMeta { total: number; limit: number; cursor: string | null }
export interface ApiEnvelope<T> { data: T; meta: ApiMeta }
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

export async function apiFetch<T>(path: string, options?: RequestInit & { params?: Record<string, string> }): Promise<T> {
  if (!BASE_URL) throw new ApiError('API chưa được cấu hình.', 503);
  const url = new URL(path, BASE_URL);
  Object.entries(options?.params ?? {}).forEach(([key, value]) => value && url.searchParams.set(key, value));
  const isManus = process.env.EXPO_PUBLIC_WARDRO_RUNTIME_MODE === 'manus';
  const token = !isManus && isFirebaseConfigured() ? await getFirebaseAuth().currentUser?.getIdToken() : undefined;
  const headers = new Headers(options?.headers);
  const isMultipart = typeof FormData !== 'undefined' && options?.body instanceof FormData;
  if (!isMultipart && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (isManus) headers.set('X-Wardro-Dev-User', process.env.EXPO_PUBLIC_WARDRO_MANUS_USER?.trim() || 'manus-user-a');
  headers.set('X-Wardro-Frontend-SHA', frontendBuildSha);
  const response = await fetch(url.toString(), { ...options, headers });
  if (!response.ok) throw new ApiError(response.status === 401 ? 'Bạn cần đăng nhập để tiếp tục.' : 'Không thể tải dữ liệu. Thử lại nhé.', response.status);
  if (response.status === 204) return undefined as T;
  return (await response.json() as ApiEnvelope<T>).data;
}
