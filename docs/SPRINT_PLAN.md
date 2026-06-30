# Sprint Plan

> 按文档建议拆分为 21 个 Sprint，避免一次生成万行代码

| Sprint | 范围 | 验收标准 | 状态 |
|--------|------|----------|------|
| **1** | Docker + Prisma + Login + User | 登录成功、DB 连接、`/api/v1/health` 200 | ✅ |
| **2** | Campaign CRUD + Assets Upload | 创建 Campaign、上传 Logo | ✅ |
| **3** | AI Creative + Matching | 3 个创意方向、Creator 邀请 | ✅ |
| **4** | Review Timeline + Comment + Annotation | HLS 播放、时间码评论、画圈 | ✅ |
| **5** | Approve + Revision + State Machine | 状态机流转、Activity Log | ✅ |
| **6** | Video Worker + HLS + Watermark | 分片上传、转码队列 | ✅ |
| **7** | Escrow + Stripe Checkout | 全款托管、Webhook | ✅ |
| **8** | Wallet + Ledger + Withdraw | 双账本、提现 | ✅ |
| **9** | Notification + Event Bus | 邮件/站内/WebSocket | ✅ |
| **10** | AI Gateway + Queue | 异步 AI、成本追踪 | ✅ |
| **11** | Design System 落地 | Token 统一、组件库 | ✅ |
| **12** | Campaign Wizard 7 步 | 断点续填、WebSocket 进度 | ✅ |
| **13** | Creator Portal 统一 | 接单、交付、审片 | ✅ |
| **14** | Brand Portal 统一 | 项目中心、审片、结算 | ✅ |
| **15** | Admin + Dispute + Audit | 仲裁、日志、Feature Flag | ✅ |
| **16** | Security + Signed URL + RBAC | 权限矩阵、Rate Limit | ✅ |
| **17** | E2E Happy Path | QA 脚本 15 步全绿 | ✅ |
| **18** | Performance + Monitoring | Sentry、Grafana、LCP <2.5s | ✅ |
| **19** | Creator Membership UI | 仪表盘会员区、升级弹窗、Admin 配置 | ✅ |
| **20** | OpenAPI + SDK | 契约 spec、客户端、/api/v1/openapi | ✅ |
| **21** | Playwright E2E | 浏览器 Happy Path + OpenAPI smoke | ✅ |
| **22** | MVP Payment Collection | Checkout → Webhook → Commission → Manual payout | ✅ |

## Sprint 22 — MVP Payment Collection ✅

- [x] Stripe checkout session + webhook signature verification
- [x] Payment success: mark PAID, save transaction ID, DB commission snapshot
- [x] Creator payout `MANUAL_PAYOUT_PENDING` + admin mark paid
- [x] Payment fail/cancel: keep unpaid, notify brand
- [x] Admin `/admin/payments` + `GET/POST /api/v1/admin/payments`
- [x] `npm run payment:verify` + `npm run production:verify`

```bash
npm run db:init
npm run payment:verify
npm run production:verify
```

## Sprint 20 — OpenAPI + SDK ✅

- [x] `docs/openapi/openapi.yaml` — v1 contract (Campaign, Review, Payment, Admin, Membership)
- [x] `GET /api/v1/openapi` — serve spec at runtime
- [x] `lib/api-client/studioos-api.ts` — typed fetch client
- [x] `npm run openapi:generate` + `npm run sprint20:verify`

## Sprint 21 — Playwright E2E ✅

- [x] `playwright.config.ts` + `e2e/happy-path.spec.ts`
- [x] Demo login fixture — brand / creator / admin flows
- [x] `npm run e2e` + `npm run sprint21:verify`

```bash
npm run db:seed
npm run sprint20:verify
npm run sprint21:verify
npm run e2e   # optional — starts dev server if not running
```

## Sprint 19 — Creator Membership UI ✅

- [x] `CreatorMembershipPanel` — `/studio` dashboard section (DB-driven rates)
- [x] `CreatorMembershipUpgradeDialog` — auto-prompt when threshold met
- [x] `/admin/membership` — commission rule + plan overview (no hard-coded rates)
- [x] `activateVerifiedMembershipDemo` — local upgrade without Stripe
- [x] Creator sign-in → `ensureDefaultMembershipOnCreatorRegister`
- [x] `npm run membership-ui:verify`

