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
  marketplaceMessages: "marketplace_messages",
  tradeOffers: "trade_offers",
  listingReports: "listing_reports",
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
  adminUsers: "adminUsers",
} as const;

export type FirestoreCollection =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];

export const COLLECTION_CONTRACTS = {
  users: { ownerField: "id", adminManaged: true },
  clothes: { ownerField: "userId" }, outfits: { ownerField: "userId", adminManaged: true },
  events: { ownerField: "userId" }, user_missions: { ownerField: "userId" },
  listings: { ownerField: "userId", publicStatus: "approved", adminManaged: true },
  transactions: { ownerField: "buyerId", readOnly: true }, notifications: { ownerField: "userId" },
  ai_logs: { ownerField: "userId", readOnly: true }, support_tickets: { ownerField: "userId", adminManaged: true },
  plan_limits: { publicStatus: "active", adminManaged: true }, missions: { publicStatus: "active", adminManaged: true },
  trends: { publicStatus: "published", adminManaged: true }, affiliate_products: { publicStatus: "active", adminManaged: true },
  notification_templates: { adminManaged: true }, subscriptions: { ownerField: "userId", adminManaged: true },
  adminUsers: { adminManaged: true },
} as const;
