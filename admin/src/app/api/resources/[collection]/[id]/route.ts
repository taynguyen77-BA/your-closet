import { NextRequest } from "next/server";
import { corsHeaders, get, remove, update } from "@/lib/server/resources";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ collection: string; id: string }> }) { const { collection, id } = await params; return get(request, collection, id); }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ collection: string; id: string }> }) { const { collection, id } = await params; return update(request, collection, id); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ collection: string; id: string }> }) { const { collection, id } = await params; return remove(request, collection, id); }
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }
