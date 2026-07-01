import { randomBytes } from "node:crypto";
import { DEMO_PASSWORD, DEMO_USERS } from "@/lib/demo-auth";
import { getCreatorIdForDemoEmail } from "@/lib/creator-session";
import type { Creator } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import {
  createSerializedStoreReader,
  readJsonFile,
  writeJsonFileAtomic
} from "@/lib/json-file-store";
import { resolveGeoLocation } from "@/lib/studioos/geo-from-ip";
import type {
  CreatedApiKeyPayload,
  CreatorSettingsStore,
  CreatorSettingsViewModel,
  LoginDevice,
  LoginHistoryEntry,
  OAuthProvider,
  StoredApiKey,
  StoredCreatorSettings
} from "@/lib/studioos/creator-settings-types";
import { dataStorePath } from "@/lib/serverless-store";

const STORE_PATH = dataStorePath("creator-settings-store.json");
const MAX_DEVICES = 8;
const MAX_LOGIN_HISTORY = 20;

function emptyStore(): CreatorSettingsStore {
  return { settings: {}, email_aliases: {} };
}

async function readStoreInner(): Promise<CreatorSettingsStore> {
  const parsed = await readJsonFile<CreatorSettingsStore>(STORE_PATH);
  if (!parsed?.settings) {
    const seeded = emptyStore();
    await writeJsonFileAtomic(STORE_PATH, seeded);
    return seeded;
  }
  return {
    settings: parsed.settings ?? {},
    email_aliases: parsed.email_aliases ?? {}
  };
}

const readStore = createSerializedStoreReader(readStoreInner);

async function writeStore(store: CreatorSettingsStore) {
  await writeJsonFileAtomic(STORE_PATH, store);
}

function defaultContactEmail(creator: Creator) {
  if (creator.email.includes("nova")) {
    return "hello@novamotion.studio";
  }
  return creator.email;
}

function defaultPhone(creator: Creator) {
  if (creator.country === "South Korea") {
    return "+82 10-1234-5678";
  }
  if (creator.country === "Spain") {
    return "+34 612 345 678";
  }
  return "+1 415-555-0100";
}

function defaultTimezone(creator: Creator) {
  if (creator.country === "South Korea") {
    return "Asia/Seoul";
  }
  if (creator.country === "Spain") {
    return "Europe/Madrid";
  }
  return "America/Los_Angeles";
}

function defaultSettings(creatorId: string, creator: Creator): StoredCreatorSettings {
  const now = new Date().toISOString();
  return {
    creator_id: creatorId,
    login_email: null,
    contact_email: defaultContactEmail(creator),
    phone: defaultPhone(creator),
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
    notifications: { email: true, in_app: true, marketing: false },
    timezone: defaultTimezone(creator),
    currency: "USD",
    preferred_locale: "en",
    auto_accept_briefs: false,
    api_keys: [],
    orders_paused: false,
    account_deleted_at: null,
    certification_level_up_seen_at: null,
    certification_welcome_banner_dismissed_at: null,
    updated_at: now
  };
}

export function parseUserAgent(userAgent: string) {
  const ua = userAgent || "Unknown";
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /Chrome/i.test(ua)
      ? "Chrome"
      : /Safari/i.test(ua)
        ? "Safari"
        : /Firefox/i.test(ua)
          ? "Firefox"
          : "Browser";
  const os = /Mac OS X/i.test(ua)
    ? "macOS"
    : /Windows/i.test(ua)
      ? "Windows"
      : /Android/i.test(ua)
        ? "Android"
        : /iPhone|iPad/i.test(ua)
          ? "iOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Unknown";

  let deviceName = "Unknown device";
  if (/iPhone/i.test(ua)) {
    deviceName = "iPhone";
  } else if (/iPad/i.test(ua)) {
    deviceName = "iPad";
  } else if (/Mac OS X/i.test(ua)) {
    deviceName = "MacBook Pro";
  } else if (/Windows/i.test(ua)) {
    deviceName = "Windows PC";
  } else if (/Android/i.test(ua)) {
    deviceName = "Android Phone";
  } else if (/Linux/i.test(ua)) {
    deviceName = "Linux PC";
  }

  const versionMatch =
    ua.match(/Chrome\/(\d+)/) ??
    ua.match(/Version\/(\d+)/) ??
    ua.match(/Firefox\/(\d+)/) ??
    ua.match(/Edg\/(\d+)/);
  const browserVersion = versionMatch?.[1];
  const browserLabel = browserVersion ? `${browser} ${browserVersion}` : browser;

  return {
    browser,
    browserVersion,
    browserLabel,
    os,
    deviceName,
    label: `${deviceName} · ${browserLabel}`
  };
}

