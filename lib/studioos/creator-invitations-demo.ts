import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";

/** Fixed demo payload for Nova (creator_01) — matches invitations mockup. */
export function getCreatorInvitationsDemoPayload(): CreatorPortalInvitationView[] {
  return [
    {
      id: "inv_demo_pending_01",
      campaignId: "proj_demo_arc_nova",
      title: "我的产品 Campaign",
      brandName: "Arc & Alloy",
      budget: 1800,
      currency: "USD",
      deadline: "2026-07-15T00:00:00.000Z",
      platform: "TikTok",
      matchScore: 92,
      status: "pending",
      expiresAt: "2026-07-20T00:00:00.000Z",
      createdAt: "2026-06-28T00:00:00.000Z"
    },
    {
      id: "inv_demo_pending_03",
      campaignId: "proj_demo_arc_brand_300",
      title: "我的产品 Campaign",
      brandName: "Arc & Alloy (BRAND)",
      budget: 300,
      currency: "USD",
      deadline: "2026-07-08T00:00:00.000Z",
      platform: "Meta",
      matchScore: 89,
      status: "pending",
      expiresAt: "2026-07-12T00:00:00.000Z",
      createdAt: "2026-06-29T00:00:00.000Z"
    },
    {
      id: "inv_demo_accepted_01",
      campaignId: "proj_1002",
      title: "Product Demo Batch",
      brandName: "BrightSip",
      budget: 620,
      currency: "USD",
      deadline: "2026-07-20T00:00:00.000Z",
      platform: "Amazon",
      matchScore: 86,
      status: "accepted",
      expiresAt: null,
      createdAt: "2026-06-20T00:00:00.000Z"
    },
    {
      id: "inv_demo_declined_01",
      campaignId: "proj_declined",
      title: "Holiday UGC Pack",
      brandName: "Northline Skincare",
      budget: 450,
      currency: "USD",
      deadline: "2026-07-10T00:00:00.000Z",
      platform: "Meta",
      matchScore: 74,
      status: "declined",
      expiresAt: null,
      createdAt: "2026-06-15T00:00:00.000Z"
    },
    {
      id: "inv_demo_expired_01",
      campaignId: "proj_expired",
      title: "Summer Glow Cutdowns",
      brandName: "Arc & Alloy",
      budget: 900,
      currency: "USD",
      deadline: "2026-06-25T00:00:00.000Z",
      platform: "TikTok",
      matchScore: 88,
      status: "expired",
      expiresAt: "2026-06-28T00:00:00.000Z",
      createdAt: "2026-06-01T00:00:00.000Z"
    }
  ];
}
