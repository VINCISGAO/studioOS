import type {
  Creator,
  CreatorWork,
  Deliverable,
  Deposit,
  Dispute,
  EscrowPayment,
  Order,
  Payout,
  Project,
  ProjectApplication,
  Inquiry,
  RefundRequest
} from "@/lib/types";

export const creators: Creator[] = [
  {
    id: "creator_01",
    name: "Nova Motion Studio",
    headline: "Cinematic AI product films for beauty and consumer tech.",
    bio: "A Seoul-based AI motion team combining product cinematography, generative video, and paid-social editing.",
    country: "South Korea",
    email: "studio@novamotion.ai",
    portfolio_url: "https://example.com/nova",
    specialties: ["Beauty", "Consumer tech", "TikTok"],
    tools: ["Runway", "Midjourney", "After Effects"],
    rating: 4.9,
    delivery_speed: "48-72 hours",
    min_project_budget_usd: 2500,
    status: "deposit_required",
    deposit_status: "unpaid",
    deposit_amount: 99,
    created_at: "2026-06-01T09:00:00Z"
  },
  {
    id: "creator_02",
    name: "Signal Frame Lab",
    headline: "Performance-ready product demos for CPG and ecommerce.",
    bio: "A compact studio focused on clear product education, Amazon video, YouTube cutdowns, and conversion-led scripts.",
    country: "Spain",
    email: "hello@signalframe.ai",
    portfolio_url: "https://example.com/signal",
    specialties: ["CPG", "YouTube", "Product demos"],
    tools: ["Kling", "ElevenLabs", "Premiere Pro"],
    rating: 4.8,
    delivery_speed: "72 hours",
    min_project_budget_usd: 1000,
    status: "deposit_required",
    deposit_status: "unpaid",
    deposit_amount: 99,
    created_at: "2026-06-04T09:00:00Z"
  },
  {
    id: "creator_03",
    name: "Atlas UGC Systems",
    headline: "Creator-style AI UGC systems for DTC growth teams.",
    bio: "A US operator building batches of AI-assisted hooks, creator scripts, and short-form performance variants.",
    country: "United States",
    email: "ops@atlasugc.example",
    portfolio_url: "https://example.com/atlas",
    specialties: ["DTC", "UGC scripts", "Meta"],
    tools: ["Runway", "Topaz", "DaVinci Resolve"],
    rating: 4.7,
    delivery_speed: "3-5 days",
    min_project_budget_usd: 500,
    status: "pending",
    deposit_status: "paid",
    deposit_amount: 99,
    created_at: "2026-06-20T09:00:00Z"
  }
];

export const creatorWorks: CreatorWork[] = [
  {
    id: "work_1001",
    creator_id: "creator_01",
    title: "Luxury serum launch film",
    category: "Beauty",
    platform: "TikTok / Instagram",
    format: "9:16",
    thumbnail_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1200&auto=format&fit=crop",
    video_url: "https://example.com/works/serum-launch",
    description: "Macro product textures, premium lighting, and fast hook variations for paid social testing.",
    turnaround: "72 hours",
    tags: ["Beauty", "Premium", "Product macro", "Paid social"],
    created_at: "2026-06-18T09:00:00Z"
  },
  {
    id: "work_1002",
    creator_id: "creator_01",
    title: "Consumer tech reveal sequence",
    category: "Consumer tech",
    platform: "YouTube / Meta",
    format: "16:9 + 9:16",
    thumbnail_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
    video_url: "https://example.com/works/tech-reveal",
    description: "Sharp AI motion shots and editorial pacing for launch campaigns and product explainers.",
    turnaround: "4 days",
    tags: ["Tech", "Launch", "Cinematic", "Explainer"],
    created_at: "2026-06-19T09:00:00Z"
  },
  {
    id: "work_1005",
    creator_id: "creator_01",
    title: "Indila - Love Story",
    category: "Beauty",
    platform: "TikTok",
    format: "9:16",
    thumbnail_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop",
    video_url: "https://example.com/works/indila-love-story",
    description: "Emotional beauty narrative with cinematic pacing for paid social.",
    turnaround: "72 hours",
    tags: ["Beauty", "Emotional", "TikTok"],
    created_at: "2026-06-22T09:00:00Z"
  },
  {
    id: "work_1006",
    creator_id: "creator_01",
    title: "Serum texture macro reel",
    category: "Beauty",
    platform: "Instagram",
    format: "9:16",
    thumbnail_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=1200&auto=format&fit=crop",
    video_url: "https://example.com/works/serum-macro",
    description: "Macro product textures with premium lighting for skincare launch.",
    turnaround: "48 hours",
    tags: ["Beauty", "Macro", "Premium"],
    created_at: "2026-06-23T09:00:00Z"
  },
  {
    id: "work_1007",
    creator_id: "creator_01",
    title: "Wireless earbuds hero cut",
    category: "Consumer tech",
    platform: "TikTok",
    format: "9:16",
    thumbnail_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=1200&auto=format&fit=crop",
    video_url: "https://example.com/works/earbuds-hero",
    description: "Fast hook variations and product hero shots for DTC launch.",
    turnaround: "72 hours",
    tags: ["Tech", "DTC", "Launch"],
    created_at: "2026-06-24T09:00:00Z"
  },
  {
    id: "work_1008",
    creator_id: "creator_01",
    title: "Skincare routine UGC pack",
    category: "Beauty",
    platform: "Meta",
    format: "9:16",
    thumbnail_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1200&auto=format&fit=crop",
    video_url: "https://example.com/works/skincare-ugc",
    description: "Creator-style routine edits with offer-led hooks for Meta ads.",
    turnaround: "4 days",
    tags: ["Beauty", "UGC", "Meta"],
    created_at: "2026-06-25T09:00:00Z"
  },
  {
    id: "work_1009",
    creator_id: "creator_01",
    title: "Smartwatch lifestyle film",
    category: "Consumer tech",
    platform: "YouTube",
    format: "16:9",
    thumbnail_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop",
    video_url: "https://example.com/works/smartwatch-lifestyle",
    description: "Lifestyle product film with editorial pacing for YouTube pre-roll.",
    turnaround: "5 days",
    tags: ["Tech", "Lifestyle", "Cinematic"],
    created_at: "2026-06-26T09:00:00Z"
  },
  {
    id: "work_1003",
    creator_id: "creator_02",
    title: "Sparkling drink education ads",
    category: "Food and beverage",
    platform: "Amazon / Instagram",
    format: "1:1",
    thumbnail_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=1200&auto=format&fit=crop",
    video_url: "https://example.com/works/drink-education",
    description: "Ingredient-led product education with bright pacing and retail-safe claims.",
    turnaround: "72 hours",
    tags: ["CPG", "Amazon", "Education", "Retail"],
    created_at: "2026-06-20T09:00:00Z"
  },
  {
    id: "work_1004",
    creator_id: "creator_03",
    title: "AI UGC hook testing pack",
    category: "DTC",
    platform: "Meta / TikTok",
    format: "9:16",
    thumbnail_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1200&auto=format&fit=crop",
    video_url: "https://example.com/works/ugc-hooks",
    description: "Creator-style hooks, testimonial cuts, and offer-led variations for weekly growth testing.",
    turnaround: "3 days",
    tags: ["UGC", "DTC", "Hooks", "Performance"],
    created_at: "2026-06-21T09:00:00Z"
  }
];

