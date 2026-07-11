CREATE INDEX "campaigns_brand_id_status_deleted_at_idx"
  ON "campaigns"("brand_id", "status", "deleted_at");

CREATE UNIQUE INDEX "creator_invitations_campaign_id_creator_id_key"
  ON "creator_invitations"("campaign_id", "creator_id");
