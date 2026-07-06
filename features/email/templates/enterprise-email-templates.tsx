import React, { type ReactElement, type ReactNode } from "react";
import { EmailLayout } from "@/features/email/components/email-layout";
import {
  EmailButton,
  EmailCodeBlock,
  EmailDetailCard,
  EmailParagraph,
  EmailSecurityNote,
  type EmailDetail
} from "@/features/email/components/email-primitives";
import { renderEmail } from "@/features/email/email-renderer";

export type EnterpriseTemplateId =
  | "auth.login_verification"
  | "notification.generic"
  | "invitation.received"
  | "invitation.accepted"
  | "invitation.declined"
  | "collaboration.selected"
  | "review.version_uploaded"
  | "review.revision_requested"
  | "review.approved"
  | "settlement.payment_released"
  | "revision.additional_purchased"
  | "arbitration.started";

export type RenderedEnterpriseEmail = {
  template: EnterpriseTemplateId;
  subject: string;
  html: string;
};

async function renderTemplate(
  template: EnterpriseTemplateId,
  subject: string,
  element: ReactNode
): Promise<RenderedEnterpriseEmail> {
  return {
    template,
    subject,
    html: await renderEmail(element as ReactElement)
  };
}

function withFallback(value: string | number | null | undefined, fallback = "—") {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text || fallback;
}

function versionLabel(value: string | number | null | undefined) {
  const text = withFallback(value, "1");
  return text.toUpperCase().startsWith("V") ? text : `V${text}`;
}

function LifecycleEmail({
  preview,
  title,
  subtitle,
  details,
  actionUrl,
  actionLabel,
  children
}: {
  preview: string;
  title: string;
  subtitle: string;
  details?: EmailDetail[];
  actionUrl?: string;
  actionLabel?: string;
  children?: ReactNode;
}) {
  return (
    <EmailLayout preview={preview} title={title} subtitle={subtitle}>
      {details?.length ? <EmailDetailCard details={details} /> : null}
      {children}
      {actionUrl && actionLabel ? <EmailButton href={actionUrl}>{actionLabel}</EmailButton> : null}
    </EmailLayout>
  );
}

export function buildLoginVerificationEmail(input: {
  code: string;
}): Promise<RenderedEnterpriseEmail> {
  return renderTemplate(
    "auth.login_verification",
    "Your VINCIS verification code",
    <EmailLayout
      preview="Use this verification code to sign in to VINCIS."
      title="Verify your email"
      subtitle="Use the verification code below to sign in to VINCIS."
    >
      <EmailCodeBlock code={input.code} expiryLabel="Valid for 5 minutes" />
      <EmailSecurityNote>
        For your security, never share this code with anyone.
      </EmailSecurityNote>
    </EmailLayout>
  );
}

export function buildGenericNotificationEmail(input: {
  headline: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
}): Promise<RenderedEnterpriseEmail> {
  return renderTemplate(
    "notification.generic",
    input.headline,
    <LifecycleEmail
      preview={input.body}
      title={input.headline}
      subtitle={input.body}
      actionUrl={input.actionUrl}
      actionLabel={input.actionLabel ?? "View in VINCIS"}
    />
  );
}

export function buildInvitationReceivedEmail(input: {
  brand: string;
  project: string;
  budget: string;
  deliveryTime: string;
  actionUrl: string;
}): Promise<RenderedEnterpriseEmail> {
  return renderTemplate(
    "invitation.received",
    "You've received a new invitation",
    <LifecycleEmail
      preview="A brand would like to collaborate with you."
      title="You've received a new invitation"
      subtitle="A brand would like to collaborate with you."
      details={[
        { label: "Brand", value: input.brand },
        { label: "Project", value: input.project },
        { label: "Budget", value: input.budget },
        { label: "Delivery Time", value: input.deliveryTime }
      ]}
      actionUrl={input.actionUrl}
      actionLabel="View Invitation"
    />
  );
}

export function buildInvitationResponseEmail(input: {
  accepted: boolean;
  creator?: string | null;
  project?: string | null;
  rejectReason?: string | null;
  actionUrl: string;
}): Promise<RenderedEnterpriseEmail> {
  const template = input.accepted ? "invitation.accepted" : "invitation.declined";
  const title = input.accepted ? "Invitation Accepted" : "Invitation Declined";
  const subtitle = input.accepted
    ? "A creator has accepted your invitation."
    : "A creator declined your invitation.";
  const details: EmailDetail[] = [
    { label: "Creator", value: input.creator },
    { label: "Project", value: input.project }
  ];
  if (!input.accepted) {
    details.push({ label: "Reason", value: input.rejectReason });
  }

  return renderTemplate(
    template,
    title,
    <LifecycleEmail
      preview={subtitle}
      title={title}
      subtitle={subtitle}
      details={details}
      actionUrl={input.actionUrl}
      actionLabel="View Candidates"
    />
  );
}

