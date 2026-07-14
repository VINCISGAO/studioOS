-- Drop B-tree index on long search_text (exceeds PostgreSQL btree row size limit).
DROP INDEX IF EXISTS "knowledge_search_indexes_search_text_idx";

-- Full-text search via GIN + tsvector (supports long article bodies).
CREATE INDEX IF NOT EXISTS "knowledge_search_indexes_search_text_fts_idx"
ON "knowledge_search_indexes"
USING GIN (to_tsvector('simple', coalesce("search_text", '')));
