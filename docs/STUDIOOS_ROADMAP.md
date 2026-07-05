# VINCIS 完整产品开发路线图

> 依据 Development Bible + Developer Documentation 制定。  
> 原则：**Campaign 为唯一 Aggregate Root**，所有模块必须关联 `campaign_id`。

## 当前基线

- Next.js 15 单体应用（非 Turborepo，Phase 16 可后续拆分）
- JSON file store（本地/demo）+ 可选 Supabase（审片 MVP）
- 三套并行审片栈 → **统一为 `features/review`**
- 无 Prisma → **Phase 1 引入 PostgreSQL + Prisma**

---

## 执行顺序（严格按卷）

| Phase | 文档卷 | 交付物 | 状态 |
|-------|--------|--------|------|
| **0** | Vol 16 Bootstrap + Vol 17 Standards + **Vol 18 State Machine** | 路线图、10 状态机、runTransition、docs v2 | ✅ |
| **1** | Vol 02 Database + Vol 14 Prisma | `prisma/schema.prisma`、Docker Compose、Migration | ✅ |
| **2** | Vol 07 Auth + Permission | User/Brand/Creator、RBAC、PermissionService | ✅ |
| **3** | Vol 03 Backend + Vol 03 API | Feature First 目录、Action→Service→Repository | ✅ |
| **4** | Campaign.spec | 7 步 Wizard、Campaign 状态机、Activity Log | ✅ |
| **5** | Review.spec + Vol 05 | 统一 Review Workspace、拆分组件 ≤300 行 | ✅ |
| **6** | Vol 06 Video Engine | 分片上传、Worker 队列、HLS、Signed URL、水印 | ✅ (Sprint 6 + 6b) |
| **7** | Vol 09 Payment | Escrow、Ledger、Stripe Webhook | ✅ |
| **8** | Vol 08 AI + Vol 11 Creative | AI Gateway、Queue、Prompt 版本化 | ✅ |
| **9** | Vol 10 Notification | Event Bus、模板、WebSocket | ✅ |
| **10** | Vol 04 Frontend | Design Token、TanStack Query、响应式 | ✅ (partial — Design System Sprint 11) |
| **11** | Vol 15 OpenAPI | 契约驱动 API、SDK 生成 | ✅ |
| **12** | 集成 & QA | Happy Path E2E、95% 核心模块测试 | ✅ |
| **13** | MVP Payment Collection | Webhook + Commission + Manual payout | ✅ |

---

## 目录规范（Feature First）

```
features/
  campaign/     actions, services, repositories, schemas, types, events
  review/
  payment/
  wallet/
  creator/
  notification/
  ai/
lib/core/       AppError, logger, config, state-machine, events
prisma/         schema + migrations
docs/openapi/   openapi.yaml
```

## 迁移策略

1. **双写期**：新 Feature 写 Prisma；旧 JSON store 通过 Repository 适配器只读
2. **桥接期**：`campaign-review-bridge` 逻辑迁入 `features/review`
3. **切换期**：Seed 脚本从 JSON 导入 PostgreSQL
4. **清理期**：删除 `lib/*-store.ts` 与 Frame.io 旧栈

## 工程铁律（Cursor 必须遵守）

1. 页面禁止直连数据库
2. 禁止直接修改 `status` 字段 — 必须走 StateMachine.transition()
3. 禁止直接修改 Wallet 余额 — 必须走 Ledger
4. 单个 React 组件 ≤ 300 行，单文件 ≤ 500 行
5. 所有 AI 输出必须 JSON + Zod 校验
6. 所有视频必须 HLS + Signed URL（Phase 6 后）
7. 所有通知必须 Publish Event，禁止业务代码直接发邮件

---

## 本地启动（Phase 1 完成后）

```bash
docker compose up -d          # Postgres + Redis + MinIO
cp .env.example .env.local    # 填入 DATABASE_URL
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```
