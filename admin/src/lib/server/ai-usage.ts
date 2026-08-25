import { createHash } from "node:crypto";
import { adminDb } from "./firebase-admin";
import { finalizeManusAiUsage, reserveManusAiUsage } from "./manus-data";
import { isManusRuntime } from "./runtime";

export type AiOperation =
  | "clothing_detection"
  | "clothing_enhance"
  | "outfit_recommend"
  | "virtual_tryon"
  | "style_profile_analyze";

export type AiUsageStatus = "RESERVED" | "COMMITTED" | "RELEASED";
export type AiResultStatus = "success" | "fallback" | "failure";
export type AiPlan = "free" | "pro" | "premium";

const USAGE_COLLECTION = "ai_usage";
const LOG_COLLECTION = "ai_logs";
const MAX_REPLAY_BYTES = 800_000;

export class AiUsageError extends Error {
  constructor(
    public readonly code:
      | "UNAUTHORIZED"
      | "USER_NOT_FOUND"
      | "QUOTA_EXCEEDED"
      | "IDEMPOTENCY_CONFLICT"
      | "AI_REQUEST_IN_PROGRESS"
      | "IDEMPOTENCY_REPLAY_UNAVAILABLE"
      | "INVALID_USAGE_STATE",
    message: string,
    public readonly status = code === "QUOTA_EXCEEDED" ? 429 : code === "UNAUTHORIZED" ? 401 : 409,
  ) {
    super(message);
    this.name = "AiUsageError";
  }
}

export interface AiReservation {
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
  isReplay: boolean;
  responseBody?: unknown;
  responseText?: string;
  responseContentType?: string;
  responseStatus?: number;
}

interface StoredUsage extends Record<string, unknown> {
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
}

function currentQuotaPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

function normalizePlan(value: unknown): AiPlan {
  return value === "pro" || value === "premium" ? value : "free";
}

function usageIdFor(userId: string, idempotencyKey: string): string {
  return createHash("sha256").update(`${userId}:${idempotencyKey}`).digest("hex");
}

function asStoredUsage(data: Record<string, unknown>, fallbackId: string): StoredUsage {
  return {
    usageId: String(data.usageId ?? fallbackId),
    userId: String(data.userId ?? ""),
    operation: data.operation as AiOperation,
    plan: normalizePlan(data.plan),
    idempotencyKey: String(data.idempotencyKey ?? ""),
    requestId: String(data.requestId ?? ""),
    quotaUnits: Number(data.quotaUnits ?? 1),
    unlimited: Boolean(data.unlimited),
    quotaPeriod: String(data.quotaPeriod ?? currentQuotaPeriod()),
    status: data.status as AiUsageStatus,
    fallbackUsed: Boolean(data.fallbackUsed),
    responseBody: data.responseBody,
    responseText: typeof data.responseText === "string" ? data.responseText : undefined,
    responseContentType: typeof data.responseContentType === "string" ? data.responseContentType : undefined,
    responseStatus: typeof data.responseStatus === "number" ? data.responseStatus : undefined,
  };
}

function replayFields(input: {
  responseBody?: unknown;
  responseText?: string;
  responseContentType?: string;
  responseStatus?: number;
}) {
  const fields: Record<string, unknown> = {};
  if (input.responseBody !== undefined) {
    const serialized = JSON.stringify(input.responseBody);
    if (Buffer.byteLength(serialized, "utf8") <= MAX_REPLAY_BYTES) fields.responseBody = input.responseBody;
  }
  if (input.responseText !== undefined && Buffer.byteLength(input.responseText, "utf8") <= MAX_REPLAY_BYTES) {
    fields.responseText = input.responseText;
  }
  if (input.responseContentType) fields.responseContentType = input.responseContentType;
  if (typeof input.responseStatus === "number") fields.responseStatus = input.responseStatus;
  return fields;
}

