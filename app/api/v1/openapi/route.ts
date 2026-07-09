import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export async function GET(request: Request) {
  if (isProductionRuntime()) {
    const admin = await requireAdminAuthUser(request).catch(() => null);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const specPath = join(process.cwd(), "docs/openapi/openapi.yaml");
  const yaml = readFileSync(specPath, "utf8");
  return new NextResponse(yaml, {
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
      "Cache-Control": "private, no-store"
    }
  });
}
