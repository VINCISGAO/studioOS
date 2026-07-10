const CANONICAL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "qq.com",
  "foxmail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "yahoo.com",
  "163.com",
  "126.com",
  "sina.com",
  "sohu.com",
  "139.com",
  "yeah.net",
  "aliyun.com",
  "protonmail.com",
  "proton.me"
] as const;

const DOMAIN_TYPOS: Record<string, (typeof CANONICAL_DOMAINS)[number]> = {
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmail.comm": "gmail.com",
  "gmaill.com": "gmail.com",
  "qq.con": "qq.com",
  "qq.co": "qq.com",
  "qq.cm": "qq.com",
  "qq.om": "qq.com",
  "qq.comm": "qq.com",
  "foxmail.con": "foxmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outlook.con": "outlook.com",
  "icloud.con": "icloud.com",
  "yahoo.con": "yahoo.com",
  "163.con": "163.com",
  "126.con": "126.com"
};

export type EmailDomainCorrection = {
  email: string;
  corrected: boolean;
  originalDomain?: string;
  correctedDomain?: string;
};

function levenshtein(left: string, right: string): number {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let col = 0; col < cols; col += 1) matrix[0][col] = col;

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function fuzzyCanonicalDomain(domain: string): (typeof CANONICAL_DOMAINS)[number] | null {
  if (CANONICAL_DOMAINS.includes(domain as (typeof CANONICAL_DOMAINS)[number])) {
    return domain as (typeof CANONICAL_DOMAINS)[number];
  }

  let best: (typeof CANONICAL_DOMAINS)[number] | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const canonical of CANONICAL_DOMAINS) {
    const distance = levenshtein(domain, canonical);
    if (distance > 2 || Math.abs(domain.length - canonical.length) > 2) {
      continue;
    }
    if (distance < bestDistance) {
      bestDistance = distance;
      best = canonical;
    }
  }

  return bestDistance <= 1 ? best : null;
}

export function correctEmailDomain(raw: string): EmailDomainCorrection {
  const trimmed = raw.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) {
    return { email: trimmed, corrected: false };
  }

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const mapped = DOMAIN_TYPOS[domain];
  if (mapped) {
    return {
      email: `${local}@${mapped}`,
      corrected: true,
      originalDomain: domain,
      correctedDomain: mapped
    };
  }

  const fuzzy = fuzzyCanonicalDomain(domain);
  if (fuzzy && fuzzy !== domain) {
    return {
      email: `${local}@${fuzzy}`,
      corrected: true,
      originalDomain: domain,
      correctedDomain: fuzzy
    };
  }

  return { email: trimmed, corrected: false };
}

export function emailDomainCorrectionHint(
  correction: EmailDomainCorrection,
  locale: "zh" | "en"
): string | null {
  if (!correction.corrected || !correction.correctedDomain) {
    return null;
  }

  if (locale === "zh") {
    return `邮箱域名已自动修正为 @${correction.correctedDomain}`;
  }

  return `Email domain auto-corrected to @${correction.correctedDomain}`;
}

export function emailDomainSuggestion(
  correction: EmailDomainCorrection,
  locale: "zh" | "en"
): string | null {
  if (!correction.corrected || !correction.correctedDomain) {
    return null;
  }

  if (locale === "zh") {
    return `你是不是想输入 ${correction.email}？`;
  }

  return `Did you mean ${correction.email}?`;
}
