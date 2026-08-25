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

const CANDIDATE_COUNTS = { free: 1, pro: 2, premium: 3 } as const;

type EnhancementResponse = {
  enhancedImageCandidates: Array<{ id: string; label: string; imageUrl: string; confidence: number }>;
  qualityWarnings: string[];
  analysis: Record<string, unknown>;
  processingAsync: boolean;
};

function parseEnhancement(value: unknown, candidateCount: number): EnhancementResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("AI provider returned an invalid response.");
  const parsed = value as Record<string, unknown>;
  const rawCandidates = Array.isArray(parsed.enhancedImageCandidates) ? parsed.enhancedImageCandidates : [];
  const candidates = rawCandidates
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)))
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id.slice(0, 100) : `candidate-${index + 1}`,
      label: typeof item.label === "string" ? item.label.slice(0, 120) : `Candidate ${index + 1}`,
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl.slice(0, 2000) : "",
      confidence: typeof item.confidence === "number" && Number.isFinite(item.confidence) ? Math.max(0, Math.min(1, item.confidence)) : 0.5,
    }))
    .filter((item) => item.imageUrl.length > 0)
    .slice(0, candidateCount);
  return {
    enhancedImageCandidates: candidates,
    qualityWarnings: Array.isArray(parsed.qualityWarnings) ? parsed.qualityWarnings.filter((item): item is string => typeof item === "string").slice(0, 20) : [],
    analysis: parsed.analysis && typeof parsed.analysis === "object" && !Array.isArray(parsed.analysis) ? parsed.analysis as Record<string, unknown> : {},
    processingAsync: Boolean(parsed.processingAsync),
  };
}

async function invokeGemini(modelId: string, file: File, candidateCount: number, useBatchApi: boolean): Promise<EnhancementResponse> {
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
          { text: `Analyze and enhance this clothing item image. Return JSON with enhancedImageCandidates: an array of ${candidateCount} objects each containing id, label, imageUrl, confidence; qualityWarnings; and analysis containing type, color, material, style, season, tags, suggestedName and confidenceScore. This repository's enhancement scaffold currently uses a placeholder image URL; do not claim that a real generated asset was produced. No markdown.` },
          { inlineData: { mimeType: file.type, data: imageBase64 } },
        ] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024, responseMimeType: "application/json" },
      }),
    },
  );
  if (!response.ok) throw new Error("AI provider request failed.");
  const json = (() => { try { return JSON.parse(responseText) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }; } catch { throw new Error("AI provider returned malformed response."); } })();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("AI provider returned no usable response.");
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error("AI provider returned malformed JSON."); }
  return { ...parseEnhancement(parsed, candidateCount), processingAsync: false && useBatchApi };
}

export async function POST(request: NextRequest) {
  return executeAiOperation(
    request,
    "clothing_enhance",
    async () => readImageForm(request, ["image"]),
    async (auth, input) => {
      const candidateCount = CANDIDATE_COUNTS[auth.plan];
      const result = isManusRuntime()
        ? { result: parseEnhancement({ enhancedImageCandidates: [], qualityWarnings: ["Đang dùng AI development provider; cải thiện ảnh thật sẽ được tích hợp sau Firebase/provider phase."], analysis: { type: "top", color: "Chưa xác định", suggestedName: "Món đồ mới", confidenceScore: 0.5 }, processingAsync: false }, 0), modelUsed: "manus-vision", fallbackUsed: false }
        : await callWithFallback(
          "clothing_enhance",
          auth.plan,
          auth.userId,
          (modelId, useBatchApi) => invokeGemini(modelId, input.file, candidateCount, useBatchApi),
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