```bash
npm run db:seed
npm run membership:verify
npm run membership-ui:verify
# 浏览器: /studio (creator.nova@adbridge.test) · /admin/membership (admin@adbridge.test)
```

## 当前 Sprint 1 任务

- [x] `docker-compose.yml` (Postgres, Redis, MinIO, Mailpit)
- [x] `prisma/schema.prisma` (Vol 02 + Vol 18 v2 扩展)
- [x] 10 个状态机 + `runTransition()`
- [x] Prisma migrate + seed 跑通（`npm run db:init` + `npm run sprint1:verify`）
- [x] User 表接入登录（替换 demo cookie）
- [x] `/api/v1/auth/me`
- [x] `/api/v1/auth/logout`

### Sprint 1 本地验收

```bash
npm run db:init          # Docker + migrate + seed
npm run sprint1:verify   # DB + 登录 + seed 检查
npm run dev
curl http://localhost:3000/api/v1/health
# 登录: client.arc@adbridge.test / TempAdBridge2026!
```

## 当前 Sprint 2 任务

- [x] `CampaignRepository` — list / update / assets
- [x] `CampaignService` — CRUD + RBAC
- [x] `CampaignAssetService` — Logo 上传（本地存储 + Prisma）
- [x] `/api/v1/campaigns` — GET list / POST create
- [x] `/api/v1/campaigns/{id}` — GET / PATCH
- [x] `/api/v1/campaigns/{id}/assets` — GET / POST (Logo)
- [x] `/api/campaign-assets/{id}/{filename}` — 文件读取
- [x] Wizard `uploadLogoAssetAction` 双写 Prisma

### Sprint 2 本地验收

```bash
npm run db:init
npm run sprint2:verify
npm run dev

# 登录后（需 cookie session）:
curl -b cookies.txt -X POST http://localhost:3000/api/v1/campaigns \
  -H 'Content-Type: application/json' \
  -d '{"title":"My Campaign","budget":1800,"deadline":"2026-07-15","platform":"TikTok","aspect_ratio":"9:16"}'
```

## 当前 Sprint 3 任务

- [x] `CreativeDirectionService` — 生成 3 个创意方向 + `AiJob` 记录
- [x] 状态机：`START_AI` → `AI_SUCCESS` → `APPROVE_CREATIVE` → `START_MATCHING`
- [x] `MatchingService` — Prisma Creator 评分排序
- [x] `InvitationService` — 发送 / 接受 / 拒绝邀请
- [x] `/api/v1/campaigns/{id}/creative` — GET / POST
- [x] `/api/v1/campaigns/{id}/creative/approve` — POST
- [x] `/api/v1/campaigns/{id}/matches` — GET
- [x] `/api/v1/campaigns/{id}/invitations` — GET / POST
- [x] `/api/v1/invitations/{id}/accept|decline` — POST
- [x] Wizard `prepareBrandCampaignAction` 双写 Prisma 创意流程

### Sprint 3 本地验收

```bash
npm run db:seed   # 刷新 creator DNA 数据
npm run sprint3:verify
```

## 当前 Sprint 4 任务

- [x] `ReviewRepository` + 扩展 `ReviewService`（timeline / comments）
- [x] `ReviewBridgeService` — MVP 评论双写 Prisma
- [x] `/api/v1/campaigns/{id}/review` — 审片时间线
- [x] `/api/v1/versions/{id}` — 播放 URL（mp4 + hls）
- [x] `/api/v1/versions/{id}/comments` — GET / POST（时间码 + 画圈）
- [x] `ReviewVideoSource` — Safari 原生 HLS，其他浏览器回退 MP4
- [x] `review-player` 接入 HLS + Prisma 评论同步

### Sprint 4 本地验收

```bash
npm run db:seed
npm run sprint4:verify
# 浏览器: /brand/projects/proj_demo_arc_nova/review
```

## 当前 Sprint 5 任务

- [x] `ReviewDecisionService` — 批准 / 改稿 + Campaign 状态机联动
- [x] `POST /api/v1/versions/{id}/approve`
- [x] `POST /api/v1/versions/{id}/revision`
- [x] `GET /api/v1/campaigns/{id}/activity` — Activity Log
- [x] `ReviewBridgeService` — MVP 批准/改稿双写 Prisma
- [x] `approveFinalAction` / `requestMvpRevisionAction` 接入 Prisma

