"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useAuthStore } from "@/stores/auth-store";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isCheckingSession = useAuthStore((s) => s.isCheckingSession);
  const initializeSession = useAuthStore((s) => s.initializeSession);
  useEffect(() => { initializeSession(); }, [initializeSession]);

  useEffect(() => {
    if (!isCheckingSession && !isAuthenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isAuthenticated, isCheckingSession, pathname, router]);

  if (isCheckingSession) return <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">Đang kiểm tra phiên đăng nhập...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
