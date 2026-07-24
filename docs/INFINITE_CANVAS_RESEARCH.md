# VINCIS Infinite Canvas — 公开研究与参考架构

**日期：** 2026-07-24  
**阶段：** 1（公开研究）  
**约束：** 仅研究合法公开来源；不复制专有代码、品牌或受版权保护表达。

---

## 1. 研究范围与方法

### 合法来源
- 开源项目官方文档与 GitHub README
- Lovart 公开营销页、Wiki、博客（可正常访问的前端行为描述）
- 浏览器可观察的交互模式（未逆向私有后端）

### 禁止
- 绕过登录/付费、逆向混淆、复制专有源码
- 将第三方代码直接粘贴进 VINCIS

---

## 2. Lovart 公开可观察行为清单

> 来源：lovart.ai 公开功能页与 Wiki（ChatCanvas、批量生成指南等）。以下为产品层描述，非源码结论。

| 类别 | 公开描述的行为 |
|------|----------------|
| **画布导航** | 无限画布（ChatCanvas）；可缩放、可平移；空间化放置素材与生成结果 |
| **空间上下文** | Agent 可感知画布布局；参考图/输出分散摆放参与推理 |
| **直接编辑** | 点击画布元素进行颜色/纹理/文字等 touch edit，减少长 prompt |
| **批量生成** | Sequential（稳定）vs Parallel（更快、消耗更高）；计划档位限制 batch 上限 |
| **变体** | 对话中「生成 N 个变体」 |
| **模型路由** | MCoT 自动选模；`@mention` 锁定特定模型 |
| **多模态同画布** | 图片/视频/不同模型输出共存于同一空间 |
| **视频参数** | Motion Control（Pan/Tilt/Zoom/Roll）；首尾帧 keyframe |
| **刷新恢复** | 公开材料强调「持久 workspace」；具体任务恢复机制未在文档中细述 |

### 与 VINCIS 的对照（产品层，非实现层）
| Lovart 公开能力 | VINCIS 现状 |
|-----------------|-------------|
| 无限 pan/zoom | ✅ React Flow + navigator dock |
| 空间化 AI 输出 | ✅ image/video/music/loading 节点 |
| 批量/队列 | ✅ 生成面板 + queue popover + credits |
| 多模型同画布 | ✅ AI model catalog per generation |
| Touch 直接编辑元素 | ❌ 无（P3） |
| CSV 模板批量 | ❌ 无（P3） |
| 公开文档级任务恢复保证 | ⚠️ 部分（SSE poll + DB job；见审计 P0/P1） |

---

## 3. 开源项目研究

### 3.1 tldraw

| 项 | 内容 |
|----|------|
| **许可证** | 自定义 tldraw License — 开发免费，**生产需 license key**（非 OSI 开源） |
| **渲染** | 混合 DOM + Canvas（指示器） |
| **状态** | `@tldraw/store` 响应式 Store；document/session/presence 分层 |
| **坐标** | Screen / Page / Viewport 三空间；`screenToPage()` 等统一 API |
| **历史** | Diff + marks；`editor.run({ history: 'ignore' })` |
| **性能** | RBush R-tree viewport culling；平移时跳过 hover hit-test |
| **借鉴** | 空间索引、mark 级事务历史、坐标统一入口 |
| **不可复制** | SDK 本体、生产 license 流程 |
| **引入依赖？** | **否** — license 与 VINCIS 产品模型不匹配 |
| **迁移成本** | 极高（12–20+ 周），需重写 ~170 画布文件 |

### 3.2 Excalidraw

| 项 | 内容 |
|----|------|
| **许可证** | MIT |
| **渲染** | 双 Canvas（Static + Interactive） |
| **状态** | Store 增量 delta；Durable vs Ephemeral increment |
| **历史** | Delta stacks，拖拽中间态不进 durable history |
| **性能** | 可见元素 memo + viewport culling |
| **借鉴** | Ephemeral/durable 分离、delta history |
| **不可复制** | 手绘风格渲染管线 |
| **引入依赖？** | **否** — 白板场景，非富媒体节点编辑器 |
| **迁移成本** | 极高（10–16 周） |

