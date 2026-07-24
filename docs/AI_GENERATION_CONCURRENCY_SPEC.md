# AI Generation Concurrency & Queue Spec

Canonical owner doc: `VINCIS AI 生成并发与队列规则规划.docx` (Desktop developer docs).

## v1 defaults

| Scope | Running | Queued | Total incomplete |
|-------|---------|--------|------------------|
| User (all types) | 4 | 10 | 14 |
| Project | 4 | 12 | 16 |
| Image (user) | 4 | 8 | 12 |
| Video (user) | 1 | 4 | 5 |
| Music (user) | 1 | 4 | 5 |
| Provider queue | — | 50 | — |

Running = `SUBMITTING` + `PROCESSING`. Queued = `QUEUED`.

## Environment variables

```bash
AI_USER_MAX_RUNNING=4
AI_USER_MAX_QUEUED=10
AI_PROJECT_MAX_RUNNING=4
AI_PROJECT_MAX_QUEUED=12
AI_IMAGE_USER_MAX_RUNNING=4
AI_VIDEO_USER_MAX_RUNNING=1
AI_MUSIC_USER_MAX_RUNNING=1
AI_IMAGE_USER_MAX_QUEUED=8
AI_VIDEO_USER_MAX_QUEUED=4
AI_MUSIC_USER_MAX_QUEUED=4
AI_PROVIDER_MAX_QUEUED=50
SEEDANCE_MAX_CONCURRENT=1
MUREKA_MAX_CONCURRENT=1
IMAGE_PROVIDER_MAX_CONCURRENT=4
```

## Code layout

- `features/generation/concurrency/generation-concurrency-policy.ts`
- `features/generation/concurrency/generation-concurrency.service.ts`
- `features/generation/concurrency/generation-queue.repository.ts`
- `features/generation/concurrency/generation-dispatcher.service.ts`
- `lib/canvas/schedule-generation-job.ts`

## API errors

| Code | HTTP | When |
|------|------|------|
| `AI_USER_QUEUE_LIMIT_REACHED` | 429 | User/project/type queue full |
| `AI_PROVIDER_QUEUE_BUSY` | 503 | Provider queue depth exceeded |

## Flow

1. Create: validate → quote → **assertCanCreateJob (advisory lock)** → reserve credits → create `QUEUED` job
2. Dispatch: **checkCanDispatchJob** → schedule worker only when running capacity available
3. Terminal: `finalizeCanvasGenerationJob` → **dispatchQueuedJobs** for same owner/project

UI unchanged; existing「快速 / 排队」mapping is server-driven by dispatch decision.

## P1.5 — Stale job recovery

| Timeout | Default | Action |
|---------|---------|--------|
| Queue timeout | 12h (`AI_GENERATION_QUEUE_TIMEOUT_MS`) | `QUEUED` → `FAILED` + credits release |
| Dispatch timeout | 10m (`AI_GENERATION_DISPATCH_TIMEOUT_MS`) | `SUBMITTING` → re-`QUEUED` once, then `FAILED` |
| Processing timeout | 30m (`AI_GENERATION_PROCESSING_TIMEOUT_MS`) | `PROCESSING` → `FAILED` + credits release |

- Cron: `npm run generation:stale:reaper` (hourly recommended)
- Opportunistic: `canvasService.getJob` calls `reconcileJobIfStale`
- Code: `features/generation/concurrency/generation-stale-job.service.ts`

## Deferred (P2/P3)

- Queue position UI
- Fair round-robin dispatch
- User cancel `QUEUED` + credits release
- BullMQ / Redis workers
