import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import type {
  MarketingShowcaseWorkDto,
  UpsertMarketingShowcaseWorkInput
} from "@/features/marketing-showcase/marketing-showcase.types";

type ShowcaseModel = (typeof prisma)["marketingShowcaseWork"];

function showcaseModel(): ShowcaseModel | null {
  if (!hasDatabaseUrl()) return null;
  const model = (prisma as { marketingShowcaseWork?: ShowcaseModel }).marketingShowcaseWork;
  if (!model || typeof model.count !== "function") return null;
  return model;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function toDto(row: {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  platform: string | null;
  format: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  tagsJson: unknown;
  featuredOnHomepage: boolean;
  homepageSortOrder: number;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
}): MarketingShowcaseWorkDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category ?? "",
    platform: row.platform ?? "",
    format: row.format ?? "",
    thumbnail_url: row.thumbnailUrl ?? "",
    video_url: row.videoUrl ?? "",
    tags: stringList(row.tagsJson),
    featured_on_homepage: row.featuredOnHomepage,
    homepage_sort_order: row.homepageSortOrder,
    sort_order: row.sortOrder,
    is_published: row.isPublished,
    created_at: row.createdAt.toISOString()
  };
}

function buildData(input: UpsertMarketingShowcaseWorkInput): Prisma.MarketingShowcaseWorkUpdateInput {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category?.trim() || null,
    platform: input.platform?.trim() || null,
    format: input.format?.trim() || null,
    thumbnailUrl: input.thumbnail_url?.trim() || null,
    thumbnailKey: input.thumbnail_key?.trim() || null,
    videoUrl: input.video_url?.trim() || null,
    videoKey: input.video_key?.trim() || null,
    tagsJson: input.tags?.length ? input.tags : undefined,
    featuredOnHomepage: input.featured_on_homepage,
    homepageSortOrder: input.homepage_sort_order,
    sortOrder: input.sort_order,
    isPublished: input.is_published
  };
}

export class MarketingShowcaseRepository {
  isAvailable() {
    return showcaseModel() !== null;
  }

  async countActive() {
    const model = showcaseModel();
    if (!model) return 0;
    return model.count({ where: { deletedAt: null } });
  }

  async listPublished(category?: string) {
    const model = showcaseModel();
    if (!model) return [];
    const rows = await model.findMany({
      where: {
        deletedAt: null,
        isPublished: true,
        ...(category ? { category } : {})
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });
    return rows.map(toDto);
  }

  async listHomepageFeatured(limit: number) {
    const model = showcaseModel();
    if (!model) return [];
    const rows = await model.findMany({
      where: {
        deletedAt: null,
        isPublished: true,
        featuredOnHomepage: true
      },
      orderBy: [{ homepageSortOrder: "asc" }, { createdAt: "desc" }],
      take: limit
    });
    return rows.map(toDto);
  }

  async listAdmin() {
    const model = showcaseModel();
    if (!model) return [];
    const rows = await model.findMany({
      where: { deletedAt: null },
      orderBy: [{ featuredOnHomepage: "desc" }, { homepageSortOrder: "asc" }, { sortOrder: "asc" }]
    });
    return rows.map(toDto);
  }

  async findById(id: string) {
    const model = showcaseModel();
    if (!model) return null;
    const row = await model.findFirst({
      where: { id, deletedAt: null }
    });
    return row ? toDto(row) : null;
  }

  async create(input: UpsertMarketingShowcaseWorkInput) {
    const model = showcaseModel();
    if (!model) throw new Error("Marketing showcase database model is unavailable");
    const row = await model.create({
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        category: input.category?.trim() || null,
        platform: input.platform?.trim() || null,
        format: input.format?.trim() || null,
        thumbnailUrl: input.thumbnail_url?.trim() || null,
        thumbnailKey: input.thumbnail_key?.trim() || null,
        videoUrl: input.video_url?.trim() || null,
        videoKey: input.video_key?.trim() || null,
        tagsJson: input.tags?.length ? input.tags : undefined,
        featuredOnHomepage: input.featured_on_homepage ?? false,
        homepageSortOrder: input.homepage_sort_order ?? 0,
        sortOrder: input.sort_order ?? 0,
        isPublished: input.is_published ?? true
      }
    });
    return toDto(row);
  }

  async update(id: string, input: UpsertMarketingShowcaseWorkInput) {
    const model = showcaseModel();
    if (!model) throw new Error("Marketing showcase database model is unavailable");
    const row = await model.update({
      where: { id },
      data: buildData(input)
    });
    return toDto(row);
  }

  async softDelete(id: string) {
    const model = showcaseModel();
    if (!model) throw new Error("Marketing showcase database model is unavailable");
    await model.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false, featuredOnHomepage: false }
    });
  }

  async seedMany(items: UpsertMarketingShowcaseWorkInput[]) {
    const model = showcaseModel();
    if (!model) return [];
    const created = [];
    for (const [index, item] of items.entries()) {
      const row = await model.create({
        data: {
          title: item.title.trim(),
          description: item.description?.trim() || null,
          category: item.category?.trim() || null,
          platform: item.platform?.trim() || null,
          format: item.format?.trim() || null,
          thumbnailUrl: item.thumbnail_url?.trim() || null,
          videoUrl: item.video_url?.trim() || null,
          tagsJson: item.tags?.length ? item.tags : undefined,
          featuredOnHomepage: item.featured_on_homepage ?? index < 5,
          homepageSortOrder: item.homepage_sort_order ?? index,
          sortOrder: item.sort_order ?? index,
          isPublished: item.is_published ?? true
        }
      });
      created.push(toDto(row));
    }
    return created;
  }
}

export const marketingShowcaseRepository = new MarketingShowcaseRepository();
