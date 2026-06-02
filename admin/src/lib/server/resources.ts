import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore-schema";
import { authorize } from "./authorize";
import { adminDb } from "./firebase-admin";
import type { Permission } from "@/lib/rbac";
import {
  affiliateProducts, aiLogs, auditLogs, contentReports, listings, membershipPlans, missions,
  mockUsers, notificationTemplates, outfits, securityLogs, subscriptions, supportTickets,
  transactions, trends,
} from "@/data/mock";

const permissions: Record<string, { view: Permission; manage?: Permission }> = {
  users: { view: "users.view", manage: "users.manage" },
  clothes: { view: "users.view" },
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
  security_logs: { view: "security.view" },
};
const allowed = new Set<string>(Object.values(FIRESTORE_COLLECTIONS));
type DemoRow = Record<string, unknown> & { id: string };
const demoRows = <T extends { id: string }>(rows: T[]) => rows as unknown as DemoRow[];
const demoCollections: Record<string, DemoRow[]> = {
  users: demoRows(mockUsers), clothes: [], plan_limits: demoRows(membershipPlans.map((plan) => ({
    id: plan.id, label: plan.name, aiMonthly: plan.aiLimit ?? -1, closetItems: plan.wardrobeLimit ?? -1,
  }))),
  subscriptions: demoRows(subscriptions), transactions: demoRows(transactions),
  listings: demoRows(listings), reports: demoRows(contentReports), missions: demoRows(missions),
  notification_templates: demoRows(notificationTemplates), notifications: [], ai_logs: demoRows(aiLogs),
  support_tickets: demoRows(supportTickets), trends: demoRows(trends), outfits: demoRows(outfits),
  affiliate_products: demoRows(affiliateProducts), admin_logs: demoRows(auditLogs),
  security_logs: demoRows(securityLogs),
};
const isDemo = () => process.env.NEXT_PUBLIC_DEMO_MODE === "true";
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
    if (isDemo()) return json(demoCollections[collection] ?? []);
    const snapshot = await adminDb.collection(collection).limit(250).get();
    return json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error) { return fail(error); }
}
export async function get(request: NextRequest, collection: string, id: string) {
  try {
    await access(request, collection);
    if (isDemo()) {
      const row = (demoCollections[collection] ?? []).find((item) => item.id === id);
      return row ? json(row) : json({ error: "NOT_FOUND" }, 404);
    }
    const snapshot = await adminDb.collection(collection).doc(id).get();
    if (!snapshot.exists) return json({ error: "NOT_FOUND" }, 404);
    return json({ id: snapshot.id, ...snapshot.data() });
  } catch (error) { return fail(error); }
}
export async function create(request: NextRequest, collection: string) {
  try {
    const admin = await access(request, collection, true);
    const body = clean(await request.json());
    if (isDemo()) {
      const row = { id: `demo-${Date.now()}`, ...body } as DemoRow;
      (demoCollections[collection] ??= []).unshift(row);
      await audit(admin.uid, `create:${collection}`, row.id);
      return json(row, 201);
    }
    const ref = await adminDb.collection(collection).add({ ...body, createdAt: body.createdAt ?? new Date().toISOString(), updatedAt: FieldValue.serverTimestamp() });
    await audit(admin.uid, `create:${collection}`, ref.id);
    return json({ id: ref.id, ...body }, 201);
  } catch (error) { return fail(error); }
}
export async function update(request: NextRequest, collection: string, id: string) {
  try {
    const admin = await access(request, collection, true);
    const patch = clean(await request.json());
    if (isDemo()) {
      const rows = demoCollections[collection] ?? [];
      const index = rows.findIndex((item) => item.id === id);
      if (index < 0) return json({ error: "NOT_FOUND" }, 404);
      rows[index] = { ...rows[index], ...patch };
      await audit(admin.uid, `update:${collection}`, id);
      return json(rows[index]);
    }
    await adminDb.collection(collection).doc(id).set({ ...patch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await audit(admin.uid, `update:${collection}`, id);
    return json({ id, ...patch });
  } catch (error) { return fail(error); }
}
export async function remove(request: NextRequest, collection: string, id: string) {
  try {
    const admin = await access(request, collection, true);
    if (isDemo()) {
      const rows = demoCollections[collection] ?? [];
      const index = rows.findIndex((item) => item.id === id);
      if (index >= 0) rows.splice(index, 1);
      await audit(admin.uid, `delete:${collection}`, id);
      return new NextResponse(null, { status: 204 });
    }
    await adminDb.collection(collection).doc(id).delete();
    await audit(admin.uid, `delete:${collection}`, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) { return fail(error); }
}
async function audit(adminId: string, action: string, resourceId: string) {
  if (isDemo()) {
    demoCollections.admin_logs.unshift({ id: `audit-${Date.now()}`, adminId, action, resourceId, createdAt: new Date().toISOString() });
    return;
  }
  await adminDb.collection(FIRESTORE_COLLECTIONS.adminLogs).add({ adminId, action, resourceId, createdAt: new Date().toISOString() });
}
