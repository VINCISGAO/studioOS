import { NextResponse } from "next/server";
import { beginAdminPasskeyLogin } from "@/features/admin/auth/admin-webauthn.service";
import { handleRouteError } from "@/lib/core/api-route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "login_failed" }, { status: 401 });
  }

  const email = body && typeof body === "object" ? String((body as Record<string, unknown>).email ?? "") : "";
  if (!email.trim()) {
    return NextResponse.json({ ok: false, error: "login_failed" }, { status: 401 });
  }

  try {
    const result = await beginAdminPasskeyLogin({ request, email });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: "login_failed" }, { status: 401 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
