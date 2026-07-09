import { NextResponse } from "next/server";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { getAlipayOAuthPublicConfig, hasAlipayOAuthConfig } from "@/lib/alipay/alipay-oauth-config";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { isObjectStorageConfigured } from "@/lib/core/config/video";

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export async function GET(request: Request) {
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
  const url = new URL(request.url);
  const includeAlipay = url.searchParams.get("alipay") === "1";
  const canExposeProviderConfig =
    includeAlipay &&
    (!isProductionRuntime() || Boolean(await requireAdminAuthUser(request).catch(() => null)));
  const alipay =
    canExposeProviderConfig && hasAlipayOAuthConfig()
      ? getAlipayOAuthPublicConfig()
      : canExposeProviderConfig
        ? { configured: false as const }
        : undefined;

  return NextResponse.json(
    {
      success: healthy,
      data: {
        service: "studioos",
        checks,
        timestamp: new Date().toISOString(),
        ...(alipay ? { alipay } : {})
      }
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
