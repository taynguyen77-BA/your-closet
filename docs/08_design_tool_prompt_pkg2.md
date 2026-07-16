# Design Tool Prompt — Wardro Closet Module (Package 2 screens)

**Target tool:** Stitch (Google AI design tool)
**Scope:** 4 screens — Closet List, Add Item, AI Review Draft, Item Detail
**Note on sequencing:** These screens were already functionally implemented in Package 2 (Claude Code) before this design prompt was generated — the reverse of the normal order. This prompt is written the same as if design came first, so the resulting Stitch screens can be compared against the real build afterward (see "Next step" at the end) rather than treated as a redesign request.

**Do not generate implementation logic, backend logic, or APIs — design only.**

---

## Product Context

Wardro is a Personal Fashion Operating System for the Vietnamese B2C mobile market — an AI-powered digital closet, outfit generator, and marketplace, sitting between Pinterest, Google Photos, ChatGPT, and Instagram. Brand personality: premium, editorial, calm confidence — not flashy or gamified. Existing design system (already established in Package 1 screens — match exactly, do not introduce new tokens):

- **Typography:** DM Serif Display for headlines/editorial moments; DM Sans for labels/body text.
- **Color palette:** Espresso `#1E1712` (primary text/ink), Sand `#D4B896` (accent — backgrounds/highlights only, never body text — fails AA as text color), Linen `#F7F4F0` (page background).
- **Cards:** white cards only, no gradients, flat color, premium editorial aesthetic.
- **Contrast:** Espresso on Linen clears WCAG AA easily; verify Sand is never used as text color on Linen.

---

## Screen Inventory (this prompt's scope)

| Screen | Route | Priority | Purpose |
|---|---|---|---|
| Closet List | `/(tabs)/closet` | P0 | Grid/list of items, filter |
| Add Item | Modal from Closet | P0 | Camera/album, bulk upload |
| AI Review Draft | Modal after upload | P0 | Correct tags, pick enhanced image |
| Item Detail | `/closet/[id]` | P0 | Edit/delete/favorite item, wear-count display |

---

## User Flow — Full Closet Activation Sequence

Persona: Linh, fresh install. Trigger: prompted from Home ("Thêm món đồ đầu tiên") or FAB in Closet List.
Steps: Closet List (empty state) → tap FAB → Add Item (camera/album, bulk up to 5) → upload progress → AI Review Draft (correct tags, pick enhanced image) → save → Closet List (now populated) → tap an item → Item Detail (edit/delete/favorite, wear-count).
Failure path: AI detection fails 3x → processing error screen with manual-tag fallback CTA (still lands user on AI Review Draft, just with empty AI-suggested fields and an error banner instead of populated suggestions).

---

## Screen 1 — Closet List

**Layout:** 2-column grid, filter chip bar pinned above the grid (horizontal scroll if chips overflow), floating action button (FAB) bottom-right for Add Item.

**Element Inventory:**
| Element | Exact copy / content | States |
|---|---|---|
| Screen title | "Tủ đồ của tôi" | Static |
| Filter chips | "Tất cả", "Áo", "Quần", "Váy", "Giày", "Phụ kiện" (category) + a second row or toggle for color/season — exact taxonomy list TBD, use these as placeholder categories | Unselected (Sand-tinted outline), Selected (filled Espresso) |
| Item card | Thumbnail image, category tag (small label), favorite icon (top-right corner of card) | Default, Favorited (filled heart icon), Needs Review (AiConfidenceBadge, distinct visual treatment — see Component Notes) |
| FAB | "+" icon only, no label | Default, Pressed |
| Empty state | Illustration + headline "Tủ đồ trống" + subtext "Thêm món đồ đầu tiên để bắt đầu" + CTA button "Thêm món đồ đầu tiên" | Only shown when zero items |
| Loading state | Skeleton grid cards (NOT a spinner) | Shown on initial load / refresh |

**Business rules to reflect visually:** Items flagged "needs review" (low AI confidence) must be visually distinct in the grid itself, not only inside the review-draft flow — user should be able to spot and revisit them later.

---

## Screen 2 — Add Item

**Layout:** Modal (full-screen on mobile), presented over Closet List.

**Element Inventory:**
| Element | Exact copy / content | States |
|---|---|---|
| Modal title | "Thêm món đồ" | Static |
| Source picker | Two options: "Chụp ảnh" (camera icon) and "Chọn từ thư viện" (album icon) | Default |
| Bulk selection limit message | **Exact required copy (BRD 3.2.1.1):** "Bạn chỉ có thể chọn tối đa 5 ảnh cho mỗi lần upload." | Shown only when user attempts to select a 6th photo — picker blocks the selection, this message appears as a toast/inline warning |
| Selected photos preview | Thumbnail strip, up to 5, each removable (X icon) before upload | 0 selected (source picker only), 1–5 selected (preview strip + "Tiếp tục" CTA) |
| Upload progress | Per-photo progress indicator, cancellable | In-progress, Failed (retry option), Complete |
| Primary CTA | "Tiếp tục" (proceeds to AI Review Draft once upload completes) | Disabled until ≥1 photo selected, Enabled |

---

## Screen 3 — AI Review Draft

**Layout:** Modal, one card per uploaded photo if bulk (swipeable/paginated — user reviews each draft item individually before final batch save), or single card if one photo.

