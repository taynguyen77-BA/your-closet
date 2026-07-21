# Implementation Packages — Wardro (Package 2: AI Routing + Closet)

## Package Information

**Package ID:** PKG-02
**Package Name:** AI Routing + Closet
**Business Goal:** Establish the single cost-control chokepoint for all AI calls (AI Routing resolver) and digitize the user's wardrobe (Closet CRUD + AI-assisted tagging) — the foundational data all downstream features (Outfit, Try-On, Marketplace) depend on.
**Requirements Covered:** BRD v2.3 3.2.1–3.2.6, 1.3.4, 1.3.6, Section 9 (AI Model Routing Table — finalized), OI-6 (**closed 2026-07-14**), OI-11.
**Stories Covered:** Epic 2 (AI Closet) — *see Known Gap below*.
**Acceptance Criteria Covered:** AC set for Epic 2 in `05_acceptance_criteria_v2_1.md`.
**Architecture Components:** AI Routing module (foundational, shared), Closet module.
**Dependencies:** Package 1 (Foundation & Auth) — must be Ready (not Partially Ready) before this package starts, since every Closet write is tied to an authenticated `users` document.

---

## ⚠️ Known Gap — Flag Before Starting

`04_user_stories_v2_1.md` states Epic 2 "carries forward unchanged from v1.5," but **no `04_user_stories_v1_5.md` exists in current project knowledge** — only `05_acceptance_criteria_v1_5.md` does. This means Epic 2 story IDs (2.1, 2.2, etc.) referenced elsewhere are not independently traceable to written story text in this project's current file set. This package's prompts trace directly to **BRD 3.2.x** instead, which is fully specified and sufficient to build from — but the Story-ID-level traceability row in each prompt below is marked `[GAP — v1.5 source not in project]` rather than a real story number. Recommend regenerating Epic 2 stories via `user-stories-generator` in parallel, low priority, not blocking.

---

## Scope

**Will be implemented:**
- `admin_settings` AI routing config schema (Firestore) — per-(feature, tier) config record, admin-editable.
- AI Routing resolver module: `resolveModel(feature, tier)` with fallback rule (BRD Section 9) and `ai_logs` cost-tracking write on every call — **implementation shape depends on Technical Lead spike answer (see risk below); do not start until answered.**
- `ai_logs` collection writes (`modelUsed`, `fallbackUsed`, `feature`, `tier`, `userId`, `timestamp`, `costEstimate`).
- Closet item CRUD: add (camera/album), view (grid/list + filter), edit, delete, favorite (BRD 3.2.5).
- Bulk upload flow, capped at 5 photos per batch with picker-level enforcement (BRD 3.2.1 flow).
- AI-assisted tagging: `clothing_detection` integration + `ClothingReviewDraft` correction screen (BRD 3.2.2, 3.2.4).
- AI image enhancement: `analyze-and-enhance` integration, original-vs-enhanced picker (BRD 3.2.3).
- Closet item limit enforcement per tier, non-destructive block-and-upgrade-prompt on Free-tier limit (BRD 3.2.6).
- Batch API routing for `clothing_enhance` specifically (BRD 1.3.6) — async "processing" state, not live-wait spinner.

**Will NOT be implemented in this package:**
- Outfit generation, Try-On, Event linking (Package 3/4) — Closet only provides the data source.
- Marketplace listing creation from a closet item (Package 5) — depends on this package's `clothes` collection existing, but the listing flow itself is out of scope here.
- Quota *enforcement middleware* shared library beyond what Closet itself needs — full `plan_limits`-reading middleware used across Outfit/Try-On is scoped to Package 2/6 per Solution Architecture but built once, here, then reused (see P-08a note).
- Fine-grained AI routing UI polish in Admin CMS (full `AdminCollectionPage` treatment is Package 8) — Package 2 only needs a minimal working config screen, not the polished admin surface.

---

## Success Criteria

- Every AI-touching endpoint in this package calls through `resolveModel()` — zero hardcoded model IDs in Closet feature code (Solution Architecture Section 13 governance rule).
- A user can add 1–5 items in one upload batch, see AI-suggested tags, correct any field, and save — item appears in Closet grid immediately.
- `analyze-and-enhance` returns enhancement candidates matching the user's tier count (Free: 1, Pro: 2–3, Premium: 3+) and the user can pick original or enhanced as primary image.
- A Free-tier user at the closet item limit sees a non-destructive upgrade prompt — their in-progress upload is not discarded.
- Every AI call (success, failure, fallback) produces exactly one `ai_logs` entry with accurate `modelUsed`/`fallbackUsed`.
- `clothing_enhance` calls are demonstrably routed through Batch API path (not synchronous) in at least one test case.

---

## Technical Constraints

**Architecture rules:** AI Routing module has no upstream dependency (Solution Architecture Section 7) — build it as a standalone shared library first (P-07), then integrate into Closet feature code (P-11/P-12), never the reverse.
**Security rules:** AI provider API keys/credentials live server-side only (Next.js API layer), never in mobile client code — this package is the first to touch AI credentials; establish the pattern correctly since Package 3/6/7 all reuse it.
**Performance requirements:** `clothing_detection` and `clothing_enhance` are not latency-sensitive (async-tolerant); `virtual_tryon` (Package 3) is — this package's Batch API routing decision (BRD 1.3.6) must not be copy-pasted onto Package 3's try-on calls.
**Coding standards:** TypeScript strict mode, no `any`, kebab-case files, PascalCase components, camelCase variables.

---

## Risks

**Implementation risk — RESOLVED 2026-07-14:** ~~AI provider per-request model selection is an unverified assumption (BRD 1.3.4)~~. Confirmed supported per official Gemini API documentation (checked 2026-07-01) — the `model` parameter is set per individual request, standard REST behavior. P-07/P-11/P-12/P-14 are unblocked; no Technical Lead spike required.
**Cost risk:** Misconfigured routing or Free-tier leakage to expensive models threatens unit economics (OI-11 confirms no free production tier exists — every AI call has real cost from Free tier onward). **Mitigation:** `ai_logs` is mandatory on every call, not optional instrumentation added later. Confirmed pricing (BRD v2.3 Section 9): reserve `gemini-3-pro-image` (Nano Banana Pro) for Premium only; route `clothing_enhance` through Batch API at every tier (50% discount, confirmed); `clothing_detection` uses a text/vision model, never an image-generation model, at any tier.
**Dependency risk:** Packages 3, 5, 7 all depend on this package's AI Routing resolver and/or `clothes` collection being correct. A bug in `resolveModel()` propagates to every AI-touching feature built afterward.
**Mitigation strategy:** Do not mark Package 2 done until P-07 has explicit unit tests covering: correct resolution per tier for all 4 features, fallback on failure, Batch routing specifically for `clothing_enhance` (not other features), and non-image-model routing for `clothing_detection`.