export function buildCollaborationSelectedEmail(input: {
  brand: string;
  project: string;
  budget: string;
  deadline: string;
  actionUrl: string;
}): Promise<RenderedEnterpriseEmail> {
  return renderTemplate(
    "collaboration.selected",
    "Congratulations!",
    <LifecycleEmail
      preview="You have been selected to work on this project."
      title="Congratulations!"
      subtitle="You have been selected to work on this project."
      details={[
        { label: "Brand", value: input.brand },
        { label: "Project", value: input.project },
        { label: "Budget", value: input.budget },
        { label: "Deadline", value: input.deadline }
      ]}
      actionUrl={input.actionUrl}
      actionLabel="Open Project"
    />
  );
}

export function buildVersionUploadedEmail(input: {
  project: string;
  version: string | number;
  uploadTime: string;
  actionUrl: string;
}): Promise<RenderedEnterpriseEmail> {
  const version = versionLabel(input.version);
  return renderTemplate(
    "review.version_uploaded",
    `Version ${version} Uploaded`,
    <LifecycleEmail
      preview="Your latest version has been submitted successfully."
      title={`Version ${version} Uploaded`}
      subtitle="Your latest version has been submitted successfully."
      details={[
        { label: "Project", value: input.project },
        { label: "Version", value: version },
        { label: "Upload Time", value: input.uploadTime }
      ]}
      actionUrl={input.actionUrl}
      actionLabel="Open Review Center"
    />
  );
}

export function buildRevisionRequestedEmail(input: {
  version: string | number;
  comments: string;
  pendingItems: string;
  actionUrl: string;
}): Promise<RenderedEnterpriseEmail> {
  return renderTemplate(
    "review.revision_requested",
    "Revision Requested",
    <LifecycleEmail
      preview="The brand has requested revisions."
      title="Revision Requested"
      subtitle="The brand has requested revisions."
      details={[
        { label: "Version", value: versionLabel(input.version) },
        { label: "Comments", value: input.comments },
        { label: "Pending Items", value: input.pendingItems }
      ]}
      actionUrl={input.actionUrl}
      actionLabel="View Feedback"
    />
  );
}

export function buildApprovedEmail(input: {
  version: string | number;
  approvedTime: string;
  actionUrl: string;
}): Promise<RenderedEnterpriseEmail> {
  return renderTemplate(
    "review.approved",
    "Approved",
    <LifecycleEmail
      preview="Congratulations. Your delivery has been approved."
      title="Approved"
      subtitle="Congratulations. Your delivery has been approved."
      details={[
        { label: "Version", value: versionLabel(input.version) },
        { label: "Approved Time", value: input.approvedTime }
      ]}
      actionUrl={input.actionUrl}
      actionLabel="View Project"
    />
  );
}

export function buildPaymentReleasedEmail(input: {
  project: string;
  amount: string;
  transactionId: string;
  actionUrl: string;
}): Promise<RenderedEnterpriseEmail> {
  return renderTemplate(
    "settlement.payment_released",
    "Payment Released",
    <LifecycleEmail
      preview="Your payment has been released successfully."
      title="Payment Released"
      subtitle="Your payment has been released successfully."
      details={[
        { label: "Project", value: input.project },
        { label: "Amount", value: input.amount },
        { label: "Transaction ID", value: input.transactionId }
      ]}
      actionUrl={input.actionUrl}
      actionLabel="View Settlement"
    />
  );
}

export function buildAdditionalRevisionPurchasedEmail(input: {
  additionalPayment?: string;
  currentStage?: string;
  actionUrl: string;
}): Promise<RenderedEnterpriseEmail> {
  return renderTemplate(
    "revision.additional_purchased",
    "Additional Revision Purchased",
    <LifecycleEmail
      preview="The brand has purchased an additional revision."
      title="Additional Revision Purchased"
      subtitle="The brand has purchased an additional revision."
      details={[
        { label: "Additional Payment", value: input.additionalPayment ?? "20%" },
        { label: "Current Stage", value: input.currentStage ?? "Version 4" }
      ]}
      actionUrl={input.actionUrl}
      actionLabel="Continue Working"
    />
  );
}

export function buildArbitrationStartedEmail(input: {
  project: string;
  status: string;
  expectedResolution: string;
  actionUrl: string;
}): Promise<RenderedEnterpriseEmail> {
  return renderTemplate(
    "arbitration.started",
    "Arbitration Started",
    <LifecycleEmail
      preview="The project has entered arbitration."
      title="Arbitration Started"
      subtitle="The project has entered arbitration."
      details={[
        { label: "Project", value: input.project },
        { label: "Status", value: input.status },
        { label: "Expected Resolution", value: input.expectedResolution }
      ]}
      actionUrl={input.actionUrl}
      actionLabel="View Case"
    />
  );
}

export function buildPlainLifecycleEmail(input: {
  template: EnterpriseTemplateId;
  subject: string;
  title: string;
  subtitle: string;
  details?: EmailDetail[];
  actionUrl?: string;
  actionLabel?: string;
  note?: string;
}): Promise<RenderedEnterpriseEmail> {
  return renderTemplate(
    input.template,
    input.subject,
    <LifecycleEmail
      preview={input.subtitle}
      title={input.title}
      subtitle={input.subtitle}
      details={input.details}
      actionUrl={input.actionUrl}
      actionLabel={input.actionLabel}
    >
      {input.note ? <EmailParagraph>{input.note}</EmailParagraph> : null}
    </LifecycleEmail>
  );
}
