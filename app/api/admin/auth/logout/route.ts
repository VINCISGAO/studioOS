import { NextResponse } from "next/server";
import { logoutAdminSession } from "@/features/admin/auth/admin-auth.service";
import { requireAdminMutation } from "@/features/admin/auth/admin-api-guard";
import { handleRouteError } from "@/lib/core/api-route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const profile = await requireAdminMutation(request);
    await logoutAdminSession({ request, emailHint: profile.user.email });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
