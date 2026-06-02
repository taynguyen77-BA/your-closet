"use client";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "./page-header";
import { ResourceState } from "./resource-state";
import { DataTable, type Column } from "./data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { hasPermission, type Permission } from "@/lib/rbac";
import { useAuthStore } from "@/stores/auth-store";

type Row = Record<string, unknown> & { id: string };
export interface AdminCollectionConfig {
  collection: string; title: string; description: string;
  fields: { key: string; label: string; editable?: boolean }[];
  manage?: Permission; statuses?: string[];
  allowCreate?: boolean; allowDelete?: boolean;
}
const text = (value: unknown) => value == null || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value);
export function AdminCollectionPage({ config }: { config: AdminCollectionConfig }) {
  const role = useAuthStore((s) => s.admin?.role);
  const canManage = Boolean(role && config.manage && hasPermission(role, config.manage));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setRows(await apiFetch<Row[]>(`/api/resources/${config.collection}`)); }
    catch (e) { setError(e instanceof Error ? e.message : "Không thể tải dữ liệu"); }
    finally { setLoading(false); }
  }, [config.collection]);
  useEffect(() => { void load(); }, [load]);
  const mutate = async (id: string, patch: Partial<Row>) => {
    try {
      const updated = await apiFetch<Row>(`/api/resources/${config.collection}/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setRows((current) => current.map((row) => row.id === id ? { ...row, ...updated } : row));
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể cập nhật"); }
  };
  const create = async () => {
    const raw = prompt("Nhập JSON cho bản ghi mới", "{}"); if (!raw) return;
    try {
      const created = await apiFetch<Row>(`/api/resources/${config.collection}`, { method: "POST", body: raw });
      setRows((current) => [created, ...current]);
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể tạo bản ghi"); }
  };
  const edit = async (row: Row) => {
    const raw = prompt("Chỉnh sửa JSON", JSON.stringify(row, null, 2)); if (!raw) return;
    try { await mutate(row.id, JSON.parse(raw)); } catch { setError("JSON không hợp lệ"); }
  };
  const remove = async (id: string) => {
    if (!confirm("Xóa bản ghi này?")) return;
    try { await apiFetch<void>(`/api/resources/${config.collection}/${id}`, { method: "DELETE" }); setRows((current) => current.filter((row) => row.id !== id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Không thể xóa"); }
  };
  const columns: Column<Row>[] = [
    ...config.fields.map(({ key, label }) => ({ key, header: label, cell: (row: Row) => key === "status" || key === "plan" || key === "type" ? <Badge variant="outline">{text(row[key])}</Badge> : text(row[key]) })),
    ...(canManage ? [{ key: "actions", header: "", cell: (row: Row) => <div className="flex flex-wrap gap-1">{config.statuses?.map((status) => <Button key={status} variant="outline" size="sm" onClick={() => void mutate(row.id, { status })}>{status}</Button>)}<Button variant="ghost" size="sm" onClick={() => void edit(row)}>Edit</Button>{config.allowDelete && <Button variant="destructive" size="sm" onClick={() => void remove(row.id)}>Delete</Button>}</div> }] : []),
  ];
  return <div><PageHeader title={config.title} description={`${config.description} · ${rows.length} records`} actions={canManage && config.allowCreate ? <Button onClick={() => void create()}>Tạo mới</Button> : undefined} /><ResourceState loading={loading} error={error} onRetry={() => void load()} />{!loading && !error && <DataTable columns={columns} data={rows} keyExtractor={(row) => row.id} emptyMessage="Không có dữ liệu Firestore" />}</div>;
}
