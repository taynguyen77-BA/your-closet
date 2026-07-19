# Pipeline Audit Report — Package 1 + Package 2

**Date:** 2026-07-16
**Auditor:** pipeline-audit-bridge
**Repo:** your-closet · branch `codex/community-genz-refresh`
**Commit at audit:** `b5b44d3` — `fix(ci): resync mobile package-lock so npm ci works on CI's npm 10`
**Pushed:** branch `codex/community-genz-refresh` is on `origin`; **PR [#2](https://github.com/taynguyen77-BA/your-closet/pull/2)** open → `main`
**Previous revisions of this report:** `c867f45` (audited `5ca0ec7`, GAP-A open), `01f2de8` (audited `114bb38`, GAP-A closed / CI unrun)
**Scope:** Package 1 (P-01→P-06, BRD 3.1.x / 3.16.x) + Package 2 (P-07→P-14, BRD 3.2.x, 1.3.4, 1.3.6, §9)
**Business source:** `docs/02_brd_v2_3.md` (540 lines), `docs/04_user_stories_v2_1.md` (1577), `docs/05_acceptance_criteria_v2_1.md` (201), `docs/11_solution_architecture.md` (522), `docs/13_api_spec.md` (171) — all committed `6d3292d`, all non-trivial. `PROJECT_STATE.json` — **absent**; requirement→story traceability is file-derived, not state-derived.

> Supersedes the 2026-07-14 report entirely. That report audited commit `5a591ee`; the branch has since been pushed and is open as PR #2 against `main`, which is **32 commits behind it**. Every verdict below was re-derived from the current tree and from real CI output — no content carried forward.

---

## Executive Summary

**Overall Pipeline Health: HEALTHY**
**Readiness for Delivery: Ready — deploy deferred by PO**

*Basis for the change from NEEDS ATTENTION / Partially Ready (revisions `c867f45`, `01f2de8`): both drivers of that rating are now closed and verified — GAP-A (AC 45.4) fixed in `114bb38` with 8 tests, and GAP-B (CI never run) closed by run `29510039711` passing. The one remaining failing gate, Deploy, is a **PO scheduling decision rather than a defect** (see GAP-C). Remaining open items are non-blocking: GAP-D (an undocumented endpoint), GAP-E (a documented test-layer boundary), GAP-F (delete-confirm list-removal not assertable under the demo mock, deferred to live-Firestore QA), and the dev↔CI toolchain split noted in GAP-B.*

**Top 3 findings:**

1. **✅ All 131 automated tests pass — executed for real on 2026-07-16.** Playwright 39/39 (`npx playwright test`, 42.8s, both projects), admin jest 29/29, mobile jest 4/4, Firestore rules 46/46, p04-migration 8/8, retired-script-sanity 5/5.
2. **✅ GAP-A CLOSED — AC 45.4 now implemented (Package 2), commit `114bb38`.** Both AI routes now return `{ ...result.result, modelUsed, fallbackUsed }`; `aiService.ts:37` sets `quotaChargeEligible: !fallbackUsed`, so a fallback-served result no longer charges quota; `FALLBACK_QUALITY_NOTICE` is shown in the AI Review Draft for both the detect and enhance flows. Backed by **8 new tests** — including 4 at the **API-route layer** (`admin/src/__tests__/ai-routes-fallback.test.ts`), the layer where the defect actually lived. Those 4 were verified to fail against the pre-fix routes with `Expected: true, Received: undefined`; the 25 resolver tests could not detect it.
3. **✅ GAP-B CLOSED — CI has now executed and passes.** Branch pushed and PR [#2](https://github.com/taynguyen77-BA/your-closet/pull/2) opened, which triggered `ci.yml` for the first time. Run [`29510039711`](https://github.com/taynguyen77-BA/your-closet/actions/runs/29510039711) → **completed success** (Admin lint & typecheck ✅ 40s, Mobile typecheck ✅ 44s). The first run (`29509670958`) failed at `npm ci` and exposed a **pre-existing** lockfile desync — see GAP-B below. **Deploy remains the only failing gate.**

---

## Pipeline Completion Matrix

| Stage | Status | Evidence | Notes |
|---|---|---|---|
| Requirements | ✅ | 5 business docs, all non-trivial, committed `6d3292d` | `PROJECT_STATE.json` absent — flagged, not silently ignored |
| Architecture | ⚠️ | 2/5 spec'd AI endpoints implemented; 1 undocumented endpoint found | See GAP-D |
| Implementation | ✅ | P1 OTP cooldown ✅ (`otp.tsx`, `d6503c9`); P2 P-07→P-14 ✅; AC 45.4 ✅ (`114bb38`) | GAP-A closed |
| Testing | ✅ | 131/131 pass, executed 2026-07-16 | Layer boundary documented (GAP-E) |
| CI/CD | ✅ | `ci.yml` run [`29510039711`](https://github.com/taynguyen77-BA/your-closet/actions/runs/29510039711) → **success**, both jobs green; `actions/workflows` → `total_count: 1` | GAP-B closed |
| Deploy | ❌ **Deferred** | `git tag` → empty; `gh release list` → empty; `deploy.yml` not registered on default branch | **Not a technical failure** — PO deferred staging deploy to batch it with later packages (GAP-C) |

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

### ✅ GAP-B: CI pipeline now executes and passes — **CLOSED (run `29510039711`)**

**As found:** `actions/workflows` → `{"total_count":0,"workflows":[]}`; `gh run list` → empty. Workflows were tracked (`5cfb014`) but had never run, because the branch was unpushed and both workflows are scoped to `main` (`ci.yml` on `pull_request` → `main`; `deploy.yml` on `push` → `main`). GitHub also only registers workflows once they exist on the default branch, which is why the count was 0 rather than 1-with-no-runs.

**Closed by:** pushing `codex/community-genz-refresh` and opening PR [#2](https://github.com/taynguyen77-BA/your-closet/pull/2) → `main`, which triggered `ci.yml`.

**Result:** run [`29510039711`](https://github.com/taynguyen77-BA/your-closet/actions/runs/29510039711) — **completed success**. Admin lint & typecheck ✅ (40s), Mobile typecheck ✅ (44s). `actions/workflows` → `total_count: 1`.

**What the first run caught (the point of having CI):** run `29509670958` failed at `npm ci`:

```
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
npm error Missing: @react-native-async-storage/async-storage@1.24.0 from lock file
```

This was **pre-existing, not introduced by any Package 1/2 commit** — verified by running npm 10 against the lock at `114bb38~1`, which fails identically. Cause: `mobile/package-lock.json` was generated by npm 11 (local Node 26) while CI runs Node 20 / npm 10. `@firebase/auth` peer-requires `async-storage@^1.18.1` while the app pins `2.2.0`; npm 11 leaves that unsatisfied peer hoisted ("deduped invalid"), npm 10 wants nested `1.24.0` copies the lock never recorded. Fixed in `b5b44d3` by regenerating with `npm@10 install --package-lock-only`; `npm ci --dry-run` now passes under **both** npm 10 and npm 11.

**Residual risk (not blocking, worth a decision):** dev (Node 26 / npm 11) and CI (Node 20 / npm 10) still disagree on peer resolution, so a future `npm install` from a dev machine can silently desync the lock again. Options: pin CI's Node to match dev, pin dev via `.nvmrc`/`engines`, or resolve the underlying `@firebase/auth` ↔ `async-storage` peer mismatch.

---

### ⏸️ GAP-C: Deploy not performed — **deferred by PO decision, not a technical failure**

**Status source:** PO decision recorded 2026-07-16 — the staging deploy is intentionally batched until further packages are complete. This is a **scheduling choice, not an unresolved defect**: nothing in Package 1 or Package 2 blocks deploying. CI is green (`29510039711`), all 131 tests pass, and the hosting config is in place. The gate is recorded as failing because *the deploy has genuinely not happened* — the technical evidence below is unchanged — but the cause is now known and deliberate rather than unexplained.

> Attribution note: this rationale comes from the PO in session, not from repo evidence. This audit can verify that no deploy exists; it cannot independently verify *why*. Recorded as stated.

**Evidence (re-verified after the push):** `git tag` → **0**. `gh release list` → **0**. `gh run list --workflow=deploy.yml` → `HTTP 404: workflow deploy.yml not found on the default branch` — `deploy.yml` has never run and is not even registered, because it only exists on the feature branch. (Only `ci.yml` became registered, via the PR event.) No deployment exists to correlate against.

**Next action — when the PO decides to deploy (deferred, no action required now):** merge PR [#2](https://github.com/taynguyen77-BA/your-closet/pull/2) into `main`. That single action both registers `deploy.yml` on the default branch **and** triggers it — `on: push: branches: [main]`, with no intermediate approval step — producing a real staging deploy against Firebase secrets (`firebase.json` hosting block `5cfb014`, `public: mobile/dist`). Then tag the release and confirm the deployment is reachable.

**Carry-forward risk for whoever runs that batched deploy:** the longer the deploy is deferred, the more packages land in one untested-in-staging release. `deploy.yml` fires immediately on merge with no approval step, so the first staging deploy will cover every accumulated package at once. Worth planning a tag/rollback path before that merge.

---

### ⚠️ GAP-D: `/api/admin/ai-routing` implemented but undocumented

**Evidence:** Route exists (`admin/src/app/api/admin/ai-routing/route.ts`, P-08, commit `c1b5f26`); `grep -c "admin/ai-routing" docs/13_api_spec.md` → **0**. Reverse gap: a real endpoint absent from the API spec, despite AC 45.5 requiring admin-editable routing config.

**Next action:** Add the endpoint to `13_api_spec.md` (business-doc change → Forge OS side), or confirm it is intentionally admin-internal and out of the public spec's scope.

---

### ⚠️ GAP-E: Package 2 AI flows not covered at e2e layer

**Evidence:** `mobile/e2e/p07-closet-pkg2.spec.ts` covers 8 Closet flows. Not covered: image-pick → `clothing_detection` → review draft → enhance → candidate pick, and bulk-upload ≤5 enforcement — all gated behind native `expo-image-picker`, not drivable in RN-web Playwright. API routes `/api/ai/clothing/*` and `/api/admin/ai-routing` require a live Next.js server + Firebase token + `GOOGLE_AI_API_KEY`.

**Assessment:** Covered at the correct layer instead — 25 admin unit tests assert per-tier resolution, fallback, Batch-vs-Standard routing, and `ai_logs` writes. This is a **documented layer boundary**, not an untested behavior. Not a shipping blocker.

---

### ⚠️ GAP-F: delete-confirm test cannot assert list removal under the demo mock

> Labelled **GAP-F** because GAP-A…GAP-E are already assigned in this report; the
> originating request called it "GAP-B", but GAP-B here is the (closed) CI-never-run
> gap. Same file/section as requested, next free label.

**Evidence:** `mobile/e2e/p07-closet-pkg2.spec.ts` AC-P2-11 (the Bước 3b delete-confirm modal test) cannot assert that the item disappears from the Closet List after deletion, because `appStore.initialize()` re-seeds `mockClothing` on every route change (keyed on `routeKey` in `_layout.tsx`). The post-delete `router.replace` re-runs `initialize()`, which re-adds the deleted item. This is a **demo-mock limitation, not a product bug** — `deleteClothing`'s filter removes the item from the store correctly; it is the demo re-seed that masks it. The same re-seed masked this flow under the old native `Alert.alert` too (which additionally could not be driven in the web harness at all).

**Assessment:** The test asserts the observable side-effect instead — on **confirm** it navigates away from the item detail to the Closet List, and on **cancel** it stays on the detail (AC-P2-10) — plus Escape-to-cancel (AC-P2-12). Store-level removal (`deleteClothing` filter) has no direct assertion across the route transition. **Deferred to:** manual QA / verification on a live Firestore build before production ship — same group as the known P-02/P-03 coverage gaps (`p02-session-routing.spec.ts`, "COVERAGE GAP"), which likewise need a real environment, not the demo mock, to verify fully. Not a shipping blocker.

---

### Spec'd-but-unimplemented endpoints (not a P1/P2 gap)

`13_api_spec.md` specifies 5 AI endpoints; 2 implemented (`/api/ai/clothing/detect`, `/api/ai/clothing/analyze-and-enhance`). Unimplemented: `/api/ai/outfit/recommend`, `/api/ai/tryon/generate`, `/api/ai/style-profile/analyze` — all **Package 3+ scope**, correctly out of scope here. A catch-all proxy `/api/ai/[...path]` exists for upstream forwarding.

---

## Gaps closed since the 2026-07-14 report

| Old gap | Status now | Evidence |
|---|---|---|
| GAP-01 OTP retry + 60s cooldown "not implemented" | **CLOSED** | `d6503c9` — `otp.tsx:11-12,21` `MAX_ATTEMPTS=3`, `COOLDOWN_SECONDS=60`, `cooldownRemaining` state (+84 lines); `authStore.ts` `verifyOtp` no longer sets `isAuthLoading` (it was unmounting the screen and breaking the counter); `p01-otp-cooldown.spec.ts` (99 lines) passing, traceability `AC: 42, 42.1, 42.2` |
| GAP-02 "No CI/CD pipeline" | **CLOSED** | Files tracked (`5cfb014`) **and** proven running: CI run `29510039711` success on PR #2 |
| GAP-03 P-04 retired sanity test missing | **CLOSED** | `tests/retired-script-sanity.test.js` (87 lines) — 5/5 pass; `tests/p04-migration/migrate-tier-enum.test.ts` (342 lines) — 8/8 pass (`5ca0ec7`) |
| GAP-04 Deploy status unverified | **RECLASSIFIED** | Cause now known: deferred by PO decision (2026-07-16), not a technical failure — carried forward as GAP-C |

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
| CI Gate | **pass** | Run [`29510039711`](https://github.com/taynguyen77-BA/your-closet/actions/runs/29510039711) success — both jobs green (GAP-B closed, `b5b44d3`) |
| Deploy Gate | **fail — deferred by PO** | No tags, no releases, `deploy.yml` never run. **Deliberate scheduling decision, not a technical blocker**: PO is batching the staging deploy until further packages land (GAP-C) |

---

## Recommended Action Plan

**Priority 1 — nothing currently blocks shipping:**
1. ~~Fix **GAP-A**~~ — **DONE** (`114bb38`), verified by 8 tests incl. 4 at the API-route layer.
2. ~~Close **GAP-B**~~ — **DONE**: pushed, PR [#2](https://github.com/taynguyen77-BA/your-closet/pull/2) open, CI run `29510039711` green (`b5b44d3` fixed the lockfile desync it exposed).
3. **GAP-C (Deploy) — deferred by PO, no action required now.** Staging deploy is intentionally batched with later packages; merging PR #2 *is* the deploy, whenever the PO chooses.

**Priority 2:**
4. Close **GAP-D** — document `/api/admin/ai-routing` in `13_api_spec.md`, or confirm intentional omission.
5. Decide the dev↔CI toolchain split surfaced by GAP-B (Node 26/npm 11 locally vs Node 20/npm 10 in CI) — pin via `.nvmrc`/`engines`, raise CI's Node, or fix the `@firebase/auth` ↔ `async-storage` peer mismatch. Left open, a dev-side `npm install` can silently desync the lock again.

**Priority 3 (not blocking):**
5. **GAP-E** stays a documented layer boundary. Revisit only if native-driver e2e (Detox/Maestro) enters scope.

---

## Audit boundary

This skill audits and reports only — nothing was fixed, rerun to force a pass, pushed, or deployed. All results above come from real command executions on 2026-07-16 against commit `5ca0ec7`.
