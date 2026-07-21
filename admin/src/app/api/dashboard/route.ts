import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/server/authorize";
import { adminDb } from "@/lib/server/firebase-admin";
import { aiLogs, dashboardKpis } from "@/data/mock";
export const runtime = "nodejs";
const today = () => new Date().toISOString().slice(0, 10);
export async function GET(request: NextRequest) {
  try {
    await authorize(request, "dashboard.view");
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      return NextResponse.json({ kpis: dashboardKpis, aiLogs, generatedAt: new Date().toISOString() });
    }
    const [users, transactions, logs, listings] = await Promise.all(["users", "transactions", "ai_logs", "listings"].map((name) => adminDb.collection(name).limit(1000).get()));
    const userRows = users.docs.map((d) => d.data()), txRows = transactions.docs.map((d) => d.data()), logRows = logs.docs.map((d) => d.data());
    const completed = txRows.filter((row) => row.status === "completed");
    return NextResponse.json({ kpis: {
      totalUsers: users.size, activeUsers: userRows.filter((row) => row.status === "active").length,
      premiumUsers: userRows.filter((row) => row.plan !== "free").length,
      dailyAiUsage: logRows.filter((row) => String(row.createdAt ?? "").startsWith(today())).length,
      communityTransactions: transactions.size, revenueVnd: completed.reduce((n, row) => n + Number(row.amount ?? 0), 0),
      commissionVnd: completed.reduce((n, row) => n + Number(row.platformFee ?? 0), 0),
      outfitGenerations: logRows.filter((row) => row.type === "outfit").length,
      trendingOutfit: `${listings.size} community listings`, mostActiveUser: userRows.sort((a, b) => Number(b.wardrobeCount ?? 0) - Number(a.wardrobeCount ?? 0))[0]?.username ?? "—",
    }, aiLogs: logRows, generatedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SERVER_ERROR";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500 });
  }
}
