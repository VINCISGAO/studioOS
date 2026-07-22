import {
  PLATFORM_COMPANY_CREDENTIALS,
  PLATFORM_COMPANY_CREDENTIALS_SOURCE_VERSION
} from "@/features/ai-copilot/platform-company-credentials.constants";

export type PlatformCompanyCredentialsKnowledgeRow = {
  sourceKey: string;
  languageCode: string;
  module: string;
  question: string;
  answer: string;
  searchText: string;
  knowledgeType: "BUSINESS_POLICY";
  visibility: "public";
  sourceType: "business_policy";
  version: string;
  verifiedAt: Date;
  metadataJson: {
    source: string;
    sourceVersion: string;
    documentType: "certificate_of_incorporation" | "business_registration" | "company_profile";
    tone: "official_company_credentials";
  };
};

type CredentialTopic = PlatformCompanyCredentialsKnowledgeRow["metadataJson"]["documentType"];

function formatDateEn(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
}

function formatDateZh(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function buildRow(input: {
  topic: CredentialTopic;
  languageCode: "zh-CN" | "en";
  module: string;
  question: string;
  answer: string;
  searchTerms: string[];
}): PlatformCompanyCredentialsKnowledgeRow {
  const sourceKey = `platform_company_credentials_${input.topic}_${input.languageCode}`;
  const searchText = [input.question, input.module, input.answer, ...input.searchTerms].join("\n");

  return {
    sourceKey,
    languageCode: input.languageCode,
    module: input.module,
    question: input.question,
    answer: input.answer,
    searchText,
    knowledgeType: "BUSINESS_POLICY",
    visibility: "public",
    sourceType: "business_policy",
    version: PLATFORM_COMPANY_CREDENTIALS_SOURCE_VERSION,
    verifiedAt: new Date(PLATFORM_COMPANY_CREDENTIALS.verifiedAt),
    metadataJson: {
      source: "features/ai-copilot/platform-company-credentials.constants.ts",
      sourceVersion: PLATFORM_COMPANY_CREDENTIALS_SOURCE_VERSION,
      documentType: input.topic,
      tone: "official_company_credentials"
    }
  };
}

export function buildPlatformCompanyCredentialsKnowledgeRows(): PlatformCompanyCredentialsKnowledgeRow[] {
  const facts = PLATFORM_COMPANY_CREDENTIALS;

  return [
    buildRow({
      topic: "company_profile",
      languageCode: "zh-CN",
      module: "公司资质",
      question: "VINCIS 平台的运营公司是哪家？",
      answer: [
        "VINCIS 平台由 VINCIS Limited 运营。",
        "该公司在香港特别行政区注册成立，持有公司注册处签发的公司注册证明（Certificate of Incorporation），以及税务局签发的有效商业登记证（Business Registration Certificate）。",
        `公司注册编号：${facts.companyRegistrationNumber}。`,
        `注册地址：${facts.registeredAddressZh}。`
      ].join("\n"),
      searchTerms: [
        "VINCIS Limited",
        "运营主体",
        "平台公司",
        "香港公司",
        facts.companyRegistrationNumber,
        facts.registeredAddressZh
      ]
    }),
    buildRow({
      topic: "company_profile",
      languageCode: "en",
      module: "Company Credentials",
      question: "Which company operates the VINCIS platform?",
      answer: [
        "The VINCIS platform is operated by VINCIS Limited.",
        "The company is incorporated in the Hong Kong SAR and holds a valid Certificate of Incorporation from the Companies Registry plus a valid Business Registration Certificate.",
        `Company registration number: ${facts.companyRegistrationNumber}.`,
        `Registered address: ${facts.registeredAddressEn}.`
      ].join("\n"),
      searchTerms: [
        "VINCIS Limited",
        "operating company",
        "legal entity",
        "Hong Kong company",
        facts.companyRegistrationNumber,
        facts.registeredAddressEn
      ]
    }),
    buildRow({
      topic: "certificate_of_incorporation",
      languageCode: "zh-CN",
      module: "公司资质",
      question: "VINCIS 的公司注册证明（CI）信息是什么？",
      answer: [
        `公司名称：${facts.legalNameEn}`,
        `注册编号：${facts.companyRegistrationNumber}`,
        `法律依据：${facts.companiesOrdinance}`,
        `公司类型：有限公司（Limited company）`,
        `签发日期：${formatDateZh(facts.certificateOfIncorporationIssuedOn)}`,
        `签发人：${facts.certificateOfIncorporationRegistrar}`,
        "说明：公司注册处登记公司名称，并不表示获授予该公司名称或任何部分的商标权或任何其他知识产权。"
      ].join("\n"),
      searchTerms: [
        "CI",
        "Certificate of Incorporation",
        "公司注册证明",
        "注册编号",
        facts.companyRegistrationNumber,
        facts.certificateOfIncorporationIssuedOn
      ]
    }),
    buildRow({
      topic: "certificate_of_incorporation",
      languageCode: "en",
      module: "Company Credentials",
      question: "What are VINCIS Limited's Certificate of Incorporation details?",
      answer: [
        `Company name: ${facts.legalNameEn}`,
        `Registration number: ${facts.companyRegistrationNumber}`,
        `Legal basis: ${facts.companiesOrdinance}`,
        "Company type: Limited company",
        `Issue date: ${formatDateEn(facts.certificateOfIncorporationIssuedOn)}`,
        `Issued by: ${facts.certificateOfIncorporationRegistrar}`,
        "Note: Registration of a company name with the Companies Registry does not confer any trade mark rights or other intellectual property rights in respect of the company name or any part thereof."
      ].join("\n"),
      searchTerms: [
        "CI",
        "Certificate of Incorporation",
        "company registration",
        facts.companyRegistrationNumber,
        facts.certificateOfIncorporationIssuedOn
      ]
    }),
    buildRow({
      topic: "business_registration",
      languageCode: "zh-CN",
      module: "公司资质",
      question: "VINCIS 的商业登记（BR）信息是什么？",
      answer: [
        `商业名称：${facts.legalNameBr}`,
        `注册地址：${facts.registeredAddressZh}`,
        `主体类别：${facts.businessRegistrationStatus}`,
        `开业日期：${formatDateZh(facts.businessRegistrationCommencementDate)}`,
        `届满日期：${formatDateZh(facts.businessRegistrationExpiryDate)}`,
        `法律依据：${facts.businessRegistrationOrdinance}`,
        "说明：有效商业登记证须于经营业务地址展示。"
      ].join("\n"),
      searchTerms: [
        "BR",
        "Business Registration",
        "商业登记证",
        facts.legalNameBr,
        facts.businessRegistrationCommencementDate,
        facts.businessRegistrationExpiryDate,
        facts.registeredAddressZh
      ]
    }),
    buildRow({
      topic: "business_registration",
      languageCode: "en",
      module: "Company Credentials",
      question: "What are VINCIS Limited's Business Registration details?",
      answer: [
        `Business name: ${facts.legalNameBr}`,
        `Business address: ${facts.registeredAddressEn}`,
        `Status: ${facts.businessRegistrationStatus}`,
        `Date of commencement: ${formatDateEn(facts.businessRegistrationCommencementDate)}`,
        `Date of expiry: ${formatDateEn(facts.businessRegistrationExpiryDate)}`,
        `Legal basis: ${facts.businessRegistrationOrdinance}`,
        "Note: A valid business registration certificate must be displayed at the business address."
      ].join("\n"),
      searchTerms: [
        "BR",
        "Business Registration Certificate",
        facts.legalNameBr,
        facts.businessRegistrationCommencementDate,
        facts.businessRegistrationExpiryDate,
        facts.registeredAddressEn
      ]
    }),
    buildRow({
      topic: "company_profile",
      languageCode: "zh-CN",
      module: "公司资质",
      question: "VINCIS 的注册地址在哪里？",
      answer: [
        `VINCIS Limited 的注册/经营地址为：${facts.registeredAddressZh}。`,
        "该地址与香港商业登记证上所示地址一致。"
      ].join("\n"),
      searchTerms: ["注册地址", "经营地址", "新蒲岗", "银河工厂大厦", facts.registeredAddressZh]
    }),
    buildRow({
      topic: "company_profile",
      languageCode: "en",
      module: "Company Credentials",
      question: "What is VINCIS Limited's registered address?",
      answer: [
        `VINCIS Limited's registered/business address is ${facts.registeredAddressEn}.`,
        "This matches the address shown on the Hong Kong Business Registration Certificate."
      ].join("\n"),
      searchTerms: ["registered address", "business address", "San Po Kong", facts.registeredAddressEn]
    })
  ];
}

export const PLATFORM_COMPANY_CREDENTIALS_KNOWLEDGE_ROW_COUNT =
  buildPlatformCompanyCredentialsKnowledgeRows().length;
