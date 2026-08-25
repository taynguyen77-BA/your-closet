import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { callWithFallback } from "@/lib/server/ai-resolver";
import {
  executeAiOperation,
  fetchTextWithTimeout,
  readImageForm,
} from "@/lib/server/ai-boundary";
import { corsHeaders } from "@/lib/server/resources";
import { isManusRuntime } from "@/lib/server/runtime";

export const runtime = "nodejs";

interface DetectionResponse {
  type: string;
  color: string;
  material?: string;
  style?: string;
  season: string[];
  tags: string[];
  suggestedName: string;
  confidenceScore: number;
  qualityWarnings: string[];
}

function parseDetection(value: unknown): DetectionResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("AI provider returned an invalid response.");
  const parsed = value as Record<string, unknown>;
  const validTypes = ["top", "bottom", "dress", "outerwear", "shoes", "accessory", "bag", "other"];
  const confidence = typeof parsed.confidenceScore === "number" && Number.isFinite(parsed.confidenceScore)
    ? Math.max(0, Math.min(1, parsed.confidenceScore))
    : 0.5;
  return {
    type: validTypes.includes(String(parsed.type)) ? String(parsed.type) : "other",
    color: typeof parsed.color === "string" && parsed.color.trim() ? parsed.color : "Unknown",
    material: typeof parsed.material === "string" ? parsed.material : undefined,
    style: typeof parsed.style === "string" ? parsed.style : undefined,
    season: Array.isArray(parsed.season) ? parsed.season.filter((item): item is string => typeof item === "string").slice(0, 12) : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags.filter((item): item is string => typeof item === "string").slice(0, 30) : [],
    suggestedName: typeof parsed.suggestedName === "string" && parsed.suggestedName.trim() ? parsed.suggestedName.slice(0, 120) : "Món đồ mới",
    confidenceScore: confidence,
    qualityWarnings: Array.isArray(parsed.qualityWarnings) ? parsed.qualityWarnings.filter((item): item is string => typeof item === "string").slice(0, 20) : [],
  };
}

async function invokeGemini(modelId: string, file: File): Promise<DetectionResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("AI provider is not configured.");
  const imageBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const { response, text: responseText } = await fetchTextWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: "Analyze this clothing item image. Return JSON with type (top|bottom|dress|outerwear|shoes|accessory|bag|other), color, material, style, season array, tags array, suggestedName in Vietnamese, confidenceScore between 0 and 1, and qualityWarnings array. No markdown." },
          { inlineData: { mimeType: file.type, data: imageBase64 } },
        ] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512, responseMimeType: "application/json" },
      }),
    },
  );
  if (!response.ok) throw new Error("AI provider request failed.");
  const json = (() => { try { return JSON.parse(responseText) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }; } catch { throw new Error("AI provider returned malformed response."); } })();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("AI provider returned no usable response.");
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error("AI provider returned malformed JSON."); }
  return parseDetection(parsed);
}

export async function POST(request: NextRequest) {
  return executeAiOperation(
    request,
    "clothing_detection",
    async () => readImageForm(request, ["image"]),
    async (auth, input) => {
      const result = isManusRuntime()
        ? { result: parseDetection({ type: "top", color: "Chưa xác định", material: "Chưa xác định", style: "Casual", season: [], tags: ["manus-development"], suggestedName: "Món đồ mới", confidenceScore: 0.5, qualityWarnings: ["Đang dùng AI development provider; cần provider thật trước production."] }), modelUsed: "manus-vision", fallbackUsed: false }
        : await callWithFallback(
          "clothing_detection",
          auth.plan,
          auth.userId,
          (modelId) => invokeGemini(modelId, input.file),
        );
      return {
        body: { ...result.result, modelUsed: result.modelUsed, fallbackUsed: result.fallbackUsed },
        modelUsed: result.modelUsed,
        provider: isManusRuntime() ? "manus-development" : "gemini",
        fallbackUsed: result.fallbackUsed,
      };
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
