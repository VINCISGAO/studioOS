import { NextResponse } from "next/server";
import { beginAdminPasskeyRegistration } from "@/features/admin/auth/admin-webauthn.service";
import { assertPasskeyStepUp } from "@/features/admin/auth/admin-passkey-step-up.service";
import { requireAdminSession } from "@/features/admin/auth/admin-api-guard";
import { readAdminSessionToken } from "@/features/admin/auth/admin-session-server";
import { handleRouteError } from "@/lib/core/api-route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const profile = await requireAdminSession(request);
    const sessionToken = await readAdminSessionToken();
    assertPasskeyStepUp(profile, sessionToken);
    const result = await beginAdminPasskeyRegistration({
      adminProfileId: profile.id,
      email: profile.user.email
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
