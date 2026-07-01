"use client";

import {
  updateContactEmailAction,
  updatePasswordAction,
  updatePhoneAction,
  updateSecurityPrefsAction
} from "@/app/studio-settings-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n";
import type { CreatorSettingsViewModel, LoginDevice } from "@/lib/studioos/creator-settings-types";
import { cn } from "@/lib/utils";
import { Laptop, Monitor, Smartphone } from "lucide-react";

const copy = {
  en: {
    devices: "Login devices",
    loginHistory: "Login history",
    noDevices: "No devices yet. Sign in again to record this device.",
    noHistory: "No login history yet.",
    currentDevice: "Current device",
    revoke: "Remove",
    success: "Success",
    failed: "Failed",
    save: "Save",
    cancel: "Cancel",
    dialogEmail: "Update email",
    dialogPassword: "Change password",
    dialogPhone: "Update phone",
    dialogRecovery: "Account recovery email",
    email: "Email",
    phone: "Phone",
    currentPassword: "Current password",
    newPassword: "New password",
    recoveryEmail: "Recovery email",
    now: "Now"
  },
  zh: {
    devices: "登录设备",
    loginHistory: "登录历史",
    noDevices: "暂无设备记录，重新登录后将自动记录。",
    noHistory: "暂无登录历史。",
    currentDevice: "当前设备",
    revoke: "移除",
    success: "成功",
    failed: "失败",
    save: "保存",
    cancel: "取消",
    dialogEmail: "修改邮箱",
    dialogPassword: "修改密码",
    dialogPhone: "修改手机号",
    dialogRecovery: "账户恢复邮箱",
    email: "邮箱",
    phone: "手机号码",
    currentPassword: "当前密码",
    newPassword: "新密码",
    recoveryEmail: "恢复邮箱",
    now: "现在"
  }
} as const;

function deviceIcon(device: LoginDevice) {
  if (device.os === "iOS" || device.device_name.includes("iPhone")) return Smartphone;
  if (device.os === "macOS" || device.device_name.includes("Mac")) return Laptop;
  return Monitor;
}

function browserLabel(device: LoginDevice) {
  return device.browser_version ? `${device.browser} ${device.browser_version}` : device.browser;
}

function formatRelativeTime(iso: string, locale: Locale, nowLabel: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 2) return nowLabel;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return locale === "zh" ? `${diffHours} 小时前` : `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return locale === "zh" ? `${diffDays} 天前` : `${diffDays}d ago`;
}

export function StudioSettingsDialogs({
  locale,
  settings,
  pending,
  emailDialog,
  setEmailDialog,
  passwordDialog,
  setPasswordDialog,
  phoneDialog,
  setPhoneDialog,
  recoveryDialog,
  setRecoveryDialog,
  devicesDialog,
  setDevicesDialog,
  emailInput,
  setEmailInput,
  phoneInput,
  setPhoneInput,
  currentPasswordInput,
  setCurrentPasswordInput,
  nextPasswordInput,
  setNextPasswordInput,
  recoveryInput,
  setRecoveryInput,
  onSaveEmail,
  onSavePassword,
  onSavePhone,
  onSaveRecovery,
  onRevokeDevice
}: {
  locale: Locale;
  settings: CreatorSettingsViewModel;
  pending: boolean;
  emailDialog: boolean;
  setEmailDialog: (open: boolean) => void;
  passwordDialog: boolean;
  setPasswordDialog: (open: boolean) => void;
  phoneDialog: boolean;
  setPhoneDialog: (open: boolean) => void;
  recoveryDialog: boolean;
  setRecoveryDialog: (open: boolean) => void;
  devicesDialog: boolean;
  setDevicesDialog: (open: boolean) => void;
  emailInput: string;
  setEmailInput: (value: string) => void;
  phoneInput: string;
  setPhoneInput: (value: string) => void;
  currentPasswordInput: string;
  setCurrentPasswordInput: (value: string) => void;
  nextPasswordInput: string;
  setNextPasswordInput: (value: string) => void;
  recoveryInput: string;
  setRecoveryInput: (value: string) => void;
  onSaveEmail: () => void;
  onSavePassword: () => void;
  onSavePhone: () => void;
  onSaveRecovery: () => void;
  onRevokeDevice: (deviceId: string) => void;
}) {
  const t = copy[locale];

  return (
    <>
      <Dialog open={devicesDialog} onOpenChange={setDevicesDialog}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t.devices}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.devices}</h4>
              {settings.devices.length === 0 ? (
                <p className="text-sm text-zinc-500">{t.noDevices}</p>
              ) : (
                <div className="space-y-3">
                  {settings.devices.map((device) => {
                    const Icon = deviceIcon(device);
                    return (
                      <div key={device.id} className="flex items-start justify-between gap-3 rounded-xl border border-zinc-100 p-3">
                        <div className="flex gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-zinc-900">
                              {device.device_name}
                              {device.current ? ` (${t.currentDevice})` : ""}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {device.location} · {browserLabel(device)}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-400">
                              {formatRelativeTime(device.last_active_at, locale, t.now)}
                            </p>
                          </div>
                        </div>
                        {!device.current ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={pending}
                            onClick={() => onRevokeDevice(device.id)}
                          >
                            {t.revoke}
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.loginHistory}</h4>
              {settings.loginHistory.length === 0 ? (
                <p className="text-sm text-zinc-500">{t.noHistory}</p>
              ) : (
                <div className="space-y-3">
                  {settings.loginHistory.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-zinc-100 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-zinc-900">{entry.device}</p>
                        <span className={cn("text-xs", entry.success ? "text-emerald-600" : "text-red-600")}>
                          {entry.success ? t.success : t.failed}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-zinc-600">{entry.location}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {entry.ip} · {new Date(entry.at).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t.dialogEmail}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="contact-email">{t.email}</Label>
            <Input id="contact-email" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog(false)}>
              {t.cancel}
            </Button>
            <Button disabled={pending} onClick={onSaveEmail}>
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t.dialogPassword}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t.currentPassword}</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">{t.newPassword}</Label>
              <Input
                id="new-password"
                type="password"
                value={nextPasswordInput}
                onChange={(e) => setNextPasswordInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog(false)}>
              {t.cancel}
            </Button>
            <Button disabled={pending} onClick={onSavePassword}>
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={phoneDialog} onOpenChange={setPhoneDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t.dialogPhone}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="phone">{t.phone}</Label>
            <Input id="phone" type="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhoneDialog(false)}>
              {t.cancel}
            </Button>
            <Button disabled={pending} onClick={onSavePhone}>
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={recoveryDialog} onOpenChange={setRecoveryDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t.dialogRecovery}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="recovery-email">{t.recoveryEmail}</Label>
            <Input
              id="recovery-email"
              type="email"
              value={recoveryInput}
              onChange={(e) => setRecoveryInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecoveryDialog(false)}>
              {t.cancel}
            </Button>
            <Button disabled={pending} onClick={onSaveRecovery}>
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
