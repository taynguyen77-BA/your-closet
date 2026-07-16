# Wardro — Phase 1 (MVP) User Stories v2.1

Version: 2.1 (supersedes v2.0)
Date: 2026-07-13
Source: 02_brd_v2_2.md
Scope: All 17 feature areas confirmed as MVP Must Have by PO

**v2.1 changelog:** Added **Story 10.5 — User: Confirm Event as Worn** (BRD 3.10.5, ADR-04/ADR-05, PO decision 2026-07-12). This story existed already in `13_api_spec.md` and `12_database_design.md` but had not been written back into this document — this update closes that gap. No other stories changed.

---

## How to read this document

- **Epics 1, 4, 5** (Account, Membership, Missions) were already specified in User Stories v1.5. Only **new/changed stories** are written out below — every other story in those epics is unchanged and carries forward as-is from v1.5.
- **Epics 2, 3, 6, 7, 8** (AI Closet, Home Dashboard, Notifications, Admin/AI Cost Monitoring, Fashion Knowledge Base) carry forward from v1.5 **unchanged** except where explicitly noted — no deltas were introduced by the BRD v2.0 update for these.
- **Epics 9–17** are entirely new (promoted from "not yet specced" to MVP Must Have per PO decision). **Epic 10** additionally received a v2.1 addition (Story 10.5).

---

# EPIC 1 — Account & Identity — [DELTA from v1.5]

## Story 1.1 (REVISED) — User: Register/Login via Phone OTP, Google, or Facebook

**User Story**
As a user, I want to register or log in using Phone OTP, Google, or Facebook, so that I can access the app without creating a new password to remember.

**Business Context**
Auth scope was reduced from 4 providers (Email/Phone/Google/Facebook) to exactly 3 — Email/Password is explicitly removed, not just deprioritized — per PO decision D1.

**Source Requirement**
BRD 3.1.1, 3.1.1.1–3.1.1.3

**Business Rules**
- Exactly 3 providers: Phone OTP, Google, Facebook. Email/Password is not offered.
- OTP failure allows 3 retries, then a 60-second cooldown before the next OTP can be requested.
- Duplicate account prevention: if a phone number/provider identity already maps to an existing account, sign in to it rather than creating a new one.

**Dependencies**
- Upstream: None.
- Downstream: Story 1.3 (post-login routing to Style Survey), all authenticated features.
- External: Firebase Auth (Phone, Google, Facebook providers).
- Data: `users/{uid}` document created on first successful auth.

**Assumptions**
- No existing user has registered via Email/Password in staging/production (PO-confirmed) — so this is pure removal, not migration.

**In Scope**
- Phone OTP flow with 60s cooldown, Google sign-in, Facebook sign-in, duplicate-account prevention.

**Out of Scope**
- Email/Password registration or login (removed from scope entirely).

**Story Readiness Assessment**
Status: Ready
Reason: All three provider flows and the cooldown value are fully specified.

**Acceptance Coverage Preparation**
Happy Path (×3 providers), Validation (OTP retry/cooldown), Edge Cases (duplicate identity), Error Handling (provider denial/cancellation).

**Traceability**
Requirement Reference: 3.1.1
Source Section: BRD v2.0 Mục 3.1
Feature: Account/Identity
Module: Authentication
Confidence: High

---

## Story 1.9 (NEW) — Engineering: Remove Email/Password Code Path

**User Story**
As the engineering team, I want all Email/Password registration/login code removed from the mobile app, so that the shipped auth surface matches the approved 3-provider scope.

**Business Context**
Code cleanup task surfaced directly by the Feature Gap Analysis; not a user-facing story but tracked here because it blocks Story 1.1 from being truthfully "Ready" in production.

**Source Requirement**
BRD 1.3.3, 3.1.1.1

**Business Rules**
- Firebase Console Email/Password provider must be disabled, not just hidden in UI.

**Dependencies**
- Upstream: None.
- Downstream: None.
- External: Firebase Console configuration change.
- Data: None.

**Assumptions**
- No production users depend on this path (PO-confirmed, OI-9 resolved).

**In Scope**
- Remove `register.tsx` email flow, `forgot-password.tsx`, related `authService.ts` methods; disable provider in Firebase Console.

**Out of Scope**
- Any user communication/migration (not needed).

**Story Readiness Assessment**
Status: Ready

**Acceptance Coverage Preparation**
Regression (ensure Phone/Google/Facebook unaffected), Negative Test (Email/Password endpoints no longer reachable).

**Traceability**
Requirement Reference: 1.3.3
Source Section: BRD v2.0 Mục 1.3
Feature: Account/Identity
Module: Technical Debt
Confidence: High

---

# EPIC 4 — Membership & Tiering — [DELTA from v1.5]

## Story 4.1 (REVISED) — User: View & Compare Free / Pro / Premium Tiers

**User Story**
As a user, I want to compare Free, Pro, and Premium tiers side by side, so that I can decide whether to upgrade.

**Business Context**
Tier names changed from Free/Premium/Elite to **Free/Pro/Premium** per PO decision D2 — a full rebuild of the enum values, not a display-label change.

**Source Requirement**
BRD 3.4.1, 3.4.3

**Business Rules**
- Three tiers only: `free`, `pro`, `premium` (new enum values — data migration task required for any existing test records using the old `elite` value).
- Comparison screen sources limits/pricing from `plan_limits` (admin-configurable).

**Dependencies**
- Upstream: None.
- Downstream: Story 4.4 (upgrade flow), Story 14.x (Payment).
- External: None.
- Data: `plan_limits` collection, migrated enum values.

**Assumptions**
- Not specified in source.

**In Scope**
- Tier comparison UI reading from `plan_limits`.

**Out of Scope**
- Historical "Elite" tier — fully retired, no backward-compat mapping.

**Story Readiness Assessment**
Status: Ready

**Acceptance Coverage Preparation**
Happy Path, Data Migration Verification (old `elite` records correctly become `premium`).

**Traceability**
Requirement Reference: 3.4.1
Source Section: BRD v2.0 Mục 3.4
Feature: Membership
Module: Tiering
Confidence: High

---

## Story 4.6 (NEW) — System: Route AI Calls by (Feature, Tier) via AI Model Routing Config

**User Story**
As the system, I want to route every AI-touching call to a model selected by the combination of feature and the calling user's tier, so that Free users get cost-efficient AI while Pro/Premium users get upgraded quality from day one.

**Business Context**
This is the technical embodiment of the PO's AI Model Tiering strategy (BRD 3.4.6) — the single most consequential new architectural requirement in v2.0, since it touches every AI endpoint (clothing detection, enhancement, outfit recommendation, virtual try-on, style-profile analysis).

**Source Requirement**
BRD 3.4.6, 3.4.6.1–3.4.6.3, Section 9 Appendix

**Business Rules**
- Routing config lives in `admin_settings`, keyed by (`feature`, `tier`) → `modelId`/`fallbackModelId`, admin-editable without app redeploy.
- Free tier always resolves to the lowest-cost model class for every feature.
- Pro/Premium resolve to upgraded models for `clothing_enhance`, `outfit_recommend`, `virtual_tryon`, `style_profile_analyze` from MVP launch (no gate). `clothing_detection` stays on the cheap model class for all tiers (no quality benefit to upgrading it).
- On primary model failure, fall back to the next-lower-cost model for that feature; do not charge user quota for a fallback-served call; log `fallbackUsed: true`.
- Every AI call logs `modelUsed`, `costEstimate`, `fallbackUsed`, `tier` to `ai_logs`.

