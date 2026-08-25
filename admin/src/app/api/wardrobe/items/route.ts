import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authenticate } from "@/lib/server/authorize";
import { adminDb } from "@/lib/server/firebase-admin";
import { corsHeaders } from "@/lib/server/resources";
import { isManusRuntime } from "@/lib/server/runtime";
import { createManusClothing } from "@/lib/server/manus-data";
import { isManusStorageUrl } from "@/lib/server/manus-storage";

export const runtime = "nodejs";

const CLOTHES = "clothes";
const REQUESTS = "wardrobe_requests";
const MAX_TEXT = 120;
const MAX_ARRAY = 20;
const MAX_BODY_BYTES = 256 * 1024;
const CLOTHING_TYPES = new Set(["top", "bottom", "dress", "outerwear", "shoes", "accessory", "bag", "other"]);

type WardrobePayload = {
  userId: string;
  name: string;
  imageUrl: string;
  storagePath: string;
  originalImageUrl?: string;
  originalStoragePath?: string;
  enhancedImageUrl?: string;
  type: string;
  material?: string;
  color: string;
  style?: string;
  season?: string[];
  tags: string[];
  aiMetadata?: Record<string, unknown>;
  aiConfidenceScore?: number;
  aiQualityWarnings?: string[];
  isFavorite: boolean;
  timesWorn: number;
  createdAt?: string;
};

function requestId(request: NextRequest) {
  return request.headers.get("x-request-id")?.slice(0, 120) || randomUUID();
}

function idempotencyKey(request: NextRequest) {
  return request.headers.get("idempotency-key")?.trim().slice(0, 200) || null;
}

function hashKey(uid: string, key: string) {
  return createHash("sha256").update(`${uid}:${key}`).digest("hex");
}

function fail(code: string, status: number, traceId: string) {
  return NextResponse.json({ error: { code, message: code === "UNAUTHORIZED" ? "Bạn cần đăng nhập để lưu món đồ." : code === "FORBIDDEN" ? "Bạn không có quyền với món đồ này." : code === "CLOSET_LIMIT_REACHED" ? "Tủ đồ đã đạt giới hạn của gói hiện tại." : "Không thể lưu món đồ.", requestId: traceId } }, { status, headers: { ...corsHeaders, "X-Request-Id": traceId } });
}

function ownedStoragePath(uid: string, path: string | undefined) {
  if (!path) return null;
  const prefix = `users/${uid}/clothes/`;
  if (!path.startsWith(prefix)) return null;
  const file = path.slice(prefix.length);
  return /^[a-zA-Z0-9_-]{10,80}\.(jpg|png|webp)$/.test(file) ? path : null;
}

function validDownloadUrl(value: unknown, path?: string) {
  return isManusRuntime() ? isManusStorageUrl(value, path) : typeof value === "string" && value.startsWith("https://firebasestorage.googleapis.com/");
}

function asString(value: unknown, field: string, max = MAX_TEXT) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`INVALID_${field.toUpperCase()}`);
  return value.trim();
}

function asStringArray(value: unknown, field: string) {
  if (!Array.isArray(value) || value.length > MAX_ARRAY || value.some((item) => typeof item !== "string" || item.length > MAX_TEXT)) throw new Error(`INVALID_${field.toUpperCase()}`);
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function normalizePayload(uid: string, raw: Record<string, unknown>): WardrobePayload {
  const userId = asString(raw.userId, "userId", 160);
  if (userId !== uid) throw new Error("FORBIDDEN");
  const storagePath = ownedStoragePath(uid, typeof raw.storagePath === "string" ? raw.storagePath : undefined);
  if (!storagePath || !validDownloadUrl(raw.imageUrl, storagePath)) throw new Error("INVALID_STORAGE_REFERENCE");
  const originalStoragePath = raw.originalStoragePath == null ? storagePath : ownedStoragePath(uid, String(raw.originalStoragePath));
  if (!originalStoragePath || (raw.originalImageUrl != null && !validDownloadUrl(raw.originalImageUrl, originalStoragePath))) throw new Error("INVALID_STORAGE_REFERENCE");
  const type = asString(raw.type, "type", 30).toLowerCase();
  if (!CLOTHING_TYPES.has(type)) throw new Error("INVALID_TYPE");
  const season = raw.season == null ? [] : asStringArray(raw.season, "season");
  const tags = asStringArray(raw.tags, "tags");
  const confidence = raw.aiConfidenceScore == null ? undefined : Number(raw.aiConfidenceScore);
  if (confidence != null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)) throw new Error("INVALID_AI_CONFIDENCE");
  return {
    userId: uid,
    name: asString(raw.name, "name"),
    imageUrl: String(raw.imageUrl),
    storagePath,
    originalImageUrl: raw.originalImageUrl == null ? String(raw.imageUrl) : String(raw.originalImageUrl),
    originalStoragePath,
    enhancedImageUrl: raw.enhancedImageUrl == null ? undefined : String(raw.enhancedImageUrl),
    type,
    material: raw.material == null ? undefined : asString(raw.material, "material"),
    color: asString(raw.color, "color"),
    style: raw.style == null ? undefined : asString(raw.style, "style"),
    season,
    tags,
    aiMetadata: raw.aiMetadata && typeof raw.aiMetadata === "object" ? raw.aiMetadata as Record<string, unknown> : undefined,
    aiConfidenceScore: confidence,
    aiQualityWarnings: raw.aiQualityWarnings == null ? [] : asStringArray(raw.aiQualityWarnings, "aiQualityWarnings"),
    isFavorite: raw.isFavorite === true,
    timesWorn: Number.isInteger(raw.timesWorn) && Number(raw.timesWorn) >= 0 ? Number(raw.timesWorn) : 0,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
  };
}

