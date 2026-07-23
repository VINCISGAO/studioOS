# Mureka → VINCIS Credits 定价表

> 对齐：`docs/PRODUCTION_PRICING_ENGINE.md` · `CreditExchangeRateConfig`  
> Mureka 成本来源：`docs/MUREKA_MUSIC_API_PRICING.md`  
> 制定日期：2026-07-23  
> **服务费：Mureka 官方单价 + 10%（Owner 定价政策）**

---

## 1. 换算锚点（与 Production Pricing Engine 一致）

| 概念 | 值 | 说明 |
|------|-----|------|
| Credits 汇率 | **100 Credits = $1.00 USD** | `credit_exchange_rate_configs.credits_per_unit_minor = 100` |
| 1 Credit | **$0.01 USD** | 对用户展示为 Token / Credits |
| Mureka 成本字段 | `provider_cost_minor` | **USD 分**（$0.03 → `3`） |
| 用户扣费字段 | `credit_price` | **Credits 整数** |
| 服务费 | **+10%** | 在 Mureka 成本上加收，非 Production 引擎里的「固定支出×3」 |

### 1.1 公式

```
provider_cost_minor = round(mureka_usd × 100)
customer_usd        = mureka_usd × 1.10
credit_price        = max(1, ceil(customer_usd × 100))
```

代码常量：`lib/canvas/mureka-credits-pricing.ts`

**示例**

| Mureka 单价 | +10% 用户价 | Credits |
|-------------|-------------|---------|
| $0.03 | $0.033 | **4** |
| $0.045 | $0.0495 | **5** |
| $0.039（歌+词） | $0.0429 | **5** |
| $0.10 | $0.11 | **11** |
| $0.30 | $0.33 | **33** |
| $5.00 | $5.50 | **550** |

---

## 2. Canvas 已接入 — 按模型 × 模式（用户最终价）

> 当前实现：`features/canvas/canvas-music-generation.service.ts`  
> DB 规则：`credit_pricing_rules`（migration `20260723170000_mureka_music_credit_pricing`）

### 2.1 模型 ↔ Mureka API 模型

| VINCIS `internal_model_id` | Mureka API model | Mureka 歌曲/BGM 单价 |
|----------------------------|------------------|----------------------|
| `v7.5-basic` | `mureka-7.6` | $0.03 / 首 |
| `v7.5-all` | `auto`（≈ V7.6） | $0.03 / 首 |
| `v7.5-studio` | `mureka-8` | $0.045 / 首 |

### 2.2 Canvas 音乐生成 — Credits 扣费表（含 10% 服务费）

| 模型 | 模式 | 场景 | Mureka 成本 | Credits（用户） |
|------|------|------|-------------|-----------------|
| **Basic / All** | SIMPLE | 器乐 BGM / 简单生成 | $0.03 | **4** |
| **Basic / All** | CUSTOM | 器乐 | $0.03 | **4** |
| **Basic / All** | CUSTOM | 人声（含自动歌词 API） | $0.039 | **5** |
| **Basic / All** | SOUNDTRACK | 原声带（Phase 1 走 instrumental） | $0.03 | **4** |
| **Studio** | SIMPLE | 器乐 / 简单 | $0.045 | **5** |
| **Studio** | CUSTOM | 器乐 | $0.045 | **5** |
| **Studio** | CUSTOM | 人声（含歌词 API） | $0.054 | **6** |
| **Studio** | SOUNDTRACK | 原声带（Phase 1 fallback） | $0.045 | **5** |

**说明**

- 用户自带歌词时不额外收 `$0.009` 歌词 API 成本，规则仍按「人声 + 可能调歌词 API」的上限 **CUSTOM** 定价（Studio 6 / Basic 5）。
- Mureka 默认 `n=2` 会双倍计费；VINCIS 强制 **`n=1`**，与上表一致。
- Phase 2 接入官方 `soundtrack/generate`（V9 $0.10）后，SOUNDTRACK 行将调整为 **11 Credits**。

---

## 3. Mureka 全 API 目录 — Credits 零售价（+10%）

