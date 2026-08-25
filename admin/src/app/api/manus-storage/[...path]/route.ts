import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/server/authorize";
import { readManusImage, verifyManusStorageToken } from "@/lib/server/manus-storage";
import { corsHeaders } from "@/lib/server/resources";
import { isManusRuntime } from "@/lib/server/runtime";

export const runtime = "nodejs";

function contentType(path: string) {
  return path.endsWith(".png") ? "image/png" : path.endsWith(".webp") ? "image/webp" : "image/jpeg";
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!isManusRuntime()) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers: corsHeaders });
  const identity = await authenticate(request);
  const { path: parts } = await context.params;
  const path = parts.join("/");
  const owner = path.match(/^users\/([^/]+)\/clothes\//)?.[1];
  if (!identity || !owner || identity.uid !== owner || !verifyManusStorageToken(path, request.nextUrl.searchParams.get("token"))) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403, headers: corsHeaders });
  }
  try {
    const buffer = await readManusImage(identity.uid, path);
    return new NextResponse(buffer as unknown as BodyInit, { status: 200, headers: { ...corsHeaders, "Content-Type": contentType(path), "Cache-Control": "private, max-age=60" } });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers: corsHeaders });
  }
}
