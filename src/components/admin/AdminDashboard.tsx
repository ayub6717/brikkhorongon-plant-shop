"use client";

import { AlertTriangle, Boxes, Clock, MessageSquareWarning, Wallet } from "lucide-react";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { adminApi } from "@/lib/api/admin";
import { Bars, ErrorLine, PageHeader, Stat, btn, card, money, num, useAdminQuery } from "./ui";

const dayLabel = (key: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(new Date(`${key}T00:00:00Z`));
const shortDate = (key: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${key}T00:00:00Z`));

export function AdminDashboard() {
  const stats = useAdminQuery(["stats"], () => adminApi.stats());
  const low = useAdminQuery(["analytics", 7], () => adminApi.analytics(7));
  const s = stats.data;
  return (
    <>
      <PageHeader title="Dashboard" subtitle="How the shop is doing right now." />
      <ErrorLine error={stats.error} />
      <section aria-label="Overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Orders (not cancelled)" value={s ? num(s.orderCount) : "…"} />
        <Stat label="Order value" value={s ? money(s.orderValue) : "…"} />
        <Stat label="Not yet delivered" value={s ? num(s.needsAction) : "…"} />
        <Stat label="Change requests waiting" value={s ? num(s.pendingRequests) : "…"} tone={s && s.pendingRequests > 0 ? "bad" : undefined} />
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className={card}>
          <h2 className="font-display text-xl font-semibold">Last 7 days</h2>
          {s && <div className="mt-4"><Bars format={money} items={s.last7Days.map((d) => ({ key: d.date, label: dayLabel(d.date), value: d.value, sub: `${d.orders} orders` }))} /></div>}
        </section>
        <section className={card}>
          <h2 className="font-display text-xl font-semibold">Best sellers</h2>
          {s && s.topPlants.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No sales yet.</p>}
          <ol className="mt-4 space-y-3 text-sm">
            {s?.topPlants.map((p, i) => <li key={p.slug} className="flex justify-between gap-3"><span className="truncate">{i + 1}. {p.name}</span><span className="shrink-0 text-muted-foreground tabular-nums">{p.qty} sold · {money(p.value)}</span></li>)}
          </ol>
        </section>
      </div>
      {low.data && (low.data.lowStock.length > 0 || low.data.outOfStock > 0) && (
        <section className={`${card} mt-6`}>
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><AlertTriangle className="size-5 text-accent" aria-hidden />Running low</h2>
          <p className="mt-1 text-sm text-muted-foreground">{low.data.outOfStock} out of stock. Plants at {low.data.lowStockAt} or fewer:</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {low.data.lowStock.slice(0, 8).map((p) => <li key={p.id} className="flex justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm"><Link href={`/admin/products/${p.id}`} className="truncate underline-offset-4 hover:underline">{p.name}</Link><span className={p.stock === 0 ? "font-semibold text-accent" : ""}>{p.stock === 0 ? "Out" : `${p.stock} left`}</span></li>)}
          </ul>
        </section>
      )}
      <p className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/orders?status=ordered" className={btn}><Clock className="size-4" aria-hidden />New orders</Link>
        <Link href="/admin/products" className={btn}><Boxes className="size-4" aria-hidden />Products</Link>
        <Link href="/admin/deliveries" className={btn}><Wallet className="size-4" aria-hidden />Today&apos;s deliveries</Link>
        {s && s.pendingRequests > 0 && <Link href="/admin/orders" className={btn}><MessageSquareWarning className="size-4" aria-hidden />Review change requests</Link>}
      </p>
    </>
  );
}

// ============================ Analytics ============================
export function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const q = useAdminQuery(["analytics", days], () => adminApi.analytics(days));
  const a = q.data;
  const totalCat = a?.categories.reduce((n, c) => n + c.revenue, 0) ?? 0;
  return (
    <>
      <PageHeader title="Analytics" subtitle="Cancelled orders are left out of every number."
        actions={<span className="inline-flex rounded-full border border-border p-0.5" role="group" aria-label="Period">
          {[7, 30, 90].map((d) => <button key={d} type="button" onClick={() => setDays(d)} aria-pressed={days === d} className={`rounded-full px-4 py-1.5 text-sm font-medium ${days === d ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{d} days</button>)}
        </span>} />
      <ErrorLine error={q.error} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue" value={a ? money(a.revenue) : "…"} />
        <Stat label="Orders" value={a ? num(a.orders) : "…"} />
        <Stat label="Average order value" value={a ? money(a.averageOrder) : "…"} />
        <Stat label="New vs returning customers" value={a ? `${num(a.newCustomers)} / ${num(a.returningCustomers)}` : "…"} hint={a ? `${a.newCustomerOrders} orders from new, ${a.returningCustomerOrders} from returning` : undefined} />
      </section>
      {a && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className={`${card} lg:col-span-2`}>
            <h2 className="font-display text-xl font-semibold">Revenue per day</h2>
            <div className="mt-4"><Bars format={money} items={a.series.map((d) => ({ key: d.date, label: shortDate(d.date), value: d.value, sub: `${d.orders} orders` }))} /></div>
            <p className="mt-2 text-xs text-muted-foreground">{shortDate(a.series[0].date)} → {shortDate(a.series[a.series.length - 1].date)}</p>
          </section>
          <section className={card}>
            <h2 className="font-display text-xl font-semibold">Sales by category</h2>
            {a.categories.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No sales in this period.</p>}
            <ul className="mt-4 space-y-3 text-sm">
              {a.categories.map((c) => (
                <li key={c.category}>
                  <div className="flex justify-between"><span className="capitalize">{c.category}</span><span className="tabular-nums text-muted-foreground">{c.qty} sold · {money(c.revenue)}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary/80" style={{ width: `${totalCat ? (c.revenue / totalCat) * 100 : 0}%` }} /></div>
                </li>
              ))}
            </ul>
          </section>
          <section className={card}>
            <h2 className="font-display text-xl font-semibold">Best sellers</h2>
            {a.topPlants.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No sales in this period.</p>}
            <ol className="mt-4 space-y-2.5 text-sm">{a.topPlants.map((p, i) => <li key={p.slug} className="flex justify-between gap-3"><span className="truncate">{i + 1}. {p.name}</span><span className="shrink-0 tabular-nums text-muted-foreground">{p.qty} · {money(p.value)}</span></li>)}</ol>
          </section>
          <section className={`${card} lg:col-span-2`}>
            <h2 className="font-display text-xl font-semibold">Low stock</h2>
            <p className="mt-1 text-sm text-muted-foreground">{a.outOfStock} out of stock · warning level: {a.lowStockAt} or fewer (change it in Settings).</p>
            {a.lowStock.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nothing is running low.</p> : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {a.lowStock.map((p) => <li key={p.id} className="flex justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm"><Link href={`/admin/products/${p.id}`} className="truncate underline-offset-4 hover:underline">{p.name}</Link><span className={p.stock === 0 ? "font-semibold text-accent" : ""}>{p.stock === 0 ? "Out" : `${p.stock} left`}</span></li>)}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
