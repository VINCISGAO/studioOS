import { sendEnterpriseEmail } from "@/features/email/email-delivery.service";
import {
  buildAdditionalRevisionPurchasedEmail,
  buildApprovedEmail,
  buildArbitrationStartedEmail,
  buildGenericNotificationEmail,
  buildInvitationReceivedEmail,
  buildInvitationResponseEmail,
  buildPaymentReleasedEmail,
  buildPlainLifecycleEmail,
  buildRevisionRequestedEmail,
  buildVersionUploadedEmail,
  type EnterpriseTemplateId
} from "@/features/email/templates/enterprise-email-templates";
import type { EmailDetail } from "@/features/email/components/email-primitives";

const enterpriseTemplateIds = new Set<EnterpriseTemplateId>([
  "auth.login_verification",
  "notification.generic",
  "invitation.received",
  "invitation.accepted",
  "invitation.declined",
  "collaboration.selected",
  "review.version_uploaded",
  "review.revision_requested",
  "review.approved",
  "settlement.payment_released",
  "revision.additional_purchased",
  "arbitration.started"
]);

function isEnterpriseTemplateId(template: string | undefined): template is EnterpriseTemplateId {
  return Boolean(template && enterpriseTemplateIds.has(template as EnterpriseTemplateId));
}

function metadataDetails(metadata: unknown): EmailDetail[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }
  return Object.entries(metadata)
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
    .slice(0, 4)
    .map(([key, value]) => ({
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .trim()
        .toUpperCase(),
      value: String(value)
    }));
}

function metadataRecord(metadata: unknown): Record<string, unknown> {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : {};
}

function metadataString(metadata: Record<string, unknown>, key: string, fallback = "—") {
  const value = metadata[key];
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const text = String(value).trim();
    return text || fallback;
  }
  return fallback;
}

function buildStructuredNotificationEmail(input: {
  headline: string;
  body: string;
  actionUrl?: string;
  template: EnterpriseTemplateId;
  metadata?: unknown;
}) {
  const metadata = metadataRecord(input.metadata);
  const actionUrl = input.actionUrl ?? "https://vincis.app";

  if (input.template === "invitation.received") {
    return buildInvitationReceivedEmail({
      brand: metadataString(metadata, "brand"),
      project: metadataString(metadata, "project"),
      budget: metadataString(metadata, "budget"),
      deliveryTime: metadataString(metadata, "deliveryTime"),
      actionUrl
    });
  }

  if (input.template === "invitation.accepted" || input.template === "invitation.declined") {
    return buildInvitationResponseEmail({
      accepted: input.template === "invitation.accepted",
      creator: metadataString(metadata, "creator", ""),
      project: metadataString(metadata, "project", ""),
      rejectReason: metadataString(metadata, "rejectReason", ""),
      actionUrl
    });
  }

  if (input.template === "review.version_uploaded") {
    return buildVersionUploadedEmail({
      project: metadataString(metadata, "project", input.headline),
      version: metadataString(metadata, "version", metadataString(metadata, "versionNumber", "1")),
      uploadTime: metadataString(metadata, "uploadTime", "Just now"),
      actionUrl
    });
  }

  if (input.template === "review.revision_requested") {
    return buildRevisionRequestedEmail({
      version: metadataString(metadata, "version", metadataString(metadata, "versionNumber", "1")),
      comments: metadataString(metadata, "comments", input.body),
      pendingItems: metadataString(metadata, "pendingItems", "Review feedback in VINCIS"),
      actionUrl
    });
  }

  if (input.template === "review.approved") {
    return buildApprovedEmail({
      version: metadataString(metadata, "version", metadataString(metadata, "versionNumber", "1")),
      approvedTime: metadataString(metadata, "approvedTime", "Just now"),
      actionUrl
    });
  }

  if (input.template === "settlement.payment_released") {
    return buildPaymentReleasedEmail({
      project: metadataString(metadata, "project", input.headline),
      amount: metadataString(metadata, "amount", "See settlement"),
      transactionId: metadataString(metadata, "transactionId", "Pending"),
      actionUrl
    });
  }

  if (input.template === "revision.additional_purchased") {
    return buildAdditionalRevisionPurchasedEmail({
      additionalPayment: metadataString(metadata, "additionalPayment", "20%"),
      currentStage: metadataString(metadata, "currentStage", "Version 4"),
      actionUrl
    });
  }

  if (input.template === "arbitration.started") {
    return buildArbitrationStartedEmail({
      project: metadataString(metadata, "project", input.headline),
      status: metadataString(metadata, "status", "Open"),
      expectedResolution: metadataString(metadata, "expectedResolution", "Platform review in progress"),
      actionUrl
    });
  }

  return null;
}

export async function sendNotificationEmail(input: {
  userId: string;
  toEmail: string;
  subject: string;
  html: string;
  template: string;
}) {
  return sendEnterpriseEmail({
    userId: input.userId,
    to: input.toEmail,
    subject: input.subject,
    template: input.template,
    html: input.html
  });
}

export async function buildSimpleNotificationEmail(input: {
  headline: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
  template?: string;
  metadata?: unknown;
}) {
  if (isEnterpriseTemplateId(input.template) && input.template !== "notification.generic") {
    const structured = buildStructuredNotificationEmail({
      headline: input.headline,
      body: input.body,
      actionUrl: input.actionUrl,
      template: input.template,
      metadata: input.metadata
    });
    if (structured) return structured;

    return buildPlainLifecycleEmail({
      template: input.template,
      subject: input.headline,
      title: input.headline,
      subtitle: input.body,
      details: metadataDetails(input.metadata),
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel ?? "View in VINCIS"
    });
  }

  return buildGenericNotificationEmail(input);
}