function normalizeDevice(device: LoginDevice): LoginDevice {
  return {
    ...device,
    device_name: device.device_name ?? device.label?.split(" · ")[0] ?? "Device",
    browser: device.browser ?? "Browser"
  };
}

export async function resolveCreatorIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  const store = await readStore();

  if (store.email_aliases[normalized]) {
    return store.email_aliases[normalized];
  }

  const fromDemo = getCreatorIdForDemoEmail(normalized);
  if (fromDemo) {
    return fromDemo;
  }

  for (const settings of Object.values(store.settings)) {
    if (settings.login_email?.toLowerCase() === normalized) {
      return settings.creator_id;
    }
  }

  return null;
}

export async function getStoredCreatorSettings(creatorId: string): Promise<StoredCreatorSettings | null> {
  const store = await readStore();
  return store.settings[creatorId] ?? null;
}

export async function getCreatorSettings(
  creatorId: string,
  creator: Creator
): Promise<StoredCreatorSettings> {
  const store = await readStore();
  const existing = store.settings[creatorId];
  if (existing) {
    return {
      ...existing,
      security: existing.security ?? {
        login_alerts: true,
        suspicious_login_block: true,
        recovery_email: null
      }
    };
  }

  const seeded = defaultSettings(creatorId, creator);
  store.settings[creatorId] = seeded;
  await writeStore(store);
  return seeded;
}

export async function isCreatorAccountDeleted(creatorId: string): Promise<boolean> {
  const settings = await getStoredCreatorSettings(creatorId);
  return Boolean(settings?.account_deleted_at);
}

export async function getCreatorSettingsViewModel(
  creatorId: string,
  creator: Creator,
  sessionEmail: string
): Promise<CreatorSettingsViewModel> {
  const settings = await getCreatorSettings(creatorId, creator);
  return {
    loginEmail: settings.login_email ?? sessionEmail,
    contactEmail: settings.contact_email,
    phone: settings.phone,
    hasCustomPassword: Boolean(settings.custom_password),
    oauth: settings.oauth,
    twoFactorEnabled: settings.two_factor_enabled,
    devices: settings.devices.map(normalizeDevice),
    loginHistory: settings.login_history,
    security: settings.security ?? {
      login_alerts: true,
      suspicious_login_block: true,
      recovery_email: null
    }
  };
}

async function updateSettings(
  creatorId: string,
  creator: Creator,
  updater: (current: StoredCreatorSettings) => StoredCreatorSettings
) {
  const store = await readStore();
  const current = store.settings[creatorId] ?? defaultSettings(creatorId, creator);
  store.settings[creatorId] = {
    ...updater(current),
    updated_at: new Date().toISOString()
  };
  await writeStore(store);
  return store.settings[creatorId];
}

export async function updateCreatorLoginEmail(
  creatorId: string,
  creator: Creator,
  nextEmail: string,
  previousSessionEmail: string
) {
  const normalized = nextEmail.trim().toLowerCase();
  if (!normalized.includes("@")) {
    return { ok: false as const, error: "invalid-email" };
  }

  const store = await readStore();
  const taken =
    DEMO_USERS.some((user) => user.email === normalized && getCreatorIdForDemoEmail(user.email) !== creatorId) ||
    Object.entries(store.email_aliases).some(
      ([email, id]) => email === normalized && id !== creatorId
    );

  if (taken) {
    return { ok: false as const, error: "email-taken" };
  }

  for (const [email] of Object.entries(store.email_aliases)) {
    if (email === previousSessionEmail.trim().toLowerCase()) {
      delete store.email_aliases[email];
    }
  }

  store.email_aliases[normalized] = creatorId;
  const current = store.settings[creatorId] ?? defaultSettings(creatorId, creator);
  store.settings[creatorId] = {
    ...current,
    login_email: normalized,
    updated_at: new Date().toISOString()
  };
  await writeStore(store);
  return { ok: true as const, email: normalized };
}