以下为平台能力扩展参考价；**未接入 API 前不在 Canvas 扣费。**

### 3.1 歌曲 / BGM

| API | 模型档 | Mureka $ | +10% $ | Credits |
|-----|--------|----------|--------|---------|
| 歌曲 / 歌词 | V7.6 | 0.03 | 0.033 | 4 |
| 歌曲 / 歌词 | V8/V9/Oxygen | 0.045 | 0.0495 | 5 |
| 提示唱歌 | 全档 | 0.30 | 0.33 | 33 |
| BGM | V7.6 | 0.03 | 0.033 | 4 |
| BGM | V8/V9 | 0.045 | 0.0495 | 5 |
| 原声带 | V9 | 0.10 | 0.11 | 11 |
| Prompt → Song | 同歌曲档 | 0.03–0.045 | — | 4–5 |

### 3.2 歌词

| API | Mureka $ | Credits |
|-----|----------|---------|
| 完整歌词 | 0.009 | 1 |
| 单行续写 | 0.002 | 1 |

### 3.3 编辑 / 人声 / 分离

| API | Mureka $ | Credits |
|-----|----------|---------|
| 单轨生成 V8 | 0.09 | 10 |
| 延长 V7.6 | 0.036 | 4 |
| 延长 V8 | 0.10 | 11 |
| 混音 Remix V8 | 0.20 | 22 |
| 识别歌曲 | 0.01 | 1 |
| 声乐克隆 / Vocal ID | 5.00 | 550 |
| Stem V1 | 0.06 | 7 |
| Stem V2 | 0.70 | 77 |
| Stem V3 | 0.20 | 22 |
| 自定义模型推理 | 0.06 | 7 |

### 3.4 分析 / 视频 / 语音

| API | Mureka $ | Credits |
|-----|----------|---------|
| 描述歌曲 | 0.10 | 11 |
| 音乐转录 | 0.20 | 22 |
| 歌词视频 | 0.10 | 11 |
| TTS 标准（每小时） | 4.90 | 539 |
| TTS 播客（每小时） | 6.90 | 759 |

---

## 4. 与 Production Pricing Engine 的关系

| 引擎 | 用途 | 与 Mureka Credits 关系 |
|------|------|------------------------|
| **Production Pricing Engine** | 品牌 Campaign 整片报价（15s 单元、倍率、固定支出×3） | 独立；用于 **订单/创作者报价**，不是单次 Canvas 生成扣费 |
| **Credit Pricing Rules** | Canvas / AI Tools **按次**扣 Credits | **本文件**；Mureka 成本 + 10% |
| **Credit Packages** | 用户充值（如 500 Credits / $9） | 套餐含赠送；有效单价低于 100 Credits/$ |

Canvas 一次 Basic BGM（4 Credits）≈ **$0.04 用户价**，Mureka 成本 **$0.03** — 符合「AI 工具按次计费」层，不进入 SAMPLE_006 的「固定支出×3 品牌报价」公式。

---

## 5. 充值档位 vs 按次 Credits（运营）

Mureka **预充值档位**（$30→1 并发 …）是 **平台运营成本**，不直接映射为用户 Credits 包。用户只按上表 Credits 扣费；Owner 需保证 Mureka 账号余额覆盖 `provider_cost_minor` 汇总。

| Mureka 档位 | 并发 | 建议场景 |
|-------------|------|----------|
| $30 | 1 | Beta / 内测 |
| $1,000 | 5 | 小规模上线 |
| $3,000+ | 15+ | 增长期 |

---

## 6. Admin 字段对照

发布 `credit_pricing_rules` 时建议：

| 字段 | 填写 |
|------|------|
| `provider` | `Mureka` |
| `provider_cost_minor` | Mureka USD × 100 |
| `credit_price` | 本表 Credits |
| `margin_percent` | 自动：`~(credit − provider) / credit`（约 9–25%） |
| `refund_on_failure` | `true`（生成失败退还 Credits） |
| `status` | `PUBLISHED` |

---

## 7. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-23 | 初版：Mureka 全目录 + Canvas 三模型定价；+10% 服务费 |
