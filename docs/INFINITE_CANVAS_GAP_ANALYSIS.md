# VINCIS Infinite Canvas — 差距分析与修复计划

**日期：** 2026-07-24  
**阶段：** 3（差距分析）+ 4（修复计划 — **仅计划，未实施**）  
**前置：** `INFINITE_CANVAS_RESEARCH.md`、`INFINITE_CANVAS_AUDIT.md`

---

## 1. 视觉冻结声明

本次工程 **唯一允许的用户感知变化：**

- 画布更快、更稳、更顺、更准确
- 错误/失败状态正确展示（若当前有 bug）

**以下任一变化均视为任务失败：**

- DOM 结构、className、布局、尺寸、颜色、字体、圆角、阴影、图标、视觉层级

实施前/后必须截图对比（Desktop / iPad / Mobile）。不通过则回滚该 commit。

---

## 2. VINCIS 当前功能清单

| 功能 | 状态 |
|------|------|
| 无限 pan/zoom（滚轮、触控板、Space+拖、中/右键拖） | ✅ |
| Select / Move 工具 (V/H) | ✅ |
| 节点拖拽 | ✅ |
| 多选 + 框选 | ✅ |
| 图层 z-index（前/后/顶/底） | ✅ |
| 锁定 / 隐藏 | ✅ |
| Frame 分组 / 解组 | ✅ |
| 对齐 / 排序 / 自动布局（dagre，edges 未启用） | ⚠️ 部分 |
| 复制 / 剪切 / 粘贴 /  duplicate | ✅ |
| 撤销 / 重做（30 条 snapshot） | ✅ |
| 图片 / 视频 / 音频 / 文本 / upload 节点 | ✅ |
| AI 图片 / 视频 / 音乐生成 | ✅ |
| 生成进度 SSE | ✅（poll 模式） |
| 单节点下载 | ✅ |
| Autosave + 刷新恢复 snapshot | ✅ |
| Minimap + navigator dock | ✅ |
| Canvas chat + 拖入图片 | ✅ |
| 右键菜单 | ❌ 故意 block |
| 网格/智能吸附 | ❌ |
| 整画布导出 | ❌ |
| 旋转节点 | ❌ |
| Cmd+A 全选 | ❌ |

---

## 3. 差距分析表

