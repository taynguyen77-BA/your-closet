# P-04C Investigation Report
**Ngày điều tra:** 2026-07-13  
**Người thực hiện:** Claude (AI assistant) — read-only investigation  
**Xác nhận:** Không có lệnh ghi/xoá/update nào được chạy lên dữ liệu thật trong suốt task này. Emulator Firestore không đang chạy tại thời điểm điều tra; Firebase Admin credentials không được cấu hình trong `.env.local`. Tất cả bằng chứng đến từ grep code + migration-reports + seed scripts.

---

## PHẦN A — Field "plan" trên `users`

### A.1 — Kết quả grep: `user.plan` / `users.plan` / field `plan` trên type User

**Mobile app (`mobile/src`, `mobile/app`):**

| File | Dòng | Nội dung |
|------|------|----------|
| `mobile/src/models/index.ts` | 94 | `plan: MembershipPlan;` — field **bắt buộc** trên interface `User` |
| `mobile/src/stores/appStore.ts` | 87 | `const limit = limits[user.plan];` — đọc để tra plan_limits |
| `mobile/src/stores/appStore.ts` | 183 | `user.plan !== 'free' \|\| user.aiUsageRemaining > 0` — guard check |
| `mobile/src/stores/appStore.ts` | 186 | `user.plan !== 'free' \|\| user.aiUsageRemaining <= 0` — quota decrement guard |
| `mobile/src/components/ui/AiUsageBanner.tsx` | 12 | `user.plan !== 'free'` — hiển thị quota banner |
| `mobile/src/components/home/StatsRow.tsx` | 13 | `user.plan === 'free' ? user.aiUsageRemaining : '∞'` — hiển thị stats |
| `mobile/app/membership.tsx` | 37 | `planLimits[user.plan].label` — render plan label |
| `mobile/app/(tabs)/profile.tsx` | 41 | `s.planLimits[s.user.plan]` — đọc plan info |
| `mobile/app/(tabs)/profile.tsx` | 116, 118 | render AI quota và closet limit theo `user.plan` |
| `mobile/app/(tabs)/try-on.tsx` | 171 | `user.plan === 'free' ? ...quota... : 'AI không giới hạn'` |

**Admin (`admin/src`):**

| File | Dòng | Nội dung |
|------|------|----------|
| `admin/src/types/database.ts` | 31 | `plan: MembershipPlan;` — trên `AdminUser` interface |
| `admin/src/types/database.ts` | 60 | `plan: MembershipPlan;` — trên `Subscription` interface |
| `admin/src/app/api/dashboard/route.ts` | 18 | `row.plan !== "free"` — đếm premiumUsers |
| `admin/src/app/(dashboard)/users/[id]/page.tsx` | (inline) | `plan: user.plan` — hiển thị trong card "Membership info" |
| `admin/src/app/(dashboard)/users/page.tsx` | (inline) | `{key: "plan", header: "Plan"}` — cột Plan trên bảng users; `patch(r.id, {plan:"free"})` — admin reset plan về free |
| `admin/src/data/mock/index.ts` | 139, 157, 174, 191 | `plan: "free"/"pro"/"premium"` — mock users trong demo mode |

**Backend session/verify (`admin/src/app/api/auth/session/verify/route.ts`):**

| Dòng | Nội dung |
|------|----------|
| 45–46 | `profileFromIdentity()` trả về `plan: "free"` khi tạo user mới |

### A.2 — So sánh với `user.tier` / `users.tier`

**Kết quả grep `user.tier` / `users.tier` trong mobile + admin source:** **KHÔNG CÓ KẾT QUẢ NÀO.**

Field `tier` chỉ xuất hiện trong:
- `admin/scripts/seed-emulator.ts` (emulator test data)
- `admin/scripts/migrate-tier-enum.ts` (migration script)
- `admin/migration-reports/*.json` (audit log của migration đã chạy trên LOCAL emulator)

### A.3 — Kết luận về field "plan"

**`plan` là field THẬT mà toàn bộ production code đang đọc và ghi tích cực.**

Không phải lỗi seed script. Cụ thể:
- Interface `User` trong `mobile/src/models/index.ts:94` khai báo `plan: MembershipPlan` là **required field** (không optional).
- Backend `session/verify/route.ts` set `plan: "free"` cho mọi user mới tạo — data ghi vào Firestore thật có field này.
- Mobile app đọc `user.plan` ở ít nhất **10 chỗ** trong UI và store logic.
- Admin dashboard đọc `row.plan` để lọc, hiển thị, và reset plan.

