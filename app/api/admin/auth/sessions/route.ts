import { NextResponse } from "next/server";
import {
  listAdminPasskeys,
  deleteAdminPasskey
} from "@/features/admin/auth/admin-webauthn.service";
import { assertPasskeyStepUp } from "@/features/admin/auth/admin-passkey-step-up.service";
import {
  listAdminSessionsForProfile,
  revokeAdminSessionById,
  revokeOtherAdminSessions
} from "@/features/admin/auth/admin-session-management.service";
import {
  requireAdminMutation,
  requireAdminSession
} from "@/features/admin/auth/admin-api-guard";
import {
  clearAdminSessionCookie,
  readAdminSessionToken
} from "@/features/admin/auth/admin-session-server";
import { handleRouteError } from "@/lib/core/api-route";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const profile = await requireAdminSession(request);
    const token = await readAdminSessionToken();
    const [sessions, passkeys] = await Promise.all([
      listAdminSessionsForProfile(profile.id, token),
      listAdminPasskeys(profile.id)
    ]);
    return NextResponse.json({ ok: true, sessions, passkeys });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminMutation(request);
  } catch (error) {
    return handleRouteError(error);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const action = typeof record?.action === "string" ? record.action : "";

  try {
    const profile = await requireAdminMutation(request);
    const token = await readAdminSessionToken();

    if (action === "revoke_session" && typeof record?.sessionId === "string") {
      const result = await revokeAdminSessionById({
        adminProfileId: profile.id,
        sessionId: record.sessionId,
        currentToken: token
      });
      if (result.ok && result.revokedCurrent) {
        await clearAdminSessionCookie();
      }
      return NextResponse.json(result);
    }

    if (action === "revoke_others") {
      const count = await revokeOtherAdminSessions(profile.id, token);
      return NextResponse.json({ ok: true, revoked: count });
    }

    if (action === "delete_passkey" && typeof record?.credentialRowId === "string") {
      assertPasskeyStepUp(profile, token);
      const result = await deleteAdminPasskey({
        adminProfileId: profile.id,
        credentialRowId: record.credentialRowId
      });
      return NextResponse.json(result, { status: result.ok ? 200 : 404 });
    }

    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (error) {
    return handleRouteError(error);
  }
}
