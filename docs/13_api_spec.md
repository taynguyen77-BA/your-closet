# API Specification — Wardro

Version: 1.0
Date: 2026-07-12
Base: Next.js API Routes, all under `/api/*`. Auth: Firebase ID token (`Authorization: Bearer <token>`) on every non-public endpoint. Errors: `{ error: { code, message, details? } }`.

---

## Domain: Auth (`/api/auth/*`)
Mostly client-SDK-driven (Firebase Auth handles sign-in directly); backend endpoints are thin.

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/session/verify` | Verify ID token, return user profile + tier | Bearer token |
| POST | `/api/auth/guest/session` | Initialize a Guest Mode session flag | None (public) |
| DELETE | `/api/auth/account` | Full account deletion (BRD 3.1.7) — cascades per Database Design doc | Bearer token |

---

## Domain: Wardrobe (`/api/wardrobe/*`)

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| POST | `/api/wardrobe/upload` | Validate and upload one wardrobe image to the caller's Storage namespace | Bearer | Server generates the Storage path; JPEG/PNG/WebP, max 10 MB |
| GET | `/api/wardrobe/items` | List user's items (filter/search query params) | Bearer | |
| POST | `/api/wardrobe/items` | Persist one reviewed wardrobe item | Bearer | Idempotent; enforces `plan_limits.closetItems` and server ownership |
| GET | `/api/wardrobe/items/:id` | Item detail — includes `timesWorn` for Item Detail screen stat | Bearer | Owner-scoped |
| PATCH | `/api/wardrobe/items/:id` | Edit metadata (tags, favorite, and other approved fields) | Bearer | Image references cannot be replaced through metadata PATCH |
| DELETE | `/api/wardrobe/items/:id` | Delete item | Bearer | Owner-scoped; triggers Storage cleanup and records a pending cleanup marker on failure |

`GET /api/wardrobe/items` accepts backward-compatible deterministic query parameters: `category`, `subcategory`, `color`, `style`, `season`, `occasion`, `search`, `status` (`active|archived`), `sort` (`newest|oldest|name_asc|name_desc|wear_count_desc|wear_count_asc`), `limit` (1–50, default 24), and numeric `cursor`. The response retains the standard `{ data, meta }` envelope and adds `meta.total`, `meta.cursor`, and `meta.facets.categories/colors`. Query ownership is always derived from the authenticated server identity; a client `userId` is not accepted as a source of collection scope.

---

## Domain: AI (`/api/ai/*`) — all routed through AI Routing resolver

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| POST | `/api/ai/clothing/detect` | Detect category/color/material/style/season/tags | Bearer | Routes via `resolveModel('clothing_detection', tier)`; retry x3 (BRD 3.2.2.2) |
| POST | `/api/ai/clothing/analyze-and-enhance` | Return `enhancedImageCandidates[]` + `qualityWarnings[]` | Bearer | Candidate count per tier (Section 4.2) |
| POST | `/api/ai/outfit/recommend` | Generate outfit suggestion (weather+wardrobe+style+event context) | Bearer | Quota-checked against `plan_limits.aiMonthly` |
| POST | `/api/ai/tryon/generate` | Generate try-on image | Bearer | Quota-checked against `plan_limits.tryOnMonthly`; 15–20s target |
| POST | `/api/ai/style-profile/analyze` | Analyze advanced style preferences | Bearer | Pro/Premium upgraded model per routing table |

---

## Domain: Outfits (`/api/outfits/*`)

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/api/outfits` | List saved outfits (`status=active` default) | Bearer | Story 15.1 |
| GET | `/api/outfits/:id` | Outfit detail (AI explanation, matching score) | Bearer | Story 15.2 |
| PATCH | `/api/outfits/:id` | Toggle favorite/saved, or change `status` (hide/remove) | Bearer | Story 15.3/15.4 |
| POST | `/api/outfits/:id/confirm-worn` | Increment `timesWorn` on outfit + constituent `clothes` | Bearer | Story 15.5 — original Home-triggered path |

---

## Domain: Events (`/api/events/*`)

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/api/events` | List user's events | Bearer | |
| POST | `/api/events` | Create event | Bearer | |
| GET | `/api/events/:id` | Event detail (incl. `linkedOutfitIds`, `wearConfirmedAt` state) | Bearer | Drives WearConfirmBanner state on client |
| PATCH | `/api/events/:id` | Edit event / link-unlink outfits | Bearer | Story 10.3; edits reschedule reminders (Story 10.4) |
| DELETE | `/api/events/:id` | Delete event | Bearer | Cancels scheduled reminders |
| **POST** | **`/api/events/:id/confirm-worn`** | **NEW (Story 10.5) — sets `wearConfirmedAt`, bulk-increments `timesWorn` on ALL `linkedOutfitIds` + their constituent `clothes`** | Bearer | Idempotent via Firestore transaction (guards against double-submit); returns 409 if already confirmed |
| **POST** | **`/api/events/:id/skip-worn`** | **NEW (Story 10.5) — dismisses the banner without incrementing** | Bearer | Does not set `wearConfirmedAt` (so it's distinguishable from confirmed in analytics if ever needed), but sets a separate lightweight `wearPromptDismissed: true` flag so banner doesn't reappear |

**Scheduled job (not a client-facing endpoint):** a Cloud Scheduler / cron task queries `events` where `scheduledAt < now AND wearConfirmedAt IS NULL AND wearPromptDismissed != true` to drive the push-notification nudge (per Solution Architecture Section 9/14 pattern, reuses the Story 10.4 reminder job infrastructure).

---

## Domain: Community/Marketplace (`/api/listings/*`, `/api/messages/*`)

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/api/listings` | Browse approved listings (guest-accessible) | Optional (public read) | BRD 3.16 |
| POST | `/api/listings` | Create listing from closet item | Bearer | Enters `pending_review` |
| GET | `/api/listings/:id` | Listing detail (guest-accessible) | Optional | |
| PATCH | `/api/listings/:id` | Edit own listing (pre-approval) | Bearer | |
| POST | `/api/listings/:id/messages` | Send message to seller | Bearer | Guest triggers `GuestAuthModal`, resumes after auth (AC 92) |
| POST | `/api/listings/:id/trade-offer` | Submit trade offer | Bearer | |
| POST | `/api/listings/:id/report` | Report listing | Bearer | |
| POST | `/api/admin/listings/:id/moderate` | Approve/reject (+ note) | Bearer (Admin) | |
| POST | `/api/listings/:id/transaction` | Create transaction on completed sale | Bearer | Computes `platformFee`; escrow-absence disclosure shown client-side before this call (BRD 3.11.7) |

---

## Domain: Membership & Payment (`/api/membership/*`, `/api/payments/*`)

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/api/membership/plans` | Get `plan_limits` for comparison screen | Optional (public read) | |
| POST | `/api/payments/checkout` | Initiate VNPay/MoMo checkout | Bearer | Returns redirect URL |
| POST | `/api/payments/webhook/vnpay` | VNPay IPN callback | Webhook secret | Confirms payment, updates `subscriptions` |
| POST | `/api/payments/webhook/momo` | MoMo IPN callback | Webhook secret | Same pattern |
| POST | `/api/membership/cancel` | Cancel subscription | Bearer | Effective end-of-period (BRD 3.4.5) |

---

## Domain: Missions & Referral (`/api/missions/*`, `/api/referrals/*`)

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/api/missions` | List missions + user progress | Bearer | |
| POST | `/api/missions/:id/claim` | Claim completed mission reward | Bearer | |
| GET | `/api/referrals/my-code` | Get user's referral code/link | Bearer | Story 5.8 |
| POST | `/api/referrals/redeem` | Redeem a referral code (new user) | Bearer | Creates `referrals` doc, triggers referrer mission progress |

---

## Domain: Profile (`/api/profile/*`)

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| PATCH | `/api/profile` | Edit `displayName`/`avatarUrl` | Bearer | |
| POST | `/api/profile/style-survey` | Submit initial style survey (or skip) | Bearer | Sets `hasCompletedStyleSurvey`/`styleSurveySkipped` |
| PATCH | `/api/profile/style-preferences` | Edit basic style preferences | Bearer | |
| PATCH | `/api/profile/advanced-preferences` | Edit body/sizing/budget preferences | Bearer | |

---

## Domain: Shopping (`/api/shopping/*`)

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/api/shopping/products` | Affiliate product feed (guest-accessible) | Optional | |
| POST | `/api/shopping/events` | Log `affiliate_click`/`product_impression`/`community_item_click` | Optional | Story 12.3 |

---

## Domain: Admin (`/api/admin/*`)

Generic pattern — all 16 Admin CMS surfaces share one underlying handler shape reading/writing their respective collection, per the existing `AdminCollectionPage` component pattern:

| Method | Path pattern | Purpose | Auth |
|---|---|---|---|
| GET | `/api/admin/:collection` | List with filter/sort/pagination | Bearer (Admin, RBAC-scoped) |
| GET | `/api/admin/:collection/:id` | Detail | Bearer (Admin) |
| PATCH | `/api/admin/:collection/:id` | Update (e.g. moderate, configure) | Bearer (Admin) |
| POST | `/api/admin/:collection` | Create (e.g. new mission, CMS content) | Bearer (Admin) |
| DELETE | `/api/admin/:collection/:id` | Delete/archive | Bearer (Admin) |

Special-cased admin endpoints (business-logic-heavy, not pure CRUD):

| Method | Path | Purpose |
|---|---|---|
| PATCH | `/api/admin/settings/ai-routing` | Update AI Model Routing config — **P0-critical, no-redeploy requirement (BRD 3.4.6)** |
| PATCH | `/api/admin/plan-limits/:tier` | Update tier quotas |
| GET | `/api/admin/analytics/dashboard` | KPI overview (Activation, DAU/MAU, conversion %, AI usage) |
| GET | `/api/admin/analytics/ai-cost` | AI cost per active user, tag-correction rate — feeds the model-sufficiency gate |

---

## Cross-Cutting: Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `UNAUTHENTICATED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | Authenticated but lacks permission (RBAC or Guest-restricted action) |
| `QUOTA_EXCEEDED` | 403 | AI/Try-On/Closet-item quota reached — client shows upgrade prompt |
| `VALIDATION_ERROR` | 400 | Malformed request (e.g. >5 bulk photos) |
| `NOT_FOUND` | 404 | |
| `ALREADY_CONFIRMED` | 409 | Event wear-confirmation double-submit guard |
| `AI_PROVIDER_ERROR` | 502 | AI call failed after 3 retries |
| `RATE_LIMITED` | 429 | (Reserved — no MVP business logic uses this yet beyond quota checks) |
| `INTERNAL_ERROR` | 500 | |

---

## Cross-Cutting: AI Routing Enforcement

Every `/api/ai/*` endpoint MUST call the shared `resolveModel(feature, tier)` resolver before invoking the AI provider — this is enforced as a governance rule (Solution Architecture Section 12), not just a convention, and should be covered by a lint rule or code-review checklist item during Dev Prompt Generator handoff.
