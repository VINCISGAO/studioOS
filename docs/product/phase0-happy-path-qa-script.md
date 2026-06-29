# StudioOS — 15-Step Happy Path QA Script

**用途：** 投资人 Demo · 回归测试 · 新成员 Onboarding  
**时长：** 约 25–35 分钟（双浏览器）或 40 分钟（单人切换账号）  
**密码（Demo）：** `TempAdBridge2026!`

**Spec refs:** Architect #1 Wizard · #2 State machine §13.1 · #3 Contract · #4 Phase 0

---

## 0. 前置条件

### 0.1 环境

| 项 | 要求 |
|----|------|
| App URL | `http://localhost:3000`（或 staging URL） |
| 浏览器 | 2 个配置文件/窗口（Brand + Studio）推荐 |
| 语言 | `?lang=en` 或 `?lang=zh`（全程保持一致） |

### 0.2 Demo 账号

| 角色 | Email | Portal |
|------|-------|--------|
| **Brand** | `client.arc@adbridge.test` | `/brand` |
| **Studio** | `creator.nova@adbridge.test` | `/studio` |
| Admin（可选） | `admin@adbridge.test` | `/admin` |

### 0.3 Phase 0 完成度说明

| 标记 | 含义 |
|------|------|
| ✅ | Phase 0 目标态应通过 |
| 🔄 | 当前 MVP 可用替代路径（脚本中标注） |
| ⏳ | Phase 0 未完成时跳过 |

---

## 1. 脚本总览（15 步）

```
 1. Brand 登录 · 进入 Wizard
 2. Step 1–2 · 产品与参考素材
 3. Step 3–5 · AI Brief + Options + Pack
 4. Step 6 · Publish Project
 5. AI Match · 查看 Top 5 Studio
 6. Brand · 选定 Nova Motion Studio
 7. Proposal Room · 结构化议价
 8. Brand · Accept Proposal → Contract
 9. 双方 · Contract 双签
10. Brand · Escrow 付款
11. Studio · Production Pipeline
12. Studio · 提交交付物
13. Brand · Review Center 审片
14. Brand · 批准交付 · Escrow 释放
15. Studio · 收入确认 · 可选提现
```

---

## 2. 逐步执行

---

### Step 1 — Brand 登录 · 进入 Wizard

**Actor:** Brand  
**Route:** `/` → Login → `/brand/projects/new`

| # | 操作 | 预期结果 |
|---|------|----------|
| 1.1 | 打开 Landing | 看到 StudioOS；双入口「I need Ads / I want Projects」✅ 🔄 当前可能仅单 CTA |
| 1.2 | 点击 **I need Ads** | 跳转 Wizard 或 Login |
| 1.3 | 登录 `client.arc@adbridge.test` | 进入 Brand Portal |
| 1.4 | 导航 **Create Campaign** / `/brand/projects/new` | Wizard Step 1；进度条 1/6 |
| 1.5 | 检查 Dashboard | 若已有 draft，可继续或新建 |

**Checkpoint 📸:** Wizard Step 1 全屏

**Fail 排查:**
- 404 → 检查 M2.1 是否合并；🔄 临时用 `/brand/brief/new`
- 未登录 → cookie / demo session

---

### Step 2 — Wizard Step 1–2 · 产品与参考素材

**Actor:** Brand  
**Routes:** Wizard Step 1 → Step 2

#### Step 1 填写

| 字段 | 测试值 |
|------|--------|
| Product name | `Arc Alloy Summer Launch` |
| Category | `Consumer tech` |
| Objective | `Launch` |
| Product images | 上传 ≥1 张 |
| Logo | 上传 1 个 |

| # | 操作 | 预期结果 |
|---|------|----------|
| 2.1 | 填必填项 | Continue 可点击 |
| 2.2 | 缺 logo 点 Continue | **阻断** + 错误提示 |
| 2.3 | 补全 → Continue | 进入 Step 2 |

#### Step 2 填写

| # | 操作 | 预期结果 |
|---|------|----------|
| 2.4 | 添加 YouTube 或 TikTok 链接 | 卡片出现在列表 |
| 2.5 | 无 reference 点 Continue | **阻断** |
| 2.6 | ≥1 reference → Continue | 进入 Step 3 |

**Checkpoint 📸:** Step 2 参考列表 ≥1 条

---

### Step 3 — Wizard Step 3–5 · AI Brief + Options + Pack

**Actor:** Brand

#### Step 3 — AI Analysis

| # | 操作 | 预期结果 |
|---|------|----------|
| 3.1 | 等待分析完成 | 骨架屏 → Brief 预览 |
| 3.2 | 检查字段 | visual style, hook, audience 等有内容 |
| 3.3 | Continue | 进入 Step 4 |

