import type { Locale } from "@/lib/i18n";
import { INDUSTRY_OPTIONS } from "@/lib/studioos/brand-creative-brief-options";

type LabelMap = Record<Locale, string>;

function pickLabel(map: Record<string, LabelMap>, value: string, locale: Locale) {
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  const hit = map[upper]?.[locale] ?? map[trimmed]?.[locale] ?? map[upper.toLowerCase()]?.[locale];
  if (hit) return hit;
  if (locale === "zh" && /[\u4e00-\u9fff]/.test(trimmed)) return trimmed;
  return locale === "zh" ? "—" : trimmed;
}

const escrowStatusLabels: Record<string, LabelMap> = {
  CREATED: { en: "Created", zh: "已创建" },
  PAYING: { en: "Paying", zh: "支付中" },
  PENDING: { en: "Pending", zh: "待入账" },
  HELD: { en: "Held", zh: "托管中" },
  PARTIAL_RELEASE: { en: "Partial release", zh: "部分释放" },
  FULL_RELEASE: { en: "Fully released", zh: "已全部释放" },
  CLOSED: { en: "Closed", zh: "已关闭" },
  REFUNDED: { en: "Refunded", zh: "已退款" },
  REFUND: { en: "Refunded", zh: "已退款" },
  DISPUTE: { en: "Dispute", zh: "争议中" }
};

const settlementStateLabels: Record<string, LabelMap> = {
  PENDING: { en: "Pending", zh: "待结算" },
  READY: { en: "Ready", zh: "可释放" },
  RELEASED: { en: "Released", zh: "已释放" },
  COMPLETED: { en: "Completed", zh: "已完成" },
  DISPUTE: { en: "Dispute", zh: "争议中" },
  FAILED: { en: "Failed", zh: "失败" },
  LOCKED: { en: "Locked", zh: "已锁定" },
  FROZEN: { en: "Frozen", zh: "已冻结" },
  CANCELLED: { en: "Cancelled", zh: "已取消" }
};

const deliveryStatusLabels: Record<string, LabelMap> = {
  PENDING: { en: "Pending", zh: "待交付" },
  DELIVERED: { en: "Delivered", zh: "已交付" },
  READY: { en: "Ready", zh: "就绪" },
  LOCKED: { en: "Locked", zh: "待结算" },
  APPROVED: { en: "Approved", zh: "已通过" }
};

const payoutStatusLabels: Record<string, LabelMap> = {
  PENDING: { en: "Pending", zh: "待付款" },
  PAID: { en: "Paid", zh: "已付款" },
  MANUAL_PAYOUT_PENDING: { en: "Manual payout pending", zh: "待手动付款" },
  FAILED: { en: "Failed", zh: "失败" },
  UNPAID: { en: "Unpaid", zh: "未付款" }
};

const paymentStatusLabels: Record<string, LabelMap> = {
  PENDING: { en: "Pending", zh: "待支付" },
  PAID: { en: "Paid", zh: "已支付" },
  UNPAID: { en: "Unpaid", zh: "未支付" },
  FAILED: { en: "Failed", zh: "失败" },
  REFUNDED: { en: "Refunded", zh: "已退款" },
  CANCELLED: { en: "Cancelled", zh: "已取消" }
};

const accountStatusLabels: Record<string, LabelMap> = {
  ACTIVE: { en: "Active", zh: "正常" },
  PENDING: { en: "Pending", zh: "待激活" },
  SUSPENDED: { en: "Suspended", zh: "已停用" },
  BANNED: { en: "Banned", zh: "已封禁" },
  PENDING_TOTP: { en: "Pending TOTP", zh: "待绑定验证器" },
  LOCKED: { en: "Locked", zh: "已锁定" }
};

const userRoleLabels: Record<string, LabelMap> = {
  BRAND: { en: "Brand", zh: "品牌方" },
  CREATOR: { en: "Creator", zh: "创作者" },
  ADMIN: { en: "Admin", zh: "管理员" },
  SUPPORT: { en: "Support", zh: "客服" },
  SYSTEM: { en: "System", zh: "系统" },
  STUDIO: { en: "Studio", zh: "工作室" }
};

const disputeStatusLabels: Record<string, LabelMap> = {
  OPEN: { en: "Open", zh: "待处理" },
  PROCESSING: { en: "Processing", zh: "处理中" },
  RESOLVED: { en: "Resolved", zh: "已结案" },
  CLOSED: { en: "Closed", zh: "已关闭" }
};

