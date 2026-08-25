# Tủ đồ Admin Portal

Enterprise CMS dashboard for **Tủ đồ của bạn** — AI-powered fashion platform.

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** — fashion-tech design tokens (beige, lavender, charcoal)
- **Recharts** — analytics
- **Zustand** — auth state (persisted)
- **Radix UI** — accessible primitives

## Run locally

```bash
cd admin
cp .env.example .env.local
npm install
npm run lint
npm run build
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → redirects to login.

### Runtime provider selection

The current development runtime does not require a Firebase project. Set `WARDRO_RUNTIME_MODE=manus` to use the server-side Manus development auth, data, storage, and AI adapters. The development identities are fixed and allowlisted: `manus-user-a`, `manus-user-b`, and `manus-admin`. The server never accepts an arbitrary client UID as authoritative.

Set `WARDRO_RUNTIME_MODE=firebase` only for the future Firebase integration phase and provide Firebase Admin configuration through deployment secrets.

`GET /health` reports the runtime mode, provider names, dependency status, and non-secret build SHA without exposing credentials.

## Firebase admin configuration (future integration)

Production mode uses Firebase Authentication and verifies ID tokens in the Next.js API with
`firebase-admin`. Configure:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_API_URL=https://your-api.example.com
FIREBASE_SERVICE_ACCOUNT_JSON='{"project_id":"...","client_email":"...","private_key":"..."}'
```

Admin Firebase users must receive `admin: true` and an `adminRole` custom claim matching one
of the roles in `src/lib/rbac.ts`. Both claims are required by the portal and API.

### Optional demo mode

Demo credentials are disabled unless `NEXT_PUBLIC_DEMO_MODE=true`. Use demo mode only for
local testing. The isolated mock dataset under `src/data/mock` is retained as seed material;
runtime admin pages do not import it.

| Email | Password | Role |
|-------|----------|------|
| admin@tuado.vn | admin123 | Super Admin |
| moderator@tuado.vn | mod123 | Moderator |
| finance@tuado.vn | fin123 | Finance |

Use **Settings → Demo: Switch RBAC role** to preview sidebar permissions without re-login.

## Modules

| Route | Module |
|-------|--------|
| `/` | Dashboard — KPIs, charts, real-time feed |
| `/users` | User management |
| `/ai` | AI systems |
| `/membership` | Plans & subscriptions |
| `/outfits` | Outfit curation |
| `/trends` | Fashion trends |
| `/missions` | Missions & rewards |
| `/community` | Marketplace moderation |
| `/affiliate` | Affiliate & campaigns |
| `/transactions` | Community transactions |
| `/payments` | Payment methods & finance |
| `/analytics` | DAU/MAU, exports |
| `/notifications` | Push & templates |
| `/support` | Tickets |
| `/moderation` | Reports |
| `/content` | CMS |
| `/security` | Audit & security logs |
| `/settings` | System & feature flags |

## API

- `GET /api/dashboard` — Firestore KPI aggregates
- `GET|POST /api/resources/:collection` — guarded Firestore list/create
- `GET|PATCH|DELETE /api/resources/:collection/:id` — guarded Firestore detail/update/delete

List endpoints support `limit`, `cursor`, `status`, `userId`, and `search`. Resource responses use:

```json
{ "data": [], "meta": { "total": 0, "limit": 50, "cursor": null } }
```

Seed CMS data before first production run:

```bash
npm run seed
```

## Manus runtime

```bash
cd admin
cp .env.example .env.local
# WARDRO_RUNTIME_MODE=manus
npm run dev
```

The core wardrobe API uses `/api/wardrobe/upload` and `/api/wardrobe/items*`. Manus image objects are served through protected `/api/manus-storage/*` capability URLs and persisted in the development storage directory; they are not raw filesystem URLs.

## Production / future Firebase integration

1. Configure Firebase environment variables and custom claims
2. Deploy: `vercel` or Firebase Hosting (`npm run build && firebase deploy`)
3. Keep `NEXT_PUBLIC_DEMO_MODE` unset in production

## Firestore collections

See `src/types/database.ts` and root `README.md` for aligned domain models.
