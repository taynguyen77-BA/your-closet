# Pipeline Audit Report — Package 1 + Package 2

**Date:** 2026-07-16
**Auditor:** pipeline-audit-bridge
**Repo:** your-closet · branch `codex/community-genz-refresh`
**Commit at audit:** `5ca0ec7` — `test(p04): retired migration script sanity test — closes GAP-03`
**Scope:** Package 1 (P-01→P-06, BRD 3.1.x / 3.16.x) + Package 2 (P-07→P-14, BRD 3.2.x, 1.3.4, 1.3.6, §9)
**Business source:** `docs/02_brd_v2_3.md` (540 lines), `docs/04_user_stories_v2_1.md` (1577), `docs/05_acceptance_criteria_v2_1.md` (201), `docs/11_solution_architecture.md` (522), `docs/13_api_spec.md` (171) — all committed `6d3292d`, all non-trivial. `PROJECT_STATE.json` — **absent**; requirement→story traceability is file-derived, not state-derived.

> Supersedes the 2026-07-14 report entirely. That report audited commit `5a591ee`; the repo is now **16 commits ahead of `origin`**. Every verdict below was re-derived from the current tree — no content carried forward.

---

## Executive Summary

**Overall Pipeline Health: NEEDS ATTENTION**
**Readiness for Delivery: Partially Ready**

**Top 3 findings:**

1. **✅ All 123 automated tests pass — executed for real on 2026-07-16.** Playwright 39/39 (`npx playwright test`, 42.0s, both projects), admin jest 25/25, Firestore rules 46/46, p04-migration 8/8, retired-script-sanity 5/5.
2. **❌ NEW GAP — AC 45.4 not implemented (Package 2).** `callWithFallback` computes `fallbackUsed` (`admin/src/lib/server/ai-resolver.ts:92-113`), but both AI routes return only `result.result` (`detect/route.ts:94`, `analyze-and-enhance/route.ts:103`) — discarding it. The client therefore never learns a fallback occurred: `aiService.ts:27` returns `quotaChargeEligible: true` on every success path, so quota **is** deducted and the user is **not** warned the result may be lower quality. Both clauses of AC 45.4 fail.
3. **⚠️ CI pipeline exists but has never executed.** `.github/workflows/ci.yml` + `deploy.yml` are tracked (`5cfb014`), yet `gh api repos/taynguyen77-BA/your-closet/actions/workflows` → `{"total_count":0,"workflows":[]}`. The branch is unpushed, so zero runs exist. A workflow file is not a working pipeline.

---

## Pipeline Completion Matrix

| Stage | Status | Evidence | Notes |
|---|---|---|---|
| Requirements | ✅ | 5 business docs, all non-trivial, committed `6d3292d` | `PROJECT_STATE.json` absent — flagged, not silently ignored |
| Architecture | ⚠️ | 2/5 spec'd AI endpoints implemented; 1 undocumented endpoint found | See GAP-D |
| Implementation | ⚠️ | P1 OTP cooldown ✅ (`otp.tsx`, `d6503c9`); P2 P-07→P-14 ✅ | AC 45.4 gap — see GAP-A |
| Testing | ✅ | 123/123 pass, executed 2026-07-16 | Layer boundary documented (GAP-E) |
| CI/CD | ⚠️ | `ci.yml`, `deploy.yml` tracked (`5cfb014`); `actions/workflows` → `total_count: 0` | Files exist, never ran — GAP-B |
| Deploy | ❌ | `git tag` → empty; `gh release list` → empty | GAP-C |

### Test evidence (real runs, 2026-07-16, commit `5ca0ec7`)

| Suite | Command | Result |
|---|---|---|
| Playwright (auth-flow + demo-auth) | `npx playwright test` | **39 passed (42.0s)** |
| Admin unit — AI resolver P-07/P-14 | `cd admin && npm test` | **25 passed** |
| Firestore rules P-08/P-09 | `cd tests/rules && npm test` | **46 passed** |
| P-04 migration | `cd tests/p04-migration && npm test` | **8 passed** |
| Retired-script sanity | `node --test tests/retired-script-sanity.test.js` | **5 passed** |
| **TOTAL** | | **123 passed · 0 failed** |

---

## Gap Analysis

### ❌ GAP-A (NEW, Package 2): AC 45.4 — fallback neither surfaced nor quota-exempt

**AC text:** "If the tier-appropriate model call fails, system falls back to the next-lower-cost available model for that feature, **notifies the user the result may be lower quality**, and **does not deduct the user's quota** for that call."

