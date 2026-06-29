/**
 * StudioOS database seed — demo users + brand/creator + campaign in review
 * Run: npm run db:seed
 */
import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../lib/core/password";
import { DEMO_PASSWORD, DEMO_USERS } from "../lib/demo-auth";

const prisma = new PrismaClient();

const DEMO_PROJECT_ID = "proj_demo_arc_nova";

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
      email: "creator.nova@adbridge.test",
      dna: { style: ["Luxury", "Tech"], strength: ["Motion", "TikTok"] },
      aiQualityScore: 88
    },
    {
      email: "creator.signal@adbridge.test",
      dna: { style: ["UGC", "Tech"], strength: ["TikTok", "Meta"] },
      aiQualityScore: 85
    },
    {
      email: "creator.atlas@adbridge.test",
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

async function main() {
  await seedDemoUsers();
  await seedMembershipConfig();
  await seedCreatorMemberships();
  await enrichCreatorProfiles();

  const brand = await prisma.user.findUniqueOrThrow({
    where: { email: "client.arc@adbridge.test" }
  });

  const creator = await prisma.user.findUniqueOrThrow({
    where: { email: "creator.nova@adbridge.test" }
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
