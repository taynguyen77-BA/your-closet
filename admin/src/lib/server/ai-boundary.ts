import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth, adminDb } from "./firebase-admin";
import { corsHeaders } from "./resources";
import {
  aiUsageErrorResponse,
  finalizeAiUsage,
  reserveAiUsage,
  type AiOperation,
  type AiPlan,
} from "./ai-usage";

export const AI_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const AI_MAX_JSON_BYTES = 256 * 1024;
export const AI_PROVIDER_TIMEOUT_MS = 20_000;
export const AI_OPERATION_TIMEOUT_MS = 45_000;

const ROUTES: Record<string, { operation: AiOperation; kind: "image" | "json"; fields: string[] }> = {
  "clothing/detect": { operation: "clothing_detection", kind: "image", fields: ["image"] },
  "clothing/analyze-and-enhance": { operation: "clothing_enhance", kind: "image", fields: ["image"] },
  "outfits/recommend": { operation: "outfit_recommend", kind: "json", fields: [] },
  "try-on/generate": { operation: "virtual_tryon", kind: "image", fields: ["image", "outfitItemIds", "scene"] },
  "style-profile/analyze": { operation: "style_profile_analyze", kind: "json", fields: [] },
};

export interface AuthenticatedAiRequest {
  userId: string;
  plan: AiPlan;
  requestId: string;
  idempotencyKey: string;
}

export interface AiExecutionResult {
  body: unknown;
  status?: number;
  contentType?: string;
  modelUsed?: string;
  provider?: string;
  fallbackUsed?: boolean;
}

export class AiBoundaryError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) {
    super(message);
    this.name = "AiBoundaryError";
  }
}

export function routeForPath(path: string[]): { operation: AiOperation; kind: "image" | "json"; fields: string[] } {
  const route = ROUTES[path.join("/")];
  if (!route) throw new AiBoundaryError("AI_OPERATION_NOT_ALLOWED", "AI operation is not allowed.", 404);
  return route;
}

export async function authenticateAiRequest(request: NextRequest, operation: AiOperation): Promise<AuthenticatedAiRequest> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new AiBoundaryError("UNAUTHORIZED", "Authentication is required.", 401);
  const decoded = await adminAuth.verifyIdToken(token).catch(() => null);
  if (!decoded) throw new AiBoundaryError("UNAUTHORIZED", "Authentication is required.", 401);
  const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
  if (!userSnap.exists) throw new AiBoundaryError("USER_NOT_FOUND", "User profile was not found.", 404);
  const user = userSnap.data() as Record<string, unknown>;
  if (user.status === "suspended") throw new AiBoundaryError("FORBIDDEN", "This account cannot use AI operations.", 403);
  const plan = user.plan === "pro" || user.plan === "premium" ? user.plan : "free";
  const requestId = request.headers.get("x-request-id")?.trim() || randomUUID();
  const suppliedKey = request.headers.get("idempotency-key")?.trim();
  const idempotencyKey = suppliedKey || requestId;
  if (idempotencyKey.length > 200 || !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey)) {
    throw new AiBoundaryError("INVALID_IDEMPOTENCY_KEY", "Idempotency-Key is invalid.", 400);
  }
  return {
    userId: decoded.uid,
    plan,
    requestId,
    idempotencyKey: `${operation}:${idempotencyKey}`,
  };
}

export function validateJsonContentType(request: NextRequest): void {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") throw new AiBoundaryError("INVALID_CONTENT_TYPE", "AI JSON requests must use application/json.", 415);
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > AI_MAX_JSON_BYTES) throw new AiBoundaryError("REQUEST_TOO_LARGE", "AI request body is too large.", 413);
}

export async function readJsonBody(request: NextRequest): Promise<Record<string, unknown>> {
  validateJsonContentType(request);
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > AI_MAX_JSON_BYTES) throw new AiBoundaryError("REQUEST_TOO_LARGE", "AI request body is too large.", 413);
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new AiBoundaryError("INVALID_JSON", "AI request body is malformed JSON.", 400);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AiBoundaryError("INVALID_JSON", "AI request body must be a JSON object.", 400);
  }
  return value as Record<string, unknown>;
}

