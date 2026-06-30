import type { CampaignWithRelations } from "@/features/campaign/campaign.repository";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignBridgeService } from "@/features/campaign/campaign-bridge.service";
import { buildVersionPlayback } from "@/features/video/playback-token.service";
import type { CommentStatus, MvpProfile, ProjectStatus, ReviewBundle, VideoComment, VideoVersion } from "@/lib/mvp/types";

type ReviewBundleUser = {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
  brandProfile?: { companyName: string } | null;
  creatorProfile?: { displayName: string | null } | null;
};

function mapCampaignStatus(status: string): ProjectStatus {
  if (status === "UNDER_REVIEW" || status === "PRODUCING") return "in_review";
  if (status === "APPROVED" || status === "MASTER_UPLOADED" || status === "SETTLEMENT") return "pending_settlement";
  if (status === "COMPLETED") return "settled";
  return "draft";
}

function mapUserToProfile(user: ReviewBundleUser, role: MvpProfile["role"]): MvpProfile {
  const name =
    role === "studio"
      ? user.creatorProfile?.displayName ?? user.fullName
      : user.brandProfile?.companyName ?? user.fullName;
  return {
    id: user.id,
    email: user.email,
    role,
    name,
    company_name: user.brandProfile?.companyName ?? user.fullName,
    created_at: user.createdAt.toISOString()
  };
}

function mapAnnotationType(type: string): VideoComment["annotation_type"] {
  if (type === "CIRCLE") return "circle";
  if (type === "RECTANGLE") return "rect";
  if (type === "ARROW") return "arrow";
  if (type === "POINT") return "pin";
  return null;
}

export function buildReviewBundleFromPrisma(
  campaign: CampaignWithRelations,
  options?: { projectId?: string; viewerUserId?: string }
): ReviewBundle {
  const projectId = options?.projectId ?? campaign.id;
  const viewerUserId = options?.viewerUserId;

  const versions: VideoVersion[] = campaign.versions.map((version) => {
    const playback = viewerUserId
      ? buildVersionPlayback(version, viewerUserId)
      : { mp4: null, hls: version.hlsUrl, thumbnail: version.thumbnailUrl, processing: false };

    return {
      id: version.id,
      project_id: projectId,
      version_number: version.versionNumber,
      file_url: playback.hls ?? "",
      file_path: version.videoKey ?? "",
      hls_url: playback.hls,
      uploaded_by: version.uploadedBy,
      created_at: version.createdAt.toISOString()
    };
  });

  const comments: VideoComment[] = campaign.versions.flatMap((version) =>
    version.comments.map((comment) => {
      const annotation = comment.annotations[0];
      return {
        id: comment.id,
        project_id: projectId,
        video_version_id: version.id,
        user_id: comment.userId,
        timestamp_seconds: Number(comment.timeSeconds),
        comment_text: comment.comment,
        annotation_type: annotation ? mapAnnotationType(annotation.type) : null,
        pos_x: annotation ? Number(annotation.x) : null,
        pos_y: annotation ? Number(annotation.y) : null,
        width: annotation ? Number(annotation.width) : null,
        height: annotation ? Number(annotation.height) : null,
        color: annotation?.color ?? null,
        status: "open" as CommentStatus,
        created_at: comment.createdAt.toISOString(),
        resolved_at: null
      };
    })
  );

  const profiles: Record<string, MvpProfile> = {};
  profiles[campaign.brand.id] = mapUserToProfile(campaign.brand, "brand");
  if (campaign.creator) {
    profiles[campaign.creator.id] = mapUserToProfile(campaign.creator, "studio");
  }

  return {
    project: {
      id: projectId,
      title: campaign.title,
      description: campaign.description ?? "",
      brand_name: campaign.brand.brandProfile?.companyName ?? campaign.brand.fullName,
      status: mapCampaignStatus(campaign.status),
      created_by: campaign.brandId,
      assigned_studio_id: campaign.creatorId,
      created_at: campaign.createdAt.toISOString(),
      updated_at: campaign.updatedAt.toISOString(),
      review_approved_at:
        campaign.status === "APPROVED" || campaign.status === "MASTER_UPLOADED" || campaign.status === "SETTLEMENT"
          ? campaign.updatedAt.toISOString()
          : null,
      settled_at: campaign.status === "COMPLETED" ? campaign.updatedAt.toISOString() : null
    },
    versions,
    comments,
    profiles
  };
}

export async function getPrismaReviewBundleForLegacyProject(
  legacyProjectId: string,
  mvpProjectId: string,
  viewerUserId?: string
): Promise<ReviewBundle | null> {
  const prismaId = await campaignBridgeService.resolvePrismaCampaignId(legacyProjectId);
  if (!prismaId) return null;

  const campaign = await campaignRepository.findReviewBundleSource(prismaId);
  if (!campaign || campaign.versions.length === 0) return null;

  return buildReviewBundleFromPrisma(campaign, { projectId: mvpProjectId, viewerUserId });
}
