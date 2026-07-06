import "server-only";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { alipayOAuthService } from "@/features/auth/alipay-oauth.service";
import {
  ALIPAY_OAUTH_PENDING_COOKIE,
  alipayOAuthPendingCookieOptions,
  encodeAlipayOAuthPendingCookie,
  type OAuthStatePayload
} from "@/features/auth/oauth-state";
import { authSecurityService } from "@/features/auth/auth-security.service";
import { AUTH_ERROR_COPY } from "@/features/auth/auth-error-copy";
import type { OAuthEntryRole } from "@/features/auth/oauth-auth.service";
import { hasAlipayOAuthConfig } from "@/lib/alipay/alipay-oauth-config";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export type OAuthProvider = "google" | "apple" | "alipay" | "wechat" | "qq";

export type OAuthStartInput = {
  request: Request;
  provider: OAuthProvider;
  lang: Locale;
  entryRole: OAuthEntryRole;
  nextPath: string;
};

export type AlipayOAuthStartResult = {
  kind: "alipay";
  authorizeUrl: string;
  pendingCookie: string;
};

export type OAuthStartResult = string | AlipayOAuthStartResult;

function loginErrorUrl(lang: Locale, entryRole: OAuthEntryRole, error: string) {
  return `/login?error=${encodeURIComponent(error)}&lang=${lang}&role=${entryRole}`;
}

function resolveOAuthCallbackUrl(request: Request) {
  const requestUrl = new URL(request.url);
  const configuredAppUrl =
    process.env.VINCIS_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredAppUrl) {
    const normalized = configuredAppUrl.startsWith("http")
      ? configuredAppUrl
      : `https://${configuredAppUrl}`;
    return new URL("/auth/callback", normalized);
  }

  if (process.env.VERCEL === "1") {
    return new URL("/auth/callback", "https://vincis.app");
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const protocol = forwardedProto || requestUrl.protocol.replace(/:$/, "");
  const host = forwardedHost || requestUrl.host;

  return new URL("/auth/callback", `${protocol}://${host}`);
}

export async function startOAuthSignIn(input: OAuthStartInput): Promise<OAuthStartResult> {
  const { request, provider, lang, entryRole, nextPath } = input;

  const oauthGate = await authSecurityService.enforceOAuthStart({ request, provider });
  if (!oauthGate.ok) {
    return loginErrorUrl(lang, entryRole, AUTH_ERROR_COPY.oauthFailed);
  }

  if (!hasSupabaseConfig() && provider === "google") {
    return `/login?error=auth-config&lang=${lang}&role=${entryRole}`;
  }

  if (provider === "alipay") {
    if (!hasAlipayOAuthConfig() || !hasDatabaseUrl()) {
      return loginErrorUrl(lang, entryRole, AUTH_ERROR_COPY.oauthFailed);
    }

    const statePayload: OAuthStatePayload = {
      provider: "alipay",
      entryRole,
      lang,
      nextPath
    };
    return {
      kind: "alipay",
      authorizeUrl: alipayOAuthService.buildAuthorizeUrl(statePayload),
      pendingCookie: encodeAlipayOAuthPendingCookie(statePayload)
    };
  }

  if (provider !== "google") {
    return loginErrorUrl(lang, entryRole, AUTH_ERROR_COPY.oauthFailed);
  }

  const callbackUrl = resolveOAuthCallbackUrl(request);
  callbackUrl.searchParams.set("role", entryRole);
  callbackUrl.searchParams.set("lang", lang);
  if (nextPath.startsWith("/")) {
    callbackUrl.searchParams.set("next", nextPath);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        prompt: "select_account"
      }
    }
  });

  if (error || !data.url) {
    await authSecurityService.recordOAuthCallback({
      request,
      provider,
      success: false
    });
    const detail = error?.message?.trim() || AUTH_ERROR_COPY.oauthFailed;
    return loginErrorUrl(lang, entryRole, detail);
  }

  return data.url;
}

/** Used by server actions — throws redirect(). */
export async function startOAuthSignInAction(input: OAuthStartInput): Promise<never> {
  const result = await startOAuthSignIn(input);
  if (typeof result !== "string" && result.kind === "alipay") {
    const cookieStore = await cookies();
    cookieStore.set(
      ALIPAY_OAUTH_PENDING_COOKIE,
      result.pendingCookie,
      alipayOAuthPendingCookieOptions(input.request)
    );
    redirect(result.authorizeUrl);
  }
  redirect(typeof result === "string" ? result : result.authorizeUrl);
}
