import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, normalize, relative } from "node:path";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const STORAGE_DIR = process.env.WARDRO_MANUS_STORAGE_DIR?.trim() || join(process.env.WARDRO_MANUS_DATA_DIR?.trim() || "/tmp", "wardro-manus-storage");
const manusRuntimeGlobals = globalThis as typeof globalThis & { __wardroManusStorageSecret?: string };
const MANUS_STORAGE_SECRET = process.env.WARDRO_MANUS_STORAGE_SECRET?.trim() || (manusRuntimeGlobals.__wardroManusStorageSecret ??= randomUUID());
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type StoredImage = { path: string; contentType: string; sizeBytes: number; createdAt: string };

function safeRelativePath(uid: string, path: string) {
  const prefix = `users/${uid}/clothes/`;
  if (!path.startsWith(prefix)) return null;
  const name = path.slice(prefix.length);
  if (!/^[a-zA-Z0-9_-]{10,80}\.(jpg|png|webp)$/.test(name)) return null;
  const resolved = normalize(path);
  return relative(".", resolved) === resolved && !resolved.includes("..") ? resolved : null;
}

function fileFor(path: string) {
  return join(STORAGE_DIR, path);
}

export function manusStoragePath(uid: string, path: string) { return safeRelativePath(uid, path); }

function ownerForPath(path: string) { return path.match(/^users\/([^/]+)\/clothes\//)?.[1] ?? ""; }
function tokenFor(path: string) { return createHmac("sha256", MANUS_STORAGE_SECRET).update(path).digest("hex"); }

export function manusStorageUrl(path: string) {
  return `/api/manus-storage/${encodeURIComponent(path).replace(/%2F/g, "/")}?token=${tokenFor(path)}`;
}

export function isManusStorageUrl(value: unknown, path?: string) {
  if (typeof value !== "string" || !value.startsWith("/api/manus-storage/")) return false;
  if (!path) return true;
  const parsed = new URL(value, "http://manus.local");
  const expectedPath = `/api/manus-storage/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
  return parsed.pathname === expectedPath && parsed.searchParams.get("token") === tokenFor(path) && Boolean(ownerForPath(path));
}

export function verifyManusStorageToken(path: string, token: string | null) {
  if (!token) return false;
  const expected = Buffer.from(tokenFor(path));
  const actual = Buffer.from(token);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function saveManusImage(uid: string, contentType: string, buffer: Buffer): Promise<StoredImage> {
  if (!SUPPORTED_TYPES.has(contentType) || buffer.length <= 0 || buffer.length > MAX_IMAGE_BYTES) throw new Error("INVALID_IMAGE");
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const path = `users/${uid}/clothes/${randomUUID()}.${extension}`;
  const target = fileFor(path);
  await mkdir(join(STORAGE_DIR, `users/${uid}/clothes`), { recursive: true });
  await writeFile(target, buffer, { flag: "wx" });
  return { path, contentType, sizeBytes: buffer.length, createdAt: new Date().toISOString() };
}

export async function readManusImage(uid: string, path: string) {
  const safePath = safeRelativePath(uid, path);
  if (!safePath) throw new Error("INVALID_STORAGE_PATH");
  return readFile(fileFor(safePath));
}

export async function deleteManusImage(uid: string, path: string) {
  const safePath = safeRelativePath(uid, path);
  if (!safePath) throw new Error("INVALID_STORAGE_PATH");
  await rm(fileFor(safePath), { force: true });
}

export async function deleteManusUserStorage(uid: string) {
  const userDir = join(STORAGE_DIR, "users", uid, "clothes");
  await rm(userDir, { recursive: true, force: true });
}

export async function manusStorageExists(uid: string, path: string) {
  const safePath = safeRelativePath(uid, path);
  if (!safePath) return false;
  try { await stat(fileFor(safePath)); return true; } catch { return false; }
}

export function getManusStorageDirectory() { return STORAGE_DIR; }
