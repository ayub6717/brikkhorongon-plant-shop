import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CheckoutValues } from "@/lib/checkout-schema";

export type OrderLine = { slug: string; name: string; image: string; price: number; qty: number };

export const ORDER_STEPS = ["ordered", "packed", "shipped", "outForDelivery", "delivered"] as const;
export type OrderStep = (typeof ORDER_STEPS)[number];
/** The five steps an order moves through, or "cancelled" (set by the shop team, server only). */
export type OrderStatus = OrderStep | "cancelled";
export const stepIndex = (status: OrderStatus): number => (ORDER_STEPS as readonly string[]).indexOf(status);

export const REQUEST_TYPES = ["pot", "giftNote", "date", "custom"] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];
export type RequestStatus = "pending" | "approved" | "declined";

export type ModRequest = {
  id: string;
  type: RequestType;
  /** Free text from the customer (pot choice label, note text, reason…). */
  detail: string;
  /** Machine value for requests that change the order (new date key, new gift note). */
  value?: string;
  status: RequestStatus;
  at: string;
};

export type Order = {
  id: string;
  createdAt: string;
  lines: OrderLine[];
  subtotal: number;
  /** Coupon discount in BDT (absent on orders placed before coupons existed). */
  discount?: number;
  coupon?: string;
  shipping: number;
  total: number;
  customer: Pick<CheckoutValues, "name" | "phone" | "email" | "district" | "area" | "address">;
  delivery: Pick<CheckoutValues, "date" | "slot">;
  payment: CheckoutValues["payment"];
  /** Card design shipped with the gift note (absent on older orders). */
  giftCard?: CheckoutValues["giftCard"];
  giftNote: string;
  note: string;
  status: OrderStatus;
  history: { status: OrderStatus; at: string }[];
  requests: ModRequest[];
  /** unpaid | paid | refunded. Only the server tracks this. */
  paymentStatus?: string;
  cancelReason?: string;
};

/** Changes are only possible before the order leaves our hands. */
export function canModify(order: Pick<Order, "status">): boolean {
  return order.status === "ordered" || order.status === "packed";
}

type OrdersState = {
  orders: Order[];
  addOrder: (order: Order) => void;
  addRequest: (orderId: string, request: Omit<ModRequest, "id" | "status" | "at">) => void;
  /** Demo helpers: stand in for the shop team until a real API exists. */
  advanceStatus: (orderId: string) => void;
  resolveRequest: (orderId: string, requestId: string, status: Exclude<RequestStatus, "pending">) => void;
};

const patch = (orders: Order[], id: string, fn: (o: Order) => Order) => orders.map((o) => (o.id === id ? fn(o) : o));

// Mock persistence until a real API exists: orders live in this browser only.
export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
      addRequest: (orderId, request) =>
        set((s) => ({
          orders: patch(s.orders, orderId, (o) =>
            canModify(o)
              ? {
                  ...o,
                  requests: [{ ...request, id: `REQ-${Date.now().toString(36).toUpperCase()}`, status: "pending", at: new Date().toISOString() }, ...o.requests],
                }
              : o,
          ),
        })),
      advanceStatus: (orderId) =>
        set((s) => ({
          orders: patch(s.orders, orderId, (o) => {
            const next = ORDER_STEPS[stepIndex(o.status) + 1];
            if (!next) return o;
            return { ...o, status: next, history: [...o.history, { status: next, at: new Date().toISOString() }] };
          }),
        })),
      resolveRequest: (orderId, requestId, status) =>
        set((s) => ({
          orders: patch(s.orders, orderId, (o) => {
            const req = o.requests.find((r) => r.id === requestId);
            if (!req || req.status !== "pending") return o;
            let next: Order = { ...o, requests: o.requests.map((r) => (r.id === requestId ? { ...r, status } : r)) };
            if (status === "approved" && req.value) {
              if (req.type === "date") next = { ...next, delivery: { ...next.delivery, date: req.value } };
              if (req.type === "giftNote") next = { ...next, giftNote: req.value };
            }
            return next;
          }),
        })),
    }),
    {
      name: "brikkhorongon-orders",
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as { orders?: Order[] };
        if (version < 2 && state.orders) {
          state.orders = state.orders.map((o) => ({ ...o, requests: o.requests ?? [] }));
        }
        return state as OrdersState;
      },
    },
  ),
);

export function createOrderId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const code = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 6).toUpperCase();
  return `BRK-${code}`;
}