🔄 **MVP：** 可能为模板 Brief；确认有「Template」或类似标识即可

#### Step 4 — Production Options

| 字段 | 测试值 |
|------|--------|
| Style | `Cinematic` + `Minimal` |
| Length | `30s` |
| Ratio | `9:16` |
| Quantity | `3` |
| Budget | `$1,000 – $2,500` |

| # | 操作 | 预期结果 |
|---|------|----------|
| 3.4 | 选必填项 | 估算面板更新 |
| 3.5 | Continue | 进入 Step 5 |

#### Step 5 — Creative Pack

| # | 操作 | 预期结果 |
|---|------|----------|
| 3.6 | 查看 Brief / Storyboard / Script | 三项均有内容 |
| 3.7 | 编辑 Storyboard 任一场景 | 保存成功；`human_edited` 行为可观察 |
| 3.8 | Continue | 进入 Step 6 |

**Checkpoint 📸:** Step 5 Pack 编辑器

---

### Step 4 — Wizard Step 6 · Publish Project

**Actor:** Brand  
**Route:** Wizard Step 6 → `/brand/projects/[id]?tab=match`

| # | 操作 | 预期结果 |
|---|------|----------|
| 4.1 | Review summary | 显示产品名、数量、预算 |
| 4.2 | 编辑 Project title | 可改 |
| 4.3 | 未勾选 confirm 点 Publish | **阻断** |
| 4.4 | 勾选 confirm → **Publish project** | Toast 成功 |
| 4.5 | 自动跳转 Project Hub | `status = matching`；Match tab 激活 |
| 4.6 | 检查 locked tabs | Proposal / Production 等显示锁定 |

**Checkpoint 📸:** Project Hub · Match tab · Published 状态

**Fail 排查:**
- Publish 后仍 draft → M2.6 状态机
- 跳转 404 → M2.8 Hub 未建

---

### Step 5 — AI Match · 查看 Top 5 Studio

**Actor:** Brand  
**Route:** `/brand/projects/[id]?tab=match`

| # | 操作 | 预期结果 |
|---|------|----------|
| 5.1 | 等待 Match 加载 | 最多 5 张 Studio 卡片 |
| 5.2 | 每张卡片 | 显示 match score 或 breakdown（行业/风格/预算等）✅ |
| 5.3 | 点击 **View studio** | 打开 `/studios/[id]` 作品集；可播放视频 |
| 5.4 | 返回 Match tab | — |

🔄 **MVP：** 可能为规则匹配；至少 Nova 在列表中

**Checkpoint 📸:** Top 5 Match 列表含 Nova

---

### Step 6 — Brand · 选定 Studio

**Actor:** Brand  
**Route:** Match tab

| # | 操作 | 预期结果 |
|---|------|----------|
| 6.1 | 点击 Nova Motion Studio **Select** | 确认对话框 |
| 6.2 | 确认选择 | `status → studio_selected` → `proposal` |
| 6.3 | 自动或手动进入 Proposal tab | Proposal Room 打开 |
| 6.4 | 其他 Studio invites | 变为 declined / 不可选 |

**Checkpoint 📸:** 「Selected studio: Nova Motion Studio」

---

### Step 7 — Proposal Room · 结构化议价

**Actors:** Studio（浏览器 B）+ Brand（浏览器 A）  
**Routes:**  
- Brand: `/brand/projects/[id]/proposal`  
- Studio: `/studio/projects/[id]/proposal` 或 `/proposal/[id]` 🔄

#### 7A — Studio 发起

| # | Actor | 操作 | 预期结果 |
|---|-------|------|----------|
| 7.1 | Studio | 登录 Nova 账号 | Studio Portal |
| 7.2 | Studio | 打开 Match / Proposal 邀请 | 进入 Proposal Room |
| 7.3 | Studio | **Live Pitch** 上传 60s 视频 URL | 消息出现在 thread |
| 7.4 | Studio | Tab **Budget** → total `$1,800` → Send | 待 Brand confirm |
| 7.5 | Studio | Tab **Timeline** → delivery `+10 days` → Send | 待 confirm |
| 7.6 | Studio | Tab **Deliverables** → 3×30s 9:16 → Send | 待 confirm |
| 7.7 | Studio | Tab **Revisions** → 2 rounds → Send | 待 confirm |

#### 7B — Brand 确认

| # | Actor | 操作 | 预期结果 |
|---|-------|------|----------|
| 7.8 | Brand | 刷新 Proposal Room | 看到 Studio 结构化消息 |
| 7.9 | Brand | 每条点击 **Confirm** | `confirmed_by_brand = true` |
| 7.10 | Studio | 对 Brand 的 confirm 请求同样 Confirm | 双方 confirmed |
| 7.11 | Brand | 尝试发含微信/电话的消息 | **被过滤** + 提示 |

