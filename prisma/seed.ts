/**
 * VINCIS database seed — demo users + brand/creator + campaign in review
 * Run: npm run db:seed
 */
import { PrismaClient, UserRole, type CampaignStatus, type EscrowStatus } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "../lib/core/password-crypto";
import { DEMO_PASSWORD, DEMO_USERS } from "../lib/demo-auth";

const prisma = new PrismaClient();

const DEMO_PROJECT_ID = "proj_demo_arc_nova";
const AI_QA_SEED_PATH = path.join(process.cwd(), "docs/AI_COPILOT_QA_SEED_ZH.md");

function demoRoleToPrisma(role: string): UserRole {
  if (role === "admin") return "ADMIN";
  if (role === "creator") return "CREATOR";
  return "BRAND";
}

async function seedDemoUsers() {
  const passwordHash = hashPassword(DEMO_PASSWORD);

  for (const demo of DEMO_USERS) {
    const role = demoRoleToPrisma(demo.role);
    await prisma.user.upsert({
      where: { email: demo.email },
      update: {
        fullName: demo.label,
        passwordHash,
        role,
        emailVerified: true
      },
      create: {
        email: demo.email,
        role,
        fullName: demo.label,
        passwordHash,
        emailVerified: true,
        ...(role === "BRAND"
          ? { brandProfile: { create: { companyName: demo.label } } }
          : {}),
        ...(role === "CREATOR"
          ? {
              creatorProfile: {
                create: {
                  displayName: demo.label,
                  availability: "AVAILABLE",
                  headline: "Performance video specialist",
                  creatorDnaJson: {
                    style: ["Luxury", "Tech", "UGC"],
                    strength: ["Motion", "TikTok", "Meta"]
                  },
                  minBudget: 500,
                  maxBudget: 15000,
                  aiQualityScore: 82 + DEMO_USERS.filter((u) => u.role === "creator").indexOf(demo)
                }
              }
            }
          : {})
      }
    });
  }
}

async function enrichCreatorProfiles() {
  const creators = [
    {
      email: "creator.nova@studioos.test",
      legacyCreatorId: "creator_01",
      dna: { style: ["Luxury", "Tech"], strength: ["Motion", "TikTok"] },
      aiQualityScore: 88
    },
    {
      email: "creator.signal@studioos.test",
      legacyCreatorId: "creator_02",
      dna: { style: ["UGC", "Tech"], strength: ["TikTok", "Meta"] },
      aiQualityScore: 85
    },
    {
      email: "creator.atlas@studioos.test",
      legacyCreatorId: "creator_03",
      dna: { style: ["Luxury", "UGC"], strength: ["VFX", "Meta"] },
      aiQualityScore: 83
    }
  ];

  for (const item of creators) {
    const user = await prisma.user.findUnique({ where: { email: item.email } });
    if (!user) continue;
    await prisma.creatorProfile.updateMany({
      where: { userId: user.id },
      data: {
        creatorDnaJson: item.dna,
        legacyCreatorId: item.legacyCreatorId,
        minBudget: 500,
        maxBudget: 15000,
        aiQualityScore: item.aiQualityScore,
        availability: "AVAILABLE"
      }
    });
  }
}

async function seedDemoMemory(brandId: string, creatorId: string) {
  const { memoryExtractionService } = await import("../features/memory/memory-extraction.service");
  const { relationshipDnaService } = await import("../features/memory/relationship-dna.service");

  await memoryExtractionService.extractFromMessage({
    content: "我们品牌一直喜欢 Apple 那种极简风 — 白色背景、节奏慢、黑白字幕、女声旁白。",
    senderRole: "BRAND",
    brandId,
    sourceRefId: "seed-brand-style"
  });

  await relationshipDnaService.seedDemoRelationship(brandId, creatorId);
}

