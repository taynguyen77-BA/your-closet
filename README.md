# Tủ đồ của bạn (Your Closet)

AI-powered fashion mobile app — quản lý tủ đồ, gợi ý outfit, thử đồ ảo, lên lịch sự kiện, và cộng đồng Pass đồ.

## Cấu trúc dự án

```
Your Closet/
├── mobile/          # Expo (React Native) — iOS, Android, Web
├── admin/           # Next.js Admin CMS (RBAC dashboard)
├── firebase/        # Firestore + Storage security rules
├── firebase.json
└── README.md
```

## Tech stack

| Layer | Công nghệ |
|-------|-----------|
| Mobile | Expo SDK 56, React Native, TypeScript, Expo Router |
| State | Zustand |
| Backend API | Next.js API routes + Firebase Admin SDK |
| Data source | Firestore single source of truth |
| AI | Backend provider; mock chỉ khi `EXPO_PUBLIC_DEMO_MODE=true` |
| Payments | VNPay, MoMo, Apple/Google Pay — UI + constants |

## Chạy mobile app

```bash
cd mobile
cp .env.example .env   # điền đủ Firebase keys
npm install
npm run typecheck
npm start
```

Mở Expo Go trên điện thoại hoặc `npm run ios` / `npm run android`.

## 5 tab chính

1. **Trang chủ** — Thời tiết, gợi ý AI, sự kiện, thống kê, xu hướng, banner cộng đồng & shopping
2. **Tủ đồ** — Upload ảnh + AI nhận diện, grid/list, filter, chi tiết món
3. **Sự kiện** — Tạo sự kiện, gợi ý outfit AI, shopping fallback
4. **Thử đồ** — Virtual try-on theo bối cảnh (beach, urban, party…)
5. **Cá nhân** — Gói thành viên, cộng đồng, cài đặt

## Kiến trúc mobile

```
mobile/
├── app/                    # Expo Router (file-based routes)
│   ├── (tabs)/             # Bottom navigation
│   ├── community/          # Pass đồ marketplace
│   ├── missions.tsx
│   ├── membership.tsx
│   └── ...
└── src/
    ├── components/         # UI tái sử dụng
    ├── theme/              # Design system (light/dark)
    ├── models/             # TypeScript domain models
    ├── stores/             # Zustand global state
    ├── services/
    │   ├── api/            # Next.js API client + resources
    │   ├── ai/             # AI outfit, detection, try-on
    │   └── firebase/       # Firebase Auth + Storage upload
    ├── data/               # Mock data, chỉ dùng explicit demo mode
    └── constants/
```

## Design system

- **Palette:** Soft beige, white, black, warm gray, pastel pink, lavender
- **UI:** Glass cards, rounded corners, card layouts, light/dark mode
- **Typography:** System fonts, display/h1/h2 hierarchy

## Membership

| Gói | AI/tháng | Tủ đồ |
|-----|----------|-------|
| Free | 10 | 50 món |
| Premium | ∞ | ∞ |
| Elite | ∞ + stylist AI | ∞ |

## Firebase setup

