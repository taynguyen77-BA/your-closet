# 10 — Navigation Flow Map (Code-Verified Entry & Exit Points)

Version: 1.0 · Date: 2026-07-11
Status: Authoritative — built from every `router.push`/`router.replace` call in the codebase, cross-referenced against the 5-tab `_layout.tsx` config.

---

## Direct answer: "Màn hình danh sách lịch trình đi từ màn hình nào vào?"

**Events ("Lịch trình") is NOT in the bottom tab bar** — confirmed in `(tabs)/_layout.tsx`: the `events` route is explicitly registered with `options={{ href: null }}`, which hides it from the tab bar while keeping it a valid route. This was a deliberate code decision (5 visible tabs: Hôm nay, Tủ đồ, AI Stylist, Cộng đồng, Cá nhân), not an oversight — and it matches what the Design Brief already assumed. But it means Events has exactly **2 entry points, both indirect**, and no persistent/obvious one:

1. **Home Dashboard → "Lịch trình hôm nay" section** (always visible to logged-in users, regardless of whether they have any events yet) — either tap the **"Lên kế hoạch"** link in the section header, or tap any of the first 3 event preview cards shown horizontally. This is the primary, always-available entry point.
2. **Try-On Result screen → "Lên lịch bộ đồ cho sự kiện"** ghost button (only appears after generating a try-on image) — a secondary, contextual entry point.

There is **no link to Events anywhere in the Profile menu**, which is the one place a user would naturally look for "my schedule" alongside Missions/Outfits/Community links that ARE there. This is a genuine discoverability gap, flagged in the recommendations below.

---

## Full Navigation Map — every screen's entry points and exit points

Legend: **[TAB]** = always-accessible bottom tab · **[SYSTEM]** = reached by app logic, not a user tap · **[ORPHAN]** = fewer than 2 entry points found · **[AMBIGUOUS]** = entry point copy doesn't clearly match destination content

