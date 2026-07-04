import "server-only";

import { redirect } from "next/navigation";
import { alipayOAuthService } from "@/features/auth/alipay-oauth.service";
import { stashAlipayOAuthState } from "@/features/auth/oauth-state";
import { authSecurityService } from "@/features/auth/auth-security.service";
import { AUTH_ERROR_COPY } from "@/features/auth/auth-error-copy";
import type { OAuthEntryRole } from "@/features/auth/oauth-auth.service";
import { hasAlipayOAuthConfig } from "@/lib/alipay/alipay-oauth-config";
import { getAppBaseUrl } from "@/lib/app-url";
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

function loginErrorUrl(lang: Locale, entryRole: OAuthEntryRole, error: string) {
  return `/login?error=${encodeURIComponent(error)}&lang=${lang}&role=${entryRole}`;
}

export async function startOAuthSignIn(input: OAuthStartInput): Promise<string> {
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

    const statePayload = {
      provider: "alipay" as const,
      entryRole,
      lang,
      nextPath
    };
    await stashAlipayOAuthState(statePayload);
    return alipayOAuthService.buildAuthorizeUrl(statePayload);
  }

  if (provider !== "google") {
    return loginErrorUrl(lang, entryRole, AUTH_ERROR_COPY.oauthFailed);
  }

  const callbackUrl = new URL(`${getAppBaseUrl()}/auth/callback`);
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
  redirect(await startOAuthSignIn(input));
}
