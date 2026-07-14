import type { Locale } from "@/lib/i18n";

export type KnowledgeEditorViewMode = "edit" | "preview" | "split" | "source" | "fullscreen";

export function knowledgeRichEditorCopy(locale: Locale) {
  const zh = locale === "zh";
  return {
    contentTitle: zh ? "正文内容" : "Article Body",
    edit: zh ? "编辑" : "Edit",
    preview: zh ? "预览" : "Preview",
    split: zh ? "分屏" : "Split",
    source: zh ? "Markdown 源码" : "Markdown source",
    fullscreen: zh ? "全屏编辑" : "Fullscreen",
    clearFormat: zh ? "清除格式" : "Clear format",
    more: zh ? "更多" : "More",
    words: zh ? "字数" : "Words",
    chars: zh ? "字符" : "Chars",
    reading: zh ? "阅读时间" : "Reading",
    unsaved: zh ? "未保存" : "Unsaved",
    saving: zh ? "正在保存…" : "Saving…",
    saved: zh ? "已保存" : "Saved",
    saveFailed: zh ? "保存失败" : "Save failed",
    initFailed: zh ? "编辑器初始化失败，请刷新页面。" : "Editor failed to initialize. Refresh the page.",
    parseFailed: zh ? "Markdown 解析失败，已保留原始文本。" : "Markdown parse failed — raw text preserved.",
    uploadFailed: zh ? "图片上传失败" : "Image upload failed",
    h1Disabled: zh ? "正文请使用 H2/H3，标题由上方 Title 字段承担。" : "Use H2/H3 in body — the article title is separate.",
    slashPlaceholder: zh ? "无匹配命令" : "No matching command",
    paragraph: zh ? "正文" : "Paragraph",
    heading1: zh ? "标题 1" : "Heading 1",
    heading2: zh ? "标题 2" : "Heading 2",
    heading3: zh ? "标题 3" : "Heading 3",
    callout: zh ? "提示框" : "Callout",
    emptyPreview: zh ? "暂无内容" : "No content yet."
  };
}

export type KnowledgeSlashCommandItem = {
  id: string;
  title: string;
  keywords: string[];
};

export function knowledgeSlashCommands(zh: boolean): KnowledgeSlashCommandItem[] {
  return [
    { id: "h1", title: zh ? "标题 1" : "Heading 1", keywords: ["h1", "heading", "标题"] },
    { id: "h2", title: zh ? "标题 2" : "Heading 2", keywords: ["h2", "heading", "标题"] },
    { id: "h3", title: zh ? "标题 3" : "Heading 3", keywords: ["h3", "heading", "标题"] },
    { id: "bullet", title: zh ? "项目列表" : "Bullet list", keywords: ["ul", "list", "bullet", "列表"] },
    { id: "ordered", title: zh ? "编号列表" : "Numbered list", keywords: ["ol", "ordered", "编号"] },
    { id: "task", title: zh ? "任务列表" : "Task list", keywords: ["task", "todo", "任务"] },
    { id: "quote", title: zh ? "引用" : "Quote", keywords: ["quote", "blockquote", "引用"] },
    { id: "divider", title: zh ? "分割线" : "Divider", keywords: ["hr", "divider", "分割"] },
    { id: "code", title: zh ? "代码块" : "Code block", keywords: ["code", "代码"] },
    { id: "table", title: zh ? "表格" : "Table", keywords: ["table", "表格"] },
    { id: "callout", title: zh ? "提示框" : "Callout", keywords: ["callout", "note", "提示"] }
  ];
}
