import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { payoutQrFilePath } from "@/lib/studioos/payout-qr-upload";

export async function GET(
  _request: Request,
  context: { params: Promise<{ creatorId: string; filename: string }> }
) {
  const { creatorId, filename } = await context.params;
  if (!creatorId || !filename) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const safeName = decodeURIComponent(filename).replace(/[/\\]/g, "");
  const filePath = payoutQrFilePath(creatorId, safeName);

  try {
    const data = await fs.readFile(filePath);
    const ext = safeName.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    return new NextResponse(data, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }
}
