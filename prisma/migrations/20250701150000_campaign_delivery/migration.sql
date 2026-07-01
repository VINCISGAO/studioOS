-- CampaignDelivery — Studio mark-as-final → Brand download
CREATE TYPE "DeliveryStatus" AS ENUM ('READY', 'LOCKED');

CREATE TABLE "campaign_deliveries" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "version_id" TEXT NOT NULL,
  "download_url" TEXT NOT NULL,
  "delivered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accepted_at" TIMESTAMP(3),
  "status" "DeliveryStatus" NOT NULL DEFAULT 'READY',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "campaign_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "campaign_deliveries_campaign_id_key" ON "campaign_deliveries"("campaign_id");
CREATE INDEX "campaign_deliveries_version_id_idx" ON "campaign_deliveries"("version_id");
CREATE INDEX "campaign_deliveries_status_idx" ON "campaign_deliveries"("status");

ALTER TABLE "campaign_deliveries"
  ADD CONSTRAINT "campaign_deliveries_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "campaign_deliveries"
  ADD CONSTRAINT "campaign_deliveries_version_id_fkey"
  FOREIGN KEY ("version_id") REFERENCES "campaign_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