**Dependencies**
- Upstream: Story 4.1 (tier must exist on user record).
- Downstream: Story 2.2 (clothing detect), Story 2.3-equivalent (enhance), Story 3.2 (outfit recommend), Story 9.3 (try-on generate), Story 13.4 (style-profile analyze) — all must call through this routing layer instead of a hardcoded model.
- External: AI provider backend (external to reviewed repo) must support per-request model selection — **assumption**, not yet verified (BRD 1.3.4).
- Data: `admin_settings` new sub-collection/document shape; `ai_logs` schema extended with 4 new fields (Section 9).

**Assumptions**
- Assumption: the external AI provider backend can accept a model parameter per call. Risk Level: Medium. Reason: not verified in the reviewed codebase — flagged as BRD Assumption 1.3.4, needs Technical Lead confirmation before this story can be marked fully Ready.

**In Scope**
- Routing table read/apply logic, fallback logic, `ai_logs` field extension, Admin UI to edit routing config.

**Out of Scope**
- The exact `modelId` values themselves (OI-6, placeholder pending Technical Lead).

**Story Readiness Assessment**
Status: Partially Ready
Reason: Logic and data shape are fully specified; the underlying provider capability (per-call model selection) is an unverified assumption, and exact model IDs are a placeholder — both should be confirmed before sprint commitment.

**Acceptance Coverage Preparation**
Happy Path (per tier), Fallback (primary model failure), Cost Logging, Admin Config Change (no redeploy), Edge Case (unknown feature/tier combination — should default safely, not crash).

**Traceability**
Requirement Reference: 3.4.6
Source Section: BRD v2.0 Mục 3.4, Mục 9
Feature: Membership
Module: AI Model Routing
Confidence: Medium

---

# EPIC 5 — Missions & Rewards — [DELTA from v1.5]

## Story 5.8 (NEW) — User: Complete "Invite Friend" Mission via Referral Link

**User Story**
As a user, I want to share a unique referral link and get credit when a friend registers through it, so that I'm rewarded for growing the community.

**Business Context**
"Invite Friend" existed as a mission *type* in the data model but had no defined completion mechanism until this PO decision (referral link).

**Source Requirement**
BRD 1.4 OI-10, 3.5.3.3

**Business Rules**
- Each user has a unique `referralCode`/shareable link.
- Mission credits when a referred user registers via that link.
- Exact trigger — mere registration vs. registration + onboarding completion — is [TBD], to be confirmed before dev.

**Dependencies**
- Upstream: Story 1.1 (referred user must complete one of the 3 supported auth methods).
- Downstream: Story 5.4-equivalent (reward crediting, XP/badge/bonus quota).
- External: None.
- Data: **New** `referralCode` field on `users`; **new** `referrals` collection (`referrerId`, `referredUserId`, `status`, `createdAt`).

**Assumptions**
- Assumption: one referral credit per unique referred user (no cap stated). Risk Level: Low.

**In Scope**
- Referral link generation/sharing, referral tracking record, mission credit on trigger event.

**Out of Scope**
- Multi-level/tiered referral rewards (not mentioned in source).

**Story Readiness Assessment**
Status: Partially Ready
Reason: Mechanism (referral link) is confirmed; exact completion trigger and any anti-abuse rules (e.g., self-referral prevention) are not yet specified.

**Acceptance Coverage Preparation**
Happy Path, Edge Cases (self-referral attempt, same device re-registration), Data Model (new collection), Reward Crediting.

**Traceability**
Requirement Reference: 3.5.3.3
Source Section: BRD v2.0 Mục 3.5, OI-10
Feature: Missions & Rewards
Module: Referral
Confidence: Medium

---

*(Epics 2, 3, 6, 7, 8 carry forward unchanged from User Stories v1.5 — no deltas.)*

---

# EPIC 9 — Virtual Try-On *(NEW)*

## Story 9.1 — User: Select Outfit & Photo for Try-On

**User Story**
As a user, I want to select an outfit and my own photo, so that I can generate a virtual try-on image before deciding to wear or buy something.

**Business Context**
Entry point to the try-on feature; must work from both an AI-recommended outfit and a manually-assembled one.

**Source Requirement**
BRD 3.9.1

**Business Rules**
- Outfit source can be an AI recommendation (from 3.3) or a saved Outfit Library entry (3.15).
- Photo can be uploaded fresh or reused from a previous try-on session.

**Dependencies**
- Upstream: Story 3.2-equivalent (outfit recommendation) or Story 15.1 (Outfit Library).
- Downstream: Story 9.2 (scene selection), Story 9.3 (generation).
- External: Device camera/media library (Expo ImagePicker).
- Data: `tryOnSessions`-equivalent draft state (client-side until generation).

**Assumptions**
- Not specified in source.

**In Scope**
- Outfit selection, photo upload/selection.

**Out of Scope**
- Full-body pose correction/guidance (not mentioned in source).

**Story Readiness Assessment**
Status: Ready

**Acceptance Coverage Preparation**
Happy Path, Validation (photo required before proceeding).

**Traceability**
Requirement Reference: 3.9.1
Source Section: BRD v2.0 Mục 3.9
Feature: Virtual Try-On
Module: Input Selection
Confidence: High

---

## Story 9.2 — User: Choose a Try-On Scene

**User Story**
As a user, I want to choose a scene (beach, mountain, urban, party, casual, office) for my try-on image, so that the result feels contextually realistic.

**Business Context**
Differentiates Wardro's try-on from a plain studio-background competitor feature (e.g., FitRoom).

**Source Requirement**
BRD 3.9.1

**Business Rules**
- Exactly 6 scenes offered: beach, mountain, urban, party, casual, office.

**Dependencies**
- Upstream: Story 9.1.
- Downstream: Story 9.3.
- External: None.
- Data: `scene` field on the generation request.

**Assumptions**
- Not specified in source.

**In Scope**
- Scene picker UI with the 6 fixed options.

**Out of Scope**
- Custom/user-uploaded background scenes (not mentioned in source).

**Story Readiness Assessment**
Status: Ready

**Acceptance Coverage Preparation**
Happy Path, UI (all 6 scenes selectable).

**Traceability**
Requirement Reference: 3.9.1
Source Section: BRD v2.0 Mục 3.9
Feature: Virtual Try-On
Module: Scene Selection
Confidence: High

---

## Story 9.3 — System: Generate Virtual Try-On Image with Quota Enforcement

**User Story**
As a user, I want the system to generate my try-on image and correctly track my monthly quota, so that I know how many free generations I have left.

**Business Context**
The single most cost-sensitive feature in the entire app (image generation); quota logic must be airtight to protect unit economics.

**Source Requirement**
BRD 3.9.2, 3.9.2.1–3.9.2.2, 3.9.3, 3.9.4

**Business Rules**
- Free: 2 generations/calendar month, resetting on the 1st of the month.
- Pro/Premium: higher monthly allowance [TBD final numbers].
- Quota is NOT deducted on a failed/errored generation.
- On quota exhaustion: block generation, show "Bạn đã dùng hết lượt thử đồ miễn phí tháng này. Hoàn thành nhiệm vụ để nhận thêm lượt, hoặc nâng cấp Pro."
- Mission-earned bonus quota (Story 5.4.1-equivalent) stacks on top of the base monthly allowance.
- Model selection follows AI Model Routing (Story 4.6).

**Dependencies**
- Upstream: Story 9.1, 9.2, Story 4.6 (AI Model Routing).
- Downstream: Story 9.4 (save/share), Story 9.5 (save to Outfit Library).
- External: Backend AI proxy → image-gen provider (Nano Banana/Gemini image-gen class).
- Data: `tryOnUsageMonthly` counter per user, reset job at month boundary.

**Assumptions**
- Assumption: Pro/Premium exact quota numbers will be set by PO before launch. Risk Level: Low.

**In Scope**
- Generation call, quota check/decrement, quota reset logic, exhaustion messaging.

**Out of Scope**
- Real-time queue/wait-time display during generation (not mentioned in source).

**Story Readiness Assessment**
Status: Partially Ready
Reason: Free tier quota is fully confirmed (2/month, resets 1st); Pro/Premium exact numbers remain a placeholder pending PO/Technical Lead sign-off on Section 4.2 config table.

**Acceptance Coverage Preparation**
Happy Path, Quota Enforcement (exact boundary at 2nd use), Reset Timing (1st of month), Error Handling (no quota charge on failure), Business Rules (mission bonus stacking).

**Traceability**
Requirement Reference: 3.9.2, 3.9.3, 3.9.4
Source Section: BRD v2.0 Mục 3.9
Feature: Virtual Try-On
Module: Generation & Quota
Confidence: High (quota rule) / Medium (Pro/Premium numbers)

---

## Story 9.4 — User: Save or Share Try-On Result

**User Story**
As a user, I want to save my try-on image to my device or share it, so that I can show friends or use it to decide on a purchase.

**Business Context**
Turns a private utility into a viral/social touchpoint.

**Source Requirement**
BRD 3.9.5

**Business Rules**
- Save uses device MediaLibrary; share uses native Sharing API.

**Dependencies**
- Upstream: Story 9.3.
- Downstream: None.
- External: Expo MediaLibrary, Sharing API.
- Data: Generated image URL/blob.

**Assumptions**
- Not specified in source.

**In Scope**
- Save to device, native share sheet.

**Out of Scope**
- In-app social feed/posting (belongs to Community, not this story).

**Story Readiness Assessment**
Status: Ready

**Acceptance Coverage Preparation**
Happy Path, Permissions (media library access).

**Traceability**
Requirement Reference: 3.9.5
Source Section: BRD v2.0 Mục 3.9
Feature: Virtual Try-On
Module: Save & Share
Confidence: High

---

## Story 9.5 — User: Save Try-On Outfit to Outfit Library

**User Story**
As a user, I want to save the outfit I just tried on directly to my Outfit Library, so that I don't have to re-assemble it later.

**Business Context**
Closes the loop between Virtual Try-On and Outfit Library (Epic 15), avoiding a dead-end after generation.

**Source Requirement**
BRD 3.9.6

**Business Rules**
- Saving from try-on result creates/updates an `outfits` entry with `isSaved=true`.

**Dependencies**
- Upstream: Story 9.3.
- Downstream: Story 15.1 (Outfit Library list).
- External: None.
- Data: `outfits` collection.

**Assumptions**
- Not specified in source.

**In Scope**
- One-tap save from try-on result screen.

**Out of Scope**
- None identified.

**Story Readiness Assessment**
Status: Ready

**Acceptance Coverage Preparation**
Happy Path.

**Traceability**
Requirement Reference: 3.9.6
Source Section: BRD v2.0 Mục 3.9
Feature: Virtual Try-On
Module: Outfit Library Integration
Confidence: High

---

# EPIC 10 — Event Planner *(NEW)*

## Story 10.1 — User: Create an Event

**User Story**
As a user, I want to create an event with date, location, type, dress code, and mood, so that I can plan what to wear ahead of time.

**Source Requirement**
BRD 3.10.1

**Business Rules**
- Event type options: wedding, party, work, date, travel, casual, formal, other.

**Dependencies**
- Upstream: None. Downstream: Story 10.2, 10.4. External: None. Data: `events` collection.

**Assumptions:** Not specified in source.
**In Scope:** Event creation form with all listed fields.
**Out of Scope:** Calendar app sync (not mentioned in source).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Validation (required fields).

**Traceability**
Requirement Reference: 3.10.1 | Source Section: BRD v2.0 Mục 3.10 | Feature: Event Planner | Module: Event Creation | Confidence: High

---

## Story 10.2 — System: AI Outfit Suggestion for Event

**User Story**
As a user, I want AI to suggest outfits tailored to my event's dress code, so that I don't have to guess what's appropriate.

**Source Requirement**
BRD 3.10.2

**Business Rules**
- Uses the same Outfit Generator engine as Home Dashboard (3.3), with event context (dress code, weather style, mood) as additional AI input.
- Model selection follows AI Model Routing (Story 4.6).

**Dependencies**
- Upstream: Story 10.1, Story 4.6. Downstream: Story 10.3. External: Backend AI proxy. Data: `events` document fields passed as prompt context.

**Assumptions:** Not specified in source.
**In Scope:** Event-context-aware outfit recommendation call.
**Out of Scope:** None identified.

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Integration (Outfit Generator reuse), Error Handling (AI failure).

**Traceability**
Requirement Reference: 3.10.2 | Source Section: BRD v2.0 Mục 3.10 | Feature: Event Planner | Module: AI Suggestion | Confidence: High

---

## Story 10.3 — User: Link Saved Outfits to an Event

**User Story**
As a user, I want to link one or more saved outfits to an event, so that I can keep my plan organized in one place.

**Source Requirement**
BRD 3.10.3

**Business Rules**
- An event can have multiple linked outfits (`linkedOutfitIds` array).

**Dependencies**
- Upstream: Story 10.1, Story 15.1 (Outfit Library must have entries to link). Downstream: None. External: None. Data: `events.linkedOutfitIds`.

**Assumptions:** Not specified in source.
**In Scope:** Link/unlink outfits from event detail screen.
**Out of Scope:** None identified.

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Edge Case (unlink, multiple outfits).

**Traceability**
Requirement Reference: 3.10.3 | Source Section: BRD v2.0 Mục 3.10 | Feature: Event Planner | Module: Outfit Linking | Confidence: High

---

## Story 10.4 — System: Send Event Reminders

**User Story**
As a user, I want to be reminded before my event at multiple lead times, so that I have enough time to prepare my outfit.

**Source Requirement**
BRD 3.10.4

**Business Rules**
- Three independent reminders: 1 day before, 12 hours before, 4 hours before the event.
- All three fire unless the user has disabled event notifications entirely.

**Dependencies**
- Upstream: Story 10.1. Downstream: Epic 6 (Notifications, type `event`). External: Push notification service. Data: Scheduled notification jobs per event.

**Assumptions:** Not specified in source.
**In Scope:** 3-stage reminder scheduling and cancellation on event edit/delete.
**Out of Scope:** SMS/email reminder channels (push only, per existing Notification epic scope).

**Story Readiness Assessment:** Status: Ready
Reason: All three lead times are now PO-confirmed (no longer TBD).

**Acceptance Coverage Preparation:** Happy Path (all 3 fire), Edge Case (event edited/deleted — reminders rescheduled/cancelled), Settings (opt-out honored).

**Traceability**
Requirement Reference: 3.10.4 | Source Section: BRD v2.0 Mục 3.10 | Feature: Event Planner | Module: Reminders | Confidence: High

---

## Story 10.5 — User: Confirm Event as Worn *(NEW — v2.1, BRD 3.10.5, ADR-04/ADR-05)*

**User Story**
As a user, after an event has passed, I want to confirm in one action that I wore my planned outfit(s), so that my wardrobe wear-count analytics stay accurate without extra manual steps per outfit.

**Source Requirement**
BRD 3.10.5

**Business Rules**
- A wear-confirm banner appears once the event's `scheduledAt` has passed and `wearConfirmedAt` is still null.
- Confirming bulk-increments `timesWorn` on ALL outfits in `linkedOutfitIds`, and on each constituent item within those outfits — a single action, not a per-outfit flow (ADR-05: bulk scope chosen over per-outfit confirm for simpler UX).
- This is a **second, independent trigger** for `timesWorn`, alongside the existing Home Dashboard confirm-worn action (Story 15.5) — ADR-04. The two triggers are not deduplicated even if they reflect the same real-world wear; this is an accepted analytics imprecision, not a functional bug.
- Confirming sets `events.wearConfirmedAt` to a timestamp; this is a one-way transition (null → timestamp) — once set, it cannot be unset.
- The increment + timestamp-set operation is wrapped in a single Firestore transaction, so a duplicate/retried confirm request cannot double-increment `timesWorn` (idempotent by design, not just by convention).
- The user can instead dismiss the banner without confirming; dismissal sets a separate `wearPromptDismissed: true` flag (does NOT set `wearConfirmedAt`) so the banner does not reappear, but the event remains distinguishable from a confirmed one for any future analytics need.

**Dependencies**
- Upstream: Story 10.1 (event must exist), Story 10.3 (outfits must be linked to have anything to confirm). Downstream: Story 15.5 / Outfit Library `timesWorn` display, Admin Analytics (aggregate wear stats). External: None (client + Firestore transaction only). Data: `events.wearConfirmedAt`, `events.wearPromptDismissed`, `outfits.timesWorn`, `clothes.timesWorn`.

**Assumptions:** The banner-trigger check (`scheduledAt < now`) runs client-side on Home/Event screens on load; a server-side scheduled job also exists (reused from Story 10.4's reminder infrastructure) to drive a push-notification nudge for events left unconfirmed, per `13_api_spec.md`.
**In Scope:** Bulk confirm-all-linked action; idempotent transaction; dismiss-without-confirm path.
**Out of Scope:** Per-outfit confirmation within a single event (explicitly deferred per ADR-05); deduplication logic between Home confirm-worn and Event confirm-worn (explicitly not required per ADR-04).

**Story Readiness Assessment:** Status: Ready
Reason: Both ADR-04 (trigger sources = both, hybrid) and ADR-05 (bulk scope) are PO-confirmed decisions (2026-07-12), not open questions. `13_api_spec.md` already specifies the exact endpoints (`POST /api/events/:id/confirm-worn`, `POST /api/events/:id/skip-worn`) and `12_database_design.md` already specifies the exact schema (`events.wearConfirmedAt`) — this story reconciles the User Stories document with decisions already implemented downstream in Solution Architecture / DB Design / API Spec.

**Acceptance Coverage Preparation:** Happy Path (confirm → bulk increment fires once), Idempotency (duplicate confirm request → no double-increment, 409 or no-op), Dismiss Path (banner dismissed → no increment, doesn't reappear), Edge Case (event has zero linked outfits — banner should not show, or should show a distinct empty state rather than a confirm action with nothing to confirm).

**Traceability**
Requirement Reference: 3.10.5 | Source Section: BRD v2.2 Mục 3.10 | Feature: Event Planner | Module: Event, Outfit | Confidence: High

---

# EPIC 11 — Community / Marketplace ("Pass đồ") *(NEW)*

## Story 11.1 — User: Create a Listing from a Closet Item

**User Story**
As a user, I want to list a closet item for sale, trade, or giveaway, so that I can pass it along instead of letting it sit unused.

**Source Requirement**
BRD 3.11.1

**Business Rules**
- Listing type: sale/trade/giveaway; price required only for sale; condition, description, photos, size, location, tags all captured.

**Dependencies**
- Upstream: Epic 2 (item must exist in Closet). Downstream: Story 11.2 (moderation). External: Firebase Storage (photos). Data: `listings` collection, `status=pending_review` on create.

**Assumptions:** Not specified in source.
**In Scope:** Listing creation form from an existing closet item.
**Out of Scope:** Listing items not already in the user's digital closet (must originate from Closet).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Validation (price required for sale type only).

**Traceability**
Requirement Reference: 3.11.1 | Source Section: BRD v2.0 Mục 3.11 | Feature: Community/Marketplace | Module: Listing Creation | Confidence: High

---

## Story 11.2 — Admin: Approve or Reject a Listing

**User Story**
As an Admin, I want to review and approve or reject new listings, so that only appropriate content becomes publicly browsable.

**Source Requirement**
BRD 3.11.2, 3.11.2.1

**Business Rules**
- Every new listing starts `pending_review`, invisible to the public until approved.
- Rejection may include a `moderationNote` shown to the seller.

**Dependencies**
- Upstream: Story 11.1. Downstream: Story 11.3, 11.4, 11.6 (all require an approved listing). External: None. Data: `listings.status`, `moderationNote`.

**Assumptions:** Not specified in source.
**In Scope:** Admin approve/reject action with optional note.
**Out of Scope:** Automated/AI content moderation (not mentioned in source — fully manual for MVP).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path (both outcomes), Permissions (Admin-only), Notification (seller informed on rejection).

**Traceability**
Requirement Reference: 3.11.2 | Source Section: BRD v2.0 Mục 3.11 | Feature: Community/Marketplace | Module: Moderation | Confidence: High

---

## Story 11.3 — User: View Approved Listings (Including as Guest)

**User Story**
As a user or guest, I want to browse approved listings, so that I can find items I'm interested in.

**Source Requirement**
BRD 3.11.3

**Business Rules**
- Approved listings are visible to both authenticated users and guests (Section 3.16 public-read rule).

**Dependencies**
- Upstream: Story 11.2. Downstream: Story 11.4. External: None. Data: `listings` where `status=approved`.

**Assumptions:** Not specified in source.
**In Scope:** Public listing feed/detail, filter/search.
**Out of Scope:** Personalized listing ranking by AI (not mentioned in source for MVP).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Guest Access (no auth required to view).

**Traceability**
Requirement Reference: 3.11.3 | Source Section: BRD v2.0 Mục 3.11 | Feature: Community/Marketplace | Module: Browsing | Confidence: High

---

## Story 11.4 — User: Message a Seller or Submit a Trade Offer

**User Story**
As a user, I want to message a seller or propose a trade using one of my own items, so that I can negotiate before completing a transaction.

**Source Requirement**
BRD 3.11.4

**Business Rules**
- Trade offers may optionally reference one of the requesting user's own closet items.

**Dependencies**
- Upstream: Story 11.3. Downstream: Story 11.6 (transaction). External: None. Data: `marketplace_messages`, `trade_offers`.

**Assumptions:** Requires authentication (guest triggers sign-in prompt per Story 16.2).
**In Scope:** 1:1 messaging thread per listing, trade offer submission/response.
**Out of Scope:** Group chat, in-app voice/video (not mentioned in source).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path (message + trade offer), Permissions (auth required), Edge Case (offer withdrawn/declined).

**Traceability**
Requirement Reference: 3.11.4 | Source Section: BRD v2.0 Mục 3.11 | Feature: Community/Marketplace | Module: Messaging & Offers | Confidence: High

---

## Story 11.5 — User: Report a Listing

**User Story**
As a user, I want to report a listing that violates guidelines, so that Admin can review and take action.

**Source Requirement**
BRD 3.11.5

**Business Rules**
- Reports enter `status=open`, progress through Admin review: `reviewing → resolved/dismissed`.

**Dependencies**
- Upstream: Story 11.3. Downstream: Story 11.2-equivalent (Admin Moderation review). External: None. Data: `listing_reports`.

**Assumptions:** Not specified in source.
**In Scope:** Report submission with reason, Admin review workflow.
**Out of Scope:** Automatic listing takedown on report threshold (not mentioned in source — manual review only).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Admin Workflow (open→reviewing→resolved/dismissed).

**Traceability**
Requirement Reference: 3.11.5 | Source Section: BRD v2.0 Mục 3.11 | Feature: Community/Marketplace | Module: Reporting | Confidence: High

---

## Story 11.6 — System: Track Marketplace Transaction & Platform Fee

**User Story**
As the system, I want to record a transaction with computed platform fee and track its status progression, so that both parties and Admin have a clear record.

**Source Requirement**
BRD 3.11.6, 3.11.7

**Business Rules**
- Status progression: `pending → paid → shipped → handed_over → completed` (or `cancelled`).
- `platformFee` computed from `platformFeePercentage`.
- **No escrow in this phase** (explicitly deferred to Phase 2) — the system facilitates connection only; this limitation must be disclosed to the user before their first listing/purchase action.

**Dependencies**
- Upstream: Story 11.4. Downstream: Story 17.11 (Admin Transactions view). External: None. Data: `transactions`.

**Assumptions:** Not specified in source.
**In Scope:** Transaction record creation, status tracking, fee computation, pre-transaction escrow disclosure message.
**Out of Scope:** Escrow/secured fund holding (Phase 2).

**Story Readiness Assessment:** Status: Ready
Reason: No-escrow decision is now explicit (PO confirmed deferred to Phase 2), removing prior ambiguity.

**Acceptance Coverage Preparation:** Happy Path (full status chain), Business Rules (fee calc), Disclosure (escrow limitation shown), Edge Case (cancellation mid-flow).

**Traceability**
Requirement Reference: 3.11.6, 3.11.7 | Source Section: BRD v2.0 Mục 3.11 | Feature: Community/Marketplace | Module: Transactions | Confidence: High

---

# EPIC 12 — AI Shopping Assistant & Affiliate *(NEW)*

## Story 12.1 — System: Surface Affiliate Suggestions from Wardrobe Gaps

**User Story**
As a user, I want to see relevant product suggestions when the AI notices something missing from my wardrobe for a recommended outfit, so that shopping feels like a natural extension of styling.

**Source Requirement**
BRD 3.12.1

**Business Rules**
- Triggered by `missingItems` output from Outfit Generator (3.3.2.1).

**Dependencies**
- Upstream: Story 3.2-equivalent (Outfit Generator `missingItems`). Downstream: Story 12.3 (tracking). External: Affiliate product feed. Data: `affiliate_products`, `outfits.missingItems`.

**Assumptions:** Not specified in source.
**In Scope:** Inline suggestion surfacing tied to a specific outfit recommendation.
**Out of Scope:** Full e-commerce checkout in-app (facilitation/affiliate link only, per Product Vision — Wardro does not compete with Shopee/Lazada directly).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Edge Case (no matching affiliate product available).

**Traceability**
Requirement Reference: 3.12.1 | Source Section: BRD v2.0 Mục 3.12 | Feature: Shopping & Affiliate | Module: Suggestion Engine | Confidence: High

---

## Story 12.2 — User: Browse Shopping Screen

**User Story**
As a user, I want a dedicated Shopping screen with affiliate products relevant to my style, so that I can browse beyond just gap-filling suggestions.

**Source Requirement**
BRD 3.12.2

**Business Rules**
- Filterable/relevant to the user's style profile (Epic 13).

**Dependencies**
- Upstream: Story 13.1 (style profile must exist for relevance). Downstream: Story 12.3. External: None. Data: `affiliate_products`.

**Assumptions:** Not specified in source.
**In Scope:** Shopping tab/screen with filtering.
**Out of Scope:** In-app purchase/cart (affiliate redirect only).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Guest Access (public read per Section 3.16).

**Traceability**
Requirement Reference: 3.12.2 | Source Section: BRD v2.0 Mục 3.12 | Feature: Shopping & Affiliate | Module: Browsing | Confidence: High

---

## Story 12.3 — System: Track Shopping Events

**User Story**
As the system, I want to track affiliate clicks, product impressions, and community item clicks, so that Admin can measure conversion and revenue.

**Source Requirement**
BRD 3.12.3

**Business Rules**
- Event types: `affiliate_click`, `product_impression`, `community_item_click`.
- Tagged with `source` (`ai_stylist`/`shopping`/`community`) and, where applicable, `recommendationId`/`outfitId`.

**Dependencies**
- Upstream: Story 12.1, 12.2. Downstream: Story 12.4, Story 17.10 (Admin Affiliate). External: None. Data: `shopping_events`.

**Assumptions:** Not specified in source.
**In Scope:** Event logging on suggestion display/click.
**Out of Scope:** Real-time conversion attribution across multiple sessions (not mentioned in source).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path (all 3 event types), Data Integrity (correct `source` tagging).

**Traceability**
Requirement Reference: 3.12.3 | Source Section: BRD v2.0 Mục 3.12 | Feature: Shopping & Affiliate | Module: Event Tracking | Confidence: High

---

## Story 12.4 — Admin: Manage Affiliate Products & View Revenue

**User Story**
As an Admin, I want to add, edit, and deactivate affiliate products and see clicks/conversions/estimated revenue, so that I can manage this monetization channel.

**Source Requirement**
BRD 3.12.4

**Business Rules**
- Revenue displayed in VNĐ.

**Dependencies**
- Upstream: Story 12.3 (event data feeds reporting). Downstream: None. External: None. Data: `affiliate_products`, aggregated `shopping_events`.

**Assumptions:** Not specified in source.
**In Scope:** Admin CRUD for products, aggregate reporting view.
**Out of Scope:** Automated affiliate network API sync (not mentioned in source — manual product entry for MVP).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Permissions (Admin-only), Reporting Accuracy.

**Traceability**
Requirement Reference: 3.12.4 | Source Section: BRD v2.0 Mục 3.12 | Feature: Shopping & Affiliate | Module: Admin Management | Confidence: High

---

# EPIC 13 — Style Profile & Advanced Style Preferences *(NEW — full MVP)*

## Story 13.1 — User: Complete Initial Style Survey

**User Story**
As a new user, I want to complete a quick style quiz on first login, so that the app can start personalizing outfit suggestions right away.

**Source Requirement**
BRD 3.13.1, 3.13.1.1

**Business Rules**
- Captures: preferred styles, favorite colors, lifestyle/occasions, fashion confidence level, gender, age group, disliked colors.
- Skipping is allowed; still sets `hasCompletedStyleSurvey=true` + `styleSurveySkipped=true` so the user isn't re-prompted every session.

**Dependencies**
- Upstream: Story 1.1 (first login). Downstream: Story 3.2-equivalent (Outfit Generator consumes this data), Story 5.x (Mission tie-in). External: None. Data: `users` style-profile fields.

**Assumptions:** Not specified in source.
**In Scope:** Initial survey flow with skip option.
**Out of Scope:** Multi-language survey (Vietnamese only, per NFR).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Skip Path, Data Persistence.

**Traceability**
Requirement Reference: 3.13.1 | Source Section: BRD v2.0 Mục 3.13 | Feature: Style Profile | Module: Initial Survey | Confidence: High

---

## Story 13.2 — User: Edit Style Preferences Later

**User Story**
As a user, I want to edit my style preferences after onboarding, so that my recommendations stay accurate as my taste changes.

**Source Requirement**
BRD 3.13.2

**Business Rules**
- Accessible from Profile ("Chỉnh sửa gu thời trang").

**Dependencies**
- Upstream: Story 13.1. Downstream: Story 3.2-equivalent (updated data used on next recommendation). External: None. Data: Same fields as 13.1, editable.

**Assumptions:** Not specified in source.
**In Scope:** Edit-mode survey form.
**Out of Scope:** Version history of preference changes (not mentioned in source).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Edit vs. Initial mode distinction.

**Traceability**
Requirement Reference: 3.13.2 | Source Section: BRD v2.0 Mục 3.13 | Feature: Style Profile | Module: Edit Preferences | Confidence: High

---

## Story 13.3 — User: Complete Advanced Style Preferences (Body & Sizing)

**User Story**
As a user, I want to provide my body measurements, sizes, favorite brands, budget, and fit preference, so that AI Stylist recommendations and virtual try-on results are genuinely relevant to me.

**Business Context**
Confirmed full MVP scope per PO decision (not deferred to Phase 2) — this is direct input to the AI Stylist prompt, not a cosmetic personalization layer.

**Source Requirement**
BRD 3.13.3, 3.13.3.1

**Business Rules**
- Fields: body shape, height (cm), weight (kg), top size, bottom size, shoe size, favorite brands, budget level, fit preference, styles to avoid, disliked colors.
- This data feeds directly into Outfit Generator (3.3) and Virtual Try-On (3.9) AI prompts.

**Dependencies**
- Upstream: Story 13.1. Downstream: Story 3.2-equivalent, Story 9.3 (try-on prompt input), Story 13.5 (style-profile AI analysis). External: None. Data: `AdvancedStylePreferences` sub-document.

**Assumptions:** Not specified in source.
**In Scope:** Full advanced preferences form (all fields above), accessible from Profile.
**Out of Scope:** Body scanning/AR measurement capture (manual numeric entry only, not mentioned in source).

**Story Readiness Assessment:** Status: Ready
Reason: PO explicitly confirmed full scope (not partial) — this was the one area where the original spec had considered deferring to Phase 2; that ambiguity is now resolved.

**Acceptance Coverage Preparation:** Happy Path, Validation (numeric ranges for height/weight), Data Privacy (sensitive body data handling — cross-check against 3.1.7 deletion scope).

**Traceability**
Requirement Reference: 3.13.3 | Source Section: BRD v2.0 Mục 3.13 | Feature: Style Profile | Module: Advanced Preferences | Confidence: High

---

## Story 13.4 — System: Calculate Style Profile Completion %

**User Story**
As a user, I want to see how complete my style profile is, so that I'm encouraged to fill in the rest for better recommendations.

**Source Requirement**
BRD 3.13.4

**Business Rules**
- `styleProfileCompletionPercent` ties into Mission 5.x ("Complete Style/Color Preference").

**Dependencies**
- Upstream: Story 13.1, 13.3. Downstream: Story 5.x (Missions). External: None. Data: Computed field, not stored raw (or cached).

**Assumptions:** Not specified in source.
**In Scope:** Progress indicator on Profile screen.
**Out of Scope:** None identified.

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Calculation Accuracy (weighted fields vs. simple field count — [TBD which method]).

**Traceability**
Requirement Reference: 3.13.4 | Source Section: BRD v2.0 Mục 3.13 | Feature: Style Profile | Module: Completion Tracking | Confidence: Medium

---

## Story 13.5 — System: AI Style Profile Analysis

**User Story**
As a user, I want the AI to analyze my style survey answers into a structured summary, so that I get a clear picture of my personal style before I even use the Outfit Generator.

**Source Requirement**
BRD 3.13.5

**Business Rules**
- Calls `POST /api/ai/style-profile/analyze`, returns `StyleProfile` (summary, primary styles, preferred colors, recommendations).
- Model selection follows AI Model Routing (Story 4.6).

**Dependencies**
- Upstream: Story 13.1, Story 4.6. Downstream: Story 3.2-equivalent (feeds Outfit Generator). External: Backend AI proxy. Data: `StyleProfile` result stored on `users`.

**Assumptions:** Not specified in source.
**In Scope:** AI analysis call and result display.
**Out of Scope:** Re-running analysis automatically on every minor edit (only re-runs on explicit user action or significant profile change — [TBD threshold]).

**Story Readiness Assessment:** Status: Partially Ready
Reason: Core flow clear; re-analysis trigger threshold is undefined.

**Acceptance Coverage Preparation:** Happy Path, Error Handling (AI failure), Integration (Model Routing).

**Traceability**
Requirement Reference: 3.13.5 | Source Section: BRD v2.0 Mục 3.13 | Feature: Style Profile | Module: AI Analysis | Confidence: High

---

# EPIC 14 — Payment & Billing *(NEW)*

## Story 14.1 — User: Select Payment Method (VNPay or MoMo)

**User Story**
As a user, I want to choose VNPay or MoMo when upgrading my membership, so that I can pay using a method common in Vietnam.

**Source Requirement**
BRD 3.14.1, 3.14.2

**Business Rules**
- VNPay and MoMo are the only active payment methods at launch.
- Apple Pay/Google Pay exist as UI/constants but are NOT presented as active options until Phase 1.1.

**Dependencies**
- Upstream: Story 4.1 (tier selection). Downstream: Story 14.2. External: VNPay, MoMo merchant integration. Data: `payment/prepare` order draft.

**Assumptions:** Not specified in source.
**In Scope:** Payment method selection UI limited to 2 active options.
**Out of Scope:** Apple Pay/Google Pay activation (Phase 1.1).

**Story Readiness Assessment:** Status: Partially Ready
Reason: Method priority is confirmed; exact integration mode (redirect vs. SDK) is OI-7, still open.

**Acceptance Coverage Preparation:** Happy Path (both methods), UI (Apple/Google Pay hidden, not just disabled).

**Traceability**
Requirement Reference: 3.14.1 | Source Section: BRD v2.0 Mục 3.14 | Feature: Payment & Billing | Module: Method Selection | Confidence: Medium

---

## Story 14.2 — System: Process Payment & Apply Tier Change

**User Story**
As the system, I want to update the user's tier and AI routing immediately on payment success, so that the upgrade takes effect without delay.

**Source Requirement**
BRD 3.14.3, 3.14.4, 3.14.5

**Business Rules**
- On success: update `plan`, create/update `subscriptions`, immediately apply new AI Model Routing tier (Story 4.6).
- On failure/cancellation: no plan change, clear failure message, no partial state.

**Dependencies**
- Upstream: Story 14.1. Downstream: Story 4.6 (routing takes effect), Story 4.x (renewal reminders). External: VNPay/MoMo callback. Data: `subscriptions`, `users.plan`.

**Assumptions:** Not specified in source.
**In Scope:** Success/failure handling, atomic tier update.
**Out of Scope:** Partial refund logic (not mentioned in source).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Failure Path (no partial state), Integration (routing takes effect immediately — verify via Story 4.6's next AI call).

**Traceability**
Requirement Reference: 3.14.3–3.14.5 | Source Section: BRD v2.0 Mục 3.14 | Feature: Payment & Billing | Module: Transaction Processing | Confidence: High

---

## Story 14.3 — Admin: View Payment & Financial Reports

**User Story**
As an Admin, I want to view payment and transaction reports, so that I can monitor revenue and reconcile with provider statements.

**Source Requirement**
BRD 3.14.6

**Business Rules**
- Not specified in source (report layout TBD, Section 6.2).

**Dependencies**
- Upstream: Story 14.2. Downstream: None. External: None. Data: `subscriptions`, `transactions`.

**Assumptions:** Not specified in source.
**In Scope:** Admin > Payments & Finance report view.
**Out of Scope:** Automated reconciliation with VNPay/MoMo settlement files (not mentioned in source).

**Story Readiness Assessment:** Status: Partially Ready
Reason: Existence of the report is confirmed; exact layout/metrics are TBD (Section 6.2).

**Acceptance Coverage Preparation:** Happy Path, Permissions (Admin-only).

**Traceability**
Requirement Reference: 3.14.6 | Source Section: BRD v2.0 Mục 3.14, Mục 6.2 | Feature: Payment & Billing | Module: Admin Reporting | Confidence: Medium

---

# EPIC 15 — Outfit Library Management *(NEW)*

## Story 15.1 — User: View Saved Outfits List

**User Story**
As a user, I want to see a list of all my saved outfits, so that I can quickly find one to wear again.

**Source Requirement**
BRD 3.15.1

**Dependencies**
- Upstream: Story 3.2-equivalent, Story 9.5 (outfits get saved from these sources). Downstream: Story 15.2. Data: `outfits` where `userId` matches and `status=active`.

**Assumptions:** Not specified in source.
**In Scope:** List view with basic filtering (favorite, recently worn).
**Out of Scope:** None identified.

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Empty State.

**Traceability**
Requirement Reference: 3.15.1 | Source Section: BRD v2.0 Mục 3.15 | Feature: Outfit Library | Module: List View | Confidence: High

---

## Story 15.2 — User: View Outfit Detail

**User Story**
As a user, I want to view an outfit's full detail including AI explanation and matching scores, so that I understand why it was recommended.

**Source Requirement**
BRD 3.15.2

**Dependencies**
- Upstream: Story 15.1. Downstream: None. Data: `outfits` detail fields (`aiExplanation`, `weatherCompatibility`, `colorMatching`, `styleMatching`, `matchingScore`).

**Assumptions:** Not specified in source.
**In Scope:** Detail screen with constituent items and AI reasoning.
**Out of Scope:** None identified.

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path.

**Traceability**
Requirement Reference: 3.15.2 | Source Section: BRD v2.0 Mục 3.15 | Feature: Outfit Library | Module: Detail View | Confidence: High

---

## Story 15.3 — User: Mark Outfit as Favorite / Saved

**User Story**
As a user, I want to mark an outfit as favorite, so that I can find my best combinations quickly.

**Source Requirement**
BRD 3.15.3

**Dependencies**
- Upstream: Story 15.1. Downstream: None. Data: `outfits.isFavorite`, `isSaved`.

**Assumptions:** Not specified in source.
**In Scope:** Toggle favorite/saved flags.
**Out of Scope:** None identified.

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Toggle behavior.

**Traceability**
Requirement Reference: 3.15.3 | Source Section: BRD v2.0 Mục 3.15 | Feature: Outfit Library | Module: Favorites | Confidence: High

---

## Story 15.4 — User: Hide or Remove an Outfit

**User Story**
As a user, I want to hide or remove an outfit without deleting the underlying closet items, so that I can declutter my library without losing my clothes data.

**Source Requirement**
BRD 3.15.4

**Business Rules**
- `status` field: `active`/`hidden`/`removed`; underlying closet items are never affected by this action.

**Dependencies**
- Upstream: Story 15.1. Downstream: None. Data: `outfits.status`.

**Assumptions:** Not specified in source.
**In Scope:** Hide/remove actions, independent of closet item deletion.
**Out of Scope:** Permanent hard-delete (soft status change only, per source).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Data Integrity (closet items unaffected).

**Traceability**
Requirement Reference: 3.15.4 | Source Section: BRD v2.0 Mục 3.15 | Feature: Outfit Library | Module: Removal | Confidence: High

---

## Story 15.5 — System: Track Times Worn

**User Story**
As the system, I want to increment an outfit's worn count when the user confirms wearing it, so that wardrobe analytics stay accurate.

**Source Requirement**
BRD 3.15.5, 3.3.4

**Dependencies**
- Upstream: Story 3.4-equivalent ("Confirm as worn" action on Home Dashboard). Downstream: Analytics (Story 17.16). Data: `outfits.timesWorn`, `clothes.timesWorn`.

**Assumptions:** Not specified in source.
**In Scope:** Increment logic on confirm-worn action.
**Out of Scope:** None identified.

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Data Integrity (both outfit- and item-level counters increment together).

**Traceability**
Requirement Reference: 3.15.5 | Source Section: BRD v2.0 Mục 3.15 | Feature: Outfit Library | Module: Wear Tracking | Confidence: High

---

# EPIC 16 — Guest / Public Browsing Mode *(NEW)*

## Story 16.1 — Guest: Browse Public Content Without Authentication

**User Story**
As a visitor who hasn't signed up, I want to browse plans, trends, affiliate products, and approved listings, so that I can evaluate the app before committing to registration.

**Source Requirement**
BRD 3.16.1

**Business Rules**
- Read access limited to: active `plan_limits`, active `missions`, published `trends`, active `affiliate_products`, `approved` `listings`.

**Dependencies**
- Upstream: None. Downstream: Story 16.2. External: None. Data: Firestore rules enforcing public-read scope.

**Assumptions:** Not specified in source.
**In Scope:** Guest-mode read access to the 5 listed data types.
**Out of Scope:** Any private/user-specific data (never exposed to guests).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Security (Firestore rules block all other reads for unauthenticated requests).

**Traceability**
Requirement Reference: 3.16.1 | Source Section: BRD v2.0 Mục 3.16 | Feature: Guest Mode | Module: Public Read Access | Confidence: High

---

## Story 16.2 — Guest: Prompted to Sign In on Restricted Action

**User Story**
As a guest, I want to be clearly prompted to sign in when I try to do something that requires an account, so that I understand why I can't proceed rather than hitting a silent failure.

**Source Requirement**
BRD 3.16.2

**Business Rules**
- Applies to: upload, save, message, offer, mission completion, AI generation.

**Dependencies**
- Upstream: Story 16.1. Downstream: Story 1.1 (sign-in flow). External: None. Data: `isPublicViewer` flag check before each restricted action.

**Assumptions:** Not specified in source.
**In Scope:** `GuestAuthModal` trigger on all listed restricted actions.
**Out of Scope:** None identified.

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path (modal shown), Negative Test (no silent failures on any restricted action).

**Traceability**
Requirement Reference: 3.16.2 | Source Section: BRD v2.0 Mục 3.16 | Feature: Guest Mode | Module: Auth Gate | Confidence: High

---

## Story 16.3 — Guest: Resume Prior Action After Sign-In

**User Story**
As a guest who just signed in, I want to return to what I was doing, so that I don't have to start over from Home.

**Source Requirement**
BRD 3.16.3

**Dependencies**
- Upstream: Story 16.2, Story 1.1. Downstream: None. Data: Client-side navigation state (e.g., pending deep link) preserved across the auth modal.

**Assumptions:** Not specified in source.
**In Scope:** Resume-to-prior-screen behavior "where feasible."
**Out of Scope:** Guaranteed resume for every possible action (best-effort per source wording "where feasible" — not a hard guarantee).

**Story Readiness Assessment:** Status: Partially Ready
Reason: "Where feasible" is not a testable boundary on its own — needs a concrete list of which actions guarantee resume vs. which fall back to Home before QA can verify completeness.

**Acceptance Coverage Preparation:** Happy Path (simple case: viewing a listing), Edge Case (complex in-progress action, e.g., mid-upload).

**Traceability**
Requirement Reference: 3.16.3 | Source Section: BRD v2.0 Mục 3.16 | Feature: Guest Mode | Module: Post-Auth Resume | Confidence: Medium

---

# EPIC 17 — Admin CMS *(Expanded scope)*

## Story 17.1 — Admin: Manage Users (Filter, Suspend, Adjust Quota)

**User Story**
As an Admin, I want to view, filter, and manage user accounts, so that I can support users and enforce policy.

**Source Requirement**
BRD 3.17.1

**Business Rules**
- Filter by plan, style survey status, account status (active/suspended/banned).
- Admin can suspend/activate, reset plan, manually adjust AI quota.

**Dependencies**
- Upstream: Epic 1. Downstream: Story 17.13 (audit log of these actions). External: None. Data: `users`.

**Assumptions:** Not specified in source.
**In Scope:** List/filter/detail/action UI as described.
**Out of Scope:** Bulk user actions (not mentioned in source).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Permissions (RBAC), Audit Trail (action logged).

**Traceability**
Requirement Reference: 3.17.1 | Source Section: BRD v2.0 Mục 3.17 | Feature: Admin CMS | Module: User Management | Confidence: High

---

## Story 17.2 — Admin: RBAC Management of Admin Users

**User Story**
As a super-admin, I want to manage other admin accounts and their permission roles, so that access is properly scoped by responsibility.

**Source Requirement**
BRD 3.17.2

**Dependencies**
- Upstream: None. Downstream: All other Admin stories (role gates their access). Data: `adminUsers`.

**Assumptions:** Exact role list/permission matrix not specified in source — [TBD].
**In Scope:** Admin user CRUD, role assignment.
**Out of Scope:** SSO/enterprise identity federation (not mentioned in source).

**Story Readiness Assessment:** Status: Partially Ready
Reason: RBAC mechanism exists in code; the exact role-to-permission matrix is not specified anywhere in source and needs definition before this can be fully built out.

**Acceptance Coverage Preparation:** Happy Path, Permissions (only super-admin can manage roles).

**Traceability**
Requirement Reference: 3.17.2 | Source Section: BRD v2.0 Mục 3.17 | Feature: Admin CMS | Module: RBAC | Confidence: Medium

---

## Story 17.3 — Admin: Manage Membership Tier Limits

**User Story**
As an Admin, I want to configure per-tier quotas and pricing, so that I can adjust the business model without an app release.

**Source Requirement**
BRD 3.17.3, Section 4.2

**Dependencies**
- Upstream: Story 4.1. Downstream: All tier-gated features. Data: `plan_limits`.

**Assumptions:** Not specified in source.
**In Scope:** CRUD on `plan_limits` fields (Section 4.2 table).
**Out of Scope:** A/B testing different pricing to different user segments (not mentioned in source).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Validation (no negative/invalid quota values).

**Traceability**
Requirement Reference: 3.17.3 | Source Section: BRD v2.0 Mục 3.17, Mục 4.2 | Feature: Admin CMS | Module: Membership Config | Confidence: High

---

## Story 17.4 — Admin: CMS Content Management

**User Story**
As an Admin, I want to manage home banners, onboarding slides, FAQ, legal pages, and seasonal collections, so that I can update app content without a release.

**Source Requirement**
BRD 3.17.8

**Business Rules**
- Content status: draft/published/archived.

**Dependencies**
- Upstream: None. Downstream: Home Dashboard, Onboarding (content consumers). Data: `cms_content`.

**Assumptions:** Not specified in source.
**In Scope:** CRUD + status workflow for all 5 content types.
**Out of Scope:** Rich WYSIWYG editing beyond what's needed for FAQ/legal text (basic formatting only, not specified further in source).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Status Workflow (draft→published→archived), Consumer Integration (Home Dashboard reflects published content).

**Traceability**
Requirement Reference: 3.17.8 | Source Section: BRD v2.0 Mục 3.17 | Feature: Admin CMS | Module: Content Management | Confidence: High

---

## Story 17.5 — Admin: Security & Audit Log

**User Story**
As an Admin, I want to see a log of login events, failed logins, and admin actions, so that I can investigate incidents and maintain an audit trail.

**Source Requirement**
BRD 3.17.13

**Dependencies**
- Upstream: All Admin action stories (17.1, 17.3, 17.4, etc. — each must log to this). Downstream: None. Data: `admin_logs`.

**Assumptions:** Not specified in source.
**In Scope:** Log viewer with filter by admin/action type/date.
**Out of Scope:** Automated anomaly/intrusion detection (not mentioned in source — passive log only for MVP).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Completeness (every state-changing Admin action produces a log entry).

**Traceability**
Requirement Reference: 3.17.13 | Source Section: BRD v2.0 Mục 3.17 | Feature: Admin CMS | Module: Security & Audit | Confidence: High

---

## Story 17.6 — Admin: Support Ticket Management

**User Story**
As an Admin, I want to manage support tickets from open to closed, so that user issues get resolved and tracked.

**Source Requirement**
BRD 3.17.14

**Business Rules**
- Status: open/in_progress/resolved/closed.

**Dependencies**
- Upstream: None (tickets may originate from in-app support form — not detailed further in source). Downstream: None. Data: `support_tickets`.

**Assumptions:** In-app ticket submission flow (user-facing side) is assumed to exist but is not detailed in source — [TBD].
**In Scope:** Admin-side ticket triage and status management.
**Out of Scope:** Live chat support (not mentioned in source).

**Story Readiness Assessment:** Status: Partially Ready
Reason: Admin-side management is clear; the user-facing ticket submission flow is not specified anywhere in source.

**Acceptance Coverage Preparation:** Happy Path, Status Transitions.

**Traceability**
Requirement Reference: 3.17.14 | Source Section: BRD v2.0 Mục 3.17 | Feature: Admin CMS | Module: Support | Confidence: Medium

---

## Story 17.7 — Admin: Analytics Dashboard

**User Story**
As an Admin, I want a single dashboard showing total/active users, membership conversion %, and daily AI usage, so that I can monitor product health at a glance.

**Source Requirement**
BRD 3.7.4, 3.17.16

**Dependencies**
- Upstream: All feature areas feed this dashboard's metrics. Downstream: None. Data: Aggregated from `users`, `subscriptions`, `ai_logs`.

**Assumptions:** Not specified in source.
**In Scope:** The 4 named KPIs at minimum.
**Out of Scope:** Custom/configurable dashboard widgets (fixed KPI set for MVP, per source).

**Story Readiness Assessment:** Status: Ready

**Acceptance Coverage Preparation:** Happy Path, Data Accuracy (cross-check against raw collections).

**Traceability**
Requirement Reference: 3.7.4 | Source Section: BRD v2.0 Mục 3.7, Mục 3.17 | Feature: Admin CMS | Module: Analytics | Confidence: High

---

*(Admin sub-areas 3.17.5 Community, 3.17.6 Moderation, 3.17.9 Trends, 3.17.10 Affiliate, 3.17.11 Transactions, 3.17.12 Payments, 3.17.15 Outfits are each already covered as the Admin-facing half of their respective feature-area stories above — Story 11.2/11.5, Story 3.8.4-equivalent, Story 12.4, Story 11.6/17.11, Story 14.3, Story 15.x curation — and are not duplicated here as standalone stories to avoid double-counting the same requirement under two epics.)*

---

## Summary — Story Count by Epic

| Epic | New/Changed Stories in v2.0 | Carried Forward Unchanged from v1.5 |
|---|---|---|
| 1. Account & Identity | 2 (1.1 revised, 1.9 new) | Yes — remainder unchanged |
| 2. AI Closet | 0 | Yes — fully unchanged |
| 3. Home Dashboard | 0 | Yes — fully unchanged |
| 4. Membership & Tiering | 2 (4.1 revised, 4.6 new) | Yes — remainder unchanged |
| 5. Missions & Rewards | 1 (5.8 new) | Yes — remainder unchanged |
| 6. Notifications | 0 | Yes — fully unchanged |
| 7. Admin & AI Cost Monitoring | 0 | Yes — fully unchanged |
| 8. Fashion Knowledge Base | 0 | Yes — fully unchanged |
| 9. Virtual Try-On | 5 (all new) | N/A |
| 10. Event Planner | 4 (all new) | N/A |
| 11. Community/Marketplace | 6 (all new) | N/A |
| 12. Shopping & Affiliate | 4 (all new) | N/A |
| 13. Style Profile & Advanced Prefs | 5 (all new) | N/A |
| 14. Payment & Billing | 3 (all new) | N/A |
| 15. Outfit Library | 5 (all new) | N/A |
| 16. Guest Mode | 3 (all new) | N/A |
| 17. Admin CMS (net-new standalone stories) | 7 (all new) | N/A |
| **Total new/changed stories in v2.0** | **47** | **34 carried forward from v1.5** |

**Grand total Phase 1 backlog: 81 user stories across 17 epics.**

---

## Review Checkpoint

User Stories v2.0 (Phase 1) ready for review. Please confirm:

[ ] Delta approach for Epics 1, 4, 5 is acceptable (only changed stories shown, rest inherited from v1.5)
[ ] Epics 9–17 story breakdown and granularity are approved
[ ] Story 4.6 (AI Model Routing) correctly captures the tiering strategy
[ ] Story 5.8 (Referral) and its new data model addition are acceptable scope
[ ] Admin CMS story consolidation (Story 17.1–17.7 + cross-references) avoids duplicate coverage acceptably

Reply **"approved"** to proceed to `/acceptance-criteria-generator`, or provide corrections.
