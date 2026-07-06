# VINCIS Order Lifecycle Spec

This document is the canonical business lifecycle for VINCIS campaign orders, creator invitations, creator project creation, and review delivery.

Do not change this lifecycle in code, UI, copy, tests, seed data, scripts, or migrations unless the project owner explicitly asks to change this specification.

## 中文最高优先级流程

以下是 VINCIS 广告订单生命周期的中文业务真相。任何实现、修复、重构、UI 文案、通知、测试数据、脚本和迁移都必须严格遵守；除非项目 owner 明确要求修改本文件，否则不得自行改变。

### 核心原则

- 广告主付款成功以后，才进入创作者匹配和邀约。
- 创作者接受邀约不等于合作达成。
- 只有广告主最终选定某个创作者以后，创作者工作台才正式生成项目表单，并且可以进入审片中心上传第一版视频。
- 邀约不等于项目。
- 接受邀约不等于达成合作。
- 广告主最终选定才等于正式合作。
- 正式合作后，创作者工作台才出现项目。
- 正式合作后，才能进入审片中心上传 V1。
- 每个关键动作都必须双向消息推送。
- 每个 AI 决策偏差都要进入学习。

### 完整路线

1. 广告主发布广告：广告主填写需求、上传图片、点击下一步。
2. AI 生成创意：弹窗显示“AI 正在帮你生成 3 个最佳创意”。
3. 广告主选择其中一个创意；这个选择必须进入 AI 学习。
4. 拉起付款：广告主选中创意后进入付款。
5. 付款成功以后，广告主不应直接进入项目制作，而是进入匹配阶段。
6. AI 匹配创作者：付款成功后弹窗显示“AI 正在帮你匹配最佳的创作者”。
7. 系统向匹配到的真实注册创作者发送邀约。
8. 收到邀约的创作者必须收到消息通知。
9. 创作者看到的是“邀约”，不是“项目”；此时创作者工作台不能生成项目表单。
10. 创作者接受邀约只表示有合作意向。
11. 创作者拒绝邀约必须填写拒绝理由，拒绝理由进入 AI 行为学习。
12. 创作者接受或拒绝以后，广告主都要收到通知。
13. 广告主可以查看所有接受邀约的创作者，也可以查看对方主页。
14. AI 可以推荐最佳人选，但广告主可以不选 AI 推荐的人。
15. 如果广告主没有选择 AI 推荐的人，也要进入 AI 学习。
16. 广告主最终选定某个创作者以后，才正式达成合作。
17. 被选中的创作者收到通知，通知要有恭喜动画，文案表达为“已经正式达成合作”。
18. 此时创作者工作台才正式生成项目表单。
19. 点击项目表单后，应直接进入审片中心，并可以上传第一版视频。

### 审片交付流程

1. 创作者上传第一版，广告主收到推送。
2. 广告主可以对第一稿要求修改，创作者收到推送。
3. 或者广告主直接通过并释放款项，创作者收到推送，项目结束。
4. 创作者上传第二版，广告主收到推送。
5. 广告主第二稿修稿，创作者收到推送。
6. 创作者上传第三版，广告主收到推送。
7. 广告主第三稿可以通过并释放款项，项目结束。
8. 如果第三稿仍不满意，要进入第四次修改，必须拉起付费。
9. 广告主支付项目成交价 20% 的加付费用。
10. 支付完成后进入第四稿修改意见。
11. 创作者收到推送：广告主已加付该项目成交价 20%。
12. 创作者上传第四版，广告主收到推送。
13. 广告主第四稿修稿，创作者收到推送。
14. 创作者上传第五版，广告主收到推送。
15. 广告主第五稿通过并释放款项，项目结束。
16. 如果第五稿仍不满意，不能继续普通修稿，必须进入客服仲裁。
17. 不管是第一稿、第二稿、第三稿、第四稿还是第五稿，只要广告主满意并点击通过，系统就完成款项释放，项目结束。

## Non-Negotiable Rules

- Payment happens before creator matching and invitations.
- Creator invitations must come from real AI/matching results over registered creator accounts, never fabricated placeholder/demo invitations.
- Launch-stage cold start may prioritize registered/test creators with real accounts and profiles; this is not fake invitation data.
- As creator volume and performance data grow, matching must increasingly rely on real behavioral/performance data, AI learning memory, and relationship history.
- Creator invitation acceptance is only collaboration intent.
- Accepting an invitation must never create a formal creator project/order.
- A formal creator project/order is created only after the brand explicitly selects a creator from accepted invitations.
- The selected creator may upload V1 only after the formal project/order exists and escrow is funded.
- Every key lifecycle action must emit the correct notification and activity/audit record.
- AI learning must record meaningful preference signals from creative selection, creator rejection, and brand final creator selection.

