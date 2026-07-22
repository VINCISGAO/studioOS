import { canServePublicKnowledgeAsset } from "@/lib/knowledge/knowledge-asset-access";
import { serveKnowledgeAsset } from "@/lib/knowledge/knowledge-asset-proxy";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Props = { params: Promise<{ fileName: string }> };

/** Public read-only knowledge image assets referenced by published articles. */
export async function GET(request: Request, { params }: Props) {
  const { fileName } = await params;
  if (!(await canServePublicKnowledgeAsset(fileName, request))) {
    return new NextResponse("Not found", { status: 404 });
  }
  return serveKnowledgeAsset(fileName);
}