### Sprint 5 本地验收

```bash
npm run sprint5:verify
```

## 当前 Sprint 6 任务（MVP 骨架）

- [x] 分片上传 — `POST .../versions/upload/init` + chunk + complete
- [x] `VideoWorkerService` — `VideoJob` 队列 + Version 状态机流水线
- [x] `GET /api/v1/versions/{id}/processing` — 转码进度
- [x] 审片水印 — `ReviewWatermarkOverlay`（CSS overlay）
- [x] MVP 上传双写 — `videoBridgeService.syncUploadFromMvp`

### Sprint 6 本地验收

```bash
npm run sprint6:verify
```

## Sprint 6b — Phase 6 Video Engine 完整交付

- [x] **ADR-002** — Review 仅 Signed HLS，禁止公开 MP4（`/api/campaign-videos` 403）
- [x] **Signed URL** — `GET /api/v1/playback/{token}/index.m3u8`
- [x] **ffprobe QA** — 上传完成校验（`VideoQaService`）
- [x] **Playback Audit** — `POST /api/v1/versions/{id}/playback/audit` → ActivityLog
- [x] **Redis/BullMQ** — `features/video/video-queue.service.ts` + `npm run worker:video`
- [x] **FFmpeg 720p HLS** — `VIDEO_WORKER_MODE=ffmpeg` + `features/video/ffmpeg.service.ts`
- [x] **MinIO/R2** — `lib/studioos/object-storage.ts`（本地 `.data/object-storage` 回退）
- [x] **hls.js only** — `ReviewVideoSource` 移除 MP4 回退

### Sprint 6b 本地验收

```bash
npm install
docker compose up -d   # postgres + redis + minio
npm run db:seed
npm run sprint6b:verify
# 可选独立 worker: npm run worker:video
# 真实转码: VIDEO_WORKER_MODE=ffmpeg npm run worker:video
# 浏览器审片: /brand/projects/proj_demo_arc_nova/review
```

## AI Communication Engine（插队）

- [x] `CommunicationMessage` + `CommunicationTranslationLog` — 原文永久保留 + 本地化副本
- [x] `CommunicationAiService` — 自动识别 / 翻译 / 语气优化 / 摘要 / Todo（JSON 输出，3 次重试）
- [x] `POST/GET /api/v1/campaigns/{id}/messages` — 聊天无需手动点翻译
- [x] `POST /api/v1/messages/translate|summarize|todos`
- [x] `GET /api/v1/campaigns/{id}/communication/stream` — SSE 实时事件
- [x] **全平台接入** — Review 评论、Campaign Brief、Creative Script、系统通知
- [x] UI — `CommunicationChatPanel` + `/brand/projects/{id}/communication`

### 本地验收

```bash
npm run db:push    # 或 migrate 006_ai_communication
npm run db:seed
npm run communication:verify
# 浏览器: /brand/projects/proj_demo_arc_nova/communication
```

## AI Memory — Brand / Creator / Relationship DNA（插队）

- [x] `MemoryFact` — 原子记忆事实（数据库，非 Prompt）
- [x] `BrandDna` / `CreatorDna` — 同步至 `brandDnaJson` / `creatorDnaJson`
- [x] `RelationshipDna` — 合作次数、满意度、改稿轮次、提前交付 → **Relationship Intelligence**
- [x] `CampaignMemory` — 新建 Campaign 自动继承 Brand DNA
- [x] **「还是和上次一样」** — `MemoryResolutionService` 自动展开历史偏好
- [x] `AiPreference` — 语言 / 翻译 / 表情 / 语气（Professional, Luxury, Gen Z…）
- [x] 接入 Communication AI 上下文 + Matching 关系加权

### 本地验收

```bash
npm run db:push
npm run memory:verify
# API: GET /api/v1/me/brand-dna, GET /api/v1/campaigns/{id}/memory
```

## 当前 Sprint 7 任务

- [x] `EscrowService` — 托管创建 + Escrow 状态机（CREATED → PAYING → HELD）
- [x] Campaign 联动 — `PAYMENT_SUCCESS` → `START_PRODUCTION`
- [x] `POST /api/v1/campaigns/{id}/checkout` — Stripe Checkout Session
- [x] `POST /api/v1/campaigns/{id}/checkout/demo` — 本地无 Stripe 时 demo 付款
- [x] `GET /api/v1/campaigns/{id}/escrow` — 托管状态
- [x] `POST /api/v1/webhooks/stripe` — Webhook（含 `campaign_id` + legacy `order_id`）
- [x] `PaymentBridgeService` — Prisma 托管成功后同步 legacy order

