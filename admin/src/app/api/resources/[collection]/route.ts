import { NextRequest } from "next/server";
import { corsHeaders, create, list } from "@/lib/server/resources";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) { return list(request, (await params).collection); }
export async function POST(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) { return create(request, (await params).collection); }
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }
