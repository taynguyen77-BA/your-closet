import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";

type DependencyStatus = {
  status: "ok" | "missing_config" | "error";
  message?: string;
};

const ok = (): DependencyStatus => ({ status: "ok" });
const missing = (message: string): DependencyStatus => ({ status: "missing_config", message });
const failed = (error: unknown): DependencyStatus => ({
  status: "error",
  message: error instanceof Error ? error.message : "Unknown error",
});

async function checkDatabase(): Promise<DependencyStatus> {
  try {
    await adminDb.collection("_health").limit(1).get();
    return ok();
  } catch (error) {
    return failed(error);
  }
}

async function checkStorage(): Promise<DependencyStatus> {
  if (!process.env.FIREBASE_STORAGE_BUCKET) return missing("FIREBASE_STORAGE_BUCKET is not set.");
  try {
    await adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET).exists();
    return ok();
  } catch (error) {
    return failed(error);
  }
}

async function checkAi(): Promise<DependencyStatus> {
  if (!process.env.AI_API_BASE_URL && !process.env.GEMINI_API_KEY && !process.env.VERTEX_AI_PROJECT_ID) {
    return missing("Set AI_API_BASE_URL, GEMINI_API_KEY, or VERTEX_AI_PROJECT_ID.");
  }
  return ok();
}

export async function GET() {
  const [database, storage, ai] = await Promise.all([checkDatabase(), checkStorage(), checkAi()]);
  const dependencies = {
    auth: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? ok() : missing("NEXT_PUBLIC_FIREBASE_API_KEY is not set."),
    database,
    storage,
    ai,
  };
  const healthy = Object.values(dependencies).every((dependency) => dependency.status === "ok");

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      environment: process.env.APP_ENV ?? process.env.NEXT_PUBLIC_APP_ENV ?? "local",
      demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
      timestamp: new Date().toISOString(),
      dependencies,
    },
    { status: 200 }
  );
}
