"use client";

import { FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAdvanceOrder, useResolveRequest } from "@/lib/api/queries";
import { ORDER_STEPS, type Order } from "@/store/orders";
import { useRequestDescriber } from "./ModifyRequests";

/** Stands in for the shop team until a real API exists. Remove when the backend lands. */
export function DemoControls({ order }: { order: Order }) {
  const t = useTranslations("Track");
  const advance = useAdvanceOrder();
  const resolve = useResolveRequest();
  const describe = useRequestDescriber();
  const last = order.status === ORDER_STEPS[ORDER_STEPS.length - 1];
  const pending = order.requests.filter((r) => r.status === "pending");

  return (
    <aside className="rounded-card border border-dashed border-border p-5 text-sm">
      <p className="flex items-center gap-2 font-medium"><FlaskConical className="size-4 text-accent" aria-hidden />{t("demoTitle")}</p>
      <p className="mt-1 text-muted-foreground">{t("demoBody")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={last || advance.isPending} onClick={() => advance.mutate(order.id)} className="rounded-full border border-border px-4 py-2 font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
          {last ? t("demoDone") : t("demoAdvance")}
        </button>
      </div>
      {pending.length > 0 && (
        <ul className="mt-4 space-y-2">
          {pending.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 p-3">
              <span className="min-w-0 flex-1 truncate">{describe(r)}</span>
              <span className="flex gap-2">
                <button type="button" onClick={() => resolve.mutate({ orderId: order.id, requestId: r.id, status: "approved" })} className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">{t("demoApprove")}</button>
                <button type="button" onClick={() => resolve.mutate({ orderId: order.id, requestId: r.id, status: "declined" })} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-background">{t("demoDecline")}</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
