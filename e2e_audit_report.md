# Pipeline Audit Report — Package 1 + Package 2

**Date:** 2026-07-16
**Auditor:** pipeline-audit-bridge
**Repo:** your-closet · branch `codex/community-genz-refresh`
**Commit at audit:** `114bb38` — `fix(ai): surface fallbackUsed through API response, skip quota charge on fallback — closes GAP-A (AC 45.4)`
**Previous revision of this report:** `c867f45` (audited `5ca0ec7`, before GAP-A was fixed)
**Scope:** Package 1 (P-01→P-06, BRD 3.1.x / 3.16.x) + Package 2 (P-07→P-14, BRD 3.2.x, 1.3.4, 1.3.6, §9)
**Business source:** `docs/02_brd_v2_3.md` (540 lines), `docs/04_user_stories_v2_1.md` (1577), `docs/05_acceptance_criteria_v2_1.md` (201), `docs/11_solution_architecture.md` (522), `docs/13_api_spec.md` (171) — all committed `6d3292d`, all non-trivial. `PROJECT_STATE.json` — **absent**; requirement→story traceability is file-derived, not state-derived.

> Supersedes the 2026-07-14 report entirely. That report audited commit `5a591ee`; the repo is now **16 commits ahead of `origin`**. Every verdict below was re-derived from the current tree — no content carried forward.

---

## Executive Summary

**Overall Pipeline Health: NEEDS ATTENTION**
**Readiness for Delivery: Partially Ready**

**Top 3 findings:**

1. **✅ All 131 automated tests pass — executed for real on 2026-07-16.** Playwright 39/39 (`npx playwright test`, 42.8s, both projects), admin jest 29/29, mobile jest 4/4, Firestore rules 46/46, p04-migration 8/8, retired-script-sanity 5/5.
2. **✅ GAP-A CLOSED — AC 45.4 now implemented (Package 2), commit `114bb38`.** Both AI routes now return `{ ...result.result, modelUsed, fallbackUsed }`; `aiService.ts:37` sets `quotaChargeEligible: !fallbackUsed`, so a fallback-served result no longer charges quota; `FALLBACK_QUALITY_NOTICE` is shown in the AI Review Draft for both the detect and enhance flows. Backed by **8 new tests** — including 4 at the **API-route layer** (`admin/src/__tests__/ai-routes-fallback.test.ts`), the layer where the defect actually lived. Those 4 were verified to fail against the pre-fix routes with `Expected: true, Received: undefined`; the 25 resolver tests could not detect it.
3. **⚠️ CI pipeline exists but has never executed.** `.github/workflows/ci.yml` + `deploy.yml` are tracked (`5cfb014`), yet `gh api repos/taynguyen77-BA/your-closet/actions/workflows` → `{"total_count":0,"workflows":[]}`. The branch is unpushed, so zero runs exist. A workflow file is not a working pipeline.

---

## Pipeline Completion Matrix

| Stage | Status | Evidence | Notes |
|---|---|---|---|
| Requirements | ✅ | 5 business docs, all non-trivial, committed `6d3292d` | `PROJECT_STATE.json` absent — flagged, not silently ignored |
| Architecture | ⚠️ | 2/5 spec'd AI endpoints implemented; 1 undocumented endpoint found | See GAP-D |
| Implementation | ✅ | P1 OTP cooldown ✅ (`otp.tsx`, `d6503c9`); P2 P-07→P-14 ✅; AC 45.4 ✅ (`114bb38`) | GAP-A closed |
| Testing | ✅ | 131/131 pass, executed 2026-07-16 | Layer boundary documented (GAP-E) |
| CI/CD | ⚠️ | `ci.yml`, `deploy.yml` tracked (`5cfb014`); `actions/workflows` → `total_count: 0` | Files exist, never ran — GAP-B |
| Deploy | ❌ | `git tag` → empty; `gh release list` → empty | GAP-C |

### Test evidence (real runs, 2026-07-16, commit `5ca0ec7`)

| Suite | Command | Result |
|---|---|---|
| Playwright (auth-flow + demo-auth) | `npx playwright test` | **39 passed (42.8s)** |
| Admin unit — AI resolver P-07/P-14 (25) + AI routes fallback GAP-A (4) | `cd admin && npm test` | **29 passed** |
| Mobile unit — aiService fallback/quota GAP-A | `cd mobile && npx jest` | **4 passed** |
| Firestore rules P-08/P-09 | `cd tests/rules && npm test` | **46 passed** |
| P-04 migration | `cd tests/p04-migration && npm test` | **8 passed** |
| Retired-script sanity | `node --test tests/retired-script-sanity.test.js` | **5 passed** |
| **TOTAL** | | **131 passed · 0 failed** |

Mobile lint gate: `cd mobile && npm run lint` (`tsc --noEmit`) → **exit 0**. Jest specs are typechecked via `tsconfig.jest.json` and excluded from the app tsc; that exclusion also repaired a pre-existing `e2e/helpers/storage.ts` type break which had been failing this gate before `114bb38`.

---

## Gap Analysis

### ✅ GAP-A (Package 2): AC 45.4 — fallback surfaced + quota-exempt — **CLOSED `114bb38`**

**AC text:** "If the tier-appropriate model call fails, system falls back to the next-lower-cost available model for that feature, **notifies the user the result may be lower quality**, and **does not deduct the user's quota** for that call." (also BRD 3.4.6.3 and the BRD Section 9 fallback rule: "do not charge user quota for a fallback-served result")

