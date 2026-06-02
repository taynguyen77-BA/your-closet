"use client";

import { useState } from "react";
import { Bell, ChevronDown, LogOut, Search } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/rbac";
import { useAuthStore } from "@/stores/auth-store";

export function TopBar() {
  const admin = useAuthStore((s) => s.admin);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card/80 px-6 backdrop-blur-sm">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm user, listing, transaction..."
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <ThemeToggle />

        <div className="relative ml-2">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted"
          >
            <Avatar className="h-8 w-8">
              {admin?.avatarUrl && (
                <AvatarImage src={admin.avatarUrl} alt={admin.name} />
              )}
              <AvatarFallback>
                {admin?.name?.slice(0, 2).toUpperCase() ?? "AD"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-none">
                {admin?.name ?? "Admin"}
              </p>
              <p className="text-xs text-muted-foreground">
                {admin ? ROLE_LABELS[admin.role] : ""}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-card p-1 shadow-lg">
                <div className="border-b border-border px-3 py-2">
                  <p className="text-xs text-muted-foreground">Hoạt động gần đây</p>
                  <p className="truncate text-sm">Xem audit logs để theo dõi thay đổi</p>
                </div>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
