# Mureka API 接入技术 Spec

> Canvas 音乐生成 · Worker · 并发 · 退款  
> 关联：`docs/MUREKA_CREDITS_PRICING.md` · `docs/MUREKA_MUSIC_API_PRICING.md`  
> 代码入口：`lib/canvas/mureka-client.ts` · `features/canvas/canvas-music-generation.service.ts`  
> 制定日期：2026-07-23

---

## 1. 目标与范围

| 项 | 说明 |
|----|------|
| 目标 | Canvas `/studio/canvas` 音乐节点调用 **Mureka 官方 API** 生成可播放音频，按 Credits 扣费 |
| Phase 1 | instrumental / easy-generate / song+lyrics / 轮询 / R2 存储 / 失败退款 |
| Phase 2 | soundtrack（image_id）、remix、extend、stem、vocal clone |
| 非目标 | 前端直连 Mureka；修改 Mureka 账号并发档位 |

---

## 2. 架构

```
┌─────────────┐     POST /api/generation/music      ┌──────────────────┐
│ Canvas UI   │ ──────────────────────────────────► │ canvas.service   │
└─────────────┘                                     │ createMockGen... │
       ▲                                            └────────┬─────────┘
       │ SSE /api/events/generation                          │
       │                                                     ▼
       │                              ┌──────────────────────────────────────┐
       │                              │ creditGenerationBillingService       │
       │                              │  reserveForGeneration (ACTIVE)       │
       │                              └──────────────────────────────────────┘
       │                                                     │
       │                                                     ▼
       │                              ┌──────────────────────────────────────┐
       │                              │ generation_jobs (QUEUED, provider=   │
       │                              │ mureka, provider_task_id, …)         │
       │                              └──────────────────────────────────────┘
       │                                                     │
       │                              after() / future queue │
       │                                                     ▼
       │                              ┌──────────────────────────────────────┐
       │                              │ canvas-music-generation.service      │
       │                              │  1. submitMurekaMusicTask            │
       │                              │  2. murekaPollTask                   │
       │                              │  3. murekaDownloadAudio              │
       │                              │  4. saveGeneratedAudioBuffer → R2    │
       │                              │  5. syncJobBilling                   │
       └──────────────────────────────│  SUCCEEDED → node audio URL          │
                                      └──────────────────────────────────────┘
                                                     │
                                                     ▼
                                      ┌──────────────────────────────────────┐
                                      │ https://api.mureka.ai                  │
                                      │ Bearer MUREKA_API_KEY                  │
                                      └──────────────────────────────────────┘
```

### 2.1 分层（遵守 VINCIS 工程规则）

| 层 | 职责 |
|----|------|
| `app/api/generation/music` | 鉴权 + Zod 校验 |
| `canvas.service` | 权限、定价 guard、创建 Job、调度 Worker |
| `canvas-music-generation.service` | Mureka 异步流程 + 资产落库 |
| `mureka-client` | HTTP、轮询、下载；**禁止** UI 引用 |
| `canvas.repository` | Job 持久化 |
| `credit-generation-billing.service` | 预扣 / 捕获 / 释放 |

---

## 3. 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `MUREKA_API_KEY` | 是 | 平台 API Keys 页生成；仅服务端 |
| `MUREKA_API_BASE_URL` | 否 | 默认 `https://api.mureka.ai` |
| `DATABASE_URL` | 是 | Job + 账本 |
| `R2_*` | 生产必填 | 生成音频对象存储 |

检查：`GET /api/v1/mureka/status` → `{ configured: boolean }`

---

## 4. Mureka API 映射（Phase 1）

| Canvas 条件 | Mureka 端点 | Query 端点 |
|-------------|-------------|------------|
| `instrumental=true` 或 `mode=soundtrack` | `POST /v1/instrumental/generate` | `GET /v1/instrumental/query/{id}` |
| `mode=simple` 且人声 | `POST /v1/song/easy-generate` | `GET /v1/song/query/{id}` |
| `mode=custom` 且人声 | 可选 `POST /v1/lyrics/generate` → `POST /v1/song/generate` | `GET /v1/song/query/{id}` |

