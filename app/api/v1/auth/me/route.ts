import { NextResponse } from "next/server";
import { getSessionUser } from "@/features/auth/session.service";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        companyName: user.companyName,
        displayName: user.displayName
      }
    },
    { headers: NO_STORE_HEADERS }
  );
}