export async function readImageForm(request: NextRequest, allowedFields: string[]): Promise<{ form: FormData; file: File }> {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "multipart/form-data") throw new AiBoundaryError("INVALID_CONTENT_TYPE", "AI image requests must use multipart/form-data.", 415);
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > AI_MAX_IMAGE_BYTES + 256 * 1024) throw new AiBoundaryError("REQUEST_TOO_LARGE", "AI image request is too large.", 413);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new AiBoundaryError("INVALID_MULTIPART", "AI multipart request is malformed.", 400);
  }
  for (const key of Array.from(form.keys())) {
    if (!allowedFields.includes(key)) throw new AiBoundaryError("INVALID_FIELD", `AI field '${key}' is not allowed.`, 400);
  }
  const file = form.get("image");
  if (!(file instanceof File)) throw new AiBoundaryError("IMAGE_REQUIRED", "AI image field is required.", 400);
  if (!file.type || !file.type.toLowerCase().startsWith("image/")) throw new AiBoundaryError("INVALID_MIME_TYPE", "Only image uploads are accepted.", 415);
  if (file.size <= 0 || file.size > AI_MAX_IMAGE_BYTES) throw new AiBoundaryError("REQUEST_TOO_LARGE", "AI image must be between 1 byte and 10 MB.", 413);
  return { form, file };
}

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = AI_PROVIDER_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiBoundaryError("AI_PROVIDER_TIMEOUT", "AI provider timed out.", 504);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function withOperationTimeout<T>(operation: Promise<T>, timeoutMs = AI_OPERATION_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new AiBoundaryError("AI_OPERATION_TIMEOUT", "AI operation timed out.", 504)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function fetchTextWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = AI_PROVIDER_TIMEOUT_MS): Promise<{ response: Response; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const text = await response.text();
    return { response, text };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new AiBoundaryError("AI_PROVIDER_TIMEOUT", "AI provider timed out.", 504);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function safeError(error: unknown, requestId: string): { code: string; message: string; requestId: string; status: number } {
  if (error instanceof AiBoundaryError) return { code: error.code, message: error.message, requestId, status: error.status };
  const mapped = aiUsageErrorResponse(error);
  return { code: mapped.code, message: mapped.message, requestId, status: mapped.status };
}

function statusForError(error: unknown): number {
  if (error instanceof AiBoundaryError) return error.status;
  const mapped = aiUsageErrorResponse(error);
  return mapped.status;
}

export function aiBoundaryErrorResponse(error: unknown, request: NextRequest): NextResponse {
  const requestId = request.headers.get("x-request-id")?.trim() || randomUUID();
  const safe = safeError(error, requestId);
  return NextResponse.json(safe, { status: statusForError(error), headers: { ...corsHeaders, "X-Request-Id": requestId } });
}

export async function executeAiOperation<T>(
  request: NextRequest,
  operation: AiOperation,
  preflight: (auth: AuthenticatedAiRequest) => Promise<T>,
  handler: (auth: AuthenticatedAiRequest, input: T) => Promise<AiExecutionResult>,
): Promise<NextResponse> {
  let auth: AuthenticatedAiRequest;
  try {
    auth = await authenticateAiRequest(request, operation);
  } catch (error) {
    const requestId = request.headers.get("x-request-id")?.trim() || randomUUID();
    const safe = safeError(error, requestId);
    return NextResponse.json(safe, { status: statusForError(error), headers: { ...corsHeaders, "X-Request-Id": requestId } });
  }

  let input: T;
  try {
    input = await preflight(auth);
  } catch (error) {
    const safe = safeError(error, auth.requestId);
    return NextResponse.json(safe, { status: statusForError(error), headers: { ...corsHeaders, "X-Request-Id": auth.requestId } });
  }

  let reservation;
  try {
    reservation = await reserveAiUsage({
      userId: auth.userId,
      operation,
      idempotencyKey: auth.idempotencyKey,
      requestId: auth.requestId,
    });
  } catch (error) {
    const safe = safeError(error, auth.requestId);
    return NextResponse.json(safe, { status: safe.status, headers: { ...corsHeaders, "X-Request-Id": auth.requestId } });
  }

  if (reservation.isReplay) {
    if (reservation.responseBody !== undefined) {
      return NextResponse.json(reservation.responseBody, { status: reservation.responseStatus ?? 200, headers: { ...corsHeaders, "X-Request-Id": auth.requestId } });
    }
    if (reservation.responseText !== undefined) {
      return new NextResponse(reservation.responseText, { status: reservation.responseStatus ?? 200, headers: { ...corsHeaders, "X-Request-Id": auth.requestId, "Content-Type": reservation.responseContentType ?? "application/json" } });
    }
  }

  let result: AiExecutionResult;
  try {
    result = await withOperationTimeout(handler(auth, input));
  } catch (error) {
    const safe = safeError(error, auth.requestId);
    const errorBody = { ...safe };
    await finalizeAiUsage({
      reservation,
      provider: "NOT_OBSERVABLE",
      fallbackUsed: false,
      resultStatus: "failure",
      responseBody: errorBody,
      responseStatus: safe.status,
      responseContentType: "application/json",
      errorCode: safe.code,
    }).catch((finalizeError) => console.error("[ai-boundary] failed to release quota:", finalizeError));
    return NextResponse.json(errorBody, { status: safe.status, headers: { ...corsHeaders, "X-Request-Id": auth.requestId } });
  }

  const body = result.body;
  const fallbackUsed = Boolean(result.fallbackUsed);
  let finalized;
  try {
    finalized = await finalizeAiUsage({
      reservation,
      modelUsed: result.modelUsed,
      provider: result.provider ?? "NOT_OBSERVABLE",
      fallbackUsed,
      resultStatus: fallbackUsed ? "fallback" : "success",
      responseBody: body,
      responseStatus: result.status ?? 200,
      responseContentType: result.contentType ?? "application/json",
    });
  } catch (error) {
    console.error("[ai-boundary] usage finalization failed:", error);
    const safe = { code: "AI_USAGE_FINALIZATION_FAILED", message: "AI usage could not be finalized.", requestId: auth.requestId };
    return NextResponse.json(safe, { status: 503, headers: { ...corsHeaders, "X-Request-Id": auth.requestId } });
  }
  if (finalized.status === "RELEASED" && fallbackUsed) {
    // Preserve the existing mobile contract while making the release observable server-side.
    return NextResponse.json(body, { status: result.status ?? 200, headers: { ...corsHeaders, "X-Request-Id": auth.requestId } });
  }
  return result.contentType && result.contentType !== "application/json"
    ? new NextResponse(String(body), { status: result.status ?? 200, headers: { ...corsHeaders, "X-Request-Id": auth.requestId, "Content-Type": result.contentType } })
    : NextResponse.json(body, { status: result.status ?? 200, headers: { ...corsHeaders, "X-Request-Id": auth.requestId } });
}

export function operationForCatchAll(path: string[]): AiOperation {
  return routeForPath(path).operation;
}

export function validateCatchAllRequest(request: NextRequest, route: { kind: "image" | "json"; fields: string[] }): void {
  if (request.method !== "POST") throw new AiBoundaryError("METHOD_NOT_ALLOWED", "Only POST is supported for AI operations.", 405);
  if (route.kind === "json") validateJsonContentType(request);
  else {
    const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (contentType !== "multipart/form-data") throw new AiBoundaryError("INVALID_CONTENT_TYPE", "AI image requests must use multipart/form-data.", 415);
  }
}

export { corsHeaders };
