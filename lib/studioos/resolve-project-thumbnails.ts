import { listAssetsForProjects } from "@/lib/campaign-store";
import { pickProjectThumbnailUrl } from "@/lib/studioos/project-thumbnail";

export async function resolveThumbnailsByProjectId(
  projectIds: string[]
): Promise<Record<string, string | null>> {
  const unique = [...new Set(projectIds.filter(Boolean))];
  const assetsByProjectId = await listAssetsForProjects(unique);
  return Object.fromEntries(
    unique.map((projectId) => [projectId, pickProjectThumbnailUrl(assetsByProjectId[projectId] ?? [])])
  );
}
