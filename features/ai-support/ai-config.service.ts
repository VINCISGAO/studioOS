import type { CreatorAiConfig } from "@prisma/client";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";

export type CreatorAiSupportConfigInput = {
  creatorId: string;
  aiName?: string;
  persona?: string | null;
  welcomeMessage?: string | null;
  serviceIntro?: string | null;
  faqJson?: unknown;
  pricingRulesJson?: unknown;
  receptionScript?: string | null;
  multilingualJson?: unknown;
  defaultReply?: string | null;
  blockedContentJson?: unknown;
  handoffRulesJson?: unknown;
  dataSourcesJson?: unknown;
  isEnabled?: boolean;
};

export class CreatorAiSupportConfigService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  getConfig(creatorId: string): Promise<CreatorAiConfig | null> {
    return prisma.creatorAiConfig.findUnique({
      where: { creatorId }
    });
  }

  async getOrCreateConfig(creatorId: string): Promise<CreatorAiConfig> {
    const existing = await this.getConfig(creatorId);
    if (existing) return existing;

    return prisma.creatorAiConfig.create({
      data: {
        creatorId,
        aiName: "StudioOS AI",
        persona: "Helpful creator studio receptionist.",
        welcomeMessage: "Welcome. Share your project goals and timeline, and I will help collect the details.",
        serviceIntro: null,
        faqJson: asInputJson([]),
        pricingRulesJson: asInputJson({}),
        multilingualJson: asInputJson({ defaultLanguage: "en", supportedLanguages: ["en", "zh"] }),
        blockedContentJson: asInputJson([]),
        handoffRulesJson: asInputJson({ requireHumanWhen: ["pricing_dispute", "legal_terms", "custom_contract"] }),
        dataSourcesJson: asInputJson([])
      }
    });
  }

  saveConfig(input: CreatorAiSupportConfigInput): Promise<CreatorAiConfig> {
    const { creatorId, ...data } = input;

    return prisma.creatorAiConfig.upsert({
      where: { creatorId },
      create: {
        creatorId,
        aiName: data.aiName?.trim() || "StudioOS AI",
        persona: data.persona ?? null,
        welcomeMessage: data.welcomeMessage ?? null,
        serviceIntro: data.serviceIntro ?? null,
        faqJson: asInputJson(data.faqJson ?? []),
        pricingRulesJson: asInputJson(data.pricingRulesJson ?? {}),
        receptionScript: data.receptionScript ?? null,
        multilingualJson: asInputJson(data.multilingualJson ?? {}),
        defaultReply: data.defaultReply ?? null,
        blockedContentJson: asInputJson(data.blockedContentJson ?? []),
        handoffRulesJson: asInputJson(data.handoffRulesJson ?? {}),
        dataSourcesJson: asInputJson(data.dataSourcesJson ?? []),
        isEnabled: data.isEnabled ?? true
      },
      update: {
        ...(data.aiName !== undefined ? { aiName: data.aiName.trim() || "StudioOS AI" } : {}),
        ...(data.persona !== undefined ? { persona: data.persona } : {}),
        ...(data.welcomeMessage !== undefined ? { welcomeMessage: data.welcomeMessage } : {}),
        ...(data.serviceIntro !== undefined ? { serviceIntro: data.serviceIntro } : {}),
        ...(data.faqJson !== undefined ? { faqJson: asInputJson(data.faqJson) } : {}),
        ...(data.pricingRulesJson !== undefined ? { pricingRulesJson: asInputJson(data.pricingRulesJson) } : {}),
        ...(data.receptionScript !== undefined ? { receptionScript: data.receptionScript } : {}),
        ...(data.multilingualJson !== undefined ? { multilingualJson: asInputJson(data.multilingualJson) } : {}),
        ...(data.defaultReply !== undefined ? { defaultReply: data.defaultReply } : {}),
        ...(data.blockedContentJson !== undefined ? { blockedContentJson: asInputJson(data.blockedContentJson) } : {}),
        ...(data.handoffRulesJson !== undefined ? { handoffRulesJson: asInputJson(data.handoffRulesJson) } : {}),
        ...(data.dataSourcesJson !== undefined ? { dataSourcesJson: asInputJson(data.dataSourcesJson) } : {}),
        ...(data.isEnabled !== undefined ? { isEnabled: data.isEnabled } : {})
      }
    });
  }
}

export const creatorAiSupportConfigService = new CreatorAiSupportConfigService();
