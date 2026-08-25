import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authenticate, type ApiIdentity } from "@/lib/server/authorize";
import { adminStorage } from "@/lib/server/firebase-admin";
import { corsHeaders } from "@/lib/server/resources";
import { isManusRuntime } from "@/lib/server/runtime";
import { deleteManusImage, manusStoragePath, manusStorageUrl, saveManusImage } from "@/lib/server/manus-storage";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function requestId(request: NextRequest) {
  return request.headers.get("x-request-id")?.slice(0, 120) || randomUUID();
}

function errorResponse(code: string, status: number, id: string) {
  return NextResponse.json({ error: { code, message: code === "UNAUTHORIZED" ? "Bạn cần đăng nhập để tải ảnh lên." : "Không thể xử lý ảnh tải lên.", requestId: id } }, { status, headers: { ...corsHeaders, "X-Request-Id": id } });
}

function extensionFor(type: string) {
  return type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
}

function hasImageSignature(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length >= 8 && bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (type === "image/webp") return bytes.length >= 12 && Buffer.from(bytes.slice(0, 4)).toString("ascii") === "RIFF" && Buffer.from(bytes.slice(8, 12)).toString("ascii") === "WEBP";
  return false;
}

function ownedPath(uid: string, value: string) {
  const prefix = `users/${uid}/clothes/`;
  if (!value.startsWith(prefix)) return null;
  const fileName = value.slice(prefix.length);
  if (!/^[a-zA-Z0-9_-]{10,80}\.(jpg|png|webp)$/.test(fileName)) return null;
  return value;
}

function publicDownloadUrl(bucketName: string, path: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucketName)}/o/${encodeURIComponent(path)}?alt=media&token=${encodeURIComponent(token)}`;
}

export async function POST(request: NextRequest) {
  const id = requestId(request);
  try {
    let identity: ApiIdentity | null;
    try { identity = await authenticate(request); } catch { return errorResponse("UNAUTHORIZED", 401, id); }
    if (!identity || identity.demo) return errorResponse("UNAUTHORIZED", 401, id);
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_IMAGE_BYTES + 64 * 1024) return errorResponse("UPLOAD_TOO_LARGE", 413, id);

    let form: FormData;
    try { form = await request.formData(); } catch { return errorResponse("INVALID_MULTIPART", 400, id); }
    const input = form.get("image");
    if (!input || typeof input !== "object" || !("arrayBuffer" in input) || !("type" in input)) return errorResponse("INVALID_MULTIPART", 400, id);
    const file = input as File;
    const type = typeof file.type === "string" ? file.type.toLowerCase() : "";
    if (!SUPPORTED_TYPES.has(type)) return errorResponse("UNSUPPORTED_IMAGE_TYPE", 415, id);
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length <= 0 || buffer.length > MAX_IMAGE_BYTES) return errorResponse("UPLOAD_TOO_LARGE", 413, id);
    if (!hasImageSignature(new Uint8Array(buffer), type)) return errorResponse("INVALID_IMAGE_CONTENT", 415, id);

    if (isManusRuntime()) {
      const stored = await saveManusImage(identity.uid, type, buffer);
      return NextResponse.json({ data: { url: manusStorageUrl(stored.path), path: stored.path, contentType: stored.contentType, sizeBytes: stored.sizeBytes, provider: "manus" } }, { status: 201, headers: { ...corsHeaders, "X-Request-Id": id } });
    }
    const path = `users/${identity.uid}/clothes/${randomUUID()}.${extensionFor(type)}`;
    const token = randomUUID();
    const bucket = adminStorage.bucket();
    await bucket.file(path).save(buffer, {
      resumable: false,
      metadata: { contentType: type, metadata: { firebaseStorageDownloadTokens: token, wardroOwnerUid: identity.uid } },
    });
    return NextResponse.json({ data: { url: publicDownloadUrl(bucket.name, path, token), path, contentType: type, sizeBytes: buffer.length } }, { status: 201, headers: { ...corsHeaders, "X-Request-Id": id } });
  } catch (error) {
    console.error("[wardrobe-upload] failed", { requestId: id, error: error instanceof Error ? error.message : "unknown" });
    return errorResponse("UPLOAD_FAILED", 500, id);
  }
}

export async function DELETE(request: NextRequest) {
  const id = requestId(request);
  try {
    let identity: ApiIdentity | null;
    try { identity = await authenticate(request); } catch { return errorResponse("UNAUTHORIZED", 401, id); }
    if (!identity || identity.demo) return errorResponse("UNAUTHORIZED", 401, id);
    const path = ownedPath(identity.uid, request.nextUrl.searchParams.get("path") ?? "");
    if (!path) return errorResponse("INVALID_STORAGE_PATH", 400, id);
    if (isManusRuntime()) {
      const safePath = manusStoragePath(identity.uid, path);
      if (!safePath) return errorResponse("INVALID_STORAGE_PATH", 400, id);
      await deleteManusImage(identity.uid, safePath);
    } else {
      await adminStorage.bucket().file(path).delete({ ignoreNotFound: true });
    }
    return new NextResponse(null, { status: 204, headers: { ...corsHeaders, "X-Request-Id": id } });
  } catch (error) {
    console.error("[wardrobe-upload] cleanup failed", { requestId: id, error: error instanceof Error ? error.message : "unknown" });
    return errorResponse("UPLOAD_CLEANUP_FAILED", 500, id);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
