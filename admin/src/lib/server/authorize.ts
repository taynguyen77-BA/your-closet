import { NextRequest } from "next/server";
import { adminAuth } from "./firebase-admin";
import { hasPermission, type AdminRole, type Permission } from "@/lib/rbac";

export interface AdminIdentity { uid: string; role: AdminRole; demo?: boolean }
export interface ApiIdentity { uid: string; role?: AdminRole; isAdmin: boolean; demo?: boolean }

export async function authenticate(request: NextRequest): Promise<ApiIdentity | null> {
  const demoRole = request.headers.get("x-demo-admin-role") as AdminRole | null;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" && demoRole) {
    return { uid: "demo-admin", role: demoRole, isAdmin: true, demo: true };
  }
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const decoded = await adminAuth.verifyIdToken(token);
  return { uid: decoded.uid, role: decoded.adminRole as AdminRole | undefined, isAdmin: decoded.admin === true };
}

export async function authorize(request: NextRequest, permission: Permission): Promise<AdminIdentity> {
  const identity = await authenticate(request);
  if (!identity) throw new Error("UNAUTHORIZED");
  if (!identity.isAdmin || !identity.role || !hasPermission(identity.role, permission)) throw new Error("FORBIDDEN");
  return { uid: identity.uid, role: identity.role, demo: identity.demo };
}
