export type AdminRole =
  | "super_admin"
  | "content_manager"
  | "moderator"
  | "support"
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
  content_manager: [
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
  content_manager: "Content Manager",
  moderator: "Moderator",
  support: "Support Staff",
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
