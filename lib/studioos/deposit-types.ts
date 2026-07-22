import type { DepositStatus } from "@/lib/types";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";

export type DepositPaymentStatus = "pending" | "under_review" | "confirmed" | "failed";

export type CreatorDepositOverlay = {
  deposit_status: DepositStatus;
  deposit_amount: number;
  paid_at?: string | null;
};

export type DepositPayment = {
  id: string;
  creator_id: string;
  amount_usd: number;
  payment_method: PayoutMethodType;
  payment_reference?: string;
  status: DepositPaymentStatus;
  status_note?: string;
  stripe_session_id?: string | null;
  created_at: string;
  confirmed_at: string | null;
};

export type DepositStore = {
  creator_overlays: Record<string, CreatorDepositOverlay>;
  payments: DepositPayment[];
};

export type CreatorDepositSnapshot = {
  amount_usd: number;
  deposit_status: DepositStatus;
  paid_at: string | null;
  can_accept_orders: boolean;
  pending_payment: DepositPayment | null;
  payments: DepositPayment[];
};

export type PlatformCorporateAccount = {
  type: PayoutMethodType;
  label: string;
  account_holder: string;
  details: Array<{ key: string; value: string }>;
  note?: string;
};
