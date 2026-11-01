"use client";

import { CloudOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Link } from "@/i18n/navigation";

/** Route-level error boundary: a calm message and a way to retry instead of a blank page. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Error");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section role="alert" className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      <CloudOff className="size-12 text-accent" aria-hidden />
      <h1 className="mt-6 font-display text-4xl font-semibold">{t("title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("body")}</p>
      {error.digest && <p className="mt-2 text-xs text-muted-foreground">{t("ref", { id: error.digest })}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground">{t("retry")}</button>
        <Link href="/" className="rounded-full border border-border px-7 py-3.5 font-medium hover:bg-muted">{t("home")}</Link>
      </div>
    </section>
  );
}
