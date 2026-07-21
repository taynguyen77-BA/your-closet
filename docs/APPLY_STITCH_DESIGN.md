Áp dụng bộ design system mới từ Stitch (file zip đã giải nén sẵn ở
docs/design/stitch-export/ — nếu chưa có, copy nguyên zip vào đó và giải nén trước
khi bắt đầu). File tham chiếu chính: docs/design/stitch-export/wardro/DESIGN.md
(design token: màu, typography, spacing, elevation, component style).

QUAN TRỌNG: đọc kỹ DESIGN.md trước, đối chiếu với design system hiện có trong code
(DM Serif Display/DM Sans, Espresso/Sand/Linen) — token trong DESIGN.md là bản chính
thức mới, ưu tiên hơn giá trị hex cũ nếu có sai lệch nhỏ (ví dụ Espresso #1A1208 vs
giá trị cũ đang dùng trong code).

---

## BƯỚC 1 — Tạo theme trung tâm (làm trước, mọi bước sau dùng lại)

Trích xuất toàn bộ token từ DESIGN.md (colors, typography, rounded, spacing) thành
MỘT theme file duy nhất, dùng chung cho cả mobile (RN) và admin (Next.js/Tailwind) —
không hardcode lại giá trị màu/font ở từng component. Nếu theme file đã tồn tại,
cập nhật nó, không tạo file trùng lặp.

## BƯỚC 2 — Redesign Package 1 (Auth/Profile) — tách skin trước, layout sau

Đối chiếu từng màn hình thật đang có trong mobile/app/auth/ và mobile/app/profile/
(hoặc đường dẫn tương ứng trong code) với screenshot + code.html tương ứng:

| Màn hình thật | Thư mục Stitch export |
|---|---|
| Phone entry | docs/design/stitch-export/.../nh_p_s_i_n_tho_i_wardro/ |
| OTP | docs/design/stitch-export/.../x_c_nh_n_otp_wardro/ |
| Welcome | docs/design/stitch-export/.../ch_o_m_ng_n_v_i_wardro/ |
| Style Survey bước 1/2/4 | .../kh_o_s_t_phong_c_ch_b_c_1, _2, _4/ |
| Skip survey confirm | .../x_c_nh_n_b_qua_wardro/ |
| Profile | .../trang_c_nh_n_wardro_updated/ |
| Account info | .../th_ng_tin_t_i_kho_n_wardro/ |
| Settings | .../c_i_t_wardro/ |
| Logout confirm | .../x_c_nh_n_ng_xu_t_wardro/ |
| Help/Support | .../tr_gi_p_h_tr_wardro/ |

### Bước 2a — Skin only (làm trước)

Với mỗi màn ở trên: CHỈ thay màu sắc, font, spacing token, border-radius, elevation,
button/input style — theo theme trung tâm ở Bước 1. KHÔNG đổi bố cục (thứ tự field,
vị trí element, số cột, cấu trúc section/card). Coi đây như áp dụng lại Bước 4 (nguyên
tắc "skin only") cho từng màn Package 1.

Nếu không chắc một thay đổi là "skin" hay "layout" (ví dụ đổi khoảng cách giữa các
field có tính là skin không, hay đổi vị trí nút "Resend OTP" có tính là layout không),
coi đó là layout — KHÔNG đổi ở bước này, để dành cho Bước 2b.

Dừng lại sau khi xong Bước 2a, báo cáo danh sách file đã sửa, và chờ xác nhận trước khi
sang Bước 2b.

### Bước 2b — Layout (làm sau, sau khi Bước 2a được duyệt)

Với mỗi màn: cập nhật bố cục/spacing/component structure khớp với code.html + screenshot
tương ứng, dùng theme trung tâm ở Bước 1 — KHÔNG copy-paste HTML từ Stitch (đó là web
code, app là React Native) — dùng nó làm tham chiếu chính xác về bố cục/spacing/màu,
tự chuyển đổi sang component RN hiện có.

KHÔNG đổi hành vi/logic nghiệp vụ đã pass DONE CRITERIA ở các dev prompt trước — đây
là thay đổi thuần visual.