export const inquiries: Inquiry[] = [
  {
    id: "inq_9001",
    creator_id: "creator_01",
    work_id: "work_1001",
    client_name: "Maya Chen",
    client_email: "maya@northline.example",
    company_name: "Northline Skincare",
    budget_range: "$1,000-$2,500",
    message: "We want a serum launch batch inspired by the macro texture work, with TikTok-first versions.",
    status: "quoted",
    created_at: "2026-06-28T08:45:00Z"
  },
  {
    id: "inq_9002",
    creator_id: "creator_03",
    work_id: "work_1004",
    client_name: "Ryan Lee",
    client_email: "growth@arcandalloy.example",
    company_name: "Arc & Alloy",
    budget_range: "$500-$1,000",
    message: "Looking for 10 hook variations for a travel accessories campaign.",
    status: "new",
    created_at: "2026-06-28T09:30:00Z"
  }
];

export const projects: Project[] = [
  {
    id: "proj_1001",
    user_id: "user_001",
    company_name: "Arc & Alloy",
    email: "marketing@arcandalloy.com",
    product_url: "https://arcandalloy.example/products/travel-case",
    category: "Travel accessories",
    target_platform: "TikTok, Meta",
    video_format: "9:16",
    video_count: 10,
    budget_range: "$500-$1,000",
    deadline: "2026-07-01",
    brand_style: "Premium, editorial, minimal",
    reference_links: "https://example.com/reference-spot",
    campaign_goal: "Drive paid social conversions for a summer travel launch.",
    notes: "Show the case surviving airport chaos while still feeling premium.",
    status: "review",
    created_at: "2026-06-26T14:30:00Z"
  },
  {
    id: "proj_1002",
    user_id: "user_002",
    company_name: "BrightSip",
    email: "growth@brightsip.com",
    product_url: "https://brightsip.example",
    category: "Beverage",
    target_platform: "Instagram, Amazon",
    video_format: "1:1",
    video_count: 3,
    budget_range: "$299-$500",
    deadline: "2026-07-03",
    brand_style: "Clean, optimistic, ingredient-led",
    reference_links: "",
    campaign_goal: "Test product education hooks for retail landing pages.",
    notes: "Need a strong first three seconds and clear ingredient visuals.",
    status: "matching",
    created_at: "2026-06-27T10:10:00Z"
  },
  {
    id: "proj_1003",
    user_id: "user_003",
    company_name: "Northline Skincare",
    email: "ads@northline.example",
    product_url: "https://northline.example/serum",
    category: "Beauty",
    target_platform: "TikTok, Instagram",
    video_format: "9:16",
    video_count: 18,
    budget_range: "$1,000-$2,500",
    deadline: "2026-07-08",
    brand_style: "Clinical, premium, founder-led",
    reference_links: "https://example.com/skincare-reference",
    campaign_goal: "Create creator-style paid social variants for a serum launch.",
    notes: "Need hooks around texture, before-after language, and ingredient confidence.",
    status: "approved",
    created_at: "2026-06-28T08:20:00Z"
  }
];