### 3.3 React Flow (@xyflow/react) — **VINCIS 当前基座**

| 项 | 内容 |
|----|------|
| **许可证** | MIT |
| **渲染** | DOM 节点 + SVG 边；d3-zoom 平移缩放 |
| **状态** | 内置 Zustand；VINCIS 外置 `useCanvasStore` 包装 |
| **坐标** | Flow space + `{ x, y, zoom }` viewport；`screenToFlowPosition()` |
| **历史** | **无内置** — VINCIS 自研 snapshot history（max 30） |
| **性能** | 官方建议 ~500 节点前 DOM 可接受；NodeRenderer 按 id 订阅 |
| **Rich nodes** | ✅ 视频/音频/表单 — **VINCIS 核心优势** |
| **引入依赖？** | **是 — 已集成** |
| **迁移成本** | N/A；增量优化 2–6 周/项 |

### 3.4 Fabric.js

| 项 | 内容 |
|----|------|
| **许可证** | MIT |
| **渲染** | 单 Canvas 2D 命令式对象模型 |
| **React** | 无官方绑定 |
| **借鉴** | viewportTransform 矩阵、序列化模式 |
| **引入依赖？** | **否** |
| **迁移成本** | 高（8–14 周） |

### 3.5 Konva / react-konva

| 项 | 内容 |
|----|------|
| **许可证** | MIT |
| **渲染** | Stage → Layer → Group 多层 Canvas |
| **性能** | `batchDraw()`、`listening: false`、`isClientRectOnScreen` |
| **引入依赖？** | **仅参考**；若 DOM 瓶颈证实可考虑 hybrid |
| **迁移成本** | 高（8–12 周） |

### 3.6 PixiJS

| 项 | 内容 |
|----|------|
| **许可证** | MIT |
| **渲染** | WebGL/WebGPU；CullerPlugin |
| **引入依赖？** | **否** — 媒体重 DOM 节点不适合 sprite 化 |
| **迁移成本** | 极高（14–20+ 周） |

---

## 4. 技术路线建议

### 结论：**继续 React Flow + Zustand，不替换技术栈**

| 决策 | 理由 |
|------|------|
| 不引入 tldraw SDK | 生产 license + 模型不匹配 |
| 不迁移 Konva/Pixi/Fabric | 富媒体 React 节点是产品核心；迁移 ROI 极低 |
| 不引入第二套 Canvas | 违反「单画布」原则 |
| 增量借鉴 | delta history、viewport 订阅优化、RBush 查询（可选）、ephemeral drag |

### 可借鉴模式（独立实现）

1. **Excalidraw/tldraw：** 拖拽中间态 = ephemeral，drag end = 一条 history
2. **tldraw：** viewport culling / 空间索引（100+ 节点时）
3. **Lovart 公开 UX：** 队列并发策略、阶段化进度文案（Preparing/Queued/Generating…）
4. **统一坐标 registry：** 收敛到 `lib/canvas/viewport-anchor.ts` + React Flow API

---

## 5. 许可证风险摘要

| 项目 | 商业使用 | 风险 |
|------|----------|------|
| React Flow | MIT ✅ | 低 |
| Excalidraw / Konva / Fabric / Pixi | MIT ✅ | 低（若只参考思路） |
| tldraw SDK | 需付费 key ⚠️ | 高 — 勿直接依赖 |

---

## 6. 参考链接

- tldraw: https://tldraw.dev
- Excalidraw: https://excalidraw.com
- React Flow: https://reactflow.dev
- Fabric.js: https://fabricjs.com
- Konva: https://konvajs.org
- PixiJS: https://pixijs.com
- Lovart: https://www.lovart.ai

---

*阶段 1 完成。下一阶段见 `INFINITE_CANVAS_AUDIT.md`。*
