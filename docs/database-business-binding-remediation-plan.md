# VINCIS 数据库与业务绑定 — 分阶段改造计划

**Date:** 2026-07-11  
**Prerequisite:** `docs/database-business-binding-audit-2026-07-11.md`

---

## Phase 0 — 审计与护栏（本轮）

| # | 项 | 状态 |
|---|-----|------|
| 0.1 | 审计报告 | ✅ |
| 0.2 | 本计划 | ✅ |
| 0.3 | `sourceType` on benchmarks（VERIFIED/DERIVED） | ✅ migration |
| 0.4 | `ProjectCostEstimate` 快照字段（`isAdopted`, `inputSnapshotJson`） | ✅ migration |
| 0.5 | `campaign-lifecycle.guards.ts` 统一开工/上传/结算判断 | ✅ |
| 0.6 | Invitation accept 幂等（已 ACCEPTED → 返回成功） | ✅ |
| 0.7 | 进行中项目 Prisma `countActiveForBrand` + JSON 取 max | ✅ |
| 0.8 | `lib/core/action-result.ts` 统一 action 返回 | ✅ |
| 0.9 | `actual-production-record` 完成时写入（`campaignService.transition` on `COMPLETE`） | ✅ |

**不触碰：** Campaign FSM 全面重命名、JSON 写路径冻结、Wizard 四档 UI（Phase 2）。

---

## Phase 1 — 单写准备（1–2 周）

1. **Order 审片状态入 Prisma** — 扩展 `OrderStatus` 或 `Order.phase` 字段；回填 JSON  
2. **`Order.estimateId`** — 付款时绑定采用的 `ProjectCostEstimate`  
3. **`@@unique([campaignId, creatorProfileId])` on Order** — 先查重再 migration  
4. **JSON 写路径标记 `@deprecated`** — `order-service`, `creator-invitation-store` 只读兼容  
5. **ActivityLog** — 补全：估价、付款、上传、修改、结算  
6. **API envelope** — v1 路由逐步统一 `{ ok, data, error: { code } }`  

---

## Phase 2 — 产品闭环（2–4 周）

1. **Brand Wizard** — `productionPricingService.estimateFromBrief` 四档 + floor 禁止发布  
2. **《命运转移》补数** — owner 提供镜头数/生成次数后更新 SAMPLE_001  
3. **项目完成** — `completeOrder` → `ActualProductionRecord` + 样本回流队列  
4. **10/50/100 部自动校准** — 只读统计，&lt;20 同类不自动改全局倍率  

---

## Phase 3 — SSOT 切换（需 owner 签字）

1. Campaign 状态枚举对齐 Owner 表（`BRIEF_CONFIRMED`, `PRICED`, `BRAND_SELECTED`…）  
2. Legacy JSON **只读** → 迁移工具 → **停写**  
3. `publish()` 与 FSM `PUBLISH.from` 单一契约  
4. 删除 900+ 行零引用后的剩余双轨代码  

---

## 迁移顺序（每一步单独 commit）

```
新增标准字段 → 回填 → 双读校验 → 新逻辑单写 → 新逻辑单读 → 旧字段只读 → 删旧代码 → 删旧字段
```

---

## 本地验证（每 Phase 结束）

```bash
npm run db:generate
npm run db:migrate:deploy
npm run typecheck && npm run build && npm run production:verify
```
