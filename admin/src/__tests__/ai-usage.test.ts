import { AiUsageError, finalizeAiUsage, reserveAiUsage } from "@/lib/server/ai-usage";

const state = new Map<string, Record<string, unknown>>();
let transactionChain = Promise.resolve();

function ref(collection: string, id: string) {
  return { path: `${collection}/${id}`, collection, id };
}

function resetState() {
  state.clear();
  const period = new Date().toISOString().slice(0, 7);
  state.set("users/user-1", {
    id: "user-1",
    plan: "free",
    aiUsageMonthlyLimit: 1,
    aiUsageRemaining: 1,
    aiQuotaPeriod: period,
    status: "active",
  });
  transactionChain = Promise.resolve();
}

jest.mock("@/lib/server/firebase-admin", () => ({
  adminDb: {
    collection: jest.fn((collection: string) => ({
      doc: jest.fn((id: string) => ref(collection, id)),
    })),
    runTransaction: jest.fn((callback: (tx: unknown) => Promise<void>) => {
      const run = transactionChain.then(async () => {
        const writes: Array<{ kind: "create" | "update" | "set"; target: ReturnType<typeof ref>; data: Record<string, unknown> }> = [];
        const tx = {
          get: async (target: ReturnType<typeof ref>) => {
            const data = state.get(target.path);
            return { exists: Boolean(data), data: () => data };
          },
          create: (target: ReturnType<typeof ref>, data: Record<string, unknown>) => writes.push({ kind: "create", target, data }),
          update: (target: ReturnType<typeof ref>, data: Record<string, unknown>) => writes.push({ kind: "update", target, data }),
          set: (target: ReturnType<typeof ref>, data: Record<string, unknown>) => writes.push({ kind: "set", target, data }),
        };
        await callback(tx);
        for (const write of writes) {
          const previous = state.get(write.target.path) ?? {};
          if (write.kind === "create" && state.has(write.target.path)) throw new Error("ALREADY_EXISTS");
          state.set(write.target.path, write.kind === "create" ? { ...write.data } : { ...previous, ...write.data });
        }
      });
      transactionChain = run.catch(() => undefined);
      return run;
    }),
  },
}));

beforeEach(() => resetState());

describe("server-authoritative AI usage ledger", () => {
  test("reserves atomically and commits one quota unit", async () => {
    const reservation = await reserveAiUsage({ userId: "user-1", operation: "outfit_recommend", idempotencyKey: "req-1", requestId: "trace-1" });
    expect(reservation.status).toBe("RESERVED");
    expect(state.get("users/user-1")?.aiUsageRemaining).toBe(0);

    const finalized = await finalizeAiUsage({ reservation, provider: "stub", modelUsed: "stub-model", fallbackUsed: false, resultStatus: "success", responseBody: { ok: true } });
    expect(finalized.status).toBe("COMMITTED");
    expect(state.get("ai_usage/" + reservation.usageId)?.status).toBe("COMMITTED");
    expect(state.get("ai_logs/" + reservation.usageId)?.cost).toBe("NOT_OBSERVABLE");
  });

  test("provider failure releases the reservation and restores quota", async () => {
    const reservation = await reserveAiUsage({ userId: "user-1", operation: "virtual_tryon", idempotencyKey: "req-fail", requestId: "trace-fail" });
    await finalizeAiUsage({ reservation, provider: "stub", modelUsed: "stub-model", fallbackUsed: false, resultStatus: "failure", errorCode: "AI_PROVIDER_FAILED", responseBody: { code: "AI_PROVIDER_FAILED" } });
    expect(state.get("users/user-1")?.aiUsageRemaining).toBe(1);
    expect(state.get("ai_usage/" + reservation.usageId)?.status).toBe("RELEASED");
    expect(state.get("ai_logs/" + reservation.usageId)?.resultStatus).toBe("failure");
  });

  test("fallback result is released under the existing no-charge contract", async () => {
    const reservation = await reserveAiUsage({ userId: "user-1", operation: "clothing_detection", idempotencyKey: "req-fallback", requestId: "trace-fallback" });
    const finalized = await finalizeAiUsage({ reservation, provider: "stub", modelUsed: "fallback-model", fallbackUsed: true, resultStatus: "fallback", responseBody: { fallbackUsed: true } });
    expect(finalized.status).toBe("RELEASED");
    expect(state.get("users/user-1")?.aiUsageRemaining).toBe(1);
  });

  test("the same idempotency key cannot reserve twice while the first request is active", async () => {
    const first = await reserveAiUsage({ userId: "user-1", operation: "outfit_recommend", idempotencyKey: "same", requestId: "trace-a" });
    await expect(reserveAiUsage({ userId: "user-1", operation: "outfit_recommend", idempotencyKey: "same", requestId: "trace-b" })).rejects.toMatchObject({ code: "AI_REQUEST_IN_PROGRESS" });
    await finalizeAiUsage({ reservation: first, provider: "stub", modelUsed: "stub-model", fallbackUsed: false, resultStatus: "success", responseBody: { answer: 42 } });
    const replay = await reserveAiUsage({ userId: "user-1", operation: "outfit_recommend", idempotencyKey: "same", requestId: "trace-c" });
    expect(replay.isReplay).toBe(true);
    expect(replay.status).toBe("COMMITTED");
    expect(replay.responseBody).toEqual({ answer: 42 });
  });

  test("two concurrent requests cannot overspend one remaining credit", async () => {
    const results = await Promise.allSettled([
      reserveAiUsage({ userId: "user-1", operation: "outfit_recommend", idempotencyKey: "concurrent-a", requestId: "trace-a" }),
      reserveAiUsage({ userId: "user-1", operation: "outfit_recommend", idempotencyKey: "concurrent-b", requestId: "trace-b" }),
    ]);
    expect(results.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((item) => item.status === "rejected" && item.reason instanceof AiUsageError && item.reason.code === "QUOTA_EXCEEDED")).toHaveLength(1);
    expect(state.get("users/user-1")?.aiUsageRemaining).toBe(0);
  });
});
