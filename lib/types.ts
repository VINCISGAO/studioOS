export type UserRole = "client" | "creator" | "admin";

export type ProjectStatus =
  | "submitted"
  | "approved"
  | "waiting_payment"
  | "paid"
  | "matching"
  | "assigned"
  | "matched"
  | "in_production"
  | "review"
  | "revision"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed"
  | "refunded";

export type CreatorStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "deposit_required"
  | "active";

export type DepositStatus =
  | "unpaid"
  | "paid"
  | "frozen"
  | "refund_requested"
  | "refunded"
  | "partially_deducted"
  | "deducted";

export type EscrowStatus =
  | "unpaid"
  | "escrowed"
  | "released"
  | "refund_requested"
  | "refunded"
  | "partially_refunded"
  | "failed";

export type Project = {
  id: string;
  user_id: string;
  company_name: string;
  email: string;
  product_url: string;
  category: string;
  target_platform: string;
  video_format: string;
  video_count: number;
  budget_range: string;
  deadline: string;
  brand_style: string;
  reference_links: string;
  campaign_goal: string;
  notes: string;
  status: ProjectStatus;
  created_at: string;
};

export type Order = {
  id: string;
  project_id: string;
  user_id: string;
  plan_name: string;
  amount: number;
  stripe_session_id: string;
  payment_status: "paid" | "open" | "failed" | EscrowStatus;
  assigned_creator_id: string | null;
  status: ProjectStatus;
  platform_fee?: number;
  creator_payout?: number;
  created_at: string;
};

export type Creator = {
  id: string;
  name: string;
  headline?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  country: string;
  city?: string;
  email: string;
  portfolio_url: string;
  specialties: string[];
  tools: string[];
  rating: number;
  delivery_speed: string;
  /** Minimum project budget (USD) the creator accepts; 0 = any. */
  min_project_budget_usd?: number;
  status: CreatorStatus;
  deposit_status?: DepositStatus;
  deposit_amount?: number;
  /** AI-generated tags after certified profile onboarding. */
  ai_tags?: string[];
  /** Selected industry domains from onboarding. */
  expertise_domains?: string[];
  /** Set when certified creator completes profile setup. */
  profile_completed_at?: string | null;
  /** Count of brand ratings from completed orders. */
  order_rating_count?: number;
  /** Paused via studio settings — excluded from new matches. */
  orders_paused?: boolean;
  /** Soft-deleted studio account timestamp. */
  account_deleted_at?: string | null;
  created_at: string;
};

export type CreatorWork = {
  id: string;
  creator_id: string;
  title: string;
  category: string;
  platform: string;
  format: string;
  work_type?: string;
  country?: string;
  city?: string;
  thumbnail_url: string;
  video_url: string;
  description: string;
  turnaround: string;
  tags: string[];
  price_min?: number | null;
  price_max?: number | null;
  price_visible?: boolean;
  sort_order?: number;
  created_at: string;
  /** Hidden from public portfolio; owner can still manage. */
  hidden?: boolean;
};

export type Inquiry = {
  id: string;
  creator_id: string;
  work_id: string | null;
  client_name: string;
  client_email: string;
  company_name: string;
  budget_range: string;
  message: string;
  status: "new" | "quoted" | "escrow_pending" | "converted" | "closed";
  created_at: string;
};

export type Deliverable = {
  id: string;
  order_id: string;
  file_url: string;
  thumbnail_url: string;
  notes: string;
  version: number;
  created_at: string;
};

export type ProjectApplication = {
  id: string;
  project_id: string;
  creator_id: string;
  proposed_amount: number;
  timeline: string;
  proposal: string;
  status: "submitted" | "shortlisted" | "accepted" | "rejected";
  created_at: string;
};

export type Deposit = {
  id: string;
  creator_id: string;
  amount: number;
  status: DepositStatus;
  reason: string;
  refundable_after: string | null;
  created_at: string;
};

export type EscrowPayment = {
  id: string;
  order_id: string;
  payer_user_id: string;
  amount: number;
  platform_fee: number;
  creator_payout: number;
  status: EscrowStatus;
  created_at: string;
};

export type RefundRequest = {
  id: string;
  order_id: string;
  requester_user_id: string;
  amount: number;
  reason: string;
  status: "requested" | "under_review" | "approved" | "rejected" | "paid";
  created_at: string;
};

export type Dispute = {
  id: string;
  order_id: string;
  opened_by: UserRole;
  reason: string;
  status: "open" | "evidence_required" | "resolved" | "closed";
  proposed_resolution: string;
  created_at: string;
};

export type Payout = {
  id: string;
  order_id: string;
  creator_id: string;
  amount: number;
  status: "pending" | "approved" | "paid" | "held";
  created_at: string;
};
