# VINCIS 全项目深度工程审计报告

**审计日期：** 2026-07-05  
**审计模式：** 只读（本报告为唯一产出物；未修改任何业务代码）  
**审计范围：** `app/`、`components/`、`features/`、`lib/`、`prisma/`（只读）、`middleware.ts`、`scripts/`（抽样）  
**工程基线：** `docs/STUDIOOS_ROADMAP.md`、`AGENT.md`、`features/README.md`

---

## 执行摘要

VINCIS 是一个 **Next.js 15 单体应用**，采用 **Feature First + Campaign Aggregate Root** 架构，同时仍保留大量 **JSON file store 遗留层** 与 **三套并行审片 UI 栈**。Prisma/PostgreSQL 路径在核心交易链路上已基本落地，但 legacy `lib/order-service.ts`、`lib/project-service.ts` 与 `app/review-actions.ts` 仍承担大量双写/桥接职责。

| 维度 | 评级 | 一句话 |
|------|------|--------|
| 类型安全 | 🟢 良好 | 无 `@ts-ignore` / 显式 `any`；生产 build 仍 `ignoreBuildErrors` |
| 安全 | 🟡 中等 | Admin 体系较强；部分 legacy API 缺鉴权 |
| 性能 | 🟡 中等 | 无 code splitting；Studio layout 重复 fetch；deposit 轮询曾全页 refresh |
| 架构一致性 | 🟡 中等 | Feature 层与 legacy lib 并存；多处跳层 |
| 代码卫生 | 🟡 中等 | 多份僵尸 UI；8 对重复 AI 路由；15+ 文件超 500 行 |
| 首页 | 🟢 已冻结 | `components/marketing/**` 受 AGENT.md 最高优先级保护 |

**本报告只列问题与路线，不包含任何自动修复。**

---

## A. 当前项目结构总览

### A.1 `app/` 路由结构

**规模：** 127 个 `page.tsx` · 126 个 `app/api/**/route.ts` · 5 个 area layout

| 门户 | 路径前缀 | page 数量 | Layout 鉴权 |
|------|----------|-----------|-------------|
| Brand | `/brand/*` | 36 | `app/brand/layout.tsx` — demo session `role === client"` |
| Studio (Creator) | `/studio/*` | 18 | `app/studio/layout.tsx` — 认证/认证服务商 onboarding 分散在 page |
| Admin | `/admin/*` | 37 | `app/admin/layout.tsx` — `validateAdminSession()` + CSRF |
| Legacy | `/workspace/*`, `/creator/*`, `/dashboard/*` 等 | 36 | 混合 |
| 营销/公开 | `/`, `/pricing`, `/creators` 等 | 8+ | 无 |

**三大 canonical 路由注册表：**

- `lib/studioos/brand-portal-routes.ts`
- `lib/studioos/creator-portal-routes.ts`
- `lib/studioos/admin-portal-routes.ts`

**重定向策略（无 `next.config` redirects，全靠 middleware + 薄 redirect page）：**

- `middleware.ts`：`/creator/orders/*` → `/studio/*`；`/workspace/*` → `/brand|/studio`；locale cookie 302
- 薄页面：`app/brand/campaigns/*` → projects；`app/studio/upload` → projects；`app/signup` → login 等

**动态段常用参数：** `[id]`、`[orderId]`、`[campaignId]`、`[versionId]`、`[[...path]]`（HLS/playback）

### A.2 `components/` 结构

