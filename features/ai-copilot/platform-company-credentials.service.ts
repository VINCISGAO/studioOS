import {
  buildPlatformCompanyCredentialsKnowledgeRows,
  PLATFORM_COMPANY_CREDENTIALS_KNOWLEDGE_ROW_COUNT
} from "@/features/ai-copilot/platform-company-credentials.mapper";
import { platformCompanyCredentialsRepository } from "@/features/ai-copilot/platform-company-credentials.repository";

export class PlatformCompanyCredentialsService {
  buildRows() {
    return buildPlatformCompanyCredentialsKnowledgeRows();
  }

  async syncToLucienKnowledgeBase() {
    const rows = buildPlatformCompanyCredentialsKnowledgeRows();
    const zhCount = rows.filter((row) => row.languageCode === "zh-CN").length;
    const enCount = rows.filter((row) => row.languageCode === "en").length;

    if (rows.length !== PLATFORM_COMPANY_CREDENTIALS_KNOWLEDGE_ROW_COUNT) {
      throw new Error(
        `Platform company credentials expected ${PLATFORM_COMPANY_CREDENTIALS_KNOWLEDGE_ROW_COUNT} rows, got ${rows.length}`
      );
    }

    const count = await platformCompanyCredentialsRepository.upsertMany(rows);

    return {
      count,
      zhCount,
      enCount,
      sourceKeys: rows.map((row) => row.sourceKey)
    };
  }
}

export const platformCompanyCredentialsService = new PlatformCompanyCredentialsService();
