# Admin Scripts

## Tier enum migration

`migrate:tier-enum` migrates membership values from the old `free`/`premium`/`elite` ladder to `free`/`pro`/`premium`.

### Safety model

`--target-env=LOCAL|DEV|STG|PROD` is a **human-readable label written to the audit log only**. It has no effect on which Firestore instance the script connects to — do not treat it as a safety boundary.

The actual safety gate is:

| Mode | Behaviour |
|---|---|
| Dry-run (default) | Safe everywhere — reads only, zero writes, no gating |
| `--execute` + `FIRESTORE_EMULATOR_HOST` set | Writes to local emulator — safe |
| `--execute` without emulator | **Refused** — script exits non-zero with a clear error |
| `--execute` + `--i-understand-this-writes-to-a-real-project` | Writes to real project — echoes resolved project ID, 10-second countdown |

### Local emulator workflow (recommended before any STG/PROD run)

Requirements: Java 11+, `firebase-tools` (`npm install -g firebase-tools`).

**Step 1 — Start the emulator** (from the repo root, not admin/):

```bash
firebase emulators:start --project demo-your-closet --only firestore
```

Or from `admin/`:

```bash
npm run emulators:start
```

The emulator UI is available at http://localhost:4000.

**Step 2 — Seed test data** (from `admin/`, in a separate terminal):

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:emulator
```

The seed includes the collision case: `plan_limits/premium` already exists alongside `plan_limits/elite`.

**Step 3 — Dry-run** (reads only, zero writes):

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run migrate:tier-enum -- --target-env=LOCAL
```

Review the console output and the generated `migration-reports/tier-migration-local-*.json` audit file.

**Step 4 — Execute** (after Technical Lead review of dry-run report):

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run migrate:tier-enum -- --target-env=LOCAL --execute
```

**Step 5 — Idempotency check** (re-run execute; expect zero further changes):

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run migrate:tier-enum -- --target-env=LOCAL --execute
```

Verify emulator data at http://localhost:4000 — no `elite` values should remain, collision case should have merged.

### Running against a real project (STG/PROD)

Do NOT do this until the emulator verification above has been completed and the dry-run audit report has been reviewed by the Technical Lead.

The script will refuse to run without an explicit override flag. When you're ready:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON='...' npm run migrate:tier-enum -- --target-env=STG --execute --i-understand-this-writes-to-a-real-project
```

The script will echo the resolved project ID and count down 10 seconds before proceeding. Verify it matches the intended target before the countdown expires.

### Required inputs

- `--target-env=LOCAL|DEV|STG|PROD` or `TIER_MIGRATION_TARGET_ENV` (label for audit log)
- Firebase Admin credentials (for real project runs only):
  - `FIREBASE_SERVICE_ACCOUNT_JSON`, or
  - `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`

The script writes an audit JSON to `migration-reports/` (or `$TIER_MIGRATION_OUTPUT_DIR`) on every successful run — dry-run and execute alike. Keep these files; they are the evidence trail.
