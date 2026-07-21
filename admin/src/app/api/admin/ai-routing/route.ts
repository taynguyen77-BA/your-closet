import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { authorize } from "@/lib/server/authorize";
import { corsHeaders } from "@/lib/server/resources";
import type { AiRoutingConfig } from "@/types/ai-routing";

export const runtime = "nodejs";

const COLLECTION = "admin_settings";
const DOC_ID = "ai_routing";

const DEFAULT_CONFIG: AiRoutingConfig = {
  id: DOC_ID,
  clothing_detection: {
    free: "gemini-2.5-flash",
    pro: "gemini-2.5-flash",
    premium: "gemini-2.5-flash",
    fallback: "gemini-2.5-flash-lite",
  },
  clothing_enhance: {
    free: "gemini-3.1-flash-lite-image",
    pro: "gemini-3.1-flash-image",
    premium: "gemini-3-pro-image",
    fallback: "gemini-3.1-flash-lite-image",
  },
  outfit_recommend: {
    free: "gemini-2.5-flash-lite",
    pro: "gemini-2.5-flash",
    premium: "gemini-2.5-pro",
    fallback: "gemini-2.5-flash-lite",
  },
  virtual_tryon: {
    free: "gemini-3.1-flash-lite-image",
    pro: "gemini-3.1-flash-image",
    premium: "gemini-3-pro-image",
    fallback: "gemini-3.1-flash-lite-image",
  },
  style_profile_analyze: {
    free: "gemini-2.5-flash-lite",
    pro: "gemini-2.5-flash",
    premium: "gemini-2.5-pro",
    fallback: "gemini-2.5-flash-lite",
  },
  updatedAt: new Date().toISOString(),
};

export async function GET(request: NextRequest) {
  try {
    await authorize(request, "settings.view");
    const doc = await adminDb.collection(COLLECTION).doc(DOC_ID).get();
    const config = doc.exists ? (doc.data() as AiRoutingConfig) : DEFAULT_CONFIG;
    return NextResponse.json({ data: config }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SERVER_ERROR";
    return NextResponse.json(
      { error: message },
      { status: message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await authorize(request, "settings.manage");
    const body = (await request.json()) as Partial<AiRoutingConfig>;
    const doc = await adminDb.collection(COLLECTION).doc(DOC_ID).get();
    const current = doc.exists ? (doc.data() as AiRoutingConfig) : DEFAULT_CONFIG;
    const updated: AiRoutingConfig = {
      ...current,
      ...body,
      id: DOC_ID,
      updatedAt: new Date().toISOString(),
    };
    await adminDb.collection(COLLECTION).doc(DOC_ID).set(updated);
    return NextResponse.json({ data: updated }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SERVER_ERROR";
    return NextResponse.json(
      { error: message },
      { status: message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
