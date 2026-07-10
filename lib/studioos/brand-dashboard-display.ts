import { fallbackProjectThumbnail } from "@/lib/studioos/project-thumbnail";

/** @deprecated Use fallbackProjectThumbnail or resolveProjectThumbnailUrl instead. */
export function brandProjectThumbnail(id: string) {
  return fallbackProjectThumbnail(id);
}
