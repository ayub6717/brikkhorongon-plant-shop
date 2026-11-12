"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { adminApi, type Coupon, type CouponInput, type Role, type Settings } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import {
  Badge, DISTRICT_LABEL, ErrorLine, Field, Notice, PageHeader, Pager, PaymentBadge, ROLE_LABEL, SLOT_LABEL, StatusBadge,
  btn, btnDanger, btnPrimary, card, fmtDate, fmtDateTime, input, money, num, useAdminQuery, useCan,
} from "./ui";

// ============================ Customers ============================
export function CustomersPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const list = useAdminQuery(["customers", q, page], () => adminApi.customers(q, page));
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;
  return (
    <>
      <PageHeader title="Customers" subtitle={list.data ? `${num(list.data.total)} accounts` : undefined} />
      <section className={card}>
        <Field label="Search" className="max-w-sm"><input className={input} placeholder="Name, email or phone" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></Field>
        <ErrorLine error={list.error} />
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="py-2 text-start">Customer</th><th className="text-start">Joined</th><th className="text-end">Orders</th><th className="text-end">Spent</th><th className="ps-4 text-start">Last order</th><th /></tr></thead>
            <tbody className="divide-y divide-border">
              {list.data?.items.map((c) => (
                <tr key={c.id}>
                  <td className="py-3"><Link href={`/admin/customers/${c.id}`} className="font-medium underline-offset-4 hover:underline">{c.name || c.email}</Link><div className="text-xs text-muted-foreground">{c.email} · {c.phone}</div></td>
                  <td>{fmtDate(c.createdAt)}</td><td className="text-end tabular-nums">{num(c.orderCount)}</td><td className="text-end tabular-nums">{money(c.totalSpent)}</td>
                  <td className="ps-4">{c.lastOrderAt ? fmtDate(c.lastOrderAt) : "—"}</td>
                  <td className="text-end"><span className="inline-flex gap-1">{c.roles.filter((r) => r !== "Customer").map((r) => <Badge key={r} tone="info">{ROLE_LABEL[r] ?? r}</Badge>)}{c.locked && <Badge tone="bad">Locked</Badge>}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.data?.items.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No customers match.</p>}
        <Pager page={page} pages={pages} onPage={setPage} />
      </section>
    </>
  );
}

export function CustomerDetailPage({ id }: Readonly<{ id: string }>) {
  const qc = useQueryClient();
  const isOwner = useCan("Admin");
  const q = useAdminQuery(["customer", id], () => adminApi.customer(id));
  const lock = useMutation({ mutationFn: (locked: boolean) => adminApi.lockCustomer(id, locked), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }) });
  if (q.isPending) return <div className="h-64" aria-hidden />;
  if (!q.data) return <Notice title="Customer not found"><Link href="/admin/customers" className={`${btn} mt-6`}>Back</Link></Notice>;
  const { customer: c, orders, addresses } = q.data;
  const staff = c.roles.some((r) => r !== "Customer");
  return (
    <>
      <PageHeader title={c.name || c.email} subtitle={`${c.email} · ${c.phone || "no phone"} · joined ${fmtDate(c.createdAt)}`}
        actions={<><Link href="/admin/customers" className={btn}>← Customers</Link>
          {isOwner && !staff && <button type="button" className={c.locked ? btn : btnDanger} disabled={lock.isPending} onClick={() => lock.mutate(!c.locked)}>{c.locked ? "Unlock account" : "Lock account"}</button>}</>} />
      <ErrorLine error={lock.error} />
      <div className="mb-4 flex gap-2">{c.locked && <Badge tone="bad">Locked: cannot sign in</Badge>}{staff && c.roles.filter((r) => r !== "Customer").map((r) => <Badge key={r} tone="info">{ROLE_LABEL[r]}</Badge>)}</div>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className={card}><p className="text-sm text-muted-foreground">Orders</p><p className="font-display text-3xl font-semibold">{num(c.orderCount)}</p></div>
        <div className={card}><p className="text-sm text-muted-foreground">Total spent</p><p className="font-display text-3xl font-semibold">{money(c.totalSpent)}</p></div>
        <div className={card}><p className="text-sm text-muted-foreground">Last order</p><p className="font-display text-3xl font-semibold">{c.lastOrderAt ? fmtDate(c.lastOrderAt) : "—"}</p></div>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className={card}>
          <h2 className="font-display text-xl font-semibold">Order history</h2>
          {orders.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No orders from this account.</p>}
          <ul className="mt-3 divide-y divide-border text-sm">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span><Link href={`/admin/orders/${o.id}`} className="font-medium tracking-wide underline-offset-4 hover:underline">{o.id}</Link><span className="ms-2 text-xs text-muted-foreground">{fmtDateTime(o.createdAt)}</span></span>
                <span className="flex items-center gap-2"><StatusBadge status={o.status} /><PaymentBadge status={o.paymentStatus} /><span className="tabular-nums">{money(o.total)}</span></span>
              </li>
            ))}
          </ul>
        </section>
        <section className={card}>
          <h2 className="font-display text-xl font-semibold">Saved addresses</h2>
          {addresses.length === 0 && <p className="mt-3 text-sm text-muted-foreground">None saved.</p>}
          <ul className="mt-3 space-y-3 text-sm">{addresses.map((a) => <li key={a.id}><p className="font-medium">{a.label}</p><p className="text-muted-foreground">{a.address}, {a.area}, {DISTRICT_LABEL[a.district] ?? a.district}</p></li>)}</ul>
        </section>
      </div>
    </>
  );
}

