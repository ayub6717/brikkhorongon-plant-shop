import type { ModRequest, Order, RequestStatus } from "@/store/orders";
import type { RatingSummary, Review } from "@/store/reviews";
import type { SavedAddress, User } from "@/store/session";
import type { AddressValues, LoginValues, RegisterValues } from "@/lib/auth-schema";

export type { ModRequest, Order, RatingSummary, RequestStatus, Review, SavedAddress, User };

/** What checkout sends. No prices: whoever stores the order (browser adapter or server) works out the money. */
export type CreateOrderInput = {
  lines: { slug: string; qty: number }[];
  coupon?: string | null;
  customer: Order["customer"];
  delivery: Order["delivery"];
  payment: Order["payment"];
  giftCard: NonNullable<Order["giftCard"]>;
  giftNote: string;
  note: string;
};

export type AdminStats = {
  orderCount: number;
  orderValue: number;
  pendingRequests: number;
  needsAction: number;
  byStatus: Record<string, number>;
  last7Days: { date: string; orders: number; value: number }[];
  topPlants: { slug: string; name: string; qty: number; value: number }[];
};
export type AdminOrdersPage = { items: Order[]; total: number; page: number; pageSize: number };
export type AdminOrdersQuery = { status?: string; q?: string; page?: number };

export type NewReview = Pick<Review, "slug" | "name" | "rating" | "title" | "text">;
export type NewRequest = Omit<ModRequest, "id" | "status" | "at">;

/**
 * Everything the UI needs from a backend. The browser-only adapter (`local.ts`) implements it today;
 * an HTTP adapter pointing at the ASP.NET Core API will implement the same interface later,
 * so no component has to change when the backend arrives.
 */
export interface ShopApi {
  orders: {
    list(): Promise<Order[]>;
    get(id: string): Promise<Order | null>;
    create(input: CreateOrderInput): Promise<Order>;
    addRequest(orderId: string, request: NewRequest): Promise<Order | null>;
    /** Admin/demo only. */
    advance(orderId: string): Promise<Order | null>;
    /** Admin/demo only. */
    resolveRequest(orderId: string, requestId: string, status: Exclude<RequestStatus, "pending">): Promise<Order | null>;
  };
  /** Shop-team dashboard data. Needs the server and an Admin account. */
  admin: {
    stats(): Promise<AdminStats>;
    orders(query: AdminOrdersQuery): Promise<AdminOrdersPage>;
  };
  reviews: {
    list(slug: string): Promise<Review[]>;
    /** Rating summary per product slug (used by product cards). */
    summaries(): Promise<Record<string, RatingSummary>>;
    add(review: NewReview): Promise<Review>;
    remove(id: string): Promise<void>;
  };
  auth: {
    me(): Promise<User | null>;
    /** Demo adapter: finds the account by email only. The server adapter verifies the password. */
    signIn(values: LoginValues): Promise<User>;
    signUp(values: RegisterValues): Promise<User>;
    signOut(): Promise<void>;
    updateProfile(values: Pick<User, "name" | "phone">): Promise<User>;
    addAddress(values: AddressValues): Promise<User>;
    removeAddress(id: string): Promise<User>;
  };
}
