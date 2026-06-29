import { NextResponse } from "next/server";
import { getSessionUser } from "@/features/auth/session.service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      companyName: user.companyName,
      displayName: user.displayName
    }
  });
}
