import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore-schema";
import { authorize } from "./authorize";
import { adminDb } from "./firebase-admin";
import type { Permission } from "@/lib/rbac";

const permissions: Record<string, { view: Permission; manage?: Permission }> = {
  users: { view: "users.view", manage: "users.manage" },
  plan_limits: { view: "membership.view", manage: "membership.manage" },
  subscriptions: { view: "membership.view", manage: "membership.manage" },
  transactions: { view: "transactions.view", manage: "transactions.manage" },
  listings: { view: "community.view", manage: "community.moderate" },
  reports: { view: "moderation.view", manage: "moderation.action" },
  missions: { view: "missions.view", manage: "missions.manage" },
  notification_templates: { view: "notifications.view", manage: "notifications.manage" },
  notifications: { view: "notifications.view", manage: "notifications.manage" },
  ai_logs: { view: "ai.view" },
  support_tickets: { view: "support.view", manage: "support.manage" },
  trends: { view: "trends.view", manage: "trends.manage" },
  outfits: { view: "outfits.view", manage: "outfits.manage" },
  affiliate_products: { view: "affiliate.view", manage: "affiliate.manage" },
  admin_logs: { view: "audit.view" },
};
const allowed = new Set<string>(Object.values(FIRESTORE_COLLECTIONS));
const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
const fail = (error: unknown) => {
  const message = error instanceof Error ? error.message : "SERVER_ERROR";
  return json({ error: message }, message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500);
};
const clean = (value: Record<string, unknown>) => {
  const data = { ...value };
  delete data.id;
  return data;
};
async function access(request: NextRequest, collection: string, write = false) {
  if (!allowed.has(collection) || !permissions[collection]) throw new Error("FORBIDDEN");
  const permission = write ? permissions[collection].manage : permissions[collection].view;
  if (!permission) throw new Error("FORBIDDEN");
  return authorize(request, permission);
}
export async function list(request: NextRequest, collection: string) {
  try {
    await access(request, collection);
    const snapshot = await adminDb.collection(collection).limit(250).get();
    return json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error) { return fail(error); }
}
export async function create(request: NextRequest, collection: string) {
  try {
    const admin = await access(request, collection, true);
    const body = clean(await request.json());
    const ref = await adminDb.collection(collection).add({ ...body, createdAt: body.createdAt ?? new Date().toISOString(), updatedAt: FieldValue.serverTimestamp() });
    await audit(admin.uid, `create:${collection}`, ref.id);
    return json({ id: ref.id, ...body }, 201);
  } catch (error) { return fail(error); }
}
export async function update(request: NextRequest, collection: string, id: string) {
  try {
    const admin = await access(request, collection, true);
    const patch = clean(await request.json());
    await adminDb.collection(collection).doc(id).set({ ...patch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await audit(admin.uid, `update:${collection}`, id);
    return json({ id, ...patch });
  } catch (error) { return fail(error); }
}
export async function remove(request: NextRequest, collection: string, id: string) {
  try {
    const admin = await access(request, collection, true);
    await adminDb.collection(collection).doc(id).delete();
    await audit(admin.uid, `delete:${collection}`, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) { return fail(error); }
}
async function audit(adminId: string, action: string, resourceId: string) {
  await adminDb.collection(FIRESTORE_COLLECTIONS.adminLogs).add({ adminId, action, resourceId, createdAt: new Date().toISOString() });
}
