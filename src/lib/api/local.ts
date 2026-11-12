import { getProductBySlug } from "@/lib/catalog";
import { computeTotals } from "@/lib/totals";
import { createOrderId, useOrders, type Order } from "@/store/orders";
import { summarize, useReviews } from "@/store/reviews";
import { useSession, type User } from "@/store/session";
import type { CreateOrderInput, ShopApi } from "./types";

/** Small delay so loading states are real UI paths, as they will be with a network. */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

const findOrder = (id: string) => useOrders.getState().orders.find((o) => o.id === id) ?? null;

/** Accounts created in this browser (demo only; no passwords). */
const ACCOUNTS_KEY = "brikkhorongon-accounts";
const readAccounts = (): User[] => {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]") as User[]; } catch { return []; }
};
const saveAccount = (user: User) => {
  const rest = readAccounts().filter((u) => u.id !== user.id);
  try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([user, ...rest])); } catch { /* storage full or blocked */ }
  useSession.getState().set(user);
  return user;
};
const current = (): User => {
  const user = useSession.getState().user;
  if (!user) throw new Error("NOT_SIGNED_IN");
  return user;
};

/** Builds the order the way the server does: prices come from the catalog, never from the caller. */
function buildOrder(input: CreateOrderInput): Order {
  const lines = input.lines.map(({ slug, qty }) => {
    const product = getProductBySlug(slug);
    if (!product) throw new Error("UNKNOWN_PRODUCT");
    return { slug, name: product.name, image: product.image.src, price: product.price, qty };
  });
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const { discount, shipping, total, couponCode } = computeTotals({ subtotal, coupon: input.coupon, district: input.customer.district, area: input.customer.area });
  const now = new Date().toISOString();
  return {
    id: createOrderId(),
    createdAt: now,
    lines,
    subtotal,
    ...(couponCode ? { discount, coupon: couponCode } : {}),
    shipping,
    total,
    customer: input.customer,
    delivery: input.delivery,
    payment: input.payment,
    giftCard: input.giftCard,
    giftNote: input.giftNote,
    note: input.note,
    status: "ordered",
    history: [{ status: "ordered", at: now }],
    requests: [],
  };
}

/** Browser-only implementation backed by the persisted Zustand stores. Replaced by an HTTP adapter later. */
export const localApi: ShopApi = {
  orders: {
    async list() {
      await tick();
      return useOrders.getState().orders;
    },
    async get(id) {
      await tick();
      return findOrder(id);
    },
    async create(input) {
      await tick();
      const order = buildOrder(input);
      useOrders.getState().addOrder(order);
      return order;
    },
    async addRequest(orderId, request) {
      await tick();
      useOrders.getState().addRequest(orderId, request);
      return findOrder(orderId);
    },
    async advance(orderId) {
      await tick();
      useOrders.getState().advanceStatus(orderId);
      return findOrder(orderId);
    },
    async resolveRequest(orderId, requestId, status) {
      await tick();
      useOrders.getState().resolveRequest(orderId, requestId, status);
      return findOrder(orderId);
    },
  },
  admin: {
    async stats() {
      throw new Error("UNSUPPORTED");
    },
    async orders() {
      throw new Error("UNSUPPORTED");
    },
  },
  reviews: {
    async list(slug) {
      await tick();
      return useReviews.getState().reviews.filter((r) => r.slug === slug);
    },
    async summaries() {
      await tick();
      const bySlug = new Map<string, { rating: number }[]>();
      for (const r of useReviews.getState().reviews) bySlug.set(r.slug, [...(bySlug.get(r.slug) ?? []), r]);
      return Object.fromEntries([...bySlug].map(([slug, list]) => [slug, summarize(list)]));
    },
    async add(review) {
      await tick();
      const before = new Set(useReviews.getState().reviews.map((r) => r.id));
      useReviews.getState().add(review);
      return useReviews.getState().reviews.find((r) => !before.has(r.id))!;
    },
    async remove(id) {
      await tick();
      useReviews.getState().remove(id);
    },
  },
  auth: {
    async me() {
      await tick();
      return useSession.getState().user;
    },
    async signIn({ email }) {
      await tick();
      const found = readAccounts().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found) throw new Error("NO_ACCOUNT");
      useSession.getState().set(found);
      return found;
    },
    async signUp(values) {
      await tick();
      if (readAccounts().some((u) => u.email.toLowerCase() === values.email.toLowerCase())) throw new Error("EMAIL_TAKEN");
      // The password is deliberately dropped: this demo adapter never stores one.
      return saveAccount({ id: `usr-${Date.now().toString(36)}`, name: values.name, phone: values.phone, email: values.email.trim(), addresses: [], createdAt: new Date().toISOString() });
    },
    async signOut() {
      await tick();
      useSession.getState().set(null);
    },
    async updateProfile(values) {
      await tick();
      return saveAccount({ ...current(), ...values });
    },
    async addAddress(values) {
      await tick();
      const user = current();
      return saveAccount({ ...user, addresses: [...user.addresses, { id: `adr-${Date.now().toString(36)}`, ...values }] });
    },
    async removeAddress(id) {
      await tick();
      const user = current();
      return saveAccount({ ...user, addresses: user.addresses.filter((a) => a.id !== id) });
    },
  },
};
