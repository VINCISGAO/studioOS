import {
  campaignAssetService,
  serializeCampaignAsset
} from "@/features/campaign/campaign-asset.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const assets = await campaignAssetService.listAssets(campaignId, {
      id: user.id,
      role: user.role
    });
    return apiSuccess({ items: assets.map(serializeCampaignAsset) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const formData = await request.formData();
    const assetType = String(formData.get("asset_type") ?? "LOGO").toUpperCase();
    const file = formData.get("file");

    if (assetType !== "LOGO") {
      throw appError("VALIDATION_ERROR", "Only LOGO uploads are supported in Sprint 2");
    }
    if (!(file instanceof File) || !file.size) {
      throw appError("VALIDATION_ERROR", "file is required");
    }

    const asset = await campaignAssetService.uploadLogo(campaignId, { id: user.id, role: user.role }, file);
    return apiSuccess(serializeCampaignAsset(asset), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
