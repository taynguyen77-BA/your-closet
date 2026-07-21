# Wardro — MVP Phase 1 — Acceptance Criteria (v2.1)

Version: 2.1 (supersedes v2.0)
Date: 2026-07-13
Source: 02_brd_v2_2.md, 04_user_stories_v2_1.md

**v2.1 changelog:** Added AC 58a (Event wear-confirmation, Story 10.5, BRD 3.10.5) — closes a gap where this mechanism was already specified in `13_api_spec.md`/`12_database_design.md` but had no corresponding AC. No other ACs changed.

---

Traceability:
- Feature: Toàn bộ MVP Phase 1 (17 feature areas)
- Module: Account/Identity, AI Closet, Home Dashboard & Outfit Generator, Membership & Tiering (+ AI Model Routing), Missions & Rewards, Notifications, Admin/AI Cost Monitoring, Fashion Knowledge Base, **Virtual Try-On, Event Planner, Community/Marketplace, Shopping & Affiliate, Style Profile & Advanced Preferences, Payment & Billing, Outfit Library, Guest Mode, Admin CMS (mới)**
- Story Reference: 04_user_stories_v2.0.md, Story 1.1/1.9/4.1/4.6/5.8/9.x–17.x
- Requirement Source: 02_brd_v2.0.md

---

## Acceptance Criteria

AC 1–30 (Account base, AI Closet, Home Dashboard, base Membership) and AC 31–40 (Missions & Rewards) are **inherited unchanged from `05_acceptance_criteria_v1.5.md`**, EXCEPT where explicitly superseded below. The full original text of AC 1–30 was not re-derived here since it was not part of this review's source material — only the specific deltas the PO confirmed are captured as superseding ACs (41–45). Everything else in AC 1–40 remains authoritative as written in v1.5.

**Account & Identity — [SUPERSEDES relevant sub-items within AC 1–26, BRD 3.1]**

41. User can register or log in using exactly three methods: Phone OTP, Google, or Facebook. **[SUPERSEDES any v1.5 AC referencing a 4-provider or 2-provider auth scope]**
    41.1. System does not offer Email/Password as a registration or login option anywhere in the app.
    41.2. If a phone number or provider identity already maps to an existing account, system signs the user into that existing account instead of creating a duplicate.
42. User who enters an incorrect OTP code can retry up to 3 times before the system enforces a 60-second cooldown before allowing another OTP request.
    42.1. System displays "Mã OTP không đúng, thử lại" on each incorrect attempt within the 3-attempt window.
    42.2. System displays a visible countdown during the 60-second cooldown and disables the "Resend OTP" action until it expires.
43. User who cancels or denies a Google/Facebook consent prompt is returned to the Auth Welcome screen without an error toast (cancellation is not treated as an error state).

**Membership & Tiering — [SUPERSEDES relevant sub-items within AC 27–30, BRD 3.4]**

44. System supports exactly three membership tiers, displayed and stored as `free`, `pro`, `premium`. **[SUPERSEDES any v1.5 AC referencing `elite` as a tier name]**
    44.1. Any pre-existing test/staging record using the value `elite` is migrated to `premium` before this AC is considered verifiable in that environment.
