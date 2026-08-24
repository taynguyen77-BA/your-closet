import type { ClothingItem } from '@/models';
import { apiFetch } from './client';

export interface WardrobeUploadResult {
  url: string;
  path: string;
  contentType: string;
  sizeBytes: number;
}

const requestId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

export const wardrobeUploadService = {
  upload: async (uri: string, id = requestId('wardrobe-upload')): Promise<WardrobeUploadResult> => {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Không đọc được ảnh đã chọn.');
    const blob = await response.blob();
    const form = new FormData();
    form.append('image', blob, `wardrobe-upload-${id}.jpg`);
    return apiFetch<WardrobeUploadResult>('/api/wardrobe/upload', {
      method: 'POST',
      body: form,
      headers: { 'Idempotency-Key': id, 'X-Request-Id': id },
    });
  },
  remove: (path: string, id = requestId('wardrobe-cleanup')) => apiFetch<void>('/api/wardrobe/upload', {
    method: 'DELETE',
    params: { path },
    headers: { 'X-Request-Id': id },
  }),
};

export const wardrobeItemsService = {
  create: (value: Omit<ClothingItem, 'id' | 'imageUrl'> & { imageUrl: string }, id = requestId('wardrobe-create')) => apiFetch<{ item: ClothingItem; replayed?: boolean }>('/api/wardrobe/items', {
    method: 'POST', body: JSON.stringify(value), headers: { 'Idempotency-Key': id, 'X-Request-Id': id },
  }),
  get: (id: string) => apiFetch<ClothingItem>(`/api/wardrobe/items/${id}`),
  update: (id: string, patch: Partial<ClothingItem>, requestIdValue = requestId('wardrobe-update')) => apiFetch<ClothingItem>(`/api/wardrobe/items/${id}`, {
    method: 'PATCH', body: JSON.stringify(patch), headers: { 'Idempotency-Key': requestIdValue, 'X-Request-Id': requestIdValue },
  }),
  remove: (id: string, requestIdValue = requestId('wardrobe-delete')) => apiFetch<void>(`/api/wardrobe/items/${id}`, {
    method: 'DELETE', headers: { 'Idempotency-Key': requestIdValue, 'X-Request-Id': requestIdValue },
  }),
};
