export type DomainEvent<TPayload = Record<string, unknown>> = {
  name: string;
  aggregateType: "campaign" | "review" | "payment" | "wallet" | "ai" | "notification";
  aggregateId: string;
  payload: TPayload;
  occurredAt: string;
  actorId?: string;
};

export const CampaignEvents = {
  CREATED: "CampaignCreated",
  UPDATED: "CampaignUpdated",
  CREATIVE_GENERATED: "CreativeGenerated",
  CREATIVE_SELECTED: "CreativeSelected",
  MATCHING_STARTED: "MatchingStarted",
  CREATOR_ACCEPTED: "CreatorAccepted",
  ESCROW_FUNDED: "EscrowFunded",
  VERSION_UPLOADED: "VersionUploaded",
  REVISION_REQUESTED: "RevisionRequested",
  APPROVED: "ReviewApproved",
  SETTLEMENT_RELEASED: "SettlementReleased",
  COMPLETED: "CampaignCompleted"
} as const;

export const ReviewEvents = {
  COMMENT_CREATED: "CommentCreated",
  COMMENT_RESOLVED: "CommentResolved",
  ANNOTATION_CREATED: "AnnotationCreated",
  REVISION_REQUESTED: "RevisionRequested",
  APPROVED: "ReviewApproved"
} as const;

export const CommunicationEvents = {
  MESSAGE_CREATED: "MessageCreated",
  MESSAGE_TRANSLATED: "MessageTranslated",
  SUMMARY_GENERATED: "SummaryGenerated",
  TODO_GENERATED: "TodoGenerated"
} as const;

export const MemoryEvents = {
  FACT_EXTRACTED: "MemoryFactExtracted",
  BRAND_DNA_UPDATED: "BrandDnaUpdated",
  CREATOR_DNA_UPDATED: "CreatorDnaUpdated",
  RELATIONSHIP_UPDATED: "RelationshipDnaUpdated",
  CAMPAIGN_MEMORY_INHERITED: "CampaignMemoryInherited"
} as const;
