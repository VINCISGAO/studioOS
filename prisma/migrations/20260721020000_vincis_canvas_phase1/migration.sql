CREATE TYPE "GenerationType" AS ENUM ('IMAGE', 'VIDEO', 'MUSIC');
CREATE TYPE "GenerationStatus" AS ENUM (
  'QUEUED',
  'SUBMITTING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED'
);

CREATE TABLE "creative_canvases" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "created_by" TEXT NOT NULL,
  "viewport" JSONB,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "creative_canvases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "canvas_nodes" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "canvas_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "position_x" DOUBLE PRECISION NOT NULL,
  "position_y" DOUBLE PRECISION NOT NULL,
  "width" DOUBLE PRECISION,
  "height" DOUBLE PRECISION,
  "data" JSONB NOT NULL,
  "z_index" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "canvas_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "canvas_edges" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "canvas_id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "source_handle" TEXT,
  "target_handle" TEXT,
  "data" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "canvas_edges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "generation_jobs" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "canvas_id" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "node_id" TEXT,
  "type" "GenerationType" NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "input" JSONB NOT NULL,
  "status" "GenerationStatus" NOT NULL DEFAULT 'QUEUED',
  "idempotency_key" TEXT NOT NULL,
  "provider_task_id" TEXT,
  "output_asset_id" TEXT,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "error_code" TEXT,
  "error_message" TEXT,
  "estimated_credits" INTEGER NOT NULL,
  "actual_credits" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "creative_canvases_campaign_id_key" ON "creative_canvases"("campaign_id");
CREATE INDEX "creative_canvases_created_by_idx" ON "creative_canvases"("created_by");
CREATE INDEX "canvas_nodes_campaign_id_idx" ON "canvas_nodes"("campaign_id");
CREATE INDEX "canvas_nodes_canvas_id_idx" ON "canvas_nodes"("canvas_id");
CREATE INDEX "canvas_edges_campaign_id_idx" ON "canvas_edges"("campaign_id");
CREATE INDEX "canvas_edges_canvas_id_idx" ON "canvas_edges"("canvas_id");
CREATE UNIQUE INDEX "generation_jobs_owner_id_idempotency_key_key"
  ON "generation_jobs"("owner_id", "idempotency_key");
CREATE INDEX "generation_jobs_campaign_id_idx" ON "generation_jobs"("campaign_id");
CREATE INDEX "generation_jobs_canvas_id_idx" ON "generation_jobs"("canvas_id");
CREATE INDEX "generation_jobs_owner_id_status_idx" ON "generation_jobs"("owner_id", "status");
CREATE INDEX "generation_jobs_status_created_at_idx" ON "generation_jobs"("status", "created_at");

ALTER TABLE "creative_canvases"
  ADD CONSTRAINT "creative_canvases_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canvas_nodes"
  ADD CONSTRAINT "canvas_nodes_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canvas_nodes"
  ADD CONSTRAINT "canvas_nodes_canvas_id_fkey"
  FOREIGN KEY ("canvas_id") REFERENCES "creative_canvases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canvas_edges"
  ADD CONSTRAINT "canvas_edges_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canvas_edges"
  ADD CONSTRAINT "canvas_edges_canvas_id_fkey"
  FOREIGN KEY ("canvas_id") REFERENCES "creative_canvases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "generation_jobs"
  ADD CONSTRAINT "generation_jobs_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "generation_jobs"
  ADD CONSTRAINT "generation_jobs_canvas_id_fkey"
  FOREIGN KEY ("canvas_id") REFERENCES "creative_canvases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
