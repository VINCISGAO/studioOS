# Seedance 2.0 API → VINCIS Canvas 集成

> Provider 文档：[seedance2.ai/zh/api-docs](https://seedance2.ai/zh/api-docs)  
> 定价：`docs/SEEDANCE_CREDITS_PRICING.md`（官方积分 + 15%）

---

## 1. 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `SEEDANCE_API_KEY` | 是 | Dashboard 创建的 `sk_live_*` / `sk_test_* Bearer token |
| `SEEDANCE_API_BASE_URL` | 否 | 默认 `https://api.seedance2.ai` |
| `SEEDANCE_CALLBACK_URL` | 否 | 完整 Webhook URL；默认 `{APP_URL}/api/v1/webhooks/seedance` |
| `NEXT_PUBLIC_APP_URL` | 推荐 | 用于自动拼接 `callback_url` |

---

## 2. 架构（对齐 Mureka 模式）

```
Canvas UI
  → POST /api/generation/video
  → canvasService.createMockGeneration()
       reserve VINCIS Credits（Seedance 官方价 + 15%）
       provider = "seedance"
  → canvasVideoGenerationService.processJob()
       submitSeedanceVideoTask() → POST /v1/videos/generations
       seedancePollTask()      → GET /v1/tasks/:id（≥10s 间隔）
       seedanceDownloadVideo() → 写入 R2
       finalizeCanvasGenerationJob()（扣费 / 失败退款）
  → SSE /api/events/generation
```

Webhook（可选）：`POST /api/v1/webhooks/seedance` — 记录终端状态；主路径仍为 worker 轮询。

---

## 3. 模型 ID 映射

| VINCIS `internal_model_id` | Seedance API `model` |
|----------------------------|----------------------|
| `seedance-2.0` | `seedance-2-0` |
| `seedance-2.0-fast` | `seedance-2-0-fast` |
| `seedance-2.0-mini` | `seedance-2-0-mini` |

---

## 4. 生成模式映射

| Seedance `generation_type` | VINCIS 触发条件 |
|----------------------------|-----------------|
| `text-to-video` | 无参考素材 |
| `image-to-video` | 图片参考；或 2 张关键帧 |
| `reference-to-video` | 视频/音频参考，或多素材组合 |

参考 URL 必须为 **公网 HTTPS**。Canvas 资产通过 R2 presigned URL（1h）提供给 Seedance；直连 `https://...` 的外部 URL 原样传递。

---

## 5. 计费

- **VINCIS 侧**：创建 job 时按 `seedance-credits-pricing.ts` 预留 Credits（+15%）。
- **Seedance 侧**：`POST /v1/videos/generations` 响应 `{ taskId, credits }` 为 provider 预留积分；失败任务 provider 自动退款。
- 成功结算使用 job 创建时的 `estimatedCredits`（VINCIS 用户价），provider 返回的 `credits` 写入 asset metadata 供对账。

---

## 6. 关键文件

| 文件 | 职责 |
|------|------|
| `lib/core/config/seedance-key.ts` | API Key / Base URL / Callback |
| `lib/canvas/seedance-client.ts` | HTTP 客户端、轮询、下载 |
| `lib/canvas/seedance-video-request.ts` | Job input → API body |
| `lib/canvas/seedance-public-asset-url.ts` | 参考素材 presigned URL |
| `features/canvas/canvas-video-generation.service.ts` | 异步 worker |
| `app/api/v1/webhooks/seedance/route.ts` | Webhook 入口 |

---

## 7. 状态探测

```bash
curl /api/v1/seedance/status
# { configured: true, provider: "seedance", callbackUrl: "..." }
```
