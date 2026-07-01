export type PayoutMethodType = "bank_wire" | "paypal" | "crypto" | "alipay" | "wechat";

export type CryptoAsset = "USDT" | "USDC" | "BTC" | "ETH";

export type CryptoNetwork = "TRC20" | "ERC20" | "POLYGON" | "BITCOIN" | "ETHEREUM";

export type WithdrawalStatus =
  | "pending"
  | "under_review"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type PayoutMethod = {
  id: string;
  creator_id: string;
  type: PayoutMethodType;
  label: string;
  is_default: boolean;
  account_holder?: string;
  bank_name?: string;
  account_last4?: string;
  routing_last4?: string;
  swift_code?: string;
  paypal_email?: string;
  alipay_account?: string;
  wechat_account?: string;
  qr_code_url?: string;
  crypto_asset?: CryptoAsset;
  crypto_network?: CryptoNetwork;
  wallet_address?: string;
  verified?: boolean;
  created_at: string;
};

export type WithdrawalRequest = {
  id: string;
  creator_id: string;
  payout_method_id: string;
  amount_usd: number;
  fee_usd: number;
  net_usd: number;
  crypto_asset?: CryptoAsset;
  crypto_network?: CryptoNetwork;
  crypto_amount?: number;
  wallet_address?: string;
  status: WithdrawalStatus;
  status_note?: string;
  estimated_arrival: string;
  created_at: string;
  completed_at: string | null;
};

export type WithdrawalStore = {
  payout_methods: PayoutMethod[];
  withdrawals: WithdrawalRequest[];
};

export type CreatorIncomeSnapshot = {
  available_usd: number;
  held_usd: number;
  pending_withdrawal_usd: number;
  lifetime_withdrawn_usd: number;
  min_withdrawal_usd: number;
};
