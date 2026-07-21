import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";
import { callWithFallback } from "@/lib/server/ai-resolver";
import { corsHeaders } from "@/lib/server/resources";
import type { AiTier } from "@/lib/server/ai-resolver";

export const runtime = "nodejs";

// Candidate counts per tier — BRD Section 9 / P-12 requirements
const CANDIDATE_COUNTS: Record<AiTier, number> = { free: 1, pro: 2, premium: 3 };

/**
 * POST /api/ai/clothing/analyze-and-enhance
 * Accepts multipart/form-data with 'image' field.
 * Routes through callWithFallback('clothing_enhance', tier) — Batch API path per BRD 1.3.6.
 * Enhancement is user-triggered (not automatic on every upload) — BRD 3.2.3.
 * Candidate count is tier-based. Does NOT block item save (async / processing-state).
 * BRD 3.2.3
 */
export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: corsHeaders });

  let userId: string;
  let tier: AiTier = "free";
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    userId = decoded.uid;
    const userSnap = await adminDb.collection("users").doc(userId).get();
    const plan = userSnap.exists ? (userSnap.data()?.plan as AiTier | undefined) : undefined;
    tier = plan === "pro" || plan === "premium" ? plan : "free";
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: corsHeaders });
  }

  let imageBase64: string;
  let mimeType = "image/jpeg";
  try {
    const form = await request.formData();
    const file = form.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "Missing 'image' field" }, { status: 400, headers: corsHeaders });
    mimeType = file.type || "image/jpeg";
    const buffer = await file.arrayBuffer();
    imageBase64 = Buffer.from(buffer).toString("base64");
  } catch {
    return NextResponse.json({ error: "Failed to read image" }, { status: 400, headers: corsHeaders });
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const candidateCount = CANDIDATE_COUNTS[tier];

  try {
    const result = await callWithFallback(
      "clothing_enhance",
      tier,
      userId,
      async (modelId, useBatchApi) => {
        // useBatchApi=true for clothing_enhance — confirmed via resolver. Batch API means async
        // processing. In this scaffold: we call the generative API synchronously but signal
        // the async-processing state to the client via the response shape.
        if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not configured");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
        const payload = {
          contents: [
            {
              parts: [
                {
                  text: `Analyze and enhance this clothing item image. Return JSON with:
- enhancedImageCandidates: array of ${candidateCount} objects, each with { id: string, label: string, imageUrl: string (placeholder URL), confidence: number 0-1 }
- qualityWarnings: array of strings describing any image quality issues
- analysis: { type, color, material, style, season (array), tags (array), suggestedName, confidenceScore }
Use placeholder image URL: 'https://placehold.co/400x500?text=Enhanced'. No markdown, only valid JSON.`,
                },
                { inlineData: { mimeType, data: imageBase64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024, responseMimeType: "application/json" },
        };
        // useBatchApi signals Batch path; in production this would submit to Gemini Batch API
        // and return a job ID. For this scaffold, we call standard endpoint and mark as async.
        void useBatchApi; // used: confirms routing decision, logged in ai_logs
        const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
        const json = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Empty response from Gemini");
        const parsed = JSON.parse(text) as {
          enhancedImageCandidates?: Array<{ id: string; label: string; imageUrl: string; confidence: number }>;
          qualityWarnings?: string[];
          analysis?: Record<string, unknown>;
        };
        // Enforce tier-based candidate count
        const candidates = (parsed.enhancedImageCandidates ?? []).slice(0, candidateCount);
        return {
          enhancedImageCandidates: candidates,
          qualityWarnings: Array.isArray(parsed.qualityWarnings) ? parsed.qualityWarnings : [],
          analysis: parsed.analysis ?? {},
          processingAsync: false, // would be true in real Batch API path
        };
      }
    );
    // AC 45.4 / BRD 3.4.6.3 / §9 fallback rule — the client must be able to see that a
    // fallback served this result, so it can warn the user and skip the quota charge.
    return NextResponse.json(
      { ...result.result, modelUsed: result.modelUsed, fallbackUsed: result.fallbackUsed },
      { headers: corsHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enhancement failed";
    return NextResponse.json({ error: message }, { status: 503, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
