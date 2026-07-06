# VINCIS Email Templates

All templates share the enterprise black/silver layout in `features/email/components/email-layout.tsx`.

## Template Catalog

| Template ID | Trigger | Recipient | Action |
| --- | --- | --- | --- |
| `auth.login_verification` | User requests email login code | Signing-in user | None |
| `invitation.received` | Brand sends creator invitation | Creator | View Invitation |
| `invitation.accepted` | Creator accepts invitation | Brand | View Candidates |
| `invitation.declined` | Creator declines invitation | Brand | View Candidates |
| `collaboration.selected` | Brand selects creator / production starts | Creator | Open Project |
| `review.version_uploaded` | Creator uploads V1-V5 | Brand | Open Review Center |
| `review.revision_requested` | Brand requests revision | Creator | View Feedback |
| `review.approved` | Brand approves delivery | Creator | View Project |
| `settlement.payment_released` | Escrow release begins / payout notification | Creator | View Settlement |
| `revision.additional_purchased` | Brand purchases 20% paid revision add-on | Brand and creator | Continue Working |
| `arbitration.started` | Campaign dispute opened | Participants and admins | View Case |

## Implementation Files

- `features/email/templates/enterprise-email-templates.tsx` contains the template renderers.
- `features/email/email-delivery.service.ts` sends via Resend and writes `EmailLog`.
- `features/notification/notification-email.service.ts` bridges notification events to enterprise templates.
- `features/auth/auth-security.service.ts` uses `auth.login_verification`.

## Variable Policy

Templates must receive variables from the triggering service. Avoid hardcoding project, brand, budget, deadline, version, transaction, or dispute details inside the template component.

When a legacy notification path does not have every structured variable yet, the email may fall back to the notification title, body, action URL, and primitive metadata while preserving the same business flow.
