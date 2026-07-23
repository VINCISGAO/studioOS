# Seedance → VINCIS Credits 定价表

> 对齐：`docs/PRODUCTION_PRICING_ENGINE.md` · `CreditExchangeRateConfig`  
> Seedance 官方来源：[seedance2.ai/zh/pricing](https://seedance2.ai/zh/pricing)  
> 制定日期：2026-07-23  
> **服务费：Seedance 官方积分 + 15%（Owner 定价政策）**

---

## 1. 换算锚点

| 概念 | 值 | 说明 |
|------|-----|------|
| Credits 汇率 | **100 Credits = $1.00 USD** | `credit_exchange_rate_configs.credits_per_unit_minor = 100` |
| 1 Credit | **$0.01 USD** | Canvas / Studio 对用户展示为 Token / Credits |
| Seedance 成本字段 | `provider_cost_minor` | 等于 Seedance 官方应扣积分（整数） |
| 用户扣费字段 | `credit_price` | **Credits 整数（含 15% 服务费）** |
| 服务费 | **+15%** | 在 Seedance 官方积分上加收 |

### 1.1 公式

```
seedance_credits     = official_rate_per_sec × billable_seconds
billable_seconds     = output_duration                          （无视频参考）
                     = output_duration + reference_video_duration （有视频参考）
customer_credits     = max(1, ceil(seedance_credits × 1.15))
provider_cost_minor  = seedance_credits
```

代码常量：`lib/canvas/seedance-credits-pricing.ts`

**示例（Seedance 2.0 · 720p · 5s · 无视频参考）**

| Seedance 官方 | +15% 用户价 | Credits |
|---------------|-------------|---------|
| 12 / 秒 | 13.8 / 秒 | — |
| 60（5s） | 69 | **69** |

---

## 2. Seedance 2.0 系列 — 官方速率（Credits / 秒）

> 有视频参考时，按 **输入视频 + 输出视频** 合并时长计费。

### 2.1 无视频输入

| 模型 | 480p | 720p | 1080p | 4K |
|------|------|------|-------|-----|
| Seedance 2.0 | 6 | 12 | 30 | 70 |
| Seedance 2.0 Fast | 5 | 10 | — | — |
| Seedance 2.0 Mini | 3 | 6 | — | — |

### 2.2 有视频输入（合并时长）

| 模型 | 480p | 720p | 1080p | 4K |
|------|------|------|-------|-----|
| Seedance 2.0 | 4 | 8 | 20 | 40 |
| Seedance 2.0 Fast | 3 | 6 | — | — |
| Seedance 2.0 Mini | 2 | 4 | — | — |

### 2.3 VINCIS 用户价示例（5s 输出，无视频参考）

| 模型 | 分辨率 | Seedance 官方 | VINCIS Credits |
|------|--------|---------------|----------------|
| Seedance 2.0 | 480p | 30 | **35** |
| Seedance 2.0 | 720p | 60 | **69** |
| Seedance 2.0 | 1080p | 150 | **173** |
| Seedance 2.0 | 4K | 350 | **403** |
| Seedance 2.0 Fast | 480p | 25 | **29** |
| Seedance 2.0 Fast | 720p | 50 | **58** |
| Seedance 2.0 Mini | 480p | 15 | **18** |
| Seedance 2.0 Mini | 720p | 30 | **35** |

### 2.4 VINCIS 用户价示例（5s 输出 + 3s 视频参考 = 8s 合并）

| 模型 | 分辨率 | Seedance 官方 | VINCIS Credits |
|------|--------|---------------|----------------|
| Seedance 2.0 | 480p | 32 | **37** |
| Seedance 2.0 | 720p | 64 | **74** |
| Seedance 2.0 | 1080p | 160 | **184** |
| Seedance 2.0 | 4K | 320 | **368** |

---

## 3. Seedance 1.x 系列（扩展参考，暂未接入 Canvas）

| 模型 | 480p / 5s | 720p / 5s | 1080p / 5s |
|------|-----------|-----------|------------|
| 1.5 Pro / 1.0 Pro | 10 → **12** | 25 → **29** | 50 → **58** |
| 1.0 Lite | 5 → **6** | 15 → **18** | 40 → **46** |

---

## 4. Canvas 已接入模型 ID

| VINCIS `internal_model_id` | Seedance 变体 |
|----------------------------|---------------|
| `seedance-2.0` | Seedance 2.0 |
| `seedance-2.0-fast` | Seedance 2.0 Fast |
| `seedance-2.0-mini` | Seedance 2.0 Mini |

运行时报价：`features/credit-wallet/credit-pricing.service.ts` 对 Seedance 模型按秒动态计算；DB `credit_pricing_rules` 保留 fallback 规则供 integrity 校验。

---

## 5. 团队订阅价（Seedance 官网）

团队 / 团队专业版 **USD 订阅价不在本 Credits 表范围**；若需对 `$49.9` / `$99.9` 席位价同样 +15%，需单独在 `credit_packages` / 区域定价迁移中处理。
