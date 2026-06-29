# features/

Feature First 模块目录（Development Bible Vol 03）。

每个 Feature 包含：

```
features/{name}/
  {name}.service.ts      # 业务逻辑
  {name}.state-machine.ts
  {name}.types.ts        # (optional)
  actions/               # Server Actions (Phase 3+)
  repositories/          # Prisma CRUD (Phase 3+)
```

## 当前模块

| 模块 | 状态 | 说明 |
|------|------|------|
| `campaign/` | Phase 1 ✅ | 状态机 + CampaignService |
| `review/` | Phase 1 ✅ | 状态机 + ReviewService |
| `auth/` | Phase 1 ✅ | PermissionService |
| `shared/` | Phase 1 ✅ | Domain events |
| `video/` | Phase 6 ✅ | 分片上传、FFmpeg Worker、Signed HLS、QA、Audit |
| `communication/` | Phase ✅ | AI Communication Engine — 全平台自动本地化 |
| `memory/` | Phase ✅ | Brand/Creator/Relationship DNA + Campaign Memory |
| `design/` | Sprint 11 ✅ | Design tokens + portal class helpers |
| `payment/` | Phase 7 ✅ | Escrow + Stripe |
| `wallet/` | Phase 8 ✅ | Creator wallet |
| `notification/` | Phase 9 ✅ | Event-driven notifications |
| `ai/` | Phase 10 ✅ | AI Gateway + Queue |
| `membership/` | Phase ✅ | Creator tiers, commission snapshots, admin config (DB-driven) |
| `creator/` | Sprint 13 ✅ | Unified portal dashboard, invitations, review routes |

旧代码 (`lib/*-store.ts`, `components/mvp/`) 在迁移完成前继续运行，通过 Repository 适配器逐步切换。
