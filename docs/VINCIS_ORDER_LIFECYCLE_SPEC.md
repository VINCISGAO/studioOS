# VINCIS Order Lifecycle Spec

This document is the canonical business lifecycle for VINCIS campaign orders, creator invitations, creator project creation, and review delivery.

Do not change this lifecycle in code, UI, copy, tests, seed data, scripts, or migrations unless the project owner explicitly asks to change this specification.

## Non-Negotiable Rules

- Payment happens before creator matching and invitations.
- Creator invitation acceptance is only collaboration intent.
- Accepting an invitation must never create a formal creator project/order.
- A formal creator project/order is created only after the brand explicitly selects a creator from accepted invitations.
- The selected creator may upload V1 only after the formal project/order exists and escrow is funded.
- Every key lifecycle action must emit the correct notification and activity/audit record.
- AI learning must record meaningful preference signals from creative selection, creator rejection, and brand final creator selection.

## Canonical Lifecycle

1. Brand creates an ad campaign brief.
2. Brand uploads required product/reference assets or provides equivalent brief inputs.
3. AI generates three creative directions.
4. Brand selects one creative direction. This freezes the production brief and records an AI learning event for the selected/rejected creative options.
5. Publishing opens escrow checkout. Publishing does not start creator matching by itself.
6. Brand completes payment/escrow funding.
7. After payment succeeds, AI matches creators and sends invitations.
8. Invited creators receive invitation notifications.
9. Creator accepts or declines the invitation.
10. Decline requires a reason and records an AI learning event.
11. Acceptance means only "interested in collaborating"; it does not create a project/order and does not open upload.
12. Brand receives accept/decline notifications and reviews accepted creators.
13. AI may recommend a best creator, but the brand makes the final selection.
14. If the brand selects a creator different from the AI recommendation, record an AI learning event.
15. Only after brand final selection is the formal creator project/order generated.
16. The selected creator receives a congratulations/selection notification.
17. Only then does the creator workspace show the project and allow direct entry to the review center for V1 upload.
18. Creator uploads V1 and the brand is notified.
19. Brand either approves or requests revision.
20. If approved at any version V1-V5, escrow is released and the project completes.
21. If revision is requested, creator uploads the next version.
22. V1-V3 are included in the base project amount.
23. If V3 is not approved and the brand requests V4, the brand must pay one add-on equal to 20% of the project amount.
24. One paid add-on unlocks both V4 and V5.
25. The creator is notified after the paid revision add-on is completed.
26. Creator uploads V4 and, if needed, V5.
27. If V5 is still not approved, the project escalates to platform/customer-support arbitration. No silent extra revision rounds are allowed.

## State Boundaries

### Campaign / Brand Side

- Draft and AI generation are campaign preparation states.
- Creative direction approval freezes the production brief.
- Publish means "ready for escrow checkout", not "creator matching started".
- Payment success is the gate that allows matching and invitation creation.
- Brand final creator selection is the gate that creates the formal creator order/project.

### Invitation Side

- `pending`: invitation sent after escrow funding.
- `accepted`: creator is interested; brand still must choose.
- `declined`: creator refused and must provide feedback for AI learning.
- `selected`: brand chose this accepted creator; formal project/order may now exist.
- `expired`: creator was not selected after another creator won or recruitment closed.

### Creator Project Side

- No creator project row/card/upload entry exists just because an invitation was accepted.
- The creator project appears only after brand selection creates the formal order/project.
- Upload is blocked while payment is unpaid or the formal order/project does not exist.

### Review Side

- Vn maps exactly to revision round n.
- V1 = round 1, V2 = round 2, V3 = round 3, V4 = round 4, V5 = round 5.
- Rounds 1-3 are free/included.
- One 20% paid add-on unlocks rounds 4-5.
- After V5, further dissatisfaction requires platform arbitration.

## Implementation Guardrails

- Do not implement shortcuts that create orders from invitation acceptance.
- Do not call invitation creation from publish flows unless escrow is already funded.
- Do not expose creator upload actions before final brand selection and funded escrow.
- Do not move lifecycle transitions into UI components.
- Use service/repository/state-machine layers for lifecycle changes.
- Preserve notifications for all important lifecycle actions:
  - creative generated/selected
  - payment success
  - invitations sent
  - creator accepted/declined
  - creator selected
  - project funded/ready
  - version uploaded
  - revision requested
  - paid revision unlocked
  - delivery approved
  - escrow released
  - platform arbitration required

