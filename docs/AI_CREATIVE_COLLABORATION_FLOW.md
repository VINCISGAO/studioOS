# VINCIS AI Creative Collaboration Flow

AI Creative Collaboration is the post-payment creative drafting workflow between Brand and Creator.

It is not an automatic pre-payment idea generator, and it is not a final script approval system. Its purpose is to let Brand and Creator exchange AI-assisted creative drafts, refine direction, and confirm the final creative intent before production risk increases.

## Core Principles

- The system must never auto-generate AI creative ideas.
- AI creative generation must always be triggered by an explicit Brand or Creator click.
- AI creative output is a reference draft until both sides confirm a direction.
- AI generation must not consume tokens before escrow payment.
- Every generation must have a clear actor, project, trigger source, and optional parent idea.
- A confirmed creative direction is collaboration evidence and must enter AI learning.

## Lifecycle Position

This flow starts only after:

1. Brand submits requirements.
2. Brand completes escrow payment.
3. AI creator matching and invitations run.
4. Brand selects a Creator.
5. The active project exists.

The creative collaboration flow can happen before V1 upload, but it must not block review access entirely. If no creative direction is confirmed, the UI should warn both sides that production may carry rework risk.

## Brand-Initiated Ideas

After payment and active project creation, the Brand project form may show:

```text
AI 帮我想想
```

When clicked, show:

```text
AI 正在为你生成 3 个最佳创意方向。
```

Generated result copy:

```text
以下创意仅供参考，最终创作方向由品牌方与 Creator 共同确认。
```

The Brand may:

- Select one AI idea direction.
- Deepen the selected direction.
- Send the selected or deepened draft to the Creator as reference.
- Skip all generated ideas.

If Brand sends an idea to Creator:

- Record it as Brand Creative Preference.
- Store it as an AI learning event.
- Treat it as Brand intent, not final production approval.
- Make it visible in the Creator project form.

## Brand Skips AI Ideas

If Brand does not click `AI 帮我想想`:

- Do not generate creative ideas.
- Do not consume AI tokens.
- Creative ideation responsibility defaults to Creator.
- Creator must propose a creative direction for Brand confirmation.

## Creator Derivative Ideas

If Brand sent an AI idea direction:

- Creator receives the Brand idea form.
- Creator can click `AI 帮我想想`.
- Creator may generate up to 3 derivative attempts.
- Derivatives must stay anchored to the Brand-selected direction.
- Derivatives are Creator-side drafts, not final approval.

## Creator-Initiated Ideas

If Brand did not send an AI idea direction:

- Creator must create a creative direction in the project form.
- Creator may write it manually.
- Creator may click `AI 帮我想想`.
- Creator can generate 3 creative directions.
- Creator sends one or more directions to Brand for confirmation.

## Brand Confirmation and Re-Derivation

When Brand receives Creator creative directions, Brand may:

- Confirm the direction.
- Request revision.
- Click `AI 帮我想想` based on the Creator direction.
- Generate a better Brand-preferred derivative.
- Send the derivative back as the final creative direction.

## Intent Draft Creation

A true creative intent draft is created only when one of these happens:

- Brand selects an AI direction, sends it to Creator, and Creator receives / acknowledges it.
- Creator creates a direction, sends it to Brand, and Brand confirms it.
- Brand deepens a Creator direction with AI, confirms it, and sends it back to Creator.

Before that point, all AI output is only reference material.

## Review Center Rule

Creator may open the review center and upload V1 after active project creation.

If no creative direction is confirmed, the system should show:

```text
请先确认创意方向，再开始制作。
```

If Creator continues anyway, mark:

```text
未确认创意方向，存在返工风险。
```

## AI Learning Events

The platform must record these events through AIEvent / AILearning:

- `brand_ai_idea_clicked`
- `brand_ai_idea_generated`
- `brand_ai_idea_selected`
- `brand_ai_idea_deepened`
- `brand_ai_idea_sent_to_creator`
- `brand_ai_idea_skipped`
- `creator_ai_idea_clicked`
- `creator_ai_idea_generated`
- `creator_ai_idea_selected`
- `creator_idea_sent_to_brand`
- `brand_confirmed_creator_idea`
- `brand_rejected_creator_idea`
- `brand_deepened_creator_idea`
- `final_creative_direction_confirmed`

## Token Control

AI token usage must obey these rules:

- Only explicit clicks may consume tokens.
- System automatic lifecycle steps must not consume tokens.
- Each generation must include:
  - `project_id`
  - `campaign_id`
  - `user_id`
  - `role`
  - `trigger_source`
  - `parent_idea_id` when the idea is a derivative

## Engineering Rules

- Store creative ideas as Campaign-linked records or Campaign-scoped JSON only if no table exists yet.
- New persistent tables for creative ideas must include `campaign_id`.
- Page components must not call OpenAI directly.
- Actions validate actor, project ownership, and project lifecycle.
- Services handle generation, learning events, and final confirmation.
- Repositories persist ideas and events.
- Final creative direction confirmation must be auditable.

## Implementation Phases

### Phase 1: Rules and Guardrails

- Document this spec.
- Ensure current AI generation stays post-payment and manual.
- Add learning event names to protected AI learning inventory.

### Phase 2: Minimal Collaboration Loop

- Brand project form: generate / select / deepen / send to Creator.
- Creator project form: receive / generate derivative / send to Brand.
- Brand confirms or rejects Creator idea.
- Confirmed idea becomes `final_creative_direction`.

### Phase 3: Memory and Ranking

- Feed confirmed creative direction into Brand AI Taste.
- Feed Creator derivative success into Creator Creative DNA.
- Use future confirmed creative direction history as a creator-matching signal.
