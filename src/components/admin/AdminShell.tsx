"use client";

import { BarChart3, Boxes, ClipboardList, KeyRound, LayoutDashboard, ScrollText, Settings, ShieldCheck, Star, Tag, Truck, Users, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { useSignOut } from "@/lib/api/queries";
import { Link, usePathname } from "@/i18n/navigation";
import { usingServer } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Notice, ROLE_LABEL, btnPrimary, useRoles } from "./ui";

type NavItem = { href: string; label: string; icon: LucideIcon; roles: string[] };
const STAFF = ["Admin", "Manager", "Viewer", "Delivery"];
const READ = ["Admin", "Manager", "Viewer"];
const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: READ },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, roles: STAFF },
  { href: "/admin/deliveries", label: "Deliveries", icon: Truck, roles: STAFF },
  { href: "/admin/products", label: "Products", icon: Boxes, roles: READ },
  { href: "/admin/customers", label: "Customers", icon: Users, roles: READ },
  { href: "/admin/coupons", label: "Coupons", icon: Tag, roles: READ },
  { href: "/admin/reviews", label: "Reviews", icon: Star, roles: READ },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, roles: READ },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: READ },
  { href: "/admin/staff", label: "Staff & roles", icon: ShieldCheck, roles: ["Admin"] },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText, roles: ["Admin"] },
  { href: "/admin/account", label: "My account", icon: KeyRound, roles: STAFF },
];

/**
 * The admin area's own frame: a sidebar and a work area that cover the public site's header and footer.
 * It also checks who is looking: visitors see a sign-in prompt, customers see "no access", staff see only the
 * pages their role allows. (The API enforces the same rules; this is just so nobody sees buttons that won't work.)
 */
export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const { roles, isPending, signedIn } = useRoles();
  const pathname = usePathname();
  const signOut = useSignOut();
  const isStaff = roles.some((r) => STAFF.includes(r));
  const role = STAFF.find((r) => roles.includes(r)) ?? "";

  let body: ReactNode;
  if (!usingServer) body = <Notice title="The admin needs the server" body="This area reads and changes live shop data. It isn't available in the browser-only demo." />;
  else if (isPending) body = <div className="h-64" aria-hidden />;
  else if (!signedIn) body = <Notice title="Sign in to continue"><Link href="/login" className={cn(btnPrimary, "mt-7")}>Sign in</Link></Notice>;
  else if (!isStaff) body = <Notice title="No access" body="Your account isn't part of the shop team. Ask the owner to give you a role." />;
  else body = children;

  const items = NAV.filter((n) => n.roles.some((r) => roles.includes(r)));
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="fixed inset-0 z-[70] flex overflow-hidden bg-background print:static print:block print:overflow-visible">
      {isStaff && usingServer && (
        <aside className="hidden w-60 shrink-0 flex-col border-e border-border bg-surface p-4 md:flex print:hidden">
          <Link href="/" className="mb-6 flex items-center gap-2 px-2 font-display text-lg font-semibold">
            <Image src="/icons/icon-192.png" alt="" width={28} height={28} className="rounded-md" />
            Brikkhorongon
          </Link>
          <nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto">
            {items.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
                className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-muted", active(href) && "bg-primary/10 text-primary")}>
                <Icon className="size-[18px]" aria-hidden />{label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{ROLE_LABEL[role] ?? role}</p>
            <div className="mt-2 flex gap-3">
              <Link href="/" className="underline-offset-4 hover:underline">View shop</Link>
              <button type="button" onClick={() => signOut.mutate()} className="underline-offset-4 hover:underline">Sign out</button>
            </div>
          </div>
        </aside>
      )}
      <div className="flex min-w-0 flex-1 flex-col print:block">
        {isStaff && usingServer && (
          <nav aria-label="Admin" className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2 md:hidden print:hidden">
            {items.map(({ href, label }) => (
              <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
                className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium", active(href) ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>{label}</Link>
            ))}
          </nav>
        )}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-8 print:overflow-visible print:p-0">{body}</main>
      </div>
    </div>
  );
}
