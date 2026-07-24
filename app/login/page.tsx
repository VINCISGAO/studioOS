import { redirect } from "next/navigation";
import { LoginPageShell } from "@/components/studioos/login-page-shell";
import { isDemoLoginUiEnabled } from "@/lib/can-persist-local-store";
import { resolveSafePostLoginDestination, toSafeNextPath } from "@/lib/auth/post-login-redirect";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { getAppLanguage } from "@/lib/app-language";
import { toUiLocale } from "@/lib/app-language.shared";
import { getLanguageCode, isChineseLanguage, type SearchParams, withLocale } from "@/lib/i18n";
import { loginCopy } from "@/lib/marketing/login-copy.resolver";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import { getCurrentSession } from "@/lib/session-user";
import type { LoginRole } from "@/lib/studioos/login-theme";

type LoginPageProps = {
  searchParams: Promise<SearchParams & { error?: string; site?: string; role?: string; next?: string; email?: string }>;
};

function resolveLoginRole(raw?: string): LoginRole {
  return raw === "creator" ? "creator" : "brand";
}

function resolveLoginErrorMessage(
  rawError: string | undefined,
  t: { configError: string; unsupported: string; wrongRoleHint: string }
) {
  if (!rawError) {
    return undefined;
  }
  if (rawError === "auth-config") {
    return t.configError;
  }
  if (rawError === "unsupported-provider") {
    return t.unsupported;
  }
  if (rawError === "wrong-role" || rawError === "admin-required") {
    return t.wrongRoleHint;
  }
  try {
    return decodeURIComponent(rawError.replace(/\+/g, " "));
  } catch {
    return rawError;
  }
}

function resolveLoginErrorCode(rawError: string | undefined) {
  if (
    rawError === "wrong-role" ||
    rawError === "auth-config" ||
    rawError === "unsupported-provider" ||
    rawError === "admin-required"
  ) {
    return rawError;
  }
  return undefined;
}

function resolveNextPath(raw: SearchParams["next"]) {
  const value = typeof raw === "string" ? raw : Array.isArray(raw) ? (raw[0] ?? "") : "";
  if (!value) {
    return "";
  }

  try {
    return toSafeNextPath(decodeURIComponent(value.replace(/\+/g, " ")));
  } catch {
    return toSafeNextPath(value);
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const languageCode = params.lang ? getLanguageCode(params) : await getAppLanguage();
  const locale = isChineseLanguage(languageCode) ? "zh" : toUiLocale("en");
  const t = loginCopy(languageCode);
  const nextPath = resolveNextPath(params.next);
  const rawError = typeof params.error === "string" ? params.error : undefined;
  const session = await getCurrentSession();
  const role = resolveLoginRole(typeof params.role === "string" ? params.role : undefined);

  const demoMode = isDemoLoginUiEnabled();
  const googleOAuthEnabled = hasSupabaseConfig();
  const googleOneTapClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

  if (session && (session.role === "client" || session.role === "creator") && !rawError) {
    const creatorId = session.role === "creator" ? await getCurrentCreatorId() : null;
    redirect(
      resolveSafePostLoginDestination({
        session,
        requestedPath: nextPath,
        locale,
        creatorPortalReady: session.role !== "creator" || Boolean(creatorId)
      })
    );
  }

  const initialEmail = typeof params.email === "string" ? params.email : "";
  const errorCode = resolveLoginErrorCode(rawError);
  const error = resolveLoginErrorMessage(rawError, t);

  return (
    <LoginPageShell
      locale={locale}
      role={role}
      nextPath={nextPath}
      initialEmail={initialEmail}
      error={error}
      errorCode={errorCode}
      demoMode={demoMode}
      googleOAuthEnabled={googleOAuthEnabled}
      googleOneTapClientId={googleOneTapClientId}
      t={t}
    />
  );
}
