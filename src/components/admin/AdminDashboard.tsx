"use client";

import { Boxes, Clock, MessageSquareWarning, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Select } from "@/components/ui/Select";
import { useRequestDescriber } from "@/components/track/ModifyRequests";
import { Link } from "@/i18n/navigation";
import { usingServer } from "@/lib/api";
import { useAdminActions } from "./useAdminActions";
import { useAdminOrders, useAdminStats, useSessionQuery } from "@/lib/api/queries";
import type { Order } from "@/lib/api/types";
import { ORDER_STEPS } from "@/store/orders";

const card = "rounded-card border border-border bg-surface p-5";

function Notice({ title, body, children }: Readonly<{ title: string; body: string; children?: ReactNode }>) {
  return (
    <div className="mx-auto max-w-lg rounded-card border border-dashed border-border bg-surface/60 p-12 text-center">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-muted-foreground">{body}</p>
      {children}
    </div>
  );
}

export function AdminDashboard() {
  const t = useTranslations("Admin");
  const { data: user, isPending } = useSessionQuery();
  const isAdmin = Boolean(user?.roles?.includes("Admin"));

  if (!usingServer) return <Notice title={t("needsServerTitle")} body={t("needsServerBody")} />;
  if (isPending) return <div className="h-64" aria-hidden />;
  if (!isAdmin) {
    return (
      <Notice title={t("adminsOnlyTitle")} body={t("adminsOnlyBody")}>
        {!user && <Link href="/login" className="mt-7 inline-block rounded-full bg-primary px-7 py-3 font-medium text-primary-foreground">{t("signIn")}</Link>}
      </Notice>
    );
  }
  return <Dashboard />;
}

function Dashboard() {
  const t = useTranslations("Admin");
  const ts = useTranslations("Track");
  const locale = useLocale();
  const nf = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD");
  const money = (n: number) => `৳${nf.format(Math.round(n))}`;

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const stats = useAdminStats(true);
  const orders = useAdminOrders({ status: status || undefined, q: search || undefined, page }, true);

  const s = stats.data;
  const peak = Math.max(1, ...(s?.last7Days.map((d) => d.value) ?? [0]));
  const day = (key: string) => new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { weekday: "short", timeZone: "UTC" }).format(new Date(`${key}T00:00:00Z`));
  const pages = orders.data ? Math.max(1, Math.ceil(orders.data.total / orders.data.pageSize)) : 1;

  return (
    <div className="space-y-8">
      <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">{t("demoNote")}</p>

      <section aria-label={t("overview")} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Boxes className="size-5" aria-hidden />} label={t("orders")} value={s ? nf.format(s.orderCount) : "…"} />
        <Stat icon={<Wallet className="size-5" aria-hidden />} label={t("orderValue")} value={s ? money(s.orderValue) : "…"} />
        <Stat icon={<Clock className="size-5" aria-hidden />} label={t("open")} value={s ? nf.format(s.needsAction) : "…"} />
        <Stat icon={<MessageSquareWarning className="size-5" aria-hidden />} label={t("pendingRequests")} value={s ? nf.format(s.pendingRequests) : "…"} />
      </section>

      {stats.isError && <p role="alert" className="text-sm font-medium text-accent">{t("loadFailed")}</p>}

      {s && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className={card} aria-labelledby="chart-h">
            <h2 id="chart-h" className="font-display text-xl font-semibold">{t("last7")}</h2>
            <ol className="mt-5 flex h-44 items-end gap-2">
              {s.last7Days.map((d) => (
                <li key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${d.date}: ${money(d.value)}`}>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{d.orders > 0 ? nf.format(d.orders) : ""}</span>
                  <span className="w-full rounded-t-md bg-primary/80" style={{ height: `${Math.max(d.value > 0 ? 4 : 0, (d.value / peak) * 100)}%` }} />
                  <span className="text-xs text-muted-foreground">{day(d.date)}</span>
                  <span className="sr-only">{`${d.date}: ${t("ordersCount", { count: d.orders })}, ${money(d.value)}`}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className={card} aria-labelledby="top-h">
            <h2 id="top-h" className="font-display text-xl font-semibold">{t("topPlants")}</h2>
            {s.topPlants.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t("noSales")}</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {s.topPlants.map((p, i) => (
                  <li key={p.slug} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate"><span className="text-muted-foreground">{nf.format(i + 1)}.</span> {p.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{t("sold", { count: p.qty })} · {money(p.value)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}

      <section className={card} aria-labelledby="orders-h">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="orders-h" className="font-display text-xl font-semibold">{t("ordersTitle")}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="w-56 rounded-full border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary"
            />
            <Select
              label={t("filterStatus")}
              value={status}
              onChange={(v) => { setStatus(v); setPage(1); }}
              options={[{ value: "", label: t("allStatuses") }, ...ORDER_STEPS.map((x) => ({ value: x, label: ts(`steps.${x}`) }))]}
            />
          </div>
        </div>

        {orders.isError && <p role="alert" className="mt-4 text-sm font-medium text-accent">{t("loadFailed")}</p>}
        {orders.data && orders.data.items.length === 0 && <p className="mt-6 text-sm text-muted-foreground">{t("noOrders")}</p>}
        <ul className="mt-4 divide-y divide-border">
          {orders.data?.items.map((o) => <OrderRow key={o.id} order={o} money={money} />)}
        </ul>

        {orders.data && pages > 1 && (
          <div className="mt-5 flex items-center justify-between text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-border px-4 py-2 font-medium hover:bg-muted disabled:opacity-50">{t("prev")}</button>
            <span className="text-muted-foreground">{t("pageOf", { page: nf.format(page), pages: nf.format(pages) })}</span>
            <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-full border border-border px-4 py-2 font-medium hover:bg-muted disabled:opacity-50">{t("next")}</button>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: Readonly<{ icon: ReactNode; label: string; value: string }>) {
  return (
    <div className={card}>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function OrderRow({ order, money }: Readonly<{ order: Order; money: (n: number) => string }>) {
  const t = useTranslations("Admin");
  const ts = useTranslations("Track");
  const locale = useLocale();
  const describe = useRequestDescriber();
  const { advance, resolve } = useAdminActions();
  const pending = order.requests.filter((r) => r.status === "pending");
  const last = order.status === ORDER_STEPS[ORDER_STEPS.length - 1];
  const when = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt));

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium tracking-wide">
            <Link href={`/track?id=${order.id}`} className="underline-offset-4 hover:underline">{order.id}</Link>
            <span className="ms-2 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{ts(`steps.${order.status}`)}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{when} · {order.customer.name} · {order.customer.phone}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums">{money(order.total)}</span>
          <button
            type="button"
            disabled={last || advance.isPending}
            onClick={() => advance.mutate(order.id)}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {last ? t("delivered") : t("advance")}
          </button>
        </div>
      </div>
      {pending.length > 0 && (
        <ul className="mt-3 space-y-2">
          {pending.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 p-3 text-sm">
              <span className="min-w-0 flex-1 truncate">{describe(r)}</span>
              <span className="flex gap-2">
                <button type="button" onClick={() => resolve.mutate({ orderId: order.id, requestId: r.id, status: "approved" })} className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">{ts("demoApprove")}</button>
                <button type="button" onClick={() => resolve.mutate({ orderId: order.id, requestId: r.id, status: "declined" })} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-background">{ts("demoDecline")}</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
