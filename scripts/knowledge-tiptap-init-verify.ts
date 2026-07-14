/**
 * TipTap editor extensions smoke test (Node — no DOM).
 * Run: npm run knowledge:tiptap-init
 */
import { verifyKnowledgeEditorSchema } from "./helpers/knowledge-tiptap-schema-verify";

function main() {
  const results = (["zh", "en"] as const).map(verifyKnowledgeEditorSchema);
  for (const result of results) {
    console.log(
      `OK knowledge.tiptap_init [${result.locale}] — extensions: ${result.extensionCount}, nodes: ${result.nodeCount}, marks: ${result.markCount}`
    );
  }
}

try {
  main();
} catch (error) {
  console.error("FAIL knowledge.tiptap_init:", error instanceof Error ? error.message : error);
  process.exit(1);
}
