import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { isObjectStorageConfigured } from "@/lib/core/config/video";

export async function GET() {
  const checks: Record<string, "ok" | "skipped" | "error"> = {
    app: "ok",
    database: "skipped",
    objectStorage: isObjectStorageConfigured() ? "ok" : "skipped"
  };

  if (hasDatabaseUrl()) {
    try {
      const { prisma } = await import("@/lib/core/database/prisma");
      await prisma.$queryRaw`SELECT 1`;
      checks.database = "ok";
    } catch {
      checks.database = "error";
    }
  }

  const healthy = Object.values(checks).every((v) => v === "ok" || v === "skipped");

  return NextResponse.json(
    {
      success: healthy,
      data: {
        service: "studioos",
        checks,
        timestamp: new Date().toISOString()
      }
    },
    { status: healthy ? 200 : 503 }
  );
}
