import { NextRequest, NextResponse } from "next/server";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore-schema";
import { authenticate, type ApiIdentity } from "./authorize";
import { adminDb } from "./firebase-admin";
import { hasPermission, type Permission } from "@/lib/rbac";
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
  events: { view: "users.view" },
  user_missions: { view: "users.view" },
  marketplace_messages: { view: "community.view" },
  trade_offers: { view: "community.view" },
  listing_reports: { view: "moderation.view", manage: "moderation.action" },
  adminUsers: { view: "settings.view", manage: "settings.manage" },
};
const publicCollections = new Set(["plan_limits", "missions", "trends", "affiliate_products", "listings"]);
const ownerFields: Record<string, string> = {
  users: "id", clothes: "userId", outfits: "userId", events: "userId", user_missions: "userId",
  subscriptions: "userId", transactions: "buyerId", notifications: "userId", ai_logs: "userId", support_tickets: "userId",
  marketplace_messages: "senderId", trade_offers: "buyerId", listing_reports: "reporterId",
};
const readOnlyCollections = new Set(["transactions", "ai_logs", "admin_logs", "security_logs"]);
const userProfileFields = new Set([
  "name", "displayName", "username", "avatarUrl", "phoneNumber", "gender", "dateOfBirth",
  "fashionStyle", "preferences", "favoriteColors", "fashionGoals", "hasCompletedOnboarding",
  "hasCompletedStyleSurvey", "styleSurveySkipped", "styleSurveyCompletedAt",
  "styleProfileCompletionPercent", "stylePreferences", "advancedStylePreferences",
  "styleProfileRewardClaimed", "lastLoginAt", "updatedAt",
]);
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
  affiliate_products: demoRows(affiliateProducts.map((product) => ({ ...product, status: product.isActive ? "active" : "inactive" }))), admin_logs: demoRows(auditLogs),
  security_logs: demoRows(securityLogs),
  events: [], user_missions: [], marketplace_messages: [], trade_offers: [], listing_reports: [],
  adminUsers: [],
};
const isDemo = () => process.env.NEXT_PUBLIC_DEMO_MODE === "true";
export const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Authorization, Content-Type, x-demo-admin-role", "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS" };
const json = (data: unknown, status = 200, meta?: Record<string, unknown>) => NextResponse.json({ data, meta: { total: Array.isArray(data) ? data.length : data ? 1 : 0, limit: 50, cursor: null, ...meta } }, { status, headers: corsHeaders });
const fail = (error: unknown) => {
  const message = error instanceof Error ? error.message : "SERVER_ERROR";
  return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message === "NOT_FOUND" ? 404 : 500, headers: corsHeaders });
};
const clean = (value: Record<string, unknown>) => {
  const data = { ...value };
  delete data.id;
  return data;
};
const isAdminAllowed = (identity: ApiIdentity | null, permission?: Permission) => Boolean(identity?.isAdmin && identity.role && permission && hasPermission(identity.role, permission));
const owns = (identity: ApiIdentity | null, collection: string, row: Record<string, unknown>) => Boolean(identity && ownerFields[collection] && row[ownerFields[collection]] === identity.uid);
const isPublic = (collection: string, row: Record<string, unknown>) => publicCollections.has(collection) && (collection !== "listings" ? row.status == null || row.status === "active" || row.status === "published" : row.status === "approved");
const canRead = (identity: ApiIdentity | null, collection: string, row: Record<string, unknown>) => isAdminAllowed(identity, permissions[collection]?.view) || owns(identity, collection, row) || isPublic(collection, row);
const canViewAdvancedStyle = (identity: ApiIdentity | null) => identity?.role === "super_admin" || identity?.role === "support";
const sanitizeRow = (identity: ApiIdentity | null, collection: string, row: DemoRow): DemoRow => {
  if (collection !== "users" || canViewAdvancedStyle(identity) || owns(identity, collection, row)) return row;
  const { advancedStylePreferences: _advancedStylePreferences, ...safe } = row;
  return safe as DemoRow;
};
async function access(request: NextRequest, collection: string, write = false) {
  if (!allowed.has(collection) || !permissions[collection]) throw new Error("FORBIDDEN");
  const identity = await authenticate(request);
  if (!identity && !publicCollections.has(collection)) throw new Error("UNAUTHORIZED");
  if (write && !identity) throw new Error("UNAUTHORIZED");
  return identity;
}
export async function list(request: NextRequest, collection: string) {
  try {
    const identity = await access(request, collection);
    const params = request.nextUrl.searchParams; const limit = Math.min(Number(params.get("limit") ?? 50), 100); const cursor = params.get("cursor");
    const filter = (row: DemoRow) => canRead(identity, collection, row) && (!params.get("status") || row.status === params.get("status")) && (!params.get("userId") || row.userId === params.get("userId")) && (!params.get("search") || JSON.stringify(row).toLowerCase().includes(params.get("search")!.toLowerCase()));
    if (isDemo()) return json((demoCollections[collection] ?? []).filter(filter).slice(0, limit), 200, { limit });
    let query = adminDb.collection(collection).orderBy("createdAt", "desc").limit(limit + 1);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DemoRow)).filter(filter);
    const data = rows.slice(0, limit).map((row) => sanitizeRow(identity, collection, row));
    return json(data, 200, { total: data.length, limit, cursor: rows.length > limit ? String(data.at(-1)?.createdAt ?? null) : null });
  } catch (error) { return fail(error); }
}
export async function get(request: NextRequest, collection: string, id: string) {
  try {
    const identity = await access(request, collection);
    if (isDemo()) {
      const row = (demoCollections[collection] ?? []).find((item) => item.id === id);
      if (!row) throw new Error("NOT_FOUND");
      if (!canRead(identity, collection, row)) throw new Error("FORBIDDEN");
      return json(sanitizeRow(identity, collection, row));
    }
    const snapshot = await adminDb.collection(collection).doc(id).get();
    if (!snapshot.exists) throw new Error("NOT_FOUND");
    const row = { id: snapshot.id, ...snapshot.data() };
    if (!canRead(identity, collection, row)) throw new Error("FORBIDDEN");
    return json(sanitizeRow(identity, collection, row as DemoRow));
  } catch (error) { return fail(error); }
}
export async function create(request: NextRequest, collection: string) {
  try {
    const identity = await access(request, collection, true);
    if (!identity) throw new Error("FORBIDDEN");
    const raw = await request.json() as Record<string, unknown>; const body = clean(raw);
    const ownerAllowed = ownerFields[collection] && (body[ownerFields[collection]] === identity.uid || collection === "users" && raw.id === identity.uid);
    if (!isAdminAllowed(identity, permissions[collection].manage) && !ownerAllowed) throw new Error("FORBIDDEN");
    if (!identity.isAdmin && collection === "listings" && body.status !== "pending_review") throw new Error("FORBIDDEN");
    if (!identity.isAdmin && collection === "transactions" && body.status !== "pending") throw new Error("FORBIDDEN");
    const payload = { ...body, createdAt: body.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(), ...(identity.isAdmin ? { createdBy: identity.uid, updatedBy: identity.uid } : {}) };
    if (isDemo()) {
      const row = { id: typeof raw.id === "string" ? raw.id : `demo-${Date.now()}`, ...payload } as DemoRow;
      (demoCollections[collection] ??= []).unshift(row);
      await audit(identity.uid, `create:${collection}`, row.id);
      return json(row, 201);
    }
    const ref = typeof raw.id === "string" ? adminDb.collection(collection).doc(raw.id) : adminDb.collection(collection).doc();
    await ref.set(payload);
    await audit(identity.uid, `create:${collection}`, ref.id);
    return json({ id: ref.id, ...payload }, 201);
  } catch (error) { return fail(error); }
}
export async function update(request: NextRequest, collection: string, id: string) {
  try {
    const identity = await access(request, collection, true);
    if (!identity || readOnlyCollections.has(collection)) throw new Error("FORBIDDEN");
    const patch = clean(await request.json());
    if (!identity.isAdmin && collection === "users" && Object.keys(patch).some((key) => !userProfileFields.has(key))) throw new Error("FORBIDDEN");
    if (!identity.isAdmin && collection === "listings" && "status" in patch) throw new Error("FORBIDDEN");
    if (isDemo()) {
      const rows = demoCollections[collection] ?? [];
      const index = rows.findIndex((item) => item.id === id);
      if (index < 0) return json({ error: "NOT_FOUND" }, 404);
      if (!isAdminAllowed(identity, permissions[collection].manage) && !owns(identity, collection, rows[index])) throw new Error("FORBIDDEN");
      rows[index] = { ...rows[index], ...patch, updatedAt: new Date().toISOString(), ...(identity.isAdmin ? { updatedBy: identity.uid } : {}) };
      await audit(identity.uid, `update:${collection}`, id);
      return json(rows[index]);
    }
    const snapshot = await adminDb.collection(collection).doc(id).get(); if (!snapshot.exists) throw new Error("NOT_FOUND");
    if (!isAdminAllowed(identity, permissions[collection].manage) && !owns(identity, collection, { id, ...snapshot.data() })) throw new Error("FORBIDDEN");
    await adminDb.collection(collection).doc(id).set({ ...patch, updatedAt: new Date().toISOString(), ...(identity.isAdmin ? { updatedBy: identity.uid } : {}) }, { merge: true });
    await audit(identity.uid, `update:${collection}`, id);
    return json({ id, ...patch });
  } catch (error) { return fail(error); }
}
export async function remove(request: NextRequest, collection: string, id: string) {
  try {
    const identity = await access(request, collection, true);
    if (!identity || readOnlyCollections.has(collection)) throw new Error("FORBIDDEN");
    if (isDemo()) {
      const rows = demoCollections[collection] ?? [];
      const index = rows.findIndex((item) => item.id === id);
      if (index >= 0 && !isAdminAllowed(identity, permissions[collection].manage) && !owns(identity, collection, rows[index])) throw new Error("FORBIDDEN");
      if (index >= 0) rows.splice(index, 1);
      await audit(identity.uid, `delete:${collection}`, id);
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }
    const snapshot = await adminDb.collection(collection).doc(id).get(); if (!snapshot.exists) throw new Error("NOT_FOUND");
    if (!isAdminAllowed(identity, permissions[collection].manage) && !owns(identity, collection, { id, ...snapshot.data() })) throw new Error("FORBIDDEN");
    await adminDb.collection(collection).doc(id).delete();
    await audit(identity.uid, `delete:${collection}`, id);
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  } catch (error) { return fail(error); }
}
async function audit(adminId: string, action: string, resourceId: string) {
  if (isDemo()) {
    demoCollections.admin_logs.unshift({ id: `audit-${Date.now()}`, adminId, action, resourceId, createdAt: new Date().toISOString() });
    return;
  }
  await adminDb.collection(FIRESTORE_COLLECTIONS.adminLogs).add({ adminId, action, resourceId, createdAt: new Date().toISOString() });
}