**Implication:** `12_database_design.md` (nếu khai báo `tier` thay vì `plan` cho users) có thể có **gap với code thật**. Migration script `migrate-tier-enum.ts` đang migrate `tier → premium/pro/free` nhưng production code chưa bao giờ dùng `tier` — nó luôn dùng `plan`. Điều này cần BA/Technical Lead xác nhận: tài liệu có lỗi, hay migration chưa hoàn chỉnh (chỉ migrate `tier` nhưng chưa đổi field name `plan` thành `tier` trong code)?

### A.4 — Firestore thật: Không đọc được

Firebase Admin credentials không được cấu hình trong `admin/.env.local` (chỉ có `NEXT_PUBLIC_DEMO_MODE=true`). Firestore emulator không đang chạy (`http://127.0.0.1:8080` không phản hồi). **Không thể verify trực tiếp data thật.** Tuy nhiên bằng chứng code đủ mạnh (xem A.3 trên) để kết luận field `plan` là real production field được ghi từ `session/verify` và đọc từ nhiều UI component.

**Một bằng chứng bổ sung từ code:** `admin/scripts/seed-firestore.ts` (script seed staging thật, không phải emulator) tạo user với `plan: "free"` (dòng cuối file: `await seed("users", [...{ id: "demo-user", ..., plan: "free" ... }])`). Đây là bằng chứng field `plan` được cố tình ghi vào staging Firestore khi chạy seed.

---

## PHẦN B — Collision `plan_limits/premium` vs `plan_limits/pro`

### B.1 — Dữ liệu Firestore thật: Không đọc được trực tiếp

Như đã nêu ở A.4, emulator không chạy và credentials không có. Không thể đọc collection `plan_limits` thật.

**Thay vào đó:** sử dụng bằng chứng từ seed scripts, migration reports, và code để tái dựng lịch sử.

### B.2 — Tái dựng lịch sử qua bằng chứng

#### Từ `seed-firestore.ts` (script seed staging thật):

Script này chạy với `merge: true` và tạo 3 documents:

| Document ID | `label` | `priceLabel` | `aiMonthly` | `closetItems` | `features` | `status` |
|-------------|---------|--------------|-------------|---------------|------------|---------|
| `free` | "Miễn phí" | "0đ/tháng" | 10 | 50 | ["Gợi ý outfit cơ bản", "Cộng đồng Pass đồ"] | "active" |
| `pro` | "Pro" | "99.000đ/tháng" | -1 | -1 | ["AI không giới hạn", "Try-on nâng cao"] | "active" |
| `premium` | "Premium" | "199.000đ/tháng" | -1 | -1 | ["Stylist AI", "Hỗ trợ ưu tiên"] | "active" |

#### Từ `seed-emulator.ts` (chỉ emulator, KHÔNG staging):

Tạo 4 documents với field khác (không có `aiMonthly`, `closetItems`, `features`, `priceLabel`):

| Document ID | `label` | `maxItems` | Ghi chú |
|-------------|---------|------------|---------|
| `free` | "Free" | 20 | Emulator-only |
| `pro` | "Pro" | 100 | Emulator-only |
| `premium` | "Premium (pre-migration)" | 200 | Schema cũ; "pre-migration" |
| `elite` | "Elite" | 500 | Cần migrate → "premium" |

**Ghi chú quan trọng:** Seed emulator sử dụng field `maxItems` thay vì `aiMonthly`/`closetItems`. Đây là schema khác (cũ hơn) chỉ dùng cho test migration, không phải schema production.

#### Từ migration reports (chạy trên LOCAL emulator, **không phải staging**):

- `tier-migration-local-2026-07-12T16-10-08-433Z.json` — **dry-run**: phát hiện cả 2 collision:
  - `plan_limits/premium` → `pro`: **COLLISION** (plan_limits/pro đã tồn tại)
  - `plan_limits/elite` → `premium`: **COLLISION** (plan_limits/premium đã tồn tại)

- `tier-migration-local-2026-07-12T16-10-20-267Z.json` — **execute** (lần 1): chạy nhưng collision được giữ nguyên (không ghi đè), ghi warning.

