export type IntelligenceSort = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'wear_count_desc' | 'wear_count_asc';

export interface WardrobeIntelligence {
  schemaVersion: 1;
  category: { raw: string; normalized: string; display: string };
  subcategory?: { raw: string; normalized: string; display: string };
  colors: Array<{ raw: string; normalized: string; display: string }>;
  pattern?: { raw: string; normalized: string; display: string };
  material?: { raw: string; normalized: string; display: string };
  style?: { raw: string; normalized: string; display: string };
  seasons: Array<{ raw: string; normalized: string; display: string }>;
  occasions: Array<{ raw: string; normalized: string; display: string }>;
  brand?: { raw: string; normalized: string; display: string };
  size?: { raw: string; normalized: string; display: string };
  status: 'active' | 'archived';
  source: 'user' | 'ai' | 'mixed';
  confidence?: number;
}

export interface WardrobeQuery {
  category?: string;
  subcategory?: string;
  color?: string;
  style?: string;
  season?: string;
  occasion?: string;
  search?: string;
  status?: 'active' | 'archived';
  sort: IntelligenceSort;
  limit: number;
  cursor: number;
}

export interface WardrobeQueryResult<T> {
  items: T[];
  total: number;
  limit: number;
  cursor: string | null;
  facets: {
    categories: Array<{ value: string; display: string; count: number }>;
    colors: Array<{ value: string; display: string; count: number }>;
  };
}

const CATEGORY_DISPLAY: Record<string, string> = {
  top: 'Áo', bottom: 'Quần', dress: 'Váy / Đầm', outerwear: 'Áo khoác', shoes: 'Giày', accessory: 'Phụ kiện', bag: 'Túi', other: 'Khác',
};
const COLOR_DISPLAY: Record<string, string> = {
  black: 'Đen', white: 'Trắng', 'off-white': 'Trắng ngà', cream: 'Kem', beige: 'Be', brown: 'Nâu', gray: 'Xám', grey: 'Xám', navy: 'Xanh navy', blue: 'Xanh dương', green: 'Xanh lá', red: 'Đỏ', pink: 'Hồng', purple: 'Tím', yellow: 'Vàng', orange: 'Cam', multi: 'Nhiều màu',
};
const SIMPLE_DISPLAY: Record<string, string> = {
  casual: 'Hằng ngày', formal: 'Trang trọng', work: 'Công sở', party: 'Dự tiệc', wedding: 'Đám cưới', travel: 'Du lịch', summer: 'Mùa hè', winter: 'Mùa đông', spring: 'Mùa xuân', autumn: 'Mùa thu', fall: 'Mùa thu',
};

