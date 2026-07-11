# VINCIS Production Pricing Engine

**Internal name:** `VINCIS Production Pricing Engine`  
**中文:** VINCIS 智能制作估价引擎

> 核心不是「模型生成一次多少钱」，而是：**一位合格创作者完成一条可交付商业视频，实际需要多少生成次数、人工时间、修改成本与合理利润。**

Canonical owner spec: `VINCIS 创作者生产成本与智能报价系统完整方案.pdf`

---

## V1 状态（2026-07-11）

| 模块 | 状态 |
|------|------|
| DB schema（profile / tiers / benchmarks / estimates / actuals） | ✅ |
| 两组真实样本入库 | ✅ SAMPLE_001 + SAMPLE_002 |
| 五档生成倍率 | ✅ SIMPLE → COMPLEX |
| 规则引擎估价（无 AI 调用） | ✅ `estimateProjectCost()` |
| 品牌向导 UI 接入 | ⏸ 下一步 |
| 项目完成后 ActualProductionRecord 回流 | ⏸ 下一步 |

---

## 真实样本库

### SAMPLE_001 — 《命运转移》

| 字段 | 值 |
|------|-----|
| 类型 | AI 剧情短片 (`AI_DRAMA_SHORT`) |
| 难度档 | `COMPLEX` |
| 成片时长 | 16:30（990 秒） |
| 15 秒生产单元 | 66 |
| AI 工具支出 | **$2,599 USD** |
| 平均 AI 成本 | **$39.38 / 15s** · **$2.63 / 秒** |
| 生成倍率（经验基准） | **2.5×** |
| Creator 工时（示例） | 28 天 × 8h = **224 小时** |
| 待补字段 | 总镜头数、AI 生成总次数、修改轮次、剪辑工时 |

充值明细（USD）：450 + 450 + 360 + 450 + 360 + 360 + 169 = **2,599**

> 若后续统计为 420 次生成 / 66 条可用单元，实测倍率约 **6.36×**（高于 2.5× 经验值）。已写入 `metadata_json.alternativeMultiplierFrom420Gens`。

### SAMPLE_002 — VINCIS 品牌宣传片

| 字段 | 值 |
|------|-----|
| 类型 | 电影感品牌广告 (`CINEMATIC_BRAND_PROMO`) |
| 难度档 | `CINEMATIC` |
| 成片时长 | 2:40（160 秒） |
| 15 秒可交付单元 | 10.67 |
| 总 Token | **66,000** |
| 每 15 秒 Token | **6,187.5** |
| 每秒 Token | 412.5 |
| 单次 15s 4K 生成 | 1,500 Token |
| 预计生成次数 | 44 |
| 真实生成倍率 | **4.125×** |
| 可用率 | **24.24%** |
| 复杂度系数 | **1.65**（相对 2.5× 基准） |

对比：

| 指标 | 通用经验 | VINCIS 宣传片实测 |
|------|----------|-------------------|
| 每条可用素材所需生成数 | 2.5 | 4.13 |
| 可用率 | 40% | 24.2% |
| 每 15 秒消耗 | 3,750 Token | 6,187.5 Token |

---

## 三档（实际五档）生成倍率 — Profile v1

| 制作难度 | Tier | 生成倍率 | 每 15 秒 Token 参考 |
|----------|------|----------|---------------------|
| 普通产品 / 简单画面 | `SIMPLE` | 1.75× | 2,625 |
| 标准商业视频 | `STANDARD` | **2.5×** | 3,750 |
| 高质量商业广告 | `COMMERCIAL` | 3.5× | 5,250 |
| 电影感品牌宣传片 | `CINEMATIC` | **4.125×** | **6,188** |
| 高一致性复杂剧情 | `COMPLEX` | 6.5× | 9,750 |

**结论：** 2.5× 继续作为普通项目基准；电影感品牌宣传片应使用 **~6,200 Token / 15s · 4.1× 倍率**。

---

## 数据库表

| 表 | 用途 |
|----|------|
| `production_pricing_profiles` | 全局规则（倍率、利润率、佣金率） |
| `project_complexity_tiers` | 五档难度参数 |
| `production_benchmark_samples` | **真实制作样本**（平台资产） |
| `project_cost_estimates` | 每 Campaign 估价快照（含 `campaign_id`） |
| `actual_production_records` | 项目完成后真实数据回流 |

---

## 代码入口

```
features/pricing/
  production-pricing.constants.ts   # Profile v1 + SAMPLE_001/002 常量
  production-pricing.types.ts
  production-pricing.repository.ts  # Prisma CRUD + seed
  production-pricing-estimate.service.ts  # 纯规则估价
  production-pricing.service.ts     # Facade
```

### 估价示例

```typescript
import { productionPricingService } from "@/features/pricing/production-pricing.service";

const estimate = productionPricingService.estimateFromBrief({
  durationSeconds: 160,
  projectType: "CINEMATIC_BRAND_PROMO"
});
// estimate.brandFloorPriceUsd — 低于此价应阻止发布
// estimate.brandSuggestedPriceUsd — 推荐匹配价
```

### 迁移 & Seed

```bash
npm run db:generate          # schema 变更后必须先跑
npm run db:migrate:deploy    # 用项目脚本，勿直接 npx prisma migrate deploy
npx tsx scripts/seed-production-pricing.ts
# 或
npm run db:seed
```

---

## 报价公式（V1）

```
创作者生产成本 = 工具成本 + 人工成本 + 修改预留 + 风险缓冲
创作者最低收入 = 生产成本 × (1 + 最低利润率 25%)
品牌最低发布价 = 创作者最低收入 ÷ (1 - 佣金 - 支付费 - 风险准备)
```

工具成本锚点：SAMPLE_001 实测 **$39.38/15s（2.5×）**；其他档位按倍率比例缩放，待更多 USD 样本校准。

---

## 下一步

1. 补全《命运转移》镜头数 / 生成总次数 / 修改轮次（owner 手工统计）
2. 品牌 Campaign Wizard 接入 `estimateFromBrief` 四档预算 UI
3. 低于 `brandFloorPriceUsd` 时阻止发布（PDF 第十节）
4. 项目结算后写入 `actual_production_records`，积累 20+ 同类项目后小幅自动校准倍率
