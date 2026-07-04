import { NextResponse } from "next/server";
import { AUTH_ERROR_COPY } from "@/features/auth/auth-error-copy";
import { authSecurityService } from "@/features/auth/auth-security.service";
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
    const result = await authSecurityService.loginWithEmailCode({
      request,
      email,
      code: body.code,
      role: parseRole(body?.role),
      locale,
      nextPath: typeof body?.next === "string" ? body.next : "",
      turnstileToken: body.turnstileToken
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  return NextResponse.json({ ok: false, error: AUTH_ERROR_COPY.securityFailed }, { status: 400 });
}
