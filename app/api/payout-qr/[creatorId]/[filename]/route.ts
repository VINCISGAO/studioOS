import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import { payoutQrFilePath } from "@/lib/studioos/payout-qr-upload";

async function canReadPayoutQr(request: Request, creatorId: string) {
  const [currentCreatorId, adminUser] = await Promise.all([
    getCurrentCreatorId().catch(() => null),
    requireAdminAuthUser(request).catch(() => null)
  ]);
  return currentCreatorId === creatorId || Boolean(adminUser);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ creatorId: string; filename: string }> }
) {
  const { creatorId, filename } = await context.params;
  if (!creatorId || !filename) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!(await canReadPayoutQr(request, creatorId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const safeName = decodeURIComponent(filename).replace(/[/\\]/g, "");
  const filePath = payoutQrFilePath(creatorId, safeName);

  try {
    const data = await fs.readFile(filePath);
    const ext = safeName.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }
}
