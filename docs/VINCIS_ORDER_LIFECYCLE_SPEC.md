# VINCIS Order Lifecycle Spec

This document is the canonical business lifecycle for VINCIS campaign orders, creator invitations, creator project creation, and review delivery.

Do not change this lifecycle in code, UI, copy, tests, seed data, scripts, or migrations unless the project owner explicitly asks to change this specification.

## 中文最高优先级流程

以下是 VINCIS 广告订单生命周期的中文业务真相。任何实现、修复、重构、UI 文案、通知、测试数据、脚本和迁移都必须严格遵守；除非项目 owner 明确要求修改本文件，否则不得自行改变。

### 核心原则

- 不要太早生成项目。
- 不要在付款前消耗 AI token。
- 广告主付款成功以后，才进入创作者匹配和邀约。
- 创作者接受邀约不等于合作达成。
- 只有广告主最终在已经接受邀约的创作者中确认某个 Creator 并点击合作后，才生成 Active Project / 正式项目表单。
- AI 创意生成必须由用户手动点击触发，不能自动生成。
- 三个 AI 创意卡必须在项目内由 Brand 或 Creator 主动点击生成，创意内容必须来源于该项目表单表达的真实需求。
- 正式合作后，Creator 可以进入审片中心上传第一版视频。
- 邀约不等于项目。
- 接受邀约不等于达成合作。
- 广告主最终选定才等于正式合作。
- 正式合作后，创作者工作台才出现项目。
- 正式合作后，才能进入审片中心上传 V1。
- 每个关键动作都必须双向消息推送。
- 每个 AI 决策偏差都要进入学习。

### 完整路线

1. 广告主发布需求：填写需求、上传素材、预算、时间、参考风格。
2. 广告主点击“提交需求”；系统只保存需求，不生成 AI 创意，不创建正式项目。
3. 广告主确认需求后进入付款。
4. 付款成功后进入 AI 创作者匹配阶段；UI 显示 3 秒弹窗动画：“AI 正在为你匹配最适合的 Creator。”
5. 系统根据品类、风格、预算、交付时间、创作者能力、历史合作、广告主偏好、收藏/浏览行为等维度匹配真实注册 Creator。
6. 系统向匹配到的 Creator 发送“合作邀约”。
7. 此时不是项目；Creator 工作台不能生成项目表单或上传入口。
8. Creator 看到的是“合作邀约”，按钮为“接受邀约 / 拒绝邀约”。
9. Creator 接受邀约只表示有合作意向，不等于正式接单。
10. Creator 拒绝邀约必须填写理由：时间不合适、预算不合适、风格不匹配、品类不擅长、档期已满、其他原因；拒绝理由进入 AI 行为学习。
11. Creator 接受或拒绝后，广告主都必须收到通知。
12. 广告主进入“接受邀约的 Creator 列表”，可以查看 Creator 主页、作品集、AI 推荐理由、价格、交付能力、风格匹配度。
13. AI 可以推荐最佳人选，但广告主可以不选 AI 推荐的人。
14. 如果广告主没有选择 AI 推荐人，记录 `Brand ignored AI recommendation` 并进入 AI 学习。
15. 创作者寻找完毕后，广告主可以点击“换一批 Creator”，最多 3 批；每次换一批都记录 AI 学习事件。
16. 如果 3 批都没有满意人选，停止继续推荐，并显示退款选项：“没有找到合适的 Creator，你可以选择退款。”
17. 广告主最终选择某位已接受邀约的 Creator 后，点击“确认合作”。
18. 此时才正式生成 Active Project / 项目表单。
19. 被选中的 Creator 收到通知，通知要有恭喜动画，文案表达：“恭喜，品牌已正式选择你合作。已正式达成合作。”
20. 从这一刻开始：Creator 工作台生成项目表单，审片中心开启，交付流程开启，项目状态变成 Active Project。
21. Creator 点击项目表单后，直接进入审片中心，并可以上传第一版视频。

### AI 创意协作机制

AI 创意不是系统自动生成的前置步骤，而是付款后、正式合作后的 Brand-Creator 创意协作草稿流。详见 `docs/AI_CREATIVE_COLLABORATION_FLOW.md`。

原则：

- 不允许系统自动生成 AI 创意。
- AI 创意必须由广告主或 Creator 主动点击触发。
- AI 创意只是参考方向，不是最终稿。
- 真正的定稿创意，必须经过广告主与 Creator 之间的确认。
- 只有点击“AI 帮我想想”才消耗 token。
- 系统自动流程不得消耗 token。
- 每次生成必须绑定 `project_id`、`campaign_id`、`user_id`、`role`、`trigger_source`、`parent_idea_id`（二创衍生时）。

必须记录的 AI 学习事件：

- `brand_ai_idea_clicked`
- `brand_ai_idea_generated`
- `brand_ai_idea_selected`
- `brand_ai_idea_deepened`
- `brand_ai_idea_sent_to_creator`
- `brand_ai_idea_skipped`
- `creator_ai_idea_clicked`
- `creator_ai_idea_generated`
- `creator_ai_idea_selected`
- `creator_idea_sent_to_brand`
- `brand_confirmed_creator_idea`
- `brand_rejected_creator_idea`
- `brand_deepened_creator_idea`
- `final_creative_direction_confirmed`

### 审片中心前置条件

Creator 可以进入审片中心上传第一版视频，但系统应提示：

```text
请先确认创意方向，再开始制作。
```

如果没有确认创意方向，仍允许继续，但需要明确标记：

```text
未确认创意方向，存在返工风险。
```

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
- AI creative generation is manual and post-payment / active-project scoped, never automatic pre-payment generation.
- Creator invitations must come from real AI/matching results over registered creator accounts, never fabricated placeholder/demo invitations.
- Launch-stage cold start may prioritize registered/test creators with real accounts and profiles; this is not fake invitation data.
- As creator volume and performance data grow, matching must increasingly rely on real behavioral/performance data, AI learning memory, and relationship history.
- Creator invitation acceptance is only collaboration intent.
- Accepting an invitation must never create a formal creator project/order.
- A formal creator project/order is created only after the brand explicitly selects a creator from accepted invitations.
- The selected creator may upload V1 only after the formal project/order exists and escrow is funded.
- Every key lifecycle action must emit the correct notification and activity/audit record.
- AI learning must record meaningful preference signals from matching, rerolls, creator acceptance/rejection, profile views, refund requests, creative collaboration drafts, creative confirmation, and brand final creator selection.

## Canonical Lifecycle

1. Brand creates an ad campaign brief.
2. Brand uploads required product/reference assets or provides equivalent brief inputs.
3. Brand submits requirements; the system saves the brief only.
4. Publishing opens escrow checkout. Publishing does not start creator matching by itself.
5. Brand completes payment/escrow funding.
6. After payment succeeds, AI matches creators and sends invitations.
7. Invited creators receive invitation notifications.
8. Creator accepts or declines the invitation.
9. Decline requires a reason and records an AI learning event.
10. Acceptance means only "interested in collaborating"; it does not create a project/order and does not open upload.
11. Brand receives accept/decline notifications and reviews accepted creators.
12. AI may recommend a best creator, but the brand makes the final selection.
13. If the brand selects a creator different from the AI recommendation, record an AI learning event.
14. Brand may reroll creator batches up to 3 times after matching results are available.
15. If no suitable creator is found after 3 batches, show a refund option and record a learning event.
16. Only after brand final selection is the formal creator project/order generated.
17. The selected creator receives a congratulations/selection notification.
18. Only then does the creator workspace show the project and allow direct entry to the review center for V1 upload.
19. Brand and Creator may use manual AI creative collaboration inside the active project; generated ideas are drafts until confirmed.
20. Creator uploads V1 and the brand is notified.
21. Brand either approves or requests revision.
22. If approved at any version V1-V5, escrow is released and the project completes.
23. If revision is requested, creator uploads the next version.
24. V1-V3 are included in the base project amount.
25. If V3 is not approved and the brand requests V4, the brand must pay one add-on equal to 20% of the project amount.
26. One paid add-on unlocks both V4 and V5.
27. The creator is notified after the paid revision add-on is completed.
28. Creator uploads V4 and, if needed, V5.
29. If V5 is still not approved, the project escalates to platform/customer-support arbitration. No silent extra revision rounds are allowed.

## State Boundaries

### Campaign / Brand Side

- Draft is requirement preparation.
- AI creative generation is not a required campaign preparation state. It is manual and post-payment / active-project scoped.
- Confirmed creative direction freezes collaboration intent only after Brand-Creator confirmation.
- Publish means "ready for escrow checkout", not "creator matching started".
- Payment success is the gate that allows matching and invitation creation.
- Matching must use the submitted requirement brief or confirmed/frozen creative direction when available, real registered creator profiles, creator availability/eligibility, and AI learning memory.
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

