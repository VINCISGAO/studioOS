import "server-only";

import { cache } from "react";
import { getBrandProfileByEmail } from "@/lib/brand-profile-service";
import { listOrdersForClient } from "@/lib/order-service";
import { listProjectsForClient } from "@/lib/project-service";
import { countUnreadBrandNotifications } from "@/lib/studioos/brand-notification-service";
import { fallbackBrandDisplayName } from "@/lib/studioos/brand-account-display";

/** Per-request dedupe for brand layout + dashboard (avoids duplicate DB hits on navigation). */
export const getBrandPortalProfile = cache((email: string) => getBrandProfileByEmail(email.toLowerCase()));

export const getBrandPortalUnreadCount = cache((email: string) =>
  countUnreadBrandNotifications(email.toLowerCase())
);

export const getBrandPortalProjects = cache((email: string) => listProjectsForClient(email.toLowerCase()));

export const getBrandPortalOrders = cache((email: string) => listOrdersForClient(email.toLowerCase()));

export const getBrandPortalDisplayName = cache(async (email: string) => {
  const profile = await getBrandPortalProfile(email);
  return profile?.display_name.trim() || profile?.company_name.trim() || fallbackBrandDisplayName(email);
});