async function seedMembershipConfig() {
  const defaultBenefits = [
    "Receive and complete orders",
    "Normal ranking",
    "Normal payout speed",
    "Standard support"
  ];
  const verifiedBenefits = [
    "Verified badge",
    "Priority ranking",
    "Priority project invitations",
    "Faster payout",
    "AI assistant access",
    "AI translation access",
    "AI contract access",
    "Analytics dashboard",
    "Priority support"
  ];

  await prisma.creatorMembershipPlan.upsert({
    where: { slug: "default-creator" },
    update: {
      name: "Default Creator",
      planType: "DEFAULT",
      annualFee: 0,
      creatorCommissionPercentage: 20,
      membershipDurationDays: 365,
      benefitsJson: defaultBenefits,
      isActive: true,
      sortOrder: 0
    },
    create: {
      slug: "default-creator",
      name: "Default Creator",
      planType: "DEFAULT",
      annualFee: 0,
      creatorCommissionPercentage: 20,
      membershipDurationDays: 365,
      benefitsJson: defaultBenefits,
      isActive: true,
      sortOrder: 0
    }
  });

  await prisma.creatorMembershipPlan.upsert({
    where: { slug: "verified-creator" },
    update: {
      name: "Verified Creator",
      planType: "VERIFIED",
      annualFee: 199,
      creatorCommissionPercentage: 10,
      membershipDurationDays: 365,
      benefitsJson: verifiedBenefits,
      isActive: true,
      sortOrder: 1
    },
    create: {
      slug: "verified-creator",
      name: "Verified Creator",
      planType: "VERIFIED",
      annualFee: 199,
      creatorCommissionPercentage: 10,
      membershipDurationDays: 365,
      benefitsJson: verifiedBenefits,
      isActive: true,
      sortOrder: 1
    }
  });

  const existingRule = await prisma.commissionRule.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" }
  });

  if (!existingRule) {
    await prisma.commissionRule.create({
      data: {
        name: "default",
        clientServiceFeePercentage: 10,
        defaultCreatorCommissionPercentage: 20,
        verifiedCreatorCommissionPercentage: 10,
        upgradeRevenueThreshold: 300,
        upgradeModalEnabled: true,
        clientServiceFeeEnabled: true,
        isActive: true
      }
    });
  }
}

async function seedCreatorMemberships() {
  const { membershipService } = await import("../features/membership/membership.service");
  const creators = await prisma.user.findMany({
    where: { role: "CREATOR" },
    include: { creatorProfile: true }
  });

  for (const creator of creators) {
    await membershipService.ensureDefaultMembershipOnCreatorRegister(
      creator.id,
      creator.creatorProfile?.id
    );
  }
}

async function seedFeatureFlags() {
  const flags = [
    {
      key: "security.api_rate_limit",
      enabled: true,
      metadata: {
        windowMs: 60_000,
        maxRequests: 120,
        routes: {
          "/api/v1/auth/login": { maxRequests: 20, windowMs: 60_000 },
          "/api/v1/webhooks/stripe": { maxRequests: 200, windowMs: 60_000 }
        }
      }
    },
    {
      key: "monitoring.sentry",
      enabled: false,
      metadata: { sampleRate: 0.1, tracesSampleRate: 0.05 }
    },
    {
      key: "review.watermark_overlay",
      enabled: true,
      metadata: {}
    }
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { enabled: flag.enabled, metadata: flag.metadata },
      create: { key: flag.key, enabled: flag.enabled, metadata: flag.metadata }
    });
  }
}

