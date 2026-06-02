/**
 * Firestore collection map — API-ready reference for backend integration.
 * Aligns with mobile app models in ../mobile/src/models
 */

export const FIRESTORE_COLLECTIONS = {
  users: "users",
  clothes: "clothes",
  outfits: "outfits",
  events: "events",
  trends: "trends",
  missions: "missions",
  planLimits: "plan_limits",
  userMissions: "user_missions",
  rewards: "rewards",
  listings: "listings",
  transactions: "transactions",
  notifications: "notifications",
  reports: "reports",
  supportTickets: "support_tickets",
  adminLogs: "admin_logs",
  aiLogs: "ai_logs",
  subscriptions: "subscriptions",
  affiliateProducts: "affiliate_products",
  affiliateCampaigns: "affiliate_campaigns",
  notificationTemplates: "notification_templates",
  securityLogs: "security_logs",
  cmsContent: "cms_content",
} as const;

export type FirestoreCollection =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];
