"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useRouter } from "@/i18n/navigation";
import { usingServer } from "@/lib/api";
import { useSignIn, useSignUp } from "@/lib/api/queries";
import { loginSchema, registerSchema, type RegisterValues } from "@/lib/auth-schema";

const inputCls = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary aria-[invalid=true]:border-accent";

export function AuthForm({ mode }: Readonly<{ mode: "login" | "register" }>) {
  const t = useTranslations("Account");
  const uid = useId();
  const router = useRouter();
  const signIn = useSignIn();
  const signUp = useSignUp();
  const [failure, setFailure] = useState<string | null>(null);
  const register = mode === "register";
  const { register: field, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(register ? registerSchema : (loginSchema as unknown as typeof registerSchema)),
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });
  const pending = signIn.isPending || signUp.isPending;

  const onSubmit = (v: RegisterValues) => {
    setFailure(null);
    const done = { onSuccess: () => router.push("/account"), onError: (e: Error) => setFailure(e.message) };
    if (register) signUp.mutate(v, done);
    else signIn.mutate({ email: v.email, password: v.password }, done);
  };

  const err = (k: keyof RegisterValues) => (errors[k]?.message ? t(`errors.${errors[k]?.message}`) : undefined);
  const aria = (k: keyof RegisterValues) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${uid}-${k}-error` : undefined });
  const errMsg = (k: keyof RegisterValues) => (err(k) ? <p id={`${uid}-${k}-error`} role="alert" className="mt-1.5 text-xs font-medium text-accent">{err(k)}</p> : null);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-4xl font-semibold">{register ? t("registerTitle") : t("loginTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{register ? t("registerLead") : t("loginLead")}</p>

      {!usingServer && (
        <p className="mt-5 flex gap-2 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
          <FlaskConical className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />{t("demoNote")}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4 rounded-card border border-border bg-surface p-5 sm:p-6">
        {register && (
          <div>
            <label htmlFor={`${uid}-name`} className="mb-1.5 block text-sm font-medium">{t("name")}</label>
            <input id={`${uid}-name`} autoComplete="name" className={inputCls} {...aria("name")} {...field("name")} />
            {errMsg("name")}
          </div>
        )}
        <div>
          <label htmlFor={`${uid}-email`} className="mb-1.5 block text-sm font-medium">{t("email")}</label>
          <input id={`${uid}-email`} type="email" autoComplete="email" className={inputCls} {...aria("email")} {...field("email")} />
          {errMsg("email")}
        </div>
        {register && (
          <div>
            <label htmlFor={`${uid}-phone`} className="mb-1.5 block text-sm font-medium">{t("phone")}</label>
            <input id={`${uid}-phone`} type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" className={inputCls} {...aria("phone")} {...field("phone")} />
            {errMsg("phone")}
          </div>
        )}
        <div>
          <label htmlFor={`${uid}-password`} className="mb-1.5 block text-sm font-medium">{t("password")}</label>
          <input id={`${uid}-password`} type="password" autoComplete={register ? "new-password" : "current-password"} className={inputCls} {...aria("password")} {...field("password")} />
          {register && !errors.password && <p className="mt-1.5 text-xs text-muted-foreground">{t("passwordHint")}</p>}
          {errMsg("password")}
        </div>
        {failure && <p role="alert" className="text-sm font-medium text-accent">{t.has(`errors.${failure}`) ? t(`errors.${failure}`) : t("errors.GENERIC")}</p>}
        <button type="submit" disabled={pending} className="w-full rounded-full bg-primary px-6 py-3.5 font-medium text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60">
          {register ? t("registerBtn") : t("loginBtn")}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {register ? t("haveAccount") : t("noAccount")}{" "}
        <Link href={register ? "/login" : "/register"} className="font-medium text-primary underline-offset-4 hover:underline">{register ? t("loginLink") : t("registerLink")}</Link>
      </p>
    </div>
  );
}
