import { NextResponse } from "next/server";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { hasMureka } from "@/lib/core/config/ai";

/** Dev-only Mureka wiring check — never expose in production. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  try {
    return apiSuccess({
      configured: hasMureka(),
      provider: "mureka",
      docs: "https://platform.mureka.ai/docs/"
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
