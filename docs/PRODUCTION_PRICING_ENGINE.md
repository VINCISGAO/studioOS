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
| 五组真实 / 推导样本入库 | ✅ SAMPLE_001–SAMPLE_005 |
| 固定支出 × 3 合理报价学习规则 | ✅ SAMPLE_006 + Profile v1 |
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

### SAMPLE_003 — 创作者生产基准：专业级广告

来源：另一位创作者提供的生产成本表。原始币种为 RMB，入库时保留 RMB 明细，并按 **7.2 CNY/USD** 标准化到 `*_usd` 字段，便于报价引擎横向比较。

| 字段 | 值 |
|------|-----|
| 类型 | 品牌广告 (`BRAND_AD`) |
| 难度档 | `COMMERCIAL` |
| 适用场景 | 品牌信息流、电商主图视频、企业宣传 |
| 成片时长 | 60 秒 |
| 合格 15 秒段数 | 5 |
| 1 分钟累计 15 秒生成次数 | 约 8 次 |
| 生图总张数 | 14 张 |
| 生图成本 | 28 RMB |
| 视频生成成本 | 约 163 RMB |
| 1 分钟成品总硬成本 | 约 191 RMB |
| 折算单秒成品成本 | 约 3.18 RMB |
| 折算单条合格 15 秒成本 | 约 38.2 RMB |

> 该样本只表示 AI 生成硬成本，不包含创作者人工、剪辑、修改预留、平台费或利润。

### SAMPLE_004 — 创作者生产基准：影视级广告

来源同上，原始 RMB 明细保留在 `metadata_json`，`*_usd` 字段按 **7.2 CNY/USD** 标准化。

| 字段 | 值 |
|------|-----|
| 类型 | 品牌影片 (`BRAND_FILM`) |
| 难度档 | `CINEMATIC` |
| 适用场景 | 品牌 TVC、高端宣传片、院线贴片 |
| 成片时长 | 60 秒 |
| 合格 15 秒段数 | 7 |
| 1 分钟累计 15 秒生成次数 | 约 18 次 |
| 生图总张数 | 27 张 |
| 生图成本 | 54 RMB |
| 视频生成成本 | 约 367 RMB |
| 1 分钟成品总硬成本 | 约 421 RMB |
| 折算单秒成品成本 | 约 7.02 RMB |
| 折算单条合格 15 秒成本 | 约 60.1 RMB |

> 该样本用于校准影视级广告的废片率、抽卡次数、生图成本和视频硬成本。

### SAMPLE_005 — 学习库：SD2.0 废片摊销基准

来源：学习库学习成本表。仅统计 **SD2.0** 视频生成模型，原始 RMB 明细保留在 `metadata_json`，`*_usd` 字段按 **7.2 CNY/USD** 标准化。

#### 废片 & 产出基础数据

| 项目 | 数值 | 备注 |
|------|------|------|
| 视频生成模型 | SD2.0 | 不纳入其他视频模型成本 |
| 单条视频基础时长 | 15 秒 | 统一按 15 秒/条素材计算 |
| 总生成视频条数 | 336 条 | 全量抽卡生成总数 |
| 最终可用视频条数 | 99 条 | 可用于成片剪辑的有效素材 |
| 废片总条数 | 237 条 | 无法使用的废弃素材 |
| 视频废片率 | 70.54% | 废片条数 ÷ 总生成条数 |
| 视频可用率 | 29.46% | 可用条数 ÷ 总生成条数 |
| 配套 AI 生图总张数 | 100 张 | 含风格参考、分镜配图 |

#### 生成成本明细

| 项目 | 数值 | 备注 |
|------|------|------|
| SD2.0 单条 15 秒生成单价 | 14.73 元 | 单条生成直接成本 |
| SD2.0 视频生成总成本 | 4,950 元 | 336 条 × 14.73 元/条 |
| AI 生图单张成本 | 5 元 | nano banana Pro / GPT Image 商用级 |
| AI 生图总成本 | 500 元 | 100 张 × 5 元/张 |
| AI 生成端总成本合计 | 5,450 元 | 视频 + 生图全量生成成本 |

#### 单位成品成本（含废片摊销）

