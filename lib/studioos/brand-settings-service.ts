import { DEMO_PASSWORD } from "@/lib/demo-auth";
import { getOrCreateBrandProfile } from "@/lib/brand-profile-service";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { hashPassword, verifyPassword } from "@/lib/core/password-crypto";
import { asInputJson } from "@/lib/core/prisma-json";
import {
  createSerializedStoreReader,
  readJsonFile,
  writeJsonFileAtomic
} from "@/lib/json-file-store-core";
import { dataStorePath } from "@/lib/serverless-store-core";
import type {
  CreatorSettingsViewModel,
  LoginDevice,
  LoginHistoryEntry,
  OAuthProvider
} from "@/lib/studioos/creator-settings-types";

type StoredBrandSettings = {
  brand_email: string;
  contact_email: string;
  phone: string;
  custom_password: string | null;
  oauth: Record<OAuthProvider, boolean>;
  two_factor_enabled: boolean;
  devices: LoginDevice[];
  login_history: LoginHistoryEntry[];
  security: {
    login_alerts: boolean;
    suspicious_login_block: boolean;
    recovery_email: string | null;
  };
  notifications: {
    campaign_updates: boolean;
    payment_receipts: boolean;
    creator_messages: boolean;
  };
  updated_at: string;
};

type BrandSettingsStore = {
  settings: Record<string, StoredBrandSettings>;
};

const STORE_PATH = dataStorePath("brand-settings-store.json");

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function emptyStore(): BrandSettingsStore {
  return { settings: {} };
}

async function readStoreInner(): Promise<BrandSettingsStore> {
  const parsed = await readJsonFile<BrandSettingsStore>(STORE_PATH);
  if (!parsed?.settings) {
    const seeded = emptyStore();
    await writeJsonFileAtomic(STORE_PATH, seeded);
    return seeded;
  }
  return { settings: parsed.settings ?? {} };
}

const readStore = createSerializedStoreReader(readStoreInner);

async function writeStore(store: BrandSettingsStore) {
  await writeJsonFileAtomic(STORE_PATH, store);
}

function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function settingsFromDna(value: unknown): Partial<StoredBrandSettings> {
  const dna = objectValue(value);
  return objectValue(dna.settings) as Partial<StoredBrandSettings>;
}

function defaultSettings(email: string): StoredBrandSettings {
  const normalized = normalizeEmail(email);
  return {
    brand_email: normalized,
    contact_email: normalized,
    phone: "+1 415-555-0199",
    custom_password: null,
    oauth: { google: true, apple: false, facebook: false },
    two_factor_enabled: false,
    devices: [],
    login_history: [],
    security: {
      login_alerts: true,
      suspicious_login_block: true,
      recovery_email: null
    },
    notifications: {
      campaign_updates: true,
      payment_receipts: true,
      creator_messages: true
    },
    updated_at: new Date().toISOString()
  };
}

function normalizeDevice(device: LoginDevice): LoginDevice {
  return {
    ...device,
    device_name: device.device_name ?? device.label?.split(" · ")[0] ?? "Device",
    browser: device.browser ?? "Browser"
  };
}

async function getDatabaseBrandSettings(email: string): Promise<StoredBrandSettings | null> {
  if (!hasDatabaseUrl()) return null;

  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    include: { brandProfile: true }
  });
  if (!user) return null;

  const base = defaultSettings(user.email);
  const persisted = settingsFromDna(user.brandProfile?.brandDnaJson);
  const logs = await prisma.sessionLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  const loginHistory: LoginHistoryEntry[] = logs.map((log) => ({
    id: log.id,
    at: log.createdAt.toISOString(),
    ip: log.ip ?? "unknown",
    location: log.country ?? user.country ?? "Unknown",
    device: log.device ?? log.browser ?? "Unknown device",
    success: true
  }));

  return {
    ...base,
    ...persisted,
    brand_email: user.email.toLowerCase(),
    contact_email: persisted.contact_email ?? user.email.toLowerCase(),
    phone: user.phone ?? persisted.phone ?? base.phone,
    login_history: loginHistory,
    devices: persisted.devices ?? base.devices,
    security: persisted.security ?? base.security,
    updated_at: user.brandProfile?.updatedAt.toISOString() ?? user.updatedAt.toISOString()
  };
}

async function updateDatabaseBrandSettings(
  email: string,
  updater: (current: StoredBrandSettings) => StoredBrandSettings
) {
  if (!hasDatabaseUrl()) return null;

  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    include: { brandProfile: true }
  });
  if (!user) return null;

  if (!user.brandProfile) {
    await getOrCreateBrandProfile({
      client_email: user.email,
      company_name: user.fullName?.trim() || user.email.split("@")[0] || "Brand"
    });
    const refreshed = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      include: { brandProfile: true }
    });
    if (!refreshed?.brandProfile) return null;
    user.brandProfile = refreshed.brandProfile;
  }

  const current = await getDatabaseBrandSettings(email);
  if (!current) return null;

  const next = {
    ...updater(current),
    updated_at: new Date().toISOString()
  };
  const dna = objectValue(user.brandProfile.brandDnaJson);

  await prisma.brandProfile.update({
    where: { id: user.brandProfile.id },
    data: {
      brandDnaJson: asInputJson({
        ...dna,
        settings: next
      })
    }
  });

  return next;
}

