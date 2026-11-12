import type { BonsaiStyle, CategorySlug, Difficulty, Light, Placement, Water } from "@/data/types";
import type { Order } from "@/store/orders";
import { call } from "./http";

// ---- Shapes the admin API returns (mirror backend/BrikkhoRongon.Api/Endpoints/Admin*.cs) ----
export type Role = "Admin" | "Manager" | "Viewer" | "Delivery" | "Customer";

export type AdminProduct = {
  id: number; slug: string; nameEn: string; nameBn: string; descriptionEn: string; descriptionBn: string;
  category: CategorySlug; price: number; stock?: number | null; hidden: boolean; featured: boolean; needsReview: boolean;
  image: { src: string; width: number; height: number };
  care: { light: Light; water: Water; difficulty: Difficulty };
  bonsai?: { style: BonsaiStyle; ageYears: number; heightCm: number; placement: Placement };
  updatedAt?: string;
};
export type ProductInput = Omit<AdminProduct, "id" | "updatedAt" | "bonsai" | "slug" | "stock"> & {
  slug?: string; stock: number | null; bonsai?: AdminProduct["bonsai"] | null;
};
export type BulkInput = {
  ids: number[]; priceMode?: "set" | "percent" | "add"; priceValue?: number; stockMode?: "set" | "add" | "untrack"; stockValue?: number;
  hidden?: boolean; featured?: boolean;
};

export type OrderNote = { id: number; text: string; author: string; at: string };
export type OrderDetail = { order: Order; notes: OrderNote[]; customerOrders: number; customerSpent: number };
export type OrdersFilter = {
  status?: string; q?: string; district?: string; payment?: string; paymentStatus?: string;
  from?: string; to?: string; deliveryDate?: string; page?: number; pageSize?: number;
};
export type OrdersPage = { items: Order[]; total: number; page: number; pageSize: number };

export type Analytics = {
  days: number; revenue: number; orders: number; averageOrder: number; newCustomers: number; returningCustomers: number;
  newCustomerOrders: number; returningCustomerOrders: number;
  series: { date: string; orders: number; value: number }[];
  categories: { category: string; qty: number; revenue: number }[];
  topPlants: { slug: string; name: string; qty: number; value: number }[];
  lowStock: { id: number; slug: string; name: string; stock: number; image: string }[];
  outOfStock: number; lowStockAt: number;
};

export type Customer = {
  id: string; name: string; email: string; phone: string; createdAt: string; locked: boolean; roles: string[];
  orderCount: number; totalSpent: number; lastOrderAt?: string;
};
export type CustomerDetail = { customer: Customer; orders: Order[]; addresses: { id: string; label: string; district: string; area: string; address: string }[] };

export type Coupon = { code: string; kind: "percent" | "fixed" | "freeShip"; value: number; minSubtotal: number; expiresAt?: string; usageLimit?: number; used: number; active: boolean; createdAt: string };
export type CouponInput = { code?: string; kind: Coupon["kind"]; value: number; minSubtotal: number; expiresAt?: string | null; usageLimit?: number | null; active: boolean };

export type Settings = {
  freeShippingThreshold: number; dhakaInnerFee: number; dhakaOuterFee: number; districtFees: Record<string, number>;
  slots: string[]; lowStockAt: number; shopName: string; phone: string; email: string; address: string;
};

export type AdminReview = { id: string; slug: string; name: string; rating: number; title: string; text: string; at: string; verified: boolean; hidden: boolean };
export type AuditRow = { id: number; at: string; actor: string; action: string; entity: string; entityId?: string; detail?: string };
export type StaffMember = { id: string; name: string; email: string; role: Role; createdAt: string };
type Page<T> = { items: T[]; total: number; page: number; pageSize: number };

const qs = (o: Record<string, string | number | boolean | undefined | null>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== "" && v !== false) p.set(k, String(v));
  return p.size ? `?${p}` : "";
};
const enc = encodeURIComponent;
const post = <T>(path: string, body?: unknown) => call<T>(path, { method: "POST", body });

export type AdminStats = {
  orderCount: number; orderValue: number; pendingRequests: number; needsAction: number; byStatus: Record<string, number>;
  last7Days: { date: string; orders: number; value: number }[]; topPlants: { slug: string; name: string; qty: number; value: number }[];
};

