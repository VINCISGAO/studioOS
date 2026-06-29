import type {
  CryptoAsset,
  CryptoNetwork,
  PayoutMethod,
  PayoutMethodType
} from "@/lib/studioos/withdrawal-types";

export const MIN_WITHDRAWAL_USD = 50;

const CRYPTO_RATES_USD: Record<CryptoAsset, number> = {
  USDT: 1,
  USDC: 1,
  BTC: 67000,
  ETH: 3500
};

const NETWORK_FEE_USD: Record<PayoutMethodType, number> = {
  bank_wire: 0,
  paypal: 0,
  alipay: 0,
  wechat: 0,
  crypto: 2
};

const PAYPAL_FEE_RATE = 0.01;

export function validateAlipayAccount(account: string) {
  const trimmed = account.trim();
  if (trimmed.length < 5) {
    return false;
  }
  if (trimmed.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }
  return /^[\d+\-\s]{6,20}$/.test(trimmed.replace(/\s/g, ""));
}

export function validateWechatAccount(account: string) {
  const trimmed = account.trim();
  if (trimmed.length < 3) {
    return false;
  }
  if (/^1\d{10}$/.test(trimmed)) {
    return true;
  }
  return /^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/.test(trimmed);
}

export function maskPayoutAccount(account: string) {
  if (account.includes("@")) {
    const [user, domain] = account.split("@");
    const maskedUser = user.length <= 2 ? `${user[0] ?? ""}*` : `${user.slice(0, 2)}***`;
    return `${maskedUser}@${domain}`;
  }
  if (account.length <= 7) {
    return account;
  }
  return `${account.slice(0, 3)}****${account.slice(-4)}`;
}

export function validateWalletAddress(asset: CryptoAsset, network: CryptoNetwork, address: string) {
  const trimmed = address.trim();

  if (asset === "BTC" || network === "BITCOIN") {
    return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(trimmed);
  }

  if (network === "TRC20") {
    return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmed);
  }

  return /^0x[a-fA-F0-9]{40}$/.test(trimmed);
}

export function estimateCryptoAmount(asset: CryptoAsset, netUsd: number) {
  const rate = CRYPTO_RATES_USD[asset];
  const decimals = asset === "BTC" ? 8 : asset === "ETH" ? 6 : 2;
  return Number((netUsd / rate).toFixed(decimals));
}

export function computeWithdrawalFee(type: PayoutMethodType, amount: number) {
  if (type === "paypal") {
    return Math.round(amount * PAYPAL_FEE_RATE * 100) / 100;
  }
  return NETWORK_FEE_USD[type];
}

export function estimateArrival(type: PayoutMethodType, locale: "en" | "zh") {
  if (type === "crypto") {
    return locale === "zh" ? "1–24 小时" : "1–24 hours";
  }
  if (type === "paypal" || type === "alipay" || type === "wechat") {
    return locale === "zh" ? "即时" : "Instant";
  }
  return locale === "zh" ? "3–5 个工作日" : "3–5 business days";
}

export function maskWalletAddress(address: string) {
  if (address.length <= 12) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function payoutMethodSummary(method: PayoutMethod, locale: "en" | "zh") {
  if (method.type === "crypto") {
    return `${method.crypto_asset} · ${method.crypto_network} · ${maskWalletAddress(method.wallet_address ?? "")}`;
  }
  if (method.type === "paypal") {
    return method.paypal_email ?? method.label;
  }
  if (method.type === "alipay") {
    const parts = [
      method.alipay_account ? maskPayoutAccount(method.alipay_account) : null,
      method.qr_code_url ? (locale === "zh" ? "收款码已上传" : "QR uploaded") : null
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : method.label;
  }
  if (method.type === "wechat") {
    const parts = [
      method.wechat_account ? maskPayoutAccount(method.wechat_account) : null,
      method.qr_code_url ? (locale === "zh" ? "收款码已上传" : "QR uploaded") : null
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : method.label;
  }
  return locale === "zh"
    ? `${method.bank_name ?? "银行"} · ****${method.account_last4 ?? "0000"}`
    : `${method.bank_name ?? "Bank"} · ****${method.account_last4 ?? "0000"}`;
}
