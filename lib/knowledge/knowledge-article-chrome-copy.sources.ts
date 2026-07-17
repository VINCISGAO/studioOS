export type KnowledgeArticleChromeCopySource = {
  tocTitle: string;
  backToCenter: string;
  updatedLabel: string;
  relatedEyebrow: string;
  relatedTitle: string;
  faqEyebrow: string;
  faqTitle: string;
  faqSubtitle: string;
  schemaIndexName: string;
  schemaSearchNameTemplate: string;
};

export const knowledgeArticleChromeCopyEn: KnowledgeArticleChromeCopySource = {
  tocTitle: "Table of Contents",
  backToCenter: "← Back to Knowledge Center",
  updatedLabel: "Updated",
  relatedEyebrow: "Keep Reading",
  relatedTitle: "Related Articles",
  faqEyebrow: "Frequently Asked Questions",
  faqTitle: "FAQ",
  faqSubtitle:
    "Quick answers on what AI advertising is, what it costs, and how brands can start.",
  schemaIndexName: "VINCIS Knowledge Center",
  schemaSearchNameTemplate: 'Search results for "{query}"'
};

export const knowledgeArticleChromeCopyZhCN: KnowledgeArticleChromeCopySource = {
  tocTitle: "目录",
  backToCenter: "← 返回知识中心",
  updatedLabel: "更新于",
  relatedEyebrow: "延伸阅读",
  relatedTitle: "相关阅读",
  faqEyebrow: "常见问题",
  faqTitle: "FAQ",
  faqSubtitle: "这些问题帮助品牌快速理解 AI 广告的核心概念、成本与落地路径。",
  schemaIndexName: "VINCIS 知识中心",
  schemaSearchNameTemplate: "搜索「{query}」"
};
