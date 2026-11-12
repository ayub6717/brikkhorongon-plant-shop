import { CheckCircle2, ClipboardCheck, MapPin, Package, Truck, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ORDER_STEPS, stepIndex, type Order, type OrderStep } from "@/store/orders";

const ICONS: Record<OrderStep, LucideIcon> = {
  ordered: ClipboardCheck,
  packed: Package,
  shipped: Truck,
  outForDelivery: MapPin,
  delivered: CheckCircle2,
};

export function Timeline({ order }: { order: Order }) {
  const t = useTranslations("Track");
  const locale = useLocale();
  const currentIndex = stepIndex(order.status);
  const fmt = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium", timeStyle: "short" });

  if (order.status === "cancelled") {
    return (
      <div role="status" className="rounded-card border border-accent/40 bg-accent/10 p-5">
        <p className="font-medium text-accent">{t("steps.cancelled")}</p>
        {order.cancelReason && <p className="mt-1 text-sm text-muted-foreground">{order.cancelReason}</p>}
      </div>
    );
  }

  return (
    <ol aria-label={t("timelineLabel")} className="relative">
      {ORDER_STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const at = order.history.find((h) => h.status === step)?.at;
        const Icon = ICONS[step];
        return (
          <li key={step} aria-current={current ? "step" : undefined} className="relative flex gap-4 pb-8 last:pb-0">
            {i < ORDER_STEPS.length - 1 && (
              <span aria-hidden className={cn("absolute left-5 top-10 -ml-px h-[calc(100%-2.5rem)] w-0.5", done ? "bg-primary" : "bg-border")} />
            )}
            <span
              className={cn(
                "relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 transition",
                done && "border-primary bg-primary text-primary-foreground",
                current && "border-primary bg-background text-primary ring-4 ring-primary/15",
                !done && !current && "border-border bg-background text-muted-foreground",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <div className="pt-1.5">
              <p className={cn("font-medium", !done && !current && "text-muted-foreground")}>
                {t(`steps.${step}`)}
                {current && <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{t("now")}</span>}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{at ? fmt.format(new Date(at)) : t(`stepHints.${step}`)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
