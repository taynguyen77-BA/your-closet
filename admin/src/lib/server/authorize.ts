import { NextRequest } from "next/server";
import { adminAuth } from "./firebase-admin";
import { hasPermission, type AdminRole, type Permission } from "@/lib/rbac";

export interface AdminIdentity { uid: string; role: AdminRole; demo?: boolean }

export async function authorize(request: NextRequest, permission: Permission): Promise<AdminIdentity> {
  const demoRole = request.headers.get("x-demo-admin-role") as AdminRole | null;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" && demoRole && hasPermission(demoRole, permission)) {
    return { uid: "demo-admin", role: demoRole, demo: true };
  }
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("UNAUTHORIZED");
  const decoded = await adminAuth.verifyIdToken(token);
  const role = decoded.adminRole as AdminRole | undefined;
  if (!role || !hasPermission(role, permission)) throw new Error("FORBIDDEN");
  return { uid: decoded.uid, role };
}
