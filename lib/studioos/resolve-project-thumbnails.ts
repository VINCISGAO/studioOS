import { listAssetsForProject } from "@/lib/campaign-store";
import { pickProjectThumbnailUrl } from "@/lib/studioos/project-thumbnail";

export async function resolveThumbnailsByProjectId(
  projectIds: string[]
): Promise<Record<string, string | null>> {
  const unique = [...new Set(projectIds.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (projectId) => {
      const assets = await listAssetsForProject(projectId).catch(() => []);
      return [projectId, pickProjectThumbnailUrl(assets)] as const;
    })
  );
  return Object.fromEntries(entries);
}
