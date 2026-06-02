import { NextRequest } from "next/server";
import { create, list } from "@/lib/server/resources";
export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) { return list(request, (await params).collection); }
export async function POST(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) { return create(request, (await params).collection); }