45. System routes every AI-touching call (clothing detection, image enhancement, outfit recommendation, virtual try-on, style-profile analysis) to a model selected by the combination of (feature, user's current tier), per the AI Model Routing configuration in `admin_settings`.
    45.1. Free-tier users' calls always resolve to the lowest-cost model class for every feature.
    45.2. Pro and Premium tier users' calls resolve to an upgraded model for clothing enhancement, outfit recommendation, virtual try-on, and style-profile analysis from the moment they upgrade — no waiting period or usage threshold is required.
    45.3. Clothing detection uses the same lowest-cost model class for all three tiers (no tier-based upgrade for this specific feature).
    45.4. If the tier-appropriate model call fails, system falls back to the next-lower-cost available model for that feature, notifies the user the result may be lower quality, and does not deduct the user's quota for that call.
    45.5. Admin can change the routing configuration (which model serves which feature/tier) without requiring an app release.
    45.6. Every AI call logs `modelUsed`, `costEstimate`, `fallbackUsed`, and `tier` to `ai_logs`.
    45.7. Immediately upon a successful tier upgrade or downgrade, the next AI call for that user uses the new tier's routing — there is no delay or caching of the old tier's model selection.

**Missions & Rewards — [NEW, BRD 3.5.3.3]**

46. User can share a unique referral link/code from within the app.
47. System credits the "Invite Friend" mission when a user who registered via the referrer's link completes registration.
    47.1. System does not credit a self-referral (a user registering via their own referral link).
    47.2. Open Question: whether credit requires registration alone or registration + onboarding completion is not yet specified (see Open Questions below).

---

**Virtual Try-On — [NEW, BRD 3.9]**

48. User can select an outfit (AI-recommended or from their Outfit Library) and a personal photo to begin a virtual try-on.
49. User can choose exactly one scene from: beach, mountain, urban, party, casual, office.
50. System enforces a Free-tier quota of 2 virtual try-on generations per calendar month, resetting on the 1st day of each month.
    50.1. System displays "Bạn đã dùng hết lượt thử đồ miễn phí tháng này. Hoàn thành nhiệm vụ để nhận thêm lượt, hoặc nâng cấp Pro." when a Free-tier user's quota is exhausted and no mission-earned bonus quota is available.
    50.2. System blocks generation when quota is exhausted and no bonus is available.
    50.3. Mission-earned bonus try-on quota stacks on top of the tier's base monthly allowance and does not expire at month-end reset unless explicitly configured otherwise. [Open Question — expiry behavior of bonus quota not specified]
51. System does not deduct try-on quota when a generation attempt fails or times out.
52. User can save the generated try-on image to their device or share it via the native share sheet.
53. User can save the outfit used in a try-on directly to their Outfit Library from the try-on result screen.
54. System routes the try-on generation call through AI Model Routing (AC 45), using a standard-quality image-gen model for Free/Pro and the highest-quality available model for Premium.

**Event Planner — [NEW, BRD 3.10]**

55. User can create an event with name, date, location, event type (wedding/party/work/date/travel/casual/formal/other), dress code, weather style, and mood.
56. System generates AI outfit suggestions using the event's dress code, weather style, and mood as additional context to the standard Outfit Generator.
57. User can link one or more saved outfits to an event.
    57.1. User can unlink a previously linked outfit from an event.
58. System sends three independent event reminder notifications: 1 day before, 12 hours before, and 4 hours before the event's scheduled date/time.
    58.1. System does not send any of the three reminders if the user has disabled event notifications in Notification Settings.
    58.2. System reschedules or cancels pending reminders when the user edits or deletes the event.
58a. *(NEW — v2.1, BRD 3.10.5, Story 10.5)* System shows a wear-confirm banner for an event once its scheduled date/time has passed and `wearConfirmedAt` is not yet set.
    58a.1. User confirming the banner bulk-increments `timesWorn` on every outfit in the event's `linkedOutfitIds`, and on each constituent closet item of those outfits, in one action.
    58a.2. System sets `events.wearConfirmedAt` on confirmation; this is a one-way transition and a duplicate/retried confirm request does not double-increment `timesWorn` (enforced via a single Firestore transaction).
    58a.3. User can dismiss the banner without confirming; dismissal sets `wearPromptDismissed: true`, does not increment `timesWorn`, and the banner does not reappear for that event.
    58a.4. System does not attempt to deduplicate `timesWorn` increments between this trigger and the existing Home Dashboard confirm-worn action (AC 89) — both counters increment independently per ADR-04/ADR-05.

**Community / Marketplace ("Pass đồ") — [NEW, BRD 3.11]**

59. User can create a listing from an existing closet item, specifying listing type (sale/trade/giveaway), price (required only for sale type), condition, description, photos, size, location, and tags.
60. System sets every newly created listing to `pending_review` status, which is not publicly visible.
61. Admin can approve a listing, which changes its status to `approved` and makes it publicly browsable, including to unauthenticated guests.
62. Admin can reject a listing with an optional moderation note, which is shown to the seller and does not make the listing publicly visible.
63. Authenticated users and guests can browse and view detail of any `approved` listing.
64. Authenticated user can send a message to a listing's seller.
65. Authenticated user can submit a trade offer on a listing, optionally referencing one of their own closet items.
66. Authenticated user can report a listing for violation, which creates a report record with `open` status.
67. Admin can move a report through the review workflow: `open → reviewing → resolved` or `open → reviewing → dismissed`.
68. System creates a transaction record on a completed sale, computing `platformFee` from the configured `platformFeePercentage`.
    68.1. Transaction status progresses through `pending → paid → shipped → handed_over → completed`, or can move to `cancelled` at any point before `completed`.
69. System displays an explicit disclosure that transactions are not escrow-protected, before a user's first listing creation or first purchase/trade-offer action.

**AI Shopping Assistant & Affiliate — [NEW, BRD 3.12]**

70. System surfaces an affiliate product suggestion when the Outfit Generator's `missingItems` output identifies a wardrobe gap relevant to a recommended outfit.
71. User can view a dedicated Shopping screen listing affiliate products.
72. System logs a `shopping_events` record for each `affiliate_click`, `product_impression`, and `community_item_click` event, tagged with `source` (`ai_stylist`/`shopping`/`community`).
73. Admin can add, edit, and deactivate affiliate products.
74. Admin can view aggregate clicks, conversions, and estimated revenue (in VNĐ) per affiliate product.

**Style Profile & Advanced Preferences — [NEW, BRD 3.13]**

75. On first login, user is routed to an initial Style Survey capturing preferred styles, favorite colors, lifestyle/occasions, fashion confidence level, gender, age group, and disliked colors.
76. User can skip the initial Style Survey; skipping sets `hasCompletedStyleSurvey=true` and `styleSurveySkipped=true` so the survey is not shown again on subsequent logins.
77. User can edit their style preferences at any time from Profile ("Chỉnh sửa gu thời trang").
78. User can complete Advanced Style Preferences, capturing body shape, height (cm), weight (kg), top size, bottom size, shoe size, favorite brands, budget level, fit preference, styles to avoid, and disliked colors.
    78.1. Advanced Style Preferences data is included as input to the Outfit Generator (AC covering BRD 3.3) and Virtual Try-On (AC 48–54) AI prompts.
79. System displays a `styleProfileCompletionPercent` on the Profile screen reflecting how much of the style profile (basic + advanced) has been filled in.
80. System generates a structured Style Profile summary (primary styles, preferred colors, recommendations) via an AI call routed per AC 45.

**Payment & Billing — [NEW, BRD 3.14]**

81. User can select VNPay or MoMo as a payment method when upgrading membership; Apple Pay and Google Pay are not presented as selectable options.
82. On successful payment, system updates the user's tier, creates/updates the `subscriptions` record, and applies the new AI Model Routing tier (AC 45.7) to the very next AI call.
83. On failed or cancelled payment, system makes no change to the user's tier and returns the user to the Membership screen with a clear failure message.
84. Admin can view payment and transaction reports for completed, failed, and cancelled membership transactions.

**Outfit Library Management — [NEW, BRD 3.15]**

85. User can view a list of all their saved outfits.
86. User can view an outfit's detail, including constituent items, AI explanation, weather/color/style matching, and matching score.
87. User can mark an outfit as favorite or as saved.
88. User can hide or remove an outfit; doing so does not delete or modify the underlying closet items.
89. System increments an outfit's `timesWorn` count, and each constituent item's `timesWorn` count, when the user confirms the outfit as worn.

**Guest / Public Browsing Mode — [NEW, BRD 3.16]**

90. Unauthenticated (guest) user can view active `plan_limits`, active `missions`, published `trends`, active `affiliate_products`, and `approved` `listings` without signing in.
91. System blocks any guest attempt to read data or take an action outside the AC 90 scope, and displays a sign-in prompt instead of failing silently.
    91.1. Actions that trigger this prompt include: upload, save, message, offer submission, mission completion, and any AI generation request.
92. On successful sign-in from a guest session, system attempts to return the user to their prior screen/action where feasible, rather than always restarting at Home.

**Admin CMS (expanded) — [NEW, BRD 3.17]**

93. Admin can filter the Users list by plan, style survey completion status, and account status (active/suspended/banned).
94. Admin can suspend or reactivate a user account, reset a user's plan, and manually adjust a user's AI quota.
95. Admin with the appropriate role can create, edit, and deactivate other Admin accounts and assign their permission role.
96. Admin can create, edit, publish, and archive CMS Content entries (home banners, onboarding slides, FAQ, legal pages, seasonal collections).
97. System logs every state-changing Admin action (user status/quota/plan change, listing moderation decision, mission config change, CMS content publish) to `admin_logs` with the acting admin's identity and timestamp.
98. Admin can view, filter, and progress support tickets through `open → in_progress → resolved → closed`.
99. Admin can view an Analytics Dashboard showing at minimum: total users, active users, membership conversion %, and daily AI usage.

---

## Open Questions

- Exact confidence threshold value for AI clothing detection "needs review" flagging — not specified in source (carried over from v1.5, AC-adjacent).
- Full list of target segments selectable when Admin creates a Mission — not specified in source (carried over from v1.5).
- Renewal reminder: mandatory or user-optional — not specified in source (carried over from v1.5).
- Exact `modelId`/`fallbackModelId` values for AC 45's routing table — placeholder pending Technical Lead confirmation (BRD OI-6); structure of the rule (AC 45.1–45.7) is final regardless.
- AC 47.2 — "Invite Friend" completion trigger: registration alone, or registration + onboarding completion? Not yet specified by PO.
- AC 50.3 — Does mission-earned bonus try-on quota expire at month-end reset, or persist until used? Not yet specified.
- AC 58 — Can the 3 event reminder lead times be individually toggled, or only all-or-nothing via the general event-notifications setting? Not yet specified.
- AC 68.1 — Exact cancellation rules (who can cancel at which status, whether platform fee is refunded on cancellation) not specified in source.
- AC 78.1 — Advanced Style Preferences includes body measurement data; exact deletion/retention handling under account deletion (BRD 3.1.7) should be explicitly cross-checked during UAT, as this is more sensitive than basic style tags.
- VNPay/MoMo integration mode (redirect vs. in-app SDK, AC 81) — not yet specified (BRD OI-7).

---

## Business Rules Coverage

Covered:
- 3-provider auth scope with duplicate-account prevention and OTP cooldown (AC 41–43)
- Tier rename to Free/Pro/Premium with migration requirement for legacy `elite` value (AC 44)
- Full AI Model Tiering & Routing rule set: per-tier model class, no-gate upgrade for Pro/Premium, fallback without quota charge, admin-editable config, immediate effect on tier change (AC 45)
- Referral-link mechanism for Invite Friend mission, with self-referral exclusion (AC 46–47)
- Virtual Try-On free quota (2/month, resets 1st, no charge on failure, mission bonus stacking) (AC 48–54)
- Event reminders at 3 confirmed lead times (AC 58); event wear-confirmation as a second, independent `timesWorn` trigger, bulk-scoped and idempotent (AC 58a)
- Marketplace moderation gate (pending_review→approved/rejected) and no-escrow disclosure (AC 59–69)
- Shopping/affiliate event tracking with source tagging (AC 70–74)
- Advanced Style Preferences as full MVP scope feeding AI prompts (AC 75–80)
- Payment method priority (VNPay/MoMo only at launch) and atomic tier update on success (AC 81–84)
- Outfit Library independence from Closet items on hide/remove (AC 85–89)
- Guest mode public-read scope and sign-in gating (AC 90–92)
- Admin action audit logging as a cross-cutting rule (AC 97)

Not Covered / Not Specified:
- See Open Questions above — 10 items, consistent with the Open Items already logged in BRD v2.0 Section 1.4, not newly discovered gaps.

---

## Acceptance Coverage Review

Coverage Status:
✅ Complete — Happy Path for all 17 feature areas; Business Rules for tier renaming, AI routing, quota enforcement, and moderation gating; Error Handling for AI call failures (no quota charge), payment failures (no partial state), and OTP failures (cooldown); Permissions/RBAC for Admin-only actions; Audit Trail for Admin actions (AC 97).
⚠️ Partial — Referral completion trigger (AC 47.2), bonus quota expiry (AC 50.3), and VNPay/MoMo integration mode (AC 81) are testable at the "mechanism exists" level but not yet at the exact-behavior level pending the Open Questions above.
❌ Missing — Accessibility (WCAG 2.2 AA conformance testing, carried-over gap from v1.5, not specific to this v2.0 delta); automated content moderation for Community listings (explicitly out of scope, manual-only per BRD 3.11.2.1).

---

## Readiness Assessment

Readiness:
⚠️ Partially Ready

Reason: The core business logic for all 9 new feature areas and all confirmed deltas to the 8 existing epics is fully specified, internally consistent with BRD v2.0, and testable as written (AC 41–99 cover this). Three items keep this from being fully "Ready" rather than "Partially Ready": (1) AI Model Routing's exact model IDs are a structural placeholder pending Technical Lead input — the *rule* is final and testable, but end-to-end UAT of AC 45 cannot select real models until OI-6 resolves; (2) the referral mechanism (AC 46–47) has a confirmed approach (referral link) but an unconfirmed completion trigger, which blocks writing a fully deterministic test case for AC 47.2; (3) Payment integration mode (AC 81, OI-7) affects whether QA tests a redirect flow or an in-app SDK flow — the AC is written mechanism-agnostically so it doesn't block starting dev, but UAT scripting for Epic 14 should wait for this confirmation. None of the three block starting engineering work on the surrounding, fully-specified logic.
