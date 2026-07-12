import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { FieldValue, getFirestore, type DocumentReference, type Firestore, type WriteBatch } from "firebase-admin/firestore";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// SAFETY NOTE: --target-env is a HUMAN-READABLE LABEL for the audit log only.
// It has NO effect on which Firestore instance this script actually connects to.
// The real target is determined by:
//   - FIRESTORE_EMULATOR_HOST (local emulator, if set)
//   - FIREBASE_SERVICE_ACCOUNT_JSON / FIREBASE_PROJECT_ID + credentials (real project)
// Never treat --target-env as a safety boundary in code or documentation.
const REAL_PROJECT_OVERRIDE_FLAG = "--i-understand-this-writes-to-a-real-project";

type TargetEnv = "LOCAL" | "DEV" | "STG" | "PROD";
type Tier = "free" | "pro" | "premium";
type AuditChange = {
  collection: "users" | "subscriptions" | "plan_limits";
  id: string;
  field: "tier" | "plan" | "id" | "doc";
  from: string;
  to: string;
  collision?: boolean;
};

const targetEnv = readTargetEnv();
const execute = process.argv.includes("--execute");
const overrideRealProject = process.argv.includes(REAL_PROJECT_OVERRIDE_FLAG);
const outputDir = process.env.TIER_MIGRATION_OUTPUT_DIR ?? join(process.cwd(), "migration-reports");
const startedAt = new Date().toISOString();
const audit: {
  migration: string;
  targetEnv: TargetEnv;
  mode: "dry-run" | "execute";
  startedAt: string;
  finishedAt?: string;
  counts: Record<string, number>;
  warnings: string[];
  changes: AuditChange[];
} = {
  migration: "migrate-tier-enum",
  targetEnv,
  mode: execute ? "execute" : "dry-run",
  startedAt,
  counts: {},
  warnings: [],
  changes: [],
};

function readTargetEnv(): TargetEnv {
  const arg = process.argv.find((value) => value.startsWith("--target-env="))?.split("=")[1] ?? process.env.TIER_MIGRATION_TARGET_ENV;
  if (arg === "LOCAL" || arg === "DEV" || arg === "STG" || arg === "PROD") return arg;
  throw new Error("Missing required target env. Use --target-env=LOCAL|DEV|STG|PROD or TIER_MIGRATION_TARGET_ENV.");
}

function resolveProjectId(): string {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as { project_id?: string };
      if (parsed.project_id) return parsed.project_id;
    } catch { /* ignore parse errors */ }
  }
  return process.env.FIREBASE_PROJECT_ID ?? "(unknown — set FIREBASE_PROJECT_ID or FIREBASE_SERVICE_ACCOUNT_JSON)";
}