**Evidence:**
- `admin/src/lib/server/ai-resolver.ts:92-113` — `callWithFallback` correctly returns `{ result, modelUsed, fallbackUsed }`.
- `admin/src/app/api/ai/clothing/detect/route.ts:94` — `return NextResponse.json(result.result, ...)` → `fallbackUsed`/`modelUsed` discarded.
- `admin/src/app/api/ai/clothing/analyze-and-enhance/route.ts:103` — same discard.
- `mobile/src/services/ai/aiService.ts:27` — success path returns `quotaChargeEligible: true` unconditionally; `closet.tsx` then calls `consumeAiTry()`.
- The only `fallbackMessage` path (`aiService.ts:33`) fires **only** in the demo-mode catch branch — it does not cover a real server-side fallback.

**Impact:** A production fallback is invisible to the user and still charged. The routing/fallback mechanism itself is correct and unit-tested (25/25) — the defect is in the **response contract**, not the resolver.

**Next action:** Return `{ ...result.result, modelUsed, fallbackUsed }` from both AI routes; thread `fallbackUsed` into `AiResult` so `quotaChargeEligible = !fallbackUsed`, and surface a lower-quality notice. Then `e2e-test-bridge` for an AC 45.4 test.

---

### ⚠️ GAP-B: CI pipeline has never executed

**Evidence:** `gh api repos/taynguyen77-BA/your-closet/actions/workflows` → `{"total_count":0,"workflows":[]}`; `gh run list --limit 5` → empty. `gh auth status` confirms authentication as `taynguyen77-BA` against remote `https://github.com/taynguyen77-BA/your-closet.git`, so the empty result is real, not an auth artifact. Branch is 16 commits ahead of `origin`, unpushed.