export async function reserveAiUsage(input: {
  userId: string;
  operation: AiOperation;
  idempotencyKey: string;
  requestId: string;
}): Promise<AiReservation> {
  if (isManusRuntime()) {
    try { return await reserveManusAiUsage(input); }
    catch (error) { throw mapManusUsageError(error); }
  }
  const usageId = usageIdFor(input.userId, input.idempotencyKey);
  const usageRef = adminDb.collection(USAGE_COLLECTION).doc(usageId);
  const userRef = adminDb.collection("users").doc(input.userId);
  let reservation: AiReservation | null = null;

  await adminDb.runTransaction(async (transaction) => {
    const existingSnap = await transaction.get(usageRef);
    if (existingSnap.exists) {
      const existing = asStoredUsage(existingSnap.data() as Record<string, unknown>, usageId);
      if (existing.userId !== input.userId || existing.operation !== input.operation) {
        throw new AiUsageError("IDEMPOTENCY_CONFLICT", "Idempotency key is already bound to another AI operation.");
      }
      reservation = { ...existing, isReplay: true };
      return;
    }

    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) throw new AiUsageError("USER_NOT_FOUND", "User profile was not found.", 404);
    const user = userSnap.data() as Record<string, unknown>;
    const plan = normalizePlan(user.plan);
    const monthlyLimit = Number(user.aiUsageMonthlyLimit ?? 0);
    const unlimited = plan !== "free" || monthlyLimit < 0;
    const period = currentQuotaPeriod();
    const storedPeriod = String(user.aiQuotaPeriod ?? "");
    const remainingBeforeReset = Number(user.aiUsageRemaining ?? 0);
    const remaining = storedPeriod === period ? remainingBeforeReset : monthlyLimit;
    const quotaUnits = 1;

    if (!unlimited && remaining < quotaUnits) {
      throw new AiUsageError("QUOTA_EXCEEDED", "No AI quota is available for this account.");
    }

    const createdAt = new Date().toISOString();
    const payload: StoredUsage = {
      usageId,
      userId: input.userId,
      operation: input.operation,
      plan,
      idempotencyKey: input.idempotencyKey,
      requestId: input.requestId,
      quotaUnits,
      unlimited,
      quotaPeriod: period,
      status: "RESERVED",
      fallbackUsed: false,
      reservedAt: createdAt,
    };
    transaction.create(usageRef, payload);
    if (!unlimited) {
      transaction.update(userRef, {
        aiUsageRemaining: remaining - quotaUnits,
        aiQuotaPeriod: period,
        updatedAt: createdAt,
      });
    }
    reservation = { ...payload, isReplay: false };
  });

  if (!reservation) throw new AiUsageError("INVALID_USAGE_STATE", "AI usage reservation did not complete.");
  const resolvedReservation = reservation as AiReservation;
  if (resolvedReservation.isReplay && resolvedReservation.status === "RESERVED") {
    throw new AiUsageError("AI_REQUEST_IN_PROGRESS", "The same AI request is already being processed.");
  }
  if (resolvedReservation.isReplay && resolvedReservation.status === "RELEASED" && resolvedReservation.responseBody === undefined && resolvedReservation.responseText === undefined) {
    throw new AiUsageError("IDEMPOTENCY_REPLAY_UNAVAILABLE", "The original AI request failed; retry with a new idempotency key.");
  }
  return resolvedReservation;
}

