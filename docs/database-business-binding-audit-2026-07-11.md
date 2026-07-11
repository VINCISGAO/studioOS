# VINCIS 数据库与现实业务逻辑绑定 — 审计报告

**Date:** 2026-07-11  
**Mode:** 深夜自主重整 · 先审计后改造  
**Spec:** Owner「数据库与现实业务逻辑绑定重整要求」

---

## 执行摘要

| 维度 | 现状 | 目标 | 差距 |
|------|------|------|------|
| 单一业务主链路 | **双轨**（Prisma Campaign + Legacy JSON Project/Order/Invitation） | 一条主流程 | **高** |
| 状态写入源 | 前端 metadata + 5 处直接 `status=` + FSM 并存 | 仅服务端领域服务 | **高** |
| 幂等 / 唯一约束 | Webhook ✓、Invitation unique ✓；Order 无 DB unique | 全关键路径幂等 | **中** |
| 报价快照 | `ProjectCostEstimate` 已建，未接 Wizard | `CampaignEstimate` 付款快照 | **中** |
| 生产样本 | `ProductionBenchmarkSample` 已 seed | 区分 VERIFIED / DERIVED | **低**（Phase 0 ✅ `sourceType`） |
| 进行中项目上限 | 服务端 gate ✓，Prisma + JSON 取 max | 必须 DB 统计 | **低**（Phase 0 ✅） |
| API 响应格式 | `{success}` / `{ok}` / throw 混用 | 统一 envelope | **中** |
| ActivityLog | 已写 publish/selection/invitation | 全关键操作 | **中** |

**结论：** 不得一次性重写。按「新增 → 回填 → 双读校验 → 单写 → 单读 → 删旧」迁移；**禁止双写两套业务状态**。

---

## 一、平行状态源（同一事实，多处存储）

### 1.1 Campaign 生命周期

| 事实 | 写入源 | 文件 |
|------|--------|------|
| 主状态 | `Campaign.status` (Prisma) | `features/campaign/campaign.service.ts` |
| 镜像状态 | `StoredProject.status` | `lib/project-service.ts`, `project-store.json` |
| 向导进度 | `wizard_step` + `campaignMemoryJson.wizard` | `campaign-brand.service.ts` |
| 选定创作者 | `Campaign.creatorId` + `campaignMemoryJson.selection` | `campaign-selection.service.ts` |
| 发布/匹配 | `campaignMemoryJson.published_at` | `campaign-brand.service.ts` |

**风险：** `prismaStatusToProjectStatus` 将 `ESCROW_FUNDED` 映射为 `matching`，UI 与 Prisma 不一致。

### 1.2 Order / 审片

| 事实 | 写入源 |
|------|--------|
| 生产/审片/修改 | `StoredOrder.status`（review, revision, in_production） |
| Prisma Order | 仅 PENDING/CONFIRMED/COMPLETED/CANCELLED/REFUNDED |
| Campaign 审片 | `CampaignVersion.reviewStatus` + `Campaign.status` |

**风险：** 审片轮次真相在 JSON；Prisma Order 无法表达 `IN_REVIEW` / `REVISION`。

### 1.3 Invitation

| 事实 | 写入源 |
|------|--------|
| Prisma | `CreatorInvitation.status` + FSM `transitionInvitation` |
| JSON | `creator-invitation-store.json` 直接改 status |
| 品牌选定 | 无 `SELECTED` enum；`campaignMemoryJson.selection` + portal 合成 `"selected"` |

---

## 二、禁止模式（已发现实例）

- 前端 `update({ status: "PRODUCTION" })` — 未发现；但 admin 订单页可任意改 status
- `orderRepository.updateStatus` 绕过 Order FSM — `features/order/order.repository.ts`
- `syncPrismaCampaignMatchingAfterLegacyPayment` 自动链式 transition — `lib/order-service.ts`
- `skipPreconditions: true` 项目转换 — `lib/studioos/brand-checkout-service.ts`
- 权限用 redirect 代替 404 — 已部分改为 `notFound()`（studios/checkout/review）

---

## 三、已具备模块（可升级，非重建）

