"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shirt } from "lucide-react";
import { navigationGroups } from "@/config/navigation";
import { hasPermission } from "@/lib/rbac";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  const pathname = usePathname();
  const admin = useAuthStore((s) => s.admin);
  const role = admin?.role ?? "super_admin";

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-fashion-gradient dark:bg-fashion-dark">
          <Shirt className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Tủ đồ Admin</p>
          <p className="text-[10px] text-muted-foreground">CMS Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {navigationGroups.map((group) => {
          const items = group.items.filter((item) =>
            hasPermission(role, item.permission)
          );
          if (items.length === 0) return null;

          return (
            <div key={group.label} className="mb-5">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          Tủ đồ của bạn © 2025
        </p>
        <p className="text-[10px] text-muted-foreground">v1.0.0 — Enterprise</p>
      </div>
    </aside>
  );
}
