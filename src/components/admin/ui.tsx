"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/http";
import { useSessionQuery } from "@/lib/api/queries";
import type { Role } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// ---- shared look ----
export const card = "rounded-card border border-border bg-surface p-5";
export const input = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary disabled:opacity-60";
export const btn = "inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
export const btnDanger = "inline-flex items-center justify-center gap-2 rounded-full border border-accent/50 px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50";

// ---- formatting ----
const nf = new Intl.NumberFormat("en-BD");
export const money = (n: number) => `৳${nf.format(Math.round(n))}`;
export const num = (n: number) => nf.format(n);
export const fmtDateTime = (iso: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(new Date(iso));
export const fmtDate = (iso: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Dhaka" }).format(new Date(iso));
export const todayKey = () => new Date(Date.now() + 6 * 3600_000).toISOString().slice(0, 10); // today in Bangladesh (UTC+6)

export const STATUS_LABEL: Record<string, string> = {
  ordered: "Ordered", packed: "Packed", shipped: "Shipped", outForDelivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled",
};
export const PAYMENT_LABEL: Record<string, string> = { cod: "Cash on delivery", bkash: "bKash", card: "Card" };
export const SLOT_LABEL: Record<string, string> = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" };
export const DISTRICT_LABEL: Record<string, string> = {
  dhaka: "Dhaka", chattogram: "Chattogram", sylhet: "Sylhet", rajshahi: "Rajshahi", khulna: "Khulna", barishal: "Barishal",
  rangpur: "Rangpur", mymensingh: "Mymensingh", other: "Other",
};
export const ROLE_LABEL: Record<string, string> = { Admin: "Owner", Manager: "Manager", Viewer: "Read-only", Delivery: "Delivery staff", Customer: "Customer" };

/** A readable message for whatever went wrong (the API's own message when it sent one). */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const first = e.fields ? Object.values(e.fields)[0]?.[0] : undefined;
    if (first) return first;
    if (e.title && e.code !== "NETWORK") return e.title;
    const known: Record<string, string> = {
      NETWORK: "Can't reach the server. It may be waking up (the free host sleeps when idle): wait a few seconds and try again.",
      UNAUTHORIZED: "Your session has expired. Please sign in again.", FORBIDDEN: "Your role isn't allowed to do that.", RATE_LIMITED: "Too many requests. Wait a moment.",
    };
    return known[e.code] ?? "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export function useRoles(): { roles: string[]; isPending: boolean; signedIn: boolean } {
  const { data, isPending } = useSessionQuery();
  return { roles: (data?.roles ?? []) as string[], isPending, signedIn: Boolean(data) };
}
/** True when the signed-in account has at least one of these roles. */
export function useCan(...allowed: Role[]): boolean {
  const { roles } = useRoles();
  return allowed.some((r) => roles.includes(r));
}

// ---- small building blocks ----
export function PageHeader({ title, subtitle, actions }: Readonly<{ title: string; subtitle?: string; actions?: ReactNode }>) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 print:hidden">
      <div>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ children, tone = "muted" }: Readonly<{ children: ReactNode; tone?: "muted" | "good" | "warn" | "bad" | "info" }>) {
  const tones = { muted: "bg-muted", good: "bg-primary/15 text-primary", warn: "bg-amber-500/15 text-amber-700 dark:text-amber-300", bad: "bg-accent/15 text-accent", info: "bg-sky-500/15 text-sky-700 dark:text-sky-300" };
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function StatusBadge({ status }: Readonly<{ status: string }>) {
  const tone = status === "delivered" ? "good" : status === "cancelled" ? "bad" : status === "ordered" ? "warn" : "info";
  return <Badge tone={tone}>{STATUS_LABEL[status] ?? status}</Badge>;
}

export function PaymentBadge({ status }: Readonly<{ status?: string }>) {
  return <Badge tone={status === "paid" ? "good" : status === "refunded" ? "bad" : "warn"}>{status === "paid" ? "Paid" : status === "refunded" ? "Refunded" : "Unpaid"}</Badge>;
}

export function Notice({ title, body, children }: Readonly<{ title: string; body?: string; children?: ReactNode }>) {
  return (
    <div className="mx-auto my-16 max-w-lg rounded-card border border-dashed border-border bg-surface/60 p-10 text-center">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {body && <p className="mt-2 text-muted-foreground">{body}</p>}
      {children}
    </div>
  );
}

export function ErrorLine({ error }: Readonly<{ error: unknown }>) {
  return error ? <p role="alert" className="text-sm font-medium text-accent">{errorMessage(error)}</p> : null;
}

export function Field({ label, hint, error, children, className }: Readonly<{ label: string; hint?: string; error?: string; children: ReactNode; className?: string }>) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-xs font-medium text-accent">{error}</span>}
    </label>
  );
}

export function Pager({ page, pages, onPage }: Readonly<{ page: number; pages: number; onPage: (p: number) => void }>) {
  if (pages <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-between text-sm">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={btn}>Previous</button>
      <span className="text-muted-foreground">Page {page} of {pages}</span>
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className={btn}>Next</button>
    </div>
  );
}

export function Stat({ label, value, hint, tone }: Readonly<{ label: string; value: string; hint?: string; tone?: "bad" }>) {
  return (
    <div className={card}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-1.5 font-display text-3xl font-semibold tabular-nums", tone === "bad" && "text-accent")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** A tiny bar chart (no chart library needed): one bar per item, scaled to the biggest. */
export function Bars({ items, format }: Readonly<{ items: { key: string; label: string; value: number; sub?: string }[]; format: (n: number) => string }>) {
  const peak = Math.max(1, ...items.map((i) => i.value));
  return (
    <ol className="flex h-44 items-end gap-1" aria-label="Chart">
      {items.map((d) => (
        <li key={d.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${d.label}: ${format(d.value)}${d.sub ? ` · ${d.sub}` : ""}`}>
          <span className="w-full rounded-t bg-primary/80" style={{ height: `${Math.max(d.value > 0 ? 3 : 0, (d.value / peak) * 100)}%` }} />
          {items.length <= 10 && <span className="truncate text-[11px] text-muted-foreground">{d.label}</span>}
          <span className="sr-only">{`${d.label}: ${format(d.value)}`}</span>
        </li>
      ))}
    </ol>
  );
}

/** Loads one query and renders loading / error / data. */
export function useAdminQuery<T>(key: unknown[], fn: () => Promise<T>, enabled = true) {
  return useQuery({ queryKey: ["admin", ...key], queryFn: fn, enabled, retry: false });
}
