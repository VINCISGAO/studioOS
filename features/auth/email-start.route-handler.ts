import "server-only";

import { NextResponse } from "next/server";
import { authDatabaseSetupErrorMessage } from "@/features/auth/auth-error-copy";
import { authSecurityService } from "@/features/auth/auth-security.service";
import type { Locale } from "@/lib/i18n";
import type { UserRole } from "@prisma/client";

function parseLocale(value: unknown): Locale {
  return value === "zh" ? "zh" : "en";
}

function parseRole(value: unknown): UserRole {
  if (value === "creator" || value === "studio" || value === "CREATOR") {
    return "CREATOR";
  }
  return "BRAND";
}

type EmailStartResult =
  | { ok: true; message?: string; debugCode?: string }
  | { ok: false; error?: string; errorCode?: string; turnstileRequired?: boolean };

export function sanitizeEmailStartResult(
  result: EmailStartResult,
  options?: { production?: boolean }
): EmailStartResult {
  const isProduction = options?.production ?? process.env.NODE_ENV === "production";
  if (isProduction && result.ok && "debugCode" in result) {
    const { debugCode: _debugCode, ...rest } = result;
    return rest;
  }
  return result;
}

export async function handleEmailStartPost(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    lang?: string;
    role?: string;
    turnstileToken?: string;
  } | null;
  const locale = parseLocale(body?.lang);

  try {
    const result = sanitizeEmailStartResult(
      await authSecurityService.startEmailVerification({
        request,
        email: String(body?.email ?? ""),
        locale,
        role: parseRole(body?.role),
        turnstileToken: body?.turnstileToken
      })
    );

    return NextResponse.json(result, {
      status: result.ok
        ? 200
        : "errorCode" in result && result.errorCode === "wrong-role"
          ? 400
          : "turnstileRequired" in result && result.turnstileRequired
            ? 403
            : 429
    });
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