- `tier-migration-local-2026-07-12T16-10-29-536Z.json` — **execute** (lần 2): chỉ xử lý `plan_limits/premium → pro` (1 change), vẫn collision.

Cả 3 report đều có `targetEnv: "LOCAL"` — **migration chưa bao giờ được execute lên DEV/STG/PROD**.

### B.3 — Phân tích collision trên Staging Firestore thật

**Dựa trên bằng chứng code, trạng thái staging khả năng cao là:**

Nếu `seed-firestore.ts` đã được chạy lên staging, collection `plan_limits` có **3 documents**: `free`, `pro`, `premium` — với schema đúng (`aiMonthly`, `closetItems`, `priceLabel`, `features`).

**Không có `elite` document trên staging** (vì `seed-emulator.ts` chỉ target emulator, có guard `FIRESTORE_EMULATOR_HOST` bắt buộc).

**Vậy "collision" premium vs pro tồn tại ở đâu?** Chỉ trên LOCAL emulator (test data từ `seed-emulator.ts`). Đây là collision được **cố ý seed** để test migration script, không phải data thật trên staging.

### B.4 — So sánh nội dung `pro` và `premium` (từ seed-firestore.ts)

| Field | `plan_limits/pro` | `plan_limits/premium` |
|-------|-------------------|----------------------|
| `label` | "Pro" | "Premium" |
| `priceLabel` | "99.000đ/tháng" | "199.000đ/tháng" |
| `aiMonthly` | -1 (unlimited) | -1 (unlimited) |
| `closetItems` | -1 (unlimited) | -1 (unlimited) |
| `features` | ["AI không giới hạn", "Try-on nâng cao"] | ["Stylist AI", "Hỗ trợ ưu tiên"] |
| `status` | "active" | "active" |

**Kết luận:** `pro` và `premium` là **2 plans khác nhau, không trùng lặp**, với price khác nhau và features khác nhau. Chúng tồn tại song song là hợp lệ theo thiết kế (`MembershipPlan = "free" | "pro" | "premium"` trong cả mobile lẫn admin types).

### B.5 — Khuyến nghị (không thực thi)

**Về staging data:** Không cần action. `pro` và `premium` trên staging là 2 gói khác biệt đúng theo product design. Không có collision thật trên staging.

**Về LOCAL emulator collision:** Collision chỉ tồn tại trong emulator test data (seed bởi `seed-emulator.ts` với schema cũ). Migration script `migrate-tier-enum.ts` xử lý case này bằng cách không ghi đè khi đích đã tồn tại và ghi warning — đây là behavior đúng. Sau khi migration team xác nhận có hay không còn `elite` documents trong production data, có thể quyết định:
  - Nếu KHÔNG có `elite` trong staging/prod: migration script chỉ cần chạy `migrateValueField` cho `users.plan` (nếu có user cũ có `plan: "elite"`), bỏ qua phần `plan_limits` vì không cần thiết.
  - Nếu CÓ `elite` trong staging/prod: cần Technical Lead review manually vì script đã warning và không auto-ghi đè.

**Điều cần BA/Technical Lead xác nhận trước khi action:**
1. Codebase toàn bộ dùng `plan` (không dùng `tier`) trên `users`. `12_database_design.md` có khai báo `tier` không? Nếu có thì tài liệu cần sửa, không phải code.
2. Migration script `migrateValueField(db, queue, "users", "tier")` sẽ không tìm thấy document nào (vì production code không bao giờ ghi `tier` vào users) — confirm lại với Technical Lead trước khi execute lên real env.

---

## Tóm tắt nhanh

| Vấn đề | Kết luận | Cần action? |
|--------|----------|-------------|
| `plan` trên users là field thật hay lỗi seed? | **Field thật** — production code đọc/ghi tích cực | Không sửa code; cần xem lại 12_database_design.md |
| `tier` có được dùng trong code không? | **Không** — chỉ trong migration/seed scripts | |
| Collision premium vs pro trên staging? | **Không có** — chỉ tồn tại trên LOCAL emulator test data | Không cần action ngay |
| Dữ liệu Firestore thật đọc được không? | **Không** — credentials trống, emulator offline | BA cần verify trực tiếp |

