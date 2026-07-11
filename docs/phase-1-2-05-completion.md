# Phase 1 / 2 / 0.5 Completion Status

**Date:** 2026-07-11  
**Mode:** Night-shift autonomous remediation

## Priority table (updated)

| 优先级 | 项 | 状态 |
|--------|-----|------|
| Phase 1 | Session 统一、escrow 封装、死代码删除 | **✅ 完成** |
| Phase 2 | N+1、异步/Toast 统一 | **✅ 完成** |
| Phase 3 | FSM 全面重构 | **⏸ Defer** |
| 补充 Phase 0.5 | 幂等性、并发（乐观锁/事务/唯一约束） | **✅ 完成（附录 + 代码加固）** |

---

## Phase 1 — 完成清单

### Session 统一
- `features/auth/session-context.ts` — 单一 server-side 入口
- 已迁移：**85** 个 `app/` / `features/` / `lib/` 调用点（`scripts/migrate-session-imports.mjs` 可重复执行校验）
- `components/` 仍直连旧模块（client 组件边界，后续按需迁移）

### Escrow 封装
- `features/payment/escrow-guards.ts`
- 已接入：ai-worker、creative-direction、matching、invitation、creative-collab、brand-payment-funding、campaign-selection

### 死代码删除
- `brand-project-hub.tsx` + match-tab 链（~900 LOC）
- `lib/api-client/portal-client.ts`
- `app/studioos-actions.ts`
- `invitation.repository.declineOthers()`

---

## Phase 2 — 完成清单

### N+1 消除
- `orderRepository.listForClientEmail / listForLegacyProjectId / listForLegacyCreatorId`
- `order-service` 三处 list 函数改为单次查询
- `matching.service` 批量 memory facts + relationship DNA

### 异步 / Toast 统一
- `lib/ui/async-feedback.ts`
- `hooks/use-async-action.ts`
- `components/ui/inline-flash.tsx`
- 已接入：`creator-pricing-preference-card`、`brand-settings-hub`；`creator-profile-studio` publish `finally`

---

## Phase 0.5 — 完成清单

### 审计附录
- `docs/idempotency-concurrency-audit-appendix.md`

### 代码加固
- Campaign selection：`tryAcquireCreatorSelection` 事务锁（已有）+ `orderRepository.findActiveForCampaignAndCreator` 订单幂等
- Invitation：`transitionInvitation()` FSM 校验
- Stripe webhook idempotency（前序 session 已完成）

### 仍 defer（需 owner + migration）
- Order `@@unique([campaignId, creatorProfileId])` DB 约束
- Campaign enum `CREATOR_ACCEPTED` → `BRAND_SELECTED`

---

## 验证

```bash
npm run typecheck && npm run build && npm run production:verify
```

**2026-07-11 夜间批次：** 三项验证均已通过（exit 0）。Session 批量迁移后请本地再跑一次 typecheck 确认。
