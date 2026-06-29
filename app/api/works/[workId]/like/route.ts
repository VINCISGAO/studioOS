import { NextResponse } from "next/server";
import { getCurrentUserEmail } from "@/lib/session-user";
import { toggleWorkLike } from "@/lib/work-engagement-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ workId: string }> }
) {
  const email = await getCurrentUserEmail();
  if (!email) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  const { workId } = await context.params;
  if (!workId?.trim()) {
    return NextResponse.json({ error: "invalid_work" }, { status: 400 });
  }

  const result = await toggleWorkLike(workId, email);
  return NextResponse.json(result);
}
