"use client";

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Loader2, MonitorSmartphone, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { adminMutationHeaders } from "@/lib/studioos/admin-csrf-client";
import { registerAdminPasskey, unlockPasskeyStepUpClient } from "@/lib/studioos/admin-passkey-client";

type SessionRow = {
  id: string;
  deviceLabel: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
};

type PasskeyRow = {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
};

const copy = {
  en: {
    title: "Security",
    subtitle: "Passkeys, active sessions, and device control.",
    passkeys: "Passkeys",
    addPasskey: "Add passkey",
    adding: "Adding…",
    passkeyHint: "Use Touch ID / Face ID / Windows Hello for phishing-resistant login.",
    sessions: "Active sessions",
    revokeOthers: "Sign out other devices",
    revoke: "Revoke",
    current: "Current",
    emptyPasskeys: "No passkeys yet — add one for faster, safer login.",
    loadError: "Could not load security settings.",
    unlockPasskeys: "Unlock passkey management",
    unlockHint: "Enter your authenticator code to add or remove passkeys (10 min).",
    unlockCode: "6-digit code",
    unlocking: "Unlocking…",
    unlocked: "Passkey management unlocked.",
    invalidTotp: "Invalid authenticator code.",
    stepUpRequired: "Unlock passkey management with your authenticator code first."
  },
  zh: {
    title: "安全",
    subtitle: "Passkey、活跃会话与设备管理。",
    passkeys: "Passkey",
    addPasskey: "添加 Passkey",
    adding: "添加中…",
    passkeyHint: "使用 Touch ID / Face ID / Windows Hello 进行防钓鱼登录。",
    sessions: "活跃会话",
    revokeOthers: "退出其他设备",
    revoke: "撤销",
    current: "当前",
    emptyPasskeys: "尚未添加 Passkey — 建议添加以提升登录安全性。",
    loadError: "无法加载安全设置。",
    unlockPasskeys: "解锁 Passkey 管理",
    unlockHint: "输入 Google 验证器代码以添加或删除 Passkey（10 分钟有效）。",
    unlockCode: "6 位验证码",
    unlocking: "解锁中…",
    unlocked: "Passkey 管理已解锁。",
    invalidTotp: "验证码错误。",
    stepUpRequired: "请先输入验证器代码解锁 Passkey 管理。"
  }
} as const;

export function AdminSecurityPanel({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [passkeyLabel, setPasskeyLabel] = useState("");
  const [unlockCode, setUnlockCode] = useState("");
  const [passkeysUnlocked, setPasskeysUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/auth/sessions", { headers: adminMutationHeaders() });
      const data = (await response.json()) as {
        ok: boolean;
        sessions?: SessionRow[];
        passkeys?: PasskeyRow[];
      };
      if (!data.ok) {
        setError(t.loadError);
        return;
      }
      setSessions(data.sessions ?? []);
      setPasskeys(data.passkeys ?? []);
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function postAction(body: Record<string, string>) {
    const response = await fetch("/api/admin/auth/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminMutationHeaders() },
      body: JSON.stringify(body)
    });
    return (await response.json()) as { ok: boolean; revokedCurrent?: boolean };
  }

  async function handleUnlockPasskeys() {
    setBusy("unlock");
    setError(null);
    try {
      const result = await unlockPasskeyStepUpClient(unlockCode);
      if (!result.ok) {
        setError(t.invalidTotp);
        return;
      }
      setPasskeysUnlocked(true);
      setUnlockCode("");
    } finally {
      setBusy(null);
    }
  }

  async function handleAddPasskey() {
    if (!passkeysUnlocked) {
      setError(t.stepUpRequired);
      return;
    }
    setBusy("passkey");
    setError(null);
    try {
      const result = await registerAdminPasskey(passkeyLabel || undefined);
      if (!result.ok) {
        setPasskeysUnlocked(false);
        setError(t.stepUpRequired);
        return;
      }
      setPasskeyLabel("");
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function handleRevokeSession(sessionId: string) {
    setBusy(sessionId);
    const result = await postAction({ action: "revoke_session", sessionId });
    if (result.revokedCurrent) {
      window.location.assign(`/admin/login?lang=${locale}`);
      return;
    }
    await load();
    setBusy(null);
  }

  async function handleRevokeOthers() {
    setBusy("others");
    await postAction({ action: "revoke_others" });
    await load();
    setBusy(null);
  }

  async function handleDeletePasskey(credentialRowId: string) {
    if (!passkeysUnlocked) {
      setError(t.stepUpRequired);
      return;
    }
    setBusy(credentialRowId);
    setError(null);
    const result = await postAction({ action: "delete_passkey", credentialRowId });
    if (!result.ok) {
      setError(t.stepUpRequired);
      setPasskeysUnlocked(false);
    }
    await load();
    setBusy(null);
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50">
          <Shield className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{t.title}</h2>
          <p className="text-sm text-zinc-500">{t.subtitle}</p>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-zinc-500">{locale === "zh" ? "加载中…" : "Loading…"}</p> : null}

      {!loading ? (
        <div className="space-y-8">
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <Fingerprint className="h-4 w-4" />
              {t.passkeys}
            </h3>
            <p className="mb-3 text-xs text-zinc-500">{t.passkeyHint}</p>
            {!passkeysUnlocked ? (
              <div className="mb-4 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-900">{t.unlockHint}</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    value={unlockCode}
                    onChange={(event) => setUnlockCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={t.unlockCode}
                    className="max-w-xs tracking-[0.35em]"
                  />
                  <Button
                    type="button"
                    disabled={busy === "unlock" || unlockCode.length !== 6}
                    onClick={() => void handleUnlockPasskeys()}
                  >
                    {busy === "unlock" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {busy === "unlock" ? t.unlocking : t.unlockPasskeys}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mb-3 text-sm text-emerald-700">{t.unlocked}</p>
            )}
            {passkeys.length ? (
              <ul className="mb-4 space-y-2">
                {passkeys.map((row) => (
                  <li key={row.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span>{row.label}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={!passkeysUnlocked || busy === row.id}
                      onClick={() => void handleDeletePasskey(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-zinc-500">{t.emptyPasskeys}</p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={passkeyLabel}
                onChange={(event) => setPasskeyLabel(event.target.value)}
                placeholder={locale === "zh" ? "设备名称（可选）" : "Device label (optional)"}
                className="max-w-xs"
              />
              <Button
                type="button"
                disabled={!passkeysUnlocked || busy === "passkey"}
                onClick={() => void handleAddPasskey()}
              >
                {busy === "passkey" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {busy === "passkey" ? t.adding : t.addPasskey}
              </Button>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <MonitorSmartphone className="h-4 w-4" />
                {t.sessions}
              </h3>
              <Button type="button" size="sm" variant="outline" disabled={busy === "others"} onClick={() => void handleRevokeOthers()}>
                {t.revokeOthers}
              </Button>
            </div>
            <ul className="space-y-2">
              {sessions.map((row) => (
                <li key={row.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{row.deviceLabel}</p>
                    <p className="text-xs text-zinc-500">
                      {row.isCurrent ? t.current : new Date(row.lastActiveAt).toLocaleString()}
                    </p>
                  </div>
                  {!row.isCurrent ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy === row.id}
                      onClick={() => void handleRevokeSession(row.id)}
                    >
                      {t.revoke}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
