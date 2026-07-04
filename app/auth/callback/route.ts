import { NextResponse } from "next/server";
import {
  completeOAuthSignIn,
  oauthFailureRedirect,
  type OAuthEntryRole
} from "@/features/auth/oauth-auth.service";
import { attachDemoSessionCookie } from "@/lib/demo-auth-server";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";

function resolveOAuthEntryRole(raw: string | null): OAuthEntryRole {
  return raw === "creator" ? "creator" : "brand";
}

function resolveOAuthLocale(raw: string | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const entryRole = resolveOAuthEntryRole(requestUrl.searchParams.get("role"));
  const lang = resolveOAuthLocale(requestUrl.searchParams.get("lang"));
  const nextPath = requestUrl.searchParams.get("next") ?? "";
  const oauthError =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(oauthFailureRedirect(oauthError, entryRole, lang), request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        oauthFailureRedirect("OAuth sign-in was interrupted. Please try again.", entryRole, lang),
        request.url
      )
    );
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(oauthFailureRedirect(exchangeError.message, entryRole, lang), request.url)
    );
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(
      new URL(
        oauthFailureRedirect("Google did not return an email address for this account.", entryRole, lang),
        request.url
      )
    );
  }

  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    user.email.split("@")[0] ||
    user.email;

  try {
    const { redirectTo, demoSession } = await completeOAuthSignIn({
      email: user.email,
      fullName,
      supabaseUserId: user.id,
      entryRole,
      lang,
      nextPath
    });

    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    attachDemoSessionCookie(response, demoSession);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to complete Google sign-in. Please try again.";
    return NextResponse.redirect(new URL(oauthFailureRedirect(message, entryRole, lang), request.url));
  }
}