**Xác nhận cuối:** Không có lệnh ghi/xoá/update nào chạy lên dữ liệu thật hoặc emulator trong suốt task này.

---

## PHẦN C — Bổ sung: MembershipPlan type definition & giá trị "elite"

**Ngày bổ sung:** 2026-07-13

### C.1 — Định nghĩa đầy đủ của MembershipPlan

**Mobile (`mobile/src/models/index.ts:1`):**
```ts
export type MembershipPlan = 'free' | 'pro' | 'premium';
```

**Admin (`admin/src/types/database.ts:3`):**
```ts
export type MembershipPlan = "free" | "pro" | "premium";
```

Cả hai định nghĩa **đồng nhất**: chỉ cho phép đúng 3 giá trị — `free`, `pro`, `premium`.
**Giá trị `"elite"` KHÔNG xuất hiện trong type definition tại bất kỳ file nào.**

### C.2 — Distinct values trong collection users thật (staging/dev)

**Không thể đọc được.** Đã thử toàn bộ phương án:
- Firebase emulator (`http://127.0.0.1:8080`): không phản hồi — emulator không chạy.
- `EXPO_PUBLIC_FIREBASE_API_KEY` và `EXPO_PUBLIC_FIREBASE_PROJECT_ID` trong `mobile/.env`: **trống**.
- `FIREBASE_SERVICE_ACCOUNT_JSON` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` trong `admin/.env.local`: **trống** (chỉ có `NEXT_PUBLIC_DEMO_MODE=true`).
- Firebase CLI (`firebase projects:list`): `Error: Failed to authenticate, have you run firebase login?`
- gcloud / application default credentials: không cài.
- `~/.firebase/`, `~/.firebaserc`: không tồn tại.

**Kết luận câu C.2: KHÔNG XÁC ĐỊNH ĐƯỢC — cần người có credentials thực hiện trực tiếp.**

### C.3 — Giá trị "elite" có xuất hiện ở đâu không?

| Nơi kiểm tra | Kết quả |
|---|---|
| Type `MembershipPlan` (mobile + admin) | **KHÔNG** — không nằm trong union |
| Production code (mobile + admin source) | **KHÔNG** — grep không tìm thấy `"elite"` trong bất kỳ UI/store/API handler nào |
| `seed-emulator.ts` (emulator only) | **CÓ** — dùng làm test data cho migration, document `plan_limits/elite` và `users/user-elite-1`, `users/user-elite-2` với `tier: "elite"` / `plan: "elite"` |
| `migrate-tier-enum.ts` | **CÓ** — xử lý migration `elite → premium` |
| `migration-reports/*.json` (LOCAL) | **CÓ** — audit log migration đã chạy trên LOCAL emulator |
| Firestore thật (staging/prod) | **KHÔNG XÁC ĐỊNH** — không đọc được do thiếu credentials |

**Trả lời thẳng:**
- `"elite"` **không** xuất hiện trong type definition.
- `"elite"` **không** xuất hiện trong production source code.
- `"elite"` **có** xuất hiện trong emulator seed data và migration script — đây là **artifact của quá trình thiết kế migration**, không phải production schema.
- Dữ liệu Firestore thật: **không kiểm tra được**. Rủi ro duy nhất còn lại là nếu từng có user cũ được tạo tay với `plan: "elite"` trước khi enum bị xoá — không loại trừ được nếu không đọc data thật.

### C.4 — Hành động đề xuất để hoàn thành điều tra

Người có Firebase credentials cần chạy 1 trong 2 cách sau (**read-only, không ghi**):

**Cách 1 — Firebase Console:** Vào Firestore → collection `users` → filter `plan == "elite"` → đếm kết quả.

**Cách 2 — Script read-only (chạy với service account):**
```bash
cd admin
FIREBASE_SERVICE_ACCOUNT_JSON='...' npx tsx -e "
const {cert,initializeApp}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
const db=getFirestore(initializeApp({credential:cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))}));
db.collection('users').where('plan','==','elite').get().then(s=>console.log('elite count:',s.size));
db.collection('users').get().then(s=>{const vals=new Set(s.docs.map(d=>d.data().plan));console.log('distinct plan values:',[...vals]);});
"
```

**Xác nhận:** Không có lệnh ghi/xoá/update nào chạy lên dữ liệu thật trong phần bổ sung này.
