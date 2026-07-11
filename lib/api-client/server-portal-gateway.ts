/**
 * Server-side portal data gateway.
 * Web RSC pages call this; mobile app calls the same contract via HTTP (/api/v1/portal/*).
 */
import { brandProjectPortalService } from "@/features/portal/brand-project-portal.service";
import { creatorProjectPortalService } from "@/features/portal/creator-project-portal.service";
import type {
  BrandProjectPortalDetail,
  CreatorProjectPortalDetail
} from "@/features/portal/portal.types";
import type { Locale } from "@/lib/i18n";

export async function loadBrandProjectPortalDetail(input: {
  projectId: string;
  locale: Locale;
  clientEmail: string;
  tab?: string | null;
}): Promise<BrandProjectPortalDetail> {
  return brandProjectPortalService.getDetail(input);
}

export async function loadCreatorProjectPortalDetail(input: {
  orderId: string;
  locale: Locale;
  creatorId: string;
}): Promise<CreatorProjectPortalDetail> {
  return creatorProjectPortalService.getDetail(input);
}

export async function resolveBrandProjectRouteId(orderOrProjectId: string) {
  return brandProjectPortalService.resolveProjectIdFromOrderOrReview(orderOrProjectId);
}
