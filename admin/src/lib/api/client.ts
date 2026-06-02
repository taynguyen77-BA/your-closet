/**
 * API client — ready for Firebase Admin / REST backend integration.
 * Set NEXT_PUBLIC_API_URL in production.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { params?: Record<string, string> }
): Promise<T> {
  const url = new URL(path, BASE_URL || "http://localhost");
  const query = options?.params;
  if (query) {
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const init: RequestInit = { ...(options ?? {}) };
  delete (init as RequestInit & { params?: Record<string, string> }).params;
  const demoRole = typeof window === "undefined" ? null : localStorage.getItem("tuado-admin-role");
  const token = typeof window === "undefined" ? null : localStorage.getItem("tuado-admin-token");
  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(demoRole ? { "x-demo-admin-role": demoRole } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("tuado-admin-token");
      localStorage.removeItem("tuado-admin-auth");
      window.location.assign("/login");
    }
    const body = await res.json().catch(() => undefined);
    throw new ApiError(res.statusText, res.status, body);
  }

  if (res.status === 204) return undefined as T;
  const payload = await res.json() as { data?: T } | T;
  return typeof payload === "object" && payload !== null && "data" in payload ? payload.data as T : payload as T;
}
