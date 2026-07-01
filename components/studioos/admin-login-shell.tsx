"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { LoginLanguageSwitcher } from "@/components/studioos/login-language-switcher";
import { LoginSubmitSpinner } from "@/components/studioos/login-demo-accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { studioOS } from "@/lib/studioos/vocabulary";
import { cn } from "@/lib/utils";

export type AdminLoginCopy = {
  consoleTitle: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  rememberDevice: string;
  forgotPassword: string;
  signIn: string;
  copyright: string;
  environment: string;
  version: string;
  region: string;
  status: string;
  secureConnection: string;
  invalidCredentials: string;
  adminRequired: string;
  networkError: string;
};

type AdminLoginShellProps = {
  locale: Locale;
  nextPath: string;
  initialEmail?: string;
  error?: string;
  t: AdminLoginCopy;
};

function AdminLogoMark() {
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-500 to-violet-400 text-sm font-bold text-white shadow-sm"
      aria-hidden
    >
      S
    </div>
  );
}

export function AdminLoginShell({
  locale,
  nextPath,
  initialEmail = "",
  error,
  t
}: AdminLoginShellProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(error);
  const router = useRouter();

  const displayError = formError ?? error;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(undefined);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          lang: locale,
          expected_role: "admin",
          next: nextPath
        })
      });

      const data = (await response.json()) as {
        ok: boolean;
        redirectTo?: string;
        error?: string;
        errorCode?: string;
      };

      if (data.ok && data.redirectTo) {
        router.push(data.redirectTo);
        router.refresh();
        return;
      }

      setFormError(
        data.error ??
          (data.errorCode === "admin-required"
            ? t.adminRequired
            : locale === "zh"
              ? t.invalidCredentials
              : t.invalidCredentials)
      );
    } catch {
      setFormError(t.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#f4f4f8] text-zinc-900">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.12),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.08),transparent_45%)]"
        aria-hidden
      />

      <header className="relative z-10 flex items-start justify-between px-6 py-6 sm:px-10 sm:py-8">
        <div className="flex items-start gap-3">
          <AdminLogoMark />
          <div>
            <p className="text-base font-semibold tracking-tight text-zinc-900 sm:text-lg">{studioOS.productName}</p>
            <p className="text-sm text-zinc-500 sm:text-[15px]">{t.consoleTitle}</p>
          </div>
        </div>
        <LoginLanguageSwitcher locale={locale} />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-2 sm:px-6">
        <div className="w-full max-w-[420px] rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_24px_64px_-32px_rgba(15,23,42,0.18)] sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
              <Lock className="h-5 w-5 text-violet-600" strokeWidth={2} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{t.consoleTitle}</h1>
          </div>

          {displayError ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{displayError}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="text-xs font-medium text-zinc-700 sm:text-sm">
                {t.email}
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="h-11 rounded-xl border-zinc-200 bg-white pl-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-xs font-medium text-zinc-700 sm:text-sm">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="h-11 rounded-xl border-zinc-200 bg-white pl-10 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600 sm:text-sm">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(event) => setRememberDevice(event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500/20"
                />
                {t.rememberDevice}
              </label>
              <button type="button" className="text-xs font-medium text-violet-600 hover:text-violet-700 sm:text-sm">
                {t.forgotPassword}
              </button>
            </div>

            <div className="border-t border-zinc-100 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className={cn(
                  "h-11 w-full gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-sm",
                  "hover:bg-violet-700 focus-visible:ring-violet-500"
                )}
              >
                {t.signIn}
                <LoginSubmitSpinner visible={submitting} />
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-400">
            © {studioOS.productName}
            <br />
            Version 1.0.0
          </p>
        </div>
      </main>

      <footer className="relative z-10 px-6 pb-8 pt-2 sm:px-10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-zinc-400 sm:text-xs">
          <span>
            {t.environment}
            <span className="ml-1.5 font-medium text-zinc-600">Production</span>
          </span>
          <span>
            {t.version}
            <span className="ml-1.5 font-medium text-zinc-600">v1.0.0</span>
          </span>
          <span>
            {t.region}
            <span className="ml-1.5 font-medium text-zinc-600">Singapore</span>
          </span>
          <span>
            {t.status}
            <span className="ml-1.5 font-medium text-emerald-600">{t.secureConnection}</span>
          </span>
        </div>
        <p className="mt-3 text-center text-[11px] text-zinc-400 sm:text-xs">{t.copyright}</p>
      </footer>
    </div>
  );
}
