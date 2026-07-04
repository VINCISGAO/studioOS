import "server-only";

import crypto from "node:crypto";
import type { OAuthEntryRole } from "@/features/auth/oauth-auth.service";
import type { Locale } from "@/lib/i18n";

export type OAuthStatePayload = {
  provider: "alipay";
  entryRole: OAuthEntryRole;
  lang: Locale;
  nextPath: string;
};

function oauthStateSecret() {
  return (
    process.env.AUTH_SECURITY_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "studioos-dev-oauth-state-secret"
  );
}

function signPayload(encoded: string) {
  return crypto.createHmac("sha256", oauthStateSecret()).update(encoded).digest("base64url");
}

export function encodeOAuthState(payload: OAuthStatePayload) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function decodeOAuthState(raw: string | null | undefined): OAuthStatePayload | null {
  if (!raw?.includes(".")) return null;
  const [encoded, signature] = raw.split(".", 2);
  if (!encoded || !signature) return null;
  if (signPayload(encoded) !== signature) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OAuthStatePayload;
    if (parsed.provider !== "alipay") return null;
    if (parsed.entryRole !== "brand" && parsed.entryRole !== "creator") return null;
    if (parsed.lang !== "zh" && parsed.lang !== "en") return null;
    if (typeof parsed.nextPath !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
