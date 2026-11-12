"use client";

import { User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSessionQuery } from "@/lib/api/queries";

export function AccountLink() {
  const t = useTranslations("Nav");
  const { data: user } = useSessionQuery();
  return (
    <Link
      href={user ? "/account" : "/login"}
      aria-label={user ? t("account") : t("login")}
      className="relative hidden size-9 place-items-center rounded-full text-foreground/80 transition hover:bg-muted sm:grid sm:size-10"
    >
      <User className="size-5" aria-hidden />
      {user && <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-primary" aria-hidden />}
    </Link>
  );
}
