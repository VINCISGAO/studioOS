import type { Locale } from "@/lib/i18n";

export type NotificationCopyVars = {
  project?: string;
  brand?: string;
  creator?: string;
  reason?: string;
  note?: string;
  amount?: string;
  currency?: string;
  matchCount?: number | string;
  version?: number | string;
  status?: string;
  payoutAmount?: string;
  addOnAmount?: string;
  window?: string;
  expiresAt?: string;
  threshold?: number | string;
  directionCount?: number | string;
  comments?: string;
  rejectReason?: string;
};

type CopyBuilder = (locale: Locale, vars: NotificationCopyVars) => { title: string; content: string };

function v(vars: NotificationCopyVars, key: keyof NotificationCopyVars, fallback = "") {
  const value = vars[key];
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value);
}

function zhEn(
  zh: { title: string; content: string },
  en: { title: string; content: string }
): CopyBuilder {
  return (locale, vars) => {
    const base = locale === "zh" ? zh : en;
    return {
      title: formatCopy(base.title, vars),
      content: formatCopy(base.content, vars)
    };
  };
}

function formatCopy(template: string, vars: NotificationCopyVars) {
  return template.replace(/\{(\w+)\}/g, (_, key: keyof NotificationCopyVars) => v(vars, key));
}

const NOTIFICATION_COPY: Record<string, CopyBuilder> = {
  "payment.escrow_funded": zhEn(
    {
      title: "托管款项已到账，可以开始制作",
      content: "「{project}」的款项已托管。你可以开始制作并上传审片版本。"
    },
    {
      title: "Escrow funded — start production",
      content: 'Payment for "{project}" is secured. You can begin production and upload review versions.'
    }
  ),
  "review.revision_requested": zhEn(
    { title: "品牌方申请修改", content: "{note}" },
    { title: "Revision requested", content: "{note}" }
  ),
  "review.approved": zhEn(
    { title: "审片已通过", content: "「{project}」已通过品牌方审核。" },
    { title: "Review approved", content: '"{project}" was approved by the brand.' }
  ),
  "review.approved_escrow": zhEn(
    { title: "审片已通过，托管款项释放中", content: "「{project}」已通过品牌方审核，托管结算已开始。" },
    { title: "Campaign approved — escrow releasing", content: '"{project}" was approved by the brand. Escrow settlement is starting.' }
  ),
  "ai.creative_generated": zhEn(
    {
      title: "AI 创意方向已生成",
      content: "VINCIS 已为「{project}」生成创意方向。请查看并确认后继续。"
    },
    {
      title: "AI creative directions are ready",
      content: 'VINCIS finished creative direction generation for "{project}". Review and approve the direction to continue.'
    }
  ),
  "ai.creative_directions_ready": zhEn(
    { title: "创意方向已就绪", content: "VINCIS 已为「{project}」生成 {directionCount} 个创意方向。" },
    { title: "Creative directions are ready", content: 'VINCIS generated {directionCount} creative directions for "{project}".' }
  ),
  "ai.analysis_started": zhEn(
    { title: "AI 正在分析你的项目", content: "VINCIS 正在分析「{project}」，并准备创意方向。" },
    { title: "AI is analyzing your campaign", content: 'VINCIS is analyzing "{project}" and preparing creative directions.' }
  ),
  "ai.matching_started": zhEn(
    {
      title: "AI 匹配已开始",
      content: "VINCIS 正在为「{project}」匹配创作者。推荐结果准备好后你会收到通知。"
    },
    {
      title: "AI matching started",
      content: 'VINCIS is matching creators for "{project}". You will be notified when recommendations are ready.'
    }
  ),
  "ai.matching_complete": zhEn(
    {
      title: "AI 已找到匹配创作者",
      content: "VINCIS 已基于 Final Production Brief 为「{project}」找到 {matchCount} 位匹配创作者。"
    },
    {
      title: "AI found creator matches",
      content: "VINCIS found {matchCount} creator matches using the Final Production Brief."
    }
  ),
  "collaboration.started": zhEn(
    { title: "合作已正式启动", content: "「{project}」已进入制作阶段。准备好第一版后请上传 V1。" },
    { title: "Collaboration is live", content: '"{project}" is now in production. Upload V1 when the first draft is ready.' }
  ),
  "collaboration.selected": zhEn(
    {
      title: "🎉 恭喜，你已被品牌选中",
      content: "「{project}」— 品牌已确认与你合作，项目表单已生成。现在可以进入审片中心上传 V1 初稿。"
    },
    {
      title: "{brand} selected you for this project",
      content: '"{project}" — the brand confirmed you as their creator. Your project is ready; open the review center and upload V1.'
    }
  ),
  "review.version_uploaded": zhEn(
    { title: "创作者上传了新版本", content: "「{project}」有新的审片版本待你查看。" },
    { title: "New review version uploaded", content: 'A new version is ready for review on "{project}".' }
  ),
  "delivery.version_uploaded": zhEn(
    { title: "创作者上传了新版本", content: "「{project}」有新的审片版本待你查看。" },
    { title: "New review version uploaded", content: 'A new version is ready for review on "{project}".' }
  ),
  "settlement.payment_released": zhEn(
    { title: "款项释放已开始", content: "「{project}」的结算已开始，收入页很快会更新。" },
    { title: "Payment release started", content: 'Settlement has started for "{project}". Your payout will be updated in income soon.' }
  ),
  "settlement.release_started": zhEn(
    { title: "款项释放已开始", content: "「{project}」的结算已开始，收入页很快会更新。" },
    { title: "Payment release started", content: 'Settlement has started for "{project}". Your payout will be updated in income soon.' }
  ),
  "invitation.received": zhEn(
    {
      title: "你收到一个新的合作邀请",
      content: "「{project}」— {brand} 邀请你参与合作。接受表示你有合作意向，最终是否合作由品牌方决定。"
    },
    {
      title: "New collaboration invitation",
      content: 'You received a creator invitation for "{project}". Review the brief and respond.'
    }
  ),
  "invitation.accepted": zhEn(
    {
      title: "创作者已接受邀请",
      content: "{creator} 已接受「{project}」的邀请。请从已接受列表中最终选定创作者。"
    },
    {
      title: "Creator accepted your invitation",
      content: '{creator} accepted the invitation for "{project}". Review accepted creators and make the final selection.'
    }
  ),
  "invitation.declined": zhEn(
    {
      title: "创作者拒绝了邀请",
      content: "{creator} 拒绝了「{project}」的邀请。原因：{rejectReason}"
    },
    {
      title: "Creator declined your invitation",
      content: '{creator} declined the invitation for "{project}". Reason: {rejectReason}'
    }
  ),
  "payment.cancelled": zhEn(
    { title: "付款已取消", content: "「{project}」的付款流程已取消。准备好后可重新发起付款。" },
    { title: "Payment cancelled", content: 'Checkout for "{project}" was cancelled. You can retry payment when ready.' }
  ),
  "payment.failed": zhEn(
    { title: "付款失败", content: "「{project}」的付款未完成。请重试或联系平台支持。" },
    { title: "Payment failed", content: 'Payment for "{project}" did not complete. Please try again or contact support.' }
  ),
  "payment.brand_success": zhEn(
    { title: "付款成功", content: "「{project}」已确认收到 {amount}。AI 创作者匹配可以开始。" },
    { title: "Payment received", content: 'Your payment of {amount} for "{project}" is confirmed. AI creator matching can begin.' }
  ),
  "payment.creator_funded": zhEn(
    {
      title: "托管款项已到账",
      content: "「{project}」已完成托管（{amount}）。品牌最终选定你后即可上传；预计到手：{payoutAmount}。"
    },
    {
      title: "Escrow funded",
      content: '"{project}" is escrow-funded ({amount}). The project becomes upload-ready after formal creator selection. Payable after commission: {payoutAmount}.'
    }
  ),
  "payment.creator_payout_paid": zhEn(
    { title: "提现已到账", content: "「{project}」的 {amount} 提现已处理完成。" },
    { title: "Payout marked as paid", content: 'Your payout of {amount} for "{project}" has been processed.' }
  ),
  "revision.additional_purchased": zhEn(
    { title: "第 4-5 轮修订已解锁", content: "「{project}」已解锁第 4-5 轮修订，加购金额 {addOnAmount}。" },
    { title: "Paid revision rounds unlocked", content: '"{project}" now has revision rounds 4-5 unlocked. Add-on: {addOnAmount}.' }
  ),
  "revision.paid_addon_unlocked.brand": zhEn(
    { title: "第 4-5 轮修订已解锁", content: "「{project}」已解锁第 4-5 轮修订，加购金额 {addOnAmount}。" },
    { title: "Paid revision rounds unlocked", content: '"{project}" now has revision rounds 4-5 unlocked. Add-on: {addOnAmount}.' }
  ),
  "revision.paid_addon_unlocked.creator": zhEn(
    { title: "品牌已解锁第 4-5 轮修订", content: "「{project}」现在可进入 V4-V5 修订流程。" },
    { title: "Brand unlocked paid revision rounds", content: '"{project}" can now continue through V4-V5 revisions.' }
  ),
  "arbitration.started": zhEn(
    { title: "平台仲裁已开始", content: "「{project}」已开启平台仲裁流程。" },
    { title: "Arbitration started", content: 'A platform arbitration case has started for "{project}".' }
  ),
  "arbitration.resolved": zhEn(
    { title: "仲裁状态已更新", content: "「{project}」的平台仲裁状态现为 {status}。" },
    { title: "Arbitration updated", content: 'Platform arbitration for "{project}" is now {status}.' }
  ),
  "membership.activated": zhEn(
    { title: "Verified Creator 已激活", content: "你的 Verified Creator 会员有效期至 {expiresAt}。" },
    { title: "Verified Creator activated", content: "Your Verified Creator membership is active until {expiresAt}." }
  ),
  "membership.expired": zhEn(
    {
      title: "Verified Creator 已过期",
      content: "你的 Verified Creator 会员已过期，当前为 Default Creator 计划。"
    },
    {
      title: "Verified Creator expired",
      content: "Your Verified Creator membership has expired. You are now on the Default Creator plan."
    }
  ),
  "membership.expiring_soon": zhEn(
    {
      title: "Verified Creator 续费提醒",
      content: "你的 Verified Creator 会员将在 {window} 后到期（{expiresAt}）。续费可继续享受更低佣金与认证权益。"
    },
    {
      title: "Verified Creator renewal reminder",
      content: "Your Verified Creator membership expires in {window} ({expiresAt}). Renew to keep lower commission and verified benefits."
    }
  ),
  "membership.upgrade_eligible": zhEn(
    { title: "可升级 Verified Creator", content: "你的已结算收入已达到 ${threshold}。升级后可享受更低佣金与优先权益。" },
    {
      title: "Upgrade to Verified Creator",
      content: "You've reached ${threshold} in settled revenue. Upgrade to Verified Creator for a lower commission rate and priority benefits."
    }
  )
};