export async function updateCreatorContactEmail(
  creatorId: string,
  creator: Creator,
  contactEmail: string
) {
  const normalized = contactEmail.trim().toLowerCase();
  if (!normalized.includes("@")) {
    return { ok: false as const, error: "invalid-email" };
  }

  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    contact_email: normalized
  }));
  return { ok: true as const };
}

export async function updateCreatorPhone(creatorId: string, creator: Creator, phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { ok: false as const, error: "invalid-phone" };
  }

  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    phone: trimmed
  }));
  return { ok: true as const };
}

export async function updateCreatorPassword(
  creatorId: string,
  creator: Creator,
  currentPassword: string,
  nextPassword: string
) {
  if (nextPassword.length < 8) {
    return { ok: false as const, error: "weak-password" };
  }

  const settings = await getCreatorSettings(creatorId, creator);
  const expected = settings.custom_password ?? DEMO_PASSWORD;
  if (currentPassword !== expected) {
    return { ok: false as const, error: "wrong-password" };
  }

  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    custom_password: nextPassword
  }));
  return { ok: true as const };
}

export async function toggleCreatorOAuth(
  creatorId: string,
  creator: Creator,
  provider: OAuthProvider,
  connected: boolean
) {
  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    oauth: { ...current.oauth, [provider]: connected }
  }));
  return { ok: true as const };
}

export async function toggleCreatorTwoFactor(
  creatorId: string,
  creator: Creator,
  enabled: boolean
) {
  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    two_factor_enabled: enabled
  }));
  return { ok: true as const };
}

export async function updateCreatorNotifications(
  creatorId: string,
  creator: Creator,
  notifications: Partial<StoredCreatorSettings["notifications"]>
) {
  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    notifications: { ...current.notifications, ...notifications }
  }));
  return { ok: true as const };
}

export async function updateCreatorLocalePrefs(
  creatorId: string,
  creator: Creator,
  input: { timezone?: string; currency?: string; preferred_locale?: Locale }
) {
  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    timezone: input.timezone ?? current.timezone,
    currency: input.currency ?? current.currency,
    preferred_locale: input.preferred_locale ?? current.preferred_locale
  }));
  return { ok: true as const };
}

export async function updateCreatorWorkflowPrefs(
  creatorId: string,
  creator: Creator,
  autoAcceptBriefs: boolean
) {
  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    auto_accept_briefs: autoAcceptBriefs
  }));
  return { ok: true as const };
}

export async function toggleCreatorOrdersPaused(
  creatorId: string,
  creator: Creator,
  paused: boolean
) {
  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    orders_paused: paused
  }));
  return { ok: true as const };
}

export async function revokeCreatorDevice(
  creatorId: string,
  creator: Creator,
  deviceId: string
) {
  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    devices: current.devices.filter((device) => device.id !== deviceId)
  }));
  return { ok: true as const };
}

export async function createCreatorApiKey(
  creatorId: string,
  creator: Creator,
  name: string
): Promise<{ ok: true; key: CreatedApiKeyPayload } | { ok: false; error: string }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "missing-name" };
  }

  const token = `sk_studio_${randomBytes(24).toString("hex")}`;
  const prefix = `${token.slice(0, 16)}…`;
  const apiKey: StoredApiKey = {
    id: `key_${randomBytes(8).toString("hex")}`,
    name: trimmed,
    prefix,
    secret: token,
    created_at: new Date().toISOString(),
    last_used_at: null
  };

  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    api_keys: [apiKey, ...current.api_keys]
  }));

  return {
    ok: true,
    key: {
      id: apiKey.id,
      name: apiKey.name,
      token,
      prefix: apiKey.prefix,
      created_at: apiKey.created_at
    }
  };
}

export async function revokeCreatorApiKey(creatorId: string, creator: Creator, keyId: string) {
  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    api_keys: current.api_keys.filter((key) => key.id !== keyId)
  }));
  return { ok: true as const };
}

export async function deleteCreatorAccount(creatorId: string, creator: Creator) {
  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    account_deleted_at: new Date().toISOString(),
    orders_paused: true
  }));
  return { ok: true as const };
}

