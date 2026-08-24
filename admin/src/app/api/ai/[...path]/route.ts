import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AiBoundaryError,
  aiBoundaryErrorResponse,
  executeAiOperation,
  fetchTextWithTimeout,
  readImageForm,
  readJsonBody,
  routeForPath,
} from "@/lib/server/ai-boundary";
import { corsHeaders } from "@/lib/server/resources";

export const runtime = "nodejs";
const MAX_PROVIDER_RESPONSE_BYTES = 2 * 1024 * 1024;

function contentTypeOf(response: Response): string {
  return response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() || "application/json";
}

async function forwardToProvider(path: string, authUserId: string, body: unknown, isForm: boolean): Promise<{ body: unknown; contentType: string; modelUsed?: string; fallbackUsed?: boolean }> {
  const upstream = process.env.AI_API_BASE_URL?.replace(/\/$/, "");
  if (!upstream) throw new AiBoundaryError("AI_PROVIDER_NOT_CONFIGURED", "AI provider is not configured.", 503);
  const { response, text } = await fetchTextWithTimeout(`${upstream}/${path}`, {
    method: "POST",
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      "x-ai-user-id": authUserId,
      ...(process.env.AI_API_KEY ? { "x-api-key": process.env.AI_API_KEY } : {}),
    },
    body: isForm ? body as FormData : JSON.stringify(body),
  });
  if (Buffer.byteLength(text, "utf8") > MAX_PROVIDER_RESPONSE_BYTES) throw new AiBoundaryError("AI_RESPONSE_TOO_LARGE", "AI provider response is too large.", 502);
  if (!response.ok) throw new AiBoundaryError("AI_PROVIDER_FAILED", "AI provider request failed.", 503);
  const contentType = contentTypeOf(response);
  if (contentType.includes("json")) {
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { throw new AiBoundaryError("AI_INVALID_RESPONSE", "AI provider returned malformed JSON.", 502); }
    if (parsed === null || parsed === undefined) throw new AiBoundaryError("AI_INVALID_RESPONSE", "AI provider returned an empty response.", 502);
    const object = typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : undefined;
    return {
      body: parsed,
      contentType: "application/json",
      modelUsed: object && typeof object.modelUsed === "string" ? object.modelUsed : undefined,
      fallbackUsed: Boolean(object?.fallbackUsed),
    };
  }
  if (!text) throw new AiBoundaryError("AI_INVALID_RESPONSE", "AI provider returned an empty response.", 502);
  return { body: text, contentType };
}

function validateJsonOperation(operation: string, body: Record<string, unknown>): Record<string, unknown> {
  if (operation === "outfit_recommend" && (!Array.isArray(body.wardrobe) || !body.weather || typeof body.weather !== "object")) {
    throw new AiBoundaryError("INVALID_PAYLOAD", "Outfit recommendation requires wardrobe and weather.", 400);
  }
  if (operation === "style_profile_analyze" && !Array.isArray(body.wardrobe)) {
    throw new AiBoundaryError("INVALID_PAYLOAD", "Style profile analysis requires wardrobe.", 400);
  }
  return body;
}

async function readOperationInput(request: NextRequest, operation: string, route: { kind: "image" | "json"; fields: string[] }) {
  if (route.kind === "json") return validateJsonOperation(operation, await readJsonBody(request));
  const parsed = await readImageForm(request, route.fields);
  if (operation === "virtual_tryon") {
    const scene = parsed.form.get("scene");
    const outfitItemIdsRaw = parsed.form.get("outfitItemIds");
    if (typeof scene !== "string" || !scene.trim() || scene.length > 80) throw new AiBoundaryError("INVALID_PAYLOAD", "Virtual try-on scene is invalid.", 400);
    if (typeof outfitItemIdsRaw !== "string") throw new AiBoundaryError("INVALID_PAYLOAD", "Virtual try-on outfit items are required.", 400);
    let outfitItemIds: unknown;
    try { outfitItemIds = JSON.parse(outfitItemIdsRaw); } catch { throw new AiBoundaryError("INVALID_PAYLOAD", "Virtual try-on outfit items are malformed.", 400); }
    if (!Array.isArray(outfitItemIds) || outfitItemIds.length > 20 || outfitItemIds.some((item) => typeof item !== "string" || item.length > 120)) {
      throw new AiBoundaryError("INVALID_PAYLOAD", "Virtual try-on outfit items are invalid.", 400);
    }
  }
  return parsed;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path;
  let route;
  try {
    route = routeForPath(path);
  } catch (error) {
    return aiBoundaryErrorResponse(error, request);
  }

  return executeAiOperation(
    request,
    route.operation,
    async () => readOperationInput(request, route.operation, route),
    async (auth, input) => {
      const isForm = route.kind === "image";
      const body = isForm && "form" in input ? input.form : input;
      const result = await forwardToProvider(path.join("/"), auth.userId, body, isForm);
      return {
        body: result.body,
        contentType: result.contentType,
        modelUsed: result.modelUsed,
        provider: "configured_ai_upstream",
        fallbackUsed: result.fallbackUsed,
      };
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
