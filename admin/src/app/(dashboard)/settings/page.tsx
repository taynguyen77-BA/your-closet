"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_LABELS, type AdminRole } from "@/lib/rbac";

const FEATURE_FLAGS = [
  { id: "virtual_tryon", label: "Virtual Try-on", enabled: true },
  { id: "community_market", label: "Community Marketplace", enabled: true },
  { id: "affiliate_shop", label: "Affiliate Shopping", enabled: true },
  { id: "ai_stylist_premium", label: "Premium Stylist AI", enabled: true },
  { id: "missions", label: "Missions & Rewards", enabled: true },
];

const ROLES: AdminRole[] = [
  "super_admin",
  "content_manager",
  "moderator",
  "support",
  "finance",
];

export default function SettingsPage() {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const admin = useAuthStore((s) => s.admin);
  const switchRole = useAuthStore((s) => s.switchRole);

  return (
    <div>
      <PageHeader
        title="Cài đặt hệ thống"
        description="Branding, AI, feature flags, regional"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {demoMode && <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">App name</label>
              <Input defaultValue="Tủ đồ của bạn" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Default language</label>
              <Input defaultValue="vi-VN" />
            </div>
            <Button>Lưu thay đổi</Button>
          </CardContent>
        </Card>}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Provider</span>
              <Badge>Gemini</Badge>
            </div>
            <div className="flex justify-between">
              <span>Max queue size</span>
              <span className="font-mono">500</span>
            </div>
            <div className="flex justify-between">
              <span>Rate limit / user</span>
              <span className="font-mono">60/min</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Feature flags</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {FEATURE_FLAGS.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <span>{f.label}</span>
                <Badge variant={f.enabled ? "success" : "outline"}>
                  {f.enabled ? "ON" : "OFF"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Demo: Switch RBAC role</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {ROLES.map((role) => (
              <Button
                key={role}
                variant={admin?.role === role ? "default" : "outline"}
                size="sm"
                onClick={() => switchRole(role)}
              >
                {ROLE_LABELS[role]}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