function metadataToVars(metadata: unknown): NotificationCopyVars {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  const record = metadata as Record<string, unknown>;
  const vars: NotificationCopyVars = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string") {
      vars[key as keyof NotificationCopyVars] = value;
    } else if (typeof value === "number") {
      vars[key as keyof NotificationCopyVars] = String(value);
    }
  }
  return vars;
}

function buildRevisionNote(locale: Locale, project: string, note?: string) {
  if (note?.trim()) {
    return locale === "zh"
      ? `品牌方对「${project}」提出修改要求：${note.trim()}`
      : `The brand requested changes on "${project}": ${note.trim()}`;
  }
  return locale === "zh"
    ? `品牌方对「${project}」提出修改要求。准备好后请上传新的审片版本。`
    : `The brand requested changes on "${project}". Upload a new review version when ready.`;
}

export function resolveNotificationCopy(input: {
  locale: Locale;
  template?: string;
  type?: string;
  title: string;
  content: string;
  metadata?: unknown;
}): { title: string; content: string } {
  const key =
    input.type === "revision.paid_addon_unlocked.brand" || input.type === "revision.paid_addon_unlocked.creator"
      ? input.type
      : input.template ?? input.type;
  const builder = key ? NOTIFICATION_COPY[key] : undefined;
  if (!builder) {
    return { title: input.title, content: input.content };
  }

  const vars = metadataToVars(input.metadata);
  if (input.title.includes("escrow releasing")) {
    return NOTIFICATION_COPY["review.approved_escrow"]?.(input.locale, vars) ?? builder(input.locale, vars);
  }

  if (key === "review.revision_requested") {
    vars.note = buildRevisionNote(input.locale, v(vars, "project", "Project"), vars.note ?? vars.comments);
  }

  return builder(input.locale, vars);
}

export function mergeNotificationCopyVars(
  metadata: unknown,
  extras: NotificationCopyVars
): NotificationCopyVars {
  return { ...metadataToVars(metadata), ...extras };
}
