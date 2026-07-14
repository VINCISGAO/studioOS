/**
 * Knowledge TipTap HTML smoke checks (Node — no DOM).
 * Run: npm run knowledge:tiptap:verify
 */
import { generateHTML } from "@tiptap/core";
import { createKnowledgeEditorExtensions } from "../lib/knowledge/tiptap/knowledge-editor-extensions";
import { sanitizeKnowledgePastedHtml } from "../lib/knowledge/tiptap/knowledge-paste-sanitizer";
import { verifyKnowledgeEditorSchema } from "./helpers/knowledge-tiptap-schema-verify";

type Step = { name: string; ok: boolean; detail?: string };

function checkPasteSanitizer(): Step {
  const dirty = '<p onclick="alert(1)" style="color:red">Hello <script>x</script></p><h1>Title</h1>';
  const cleaned = sanitizeKnowledgePastedHtml(dirty);
  const ok =
    !cleaned.includes("<script") &&
    !cleaned.includes("onclick") &&
    !cleaned.includes("style=") &&
    cleaned.includes("<h2>");
  return { name: "paste sanitizer", ok, detail: ok ? undefined : cleaned };
}

function checkSchema(): Step {
  try {
    for (const locale of ["zh", "en"] as const) {
      verifyKnowledgeEditorSchema(locale);
    }
    return { name: "schema composition", ok: true };
  } catch (error) {
    return {
      name: "schema composition",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    };
  }
}

function checkJsonHtmlExport(): Step {
  const extensions = createKnowledgeEditorExtensions("en");
  const json = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Section title" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Paragraph with " },
          { type: "text", marks: [{ type: "bold" }], text: "bold" },
          { type: "text", text: " and " },
          { type: "text", marks: [{ type: "italic" }], text: "italic" },
          { type: "text", text: "." }
        ]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Bullet one" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Bullet two" }] }]
          }
        ]
      }
    ]
  };

  try {
    const html = generateHTML(json, extensions);
    const ok =
      html.includes("<h2") &&
      html.includes("<strong>") &&
      html.includes("<em>") &&
      html.includes("<ul") &&
      html.includes("Bullet one");
    return { name: "json html export", ok, detail: ok ? undefined : html };
  } catch (error) {
    return {
      name: "json html export",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    };
  }
}

function main() {
  const steps = [checkPasteSanitizer(), checkSchema(), checkJsonHtmlExport()];
  for (const step of steps) {
    if (!step.ok) {
      console.error(`FAIL ${step.name}${step.detail ? `: ${step.detail}` : ""}`);
      process.exit(1);
    }
    console.log(`ok ${step.name}`);
  }
  console.log("knowledge tiptap verify passed");
}

main();
