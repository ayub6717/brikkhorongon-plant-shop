"use client";

import { Bell, MapPin, Package, UserRound, LayoutDashboard } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { NotificationList } from "@/components/layout/NotificationList";
import { Link } from "@/i18n/navigation";
import { usingServer } from "@/lib/api";
import { useNotifications } from "@/lib/api/notifications";
import { useOrdersQuery, useSessionQuery } from "@/lib/api/queries";
import { AddressesTab } from "./AddressesTab";
import { OrdersTab } from "./OrdersTab";
import { OverviewTab } from "./OverviewTab";
import { ProfileTab } from "./ProfileTab";
import { card } from "./shared";

const TABS = [
  { id: "overview", icon: LayoutDashboard },
  { id: "orders", icon: Package },
  { id: "addresses", icon: MapPin },
  { id: "notifications", icon: Bell },
  { id: "profile", icon: UserRound },
] as const;
type TabId = (typeof TABS)[number]["id"];

/** The customer's own dashboard: overview, orders, addresses, notifications and profile. */
export function AccountView() {
  const t = useTranslations("Account");
  const td = useTranslations("Dashboard");
  const locale = useLocale();
  const params = useSearchParams();
  const { data: user, isPending } = useSessionQuery();
  const { data: orders = [] } = useOrdersQuery();
  const { data: notes } = useNotifications(usingServer && Boolean(user));

  if (isPending) return <div className="h-64" aria-hidden />;
  if (!user) {
    return (
      <div className="mx-auto max-w-lg rounded-card border border-dashed border-border bg-surface/60 p-12 text-center">
        <h2 className="font-display text-2xl font-semibold">{t("signedOutTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{t("signedOutBody")}</p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/login" className="rounded-full bg-primary px-7 py-3 font-medium text-primary-foreground">{t("loginBtn")}</Link>
          <Link href="/register" className="rounded-full border border-border px-7 py-3 font-medium hover:bg-muted">{t("registerBtn")}</Link>
        </div>
      </div>
    );
  }

  // Server orders are already this customer's; in the browser demo we match by email.
  const mine = usingServer ? orders : orders.filter((o) => o.customer.email.toLowerCase() === user.email.toLowerCase());
  const tabs = TABS.filter((x) => usingServer || x.id !== "notifications");
  const asked = params.get("tab");
  const tab: TabId = tabs.some((x) => x.id === asked) ? (asked as TabId) : "overview";
  const unread = notes?.unread ?? 0;
  const since = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { month: "long", year: "numeric" }).format(new Date(user.createdAt));
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr] lg:gap-8">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className={`${card} flex items-center gap-3 !p-4`}>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary" aria-hidden>{initials || "?"}</span>
          <div className="min-w-0">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">{td("memberSince", { date: since })}</p>
          </div>
        </div>
        <nav aria-label={td("menu")} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
          {tabs.map(({ id, icon: Icon }) => (
            <Link
              key={id}
              href={id === "overview" ? "/account" : `/account?tab=${id}`}
              aria-current={tab === id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium transition lg:rounded-xl ${tab === id ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted"}`}
            >
              <Icon className="size-4" aria-hidden />
              {td(`tabs.${id}`)}
              {id === "notifications" && unread > 0 && <span className="ms-auto rounded-full bg-accent px-1.5 text-[10px] leading-4 text-white">{unread}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        {tab === "overview" && <OverviewTab orders={mine} name={user.name} />}
        {tab === "orders" && <OrdersTab orders={mine} />}
        {tab === "addresses" && <AddressesTab user={user} />}
        {tab === "notifications" && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-semibold">{td("tabs.notifications")}</h2>
            <section className={`${card} px-0 sm:px-0`}><NotificationList items={notes?.items ?? []} unread={unread} /></section>
          </div>
        )}
        {tab === "profile" && <ProfileTab user={user} />}
      </div>
    </div>
  );
}
