# Open Items — Pending Stitch Photography Assets (Package 1)

The Stitch export is photography-forward: several Package 1 screens are built
around full-bleed or framed fashion images sourced from `googleusercontent.com`.
None of those images ship with the repo (`mobile/assets/` holds only app
icons/splash), and sourcing them is a separate task — licensing, rights, or the
design team — outside code work.

Until real assets exist, each image slot renders as a **tonal Sand placeholder**
at the Stitch aspect ratio (the same pattern used on the Welcome hero), marked in
code with `placeholder — pending real asset, see docs/OPEN_ITEMS_assets_pending.md`.
Swapping in a real asset is a one-line `source` change per slot; layout, spacing
and aspect ratio are already correct.

## Placed so far (Bước 2b)

| Screen | File | Slot / position | Aspect | Placeholder |
|---|---|---|---|---|
| Welcome | `mobile/app/auth/welcome.tsx` | Full-bleed editorial hero behind the bottom sheet | Full-bleed (fills above the sheet) | Sand fill + wordmark |
| Style Survey — b1 (styles) | `mobile/src/components/profile/StyleSurveyForm.tsx` | Each of the 14 style option cards (2-col grid) | 3:4 per card | Sand thumb + label |
| Style Survey — b2 (colours) | `mobile/src/components/profile/StyleSurveyForm.tsx` | Hero above the swatch grid | 16:9 | Sand block |
| Style Survey — b4 (confidence) | `mobile/src/components/profile/StyleSurveyForm.tsx` | Hero above the options | 4:5 | Sand block |
| Settings | `mobile/app/settings.tsx` | Hero above the sections | 16:9 | Sand block + overlay caption |

## Resolved without a placeholder

| Screen | Why |
|---|---|
| Profile | The framed avatar binds the real `avatarUrl` (with the app's existing fallback), so no placeholder is needed. |

## Not implemented — no clean code equivalent

| Screen | Stitch folder | Note |
|---|---|---|
| Skip confirm | `x_c_nh_n_b_qua_wardro` | No skip-confirmation screen exists; "Bỏ qua" skips immediately. Adding a confirm gate is a behaviour change, not a restyle. Its 2-col image grid (3:4) is noted only for completeness. |
| Account info | `th_ng_tin_t_i_kho_n_wardro` | No account-info screen exists (only `profile/delete-account.tsx`). Creating one is an IA change (R2, pending PO), so it is not built and no placeholder is placed. |

## Notes on screens without a clean code equivalent

- **Skip confirm** (`x_c_nh_n_b_qua_wardro`): the code has no skip-confirmation
  screen — "Bỏ qua" skips immediately. Adding a confirm gate is a behaviour
  change, not a restyle, so it is not implemented; its image grid is listed only
  for completeness.
- **Account info** (`th_ng_tin_t_i_kho_n_wardro`): no account-info screen exists
  in code (only `profile/delete-account.tsx`). Creating one is an IA change,
  pending PO direction (related to R2 in `10_navigation_flow_map_v1.md`).
- **Profile / Settings tier + expiry**: Stitch shows a "GOLD" tier chip and
  "Hạn dùng 12/2025"; the data model has neither (only plan label + usage), so
  those specific fields are not rendered.

## Export reference caveats — forward packages (not yet built)

Notes to read before using a Stitch screen as a reference for a package that
hasn't been built yet. These are export defects, not code work — do not "fix"
them in the export.

| Package | Stitch folder | Caveat |
|---|---|---|
| Package 6 — Membership/Payment (Thanh toán thành công) | `n_ng_c_p_th_nh_c_ng_wardro` | **Branding bug in the export:** the screen's `<title>` reads `Thanh toán thành công \| LINEN` — "LINEN" instead of "Wardro" (every other screen uses "Wardro", e.g. `Wardro \| Membership Comparison`, `Wardro - Sự kiện`). The layout/tokens are fine to reference, but the wordmark/title in this file is wrong. When Package 6 is built, use "Wardro" — do not copy the "LINEN" title. Cross-ref ADR-09 (`11_solution_architecture.md`), which already records the export as internally inconsistent. Left unfixed intentionally (export is a read-only reference). |