| 目录 | 职责 | 备注 |
|------|------|------|
| `components/marketing/` | 首页 cinematic landing | **冻结 — 禁止改布局/动画** |
| `components/studioos/` | Brand/Studio/Admin 门户 UI | 最大集合；含 reviewer-skeleton、brand-project-hub 等 |
| `components/ai-copilot/` | AI 抽屉 + 全屏 workspace | 全局 `AiCopilotRoot` 在 root layout |
| `components/mvp/` | 遗留 MVP 审片/工作台 | 部分已清理；`review-workspace.tsx` re-export 仍活跃 |
| `components/creator/` | Creator 公开主页/编辑器 | 多个 1000+ 行 client 组件 |
| `components/ui/` | shadcn 基础组件 | Radix + CVA |
| `components/studioos/review-engine/` | Frame.io 风格审片 UI | **UI 层零页面引用（僵尸）** |
| `components/studioos/reviewer-skeleton/` | **当前 canonical 审片 UI** | `ReviewerTimestampWorkspace` |

**Client 组件规模：** 约 200 个 `"use client"` 文件；**全项目零 `next/dynamic` / `React.lazy` 使用**。

### A.3 `features/` 与 `lib/` 结构

**Feature First（目标架构）— `features/`（242+ 文件）：**

```
features/
  campaign/      # Aggregate Root + 状态机
  review/        # 审片决策、portal service、repository
  payment/       # Escrow、Stripe webhook、collection
  wallet/        # Ledger 路径
  settlement/    # 结算状态机
  matching/      # 邀请、选人、AI match
  notification/  # Event handlers（bootstrap 有缺口，见 B 节）
  auth/          # PermissionService、session、OAuth
  admin/         # AdminUser 独立体系
  ai/ ai-copilot/ ai-support/ memory/ video/ delivery/ ...
```

**Legacy 服务层 — `lib/`（仍活跃）：**

| 文件 | 行数 | 职责 |
|------|------|------|
| `lib/order-service.ts` | ~1243 | 订单 JSON + Prisma 双路径 |
| `lib/project-service.ts` | ~1050 | 项目 JSON + 桥接 |
| `lib/notification-service.ts` | 大 | 通知 enrich N+1 |
| `lib/creator-service.ts` | 中 | Creator 列表 fan-out |
| `lib/studioos/*` | 分散 | 门户工具、review-store、commercial-lifecycle 等 |

**分层规则（工程 Bible）：** Page → Action → Service → Repository → Prisma  
**现状：** 大量 Page → `lib/*-service`；Action → Repository 直连并存。

### A.4 API Routes 结构

