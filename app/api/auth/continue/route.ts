import { NextResponse } from "next/server";
import { AUTH_ERROR_COPY, authDatabaseSetupErrorMessage } from "@/features/auth/auth-error-copy";
import { authSecurityService } from "@/features/auth/auth-security.service";
import { attachDemoSessionCookie } from "@/lib/demo-auth-server";
import type { Locale } from "@/lib/i18n";
import type { UserRole } from "@prisma/client";

export const runtime = "nodejs";

function parseLocale(value: unknown): Locale {
  return value === "zh" ? "zh" : "en";
}

function parseRole(value: unknown): UserRole {
  return value === "creator" || value === "studio" || value === "CREATOR" ? "CREATOR" : "BRAND";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    code?: string;
    role?: string;
    lang?: string;
    next?: string;
    turnstileToken?: string;
  } | null;

  const email = String(body?.email ?? "").trim();
  const locale = parseLocale(body?.lang);

  if (body?.code) {
    try {
      const result = await authSecurityService.loginWithEmailCode({
        request,
        email,
        code: body.code,
        role: parseRole(body?.role),
        locale,
        nextPath: typeof body?.next === "string" ? body.next : "",
        turnstileToken: body.turnstileToken
      });
      const response = NextResponse.json(result, { status: result.ok ? 200 : 400 });
      if (result.ok && "session" in result && result.session) {
        attachDemoSessionCookie(response, result.session);
      }
      return response;
    } catch (error) {
      const prismaCode =
        error && typeof error === "object" && "code" in error ? String((error as { code: string }).code) : "";
      const setupMessage = authDatabaseSetupErrorMessage(prismaCode, locale);
      const message =
        setupMessage ??
        (locale === "zh" ? "认证服务暂不可用，请稍后再试。" : "Authentication service unavailable.");
      return NextResponse.json({ ok: false, error: message }, { status: 503 });
    }
  }

  return NextResponse.json({ ok: false, error: AUTH_ERROR_COPY.securityFailed }, { status: 400 });
}