### Sprint 7 本地验收

```bash
npm run sprint7:verify
# 有 Stripe 密钥时可测真实 Checkout + webhook forward
```

## 当前 Sprint 8 任务

- [x] `WalletService` — 双账本（pending → available）+ 托管释放入账
- [x] `WithdrawService` — 提现申请 / 完成（demo）+ 最低 $100 校验
- [x] `GET /api/v1/wallet` — 余额 + 最近流水
- [x] `GET /api/v1/wallet/transactions` — 账本明细
- [x] `POST /api/v1/wallet/withdraw` — 发起提现
- [x] `POST /api/v1/wallet/withdraw/{id}/complete` — 完成提现
- [x] `POST /api/v1/campaigns/{id}/settlement/release` — 托管释放到 Creator 钱包

### Sprint 8 本地验收

```bash
npm run sprint8:verify
```

## 当前 Sprint 9 任务

- [x] `event-bus` 持久化 — `DomainEvent` 表 + 处理器分发
- [x] `NotificationService` — 站内通知 + Resend 邮件（无 key 时写 EmailLog skip）
- [x] 事件订阅 — 创作者接受 / 托管付款 / 改稿 / 批准
- [x] `GET /api/v1/notifications` — 列表 + 未读数
- [x] `PATCH /api/v1/notifications/{id}/read` + `POST .../read-all`
- [x] `GET /api/v1/notifications/stream` — SSE 实时推送（3s 轮询）
- [x] `instrumentation.ts` — 服务启动注册 handlers

### Sprint 9 本地验收

```bash
npm run sprint9:verify
```

## 当前 Sprint 10 任务

- [x] `AiGatewayService` — 统一 OpenAI 调用 + token/成本追踪
- [x] `AiWorkerService` — `AiJob` 队列（QUEUED → RUNNING → SUCCESS）
- [x] `creative-direction.runner` — OpenAI JSON 或 template 回退
- [x] `GET /api/v1/ai/jobs/{id}` — 任务状态 + 成本
- [x] `GET /api/v1/campaigns/{id}/ai/jobs` — Campaign AI 任务列表
- [x] `POST /api/v1/campaigns/{id}/creative?async=1` — 异步入队
- [x] `POST /api/v1/ai/jobs/process` — Admin 处理下一任务

### Sprint 10 本地验收

```bash
npm run sprint10:verify
# 可选: OPENAI_API_KEY=... 使用真实 OpenAI；否则 template 模式
```

## Sprint 11 — Design System 落地

- [x] `lib/design/tokens.ts` — spacing / radius / motion / semantic class helpers
- [x] `globals.css` + `tailwind.config.ts` — success / warning / review / brand / studio tokens
- [x] `components/ui/*` — Button 32/40/48、Card 28px、Input 14px radius
- [x] 复合组件 — `PageHeader` / `StatCard` / `EmptyState`
- [x] `lib/studioos/product-theme.ts` — 委托至 design tokens
- [x] `brand-portal-shell` — 语义色迁移试点
- [x] 参考页 — `/design-system`

### Sprint 11 本地验收

```bash
npm run sprint11:verify
npm run typecheck
# 浏览器: /design-system
```

## Sprint 12 — Campaign Wizard 7 步 ✅

- [x] `lib/campaign/wizard-steps.ts` — 7 步 canonical + legacy 迁移 + step meta
- [x] **7 屏拆分** — Brand: Brief → Product → References → Analysis → Pack → Confirm → Match
- [x] **7 屏拆分** — Project: Brief → Product → References → Analysis → Options → Pack → Publish
- [x] `WizardDraftService` + `emitWizardProgress` — `productionBrief.wizard` + project settings
- [x] `GET /api/projects/{id}/wizard/stream` — SSE 实时进度（分析 / 匹配）
- [x] `useWizardProgress` + `WizardProgressPanel` — 分析 / 匹配阶段 UI
- [x] Server actions 分步保存 + `runAnalyzingProgress` / `runMatchingProgress`