🔄 **MVP：** 可能仍为 quote + text chat；最低验证：有报价、可聊天、contact filter

**Checkpoint 📸:** Budget + Timeline 双方 Confirmed

---

### Step 8 — Brand · Accept Proposal → Contract

**Actor:** Brand  
**Route:** Proposal Room

| # | 操作 | 预期结果 |
|---|------|----------|
| 8.1 | 在 budget/timeline 未双 confirm 时点 Accept | **阻断** + 清单提示 ✅ |
| 8.2 | 全部 confirm 后点 **Accept Proposal** | 生成 Contract draft |
| 8.3 | 跳转 Contract Review | `status = contract_pending` |
| 8.4 | 预览合同 | 含 Deliverables / $1,800 / 2 revisions / delivery date |

🔄 **MVP：** Accept 可能直接建 Order；验证有明确价格即可，Contract 为 ⏳

**Checkpoint 📸:** Contract 摘要页

---

### Step 9 — 双方 · Contract 双签

**Actors:** Brand + Studio

| # | Actor | 操作 | 预期结果 |
|---|-------|------|----------|
| 9.1 | Brand | **Confirm & Sign** | `brand_confirmed_at` 写入 |
| 9.2 | Studio | 收到通知；打开 Contract | 显示 Brand 已签 |
| 9.3 | Studio | **Confirm & Sign** | `fully_signed` |
| 9.4 | Both | 查看 status | `payment_pending` |
| 9.5 | Brand | 未付款时进 Production tab | **锁定** |

⏳ **MVP 未完成 M4 时：** 跳过，从 Step 10 用现有 pay flow

**Checkpoint 📸:** 双方 Signed 状态

---

### Step 10 — Brand · Escrow 付款

**Actor:** Brand  
**Route:** `/brand/projects/[id]/checkout` 或 Order pay

| # | 操作 | 预期结果 |
|---|------|----------|
| 10.1 | 打开 Checkout | 金额 **= Contract total ($1,800)** ✅ |
| 10.2 | 完成 Demo 支付 | 成功页 |
| 10.3 | Project status | `production` |
| 10.4 | Proposal Room | **Locked**；不可发新消息 |
| 10.5 | Order | `payment_status = escrowed` |

🔄 **MVP：** Demo pay button / `payOrderAction`

**Checkpoint 📸:** Payment success + Project「制作中」

---

### Step 11 — Studio · Production Pipeline

**Actor:** Studio  
**Route:** `/studio/projects/[id]/pipeline`

| # | 操作 | 预期结果 |
|---|------|----------|
| 11.1 | 打开 Production Pipeline | 7 阶段：Brief → … → Delivery |
| 11.2 | Brief / Storyboard | 已 done（来自 Pack） |
| 11.3 | 推进 **Rendering** → in progress → done | 状态更新 |
| 11.4 | 尝试打开 Chat | **不可用** / 无入口 ✅ |
| 11.5 | Quality Center（若有） | 可查看 spec |

🔄 **MVP：** `/studio` 订单表 + upload；验证 assigned order 存在

**Checkpoint 📸:** Pipeline 至少 2 阶段完成

---

### Step 12 — Studio · 提交交付物

**Actor:** Studio  
**Route:** Pipeline · Delivery 或 Upload

| # | 操作 | 预期结果 |
|---|------|----------|
| 12.1 | 填写交付视频 URL | 通过 Quality 检查 🔄 可选 |
| 12.2 | **Submit for review** | 成功 |
| 12.3 | Project status | `in_review` |
| 12.4 | Brand 收到通知或刷新可见 | Review tab 激活 |

**测试 URL 示例:** 任意可播放 mp4（demo 环境）

**Checkpoint 📸:** Deliverable v1 submitted

---

### Step 13 — Brand · Review Center 审片

**Actor:** Brand  
**Route:** `/brand/projects/[id]/review`

| # | 操作 | 预期结果 |
|---|------|----------|
| 13.1 | 打开 Review Center | 视频播放器 + 时间轴 |
| 13.2 | 播放并在 **00:05** 点添加 comment | 时间戳标记显示 |
| 13.3 | 查看 revision 政策 | 显示「2 rounds remaining」✅ |
| 13.4 | 仅 comment **不** 点 Request Revision | 轮次不减 |
| 13.5 | 确认无自由 Chat 入口 | 仅 timeline comments ✅ |

**Checkpoint 📸:** 时间轴 comment @ 00:05

---

### Step 14 — Brand · 批准交付 · Escrow 释放

**Actor:** Brand

