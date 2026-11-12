"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { usingServer } from "@/lib/api";
import { useChangePassword } from "@/lib/api/account";
import { useSignOut, useUpdateProfile } from "@/lib/api/queries";
import { BD_PHONE } from "@/lib/checkout-schema";
import type { User } from "@/store/session";
import { card, inputCls } from "./shared";

const KNOWN = new Set(["INVALID_CREDENTIALS", "RATE_LIMITED", "NETWORK", "UNAUTHORIZED", "WEAK_PASSWORD"]);

export function ProfileTab({ user }: Readonly<{ user: User }>) {
  const t = useTranslations("Account");
  const td = useTranslations("Dashboard");
  const uid = useId();
  const router = useRouter();
  const signOut = useSignOut();
  const update = useUpdateProfile();
  const change = useChangePassword();
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [pwDone, setPwDone] = useState(false);
  const [pwTried, setPwTried] = useState(false);

  const nameV = name ?? user.name;
  const phoneV = phone ?? user.phone;
  const phoneBad = !BD_PHONE.test(phoneV.trim());
  const nameBad = nameV.trim().length < 2;
  const weak = next.length < 8 || !/[a-z]/i.test(next) || !/\d/.test(next);
  const mismatch = next !== again;
  const isStaff = user.roles?.some((r) => r !== "Customer");

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">{td("profileTitle")}</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card} aria-labelledby={`${uid}-profile`}>
          <h3 id={`${uid}-profile`} className="font-display text-lg font-semibold">{t("profile")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <form
            noValidate
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSaved(false);
              if (nameBad || phoneBad) return;
              update.mutate({ name: nameV.trim(), phone: phoneV.trim() }, { onSuccess: () => setSaved(true) });
            }}
          >
            <div>
              <label htmlFor={`${uid}-n`} className="mb-1.5 block text-sm font-medium">{t("name")}</label>
              <input id={`${uid}-n`} value={nameV} onChange={(e) => setName(e.target.value)} aria-invalid={nameBad || undefined} className={inputCls} />
              {nameBad && <p role="alert" className="mt-1.5 text-xs font-medium text-accent">{t("errors.name")}</p>}
            </div>
            <div>
              <label htmlFor={`${uid}-p`} className="mb-1.5 block text-sm font-medium">{t("phone")}</label>
              <input id={`${uid}-p`} value={phoneV} onChange={(e) => setPhone(e.target.value)} inputMode="tel" aria-invalid={phoneBad || undefined} className={inputCls} />
              {phoneBad && <p role="alert" className="mt-1.5 text-xs font-medium text-accent">{t("errors.phone")}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={update.isPending} className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{t("save")}</button>
              {saved && <output className="text-sm font-medium text-primary">{t("saved")}</output>}
            </div>
          </form>
          {isStaff && <Link href="/admin" className="mt-4 block text-sm font-medium text-primary underline-offset-4 hover:underline">{t("adminLink")}</Link>}
        </section>

        <div className="space-y-6">
          {usingServer && (
            <section className={card} aria-labelledby={`${uid}-pw`}>
              <h3 id={`${uid}-pw`} className="font-display text-lg font-semibold">{td("passwordTitle")}</h3>
              <form
                noValidate
                className="mt-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPwDone(false);
                  setPwTried(true);
                  if (!cur || weak || mismatch) return;
                  change.mutate({ current: cur, next }, { onSuccess: () => { setPwDone(true); setPwTried(false); setCur(""); setNext(""); setAgain(""); } });
                }}
              >
                <div>
                  <label htmlFor={`${uid}-c`} className="mb-1.5 block text-sm font-medium">{td("currentPassword")}</label>
                  <input id={`${uid}-c`} type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor={`${uid}-x`} className="mb-1.5 block text-sm font-medium">{td("newPassword")}</label>
                  <input id={`${uid}-x`} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} aria-invalid={(pwTried && weak) || undefined} className={inputCls} />
                  <p className="mt-1.5 text-xs text-muted-foreground">{t("passwordHint")}</p>
                  {pwTried && weak && <p role="alert" className="mt-1 text-xs font-medium text-accent">{t("errors.password")}</p>}
                </div>
                <div>
                  <label htmlFor={`${uid}-y`} className="mb-1.5 block text-sm font-medium">{td("repeatPassword")}</label>
                  <input id={`${uid}-y`} type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} aria-invalid={(pwTried && mismatch) || undefined} className={inputCls} />
                  {pwTried && mismatch && <p role="alert" className="mt-1.5 text-xs font-medium text-accent">{td("passwordsDiffer")}</p>}
                </div>
                {pwTried && !cur && <p role="alert" className="text-xs font-medium text-accent">{td("enterCurrent")}</p>}
                {change.error && <p role="alert" className="text-xs font-medium text-accent">{change.error.message === "INVALID_CREDENTIALS" ? td("currentWrong") : t(`errors.${KNOWN.has(change.error.message) ? change.error.message : "GENERIC"}`)}</p>}
                <div className="flex flex-wrap items-center gap-3">
                  <button type="submit" disabled={change.isPending} className="rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:bg-muted disabled:opacity-60">{td("changePassword")}</button>
                  {pwDone && <output className="text-sm font-medium text-primary">{td("passwordChanged")}</output>}
                </div>
              </form>
            </section>
          )}

          <section className={card}>
            <button type="button" onClick={() => signOut.mutate(undefined, { onSuccess: () => router.push("/") })} className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{t("signOut")}</button>
          </section>
        </div>
      </div>
    </div>
  );
}
