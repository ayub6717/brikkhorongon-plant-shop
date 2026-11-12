import type { LoginValues, RegisterValues } from "@/lib/auth-schema";
import type { AdminOrdersPage, AdminStats, CreateOrderInput, Order, RatingSummary, Review, ShopApi, User } from "./types";

/**
 * Talks to the ASP.NET Core API through this site's own /api/bff routes (see lib/server/backend.ts).
 * Errors are thrown as Error(code) with a code such as "EMAIL_TAKEN", which the forms translate.
 */
/** An API failure. `message` is the error code; `fields` holds per-field validation messages when the server sent them. */
export class ApiError extends Error {
  constructor(readonly code: string, readonly fields?: Record<string, string[]>, readonly title?: string) {
    super(code);
  }
}

export async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/bff${path}`, {
      method: init?.method ?? "GET",
      headers: init?.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: "same-origin",
    });
  } catch {
    throw new Error("NETWORK");
  }
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(errorCode(res.status, data), data?.errors, data?.title);
  return data as T;
}

function errorCode(status: number, data: { code?: string; title?: string; errors?: Record<string, string[]> } | null): string {
  if (data?.code) return data.code;
  if (status === 429) return "RATE_LIMITED";
  if (status === 400 && data?.errors?.password) return "WEAK_PASSWORD";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  return "GENERIC";
}

export const httpAuth: ShopApi["auth"] = {
  me: () => call<User | null>("/me"),
  signIn: (v: LoginValues) => call<User>("/auth/login", { method: "POST", body: v }),
  signUp: (v: RegisterValues) => call<User>("/auth/register", { method: "POST", body: v }),
  signOut: () => call<void>("/auth/logout", { method: "POST" }),
  updateProfile: (v) => call<User>("/me", { method: "PUT", body: v }),
  addAddress: (v) => call<User>("/me/addresses", { method: "POST", body: v }),
  removeAddress: (id) => call<User>(`/me/addresses/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

// This browser remembers its order numbers so guests (no account) can see "my orders" and the garden.
const IDS_KEY = "brikkhorongon-order-ids";
const readIds = (): string[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(IDS_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string").slice(0, 20) : [];
  } catch {
    return [];
  }
};
const rememberId = (id: string) => {
  try {
    localStorage.setItem(IDS_KEY, JSON.stringify([id, ...readIds().filter((x) => x !== id)].slice(0, 20)));
  } catch {
    /* storage blocked: the order still exists on the server */
  }
};

export const httpOrders: ShopApi["orders"] = {
  async list() {
    const ids = readIds();
    const user = await call<User | null>("/me");
    const [mine, guest] = await Promise.all([
      user ? call<Order[]>("/me/orders") : Promise.resolve([] as Order[]),
      ids.length ? call<Order[]>("/orders/lookup", { method: "POST", body: { ids } }) : Promise.resolve([] as Order[]),
    ]);
    const byId = new Map([...guest, ...mine].map((o) => [o.id, o]));
    return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async get(id) {
    try {
      return await call<Order>(`/orders/${encodeURIComponent(id)}`);
    } catch (e) {
      if (e instanceof Error && e.message === "NOT_FOUND") return null;
      throw e;
    }
  },
  async create(input: CreateOrderInput) {
    const order = await call<Order>("/orders", { method: "POST", body: input });
    rememberId(order.id);
    return order;
  },
  addRequest: (orderId, request) => call<Order>(`/orders/${encodeURIComponent(orderId)}/requests`, { method: "POST", body: request }),
  advance: async (orderId) => (await call<{ order: Order }>(`/admin/orders/${encodeURIComponent(orderId)}/advance`, { method: "POST" })).order,
  resolveRequest: async (orderId, requestId, status) =>
    (await call<{ order: Order }>(`/admin/orders/${encodeURIComponent(orderId)}/requests/${encodeURIComponent(requestId)}/resolve`, { method: "POST", body: { status } })).order,
};

export const httpAdmin: ShopApi["admin"] = {
  stats: () => call<AdminStats>("/admin/stats"),
  orders: ({ status, q, page }) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q?.trim()) params.set("q", q.trim());
    if (page && page > 1) params.set("page", String(page));
    return call<AdminOrdersPage>(`/admin/orders${params.size ? `?${params}` : ""}`);
  },
};

export const httpReviews: ShopApi["reviews"] = {
  list: (slug) => call<Review[]>(`/reviews?slug=${encodeURIComponent(slug)}`),
  async summaries() {
    const rows = await call<{ slug: string; count: number; average: number; distribution: number[] }[]>("/reviews/summaries");
    return Object.fromEntries(rows.map((r) => [r.slug, { count: r.count, average: r.average, distribution: r.distribution as RatingSummary["distribution"] }]));
  },
  // The author's name comes from the signed-in account on the server, never from the form.
  add: ({ slug, rating, title, text }) => call<Review>("/reviews", { method: "POST", body: { slug, rating, title, text } }),
  remove: (id) => call<void>(`/reviews/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
