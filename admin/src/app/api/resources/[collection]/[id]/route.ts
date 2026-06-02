import { NextRequest } from "next/server";
import { remove, update } from "@/lib/server/resources";
export const runtime = "nodejs";
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ collection: string; id: string }> }) { const { collection, id } = await params; return update(request, collection, id); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ collection: string; id: string }> }) { const { collection, id } = await params; return remove(request, collection, id); }
