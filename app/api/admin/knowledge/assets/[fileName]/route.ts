import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { knowledgeCoverObjectKey } from "@/lib/knowledge/knowledge-cover-process.shared";
import { getObject } from "@/lib/studioos/object-storage";

export const runtime = "nodejs";

type Props = { params: Promise<{ fileName: string }> };

function mimeForFileName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".avif") return "image/avif";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

async function readLegacyLocalCover(fileName: string) {
  const filePath = path.join(process.cwd(), ".data", "uploads", "knowledge", "covers", fileName);
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: Props) {
  const { fileName } = await params;
  const safeName = path.basename(fileName);
  const buffer =
    (await getObject(knowledgeCoverObjectKey(safeName))) ?? (await readLegacyLocalCover(safeName));

  if (!buffer) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mimeForFileName(safeName),
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