| # | 操作 | 预期结果 |
|---|------|----------|
| 14.1 | 点击 **Approve delivery** | 确认对话框 |
| 14.2 | 确认 | Project → `delivered` / `completed` |
| 14.3 | Order | `payment_status = released`；`payout_status = approved` |
| 14.4 | 可选：Leave review | 评分 + 评论保存 |
| 14.5 | Proposal Room | 只读归档 |

**Checkpoint 📸:** Project Completed + 5-star review

---

### Step 15 — Studio · 收入确认 · 可选提现

**Actor:** Studio  
**Route:** `/studio/income`

| # | 操作 | 预期结果 |
|---|------|----------|
| 15.1 | 打开 Income | **可提现余额** ≈ studio payout（如 $1,440 after 20% fee） |
| 15.2 | 托管中 | 其他进行中项目显示在 Held |
| 15.3 | 添加 **Crypto USDT TRC20** 收款方式 | 保存成功 |
| 15.4 | **Withdraw** $100+ | 进入 pending |
| 15.5 | 等待 ~20s 刷新（demo auto-advance） | status → completed |
| 15.6 | 提现记录 | 出现在 history |

**Checkpoint 📸:** Income 页四栏 + 一条 completed withdrawal

---

## 3. 投资人 Demo 精简版（12 分钟）

仅展示差异化，跳过表单细节：

| 分钟 | 步骤 | 话术要点 |
|------|------|----------|
| 0–1 | Landing 双入口 | 「不是 marketplace，是 Production OS」 |
| 1–3 | Wizard Publish 摘要 | 「AI Brief + Pack，一次输入」 |
| 3–4 | Match Top 5 | 「邀请制匹配，不是公开竞标」 |
| 4–5 | Studios 作品集 | 「先看作品再合作」 |
| 5–7 | Proposal 结构化 + Live Pitch | 「谈的内容自动进合同」 |
| 7–8 | Contract 双签 + Escrow | 「Stripe 式信任」 |
| 8–9 | Pipeline | 「Linear 式制作流，无聊天」 |
| 9–11 | Review 时间轴 | 「Frame.io 式审片」 |
| 11–12 | Income + Crypto 提现 | 「Studio 侧闭环」 |

**Prep：** 预先 seed 一个已到 Step 4 Publish 的 project，现场只跑 4–12 步。

---

## 4. 回归检查清单（Pass/Fail）

| # | 断言 | Pass |
|---|------|:----:|
| R1 | Brand 可 Publish project → matching | ☐ |
| R2 | Match 展示 ≥1 Studio | ☐ |
| R3 | Proposal contact filter 生效 | ☐ |
| R4 | Escrow 后 Proposal 锁定 | ☐ |
| R5 | Production 期无 Chat | ☐ |
| R6 | Review 时间戳 comment 可用 | ☐ |
| R7 | Approve 后 payout approved | ☐ |
| R8 | Studio 可发起提现 | ☐ |
| R9 | `/studios` 作品集可播放 | ☐ |
| R10 | 全程无 500 / 未处理异常 | ☐ |

**Release 标准：** R1–R10 全 Pass（⏳ 项在 Phase 0 完成前标注 N/A）

---

## 5. 当前 MVP 快速路径（Phase 0 未完成时）

若 M1–M4 未就绪，用此 **10 分钟降级脚本** 演示现有能力：

| 步 | 操作 | 路由 |
|----|------|------|
| 1 | Brand login | `/login?role=brand` |
| 2 | Browse studios | `/creators` |
| 3 | 打开 Nova 主页 · 播放作品 | `/creators/creator_01` |
| 4 | 发起 Inquiry（#inquiry） | 同页 |
| 5 | Nova login · 打开 Proposal | `/studio` → Proposal Room |
| 6 | Studio 发 quote | Proposal / chat |
| 7 | Brand accept + pay | Order flow |
| 8 | Studio upload | `/creator/orders/[id]` |
| 9 | Brand review | `/brand/projects/[id]/review` |
| 10 | Studio income | `/studio/income` |

---

## 6. 测试数据速查

```text
Brand:  client.arc@adbridge.test
Studio: creator.nova@adbridge.test
Admin:  admin@adbridge.test
Pass:   TempAdBridge2026!

Nova creator_id: creator_01
Sample budget:   $1,800
Sample delivery: +10 days from today
Revision rounds: 2
```

---

## 7. 已知问题记录（测试时填写）

| 步 | 现象 | 严重性 | Issue # |
|----|------|--------|---------|
| | | | |

---

**文档版本:** 1.0 · 对齐 Phase 0 Architect #1–#4  
**维护:** 每完成 M1–M6 milestone 更新 🔄/⏳ 标记