## Canonical Lifecycle

1. Brand creates an ad campaign brief.
2. Brand uploads required product/reference assets or provides equivalent brief inputs.
3. AI generates three creative directions.
4. Brand selects one creative direction. This freezes the production brief and records an AI learning event for the selected/rejected creative options.
5. Publishing opens escrow checkout. Publishing does not start creator matching by itself.
6. Brand completes payment/escrow funding.
7. After payment succeeds, AI matches creators and sends invitations.
8. Invited creators receive invitation notifications.
9. Creator accepts or declines the invitation.
10. Decline requires a reason and records an AI learning event.
11. Acceptance means only "interested in collaborating"; it does not create a project/order and does not open upload.
12. Brand receives accept/decline notifications and reviews accepted creators.
13. AI may recommend a best creator, but the brand makes the final selection.
14. If the brand selects a creator different from the AI recommendation, record an AI learning event.
15. Only after brand final selection is the formal creator project/order generated.
16. The selected creator receives a congratulations/selection notification.
17. Only then does the creator workspace show the project and allow direct entry to the review center for V1 upload.
18. Creator uploads V1 and the brand is notified.
19. Brand either approves or requests revision.
20. If approved at any version V1-V5, escrow is released and the project completes.
21. If revision is requested, creator uploads the next version.
22. V1-V3 are included in the base project amount.
23. If V3 is not approved and the brand requests V4, the brand must pay one add-on equal to 20% of the project amount.
24. One paid add-on unlocks both V4 and V5.
25. The creator is notified after the paid revision add-on is completed.
26. Creator uploads V4 and, if needed, V5.
27. If V5 is still not approved, the project escalates to platform/customer-support arbitration. No silent extra revision rounds are allowed.

## State Boundaries

### Campaign / Brand Side

- Draft and AI generation are campaign preparation states.
- Creative direction approval freezes the production brief.
- Publish means "ready for escrow checkout", not "creator matching started".
- Payment success is the gate that allows matching and invitation creation.
- Matching must use the frozen production brief, real registered creator profiles, creator availability/eligibility, and AI learning memory.
- During launch-stage cold start, registered creators may be included even when certification/deposit/profile data is sparse, but suspended/rejected/deleted/paused creators must remain excluded.
- Later-stage matching should rank by data: portfolio fit, AI tags, creator preferences, acceptance/decline history, delivery/review performance, ratings, and relationship DNA.
- If no eligible creator matches are found, the system must show/record "no matches" and must not create fake invitations.
- Brand final creator selection is the gate that creates the formal creator order/project.

### Invitation Side

- `pending`: invitation sent after escrow funding.
- `accepted`: creator is interested; brand still must choose.
- `declined`: creator refused and must provide feedback for AI learning.
- `selected`: brand chose this accepted creator; formal project/order may now exist.
- `expired`: creator was not selected after another creator won or recruitment closed.

### Creator Project Side

- No creator project row/card/upload entry exists just because an invitation was accepted.
- The creator project appears only after brand selection creates the formal order/project.
- Upload is blocked while payment is unpaid or the formal order/project does not exist.

### Review Side

- Vn maps exactly to revision round n.
- V1 = round 1, V2 = round 2, V3 = round 3, V4 = round 4, V5 = round 5.
- Rounds 1-3 are free/included.
- One 20% paid add-on unlocks rounds 4-5.
- After V5, further dissatisfaction requires platform arbitration.

## Implementation Guardrails

- Do not implement shortcuts that create orders from invitation acceptance.
- Do not call invitation creation from publish flows unless escrow is already funded.
- Do not use demo fallback, seed creators, placeholder creator ids, or fabricated shortlist data for real campaign invitations.
- Demo fallback is allowed only in explicitly isolated demo/seed/test flows and must not write real campaign invitations.
- Test accounts are allowed only when they are real registered creator accounts in the current environment.
- Do not expose creator upload actions before final brand selection and funded escrow.
- Do not move lifecycle transitions into UI components.
- Use service/repository/state-machine layers for lifecycle changes.
- Preserve notifications for all important lifecycle actions:
  - creative generated/selected
  - payment success
  - invitations sent
  - creator accepted/declined
  - creator selected
  - project funded/ready
  - version uploaded
  - revision requested
  - paid revision unlocked
  - delivery approved
  - escrow released
  - platform arbitration required

