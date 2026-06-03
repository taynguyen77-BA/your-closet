"use client";
import { AdminCollectionPage } from "@/components/shared/admin-collection-page";

export default function AdminUsersPage() {
  return <AdminCollectionPage config={{
    collection: "adminUsers",
    title: "Admin users",
    description: "Quản lý tài khoản CMS, vai trò và trạng thái đăng nhập Firebase",
    manage: "settings.manage",
    statuses: ["active", "disabled"],
    allowCreate: true,
    fields: [
      { key: "email", label: "Email" },
      { key: "name", label: "Tên" },
      { key: "role", label: "Vai trò" },
      { key: "status", label: "Trạng thái" },
      { key: "lastLoginAt", label: "Lần đăng nhập cuối" },
    ],
  }} />;
}
