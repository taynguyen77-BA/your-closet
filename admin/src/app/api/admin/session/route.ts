import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";
import type { AdminRole } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  const { idToken } = await request.json().catch(() => ({ idToken: "" }));
  if (!idToken || typeof idToken !== "string") return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const snapshot = await adminDb.collection("adminUsers").doc(decoded.uid).get();
    const adminUser = snapshot.exists ? snapshot.data() as { email?: string; name?: string; role?: AdminRole; avatarUrl?: string; status?: string; createdAt?: string } : null;
    const role = (decoded.adminRole as AdminRole | undefined) ?? adminUser?.role;
    const isAdmin = decoded.admin === true || Boolean(adminUser);
    if (!isAdmin || !role || adminUser?.status === "disabled") return NextResponse.json({ error: "Admin access denied" }, { status: 403 });
    await adminDb.collection("adminUsers").doc(decoded.uid).set({
      uid: decoded.uid,
      email: decoded.email ?? adminUser?.email ?? "",
      name: adminUser?.name ?? decoded.name ?? decoded.email ?? "Admin",
      role,
      status: adminUser?.status ?? "active",
      avatarUrl: adminUser?.avatarUrl ?? decoded.picture ?? "",
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      createdAt: adminUser ? adminUser.createdAt : new Date().toISOString(),
    }, { merge: true });
    return NextResponse.json({ data: { id: decoded.uid, email: decoded.email ?? adminUser?.email ?? "", name: adminUser?.name ?? decoded.name ?? decoded.email ?? "Admin", role, avatarUrl: adminUser?.avatarUrl ?? decoded.picture } });
  } catch {
    return NextResponse.json({ error: "Invalid admin session" }, { status: 401 });
  }
}
