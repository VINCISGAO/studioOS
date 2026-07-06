import { NextResponse } from "next/server";
import { performSignIn } from "@/lib/auth/sign-in-service";
import type { Locale } from "@/lib/i18n";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const record = body as Record<string, unknown>;
  const email = typeof record.email === "string" ? record.email : "";
  const password = typeof record.password === "string" ? record.password : "";
  const lang: Locale = record.lang === "zh" ? "zh" : "en";
  const expectedRole =
    record.expected_role === "creator" ? "creator" : record.expected_role === "brand" ? "brand" : "";
  const nextPath = typeof record.next === "string" ? record.next : "";

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "email and password are required" } },
      { status: 422, headers: NO_STORE_HEADERS }
    );
  }

  const result = await performSignIn({ email, password, lang, expectedRole, nextPath });
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: result.error } },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: { redirectTo: result.redirectTo }
    },
    { headers: NO_STORE_HEADERS }
  );
}
