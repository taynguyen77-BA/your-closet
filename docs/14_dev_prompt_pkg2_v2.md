# Dev Prompts — Package 2 (AI Routing + Closet)

**Update 2026-07-14:** The AI provider per-request model selection question is now **confirmed resolved** (official Gemini API documentation, checked 2026-07-01 — the `model` parameter is standard per-request REST behavior, not a project/key-level constraint). Phase 2 (P-07, P-11, P-12, P-14) is **no longer blocked** and can run in any order relative to Phase 1. Model IDs and pricing below are updated to the current official values (BRD v2.3 Section 9) — the model family was renamed since this file was first drafted (Nano Banana → `gemini-2.5-flash-image` legacy; Lite → `gemini-3.1-flash-lite-image`; Nano Banana 2 → `gemini-3.1-flash-image`; Pro → `gemini-3-pro-image`).

**How to use this file:** Each prompt is self-contained — paste one at a time into Claude Code, in order within a phase. All 8 prompts (P-07 through P-14) are ready to run. Business context files referenced below live at `docs/02_brd_v2_3.md`, `docs/11_solution_architecture.md`, `docs/12_database_design.md`, `docs/13_api_spec.md`.

---

## P-08 — AI Routing Config Schema + Minimal Admin Edit Screen

```text
Prompt ID: P-08
Title: admin_settings AI routing config schema + minimal edit screen
Phase: Foundation
Depends On: Package 1 (Admin auth/custom-claim split)
Package: PKG-02
Story: BRD 3.4.6 / Section 9 (AI Model Routing Table)
Complexity: M
```

### BUSINESS CONTEXT
Business Goal: Every AI model choice must be admin-editable without a code deploy — this is the data layer the AI Routing resolver (P-07) will read from.
Requirement: BRD Section 9 (AI Model Routing Table) — 5 features × 3 tiers, each cell an editable model ID string.
User Story: Admin needs to change which model serves a given (feature, tier) pair when pricing/availability changes, without engineering involvement.
Expected Outcome: A `admin_settings` Firestore document (or collection, your call based on existing codebase convention) storing the full routing table, plus a minimal (non-polished — full Admin CMS treatment is Package 8) web screen to view/edit it.

### ARCHITECTURE CONTEXT
Module: AI Routing (shared/infra), Admin (minimal touch)
Database: New `admin_settings` document/collection per `docs/12_database_design.md` conventions — check existing `admin_settings` usage in codebase first (may already exist for other config, extend rather than duplicate).
APIs: `GET /api/admin/ai-routing`, `PUT /api/admin/ai-routing` per `docs/13_api_spec.md` if defined there; if not defined, follow the existing admin API pattern in the codebase.
Relevant Architecture Decisions: Solution Architecture Section 13 governance rule — "every new AI-touching endpoint MUST call through the AI Routing module (no hardcoded model IDs in feature code)." This schema is what makes that possible.

### CURRENT STATE
Describe existing `admin_settings` usage (if any) and existing Admin web app structure/auth pattern before writing new code — reuse, do not duplicate.

### TASK
Build exactly: (1) Firestore schema for the routing table (5 features × 3 tiers = 15 model ID entries, plus a fallback-chain field per feature), (2) a read/write API route pair, (3) a minimal admin screen — a table/form is sufficient, no design polish required.
Do not modify Auth or Closet code. Do not build the AI Routing resolver itself (P-07) — this prompt is data layer only.

### REQUIREMENTS
**Functional:**
- [ ] Schema supports exactly the 5 features from Section 9: `clothing_detection`, `clothing_enhance`, `outfit_recommend`, `virtual_tryon`, `style_profile_analyze`
- [ ] Each feature has 3 tier-keyed model ID fields (free/pro/premium)
- [ ] Each feature has a fallback model ID field (per Section 9 fallback rule)
- [ ] Admin screen shows current values and allows edit + save
**Technical:**
- [ ] Admin-only write access (custom claim check, reuse Package 1 pattern)
- [ ] Public/client read access NOT granted — only the server-side resolver reads this
**Security:**
- [ ] Firestore rules deny any non-admin write to `admin_settings`
**Performance:** None special — low-frequency admin action.

