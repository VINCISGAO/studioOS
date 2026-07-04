"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, KeyRound, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { adminMutationHeaders } from "@/lib/studioos/admin-csrf-client";

type AdminAccountRow = {
  id: string;
  email: string;
  fullName: string;
  isMaster: boolean;
  status: string;
  totpEnabled: boolean;
  createdAt: string;
};

const copy = {
  en: {
    title: "Admin accounts",
    subtitle: "Unlock with your authenticator code. Setup links are emailed directly to new admins in production.",
    unlock: "Unlock list",
    unlocking: "Unlocking…",
    unlockHint: "Enter your 6-digit code to view and manage admin accounts.",
    email: "Email",
    fullName: "Display name",
    totp: "Your authenticator code",
    add: "Add admin",
    adding: "Adding…",
    masterBadge: "Master",
    listEmpty: "No other admins yet.",
    provisionEmailOk: "Admin created. A setup link was emailed directly to:",
    provisionManualOk: "Admin created (dev). Copy this one-time link manually:",
    setupLink: "Setup link"
  },
  zh: {
    title: "管理员账号",
    subtitle: "需用 Google 验证器解锁。生产环境下绑定链接将直接发到新管理员邮箱。",
    unlock: "解锁列表",
    unlocking: "解锁中…",
    unlockHint: "输入 6 位验证码以查看和管理管理员账号。",
    email: "邮箱",
    fullName: "显示名称",
    totp: "你的验证器代码",
    add: "添加管理员",
    adding: "正在添加…",
    masterBadge: "主账号",
    listEmpty: "暂无其他管理员。",
    provisionEmailOk: "管理员已创建，绑定链接已直接发送至：",
    provisionManualOk: "管理员已创建（开发环境）。请手动复制此一次性链接：",
    setupLink: "绑定链接"
  }
} as const;

export function AdminSettingsUsersPanel({ locale, isMaster }: { locale: Locale; isMaster: boolean }) {
  const t = copy[locale];
  const [unlocked, setUnlocked] = useState(false);
  const [accounts, setAccounts] = useState<AdminAccountRow[]>([]);
  const [unlockCode, setUnlockCode] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provisionResult, setProvisionResult] = useState<{
    email: string;
    setupDelivery: "email" | "manual";
    setupUrl?: string;
  } | null>(null);

  if (!isMaster) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {locale === "zh" ? "当前账号不是主账号，无法管理管理员列表。" : "This account is not the master admin."}
      </div>
    );
  }

  async function unlockList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUnlocking(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminMutationHeaders() },
        body: JSON.stringify({ action: "list", totpCode: unlockCode, lang: locale })
      });
      const data = (await response.json()) as { ok: boolean; accounts?: AdminAccountRow[]; error?: string };
      if (!data.ok || !data.accounts) {
        setError(data.error ?? (locale === "zh" ? "解锁失败" : "Unlock failed"));
        return;
      }
      setAccounts(data.accounts);
      setUnlocked(true);
      setTotpCode(unlockCode);
    } catch {
      setError(locale === "zh" ? "网络错误，请重试。" : "Network error. Try again.");
    } finally {
      setUnlocking(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setProvisionResult(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminMutationHeaders() },
        body: JSON.stringify({ email, fullName, totpCode, lang: locale })
      });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        account?: AdminAccountRow;
        setupUrl?: string;
        setupDelivery?: "email" | "manual";
      };

      if (!data.ok || !data.account) {
        setError(data.error ?? (locale === "zh" ? "添加失败" : "Failed to add admin"));
        return;
      }

      setAccounts((prev) => [...prev, data.account!]);
      setProvisionResult({
        email: data.account.email,
        setupDelivery: data.setupDelivery ?? "manual",
        setupUrl: data.setupUrl
      });
      setEmail("");
      setFullName("");
    } catch {
      setError(locale === "zh" ? "网络错误，请重试。" : "Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!unlocked) {
    return (
      <form onSubmit={(event) => void unlockList(event)} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{t.title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t.unlockHint}</p>
        </div>
        <div className="relative max-w-xs">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={unlockCode}
            onChange={(event) => setUnlockCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="h-10 pl-10 tracking-[0.35em]"
            placeholder="000000"
          />
        </div>
        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        <Button type="submit" disabled={unlocking || unlockCode.length !== 6} className="gap-2">
          {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {unlocking ? t.unlocking : t.unlock}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{t.title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <ul className="divide-y divide-zinc-100">
          {accounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-zinc-900">{account.fullName || account.email}</p>
                <p className="text-zinc-500">{account.email}</p>
              </div>
              {account.isMaster ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t.masterBadge}
                </span>
              ) : null}
            </li>
          ))}
          {accounts.length === 0 ? <li className="px-4 py-6 text-sm text-zinc-500">{t.listEmpty}</li> : null}
        </ul>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="admin-new-email" className="text-sm font-medium text-zinc-700">
              {t.email}
            </label>
            <Input id="admin-new-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="admin-new-name" className="text-sm font-medium text-zinc-700">
              {t.fullName}
            </label>
            <Input id="admin-new-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-10" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="admin-stepup-totp" className="text-sm font-medium text-zinc-700">
            {t.totp}
          </label>
          <div className="relative max-w-xs">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="admin-stepup-totp"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="h-10 pl-10 tracking-[0.35em]"
            />
          </div>
        </div>
        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        {provisionResult ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
            <p className="font-medium">
              {provisionResult.setupDelivery === "email" ? t.provisionEmailOk : t.provisionManualOk}
            </p>
            <p className="mt-2 font-medium">{provisionResult.email}</p>
            {provisionResult.setupUrl ? (
              <p className="mt-2 break-all">
                <span className="font-medium">{t.setupLink}:</span> {provisionResult.setupUrl}
              </p>
            ) : null}
          </div>
        ) : null}
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {submitting ? t.adding : t.add}
        </Button>
      </form>
    </div>
  );
}