| 功能 / 问题 | 当前状态 | 参考表现 | 差距 | 优先级 | 修改风险 | 影响 UI | 建议方案 |
|-------------|----------|----------|------|--------|----------|---------|----------|
| SSE 重复 terminal 事件 | 无 jobId+status dedupe | 幂等完成回调 | 可能重复 toast/副作用 | **P0** | 低 | 否 | `applyJobEvent` 前 Set dedupe terminal |
| 刷新后 loading 进度丢失 | patchNodeData 不 persist | 恢复进行中任务 | 节点卡在 loading | **P0** | 中 | 否 | 页面 load 时 reconcile jobs from DB |
| Autosave 无版本冲突 | last write wins | 可选 merge | 多 tab 数据覆盖 | **P1** | 中 | 否 | 服务端 version + 409 重载 |
| 双 viewport 源漂移 | Zustand vs RF transform | 单一 truth | zoom 后 hint/落点偶发偏 | **P1** | 低 | 否 | 读 transform 统一走 hook |
| 拖拽/变更导致全节点重渲染 | 无 memo | 仅变节点更新 | 20+ 节点卡顿 | **P1** | 低 | 否 | `React.memo` + stable nodeTypes |
| pointermove → store 每帧 revision++ | onNodesChange dirty | drag end 再 dirty | autosave/debounce 压力 | **P1** | 低 | 否 | dragging 时 skip revision |
| 100+ 节点性能 | 未测；无 culling | viewport 外休眠 media | 缩放平移掉帧 | **P1** | 中 | 否 | 屏外 pause video；可选 visibility flag |
| SSE 10min 断连 | 仅 onerror 重连 | 长任务持续 sync | 长视频生成丢失事件 | **P1** | 低 | 否 | clean close 也 reconnect；或 poll fallback |
| 生成落点重叠 | 固定 viewport center 堆叠 | 选中旁/避让 | 多任务重叠 | **P1** | 低 | 否 | slot index + collision offset |
| 点击 vs 拖拽冲突 | ReactFlow 默认 | 阈值明确 | 偶发误拖 | **P1** | 低 | 否 | 评估 activationDistance（RF prop） |
| 双 selection 源 | selectedNodeIds + selected | 单一 | 边缘 case 不同步 | **P2** | 中 | 否 | 逐步 deprecate 其一 |
| zIndex 无限增长 | max+1 堆叠 | 周期性 normalize | 长期溢出风险 | **P2** | 低 | 否 | normalizeZIndices 工具 |
| snapshot history 内存 | 30×全图 clone | delta history | 大项目内存涨 | **P2** | 中 | 否 | 未来 delta；短期 limit 节点 clone |
| 快捷键无 registry | 2 处 listener | 单一 registry | 维护难 | **P2** | 低 | 否 | 合并 I/S/M 进 shortcuts |
| edges 死代码 | autosave 空 edges | 一致模型 | 困惑/浪费 | **P2** | 低 | 否 | 停止 persist edges 或启用 UI |
| undo 丢 edges | redo 清空 edges | 一致 | 历史不完整 | **P2** | 低 | 否 | undo 恢复 edges 或移除 edge 历史 |
| 无 Cmd+A | 缺失 | 标准 | 效率 | **P2** | 低 | 否 | shortcuts 加 selectAll |
| 对齐仅 y 轴 | alignSelected | 多轴+吸附 | 弱 | **P2** | 低 | 否 | 扩展 align（不改 UI） |
| autosave effect 依赖 nodes | 重置 timer | revision only | 多余 timer | **P2** | 低 | 否 | effect 仅依赖 revision |
| 无 perf instrumentation | 无 | mark/measure | 无法量化 | **P2** | 低 | 否 | dev-only perf marks |
| 网格吸附 | 无 | Figma 等 | 功能缺口 | **P3** | 高 | 可能 | v1.1 候选 |
| 右键菜单 | block | 完整 menu | 功能缺口 | **P3** | 高 | 是 | v1.1 |
| Touch 直接编辑 | 无 | Lovart 公开 | 功能缺口 | **P3** | 高 | 是 | v1.1 |
| 整画布导出 | 无 | 常见 | 功能缺口 | **P3** | 中 | 可能 | v1.1 / 服务端 |
| AiDirector UI | 组件 orphan | 应有入口 | 功能未达 | **P3** | — | 是 | 产品决策 |

---

## 4. P0 / P1 / P2 / P3 汇总

### P0 — 必须修（数据/任务正确性）
1. SSE terminal 事件幂等（防重复 SUCCEEDED/FAILED 处理）
2. 刷新后 job ↔ node reconcile（防 loading 永久卡死）

### P1 — 明显影响体验/稳定性
3. Viewport 单一数据源
4. 节点 memo + 减少 store 订阅范围
5. Drag 期间 skip revision/autosave dirty
6. 100+ 节点 media pause / visibility
7. SSE 长连接策略（reconnect on close）
8. 多生成任务落点避让
9. Autosave 版本冲突检测

### P2 — 可优化（低风险）
10. Selection 单源化
11. zIndex normalize
12. 快捷键 registry 合并
13. History 内存优化路径
14. autosave effect 依赖修正
15. Cmd+A、align 扩展

### P3 — v1.1（本次不做）
- 吸附网格、右键菜单、Touch edit、整画布导出、AiDirector 入口、协作

---

## 5. 建议修复顺序与预计收益

| 顺序 | 项 | 预计收益 | 工作量 |
|------|-----|----------|--------|
| 1 | P0 job dedupe + refresh reconcile | 消除重复生成/卡死 | 1–2 天 |
| 2 | drag 时 skip revision | autosave 请求 ↓ 90%+ 拖拽场景 | 0.5 天 |
| 3 | React.memo 节点 | 20 节点 commit ↓ 50–80%（待 Profiler 证实） | 1 天 |
| 4 | viewport 单一读取 | 消除落点/hint 漂移 | 0.5 天 |
| 5 | SSE reconnect + load reconcile | 长任务可靠 | 1 天 |
| 6 | 屏外 video pause | 100 节点内存/FPS ↑ | 1 天 |
| 7 | 生成落点 collision | 多任务可读性 ↑（位置变，非 UI  chrome） | 0.5 天 |
| 8 | autosave version | 多 tab 安全 | 1–2 天 |
| 9 | P2 批处理 | 维护性 ↑ | 2–3 天 |

