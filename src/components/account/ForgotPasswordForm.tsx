"use client";

import { MailCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useForgotPassword } from "@/lib/api/account";
import { inputCls } from "./shared";

const KNOWN = new Set(["RATE_LIMITED", "NETWORK"]);

export function ForgotPasswordForm() {
  const t = useTranslations("Recovery");
  const ta = useTranslations("Account");
  const locale = useLocale();
  const uid = useId();
  const send = useForgotPassword();
  const [email, setEmail] = useState("");
  const [tried, setTried] = useState(false);
  const bad = !/^\S+@\S+\.\S+$/.test(email.trim());

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-4xl font-semibold">{t("forgotTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("forgotLead")}</p>

      {send.isSuccess ? (
        <div role="status" className="mt-6 flex gap-3 rounded-card border border-border bg-surface p-5 text-sm sm:p-6">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <p>{t("sent")}</p>
        </div>
      ) : (
        <form
          noValidate
          className="mt-6 space-y-4 rounded-card border border-border bg-surface p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setTried(true);
            if (!bad) send.mutate({ email: email.trim(), locale });
          }}
        >
          <div>
            <label htmlFor={`${uid}-e`} className="mb-1.5 block text-sm font-medium">{ta("email")}</label>
            <input id={`${uid}-e`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={(tried && bad) || undefined} className={inputCls} />
            {tried && bad && <p role="alert" className="mt-1.5 text-xs font-medium text-accent">{ta("errors.email")}</p>}
          </div>
          {send.error && <p role="alert" className="text-sm font-medium text-accent">{ta(`errors.${KNOWN.has(send.error.message) ? send.error.message : "GENERIC"}`)}</p>}
          <button type="submit" disabled={send.isPending} className="w-full rounded-full bg-primary px-6 py-3.5 font-medium text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60">{t("sendLink")}</button>
        </form>
      )}

      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">{t("backToLogin")}</Link>
      </p>
    </div>
  );
}
