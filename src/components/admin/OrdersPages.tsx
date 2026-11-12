"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Printer } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { adminApi, type OrderDetail, type OrdersFilter } from "@/lib/api/admin";
import { downloadText, toCsv } from "@/lib/csv";
import type { Order } from "@/store/orders";
import {
  Badge, DISTRICT_LABEL, ErrorLine, Field, PAYMENT_LABEL, PageHeader, Pager, PaymentBadge, SLOT_LABEL, STATUS_LABEL, StatusBadge,
  btn, btnDanger, btnPrimary, card, fmtDate, fmtDateTime, input, money, num, todayKey, useAdminQuery, useCan, Notice,
} from "./ui";

const STATUSES = ["ordered", "packed", "shipped", "outForDelivery", "delivered", "cancelled"];
const NEXT: Record<string, string> = { ordered: "Mark packed", packed: "Mark shipped", shipped: "Out for delivery", outForDelivery: "Mark delivered" };

/** Runs one action on an order, puts the fresh order into the cache and refreshes the lists. */
function useOrderAction<V>(id: string, fn: (v: V) => Promise<OrderDetail>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (d) => {
      qc.setQueryData(["admin", "order", id], d);
      void qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      void qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

function AdvanceButton({ order }: Readonly<{ order: Order }>) {
  const can = useCan("Admin", "Manager", "Delivery");
  const advance = useOrderAction(order.id, () => adminApi.advance(order.id));
  if (!can || !NEXT[order.status]) return null;
  return <button type="button" className={btn} disabled={advance.isPending} onClick={() => advance.mutate(undefined)}>{NEXT[order.status]}</button>;
}

// ============================ Orders list ============================
export function OrdersPage() {
  const initialStatus = useSearchParams().get("status") ?? undefined;
  const [f, setF] = useState<OrdersFilter>({ page: 1, status: initialStatus });
  const [exporting, setExporting] = useState(false);
  const set = (patch: Partial<OrdersFilter>) => setF((s) => ({ ...s, ...patch, page: 1 }));
  const orders = useAdminQuery(["orders", f], () => adminApi.orders(f));
  const pages = orders.data ? Math.max(1, Math.ceil(orders.data.total / orders.data.pageSize)) : 1;

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all: Order[] = [];
      for (let page = 1; page <= 25; page++) {
        const res = await adminApi.orders({ ...f, page, pageSize: 200 });
        all.push(...res.items);
        if (all.length >= res.total) break;
      }
      downloadText(`orders-${todayKey()}.csv`, toCsv([
        ["Order", "Placed", "Status", "Payment status", "Payment method", "Customer", "Phone", "Email", "District", "Area", "Address", "Delivery date", "Slot",
          "Items", "Subtotal", "Discount", "Coupon", "Shipping", "Total"],
        ...all.map((o) => [o.id, o.createdAt, o.status, o.paymentStatus ?? "unpaid", o.payment, o.customer.name, o.customer.phone, o.customer.email, o.customer.district,
          o.customer.area, o.customer.address, o.delivery.date, o.delivery.slot, o.lines.map((l) => `${l.name} x${l.qty}`).join("; "), o.subtotal, o.discount ?? 0, o.coupon ?? "", o.shipping, o.total]),
      ]));
    } finally { setExporting(false); }
  };

  return (
    <>
      <PageHeader title="Orders" subtitle={orders.data ? `${num(orders.data.total)} matching` : undefined}
        actions={<button type="button" className={btn} onClick={exportCsv} disabled={exporting}><Download className="size-4" aria-hidden />{exporting ? "Preparing…" : "Export CSV"}</button>} />
      <section className={card}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Search"><input className={input} placeholder="Order no., name or phone" value={f.q ?? ""} onChange={(e) => set({ q: e.target.value })} /></Field>
          <Field label="Status">
            <select className={input} value={f.status ?? ""} onChange={(e) => set({ status: e.target.value })}>
              <option value="">All</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </Field>
          <Field label="Payment">
            <select className={input} value={f.paymentStatus ?? ""} onChange={(e) => set({ paymentStatus: e.target.value })}>
              <option value="">All</option><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="refunded">Refunded</option>
            </select>
          </Field>
          <Field label="Payment method">
            <select className={input} value={f.payment ?? ""} onChange={(e) => set({ payment: e.target.value })}>
              <option value="">All</option>{Object.entries(PAYMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="District">
            <select className={input} value={f.district ?? ""} onChange={(e) => set({ district: e.target.value })}>
              <option value="">All</option>{Object.entries(DISTRICT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Placed from"><input type="date" className={input} value={f.from ?? ""} onChange={(e) => set({ from: e.target.value })} /></Field>
          <Field label="Placed to"><input type="date" className={input} value={f.to ?? ""} onChange={(e) => set({ to: e.target.value })} /></Field>
          <Field label="Delivery date"><input type="date" className={input} value={f.deliveryDate ?? ""} onChange={(e) => set({ deliveryDate: e.target.value })} /></Field>
        </div>
        <ErrorLine error={orders.error} />
        {orders.data?.items.length === 0 && <p className="mt-6 text-sm text-muted-foreground">No orders match.</p>}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[56rem] text-start text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr className="text-start"><th className="py-2 pe-3 text-start">Order</th><th className="pe-3 text-start">Customer</th><th className="pe-3 text-start">Delivery</th><th className="pe-3 text-end">Total</th><th className="pe-3 text-start">Payment</th><th className="pe-3 text-start">Status</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.data?.items.map((o) => (
                <tr key={o.id}>
                  <td className="py-3 pe-3"><Link href={`/admin/orders/${o.id}`} className="font-medium tracking-wide underline-offset-4 hover:underline">{o.id}</Link><div className="text-xs text-muted-foreground">{fmtDateTime(o.createdAt)}</div></td>
                  <td className="pe-3">{o.customer.name}<div className="text-xs text-muted-foreground">{o.customer.phone}</div></td>
                  <td className="pe-3">{o.delivery.date}<div className="text-xs text-muted-foreground">{SLOT_LABEL[o.delivery.slot] ?? o.delivery.slot} · {DISTRICT_LABEL[o.customer.district] ?? o.customer.district}</div></td>
                  <td className="pe-3 text-end tabular-nums">{money(o.total)}</td>
                  <td className="pe-3"><PaymentBadge status={o.paymentStatus} /><div className="mt-0.5 text-xs text-muted-foreground">{PAYMENT_LABEL[o.payment] ?? o.payment}</div></td>
                  <td className="pe-3"><StatusBadge status={o.status} />{o.requests.some((r) => r.status === "pending") && <div className="mt-1"><Badge tone="warn">Change request</Badge></div>}</td>
                  <td className="text-end"><AdvanceInline order={o} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={f.page ?? 1} pages={pages} onPage={(p) => setF((s) => ({ ...s, page: p }))} />
      </section>
    </>
  );
}

function AdvanceInline({ order }: Readonly<{ order: Order }>) {
  return <AdvanceButton order={order} />;
}

// ============================ One order ============================
export function OrderDetailPage({ id }: Readonly<{ id: string }>) {
  const q = useAdminQuery(["order", id], () => adminApi.order(id));
  const canManage = useCan("Admin", "Manager");
  const canFulfil = useCan("Admin", "Manager", "Delivery");
  const [reason, setReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [note, setNote] = useState("");

  const cancel = useOrderAction(id, (r: string) => adminApi.cancel(id, r));
  const refund = useOrderAction(id, () => adminApi.refund(id));
  const pay = useOrderAction(id, (s: "paid" | "unpaid") => adminApi.setPayment(id, s));
  const addNote = useOrderAction(id, (t: string) => adminApi.addNote(id, t));
  const resolve = useOrderAction(id, (v: { requestId: string; status: "approved" | "declined" }) => adminApi.resolveRequest(id, v.requestId, v.status));

  if (q.isPending) return <div className="h-64" aria-hidden />;
  if (q.isError || !q.data) return <Notice title="Order not found" body="It may have been removed, or the link is wrong."><Link href="/admin/orders" className={`${btn} mt-6`}>Back to orders</Link></Notice>;
  const { order: o, notes, customerOrders, customerSpent } = q.data;
  const cancellable = o.status === "ordered" || o.status === "packed";
  const refundable = o.paymentStatus === "paid" && (o.status === "cancelled" || o.status === "delivered");
  const err = cancel.error ?? refund.error ?? pay.error ?? addNote.error ?? resolve.error;

  return (
    <>
      <PageHeader
        title={o.id}
        subtitle={`Placed ${fmtDateTime(o.createdAt)}`}
        actions={
          <>
            <Link href="/admin/orders" className={btn}>← Orders</Link>
            <Link href={`/admin/orders/${o.id}/print?type=invoice`} className={btn}><Printer className="size-4" aria-hidden />Invoice</Link>
            <Link href={`/admin/orders/${o.id}/print?type=slip`} className={btn}><Printer className="size-4" aria-hidden />Packing slip</Link>
          </>
        }
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusBadge status={o.status} /><PaymentBadge status={o.paymentStatus} /><Badge>{PAYMENT_LABEL[o.payment] ?? o.payment}</Badge>
        <span className="ms-auto flex flex-wrap gap-2">
          <AdvanceButton order={o} />
          {canFulfil && o.paymentStatus !== "refunded" && o.status !== "cancelled" && (
            <button type="button" className={btn} disabled={pay.isPending} onClick={() => pay.mutate(o.paymentStatus === "paid" ? "unpaid" : "paid")}>{o.paymentStatus === "paid" ? "Mark unpaid" : "Mark paid"}</button>
          )}
          {canManage && refundable && <button type="button" className={btn} disabled={refund.isPending} onClick={() => { if (confirm(`Record a refund of ${money(o.total)}? (The money itself is sent outside this system.)`)) refund.mutate(undefined); }}>Record refund</button>}
          {canManage && cancellable && <button type="button" className={btnDanger} onClick={() => setShowCancel((v) => !v)}>Cancel order</button>}
        </span>
      </div>
      {showCancel && (
        <div className={`${card} mb-5`}>
          <Field label="Reason (optional)" hint="Customers see this on the tracking page. Plants go back into stock."><input className={input} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          <div className="mt-3 flex gap-2">
            <button type="button" className={btnDanger} disabled={cancel.isPending} onClick={() => cancel.mutate(reason, { onSuccess: () => setShowCancel(false) })}>Confirm cancel</button>
            <button type="button" className={btn} onClick={() => setShowCancel(false)}>Keep order</button>
          </div>
        </div>
      )}
      <ErrorLine error={err} />
      {o.status === "cancelled" && o.cancelReason && <p className="mb-4 text-sm text-muted-foreground">Cancelled: {o.cancelReason}</p>}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <section className={card}>
            <h2 className="font-display text-xl font-semibold">Items</h2>
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-border">
                {o.lines.map((l) => (
                  <tr key={l.slug}><td className="py-2.5 pe-3">{l.name}<div className="text-xs text-muted-foreground">{money(l.price)} each</div></td><td className="px-3 text-end tabular-nums">× {l.qty}</td><td className="ps-3 text-end tabular-nums">{money(l.price * l.qty)}</td></tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{money(o.subtotal)}</dd></div>
              {o.coupon && <div className="flex justify-between"><dt>Coupon {o.coupon}</dt><dd className="tabular-nums">−{money(o.discount ?? 0)}</dd></div>}
              <div className="flex justify-between"><dt>Shipping</dt><dd className="tabular-nums">{money(o.shipping)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(o.total)}</dd></div>
            </dl>
          </section>

          {o.requests.length > 0 && (
            <section className={card}>
              <h2 className="font-display text-xl font-semibold">Change requests</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {o.requests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 p-3">
                    <span><span className="font-medium capitalize">{r.type}</span>{r.value ? `: ${r.value}` : ""}{r.detail ? ` — ${r.detail}` : ""}<span className="ms-2 text-xs text-muted-foreground">{fmtDateTime(r.at)}</span></span>
                    {r.status === "pending" && canManage ? (
                      <span className="flex gap-2">
                        <button type="button" className={btnPrimary} disabled={resolve.isPending} onClick={() => resolve.mutate({ requestId: r.id, status: "approved" })}>Approve</button>
                        <button type="button" className={btn} disabled={resolve.isPending} onClick={() => resolve.mutate({ requestId: r.id, status: "declined" })}>Decline</button>
                      </span>
                    ) : <Badge tone={r.status === "approved" ? "good" : r.status === "declined" ? "bad" : "warn"}>{r.status}</Badge>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={card}>
            <h2 className="font-display text-xl font-semibold">Internal notes</h2>
            <p className="text-xs text-muted-foreground">Only the shop team sees these.</p>
            {canFulfil && (
              <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (note.trim()) addNote.mutate(note.trim(), { onSuccess: () => setNote("") }); }}>
                <input className={input} placeholder="Add a note…" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} aria-label="New note" />
                <button type="submit" className={btnPrimary} disabled={addNote.isPending || !note.trim()}>Add</button>
              </form>
            )}
            <ul className="mt-4 space-y-3 text-sm">
              {notes.length === 0 && <li className="text-muted-foreground">No notes yet.</li>}
              {notes.map((n) => <li key={n.id}><p>{n.text}</p><p className="text-xs text-muted-foreground">{n.author} · {fmtDateTime(n.at)}</p></li>)}
            </ul>
          </section>
        </div>

        <div className="space-y-5">
          <section className={card}>
            <h2 className="font-display text-xl font-semibold">Customer</h2>
            <p className="mt-2 font-medium">{o.customer.name}</p>
            <p className="text-sm"><a className="underline-offset-4 hover:underline" href={`tel:${o.customer.phone}`}>{o.customer.phone}</a></p>
            {o.customer.email && <p className="text-sm text-muted-foreground">{o.customer.email}</p>}
            <p className="mt-3 text-sm">{o.customer.address}, {o.customer.area}, {DISTRICT_LABEL[o.customer.district] ?? o.customer.district}</p>
            <p className="mt-3 text-xs text-muted-foreground">{num(customerOrders)} order{customerOrders === 1 ? "" : "s"} · {money(customerSpent)} spent in total</p>
          </section>
          <section className={card}>
            <h2 className="font-display text-xl font-semibold">Delivery</h2>
            <p className="mt-2 text-sm">{o.delivery.date} · {SLOT_LABEL[o.delivery.slot] ?? o.delivery.slot}</p>
            {o.giftCard && o.giftCard !== "none" && <p className="mt-2 text-sm">Gift card: {o.giftCard}</p>}
            {o.giftNote && <p className="mt-1 text-sm italic">“{o.giftNote}”</p>}
            {o.note && <p className="mt-3 text-sm"><span className="text-muted-foreground">Customer note:</span> {o.note}</p>}
          </section>
          <section className={card}>
            <h2 className="font-display text-xl font-semibold">Timeline</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {o.history.map((h, i) => <li key={`${h.status}-${i}`} className="flex justify-between gap-3"><span>{STATUS_LABEL[h.status] ?? h.status}</span><span className="text-muted-foreground">{fmtDateTime(h.at)}</span></li>)}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}

// ============================ Print: invoice / packing slip ============================
export function PrintOrderPage({ id }: Readonly<{ id: string }>) {
  const type = useSearchParams().get("type") === "slip" ? "slip" : "invoice";
  const q = useAdminQuery(["order", id], () => adminApi.order(id));
  if (q.isPending) return <div className="h-64" aria-hidden />;
  if (!q.data) return <Notice title="Order not found" />;
  const o = q.data.order;
  const isSlip = type === "slip";

  return (
    <div>
      <div className="mb-4 flex gap-2 print:hidden">
        <Link href={`/admin/orders/${o.id}`} className={btn}>← Back</Link>
        <button type="button" className={btnPrimary} onClick={() => window.print()}><Printer className="size-4" aria-hidden />Print</button>
      </div>
      <article className="print-area mx-auto max-w-3xl rounded-card border border-border bg-white p-8 text-black print:border-0 print:p-0">
        <header className="flex items-start justify-between border-b border-neutral-300 pb-4">
          <div><p className="font-display text-2xl font-semibold">Brikkhorongon · বৃক্ষরঙ্গন</p><p className="text-sm text-neutral-600">{isSlip ? "Packing slip" : "Invoice"}</p></div>
          <div className="text-end text-sm"><p className="font-semibold tracking-wide">{o.id}</p><p className="text-neutral-600">{fmtDate(o.createdAt)}</p></div>
        </header>
        <div className="mt-5 grid gap-6 text-sm sm:grid-cols-2">
          <div><p className="font-semibold">Deliver to</p><p>{o.customer.name}</p><p>{o.customer.phone}</p><p>{o.customer.address}, {o.customer.area}</p><p>{DISTRICT_LABEL[o.customer.district] ?? o.customer.district}</p></div>
          <div><p className="font-semibold">Delivery</p><p>{o.delivery.date} · {SLOT_LABEL[o.delivery.slot] ?? o.delivery.slot}</p>{!isSlip && <p>Payment: {PAYMENT_LABEL[o.payment] ?? o.payment} ({o.paymentStatus ?? "unpaid"})</p>}
            {o.giftNote && <p className="mt-1 italic">Gift note: “{o.giftNote}”</p>}{o.note && <p className="mt-1">Note: {o.note}</p>}</div>
        </div>
        <table className="mt-6 w-full text-sm">
          <thead><tr className="border-b border-neutral-300 text-start"><th className="py-2 text-start">Item</th><th className="text-end">Qty</th>{!isSlip && <><th className="text-end">Price</th><th className="text-end">Amount</th></>}{isSlip && <th className="w-16 text-end">Packed</th>}</tr></thead>
          <tbody>
            {o.lines.map((l) => (
              <tr key={l.slug} className="border-b border-neutral-200"><td className="py-2">{l.name}</td><td className="text-end">{l.qty}</td>
                {!isSlip && <><td className="text-end">{money(l.price)}</td><td className="text-end">{money(l.price * l.qty)}</td></>}{isSlip && <td className="text-end">☐</td>}</tr>
            ))}
          </tbody>
        </table>
        {!isSlip ? (
          <dl className="ms-auto mt-4 w-64 space-y-1 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
            {o.coupon && <div className="flex justify-between"><dt>Coupon {o.coupon}</dt><dd>−{money(o.discount ?? 0)}</dd></div>}
            <div className="flex justify-between"><dt>Shipping</dt><dd>{money(o.shipping)}</dd></div>
            <div className="flex justify-between border-t border-neutral-300 pt-1 text-base font-semibold"><dt>Total</dt><dd>{money(o.total)}</dd></div>
          </dl>
        ) : o.payment === "cod" && o.paymentStatus !== "paid" ? <p className="mt-6 rounded border-2 border-black p-3 text-center text-lg font-semibold">Collect cash: {money(o.total)}</p> : null}
        <p className="mt-8 text-center text-xs text-neutral-500">Thank you for choosing Brikkhorongon.</p>
      </article>
    </div>
  );
}

// ============================ Daily delivery list ============================
export function DeliveriesPage() {
  const [date, setDate] = useState(todayKey());
  const q = useAdminQuery(["deliveries", date], () => adminApi.orders({ deliveryDate: date, pageSize: 200 }));
  const rows = (q.data?.items ?? []).filter((o) => o.status !== "cancelled");
  const open = rows.filter((o) => o.status !== "delivered");
  const cash = open.filter((o) => o.payment === "cod" && o.paymentStatus !== "paid").reduce((n, o) => n + o.total, 0);
  const slots = ["morning", "afternoon", "evening"].map((s) => ({ slot: s, items: rows.filter((o) => o.delivery.slot === s) })).filter((g) => g.items.length > 0);

  const exportCsv = () => downloadText(`deliveries-${date}.csv`, toCsv([
    ["Slot", "Order", "Customer", "Phone", "Address", "Area", "District", "Items", "Status", "Cash to collect"],
    ...rows.map((o) => [SLOT_LABEL[o.delivery.slot] ?? o.delivery.slot, o.id, o.customer.name, o.customer.phone, o.customer.address, o.customer.area, o.customer.district,
      o.lines.map((l) => `${l.name} x${l.qty}`).join("; "), o.status, o.payment === "cod" && o.paymentStatus !== "paid" ? o.total : 0]),
  ]));

  return (
    <div className="print-area">
      <PageHeader title="Deliveries" subtitle="Everything going out on one day, by time slot."
        actions={<>
          <input type="date" className={`${input} w-auto`} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Delivery date" />
          <button type="button" className={btn} onClick={exportCsv} disabled={rows.length === 0}><Download className="size-4" aria-hidden />CSV</button>
          <button type="button" className={btn} onClick={() => window.print()}><Printer className="size-4" aria-hidden />Print</button>
        </>} />
      <h2 className="mb-3 hidden font-display text-xl font-semibold print:block">Deliveries for {date}</h2>
      <p className="mb-5 text-sm text-muted-foreground">{num(rows.length)} order{rows.length === 1 ? "" : "s"} · {num(open.length)} still to deliver · cash to collect: <strong className="text-foreground">{money(cash)}</strong></p>
      <ErrorLine error={q.error} />
      {q.data && rows.length === 0 && <p className="text-sm text-muted-foreground">Nothing is scheduled for this day.</p>}
      <div className="space-y-5">
        {slots.map((g) => (
          <section key={g.slot} className={card}>
            <h3 className="font-display text-lg font-semibold">{SLOT_LABEL[g.slot]} <span className="text-sm font-normal text-muted-foreground">({g.items.length})</span></h3>
            <ul className="mt-3 divide-y divide-border">
              {g.items.map((o) => (
                <li key={o.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p><Link href={`/admin/orders/${o.id}`} className="font-medium tracking-wide underline-offset-4 hover:underline">{o.id}</Link> <StatusBadge status={o.status} /></p>
                    <p>{o.customer.name} · <a href={`tel:${o.customer.phone}`} className="underline-offset-4 hover:underline">{o.customer.phone}</a></p>
                    <p className="text-muted-foreground">{o.customer.address}, {o.customer.area}, {DISTRICT_LABEL[o.customer.district] ?? o.customer.district}</p>
                    <p className="text-muted-foreground">{o.lines.map((l) => `${l.name} ×${l.qty}`).join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-3 print:hidden">
                    {o.payment === "cod" && o.paymentStatus !== "paid" && <Badge tone="warn">Collect {money(o.total)}</Badge>}
                    <AdvanceButton order={o} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