**累计预估：** 8–12 工作日（每项独立 commit，可独立回滚）

---

## 6. 阶段 4 修复计划（待 Owner 确认后执行）

> **现在不改代码。** 下列为批准后的实施模板。

### 6.1 P0-1：Generation event dedupe

| 项 | 内容 |
|----|------|
| 文件 | `hooks/use-generation-events.ts`, `canvas-store.ts` `applyJobEvent` |
| 原因 | 重复 SSE payload 可能重复 terminal 副作用 |
| 行为变化 | 同一 jobId+terminal status 只处理一次 |
| UI 变化 | 否 |
| 性能 | 微 |
| 风险 | 低 |
| 回滚 | revert commit |
| 测试 | 模拟重复 SSE；生成成功仅一次节点变 ready |

### 6.2 P0-2：Refresh job reconcile

| 项 | 内容 |
|----|------|
| 文件 | `canvas-workspace.tsx` or new hook, `canvas.service.ts` list jobs API |
| 原因 | patchNodeData 不 persist，刷新后 loading 失联 |
| 行为变化 | initialize 后 fetch active jobs → applyJobEvent |
| UI 变化 | 否（仅状态正确） |
| 风险 | 中 — 需与 SSE  dedupe 配合 |
| 测试 | 生成中刷新 → 进度恢复或 terminal 正确 |

### 6.3 P1-1：Skip revision while dragging

| 项 | 内容 |
|----|------|
| 文件 | `canvas-store.ts` `onNodesChange` |
| 原因 | 每 pointermove revision++ 触发 autosave 链 |
| 行为变化 | dragging position 不 bump revision；drag end 才 dirty |
| UI | 否 |
| 性能 | 高（拖拽场景） |
| 测试 | 拖拽时 network 无 autosave；松手 1s 后 save |

### 6.4 P1-2：Memo node components

| 项 | 内容 |
|----|------|
| 文件 | `components/canvas/nodes/*.tsx` |
| 原因 | 任意 node 更新 → 全树重渲染 |
| 行为变化 | 无用户可见变化 |
| UI | **必须截图对比** |
| 测试 | Profiler 对比 20 节点 drag |

### 6.5 P1-3：Unified viewport read

| 项 | 内容 |
|----|------|
| 文件 | `viewport-anchor.ts`, `use-canvas-media-actions.ts`, `use-canvas-viewport-content.ts` |
| 原因 | 双源 drift |
| 行为变化 | spawn/hint 用 live transform |
| UI | 否（落点更准确） |

---

## 7. 回滚方案

| 层级 | 方式 |
|------|------|
| 单 fix | `git revert <commit>` — 每 issue 一 commit |
| 整批 | revert 系列 commits（从新到旧） |
| 视觉回归 | 对比基线截图；任一像素 chrome 变化即 revert |
| 数据 | autosave 版本冲突时服务端保留较高 version；客户端 reload snapshot |

---

## 8. 验收标准（实施后）

1. UI 截图对比无视觉变化  
2. 现有功能全部可用  
3. 无 API 破坏性修改  
4. 无 Credits 行为变化  
5. 无任务丢失 / 重复节点 / 重复生成  
6. 拖拽与缩放 FPS 提升（Profiler 有前后数据）  
7. 100+ 节点操作更稳定  
8. iPad 双指缩放/拖拽正常  
9. 刷新可恢复进行中的 job  
10. typecheck / lint / build / production:verify 通过  

---

## 9. v1.1 建议（本次不做）

- 网格吸附 + 智能参考线（无新 UI chrome 前提下仅 snap feedback 需产品确认）
- 右键上下文菜单
- 整画布/区域导出（建议服务端 rasterize）
- Delta history + 协作基础
- AiDirector 入口挂载（**涉及 UI，需 Owner 明确命令**）
- Lovart 式 touch edit

---

## 10. 已知限制（审计结论）

1. React Flow DOM 模型上限 ~500 节点（富媒体更低）
2. SSE 为 DB poll，非真 push
3. 无整画布 export
4. 无旋转/吸附
5. FPS/内存 **尚未实测** — 实施 P1 前后必须补数据

---

**请 Owner 确认：**

- [ ] 差距优先级是否同意  
- [ ] 是否批准按 §6 顺序进入代码实施  
- [ ] P3 是否维持冻结  

确认前 **不进行任何业务代码修改**。