### ACCEPTANCE CRITERIA
- [ ] Admin can view current routing table for all 5 features × 3 tiers
- [ ] Admin can edit and save a model ID; change persists and is readable back
- [ ] Non-admin user cannot write to this collection (verified via rules test)

### STRICT RULES
**DO:** Reuse existing Admin auth pattern from Package 1. Follow existing Firestore document conventions in the codebase.
**DO NOT:** Build the resolver logic. Do not build the full polished Admin CMS UI (Package 8). Do not add features beyond the 5 in Section 9.

### EXPECTED OUTPUT
Files to create: Firestore schema/seed doc, API route(s), minimal admin screen component.
Files to modify: Firestore rules (add `admin_settings` write rule if not present).
Files to leave untouched: Auth, Closet, any mobile client code.

### VERIFICATION
Run existing rules unit tests + new test confirming non-admin write is denied. Manually confirm admin screen round-trips a value change.

### DONE CRITERIA
Schema exists, admin can edit, rules deny non-admin writes, no build/lint/type errors, no failing tests.
```

---

## P-09 — Closet Item CRUD (No AI)

```text
Prompt ID: P-09
Title: Closet item CRUD — add, view, edit, delete, favorite (no AI yet)
Phase: Foundation
Depends On: Package 1
Package: PKG-02
Story: BRD 3.2.5 [Epic 2 — GAP, see 16_implementation_packages_pkg2.md]
Complexity: L
```

### BUSINESS CONTEXT
Business Goal: The wardrobe digitization core loop — without this, no other feature (Outfit, Try-On, Marketplace) has data to work with.
Requirement: BRD 3.2.5 — "The user will have the option to manage closet items: view (grid/list), filter, view item detail, mark as favorite, edit, and delete."
Expected Outcome: A user can manually add an item (no AI tagging yet — that's P-11), view their closet in grid/list, filter, edit fields, delete, and favorite.

### ARCHITECTURE CONTEXT
Module: Closet
Database: `clothes` collection per `docs/12_database_design.md` — use the exact schema defined there (do not invent fields).
APIs: `/api/closet/*` per `docs/13_api_spec.md`.
Dependencies: Firebase Storage (photo upload), Firebase Auth (ownership).

### CURRENT STATE
Check for any existing partial Closet implementation in the codebase before starting — reuse component patterns from Package 1 (form handling, list screens) where applicable.

### TASK
Build: item creation form (manual field entry — category, color, material, style, season, tags, name, photo), grid/list view with filter, item detail view, edit form, delete with confirmation, favorite toggle.
Do NOT integrate AI detection/enhancement (P-11/P-12) — item creation in this prompt uses manually-entered fields and a directly-uploaded photo, no AI call.
Do NOT build bulk upload (P-10) — this prompt is single-item CRUD only.

### REQUIREMENTS
**Functional:**
- [ ] Add item: photo upload (single image), manual category/color/material/style/season/tags/name entry, save to `clothes`
- [ ] View: grid and list layout toggle, filter by category/color/tag
- [ ] Item detail: full field display, favorite toggle
- [ ] Edit: all fields editable, save updates `clothes` document
- [ ] Delete: confirmation dialog before delete, cascades correctly (check for any references — e.g., don't leave a dangling reference if the item is in an outfit; if that check is complex, flag it and implement a soft-delete instead, do not silently allow orphaned references)
**Technical:**
- [ ] Ownership check on every read/write (`clothes.ownerId === auth.uid`)
- [ ] Photo stored in Firebase Storage under a per-user path, signed URL pattern matching existing Storage usage in the codebase
**Security:**
- [ ] Firestore rules: user can only read/write their own `clothes` documents
**Performance:** Grid view should paginate/lazy-load if the codebase already has a pattern for this (check Outfit/Home screens for precedent); otherwise flag as a known gap.

### ACCEPTANCE CRITERIA
- [ ] User can add an item with a photo and manual tags, item appears in grid
- [ ] User can filter by category and see correct subset
- [ ] User can edit any field and see it persist
- [ ] User can delete an item with confirmation, item disappears from grid
- [ ] User can favorite/unfavorite, state persists
- [ ] A user cannot read/write another user's `clothes` documents (rules test)

### STRICT RULES
**DO:** Follow `12_database_design.md` schema exactly. Reuse existing form/list component patterns.
**DO NOT:** Add AI calls of any kind. Do not build bulk upload. Do not add the closet item tier-limit check yet (P-13 or a follow-up — confirm with PO if this belongs here or in P-13; default to including it in P-13 alongside Item Detail unless codebase structure suggests otherwise).

### EXPECTED OUTPUT
Files to create: Closet CRUD screens/components, API routes, Firestore rules addition.
Files to modify: Navigation/routing config to add Closet screens if not already present.
Files to leave untouched: Auth module, any AI-related code.

### VERIFICATION
Manual test: add → view → filter → edit → favorite → delete, full cycle. Rules unit test for cross-user access denial.

### DONE CRITERIA
Full CRUD cycle works, ownership enforced, no build/lint/type errors, no failing tests.
```

---

## P-10 — Bulk Upload Flow

```text
Prompt ID: P-10
Title: Bulk upload flow — up to 5 photos per batch
Phase: Foundation
Depends On: P-09
Package: PKG-02
Story: BRD 3.2.1 [Epic 2 — GAP]
Complexity: M
```

### BUSINESS CONTEXT
Requirement: BRD 3.2.1 flow — "Bulk album selection capped at 5 photos, picker blocks further selection past 5 with message 'Bạn chỉ có thể chọn tối đa 5 ảnh cho mỗi lần upload.'"
Expected Outcome: User can select up to 5 photos from their album in one action; the picker itself prevents selecting a 6th, with the exact Vietnamese message above.

### ARCHITECTURE CONTEXT
Module: Closet (extends P-09)
Dependencies: P-09's item creation flow, extended to accept multiple photos and produce multiple draft items.

### CURRENT STATE
Builds directly on P-09's single-item add flow — reuse the same underlying save logic per item, just triggered N times from one batch action.

### TASK
Build: album picker configured with a 5-image max selection limit at the picker level (not just a post-hoc validation), with the exact block message specified above when the user attempts to exceed it. Each selected photo becomes a separate draft item entering the same manual-tagging flow as P-09 (AI tagging is P-11 — not in scope here).

### REQUIREMENTS
**Functional:**
- [ ] Picker enforces 5-photo max at selection time, not after
- [ ] Exact message on limit-exceeded: "Bạn chỉ có thể chọn tối đa 5 ảnh cho mỗi lần upload."
- [ ] Each photo produces one draft item flowing into the manual review/tag/save cycle from P-09
- [ ] User can cancel individual drafts within the batch without discarding the others
**Technical:**
- [ ] Reuse P-09's single-item save path per draft — do not duplicate save logic
**Security:** Same ownership rules as P-09, no new surface.
**Performance:** Uploads should not block the UI thread; use existing async upload pattern.

### ACCEPTANCE CRITERIA
- [ ] Selecting 5 photos works; attempting a 6th shows the exact specified message and blocks selection
- [ ] All 5 items can be individually reviewed and saved
- [ ] Canceling one draft in the batch does not affect the others

### STRICT RULES
**DO:** Reuse P-09 save logic per item. Match the Vietnamese message text exactly (character-for-character, per BRD 3.2.1).
**DO NOT:** Add AI tagging in this prompt. Do not change the single-item flow from P-09.

### EXPECTED OUTPUT
Files to create: Bulk picker component, batch draft-review flow.
Files to modify: Closet "Add item" entry point to offer single vs. bulk.

### VERIFICATION
Manual test: select exactly 5, confirm no error; attempt 6th, confirm exact message and block; save full batch, confirm 5 items in grid.

### DONE CRITERIA
5-photo cap enforced at picker level, exact message shown, batch save works, no build/lint/type errors.
```

---

## P-13 — Item Detail Screen + Closet Limit Enforcement

```text
Prompt ID: P-13
Title: Item Detail screen with wear-count display + tier-based closet item limit
Phase: Foundation
Depends On: P-09
Package: PKG-02
Story: BRD 3.2.5, 3.2.6 [Epic 2 — GAP]
Complexity: M
```

### BUSINESS CONTEXT
Requirement: BRD 3.2.6 — "The system will enforce a closet item limit per membership tier... When a Free-tier user reaches their limit, the system will block new item saves and display an upgrade prompt, without discarding the in-progress upload from the review draft."
Expected Outcome: Item Detail screen shows wear-count (feeds from Package 3/4's `timesWorn` increments, display-only here); tier limit is enforced non-destructively.

### ARCHITECTURE CONTEXT
Module: Closet, reads `plan_limits` (Membership module's collection, per Solution Architecture)
Database: `clothes.timesWorn` field (display only — this package does not write it; Package 3/4 does), `plan_limits` collection (read-only from Closet's perspective).

### CURRENT STATE
Builds on P-09's item detail view — this prompt adds the wear-count display and the save-time limit check.

### TASK
Extend Item Detail (from P-09) to show `timesWorn` (read-only counter, may be 0 for all items until Package 3/4 ships — that's expected and correct). Add a save-time check in the item creation flow (P-09/P-10): before final save, check current item count against the user's tier limit (read from `plan_limits`); if at/over limit, block the save and show an upgrade prompt — critically, the in-progress draft (photo + entered tags) must remain intact so the user can delete an old item and retry without re-uploading.

### REQUIREMENTS
**Functional:**
- [ ] Item Detail displays `timesWorn` count (read-only, defaults to 0)
- [ ] Save flow checks item count vs. tier limit before committing
- [ ] At-limit: block save, show upgrade prompt, preserve draft state (do not navigate away or clear the form)
**Technical:**
- [ ] Read `plan_limits` for the current user's tier (do not hardcode limit values)
**Security:** No new surface beyond P-09's ownership rules.
**Performance:** Limit check is a single read, should not noticeably delay save.

### ACCEPTANCE CRITERIA
- [ ] Item Detail shows wear-count (0 for new items)
- [ ] Free-tier user at limit sees upgrade prompt on save attempt, draft is not lost
- [ ] User below limit saves normally with no interruption
- [ ] Deleting an old item and retrying the same draft succeeds

### STRICT RULES
**DO:** Read limit values from `plan_limits`, never hardcode. Preserve draft state on block — this is a named business requirement (BRD 3.2.6), not optional polish.
**DO NOT:** Discard the draft on limit-block under any circumstance.

### EXPECTED OUTPUT
Files to modify: Item Detail component (P-09), item save flow (P-09/P-10).

### VERIFICATION
Manual test: set a test user to Free tier at limit, attempt save, confirm block + prompt + draft preserved; delete an item, retry same draft, confirm success.

### DONE CRITERIA
Limit enforced correctly per tier, draft never lost on block, wear-count displays, no build/lint/type errors.
```

---

## PHASE 2 — AI Integration (unblocked 2026-07-14, ready to run)

The four prompts below were previously gated pending a Technical Lead spike on AI per-request model selection. That question is now confirmed resolved against official Gemini API documentation — per-request model selection is standard, supported behavior. Model IDs and pricing below reflect the current official values (BRD v2.3 Section 9).

---

## P-07 — AI Routing Resolver (`resolveModel`)

```text
Prompt ID: P-07
Title: AI Routing resolver module — resolveModel(feature, tier)
Phase: AI Integration
Depends On: P-08
Package: PKG-02
Story: BRD 1.3.4, Section 9 (v2.3)
Complexity: L
```

### BUSINESS CONTEXT
Business Goal: Single enforcement chokepoint for AI cost strategy — every AI-touching feature routes through this, no exceptions (Solution Architecture Section 13 governance rule).
Requirement: BRD v2.3 Section 9 (AI Model Routing Table — finalized with real model IDs and pricing), 1.3.4 (per-request model selection — confirmed supported), 1.3.6 (Batch API for `clothing_enhance`).
Expected Outcome: A shared library function `resolveModel(feature, tier)` returning the correct model ID + fallback chain, reading live from `admin_settings` (P-08), with automatic fallback on primary-model failure and a mandatory `ai_logs` write on every call outcome.

### ARCHITECTURE CONTEXT
Module: AI Routing (shared/infra) — no upstream dependency by design; every other AI-touching module depends on this, not the reverse.
Database: Reads `admin_settings` (P-08), writes `ai_logs` on every call.
Confirmed model IDs to seed as `admin_settings` defaults (BRD v2.3 Section 9):
- `clothing_detection` (all tiers): a Gemini Flash-Lite **text/vision** model — NOT an "-image" model, this feature is image-understanding (vision input → text output), not image generation.
- `clothing_enhance`: Free → `gemini-3.1-flash-lite-image` via Batch API; Pro → `gemini-3.1-flash-image` via Batch API; Premium → `gemini-3-pro-image` via Batch API. All three route through Batch regardless of tier (BRD 1.3.6) — this feature is never called synchronously.
- `virtual_tryon`: Free → `gemini-3.1-flash-lite-image` Standard (real-time, NOT Batch — latency-sensitive); Pro → `gemini-3.1-flash-image` Standard; Premium → `gemini-3-pro-image` Standard.
- `outfit_recommend`, `style_profile_analyze`: text/reasoning models (Flash-Lite/Flash/Pro tiers per Section 9), no image model involved.
Relevant Architecture Decision: Per-request model selection is confirmed standard Gemini API behavior — the `model` parameter is set in each individual API call. No fallback-to-coarse-config path is needed; implement the straightforward per-request design.

### CURRENT STATE
No existing AI Routing code in the codebase (confirmed — this is genuinely new, foundational infrastructure).

### TASK
Build `resolveModel(feature, tier)`: reads `admin_settings`, returns model ID + fallback chain. Build the calling wrapper that actually invokes the AI provider with the resolved model, catches failure, retries with fallback model (does not charge quota on fallback per BRD Section 9 fallback rule — quota-charging itself is a Membership-module concern P-07 should expose a hook for, not implement). Route `clothing_enhance` calls specifically through Batch API for all three tiers (BRD 1.3.6); `virtual_tryon` remains synchronous/real-time at all tiers; `clothing_detection` uses a text/vision model, never an image-generation model.

### REQUIREMENTS
**Functional:**
- [ ] `resolveModel(feature, tier)` returns correct model + fallback per current `admin_settings` values, seeded with the model IDs listed above
- [ ] On primary model failure, automatically retries with fallback model
- [ ] `clothing_enhance` routes through Batch API at every tier (Free, Pro, Premium) — not just Free
- [ ] `virtual_tryon` never routes through Batch (real-time requirement, BRD Section 7)
- [ ] `clothing_detection` never resolves to an "-image" family model
**Technical:**
- [ ] No hardcoded model IDs anywhere in this module or any caller — all read from `admin_settings`
- [ ] AI provider credentials server-side only
**Security:** [ ] Credentials never exposed to mobile client.
**Performance:** [ ] Batch-routed calls (`clothing_enhance`) show async "processing" state to caller, not a blocking wait.

### ACCEPTANCE CRITERIA
- [ ] Changing a model ID in `admin_settings` (P-08) changes `resolveModel`'s output on next call, no deploy required
- [ ] Simulated primary-model failure triggers fallback correctly, logged with `fallbackUsed: true`
- [ ] `clothing_enhance` call demonstrably uses Batch API path at all three tiers
- [ ] `virtual_tryon` call demonstrably uses Standard (non-Batch) path at all three tiers
- [ ] `clothing_detection` call never selects an "-image" model, verified for all three tiers

### STRICT RULES
**DO:** Implement per-request model selection directly — this is confirmed standard behavior, not something requiring a feature flag or fallback design. Keep the resolver interface simple: `resolveModel(feature, tier) → { modelId, fallbackModelId }`.
**DO NOT:** Hardcode any model ID as a "temporary" measure — read from `admin_settings` even during testing (use a test `admin_settings` value, not a code constant). Do not route `clothing_detection` through an image-generation model at any tier — this is a cost mistake, not just a style preference.

### EXPECTED OUTPUT
Files to create: `resolveModel` module, AI provider calling wrapper, Batch API integration for `clothing_enhance`.

### VERIFICATION
Unit tests: correct resolution per tier for all 4 features, fallback on failure, Batch routing for `clothing_enhance` only (all tiers), Standard routing for `virtual_tryon` only (all tiers), non-image model for `clothing_detection` (all tiers).

### DONE CRITERIA
Resolver correctly implements per-request selection, fallback works, no hardcoded model IDs, Batch/Standard routing correct per feature (not per tier), no build/lint/type errors, no failing tests.
```

---

## P-11 — `clothing_detection` Integration + Review Draft Screen

```text
Prompt ID: P-11
Title: clothing_detection AI integration + ClothingReviewDraft correction screen
Phase: AI Integration
Depends On: P-07, P-09
Package: PKG-02
Story: BRD 3.2.2, 3.2.4 [Epic 2 — GAP]
Complexity: L
```

### BUSINESS CONTEXT
Requirement: BRD 3.2.2 — auto-detect category/color/material/style/season/tags via AI Model Routing; 3.2.2.2 — retry up to 3x on failure before showing error, never silently mock in production; 3.2.4 — user can correct any AI-suggested field.

### ARCHITECTURE CONTEXT
Module: Closet, calling through AI Routing (P-07).
APIs: `POST /api/ai/clothing/detect` per `docs/13_api_spec.md`.

### TASK
Wire the item-add flow (P-09/P-10) to call `clothing_detection` via `resolveModel`-routed request. Build `ClothingReviewDraft` screen showing AI-suggested fields, editable before save. Implement 3x auto-retry on failure per BRD 3.2.2.2.

### REQUIREMENTS
**Functional:**
- [ ] AI detection called on photo upload, populates draft fields automatically
- [ ] User can edit any AI-suggested field before saving
- [ ] Failure triggers up to 3 automatic retries, then shows error state — never a silent mock substitution outside `EXPO_PUBLIC_DEMO_MODE=true`
**Technical:** [ ] Call routed through `resolveModel`, not a direct/hardcoded model call.
**Security:** No new surface.
**Performance:** [ ] Show loading state during detection; do not block the rest of the UI.

### ACCEPTANCE CRITERIA
- [ ] Uploading a photo produces AI-suggested tags on the review screen
- [ ] Editing any field before save persists the corrected value, not the AI suggestion
- [ ] Simulated 3x failure shows error state, no mock data shown (unless demo mode flag set)

### STRICT RULES
**DO:** Route every call through `resolveModel`. Match retry count exactly (3).
**DO NOT:** Add a mock fallback outside the explicit demo-mode flag.

### EXPECTED OUTPUT
Files to create: `ClothingReviewDraft` screen, detection API integration.
Files to modify: P-09/P-10 item-add flow to call detection.

### VERIFICATION
Manual test with real/staging AI call; simulate failure (e.g., invalid input) to confirm retry + error behavior.

### DONE CRITERIA
Detection wired through resolver, correction UI works, retry/error behavior matches spec exactly, no build/lint/type errors.
```

---

## P-12 — `analyze-and-enhance` Integration

```text
Prompt ID: P-12
Title: Image enhancement integration + original/enhanced picker
Phase: AI Integration
Depends On: P-07, P-09
Package: PKG-02
Story: BRD 3.2.3 [Epic 2 — GAP]
Complexity: M
```

### BUSINESS CONTEXT
Requirement: BRD 3.2.3 — `analyze-and-enhance` returns `enhancedImageCandidates[]` + `qualityWarnings[]`; candidate count varies by tier (Free: 1, Pro: 2–3, Premium: 3+) per Section 9.

### ARCHITECTURE CONTEXT
Module: Closet, via AI Routing (P-07), specifically the Batch API path (BRD 1.3.6) — this call is async/processing-state, not a live wait.
APIs: `POST /api/ai/clothing/analyze-and-enhance` per `docs/13_api_spec.md`.

### TASK
Add an "Enhance" option to the review draft flow (P-11), calling `analyze-and-enhance` through the resolver's Batch-routed path. Show a "processing" state (not a spinner implying <5s), then present original vs. enhanced candidates for the user to pick as primary image.

### REQUIREMENTS
**Functional:**
- [ ] Enhancement is user-triggered (not automatic on every upload — confirm this against BRD 3.2.3 wording; if ambiguous, default to user-triggered/optional since Section 9 frames it as a distinct offered step)
- [ ] Candidate count shown matches user's tier
- [ ] User picks original or one enhanced candidate as primary image
- [ ] `qualityWarnings` displayed if present
**Technical:** [ ] Uses Batch API path via resolver, shows async processing state.
**Security:** No new surface.
**Performance:** [ ] UI does not block during the (potentially 24hr-window) Batch processing — user should be able to leave and return.

### ACCEPTANCE CRITERIA
- [ ] Enhancement request shows processing state, not a blocking spinner
- [ ] Candidate count matches tier (test at least Free vs. Premium)
- [ ] Picking enhanced image sets it as primary; picking original leaves original as primary

### STRICT RULES
**DO:** Route through resolver's Batch path specifically. Match tier-based candidate counts exactly.
**DO NOT:** Make this block the item save flow — if Batch processing takes time, the item can save with the original image and enhancement can complete/attach asynchronously (confirm this UX assumption with PO if the codebase doesn't already have an async-attach pattern).

### EXPECTED OUTPUT
Files to create: Enhancement UI in review draft, Batch-path API integration.

### VERIFICATION
Manual test: trigger enhancement, confirm processing state (not blocking spinner), confirm candidate count per tier.

### DONE CRITERIA
Enhancement flow works async, tier-based candidate counts correct, no build/lint/type errors.
```

---

## P-14 — `ai_logs` Cost Tracking

```text
Prompt ID: P-14
Title: ai_logs cost-tracking write on every AI call
Phase: AI Integration
Depends On: P-07
Package: PKG-02
Story: BRD 3.7.1, Section 9
Complexity: S
```

### BUSINESS CONTEXT
Requirement: Solution Architecture — "log `modelUsed` and `fallbackUsed: true` to `ai_logs` for cost-monitoring visibility (BRD 3.7.1)."

### ARCHITECTURE CONTEXT
Module: AI Routing (P-07) — this prompt is the logging hook inside that module, not a separate integration per feature.
Database: `ai_logs` collection per `docs/12_database_design.md`.

### TASK
Ensure every call routed through `resolveModel`/the calling wrapper writes exactly one `ai_logs` entry per call attempt (including failed/fallback attempts), with `modelUsed`, `fallbackUsed`, `feature`, `tier`, `userId`, `timestamp`, and a cost estimate field.

### REQUIREMENTS
**Functional:**
- [ ] Every AI call (success, failure, fallback) produces exactly one `ai_logs` entry
- [ ] Entry includes all required fields, no nulls on required fields
**Technical:** [ ] Write happens server-side, cannot be bypassed by client.
**Security:** [ ] `ai_logs` write-only from server, read-only for admin (reuse P-08's admin auth pattern for any read screen, though the read UI itself may be Package 8).

### ACCEPTANCE CRITERIA
- [ ] Test call produces exactly one correctly-populated `ai_logs` entry
- [ ] Fallback scenario produces an entry with `fallbackUsed: true` and the fallback model's ID as `modelUsed`

### STRICT RULES
**DO:** Hook this into P-07's wrapper, not duplicated per feature (P-11/P-12 should not each implement their own logging).
**DO NOT:** Allow client-side writes to `ai_logs`.

### EXPECTED OUTPUT
Files to modify: P-07's calling wrapper (add logging hook).

### VERIFICATION
Trigger a successful call and a simulated-failure/fallback call; inspect `ai_logs` entries for correctness.

### DONE CRITERIA
Every call path produces exactly one accurate log entry, no build/lint/type errors, no failing tests.
```

---

## Review Checkpoint

Artifacts Ready: `14_dev_prompt_pkg2_v2.md`, `15_sprint_plan_pkg2_v2.md`, `16_implementation_packages_pkg2_v2.md`

Summary:
Stories: Epic 2 (traceability gap flagged)
Packages: 1 (PKG-02)
Prompts: 8 (P-07–P-14) — all Ready, none blocked
Dependencies: Package 1 Ready (in progress)

Development Readiness: Ready (upgraded from Partially Ready — AI model selection question resolved 2026-07-14)
Recommended Next Phase: Hand all 8 prompts to Claude Code in dependency order (P-08 → P-09 → P-07/P-10/P-13 → P-11/P-12/P-14).

Reply "approved" to proceed, or specify which prompt requires revision.
