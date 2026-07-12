import type { Locale } from "@/lib/i18n";

/** Documented admin KPI definitions — single source for overview + analytics copy. */
export const adminMetricCopy = {
  en: {
    gmv: {
      label: "GMV",
      hint: "Escrow inflow plus settled platform revenue; falls back to campaign budgets when escrow is empty."
    },
    platformRevenue: {
      label: "Platform revenue",
      hint: "Total platform revenue from settled order commissions."
    },
    platformFees: {
      label: "Platform fees",
      hint: "Client service fees collected on paid orders."
    },
    escrowHeld: {
      label: "Escrow held",
      hint: "Remaining escrow balance still locked for active campaigns."
    },
    settlementPending: {
      label: "Settlement queue",
      hint: "Campaigns with approved delivery and escrow still held — ready for release review."
    },
    pendingWithdrawals: {
      label: "Pending withdrawals",
      hint: "Withdrawal requests without a success or failure follow-up transaction."
    },
    disputesOpen: {
      label: "Open disputes",
      hint: "Disputes in open or processing state."
    },
    activeCampaigns: {
      label: "Active campaigns",
      hint: "Campaigns not completed or cancelled."
    }
  },
  zh: {
    gmv: {
      label: "成交总额",
      hint: "托管入账加已结算平台收入；无托管记录时回退到活动预算汇总。"
    },
    platformRevenue: {
      label: "平台收入",
      hint: "已结算订单佣金中的平台总收入。"
    },
    platformFees: {
      label: "平台手续费",
      hint: "已支付订单收取的客户服务费。"
    },
    escrowHeld: {
      label: "托管冻结",
      hint: "仍锁定在活跃活动中的托管余额。"
    },
    settlementPending: {
      label: "待结算队列",
      hint: "交付已锁定且托管仍持有的活动，等待释放审核。"
    },
    pendingWithdrawals: {
      label: "待处理提现",
      hint: "尚未出现成功或失败后续交易的提现申请。"
    },
    disputesOpen: {
      label: "未结争议",
      hint: "处于开启或处理中状态的争议。"
    },
    activeCampaigns: {
      label: "活跃活动",
      hint: "未完成且未取消的活动。"
    }
  }
} as const;

export type AdminBindingStats = {
  brandCount: number;
  creatorCount: number;
  campaignCount: number;
  linkedCampaigns: number;
  escrowFundedCampaigns: number;
  openDisputes: number;
};

export const adminBindingCopy = {
  en: {
    title: "Platform bindings",
    subtitle: "How brands, campaigns, creators, and escrow connect on VINCIS.",
    brands: "Brands",
    creators: "Creators",
    campaigns: "Campaigns",
    linked: "Brand + creator linked",
    escrowFunded: "Escrow funded",
    openDisputes: "Open disputes"
  },
  zh: {
    title: "平台绑定关系",
    subtitle: "品牌方、活动、创作者与托管在 VINCIS 中的关联概览。",
    brands: "品牌方",
    creators: "创作者",
    campaigns: "活动",
    linked: "已绑定品牌与创作者",
    escrowFunded: "已托管入账",
    openDisputes: "未结争议"
  }
} as const;

export function adminMetrics(locale: Locale) {
  return adminMetricCopy[locale];
}

export function adminBindings(locale: Locale) {
  return adminBindingCopy[locale];
}
