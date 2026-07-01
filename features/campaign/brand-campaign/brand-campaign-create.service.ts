import type { CreateProjectDraftInput } from "@/lib/project-types";
import { brandCampaignActivityService } from "@/features/campaign/brand-campaign/brand-campaign-activity.service";
import { mapCampaignToStoredProject } from "@/features/campaign/brand-campaign/brand-campaign.mapper";
import { brandCampaignRepository } from "@/features/campaign/brand-campaign/brand-campaign.repository";
import { userRepository } from "@/features/auth/user.repository";
import { createLegacyProjectId } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export class BrandCampaignCreateService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  async createDraft(input: CreateProjectDraftInput) {
    if (!this.isEnabled()) {
      return null;
    }

    const user = await userRepository.ensureBrandPortalUser({
      email: input.client_email,
      fullName: input.client_name,
      companyName: input.company_name
    });
    if (!user) {
      return null;
    }

    const legacyProjectId = createLegacyProjectId();
    const title = input.title ?? `${input.company_name} Campaign`;

    const campaign = await brandCampaignRepository.createDraft({
      brandId: user.id,
      legacyProjectId,
      title,
      client: {
        email: input.client_email,
        name: input.client_name,
        company_name: input.company_name
      },
      wizardEphemeral: input.wizard_ephemeral
    });

    await brandCampaignActivityService.log(campaign.id, "brand_campaign.created", {
      userId: user.id,
      email: input.client_email,
      role: "brand"
    }, {
      legacy_project_id: legacyProjectId,
      ephemeral: input.wizard_ephemeral === true
    });

    return mapCampaignToStoredProject(campaign);
  }
}

export const brandCampaignCreateService = new BrandCampaignCreateService();
