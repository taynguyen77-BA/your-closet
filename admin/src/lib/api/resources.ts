import { apiFetch } from "./client";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore-schema";
import type { Mission } from "@/types/database";

type Entity = { id: string };
type PlanLimit = { id: string; label: string; aiMonthly: number; closetItems: number };

function createResource<T extends Entity>(collection: string) {
  const base = `/api/resources/${collection}`;
  return {
    list: (params?: Record<string, string>) => apiFetch<T[]>(base, { params }),
    get: (id: string) => apiFetch<T>(`${base}/${id}`),
    create: (value: Omit<T, "id">) =>
      apiFetch<T>(base, { method: "POST", body: JSON.stringify(value) }),
    update: (id: string, patch: Partial<T>) =>
      apiFetch<T>(`${base}/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id: string) => apiFetch<void>(`${base}/${id}`, { method: "DELETE" }),
  };
}

export const usersService = createResource<Entity>(FIRESTORE_COLLECTIONS.users);
export const clothesService = createResource<Entity>(FIRESTORE_COLLECTIONS.clothes);
export const outfitsService = createResource<Entity>(FIRESTORE_COLLECTIONS.outfits);
export const eventsService = createResource<Entity>(FIRESTORE_COLLECTIONS.events);
export const listingsService = createResource<Entity>(FIRESTORE_COLLECTIONS.listings);
export const missionsService = createResource<Mission>(FIRESTORE_COLLECTIONS.missions);
export const planLimitsService = createResource<PlanLimit>(FIRESTORE_COLLECTIONS.planLimits);
export const transactionsService = createResource<Entity>(FIRESTORE_COLLECTIONS.transactions);
export const notificationsService = createResource<Entity>(FIRESTORE_COLLECTIONS.notifications);
export const subscriptionsService = createResource<Entity>(FIRESTORE_COLLECTIONS.subscriptions);
export const reportsService = createResource<Entity>(FIRESTORE_COLLECTIONS.reports);
export const notificationTemplatesService = createResource<Entity>(FIRESTORE_COLLECTIONS.notificationTemplates);
export const aiLogsService = createResource<Entity>(FIRESTORE_COLLECTIONS.aiLogs);