function mapError(error: unknown) {
  const code = error instanceof Error ? error.message : "SERVER_ERROR";
  const status = code === "FORBIDDEN" ? 403 : code === "CLOSET_LIMIT_REACHED" ? 409 : code.startsWith("INVALID_") ? 400 : 500;
  return { code, status };
}

export async function POST(request: NextRequest) {
  const traceId = requestId(request);
  try {
    const identity = await authenticate(request);
    if (!identity || identity.demo) return fail("UNAUTHORIZED", 401, traceId);
    const key = idempotencyKey(request);
    if (!key) return fail("IDEMPOTENCY_KEY_REQUIRED", 400, traceId);
    const rawText = await request.text();
    if (Buffer.byteLength(rawText, "utf8") > MAX_BODY_BYTES) return fail("REQUEST_TOO_LARGE", 413, traceId);
    let raw: Record<string, unknown>;
    try {
      const parsed = JSON.parse(rawText) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("INVALID_JSON");
      raw = parsed as Record<string, unknown>;
    } catch {
      return fail("INVALID_JSON", 400, traceId);
    }
    const normalized = normalizePayload(identity.uid, raw);
    if (isManusRuntime()) {
      const result = await createManusClothing({ uid: identity.uid, payload: { id: "", ...normalized }, idempotencyKey: key });
      return NextResponse.json({ data: { item: result.item, replayed: result.replayed } }, { status: result.replayed ? 200 : 201, headers: { ...corsHeaders, "X-Request-Id": traceId } });
    }
    const requestRef = adminDb.collection(REQUESTS).doc(hashKey(identity.uid, key));
    const userRef = adminDb.collection("users").doc(identity.uid);
    const itemRef = adminDb.collection(CLOTHES).doc();
    const now = new Date().toISOString();
    let replayed = false;
    let itemId = itemRef.id;
    await adminDb.runTransaction(async (transaction) => {
      const existingRequest = await transaction.get(requestRef);
      if (existingRequest.exists) {
        itemId = String(existingRequest.data()?.itemId ?? "");
        if (!itemId) throw new Error("SERVER_ERROR");
        const existingItem = await transaction.get(adminDb.collection(CLOTHES).doc(itemId));
        if (!existingItem.exists) throw new Error("SERVER_ERROR");
        replayed = true;
        return;
      }
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) throw new Error("FORBIDDEN");
      const user = userSnap.data() ?? {};
      if (user.status === "suspended" || user.status === "banned") throw new Error("FORBIDDEN");
      const limit = Number(user.closetItemLimit ?? 0);
      const count = Number(user.closetItemCount ?? 0);
      if (limit > 0 && count >= limit) throw new Error("CLOSET_LIMIT_REACHED");
      const item = { ...normalized, createdAt: normalized.createdAt ?? now, updatedAt: now };
      transaction.set(itemRef, item);
      transaction.set(requestRef, { itemId: itemRef.id, userId: identity.uid, createdAt: now, operation: "create_clothing" });
      transaction.update(userRef, { closetItemCount: count + 1, updatedAt: now });
    });
    const saved = await adminDb.collection(CLOTHES).doc(itemId).get();
    if (!saved.exists) throw new Error("SERVER_ERROR");
    return NextResponse.json({ data: { item: { id: saved.id, ...saved.data() }, replayed } }, { status: replayed ? 200 : 201, headers: { ...corsHeaders, "X-Request-Id": traceId } });
  } catch (error) {
    const mapped = mapError(error);
    console.error("[wardrobe-items] create failed", { requestId: traceId, code: mapped.code });
    return fail(mapped.code, mapped.status, traceId);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