export async function getBrandSettings(email: string): Promise<StoredBrandSettings> {
  const databaseSettings = await getDatabaseBrandSettings(email);
  if (databaseSettings) return databaseSettings;

  const normalized = normalizeEmail(email);
  const store = await readStore();
  const existing = store.settings[normalized];
  if (existing) {
    return {
      ...existing,
      security: existing.security ?? defaultSettings(normalized).security
    };
  }

  const seeded = defaultSettings(normalized);
  store.settings[normalized] = seeded;
  await writeStore(store);
  return seeded;
}

export async function getBrandSettingsViewModel(
  email: string,
  sessionEmail: string
): Promise<CreatorSettingsViewModel> {
  const settings = await getBrandSettings(email);
  return {
    loginEmail: settings.brand_email || sessionEmail,
    contactEmail: settings.contact_email,
    phone: settings.phone,
    hasCustomPassword: Boolean(settings.custom_password),
    oauth: settings.oauth,
    twoFactorEnabled: settings.two_factor_enabled,
    devices: settings.devices.map(normalizeDevice),
    loginHistory: settings.login_history,
    security: settings.security ?? defaultSettings(email).security,
    pricing: {
      min_accept_budget_usd: null,
      ideal_budget_usd: null
    }
  };
}

async function updateSettings(
  email: string,
  updater: (current: StoredBrandSettings) => StoredBrandSettings
) {
  const databaseSettings = await updateDatabaseBrandSettings(email, updater);
  if (databaseSettings) return databaseSettings;

  const normalized = normalizeEmail(email);
  const store = await readStore();
  const current = store.settings[normalized] ?? defaultSettings(normalized);
  store.settings[normalized] = {
    ...updater(current),
    updated_at: new Date().toISOString()
  };
  await writeStore(store);
  return store.settings[normalized];
}

export async function updateBrandContactEmail(email: string, contactEmail: string) {
  const normalized = normalizeEmail(contactEmail);
  if (!normalized.includes("@")) {
    return { ok: false as const, error: "invalid-email" };
  }

  await updateSettings(email, (current) => ({
    ...current,
    contact_email: normalized
  }));
  return { ok: true as const };
}

export async function updateBrandPhone(email: string, phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { ok: false as const, error: "invalid-phone" };
  }

  if (hasDatabaseUrl()) {
    await prisma.user
      .update({
        where: { email: normalizeEmail(email) },
        data: { phone: trimmed }
      })
      .catch(() => null);
  }

  await updateSettings(email, (current) => ({
    ...current,
    phone: trimmed
  }));
  return { ok: true as const };
}

export async function updateBrandPassword(
  email: string,
  currentPassword: string,
  nextPassword: string
) {
  if (nextPassword.length < 8) {
    return { ok: false as const, error: "weak-password" };
  }

  if (hasDatabaseUrl()) {
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      select: { id: true, passwordHash: true }
    });
    if (user?.passwordHash) {
      if (!verifyPassword(currentPassword, user.passwordHash)) {
        return { ok: false as const, error: "wrong-password" };
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(nextPassword) }
      });
      await updateSettings(email, (current) => ({ ...current, custom_password: null }));
      return { ok: true as const };
    }
  }

  const settings = await getBrandSettings(email);
  const expected = settings.custom_password ?? DEMO_PASSWORD;
  if (currentPassword !== expected) {
    return { ok: false as const, error: "wrong-password" };
  }

  await updateSettings(email, (current) => ({
    ...current,
    custom_password: nextPassword
  }));
  return { ok: true as const };
}

export async function toggleBrandOAuth(
  email: string,
  provider: OAuthProvider,
  connected: boolean
) {
  await updateSettings(email, (current) => ({
    ...current,
    oauth: { ...current.oauth, [provider]: connected }
  }));
  return { ok: true as const };
}

export async function toggleBrandTwoFactor(email: string, enabled: boolean) {
  await updateSettings(email, (current) => ({
    ...current,
    two_factor_enabled: enabled
  }));
  return { ok: true as const };
}

export async function revokeBrandDevice(email: string, deviceId: string) {
  await updateSettings(email, (current) => ({
    ...current,
    devices: current.devices.filter((device) => device.id !== deviceId)
  }));
  return { ok: true as const };
}

export async function updateBrandSecurityPrefs(
  email: string,
  input: Partial<StoredBrandSettings["security"]>
) {
  await updateSettings(email, (current) => ({
    ...current,
    security: {
      login_alerts: input.login_alerts ?? current.security?.login_alerts ?? true,
      suspicious_login_block:
        input.suspicious_login_block ?? current.security?.suspicious_login_block ?? true,
      recovery_email:
        input.recovery_email !== undefined
          ? input.recovery_email
          : (current.security?.recovery_email ?? null)
    }
  }));
  return { ok: true as const };
}
