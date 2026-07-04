import { NextResponse } from "next/server";
import {
  listAdminAccountsForMaster,
  provisionAdminAccount
} from "@/features/admin/auth/admin-user-provision.service";
import {
  requireMasterAdminMutation
} from "@/features/admin/auth/admin-api-guard";
import { handleRouteError } from "@/lib/core/api-route";
import type { Locale } from "@/lib/i18n";

export const runtime = "nodejs";

function parseLocale(raw: unknown): Locale {
  return raw === "zh" ? "zh" : "en";
}

function resolveOrigin(request: Request) {
  const origin = request.headers.get("origin")?.trim();
  if (origin) return origin;
  const referer = request.headers.get("referer")?.trim();
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return "";
    }
  }
  return new URL(request.url).origin;
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "step_up_required" }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    await requireMasterAdminMutation(request);
  } catch (error) {
    return handleRouteError(error);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const locale = parseLocale(record?.lang);
  const totpCode = typeof record?.totpCode === "string" ? record.totpCode : "";

  if (record?.action === "list") {
    const result = await listAdminAccountsForMaster(request, totpCode);
    if (!result.ok) {
      const status =
        result.error === "step_up_required" ? 403 : result.error === "invalid_totp" ? 401 : 403;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json(result);
  }

  if (!record || typeof record.email !== "string" || !totpCode) {
    return NextResponse.json({ ok: false, error: "email and totpCode are required" }, { status: 400 });
  }

  const result = await provisionAdminAccount({
    request,
    email: record.email,
    fullName: typeof record.fullName === "string" ? record.fullName : "",
    totpCode,
    locale,
    origin: resolveOrigin(request)
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.error.includes("验证") || result.error.includes("authenticator") ? 401 : 403 });
  }

  return NextResponse.json(result);
}