### Sprint 12 本地验收

```bash
npm run db:push
npm run sprint12:verify
npm run typecheck
# 浏览器: /brand/projects/new?project={id}&step=1
# Step 4 观察分析进度 SSE；Step 7 观察匹配进度
```

## Sprint 13 — Creator Portal 统一 ✅

- [x] `features/creator/` — `CreatorPortalService` + Prisma invitations/campaigns
- [x] `lib/studioos/creator-portal-routes.ts` — canonical `/studio/*` routes
- [x] `GET /api/v1/me/creator/portal` — dashboard API
- [x] `/studio/invitations` — accept / decline project invitations
- [x] `/studio/review` — unified review hub (replaces `/workspace/studio`)
- [x] `/studio/review/[orderId]` — canonical review entry (no `/creator/orders/...` hop)
- [x] Legacy redirects — `/creator/orders/*`, `/workspace/studio` → `/studio/*`
- [x] `StudioPortalShell` nav — Invitations + Review center under `/studio`

### Sprint 13 本地验收

```bash
npm run db:seed
npm run sprint13:verify
npm run typecheck
# 浏览器: /studio (dashboard + invitations)
# /studio/invitations · /studio/review · /studio/delivery
# 登录: creator.nova@adbridge.test / TempAdBridge2026!
```

## Sprint 14 — Brand Portal 统一 ✅

- [x] `features/brand/` — `BrandPortalService` + Prisma campaigns/escrow
- [x] `lib/studioos/brand-portal-routes.ts` — canonical `/brand/*` routes
- [x] `GET /api/v1/me/brand/portal` — dashboard API
- [x] `/brand/review` — unified review hub (replaces `/workspace/brand` review table)
- [x] `/brand/settlement` — escrow & settlement center
- [x] `BrandPortalShell` — sidebar nav (Dashboard, Brief, Review, Settlement, Invoices, Attribution, Profile)
- [x] Legacy redirects — `/workspace/brand`, `/workspace/projects/new` → `/brand/*`

### Sprint 14 本地验收

```bash
npm run db:seed
npm run sprint14:verify
npm run typecheck
# 浏览器: /brand · /brand/review · /brand/settlement
# 登录: client.arc@adbridge.test / TempAdBridge2026!
```

## Sprint 15 — Admin + Dispute + Audit ✅

- [x] `features/admin/` — overview, disputes, audit, feature flags
- [x] `GET /api/v1/admin/overview|disputes|audit|feature-flags`
- [x] `POST/GET /api/v1/campaigns/{id}/disputes` — brand/creator open dispute + activity log
- [x] `/admin/disputes/[id]` — dispute detail + campaign activity timeline
- [x] `/admin/audit` + `/admin/feature-flags` pages
- [x] `AdminOpsPreview` on `/admin` — open disputes + recent audit
- [x] `activityLogWriter` — centralized audit writes
- [x] Prisma-backed disputes + DB feature flags (rate limits in metadata)
- [x] `supabase/migrations/009_admin_feature_flags.sql`

```bash
npm run db:seed
npm run sprint15:verify
# 浏览器: /admin · /admin/disputes · /admin/audit · /admin/feature-flags
# 登录: admin@adbridge.test / TempAdBridge2026!
```

```bash
npm run db:seed
npm run sprint15:verify
```

## Sprint 16 — Security + RBAC ✅

- [x] `lib/core/security/rbac-matrix.ts` — exported permission matrix
- [x] `lib/core/security/rate-limit.service.ts` — DB-driven limits
- [x] `lib/core/security/playback-guard.ts` — RBAC on signed playback
- [x] Login + API rate limiting via feature flag

```bash
npm run sprint16:verify
```

## Sprint 17 — E2E Happy Path ✅

- [x] `scripts/sprint17-verify.ts` — 15 automated checkpoints (QA script map)

```bash
npm run db:seed
npm run sprint17:verify
```

## Sprint 18 — Performance + Monitoring ✅

- [x] `lib/core/monitoring/` — Sentry hook (flag + DSN gated)
- [x] `instrumentation.ts` — init monitoring on boot
- [x] `measureAsync` performance helper

```bash
npm run sprint18:verify
```

## 开发结束检查

```bash
npm run lint
npm run typecheck
npm run test      # Sprint 4+ 起
npm run build
```
