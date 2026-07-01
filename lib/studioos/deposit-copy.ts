import type { Locale } from "@/lib/i18n";

export const CREATOR_DEPOSIT_USD = 99;

export const certifiedProviderCopy = {
  en: {
    programName: "Certified service provider",
    title: "Become a certified service provider",
    subtitle:
      "Pay the Professional Deposit once to unlock official certification, platform benefits, and the ability to accept orders.",
    paymentLabel: "Professional Deposit",
    paySection: "Payment",
    benefitsSection: "What you get",
    refundSection: "Refund policy",
    refundBody:
      "If you receive no valid orders for 30 consecutive days after certification, you may apply for a full refund of the Professional Deposit.",
    refundNote:
      "Valid orders are paid, non-cancelled projects assigned to your studio. Refund requests are reviewed within 3 business days.",
    benefits: [
      "AI auto-dispatch — matched briefs sent to your studio automatically",
      "Platform traffic support — featured placement in discovery",
      "Priority order access — first look at high-intent brand briefs",
      "Official certification badge — displayed on your public profile",
      "Order management dashboard — full Studio portal for production"
    ],
    certifiedTitle: "You are a certified service provider",
    certifiedBody:
      "Your Professional Deposit is active. AI dispatch, traffic support, and priority access are enabled on your account.",
    certifiedSince: "Certified since",
    setupProfile: "Next: complete your studio profile",
    setupProfileBody: "Fill in your homepage, expertise, and tools. AI will generate matching tags and unlock the full studio.",
    setupProfileCta: "Set up profile",
    cta: "Become certified",
    ctaShort: "Get certified",
    pending: "Certification payment under review",
    pendingBody: "We are confirming your transfer. Demo requests auto-confirm in about 15 seconds.",
    method: "Payment method",
    corporateAccount: "Platform corporate account",
    corporateNote: "Send exactly the deposit amount to this corporate account.",
    reference: "Payment reference (optional)",
    referenceHint: "Transaction ID or on-chain hash — helps us match your transfer faster.",
    submit: "I have paid — submit for review",
    history: "Payment history",
    historyEmpty: "No certification payments yet.",
    requiredTitle: "Your first project is free — certify after delivery",
    requiredBody:
      "New creators can complete one project at no deposit. After your first delivery, pay the $99 Professional Deposit to become a certified provider and accept additional orders. Order tools lock until then — income and withdrawals stay available. The deposit is held in escrow and refundable per platform policy.",
    profileBadge: "Certified provider",
    nav: "Certification",
    eyebrow: "Studio certification",
    heroNote: "One-time · Full refund if no valid orders in 30 days",
    secureTransfer: "Corporate account · Secure transfer"
  },
  zh: {
    programName: "认证服务商",
    title: "成为认证服务商",
    subtitle: "一次性缴纳 Professional Deposit，解锁官方认证、平台权益与接单资格。",
    paymentLabel: "Professional Deposit",
    paySection: "支付",
    benefitsSection: "获得",
    refundSection: "退款机制",
    refundBody: "连续 30 天未获得任何有效订单，可申请全额退款。",
    refundNote:
      "有效订单指已付款、未取消且分配至您 Studio 的项目。退款申请将在 3 个工作日内审核。",
    benefits: [
      "AI 自动派单 — 匹配需求自动推送至您的 Studio",
      "平台流量扶持 — 在发现页获得推荐曝光",
      "优先接单 — 高意向 Brand Brief 优先触达",
      "官方认证标识 — 公开展示于 Studio 主页",
      "订单管理后台 — 完整 Studio 制作与交付门户"
    ],
    certifiedTitle: "您已是认证服务商",
    certifiedBody: "Professional Deposit 已生效，AI 派单、流量扶持与优先接单已为您开启。",
    certifiedSince: "认证时间",
    setupProfile: "下一步：完善 Studio 主页",
    setupProfileBody: "填写公开主页、擅长领域与制作工具。AI 将生成匹配标签，并解锁完整 Studio 功能。",
    setupProfileCta: "开始完善主页",
    cta: "立即认证",
    ctaShort: "去认证",
    pending: "认证付款审核中",
    pendingBody: "平台正在确认到账。演示环境约 15 秒内自动确认。",
    method: "支付方式",
    corporateAccount: "平台对公收款账户",
    corporateNote: "请按认证费用金额足额汇入以下对公账户。",
    reference: "付款凭证（选填）",
    referenceHint: "转账单号或链上哈希，便于平台核对到账。",
    submit: "我已付款 — 提交审核",
    history: "认证付款记录",
    historyEmpty: "暂无认证付款记录。",
    requiredTitle: "首单可免费接，完成后再认证",
    requiredBody:
      "新创作者可免费完成 1 个项目。完成首单后，需缴纳 $99 Professional Deposit 成为认证服务商，方可继续接单。订单、审片、消息等功能将锁定，但收益管理与提现始终可用。保证金进入平台托管账户，可按平台规则退还。",
    profileBadge: "官方认证",
    nav: "认证服务商",
    eyebrow: "Studio 认证中心",
    heroNote: "一次性缴纳 · 30 天无有效订单可全额退款",
    secureTransfer: "平台对公账户 · 安全转账"
  }
} as const;

export function tCertified(locale: Locale) {
  return certifiedProviderCopy[locale];
}

export function depositRequiredMessage(locale: Locale) {
  return certifiedProviderCopy[locale].requiredBody;
}

export function depositRequiredTitle(locale: Locale) {
  return certifiedProviderCopy[locale].requiredTitle;
}