**Defect as found (2026-07-16, pre-fix):** `callWithFallback` computed `fallbackUsed` correctly (`ai-resolver.ts:92-113`), but both AI routes returned only `result.result` — discarding it. `aiService.ts` then returned `quotaChargeEligible: true` unconditionally, so a production fallback was invisible to the user **and still charged**. The `fallbackMessage` path fired only in the demo-mode catch branch. The defect was in the **response contract**, never in the resolver.

**Fix evidence (`114bb38`):**
- `detect/route.ts:97` + `analyze-and-enhance/route.ts:106` — `return NextResponse.json({ ...result.result, modelUsed: result.modelUsed, fallbackUsed: result.fallbackUsed }, ...)`.
- `mobile/src/services/ai/types.ts` — `AiFallbackMeta` added; `AiResult` gains `fallbackUsed`.
- `mobile/src/services/ai/aiService.ts:37` — `quotaChargeEligible: !fallbackUsed`; `:40` — `fallbackMessage: fallbackUsed ? FALLBACK_QUALITY_NOTICE : undefined`.
- `mobile/app/(tabs)/closet.tsx:83,210` — notice rendered in the AI Review Draft for both detect and enhance flows.
- `try-on.tsx` / `events.tsx` already gate on `quotaChargeEligible` + `fallbackMessage`, so they inherit correct behaviour with no change.

**Test evidence (8 new, all passing):**
- `admin/src/__tests__/ai-routes-fallback.test.ts` (145 lines, 4 tests) — **API-route layer**: primary model fails → fallback serves → response carries `fallbackUsed: true` and `modelUsed: gemini-2.5-flash-lite`; primary succeeds → `fallbackUsed: false`. **Verified to fail against the pre-fix routes** (`Expected: true, Received: undefined`) — this is the regression proof that the 25 resolver tests structurally could not provide.
- `mobile/src/__tests__/aiService-fallback.test.ts` (91 lines, 4 tests) — `fallbackUsed: true` → `quotaChargeEligible: false` + `fallbackMessage === FALLBACK_QUALITY_NOTICE`; absent field treated as no fallback. *(Caveat: against pre-fix code this suite fails to compile rather than fail an assertion, since the old `aiService` lacked the exported constant — weaker regression evidence than the route suite above.)*

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
| AC 45.4 — fallback notice + quota exemption | ✅ | `114bb38` — routes surface `fallbackUsed`; `quotaChargeEligible: !fallbackUsed`; notice in review draft. 8 tests (**GAP-A closed**) |

---

## Cross-Module Consistency

| Check | Result | Evidence |
|---|---|---|
| AC 41 (3 auth providers, no email/password) | ✅ | `p01-auth-providers.spec.ts` — "Exactly 3 sign-in options shown; no email/password route accessible", passing |
| AC 42 / 42.1 / 42.2 (OTP retry + cooldown) | ✅ | `p01-otp-cooldown.spec.ts`, passing |
| AC 44 (tiers, no `elite`) | ✅ | 0 `elite` hits in `mobile/src` + `admin/src` |
| AC 45.1–45.3, 45.5–45.7 (routing per tier, Batch, `ai_logs`) | ✅ | 25/25 admin unit tests |
| AC 45.4 (fallback notice + no quota deduction) | ✅ | 4 API-route tests + 4 mobile tests (`114bb38`) — **GAP-A closed** |
| API spec ↔ real routes | ⚠️ | 2/5 implemented (rest = Pkg 3+); 1 undocumented (**GAP-D**) |
| Deployed commit vs branch head | ⚠️ Unverifiable | No deploy exists to compare against |
| BRD goals ↔ tracked KPIs | ⚠️ Unverifiable | `monitoring-bridge` has not run; no `27_product_intelligence_report.md` |

---

## Delivery Readiness Gates

| Gate | Status | Evidence |
|---|---|---|
| Requirements Gate | **pass** | 5 business docs, all non-trivial, committed `6d3292d` |
| Implementation Gate | **pass** | AC 45.4 implemented + tested — GAP-A closed (`114bb38`, 8 new tests) |
| Test Gate | **pass** | 131/131 pass, run 2026-07-16 |
| CI Gate | **fail** | `total_count: 0` — workflows never executed (GAP-B) |
| Deploy Gate | **fail** | No tags, no releases (GAP-C) |

---

## Recommended Action Plan

**Priority 1 (blocks shipping):**
1. ~~Fix **GAP-A**~~ — **DONE** (`114bb38`), verified by 8 tests incl. 4 at the API-route layer.
2. Close **GAP-B** — push the branch (human decision), confirm the first CI run passes. **This is now the only thing between the repo and a green Implementation→CI→Deploy chain.**

**Priority 2:**
3. Close **GAP-C** — tag release, verify Firebase Hosting deploy.
4. Close **GAP-D** — document `/api/admin/ai-routing` in `13_api_spec.md`, or confirm intentional omission.

**Priority 3 (not blocking):**
5. **GAP-E** stays a documented layer boundary. Revisit only if native-driver e2e (Detox/Maestro) enters scope.

---

## Audit boundary

This skill audits and reports only — nothing was fixed, rerun to force a pass, pushed, or deployed. All results above come from real command executions on 2026-07-16 against commit `5ca0ec7`.
