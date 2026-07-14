import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";
import { callWithFallback } from "@/lib/server/ai-resolver";
import { corsHeaders } from "@/lib/server/resources";
import type { AiTier } from "@/lib/server/ai-resolver";

export const runtime = "nodejs";

/**
 * POST /api/ai/clothing/detect
 * Accepts multipart/form-data with 'image' field.
 * Routes through resolveModel('clothing_detection', tier) — never hardcoded.
 * BRD 3.2.2, 3.2.2.2
 */
export async function POST(request: NextRequest) {
  // Verify Firebase user token (not admin — regular user endpoint)
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: corsHeaders });

  let userId: string;
  let tier: AiTier = "free";
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    userId = decoded.uid;
    // Read user's membership tier from Firestore
    const userSnap = await adminDb.collection("users").doc(userId).get();
    const plan = userSnap.exists ? (userSnap.data()?.plan as AiTier | undefined) : undefined;
    tier = plan === "pro" || plan === "premium" ? plan : "free";
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: corsHeaders });
  }

  // Parse image from multipart form
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

  try {
    const result = await callWithFallback(
      "clothing_detection",
      tier,
      userId,
      async (modelId) => {
        if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not configured");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
        const payload = {
          contents: [
            {
              parts: [
                {
                  text: `Analyze this clothing item image. Return JSON with: type (one of: top|bottom|dress|outerwear|shoes|accessory|bag|other), color (string), material (string or null), style (string or null), season (array of strings), tags (array of strings), suggestedName (Vietnamese string), confidenceScore (0-1 float), qualityWarnings (array of strings). No markdown, only valid JSON.`,
                },
                { inlineData: { mimeType, data: imageBase64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512, responseMimeType: "application/json" },
        };
        const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
        const json = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Empty response from Gemini");
        const parsed = JSON.parse(text) as {
          type?: string; color?: string; material?: string; style?: string;
          season?: string[]; tags?: string[]; suggestedName?: string;
          confidenceScore?: number; qualityWarnings?: string[];
        };
        const validTypes = ["top","bottom","dress","outerwear","shoes","accessory","bag","other"];
        return {
          type: validTypes.includes(parsed.type ?? "") ? parsed.type! : "other",
          color: parsed.color ?? "Unknown",
          material: parsed.material ?? undefined,
          style: parsed.style ?? undefined,
          season: Array.isArray(parsed.season) ? parsed.season : [],
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          suggestedName: parsed.suggestedName ?? "Món đồ mới",
          confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 0.5,
          qualityWarnings: Array.isArray(parsed.qualityWarnings) ? parsed.qualityWarnings : [],
        };
      }
    );
    return NextResponse.json(result.result, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Detection failed";
    return NextResponse.json({ error: message }, { status: 503, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
