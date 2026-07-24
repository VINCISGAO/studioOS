import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Demo social login retired — real OAuth / email only. */
export async function POST() {
  return NextResponse.json(
    {
      error: {
        code: "ENDPOINT_DEPRECATED",
        message: "This authentication endpoint is no longer available."
      }
    },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
