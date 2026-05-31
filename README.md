# Tủ đồ của bạn (Your Closet)

AI-powered fashion mobile app — quản lý tủ đồ, gợi ý outfit, thử đồ ảo, lên lịch sự kiện, và cộng đồng Pass đồ.

## Cấu trúc dự án

```
Your Closet/
├── mobile/          # Expo (React Native) — iOS, Android, Web
├── admin/           # Admin dashboard (responsive HTML)
└── README.md
```

## Tech stack

| Layer | Công nghệ |
|-------|-----------|
| Mobile | Expo SDK 56, React Native, TypeScript, Expo Router |
| State | Zustand |
| Backend | Firebase (Auth, Firestore, Storage, FCM) — scaffold sẵn |
| AI | Service layer mock → kết nối Gemini/Cloud Functions |
| Payments | VNPay, MoMo, Apple/Google Pay — UI + constants |

## Chạy mobile app

```bash
cd mobile
cp .env.example .env   # điền Firebase keys
npm install
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
    │   ├── ai/             # AI outfit, detection, try-on
    │   └── firebase/       # Firebase init
    ├── data/               # Mock data (dev)
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
2. Bật Authentication, Firestore, Storage, Cloud Messaging
3. Copy config vào `mobile/.env`
4. Deploy Firestore rules & Cloud Functions cho AI/payments (bước tiếp theo)

### Firestore collections (đề xuất)

`users`, `clothes`, `outfits`, `events`, `trends`, `missions`, `listings`, `transactions`, `notifications`

## Admin portal

Mở `admin/index.html` trong trình duyệt — dashboard quản lý users, cộng đồng, gói, nhiệm vụ, trends, affiliate.

Production: deploy lên Firebase Hosting hoặc Vercel với auth admin.

## Bước tiếp theo (production)

- [ ] Cloud Functions: Gemini outfit + clothing detection + try-on
- [ ] VNPay/MoMo webhooks
- [ ] Push notifications (FCM)
- [ ] Image moderation (Vision API)
- [ ] EAS Build cho App Store / Play Store

## License

Private — Tủ đồ của bạn © 2025