async function seedPartnerAcademy() {
  const partners = [
    {
      slug: "creator-growth-asia",
      name: "Creator Growth Asia",
      tier: "STRATEGIC" as const,
      status: "ACTIVE" as const,
      contactName: "Mia Chen",
      contactEmail: "mia@creatorgrowth.example",
      region: "Asia",
      referralCode: "CGA-STUDIOOS",
      commissionRate: 12,
      attributedBrands: 18,
      attributedCreators: 64,
      attributedRevenue: 48200,
      pendingCommission: 3180,
      paidCommission: 2604,
      notes: "Strategic creator acquisition and Academy onboarding partner."
    },
    {
      slug: "brand-launch-labs",
      name: "Brand Launch Labs",
      tier: "GROWTH" as const,
      status: "ACTIVE" as const,
      contactName: "Jordan Lee",
      contactEmail: "partners@brandlaunch.example",
      region: "North America",
      referralCode: "BLL-STUDIOOS",
      commissionRate: 10,
      attributedBrands: 11,
      attributedCreators: 8,
      attributedRevenue: 28600,
      pendingCommission: 1440,
      paidCommission: 1420,
      notes: "Brand-side education and campaign onboarding partner."
    },
    {
      slug: "academy-ambassador-program",
      name: "Academy Ambassador Program",
      tier: "STARTER" as const,
      status: "PENDING" as const,
      contactName: "VINCIS Ops",
      contactEmail: "ops@studioos.test",
      region: "Global",
      referralCode: "ACADEMY-V1",
      commissionRate: 8,
      attributedBrands: 3,
      attributedCreators: 21,
      attributedRevenue: 7200,
      pendingCommission: 576,
      paidCommission: 0,
      notes: "Pilot program for Academy-led referrals."
    }
  ];

  for (const partner of partners) {
    await prisma.partnerProgram.upsert({
      where: { slug: partner.slug },
      update: {
        ...partner,
        metadataJson: {
          source: "seed",
          version: "partner_academy_v1"
        }
      },
      create: {
        ...partner,
        metadataJson: {
          source: "seed",
          version: "partner_academy_v1"
        }
      }
    });
  }

  const now = new Date();
  const courses = [
    {
      slug: "brand-first-campaign",
      title: "Brand: Launch your first Campaign",
      subtitle: "从需求填写到 Creator 匹配的完整入门课",
      audience: "BRAND" as const,
      status: "PUBLISHED" as const,
      level: "Beginner",
      durationMinutes: 18,
      lessonCount: 5,
      completionCount: 42,
      owner: "VINCIS Academy",
      description: "Teach brands how to create a complete brief, set budget, and prepare assets.",
      outcomesJson: ["Create a clear campaign brief", "Avoid missing assets", "Understand matching signals"],
      publishedAt: now
    },
    {
      slug: "creator-profile-that-converts",
      title: "Creator: Build a profile that converts",
      subtitle: "让主页、作品和报价更容易被品牌选中",
      audience: "CREATOR" as const,
      status: "PUBLISHED" as const,
      level: "Beginner",
      durationMinutes: 22,
      lessonCount: 6,
      completionCount: 57,
      owner: "Creator Success",
      description: "Help creators improve profile quality, portfolio positioning, and invitation response rate.",
      outcomesJson: ["Improve profile trust", "Upload better portfolio work", "Respond to invitations faster"],
      publishedAt: now
    },
    {
      slug: "partner-referral-playbook",
      title: "Partner: Referral playbook",
      subtitle: "合伙人如何介绍 VINCIS 并追踪推荐收入",
      audience: "PARTNER" as const,
      status: "PUBLISHED" as const,
      level: "Intermediate",
      durationMinutes: 16,
      lessonCount: 4,
      completionCount: 19,
      owner: "Partnerships",
      description: "Standardize partner messaging, attribution expectations, and referral quality rules.",
      outcomesJson: ["Explain VINCIS clearly", "Use referral codes", "Qualify brands and creators"],
      publishedAt: now
    },
    {
      slug: "admin-partner-academy-ops",
      title: "Admin: Partner & Academy operations",
      subtitle: "后台运营、课程状态和合伙人佣金风险检查",
      audience: "ADMIN" as const,
      status: "DRAFT" as const,
      level: "Advanced",
      durationMinutes: 25,
      lessonCount: 7,
      completionCount: 0,
      owner: "VINCIS Ops",
      description: "Internal operations guide for Partner and Academy V1.",
      outcomesJson: ["Review partner health", "Audit commission exposure", "Maintain Academy content"],
      publishedAt: null
    }
  ];

  for (const course of courses) {
    await prisma.academyCourse.upsert({
      where: { slug: course.slug },
      update: {
        ...course,
        metadataJson: {
          source: "seed",
          version: "partner_academy_v1"
        }
      },
      create: {
        ...course,
        metadataJson: {
          source: "seed",
          version: "partner_academy_v1"
        }
      }
    });
  }

  console.log(`Seeded Partner & Academy V1: ${partners.length} partners, ${courses.length} courses`);
}

type ParsedKnowledgeQa = {
  sourceKey: string;
  languageCode: string;
  module: string;
  question: string;
  answer: string;
  searchText: string;
};

function parseAiKnowledgeQaSeed(markdown: string): ParsedKnowledgeQa[] {
  const entries: ParsedKnowledgeQa[] = [];
  const lines = markdown.split(/\r?\n/);
  let moduleName = "General";
  let current:
    | {
        number: string;
        question: string;
        answerLines: string[];
        module: string;
      }
    | null = null;

  function flushCurrent() {
    if (!current) return;
    const answer = current.answerLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!answer) {
      current = null;
      return;
    }
    entries.push({
      sourceKey: `studioos_qa_${current.number}_zh`,
      languageCode: "zh-CN",
      module: current.module,
      question: current.question,
      answer,
      searchText: `${current.question}\n${answer}`
    });
    current = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      flushCurrent();
      moduleName = heading[1]?.trim() ?? moduleName;
      continue;
    }

    const question = line.match(/^(\d{3})｜(.+?)\s*$/);
    if (question) {
      flushCurrent();
      current = {
        number: question[1] ?? "",
        question: question[2]?.trim() ?? "",
        answerLines: [],
        module: moduleName
      };
      continue;
    }

    if (!current) continue;
    current.answerLines.push(line.trim());
  }

  flushCurrent();
  return entries;
}

