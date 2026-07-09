# 夜间全流程走查报告 · 2026-07-09

**生产站点：** https://vincis.app  
**代码基准：** `main` @ `17a98b7`（已推送）  
**黄金基准文档：** [`HOMEPAGE_GOLDEN.md`](./HOMEPAGE_GOLDEN.md) · [`HOMEPAGE_HERO_VIDEO_BASELINE.json`](./HOMEPAGE_HERO_VIDEO_BASELINE.json)

---

## 一、首页黄金基准（已锁定）

| 项目 | 状态 |
|------|------|
| 11 语言主视频参数 | 已写入 `HOMEPAGE_HERO_VIDEO_BASELINE.json`，`cv=7` |
| Hero 文案（无句号） | 已上线验证 |
| 冻结策略 | `AGENT.md` · `components/marketing/README.md` · `.cursor/rules/agent.mdc` 已更新 |
| **待你执行** | 见下方「还需你跑的两条命令」 |

### 还需你跑的两条命令（锁定 tag + 推送文档）

```bash
cd /Users/linkele/Projects/studioOS

git add docs/HOMEPAGE_GOLDEN.md docs/HOMEPAGE_HERO_VIDEO_BASELINE.json \
  components/marketing/README.md AGENT.md .cursor/rules/agent.mdc \
  scripts/anchor-homepage-golden.mjs docs/OVERNIGHT_FLOW_WALKTHROUGH_2026-07-09.md

git commit -m "$(cat <<'EOF'
chore(homepage): lock golden baseline 17a98b7 with 11-lang hero video spec.

EOF
)"

npm run homepage:anchor
```

---

## 二、生产环境自动走查结果

### ✅ 已通过

| 步骤 | URL | 结果 |
|------|-----|------|
| 首页 zh-CN | `/?lang=zh-CN` | Hero 文案正确：`让好的创意不再因成本、时间或资源被埋没` / `世界级广告不再是大公司的专属`（**无句号**） |
| 首页结构 | 同上 | 导航、CTA、案例、流程、Footer 均可访问 |
| 登录页 | `/login?lang=zh&role=brand` | 三步登录 UI、Google/支付宝入口、邮箱验证码流程已部署 |
| 登录页文案 | 同上 | 广告主副标题：`从想法到交付，一站完成高质量广告制作`（无句号） |
| 主视频（浏览器） | 首页内嵌播放器 | 进度条可走动（约 10%+），说明 Range 流式播放**可用** |

### ⚠️ 需明天关注

| 项目 | 现象 | 建议 |
|------|------|------|
| 视频直链 HEAD/GET | `/videos/home/hero/...mp4?cv=7` 偶发 **500** | 运行 `npm run marketing:verify-hero-videos`；确认 Vercel `MARKETING_CDN_UPSTREAM` |
| 完整闭环 E2E | 需真实邮箱 + 付款 | 见第三节「需你亲自完成」 |

---

## 三、用户旅程地图（按订单生命周期）

以下流程遵守 `docs/VINCIS_ORDER_LIFECYCLE_SPEC.md`。

### A. 广告主（Brand）闭环

| # | 用户动作 | 入口 | 预期结果 | 自动化验证 |
|---|----------|------|----------|------------|
| 1 | 打开首页 | `/?lang=zh-CN` | 看到 Hero + 视频 | ✅ |
| 2 | 点击「我是项目方」/ 登录 | `/login?role=brand` | 进入三步邮箱登录 | ✅ UI |
| 3 | 注册/登录 | 邮箱验证码 或 Google/支付宝 | 跳转 `/brand` | ⏸ 需真实账号 |
| 4 | 发起项目 | `/brand/projects/new?step=1` | 需求简报 Step 1 | ⏸ 需登录 |
| 5 | 提交需求 | 向导完成 | 仅保存需求，**不**自动生成 AI 创意 | ⏸ |
| 6 | 托管付款 | Checkout | 付款成功后才匹配创作者 | ⏸ 需支付 |
| 7 | AI 匹配 + 邀约 | 品牌工作台 | 向真实 Creator 发邀约 | ⏸ |
| 8 | 选定创作者 | 已接受列表 → 确认合作 | 生成正式项目 + 恭喜通知 | ⏸ |
| 9 | 审片 | `/brand/.../review` | 批注 / 通过 / 要求修改 | ⏸ |
| 10 | 结算 | 通过后释放款项 | 项目结束 | ⏸ |

### B. 创作者（Creator）闭环

| # | 用户动作 | 入口 | 预期结果 | 自动化验证 |
|---|----------|------|----------|------------|
| 1 | 首页「我是创作者」 | `/login?role=creator` | 创作者登录页 | ✅ UI |
| 2 | 登录 | 邮箱 / OAuth | 跳转 `/studio` | ⏸ 需真实账号 |
| 3 | 收到邀约 | `/studio/invitations` | **不是**正式项目卡 | ⏸ |
| 4 | 接受/拒绝邀约 | 必填拒绝理由 | 广告主收到通知 | ⏸ |
| 5 | 被品牌选定后 | 工作台出现项目卡 | 恭喜动画 + 审片入口 | ⏸ |
| 6 | 上传 V1 | 审片中心 | 品牌收到推送 | ⏸ |
| 7 | 修订 V2–V5 | 按轮次政策 | 前 3 轮免费，加购解锁 4–5 | ⏸ |

### C. 关键禁令（已代码层落实）

- `@studioos.test` 测试邮箱：**禁止**登录  
- Apple / 微信 / QQ：**灰色不可点**  
- 接受邀约 **≠** 正式项目 / V1 上传入口  

---

## 四、明天早上建议你 15 分钟自测清单

### 首页（1 分钟）

- [ ] `https://vincis.app/?lang=zh-CN` — 副标题两行无句号  
- [ ] 切换语言 `ja` / `en` — 视频切换为对应 `VINCIS Brand Film (XX).mp4`  
- [ ] 点 Logo 回首页 — **不下载文件**

### 登录（3 分钟）

- [ ] 真实邮箱收验证码 → 登录广告主 `/brand`  
- [ ] Google / 支付宝可跳转授权页  

### 广告主下单（5 分钟）

- [ ] `/brand/projects/new?step=1` 能填简报  
- [ ] 走到付款页（可用测试支付环境）  

### 创作者（5 分钟）

- [ ] 另一邮箱登录创作者 `/studio`  
- [ ] 未选定前**无**正式项目上传入口  

### 运维（1 分钟）

```bash
npm run marketing:verify-hero-videos
npm run production:verify
```

---

## 五、11 语言主视频速查

完整 JSON：`docs/HOMEPAGE_HERO_VIDEO_BASELINE.json`

示例（简体中文）：

```
https://vincis.app/?lang=zh-CN
→ 视频: https://vincis.app/videos/home/hero/VINCIS%20Brand%20Film%20(ZH-CN).mp4?cv=7
```

**没有你的明确命令，任何人不得修改：**

- `lib/marketing/home-hero-video-sources.ts`（文件名 / cv 版本）  
- `lib/marketing/landing-copy.ts`（Hero 文案）  
- `components/marketing/**`（布局与动画）  

---

*报告生成：2026-07-09 · 自动化覆盖首页/登录 UI；完整交易闭环需真实账号与付款环境。*
