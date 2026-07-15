import { KNOWLEDGE_CENTER_PATH_SEGMENT } from "@/features/knowledge-center/knowledge-center.constants";
import { computeKnowledgeSeoScores } from "@/features/knowledge-center/knowledge-seo.heuristics";
import {
  effectiveKnowledgeMetaDescription,
  effectiveKnowledgeSeoTitle,
  effectiveKnowledgeTags,
  type KnowledgeEditorFormState
} from "@/lib/knowledge/knowledge-editor-validation";
import { knowledgeHtmlToPlainText } from "@/lib/knowledge/knowledge-html-plain";

export type KnowledgeEditorSeoCheckStatus = "ok" | "warn";

export type KnowledgeEditorSeoCheckItem = {
  id: string;
  label: string;
  status: KnowledgeEditorSeoCheckStatus;
  hint: string;
};

export type KnowledgeEditorSeoSnapshot = {
  score: number;
  items: KnowledgeEditorSeoCheckItem[];
  metrics: {
    titleLength: number;
    metaLength: number;
    headingCount: number;
    keywordCount: number;
    internalLinks: number;
    imageCount: number;
    bodyLength: number;
    googleScore: number;
    baiduScore: number;
  };
};

function countHeadings(html: string) {
  return (html.match(/<h[1-3]\b/gi) ?? []).length;
}

function countInternalLinks(html: string) {
  return (
    html.match(
      new RegExp(
        `href=["']\\/(?:en|zh(?:-tw)?|ja|ko|ms|km|th|vi|fr|es)\\/(?:resources|${KNOWLEDGE_CENTER_PATH_SEGMENT})\\/`,
        "gi"
      )
    ) ?? []
  ).length;
}

function countBodyImages(html: string) {
  return (html.match(/<img\b/gi) ?? []).length;
}

export function knowledgeEditorSeoChecklist(form: KnowledgeEditorFormState, zh = false): KnowledgeEditorSeoSnapshot {
  const title = effectiveKnowledgeSeoTitle(form);
  const meta = effectiveKnowledgeMetaDescription(form);
  const body = form.body_html;
  const plain = knowledgeHtmlToPlainText(body);
  const headingCount = countHeadings(body);
  const tags = effectiveKnowledgeTags(form);
  const manualKeywords = form.focus_keywords.split(",").map((item) => item.trim()).filter(Boolean);
  const keywordCount = new Set([...tags, ...manualKeywords]).size;
  const internalLinks = countInternalLinks(body);
  const bodyImages = countBodyImages(body);
  const hasCover = Boolean(form.cover_image_url.trim());
  const imageCount = bodyImages + (hasCover ? 1 : 0);
  const bodyLength = plain.length;

  const scores = computeKnowledgeSeoScores({
    translation: {
      title,
      subtitle: form.subtitle,
      body_markdown: plain,
      excerpt: meta
    },
    seo: {
      meta_description: meta
    }
  });

  const titleOk = title.length >= 12 && title.length <= 70;
  const metaOk = meta.length >= 80 && meta.length <= 160;
  const headingOk = headingCount >= 2;
  const keywordOk = keywordCount >= 2;
  const schemaOk = Boolean(title && meta && headingCount >= 1);
  const linkOk = internalLinks >= 1;
  const imageOk = imageCount >= 1;

  const items: KnowledgeEditorSeoCheckItem[] = [
    {
      id: "title",
      label: zh ? "标题长度" : "Title length",
      status: titleOk ? "ok" : "warn",
      hint: titleOk
        ? zh
          ? `${title.length} 字，达标`
          : `${title.length} chars, OK`
        : title.length < 12
          ? zh
            ? `当前 ${title.length} 字，建议 12–70`
            : `${title.length} chars, need 12–70`
          : zh
            ? `当前 ${title.length} 字，建议 ≤70`
            : `${title.length} chars, max 70`
    },
    {
      id: "meta",
      label: zh ? "Meta 描述" : "Meta description",
      status: metaOk ? "ok" : "warn",
      hint: metaOk
        ? zh
          ? `${meta.length} 字，达标`
          : `${meta.length} chars, OK`
        : !meta.length
          ? zh
            ? "填写副标题或摘要"
            : "Add subtitle or excerpt"
          : meta.length < 80
            ? zh
              ? `当前 ${meta.length} 字，建议 80–160`
              : `${meta.length} chars, need 80–160`
            : zh
              ? `当前 ${meta.length} 字，建议 ≤160`
              : `${meta.length} chars, max 160`
    },
    {
      id: "headings",
      label: zh ? "标题结构" : "Heading structure",
      status: headingOk ? "ok" : "warn",
      hint: headingOk
        ? zh
          ? `${headingCount} 个标题`
          : `${headingCount} headings`
        : zh
          ? `当前 ${headingCount} 个，建议 ≥2`
          : `${headingCount} headings, need ≥2`
    },
    {
      id: "keywords",
      label: zh ? "关键词使用" : "Keyword usage",
      status: keywordOk ? "ok" : "warn",
      hint: keywordOk
        ? zh
          ? `${keywordCount} 个标签/关键词`
          : `${keywordCount} tags/keywords`
        : zh
          ? `当前 ${keywordCount} 个，建议 ≥2`
          : `${keywordCount} keywords, need ≥2`
    },
    {
      id: "schema",
      label: zh ? "结构化数据" : "Structured data",
      status: schemaOk ? "ok" : "warn",
      hint: schemaOk
        ? zh
          ? "标题/摘要已就绪"
          : "Title and excerpt ready"
        : zh
          ? "需标题、摘要、正文标题"
          : "Needs title, excerpt, headings"
    },
    {
      id: "links",
      label: zh ? "内链数量" : "Internal links",
      status: linkOk ? "ok" : "warn",
      hint: linkOk
        ? zh
          ? `${internalLinks} 条内链`
          : `${internalLinks} internal links`
        : zh
          ? `正文中添加 /${KNOWLEDGE_CENTER_PATH_SEGMENT}/ 链接`
          : `Add /${KNOWLEDGE_CENTER_PATH_SEGMENT}/ links in body`
    },
    {
      id: "images",
      label: zh ? "图片优化" : "Image optimization",
      status: imageOk ? "ok" : "warn",
      hint: imageOk
        ? zh
          ? hasCover
            ? `封面 + ${bodyImages} 张正文图`
            : `${bodyImages} 张正文图`
          : hasCover
            ? `Cover + ${bodyImages} inline`
            : `${bodyImages} inline images`
        : zh
          ? "上传封面或在正文插图"
          : "Add cover or inline images"
    }
  ];

  return {
    score: scores.seo_score,
    items,
    metrics: {
      titleLength: title.length,
      metaLength: meta.length,
      headingCount,
      keywordCount,
      internalLinks,
      imageCount,
      bodyLength,
      googleScore: scores.google_score,
      baiduScore: scores.baidu_score
    }
  };
}
