import { NextResponse } from "next/server";
import { loginAdminWithTotp } from "@/features/admin/auth/admin-auth.service";
import { enforceAdminLoginRateLimit } from "@/lib/auth/admin-login-rate-limit";
import { handleRouteError } from "@/lib/core/api-route";
import type { Locale } from "@/lib/i18n";

export const runtime = "nodejs";

function parseBody(body: unknown): {
  email: string;
  code: string;
  lang: Locale;
  nextPath: string;
} | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const lang = record.lang === "zh" ? "zh" : "en";
  if (typeof record.email !== "string" || typeof record.code !== "string") return null;
  return {
    email: record.email,
    code: record.code,
    lang,
    nextPath: typeof record.next === "string" ? record.next : ""
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const input = parseBody(body);
  if (!input) {
    return NextResponse.json({ ok: false, error: "email and code are required" }, { status: 400 });
  }

  try {
    await enforceAdminLoginRateLimit(request, input.email);
    const result = await loginAdminWithTotp({ request, ...input });
    if (!result.ok) {
      return NextResponse.json(result, { status: 401 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
