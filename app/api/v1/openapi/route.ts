import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  const specPath = join(process.cwd(), "docs/openapi/openapi.yaml");
  const yaml = readFileSync(specPath, "utf8");
  return new NextResponse(yaml, {
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
