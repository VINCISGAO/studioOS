# VINCIS AI Preference Engine

AI Preference Engine（AI 偏好引擎）是 VINCIS 的核心 AI 护城河之一。

它不是一个“点赞功能”。Creator 收藏只是入口，真正的系统价值是：VINCIS 持续学习广告主的审美、商业偏好、预算偏好、协作偏好和成交行为，并把这些长期记忆转化为可迭代的 Creator Ranking 与 Brand AI Taste。

## Product Principle

Creator 页面使用 **Save Creator / 收藏创作者**，不使用 Like。

原因：

- 广告主不会“点赞”服务商或创作者。
- 广告主真实行为是保存、收藏、稍后比较、邀请、合作。
- Behance、Pinterest、Dribbble、Instagram 等创意平台都更接近 Save 行为。

## AI Learning Rules v1

Every brand interaction contributes to the AI preference model.

### Positive Signals

| Action | Event Type | Weight |
| --- | --- | ---: |
| View Creator Profile | `view_creator` | +1 |
| View Portfolio | `view_portfolio` | +3 |
| Save Creator | `save_creator` | +10 |
| Contact Creator | `contact_creator` | +20 |
| Invite Creator | `invite_creator` | +30 |
| Hire Creator | `hire_creator` | +100 |

### Negative Signals

| Action | Event Type | Weight |
| --- | --- | ---: |
| Quick Exit | `quick_exit` | -2 |
| Declined Invite | `declined_invite` | -5 |
| Report Portfolio | `report_portfolio` | -100 |

## Learning Event Model

Do not model this as a simple `creator_likes` table.

Minimum event shape:

```text
ai_learning_events
id
brand_id
campaign_id
event_type
target_type
target_id
weight
metadata_json
created_at
```

The platform should learn why a brand saved or hired a creator, not only who was saved.

Example preference vector:

```json
{
  "cinematic": 0.91,
  "luxury": 0.87,
  "minimal": 0.93,
  "travel": 0.73,
  "female_creator": 0.52,
  "food": 0.08,
  "sports": 0.12
}
```

## Learning Rules Must Be Configurable

Weights must not be hard-coded in matching code.

Avoid:

```ts
if (saved) {
  score += 10;
}
```

Preferred model:

```text
ai_learning_rules
id
event_type
weight
enabled
description
created_at
updated_at
```

This lets operators tune the platform without redeploying:

```text
save_creator: 10 -> 20
hire_creator: 100 -> 120
```

## Brand AI Taste

AI Preference Engine should generate a private Brand AI Taste profile.

Example:

```text
Luxury       92%
Minimal      88%
Travel       76%
Food         63%
Fast Edit    12%
Cinematic    98%
Color        Dark
```

Brand AI Taste is not just a dashboard metric. It becomes a matching input.

## Creator Ranking Formula

Creator matching should rank by semantic preference and performance, not by raw saves.

Conceptual formula:

```text
AI Matching Score =
Portfolio Similarity
+ Brand Preference Score
+ Saved Creator Similarity
+ Delivery History
+ Completion Score
+ Category Match
+ Language Match
+ Budget Match
+ Availability
+ Recent Activity
```

The saved creator can rank high, but the engine should also surface creators with similar taste signatures.

## Product UX Rules

- Button label: **Save Creator** / **收藏创作者**.
- Do not expose “AI is learning you” as a noisy product promise.
- Learning should be quiet, continuous, and behavior-driven.
- Optional V2 prompt: after saving a creator, ask “Why save?” with tags such as:
  - Cinematography
  - Color grading
  - Editing rhythm
  - AI capability
  - Commercial expression
  - Brand fit
  - Price value
  - Future collaboration

## AI Creative Collaboration

AI creative generation is a collaboration draft tool, not an automatic pre-payment step.

Rules:

- AI creative ideas must be triggered by explicit Brand or Creator clicks.
- AI creative generation must not consume tokens before escrow payment.
- Generated ideas are reference drafts until Brand and Creator confirm a direction.
- Brand-selected, Creator-sent, Brand-rejected, deepened, skipped, and final confirmed ideas are AI learning signals.
- Final confirmed creative direction becomes a future Brand AI Taste and Creator Creative DNA input.

Canonical spec: [`docs/AI_CREATIVE_COLLABORATION_FLOW.md`](./AI_CREATIVE_COLLABORATION_FLOW.md)

## Engineering Rules

- Every learning event tied to a Campaign must include `campaign_id`.
- Use Feature First structure under `features/memory`, `features/matching`, or a future `features/preference`.
- Page and UI components must not calculate AI scores.
- Actions record behavior; services resolve learning rules; repositories persist events and profiles.
- Ranking changes must be testable and explainable.
- Do not change order lifecycle, payment, invitation, or review state machines to implement this engine.
- Creative collaboration AI generation must include actor, role, project, campaign, trigger source, and parent idea when derived.

## Implementation Status

Current system already has early foundations:

- `AiPreference`
- `MemoryFact`
- `RelationshipDna`
- AI learning events in invitation decline and campaign selection flows

Next implementation should formalize configurable learning rules and creator save events before changing ranking behavior.

Protected inventory: [`docs/AI_LEARNING_FOUNDATION.md`](./AI_LEARNING_FOUNDATION.md)
