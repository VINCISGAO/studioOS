import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";

export type StoredCreatorInvitation = CreatorPortalInvitationView & {
  creatorId: string;
  projectId: string;
  brandEmail?: string;
};
