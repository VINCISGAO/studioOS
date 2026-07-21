ALTER TABLE "canvas_nodes" ADD COLUMN "parent_id" TEXT;
CREATE INDEX "canvas_nodes_parent_id_idx" ON "canvas_nodes"("parent_id");