**Next action:** Push the branch (explicit human decision — outside this skill's boundary), then confirm the first run passes. Until a run exists, the CI Gate cannot pass.

---

### ⚠️ GAP-C: Deploy unverified

**Evidence:** `git tag --sort=-creatordate` → empty. `gh release list --limit 5` → empty. No deployment exists to correlate against.

**Next action:** After GAP-B, tag a release and confirm Firebase Hosting deploy (`firebase.json` hosting block committed `5cfb014`, `public: mobile/dist`).

---

### ⚠️ GAP-D: `/api/admin/ai-routing` implemented but undocumented

**Evidence:** Route exists (`admin/src/app/api/admin/ai-routing/route.ts`, P-08, commit `c1b5f26`); `grep -c "admin/ai-routing" docs/13_api_spec.md` → **0**. Reverse gap: a real endpoint absent from the API spec, despite AC 45.5 requiring admin-editable routing config.

**Next action:** Add the endpoint to `13_api_spec.md` (business-doc change → Forge OS side), or confirm it is intentionally admin-internal and out of the public spec's scope.

---

### ⚠️ GAP-E: Package 2 AI flows not covered at e2e layer

**Evidence:** `mobile/e2e/p07-closet-pkg2.spec.ts` covers 8 Closet flows. Not covered: image-pick → `clothing_detection` → review draft → enhance → candidate pick, and bulk-upload ≤5 enforcement — all gated behind native `expo-image-picker`, not drivable in RN-web Playwright. API routes `/api/ai/clothing/*` and `/api/admin/ai-routing` require a live Next.js server + Firebase token + `GOOGLE_AI_API_KEY`.

**Assessment:** Covered at the correct layer instead — 25 admin unit tests assert per-tier resolution, fallback, Batch-vs-Standard routing, and `ai_logs` writes. This is a **documented layer boundary**, not an untested behavior. Not a shipping blocker.

---

### Spec'd-but-unimplemented endpoints (not a P1/P2 gap)

`13_api_spec.md` specifies 5 AI endpoints; 2 implemented (`/api/ai/clothing/detect`, `/api/ai/clothing/analyze-and-enhance`). Unimplemented: `/api/ai/outfit/recommend`, `/api/ai/tryon/generate`, `/api/ai/style-profile/analyze` — all **Package 3+ scope**, correctly out of scope here. A catch-all proxy `/api/ai/[...path]` exists for upstream forwarding.

---

## Gaps closed since the 2026-07-14 report

| Old gap | Status now | Evidence |
|---|---|---|
| GAP-01 OTP retry + 60s cooldown "not implemented" | **CLOSED** | `d6503c9` — `otp.tsx:11-12,21` `MAX_ATTEMPTS=3`, `COOLDOWN_SECONDS=60`, `cooldownRemaining` state (+84 lines); `authStore.ts` `verifyOtp` no longer sets `isAuthLoading` (it was unmounting the screen and breaking the counter); `p01-otp-cooldown.spec.ts` (99 lines) passing, traceability `AC: 42, 42.1, 42.2` |
| GAP-02 "No CI/CD pipeline" | **PARTIAL** | Files now exist + tracked (`5cfb014`), but 0 runs — reopened as GAP-B |
| GAP-03 P-04 retired sanity test missing | **CLOSED** | `tests/retired-script-sanity.test.js` (87 lines) — 5/5 pass; `tests/p04-migration/migrate-tier-enum.test.ts` (342 lines) — 8/8 pass (`5ca0ec7`) |
| GAP-04 Deploy status unverified | **STILL OPEN** | Carried forward as GAP-C |

---

## Requirements Cross-Reference (re-verified 2026-07-16, not carried over)

| Requirement | Status | Fresh evidence |
|---|---|---|
| BRD 3.1.1.3 — OTP 3 retries + 60s cooldown | ✅ | `otp.tsx:11-12,21,25` — `MAX_ATTEMPTS=3`, `COOLDOWN_SECONDS=60`, `cooldownRemaining` timer |
| BRD 3.1.2 — duplicate account prevention | ✅ | `admin/src/app/api/auth/session/verify/route.ts:94` — `adminDb.runTransaction(...)` |
| BRD 3.1.6 — logout preserves `onboardingCompleted` | ✅ | `authStore.ts` `logout()` — grep for `onboardingCompleted` inside logout → **0 hits** (not reset) |
| BRD 3.4.1 / AC 44 — tiers `free\|pro\|premium`, no `elite` | ✅ | `grep -rn "'elite'\|\"elite\"" mobile/src admin/src` → **0 hits** — AC 44.1 migration complete |
| BRD 3.16.1 — guest public browsing | ✅ | `mobile/app/_layout.tsx` — `publicGuestRoutes` (2 refs) incl. `(tabs)/closet` |
| BRD 3.2.x / §9 — AI routing model IDs | ✅ | `admin/src/app/api/admin/ai-routing/route.ts:12-44` matches BRD v2.3 §9; `clothing_enhance` Batch, `virtual_tryon` Standard, `clothing_detection` non-`-image` |
| AC 45.4 — fallback notice + quota exemption | ❌ | **GAP-A** |

---

## Cross-Module Consistency

| Check | Result | Evidence |
|---|---|---|
| AC 41 (3 auth providers, no email/password) | ✅ | `p01-auth-providers.spec.ts` — "Exactly 3 sign-in options shown; no email/password route accessible", passing |
| AC 42 / 42.1 / 42.2 (OTP retry + cooldown) | ✅ | `p01-otp-cooldown.spec.ts`, passing |
| AC 44 (tiers, no `elite`) | ✅ | 0 `elite` hits in `mobile/src` + `admin/src` |
| AC 45.1–45.3, 45.5–45.7 (routing per tier, Batch, `ai_logs`) | ✅ | 25/25 admin unit tests |
| AC 45.4 (fallback notice + no quota deduction) | ❌ | **GAP-A** |
| API spec ↔ real routes | ⚠️ | 2/5 implemented (rest = Pkg 3+); 1 undocumented (**GAP-D**) |
| Deployed commit vs branch head | ⚠️ Unverifiable | No deploy exists to compare against |
| BRD goals ↔ tracked KPIs | ⚠️ Unverifiable | `monitoring-bridge` has not run; no `27_product_intelligence_report.md` |

---

## Delivery Readiness Gates

| Gate | Status | Evidence |
|---|---|---|
| Requirements Gate | **pass** | 5 business docs, all non-trivial, committed `6d3292d` |
| Implementation Gate | **fail** | AC 45.4 unimplemented (GAP-A) |
| Test Gate | **pass** | 123/123 pass, run 2026-07-16 |
| CI Gate | **fail** | `total_count: 0` — workflows never executed (GAP-B) |
| Deploy Gate | **fail** | No tags, no releases (GAP-C) |

---

## Recommended Action Plan

**Priority 1 (blocks shipping):**
1. Fix **GAP-A** — surface `fallbackUsed`/`modelUsed` from both AI routes; set `quotaChargeEligible = !fallbackUsed`; add the lower-quality notice. Then run `e2e-test-bridge` for an AC 45.4 test.
2. Close **GAP-B** — push the branch (human decision), confirm the first CI run passes.

**Priority 2:**
3. Close **GAP-C** — tag release, verify Firebase Hosting deploy.
4. Close **GAP-D** — document `/api/admin/ai-routing` in `13_api_spec.md`, or confirm intentional omission.

**Priority 3 (not blocking):**
5. **GAP-E** stays a documented layer boundary. Revisit only if native-driver e2e (Detox/Maestro) enters scope.

---

## Audit boundary

This skill audits and reports only — nothing was fixed, rerun to force a pass, pushed, or deployed. All results above come from real command executions on 2026-07-16 against commit `5ca0ec7`.
