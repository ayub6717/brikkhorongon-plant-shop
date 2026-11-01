"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { NAV, NAV_MORE } from "./nav";

/** True when `pathname` is the nav item's page or any page beneath it. */
const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function DesktopNavLinks() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="ml-4 hidden gap-1 text-sm font-medium xl:flex">
      {NAV.map(({ href, key }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative whitespace-nowrap rounded-full px-2.5 py-1.5 transition",
              active ? "bg-muted text-primary" : "text-foreground/75 hover:text-primary",
            )}
          >
            {t(key)}
            {active && <span aria-hidden className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavLinks({ onNavigate }: { onNavigate: () => void }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <ul>
      {[...NAV, ...NAV_MORE].map(({ href, key }) => {
        const active = isActive(pathname, href);
        return (
          <li key={key}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block rounded-xl px-3 py-3 text-lg font-medium transition",
                active ? "bg-muted text-primary" : "text-foreground/85 hover:bg-muted",
              )}
            >
              {t(key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
