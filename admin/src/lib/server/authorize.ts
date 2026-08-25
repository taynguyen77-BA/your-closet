import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "./firebase-admin";
import { hasPermission, type AdminRole, type Permission } from "@/lib/rbac";
import { authenticateManusRequest, isManusRuntime } from "./runtime";

export interface AdminIdentity { uid: string; role: AdminRole; demo?: boolean }
export interface ApiIdentity { uid: string; role?: AdminRole; isAdmin: boolean; demo?: boolean }

export async function authenticate(request: NextRequest): Promise<ApiIdentity | null> {
  if (isManusRuntime()) {
    const identity = await authenticateManusRequest(request);
    return { uid: identity.uid, role: identity.role, isAdmin: identity.isAdmin, demo: identity.demo };
  }
  const demoRole = request.headers.get("x-demo-admin-role") as AdminRole | null;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" && demoRole) {
    return { uid: "demo-admin", role: demoRole, isAdmin: true, demo: true };
  }
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const decoded = await adminAuth.verifyIdToken(token);
  const adminDoc = await adminDb.collection("adminUsers").doc(decoded.uid).get();
  const adminUser = adminDoc.exists ? adminDoc.data() as { role?: AdminRole; status?: string } : null;
  const role = (decoded.adminRole as AdminRole | undefined) ?? adminUser?.role;
  const isAdmin = decoded.admin === true || Boolean(adminUser);
  if (adminUser?.status === "disabled") return { uid: decoded.uid, role, isAdmin: false };
  return { uid: decoded.uid, role, isAdmin };
}

export async function authorize(request: NextRequest, permission: Permission): Promise<AdminIdentity> {
  const identity = await authenticate(request);
  if (!identity) throw new Error("UNAUTHORIZED");
  if (!identity.isAdmin || !identity.role || !hasPermission(identity.role, permission)) throw new Error("FORBIDDEN");
  return { uid: identity.uid, role: identity.role, demo: identity.demo };
}
