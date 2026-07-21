# ⚠️ Stitch export — brand/branding bugs (đọc trước khi dùng export làm reference)

Đây là các lỗi thương hiệu **có sẵn trong bản export gốc từ Stitch**. Chúng KHÔNG được
sửa trong file export (export là tham chiếu read-only). Ghi lại ngay tại thư mục
`stitch-export/` để lúc build package tương ứng nhìn thấy ngay, không dùng nhầm.

## BUG-1 — Màn "Thanh toán thành công" có title tag "LINEN" thay vì "Wardro"

- **File:** `stitch_wardro_editorial_design_system/n_ng_c_p_th_nh_c_ng_wardro/code.html`
- **Lỗi:** thẻ `<title>` ghi `Thanh toán thành công | LINEN` — sai wordmark, phải là
  "Wardro". Mọi màn khác dùng đúng "Wardro" (vd `n_ng_c_p_tr_i_nghi_m_wardro` →
  `<title>Wardro | Membership Comparison</title>`). Đây là màn DUY NHẤT dính lỗi này
  (đã quét toàn bộ export: chỉ 1 file khớp `<title>…LINEN`).
- **Tại sao chưa sửa:** thuộc **Package 6 (Membership/Payment)** — package này CHƯA
  được build. Không sửa file export gốc vì nó là reference read-only; việc sửa branding
  sẽ nằm trong code khi Package 6 tới lượt implement.
- **⚠️ CẢNH BÁO khi tới Package 6:** KHÔNG copy nguyên title/wordmark từ màn này. Khi
  dựng màn "Thanh toán thành công", dùng "Wardro" (không phải "LINEN"). Nếu vẫn muốn
  dùng `code.html` này làm tham chiếu bố cục/token thì được, nhưng phải sửa wordmark
  thành "Wardro" ở bản implement.
- **Cross-ref:** ADR-09 (`docs/11_solution_architecture.md` mục 18) đã ghi nhận export
  này nội bộ mâu thuẫn; và `docs/OPEN_ITEMS_assets_pending.md` (mục "Export reference
  caveats — forward packages") cũng note cùng bug này.

## Ghi chú phụ (không phải branding bug, nêu để minh bạch)

- Một số màn export **không có thẻ `<title>`** (vd `ch_o_m_ng_n_v_i_wardro`,
  `tr_gi_p_h_tr_wardro`, `x_c_nh_n_th_ng_tin_wardro`, …). Đây là thiếu sót nhỏ của bản
  export, không phải lỗi thương hiệu và không ảnh hưởng việc dùng làm reference
  bố cục/token. Không cần xử lý.
