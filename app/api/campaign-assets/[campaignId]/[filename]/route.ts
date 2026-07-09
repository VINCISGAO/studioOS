import { NextResponse } from "next/server";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { PermissionService } from "@/features/auth/permission.service";
import { getSessionUser } from "@/features/auth/session.service";
import { campaignAssetObjectKey } from "@/lib/studioos/campaign-asset-upload";
import { getObject } from "@/lib/studioos/object-storage";

async function canReadCampaignAsset(request: Request, campaignId: string) {
  const campaign = await campaignRepository.findById(campaignId);
  if (!campaign) return false;

  const [user, adminUser] = await Promise.all([
    getSessionUser().catch(() => null),
    requireAdminAuthUser(request).catch(() => null)
  ]);

  if (adminUser) return true;
  return Boolean(user && PermissionService.canAccessCampaign(user, campaign));
}

export async function GET(
  request: Request,
  context: { params: Promise<{ campaignId: string; filename: string }> }
) {
  const { campaignId, filename } = await context.params;
  if (!campaignId || !filename) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!(await canReadCampaignAsset(request, campaignId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const safeName = decodeURIComponent(filename).replace(/[/\\]/g, "");
  const fileKey = campaignAssetObjectKey(campaignId, safeName);

  try {
    const data = await getObject(fileKey);
    if (!data) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    const ext = safeName.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : "image/jpeg";

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
}
