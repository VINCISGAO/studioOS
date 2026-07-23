import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";

export type BrandRecommendedCreator = {
  creatorId: string;
  creatorName: string;
  creatorHeadline: string;
  creatorAvatarUrl?: string;
  matchPercent: number;
  verified: boolean;
  tags: string[];
  pastBrands: string[];
  workStyle: string;
  invitationId: string | null;
  invitationStatus: StoredCreatorInvitation["status"] | null;
};
