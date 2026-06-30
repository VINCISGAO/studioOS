import { NextResponse } from "next/server";
import { performSignIn, type SignInInput } from "@/lib/auth/sign-in-service";
import type { Locale } from "@/lib/i18n";
import { enforcePublicApiRateLimit, handleRouteError } from "@/lib/core/api-route";

export const runtime = "nodejs";

function parseBody(body: unknown): SignInInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const lang = record.lang === "zh" ? "zh" : "en";
  const expectedRole =
    record.expected_role === "creator" ? "creator" : record.expected_role === "brand" ? "brand" : "";

  if (typeof record.email !== "string" || typeof record.password !== "string") {
    return null;
  }

  return {
    email: record.email,
    password: record.password,
    lang: lang as Locale,
    expectedRole,
    nextPath: typeof record.next === "string" ? record.next : ""
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

  const result = await performSignIn(input);
  if (!result.ok) {
    return NextResponse.json(result, { status: 401 });
  }

  return NextResponse.json(result);
}
