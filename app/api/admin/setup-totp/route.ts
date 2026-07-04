import { NextResponse } from "next/server";
import {
  completeAdminSetupTotp,
  getAdminSetupTotpChallenge
} from "@/features/admin/auth/admin-setup-totp.service";
import { enforceAdminSetupTotpRateLimit } from "@/lib/auth/admin-login-rate-limit";
import { handleRouteError } from "@/lib/core/api-route";
import type { Locale } from "@/lib/i18n";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
    if (!token) {
      return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
    }

    await enforceAdminSetupTotpRateLimit(request, token);
    const result = await getAdminSetupTotpChallenge(token, request);
    if (!result.ok) {
      const status = result.error === "device_mismatch" ? 403 : 404;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const token = typeof record?.token === "string" ? record.token : "";
  const code = typeof record?.code === "string" ? record.code : "";
  const locale: Locale = record?.lang === "zh" ? "zh" : "en";

  if (!token || !code) {
    return NextResponse.json({ ok: false, error: "token_and_code_required" }, { status: 400 });
  }

  try {
    await enforceAdminSetupTotpRateLimit(request, token);
    const result = await completeAdminSetupTotp({ request, token, code, locale });
    if (!result.ok) {
      const status =
        result.error === "device_mismatch"
          ? 403
          : result.error === "invalid_totp"
            ? 401
            : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