async function seedAiKnowledgeQa() {
  const markdown = await readFile(AI_QA_SEED_PATH, "utf8");
  const entries = parseAiKnowledgeQaSeed(markdown);
  if (entries.length !== 200) {
    throw new Error(`AI Copilot QA seed expected 200 entries, parsed ${entries.length}`);
  }

  for (const entry of entries) {
    await prisma.aiKnowledgeQa.upsert({
      where: { sourceKey: entry.sourceKey },
      update: {
        languageCode: entry.languageCode,
        module: entry.module,
        question: entry.question,
        answer: entry.answer,
        searchText: entry.searchText,
        status: "ACTIVE",
        metadataJson: {
          source: "docs/AI_COPILOT_QA_SEED_ZH.md",
          sourceVersion: "first_reviewed_pdf",
          tone: "warm_human"
        }
      },
      create: {
        sourceKey: entry.sourceKey,
        languageCode: entry.languageCode,
        module: entry.module,
        question: entry.question,
        answer: entry.answer,
        searchText: entry.searchText,
        status: "ACTIVE",
        metadataJson: {
          source: "docs/AI_COPILOT_QA_SEED_ZH.md",
          sourceVersion: "first_reviewed_pdf",
          tone: "warm_human"
        }
      }
    });
  }

  console.log(`Seeded AI Copilot QA knowledge: ${entries.length} entries`);
}

async function seedDemoDispute(campaignId: string, brandEmail: string) {
  const existing = await prisma.dispute.findFirst({ where: { campaignId } });
  if (existing) return;

  await prisma.dispute.create({
    data: {
      campaignId,
      openedBy: brandEmail,
      reason: "Delivery does not match approved creative direction — request partial refund review.",
      status: "OPEN"
    }
  });
}

async function main() {
  await seedAiKnowledgeQa();
  await seedDemoUsers();
  await seedMembershipConfig();
  await seedCreatorMemberships();
  await seedFeatureFlags();
  await seedPartnerAcademy();
  await enrichCreatorProfiles();

  const brand = await prisma.user.findUniqueOrThrow({
    where: { email: "client.arc@studioos.test" }
  });

  const creator = await prisma.user.findUniqueOrThrow({
    where: { email: "creator.nova@studioos.test" }
  });

  await seedDemoMemory(brand.id, creator.id);

  const existing = await prisma.campaign.findFirst({
    where: {
      OR: [
        { title: "Summer Glow Campaign", brandId: brand.id },
        {
          productionBrief: {
            path: ["legacy_project_id"],
            equals: DEMO_PROJECT_ID
          }
        }
      ]
    }
  });

  if (existing) {
    const v3 = await prisma.campaignVersion.findFirst({
      where: { campaignId: existing.id, versionNumber: 3 }
    });
    if (v3 && !v3.hlsUrl) {
      await prisma.campaignVersion.update({
        where: { id: v3.id },
        data: {
          hlsUrl:
            "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8"
        }
      });
    }
    await seedDemoDispute(existing.id, "client.arc@studioos.test");
    await seedAdminDashboardDemoIfEnabled();
    console.log("Demo campaign already exists:", existing.id);
    return;
  }

  const campaign = await prisma.campaign.create({
    data: {
      brandId: brand.id,
      creatorId: creator.id,
      title: "Summer Glow Campaign",
      description: "TikTok · 9:16 · summer travel hero cut",
      budget: 1800,
      currency: "USD",
      deadline: new Date(Date.now() + 14 * 86400000),
      platform: "TIKTOK",
      aspectRatio: "9:16",
      status: "UNDER_REVIEW",
      reviewRound: 1,
      currentVersion: 3,
      productionBrief: {
        objective: "Drive summer product awareness",
        platform: "TikTok",
        aspectRatio: "9:16",
        duration: 28,
        legacy_project_id: DEMO_PROJECT_ID
      }
    }
  });

  const demoVideo =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

  for (let v = 1; v <= 3; v++) {
    const version = await prisma.campaignVersion.create({
      data: {
        campaignId: campaign.id,
        versionNumber: v,
        uploadedBy: creator.id,
        videoKey: `campaigns/${campaign.id}/v${v}.mp4`,
        videoUrl: demoVideo,
        duration: 28,
        status: "READY",
        reviewStatus: v === 3 ? "REVIEWING" : "APPROVED",
        ...(v === 3
          ? {
              hlsUrl:
                "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8"
            }
          : {})
      }
    });

    if (v === 3) {
      await prisma.reviewComment.createMany({
        data: [
          {
            campaignId: campaign.id,
            versionId: version.id,
            userId: brand.id,
            timeSeconds: 5,
            comment: "这里转场可以再自然一些。"
          },
          {
            campaignId: campaign.id,
            versionId: version.id,
            userId: brand.id,
            timeSeconds: 8,
            comment: "产品再居中一点，LOGO 可以更大。"
          },
          {
            campaignId: campaign.id,
            versionId: version.id,
            userId: brand.id,
            timeSeconds: 11,
            comment: "字幕位置再往上移一点，避免被遮挡。"
          }
        ]
      });
    }
  }

  console.log("Seeded campaign:", campaign.id, "linked to", DEMO_PROJECT_ID);
  await seedDemoDispute(campaign.id, brand.email);
  await seedAdminDashboardDemoIfEnabled();
}

