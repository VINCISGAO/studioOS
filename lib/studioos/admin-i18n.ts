import type { CampaignStatus } from "@prisma/client";
import type { Locale } from "@/lib/i18n";

const prismaCampaignStatusLabels: Record<Locale, Record<CampaignStatus, string>> = {
  en: {
    DRAFT: "Draft",
    AI_PROCESSING: "AI processing",
    CREATIVE_READY: "Creative ready",
    CREATIVE_APPROVED: "Creative approved",
    MATCHING: "Matching",
    INVITATION_SENT: "Invitation sent",
    CREATOR_ACCEPTED: "Creator selected",
    ESCROW_PENDING: "Escrow pending",
    ESCROW_FUNDED: "Escrow funded",
    PRODUCING: "In production",
    UNDER_REVIEW: "Under review",
    APPROVED: "Approved",
    MASTER_UPLOADED: "Master uploaded",
    SETTLEMENT: "Settlement",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled"
  },
  zh: {
    DRAFT: "草稿",
    AI_PROCESSING: "AI 处理中",
    CREATIVE_READY: "创意就绪",
    CREATIVE_APPROVED: "创意已确认",
    MATCHING: "匹配中",
    INVITATION_SENT: "邀请已发送",
    CREATOR_ACCEPTED: "已选定创作者",
    ESCROW_PENDING: "待托管",
    ESCROW_FUNDED: "托管已入账",
    PRODUCING: "制作中",
    UNDER_REVIEW: "审片中",
    APPROVED: "已通过",
    MASTER_UPLOADED: "母版已上传",
    SETTLEMENT: "结算中",
    COMPLETED: "已完成",
    CANCELLED: "已取消"
  }
};

export function campaignStatusLabel(status: string, locale: Locale): string {
  const upper = status.toUpperCase() as CampaignStatus;
  if (upper in prismaCampaignStatusLabels[locale]) {
    return prismaCampaignStatusLabels[locale][upper];
  }
  return status;
}

export type AdminNavKey =
  | "dashboard"
  | "campaigns"
  | "brands"
  | "studios"
  | "payments"
  | "membership"
  | "settlements"
  | "wallets"
  | "withdrawals"
  | "ledger"
  | "notifications"
  | "languages"
  | "activityLog"
  | "disputes"
  | "analytics"
  | "featureFlags"
  | "audit"
  | "settings"
  | "system"
  | "finance"
  | "monitoring"
  | "certification"
  | "partners"
  | "academy"
  | "support"
  | "showcase"
  | "knowledge";

export const adminNavLabels: Record<AdminNavKey, Record<Locale, string>> = {
  dashboard: { en: "Overview", zh: "总览" },
  campaigns: { en: "Campaigns", zh: "活动" },
  brands: { en: "Advertisers", zh: "品牌方" },
  studios: { en: "Creators", zh: "创作者" },
  payments: { en: "Payments", zh: "支付" },
  membership: { en: "Membership", zh: "会员" },
  settlements: { en: "Settlements", zh: "结算" },
  wallets: { en: "Wallets", zh: "钱包" },
  withdrawals: { en: "Withdrawals", zh: "提现" },
  ledger: { en: "Ledger", zh: "账本" },
  notifications: { en: "Notifications", zh: "通知" },
  languages: { en: "Languages", zh: "语言管理" },
  activityLog: { en: "Activity log", zh: "活动日志" },
  disputes: { en: "Disputes", zh: "争议" },
  analytics: { en: "Analytics", zh: "分析" },
  featureFlags: { en: "Feature flags", zh: "功能开关" },
  audit: { en: "Audit", zh: "审计" },
  settings: { en: "Settings", zh: "系统设置" },
  system: { en: "System", zh: "系统" },
  finance: { en: "Finance", zh: "财务" },
  monitoring: { en: "Monitoring", zh: "监控" },
  certification: { en: "Certification", zh: "认证" },
  partners: { en: "Partners", zh: "合作伙伴" },
  academy: { en: "Academy", zh: "学院" },
  support: { en: "Support", zh: "支持" },
  showcase: { en: "Showcase", zh: "精选作品" },
  knowledge: { en: "Knowledge Center", zh: "知识中心" }
};

export const adminActivityLabels: Record<string, Record<Locale, string>> = {
  "campaign.created": { en: "Campaign created", zh: "活动已创建" },
  "campaign.status_changed": { en: "Campaign status changed", zh: "活动状态变更" },
  "campaign.MATCHING": { en: "Campaign entered matching", zh: "活动进入匹配" },
  "campaign.PRODUCING": { en: "Production started", zh: "开始制作" },
  "campaign.UNDER_REVIEW": { en: "Submitted for review", zh: "提交审片" },
  "campaign.COMPLETED": { en: "Campaign completed", zh: "活动已完成" },
  "brand_campaign.step_completed": { en: "Brief step completed", zh: "简报步骤完成" },
  "escrow.FUNDED": { en: "Escrow funded", zh: "托管已入账" },
  "escrow.paid": { en: "Escrow payment received", zh: "托管付款成功" },
  "payment.success": { en: "Payment successful", zh: "支付成功" },
  "payment.CREATOR_PAYOUT_MARKED_PAID": { en: "Creator payout marked paid", zh: "创作者付款已标记完成" },
  "invitation.sent": { en: "Invitation sent", zh: "邀请已发送" },
  "invitation.accepted": { en: "Studio accepted invitation", zh: "创作者已接受邀请" },
  "creator.accepted": { en: "Creator accepted", zh: "创作者已接受" },
  "version.uploaded": { en: "New version uploaded", zh: "新版本已上传" },
  "upload.version": { en: "Delivery version uploaded", zh: "交付版本已上传" },
  "review.revision_note": { en: "Revision requested", zh: "请求修改" },
  "review.approved": { en: "Creative approved", zh: "创意已通过" },
  "settlement.released": { en: "Settlement released", zh: "结算已释放" },
  "admin.settlement.release": { en: "Settlement released", zh: "结算已释放" },
  "admin.settlement.freeze": { en: "Settlement frozen", zh: "结算已冻结" },
  "admin.settlement.cancel": { en: "Settlement cancelled", zh: "结算已取消" },
  "withdrawal.submitted": { en: "Withdrawal submitted", zh: "提现已提交" },
  "withdrawal.approved": { en: "Withdrawal approved", zh: "提现已批准" },
  "wallet.ESCROW_RELEASE": { en: "Escrow released to wallet", zh: "托管资金释放至钱包" },
  "dispute.opened": { en: "Dispute opened", zh: "争议已开启" },
  "dispute.resolved": { en: "Dispute resolved", zh: "争议已解决" },
  "playback.play": { en: "Review playback", zh: "审片播放" }
};

export function adminActivityLabel(action: string, locale: Locale): string {
  const known = adminActivityLabels[action];
  if (known) return known[locale];

  if (locale === "zh") {
    return "系统操作";
  }

  const readable = action
    .split(/[._]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

  return readable || action;
}