## BƯỚC 3 — Redesign Package 2 (Closet) — tách skin trước, layout sau

Với các màn dưới đây, LƯU Ý QUAN TRỌNG: Closet List, Add Item, Item Detail chỉ đổi
skin, KHÔNG chạy Bước 3b (layout) — giữ nguyên bố cục hiện tại như đang có trong code,
giống nguyên tắc áp dụng cho Home ở Bước 4. Edit item và Delete confirm vẫn đi qua đủ
3a rồi 3b như bình thường.

| Màn hình thật | Thư mục Stitch export | Phạm vi |
|---|---|---|
| Closet List | .../t_c_a_t_i_wardro/ | Skin only — KHÔNG đổi layout |
| Add Item | .../th_m_m_n_m_i_wardro/ | Skin only — KHÔNG đổi layout |
| Item Detail | .../th_ng_tin_chi_ti_t_wardro/ | Skin only — KHÔNG đổi layout |
| Edit item | .../ch_nh_s_a_m_n_wardro/ | Skin (3a) + Layout (3b) |
| Delete confirm | .../x_a_m_n_wardro/ | Skin (3a) + Layout (3b) |

### Bước 3a — Skin only (làm trước, áp dụng cho CẢ 5 màn)

Áp dụng cùng nguyên tắc như Bước 2a: chỉ màu/font/spacing token/border-radius/elevation/
component style, KHÔNG đổi bố cục (thứ tự phần tử, số cột, cấu trúc card/section, vị trí
nút bấm). Dừng lại sau khi xong, báo cáo file đã sửa, chờ xác nhận trước khi sang Bước 3b.

Với Closet List, Add Item, Item Detail: đối chiếu screenshot/code.html của Stitch CHỈ để
lấy màu/font/spacing token — bỏ qua mọi khác biệt về bố cục giữa bản Stitch và code thật
(tương tự cách xử lý Home ở Bước 4, điểm 3).

Lưu ý riêng: AI Review Draft (màn xác nhận tag AI sau khi upload) không có trong bộ
export này với tên rõ ràng — nếu không tìm thấy màn tương ứng, GIỮ NGUYÊN layout hiện
tại của AI Review Draft, chỉ áp theme màu/typography từ Bước 1 ở Bước 3a này. Xử lý như
nhóm skin-only (không có Bước 3b cho màn này).

### Bước 3b — Layout (làm sau, sau khi Bước 3a được duyệt) — CHỈ áp dụng cho Edit item
### và Delete confirm

Cập nhật bố cục/spacing/component structure khớp với code.html + screenshot tương ứng,
dùng theme trung tâm ở Bước 1 — KHÔNG copy-paste HTML từ Stitch, dùng nó làm tham chiếu
chính xác về bố cục/spacing/màu, tự chuyển đổi sang component RN hiện có.

KHÔNG đổi hành vi/logic nghiệp vụ đã pass DONE CRITERIA ở các dev prompt trước — đây
là thay đổi thuần visual. KHÔNG đụng vào Closet List, Add Item, Item Detail ở bước này.

## BƯỚC 4 — Home: CHỈ đổi skin, KHÔNG đổi cấu trúc section

Đây là ngoại lệ quan trọng nhất trong prompt này — làm đúng, đừng làm theo Bước 2/3.

1. Đọc code Home hiện tại (mobile/app/(tabs)/index.tsx hoặc tương đương), liệt kê
   đúng thứ tự section đang có trong code thật (không phải trong Stitch).
2. Với TỪNG section đã liệt kê, chỉ thay: màu sắc, font, spacing, border-radius, card
   style, button style — theo token ở Bước 1 và tham chiếu trực quan từ
   docs/design/stitch-export/.../trang_ch_wardro/screen.png.
