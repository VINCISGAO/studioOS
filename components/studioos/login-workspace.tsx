"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { LoginSubmitSpinner } from "@/components/studioos/login-demo-accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { getLoginVisual, type LoginRole } from "@/lib/studioos/login-theme";
import { cn } from "@/lib/utils";

type LoginCopy = {
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  rememberMe: string;
  forgotPassword: string;
  login: string;
};

export function LoginWorkspace({
  locale,
  role,
  nextPath,
  error,
  errorCode,
  initialEmail = "",
  t
}: {
  locale: Locale;
  role: LoginRole;
  nextPath: string;
  error?: string;
  errorCode?: string;
  initialEmail?: string;
  t: LoginCopy;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(error);
  const [clientErrorCode, setClientErrorCode] = useState<string | undefined>();
  const router = useRouter();

  const isWrongRole = errorCode === "wrong-role" || clientErrorCode === "wrong-role";
  const displayError = formError ?? error;
  const visual = getLoginVisual(role);
  const isBrand = role === "brand";

  const labelClass = cn("text-xs font-medium sm:text-sm", isBrand ? "text-zinc-200" : "text-zinc-800");
  const mutedClass = cn("text-xs sm:text-sm", isBrand ? "text-zinc-400" : "text-zinc-500");
  const iconClass = isBrand ? "text-zinc-500" : "text-zinc-400";

  const checkboxClass = useMemo(
    () =>
      cn(
        "h-4 w-4 rounded border focus:ring-2",
        isBrand
          ? "border-white/20 bg-white/[0.06] text-white focus:ring-white/20"
          : "border-zinc-300 text-violet-600 focus:ring-violet-500/20"
      ),
    [isBrand]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(undefined);
    setClientErrorCode(undefined);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          lang: locale,
          expected_role: role,
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

      setClientErrorCode(data.errorCode);
      setFormError(data.error ?? (locale === "zh" ? "登录失败，请重试。" : "Sign in failed. Please try again."));
    } catch {
      setFormError(locale === "zh" ? "网络错误，请稍后重试。" : "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <input type="hidden" name="lang" value={locale} />
        <input type="hidden" name="expected_role" value={role} />
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

        {displayError ? (
          <div
            className={cn(
              "flex gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] leading-5",
              isWrongRole
                ? isBrand
                  ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                  : "border-amber-200 bg-amber-50 text-amber-900"
                : isBrand
                  ? "border-red-400/30 bg-red-500/10 text-red-100"
                  : "border-red-200 bg-red-50 text-red-800"
            )}
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{displayError}</p>
          </div>
        ) : null}

        <div className="space-y-1.5 sm:space-y-2">
          <label htmlFor="email" className={labelClass}>
            {t.email}
          </label>
          <div className="relative">
            <Mail className={cn("pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2", iconClass)} />
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className={visual.input}
            />
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <label htmlFor="password" className={labelClass}>
            {t.password}
          </label>
          <div className="relative">
            <Lock className={cn("pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2", iconClass)} />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              className={cn(visual.input, "pr-11")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className={cn(
                "absolute right-3.5 top-1/2 -translate-y-1/2 transition",
                isBrand ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <label className={cn("inline-flex cursor-pointer items-center gap-2", mutedClass)}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className={checkboxClass}
            />
            {t.rememberMe}
          </label>
          <button
            type="button"
            className={cn("font-medium transition", isBrand ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-800")}
          >
            {t.forgotPassword}
          </button>
        </div>

        <Button type="submit" disabled={submitting} className={cn("gap-2", visual.btn)}>
          {t.login}
          {submitting ? <LoginSubmitSpinner visible /> : <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
