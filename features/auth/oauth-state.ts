import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { OAuthEntryRole } from "@/features/auth/oauth-auth.service";
import { getAppBaseUrl } from "@/lib/app-url";
import type { Locale } from "@/lib/i18n";

export type OAuthStatePayload = {
  provider: "alipay";
  entryRole: OAuthEntryRole;
  lang: Locale;
  nextPath: string;
};

/** Alipay `state` must be base64url-only and <= 100 chars (no dots). */
const ALIPAY_STATE_MAX_LEN = 100;
const ALIPAY_STATE_SIG_LEN = 16;
export const ALIPAY_OAUTH_PENDING_COOKIE = "studioos_alipay_oauth";
const ALIPAY_OAUTH_PENDING_MAX_AGE_SEC = 600;

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

function alipayStateSignature(encoded: string) {
  return signPayload(encoded).slice(0, ALIPAY_STATE_SIG_LEN);
}

function compactAlipayPlain(payload: OAuthStatePayload, includeNextPath: boolean) {
  const roleChar = payload.entryRole === "creator" ? "c" : "b";
  const langChar = payload.lang === "zh" ? "z" : "e";
  const nextPath =
    includeNextPath && payload.nextPath.startsWith("/") ? payload.nextPath.slice(0, 48) : "";
  return `${roleChar}${langChar}${nextPath}`;
}

function parseCompactAlipayPlain(plain: string): OAuthStatePayload | null {
  if (plain.length < 2) return null;
  const entryRole = plain[0] === "c" ? "creator" : plain[0] === "b" ? "brand" : null;
  const lang = plain[1] === "z" ? "zh" : plain[1] === "e" ? "en" : null;
  if (!entryRole || !lang) return null;
  const nextPath = plain.slice(2);
  if (nextPath && !nextPath.startsWith("/")) return null;
  return { provider: "alipay", entryRole, lang, nextPath };
}

/** Encode OAuth state for Alipay authorize URL. */
export function encodeAlipayOAuthState(payload: OAuthStatePayload) {
  for (const includeNextPath of [true, false] as const) {
    const encoded = Buffer.from(compactAlipayPlain(payload, includeNextPath), "utf8").toString("base64url");
    const state = `${encoded}${alipayStateSignature(encoded)}`;
    if (state.length <= ALIPAY_STATE_MAX_LEN && /^[A-Za-z0-9_-]+$/.test(state)) {
      return state;
    }
  }

  throw new Error("Alipay OAuth state exceeds allowed length");
}

export function decodeAlipayOAuthState(raw: string | null | undefined): OAuthStatePayload | null {
  if (!raw || raw.length > ALIPAY_STATE_MAX_LEN || !/^[A-Za-z0-9_-]+$/.test(raw)) {
    return null;
  }
  if (raw.length <= ALIPAY_STATE_SIG_LEN) return null;

  const encoded = raw.slice(0, -ALIPAY_STATE_SIG_LEN);
  const signature = raw.slice(-ALIPAY_STATE_SIG_LEN);
  if (!encoded || alipayStateSignature(encoded) !== signature) return null;

  try {
    const plain = Buffer.from(encoded, "base64url").toString("utf8");
    return parseCompactAlipayPlain(plain);
  } catch {
    return null;
  }
}

/** Legacy encoder kept for backwards compatibility during rollout. */
export function encodeOAuthState(payload: OAuthStatePayload) {
  return encodeAlipayOAuthState(payload);
}

export function encodeAlipayOAuthPendingCookie(payload: OAuthStatePayload) {
  return encodeAlipayOAuthState(payload);
}

export function alipayOAuthPendingCookieOptions(request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    maxAge: ALIPAY_OAUTH_PENDING_MAX_AGE_SEC,
    path: "/"
  };
}

/** @deprecated Prefer setting cookie on the redirect Response in the OAuth API route. */
export async function stashAlipayOAuthState(payload: OAuthStatePayload, request?: Request) {
  const cookieStore = await cookies();
  const secureRequest = request ?? new Request(getAppBaseUrl());
  cookieStore.set(
    ALIPAY_OAUTH_PENDING_COOKIE,
    encodeAlipayOAuthPendingCookie(payload),
    alipayOAuthPendingCookieOptions(secureRequest)
  );
}

export async function consumeAlipayOAuthState(
  urlState: string | null | undefined
): Promise<OAuthStatePayload | null> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(ALIPAY_OAUTH_PENDING_COOKIE)?.value;
  cookieStore.delete(ALIPAY_OAUTH_PENDING_COOKIE);

  if (fromCookie) {
    const decoded = decodeAlipayOAuthState(fromCookie);
    if (decoded) return decoded;
  }

  return decodeOAuthState(urlState);
}

export function decodeOAuthState(raw: string | null | undefined): OAuthStatePayload | null {
  const alipay = decodeAlipayOAuthState(raw);
  if (alipay) return alipay;

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