| 前缀 | 数量 | 说明 |
|------|------|------|
| `/api/v1/*` | ~71 | Canonical REST（campaigns、versions、wallet、me/*） |
| `/api/v1/admin/*` | ~12 | Admin REST + PermissionService |
| `/api/admin/*` | ~13 | Admin UI auth（WebAuthn、TOTP、i18n） |
| `/api/auth/*` | ~5 | 用户 OTP/OAuth/login |
| Legacy `/api/*` | ~37 | checkout、review、assets、wizard stream 等 |

**鉴权模式：**

- v1 用户 API：`requireApiUser()`（`lib/core/api-route.ts`）
- Admin API：`requireAdminAuthUser()` / `requireAdminMutationUser()`
- Legacy：分散使用 `getCurrentClientEmail()`、`getCurrentCreatorId()`、demo cookie

### A.5 数据库相关结构

**Prisma：** `prisma/schema.prisma`（~2183 行）— PostgreSQL  
**核心模型：** `User`、`Campaign`（aggregate root）、`Order`、`CampaignVersion`、`ReviewComment`、`EscrowPayment`、`WalletAccount`、`AdminUser`、`ChatSession`（AI Copilot）等  
**迁移：** `prisma/migrations/*` — **本审计未修改**  
**双写期策略（Roadmap）：** 新 Feature 写 Prisma；JSON store 通过 Repository 适配器只读；`features/review/review-bridge.service.ts` 等桥接 legacy order status

**本地/demo 回退：** 无 `DATABASE_URL` 时多处 service 回退 JSON file store（`lib/serverless-store-core.ts`、`lib/json-file-store-core.ts`）

---

## B. 高风险问题清单

| ID | 文件路径 | 问题描述 | 风险 | 为什么危险 | 建议立即修？ |
|----|----------|----------|------|------------|--------------|
| B-01 | `lib/core/transition-runner.ts` + `instrumentation.ts` | 状态机过渡发 `event-bus-core` 事件，但 `features/events/bootstrap.ts` **未在应用启动时注册** notification handlers | **高** | 审片 approve/revision 等事件驱动副作用可能静默不执行；与 inline 通知混用导致行为不一致 | **是**（仅补 bootstrap，不改业务语义） |
| B-02 | `app/review-actions.ts`、`features/review/review-decision.service.ts`、`features/review/review-portal.service.ts`、`features/notification/notification.handlers.ts` | 同一审片动作 **多次 inline 通知 + event handler 叠加** | **高** | 用户收到 2–4 条重复通知 | **是**（先画触发矩阵再删重复） |
| B-03 | `features/video/version-processing.service.ts`、`features/delivery/delivery.service.ts`、`features/delivery/version.repository.ts` | 直接写 `reviewStatus`，**绕过 review 状态机** | **高** | 非法审片状态、审计链断裂 | **是** |
| B-04 | `app/api/checkout/route.ts` | **无鉴权** 可 POST 任意 amount 创建 Stripe Checkout | **高** | 滥用/欺诈 | **是** |
| B-05 | `app/api/inquiries/[id]/messages/route.ts` | GET **无鉴权**；POST `sender: brand` **未验证品牌身份** | **高** | 消息泄露、伪造 | **是** |
| B-06 | `app/api/campaign-assets/[campaignId]/[filename]/route.ts` | **无鉴权** 按 ID 下载资产 | **高** | IDOR | **是** |
| B-07 | `lib/order-service.ts:636-663` | Prisma 路径 `listAll()` + 逐条 `findById` | **高** | 数据量增长后列表/布局超时 | **是**（改查询，不改 UI） |
| B-08 | `lib/project-service.ts`、`lib/order-service.ts` JSON 路径 | 直接 `status = "in_review"` 等，与 Prisma 状态机 **漂移** | **高** | 双源真相 | **否**（需迁移计划，非单 PR） |
| B-09 | `app/api/v1/auth/login/route.ts` vs `app/api/auth/login/route.ts` | v1 登录 **缺** rate limit / Turnstile / admin-role block | **中** | 暴力破解面更大 | **是** |
| B-10 | `middleware.ts:221-224` | Admin 边缘只检查 cookie **存在**（长度≥32），不验 validity | **中** | 无效 token 行为不一致 | 中优先级 |
| B-11 | `app/studio/layout.tsx` | 未登录仍可渲染 studio shell（`creator = null`） | **中** | 页面级 auth 不一致 | 需人工确认产品意图 |
| B-12 | `next.config.ts` | `ignoreBuildErrors: true`、`ignoreDuringBuilds: true` | **中** | 生产 build 可隐藏 TS/ESLint 问题 | 逐步收紧 |
| B-13 | 全项目 20+ 处 | `.catch(() => undefined)` 吞掉通知/副作用错误 | **中** | 生产 silent failure | 改 logger，非改流程 |

---

## C. 卡顿与性能问题

### C.1 可能渲染过重的页面

| 页面路由 | 重因 | 相关文件 |
|----------|------|----------|
| `/brand/projects/new`、wizard 各步 | 1390 行 client brief 单文件 | `components/studioos/brand-campaign-step-brief.tsx` |
| `/brand/projects/[id]`（match tab） | Hub + timeline + match board 同页 | `components/studioos/brand-project-hub.tsx` |
| `/brand/projects/[id]/review` | 763 行审片 workspace 同步加载 | `reviewer-skeleton/reviewer-timestamp-workspace.tsx` |
| `/studio/income` | 947 行 withdrawal panel | `components/studioos/income-withdrawal-panel.tsx` |
| `/brand/ai`、`/studio/ai` 等 | 708 行 AI workspace | `components/ai-copilot/ai-workspace-page.tsx` |
| **所有已登录页** | Root layout 全局挂载 AI Copilot | `app/layout.tsx` → `ai-copilot-root.tsx` |
| **所有 `/brand/*`、`/studio/*`** | 整门户包在 client shell | `brand-portal-shell.tsx`、`studio-portal-shell.tsx` |
| 首页 `/` | 多段 framer-motion（**冻结，勿为性能改布局**） | `components/marketing/cinematic/*` |

### C.2 可能重复渲染的点

| 文件 | 原因 | 安全优化？ |
|------|------|------------|
| `components/studioos/creator-deposit-pending-card.tsx` | 曾每 2s `router.refresh()` 即使状态未变 | ✅ 已在本分支去掉 else 分支 refresh（待 build 验证） |
| `components/studioos/deposit-panel.tsx` | 同上 | ✅ 同上 |
| 30+ client 组件 | mutation 后 `router.refresh()` 而 local state 已更新 | ✅ 可逐文件评估 |
| `app/studio/layout.tsx` + 子 page | 重复拉 orders/notifications（无 `cache()`） | ✅ 镜像 `brand-portal-data.ts` |
| `app/workspace/layout.tsx` | `listNotifications` + `countUnread` 双份全量 load | ✅ |
| `components/ai-copilot/ai-copilot-root.tsx` | pathname 变化 fetch `/api/v1/auth/me` | ✅ 条件挂载 |

### C.3 图片/资源加载

| 资源 | 路径 | 影响 |
|------|------|------|
| Hero 图 | `public/images/home-hero-*.png` | 首页 LCP（冻结区） |
| Login 背景 | `public/images/login/*` | 登录页 |
| Demo 审片视频 | `public/demo/review-sample.mp4` | build 时 `ensure-demo-review-video` 下载 |
| Hero API sync read | `app/api/home-hero-studio/route.ts` | 每请求 `readFileSync` |
| 营销 copy 脚本 | `scripts/copy-marketing-assets.mjs` | 每次 build 复制/下载 |

### C.4 可能响应慢的 API / 数据路径

| 路径/函数 | 原因 |
|-----------|------|
| `lib/order-service.ts` `listOrdersForClient/Creator` | 全表 list + N×findById |
| `lib/notification-service.ts` enrich | 每条通知可能 `getProject()` |
| `lib/creator-service.ts` `listCreatorsForMatching` | 每 creator 4 子服务调用 |
| `app/brand/projects/[id]/studios` | creators × `getWorksForCreator` |
| `middleware.ts` protected routes | Supabase `getUser()` + 双表 role 查询 |
| `features/admin/campaign/admin-campaign.repository.ts` | 列表 + 逐条 settlement context |

---

## D. 僵尸代码候选（只列不删）

### D.1 未引用组件（grep 零外部 import）

| 候选文件 | 说明 |
|----------|------|
| `components/studioos/review-engine/frameio-review-center.tsx` | 整棵 review-engine UI 树无页面引用 |
| `components/studioos/review-engine/brand-review-room.tsx` | 同上 |
| `components/studioos/review-engine/creator-review-upload.tsx` | 同上 |
| `components/studioos/reviewer-v1/reviewer-v1-workspace.tsx` | 被 reviewer-skeleton 内联组件取代 |
| `components/studioos/reviewer-skeleton/reviewer-skeleton-layout.tsx` | 无 page import |
| `components/studioos/reviewer-skeleton/reviewer-focus-workspace.tsx` | 无 page import |
| `components/mvp/review-video-source.tsx` | 无 import |
| `components/mvp/review-watermark-overlay.tsx` | 与 studioos 版重复，均无 import |
| `components/studioos/review-watermark-overlay.tsx` | 同上 |
| `components/studioos/brief-builder-wizard.tsx` | 无 import |
| `components/studioos/product-image-studio.tsx` | 无 import |
| `components/studioos/wizard-logo-upload.tsx` | 无 import |
| `components/studioos/brand-campaign-wizard-loader.tsx` | 无 import |
| `components/studioos/brand-creator-match-radar.tsx` | 无 import |
| `components/studioos/admin-ops-preview.tsx` | 仅 sprint verify 字符串引用 |

### D.2 已在本工作区删除的 dead code（待你 git commit 前知悉）

以下文件在 **低风险清理批次** 中已删（零引用确认后）：

- `components/ai-copilot/ai-copilot-page.tsx`
- `components/studioos/production-copilot-panel.tsx`
- `components/studioos/review-center.tsx`
- `components/studioos/video-review-player.tsx`
- `components/studioos/brand-creative-review.tsx`
- `components/mvp/review-player.tsx`
- `components/mvp/review-focus-shell.tsx`
- `components/mvp/video-annotation-layer.tsx`

### D.3 未引用路由页

| 路由 | 文件 | 说明 |
|------|------|------|
| `/creator/ai` | `app/creator/ai/page.tsx` | 与 `/studio/ai` 重复；nav 无链接 |

### D.4 后端仍 live、UI 已死

| 区域 | 仍活跃 | UI 僵尸 |
|------|--------|---------|
| review-engine | `app/api/review/*`、`lib/review-engine/*`、`app/review-engine-actions.ts` | `components/studioos/review-engine/*` |
| legacy copilot | `app/studioos-actions.ts`、`lib/studioos/copilot.ts` | `ProductionCopilotPanel` 已删 |

### D.5 未使用 imports

- ESLint `@typescript-eslint/no-unused-vars` 已启用（`lint.out` 有 30+ 警告，可能略 stale）
- 典型：`components/proposal/proposal-contract-panel.tsx` 重复 type import；多处 lucide icon 未用
- **建议：** 本地 `npm run lint` 导出完整列表后再逐文件清理

### D.6 营销冻结区内未接入 section（勿删）

`components/marketing/cinematic/` 内部分 section 组件未接入 `CinematicHomePage` — 受 **Homepage Freeze** 保护，**不建议删除**。

---

## E. 重复代码候选

### E.1 重复 UI / 路由

| 类型 | 实例 |
|------|------|
| AI 页面 8 路由 | `/brand/ai` ↔ `/brand/copilot` 等，均渲染 `AiWorkspacePage` |
| Creator AI | `/creator/ai` ↔ `/studio/ai` |
| 审片空状态 JSX | `app/brand/projects/[id]/review/page.tsx` vs `app/brand/orders/[id]/review/page.tsx` |
| 水印 overlay | `components/mvp/review-watermark-overlay.tsx` vs `components/studioos/review-watermark-overlay.tsx` |

### E.2 重复业务逻辑

| 逻辑 | 位置 |
|------|------|
| Comment 存储 | `lib/studioos/review-store.ts`（JSON）vs `features/review/review.repository.ts`（Prisma） |
| 订单/项目状态 | JSON `lib/*-service` vs Prisma `campaignService.transition()` |
| 当前用户解析 | `lib/session-user.ts`、`client-session.ts`、`creator-session.ts`、`features/auth/session.service.ts`、`lib/mvp/session.ts` |
| 登录 nextPath | `app/login/page.tsx` vs `app/admin/login/page.tsx` |
| 时间戳格式化 | `lib/studioos/review-utils.ts` vs `lib/alipay/alipay-openapi.client.ts` 本地副本 |

### E.3 重复 API

| 端点 | 说明 |
|------|------|
| `POST /api/auth/login` vs `POST /api/v1/auth/login` | 同 `performSignIn`，响应格式不同；**前端均未直接调用** |
| `POST /api/admin/auth/login` vs `adminLoginAction` | Admin TOTP 双入口 |
| Legacy `/api/*` vs `/api/v1/*` | 长期并存 |

### E.4 重复审片栈（4 套 UI）

1. **Canonical：** `reviewer-skeleton/ReviewerTimestampWorkspace`
2. **Legacy MVP：** `features/review/ReviewWorkspace` → `/workspace/projects/[id]/review`
3. **Orphan Frame.io：** `review-engine/*`
4. **Orphan v1 workspace：** `reviewer-v1-workspace.tsx`

---

## F. 架构问题

### F.1 模块边界不清

| 区域 | 问题 |
|------|------|
| `app/review-actions.ts`（1142 行） | 审片 + 通知 + JSON bridge + settlement 混在一个 action 文件 |
| `lib/order-service.ts` / `lib/project-service.ts` | 业务规则 + 持久化 + 双数据源 |
| Admin 双模型 | `AdminUser`（portal）vs `User.role = ADMIN`（Prisma，登录已 block） |
| AI 三入口 | `/api/ai-copilot`、`/api/ai-support/*`、`/api/v1/campaigns/.../ai/jobs` |

### F.2 文件过大（违反 ≤500 行 / 组件 ≤300 行）

| 行数 | 文件 |
|------|------|
| 2183 | `prisma/schema.prisma` |
| 1391 | `components/studioos/brand-campaign-step-brief.tsx` |
| 1243 | `lib/order-service.ts` |
| 1142 | `app/review-actions.ts` |
| 1050 | `lib/project-service.ts` |
| 1028 | `app/brand-campaign-actions.ts` |
| 947 | `components/studioos/income-withdrawal-panel.tsx` |
| 874 | `components/studioos/project-wizard.tsx` |
| 763 | `components/studioos/reviewer-skeleton/reviewer-timestamp-workspace.tsx` |
| 708 | `components/ai-copilot/ai-workspace-page.tsx` |

### F.3 应拆分但高风险的位置

- `app/review-actions.ts` — 触达支付/通知/审片状态机
- `features/review/review-portal.service.ts` — Prisma + legacy bridge
- `middleware.ts` — 全站 auth/locale/redirect
- `features/payment/*`、`features/settlement/*` — 托管/release

### F.4 后期易出 bug 的点

1. 事件总线未 bootstrap + inline 通知并存  
2. JSON/Prisma 双写无一致性校验  
3. Legacy API 无统一 `requireApiUser`  
4. `/ai` vs `/copilot` URL 不一致（nav vs breadcrumb）  
5. `ignoreBuildErrors` 掩盖回归  

---

## G. 安全问题

### G.1 Admin 登录

| 项 | 评估 |
|----|------|
| 独立 `AdminUser` + `studioos_admin_session` cookie | ✅ |
| TOTP + replay + lockout + audit | ✅ |
| WebAuthn/passkey | ✅ |
| CSRF + same-origin on mutations | ✅ |
| 生产 `AUTH_SECURITY_SECRET` 强校验 | ✅（`admin-secrets-guard.ts`） |
| Middleware 仅 cookie presence | ⚠️ |
| 双入口 TOTP（action + REST） | ⚠️ 攻击面略大 |

### G.2 普通用户登录

| 项 | 评估 |
|----|------|
| Email OTP 主路径 | ✅ `login-workspace.tsx` |
| OAuth Google/Alipay + test social（demo） | ✅ |
| Demo auth 宽 fallback | ⚠️ `preferDemoAuth()` |
| 密码 REST 无前端调用 | ℹ️ 遗留面 |
| Platform admin 拒绝 user login | ✅ `sign-in-service.ts` |

### G.3 权限隔离

| 项 | 评估 |
|----|------|
| `PermissionService` + `canAccessCampaign` | ✅ Feature 层较好 |
| Legacy route 跳过 PermissionService | ⚠️ |
| Demo session on legacy API | ⚠️ |
| v1 `requireApiUser` 拒 demo ID | ✅ |

### G.4 环境变量

| 项 | 评估 |
|----|------|
| `NEXT_PUBLIC_*` 敏感 key 扫描 | ✅ production verify |
| 默认 dev secret | ⚠️ 若 `NODE_ENV` 误配 |
| OpenAI/Stripe/DB 仅 server | ✅ |

### G.5 API 鉴权缺口（优先修复）

1. `app/api/checkout/route.ts`  
2. `app/api/inquiries/[id]/messages/route.ts`  
3. `app/api/campaign-assets/[campaignId]/[filename]/route.ts`  
4. 同类 asset routes（brand/creator/project/payout-qr）需 spot-check  

### G.6 数据暴露

| 端点 | 风险 |
|------|------|
| `/api/v1/openapi` | 全量 OpenAPI |
| `/api/v1/health?alipay=1` | 公开 Alipay 配置片段 |
| Playback token | ✅ 有 `assertPlaybackAccess` |

---

## H. 最安全的优化路线图

### H.1 低风险 — 可立即做

| # | 任务 | 文件/范围 | 不改业务 |
|---|------|-----------|----------|
| L1 | 删除 **已确认零引用** 僵尸组件（见 D.1，不含 review-engine backend） | `components/...` | ✅ |
| L2 | `npm run lint` 清理 unused imports | 分散 | ✅ |
| L3 | Studio portal `cache()` 去重 | 新建 `lib/studioos/studio-portal-data.ts` | ✅ |
| L4 | Deposit poll 去掉无变化 `router.refresh` | 已做，待 build | ✅ |
| L5 | `next/dynamic` 懒加载审片 + AI drawer | `reviewer-timestamp-workspace`、`ai-copilot-drawer` | ✅ |
| L6 | AI Copilot 条件挂载（非全站） | `app/layout.tsx` | ✅ |
| L7 | Hero API 内存缓存 | `home-hero-*-asset.ts` | ✅ |
| L8 | 合并重复 type import | `proposal-contract-panel.tsx` 等 | ✅ |
| L9 | `let` → `const` lint fix | `lib/project-service.ts` 等 | ✅ |

### H.2 中风险 — 需人工确认

| # | 任务 | 原因 |
|---|------|------|
| M1 | 事件总线 bootstrap + 去重通知 | 需回归审片通知条数 |
| M2 | `/api/v1/auth/login` 对齐安全门 | API 契约不变，行为变 |
| M3 | Legacy API 加 auth | 可能 break 未知客户端 |
| M4 | `/ai` ↔ `/copilot` 301 合并 | 路由变更需 redirect |
| M5 | `listOrdersForClient` 查询重写 | 需 DB 索引/结果一致性验证 |
| M6 | 关闭 `ignoreBuildErrors` | 可能暴露大量 TS 债 |
| M7 | review-engine UI 归档 | 需确认无 E2E 依赖 |

### H.3 高风险 — 暂时不要碰

| 区域 | 原因 |
|------|------|
| `components/marketing/**`、首页 layout | Homepage Freeze |
| `prisma/schema.prisma`、migrations | 用户明确禁止 |
| `middleware.ts` 路由/auth 规则 | 全站影响 |
| `features/payment/*`、`settlement/*`、`wallet/*` | 资金 |
| `features/admin/auth/*` | Admin 核心 |
| `app/review-actions.ts` 大重构 | 审片+结算耦合 |
| JSON→Prisma 单源切换 | 需迁移 runbook |
| Supabase auth 流程 | 刚改动 OAuth/demo |

---

## I. 明天建议执行的 Cursor Prompt（低风险 ×3）

### Prompt 1 — 清理 unused imports（只 lint 报告文件）

```text
只做 ESLint unused imports 清理，不允许改任何业务逻辑。

步骤：
1. 运行 npm run lint，收集所有 @typescript-eslint/no-unused-vars 警告
2. 只修改 warning 涉及的文件
3. 禁止改：middleware、features/auth、features/payment、features/admin、prisma、components/marketing
4. 每批最多 10 个文件，改完 npm run build
5. build 失败则 git checkout 该批文件

不要删文件，不要改函数体逻辑。
```

### Prompt 2 — Studio portal 请求去重

```text
镜像 brand-portal-data 模式，为 studio 门户添加 per-request cache，降低 layout+page 重复查询。

允许：
- 新建 lib/studioos/studio-portal-data.ts（cache 包装现有 lib 函数）
- 修改 app/studio/layout.tsx 和 studio 子 page 的 import 来源

禁止：
- 改 lib/order-service 查询逻辑
- 改路由、改 UI、改 schema
- 改 auth

完成后 npm run build，失败则回滚。
```

### Prompt 3 — 懒加载 AI Copilot 与审片 workspace

```text
用 next/dynamic 懒加载以下 client 组件，ssr: false，不改 props 与业务：

1. components/ai-copilot/ai-copilot-drawer.tsx（从 ai-copilot-root 动态 import）
2. components/studioos/reviewer-skeleton/reviewer-timestamp-workspace.tsx（从 brand/studio review page 动态 import）

禁止改 components/marketing、禁止改 review 业务 actions、禁止改路由。

改完 npm run build，失败回滚。
```

---

## J. Build 结果

### J.1 本次审计环境

| 项 | 结果 |
|----|------|
| 审计 Agent 执行 `npm run build` | ❌ **未能执行**（shell 无输出，环境限制） |
| 业务代码修改 | ❌ 无（本任务仅新增本报告） |
| Git commit | ❌ 未执行（按你的要求不主动 git） |

### J.2 最近一次已知 build 状态（来自本地 `production:verify`，2026-07-05）

| 步骤 | 结果 |
|------|------|
| `prisma.generate` | ✅ |
| `typecheck` | ✅ |
| `lint` | ✅ |
| **`build`** | ❌ 曾报 `PageNotFoundError: Cannot find module for page: /admin/campaigns`（及 certification、copilot） |
| `payment.verify` / `sprint1.verify` | ✅ |

**已存在于代码库、可能缓解 build 的配置（未在本审计中改动）：**

- `next.config.ts` → `experimental.webpackBuildWorker: false`
- `package.json` `build` → 构建前 `rm -rf .next node_modules/.cache`

### J.3 工作区未提交变更（可能影响 build）

在先前「低风险优化」会话中，工作区可能包含：

- 删除 8 个零引用组件（见 D.2）
- `creator-deposit-pending-card.tsx` / `deposit-panel.tsx` 去掉无效 refresh
- `studio-creative-workspace.tsx`、`proposal-contract-panel.tsx` lint 前缀

**请你本地验证：**

```bash
cd /Users/linkele/Projects/studioOS
npm run build
# 或完整
npm run production:verify
```

将 exit code 与末尾 40 行输出追加到本报告 J 节，或另存 `docs/audits/build-result-YYYY-MM-DD.txt`。

---

## 附录：工程规则合规快照

| 规则 | 状态 |
|------|------|
| 无 `console.log` in app/features/components/lib | ✅（scripts/seed 除外） |
| 无 `@ts-ignore` / explicit `any` | ✅ |
| React 组件 ≤300 行 | ❌ 多处超标 |
| 单文件 ≤500 行 | ❌ 15+ 文件 |
| Page 不直连 Prisma | ❌ 少量 + 大量 Page→lib |
| status 必须 StateMachine | ❌ reviewStatus + JSON 路径 |
| 通知走 Event | ❌ inline + bootstrap 缺口 |
| 首页冻结 | ✅ 本报告零 homepage 改动建议 |

---

*报告结束。明日请先阅读 H/I 节，再决定是否执行 Prompt；勿让 Agent 自动修复高风险项。*