// ============================ Coupons ============================
type CouponForm = { code: string; kind: Coupon["kind"]; value: string; min: string; expires: string; limit: string; active: boolean; editing: boolean };
const blankCoupon: CouponForm = { code: "", kind: "percent", value: "10", min: "0", expires: "", limit: "", active: true, editing: false };
const KIND_LABEL: Record<string, string> = { percent: "% off", fixed: "৳ off", freeShip: "Free shipping" };
const describe = (c: Coupon) => (c.kind === "percent" ? `${c.value}% off` : c.kind === "fixed" ? `৳${c.value} off` : "Free shipping");

export function CouponsPage() {
  const qc = useQueryClient();
  const canWrite = useCan("Admin", "Manager");
  const list = useAdminQuery(["coupons"], () => adminApi.coupons());
  const [f, setF] = useState<CouponForm>(blankCoupon);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
  const save = useMutation({
    mutationFn: () => {
      const body: CouponInput = {
        code: f.code, kind: f.kind, value: f.kind === "freeShip" ? 0 : Number(f.value), minSubtotal: Number(f.min) || 0, active: f.active,
        expiresAt: f.expires ? `${f.expires}T23:59:59+06:00` : null, usageLimit: f.limit ? Number(f.limit) : null,
      };
      return f.editing ? adminApi.updateCoupon(f.code, body) : adminApi.createCoupon(body);
    },
    onSuccess: () => { setF(blankCoupon); return refresh(); },
  });
  const del = useMutation({ mutationFn: (code: string) => adminApi.deleteCoupon(code), onSuccess: refresh });
  const toggle = useMutation({
    mutationFn: (c: Coupon) => adminApi.updateCoupon(c.code, { kind: c.kind, value: c.value, minSubtotal: c.minSubtotal, expiresAt: c.expiresAt ?? null, usageLimit: c.usageLimit ?? null, active: !c.active }),
    onSuccess: refresh,
  });
  const edit = (c: Coupon) => setF({ code: c.code, kind: c.kind, value: String(c.value), min: String(c.minSubtotal), expires: c.expiresAt ? new Date(new Date(c.expiresAt).getTime() + 6 * 3600_000).toISOString().slice(0, 10) : "", limit: c.usageLimit ? String(c.usageLimit) : "", active: c.active, editing: true });
  const fe = (k: string) => (save.error instanceof ApiError ? save.error.fields?.[k]?.[0] : undefined);

  return (
    <>
      <PageHeader title="Coupons" subtitle="Customers type these at the cart. Codes are public to anyone who inspects the site, so use them for campaigns, not secrets." />
      {canWrite && (
        <form className={`${card} mb-6`} onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <h2 className="font-display text-xl font-semibold">{f.editing ? `Edit ${f.code}` : "New coupon"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Code" error={fe("code")}><input className={input} value={f.code} disabled={f.editing} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} maxLength={30} placeholder="SUMMER20" required /></Field>
            <Field label="Type"><select className={input} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Coupon["kind"] })}>{Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label={f.kind === "percent" ? "Percent (1–100)" : "Amount (৳)"} error={fe("value")}><input className={input} inputMode="numeric" value={f.kind === "freeShip" ? "" : f.value} disabled={f.kind === "freeShip"} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
            <Field label="Minimum spend (৳)" error={fe("minSubtotal")}><input className={input} inputMode="numeric" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
            <Field label="Last day valid" hint="Empty = never expires"><input type="date" className={input} value={f.expires} onChange={(e) => setF({ ...f, expires: e.target.value })} /></Field>
            <Field label="Usage limit" hint="Empty = unlimited" error={fe("usageLimit")}><input className={input} inputMode="numeric" value={f.limit} onChange={(e) => setF({ ...f, limit: e.target.value })} /></Field>
            <label className="flex items-end gap-2 pb-2.5 text-sm font-medium"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />Active</label>
          </div>
          <ErrorLine error={save.error && !(save.error instanceof ApiError && save.error.fields) ? save.error : null} />
          <div className="mt-4 flex gap-2"><button type="submit" className={btnPrimary} disabled={save.isPending}>{f.editing ? "Save changes" : "Create coupon"}</button>{f.editing && <button type="button" className={btn} onClick={() => setF(blankCoupon)}>Cancel</button>}</div>
        </form>
      )}
      <section className={card}>
        <ErrorLine error={list.error ?? del.error ?? toggle.error} />
        {list.data?.length === 0 && <p className="text-sm text-muted-foreground">No coupons yet.</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="py-2 text-start">Code</th><th className="text-start">Offer</th><th className="text-end">Min spend</th><th className="text-start ps-4">Expires</th><th className="text-end">Used</th><th className="ps-4 text-start">Status</th><th /></tr></thead>
            <tbody className="divide-y divide-border">
              {list.data?.map((c) => {
                const expired = c.expiresAt && new Date(c.expiresAt) <= new Date();
                const spent = c.usageLimit != null && c.used >= c.usageLimit;
                return (
                  <tr key={c.code}>
                    <td className="py-3 font-medium tracking-wide">{c.code}</td><td>{describe(c)}</td><td className="text-end tabular-nums">{money(c.minSubtotal)}</td>
                    <td className="ps-4">{c.expiresAt ? fmtDate(c.expiresAt) : "Never"}</td><td className="text-end tabular-nums">{c.used}{c.usageLimit != null ? ` / ${c.usageLimit}` : ""}</td>
                    <td className="ps-4">{!c.active ? <Badge>Off</Badge> : expired ? <Badge tone="bad">Expired</Badge> : spent ? <Badge tone="bad">Used up</Badge> : <Badge tone="good">Live</Badge>}</td>
                    <td className="text-end">{canWrite && <span className="inline-flex gap-1.5"><button type="button" className={btn} onClick={() => edit(c)}>Edit</button><button type="button" className={btn} onClick={() => toggle.mutate(c)}>{c.active ? "Turn off" : "Turn on"}</button><button type="button" className={btnDanger} onClick={() => { if (confirm(`Delete coupon ${c.code}?`)) del.mutate(c.code); }}>Delete</button></span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ============================ Reviews ============================
export function ReviewsPage() {
  const qc = useQueryClient();
  const canWrite = useCan("Admin", "Manager");
  const [view, setView] = useState<"all" | "visible" | "hidden">("all");
  const [page, setPage] = useState(1);
  const hiddenFilter = view === "all" ? undefined : view === "hidden";
  const list = useAdminQuery(["reviews", view, page], () => adminApi.reviews(hiddenFilter, page));
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
  const hide = useMutation({ mutationFn: (v: { id: string; hidden: boolean }) => adminApi.hideReview(v.id, v.hidden), onSuccess: refresh });
  const del = useMutation({ mutationFn: (id: string) => adminApi.deleteReview(id), onSuccess: refresh });
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;
  return (
    <>
      <PageHeader title="Reviews" subtitle="Hide a review to take it off the site without losing it, or delete it for good."
        actions={<select className={`${input} w-auto`} value={view} onChange={(e) => { setView(e.target.value as typeof view); setPage(1); }} aria-label="Filter reviews"><option value="all">All reviews</option><option value="visible">Visible</option><option value="hidden">Hidden</option></select>} />
      <section className={card}>
        <ErrorLine error={list.error ?? hide.error ?? del.error} />
        {list.data?.items.length === 0 && <p className="text-sm text-muted-foreground">No reviews here.</p>}
        <ul className="divide-y divide-border">
          {list.data?.items.map((r) => (
            <li key={r.id} className={`py-4 ${r.hidden ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} <span className="ms-1">{r.title}</span></p>
                  <p className="mt-1 text-sm">{r.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.name} · on <Link href={`/shop/${r.slug}`} className="underline-offset-4 hover:underline">{r.slug}</Link> · {fmtDate(r.at)} {r.verified && <Badge tone="good">Verified purchase</Badge>} {r.hidden && <Badge>Hidden</Badge>}</p>
                </div>
                {canWrite && <span className="flex gap-2"><button type="button" className={btn} onClick={() => hide.mutate({ id: r.id, hidden: !r.hidden })}>{r.hidden ? "Show" : "Hide"}</button><button type="button" className={btnDanger} onClick={() => { if (confirm("Delete this review permanently?")) del.mutate(r.id); }}>Delete</button></span>}
              </div>
            </li>
          ))}
        </ul>
        <Pager page={page} pages={pages} onPage={setPage} />
      </section>
    </>
  );
}

// ============================ Settings ============================
export function SettingsPage() {
  const q = useAdminQuery(["settings"], () => adminApi.settings());
  if (q.isPending) return <div className="h-64" aria-hidden />;
  if (!q.data) return <ErrorLine error={q.error} />;
  return <SettingsForm initial={q.data} />;
}

function SettingsForm({ initial }: Readonly<{ initial: Settings }>) {
  const qc = useQueryClient();
  const isOwner = useCan("Admin");
  const [s, setS] = useState<Settings>(initial);
  const [saved, setSaved] = useState(false);
  const save = useMutation({ mutationFn: () => adminApi.saveSettings(s), onSuccess: (d) => { setS(d); setSaved(true); void qc.invalidateQueries({ queryKey: ["admin", "settings"] }); } });
  const num0 = (v: string) => (v === "" ? 0 : Number(v) || 0);
  const fe = (k: string) => (save.error instanceof ApiError ? save.error.fields?.[k]?.[0] : undefined);
  const upd = (patch: Partial<Settings>) => { setSaved(false); setS((x) => ({ ...x, ...patch })); };
  const districts = Object.keys(DISTRICT_LABEL).filter((d) => d !== "dhaka");

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="max-w-3xl">
      <PageHeader title="Settings" subtitle={isOwner ? "Changes apply to the shop within a minute." : "Only the owner can change these."}
        actions={isOwner && <button type="submit" className={btnPrimary} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save settings"}</button>} />
      <ErrorLine error={save.error && !(save.error instanceof ApiError && save.error.fields) ? save.error : null} />
      {saved && <p role="status" className="mb-4 text-sm font-medium text-primary">Saved.</p>}
      <fieldset disabled={!isOwner} className="space-y-5">
        <section className={card}>
          <h2 className="font-display text-xl font-semibold">Shipping</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Free shipping from (৳)" error={fe("freeShippingThreshold")}><input className={input} inputMode="numeric" value={s.freeShippingThreshold} onChange={(e) => upd({ freeShippingThreshold: num0(e.target.value) })} /></Field>
            <Field label="Dhaka city fee (৳)" error={fe("dhakaFees")}><input className={input} inputMode="numeric" value={s.dhakaInnerFee} onChange={(e) => upd({ dhakaInnerFee: num0(e.target.value) })} /></Field>
            <Field label="Dhaka outer areas fee (৳)"><input className={input} inputMode="numeric" value={s.dhakaOuterFee} onChange={(e) => upd({ dhakaOuterFee: num0(e.target.value) })} /></Field>
          </div>
          <h3 className="mt-5 text-sm font-medium">Other districts (৳)</h3>
          <div className="mt-2 grid gap-4 sm:grid-cols-4">
            {districts.map((d) => <Field key={d} label={DISTRICT_LABEL[d]}><input className={input} inputMode="numeric" value={s.districtFees[d] ?? 0} onChange={(e) => upd({ districtFees: { ...s.districtFees, [d]: num0(e.target.value) } })} /></Field>)}
          </div>
          {fe("districtFees") && <p role="alert" className="mt-2 text-xs font-medium text-accent">{fe("districtFees")}</p>}
        </section>
        <section className={card}>
          <h2 className="font-display text-xl font-semibold">Delivery slots</h2>
          <div className="mt-3 flex flex-wrap gap-5 text-sm">
            {Object.entries(SLOT_LABEL).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={s.slots.includes(k)} onChange={(e) => upd({ slots: e.target.checked ? [...s.slots, k] : s.slots.filter((x) => x !== k) })} />{v}</label>
            ))}
          </div>
          {fe("slots") && <p role="alert" className="mt-2 text-xs font-medium text-accent">{fe("slots")}</p>}
        </section>
        <section className={card}>
          <h2 className="font-display text-xl font-semibold">Stock</h2>
          <Field label="Warn when a plant has this many left or fewer" className="mt-3 max-w-xs" error={fe("lowStockAt")}><input className={input} inputMode="numeric" value={s.lowStockAt} onChange={(e) => upd({ lowStockAt: num0(e.target.value) })} /></Field>
        </section>
        <section className={card}>
          <h2 className="font-display text-xl font-semibold">Shop info</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Shop name" error={fe("shopName")}><input className={input} value={s.shopName} onChange={(e) => upd({ shopName: e.target.value })} /></Field>
            <Field label="Phone"><input className={input} value={s.phone} onChange={(e) => upd({ phone: e.target.value })} /></Field>
            <Field label="Email" error={fe("email")}><input className={input} value={s.email} onChange={(e) => upd({ email: e.target.value })} /></Field>
            <Field label="Address"><input className={input} value={s.address} onChange={(e) => upd({ address: e.target.value })} /></Field>
          </div>
        </section>
      </fieldset>
    </form>
  );
}

// ============================ Staff & roles ============================
const STAFF_ROLES: Role[] = ["Admin", "Manager", "Viewer", "Delivery"];
const ROLE_HELP: Record<string, string> = {
  Admin: "Everything, including settings, staff and the audit log.",
  Manager: "Products, orders (cancel/refund), coupons, reviews. Not settings or staff.",
  Viewer: "Can look at everything except staff and the audit log. Changes nothing.",
  Delivery: "Sees orders and deliveries, moves orders forward, marks cash paid, adds notes.",
};

export function StaffPage() {
  const qc = useQueryClient();
  const list = useAdminQuery(["staff"], () => adminApi.staff());
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Manager");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "staff"] });
  const add = useMutation({ mutationFn: (v: { email: string; role: Role }) => adminApi.setStaff(v.email, v.role), onSuccess: () => { setEmail(""); return refresh(); } });
  const remove = useMutation({ mutationFn: (id: string) => adminApi.removeStaff(id), onSuccess: refresh });
  return (
    <>
      <PageHeader title="Staff & roles" subtitle="Give someone access by their account email. They must register on the site first: you never handle their password." />
      <form className={`${card} mb-6`} onSubmit={(e) => { e.preventDefault(); add.mutate({ email, role }); }}>
        <div className="grid gap-4 sm:grid-cols-[1fr_14rem_auto]">
          <Field label="Account email"><input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field label="Role"><select className={input} value={role} onChange={(e) => setRole(e.target.value as Role)}>{STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></Field>
          <div className="flex items-end"><button type="submit" className={btnPrimary} disabled={add.isPending}>Give access</button></div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{ROLE_HELP[role]}</p>
        <ErrorLine error={add.error} />
      </form>
      <section className={card}>
        <ErrorLine error={list.error ?? remove.error} />
        <ul className="divide-y divide-border text-sm">
          {list.data?.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span><span className="font-medium">{m.name || m.email}</span><span className="ms-2 text-muted-foreground">{m.email}</span></span>
              <span className="flex items-center gap-2">
                <select className={`${input} w-auto`} value={m.role} aria-label={`Role for ${m.email}`} onChange={(e) => add.mutate({ email: m.email, role: e.target.value as Role })}>{STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
                <button type="button" className={btnDanger} onClick={() => { if (confirm(`Remove ${m.email}'s staff access? Their customer account stays.`)) remove.mutate(m.id); }}>Remove</button>
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-6 grid gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:grid-cols-2">{STAFF_ROLES.map((r) => <div key={r}><dt className="font-medium text-foreground">{ROLE_LABEL[r]}</dt><dd>{ROLE_HELP[r]}</dd></div>)}</dl>
      </section>
    </>
  );
}

// ============================ Audit log ============================
const ENTITIES = ["product", "order", "coupon", "settings", "review", "customer", "staff", "image"];
export function AuditPage() {
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);
  const list = useAdminQuery(["audit", entity, page], () => adminApi.audit(entity, page));
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;
  return (
    <>
      <PageHeader title="Audit log" subtitle="Who changed what, newest first."
        actions={<select className={`${input} w-auto`} value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} aria-label="Filter by area"><option value="">Everything</option>{ENTITIES.map((x) => <option key={x} value={x}>{x}</option>)}</select>} />
      <section className={card}>
        <ErrorLine error={list.error} />
        {list.data?.items.length === 0 && <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="py-2 text-start">When</th><th className="text-start">Who</th><th className="text-start">Action</th><th className="text-start">Target</th><th className="text-start">Details</th></tr></thead>
            <tbody className="divide-y divide-border align-top">
              {list.data?.items.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap py-2.5 pe-3 text-muted-foreground">{fmtDateTime(a.at)}</td><td className="pe-3">{a.actor || "—"}</td><td className="pe-3"><Badge>{a.action}</Badge></td>
                  <td className="pe-3">{a.entity}{a.entityId ? <span className="text-muted-foreground"> · {a.entityId.length > 14 ? `${a.entityId.slice(0, 8)}…` : a.entityId}</span> : null}</td><td className="text-muted-foreground">{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={page} pages={pages} onPage={setPage} />
      </section>
    </>
  );
}

// ============================ My account: change password ============================
export function AccountPage() {
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [done, setDone] = useState(false);
  const change = useMutation({ mutationFn: () => adminApi.changePassword(f.current, f.next), onSuccess: () => { setDone(true); setF({ current: "", next: "", again: "" }); } });
  const mismatch = f.again !== "" && f.next !== f.again;
  const code = change.error instanceof ApiError ? change.error.code : undefined;
  return (
    <>
      <PageHeader title="My account" subtitle="Change your own password." />
      <form className={`${card} max-w-md space-y-4`} onSubmit={(e) => { e.preventDefault(); setDone(false); change.mutate(); }}>
        <Field label="Current password" error={code === "INVALID_CREDENTIALS" ? "That isn't your current password." : undefined}><input type="password" autoComplete="current-password" className={input} value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} required /></Field>
        <Field label="New password" hint="At least 8 characters."><input type="password" autoComplete="new-password" className={input} value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} minLength={8} required /></Field>
        <Field label="New password again" error={mismatch ? "The two passwords don't match." : undefined}><input type="password" autoComplete="new-password" className={input} value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} required /></Field>
        {change.isError && code !== "INVALID_CREDENTIALS" && <ErrorLine error={change.error} />}
        {done && <p role="status" className="text-sm font-medium text-primary">Password changed.</p>}
        <button type="submit" className={btnPrimary} disabled={change.isPending || mismatch || f.next.length < 8}>Change password</button>
      </form>
    </>
  );
}