const ADMIN_DEMO_MARKER = "[Admin Demo]";

type AdminDemoCampaign = {
  title: string;
  status: CampaignStatus;
  budget: number;
  brandEmail: string;
  creatorEmail?: string;
  escrowStatus?: EscrowStatus;
  commission?: boolean;
  daysAgo?: number;
};

async function seedAdminDashboardDemoIfEnabled() {
  if (process.env.STUDIOOS_SEED_ADMIN_DEMO !== "1") {
    console.log("Skipped admin dashboard demo campaigns (set STUDIOOS_SEED_ADMIN_DEMO=1 to seed them)");
    return;
  }

  await seedAdminDashboardDemo();
}

async function seedAdminDashboardDemo() {
  const brand = await prisma.user.findUniqueOrThrow({
    where: { email: "client.arc@studioos.test" }
  });
  const brandAlt = await prisma.user.findUniqueOrThrow({
    where: { email: "client.bright@studioos.test" }
  });
  const creator = await prisma.user.findUniqueOrThrow({
    where: { email: "creator.nova@studioos.test" }
  });
  const creatorAlt = await prisma.user.findUniqueOrThrow({
    where: { email: "creator.signal@studioos.test" }
  });
  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@studioos.test" }
  });

  const demos: AdminDemoCampaign[] = [
    { title: `${ADMIN_DEMO_MARKER} Draft Brief`, status: "DRAFT", budget: 900, brandEmail: brand.email },
    { title: `${ADMIN_DEMO_MARKER} Match Queue`, status: "MATCHING", budget: 1500, brandEmail: brand.email, creatorEmail: creator.email, daysAgo: 12 },
    { title: `${ADMIN_DEMO_MARKER} Invitation Sent`, status: "INVITATION_SENT", budget: 1800, brandEmail: brandAlt.email, creatorEmail: creatorAlt.email, daysAgo: 10 },
    { title: `${ADMIN_DEMO_MARKER} In Production`, status: "PRODUCING", budget: 3200, brandEmail: brand.email, creatorEmail: creator.email, escrowStatus: "HELD", daysAgo: 8 },
    { title: `${ADMIN_DEMO_MARKER} Under Review`, status: "UNDER_REVIEW", budget: 2800, brandEmail: brandAlt.email, creatorEmail: creator.email, escrowStatus: "HELD", daysAgo: 6 },
    { title: `${ADMIN_DEMO_MARKER} Settlement`, status: "SETTLEMENT", budget: 4200, brandEmail: brand.email, creatorEmail: creatorAlt.email, escrowStatus: "HELD", commission: true, daysAgo: 4 },
    { title: `${ADMIN_DEMO_MARKER} Completed`, status: "COMPLETED", budget: 3600, brandEmail: brandAlt.email, creatorEmail: creator.email, escrowStatus: "FULL_RELEASE", commission: true, daysAgo: 2 },
    { title: `${ADMIN_DEMO_MARKER} Cancelled`, status: "CANCELLED", budget: 1100, brandEmail: brand.email, daysAgo: 1 }
  ];

  const activityTemplates = [
    { action: "campaign.created", offsetDays: 13 },
    { action: "invitation.sent", offsetDays: 11 },
    { action: "creator.accepted", offsetDays: 10 },
    { action: "escrow.paid", offsetDays: 9 },
    { action: "upload.version", offsetDays: 7 },
    { action: "review.approved", offsetDays: 5 },
    { action: "settlement.released", offsetDays: 3 },
    { action: "withdrawal.submitted", offsetDays: 2 },
    { action: "withdrawal.approved", offsetDays: 1 },
    { action: "payment.success", offsetDays: 0 }
  ];

  for (const demo of demos) {
    const existingCampaign = await prisma.campaign.findFirst({ where: { title: demo.title } });
    if (existingCampaign) continue;

    const demoBrand = demo.brandEmail === brandAlt.email ? brandAlt : brand;
    const demoCreator = demo.creatorEmail
      ? demo.creatorEmail === creatorAlt.email
        ? creatorAlt
        : creator
      : null;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - (demo.daysAgo ?? 0));
    createdAt.setHours(10, 0, 0, 0);

    const campaign = await prisma.campaign.create({
      data: {
        brandId: demoBrand.id,
        creatorId: demoCreator?.id ?? null,
        title: demo.title,
        description: "Admin dashboard demo campaign",
        budget: demo.budget,
        currency: "USD",
        deadline: new Date(Date.now() + 21 * 86400000),
        platform: "TIKTOK",
        aspectRatio: "9:16",
        status: demo.status,
        createdAt,
        updatedAt: createdAt
      }
    });

    if (demoCreator && demo.escrowStatus) {
      const remaining = demo.escrowStatus === "HELD" ? demo.budget * 0.85 : 0;
      const released = demo.budget - remaining;
      await prisma.escrowPayment.create({
        data: {
          campaignId: campaign.id,
          brandId: demoBrand.id,
          creatorId: demoCreator.id,
          amount: demo.budget,
          releasedAmount: released,
          remainingAmount: remaining,
          status: demo.escrowStatus,
          paymentStatus: "PAID",
          paidAt: createdAt,
          createdAt,
          updatedAt: createdAt
        }
      });
    }

    if (demoCreator && demo.commission) {
      const feeAmount = demo.budget * 0.08;
      const commissionAmount = demo.budget * 0.12;
      const payoutAmount = demo.budget - feeAmount - commissionAmount;
      const settledAt = new Date(createdAt);
      settledAt.setDate(settledAt.getDate() + 1);
      await prisma.orderCommission.create({
        data: {
          campaignId: campaign.id,
          creatorId: demoCreator.id,
          orderAmount: demo.budget,
          currency: "USD",
          clientServiceFeePercentage: 8,
          clientServiceFeeAmount: feeAmount,
          creatorCommissionPercentage: 12,
          creatorCommissionAmount: commissionAmount,
          creatorPayoutAmount: payoutAmount,
          platformTotalRevenue: feeAmount + commissionAmount,
          creatorMembershipTypeAtOrder: "DEFAULT",
          settledAt,
          createdAt: settledAt
        }
      });
    }
  }

  const seededCampaigns = await prisma.campaign.findMany({
    where: { title: { startsWith: ADMIN_DEMO_MARKER } },
    orderBy: { createdAt: "asc" },
    take: 3
  });

  const existingLogs = await prisma.activityLog.count({
    where: {
      action: { in: activityTemplates.map((item) => item.action) },
      campaign: { title: { startsWith: ADMIN_DEMO_MARKER } }
    }
  });
  if (existingLogs >= activityTemplates.length) {
    console.log("Admin dashboard demo already seeded");
    return;
  }

  for (const template of activityTemplates) {
    const target = seededCampaigns[template.offsetDays % seededCampaigns.length];
    if (!target) continue;
    const logAt = new Date();
    logAt.setDate(logAt.getDate() - template.offsetDays);
    logAt.setHours(14, 30, 0, 0);
    await prisma.activityLog.create({
      data: {
        campaignId: target.id,
        userId: admin.id,
        action: template.action,
        createdAt: logAt
      }
    });
  }

  console.log("Seeded admin dashboard demo campaigns");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