export async function updateCreatorSecurityPrefs(
  creatorId: string,
  creator: Creator,
  input: Partial<StoredCreatorSettings["security"]>
) {
  await updateSettings(creatorId, creator, (current) => ({
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

export async function recordCreatorLogin(
  creatorId: string,
  creator: Creator,
  meta: { userAgent: string; ip: string; success?: boolean }
) {
  const parsed = parseUserAgent(meta.userAgent);
  const now = new Date().toISOString();
  const location = await resolveGeoLocation(meta.ip, creator.country);

  await updateSettings(creatorId, creator, (current) => {
    const historyEntry: LoginHistoryEntry = {
      id: `login_${randomBytes(6).toString("hex")}`,
      at: now,
      ip: meta.ip || "unknown",
      location,
      device: `${parsed.deviceName} · ${parsed.browserLabel}`,
      success: meta.success ?? true
    };

    const devices = current.devices.map(normalizeDevice).map((device) => ({ ...device, current: false }));
    const existingIndex = devices.findIndex(
      (device) => device.browser === parsed.browser && device.os === parsed.os
    );

    const nextDevice: LoginDevice = {
      id:
        existingIndex >= 0
          ? devices[existingIndex].id
          : `device_${randomBytes(6).toString("hex")}`,
      device_name: parsed.deviceName,
      browser: parsed.browser,
      browser_version: parsed.browserVersion,
      os: parsed.os,
      label: parsed.label,
      location,
      last_active_at: now,
      current: true
    };

    const nextDevices =
      existingIndex >= 0
        ? devices.map((device, index) => (index === existingIndex ? nextDevice : device))
        : [nextDevice, ...devices];

    return {
      ...current,
      security: current.security ?? {
        login_alerts: true,
        suspicious_login_block: true,
        recovery_email: null
      },
      devices: nextDevices.slice(0, MAX_DEVICES),
      login_history: [historyEntry, ...current.login_history].slice(0, MAX_LOGIN_HISTORY)
    };
  });
}

export async function authenticateDemoCreatorEmail(
  email: string,
  password: string
): Promise<{ creatorId: string; role: "creator"; label: string; email: string } | null> {
  const normalized = email.trim().toLowerCase();
  const creatorId = await resolveCreatorIdByEmail(normalized);
  if (!creatorId) {
    return null;
  }

  const baseCreator = DEMO_USERS.find(
    (user) => getCreatorIdForDemoEmail(user.email) === creatorId && user.role === "creator"
  );
  if (!baseCreator && !(await getStoredCreatorSettings(creatorId))?.login_email) {
    return null;
  }

  const { creators } = await import("@/lib/data");
  const seed = creators.find((item) => item.id === creatorId);
  if (!seed) {
    return null;
  }

  const settings = await getCreatorSettings(creatorId, seed);
  if (settings.account_deleted_at) {
    return null;
  }

  const expectedPassword = settings.custom_password ?? DEMO_PASSWORD;
  if (password !== expectedPassword) {
    return null;
  }

  return {
    creatorId,
    role: "creator",
    label: baseCreator?.label ?? seed.name,
    email: normalized
  };
}

export async function verifyCreatorPassword(
  creatorId: string,
  creator: Creator,
  password: string
) {
  const settings = await getCreatorSettings(creatorId, creator);
  const expected = settings.custom_password ?? DEMO_PASSWORD;
  return password === expected;
}

export async function hasSeenCertificationLevelUp(creatorId: string): Promise<boolean> {
  const settings = await getStoredCreatorSettings(creatorId);
  return Boolean(settings?.certification_level_up_seen_at);
}

export async function markCertificationLevelUpSeen(creatorId: string, creator: Creator) {
  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    certification_level_up_seen_at: new Date().toISOString()
  }));
  return { ok: true as const };
}

export async function hasDismissedCertificationWelcomeBanner(creatorId: string): Promise<boolean> {
  const settings = await getStoredCreatorSettings(creatorId);
  return Boolean(settings?.certification_welcome_banner_dismissed_at);
}

export async function dismissCertificationWelcomeBanner(creatorId: string, creator: Creator) {
  await updateSettings(creatorId, creator, (current) => ({
    ...current,
    certification_welcome_banner_dismissed_at: new Date().toISOString()
  }));
  return { ok: true as const };
}
