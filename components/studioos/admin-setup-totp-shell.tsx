"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

const setupErrorCopy = {
  en: {
    invalid_or_expired: "Invalid or expired setup link.",
    device_mismatch:
      "This link must be opened and completed on the same device and network. Ask the master admin to resend.",
    open_setup_page_first: "Open the setup page on your device first.",
    setup_state_invalid: "Setup state invalid. Ask the master admin for a new link.",
    invalid_totp: "Invalid authenticator code."
  },
  zh: {
    invalid_or_expired: "绑定链接无效或已过期。",
    device_mismatch: "此链接必须在同一设备与网络上打开并完成绑定。请联系主账号重新发送。",
    open_setup_page_first: "请先在首次打开的页面完成绑定。",
    setup_state_invalid: "绑定状态异常，请联系主账号重新发送链接。",
    invalid_totp: "验证码错误。"
  }
} as const;

function mapSetupError(locale: Locale, code?: string) {
  const t = setupErrorCopy[locale];
  if (code && code in t) return t[code as keyof typeof t];
  return t.invalid_or_expired;
}
const copy = {
  en: {
    title: "Bind Google Authenticator",
    body: "Scan the URI below in Google Authenticator, then enter a 6-digit code to finish.",
    uri: "Authenticator URI",
    code: "6-digit code",
    submit: "Complete setup",
    submitting: "Saving…",
    done: "Setup complete. Redirecting to login…",
    secretAlreadyIssued:
      "This link was already opened once. Use the same device where you scanned the QR code, or ask the master admin for a new setup link."
  },
  zh: {
    title: "绑定 Google 验证器",
    body: "在 Google Authenticator 中手动输入下方链接或密钥，然后输入 6 位验证码完成绑定。",
    uri: "Authenticator 链接",
    code: "6 位验证码",
    submit: "完成绑定",
    submitting: "保存中…",
    done: "绑定完成，正在跳转登录…",
    secretAlreadyIssued:
      "此链接已在其他设备上打开过。请在首次扫码的设备上完成绑定，或联系主账号重新发送绑定链接。"
  }
} as const;

export function AdminSetupTotpShell({ locale, token }: { locale: Locale; token: string }) {
  const t = copy[locale];
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [secretAlreadyIssued, setSecretAlreadyIssued] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/setup-totp?token=${encodeURIComponent(token)}`);
        const data = (await response.json()) as {
          ok: boolean;
          email?: string;
          otpauthUri?: string;
          secretAlreadyIssued?: boolean;
          error?: string;
        };
        if (cancelled) return;
        if (!data.ok || !data.email) {
          setError(mapSetupError(locale, data.error));
          return;
        }
        setEmail(data.email);
        if (data.secretAlreadyIssued) {
          setSecretAlreadyIssued(true);
          return;
        }
        if (!data.otpauthUri) {
          setError(mapSetupError(locale, "invalid_or_expired"));
          return;
        }
        setOtpauthUri(data.otpauthUri);
      } catch {
        if (!cancelled) setError(mapSetupError(locale));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token, locale]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/setup-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code, lang: locale })
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(mapSetupError(locale, data.error));
        return;
      }
      setDone(true);
      window.setTimeout(() => {
        router.push(withLocale("/admin/login", locale));
      }, 1200);
    } catch {
      setError(mapSetupError(locale));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
            <ShieldCheck className="h-5 w-5 text-violet-600" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">{t.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">{email || t.body}</p>
        </div>

        {loading ? <p className="text-sm text-zinc-500">{locale === "zh" ? "加载中…" : "Loading…"}</p> : null}
        {error ? (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {secretAlreadyIssued ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{t.secretAlreadyIssued}</span>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="setup-code-retry" className="text-sm font-medium text-zinc-700">
                {t.code}
              </label>
              <div className="relative max-w-xs">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="setup-code-retry"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-10 pl-10 tracking-[0.35em]"
                />
              </div>
            </div>
            <Button type="button" disabled={submitting || done || code.length !== 6} onClick={() => void handleSubmit()}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {done ? t.done : submitting ? t.submitting : t.submit}
            </Button>
          </div>
        ) : null}

        {otpauthUri ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs break-all text-zinc-700">
              <p className="mb-1 font-medium text-zinc-900">{t.uri}</p>
              {otpauthUri}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="setup-code" className="text-sm font-medium text-zinc-700">
                {t.code}
              </label>
              <div className="relative max-w-xs">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="setup-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-10 pl-10 tracking-[0.35em]"
                />
              </div>
            </div>
            <Button type="button" disabled={submitting || done || code.length !== 6} onClick={() => void handleSubmit()}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {done ? t.done : submitting ? t.submitting : t.submit}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
