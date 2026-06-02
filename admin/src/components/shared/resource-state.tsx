"use client";
import { Button } from "@/components/ui/button";
export function ResourceState({ loading, error, onRetry }: { loading: boolean; error?: string; onRetry: () => void }) {
  if (loading) return <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">Đang tải dữ liệu Firestore...</div>;
  if (error) return <div className="rounded-lg border border-destructive/30 bg-card p-10 text-center"><p className="mb-3 text-destructive">{error}</p><Button variant="outline" onClick={onRetry}>Thử lại</Button></div>;
  return null;
}
