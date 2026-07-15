import { serveKnowledgeAsset } from "@/lib/knowledge/knowledge-asset-proxy";

export const runtime = "nodejs";

type Props = { params: Promise<{ fileName: string }> };

/** Public read-only knowledge image assets — no admin session required. */
export async function GET(_request: Request, { params }: Props) {
  const { fileName } = await params;
  return serveKnowledgeAsset(fileName);
}
