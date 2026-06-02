/** Shared domain models — aligned with mobile app + admin extensions */

export type MembershipPlan = "free" | "premium" | "elite";
export type UserStatus = "active" | "suspended" | "banned";
export type ListingStatus = "pending_review" | "approved" | "rejected" | "removed";
export type TransactionStatus = "pending" | "paid" | "shipped" | "handed_over" | "completed" | "cancelled";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type MissionType =
  | "daily_checkin"
  | "watch_ad"
  | "survey"
  | "invite_friend"
  | "share_outfit";
export type ListingType = "sale" | "trade" | "giveaway";
export type NotificationChannel = "push" | "in_app" | "email";
export type PaymentMethod =
  | "vnpay"
  | "momo"
  | "zalopay"
  | "stripe"
  | "apple_pay"
  | "google_pay";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  plan: MembershipPlan;
  status: UserStatus;
  aiUsageRemaining: number;
  aiUsageMonthlyLimit: number;
  closetItemCount: number;
  closetItemLimit: number;
  communityRating: number;
  wardrobeCount: number;
  outfitCount: number;
  lastActiveAt: string;
  createdAt: string;
  reportsCount: number;
}

export interface MembershipPlanConfig {
  id: MembershipPlan;
  name: string;
  priceVnd: number;
  billingCycle: "monthly" | "yearly";
  aiLimit: number | null;
  wardrobeLimit: number | null;
  features: string[];
  activeSubscribers: number;
}

export interface Subscription {
  id: string;
  userId: string;
  username: string;
  plan: MembershipPlan;
  status: "active" | "expired" | "failed" | "cancelled";
  startedAt: string;
  expiresAt: string;
  paymentMethod: PaymentMethod;
  amountVnd: number;
}

export interface OutfitRecord {
  id: string;
  userId: string;
  username: string;
  name: string;
  previewImageUrl?: string;
  saves: number;
  wears: number;
  isFeatured: boolean;
  matchingScore?: number;
  createdAt: string;
}

export interface FashionTrend {
  id: string;
  name: string;
  description: string;
  season: string;
  category: string;
  location?: string;
  status: "draft" | "scheduled" | "published" | "archived";
  publishAt?: string;
  views: number;
  saves: number;
  adoptionRate: number;
  previewImageUrl?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  rewardAiTries: number;
  durationDays: number;
  expiryAt: string;
  completionRate: number;
  claimsCount: number;
  isActive: boolean;
}

export interface CommunityListing {
  id: string;
  userId: string;
  sellerName: string;
  title: string;
  listingType: ListingType;
  price?: number;
  status: ListingStatus;
  reportsCount: number;
  location: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  amount: number;
  platformFeePercentage: number;
  platformFee: number;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface AffiliateProduct {
  id: string;
  name: string;
  store: string;
  link: string;
  clicks: number;
  conversions: number;
  revenueVnd: number;
  isActive: boolean;
}

export interface AffiliateCampaign {
  id: string;
  name: string;
  startAt: string;
  endAt: string;
  clicks: number;
  conversions: number;
  revenueVnd: number;
  status: "draft" | "active" | "ended";
}

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentReport {
  id: string;
  reporterId: string;
  targetType: "user" | "listing" | "outfit" | "message";
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  scheduledAt?: string;
  sentCount: number;
}

export interface AiLogEntry {
  id: string;
  userId: string;
  username: string;
  type: "outfit" | "try_on" | "detection" | "recommendation";
  status: "success" | "failed" | "queued";
  processingMs?: number;
  errorMessage?: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  createdAt: string;
}

export interface SecurityLog {
  id: string;
  userId?: string;
  event: string;
  ipAddress: string;
  success: boolean;
  createdAt: string;
}

export interface DashboardKpis {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  dailyAiUsage: number;
  communityTransactions: number;
  revenueVnd: number;
  commissionVnd: number;
  outfitGenerations: number;
  trendingOutfit: string;
  mostActiveUser: string;
}

export interface ActivityFeedItem {
  id: string;
  type:
    | "registration"
    | "community_post"
    | "report"
    | "purchase"
    | "subscription"
    | "ai_generation";
  title: string;
  description: string;
  createdAt: string;
}

export interface ChartPoint {
  label: string;
  value: number;
  value2?: number;
}
