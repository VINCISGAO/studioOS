# VINCIS v1.0 Launch Checklist

> **定义：** 完成本表所有「阻塞上线 = 是」且状态为 ✅ 的项，即 **VINCIS v1.0 GA（General Availability）**。  
> **规则：** 此后不再新增 v1.0 功能；任何新想法先问——**它是否阻止 VINCIS v1.0 上线？**  
> - **是** → 纳入本表并完成  
> - **否** → 写入 v1.1 / v1.2 / v2.0，**不得打断当前开发**  
> **Owner 锁定：** 2026-07-24

---

| 模块 | 状态 | 阻塞上线？ |
|------|------|------------|
| **1. 平台基础** | | |
| 登录 / 注册（Google · 支付宝 · 邮箱） | ✅ | 是 |
| 多语言（11 语言营销 + 产品入口） | ✅ | 是 |
| 品牌端 Portal | ✅ | 是 |
| 创作者端 Portal | ✅ | 是 |
| 管理后台 | ✅ | 是 |
| 数据库稳定（迁移 · 连接 · 主 Admin 保护） | ✅ | 是 |
| **2. AI 创作** | | |
| 图片生成 | ✅ | 是 |
| 视频生成（Seedance） | ✅ | 是 |
| 音乐生成（Mureka） | ⏳ | 是 |
| Credits 扣费 / 余额 | ✅ | 是 |
| Stripe 充值 | ✅ | 是 |
| **3. Marketplace** | | |
| 品牌发布需求（Campaign） | ✅ | 是 |
| 创作者审核（CreatorEligibility + Admin UI） | ⏳ | 是 |
| 创作者匹配（AI · 真实资料） | ✅ | 是 |
| Proposal | ✅ | 是 |
| 项目管理（品牌 / 创作者工作台） | ✅ | 是 |
| **4. Production** | | |
| 托管支付（Escrow） | ✅ | 是 |
| Review Center | ✅ | 是 |
| V1–V5 审片轮次 | ✅ | 是 |
| Frame Comment（批注） | ✅ | 是 |
| 最终交付 / 放款 | ✅ | 是 |
| **5. 安全** | | |
| 权限（角色 · Campaign 隔离） | ⏳ | 是 |
| Webhook（Stripe · 生产验签） | ⏳ | 是 |
| Credits 防篡改 | ✅ | 是 |
| 上传（审片 · 资产） | ✅ | 是 |
| 审计 / 日志 | ⏳ | 是 |
| **6. 上线验收** | | |
| `npm run typecheck` | ✅ | 是 |
| `npm run build` | ✅ | 是 |
| `npm run production:verify` | ✅ | 是 |
| 小额真实 Stripe 支付 | ⏳ | 是 |
| AI 真实生成（图 · 视 · 音） | ⏳ | 是 |
| 全链路人工测试（订单生命周期） | ⏳ | 是 |
| **v1.1 及以后（不阻塞 v1.0）** | | |
| VINCIS Director | ❌ | 否（v1.1） |
| Creative Planner | ❌ | 否（v1.1） |
| Prompt Optimizer | ❌ | 否（v1.1） |
| Storyboard / Shot Planner | ❌ | 否（v1.1） |
| 多模型 Router | ❌ | 否（v1.1） |
| Creator AI Ranking | ❌ | 否（v1.1） |
| Reputation Score | ❌ | 否（v1.2） |
| Creator Timeline UI | ❌ | 否（v1.2） |
| 高级 Analytics | ❌ | 否（v1.2） |
| Agency / Team / Enterprise | ❌ | 否（v1.2） |
| 自研模型 / 自研视频·图片生成 | ❌ | 否（v2.0） |

**图例：** ✅ 已完成 · ⏳ 进行中 / 待验收 · ❌ 明确不在 v1.0 范围

**相关文档：** `docs/VINCIS_ORDER_LIFECYCLE_SPEC.md` · `docs/CREATOR_LIFECYCLE_SPEC.md` · `docs/VIDEO_ENGINE.md` · `docs/VINCIS_DIRECTOR.md`（v1.1 设计）
