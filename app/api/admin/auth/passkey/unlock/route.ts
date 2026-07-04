import { NextResponse } from "next/server";
import { requireAdminMutation } from "@/features/admin/auth/admin-api-guard";
import { unlockPasskeyStepUp } from "@/features/admin/auth/admin-passkey-step-up.service";
import { readAdminSessionToken } from "@/features/admin/auth/admin-session-server";
import { handleRouteError } from "@/lib/core/api-route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const totpCode =
    body && typeof body === "object" ? String((body as Record<string, unknown>).totpCode ?? "") : "";
  if (!totpCode.trim()) {
    return NextResponse.json({ ok: false, error: "totp_required" }, { status: 400 });
  }

  try {
    const profile = await requireAdminMutation(request);
    const sessionToken = (await readAdminSessionToken()) ?? "";
    if (!sessionToken) {
      return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
    }

    const result = await unlockPasskeyStepUp({ profile, sessionToken, totpCode });
    if (!result.ok) {
      return NextResponse.json(result, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
