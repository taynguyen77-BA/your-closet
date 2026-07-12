import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Filter } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";
import { corsHeaders } from "@/lib/server/resources";

export const runtime = "nodejs";

type AuthProviderName = "phone" | "google" | "facebook";
type UserProfile = Record<string, unknown> & {
  id: string;
  uid: string;
  email: string;
  phoneNumber?: string;
  authProvider: AuthProviderName;
  provider: AuthProviderName;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
};

const supportedSignInProviders = new Set(["phone", "google.com", "facebook.com"]);
const freePlanLimits = { aiMonthly: 10, closetItems: 50 };

function providerFromFirebaseProvider(signInProvider?: string): AuthProviderName {
  if (signInProvider === "google.com") return "google";
  if (signInProvider === "facebook.com") return "facebook";
  if (signInProvider === "phone") return "phone";
  throw new Error("UNSUPPORTED_PROVIDER");
}

function profileFromIdentity(identity: {
  uid: string;
  name?: string;
  email?: string;
  picture?: string;
  phoneNumber?: string;
}, provider: AuthProviderName, at: string): UserProfile {
  const displayName = identity.name ?? "";
  return {
    id: identity.uid,
    uid: identity.uid,
    name: displayName,
    displayName,
    username: "",
    email: identity.email ?? "",
    avatarUrl: identity.picture ?? "",
    authProvider: provider,
    phoneNumber: identity.phoneNumber ?? "",
    provider,
    biometricEnabled: false,
    hasCompletedStyleSurvey: false,
    styleSurveySkipped: false,
    styleProfileCompletionPercent: 0,
    stylePreferences: {
      preferredStyles: [],
      favoriteColors: [],
      lifestyleOccasions: [],
      fashionConfidence: "",
      updatedAt: at,
    },
    plan: "free",
    aiUsageRemaining: freePlanLimits.aiMonthly,
    aiUsageMonthlyLimit: freePlanLimits.aiMonthly,
    aiQuotaPeriod: at.slice(0, 7),
    closetItemLimit: freePlanLimits.closetItems,
    closetItemCount: 0,
    status: "active",
    createdAt: at,
    updatedAt: at,
    lastLoginAt: at,
  };
}

function json(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const { idToken } = await request.json().catch(() => ({ idToken: "" }));
  if (!idToken || typeof idToken !== "string") return NextResponse.json({ error: "Missing idToken" }, { status: 400, headers: corsHeaders });

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const signInProvider = decoded.firebase?.sign_in_provider;
    if (!supportedSignInProviders.has(signInProvider ?? "")) throw new Error("UNSUPPORTED_PROVIDER");

    const provider = providerFromFirebaseProvider(signInProvider);
    const uid = decoded.uid;
    const email = typeof decoded.email === "string" ? decoded.email : "";
    const phoneNumber = typeof decoded.phone_number === "string" ? decoded.phone_number : "";
    const users = adminDb.collection("users");
    const now = new Date().toISOString();

    const result = await adminDb.runTransaction(async (transaction) => {
      const currentRef = users.doc(uid);
      const currentSnapshot = await transaction.get(currentRef);

      if (currentSnapshot.exists) {
        transaction.update(currentRef, { lastLoginAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
        return { profile: { id: uid, ...currentSnapshot.data(), lastLoginAt: now, updatedAt: now }, canonicalUid: uid };
      }

      const identityFilter = phoneNumber
        ? Filter.where("phoneNumber", "==", phoneNumber)
        : email
          ? Filter.where("email", "==", email)
          : null;

      const existingSnapshot = identityFilter
        ? await transaction.get(users.where(identityFilter).limit(1))
        : null;
      const existingDoc = existingSnapshot?.docs[0];

      if (existingDoc) {
        transaction.update(existingDoc.ref, { lastLoginAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
        return { profile: { id: existingDoc.id, ...existingDoc.data(), lastLoginAt: now, updatedAt: now }, canonicalUid: existingDoc.id };
      }

      const profile = profileFromIdentity({
        uid,
        name: decoded.name,
        email,
        picture: typeof decoded.picture === "string" ? decoded.picture : "",
        phoneNumber,
      }, provider, now);
      transaction.set(currentRef, { ...profile, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), lastLoginAt: FieldValue.serverTimestamp() });
      return { profile, canonicalUid: uid };
    });

    const customToken = result.canonicalUid === uid ? undefined : await adminAuth.createCustomToken(result.canonicalUid);
    return json({ user: result.profile, customToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : "INVALID_SESSION";
    const status = message === "UNSUPPORTED_PROVIDER" ? 403 : 401;
    return NextResponse.json({ error: message }, { status, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
