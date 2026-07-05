export type QuoteStatus = "pending" | "accepted" | "superseded";

export type OrderPaymentStatus = "unpaid" | "escrowed" | "released" | "refunded";

export function isOrderPaymentEscrowed(status: OrderPaymentStatus) {
  return status === "escrowed" || status === "released";
}

export type OrderStatus =
  | "waiting_payment"
  | "paid"
  | "in_production"
  | "review"
  | "revision"
  | "ready_for_completion"
  | "settling"
  | "dispute"
  | "completed"
  | "cancelled";

export type PayoutStatus = "held" | "approved" | "paid";
export type OrderCancellationActor = "brand" | "studio" | "admin" | "system";

export type StoredQuote = {
  id: string;
  inquiry_id: string;
  creator_id: string;
  client_email: string;
  amount: number;
  summary: string;
  delivery_days: number;
  status: QuoteStatus;
  created_at: string;
};

export type StoredOrder = {
  id: string;
  project_id: string | null;
  inquiry_id: string;
  quote_id: string;
  creator_id: string;
  client_email: string;
  client_name: string;
  company_name: string;
  /** Brand client's preferred language for deliverable notes and comms. */
  client_locale?: "en" | "zh";
  title: string;
  requirements: string;
  budget_range: string;
  work_id: string | null;
  amount: number;
  platform_fee: number;
  creator_payout: number;
  payment_status: OrderPaymentStatus;
  status: OrderStatus;
  payout_status: PayoutStatus;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
  /** Included rounds used; synced from Prisma campaign.reviewRound when available. */
  review_round?: number;
  /** Paid revision pack (0 = locked, 1 = one add-on purchased — unlocks V4 + V5). */
  paid_revision_slots_unlocked?: number;
  cancelled_at?: string | null;
  cancelled_by?: OrderCancellationActor | null;
  cancel_reason?: string | null;
};

export type StoredDeliverable = {
  id: string;
  order_id: string;
  file_url: string;
  thumbnail_url: string;
  notes: string;
  /** Translated notes shown to the brand client in their preferred language. */
  notes_for_client?: string;
  notes_client_locale?: "en" | "zh";
  version: number;
  created_at: string;
};

export type OrderStore = {
  quotes: StoredQuote[];
  orders: StoredOrder[];
  deliverables: StoredDeliverable[];
  /** Demo seed IDs the brand explicitly removed — do not re-insert on read. */
  dismissed_demo_ids?: string[];
};

export type CreateQuoteInput = {
  inquiry_id: string;
  creator_id: string;
  client_email: string;
  amount: number;
  summary: string;
  delivery_days: number;
};