**强制参数**

- `n: 1` — Mureka 默认 `n=2` 会双倍扣费
- `model` — 见 `resolveMurekaModelId()`（basic→`mureka-7.6`，studio→`mureka-8`，all→`auto`）

**任务状态（Mureka）**

`preparing` → `queued` → `running` → `streaming` → `succeeded` | `failed` | `timeouted` | `cancelled`

**成功产物**

`choices[].url`（MP3，CDN 约 30 天有效）→ 下载后立即存 R2，不依赖 Mureka URL 长期可用。

---

## 5. Worker 与队列

### 5.1 当前实现（Phase 1）

- 调度：`Next.js after()` 在 `canvas-music-generation.service.scheduleJob()` 内触发
- 状态机：`generation_jobs.status` — `QUEUED` → `PROCESSING` → `SUCCEEDED` | `FAILED`
- 进度：按 Mureka `status` 映射 15–100（`murekaTaskProgress`）
- 前端：SSE `GET /api/events/generation?projectId=` 每秒推送 Job 列表

**限制**

- `after()` 与 HTTP 请求同进程；Vercel 函数超时内必须完成轮询（最长 **8 分钟**）
- 无跨实例全局队列；**多 Job 同时 submit 会占满 Mureka 并发**

### 5.2 目标实现（Phase 1.5 — 推荐上线前）

使用已有 `REDIS_URL` + BullMQ（与 Video Engine 同栈）：

```
music-generation queue
  job: { generationJobId, ownerId }
  concurrency: MUREKA_MAX_CONCURRENT (env, 默认 1)
  attempts: 1 (Mureka 任务本身异步，不在 Worker 内 retry submit)
  lockDuration: 10m
```

| 组件 | 职责 |
|------|------|
| API Route | 只创建 `generation_jobs` + `reserveCredits`，`queue.add()` |
| Worker 进程 | `processJob()` 全逻辑；与 web 分离 |
| DB | 唯一真相；Worker 崩溃可 `stale job reaper` 标记 FAILED 并退款 |

**Env**

```bash
MUREKA_MAX_CONCURRENT=1          # 对齐 Mureka $30 档位
MUSIC_GENERATION_POLL_TIMEOUT_MS=480000
MUSIC_GENERATION_POLL_INTERVAL_MS=3000
```

### 5.3 Stale Job 恢复

| 条件 | 动作 |
|------|------|
| `PROCESSING` 超过 15 分钟且无 `provider_task_id` | `FAILED` + `MUREKA_SUBMIT_TIMEOUT` + release reservation |
| `PROCESSING` 有 `provider_task_id` 超过 20 分钟 | 最后一次 query；仍 running 则 `FAILED` + `MUREKA_TASK_TIMEOUT` + release |
| 用户重复点击 | 同 `idempotencyKey` → upsert 不重复扣费（`ownerId_idempotencyKey` unique） |

---

## 6. 并发控制

### 6.1 Mureka 账号级并发

由 **Mureka 预充值档位** 决定（非 VINCIS 代码）。VINCIS 必须 **主动限流**，避免 429 / 排队失败。

| Mureka 充值 | 并发上限 | 建议 `MUREKA_MAX_CONCURRENT` |
|-------------|----------|------------------------------|
| $30 | 1 | **1** |
| $1,000 | 5 | 5 |
| $3,000 | 15 | 15 |

### 6.2 VINCIS 侧策略

1. **队列 concurrency** = `min(MUREKA_MAX_CONCURRENT, tier)`  
2. **单用户**（可选 Phase 2）：同一 creator 最多 1 个 `PROCESSING` MUSIC job  
3. **Submit 前**：若队列深度 > 10，API 返回 `503` +「系统繁忙」  
4. **Metrics**：记录 `mureka.queue.wait_ms`、`mureka.task.duration_ms`、`trace_id`

### 6.3 与 Credits 套餐无关

