/**
 * Knowledge body HTML ↔ Markdown round-trip checks (Node).
 * Run: npm run knowledge:body:verify
 */
import {
  knowledgeHtmlToMarkdownServer,
  knowledgeMarkdownToHtmlServer
} from "../lib/knowledge/knowledge-body-convert";

type Step = { name: string; ok: boolean; detail?: string };

function checkOrderedList(): Step {
  const html = "<h2>Title</h2><ol><li><p>One</p></li><li><p>Two</p></li></ol>";
  const md = knowledgeHtmlToMarkdownServer(html);
  const ok = md.includes("## Title") && /1\.\s+One/.test(md) && /2\.\s+Two/.test(md);
  return { name: "ordered list markdown", ok, detail: ok ? undefined : md };
}

function checkRoundTrip(): Step {
  const html = "<h2>Section</h2><p>Hello <strong>world</strong></p><ul><li><p>A</p></li></ul>";
  const md = knowledgeHtmlToMarkdownServer(html);
  const back = knowledgeMarkdownToHtmlServer(md);
  const ok = back.includes("<h2>") && back.includes("<strong>") && back.includes("<ul>");
  return { name: "html markdown round trip", ok, detail: ok ? undefined : back };
}

function checkYoutubeBlock(): Step {
  const html =
    '<iframe src="https://www.youtube.com/embed/abc123" class="knowledge-youtube"></iframe>';
  const md = knowledgeHtmlToMarkdownServer(html);
  const ok = md.includes("<iframe") && md.includes("abc123");
  return { name: "youtube iframe preserved", ok, detail: ok ? undefined : md };
}

const steps = [checkOrderedList(), checkRoundTrip(), checkYoutubeBlock()];
const failed = steps.filter((step) => !step.ok);

for (const step of steps) {
  console.log(step.ok ? `✅ ${step.name}` : `❌ ${step.name}${step.detail ? `: ${step.detail}` : ""}`);
}

if (failed.length > 0) {
  process.exit(1);
}

console.log("knowledge body convert verify passed");
