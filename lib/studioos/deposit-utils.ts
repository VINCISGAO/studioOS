import type { Locale } from "@/lib/i18n";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";
import type { PlatformCorporateAccount } from "@/lib/studioos/deposit-types";

export const DEPOSIT_PAYMENT_METHODS: PayoutMethodType[] = [
  "alipay",
  "wechat",
  "paypal",
  "crypto"
];

const PLATFORM_ACCOUNTS: Record<PayoutMethodType, PlatformCorporateAccount> = {
  bank_wire: {
    type: "bank_wire",
    label: "Bank wire (corporate)",
    account_holder: "StudioOS Inc.",
    details: [
      { key: "Bank", value: "JPMorgan Chase Bank, N.A." },
      { key: "Account name", value: "StudioOS Inc." },
      { key: "Account number", value: "88392018801" },
      { key: "Routing (ACH)", value: "021000021" },
      { key: "SWIFT / BIC", value: "CHASUS33" },
      { key: "Reference", value: "DEP-{creatorId}" }
    ],
    note: "Corporate USD account. Include your studio ID in the transfer reference."
  },
  paypal: {
    type: "paypal",
    label: "PayPal (corporate)",
    account_holder: "StudioOS Treasury",
    details: [
      { key: "PayPal email", value: "treasury@studioos.com" },
      { key: "Note", value: "Studio deposit — DEP-{creatorId}" }
    ]
  },
  alipay: {
    type: "alipay",
    label: "Alipay (corporate)",
    account_holder: "StudioOS 对公账户",
    details: [
      { key: "Account", value: "treasury@studioos.com" },
      { key: "Company", value: "StudioOS Technology Co., Ltd." },
      { key: "Remark", value: "保证金 DEP-{creatorId}" }
    ]
  },
  wechat: {
    type: "wechat",
    label: "WeChat Pay (corporate)",
    account_holder: "StudioOS 对公账户",
    details: [
      { key: "Merchant ID", value: "StudioOS-Treasury" },
      { key: "Company", value: "StudioOS Technology Co., Ltd." },
      { key: "Remark", value: "保证金 DEP-{creatorId}" }
    ]
  },
  crypto: {
    type: "crypto",
    label: "Cryptocurrency (corporate wallet)",
    account_holder: "StudioOS Treasury",
    details: [
      { key: "Asset", value: "USDT" },
      { key: "Network", value: "TRC20" },
      { key: "Wallet", value: "TStudioOS8Treasury9CorpWallet7Demo" },
      { key: "Memo", value: "DEP-{creatorId}" }
    ],
    note: "Send exactly the deposit amount. Network fees are not credited."
  }
};

export function getPlatformCorporateAccount(
  type: PayoutMethodType,
  creatorId: string,
  locale: Locale
): PlatformCorporateAccount {
  const base = PLATFORM_ACCOUNTS[type];
  const localize = (value: string) => value.replaceAll("{creatorId}", creatorId);

  return {
    ...base,
    label: paymentMethodLabel(type, locale),
    account_holder: base.account_holder,
    details: base.details.map((row) => ({
      key: localizeDetailKey(row.key, locale),
      value: localize(row.value)
    })),
    note: base.note ? (locale === "zh" ? localizeDepositNote(base.note, type) : localize(base.note)) : undefined
  };
}

function localizeDetailKey(key: string, locale: Locale) {
  if (locale === "en") return key;
  const map: Record<string, string> = {
    Bank: "开户行",
    "Account name": "账户名",
    "Account number": "账号",
    "Routing (ACH)": "Routing 号",
    "SWIFT / BIC": "SWIFT",
    Reference: "附言",
    "PayPal email": "PayPal 邮箱",
    Note: "备注",
    Account: "账号",
    Company: "公司主体",
    Remark: "备注",
    "Merchant ID": "商户号",
    Asset: "币种",
    Network: "网络",
    Wallet: "钱包地址",
    Memo: "Memo"
  };
  return map[key] ?? key;
}

function localizeDepositNote(note: string, type: PayoutMethodType) {
  if (type === "bank_wire") return "平台对公 USD 账户。转账附言请填写您的 Studio ID。";
  if (type === "crypto") return "请按保证金金额足额转账，链上手续费不予计入。";
  return note;
}

export function paymentMethodLabel(type: PayoutMethodType, locale: Locale) {
  const labels: Record<PayoutMethodType, Record<Locale, string>> = {
    bank_wire: { en: "Bank transfer", zh: "银行转账" },
    paypal: { en: "PayPal", zh: "PayPal" },
    alipay: { en: "Alipay", zh: "支付宝" },
    wechat: { en: "WeChat Pay", zh: "微信支付" },
    crypto: { en: "Cryptocurrency", zh: "加密货币" }
  };
  return labels[type][locale];
}
