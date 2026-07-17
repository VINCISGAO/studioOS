import {
  KNOWLEDGE_CENTER_PATH_SEGMENT,
  isKnowledgePathPrefix,
  knowledgePathPrefixForCode,
  type KnowledgePathPrefix
} from "@/features/knowledge-center/knowledge-center.constants";
import type { SupportedLanguageCode } from "@/features/i18n/language.constants";

export function isKnowledgeCenterPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length >= 2 && segments[1] === KNOWLEDGE_CENTER_PATH_SEGMENT && isKnowledgePathPrefix(segments[0] as KnowledgePathPrefix);
}

export function buildKnowledgeCenterLocaleHref(pathname: string, next: SupportedLanguageCode): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2 || segments[1] !== KNOWLEDGE_CENTER_PATH_SEGMENT) return null;

  const currentPrefix = segments[0] as string;
  if (!isKnowledgePathPrefix(currentPrefix as KnowledgePathPrefix)) return null;

  const newPrefix = knowledgePathPrefixForCode(next);
  const rest = segments.slice(2).join("/");
  return `/${newPrefix}/${KNOWLEDGE_CENTER_PATH_SEGMENT}${rest ? `/${rest}` : ""}`;
}
