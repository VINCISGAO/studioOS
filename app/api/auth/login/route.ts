import { NextResponse } from "next/server";
import { performSignIn, type SignInInput } from "@/lib/auth/sign-in-service";
import { attachDemoSessionCookie } from "@/lib/demo-auth-server";
import type { Locale } from "@/lib/i18n";
import { enforcePublicApiRateLimit, handleRouteError } from "@/lib/core/api-route";
import { AUTH_ERROR_COPY } from "@/features/auth/auth-error-copy";
import { authSecurityService } from "@/features/auth/auth-security.service";

export const runtime = "nodejs";
const LOGIN_LOCKED_COPY = "登录尝试过多，请稍后再试。";

function parseBody(body: unknown): (SignInInput & { turnstileToken?: string }) | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const lang = record.lang === "zh" ? "zh" : "en";
  const expectedRole =
    record.expected_role === "admin"
      ? "admin"
      : record.expected_role === "creator"
        ? "creator"
        : record.expected_role === "brand"
          ? "brand"
          : "";

  if (typeof record.email !== "string" || typeof record.password !== "string") {
    return null;
  }

  return {
    email: record.email,
    password: record.password,
    lang: lang as Locale,
    expectedRole,
    nextPath: typeof record.next === "string" ? record.next : "",
    turnstileToken: typeof record.turnstileToken === "string" ? record.turnstileToken : undefined
  };
}

export async function POST(request: Request) {
  try {
    await enforcePublicApiRateLimit(request);
  } catch (error) {
    return handleRouteError(error);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const input = parseBody(body);
  if (!input) {
    return NextResponse.json({ ok: false, error: "email and password are required" }, { status: 400 });
  }

  if (input.expectedRole === "admin") {
    return NextResponse.json(
      {
        ok: false,
        error: input.lang === "zh" ? "登录失败，请检查账号信息。" : "Sign-in failed. Check your account details.",
        errorCode: "invalid-credentials"
      },
      { status: 403 }
    );
  }

  const loginGate = await authSecurityService.assertPasswordLoginAllowed({
    request,
    email: input.email,
    turnstileToken: input.turnstileToken
  });
  if (!loginGate.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          loginGate.error === "locked"
            ? LOGIN_LOCKED_COPY
            : AUTH_ERROR_COPY.securityFailed
      },
      { status: loginGate.error === "locked" ? 429 : 403 }
    );
  }

  const result = await performSignIn(input);
  if (!result.ok) {
    await authSecurityService.recordPasswordLoginResult({
      request,
      email: input.email,
      success: false
    });
    return NextResponse.json(
      { ok: false, error: AUTH_ERROR_COPY.credentialsInvalid, errorCode: "invalid-credentials" },
      { status: 401 }
    );
  }

  await authSecurityService.recordPasswordLoginResult({
    request,
    email: input.email,
    success: true
  });
  const response = NextResponse.json(result);
  attachDemoSessionCookie(response, result.session);
  return response;
}
