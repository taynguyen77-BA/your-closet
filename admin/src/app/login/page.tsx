"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import type { AdminRole } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/rbac";

const DEMO_HINT = [
  { email: "admin@tuado.vn", pass: "admin123", role: "super_admin" },
  { email: "moderator@tuado.vn", pass: "mod123", role: "moderator" },
  { email: "finance@tuado.vn", pass: "fin123", role: "finance" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const [email, setEmail] = useState(demoMode ? "admin@tuado.vn" : "");
  const [password, setPassword] = useState(demoMode ? "admin123" : "");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await login(email, password)) {
      router.replace("/");
    } else {
      setError("Email hoặc mật khẩu không đúng");
    }
  };

  const quickLogin = async (demoEmail: string, demoPass: string, role: AdminRole) => {
    if (await login(demoEmail, demoPass, role)) router.replace("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-fashion-gradient p-4 dark:bg-fashion-dark">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-fashion-gradient dark:bg-fashion-dark">
            <Shirt className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Tủ đồ Admin</CardTitle>
          <CardDescription>
            Đăng nhập CMS — AI Fashion Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tuado.vn"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Mật khẩu</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full">
              Đăng nhập
            </Button>
          </form>

          {demoMode && <div className="mt-6 space-y-2 border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              Demo RBAC — chọn vai trò
            </p>
            {DEMO_HINT.map((d) => (
              <Button
                key={d.email}
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => void quickLogin(d.email, d.pass, d.role as AdminRole)}
              >
                {ROLE_LABELS[d.role as AdminRole]} — {d.email}
              </Button>
            ))}
          </div>}
        </CardContent>
      </Card>
    </div>
  );
}
