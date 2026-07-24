import { NextResponse } from "next/server";
import { generationStaleJobService } from "@/features/generation/concurrency/generation-stale-job.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { verifyCronBearer } from "@/lib/core/cron-auth";
import { handleRouteError } from "@/lib/core/api-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!verifyCronBearer(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      {
        ok: true,
        scanned: 0,
        requeued: 0,
        failed: 0,
        releasedCredits: 0,
        durationMs: 0
      },
      { status: 200 }
    );
  }

  try {
    const result = await generationStaleJobService.runStaleJobReaper();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
