import type {
  ActivityFeedItem,
  AdminAuditLog,
  AdminUser,
  AffiliateCampaign,
  AffiliateProduct,
  AiLogEntry,
  ChartPoint,
  CommunityListing,
  ContentReport,
  DashboardKpis,
  FashionTrend,
  MembershipPlanConfig,
  Mission,
  NotificationTemplate,
  OutfitRecord,
  SecurityLog,
  Subscription,
  SupportTicket,
  Transaction,
} from "@/types/database";

export const dashboardKpis: DashboardKpis = {
  totalUsers: 24850,
  activeUsers: 8420,
  premiumUsers: 3120,
  dailyAiUsage: 18420,
  communityTransactions: 486,
  revenueVnd: 425000000,
  commissionVnd: 42800000,
  outfitGenerations: 52100,
  trendingOutfit: "Minimal Linen Summer",
  mostActiveUser: "Lan Hương",
};

export const activityFeed: ActivityFeedItem[] = [
  {
    id: "a1",
    type: "registration",
    title: "Đăng ký mới",
    description: "user_minhanh đã tạo tài khoản",
    createdAt: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "a2",
    type: "community_post",
    title: "Listing mới",
    description: "Áo sơ mi linen — chờ duyệt",
    createdAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: "a3",
    type: "report",
    title: "Báo cáo nội dung",
    description: "Listing #L-2841 bị báo spam",
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: "a4",
    type: "purchase",
    title: "Giao dịch hoàn tất",
    description: "350.000đ — Váy midi vintage",
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: "a5",
    type: "subscription",
    title: "Nâng cấp Premium",
    description: "thu_nguyen → Premium",
    createdAt: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: "a6",
    type: "ai_generation",
    title: "AI outfit",
    description: "42 outfit được tạo trong 5 phút qua",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

export const userGrowthChart: ChartPoint[] = [
  { label: "T1", value: 1200 },
  { label: "T2", value: 1850 },
  { label: "T3", value: 2400 },
  { label: "T4", value: 3100 },
  { label: "T5", value: 4200 },
  { label: "T6", value: 5800 },
  { label: "T7", value: 8420 },
];

export const revenueChart: ChartPoint[] = [
  { label: "T1", value: 280000000 },
  { label: "T2", value: 310000000 },
  { label: "T3", value: 295000000 },
  { label: "T4", value: 340000000 },
  { label: "T5", value: 380000000 },
  { label: "T6", value: 410000000 },
  { label: "T7", value: 425000000 },
];

export const aiUsageChart: ChartPoint[] = [
  { label: "T2", value: 8200 },
  { label: "T3", value: 9400 },
  { label: "T4", value: 11200 },
  { label: "T5", value: 13800 },
  { label: "T6", value: 16200 },
  { label: "T7", value: 18420 },
];

export const engagementChart: ChartPoint[] = [
  { label: "T2", value: 120, value2: 45 },
  { label: "T3", value: 145, value2: 52 },
  { label: "T4", value: 168, value2: 61 },
  { label: "T5", value: 190, value2: 72 },
  { label: "T6", value: 210, value2: 85 },
  { label: "T7", value: 234, value2: 98 },
];

export const conversionChart: ChartPoint[] = [
  { label: "Free", value: 21730 },
  { label: "Premium", value: 2480 },
  { label: "Elite", value: 640 },
];

export const trendPopularityChart: ChartPoint[] = [
  { label: "Linen", value: 4200 },
  { label: "Y2K", value: 3800 },
  { label: "Office", value: 2900 },
  { label: "Coastal", value: 2400 },
  { label: "Street", value: 2100 },
];

export const mockUsers: AdminUser[] = [
  {
    id: "u1",
    username: "minh_anh",
    email: "minh.anh@email.com",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=minh",
    plan: "free",
    status: "active",
    aiUsageRemaining: 6,
    aiUsageMonthlyLimit: 10,
    closetItemCount: 24,
    closetItemLimit: 50,
    communityRating: 4.8,
    wardrobeCount: 24,
    outfitCount: 12,
    lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: "2024-08-12T00:00:00Z",
    reportsCount: 0,
  },
  {
    id: "u2",
    username: "lan_huong",
    email: "lan.huong@email.com",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=lan",
    plan: "premium",
    status: "active",
    aiUsageRemaining: 999,
    aiUsageMonthlyLimit: 9999,
    closetItemCount: 89,
    closetItemLimit: 9999,
    communityRating: 4.9,
    wardrobeCount: 89,
    outfitCount: 156,
    lastActiveAt: new Date(Date.now() - 600000).toISOString(),
    createdAt: "2024-03-01T00:00:00Z",
    reportsCount: 0,
  },
  {
    id: "u3",
    username: "thu_nguyen",
    email: "thu.nguyen@email.com",
    plan: "elite",
    status: "active",
    aiUsageRemaining: 999,
    aiUsageMonthlyLimit: 9999,
    closetItemCount: 142,
    closetItemLimit: 9999,
    communityRating: 5.0,
    wardrobeCount: 142,
    outfitCount: 289,
    lastActiveAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: "2023-11-20T00:00:00Z",
    reportsCount: 1,
  },
  {
    id: "u4",
    username: "spam_user_99",
    email: "spam@fake.com",
    plan: "free",
    status: "suspended",
    aiUsageRemaining: 0,
    aiUsageMonthlyLimit: 10,
    closetItemCount: 3,
    closetItemLimit: 50,
    communityRating: 2.1,
    wardrobeCount: 3,
    outfitCount: 0,
    lastActiveAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdAt: "2025-04-01T00:00:00Z",
    reportsCount: 8,
  },
];

export const membershipPlans: MembershipPlanConfig[] = [
  {
    id: "free",
    name: "Miễn phí",
    priceVnd: 0,
    billingCycle: "monthly",
    aiLimit: 10,
    wardrobeLimit: 50,
    features: ["Gợi ý outfit cơ bản", "Cộng đồng Pass đồ"],
    activeSubscribers: 21730,
  },
  {
    id: "premium",
    name: "Premium",
    priceVnd: 99000,
    billingCycle: "monthly",
    aiLimit: null,
    wardrobeLimit: null,
    features: ["AI không giới hạn", "Try-on nâng cao", "Xu hướng"],
    activeSubscribers: 2480,
  },
  {
    id: "elite",
    name: "Elite",
    priceVnd: 199000,
    billingCycle: "monthly",
    aiLimit: null,
    wardrobeLimit: null,
    features: ["Stylist AI", "Hỗ trợ ưu tiên", "Xu hướng độc quyền"],
    activeSubscribers: 640,
  },
];

export const subscriptions: Subscription[] = [
  {
    id: "sub1",
    userId: "u2",
    username: "lan_huong",
    plan: "premium",
    status: "active",
    startedAt: "2025-01-15T00:00:00Z",
    expiresAt: "2025-06-15T00:00:00Z",
    paymentMethod: "momo",
    amountVnd: 99000,
  },
  {
    id: "sub2",
    userId: "u3",
    username: "thu_nguyen",
    plan: "elite",
    status: "active",
    startedAt: "2024-12-01T00:00:00Z",
    expiresAt: "2025-12-01T00:00:00Z",
    paymentMethod: "vnpay",
    amountVnd: 199000,
  },
];

export const outfits: OutfitRecord[] = [
  {
    id: "o1",
    userId: "u2",
    username: "lan_huong",
    name: "Minimal Linen Summer",
    saves: 1240,
    wears: 89,
    isFeatured: true,
    matchingScore: 94,
    createdAt: "2025-05-20T00:00:00Z",
  },
  {
    id: "o2",
    userId: "u3",
    username: "thu_nguyen",
    name: "Office Chic Neutral",
    saves: 890,
    wears: 45,
    isFeatured: false,
    matchingScore: 91,
    createdAt: "2025-05-18T00:00:00Z",
  },
];

export const trends: FashionTrend[] = [
  {
    id: "t1",
    name: "Coastal Linen",
    description: "Phong cách biển nhẹ nhàng với linen và tone be",
    season: "Hè 2025",
    category: "Casual",
    location: "Đà Nẵng, Nha Trang",
    status: "published",
    views: 12400,
    saves: 4200,
    adoptionRate: 34.2,
  },
  {
    id: "t2",
    name: "Y2K Revival",
    description: "Low-rise, metallic, crop tops",
    season: "Xuân 2025",
    category: "Street",
    status: "scheduled",
    publishAt: "2025-06-15T00:00:00Z",
    views: 0,
    saves: 0,
    adoptionRate: 0,
  },
];

export const missions: Mission[] = [
  {
    id: "m1",
    title: "Đăng nhập hàng ngày",
    description: "Mở app mỗi ngày",
    type: "daily_checkin",
    rewardAiTries: 1,
    durationDays: 1,
    expiryAt: "2025-12-31T00:00:00Z",
    completionRate: 68.4,
    claimsCount: 15200,
    isActive: true,
  },
  {
    id: "m2",
    title: "Mời bạn bè",
    description: "Mời 3 người bạn tham gia",
    type: "invite_friend",
    rewardAiTries: 5,
    durationDays: 30,
    expiryAt: "2025-08-31T00:00:00Z",
    completionRate: 12.1,
    claimsCount: 890,
    isActive: true,
  },
];

export const listings: CommunityListing[] = [
  {
    id: "L-2841",
    userId: "u4",
    sellerName: "spam_user_99",
    title: "Áo Gucci siêu rẻ",
    listingType: "sale",
    price: 50000,
    status: "pending_review",
    reportsCount: 3,
    location: "Hà Nội",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "L-2839",
    userId: "u2",
    sellerName: "lan_huong",
    title: "Váy midi vintage",
    listingType: "sale",
    price: 350000,
    status: "approved",
    reportsCount: 0,
    location: "TP.HCM",
    createdAt: "2025-05-28T00:00:00Z",
  },
];

export const transactions: Transaction[] = [
  {
    id: "tx1",
    buyerId: "u1",
    sellerId: "u2",
    listingId: "L-2839",
    amount: 350000,
    platformFeePercentage: 10,
    platformFee: 35000,
    status: "completed",
    paymentMethod: "momo",
    createdAt: "2025-05-29T10:00:00Z",
  },
  {
    id: "tx2",
    buyerId: "u3",
    sellerId: "u2",
    listingId: "L-2800",
    amount: 180000,
    platformFeePercentage: 10,
    platformFee: 18000,
    status: "pending",
    paymentMethod: "vnpay",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const affiliateProducts: AffiliateProduct[] = [
  {
    id: "ap1",
    name: "Linen Shirt — Zara",
    store: "Zara",
    link: "https://example.com/zara-linen",
    category: "top",
    type: "top",
    colors: ["Beige", "White"],
    styleTags: ["minimal", "linen", "summer"],
    sizes: ["S", "M", "L"],
    gender: "female",
    price: 790000,
    commissionRate: 0.08,
    partnerName: "Zara",
    deeplink: "https://example.com/zara-linen?utm_source=yourcloset",
    trackingCode: "YC-ZARA-LINEN",
    status: "active",
    clicks: 4200,
    conversions: 312,
    revenueVnd: 15600000,
    isActive: true,
  },
];

export const affiliateCampaigns: AffiliateCampaign[] = [
  {
    id: "c1",
    name: "Summer Sale 2025",
    startAt: "2025-06-01T00:00:00Z",
    endAt: "2025-08-31T00:00:00Z",
    clicks: 12400,
    conversions: 890,
    revenueVnd: 42000000,
    status: "active",
  },
];

export const supportTickets: SupportTicket[] = [
  {
    id: "tk1",
    userId: "u1",
    username: "minh_anh",
    subject: "Không nhận được outfit AI",
    category: "AI",
    priority: "high",
    status: "open",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "tk2",
    userId: "u2",
    username: "lan_huong",
    subject: "Hoàn tiền gói Premium",
    category: "Billing",
    priority: "medium",
    status: "in_progress",
    assigneeName: "Support Team",
    createdAt: "2025-05-27T00:00:00Z",
    updatedAt: "2025-05-28T00:00:00Z",
  },
];

export const contentReports: ContentReport[] = [
  {
    id: "r1",
    reporterId: "u2",
    targetType: "listing",
    targetId: "L-2841",
    reason: "Spam / hàng giả",
    status: "open",
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
];

export const notificationTemplates: NotificationTemplate[] = [
  {
    id: "n1",
    name: "Outfit reminder",
    title: "Hôm nay mặc gì?",
    body: "AI đã chuẩn bị outfit cho thời tiết hôm nay",
    channel: "push",
    sentCount: 45200,
  },
  {
    id: "n2",
    name: "Premium promo",
    title: "Nâng cấp Premium",
    body: "Giảm 20% tháng đầu — chỉ hôm nay",
    channel: "push",
    scheduledAt: "2025-06-01T09:00:00Z",
    sentCount: 0,
  },
];

export const aiLogs: AiLogEntry[] = [
  {
    id: "ai1",
    userId: "u2",
    username: "lan_huong",
    type: "outfit",
    status: "success",
    processingMs: 1240,
    createdAt: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "ai2",
    userId: "u4",
    username: "spam_user_99",
    type: "try_on",
    status: "failed",
    errorMessage: "Invalid image format",
    createdAt: new Date(Date.now() - 300000).toISOString(),
  },
];

export const auditLogs: AdminAuditLog[] = [
  {
    id: "al1",
    adminId: "admin1",
    adminName: "Super Admin",
    action: "user.suspend",
    resource: "users",
    resourceId: "u4",
    ipAddress: "103.**.**.42",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const securityLogs: SecurityLog[] = [
  {
    id: "sl1",
    userId: "admin1",
    event: "login.success",
    ipAddress: "103.**.**.42",
    success: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "sl2",
    event: "login.failed",
    ipAddress: "45.**.**.12",
    success: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];