| 模块 | 表/服务 | 状态 |
|------|---------|------|
| 报价快照 | `project_cost_estimates` / `features/pricing/*` | 待接 Wizard + `isAdopted` |
| 生产样本 | `production_benchmark_samples` | SAMPLE_001/002 已 seed |
| AI 用量 | `campaign_ai_usage_logs` + quota | 已接多入口 |
| 进行中上限 | `brand-active-campaign.server.ts` | Phase 0：Prisma `countActiveForBrand` + JSON 取 max |
| 活动日志 | `activity_logs` | 部分事件已写 |
| Escrow 统一 | `escrow-guards.ts` | 已部分接入 |
| Session 统一 | `session-context.ts` | 85+ server 点已迁移 |
| 幂等附录 | `docs/idempotency-concurrency-audit-appendix.md` | 已有 |

---

## 四、实体职责对照（Owner 规范 vs 现状）

| 实体 | Owner 要求 | 现状差距 |
|------|-----------|----------|
| Campaign | 主状态源 | ✓ 部分；JSON 仍并行写 |
| CampaignEstimate | 每次估价独立快照 | `ProjectCostEstimate` 同名职责，缺 `isAdopted` |
| Invitation | 独立记录 + 事务接受 | FSM 已接；JSON 并行；接受非幂等返回 |
| Order | 一 Campaign 一正式 Order | 应用层 guard；无 DB unique |
| Payment/Escrow | 独立 + 幂等 webhook | Stripe ✓；legacy `markOrderPaid` 弱 |
| DeliverableVersion | 每版独立 | Prisma `CampaignVersion` + JSON deliverables 双轨 |
| ProductionBenchmark | VERIFIED vs DERIVED | Phase 1 补 `sourceType` |

---

## 五、验收场景覆盖度

| 场景 | 状态 |
|------|------|
| Creator 无 profile → onboarding | ✓ `creator-portal-guard` |
| 重复接受邀请 | ⚠ 应返回首次结果（Phase 1 修） |
| 双 Creator 同时接受 | ✓ selection lock |
| 支付回调重复 | ✓ webhook eventId |
| 3 个项目上限 | ✓ gate；计数待 DB SSOT |
| 无效 ID 404 | ✓ 部分页面 |
| 无权限 403 vs 404 | ⚠ 部分仍 redirect |
| 付款后报价快照 | ✗ 未强制 estimateId on Order |
| 完成后 actual_production_records | Phase 0：`campaignService.transition(COMPLETE)` → `upsertOnCompletion` stub |

---

## 六、Phase 0 完成项（2026-07-11）

| 项 | 实现 |
|----|------|
| Benchmark `sourceType` | migration `20260709140000`；SAMPLE_001=VERIFIED，SAMPLE_002=DERIVED |
| `ProjectCostEstimate` 快照字段 | `estimateVersion`, `isAdopted`, `inputSnapshotJson` |
| 生命周期护栏 | `features/campaign/campaign-lifecycle.guards.ts` |
| Invitation accept 幂等 | `invitation.service` + `invitation-portal.service` 已 ACCEPTED → 返回成功 |
| 进行中项目 DB 计数 | `campaignRepository.countActiveForBrand` + gate 取 max(JSON, Prisma) |
| 完成时生产记录 | `campaignService.transition` on `COMPLETE` → `actualProductionRecordRepository` |
| 统一 action 返回 | `lib/core/action-result.ts` |

---

## 七、改造原则（不可违反）

1. 不删真实订单/用户/支付数据  
2. 不新增临时字段绕过旧逻辑  
3. 不双写两套业务状态  
4. 迁移可回滚；旧字段先只读兼容  
5. Phase 3 前不改 `CREATOR_ACCEPTED` enum 名（需 owner + migration）

---

## 八、相关文档

- `docs/database-business-binding-remediation-plan.md` — 分阶段计划  
- `docs/VINCIS_ORDER_LIFECYCLE_SPEC.md` — 业务真相  
- `docs/idempotency-concurrency-audit-appendix.md`  
- `docs/PRODUCTION_PRICING_ENGINE.md`