export const orders: Order[] = [
  {
    id: "ord_7001",
    project_id: "proj_1001",
    user_id: "user_001",
    plan_name: "Accepted quote",
    amount: 799,
    stripe_session_id: "cs_test_7001",
    payment_status: "paid",
    assigned_creator_id: "creator_01",
    status: "review",
    platform_fee: 160,
    creator_payout: 639,
    created_at: "2026-06-26T14:45:00Z"
  },
  {
    id: "ord_7002",
    project_id: "proj_1002",
    user_id: "user_002",
    plan_name: "Pending quote",
    amount: 299,
    stripe_session_id: "cs_test_7002",
    payment_status: "escrowed",
    assigned_creator_id: null,
    status: "matching",
    platform_fee: 60,
    creator_payout: 239,
    created_at: "2026-06-27T10:20:00Z"
  },
  {
    id: "ord_7003",
    project_id: "proj_1003",
    user_id: "user_003",
    plan_name: "Creator quote",
    amount: 1999,
    stripe_session_id: "cs_test_7003",
    payment_status: "unpaid",
    assigned_creator_id: "creator_03",
    status: "waiting_payment",
    platform_fee: 400,
    creator_payout: 1599,
    created_at: "2026-06-28T08:35:00Z"
  }
];

export const deliverables: Deliverable[] = [
  {
    id: "del_9001",
    order_id: "ord_7001",
    file_url: "https://example.com/adbridge/arc-alloy-v1.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1523359346063-d879354c0ea5",
    notes: "First review cut with three hook variations.",
    version: 1,
    created_at: "2026-06-27T18:00:00Z"
  }
];

export const projectApplications: ProjectApplication[] = [
  {
    id: "app_5001",
    project_id: "proj_1002",
    creator_id: "creator_01",
    proposed_amount: 620,
    timeline: "72 hours",
    proposal: "Three paid-social concepts with ingredient-led product education and Amazon-safe cutdowns.",
    status: "shortlisted",
    created_at: "2026-06-27T12:00:00Z"
  },
  {
    id: "app_5002",
    project_id: "proj_1003",
    creator_id: "creator_03",
    proposed_amount: 1800,
    timeline: "5 days",
    proposal: "Founder-led hooks, texture macro shots, and creator testimonial edits for TikTok testing.",
    status: "submitted",
    created_at: "2026-06-28T09:00:00Z"
  }
];

export const deposits: Deposit[] = [
  {
    id: "dep_3001",
    creator_id: "creator_01",
    amount: 99,
    status: "unpaid",
    reason: "Required before accepting orders",
    refundable_after: null,
    created_at: "2026-06-01T10:00:00Z"
  },
  {
    id: "dep_3002",
    creator_id: "creator_02",
    amount: 99,
    status: "unpaid",
    reason: "Required before accepting orders",
    refundable_after: null,
    created_at: "2026-06-04T10:00:00Z"
  },
  {
    id: "dep_3003",
    creator_id: "creator_03",
    amount: 99,
    status: "refund_requested",
    reason: "Creator requested exit review",
    refundable_after: "2026-07-20",
    created_at: "2026-06-20T10:00:00Z"
  }
];

export const escrowPayments: EscrowPayment[] = [
  {
    id: "esc_4001",
    order_id: "ord_7001",
    payer_user_id: "user_001",
    amount: 799,
    platform_fee: 160,
    creator_payout: 639,
    status: "escrowed",
    created_at: "2026-06-26T14:50:00Z"
  },
  {
    id: "esc_4002",
    order_id: "ord_7002",
    payer_user_id: "user_002",
    amount: 299,
    platform_fee: 60,
    creator_payout: 239,
    status: "refund_requested",
    created_at: "2026-06-27T10:25:00Z"
  }
];

export const refundRequests: RefundRequest[] = [
  {
    id: "ref_6001",
    order_id: "ord_7002",
    requester_user_id: "user_002",
    amount: 299,
    reason: "Campaign timeline changed before creator assignment.",
    status: "under_review",
    created_at: "2026-06-28T06:20:00Z"
  }
];

export const disputes: Dispute[] = [
  {
    id: "dis_8001",
    order_id: "ord_7002",
    opened_by: "client",
    reason: "Refund requested before production assignment.",
    status: "evidence_required",
    proposed_resolution: "Approve full refund if no creator work has started.",
    created_at: "2026-06-28T06:35:00Z"
  }
];

export const payouts: Payout[] = [
  {
    id: "pay_2001",
    order_id: "ord_7001",
    creator_id: "creator_01",
    amount: 639,
    status: "held",
    created_at: "2026-06-27T18:30:00Z"
  }
];

export const statuses = [
  "submitted",
  "approved",
  "waiting_payment",
  "paid",
  "matching",
  "assigned",
  "matched",
  "in_production",
  "review",
  "revision",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
  "refunded"
] as const;