用户买 15,000 Credits 包 **不提高** Mureka 并发；只提高可调用次数。Owner 需单独升级 Mureka 档位。

---

## 7. 计费与退款

### 7.1 流程

```
1. quoteGeneration     → credit_pricing_rules（Mureka +10%，见 MUREKA_CREDITS_PRICING.md）
2. reserveCredits      → credit_reservations ACTIVE
3. Job SUCCEEDED       → captureReservation(actualCredits)
4. Job FAILED/CANCELLED → releaseReservation（全额退还）
```

实现：`credit-generation-billing.service.syncJobBilling()`

### 7.2 退款策略

| 场景 | Credits | Mureka 侧 |
|------|---------|-----------|
| 提交前校验失败（无 KEY） | 不扣 | 无调用 |
| Mureka 4xx/5xx 提交失败 | **全额退** | 通常不计费 |
| 轮询 `failed/timeout/cancelled` | **全额退** | 以 Mureka 账单为准 |
| 下载/存 R2 失败 | **全额退** | 可能已计费 — 需对账 |
| `SUCCEEDED` | **捕获** quoted credits | 计费 |

`credit_pricing_rules.refund_on_failure = true`（Music 规则默认开启）。

### 7.3 部分成功

- Mureka `n=1` 仅一条 `choices[]`；无 partial batch 问题  
- 若未来 `n>1`：按 **实际成功条数** 捕获 Credits，失败条 `release` 比例退款（Phase 2）

### 7.4 歌词 API

- CUSTOM 人声无歌词时先调 `lyrics/generate`（+$0.009）  
- Credits 规则已打包进 **CUSTOM 人声** 一行（Basic 5 / Studio 6）  
- 用户自带歌词时不调 lyrics API，**仍收同一档**（简化报价，避免预检差异）

### 7.5 对账

- Job 存 `providerCostSnapshot`、`pricingSnapshot`、`quotedAt`  
- 日志记录 Mureka `trace_id`（`MurekaApiError.traceId`）  
- 月度：Σ `provider_cost_minor` vs Mureka billing export

---

## 8. 安全

- `MUREKA_API_KEY` 仅 server；禁止 `NEXT_PUBLIC_*`  
- 下载 Mureka URL 仅服务端 fetch；不暴露给用户浏览器  
- Master admin / OAuth 栈不受影响（super-admin lock）

---

## 9. 观测与告警

| 信号 | 阈值 | 动作 |
|------|------|------|
| `MUREKA_AUTH_FAILED` | 任意 | 检查 KEY / 余额 |
| `MUREKA_TASK_TIMEOUT` 率 | > 5% / 1h | 查 Mureka 状态 / 提并发档位 |
| 队列等待 | p95 > 2min | 升 Mureka 档位或限流 UI |
| capture − release 不平衡 | 日 diff | 财务对账 |

---

## 10. 测试清单

- [ ] `MUREKA_API_KEY` 缺失 → API 明确错误，不扣 Credits  
- [ ] Basic SIMPLE 器乐 → 4 Credits 捕获 + MP3 可播  
- [ ] Studio CUSTOM 人声 → 6 Credits  
- [ ] 故意错误 KEY → FAILED + Credits 退回  
- [ ] 同 idempotencyKey 双 POST → 不双扣  
- [ ] SSE 推送 `outputAssetId` → 节点 `<audio>` 可播  
- [ ] `npm run credits:pricing:verify` 通过 music 模型 quote  

---

## 11. Phase 2  backlog

| 项 | API | 定价（Credits） |
|----|-----|-----------------|
| 图/视频原声带 | `POST /v1/soundtrack/generate` | 11 |
| Remix | `POST /v1/song/remix` | 22 |
| Extend | `POST /v1/song/extend` | 4–11 |
| Stem | `POST /v1/song/stem` | 7–77 |
| Vocal clone | `POST /v1/song/vocal-clone` | 550 |
| BullMQ Worker | 独立进程 | — |

---

## 12. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-23 | 初版：Phase 1 实现 + 队列/并发/退款 spec |