async function countdown(seconds: number): Promise<void> {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\rProceeding in ${String(i).padStart(2, " ")}s... (Ctrl+C to abort) `);
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
  }
  process.stdout.write("\n");
}

async function enforceEnvironmentGate(): Promise<void> {
  if (!execute) return; // dry-run never writes — no gating needed
  if (process.env.FIRESTORE_EMULATOR_HOST) return; // emulator mode — safe to proceed

  if (!overrideRealProject) {
    console.error(
      "\nERROR: --execute without FIRESTORE_EMULATOR_HOST detected.\n" +
        "This would write to a REAL Firestore project, which requires explicit authorization.\n\n" +
        "Options:\n" +
        "  a) Set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 to run against the local emulator (recommended).\n" +
        `     See admin/scripts/README.md for copy-pasteable setup commands.\n` +
        `  b) Add ${REAL_PROJECT_OVERRIDE_FLAG} to acknowledge you intend to write to a real project.\n` +
        "     This path echoes the resolved project ID and requires a 10-second countdown confirmation.\n\n" +
        "Aborting.",
    );
    process.exit(1);
  }

  // Override path: real project, human must confirm the project ID visually.
  const projectId = resolveProjectId();
  console.warn(
    "\n⚠️  REAL PROJECT WRITE\n" +
      `   Resolved project: ${projectId}\n` +
      `   Target env label: ${targetEnv}\n` +
      "   FIRESTORE_EMULATOR_HOST is NOT set — this will write to the live Firestore project above.\n" +
      "   If this is wrong, press Ctrl+C NOW.\n",
  );
  await countdown(10);
}

function initializeFirebase() {
  if (getApps().length) return getApps()[0]!;

  // Emulator mode: no real credentials needed — the Admin SDK routes all calls through the local emulator.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const projectId = process.env.FIREBASE_PROJECT_ID ?? "demo-your-closet";
    return initializeApp({ projectId });
  }

  // Non-emulator: real credentials required.
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!json && projectId && clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, "\n") }) });
  }
  if (!json) throw new Error("Admin credentials required. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.");
  const serviceAccount = JSON.parse(json) as ServiceAccount & { private_key?: string };
  if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  return initializeApp({ credential: cert(serviceAccount) });
}

class BatchQueue {
  private batch: WriteBatch;
  private size = 0;
  private commits: Promise<unknown>[] = [];

  constructor(
    private readonly db: Firestore,
    private readonly enabled: boolean,
  ) {
    this.batch = db.batch();
  }

  update(ref: DocumentReference, value: Record<string, unknown>) {
    if (!this.enabled) return;
    this.batch.update(ref, value);
    this.bump();
  }

  set(ref: DocumentReference, value: Record<string, unknown>, options?: { merge: boolean }) {
    if (!this.enabled) return;
    if (options) this.batch.set(ref, value, options);
    else this.batch.set(ref, value);
    this.bump();
  }

  delete(ref: DocumentReference) {
    if (!this.enabled) return;
    this.batch.delete(ref);
    this.bump();
  }

  private bump() {
    this.size += 1;
    if (this.size >= 450) this.flush();
  }

  flush() {
    if (!this.enabled || this.size === 0) return;
    this.commits.push(this.batch.commit());
    this.batch = this.db.batch();
    this.size = 0;
  }

  async done() {
    this.flush();
    await Promise.all(this.commits);
  }
}

function mapStoredTier(value: unknown): Tier | null {
  if (value === "free" || value === "pro" || value === "premium") return value;
  if (value === "elite") return "premium";
  return null;
}

void mapStoredTier; // referenced only for type-safety; actual mapping is inline per collection

function record(change: AuditChange) {
  audit.changes.push(change);
  audit.counts[change.collection] = (audit.counts[change.collection] ?? 0) + 1;
  const collision = change.collision ? " COLLISION" : "";
  console.log(`${change.collection}/${change.id} ${change.field}: ${change.from} -> ${change.to}${collision}`);
}

async function migrateValueField(db: Firestore, queue: BatchQueue, collection: "users" | "subscriptions", field: "tier" | "plan") {
  const snapshot = await db.collection(collection).where(field, "==", "elite").get();
  snapshot.forEach((doc) => {
    record({ collection, id: doc.id, field, from: "elite", to: "premium" });
    queue.update(doc.ref, { [field]: "premium", updatedAt: FieldValue.serverTimestamp() });
  });
}

async function migratePlanLimits(db: Firestore, queue: BatchQueue) {
  const planLimits = db.collection("plan_limits");
  const [oldPremium, oldElite, targetPro, targetPremium] = await Promise.all([
    planLimits.doc("premium").get(),
    planLimits.doc("elite").get(),
    planLimits.doc("pro").get(),
    planLimits.doc("premium").get(),
  ]);

  if (oldPremium.exists && !targetPro.exists) {
    const data = oldPremium.data() ?? {};
    record({ collection: "plan_limits", id: "premium", field: "id", from: "premium", to: "pro" });
    queue.set(planLimits.doc("pro"), { ...data, id: "pro", label: data.label === "Premium" ? "Pro" : data.label, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    if (!oldElite.exists) queue.delete(oldPremium.ref);
  } else if (oldPremium.exists && targetPro.exists) {
    audit.warnings.push("plan_limits/pro already exists while old plan_limits/premium exists; not overwriting pro. Review manually.");
    record({ collection: "plan_limits", id: "premium", field: "id", from: "premium", to: "pro", collision: true });
  }

  if (oldElite.exists) {
    const data = oldElite.data() ?? {};
    const collision = targetPremium.exists && targetPremium.id !== oldElite.id;
    if (collision) audit.warnings.push("plan_limits/premium already exists while plan_limits/elite exists; merging elite fields into premium requires review.");
    record({ collection: "plan_limits", id: "elite", field: "id", from: "elite", to: "premium", collision });
    queue.set(planLimits.doc("premium"), { ...targetPremium.data(), ...data, id: "premium", label: data.label === "Elite" ? "Premium" : data.label, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    queue.delete(oldElite.ref);
  }
}

async function main() {
  await enforceEnvironmentGate(); // must run BEFORE initializeFirebase()
  const app = initializeFirebase();
  const db = getFirestore(app);
  const queue = new BatchQueue(db, execute);

  console.log(`Tier enum migration target=${targetEnv} mode=${audit.mode}`);
  if (!execute) console.log("Dry-run only. Pass --execute to write changes after Technical Lead review.");

  await migrateValueField(db, queue, "users", "tier");
  await migrateValueField(db, queue, "users", "plan");
  await migrateValueField(db, queue, "subscriptions", "tier");
  await migrateValueField(db, queue, "subscriptions", "plan");
  await migratePlanLimits(db, queue);
  await queue.done();

  audit.finishedAt = new Date().toISOString();
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, `tier-migration-${targetEnv.toLowerCase()}-${startedAt.replace(/[:.]/g, "-")}.json`);
  writeFileSync(outputPath, JSON.stringify(audit, null, 2));

  console.log(`Counts: ${JSON.stringify(audit.counts)}`);
  if (audit.warnings.length) console.warn(`Warnings:\n${audit.warnings.map((warning) => `- ${warning}`).join("\n")}`);
  console.log(`Audit report: ${outputPath}`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