const refundStatusLabels: Record<string, LabelMap> = {
  under_review: { en: "Under review", zh: "审核中" },
  pending: { en: "Pending", zh: "待处理" },
  approved: { en: "Approved", zh: "已批准" },
  rejected: { en: "Rejected", zh: "已拒绝" },
  paid: { en: "Paid", zh: "已退款" },
  failed: { en: "Failed", zh: "失败" }
};

const depositStatusLabels: Record<string, LabelMap> = {
  paid: { en: "Paid", zh: "已缴纳" },
  unpaid: { en: "Unpaid", zh: "未缴纳" },
  pending: { en: "Pending", zh: "待确认" },
  frozen: { en: "Frozen", zh: "已冻结" }
};

const partnerStatusLabels: Record<string, LabelMap> = {
  ACTIVE: { en: "Active", zh: "合作中" },
  PAUSED: { en: "Paused", zh: "已暂停" },
  PENDING: { en: "Pending", zh: "待审核" },
  ARCHIVED: { en: "Archived", zh: "已归档" }
};

const conversationStatusLabels: Record<string, LabelMap> = {
  OPEN: { en: "Open", zh: "进行中" },
  AI_ACTIVE: { en: "AI active", zh: "AI 接待中" },
  HUMAN_REQUIRED: { en: "Human required", zh: "需人工介入" },
  HUMAN_ACTIVE: { en: "Human active", zh: "人工接待中" },
  CLOSED: { en: "Closed", zh: "已关闭" }
};

const ledgerEntryTypeLabels: Record<string, LabelMap> = {
  DEPOSIT: { en: "Deposit", zh: "充值" },
  WITHDRAW: { en: "Withdraw", zh: "提现" },
  ESCROW_LOCK: { en: "Escrow lock", zh: "托管锁定" },
  ESCROW_RELEASE: { en: "Escrow release", zh: "托管释放" },
  SETTLEMENT: { en: "Settlement", zh: "结算" },
  COMMISSION: { en: "Commission", zh: "佣金" },
  REFUND: { en: "Refund", zh: "退款" },
  MANUAL_ADJUSTMENT: { en: "Manual adjustment", zh: "手动调整" }
};

const ledgerDirectionLabels: Record<string, LabelMap> = {
  CREDIT: { en: "Credit", zh: "入账" },
  DEBIT: { en: "Debit", zh: "出账" }
};

const reviewStatusLabels: Record<string, LabelMap> = {
  WAITING: { en: "Waiting", zh: "等待中" },
  READY: { en: "Ready", zh: "待审片" },
  REVIEWING: { en: "Reviewing", zh: "审片中" },
  REVISION_REQUIRED: { en: "Revision required", zh: "需修改" },
  APPROVED: { en: "Approved", zh: "已通过" },
  LOCKED: { en: "Locked", zh: "已锁定" }
};

const versionStatusLabels: Record<string, LabelMap> = {
  UPLOADING: { en: "Uploading", zh: "上传中" },
  PROCESSING: { en: "Processing", zh: "处理中" },
  TRANSCODING: { en: "Transcoding", zh: "转码中" },
  GENERATING_HLS: { en: "Generating HLS", zh: "生成 HLS" },
  AI_ANALYZING: { en: "AI analyzing", zh: "AI 分析中" },
  READY: { en: "Ready", zh: "就绪" },
  REVIEWING: { en: "Reviewing", zh: "审片中" },
  APPROVED: { en: "Approved", zh: "已通过" },
  MASTER: { en: "Master", zh: "母版" },
  FAILED: { en: "Failed", zh: "失败" }
};

const membershipPlanTypeLabels: Record<string, LabelMap> = {
  VERIFIED: { en: "Verified", zh: "认证会员" },
  PREMIUM: { en: "Premium", zh: "高级会员" },
  STANDARD: { en: "Standard", zh: "标准会员" }
};

const withdrawalStatusLabels: Record<string, LabelMap> = {
  PENDING: { en: "Pending", zh: "待审核" },
  APPROVED: { en: "Approved", zh: "已批准" },
  PAID: { en: "Paid", zh: "已付款" },
  REJECTED: { en: "Rejected", zh: "已拒绝" },
  CANCELLED: { en: "Cancelled", zh: "已取消" }
};

const notificationCategoryLabels: Record<string, LabelMap> = {
  CAMPAIGN: { en: "Campaign", zh: "活动" },
  PAYMENT: { en: "Payment", zh: "支付" },
  REVIEW: { en: "Review", zh: "审片" },
  SYSTEM: { en: "System", zh: "系统" },
  INVITATION: { en: "Invitation", zh: "邀约" },
  SETTLEMENT: { en: "Settlement", zh: "结算" }
};

