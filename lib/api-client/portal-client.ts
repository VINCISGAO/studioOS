import type {
  BrandProjectPortalDetail,
  CreatorProjectPortalDetail
} from "@/features/portal/portal.types";
import type { ApiResult } from "./studioos-api";
import { studioOsApi } from "./studioos-api";

function unwrapDetail<TDetail>(result: ApiResult<{ detail: TDetail }>): TDetail {
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data.detail;
}

/** Client-side portal loaders — same contract as RSC gateway + REST API */
export async function fetchBrandProjectPortalDetail(
  projectId: string,
  tab?: string
): Promise<BrandProjectPortalDetail> {
  const result = await studioOsApi.getBrandProjectDetail(projectId, tab);
  return unwrapDetail<BrandProjectPortalDetail>(result);
}

export async function fetchCreatorProjectPortalDetail(
  orderId: string
): Promise<CreatorProjectPortalDetail> {
  const result = await studioOsApi.getCreatorProjectDetail(orderId);
  return unwrapDetail<CreatorProjectPortalDetail>(result);
}
