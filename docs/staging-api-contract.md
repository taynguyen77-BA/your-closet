# Staging API Contract

The staging backend is the Next.js admin deployment. Mobile and admin must use the same `*_API_BASE_URL` and the same Firebase project.

## Envelope

All resource endpoints return:

```json
{ "data": {}, "meta": { "total": 1, "limit": 50, "cursor": null } }
```

Errors return:

```json
{ "error": "MESSAGE" }
```

Authenticated mobile requests send `Authorization: Bearer <Firebase ID token>`. Admin requests use the same header with an admin Firebase token.

## Health

`GET /health`

Returns backend dependency state:

```json
{
  "status": "ok",
  "environment": "staging",
  "demoMode": false,
  "dependencies": {
    "auth": { "status": "ok" },
    "database": { "status": "ok" },
    "storage": { "status": "ok" },
    "ai": { "status": "ok" }
  }
}
```

## Resources

Generic resource endpoints:

- `GET /api/resources/:collection`
- `GET /api/resources/:collection/:id`
- `POST /api/resources/:collection`
- `PATCH /api/resources/:collection/:id`
- `DELETE /api/resources/:collection/:id`

Supported staging collections:

- Authentication user profile: `users`
- Wardrobe items: `clothes`
- Image upload metadata and confirmed AI analysis: `clothes.imageUrl`, `clothes.originalImageUrl`, `clothes.enhancedImageUrl`, `clothes.aiMetadata`, `clothes.aiConfidenceScore`, `clothes.aiQualityWarnings`
- Outfit suggestions saved by user: `outfits`
- Events/trips: `events`
- Missions: `missions`, `user_missions`
- License/subscription plans: `plan_limits`, `subscriptions`, `transactions`
- Community posts/listings: `listings`, `marketplace_messages`, `trade_offers`, `listing_reports`
- CMS content: `cms_content`
- Admin settings: `admin_settings`
- AI usage audit: `ai_logs`
- Affiliate/CMS commerce: `affiliate_products`, `shopping_events`

Public mobile-readable records:

- `plan_limits` where `status=active`
- `missions` where `status=active` or `isActive=true`
- `trends` where `status=published`
- `affiliate_products` where `status=active` or `isActive=true`
- `listings` where `status=approved`
- `cms_content` where `status=published`

Owner-scoped mobile records:

- `users.id === auth.uid`
- `clothes.userId === auth.uid`
- `outfits.userId === auth.uid`
- `events.userId === auth.uid`
- `user_missions.userId === auth.uid`
- `notifications.userId === auth.uid`
- `ai_logs.userId === auth.uid`

## Auth

`POST /api/auth/session/verify`

Body: `{ "idToken": "<Firebase ID token>" }`. Verifies the token server-side, creates/links the `users/{uid}` profile on first sign-in, and returns `{ user, customToken? }`. `customToken` is only returned when the identity was merged into a different canonical `uid` (cross-provider linking).

`DELETE /api/auth/account`

Requires `Authorization: Bearer <Firebase ID token>` issued by a real sign-in (Google/Facebook re-consent or phone OTP re-verify) within the last 5 minutes — a still-valid but older session token is rejected with `{ "error": "REAUTH_REQUIRED" }` (401). On success, permanently deletes the caller's own records from `clothes`, `outfits`, `events`, `user_missions`, `notifications`, `listings`, `marketplace_messages` (messages authored by the user, i.e. `senderId`), and `subscriptions`, then deletes the `users/{uid}` profile document and the Firebase Auth account. Anonymized/aggregated statistics are not touched. Returns `{ "data": { "deleted": true } }`.

## AI

Mobile calls the same backend host via:

- `POST /api/ai/clothing/detect`
- `POST /api/ai/clothing/analyze-and-enhance`
- `POST /api/ai/outfits/recommend`
- `POST /api/ai/try-on/generate`
- `POST /api/ai/style-profile/analyze`

The backend proxies these to `AI_API_BASE_URL`. If AI is unavailable, staging must return an error. Mobile must show a clear error state and must not substitute mock AI output unless `EXPO_PUBLIC_DEMO_MODE=true`.

## Storage

Wardrobe and avatar images are uploaded to Firebase Storage. The resulting public/download URL is saved to Firestore metadata after user confirmation. Staging must not use local file URIs as persistent image URLs.