**Element Inventory:**
| Element | Exact copy / content | States |
|---|---|---|
| Modal title | "Xác nhận thông tin" | Static |
| Image display | The uploaded/original photo, primary and large | Default |
| Enhance option | Button/toggle "Cải thiện ảnh" — triggers `analyze-and-enhance` (async, Batch-routed — show a "Đang xử lý..." processing state, not a blocking spinner, since this can take a while) | Not requested, Processing, Candidates ready |
| Enhanced candidate picker | Thumbnail row: "Ảnh gốc" + N enhanced candidates (count varies by tier: Free 1, Pro 2–3, Premium 3+) | Selectable, one active at a time |
| Quality warning banner | Shown only if `qualityWarnings` present — exact wording TBD per actual AI response, placeholder: "Ảnh có thể chưa đạt chất lượng tốt nhất" | Conditional |
| AI-suggested fields (editable) | Loại (category), Màu sắc (color), Chất liệu (material), Kiểu dáng (style), Mùa (season), Tên món đồ (suggested name), Thẻ/tags | Each field: AI-suggested (with subtle AI-source indicator), User-edited (indicator removed once user touches the field) |
| AI confidence indicator | `AiConfidenceBadge` — "Cần kiểm tra lại" (needs review, low confidence) vs no badge (verified/high confidence) | Needs Review, Verified |
| Error state | If AI detection failed 3x: banner "Không thể nhận diện tự động, vui lòng nhập thủ công" + all fields blank/editable, no AI badge shown | Conditional, only after 3 failed retries |
| Free-tier limit block | If saving would exceed the tier's closet item limit: block save, show inline upgrade prompt, **do not clear the draft** — user must be able to delete an old item and retry without re-uploading | Conditional |
| Primary CTA | "Lưu vào tủ đồ" | Disabled during AI processing, Enabled once fields populated (AI or manual) |

---

## Screen 4 — Item Detail

**Layout:** Pushed screen (not modal, not a tab) — reachable from Closet List and potentially from Outfit Detail/Try-On later; must support back-navigation to the correct origin, not a hardcoded parent.

**Element Inventory:**
| Element | Exact copy / content | States |
|---|---|---|
| Hero image | Full item photo (enhanced version if one was selected) | Default |
| Favorite toggle | Heart icon, top-right of hero image | Unfavorited, Favorited |
| Item fields (display, editable via edit mode) | Loại, Màu sắc, Chất liệu, Kiểu dáng, Mùa, Tên món đồ, Thẻ | View mode (read-only), Edit mode (all fields editable) |
| Wear-count stat | "Đã mặc [N] lần" — read-only counter, sourced from `timesWorn`, defaults to 0 for new items (this field is written by Package 3/4's confirm-worn actions, not by this screen) | Static display |
| Edit CTA | "Chỉnh sửa" | Toggles into Edit mode |
| Delete CTA | "Xóa" (destructive style — Coral/red per design system's danger role) | Triggers confirmation dialog before actual delete |
| Delete confirmation | Dialog: "Bạn có chắc muốn xóa món đồ này?" with "Hủy" / "Xóa" buttons | Modal overlay |
| Save (in edit mode) | "Lưu thay đổi" | Enabled once a field changes |

---

## Component Inventory (reused across these 4 screens)

| Component | Usage | Variants |
|---|---|---|
| ClothingItemCard | Display a closet item | Grid (Closet List), Selected (future outfit builder use) |
| AiConfidenceBadge | Flag low-confidence AI tags | Needs Review, Verified |
| EmptyState | No-data placeholder | Illustration + CTA, used on Closet List |
| QuotaBadge | (Not used on these 4 screens directly, but reuse the same visual pattern if a closet-item-limit indicator is added) | — |
| Button | All CTAs | Primary (Espresso fill), Secondary (outline), Ghost, Destructive (Coral) |

---

## States (apply per BRD/Design Brief Section 12 conventions — do not invent new patterns)

- **Loading:** skeleton screens for Closet List grid; branded processing state (not generic spinner) for AI Review Draft's enhance/detect calls.
- **Empty:** Closet List only — illustration + CTA, never bare "No data" text.
- **Error:** AI call failure on Add Item/Review Draft — retry CTA, never a silent blank result.
- **Permission Denied:** N/A for these 4 screens (authenticated-user-only, no guest access to Closet).

---

## Accessibility Requirements

WCAG 2.2 AA minimum. Sand `#D4B896` for accents/backgrounds only, never as text color. Every form field in AI Review Draft and Item Detail edit mode needs a persistent visible label (not placeholder-only). Delete confirmation dialog must trap focus and return it to the Delete button on cancel.

---

## Design Governance Checklist

- [x] All 4 P0 screens in this prompt's scope identified
- [x] Full activation flow mapped (Closet List → Add Item → AI Review Draft → Item Detail)
- [x] All states covered (default, loading, empty, error, success)
- [x] Accessibility requirements included
- [x] Business rules traceable to BRD v2.3 (3.2.1–3.2.6)
- [x] Exact required copy strings included verbatim (bulk-limit message per BRD 3.2.1.1)

---

## Next Step — Reconciling With the Already-Built Screens

Since Package 2 was implemented before this design prompt existed, the recommended sequence now is:

1. Paste this prompt into Stitch, generate the 4 screens.
2. Export screenshots of both: (a) Stitch's output, and (b) the actual running app screens Claude Code already built.
3. Run the `design-vs-implementation-checker` skill with both sets of screenshots — it will produce a structured mismatch list (missing elements, spacing/copy deviations, wrong states) rather than a vague "does it look right" judgment.
4. Turn that mismatch list into a small, scoped fix prompt for Claude Code (visual-only changes — do not touch the already-verified business logic/DONE CRITERIA from Package 2's dev prompts).

This avoids a full rebuild — Package 2's logic is already verified; only the visual layer needs reconciliation.
