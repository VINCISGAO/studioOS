/**
 * Sprint 2 acceptance — Campaign CRUD + Logo upload via Prisma
 * Run: npm run sprint2:verify
 */
import { PrismaClient } from "@prisma/client";
import { campaignService } from "../features/campaign/campaign.service";
import { campaignAssetService } from "../features/campaign/campaign-asset.service";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  let createdCampaignId: string | null = null;

  try {
    const brand = await prisma.user.findUniqueOrThrow({
      where: { email: "client.arc@studioos.test" }
    });

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 21);

    const created = await campaignService.create(
      { id: brand.id, role: "BRAND" },
      {
        title: "Sprint 2 Verify Campaign",
        description: "Automated Sprint 2 check",
        budget: 2500,
        currency: "USD",
        deadline: deadline.toISOString(),
        platform: "TikTok",
        aspect_ratio: "9:16"
      }
    );

    createdCampaignId = created?.id ?? null;
    checks.push({
      name: "campaign.create",
      ok: Boolean(createdCampaignId && created?.status === "DRAFT"),
      detail: createdCampaignId ?? "missing id"
    });

    if (createdCampaignId) {
      const updated = await campaignService.update(
        createdCampaignId,
        { id: brand.id, role: "BRAND" },
        { title: "Sprint 2 Verify Campaign (updated)" }
      );
      checks.push({
        name: "campaign.update",
        ok: Boolean(updated?.title.includes("updated")),
        detail: updated?.title
      });

      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      );
      const file = new File([pngBuffer], "verify-logo.png", { type: "image/png" });

      const logo = await campaignAssetService.uploadLogo(
        createdCampaignId,
        { id: brand.id, role: "BRAND" },
        file
      );

      checks.push({
        name: "asset.upload_logo",
        ok: logo.assetType === "LOGO" && Boolean(logo.previewUrl),
        detail: logo.previewUrl ?? "no preview url"
      });

      const listed = await campaignService.listForUser({ id: brand.id, role: "BRAND" }, 1, 20);
      checks.push({
        name: "campaign.list",
        ok: listed.items.some((item) => item.id === createdCampaignId),
        detail: `${listed.total} total`
      });

      const profile = await prisma.brandProfile.findUnique({ where: { userId: brand.id } });
      checks.push({
        name: "brand.logo_url_sync",
        ok: Boolean(profile?.logoUrl?.includes("/api/campaign-assets/")),
        detail: profile?.logoUrl ?? "missing"
      });
    }
  } catch (error) {
    checks.push({
      name: "sprint2.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (createdCampaignId) {
      await prisma.campaignAsset.updateMany({
        where: { campaignId: createdCampaignId },
        data: { deletedAt: new Date() }
      });
      await prisma.campaign.update({
        where: { id: createdCampaignId },
        data: { deletedAt: new Date() }
      });
    }
  }

  report(checks);
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}

function report(checks: Check[]) {
  console.log("\nSprint 2 verification\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
