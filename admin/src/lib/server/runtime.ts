import type { NextRequest } from "next/server";
import { ensureManusUser, getManusUser } from "./manus-data";

export type WardroRuntimeMode = "manus" | "firebase";
export type ManusIdentityId = "manus-user-a" | "manus-user-b" | "manus-admin";

const DEFAULT_IDENTITY: ManusIdentityId = "manus-user-a";

export function runtimeMode(): WardroRuntimeMode {
  const value = process.env.WARDRO_RUNTIME_MODE?.trim().toLowerCase();
  return value === "manus" ? "manus" : "firebase";
}

export function isManusRuntime() { return runtimeMode() === "manus"; }

export function manusIdentityId(request: NextRequest): ManusIdentityId {
  const allowed = new Set((process.env.WARDRO_MANUS_DEV_USERS || "manus-user-a,manus-user-b,manus-admin").split(",").map((value) => value.trim()).filter(Boolean));
  const requested = request.headers.get("x-wardro-dev-user")?.trim();
  const configured = process.env.WARDRO_MANUS_DEFAULT_USER?.trim();
  const candidate = requested || configured || DEFAULT_IDENTITY;
  return allowed.has(candidate) && ["manus-user-a", "manus-user-b", "manus-admin"].includes(candidate) ? candidate as ManusIdentityId : DEFAULT_IDENTITY;
}

export async function authenticateManusRequest(request: NextRequest) {
  const uid = manusIdentityId(request);
  const user = await ensureManusUser(uid);
  return { uid, role: uid === "manus-admin" ? "super_admin" as const : undefined, isAdmin: uid === "manus-admin", demo: false, user };
}

export async function getManusRuntimeUser(uid: string) { return getManusUser(uid); }

export function providerName() { return isManusRuntime() ? "manus" : "firebase"; }
