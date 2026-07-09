CREATE TABLE "marketing_showcase_works" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "platform" TEXT,
  "format" TEXT,
  "thumbnail_url" TEXT,
  "thumbnail_key" TEXT,
  "video_url" TEXT,
  "video_key" TEXT,
  "tags_json" JSONB,
  "is_published" BOOLEAN NOT NULL DEFAULT true,
  "featured_on_homepage" BOOLEAN NOT NULL DEFAULT false,
  "homepage_sort_order" INTEGER NOT NULL DEFAULT 0,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "marketing_showcase_works_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketing_showcase_works_is_published_featured_on_homepage_homepage_sort_order_idx"
  ON "marketing_showcase_works"("is_published", "featured_on_homepage", "homepage_sort_order");
CREATE INDEX "marketing_showcase_works_category_idx" ON "marketing_showcase_works"("category");
CREATE INDEX "marketing_showcase_works_deleted_at_idx" ON "marketing_showcase_works"("deleted_at");
