import { getHTMLFromFragment, getSchema } from "@tiptap/core";
import { createKnowledgeEditorExtensions } from "../../lib/knowledge/tiptap/knowledge-editor-extensions";

const REQUIRED_NODES = [
  "doc",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "table",
  "tableRow",
  "tableHeader",
  "tableCell",
  "taskList",
  "taskItem",
  "horizontalRule",
  "image",
  "knowledgeCallout",
  "knowledgeVideo",
  "youtube"
] as const;

const REQUIRED_MARKS = [
  "link",
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "highlight",
  "textStyle"
] as const;

export function verifyKnowledgeEditorSchema(locale: "zh" | "en") {
  const extensions = createKnowledgeEditorExtensions(locale);
  const schema = getSchema(extensions);

  for (const name of REQUIRED_NODES) {
    if (!schema.nodes[name]) {
      throw new Error(`[${locale}] missing node: ${name}`);
    }
  }
  for (const name of REQUIRED_MARKS) {
    if (!schema.marks[name]) {
      throw new Error(`[${locale}] missing mark: ${name}`);
    }
  }

  const doc = schema.node("doc", null, [schema.node("paragraph", null, [schema.text("hello")])]);
  if (doc.textContent !== "hello") {
    throw new Error(`[${locale}] unexpected doc text: ${doc.textContent}`);
  }

  const richDoc = schema.node("doc", null, [
    schema.node("heading", { level: 2 }, [schema.text("Section title")]),
    schema.node("paragraph", null, [
      schema.text("Paragraph with "),
      schema.text("bold", [schema.marks.bold.create()]),
      schema.text(" and "),
      schema.text("italic", [schema.marks.italic.create()]),
      schema.text(".")
    ])
  ]);
  const html = getHTMLFromFragment(richDoc.content, schema);
  if (!html.includes("<h2") || !html.includes("<strong>")) {
    throw new Error(`[${locale}] html export failed: ${html}`);
  }

  return {
    locale,
    extensionCount: extensions.length,
    nodeCount: Object.keys(schema.nodes).length,
    markCount: Object.keys(schema.marks).length
  };
}
