export type AdminTotpAccount = {
  email: string;
  secret: string;
};

function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeSecret(secret: string) {
  return secret.replace(/\s/g, "").toUpperCase();
}

function parseAccountPairs(raw: string): AdminTotpAccount[] {
  const accounts: AdminTotpAccount[] = [];

  for (const chunk of raw.split(",")) {
    const piece = chunk.trim();
    if (!piece) continue;

    const separator = piece.indexOf(":");
    if (separator <= 0) continue;

    const email = normalizeEmail(piece.slice(0, separator));
    const secret = normalizeSecret(piece.slice(separator + 1));
    if (!email || !secret) continue;

    accounts.push({ email, secret });
  }

  return accounts;
}

/** ADMIN_TOTP_ACCOUNTS=admin@x.com:BASE32SECRET or ADMIN_LOGIN_EMAIL + ADMIN_TOTP_SECRET */
export function getAdminTotpAccounts(): AdminTotpAccount[] {
  const multi = parseAccountPairs(readEnv("ADMIN_TOTP_ACCOUNTS"));
  if (multi.length > 0) {
    return multi;
  }

  const email = normalizeEmail(readEnv("ADMIN_LOGIN_EMAIL"));
  const secret = normalizeSecret(readEnv("ADMIN_TOTP_SECRET"));
  if (email && secret) {
    return [{ email, secret }];
  }

  return [];
}

export function hasAdminTotpConfig() {
  return getAdminTotpAccounts().length > 0;
}

export function resolveAdminTotpSecret(email: string): string | null {
  const normalized = normalizeEmail(email);
  return getAdminTotpAccounts().find((account) => account.email === normalized)?.secret ?? null;
}

export function isAdminTotpEmail(email: string) {
  return resolveAdminTotpSecret(email) !== null;
}
