import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CheckoutValues } from "@/lib/checkout-schema";

export type OrderLine = { slug: string; name: string; image: string; price: number; qty: number };

export type OrderStatus = "ordered" | "packed" | "shipped" | "outForDelivery" | "delivered";

export type Order = {
  id: string;
  createdAt: string;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  customer: Pick<CheckoutValues, "name" | "phone" | "email" | "district" | "area" | "address">;
  delivery: Pick<CheckoutValues, "date" | "slot">;
  payment: CheckoutValues["payment"];
  giftNote: string;
  note: string;
  status: OrderStatus;
  history: { status: OrderStatus; at: string }[];
};

type OrdersState = {
  orders: Order[];
  addOrder: (order: Order) => void;
};

// Mock persistence until a real API exists: orders live in this browser only.
export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
    }),
    { name: "brikkhorongon-orders", version: 1 },
  ),
);

export function createOrderId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const code = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 6).toUpperCase();
  return `BRK-${code}`;
}
