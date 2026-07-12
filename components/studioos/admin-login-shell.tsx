"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Fingerprint, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { adminLoginAction } from "@/app/actions";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { LoginSubmitSpinner } from "@/components/studioos/login-demo-accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { studioOS } from "@/lib/studioos/vocabulary";
import { loginWithAdminPasskey } from "@/lib/studioos/admin-passkey-client";
import { cn } from "@/lib/utils";

export type AdminLoginCopy = {
  consoleTitle: string;
  email: string;
  emailPlaceholder: string;
  authenticatorCode: string;
  authenticatorPlaceholder: string;
  authenticatorHint: string;
  signIn: string;
  copyright: string;
  environment: string;
  version: string;
  region: string;
  status: string;
  secureConnection: string;
  invalidCredentials: string;
  notConfigured: string;
  schemaNotReady: string;
  unavailableOps: string;
  networkError: string;
};

type AdminLoginShellProps = {
  locale: Locale;
  nextPath: string;
  initialEmail?: string;
  error?: string;
  signedOut?: boolean;
  loginUnavailable: boolean;
  showOpsHint: boolean;
  schemaReady: boolean;
  totpConfigured: boolean;
  t: AdminLoginCopy;
};

function AdminLoginSubmitButton({
  label,
  disabled
}: {
  label: string;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      className={cn(
        "h-11 w-full gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-sm",
        "hover:bg-violet-700 focus-visible:ring-violet-500"
      )}
    >
      {label}
      <LoginSubmitSpinner visible={pending} />
    </Button>
  );
}

export function AdminLoginShell({
  locale,
  nextPath,
  initialEmail = "",
  error,
  signedOut = false,
  loginUnavailable,
  showOpsHint,
  schemaReady,
  totpConfigured,
  t
}: AdminLoginShellProps) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [passkeySubmitting, setPasskeySubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(error);

  const displayError = formError ?? error;
  const loginReady = !loginUnavailable && schemaReady && totpConfigured;

  async function handlePasskeyLogin() {
    if (loginUnavailable || !email.trim()) {
      setFormError(locale === "zh" ? "请先输入邮箱。" : "Enter your email first.");
      return;
    }

    setPasskeySubmitting(true);
    setFormError(undefined);

    try {
      const data = await loginWithAdminPasskey({ email, lang: locale, nextPath });
      if (data.ok && data.redirectTo) {
        window.location.assign(data.redirectTo);
        return;
      }
      setFormError(t.invalidCredentials);
    } catch {
      setFormError(t.networkError);
    } finally {
      setPasskeySubmitting(false);
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
          <BrandLogoLockup
            contrastOn="light"
            markClassName="h-8 w-8 sm:h-9 sm:w-9"
            wordmarkClassName="h-[18px] w-[112px] sm:h-[21px] sm:w-[134px]"
            priority
          />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-2 sm:px-6">
        <div className="w-full max-w-[420px] rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_24px_64px_-32px_rgba(15,23,42,0.18)] sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
              <ShieldCheck className="h-5 w-5 text-violet-600" strokeWidth={2} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{t.consoleTitle}</h1>
            <p className="mt-2 text-sm text-zinc-500">{t.authenticatorHint}</p>
          </div>

          {loginUnavailable ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{showOpsHint ? (schemaReady ? t.notConfigured : t.schemaNotReady) : t.notConfigured}</span>
            </div>
          ) : null}

          {signedOut ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{locale === "zh" ? "已安全退出，请重新登录。" : "Signed out. Sign in again to continue."}</span>
            </div>
          ) : null}

          {displayError ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{displayError}</span>
            </div>
          ) : null}

          <form action={adminLoginAction} className="space-y-4">
            <input type="hidden" name="lang" value={locale} />
            <input type="hidden" name="next" value={nextPath} />

            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="text-xs font-medium text-zinc-700 sm:text-sm">
                {t.email}
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="admin-email"
                  name="email"
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
              <label htmlFor="admin-totp" className="text-xs font-medium text-zinc-700 sm:text-sm">
                {t.authenticatorCode}
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="admin-totp"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder={t.authenticatorPlaceholder}
                  className="h-11 rounded-xl border-zinc-200 bg-white pl-10 text-sm tracking-[0.35em]"
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-zinc-100 pt-4">
              <AdminLoginSubmitButton label={t.signIn} disabled={!loginReady || passkeySubmitting} />
              <Button
                type="button"
                variant="outline"
                disabled={!loginReady || passkeySubmitting}
                onClick={() => void handlePasskeyLogin()}
                className="h-11 w-full gap-2 rounded-xl border-zinc-200 text-sm font-semibold"
              >
                <Fingerprint className="h-4 w-4" />
                {locale === "zh" ? "使用 Passkey 登录" : "Sign in with passkey"}
                <LoginSubmitSpinner visible={passkeySubmitting} />
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
