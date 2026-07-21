import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/server/resources";

export const runtime = "nodejs";

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const upstream = process.env.AI_API_BASE_URL?.replace(/\/$/, "");
  if (!upstream) {
    return NextResponse.json(
      { error: "AI service is not configured. Set AI_API_BASE_URL for staging/production." },
      { status: 503, headers: corsHeaders }
    );
  }

  const path = (await params).path.join("/");
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("multipart/form-data") ? await request.formData() : await request.text();
  const response = await fetch(`${upstream}/${path}`, {
    method: request.method,
    headers: {
      ...(contentType.includes("multipart/form-data") ? {} : { "Content-Type": contentType || "application/json" }),
      ...(request.headers.get("authorization") ? { Authorization: request.headers.get("authorization")! } : {}),
      ...(process.env.AI_API_KEY ? { "x-api-key": process.env.AI_API_KEY } : {}),
    },
    body,
  });
  const responseBody = await response.text();
  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      ...corsHeaders,
      "Content-Type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