3. KHÔNG thêm section mới, KHÔNG xóa section, KHÔNG đổi thứ tự — kể cả nếu
   trang_ch_wardro của Stitch có section khác với code thật (ví dụ Stitch có "Community
   Banner" nhưng code hiện tại không có, hoặc ngược lại) — bỏ qua khác biệt cấu trúc đó,
   chỉ lấy phần skin.
4. Nếu không chắc một thay đổi là "skin" hay "cấu trúc" (ví dụ đổi từ card 1 cột sang
   2 cột có tính là cấu trúc không?), coi đó là cấu trúc — KHÔNG đổi, hỏi lại thay vì
   tự quyết.

## BƯỚC 5 — Lưu trữ tham chiếu cho các package chưa build

Các thư mục còn lại trong docs/design/stitch-export/ (Outfit/Try-on, Events,
Marketplace, Membership/Payment, Missions) — KHÔNG implement gì trong prompt này.
Chỉ đảm bảo toàn bộ zip đã được commit vào docs/design/stitch-export/ để dùng sau khi
các package đó tới lượt build.

⚠️ Một file trong đó (n_ng_c_p_th_nh_c_ng_wardro — màn "Thanh toán thành công") có
title tag ghi "LINEN" thay vì "Wardro" — bug thương hiệu từ phía Stitch, chưa cần sửa
ngay vì Package 6 chưa build, nhưng ghi chú lại để không dùng nhầm màn này làm tham
chiếu khi tới Package 6.

---

## Sau khi xong Bước 1–4

1. Chạy lại toàn bộ test hiện có (Playwright + unit + rules + migration) — restyle có
   thể làm vỡ selector/testID đang dùng trong test nếu cấu trúc DOM/component thay đổi.
   Nếu có test fail do selector đổi (không phải do logic sai), cập nhật selector trong
   test cho khớp, không sửa lại UI để né test cũ.

   LƯU Ý: KHÔNG dùng con số "131 test" — đó là số cũ, đã sai ngay từ đầu quá trình
   (baseline thật đo lại nhiều lần trong quá trình làm, cuối Bước 4 là 43 Playwright).
   Luôn chạy lại để lấy số thật tại thời điểm đó, không copy số từ prompt này hay từ
   bất kỳ báo cáo cũ nào.

2. Build/lint/typecheck sạch.
3. Commit riêng theo từng bước con (không gộp skin + layout, không gộp Package 1 +
   Package 2 + Home vào 1 commit):
   - style(auth): apply Stitch design tokens to Package 1 screens (skin only, Bước 2a)
   - style(auth): apply Stitch layout to Package 1 screens (Bước 2b)
   - style(closet): apply Stitch design tokens to Package 2 screens (skin only, Bước 3a
     — Closet List, Add Item, Edit item, Item Detail, Delete confirm)
   - style(closet): apply Stitch layout to Edit item + Delete confirm (Bước 3b — KHÔNG
     bao gồm Closet List/Add Item/Item Detail, các màn này giữ nguyên layout)
   - style(home): apply Stitch design tokens to existing sections (skin only, no
     structural change)
   - docs: add Stitch design export reference (future packages)
4. Báo cáo: danh sách file đã sửa theo từng bước, kết quả test sau restyle, và xác
   nhận rõ Home không bị đổi cấu trúc section (liệt kê lại đúng thứ tự section trước
   và sau để đối chiếu). Xác nhận tương tự cho Closet List, Add Item, Item Detail —
   liệt kê lại cấu trúc/bố cục trước và sau để chứng minh không có thay đổi layout,
   chỉ có thay đổi token màu/font/spacing/border-radius/elevation.

KHÔNG push — chỉ commit local, chờ xác nhận.

---

## Trạng thái hoàn thành (2026-07-21) — Bước 1–5 đã đóng

Tài liệu này điều hành toàn bộ quá trình restyle Package 1 + Package 2 + Home. Ghi lại
đây để không ai phải lục lại lịch sử hội thoại để biết chuyện gì đã xảy ra.

**Bước 1 — Theme trung tâm.** Phát hiện DESIGN.md tự mâu thuẫn (frontmatter Material-3
auto-gen vs prose Espresso/Sand/Linen) — quyết định lấy prose làm chuẩn, ghi tại
ADR-09 (`11_solution_architecture.md` mục 18). Theme cũng sửa font faux-bold
(fontWeight synthetic → family name thật, DMSans_500Medium/700Bold).

**Bước 2a + 2b — Package 1 (Auth/Profile).** Đóng hoàn toàn. Điểm quan trọng:
- Help/Support + Logout confirm: giữ INLINE trong settings.tsx/profile.tsx, không tạo
  route mới — quyết định ADR-10, vì việc tách màn thuộc phạm vi R2 (Settings
  entry-point mismatch, `10_navigation_flow_map_v1.md`) đang pending PO decision.
- Ảnh còn thiếu (Style Survey, Skip confirm, Account info, Profile, Settings): dùng
  placeholder tonal Sand/Linen đúng tỷ lệ khung Stitch, track trong
  `docs/OPEN_ITEMS_assets_pending.md`.

**Bước 3a + 3b — Package 2 (Closet).** Đóng hoàn toàn. Điểm quan trọng:
- Closet List, Add Item, Item Detail: skin-only VĨNH VIỄN, không có 3b — layout giữ
  nguyên như code gốc.
- Edit item, Delete confirm: skin (3a) + layout (3b).
- Delete confirm chuyển từ `Alert.alert` native sang custom themed modal (quyết định
  riêng, không phải mặc định — xác nhận trước bằng grep không có test nào mock/assert
  `Alert.alert`). Thêm 4 test Playwright mới (AC-P2-9 → AC-P2-12).
- GAP-F: AC-P2-11 không assert được item biến mất khỏi list do `appStore.initialize()`
  re-seed mock theo route change (giới hạn demo, không phải bug sản phẩm) — deferred
  to live Firestore QA. Ghi tại `e2e_audit_report.md`.

**Bước 4 — Home.** Skin only, xác nhận không đổi cấu trúc 12 section. `gradients.hero`
+ `colors.accent` (dải hồng/plum) xác nhận là token có chủ đích của theme Bước 1, không
phải hardcode lạc — ghi ADR-11 (accent color scope: Espresso/Sand/Linen chi phối
nền/surface/component chung, accent hồng-plum là ngoại lệ có phạm vi hẹp cho AI/hero).

**Bước 5 — Lưu trữ tham chiếu.** Xác nhận đủ export cho Package 3-8 (Outfit/Try-on,
Events, Marketplace, Membership/Payment, Missions). Bug branding Package 6
(`n_ng_c_p_th_nh_c_ng_wardro` có title tag "LINEN" thay vì "Wardro") — ghi chú, chưa sửa.

**Bài học phát sinh trong quá trình (không có trong bản gốc của tài liệu này):**
- `playwright.config.ts` từng thiếu `EXPO_PUBLIC_DEMO_AUTH_BYPASS=false` + flag `--clear`
  khi build `dist-preview-unauth` — gây 8-17 fail giả (test chạy trên bản build tự
  động login mockUser). Đã sửa (`992fc6f`). Bài học: baseline e2e phải build đúng công
  thức CI thật (`deploy.yml`, không phải suy đoán từ `playwright.config.ts`), và phải đo
  TRƯỚC khi bắt đầu bất kỳ restyle nào — không phải sau khi nghi ngờ có regression.
- `docs/10_navigation_flow_map_v1.md` được BRD tham chiếu nhưng chưa từng tồn tại
  trong git history (xác nhận bằng `git log --all --full-history`) — khôi phục thủ
  công từ BA OS project knowledge (`a84cd88`).
- ADR-09/10/11 và GAP-F: quyết định thật nhưng suýt chỉ nằm trong commit message hoặc
  comment code — đã nâng lên thành ADR/gap chính thức để không ai "sửa ngược" sau này.

**Test suite tại thời điểm đóng (chạy lại ngày 2026-07-21, xem commit xác nhận):**
Playwright: 43 · Admin jest: 29 · Mobile jest: 4 ·
Firestore rules: 46 · p04-migration: 8 ·
retired-script-sanity: 5 · Tổng: 135
