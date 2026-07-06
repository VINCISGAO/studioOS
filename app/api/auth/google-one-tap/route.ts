import { NextResponse } from "next/server";
import {
  completeOAuthSignIn,
  oauthFailureRedirect,
  type OAuthEntryRole
} from "@/features/auth/oauth-auth.service";
import { attachDemoSessionCookie } from "@/lib/demo-auth-server";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";

export const runtime = "nodejs";

function resolveOAuthEntryRole(raw: unknown): OAuthEntryRole {
  return raw === "creator" ? "creator" : "brand";
}

function resolveOAuthLocale(raw: unknown): Locale {
  return raw === "zh" ? "zh" : "en";
}

function resolveNextPath(raw: unknown) {
  return typeof raw === "string" && raw.startsWith("/") ? raw : "";
}

function errorResponse(message: string, entryRole: OAuthEntryRole, lang: Locale) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      redirectTo: oauthFailureRedirect(message, entryRole, lang)
    },
    { status: 400, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    credential?: unknown;
    role?: unknown;
    lang?: unknown;
    next?: unknown;
  } | null;
  const entryRole = resolveOAuthEntryRole(body?.role);
  const lang = resolveOAuthLocale(body?.lang);
  const nextPath = resolveNextPath(body?.next);
  const credential = typeof body?.credential === "string" ? body.credential.trim() : "";

  if (!credential) {
    return errorResponse("Google One Tap did not return a credential.", entryRole, lang);
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: credential
  });

  if (signInError) {
    return errorResponse(signInError.message, entryRole, lang);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return errorResponse("Google did not return an email address for this account.", entryRole, lang);
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

    const response = NextResponse.json(
      { ok: true, redirectTo },
      { headers: { "Cache-Control": "no-store" } }
    );
    attachDemoSessionCookie(response, demoSession);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to complete Google sign-in. Please try again.";
    return errorResponse(message, entryRole, lang);
  }
}