| 项目 | 数值 | 备注 |
|------|------|------|
| 单条 15 秒可用视频综合成本 | 55.05 元 | 总成本 ÷ 可用条数，含废片分摊 |
| 每秒视频综合成本 | 3.67 元 | 单条 15 秒成本 ÷ 15 秒 |
| 每分钟视频综合成本 | 220.20 元 | 每秒成本 × 60 秒 |
| 可用视频总时长 | 24.75 分钟 | 99 条 × 15 秒/条 |

入库锚点（USD 标准化）：

| 字段 | 值 |
|------|-----|
| 类型 | 品牌广告 (`BRAND_AD`) |
| 难度档 | `STANDARD` |
| 成片可用时长 | 24:45（1,485 秒） |
| 可用 15 秒单元 | 99 |
| 总生成次数 | 336 |
| 生成倍率 | **3.39×** |
| 可用率 | **29.46%** |
| AI 生成总硬成本 | 约 5,450 RMB（≈ **$756.94 USD**） |
| 含废片摊销单条 15 秒成本 | 约 55.05 RMB（≈ **$7.65 / 15s**） |
| 含废片摊销单秒成本 | 约 3.67 RMB（≈ **$0.51 / 秒**） |

> 该样本表示 SD2.0 批量抽卡后的 AI 生成硬成本（含废片摊销），不包含创作者人工、剪辑、修改预留、平台费或利润。

### SAMPLE_006 — 学习库：固定支出 × 3 合理报价规则

来源：学习库定价规则。当一条视频的 **AI / 工具固定支出** 为 **$800 USD** 时，**$2,400 USD** 的品牌报价是合理区间——即 **合理报价 ≈ 固定支出 × 3**。

| 字段 | 值 |
|------|-----|
| 类型 | 品牌广告 (`BRAND_AD`) |
| 难度档 | `STANDARD` |
| 固定支出（AI / 工具硬成本） | **$800 USD** |
| 合理品牌报价 | **$2,400 USD** |
| 报价倍率 | **3×** |

> 固定支出仅含 AI 工具、生图、抽卡等硬成本；3× 报价已隐含人力、修改预留、平台费与创作者利润。Profile v1 字段 `fixedExpenditureToQuoteMultiplier = 3` 用于锚定 `brandSuggestedPriceUsd`。

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
  production-pricing.constants.ts   # Profile v1 + SAMPLE_001–006 常量
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

### 品牌向导 UI（`marketQuoteForBrief`）

```
时长起步价：
  ≤15s  → $200
  16s–60s → $500
  >60s  → $500 × 超 1 分钟权重系数

规格系数 = 分辨率系数 × 交付/风格系数（画幅不参与）
  4K ×1.14，1080P ×1.0

基础匹配 = round(时长起步价 × 规格系数 × 数量折扣)
推荐匹配 = 基础匹配 × 1.16
优先匹配 = 基础匹配 × 1.38
顶级创作者 = 基础匹配 × 1.75
```

### 生产定价引擎（`estimateProjectCost`，后台/样本库）

```
固定支出（AI / 工具硬成本）× 3 ≈ 合理品牌报价（学习库 SAMPLE_006，例：$800 → $2,400）

创作者生产成本 = 工具成本 + 人工成本 + 修改预留 + 风险缓冲
创作者最低收入 = 生产成本 × (1 + 最低利润率 25%)
品牌最低发布价 = 创作者最低收入 ÷ (1 - 佣金 - 支付费 - 风险准备)
品牌推荐报价 = max(创作者目标收入换算价, 固定支出 × 3)
```

工具成本锚点：SAMPLE_001 实测 **$39.38/15s（2.5×）**；其他档位按倍率比例缩放，待更多 USD 样本校准。

---

## 下一步

1. 补全《命运转移》镜头数 / 生成总次数 / 修改轮次（owner 手工统计）
2. 品牌 Campaign Wizard 接入 `estimateFromBrief` 四档预算 UI
3. 低于 `brandFloorPriceUsd` 时阻止发布（PDF 第十节）
4. 项目结算后写入 `actual_production_records`，积累 20+ 同类项目后小幅自动校准倍率
