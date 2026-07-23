import "server-only";

import { listCreatorsForMatching } from "@/lib/creator-service";
import type { Locale } from "@/lib/i18n";
import { matchCreatorsForProject } from "@/lib/matching-engine";
import type { StoredProject } from "@/lib/project-types";
import {
  buildCreatorCollaborationBrands,
  buildCreatorHighlightTags,
  buildCreatorWorkStyle,
  resolveCreatorForInvitation
} from "@/lib/studioos/brand-match-display";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import { getWorksForCreator } from "@/lib/works-catalog";
import type { BrandRecommendedCreator } from "@/lib/studioos/brand-match-recommendation-types";

export type { BrandRecommendedCreator } from "@/lib/studioos/brand-match-recommendation-types";

const MAX_PICKS = 4;

function invitationPicks(
  invitations: StoredCreatorInvitation[],
  locale: Locale
): BrandRecommendedCreator[] {
  const accepted = invitations.filter((item) => item.status === "accepted");
  const pending = invitations.filter((item) => item.status === "pending");
  const pool = (accepted.length > 0 ? accepted : pending).sort((a, b) => b.matchScore - a.matchScore);

  return pool.slice(0, MAX_PICKS).map((invitation) => {
    const creator = resolveCreatorForInvitation(invitation.creatorId);
    const name = invitation.creatorName ?? creator?.name ?? invitation.creatorId;
    return {
      creatorId: invitation.creatorId,
      creatorName: name,
      creatorHeadline: invitation.creatorHeadline ?? creator?.headline ?? "",
      creatorAvatarUrl: invitation.creatorAvatarUrl ?? creator?.avatar_url,
      matchPercent: Math.round(invitation.matchScore),
      verified: Boolean(creator?.profile_completed_at),
      tags: creator ? buildCreatorHighlightTags(creator, locale) : [],
      pastBrands: creator ? buildCreatorCollaborationBrands(creator, locale) : [],
      workStyle: creator ? buildCreatorWorkStyle(creator, locale) : "",
      invitationId: invitation.id,
      invitationStatus: invitation.status
    };
  });
}

async function enginePicks(project: StoredProject, locale: Locale): Promise<BrandRecommendedCreator[]> {
  const enrichedCreators = await listCreatorsForMatching();
  const allWorks = (
    await Promise.all(enrichedCreators.map((creator) => getWorksForCreator(creator.id)))
  ).flat();
  const matches = matchCreatorsForProject(project, enrichedCreators, allWorks, {
    includeColdStartRegisteredCreators: true
  }).slice(0, MAX_PICKS);

  return matches.map((match) => {
    const creator =
      enrichedCreators.find((item) => item.id === match.creator_id) ??
      resolveCreatorForInvitation(match.creator_id);
    return {
      creatorId: match.creator_id,
      creatorName: creator?.name ?? match.creator_id,
      creatorHeadline: creator?.headline ?? match.reasons[0]?.[locale] ?? "",
      creatorAvatarUrl: creator?.avatar_url,
      matchPercent: Math.min(99, Math.round(match.score)),
      verified: Boolean(creator?.profile_completed_at),
      tags: creator ? buildCreatorHighlightTags(creator, locale) : [],
      pastBrands: creator ? buildCreatorCollaborationBrands(creator, locale) : [],
      workStyle: creator ? buildCreatorWorkStyle(creator, locale) : "",
      invitationId: null,
      invitationStatus: null
    };
  });
}

export async function listBrandRecommendedCreators(
  project: StoredProject,
  invitations: StoredCreatorInvitation[],
  locale: Locale
): Promise<BrandRecommendedCreator[]> {
  const fromInvitations = invitationPicks(invitations, locale);
  if (fromInvitations.length > 0) {
    return fromInvitations;
  }
  return enginePicks(project, locale);
}
