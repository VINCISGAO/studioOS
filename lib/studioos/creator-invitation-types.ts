import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import type { InvitationDeclineFeedback } from "@/features/matching/invitation-decline-feedback";

export type StoredCreatorInvitation = CreatorPortalInvitationView & {
  creatorId: string;
  projectId: string;
  brandEmail?: string;
  declineFeedback?: InvitationDeclineFeedback;
};
