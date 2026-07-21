"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminRole } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/rbac";

export interface AuthAdmin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl?: string;
}

interface AuthState {
  admin: AuthAdmin | null;
  isAuthenticated: boolean;
  isCheckingSession: boolean;
  initializeSession: () => void;
  login: (email: string, password: string, role?: AdminRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: AdminRole) => void;
}

const DEMO_ADMINS: Record<string, { password: string; admin: AuthAdmin }> = {
  "admin@tuado.vn": {
    password: "admin123",
    admin: {
      id: "admin1",
      name: "Super Admin",
      email: "admin@tuado.vn",
      role: "super_admin",
      avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=SA",
    },
  },
  "moderator@tuado.vn": {
    password: "mod123",
    admin: {
      id: "mod1",
      name: "Community Mod",
      email: "moderator@tuado.vn",
      role: "moderator",
    },
  },
  "finance@tuado.vn": {
    password: "fin123",
    admin: {
      id: "fin1",
      name: "Finance Ops",
      email: "finance@tuado.vn",
      role: "finance",
    },
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      isAuthenticated: false,
      isCheckingSession: true,
      initializeSession: () => {
        if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return set({ isCheckingSession: false });
        const token = localStorage.getItem("tuado-admin-token");
        if (!token) return set({ admin: null, isAuthenticated: false, isCheckingSession: false });
        try {
          const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number; admin?: boolean; adminRole?: AdminRole; user_id?: string; email?: string; name?: string };
          if (!payload.exp || payload.exp * 1000 <= Date.now() || payload.admin !== true || !payload.adminRole) throw new Error("expired");
          set({ admin: { id: payload.user_id ?? "", email: payload.email ?? "", name: payload.name ?? payload.email ?? "Admin", role: payload.adminRole }, isAuthenticated: true, isCheckingSession: false });
        } catch { localStorage.removeItem("tuado-admin-token"); set({ admin: null, isAuthenticated: false, isCheckingSession: false }); }
      },
      login: async (email, password, role) => {
        if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
          const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
          if (!apiKey) return false;
          const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
          if (!response.ok) return false;
          const session = await response.json() as { idToken: string };
          const sessionResponse = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: session.idToken }) });
          if (!sessionResponse.ok) return false;
          const payload = await sessionResponse.json() as { data: AuthAdmin };
          const admin = payload.data;
          localStorage.setItem("tuado-admin-token", session.idToken); localStorage.setItem("tuado-admin-role", admin.role);
          set({ admin, isAuthenticated: true, isCheckingSession: false }); return true;
        }
        const entry = DEMO_ADMINS[email.toLowerCase()];
        if (!entry || entry.password !== password) return false;
        const admin = role
          ? { ...entry.admin, role, name: ROLE_LABELS[role] }
          : entry.admin;
        set({ admin, isAuthenticated: true, isCheckingSession: false });
        localStorage.setItem("tuado-admin-role", admin.role);
        return true;
      },
      logout: () => { localStorage.removeItem("tuado-admin-role"); localStorage.removeItem("tuado-admin-token"); set({ admin: null, isAuthenticated: false }); },
      switchRole: (role) => {
        if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return;
        const { admin } = get();
        if (!admin) return;
        set({
          admin: {
            ...admin,
            role,
            name: ROLE_LABELS[role],
          },
        });
        localStorage.setItem("tuado-admin-role", role);
      },
    }),
    { name: "tuado-admin-auth" }
  )
);