| Screen | Entry Points (FROM) | Exit Points (TO) | Flag |
|---|---|---|---|
| Auth Welcome | App launch (unauthenticated) · any Guest Auth Modal "Đăng nhập" | Phone Entry / Google / Facebook / Guest mode | — |
| Phone Entry → OTP | Welcome "Tiếp tục với số điện thoại" | Home (on success) · back to Welcome | — |
| Onboarding Slides | **[SYSTEM]** first launch only, before `onboardingCompleted` | Welcome or Home | — |
| Initial Style Survey | **[SYSTEM]** first login when `!hasCompletedStyleSurvey` | Home (complete or skip) | — |
| **Home Dashboard** | **[TAB]** "Hôm nay" · Home avatar tap (self-loop, from Profile back to Home is via tab, not a push) | Closet, Try-On, Community, Shopping (4 quick actions) · Outfits (Xem thêm) · Outfit Detail (hero card) · **Events** ("Lịch trình hôm nay") · Missions ("Nhiệm vụ hôm nay") · Community (trend section) · Profile (avatar) | — |
| Closet List | **[TAB]** "Tủ đồ" · Home quick action "Thêm đồ" | Item Detail (tap card) · Add Item (FAB/button) · Try-On ("AI phối đồ") · Community ("Xem cộng đồng trước", empty state only) | — |
| Add Item → AI Review Draft | Closet FAB, empty-state CTA, toolbar button | Closet List (on save/cancel) | — |
| Item Detail | Closet grid card tap | Quick Edit modal · Add-to-Outfit modal · Try-On (`?itemId=`) · Create Listing (`?itemId=`) | — |
| Outfit Library List | Home ("Xem thêm") · Closet · Profile ("Outfits") | Outfit Detail | — |
| Outfit Detail | Outfit Library · Home hero card · Try-On result (save-to-library) | Try-On (`?outfitId=`) · Event Detail (linked outfits) | — |
| Try-On (Setup → Scene Select → Result) | **[TAB]** "AI Stylist" · Item Detail · Outfit Detail | Result: Save/Share/Save-to-Library · Events ("Lên lịch bộ đồ cho sự kiện") | — |
| Events List | Home "Lịch trình hôm nay" section (header link + preview cards) · Try-On Result ghost button | Create Event · Event Detail | **[ORPHAN-ish]** only 2 entry points, absent from Profile menu — see R1 |
| Create Event | Events List | Events List (on save/cancel) | — |
| Event Detail | Events List · Home preview card | Outfit Detail (linked outfits) | — |
| Community Feed | **[TAB]** "Cộng đồng" · Home (trend section) · Closet empty-state · guest browsing | Listing Detail · Create Listing · My Messages | — |
| Listing Detail | Community Feed · Item Detail (linked listing) | Report Listing (modal) · Messages/Trade Offer | — |
| Create Listing | Community Feed · Item Detail | Community Full List (filtered to mine) · Community Hub | — |
| Shopping / Affiliate Feed | Home banner + quick action · Events (×2 buttons) · Outfit Detail ("Hoàn thiện outfit này") · Profile ("Mua sắm gợi ý") | Listing Detail (if item has linked community listing) | — |
| Membership | Profile "Nâng cấp" · AiUsageBanner tap (Home/Events/Try-On, shown when AI quota low) | Payment Method → Payment Prepare | — |
| Payment Prepare | Membership (after selecting plan + method) | Back to Membership (success or failure) | — |
| Missions | Home "Nhiệm vụ hôm nay" section · Profile mission button · AiUsageBanner tap · Community Hub "No-buy Week" challenge | (terminal — claim/complete actions stay on-screen) | — |
| Profile | **[TAB]** "Cá nhân" · Home avatar tap | Membership · Missions · Style Preferences (basic + advanced) · Community (×2) · Create Listing · Outfits (saved) · Profile Edit · Settings (×3 rows, see AMBIGUOUS below) | — |
| Profile Edit | Profile "Chỉnh sửa hồ sơ" | back to Profile | — |
| Style Preferences (basic) | Profile "Chỉnh sửa gu thời trang" | back to Profile | — |
| Advanced Style Preferences | Profile "Nâng cao" | back to Profile | — |
| **Settings** | Profile "Face ID / Vân tay đang bật" row · Profile "Thông báo" row · Profile "Quyền riêng tư" row — **all 3 different labels route to the exact same screen** | Logout → Auth Welcome | **[AMBIGUOUS]** see recommendation R2 |
| Guest Auth Modal | Any `requireSignedIn()`/`requireAccount()` gated action across Closet, Try-On, Community, Missions, Profile, etc. | Auth Welcome | — |
| Guest-Blocked full screen | Direct tab/route access to Missions or Outfits while unauthenticated | Auth Welcome (via the card's button) | — |

---

## Recommendations (flagging real UX flow gaps found — not design opinions, code-verified facts)

**R1 — Events discoverability.** With only 2 entry points (neither in the tab bar, neither in the Profile menu), a user who doesn't happen to see the Home "Lịch trình hôm nay" section on the exact day they have no events queued, or who never finishes a Try-On session, may never discover this feature exists. Recommend adding a "Sự kiện" row to the Profile menu (alongside the existing Community/Outfits/Missions rows) as a low-cost fix — this is a navigation addition, not a new screen, so it doesn't require new Stitch design work beyond adding one `MenuRow` entry. Flag to PO/Technical Lead for a decision; the Stitch note assumes this gets approved, but it's not designed as final until confirmed.

**R2 — Settings entry-point mismatch.** Profile has 3 separately-labeled rows ("Face ID / Vân tay", "Thông báo", "Quyền riêng tư") that all navigate to the identical Settings screen — a user tapping "Thông báo" expecting a notifications-focused screen instead lands at the top of a general Settings screen that also shows Face ID and other toggles. This isn't broken, but it's a soft mismatch between the entry-point promise and the destination. Two fixes possible: (a) scroll-to-section on arrival based on which row was tapped, or (b) relabel the 3 Profile rows — recommend (a), noted in the Stitch prompt update below as a state variant.

**R3 — No dead ends found elsewhere.** Every other screen in the map above has at least one clear entry point and a sensible exit, including all modal flows (Edit/Add-to-Outfit/Interaction Sheet) which correctly return to their parent screen. This is good news — the app's navigation is largely sound; Events and Settings are the two specific spots worth a second look.

---

## Updates applied to existing documents

The following existing artifacts were updated to reflect this navigation audit (diffs noted, not full re-quotes):

1. **`07_design_brief_v2.0.md` Section 6 (Navigation Model)** — added an explicit note on Events' 2 entry points and the Settings ambiguity, so any designer/dev reading the brief independently sees the same finding, not just this chat.
2. **`08_design_tool_prompt_v2.0.md` Section B17 (Events)** — added an "Entry Point Context" line so Stitch designs the Home "Lịch trình hôm nay" section and the Try-On "Lên lịch..." button as the deliberate on-ramps to this screen, and — pending R1 confirmation — a placeholder Profile menu row.
3. **`08_design_tool_prompt_v2.0.md` Section B — Settings entry** — added a note that Settings should support a "focus section" state so a future scroll-to-section fix (R2) doesn't require a full redesign later.

---

## Status note (2026-07-17)

As of this date, **R1 and R2 remain open, pending PO decision** — not yet resolved. R2 in particular is directly relevant to Bước 2b of the Stitch skin/layout restyle work (Package 1 Auth/Profile): the current decision is to keep Help/Support and Logout confirm content **inline** within the existing Settings screen (no new route), consistent with R2 still being unresolved (see ADR-10, `11_solution_architecture.md`).
