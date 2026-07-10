import type { CreativeCollaborationView } from "@/features/creative-collaboration/creative-collaboration.types";
import type { AiMatchReportStatistics } from "@/lib/studioos/ai-match-report";
import type {
  BrandCommercialContext,
  BrandCommercialStep,
  CreatorCommercialContext,
  CreatorCommercialStep
} from "@/lib/studioos/commercial-lifecycle";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import type { StoredCreativeBrief, StoredCreativePackItem } from "@/lib/campaign-types";
import type { Locale } from "@/lib/i18n";

/** Shared portal tab ids — web + mobile */
export type BrandProjectDetailTab =
  | "brief"
  | "assets"
  | "versions"
  | "audit"
  | "match"
  | "proposal"
  | "production"
  | "review";

export type CreatorProjectDetailTab = "brief" | "storyboard" | "versions" | "issues";

export type BrandProjectPortalDetail = {
  locale: Locale;
  projectId: string;
  activeTab: BrandProjectDetailTab;
  project: StoredProject;
  linkedOrder: StoredOrder | null;
  deliverables: StoredDeliverable[];
  reviewComments: ReviewComment[];
  projectInvitations: StoredCreatorInvitation[];
  selectedCreatorId: string | null;
  brandCommercialStep: BrandCommercialStep;
  commercialContext: BrandCommercialContext;
  notificationCount: number;
  aiMatchStatistics: AiMatchReportStatistics | null;
  flags: {
    isDraft: boolean;
    awaitingPayment: boolean;
    hasActiveProject: boolean;
    matchingRequiresPayment: boolean;
    shouldRedirectToCheckout: boolean;
  };
};

export type CreatorProjectPortalDetail = {
  locale: Locale;
  orderId: string;
  order: StoredOrder;
  project: StoredProject | null;
  pack: StoredCreativePackItem[];
  deliverables: StoredDeliverable[];
  comments: ReviewComment[];
  brief: StoredCreativeBrief | null;
  canUpload: boolean;
  collaborationView: CreativeCollaborationView | null;
  aiEnabled: boolean;
  creatorCommercialStep: CreatorCommercialStep;
  commercialContext: CreatorCommercialContext;
};

export type PortalApiMeta = {
  version: "v1";
  generatedAt: string;
};

export type BrandProjectPortalDetailResponse = PortalApiMeta & {
  detail: BrandProjectPortalDetail;
};

export type CreatorProjectPortalDetailResponse = PortalApiMeta & {
  detail: CreatorProjectPortalDetail;
};
