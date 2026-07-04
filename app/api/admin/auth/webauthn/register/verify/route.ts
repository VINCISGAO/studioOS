import { NextResponse } from "next/server";
import { finishAdminPasskeyRegistration } from "@/features/admin/auth/admin-webauthn.service";
import { assertPasskeyStepUp } from "@/features/admin/auth/admin-passkey-step-up.service";
import { requireAdminMutation } from "@/features/admin/auth/admin-api-guard";
import { readAdminSessionToken } from "@/features/admin/auth/admin-session-server";
import { handleRouteError } from "@/lib/core/api-route";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const response = record?.response as RegistrationResponseJSON | undefined;
  const label = typeof record?.label === "string" ? record.label : undefined;

  if (!response) {
    return NextResponse.json({ ok: false, error: "response_required" }, { status: 400 });
  }

  try {
    const profile = await requireAdminMutation(request);
    const sessionToken = await readAdminSessionToken();
    assertPasskeyStepUp(profile, sessionToken);
    const result = await finishAdminPasskeyRegistration({
      adminProfileId: profile.id,
      response,
      label
    });
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