1. Tạo project trên [Firebase Console](https://console.firebase.google.com)
2. Bật Authentication Email/Password, Firestore, Storage, Cloud Messaging
3. Copy Firebase config và `EXPO_PUBLIC_API_URL` vào `mobile/.env`
4. Cấu hình AI backend trong `mobile/.env`:

```bash
EXPO_PUBLIC_ENABLE_REAL_AI=true
EXPO_PUBLIC_AI_API_BASE_URL=https://your-cloud-function.example.com/ai
```

Mobile chỉ gửi Firebase ID token và dữ liệu đầu vào đến backend. Không đặt Gemini, OpenAI,
hoặc khóa AI provider nào trong biến `EXPO_PUBLIC_*`.
5. Deploy rules bằng `firebase deploy --only firestore:rules,storage`

Mobile đọc business data qua Next.js API; Firebase client SDK chỉ dùng cho Auth và Storage upload.
Nếu chưa đăng nhập, mobile chỉ đọc public config/data như plans, trends, affiliate products và
approved listings. Mock data chỉ được bật chủ động bằng `EXPO_PUBLIC_DEMO_MODE=true`.

### Firestore collections (đề xuất)

`users`, `clothes`, `outfits`, `events`, `trends`, `missions`, `plan_limits`, `user_missions`,
`listings`, `transactions`, `subscriptions`, `notification_templates`, `notifications`,
`affiliate_products`, `support_tickets`, `ai_logs`

### AI backend contract

Backend xác thực `Authorization: Bearer <Firebase ID token>`, giữ khóa provider phía server,
và triển khai:

- `POST /clothing/detect` multipart (`image`)
- `POST /outfits/recommend` JSON
- `POST /try-on/generate` multipart (`image`, `outfitItemIds`, `scene`)
- `POST /style-profile/analyze` JSON

Client không tự chuyển sang mock khi backend production không khả dụng. Production backend phải ghi `ai_logs` và trừ quota bằng transaction
phía server sau khi provider trả kết quả thành công; client chỉ giảm bộ đếm hiển thị sau khi
nhận kết quả và không ghi đè quota production. Local mock mode tự ghi log để hỗ trợ dev.
Tiến độ nhiệm vụ và cấp thưởng production cũng phải đi qua backend; Firestore rules không cho
client tự tăng quota hoặc tự đánh dấu nhiệm vụ hoàn tất.

Ảnh tủ đồ được giới hạn ở định dạng ảnh và tối đa 10 MB trong cả client lẫn Storage rules.
Storage URL hiện được đọc công khai để ảnh tin đăng cộng đồng đã duyệt có thể hiển thị; không
dùng bucket này cho ảnh riêng tư hoặc ảnh thử đồ.

## Admin portal

```bash
cd admin
cp .env.example .env.local
npm install
npm run lint
npm run build
npm run dev
```

Next.js CMS với RBAC (6 roles), 18+ modules, charts, real-time activity feed.

Chỉ bật demo local bằng `NEXT_PUBLIC_DEMO_MODE=true`. Xem `admin/README.md`.

Production: deploy Vercel/Firebase Hosting + Firebase Admin auth.

### Admin Firebase Auth và custom claims

Admin production đăng nhập bằng Firebase Auth. Tạo admin user trong Firebase Authentication, sau đó
đặt custom claims từ môi trường server tin cậy bằng Firebase Admin SDK:

```js
await admin.auth().setCustomUserClaims(uid, {
  admin: true,
  adminRole: "super_admin", // admin | moderator | support | marketing | finance
});
```

Admin cần đăng nhập lại sau khi claims thay đổi để nhận ID token mới. Portal kiểm tra cả `admin: true`
và `adminRole`, tự xóa token hết hạn, rồi chuyển về `/login`.

Biến môi trường admin:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_API_URL=https://your-api.example.com
FIREBASE_SERVICE_ACCOUNT_JSON={"project_id":"...","client_email":"...","private_key":"..."}
NEXT_PUBLIC_DEMO_MODE=false
```

Chỉ dùng `NEXT_PUBLIC_DEMO_MODE=true` khi chạy local demo. Demo mode giữ bộ tài khoản mẫu và RBAC,
không dùng cho production.

### Seed dữ liệu CMS ban đầu

```bash
cd admin
npm run seed
# tùy chọn local staging:
npm run seed -- --with-demo-users
```

## Kiểm tra trước khi deploy

```bash
cd mobile && npm run typecheck
cd ../admin && npm run lint && npm run build
cd .. && firebase deploy --only firestore:rules,storage
```

Trước production, cấu hình webhook thanh toán phía server. Mobile chỉ được tạo transaction
`pending`; client không được tự chuyển trạng thái thanh toán.

## Bước tiếp theo (production)

- [ ] Cloud Functions: triển khai AI backend contract với provider secrets và quota transaction phía server
- [ ] VNPay/MoMo webhooks
- [ ] Push notifications (FCM)
- [ ] Image moderation (Vision API)
- [ ] EAS Build cho App Store / Play Store
- [ ] Xóa ảnh Storage mồ côi khi tạo/xóa món đồ thất bại bằng Cloud Function

## License

Private — Tủ đồ của bạn © 2025