export const adminApi = {
  stats: () => call<AdminStats>("/admin/stats"),
  analytics: (days: number) => call<Analytics>(`/admin/analytics${qs({ days })}`),

  products: (f: { q?: string; category?: string; stock?: string; hidden?: boolean } = {}) => call<AdminProduct[]>(`/admin/products${qs({ ...f, hidden: f.hidden })}`),
  product: (id: number) => call<AdminProduct>(`/admin/products/${id}`),
  createProduct: (p: ProductInput) => post<AdminProduct>("/admin/products", p),
  updateProduct: (id: number, p: ProductInput) => call<AdminProduct>(`/admin/products/${id}`, { method: "PUT", body: p }),
  deleteProduct: (id: number) => call<void>(`/admin/products/${id}`, { method: "DELETE" }),
  setHidden: (id: number, hidden: boolean) => post<AdminProduct>(`/admin/products/${id}/visibility`, { hidden }),
  bulk: (b: BulkInput) => post<{ updated: number }>("/admin/products/bulk", b),
  importProducts: (rows: ProductInput[]) => post<{ created: number; updated: number }>("/admin/products/import", { rows }),
  upload: (data: string, contentType = "image/webp") => post<{ id: string; src: string }>("/admin/uploads", { contentType, data }),

  orders: (f: OrdersFilter) => call<OrdersPage>(`/admin/orders${qs({ ...f, page: f.page && f.page > 1 ? f.page : undefined })}`),
  order: (id: string) => call<OrderDetail>(`/admin/orders/${enc(id)}`),
  advance: (id: string) => post<OrderDetail>(`/admin/orders/${enc(id)}/advance`),
  cancel: (id: string, reason: string) => post<OrderDetail>(`/admin/orders/${enc(id)}/cancel`, { reason }),
  refund: (id: string) => post<OrderDetail>(`/admin/orders/${enc(id)}/refund`),
  setPayment: (id: string, status: "paid" | "unpaid") => post<OrderDetail>(`/admin/orders/${enc(id)}/payment`, { status }),
  addNote: (id: string, text: string) => post<OrderDetail>(`/admin/orders/${enc(id)}/notes`, { text }),
  resolveRequest: (id: string, requestId: string, status: "approved" | "declined") =>
    post<OrderDetail>(`/admin/orders/${enc(id)}/requests/${enc(requestId)}/resolve`, { status }),

  customers: (q: string, page: number) => call<Page<Customer>>(`/admin/customers${qs({ q, page: page > 1 ? page : undefined })}`),
  customer: (id: string) => call<CustomerDetail>(`/admin/customers/${enc(id)}`),
  lockCustomer: (id: string, locked: boolean) => post<Customer>(`/admin/customers/${enc(id)}/lock`, { locked }),

  coupons: () => call<Coupon[]>("/admin/coupons"),
  createCoupon: (c: CouponInput) => post<Coupon>("/admin/coupons", c),
  updateCoupon: (code: string, c: CouponInput) => call<Coupon>(`/admin/coupons/${enc(code)}`, { method: "PUT", body: c }),
  deleteCoupon: (code: string) => call<void>(`/admin/coupons/${enc(code)}`, { method: "DELETE" }),

  settings: () => call<Settings>("/admin/settings"),
  saveSettings: (s: Settings) => call<Settings>("/admin/settings", { method: "PUT", body: s }),

  reviews: (hidden: boolean | undefined, page: number) => call<Page<AdminReview>>(`/admin/reviews${qs({ hidden: hidden === undefined ? undefined : String(hidden), page: page > 1 ? page : undefined })}`),
  hideReview: (id: string, hidden: boolean) => post<AdminReview>(`/admin/reviews/${enc(id)}/hide`, { locked: hidden }),
  deleteReview: (id: string) => call<void>(`/reviews/${enc(id)}`, { method: "DELETE" }),

  audit: (entity: string, page: number) => call<Page<AuditRow>>(`/admin/audit${qs({ entity, page: page > 1 ? page : undefined })}`),
  staff: () => call<StaffMember[]>("/admin/staff"),
  setStaff: (email: string, role: Role) => post<StaffMember>("/admin/staff", { email, role }),
  removeStaff: (id: string) => call<void>(`/admin/staff/${enc(id)}`, { method: "DELETE" }),

  changePassword: (current: string, next: string) => post<void>("/me/change-password", { current, new: next }),
};