const legacyIndustryCodes: Record<string, LabelMap> = {
  CPG: { en: "Consumer goods", zh: "快消" },
  BEAUTY: { en: "Beauty", zh: "美妆护肤" },
  FOOD: { en: "Food & beverage", zh: "食品饮料" },
  TECH: { en: "Tech", zh: "科技数码" },
  FASHION: { en: "Fashion", zh: "时尚服饰" },
  TRAVEL: { en: "Travel", zh: "旅游酒店" },
  FINANCE: { en: "Finance", zh: "金融服务" }
};

export function adminEscrowStatusLabel(status: string, locale: Locale) {
  return pickLabel(escrowStatusLabels, status, locale);
}

export function adminSettlementStateLabel(state: string, locale: Locale) {
  return pickLabel(settlementStateLabels, state, locale);
}

export function adminDeliveryStatusLabel(status: string, locale: Locale) {
  return pickLabel(deliveryStatusLabels, status, locale);
}

export function adminPayoutStatusLabel(status: string, locale: Locale) {
  return pickLabel(payoutStatusLabels, status, locale);
}

export function adminPaymentStatusLabel(status: string, locale: Locale) {
  return pickLabel(paymentStatusLabels, status, locale);
}

export function adminAccountStatusLabel(status: string, locale: Locale) {
  return pickLabel(accountStatusLabels, status, locale);
}

export function adminUserRoleLabel(role: string, locale: Locale) {
  return pickLabel(userRoleLabels, role, locale);
}

export function adminDisputeStatusLabel(status: string, locale: Locale) {
  return pickLabel(disputeStatusLabels, status, locale);
}

export function adminRefundStatusLabel(status: string, locale: Locale) {
  return pickLabel(refundStatusLabels, status, locale);
}

export function adminDepositStatusLabel(status: string, locale: Locale) {
  return pickLabel(depositStatusLabels, status, locale);
}

export function adminPartnerStatusLabel(status: string, locale: Locale) {
  return pickLabel(partnerStatusLabels, status, locale);
}

export function adminConversationStatusLabel(status: string, locale: Locale) {
  return pickLabel(conversationStatusLabels, status, locale);
}

export function adminLedgerEntryTypeLabel(entryType: string, locale: Locale) {
  return pickLabel(ledgerEntryTypeLabels, entryType, locale);
}

export function adminLedgerDirectionLabel(direction: string, locale: Locale) {
  return pickLabel(ledgerDirectionLabels, direction, locale);
}

export function adminReviewStatusLabel(status: string, locale: Locale) {
  return pickLabel(reviewStatusLabels, status, locale);
}

export function adminVersionStatusLabel(status: string, locale: Locale) {
  return pickLabel(versionStatusLabels, status, locale);
}

export function adminMembershipPlanTypeLabel(planType: string, locale: Locale) {
  return pickLabel(membershipPlanTypeLabels, planType, locale);
}

export function adminWithdrawalStatusLabel(status: string, locale: Locale) {
  return pickLabel(withdrawalStatusLabels, status, locale);
}

export function adminNotificationCategoryLabel(category: string, locale: Locale) {
  return pickLabel(notificationCategoryLabels, category, locale);
}

export function adminToggleLabel(enabled: boolean, locale: Locale) {
  return enabled ? (locale === "zh" ? "开" : "ON") : locale === "zh" ? "关" : "OFF";
}

export function adminNotificationSentLabel(isSent: boolean, locale: Locale) {
  return isSent ? (locale === "zh" ? "已发送" : "Sent") : locale === "zh" ? "未发送" : "Unsent";
}

export function adminNotificationReadLabel(isRead: boolean, locale: Locale) {
  return isRead ? (locale === "zh" ? "已读" : "Read") : locale === "zh" ? "未读" : "Unread";
}

export function adminIndustryLabel(value: string | null | undefined, locale: Locale): string {
  if (!value?.trim()) return "—";
  const trimmed = value.trim();
  const legacy = legacyIndustryCodes[trimmed.toUpperCase()];
  if (legacy) return legacy[locale];

  const zhIdx = INDUSTRY_OPTIONS.zh.indexOf(trimmed);
  if (zhIdx >= 0) return INDUSTRY_OPTIONS[locale][zhIdx];

  const enIdx = INDUSTRY_OPTIONS.en.indexOf(trimmed);
  if (enIdx >= 0) return INDUSTRY_OPTIONS[locale][enIdx];

  if (locale === "zh" && /[\u4e00-\u9fff]/.test(trimmed)) return trimmed;
  if (locale === "zh") return "其他";
  return trimmed;
}
