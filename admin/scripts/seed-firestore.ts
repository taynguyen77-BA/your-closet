import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const serviceAccount = json ? JSON.parse(json) as ServiceAccount & { private_key?: string } : null;
if (serviceAccount?.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
const credential = serviceAccount ? cert(serviceAccount) : cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") });
const db = getFirestore(initializeApp({ credential })); const now = new Date().toISOString();
const seed = async (collection: string, rows: Record<string, unknown>[]) => Promise.all(rows.map(({ id, ...data }) => db.collection(collection).doc(String(id)).set({ ...data, createdAt: now, updatedAt: now, createdBy: "seed", updatedBy: "seed" }, { merge: true })));
async function main() {
  await seed("plan_limits", [{ id: "free", label: "Miễn phí", priceLabel: "0đ/tháng", aiMonthly: 10, closetItems: 50, features: ["Gợi ý outfit cơ bản", "Cộng đồng Pass đồ"], status: "active" }, { id: "pro", label: "Pro", priceLabel: "99.000đ/tháng", aiMonthly: -1, closetItems: -1, features: ["AI không giới hạn", "Try-on nâng cao"], status: "active" }, { id: "premium", label: "Premium", priceLabel: "199.000đ/tháng", aiMonthly: -1, closetItems: -1, features: ["Stylist AI", "Hỗ trợ ưu tiên"], status: "active" }]);
  await seed("missions", [{ id: "daily-checkin", title: "Điểm danh hàng ngày", description: "Mở app mỗi ngày", type: "daily_checkin", rewardAiTries: 1, target: 1, status: "active", isActive: true }]);
  await seed("notification_templates", [{ id: "outfit-reminder", name: "Outfit reminder", title: "Hôm nay mặc gì?", body: "AI đã chuẩn bị outfit cho bạn", channel: "push", sentCount: 0, status: "active" }]);
  await seed("trends", [{ id: "coastal-linen", name: "Coastal Linen", description: "Linen và tone be nhẹ nhàng", season: "Summer", category: "Casual", status: "published", views: 0, saves: 0, adoptionRate: 0, matchingItemIds: [], missingItemSuggestions: [] }]);
  await seed("cms_content", [
    { id: "home-hero-staging", key: "home.hero", type: "home_banner", title: "Tủ đồ thật, gợi ý thật", body: "Đồng bộ wardrobe, cộng đồng và AI từ staging API.", locale: "vi-VN", status: "published", sortOrder: 1 },
    { id: "onboarding-style-survey", key: "onboarding.style_survey", type: "onboarding_slide", title: "Cá nhân hoá gu của bạn", body: "Các thay đổi CMS sẽ được mobile đọc qua API mà không cần deploy lại app.", locale: "vi-VN", status: "published", sortOrder: 10 },
    { id: "faq-upload-images", key: "faq.upload_images", type: "faq", title: "Ảnh tủ đồ được lưu ở đâu?", body: "Ảnh staging được upload lên Firebase Storage và metadata được lưu trong Firestore.", locale: "vi-VN", status: "published", sortOrder: 20 },
  ]);
  await seed("admin_settings", [
    { id: "feature_flags", scope: "mobile", value: { virtualTryOn: true, communityMarket: true, affiliateShop: true, missions: true }, status: "active" },
    { id: "ai", scope: "backend", value: { provider: process.env.AI_PROVIDER ?? "external", quotaManagedByBackend: true }, status: "active" },
  ]);
  await seed("affiliate_products", [{
    id: "linen-shirt",
    name: "Linen Shirt",
    store: "Your Closet Picks",
    partnerName: "Your Closet Picks",
    link: "https://example.com/linen-shirt",
    deeplink: "https://example.com/linen-shirt?utm_source=yourcloset",
    trackingCode: "YC-SEED-LINEN",
    category: "top",
    type: "top",
    colors: ["Beige", "White"],
    styleTags: ["minimal", "linen", "summer", "office"],
    sizes: ["S", "M", "L"],
    gender: "unisex",
    price: 590000,
    commissionRate: 0.08,
    clicks: 0,
    conversions: 0,
    revenueVnd: 0,
    status: "active",
    isActive: true,
  }]);
  await seed("listings", [{ id: "sample-listing", userId: "seed-public", sellerName: "Your Closet", clothingItemId: "sample-item", title: "Váy midi vintage", description: "Sample public listing", imageUrls: [], condition: "like_new", listingType: "sale", price: 350000, location: "TP.HCM", tags: ["sample"], status: "approved", reportsCount: 0 }]);
  if (process.argv.includes("--with-demo-users")) await seed("users", [{ id: "demo-user", username: "demo_user", email: "demo@example.com", plan: "free", status: "active", aiUsageRemaining: 10, aiUsageMonthlyLimit: 10, closetItemCount: 0, closetItemLimit: 50 }]);
}
main().then(() => console.log("Firestore seed complete.")).catch((error) => { console.error(error); process.exitCode = 1; });
