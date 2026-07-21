CREATE TYPE "CreativeProjectMode" AS ENUM ('STANDALONE', 'ORDER');

CREATE TABLE "creative_projects" (
  "id" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "mode" "CreativeProjectMode" NOT NULL DEFAULT 'STANDALONE',
  "campaign_id" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "creative_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "creative_project_assets" (
  "id" TEXT NOT NULL,
  "creative_project_id" TEXT NOT NULL,
  "uploaded_by" TEXT NOT NULL,
  "asset_type" "AssetType" NOT NULL,
  "file_name" TEXT NOT NULL,
  "file_key" TEXT NOT NULL,
  "storage_provider" TEXT NOT NULL DEFAULT 'r2',
  "mime_type" TEXT NOT NULL,
  "file_size" BIGINT NOT NULL,
  "preview_url" TEXT,
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "creative_project_assets_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "creative_canvases" ADD COLUMN "creative_project_id" TEXT;

INSERT INTO "creative_projects" (
  "id",
  "owner_id",
  "title",
  "mode",
  "campaign_id",
  "created_by",
  "created_at",
  "updated_at"
)
SELECT
  cc."id",
  cc."created_by",
  COALESCE(c."title", 'Order canvas'),
  'ORDER'::"CreativeProjectMode",
  cc."campaign_id",
  cc."created_by",
  cc."created_at",
  cc."updated_at"
FROM "creative_canvases" cc
LEFT JOIN "campaigns" c ON c."id" = cc."campaign_id";

UPDATE "creative_canvases" cc
SET "creative_project_id" = cp."id"
FROM "creative_projects" cp
WHERE cp."campaign_id" = cc."campaign_id";

ALTER TABLE "creative_canvases" ALTER COLUMN "creative_project_id" SET NOT NULL;
DROP INDEX IF EXISTS "creative_canvases_campaign_id_key";
CREATE UNIQUE INDEX "creative_canvases_creative_project_id_key"
  ON "creative_canvases"("creative_project_id");
CREATE INDEX "creative_canvases_campaign_id_idx" ON "creative_canvases"("campaign_id");

ALTER TABLE "canvas_nodes" ADD COLUMN "creative_project_id" TEXT;
UPDATE "canvas_nodes" cn
SET "creative_project_id" = cc."creative_project_id"
FROM "creative_canvases" cc
WHERE cc."id" = cn."canvas_id";
ALTER TABLE "canvas_nodes" ALTER COLUMN "creative_project_id" SET NOT NULL;
ALTER TABLE "canvas_nodes" ALTER COLUMN "campaign_id" DROP NOT NULL;
CREATE INDEX "canvas_nodes_creative_project_id_idx" ON "canvas_nodes"("creative_project_id");

ALTER TABLE "canvas_edges" ADD COLUMN "creative_project_id" TEXT;
UPDATE "canvas_edges" ce
SET "creative_project_id" = cc."creative_project_id"
FROM "creative_canvases" cc
WHERE cc."id" = ce."canvas_id";
ALTER TABLE "canvas_edges" ALTER COLUMN "creative_project_id" SET NOT NULL;
ALTER TABLE "canvas_edges" ALTER COLUMN "campaign_id" DROP NOT NULL;
CREATE INDEX "canvas_edges_creative_project_id_idx" ON "canvas_edges"("creative_project_id");

ALTER TABLE "generation_jobs" ADD COLUMN "creative_project_id" TEXT;
UPDATE "generation_jobs" gj
SET "creative_project_id" = cc."creative_project_id"
FROM "creative_canvases" cc
WHERE cc."id" = gj."canvas_id";
ALTER TABLE "generation_jobs" ALTER COLUMN "creative_project_id" SET NOT NULL;
ALTER TABLE "generation_jobs" ALTER COLUMN "campaign_id" DROP NOT NULL;
CREATE INDEX "generation_jobs_creative_project_id_idx" ON "generation_jobs"("creative_project_id");

CREATE UNIQUE INDEX "creative_projects_campaign_id_key" ON "creative_projects"("campaign_id");
CREATE INDEX "creative_projects_owner_id_deleted_at_idx" ON "creative_projects"("owner_id", "deleted_at");
CREATE INDEX "creative_projects_owner_id_updated_at_idx" ON "creative_projects"("owner_id", "updated_at");
CREATE INDEX "creative_project_assets_creative_project_id_idx"
  ON "creative_project_assets"("creative_project_id");

ALTER TABLE "creative_projects"
  ADD CONSTRAINT "creative_projects_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "creative_projects"
  ADD CONSTRAINT "creative_projects_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "creative_project_assets"
  ADD CONSTRAINT "creative_project_assets_creative_project_id_fkey"
  FOREIGN KEY ("creative_project_id") REFERENCES "creative_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "creative_canvases"
  ADD CONSTRAINT "creative_canvases_creative_project_id_fkey"
  FOREIGN KEY ("creative_project_id") REFERENCES "creative_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canvas_nodes"
  ADD CONSTRAINT "canvas_nodes_creative_project_id_fkey"
  FOREIGN KEY ("creative_project_id") REFERENCES "creative_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canvas_edges"
  ADD CONSTRAINT "canvas_edges_creative_project_id_fkey"
  FOREIGN KEY ("creative_project_id") REFERENCES "creative_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "generation_jobs"
  ADD CONSTRAINT "generation_jobs_creative_project_id_fkey"
  FOREIGN KEY ("creative_project_id") REFERENCES "creative_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
