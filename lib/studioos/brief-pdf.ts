import type { ConfirmedBriefField } from "@/lib/studioos/confirmed-brief";

function escapePdfText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLine(text: string, max = 92): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export function generateBriefPdfBuffer(input: {
  title: string;
  formId: string;
  locale: "en" | "zh";
  fields: ConfirmedBriefField[];
}): Buffer {
  const zh = input.locale === "zh";
  const header = zh ? "广告需求确认表" : "Campaign requirement form";
  const docTitle = input.title;
  const formLabel = zh ? "表单编号" : "Form ID";

  const contentLines: string[] = [
    header,
    docTitle,
    `${formLabel}: ${input.formId}`,
    "",
    "—".repeat(48)
  ];

  let lastSection = "";
  for (const field of input.fields) {
    if (field.section !== lastSection) {
      if (lastSection) contentLines.push("");
      contentLines.push(field.section.toUpperCase());
      lastSection = field.section;
    }
    contentLines.push(`${field.label}: ${field.value}`);
  }

  const streamLines: string[] = ["BT", "/F1 11 Tf", "50 760 Td", "14 TL"];
  let first = true;
  for (const raw of contentLines) {
    for (const line of wrapLine(raw)) {
      const cmd = first ? `(${escapePdfText(line)}) Tj` : `T* (${escapePdfText(line)}) Tj`;
      streamLines.push(cmd);
      first = false;
    }
  }
  streamLines.push("ET");
  const stream = streamLines.join("\n");

  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj",
    `4 0 obj<< /Length ${Buffer.byteLength(stream, "utf8")} >>stream\n${stream}\nendstream endobj`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj"
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${obj}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}
