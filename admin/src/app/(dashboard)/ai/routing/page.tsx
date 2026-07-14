"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import { AI_FEATURES, FEATURE_LABELS, type AiFeature, type AiFeatureRoutingRow, type AiRoutingConfig } from "@/types/ai-routing";

const TIERS: Array<keyof AiFeatureRoutingRow> = ["free", "pro", "premium", "fallback"];

export default function AiRoutingPage() {
  const admin = useAuthStore((s) => s.admin);
  const [config, setConfig] = useState<AiRoutingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (admin?.role) headers["x-demo-admin-role"] = admin.role;
      const res = await fetch("/api/admin/ai-routing", { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json() as { data: AiRoutingConfig };
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load config");
    } finally {
      setLoading(false);
    }
  }, [admin?.role]);

  useEffect(() => { void fetchConfig(); }, [fetchConfig]);

  const updateCell = (feature: AiFeature, tier: keyof AiFeatureRoutingRow, value: string) => {
    setConfig((prev) => prev ? { ...prev, [feature]: { ...prev[feature], [tier]: value } } : prev);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (admin?.role) headers["x-demo-admin-role"] = admin.role;
      const res = await fetch("/api/admin/ai-routing", {
        method: "PUT",
        headers,
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="AI Routing Config"
        description="5 features × 3 tiers model routing table — editable without a code deploy (BRD Section 9)"
        actions={
          <div className="flex items-center gap-2">
            {saved && <span className="text-sm text-green-600">Saved ✓</span>}
            <Button onClick={() => void fetchConfig()} variant="outline" size="sm" disabled={loading}>Refresh</Button>
            <Button onClick={() => void handleSave()} disabled={saving || loading} size="sm">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        }
      />

      {error && <p className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model ID per (feature, tier)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : config ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="py-2 pr-4 text-left font-medium text-muted-foreground">Feature</th>
                    {TIERS.map((tier) => (
                      <th key={tier} className="px-2 py-2 text-left font-medium capitalize text-muted-foreground">{tier}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AI_FEATURES.map((feature) => (
                    <tr key={feature} className="border-t border-border">
                      <td className="py-2 pr-4 font-mono text-xs">{FEATURE_LABELS[feature]}<br /><span className="text-muted-foreground">{feature}</span></td>
                      {TIERS.map((tier) => (
                        <td key={tier} className="px-2 py-2">
                          <Input
                            value={(config[feature] as AiFeatureRoutingRow)[tier]}
                            onChange={(e) => updateCell(feature, tier, e.target.value)}
                            className="h-8 font-mono text-xs"
                            placeholder="model-id"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {config && (
        <p className="mt-3 text-xs text-muted-foreground">
          Last updated: {new Date(config.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
