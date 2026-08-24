import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authenticate } from "@/lib/server/authorize";
import { adminDb, adminStorage } from "@/lib/server/firebase-admin";
import { corsHeaders } from "@/lib/server/resources";

export const runtime = "nodejs";
const CLOTHES = "clothes";
const REQUESTS = "wardrobe_requests";
const CLEANUP_TASKS = "storage_cleanup_tasks";
const MUTABLE_FIELDS = new Set(["name", "type", "material", "color", "style", "season", "tags", "isFavorite", "aiMetadata", "aiConfidenceScore", "aiQualityWarnings", "updatedAt"]);
const TYPES = new Set(["top", "bottom", "dress", "outerwear", "shoes", "accessory", "bag", "other"]);

function traceId(request: NextRequest) { return request.headers.get("x-request-id")?.slice(0, 120) || randomUUID(); }
function keyOf(request: NextRequest) { return request.headers.get("idempotency-key")?.trim().slice(0, 200) || null; }
function fail(code: string, status: number, id: string) { return NextResponse.json({ error: { code, message: code === "UNAUTHORIZED" ? "Bạn cần đăng nhập để tiếp tục." : code === "FORBIDDEN" ? "Bạn không có quyền với món đồ này." : code === "NOT_FOUND" ? "Không tìm thấy món đồ." : "Không thể xử lý món đồ.", requestId: id } }, { status, headers: { ...corsHeaders, "X-Request-Id": id } }); }
function isOwner(uid: string, row: FirebaseFirestore.DocumentData | undefined) { return Boolean(row && row.userId === uid); }
function ownedPath(uid: string, value: unknown) {
  if (typeof value !== "string") return null;
  const prefix = `users/${uid}/clothes/`;
  if (!value.startsWith(prefix)) return null;
  const file = value.slice(prefix.length);
  return /^[a-zA-Z0-9_-]{10,80}\.(jpg|png|webp)$/.test(file) ? value : null;
}
function storagePaths(uid: string, row: FirebaseFirestore.DocumentData) {
  return [row.storagePath, row.originalStoragePath].map((path) => ownedPath(uid, path)).filter((path, index, all): path is string => Boolean(path) && all.indexOf(path) === index);
}
function cleanPatch(raw: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!MUTABLE_FIELDS.has(key)) throw new Error("INVALID_FIELD");
    if (["imageUrl", "originalImageUrl", "enhancedImageUrl", "storagePath", "originalStoragePath", "userId"].includes(key)) throw new Error("INVALID_FIELD");
    patch[key] = value;
  }
  if (typeof patch.name === "string" && (!patch.name.trim() || patch.name.length > 120)) throw new Error("INVALID_NAME");
  if (typeof patch.color === "string" && (!patch.color.trim() || patch.color.length > 120)) throw new Error("INVALID_COLOR");
  if (patch.type != null && (typeof patch.type !== "string" || !TYPES.has(patch.type))) throw new Error("INVALID_TYPE");
  for (const key of ["season", "tags", "aiQualityWarnings"]) {
    if (patch[key] != null && (!Array.isArray(patch[key]) || (patch[key] as unknown[]).length > 20 || (patch[key] as unknown[]).some((item) => typeof item !== "string" || String(item).length > 120))) throw new Error(`INVALID_${key.toUpperCase()}`);
  }
  if (patch.aiConfidenceScore != null && (typeof patch.aiConfidenceScore !== "number" || patch.aiConfidenceScore < 0 || patch.aiConfidenceScore > 1)) throw new Error("INVALID_AI_CONFIDENCE");
  if (patch.isFavorite != null && typeof patch.isFavorite !== "boolean") throw new Error("INVALID_IS_FAVORITE");
  return patch;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const id = traceId(request);
  try {
    const identity = await authenticate(request);
    if (!identity || identity.demo) return fail("UNAUTHORIZED", 401, id);
    const { id: itemId } = await context.params;
    const snapshot = await adminDb.collection(CLOTHES).doc(itemId).get();
    if (!snapshot.exists) return fail("NOT_FOUND", 404, id);
    if (!isOwner(identity.uid, snapshot.data())) return fail("FORBIDDEN", 403, id);
    return NextResponse.json({ data: { id: snapshot.id, ...snapshot.data() } }, { headers: { ...corsHeaders, "X-Request-Id": id } });
  } catch { return fail("SERVER_ERROR", 500, id); }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const id = traceId(request);
  try {
    const identity = await authenticate(request);
    if (!identity || identity.demo) return fail("UNAUTHORIZED", 401, id);
    const { id: itemId } = await context.params;
    const snapshot = await adminDb.collection(CLOTHES).doc(itemId).get();
    if (!snapshot.exists) return fail("NOT_FOUND", 404, id);
    if (!isOwner(identity.uid, snapshot.data())) return fail("FORBIDDEN", 403, id);
    const raw = await request.json() as Record<string, unknown>;
    const patch = cleanPatch(raw);
    const key = keyOf(request);
    if (key) {
      const requestRef = adminDb.collection(REQUESTS).doc(createHash("sha256").update(`${identity.uid}:update:${itemId}:${key}`).digest("hex"));
      const existing = await requestRef.get();
      if (existing.exists) return NextResponse.json({ data: { id: itemId, ...snapshot.data(), ...existing.data()?.patch }, meta: { replayed: true } }, { headers: { ...corsHeaders, "X-Request-Id": id } });
      patch.updatedAt = new Date().toISOString();
      await adminDb.runTransaction(async (transaction) => {
        const current = await transaction.get(adminDb.collection(CLOTHES).doc(itemId));
        if (!current.exists || !isOwner(identity.uid, current.data())) throw new Error("FORBIDDEN");
        transaction.update(adminDb.collection(CLOTHES).doc(itemId), patch);
        transaction.create(requestRef, { userId: identity.uid, operation: "update_clothing", itemId, patch, createdAt: patch.updatedAt });
      });
    } else {
      patch.updatedAt = new Date().toISOString();
      await adminDb.collection(CLOTHES).doc(itemId).update(patch);
    }
    const updated = await adminDb.collection(CLOTHES).doc(itemId).get();
    return NextResponse.json({ data: { id: updated.id, ...updated.data() } }, { headers: { ...corsHeaders, "X-Request-Id": id } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVER_ERROR";
    return fail(code.startsWith("INVALID_") ? code : code === "FORBIDDEN" ? code : "SERVER_ERROR", code === "FORBIDDEN" ? 403 : code.startsWith("INVALID_") ? 400 : 500, id);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const id = traceId(request);
  try {
    const identity = await authenticate(request);
    if (!identity || identity.demo) return fail("UNAUTHORIZED", 401, id);
    const { id: itemId } = await context.params;
    const key = keyOf(request) ?? `delete-${itemId}`;
    const requestRef = adminDb.collection(REQUESTS).doc(createHash("sha256").update(`${identity.uid}:delete:${itemId}:${key}`).digest("hex"));
    let paths: string[] = [];
    let cleanupTaskId: string | null = null;
    let alreadyDeleted = false;
    await adminDb.runTransaction(async (transaction) => {
      const existingRequest = await transaction.get(requestRef);
      if (existingRequest.exists) { alreadyDeleted = true; return; }
      const itemRef = adminDb.collection(CLOTHES).doc(itemId);
      const userRef = adminDb.collection("users").doc(identity.uid);
      const item = await transaction.get(itemRef);
      const user = await transaction.get(userRef);
      if (!item.exists) throw new Error("NOT_FOUND");
      if (!isOwner(identity.uid, item.data())) throw new Error("FORBIDDEN");
      paths = storagePaths(identity.uid, item.data() ?? {});
      const count = Number(user.data()?.closetItemCount ?? 0);
      transaction.delete(itemRef);
      transaction.set(requestRef, { userId: identity.uid, operation: "delete_clothing", itemId, createdAt: new Date().toISOString() });
      if (user.exists) transaction.update(userRef, { closetItemCount: Math.max(0, count - 1), updatedAt: new Date().toISOString() });
      if (paths.length) {
        const cleanupRef = adminDb.collection(CLEANUP_TASKS).doc();
        cleanupTaskId = cleanupRef.id;
        transaction.create(cleanupRef, { userId: identity.uid, itemId, paths, status: "pending", createdAt: new Date().toISOString() });
      }
    });
    if (!alreadyDeleted) {
      let cleanupFailed = false;
      for (const path of paths) {
        try { await adminStorage.bucket().file(path).delete({ ignoreNotFound: true }); }
        catch (error) {
          cleanupFailed = true;
          console.error("[wardrobe-items] storage cleanup pending", { requestId: id, path, error: error instanceof Error ? error.message : "unknown" });
        }
      }
      if (cleanupTaskId) {
        const cleanupRef = adminDb.collection(CLEANUP_TASKS).doc(cleanupTaskId);
        await cleanupRef.set(cleanupFailed
          ? { status: "pending", lastError: "STORAGE_DELETE_FAILED", lastAttemptAt: new Date().toISOString() }
          : { status: "completed", completedAt: new Date().toISOString() }, { merge: true }).catch(() => undefined);
      }
    }
    return new NextResponse(null, { status: 204, headers: { ...corsHeaders, "X-Request-Id": id } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVER_ERROR";
    return fail(code === "NOT_FOUND" ? code : code === "FORBIDDEN" ? code : "SERVER_ERROR", code === "NOT_FOUND" ? 404 : code === "FORBIDDEN" ? 403 : 500, id);
  }
}

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }
