import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash, randomUUID } from "node:crypto";
import type { AiOperation, AiPlan, AiReservation, AiResultStatus, AiUsageStatus } from "./ai-usage";
import { queryWardrobeItems, type WardrobeQuery, type WardrobeQueryResult } from "./wardrobe-intelligence";

type ManusUser = Record<string, unknown> & {
  id: string;
  uid: string;
  plan: AiPlan;
  status: string;
  aiUsageRemaining: number;
  aiUsageMonthlyLimit: number;
  aiQuotaPeriod: string;
  closetItemCount: number;
  closetItemLimit: number;
};

type ManusItem = Record<string, unknown> & { id: string; userId: string; storagePath?: string; originalStoragePath?: string };
type ManusRequest = Record<string, unknown> & { userId: string; operation: string; itemId?: string };
type ManusCleanupTask = Record<string, unknown> & { id: string; userId: string; status: "pending" | "completed" };
type ManusUsage = Record<string, unknown> & {
  usageId: string;
  userId: string;
  operation: AiOperation;
  plan: AiPlan;
  idempotencyKey: string;
  requestId: string;
  quotaUnits: number;
  unlimited: boolean;
  quotaPeriod: string;
  status: AiUsageStatus;
  fallbackUsed: boolean;
  responseBody?: unknown;
  responseText?: string;
  responseContentType?: string;
  responseStatus?: number;
};

type ManusState = {
  users: Record<string, ManusUser>;
  clothes: Record<string, ManusItem>;
  requests: Record<string, ManusRequest>;
  cleanupTasks: Record<string, ManusCleanupTask>;
  aiUsage: Record<string, ManusUsage>;
  aiLogs: Record<string, Record<string, unknown>>;
};

const DATA_DIR = process.env.WARDRO_MANUS_DATA_DIR?.trim() || join(tmpdir(), "wardro-manus-runtime");
const DATA_FILE = join(DATA_DIR, "state.json");
let mutationQueue: Promise<unknown> = Promise.resolve();

function emptyState(): ManusState {
  return { users: {}, clothes: {}, requests: {}, cleanupTasks: {}, aiUsage: {}, aiLogs: {} };
}

function defaultUser(uid: string): ManusUser {
  const now = new Date().toISOString();
  return {
    id: uid,
    uid,
    name: uid === "manus-user-b" ? "Manus User B" : uid === "manus-admin" ? "Manus Admin" : "Manus User A",
    displayName: uid === "manus-user-b" ? "Manus User B" : uid === "manus-admin" ? "Manus Admin" : "Manus User A",
    username: uid,
    email: `${uid}@manus.local`,
    authProvider: "manus",
    provider: "manus",
    plan: "free",
    aiUsageRemaining: 10,
    aiUsageMonthlyLimit: 10,
    aiQuotaPeriod: now.slice(0, 7),
    closetItemLimit: 50,
    closetItemCount: 0,
    status: "active",
    hasCompletedStyleSurvey: true,
    styleProfileCompletionPercent: 100,
    stylePreferences: { preferredStyles: [], favoriteColors: [], lifestyleOccasions: [], fashionConfidence: "", updatedAt: now },
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
}

async function loadState(): Promise<ManusState> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<ManusState>;
    return {
      users: parsed.users ?? {},
      clothes: parsed.clothes ?? {},
      requests: parsed.requests ?? {},
      cleanupTasks: parsed.cleanupTasks ?? {},
      aiUsage: parsed.aiUsage ?? {},
      aiLogs: parsed.aiLogs ?? {},
    };
  } catch {
    return emptyState();
  }
}

async function saveState(state: ManusState) {
  await mkdir(DATA_DIR, { recursive: true });
  const temp = `${DATA_FILE}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(state, null, 2), "utf8");
  await rename(temp, DATA_FILE);
}

async function read<T>(reader: (state: ManusState) => T): Promise<T> {
  await mutationQueue;
  return reader(await loadState());
}

async function mutate<T>(mutation: (state: ManusState) => Promise<T> | T): Promise<T> {
  const operation = mutationQueue.then(async () => {
    const state = await loadState();
    const result = await mutation(state);
    await saveState(state);
    return result;
  });
  mutationQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

export async function ensureManusUser(uid: string): Promise<ManusUser> {
  return mutate((state) => {
    state.users[uid] ??= defaultUser(uid);
    return state.users[uid];
  });
}

export async function getManusUser(uid: string): Promise<ManusUser | null> {
  return read((state) => state.users[uid] ?? null);
}

export async function updateManusUser(uid: string, patch: Record<string, unknown>): Promise<ManusUser> {
  return mutate((state) => {
    const user = state.users[uid] ?? (state.users[uid] = defaultUser(uid));
    const protectedFields = new Set(["id", "uid", "plan", "status", "aiUsageRemaining", "aiUsageMonthlyLimit", "aiQuotaPeriod", "closetItemCount", "closetItemLimit"]);
    for (const [key, value] of Object.entries(patch)) if (!protectedFields.has(key)) (user as Record<string, unknown>)[key] = value;
    user.updatedAt = new Date().toISOString();
    return user;
  });
}

export async function listManusClothes(uid: string, query?: WardrobeQuery): Promise<ManusItem[] | WardrobeQueryResult<ManusItem>> {
  return read((state) => {
    const items = Object.values(state.clothes).filter((item) => item.userId === uid);
    if (!query) return items.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    return queryWardrobeItems(items, query);
  });
}

export async function getManusClothing(uid: string, id: string): Promise<ManusItem | null> {
  return read((state) => {
    const item = state.clothes[id];
    return item?.userId === uid ? item : null;
  });
}

export async function createManusClothing(input: {
  uid: string;
  payload: ManusItem;
  idempotencyKey: string;
}): Promise<{ item: ManusItem; replayed: boolean }> {
  return mutate((state) => {
    const requestId = `create:${input.uid}:${input.idempotencyKey}`;
    const existingRequest = state.requests[requestId];
    if (existingRequest) {
      const existing = existingRequest.itemId ? state.clothes[existingRequest.itemId] : undefined;
      if (!existing) throw new Error("IDEMPOTENCY_REPLAY_UNAVAILABLE");
      return { item: existing, replayed: true };
    }
    const user = state.users[input.uid] ?? (state.users[input.uid] = defaultUser(input.uid));
    if (user.status === "suspended" || user.status === "banned") throw new Error("FORBIDDEN");
    if (user.closetItemLimit > 0 && user.closetItemCount >= user.closetItemLimit) throw new Error("CLOSET_LIMIT_REACHED");
    const id = input.payload.id || randomUUID();
    const item = { ...input.payload, id, userId: input.uid };
    state.clothes[id] = item;
    state.requests[requestId] = { userId: input.uid, operation: "create_clothing", itemId: id, createdAt: new Date().toISOString() };
    user.closetItemCount += 1;
    user.updatedAt = new Date().toISOString();
    return { item, replayed: false };
  });
}

export async function updateManusClothing(input: { uid: string; id: string; patch: Record<string, unknown>; idempotencyKey?: string | null }): Promise<{ item: ManusItem; replayed: boolean }> {
  return mutate((state) => {
    const current = state.clothes[input.id];
    if (!current) throw new Error("NOT_FOUND");
    if (current.userId !== input.uid) throw new Error("FORBIDDEN");
    const requestId = input.idempotencyKey ? `update:${input.uid}:${input.id}:${input.idempotencyKey}` : null;
    if (requestId && state.requests[requestId]) return { item: { ...current, ...state.requests[requestId].patch as Record<string, unknown> }, replayed: true };
    const patch = { ...input.patch, updatedAt: new Date().toISOString() };
    state.clothes[input.id] = { ...current, ...patch };
    if (requestId) state.requests[requestId] = { userId: input.uid, operation: "update_clothing", itemId: input.id, patch, createdAt: new Date().toISOString() };
    return { item: state.clothes[input.id], replayed: false };
  });
}

export async function deleteManusClothing(input: { uid: string; id: string; idempotencyKey: string }): Promise<{ paths: string[]; cleanupTaskId: string | null; replayed: boolean }> {
  return mutate((state) => {
    const requestId = `delete:${input.uid}:${input.id}:${input.idempotencyKey}`;
    if (state.requests[requestId]) return { paths: [], cleanupTaskId: null, replayed: true };
    const current = state.clothes[input.id];
    if (!current) throw new Error("NOT_FOUND");
    if (current.userId !== input.uid) throw new Error("FORBIDDEN");
    const paths = [current.storagePath, current.originalStoragePath].filter((path, index, all): path is string => typeof path === "string" && Boolean(path) && all.indexOf(path) === index);
    const taskId = paths.length ? randomUUID() : null;
    if (taskId) state.cleanupTasks[taskId] = { id: taskId, userId: input.uid, itemId: input.id, paths, status: "pending", createdAt: new Date().toISOString() };
    delete state.clothes[input.id];
    state.requests[requestId] = { userId: input.uid, operation: "delete_clothing", itemId: input.id, cleanupTaskId: taskId ?? undefined, createdAt: new Date().toISOString() };
    const user = state.users[input.uid];
    if (user) user.closetItemCount = Math.max(0, user.closetItemCount - 1);
    return { paths, cleanupTaskId: taskId, replayed: false };
  });
}

export async function setManusCleanupStatus(taskId: string, status: "pending" | "completed", lastError?: string) {
  return mutate((state) => {
    const task = state.cleanupTasks[taskId];
    if (!task) return;
    task.status = status;
    task.updatedAt = new Date().toISOString();
    if (status === "completed") task.completedAt = task.updatedAt;
    else if (lastError) task.lastError = lastError;
  });
}

export async function deleteManusUser(uid: string) {
  return mutate((state) => {
    delete state.users[uid];
    for (const [id, item] of Object.entries(state.clothes)) if (item.userId === uid) delete state.clothes[id];
    for (const [id, request] of Object.entries(state.requests)) if (request.userId === uid) delete state.requests[id];
    for (const [id, task] of Object.entries(state.cleanupTasks)) if (task.userId === uid) delete state.cleanupTasks[id];
    // aiUsage and aiLogs are deliberately preserved until Product/Legal approves retention policy.
  });
}

export async function reserveManusAiUsage(input: { userId: string; operation: AiOperation; idempotencyKey: string; requestId: string }): Promise<AiReservation> {
  return mutate((state) => {
    const usageId = createHashId(`${input.userId}:${input.idempotencyKey}`);
    const existing = state.aiUsage[usageId];
    if (existing) {
      if (existing.userId !== input.userId || existing.operation !== input.operation) throw new Error("IDEMPOTENCY_CONFLICT");
      const replay = { ...existing, isReplay: true } as AiReservation;
      if (replay.status === "RESERVED") throw new Error("AI_REQUEST_IN_PROGRESS");
      if (replay.status === "RELEASED" && replay.responseBody === undefined && replay.responseText === undefined) throw new Error("IDEMPOTENCY_REPLAY_UNAVAILABLE");
      return replay;
    }
    const user = state.users[input.userId] ?? (state.users[input.userId] = defaultUser(input.userId));
    const period = new Date().toISOString().slice(0, 7);
    const monthlyLimit = Number(user.aiUsageMonthlyLimit ?? 0);
    const unlimited = user.plan !== "free" || monthlyLimit < 0;
    const remaining = user.aiQuotaPeriod === period ? Number(user.aiUsageRemaining ?? 0) : monthlyLimit;
    if (!unlimited && remaining < 1) throw new Error("QUOTA_EXCEEDED");
    const payload: ManusUsage = { usageId, userId: input.userId, operation: input.operation, plan: user.plan, idempotencyKey: input.idempotencyKey, requestId: input.requestId, quotaUnits: 1, unlimited, quotaPeriod: period, status: "RESERVED", fallbackUsed: false, reservedAt: new Date().toISOString() };
    state.aiUsage[usageId] = payload;
    if (!unlimited) { user.aiUsageRemaining = remaining - 1; user.aiQuotaPeriod = period; }
    return { ...payload, isReplay: false } as AiReservation;
  });
}

export async function finalizeManusAiUsage(input: { reservation: AiReservation; modelUsed?: string; provider?: string; fallbackUsed: boolean; resultStatus: AiResultStatus; responseBody?: unknown; responseText?: string; responseContentType?: string; responseStatus?: number; errorCode?: string }): Promise<AiReservation> {
  return mutate((state) => {
    const usage = state.aiUsage[input.reservation.usageId];
    if (!usage) throw new Error("INVALID_USAGE_STATE");
    if (usage.status !== "RESERVED") return { ...usage, isReplay: true } as AiReservation;
    const shouldCommit = input.resultStatus === "success" && !input.fallbackUsed;
    const status: AiUsageStatus = shouldCommit ? "COMMITTED" : "RELEASED";
    usage.status = status;
    usage.fallbackUsed = input.fallbackUsed;
    usage.model = input.modelUsed ?? "NOT_OBSERVABLE";
    usage.provider = input.provider ?? "MANUS_DEVELOPMENT";
    usage.resultStatus = input.resultStatus;
    usage.responseBody = input.responseBody;
    usage.responseText = input.responseText;
    usage.responseContentType = input.responseContentType;
    usage.responseStatus = input.responseStatus;
    usage.errorCode = input.errorCode;
    if (!shouldCommit && !usage.unlimited) {
      const user = state.users[usage.userId];
      if (user && user.aiQuotaPeriod === usage.quotaPeriod) user.aiUsageRemaining += usage.quotaUnits;
    }
    state.aiLogs[usage.usageId] = { usageId: usage.usageId, userId: usage.userId, operation: usage.operation, plan: usage.plan, provider: input.provider ?? "MANUS_DEVELOPMENT", model: input.modelUsed ?? "NOT_OBSERVABLE", fallbackUsed: input.fallbackUsed, quotaUnits: usage.quotaUnits, status, resultStatus: input.resultStatus, idempotencyKey: usage.idempotencyKey, requestId: usage.requestId, cost: "NOT_OBSERVABLE", createdAt: new Date().toISOString(), ...(input.errorCode ? { errorCode: input.errorCode } : {}) };
    return { ...usage, isReplay: false } as AiReservation;
  });
}

export function getManusDataDirectory() { return DATA_DIR; }
function createHashId(value: string) { return `manus-${createHash("sha256").update(value).digest("hex")}`; }
