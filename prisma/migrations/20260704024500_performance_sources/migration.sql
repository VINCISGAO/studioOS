-- CreateEnum
CREATE TYPE "PerformanceSourceStatus" AS ENUM ('PENDING', 'IMPORTED', 'ANALYZED', 'FAILED');

-- CreateEnum
CREATE TYPE "PerformanceSourcePlatform" AS ENUM ('TIKTOK', 'YOUTUBE', 'INSTAGRAM', 'TELEGRAM', 'FACEBOOK_ADS', 'WHATSAPP', 'XIAOHONGSHU', 'DOUYIN', 'X', 'GOOGLE_DRIVE', 'REPORT', 'OTHER');

-- CreateTable
CREATE TABLE "performance_sources" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "platform" "PerformanceSourcePlatform" NOT NULL,
    "source_type" TEXT NOT NULL,
    "url" TEXT,
    "status" "PerformanceSourceStatus" NOT NULL DEFAULT 'PENDING',
    "file_key" TEXT,
    "file_name" TEXT,
    "mime_type" TEXT,
    "file_size" BIGINT,
    "metrics_json" JSONB,
    "analysis_json" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "analyzed_at" TIMESTAMP(3),

    CONSTRAINT "performance_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "performance_sources_campaign_id_idx" ON "performance_sources"("campaign_id");

-- CreateIndex
CREATE INDEX "performance_sources_uploaded_by_idx" ON "performance_sources"("uploaded_by");

-- CreateIndex
CREATE INDEX "performance_sources_platform_idx" ON "performance_sources"("platform");

-- CreateIndex
CREATE INDEX "performance_sources_status_idx" ON "performance_sources"("status");

-- CreateIndex
CREATE INDEX "performance_sources_created_at_idx" ON "performance_sources"("created_at");

-- AddForeignKey
ALTER TABLE "performance_sources" ADD CONSTRAINT "performance_sources_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_sources" ADD CONSTRAINT "performance_sources_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
