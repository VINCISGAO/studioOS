import { NextResponse } from "next/server";
import { finishAdminPasskeyLogin } from "@/features/admin/auth/admin-webauthn.service";
import { handleRouteError } from "@/lib/core/api-route";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import type { Locale } from "@/lib/i18n";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const email = typeof record?.email === "string" ? record.email : "";
  const response = record?.response as AuthenticationResponseJSON | undefined;
  const locale: Locale = record?.lang === "zh" ? "zh" : "en";
  const nextPath = typeof record?.next === "string" ? record.next : "";

  if (!email || !response) {
    return NextResponse.json({ ok: false, error: "login_failed" }, { status: 401 });
  }

  try {
    const result = await finishAdminPasskeyLogin({ request, email, response, locale, nextPath });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: "login_failed" }, { status: 401 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
