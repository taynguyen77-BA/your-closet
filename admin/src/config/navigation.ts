import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Bot,
  CreditCard,
  FileText,
  Flag,
  Gift,
  Headphones,
  LayoutDashboard,
  Settings,
  Shield,
  Shirt,
  ShoppingBag,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { Permission } from "@/lib/rbac";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navigationGroups: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        permission: "dashboard.view",
      },
      {
        title: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        permission: "analytics.view",
      },
    ],
  },
  {
    label: "Người dùng & AI",
    items: [
      {
        title: "Người dùng",
        href: "/users",
        icon: Users,
        permission: "users.view",
      },
      {
        title: "Hệ thống AI",
        href: "/ai",
        icon: Bot,
        permission: "ai.view",
      },
      {
        title: "Outfit & Tủ đồ",
        href: "/outfits",
        icon: Shirt,
        permission: "outfits.view",
      },
    ],
  },
  {
    label: "Kinh doanh",
    items: [
      {
        title: "Gói thành viên",
        href: "/membership",
        icon: Sparkles,
        permission: "membership.view",
      },
      {
        title: "Giao dịch",
        href: "/transactions",
        icon: Wallet,
        permission: "transactions.view",
      },
      {
        title: "Thanh toán",
        href: "/payments",
        icon: CreditCard,
        permission: "transactions.view",
      },
      {
        title: "Affiliate",
        href: "/affiliate",
        icon: ShoppingBag,
        permission: "affiliate.view",
      },
    ],
  },
  {
    label: "Nội dung & Cộng đồng",
    items: [
      {
        title: "Xu hướng",
        href: "/trends",
        icon: TrendingUp,
        permission: "trends.view",
      },
      {
        title: "Nhiệm vụ & Thưởng",
        href: "/missions",
        icon: Target,
        permission: "missions.view",
      },
      {
        title: "Cộng đồng",
        href: "/community",
        icon: Store,
        permission: "community.view",
        badge: "3",
      },
      {
        title: "CMS Nội dung",
        href: "/content",
        icon: FileText,
        permission: "content.view",
      },
    ],
  },
  {
    label: "Vận hành",
    items: [
      {
        title: "Thông báo",
        href: "/notifications",
        icon: Bell,
        permission: "notifications.view",
      },
      {
        title: "Hỗ trợ",
        href: "/support",
        icon: Headphones,
        permission: "support.view",
        badge: "2",
      },
      {
        title: "Kiểm duyệt",
        href: "/moderation",
        icon: Flag,
        permission: "moderation.view",
      },
      {
        title: "Bảo mật",
        href: "/security",
        icon: Shield,
        permission: "security.view",
      },
      {
        title: "Cài đặt",
        href: "/settings",
        icon: Settings,
        permission: "settings.view",
      },
    ],
  },
];

export const quickActions = [
  { label: "Tạo trend", href: "/trends", icon: TrendingUp },
  { label: "Gửi push", href: "/notifications", icon: Bell },
  { label: "Mission mới", href: "/missions", icon: Gift },
];
