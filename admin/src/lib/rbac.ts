export type AdminRole =
  | "super_admin"
  | "admin"
  | "moderator"
  | "support"
  | "marketing"
  | "finance";

export type Permission =
  | "dashboard.view"
  | "users.view"
  | "users.manage"
  | "ai.view"
  | "ai.configure"
  | "membership.view"
  | "membership.manage"
  | "outfits.view"
  | "outfits.manage"
  | "trends.view"
  | "trends.manage"
  | "missions.view"
  | "missions.manage"
  | "community.view"
  | "community.moderate"
  | "affiliate.view"
  | "affiliate.manage"
  | "transactions.view"
  | "transactions.manage"
  | "analytics.view"
  | "analytics.export"
  | "notifications.view"
  | "notifications.manage"
  | "moderation.view"
  | "moderation.action"
  | "support.view"
  | "support.manage"
  | "content.view"
  | "content.manage"
  | "settings.view"
  | "settings.manage"
  | "security.view"
  | "audit.view";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    "dashboard.view",
    "users.view",
    "users.manage",
    "ai.view",
    "ai.configure",
    "membership.view",
    "membership.manage",
    "outfits.view",
    "outfits.manage",
    "trends.view",
    "trends.manage",
    "missions.view",
    "missions.manage",
    "community.view",
    "community.moderate",
    "affiliate.view",
    "affiliate.manage",
    "transactions.view",
    "transactions.manage",
    "analytics.view",
    "analytics.export",
    "notifications.view",
    "notifications.manage",
    "moderation.view",
    "moderation.action",
    "support.view",
    "support.manage",
    "content.view",
    "content.manage",
    "settings.view",
    "settings.manage",
    "security.view",
    "audit.view",
  ],
  admin: [
    "dashboard.view",
    "users.view",
    "users.manage",
    "ai.view",
    "ai.configure",
    "membership.view",
    "membership.manage",
    "outfits.view",
    "outfits.manage",
    "trends.view",
    "trends.manage",
    "missions.view",
    "missions.manage",
    "community.view",
    "community.moderate",
    "affiliate.view",
    "affiliate.manage",
    "transactions.view",
    "analytics.view",
    "analytics.export",
    "notifications.view",
    "notifications.manage",
    "moderation.view",
    "moderation.action",
    "support.view",
    "content.view",
    "content.manage",
    "settings.view",
    "audit.view",
  ],
  moderator: [
    "dashboard.view",
    "users.view",
    "community.view",
    "community.moderate",
    "moderation.view",
    "moderation.action",
    "outfits.view",
    "audit.view",
  ],
  support: [
    "dashboard.view",
    "users.view",
    "users.manage",
    "support.view",
    "support.manage",
    "notifications.view",
    "membership.view",
  ],
  marketing: [
    "dashboard.view",
    "trends.view",
    "trends.manage",
    "affiliate.view",
    "affiliate.manage",
    "notifications.view",
    "notifications.manage",
    "content.view",
    "content.manage",
    "analytics.view",
    "outfits.view",
    "outfits.manage",
  ],
  finance: [
    "dashboard.view",
    "transactions.view",
    "transactions.manage",
    "membership.view",
    "analytics.view",
    "analytics.export",
    "affiliate.view",
  ],
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Moderator",
  support: "Support Staff",
  marketing: "Marketing Staff",
  finance: "Finance Staff",
};

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
  role: AdminRole,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
