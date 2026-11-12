"use client";

import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useResetPassword } from "@/lib/api/account";
import { inputCls } from "./shared";

const KNOWN = new Set(["RATE_LIMITED", "NETWORK", "WEAK_PASSWORD"]);

export function ResetPasswordForm() {
  const t = useTranslations("Recovery");
  const ta = useTranslations("Account");
  const td = useTranslations("Dashboard");
  const params = useSearchParams();
  const uid = useId();
  const reset = useResetPassword();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [tried, setTried] = useState(false);
  const weak = password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password);
  const mismatch = password !== again;
  const code = reset.error?.message;

  if (!email || !token) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-4xl font-semibold">{t("resetTitle")}</h1>
        <p role="alert" className="mt-4 text-sm text-accent">{t("badLink")}</p>
        <p className="mt-5 text-sm"><Link href="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline">{t("askAgain")}</Link></p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-4xl font-semibold">{t("resetTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("resetLead", { email })}</p>

      {reset.isSuccess ? (
        <div role="status" className="mt-6 space-y-4 rounded-card border border-border bg-surface p-5 text-sm sm:p-6">
          <p className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />{t("done")}</p>
          <Link href="/login" className="inline-block rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">{ta("loginBtn")}</Link>
        </div>
      ) : (
        <form
          noValidate
          className="mt-6 space-y-4 rounded-card border border-border bg-surface p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setTried(true);
            if (!weak && !mismatch) reset.mutate({ email, token, password });
          }}
        >
          <div>
            <label htmlFor={`${uid}-p`} className="mb-1.5 block text-sm font-medium">{td("newPassword")}</label>
            <input id={`${uid}-p`} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={(tried && weak) || undefined} className={inputCls} />
            <p className="mt-1.5 text-xs text-muted-foreground">{ta("passwordHint")}</p>
            {tried && weak && <p role="alert" className="mt-1 text-xs font-medium text-accent">{ta("errors.password")}</p>}
          </div>
          <div>
            <label htmlFor={`${uid}-a`} className="mb-1.5 block text-sm font-medium">{td("repeatPassword")}</label>
            <input id={`${uid}-a`} type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} aria-invalid={(tried && mismatch) || undefined} className={inputCls} />
            {tried && mismatch && <p role="alert" className="mt-1.5 text-xs font-medium text-accent">{td("passwordsDiffer")}</p>}
          </div>
          {code === "INVALID_RESET_TOKEN" ? (
            <p role="alert" className="text-sm font-medium text-accent">{t("expired")} <Link href="/forgot-password" className="underline underline-offset-4">{t("askAgain")}</Link></p>
          ) : (
            code && <p role="alert" className="text-sm font-medium text-accent">{ta(`errors.${KNOWN.has(code) ? code : "GENERIC"}`)}</p>
          )}
          <button type="submit" disabled={reset.isPending} className="w-full rounded-full bg-primary px-6 py-3.5 font-medium text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60">{t("setPassword")}</button>
        </form>
      )}
    </div>
  );
}
