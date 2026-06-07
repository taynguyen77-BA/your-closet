"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

type DependencyStatus = {
  status: "ok" | "missing_config" | "error";
  message?: string;
};

type HealthResponse = {
  status: "ok" | "degraded";
  environment: string;
  demoMode: boolean;
  timestamp: string;
  dependencies: Record<string, DependencyStatus>;
};

const labelFor = (key: string) => ({
  auth: "Auth",
  database: "Database",
  storage: "Storage",
  ai: "AI",
}[key] ?? key);

export function ApiStatusCard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setHealth(await apiFetch<HealthResponse>("/health"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể kiểm tra API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const healthy = health?.status === "ok";

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          {healthy ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
          API status
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!error ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>{loading ? "Checking..." : `Environment: ${health?.environment ?? "unknown"}`}</span>
              {health?.demoMode ? <Badge variant="outline">Demo mode</Badge> : null}
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              {Object.entries(health?.dependencies ?? {}).map(([key, dependency]) => (
                <div key={key} className="rounded-md border border-border p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{labelFor(key)}</span>
                    <Badge variant={dependency.status === "ok" ? "success" : "outline"}>{dependency.status}</Badge>
                  </div>
                  {dependency.message ? <p className="text-xs text-muted-foreground">{dependency.message}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
