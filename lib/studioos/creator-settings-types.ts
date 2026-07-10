import type { Locale } from "@/lib/i18n";

export type OAuthProvider = "google" | "apple" | "facebook";

export type LoginDevice = {
  id: string;
  device_name: string;
  browser: string;
  browser_version?: string;
  os: string;
  /** @deprecated use device_name + browser */
  label?: string;
  location: string;
  last_active_at: string;
  current: boolean;
};

export type LoginHistoryEntry = {
  id: string;
  at: string;
  ip: string;
  location: string;
  device: string;
  success: boolean;
};

export type StoredApiKey = {
  id: string;
  name: string;
  prefix: string;
  secret: string;
  created_at: string;
  last_used_at: string | null;
};

export type StoredCreatorSettings = {
  creator_id: string;
  login_email: string | null;
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
    email: boolean;
    in_app: boolean;
    marketing: boolean;
  };
  timezone: string;
  currency: string;
  min_accept_budget_usd: number | null;
  ideal_budget_usd: number | null;
  preferred_locale: Locale;
  auto_accept_briefs: boolean;
  api_keys: StoredApiKey[];
  orders_paused: boolean;
  account_deleted_at: string | null;
  certification_level_up_seen_at?: string | null;
  certification_welcome_banner_dismissed_at?: string | null;
  /** Notification ids for which the creator selection celebration was shown. */
  creator_selection_celebrations_seen?: string[];
  updated_at: string;
};

export type CreatorSettingsStore = {
  settings: Record<string, StoredCreatorSettings>;
  email_aliases: Record<string, string>;
};

export type CreatorSettingsViewModel = {
  loginEmail: string;
  contactEmail: string;
  phone: string;
  hasCustomPassword: boolean;
  oauth: Record<OAuthProvider, boolean>;
  twoFactorEnabled: boolean;
  devices: LoginDevice[];
  loginHistory: LoginHistoryEntry[];
  security: StoredCreatorSettings["security"];
  pricing: {
    min_accept_budget_usd: number | null;
    ideal_budget_usd: number | null;
  };
};

export type CreatedApiKeyPayload = {
  id: string;
  name: string;
  token: string;
  prefix: string;
  created_at: string;
};
