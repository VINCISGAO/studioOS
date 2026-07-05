"use client";

import { Fragment, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check, Mail, Rocket, ShieldCheck, Sparkles, Users } from "lucide-react";
import { LoginSubmitSpinner } from "@/components/studioos/login-demo-accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { getLoginVisual, type LoginRole, type LoginVisual } from "@/lib/studioos/login-theme";
import { cn } from "@/lib/utils";

type LoginCopy = {
  email: string;
  emailPlaceholder: string;
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
  visualOverride,
  t
}: {
  locale: Locale;
  role: LoginRole;
  nextPath: string;
  error?: string;
  errorCode?: string;
  initialEmail?: string;
  visualOverride?: LoginVisual;
  t: LoginCopy;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [redirectTo, setRedirectTo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(error);
  const [devCodeHint, setDevCodeHint] = useState<string | undefined>();
  const [sentHint, setSentHint] = useState<string | undefined>();
  const [clientErrorCode, setClientErrorCode] = useState<string | undefined>();
  const router = useRouter();

  const isWrongRole = errorCode === "wrong-role" || clientErrorCode === "wrong-role";
  const displayError = formError ?? error;
  const visual = visualOverride ?? getLoginVisual(role);
  const darkPanel = role === "brand";

  const labelClass = cn(
    "text-xs font-medium sm:text-sm",
    darkPanel ? "text-zinc-200" : "text-zinc-800"
  );
  const mutedClass = cn(
    "text-xs sm:text-sm",
    darkPanel ? "text-zinc-400" : "text-zinc-500"
  );
  const iconClass = darkPanel ? "text-zinc-500" : "text-zinc-400";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(undefined);
    setClientErrorCode(undefined);

    try {
      if (step === "email") {
        const response = await fetch("/api/auth/email/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, lang: locale })
        });
        const data = (await response.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          message?: string;
          debugCode?: string;
        } | null;
        if (!response.ok || !data?.ok) {
          setSentHint(undefined);
          setFormError(
            data?.error ??
              (response.status === 503
                ? locale === "zh"
                  ? "认证服务暂不可用，请确认数据库迁移已执行。"
                  : "Authentication service unavailable. Confirm database migrations are applied."
                : locale === "zh"
                  ? "请求过于频繁，请稍后再试。"
                  : "Too many requests. Try again later.")
          );
          return;
        }
        setFormError(undefined);
        setSentHint(data.message);
        setDevCodeHint(data.debugCode);
        setStep("code");
        return;
      }

      if (step === "code") {
        const response = await fetch("/api/auth/continue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, lang: locale, role, next: nextPath || undefined })
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          redirectTo?: string;
        };
        if (!response.ok || !data.ok || !data.redirectTo) {
          setFormError(data.error ?? (locale === "zh" ? "验证码不正确或已过期。" : "Invalid or expired code."));
          return;
        }
        router.push(data.redirectTo);
        return;
      }
    } catch {
      setFormError(locale === "zh" ? "网络错误，请稍后重试。" : "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-2 sm:gap-4">
          {[
            { id: "email", label: locale === "zh" ? "验证邮箱" : "Email" },
            { id: "code", label: locale === "zh" ? "输入验证码" : "Code" },
            { id: "success", label: locale === "zh" ? "登录成功" : "Success" }
          ].map((item, index) => {
            const currentIndex = step === "email" ? 0 : step === "code" ? 1 : 2;
            const done = index < currentIndex;
            const active = index === currentIndex;
            return (
              <Fragment key={item.id}>
                {index > 0 ? (
                  <span
                    key={`${item.id}-line`}
                    className={cn(
                      "mt-4 h-[2px] w-10 rounded-full sm:w-16 lg:w-20",
                      index <= currentIndex
                        ? "bg-violet-500"
                        : darkPanel
                          ? "bg-white/35"
                          : "bg-zinc-300"
                    )}
                  />
                ) : null}
                <div key={item.id} className="flex min-w-0 flex-col items-center gap-2">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition",
                      done || active
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                        : darkPanel
                          ? "border border-white/15 bg-white text-zinc-500"
                          : "border border-zinc-200 bg-white text-zinc-400"
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      "whitespace-nowrap text-xs font-medium",
                      done || active
                        ? darkPanel
                          ? "text-white"
                          : "text-zinc-900"
                        : darkPanel
                          ? "text-zinc-400"
                          : "text-zinc-400"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>

      {step === "success" ? (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-violet-100 shadow-[0_18px_60px_rgba(124,58,237,0.28)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-white">
              <Check className="h-8 w-8" strokeWidth={3} />
            </div>
          </div>
          <div>
            <h3
              className={cn(
                "text-2xl font-semibold tracking-tight",
                darkPanel ? "text-white" : "text-zinc-950"
              )}
            >
              {locale === "zh" ? "登录成功！" : "You're in!"}
            </h3>
            <p className={cn("mt-2 text-sm", darkPanel ? "text-zinc-200" : "text-zinc-600")}>
              {locale === "zh" ? "欢迎回到 StudioOS，你的工作台已准备好" : "Welcome back to StudioOS. Your workspace is ready."}
            </p>
          </div>
          <div
            className={cn(
              "mx-auto max-w-sm rounded-2xl border p-4 text-left",
              darkPanel
                ? "border-white/15 bg-white/[0.1]"
                : "border-violet-100 bg-violet-50/80"
            )}
          >
            {[
              { icon: Rocket, title: locale === "zh" ? "开始你的创作" : "Start creating", body: locale === "zh" ? "创建项目，邀请团队，开启高效协作" : "Create projects and collaborate with your team" },
              { icon: Sparkles, title: locale === "zh" ? "探索强大功能" : "Explore AI tools", body: locale === "zh" ? "体验 AI 工具、项目管理与数据分析" : "Use AI, project management, and analytics" },
              { icon: Users, title: locale === "zh" ? "连接全球创作者" : "Connect globally", body: locale === "zh" ? "与优秀创作者和品牌建立合作" : "Work with top creators and brands" }
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-3 py-2">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    darkPanel ? "bg-violet-500/20 text-violet-200" : "bg-white text-violet-600"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className={cn("text-sm font-semibold", darkPanel ? "text-white" : "text-zinc-900")}>{title}</p>
                  <p className={cn("mt-0.5 text-xs leading-relaxed", darkPanel ? "text-zinc-300" : "text-zinc-600")}>
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            className={cn("gap-2", visual.btn)}
            onClick={() => {
              router.push(redirectTo || (role === "creator" ? `/studio?lang=${locale}` : `/brand?lang=${locale}`));
              router.refresh();
            }}
          >
            {locale === "zh" ? "进入 StudioOS" : "Enter StudioOS"}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className={cn("text-xs", darkPanel ? "text-zinc-400" : "text-zinc-500")}>
            {locale === "zh" ? "我们重视你的数据安全，所有信息均加密保护" : "Your data is protected with encrypted security controls."}
          </p>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <input type="hidden" name="lang" value={locale} />
        <input type="hidden" name="expected_role" value={role} />
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

        {displayError ? (
          <div
            className={cn(
              "flex gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] leading-5",
              isWrongRole
                ? darkPanel
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                : darkPanel
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
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="email" className={labelClass}>
              {t.email}
            </label>
            <span className={cn("shrink-0 text-[11px] leading-5 sm:text-xs", darkPanel ? "text-zinc-400" : "text-zinc-500")}>
              {locale === "zh" ? "我们会向您发送 6 位数字验证码" : "We'll send a 6-digit code"}
            </span>
          </div>
          <div className="relative">
            <Mail className={cn("pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2", iconClass)} />
            <Input
              id="email"
              name="email"
              type="email"
              required
              disabled={step !== "email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className={visual.input}
            />
          </div>
        </div>

        {step === "code" ? (
          <div className="space-y-1.5 sm:space-y-2">
            {sentHint ? (
              <p
                className={cn(
                  "rounded-xl border px-3 py-2 text-xs leading-5",
                  devCodeHint
                    ? darkPanel
                      ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                      : "border-amber-200 bg-amber-50 text-amber-900"
                    : darkPanel
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                      : "border-emerald-200 bg-emerald-50 text-emerald-900"
                )}
              >
                {sentHint}
                {devCodeHint
                  ? locale === "zh"
                    ? ` 验证码：${devCodeHint}`
                    : ` Code: ${devCodeHint}`
                  : null}
              </p>
            ) : null}
            <label htmlFor="code" className={labelClass}>
              {locale === "zh" ? "验证码" : "Verification code"}
            </label>
            <div className="relative">
              <ShieldCheck className={cn("pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2", iconClass)} />
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={locale === "zh" ? "输入 6 位验证码" : "Enter 6-digit code"}
                className={visual.input}
              />
            </div>
          </div>
        ) : null}

        <Button type="submit" disabled={submitting} className={cn("gap-2", visual.btn)}>
          {step === "email"
            ? locale === "zh" ? "发送验证码" : "Send code"
            : locale === "zh" ? "进入 StudioOS" : "Enter StudioOS"}
          {submitting ? <LoginSubmitSpinner visible /> : <ArrowRight className="h-4 w-4" />}
        </Button>
        {step !== "email" ? (
          <button
            type="button"
            className={cn("w-full text-center text-xs transition", mutedClass)}
            onClick={() => {
              setStep("email");
              setCode("");
              setDevCodeHint(undefined);
              setSentHint(undefined);
              setFormError(undefined);
            }}
          >
            {locale === "zh" ? "更换邮箱" : "Use a different email"}
          </button>
        ) : null}
      </form>
      )}
    </div>
  );
}
