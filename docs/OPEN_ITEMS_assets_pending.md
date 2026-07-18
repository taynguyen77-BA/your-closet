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

## Anticipated (later Bước 2b screens, not yet placed)

| Screen | Stitch folder | Image slot | Aspect |
|---|---|---|---|
| Skip confirm | `x_c_nh_n_b_qua_wardro` | 2-col image grid | 3:4 grid — see note |
| Profile | `trang_c_nh_n_wardro_updated` | Framed avatar portrait (the app already binds `avatarUrl`, so likely no placeholder needed) | ~4:5 |
| Account info | `th_ng_tin_t_i_kho_n_wardro` | Avatar / header imagery | TBD — see note |
| Settings | `c_i_t_wardro` | Header imagery (1) | TBD |

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