const compact = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ');
const normalized = (value: unknown) => compact(value).toLocaleLowerCase('en-US').replace(/[–—]/g, '-');
const token = (value: unknown) => normalized(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const display = (value: string, dictionary: Record<string, string>) => dictionary[value] ?? SIMPLE_DISPLAY[value] ?? value;
const field = (raw: unknown, dictionary: Record<string, string> = {}): { raw: string; normalized: string; display: string } | undefined => {
  const clean = compact(raw);
  return clean ? { raw: clean, normalized: normalized(clean), display: display(normalized(clean), dictionary) } : undefined;
};

function aliases(value: string) {
  const key = normalized(value);
  const map: Record<string, string> = { tshirt: 'top', 't-shirt': 'top', tee: 'top', shirt: 'top', blouse: 'top', trousers: 'bottom', pants: 'bottom', jeans: 'bottom', sneaker: 'shoes', sneakers: 'shoes', handbag: 'bag', purse: 'bag', grey: 'gray', fall: 'autumn' };
  return map[key] ?? key;
}

export function normalizeWardrobeIntelligence(input: Record<string, unknown>): WardrobeIntelligence {
  const rawType = compact(input.type) || 'other';
  const category = field(rawType, CATEGORY_DISPLAY)!;
  category.normalized = aliases(category.raw);
  category.display = CATEGORY_DISPLAY[category.normalized] ?? category.display;
  const rawColors = Array.isArray(input.secondaryColors) ? [input.color, ...input.secondaryColors] : [input.color];
  const colors = rawColors.map((value) => {
    const entry = field(value, COLOR_DISPLAY);
    if (!entry) return undefined;
    entry.normalized = aliases(entry.raw);
    entry.display = COLOR_DISPLAY[entry.normalized] ?? entry.display;
    return entry;
  }).filter(Boolean) as WardrobeIntelligence['colors'];
  const seasons = (Array.isArray(input.season) ? input.season : []).map((value) => field(value, SIMPLE_DISPLAY)).filter(Boolean) as WardrobeIntelligence['seasons'];
  const occasions = (Array.isArray(input.occasion) ? input.occasion : []).map((value) => field(value, SIMPLE_DISPLAY)).filter(Boolean) as WardrobeIntelligence['occasions'];
  const aiConfidence = Number(input.aiConfidenceScore);
  const source = input.aiMetadata && Object.keys(input.aiMetadata as object).length ? 'mixed' : 'user';
  return {
    schemaVersion: 1,
    category,
    subcategory: field(input.subcategory),
    colors,
    pattern: field(input.pattern),
    material: field(input.material),
    style: field(input.style),
    seasons,
    occasions,
    brand: field(input.brand),
    size: field(input.size),
    status: input.status === 'archived' ? 'archived' : 'active',
    source,
    confidence: Number.isFinite(aiConfidence) && aiConfidence >= 0 && aiConfidence <= 1 ? aiConfidence : undefined,
  };
}

function values(item: Record<string, unknown>, key: keyof WardrobeIntelligence) {
  const intelligence = item.intelligence as WardrobeIntelligence | undefined;
  const value = intelligence?.[key];
  if (Array.isArray(value)) return value.map((entry) => normalized((entry as { normalized?: string }).normalized));
  if (value && typeof value === 'object') return [normalized((value as { normalized?: string }).normalized)];
  return [];
}

function matches(item: Record<string, unknown>, query: WardrobeQuery) {
  const intelligence = (item.intelligence as WardrobeIntelligence | undefined) ?? normalizeWardrobeIntelligence(item);
  const category = values({ ...item, intelligence }, 'category');
  const subcategory = values({ ...item, intelligence }, 'subcategory');
  const colors = values({ ...item, intelligence }, 'colors');
  const style = values({ ...item, intelligence }, 'style');
  const seasons = values({ ...item, intelligence }, 'seasons');
  const occasions = values({ ...item, intelligence }, 'occasions');
  const fieldMatches = (needle: string | undefined, haystack: string[]) => !needle || haystack.includes(aliases(needle));
  if (!fieldMatches(query.category, category) || !fieldMatches(query.subcategory, subcategory) || !fieldMatches(query.color, colors) || !fieldMatches(query.style, style) || !fieldMatches(query.season, seasons) || !fieldMatches(query.occasion, occasions)) return false;
  if (query.status && (intelligence?.status ?? 'active') !== query.status) return false;
  if (query.search) {
    const haystack = [item.name, item.type, item.color, item.style, item.material, ...(Array.isArray(item.tags) ? item.tags : []), ...category, ...colors, ...style].map(token).join(' ');
    if (!haystack.includes(token(query.search))) return false;
  }
  return true;
}

function sortItems(items: Record<string, unknown>[], sort: IntelligenceSort) {
  return [...items].sort((a, b) => {
    if (sort === 'name_asc' || sort === 'name_desc') {
      const result = compact(a.name).localeCompare(compact(b.name), 'vi', { sensitivity: 'base' });
      return sort === 'name_asc' ? result : -result;
    }
    if (sort === 'wear_count_desc' || sort === 'wear_count_asc') {
      const result = Number(a.timesWorn ?? 0) - Number(b.timesWorn ?? 0);
      return sort === 'wear_count_asc' ? result : -result;
    }
    const result = compact(a.createdAt).localeCompare(compact(b.createdAt));
    return sort === 'oldest' ? result : -result;
  });
}

export function parseWardrobeQuery(params: URLSearchParams): WardrobeQuery {
  const allowedSort = new Set<IntelligenceSort>(['newest', 'oldest', 'name_asc', 'name_desc', 'wear_count_desc', 'wear_count_asc']);
  const sort = (params.get('sort') || 'newest') as IntelligenceSort;
  if (!allowedSort.has(sort)) throw new Error('INVALID_SORT');
  const limitValue = params.get('limit');
  const limit = limitValue == null ? 24 : Number(limitValue);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error('INVALID_LIMIT');
  const cursorValue = params.get('cursor');
  const cursor = cursorValue == null || cursorValue === '' ? 0 : Number(cursorValue);
  if (!Number.isInteger(cursor) || cursor < 0 || cursor > 100000) throw new Error('INVALID_CURSOR');
  const text = (name: string) => {
    const value = params.get(name)?.trim();
    if (!value) return undefined;
    if (value.length > 80 || /[\u0000-\u001F]/.test(value)) throw new Error(`INVALID_${name.toUpperCase()}`);
    return value;
  };
  const status = text('status');
  if (status && status !== 'active' && status !== 'archived') throw new Error('INVALID_STATUS');
  return { category: text('category'), subcategory: text('subcategory'), color: text('color'), style: text('style'), season: text('season'), occasion: text('occasion'), search: text('search'), status: status as WardrobeQuery['status'], sort, limit, cursor };
}

export function queryWardrobeItems<T extends Record<string, unknown>>(items: T[], query: WardrobeQuery): WardrobeQueryResult<T> {
  const filtered = sortItems(items.filter((item) => matches(item, query)), query.sort) as T[];
  const page = filtered.slice(query.cursor, query.cursor + query.limit);
  const nextCursor = query.cursor + page.length < filtered.length ? String(query.cursor + page.length) : null;
  const categoryCounts = new Map<string, { display: string; count: number }>();
  const colorCounts = new Map<string, { display: string; count: number }>();
  for (const item of filtered) {
    const intelligence = (item.intelligence as WardrobeIntelligence | undefined) ?? normalizeWardrobeIntelligence(item);
    if (intelligence?.category) {
      const key = intelligence.category.normalized;
      categoryCounts.set(key, { display: intelligence.category.display, count: (categoryCounts.get(key)?.count ?? 0) + 1 });
    }
    for (const color of intelligence?.colors ?? []) colorCounts.set(color.normalized, { display: color.display, count: (colorCounts.get(color.normalized)?.count ?? 0) + 1 });
  }
  const byCount = (a: [string, { display: string; count: number }], b: [string, { display: string; count: number }]) => b[1].count - a[1].count || a[0].localeCompare(b[0]);
  return { items: page, total: filtered.length, limit: query.limit, cursor: nextCursor, facets: { categories: [...categoryCounts.entries()].sort(byCount).map(([value, entry]) => ({ value, ...entry })), colors: [...colorCounts.entries()].sort(byCount).map(([value, entry]) => ({ value, ...entry })) } };
}
