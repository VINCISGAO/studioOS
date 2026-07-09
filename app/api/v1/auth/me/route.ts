import { NextResponse } from "next/server";
import { getSessionUser } from "@/features/auth/session.service";
import { getCurrentSession } from "@/lib/session-user";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function mapAuthPayload(user: {
  id: string;
  email: string;
  role: string;
  fullName: string;
  companyName?: string;
  displayName?: string;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    companyName: user.companyName,
    displayName: user.displayName
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (user) {
    return NextResponse.json(
      { success: true, data: mapAuthPayload(user) },
      { headers: NO_STORE_HEADERS }
    );
  }

  const session = await getCurrentSession();
  if (session && session.role !== "admin") {
    return NextResponse.json(
      {
        success: true,
        data: mapAuthPayload({
          id: session.userId ?? `demo_${session.email.replace(/[^a-z0-9]/gi, "_")}`,
          email: session.email,
          role: session.role === "creator" ? "CREATOR" : "BRAND",
          fullName: session.email,
          displayName: session.email
        })
      },
      { headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
    { status: 401, headers: NO_STORE_HEADERS }
  );
}
