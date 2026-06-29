# State Machine Specification

> Vol 18 — all business status changes must use `runTransition()` from `lib/core/transition-runner.ts`

## Universal Interface

```typescript
interface StateMachine<TState, TEvent> {
  canTransition(current: TState, event: TEvent): boolean;
  transition(current: TState, event: TEvent): TState;
  getAvailableEvents(current: TState): TEvent[];
}
```

Implementation: `lib/core/state-machine.ts`  
All machines: `features/shared/state-machines/`

## Campaign

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> AI_PROCESSING: START_AI
  AI_PROCESSING --> CREATIVE_READY: AI_SUCCESS
  AI_PROCESSING --> DRAFT: AI_FAILED
  CREATIVE_READY --> CREATIVE_APPROVED: APPROVE_CREATIVE
  CREATIVE_APPROVED --> MATCHING: START_MATCHING
  MATCHING --> CREATOR_ACCEPTED: CREATOR_ACCEPT
  CREATOR_ACCEPTED --> ESCROW_FUNDED: PAYMENT_SUCCESS
  ESCROW_FUNDED --> PRODUCING: START_PRODUCTION
  PRODUCING --> UNDER_REVIEW: VERSION_UPLOAD
  UNDER_REVIEW --> PRODUCING: REQUEST_REVISION
  UNDER_REVIEW --> APPROVED: APPROVE
  APPROVED --> MASTER_UPLOADED: MASTER_UPLOAD
  MASTER_UPLOADED --> SETTLEMENT: RELEASE_PAYMENT
  SETTLEMENT --> COMPLETED: COMPLETE
```

Code: `features/campaign/campaign.state-machine.ts`

## Review (per version)

```mermaid
stateDiagram-v2
  [*] --> WAITING
  WAITING --> READY: VERSION_READY
  REVISION_REQUIRED --> READY: VERSION_READY
  READY --> REVIEWING: START_REVIEW
  REVIEWING --> REVISION_REQUIRED: REQUEST_REVISION
  REVISION_REQUIRED --> WAITING: RESUBMIT
  REVIEWING --> APPROVED: APPROVE
  APPROVED --> LOCKED: LOCK
```

Max 3 revision rounds — then admin intervention.

Code: `features/review/review.state-machine.ts`

## Version (video processing)

```mermaid
stateDiagram-v2
  UPLOADING --> PROCESSING --> TRANSCODING --> GENERATING_HLS
  GENERATING_HLS --> AI_ANALYZING --> READY --> REVIEWING
  REVIEWING --> APPROVED --> MASTER
  UPLOADING --> FAILED: FAIL
  FAILED --> UPLOADING: RETRY
```

Code: `features/shared/state-machines/version.state-machine.ts`

## Side Effects Rule (Ch.14)

```
Transition → Persist → Audit Log → Publish Event → Worker (email/push/ws)
```

**禁止**在状态转换中直接发邮件或 Push。

## Cursor Rules (Ch.18)

- 禁止 `campaign.status = "APPROVED"`
- 必须 `campaignService.transition(id, "APPROVE", actor)`
- 每次 Transition：验证 + 事务 + Event + Audit + Permission