export async function finalizeAiUsage(input: {
  reservation: AiReservation;
  modelUsed?: string;
  provider?: string;
  fallbackUsed: boolean;
  resultStatus: AiResultStatus;
  responseBody?: unknown;
  responseText?: string;
  responseContentType?: string;
  responseStatus?: number;
  errorCode?: string;
}): Promise<AiReservation> {
  if (isManusRuntime()) {
    try { return await finalizeManusAiUsage(input); }
    catch (error) { throw mapManusUsageError(error); }
  }
  const usageRef = adminDb.collection(USAGE_COLLECTION).doc(input.reservation.usageId);
  const userRef = adminDb.collection("users").doc(input.reservation.userId);
  const logRef = adminDb.collection(LOG_COLLECTION).doc(input.reservation.usageId);
  let result: AiReservation | null = null;

  await adminDb.runTransaction(async (transaction) => {
    const usageSnap = await transaction.get(usageRef);
    if (!usageSnap.exists) throw new AiUsageError("INVALID_USAGE_STATE", "AI usage reservation was not found.");
    const usage = asStoredUsage(usageSnap.data() as Record<string, unknown>, input.reservation.usageId);
    if (usage.status === "COMMITTED" || usage.status === "RELEASED") {
      result = { ...usage, isReplay: true };
      return;
    }
    if (usage.status !== "RESERVED") throw new AiUsageError("INVALID_USAGE_STATE", "Invalid AI usage transition.");

    const shouldCommit = input.resultStatus === "success" && !input.fallbackUsed;
    const status: AiUsageStatus = shouldCommit ? "COMMITTED" : "RELEASED";
    const now = new Date().toISOString();
    const storedResponse = replayFields(input);
    let userForRelease: Record<string, unknown> | undefined;
    if (!usage.unlimited && !shouldCommit) {
      const userSnap = await transaction.get(userRef);
      if (userSnap.exists) userForRelease = userSnap.data() as Record<string, unknown>;
    }

    const usageUpdate: Record<string, unknown> = {
      status,
      fallbackUsed: input.fallbackUsed,
      model: input.modelUsed ?? "NOT_OBSERVABLE",
      provider: input.provider ?? "NOT_OBSERVABLE",
      resultStatus: input.resultStatus,
      ...storedResponse,
    };
    if (shouldCommit) usageUpdate.completedAt = now;
    else usageUpdate.releasedAt = now;
    if (input.errorCode) usageUpdate.errorCode = input.errorCode;
    transaction.update(usageRef, usageUpdate);

    if (userForRelease) {
      const currentPeriod = String(userForRelease.aiQuotaPeriod ?? "");
      const currentRemaining = Number(userForRelease.aiUsageRemaining ?? 0);
      if (currentPeriod === usage.quotaPeriod) {
        transaction.update(userRef, {
          aiUsageRemaining: currentRemaining + usage.quotaUnits,
          updatedAt: now,
        });
      }
    }

    transaction.set(logRef, {
      usageId: usage.usageId,
      userId: usage.userId,
      operation: usage.operation,
      plan: usage.plan,
      provider: input.provider ?? "NOT_OBSERVABLE",
      model: input.modelUsed ?? "NOT_OBSERVABLE",
      fallbackUsed: input.fallbackUsed,
      quotaUnits: usage.quotaUnits,
      status,
      resultStatus: input.resultStatus,
      idempotencyKey: usage.idempotencyKey,
      requestId: usage.requestId,
      cost: "NOT_OBSERVABLE",
      createdAt: now,
      ...(input.errorCode ? { errorCode: input.errorCode } : {}),
    });

    result = {
      ...usage,
      ...storedResponse,
      status,
      fallbackUsed: input.fallbackUsed,
      isReplay: false,
      responseBody: input.responseBody,
      responseText: input.responseText,
      responseContentType: input.responseContentType,
      responseStatus: input.responseStatus,
    };
  });

  if (!result) throw new AiUsageError("INVALID_USAGE_STATE", "AI usage finalization did not complete.");
  return result;
}

function mapManusUsageError(error: unknown): AiUsageError {
  const code = error instanceof Error ? error.message : "INVALID_USAGE_STATE";
  const known = new Set<AiUsageError["code"]>(["UNAUTHORIZED", "USER_NOT_FOUND", "QUOTA_EXCEEDED", "IDEMPOTENCY_CONFLICT", "AI_REQUEST_IN_PROGRESS", "IDEMPOTENCY_REPLAY_UNAVAILABLE", "INVALID_USAGE_STATE"]);
  const resolved = known.has(code as AiUsageError["code"]) ? code as AiUsageError["code"] : "INVALID_USAGE_STATE";
  return new AiUsageError(resolved, "AI usage request could not be processed.", resolved === "USER_NOT_FOUND" ? 404 : undefined);
}

export function replayableReservation(reservation: AiReservation): boolean {
  return reservation.responseBody !== undefined || reservation.responseText !== undefined;
}

export function aiUsageErrorResponse(error: unknown): { code: string; message: string; status: number } {
  if (error instanceof AiUsageError) return { code: error.code, message: error.message, status: error.status };
  return { code: "AI_REQUEST_FAILED", message: "AI request failed.", status: 503 };
}
