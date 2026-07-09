import {
  requireAdminMutationUser,
  requireAdminSession
} from "@/features/admin/auth/admin-api-guard";
import { marketingShowcaseService } from "@/features/marketing-showcase/marketing-showcase.service";
import type { UpsertMarketingShowcaseWorkInput } from "@/features/marketing-showcase/marketing-showcase.types";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

function parseBody(body: Record<string, unknown>): UpsertMarketingShowcaseWorkInput {
  const title = String(body.title ?? "").trim();
  if (!title) throw appError("VALIDATION_ERROR", "title is required");

  const tags = Array.isArray(body.tags)
    ? body.tags.map((item) => String(item).trim()).filter(Boolean)
    : typeof body.tags === "string"
      ? body.tags.split(",").map((item) => item.trim()).filter(Boolean)
      : undefined;

  return {
    title,
    description: typeof body.description === "string" ? body.description : undefined,
    category: typeof body.category === "string" ? body.category : undefined,
    platform: typeof body.platform === "string" ? body.platform : undefined,
    format: typeof body.format === "string" ? body.format : undefined,
    thumbnail_url: typeof body.thumbnail_url === "string" ? body.thumbnail_url : undefined,
    thumbnail_key: typeof body.thumbnail_key === "string" ? body.thumbnail_key : undefined,
    video_url: typeof body.video_url === "string" ? body.video_url : undefined,
    video_key: typeof body.video_key === "string" ? body.video_key : undefined,
    tags,
    featured_on_homepage: body.featured_on_homepage === true,
    homepage_sort_order:
      typeof body.homepage_sort_order === "number" ? body.homepage_sort_order : Number(body.homepage_sort_order ?? 0),
    sort_order: typeof body.sort_order === "number" ? body.sort_order : Number(body.sort_order ?? 0),
    is_published: body.is_published !== false
  };
}

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const works = await marketingShowcaseService.listAdmin();
    return apiSuccess({ works });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminMutationUser(request);
    const body = (await request.json()) as Record<string, unknown>;
    const work = await marketingShowcaseService.create(parseBody(body));
    return apiSuccess({ work });
  } catch (error) {
    return handleRouteError(error);
  }
}
